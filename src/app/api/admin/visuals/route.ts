import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { createServiceRoleClient } from '@/lib/supabase'
import { generateVisual, savableVisual, loadRejectionLessons } from '@/lib/eduVisuals/generate'

// Admin: the designer's visual generator, run inside the app (ANTHROPIC_API_KEY comes from the environment).
//   GET                      → pending proposals (with the question), counts per status
//   POST {action:'run', grade_max, subject, limit}   → generates pictures for questions that have none (a batch per click)
//   POST {action:'approve'|'reject', id}              → one proposal
//   POST {action:'approve_clean'}                     → every pending library proposal with no warnings
// Nothing reaches a child until a person approves; approving writes questions.visual_data (only if it is still empty).
export const maxDuration = 300
export const dynamic = 'force-dynamic'

const LET = ['גן', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז']
const bareAnswer = (q: any) => {
  const o = (Array.isArray(q.options) ? q.options : []).find((x: any) => x.isCorrect)
  return o ? (o.value_he || o.value_en) : q.correct_answer
}

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.status === 401 ? 'Unauthorized' : 'Forbidden' }, { status: auth.status })
  const sb = createServiceRoleClient()
  const { data: all } = await sb.from('visual_proposals').select('status').limit(5000)
  const counts: Record<string, number> = {}
  ;(all || []).forEach((r: any) => { counts[r.status] = (counts[r.status] || 0) + 1 })
  const { data: rows } = await sb.from('visual_proposals').select('id, question_id, status, mode, visual_data, why, hidden, warnings, errors, question_fixes, created_at').in('status', ['pending', 'custom']).order('created_at').limit(60)
  const ids = (rows || []).map((r: any) => r.question_id)
  const { data: qs } = ids.length ? await sb.from('questions').select('id, prompt_he, prompt_en, correct_answer, options').in('id', ids) : { data: [] as any[] }
  const byId = new Map((qs || []).map((q: any) => [q.id, q]))
  const items = (rows || []).map((r: any) => { const q: any = byId.get(r.question_id); return { ...r, question: q ? (q.prompt_he || q.prompt_en) : '', answer: q ? bareAnswer(q) : '' } })
  return NextResponse.json({ counts, items })
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.status === 401 ? 'Unauthorized' : 'Forbidden' }, { status: auth.status })
  const body = await req.json().catch(() => ({}))
  const sb = createServiceRoleClient()
  const now = new Date().toISOString()

  if (body.action === 'reject' && body.id) {
    const tags: string[] = Array.isArray(body.tags) ? body.tags.map((t: any) => String(t).slice(0, 60)).slice(0, 8) : []
    const reason = String(body.reason || '').trim().slice(0, 500)
    if (!tags.length && !reason) return NextResponse.json({ error: 'צריך לכתוב או לבחור סיבה' }, { status: 400 })
    await sb.from('visual_proposals').update({ status: 'rejected', decided_at: now, reject_reason: reason || null, reject_tags: tags }).eq('id', body.id)
    return NextResponse.json({ ok: true })
  }

  if (body.action === 'approve' || body.action === 'approve_clean') {
    let q = sb.from('visual_proposals').select('id, question_id, visual_data, warnings, mode').eq('status', 'pending')
    q = body.action === 'approve' ? q.eq('id', String(body.id)) : q.eq('mode', 'library').limit(200)   // "approve all clean" never takes free drawings: a person looks at those
    const { data: props } = await q
    let saved = 0
    for (const p of props || []) {
      if (body.action === 'approve_clean' && Array.isArray(p.warnings) && p.warnings.length) continue
      // lib:'eduplay' makes the renderer use the designer's library even for types the older renderer also knows
      const { data: upd } = await sb.from('questions').update({ visual_data: p.visual_data?.type === 'custom_svg' ? p.visual_data : { ...p.visual_data, lib: 'eduplay' } }).eq('id', p.question_id).is('visual_data', null).select('id')
      await sb.from('visual_proposals').update({ status: 'approved', decided_at: now }).eq('id', p.id)
      if (upd?.length) saved++
    }
    return NextResponse.json({ ok: true, saved })
  }

  if (body.action === 'run') {
    const gmax = Math.min(7, Math.max(0, Number(body.grade_max ?? 3)))
    const subject = ['math', 'hebrew', 'english'].includes(body.subject) ? body.subject : 'math'
    const limit = Math.min(40, Math.max(1, Number(body.limit ?? 12)))
    const { data: subj } = await sb.from('subjects').select('id').eq('slug', subject).maybeSingle()
    const { data: topics } = await sb.from('topics').select('id, grade, slug').eq('subject_id', subj?.id).lte('grade', gmax)
    const tMap = new Map((topics || []).map((t: any) => [t.id, t]))
    if (!tMap.size) return NextResponse.json({ ok: true, done: 0, remaining: 0 })
    const { data: have } = await sb.from('visual_proposals').select('question_id').limit(10000)
    const skip = new Set((have || []).map((r: any) => r.question_id))
    const cands: any[] = []
    for (let from = 0; cands.length < 400; from += 1000) {
      const { data } = await sb.from('questions').select('id, topic_id, prompt_he, prompt_en, correct_answer, options').eq('approved', true).is('visual_data', null).in('topic_id', [...tMap.keys()]).order('id').range(from, from + 999)
      cands.push(...(data || []).filter((q: any) => !skip.has(q.id)))
      if (!data || data.length < 1000) break
    }
    const batch = cands.slice(0, limit)
    const lessons = await loadRejectionLessons(sb)
    const started = Date.now()
    let done = 0
    for (let i = 0; i < batch.length && Date.now() - started < 230_000; i += 3) {
      await Promise.all(batch.slice(i, i + 3).map(async q => {
        const t: any = tMap.get(q.topic_id)
        const r = await generateVisual({ id: q.id, text: q.prompt_he || q.prompt_en, answer: bareAnswer(q), subject, grade: LET[t.grade] ?? String(t.grade), lesson: t.slug, options: (Array.isArray(q.options) ? q.options : []).map((o: any) => o.value_he || o.value_en) }, lessons)
        const vd = savableVisual({ ...r, warnings: [] })   // warnings are shown to the admin instead of blocking
        const status = r.failed || r.errors?.length ? 'failed' : r.mode === 'none' ? 'none_needed' : vd ? 'pending' : 'failed'
        await sb.from('visual_proposals').insert({ question_id: q.id, status, mode: r.mode ?? null, visual_data: vd ? (vd.type === 'custom_svg' ? vd : r.visual_data) : null, why: r.why ?? null, hidden: r.hidden ?? null, warnings: [...(r.warnings || []), ...(r.question_fixes?.length ? [] : [])], errors: r.errors || [], question_fixes: r.question_fixes ?? null, attempts: r.attempts ?? null })
        done++
      }))
    }
    return NextResponse.json({ ok: true, done, remaining: Math.max(0, cands.length - done) })
  }

  return NextResponse.json({ error: 'unknown action' }, { status: 400 })
}
