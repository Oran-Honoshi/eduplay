import { NextRequest, NextResponse } from 'next/server'
import { waitUntil } from '@vercel/functions'
import { createServiceRoleClient } from '@/lib/supabase'
import { requireAdmin } from '@/lib/admin'
import { DESIGN_BATCH, draftDesign, checkDesign } from '@/lib/designPass'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

// Admin job: the question-screen content pass over the K–6 bank, as DRAFTS
// (question_design_drafts), topic by topic, then the reading-story questions.
//   GET                           → progress
//   POST {action:'start', chains} → run (each chain does one topic, then calls itself for the next)
//   POST {action:'stop'}          → stop after the current topics
//   POST {action:'apply', ids?, topicId?} → approve drafts (copy to questions.design)
//   POST {action:'reject', id}    → drop one draft
const JOB = DESIGN_BATCH
const CHUNK = 10
const BUDGET_MS = 230_000

function internal(req: NextRequest) {
  const k = req.headers.get('x-job-key')
  return !!k && k === process.env.SUPABASE_SERVICE_ROLE_KEY
}

export async function GET(req: NextRequest) {
  const a = await requireAdmin()
  if (!a.ok) return NextResponse.json({ error: 'Forbidden' }, { status: a.status })
  const db = createServiceRoleClient()
  const topicId = req.nextUrl.searchParams.get('topicId')
  if (topicId) {
    // one topic: its questions with their drafts (topicId=passages → the story questions)
    const isP = topicId === 'passages'
    const { data: qs } = isP
      ? await db.from('passage_questions').select('id, prompt_he, prompt_en, options, correct_answer').eq('approved', true).limit(500)
      : await db.from('questions').select('id, prompt_he, prompt_en, options, correct_answer, visual_data').eq('topic_id', topicId).eq('approved', true).is('rejected_at', null)
    const ids = (qs || []).map((q: any) => q.id)
    const { data: drafts } = ids.length ? await db.from('question_design_drafts').select('*').in(isP ? 'passage_question_id' : 'question_id', ids) : { data: [] }
    const byQ = new Map((drafts || []).map((d: any) => [d.question_id || d.passage_question_id, d]))
    return NextResponse.json({ items: (qs || []).map((q: any) => ({ q, draft: byQ.get(q.id) || null })) })
  }
  if (req.nextUrl.searchParams.get('list')) {
    const { data: topics } = await db.from('topics').select('id, slug, grade, title_he, title_en, sort_order, subject:subjects(slug)').lte('grade', 6).order('grade').order('sort_order')
    const { data: drafts } = await db.from('question_design_drafts').select('status, flags, question:questions(topic_id), passage_question_id').eq('batch', JOB).limit(10000)
    const by: Record<string, { draft: number; flagged: number; applied: number; rejected: number }> = {}
    for (const d of drafts || []) {
      const t = (d as any).question?.topic_id || ((d as any).passage_question_id ? 'passages' : null)
      if (!t) continue
      const r = (by[t] ||= { draft: 0, flagged: 0, applied: 0, rejected: 0 })
      if (d.status === 'applied') r.applied++
      else if (d.status === 'rejected') r.rejected++
      else if (Array.isArray(d.flags) && d.flags.length) r.flagged++
      else r.draft++
    }
    return NextResponse.json({ topics: [...(topics || []).map((t: any) => ({ ...t, counts: by[t.id] || null })), { id: 'passages', grade: 0, title_he: 'שאלות על סיפורים', subject: { slug: 'hebrew' }, counts: by.passages || null }] })
  }
  const [{ data: job }, { count: drafts }, { count: flagged }, { count: applied }, { data: claims }] = await Promise.all([
    db.from('admin_jobs').select('*').eq('id', JOB).maybeSingle(),
    db.from('question_design_drafts').select('id', { count: 'exact', head: true }).eq('batch', JOB),
    db.from('question_design_drafts').select('id', { count: 'exact', head: true }).eq('batch', JOB).neq('flags', '[]'),
    db.from('question_design_drafts').select('id', { count: 'exact', head: true }).eq('batch', JOB).eq('status', 'applied'),
    db.from('bank_upgrade_claims').select('topic_id, done_at, error').eq('batch', JOB),
  ])
  return NextResponse.json({ job, drafts, flagged, applied, topicsDone: (claims || []).filter(c => c.done_at).length, topicsClaimed: (claims || []).length, errors: (claims || []).filter(c => c.error).map(c => c.error).slice(0, 5) })
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
  const kick = () => fetch(`${origin}/api/admin/design-pass`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-job-key': process.env.SUPABASE_SERVICE_ROLE_KEY! }, body: JSON.stringify({ action: 'step' }) }).catch(() => {})

  if (body.action === 'stop') {
    await db.from('admin_jobs').upsert({ id: JOB, status: 'stopped', updated_at: new Date().toISOString() })
    return NextResponse.json({ ok: true })
  }
  if (body.action === 'start') {
    await db.from('admin_jobs').upsert({ id: JOB, status: 'running', updated_at: new Date().toISOString() })
    // forget unfinished claims whose chain died (older than 6 minutes: a step never runs longer than 5)
    await db.from('bank_upgrade_claims').delete().eq('batch', JOB).is('done_at', null).lt('claimed_at', new Date(Date.now() - 360_000).toISOString())
    const n = Math.max(1, Math.min(6, Number(body.chains) || 3))
    for (let i = 0; i < n; i++) waitUntil(kick())
    return NextResponse.json({ ok: true, chains: n })
  }
  if (body.action === 'apply') return apply(db, body)
  if (body.action === 'reject' && body.id) {
    await db.from('question_design_drafts').update({ status: 'rejected' }).eq('id', body.id)
    return NextResponse.json({ ok: true })
  }
  if (body.action !== 'step' || !isInternal) return NextResponse.json({ error: 'Bad action' }, { status: 400 })

  const { data: job } = await db.from('admin_jobs').select('status').eq('id', JOB).maybeSingle()
  if (job?.status !== 'running') return NextResponse.json({ ok: true, idle: true })

  const { data: topics } = await db.from('topics').select('id, slug, grade, title_he, title_en, subject:subjects(slug)').lte('grade', 6).order('grade').order('sort_order')
  const { data: claims } = await db.from('bank_upgrade_claims').select('topic_id').eq('batch', JOB)
  const taken = new Set((claims || []).map(c => c.topic_id))
  let topic: any = null
  for (const t of topics || []) {
    if (taken.has(t.id)) continue
    const { error } = await db.from('bank_upgrade_claims').insert({ batch: JOB, topic_id: t.id })
    if (!error) { topic = t; break }
  }
  const started = Date.now()

  // all topics claimed: the reading-story questions, then done
  if (!topic) {
    const r = await passages(db, started)
    if (r.more) { waitUntil(kick()); return NextResponse.json({ ok: true, passages: r.done }) }
    await db.from('admin_jobs').upsert({ id: JOB, status: 'done', updated_at: new Date().toISOString() })
    return NextResponse.json({ ok: true, done: true })
  }

  let done = 0, finished = true, err: string | null = null
  try {
    const { data: qs } = await db.from('questions').select('id, prompt_he, prompt_en, options, correct_answer, explanation_he, hint_he').eq('topic_id', topic.id).eq('approved', true).is('rejected_at', null).limit(400)
    const ids = (qs || []).map(q => q.id)
    const { data: have } = ids.length ? await db.from('question_design_drafts').select('question_id').in('question_id', ids) : { data: [] }
    const skip = new Set((have || []).map((h: any) => h.question_id))
    const todo = (qs || []).filter(q => !skip.has(q.id) && (q.prompt_he || q.prompt_en))
    const english = topic.subject?.slug === 'english'
    for (let i = 0; i < todo.length; i += CHUNK) {
      if (Date.now() - started > BUDGET_MS) { finished = false; break }
      const chunk = todo.slice(i, i + CHUNK)
      const r = await draftDesign(topic, chunk)
      if (!r.ok) { err = r.error; finished = false; break }
      const byId = new Map(chunk.map(q => [q.id, q]))
      const rows = (Array.isArray(r.data) ? r.data : []).filter(d => d && byId.has(d.id)).map(d => {
        const c = checkDesign(byId.get(d.id), d, english)
        return { question_id: d.id, batch: JOB, design: c.design, flags: c.flags, status: 'draft' }
      })
      if (rows.length) {
        const { error } = await db.from('question_design_drafts').upsert(rows, { onConflict: 'question_id' })
        if (error) { err = error.message; finished = false; break }
        done += rows.length
      }
    }
  } catch (e: any) { err = String(e?.message || e); finished = false }

  if (finished) await db.from('bank_upgrade_claims').update({ done_at: new Date().toISOString(), questions_done: done, error: err ? err.slice(0, 300) : null }).eq('batch', JOB).eq('topic_id', topic.id)
  else if (err) await db.from('bank_upgrade_claims').update({ questions_done: done, error: err.slice(0, 300) }).eq('batch', JOB).eq('topic_id', topic.id)
  else await db.from('bank_upgrade_claims').delete().eq('batch', JOB).eq('topic_id', topic.id)

  waitUntil(kick())
  return NextResponse.json({ ok: true, topic: topic.slug, done, finished, err })
}

// questions under the reading stories (separate table, ~90 of them)
async function passages(db: any, started: number): Promise<{ done: number; more: boolean }> {
  const { data: pqs } = await db.from('passage_questions').select('id, passage_id, prompt_he, prompt_en, options, correct_answer, explanation_en, hint_he, passage:reading_passages(grade, subject:subjects(slug))').eq('approved', true).limit(500)
  const ids = (pqs || []).map((q: any) => q.id)
  const { data: have } = ids.length ? await db.from('question_design_drafts').select('passage_question_id').in('passage_question_id', ids) : { data: [] }
  const skip = new Set((have || []).map((h: any) => h.passage_question_id))
  const todo = (pqs || []).filter((q: any) => !skip.has(q.id))
  let done = 0
  for (let i = 0; i < todo.length; i += CHUNK) {
    if (Date.now() - started > BUDGET_MS) return { done, more: true }
    const chunk = todo.slice(i, i + CHUNK)
    const p = chunk[0].passage || {}
    const topic = { grade: p.grade || 3, title_he: 'שאלות על סיפור', subject: { slug: p.subject?.slug || 'hebrew' } }
    const english = topic.subject.slug === 'english'
    const r = await draftDesign(topic, chunk)
    if (!r.ok) return { done, more: false }
    const byId = new Map(chunk.map((q: any) => [q.id, q]))
    const rows = (Array.isArray(r.data) ? r.data : []).filter(d => d && byId.has(d.id)).map(d => {
      const c = checkDesign(byId.get(d.id), d, english)
      return { passage_question_id: d.id, batch: JOB, design: c.design, flags: c.flags, status: 'draft' }
    })
    if (rows.length) {
      const { error } = await db.from('question_design_drafts').upsert(rows, { onConflict: 'passage_question_id' })
      if (error) return { done, more: false }
      done += rows.length
    }
  }
  return { done, more: false }
}

// approve: copy the drafts into the live design column
async function apply(db: any, body: any) {
  let q = db.from('question_design_drafts').select('id, question_id, passage_question_id, design, flags').eq('batch', JOB).eq('status', 'draft')
  if (Array.isArray(body.ids)) q = q.in('id', body.ids)
  if (body.cleanOnly) q = q.eq('flags', '[]')
  const { data: drafts } = await q.limit(5000)
  let list = drafts || []
  if (body.topicId) {
    const { data: tq } = await db.from('questions').select('id').eq('topic_id', body.topicId)
    const inTopic = new Set((tq || []).map((x: any) => x.id))
    list = list.filter((d: any) => d.question_id && inTopic.has(d.question_id))
  }
  let applied = 0
  for (const d of list) {
    const table = d.question_id ? 'questions' : 'passage_questions'
    const { error } = await db.from(table).update({ design: d.design }).eq('id', d.question_id || d.passage_question_id)
    if (!error) { applied++; await db.from('question_design_drafts').update({ status: 'applied' }).eq('id', d.id) }
  }
  return NextResponse.json({ ok: true, applied })
}
