import { NextRequest, NextResponse } from 'next/server'
import { waitUntil } from '@vercel/functions'
import { createServiceRoleClient } from '@/lib/supabase'
import { requireAdmin } from '@/lib/admin'
import { BANK_BATCH, draftSupport, draftLearnCard } from '@/lib/bankUpgrade'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

// Admin job: upgrade the K–6 lesson bank to Create's level, topic by topic,
// as DRAFTS (question_support_drafts, topic_explanations with status 'draft').
//   GET                         → progress
//   POST {action:'start', chains} → run (each chain does one topic, then calls itself for the next)
//   POST {action:'stop'}        → stop after the current topics
// The self-call carries the server's own key, so only the server can chain.
const JOB = BANK_BATCH
const CHUNK = 10
const BUDGET_MS = 230_000

function internal(req: NextRequest) {
  const k = req.headers.get('x-job-key')
  return !!k && k === process.env.SUPABASE_SERVICE_ROLE_KEY
}

export async function GET() {
  const a = await requireAdmin()
  if (!a.ok) return NextResponse.json({ error: 'Forbidden' }, { status: a.status })
  const db = createServiceRoleClient()
  const [{ data: job }, { count: drafts }, { count: flagged }, { data: claims }, { count: cards }] = await Promise.all([
    db.from('admin_jobs').select('*').eq('id', JOB).maybeSingle(),
    db.from('question_support_drafts').select('question_id', { count: 'exact', head: true }).eq('batch', JOB),
    db.from('question_support_drafts').select('question_id', { count: 'exact', head: true }).eq('batch', JOB).neq('flags', '[]'),
    db.from('bank_upgrade_claims').select('topic_id, done_at, error').eq('batch', JOB),
    db.from('topic_explanations').select('id', { count: 'exact', head: true }).eq('batch', JOB),
  ])
  return NextResponse.json({ job, drafts, flagged, cards, topicsDone: (claims || []).filter(c => c.done_at).length, topicsClaimed: (claims || []).length, errors: (claims || []).filter(c => c.error).map(c => c.error).slice(0, 5) })
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const isInternal = internal(req)
  if (!isInternal) {
    const a = await requireAdmin()
    if (!a.ok) return NextResponse.json({ error: 'Forbidden' }, { status: a.status })
  }
  const db = createServiceRoleClient()
  const origin = req.nextUrl.origin
  const kick = () => fetch(`${origin}/api/admin/bank-upgrade`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-job-key': process.env.SUPABASE_SERVICE_ROLE_KEY! }, body: JSON.stringify({ action: 'step' }) }).catch(() => {})

  if (body.action === 'stop') {
    await db.from('admin_jobs').upsert({ id: JOB, status: 'stopped', updated_at: new Date().toISOString() })
    return NextResponse.json({ ok: true })
  }
  if (body.action === 'start') {
    await db.from('admin_jobs').upsert({ id: JOB, status: 'running', updated_at: new Date().toISOString() })
    // forget unfinished claims older than 10 minutes (a chain that died)
    await db.from('bank_upgrade_claims').delete().eq('batch', JOB).is('done_at', null).lt('claimed_at', new Date(Date.now() - 600_000).toISOString())
    const n = Math.max(1, Math.min(6, Number(body.chains) || 3))
    for (let i = 0; i < n; i++) waitUntil(kick())
    return NextResponse.json({ ok: true, chains: n })
  }
  if (body.action !== 'step' || !isInternal) return NextResponse.json({ error: 'Bad action' }, { status: 400 })

  const { data: job } = await db.from('admin_jobs').select('status').eq('id', JOB).maybeSingle()
  if (job?.status !== 'running') return NextResponse.json({ ok: true, idle: true })

  // next unclaimed K–6 topic that has approved questions
  const { data: topics } = await db.from('topics').select('id, slug, grade, title_he, title_en, subject:subjects(slug)').lte('grade', 6).order('grade').order('sort_order')
  const { data: claims } = await db.from('bank_upgrade_claims').select('topic_id').eq('batch', JOB)
  const taken = new Set((claims || []).map(c => c.topic_id))
  let topic: any = null
  for (const t of topics || []) {
    if (taken.has(t.id)) continue
    const { error } = await db.from('bank_upgrade_claims').insert({ batch: JOB, topic_id: t.id })
    if (!error) { topic = t; break }
  }
  if (!topic) {
    await db.from('admin_jobs').upsert({ id: JOB, status: 'done', updated_at: new Date().toISOString() })
    return NextResponse.json({ ok: true, done: true })
  }

  const started = Date.now()
  let done = 0, finished = true, err: string | null = null
  try {
    const { data: qs } = await db.from('questions').select('id, q_type, difficulty, prompt_he, prompt_en, options, correct_answer, visual_data').eq('topic_id', topic.id).eq('approved', true).is('rejected_at', null).limit(400)
    const ids = (qs || []).map(q => q.id)
    const { data: have } = ids.length ? await db.from('question_support_drafts').select('question_id').in('question_id', ids) : { data: [] }
    const skip = new Set((have || []).map((h: any) => h.question_id))
    const todo = (qs || []).filter(q => !skip.has(q.id))

    // the learn card (only where the topic has none yet)
    const { data: card } = await db.from('topic_explanations').select('id').eq('topic_slug', topic.slug).maybeSingle()
    if (!card && (qs || []).length) {
      const r = await draftLearnCard(topic, qs || [])
      if (r.ok) {
        const c = r.data
        await db.from('topic_explanations').insert({
          topic_slug: topic.slug, subject: topic.subject?.slug, grade: topic.grade, status: 'draft', batch: JOB,
          title_he: c.title_he || topic.title_he, title_en: topic.title_en, summary_he: c.summary_he, key_points_he: c.key_points_he || [],
          main_visual: c.example?.visual || null,
          examples: c.example ? [{ problem_he: c.example.problem_he, solution_steps_he: c.example.steps_he || [], answer_he: c.example.answer_he, visual: c.example.visual || null }] : [],
        })
      }
    }

    for (let i = 0; i < todo.length; i += CHUNK) {
      if (Date.now() - started > BUDGET_MS) { finished = false; break }
      const chunk = todo.slice(i, i + CHUNK)
      const r = await draftSupport(topic, chunk)
      if (!r.ok) { err = r.error; finished = false; break }
      const byId = new Map(chunk.map(q => [q.id, q]))
      const rows = (Array.isArray(r.data) ? r.data : []).filter(d => d && byId.has(d.id)).map(d => {
        const steps = (d.steps || []).filter(s => s?.he).map(s => ({ he: s.he, en: s.en || null, visual: null }))
        const flags = [...(d.flags || []), ...(d.ok === false ? ['needs_review'] : [])]
        return {
          question_id: d.id, batch: JOB, source: 'claude', status: 'draft',
          hint_he: d.hint_he || null, hint_en: d.hint_en || null, steps,
          explanation_he: steps.map(s => s.he).join('\n') || null,
          explanation_en: steps.some(s => s.en) ? steps.map(s => s.en || '').join('\n') : null,
          parent_tip_he: d.parent_tip_he || null, flags, prompt_he_fix: d.prompt_he_fix || null, answer_check: d.answer_check || null,
        }
      })
      if (rows.length) {
        const { error } = await db.from('question_support_drafts').upsert(rows, { onConflict: 'question_id' })
        if (error) { err = error.message; finished = false; break }
        done += rows.length
      }
    }
  } catch (e: any) { err = String(e?.message || e); finished = false }

  if (finished) await db.from('bank_upgrade_claims').update({ done_at: new Date().toISOString(), questions_done: done, error: null }).eq('batch', JOB).eq('topic_id', topic.id)
  else if (err) await db.from('bank_upgrade_claims').update({ questions_done: done, error: err.slice(0, 300) }).eq('batch', JOB).eq('topic_id', topic.id)
  else await db.from('bank_upgrade_claims').delete().eq('batch', JOB).eq('topic_id', topic.id) // out of time: someone picks it up again

  waitUntil(kick())
  return NextResponse.json({ ok: true, topic: topic.slug, done, finished, err })
}
