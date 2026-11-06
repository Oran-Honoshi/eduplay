import { createServerClient, createServiceRoleClient } from '@/lib/supabase'

// Body: { questions: QuestionInput[] }
// Each question: {
//   topic_slug, difficulty, q_type,
//   prompt_en, prompt_he?,
//   options?,           // array of { label, value_en, value_he, isCorrect }
//   correct_answer,
//   hint_en?, hint_he?, explanation_en?,
//   visual_data?,       // { type, ... }
//   approved?           // defaults to false for AI-generated
// }

export interface QuestionInput {
  topic_slug: string
  // When set, used instead of looking the topic up by slug (slugs repeat across grades).
  topic_id?: string
  // The grade this question was written for (topic-first bank: grade is a tag).
  grade?: number
  created_by_family?: string
  explanation_he?: string
  difficulty: 'easy' | 'medium' | 'hard'
  q_type: string
  prompt_en: string
  prompt_he?: string
  options?: any[]
  correct_answer: string
  hint_en?: string
  hint_he?: string
  explanation_en?: string
  visual_data?: any
  approved?: boolean
}

// ─── options shape guard ───────────────────────────────────────
// Rejects malformed options outright rather than coercing them —
// an object-shape {A,B,C,D} map silently accepted here is exactly
// what produced the 1,793-row options migration.
function validateOptionsShape(options: any, qIndex: number): string | null {
  if (!Array.isArray(options)) {
    return `Question ${qIndex}: options must be an array, not ${typeof options}`
  }
  if (options.length === 0) {
    return `Question ${qIndex}: options array must not be empty`
  }

  let correctCount = 0
  for (let i = 0; i < options.length; i++) {
    const opt = options[i]
    if (typeof opt !== 'object' || opt === null || Array.isArray(opt)) {
      return `Question ${qIndex}, option ${i}: must be an object`
    }
    for (const key of ['label', 'value_en', 'value_he', 'isCorrect']) {
      if (!(key in opt)) {
        return `Question ${qIndex}, option ${i}: missing required key "${key}"`
      }
    }
    if (typeof opt.label !== 'string' || !opt.label) {
      return `Question ${qIndex}, option ${i}: label must be a non-empty string`
    }
    if (typeof opt.value_en !== 'string' || !opt.value_en) {
      return `Question ${qIndex}, option ${i}: value_en must be a non-empty string`
    }
    if (opt.value_he !== null && typeof opt.value_he !== 'string') {
      return `Question ${qIndex}, option ${i}: value_he must be a string or null`
    }
    if (typeof opt.isCorrect !== 'boolean') {
      return `Question ${qIndex}, option ${i}: isCorrect must be a boolean`
    }
    if (opt.isCorrect) correctCount++
  }

  if (correctCount !== 1) {
    return `Question ${qIndex}: options must have exactly one isCorrect:true (found ${correctCount})`
  }
  return null
}

export type InsertQuestionsResult =
  | { ok: true; inserted: { id: string; topic_id: string; difficulty: string; prompt_en: string }[] }
  | { ok: false; error: string; status: number }

// ─── shared validate + topic-lookup + upsert logic ─────────────
// Used by POST /api/questions (batch, all-or-nothing on validation)
// and by /api/questions/generate (called once per question so one
// malformed question doesn't drop the rest of a generation run).
export async function insertQuestions(questions: QuestionInput[]): Promise<InsertQuestionsResult> {
  if (!Array.isArray(questions) || questions.length === 0) {
    return { ok: false, error: 'questions array required', status: 400 }
  }

  // Validate each question has minimum required fields
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i]
    if (!q.topic_slug || !q.prompt_en || !q.correct_answer || !q.difficulty) {
      return {
        ok: false,
        error: 'Each question needs: topic_slug, prompt_en, correct_answer, difficulty',
        status: 400,
      }
    }
    if (q.options != null) {
      const shapeError = validateOptionsShape(q.options, i)
      if (shapeError) {
        return { ok: false, error: shapeError, status: 400 }
      }
    }
  }

  const supabase = createServerClient()

  // Look up topic IDs from slugs in one query
  const slugs = [...new Set(questions.filter(q => !q.topic_id).map(q => q.topic_slug))]
  const { data: topics, error: topicErr } = slugs.length
    ? await supabase.from('topics').select('id, slug').in('slug', slugs)
    : { data: [], error: null }

  if (topicErr) throw topicErr

  const topicMap: Record<string, string> = {}
  for (const t of (topics || [])) topicMap[t.slug] = t.id

  const missing = slugs.filter(s => !topicMap[s])
  if (missing.length > 0) {
    return { ok: false, error: `Unknown topic slugs: ${missing.join(', ')}`, status: 400 }
  }

  // Build insert rows
  const rows = questions.map(q => ({
    topic_id:       q.topic_id || topicMap[q.topic_slug],
    difficulty:     q.difficulty,
    q_type:         q.q_type || 'multiple_choice',
    prompt_en:      q.prompt_en,
    prompt_he:      q.prompt_he || null,
    options:        q.options || null,
    correct_answer: q.correct_answer,
    hint_en:        q.hint_en || null,
    hint_he:        q.hint_he || null,
    explanation_en: q.explanation_en || null,
    explanation_he: q.explanation_he || null,
    grade:          q.grade ?? null,
    created_by_family: q.created_by_family ?? null,
    visual_data:    q.visual_data || null,
    // AI-generated questions go in as approved=false for review
    approved:       q.approved ?? false,
  }))

  // Upsert — skip exact duplicates (same topic + prompt_en). questions has RLS with
  // no anon write policy (by design — see lib/supabase.ts), so this needs the
  // service-role client; requireParentOnlySession() at the call site is the actual gate.
  const { data: inserted, error: insertErr } = await createServiceRoleClient()
    .from('questions')
    .upsert(rows, {
      onConflict:        'topic_id,prompt_en',
      ignoreDuplicates:  true,
    })
    .select('id, topic_id, difficulty, prompt_en')

  if (insertErr) throw insertErr

  return { ok: true, inserted: inserted || [] }
}
