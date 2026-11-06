import { NextRequest, NextResponse } from 'next/server'
import { requireParentOnlySession } from '@/lib/session'
import { createServiceRoleClient } from '@/lib/supabase'

export const maxDuration = 300

// ─── POST /api/materials/[id]/build ────────────────────────────
// Fills one topic of a plan, one chunk at a time (the page calls this
// repeatedly so no single request runs long):
//   1. bank first — approved questions already in that topic are reused
//      (up to the plan's `reuse` number) before anything new is written;
//   2. the rest is generated through /api/questions/generate with the plan's
//      difficulty, question types, language, sub-skills and the uploaded files.
// New questions stay approved=false until the parent reviews them.
// Body: { topic_key, generate: number (≤10), reuse?: number }
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireParentOnlySession()
  if (!auth.ok) return NextResponse.json({ error: auth.status === 401 ? 'Unauthorized' : 'Forbidden' }, { status: auth.status })
  const db = createServiceRoleClient()
  const { data: m } = await db.from('materials').select('*').eq('id', params.id).maybeSingle()
  if (!m || m.family_id !== auth.parent.familyId) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const b = await req.json().catch(() => ({}))
  const topic = (m.plan?.topics || []).find((t: any) => t.key === b.topic_key)
  if (!topic) return NextResponse.json({ error: 'Unknown topic' }, { status: 400 })
  const toGenerate = Math.max(0, Math.min(8, Number(b.generate) || 0))
  const toReuse = Math.max(0, Math.min(30, Number(b.reuse) || 0))

  const have: string[] = m.question_ids || []  // only used to avoid reusing the same bank question twice
  const added: string[] = []
  const warnings: string[] = []
  let topicId: string | null = topic.topic_id || null
  let topicSlug: string | null = topic.topic_slug || null

  // 1) reuse approved bank questions
  if (toReuse > 0 && topicId) {
    const { data: bank } = await db.from('questions').select('id, difficulty')
      .eq('topic_id', topicId).eq('approved', true).limit(200)
    const order = { easy: 0, medium: 1, hard: 2 } as Record<string, number>
    const pool = (bank || []).filter(q => !have.includes(q.id))
      .sort(() => Math.random() - 0.5).slice(0, toReuse)
      .sort((a, c) => (order[a.difficulty] ?? 1) - (order[c.difficulty] ?? 1))
    added.push(...pool.map(q => q.id))
  }

  // 2) generate the rest
  if (toGenerate > 0) {
    // A topic is built in parts (≤5 questions each, run in parallel). Each part
    // gets its own slice of sub-skills, and for "easy to hard" its own level, so
    // the parts add up to one ramp instead of five small ramps.
    const part = Math.max(0, Number(b.part) || 0), parts = Math.max(1, Number(b.parts) || 1)
    const plan = m.plan || {}
    // every question already in this material (any topic), so parts never repeat each other
    const { data: existingQs } = (m.question_ids || []).length
      ? await db.from('questions').select('prompt_he, prompt_en').in('id', m.question_ids)
      : { data: [] as any[] }
    const existingPrompts = (existingQs || []).map((q: any) => q.prompt_he || q.prompt_en).filter(Boolean)
    const diffSetting = plan.difficulty || 'progressive'
    let difficulty = ['easy', 'medium', 'hard'].includes(diffSetting) ? diffSetting : 'medium'
    let progressive = diffSetting === 'mixed'
    if (diffSetting === 'progressive') {
      if (parts === 1) progressive = true
      else difficulty = part < parts / 3 ? 'easy' : part < (2 * parts) / 3 ? 'medium' : 'hard'
    }
    const subs: string[] = topic.subtopics_he || []
    const mySubs = parts === 1 || subs.length === 0 ? subs
      : subs.length >= parts ? subs.filter((_, i) => i % parts === part)
      : [subs[part % subs.length]]
    const focus = [
      mySubs.length ? `Focus on these sub-skills: ${mySubs.join('; ')}.` : '',
      plan.focus_he?.length ? `Parent's focus notes: ${plan.focus_he.join('; ')}.` : '',
      plan.avoid_he?.length ? `The parent removed earlier questions for these reasons — avoid these problems: ${plan.avoid_he.slice(-12).join('; ')}.` : '',
      m.kind === 'exam' ? 'These questions are part of a practice exam: exam-style wording, no hints in the question text.' : '',
      m.request_text ? `The parent asked: ${m.request_text}` : '',
    ].filter(Boolean).join(' ')
    const genBody: any = {
      subject_slug: m.subject_slug, grade: m.grade,
      q_types: m.plan?.q_types?.length ? m.plan.q_types : ['multiple_choice'],
      difficulty, progressive, count: toGenerate, language: m.language,
      custom_prompt: focus || undefined,
      note: typeof b.note === 'string' && b.note.trim() ? b.note.trim().slice(0, 600) : undefined,
      avoid_prompts: existingPrompts,
      // the material was read once while planning; send that summary instead of
      // re-sending every photo (much faster). Older drafts without one fall back to the files.
      ...(m.plan?.digest ? { material_text: m.plan.digest } : (m.upload_ids?.length ? { upload_ids: m.upload_ids } : {})),
    }
    if (topicSlug) genBody.topic_slug = topicSlug
    else genBody.new_topic = { title_en: topic.title_en || topic.title_he, title_he: topic.title_he || null }

    const res = await fetch(new URL('/api/questions/generate', req.nextUrl.origin), {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: req.headers.get('cookie') || '' },
      body: JSON.stringify(genBody),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data.success) {
      return NextResponse.json({ error: data.error || 'Generation failed', added_reused: added.length }, { status: 502 })
    }
    added.push(...(data.inserted || []).map((q: any) => q.id))
    if (data.warnings?.length) warnings.push(...data.warnings)
    if (!topicId && data.inserted?.[0]?.topic_id) topicId = data.inserted[0].topic_id
  }

  // a new topic gets its id/slug on first generation — remember it in the plan
  if (topicId && !topic.topic_id) {
    const { data: t } = await db.from('topics').select('id, slug').eq('id', topicId).single()
    if (t) await db.rpc('set_material_plan_topic', { p_id: m.id, p_key: topic.key, p_topic: t.id, p_slug: t.slug })
  }
  // atomic append: several topics of one material build in parallel
  const { data: total } = await db.rpc('append_material_questions', { p_id: m.id, p_qids: added, p_topic: topicId })

  return NextResponse.json({ added, total, warnings })
}
