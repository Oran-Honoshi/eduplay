import { NextRequest, NextResponse } from 'next/server'
import { waitUntil } from '@vercel/functions'
import { createServiceRoleClient } from '@/lib/supabase'
import { requireAdmin } from '@/lib/admin'
import { LEVEL_BATCH, draftLevel, checkLevel } from '@/lib/levelPass'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

// Admin job: the reading-level pass over the K–6 bank (see src/lib/levelPass.ts).
// Niqqud is written to the live question right away (a backup row is kept in
// questions_backup_level); grade suggestions are stored in question_level_checks.
//   GET → progress · POST {action:'start'|'stop'} · POST {action:'keep', questionId}
const JOB = LEVEL_BATCH
const CHUNK = 8
const BUDGET_MS = 230_000

function internal(req: NextRequest) {
  const k = req.headers.get('x-job-key')
  return !!k && k === process.env.SUPABASE_SERVICE_ROLE_KEY
}

export async function GET() {
  const a = await requireAdmin()
  if (!a.ok) return NextResponse.json({ error: 'Forbidden' }, { status: a.status })
  const db = createServiceRoleClient()
  const [{ data: job }, { count: checked }, { count: off }, { count: niqqud }, { data: claims }] = await Promise.all([
    db.from('admin_jobs').select('*').eq('id', JOB).maybeSingle(),
    db.from('question_level_checks').select('question_id', { count: 'exact', head: true }),
    db.from('question_level_checks').select('question_id', { count: 'exact', head: true }).neq('fit', 'fits').eq('status', 'open'),
    db.from('question_level_checks').select('question_id', { count: 'exact', head: true }).eq('niqqud_applied', true),
    db.from('bank_upgrade_claims').select('topic_id, done_at, error').eq('batch', JOB),
  ])
  return NextResponse.json({ job, checked, off, niqqud, topicsDone: (claims || []).filter(c => c.done_at).length, errors: (claims || []).filter(c => c.error).map(c => c.error).slice(0, 5) })
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
  const kick = () => fetch(`${origin}/api/admin/level-pass`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-job-key': process.env.SUPABASE_SERVICE_ROLE_KEY! }, body: JSON.stringify({ action: 'step' }) }).catch(() => {})

  if (body.action === 'stop') {
    await db.from('admin_jobs').upsert({ id: JOB, status: 'stopped', updated_at: new Date().toISOString() })
    return NextResponse.json({ ok: true })
  }
  if (body.action === 'start') {
    await db.from('admin_jobs').upsert({ id: JOB, status: 'running', updated_at: new Date().toISOString() })
    await db.from('bank_upgrade_claims').delete().eq('batch', JOB).is('done_at', null).lt('claimed_at', new Date(Date.now() - 360_000).toISOString())
    const n = Math.max(1, Math.min(6, Number(body.chains) || 3))
    for (let i = 0; i < n; i++) waitUntil(kick())
    return NextResponse.json({ ok: true, chains: n })
  }
  if (body.action === 'keep' && body.questionId) {
    await db.from('question_level_checks').update({ status: 'kept' }).eq('question_id', body.questionId)
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
  if (!topic) {
    await db.from('admin_jobs').upsert({ id: JOB, status: 'done', updated_at: new Date().toISOString() })
    return NextResponse.json({ ok: true, done: true })
  }

  const started = Date.now()
  let done = 0, finished = true, err: string | null = null
  try {
    const { data: qs } = await db.from('questions').select('*').eq('topic_id', topic.id).eq('approved', true).is('rejected_at', null).limit(400)
    const ids = (qs || []).map(q => q.id)
    const { data: have } = ids.length ? await db.from('question_level_checks').select('question_id').in('question_id', ids) : { data: [] }
    const skip = new Set((have || []).map((h: any) => h.question_id))
    const todo = (qs || []).filter(q => !skip.has(q.id))
    for (let i = 0; i < todo.length; i += CHUNK) {
      if (Date.now() - started > BUDGET_MS) { finished = false; break }
      const chunk = todo.slice(i, i + CHUNK)
      const r = await draftLevel(topic, chunk)
      if (!r.ok) { err = r.error; finished = false; break }
      const byId = new Map(chunk.map(q => [q.id, q]))
      for (const d of (Array.isArray(r.data) ? r.data : []).filter(d => d && byId.has(d.id))) {
        const q = byId.get(d.id)
        const c = checkLevel(q, d)
        const upd = { ...c.update, ...(c.design ? { design: c.design } : {}) }
        let applied = false
        if (Object.keys(upd).length) {
          await db.from('questions_backup_level').upsert(q as any, { onConflict: 'id', ignoreDuplicates: true })
          const { error } = await db.from('questions').update(upd).eq('id', q.id)
          applied = !error
        }
        await db.from('question_level_checks').upsert({ question_id: q.id, batch: JOB, ...c.fit, niqqud_applied: applied, dropped: c.dropped })
        done++
      }
    }
  } catch (e: any) { err = String(e?.message || e); finished = false }

  if (finished) await db.from('bank_upgrade_claims').update({ done_at: new Date().toISOString(), questions_done: done, error: err ? err.slice(0, 300) : null }).eq('batch', JOB).eq('topic_id', topic.id)
  else if (err) await db.from('bank_upgrade_claims').update({ questions_done: done, error: err.slice(0, 300) }).eq('batch', JOB).eq('topic_id', topic.id)
  else await db.from('bank_upgrade_claims').delete().eq('batch', JOB).eq('topic_id', topic.id)

  waitUntil(kick())
  return NextResponse.json({ ok: true, topic: topic.slug, done, finished, err })
}
