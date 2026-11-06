import { NextRequest, NextResponse } from 'next/server'
import { requireParentOnlySession, requireFamilyMatch } from '@/lib/session'
import { createServiceRoleClient } from '@/lib/supabase'
import { loadUploadBlocks } from '@/lib/uploadBlocks'
import { askClaudeJSON } from '@/lib/claude'
import { ON_REQUEST_FROM_GRADE, topicSlug } from '@/lib/onRequestTopics'

export const maxDuration = 300

// ─── POST /api/create/plan ─────────────────────────────────────
// Step 1 of Create: read what the parent wants (+ any uploaded material) and
// propose a plan the parent can adjust before anything is generated.
// Saves a draft row in `materials` and returns it.
//
// Body: { kind: 'practice'|'exam'|'explanation', child_id, subject_slug, grade,
//         language, request_text?, upload_ids?: string[] }
//
// plan = { title, topics: [{ key, title_en, title_he, subtopics_he[], topic_slug, is_new,
//          bank_count, count }], difficulty, q_types, time_minutes?, summary_he, missing_he[] }
const KINDS = ['practice', 'exam', 'explanation']
const LANGS = ['en_only', 'he_only', 'bilingual']

export async function POST(req: NextRequest) {
  const auth = await requireParentOnlySession()
  if (!auth.ok) return NextResponse.json({ error: auth.status === 401 ? 'Unauthorized' : 'Forbidden' }, { status: auth.status })
  const familyId = auth.parent.familyId

  const b = await req.json().catch(() => ({}))
  const kind = String(b.kind || '')
  const grade = Number(b.grade)
  const subject = String(b.subject_slug || '')
  const language = LANGS.includes(b.language) ? b.language : 'he_only'
  const requestText = typeof b.request_text === 'string' ? b.request_text.trim().slice(0, 3000) : ''
  const childId = typeof b.child_id === 'string' ? b.child_id : null
  if (!KINDS.includes(kind)) return NextResponse.json({ error: 'kind must be practice, exam or explanation' }, { status: 400 })
  if (!subject || !Number.isInteger(grade) || grade < 0 || grade > 12) return NextResponse.json({ error: 'subject and grade are required' }, { status: 400 })
  if (childId && !(await requireFamilyMatch(childId, familyId))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const uploads = await loadUploadBlocks(familyId, b.upload_ids)
  if (!requestText && uploads.blocks.length === 0) {
    return NextResponse.json({ error: 'Describe what you need or upload material.' }, { status: 400 })
  }

  const db = createServiceRoleClient()
  const { data: subj } = await db.from('subjects').select('id, label_en').eq('slug', subject).single()
  if (!subj) return NextResponse.json({ error: 'Unknown subject' }, { status: 400 })

  // Topics the plan may use: K–6 → that grade's curated topics (must pick from them);
  // 7+ → the shared on-request bank, plus new topics.
  const onRequest = grade >= ON_REQUEST_FROM_GRADE
  const { data: topicRows } = onRequest
    ? await db.from('topics').select('id, slug, title_en, title_he').eq('subject_id', subj.id).eq('origin', 'on_request')
    : await db.from('topics').select('id, slug, title_en, title_he').eq('subject_id', subj.id).eq('origin', 'curated').eq('grade', grade).order('sort_order')
  const topics = topicRows || []
  const catalog = topics.map(t => ({ slug: t.slug, en: t.title_en, he: t.title_he }))

  // Learn from what worked: this family's liked / 4–5★ materials, and the
  // best-rated ones in the free library, shape the defaults (never correctness).
  const { data: liked } = await db.from('materials').select('kind, plan, rating, liked')
    .eq('family_id', familyId).eq('status', 'ready').or('liked.eq.true,rating.gte.4')
    .order('created_at', { ascending: false }).limit(5)
  const likedHints = (liked || []).filter(x => x.kind === kind).map(x => ({
    difficulty: x.plan?.difficulty, q_types: x.plan?.q_types,
    per_topic: Math.round(((x.plan?.topics || []).reduce((a: number, t: any) => a + (t.count || 0), 0)) / Math.max(1, (x.plan?.topics || []).length)),
    time_minutes: x.plan?.time_minutes ?? undefined,
  }))
  const learnedText = likedHints.length
    ? `\nThis parent liked earlier ${kind} materials with these settings — prefer similar ones unless the request says otherwise: ${JSON.stringify(likedHints)}`
    : ''

  const kindText = {
    practice: 'PRACTICE: focused on one or two topics, many questions per topic, ramping from easy to hard.',
    exam: 'EXAM: covers every topic in the material, a few questions per topic, mixed difficulty, with a suggested time limit in minutes.',
    explanation: 'EXPLANATION PAGES: a short learning page per topic (no question counts needed; set count 0).',
  }[kind]

  const system = `You plan learning material for an Israeli parent. Subject: ${subj.label_en} (${subject}). Grade: ${grade}. Output language for the child: ${language}.
What the parent wants to make — ${kindText}
Read the parent's request and any attached material (workbook pages, an exam material list, a worksheet).
${onRequest
  ? `Choose topics freely. When a topic matches one of these existing shared topics, use its slug in "topic_slug"; otherwise set topic_slug to null and is_new true: ${JSON.stringify(catalog.slice(0, 300))}`
  : `Prefer these curriculum topics for this grade and put the matching slug in "topic_slug": ${JSON.stringify(catalog)}. Only if the material clearly covers something none of them matches (for example a narrower or different scope), set topic_slug to null and is_new true.`}
Rules: topic names are general curriculum names (not page numbers). Keep the topic order of the material. Practice: 1–2 topics unless the parent asked for more, 10–15 questions each. Exam: 3–8 topics, 4–8 questions each, total about 20–40, and time_minutes. Question types: choose from "multiple_choice" and "word_problem" (open answer); use both unless the parent said otherwise.
${learnedText}
If something important is missing or unclear (for example which chapter, or the level), say so briefly in missing_he — but still give your best plan.
${uploads.blocks.length ? `Also write "material_digest": a detailed description of the attached material in Hebrew, so a question writer who cannot see the pages can write matching questions — for each page or section: the topic, the exact terms and notation used (how points, angles, numbers are written), the kinds of exercises with 2–3 representative examples including their numbers, any scope limits (for example "first quadrant only", "whole numbers up to 20"), and the difficulty. Up to about 900 words.` : ''}
Output JSON only:
{"title_he":"...","title_en":"...","summary_he":"one or two sentences explaining the plan to the parent","missing_he":["..."],"material_digest":"..."|null,"difficulty":"progressive"|"mixed"|"easy"|"medium"|"hard","q_types":["multiple_choice","word_problem"],"time_minutes":number|null,
 "topics":[{"title_en":"...","title_he":"...","subtopics_he":["..."],"topic_slug":"..."|null,"is_new":true|false,"count":number}]}`

  const ai = await askClaudeJSON<any>({
    system,
    content: [...uploads.blocks, { type: 'text', text: requestText ? `Parent's request: ${requestText}` : 'Plan from the attached material.' }],
    maxTokens: 7000,
  })
  if (!ai.ok) return NextResponse.json({ error: 'Could not plan this right now. Try again.' }, { status: 502 })
  const p = ai.data || {}

  const bySlug = new Map(topics.map(t => [t.slug, t]))
  const planTopics = (Array.isArray(p.topics) ? p.topics : []).slice(0, 12).map((t: any, i: number) => {
    let slug: string | null = typeof t.topic_slug === 'string' && bySlug.has(t.topic_slug) ? t.topic_slug : null
    if (!slug && onRequest && typeof t.title_en === 'string') {
      const guess = topicSlug(t.title_en)
      if (bySlug.has(guess)) slug = guess
    }
    const row = slug ? bySlug.get(slug) : null
    return {
      key: `t${i + 1}`,
      title_en: row?.title_en || String(t.title_en || '').trim(),
      title_he: row?.title_he || String(t.title_he || '').trim(),
      subtopics_he: Array.isArray(t.subtopics_he) ? t.subtopics_he.filter((x: any) => typeof x === 'string').slice(0, 12) : [],
      topic_slug: slug,
      topic_id: row?.id ?? null,
      is_new: !slug,
      bank_count: 0,
      count: kind === 'explanation' ? 0 : Math.max(1, Math.min(30, Number(t.count) || 10)),
    }
  }).filter((t: any) => t.title_en || t.title_he)

  // Bank check: approved questions already there for each existing topic
  const ids = planTopics.map((t: any) => t.topic_id).filter(Boolean)
  if (ids.length) {
    const { data: qs } = await db.from('questions').select('topic_id').in('topic_id', ids).eq('approved', true)
    const counts: Record<string, number> = {}
    for (const q of qs || []) counts[q.topic_id] = (counts[q.topic_id] || 0) + 1
    for (const t of planTopics) if (t.topic_id) t.bank_count = counts[t.topic_id] || 0
  }

  const plan = {
    title_he: String(p.title_he || '').slice(0, 120), title_en: String(p.title_en || '').slice(0, 120),
    summary_he: String(p.summary_he || '').slice(0, 600),
    missing_he: Array.isArray(p.missing_he) ? p.missing_he.filter((x: any) => typeof x === 'string').slice(0, 5) : [],
    difficulty: ['progressive', 'mixed', 'easy', 'medium', 'hard'].includes(p.difficulty) ? p.difficulty : (kind === 'exam' ? 'mixed' : 'progressive'),
    q_types: Array.isArray(p.q_types) && p.q_types.length ? p.q_types.filter((x: any) => ['multiple_choice', 'word_problem'].includes(x)) : ['multiple_choice', 'word_problem'],
    time_minutes: kind === 'exam' ? Math.max(10, Math.min(240, Number(p.time_minutes) || 45)) : null,
    topics: planTopics,
    digest: typeof p.material_digest === 'string' ? p.material_digest.slice(0, 12000) : null,
    skipped_uploads: uploads.skipped,
  }

  // Re-planning an untouched draft updates it instead of making a new one
  const rowData = {
    family_id: familyId, child_id: childId, kind, subject_slug: subject, grade, language,
    title: plan.title_he || plan.title_en || 'חומר חדש', request_text: requestText || null,
    upload_ids: (Array.isArray(b.upload_ids) ? b.upload_ids : []).filter((x: any) => typeof x === 'string').slice(0, 25),
    plan, time_minutes: plan.time_minutes, updated_at: new Date().toISOString(),
  }
  if (typeof b.material_id === 'string') {
    const { data: prev } = await db.from('materials').select('id, family_id, question_ids, status').eq('id', b.material_id).maybeSingle()
    if (prev && prev.family_id === familyId && prev.status === 'draft' && !(prev.question_ids || []).length) {
      const { data: updated, error: upErr } = await db.from('materials').update(rowData).eq('id', prev.id).select('*').single()
      if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })
      return NextResponse.json({ material: updated })
    }
  }
  const { data: material, error } = await db.from('materials').insert({
    family_id: familyId, child_id: childId, kind, subject_slug: subject, grade, language,
    title: plan.title_he || plan.title_en || 'חומר חדש', request_text: requestText || null,
    upload_ids: (Array.isArray(b.upload_ids) ? b.upload_ids : []).filter((x: any) => typeof x === 'string').slice(0, 25),
    plan, time_minutes: plan.time_minutes,
  }).select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ material })
}
