import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { requireParentOnlySession } from '@/lib/session'

// ─── POST /api/questions ──────────────────────────────────────
// Auto-saves generated questions to the database so they
// accumulate over time for future lessons and worksheets.
//
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

interface QuestionInput {
  topic_slug: string
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

export async function POST(req: NextRequest) {
  const auth = await requireParentOnlySession()
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.status === 401 ? 'Unauthorized' : 'Forbidden' },
      { status: auth.status }
    )
  }

  const supabase = createServerClient()

  try {
    const body = await req.json()
    const { questions }: { questions: QuestionInput[] } = body

    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: 'questions array required' }, { status: 400 })
    }

    // Validate each question has minimum required fields
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      if (!q.topic_slug || !q.prompt_en || !q.correct_answer || !q.difficulty) {
        return NextResponse.json({
          error: 'Each question needs: topic_slug, prompt_en, correct_answer, difficulty',
        }, { status: 400 })
      }
      if (q.options != null) {
        const shapeError = validateOptionsShape(q.options, i)
        if (shapeError) {
          return NextResponse.json({ error: shapeError }, { status: 400 })
        }
      }
    }

    // Look up topic IDs from slugs in one query
    const slugs = [...new Set(questions.map(q => q.topic_slug))]
    const { data: topics, error: topicErr } = await supabase
      .from('topics')
      .select('id, slug')
      .in('slug', slugs)

    if (topicErr) throw topicErr

    const topicMap: Record<string, string> = {}
    for (const t of (topics || [])) topicMap[t.slug] = t.id

    const missing = slugs.filter(s => !topicMap[s])
    if (missing.length > 0) {
      return NextResponse.json({
        error: `Unknown topic slugs: ${missing.join(', ')}`,
      }, { status: 400 })
    }

    // Build insert rows
    const rows = questions.map(q => ({
      topic_id:       topicMap[q.topic_slug],
      difficulty:     q.difficulty,
      q_type:         q.q_type || 'multiple_choice',
      prompt_en:      q.prompt_en,
      prompt_he:      q.prompt_he || null,
      options:        q.options || null,
      correct_answer: q.correct_answer,
      hint_en:        q.hint_en || null,
      hint_he:        q.hint_he || null,
      explanation_en: q.explanation_en || null,
      visual_data:    q.visual_data || null,
      // AI-generated questions go in as approved=false for review
      approved:       q.approved ?? false,
    }))

    // Upsert — skip exact duplicates (same topic + prompt_en)
    const { data: inserted, error: insertErr } = await supabase
      .from('questions')
      .upsert(rows, {
        onConflict:        'topic_id,prompt_en',
        ignoreDuplicates:  true,
      })
      .select('id, topic_id, difficulty, prompt_en')

    if (insertErr) throw insertErr

    const savedCount = (inserted || []).length

    return NextResponse.json({
      success:    true,
      saved:      savedCount,
      skipped:    questions.length - savedCount,
      total_sent: questions.length,
    })
  } catch (err: any) {
    console.error('Questions API error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// ─── GET /api/questions ───────────────────────────────────────
// Get questions for a topic (used by lesson + worksheet builder)
export async function GET(req: NextRequest) {
  const supabase = createServerClient()
  const { searchParams } = new URL(req.url)

  const topicId   = searchParams.get('topicId')
  const topicSlug = searchParams.get('slug')
  const diff      = searchParams.get('difficulty') || 'mixed'
  const limit     = parseInt(searchParams.get('limit') || '10')
  const approved  = searchParams.get('approved') !== 'false' // default: approved only

  if (!topicId && !topicSlug) {
    return NextResponse.json({ error: 'topicId or slug required' }, { status: 400 })
  }

  try {
    let query = supabase
      .from('questions')
      .select('*')
      .limit(limit)

    if (topicId)   query = query.eq('topic_id', topicId)
    if (topicSlug) {
      const { data: topic } = await supabase
        .from('topics').select('id').eq('slug', topicSlug).single()
      if (!topic) return NextResponse.json({ error: 'Topic not found' }, { status: 404 })
      query = query.eq('topic_id', topic.id)
    }
    if (approved)       query = query.eq('approved', true)
    if (diff !== 'mixed') query = query.eq('difficulty', diff)

    const { data: questions, error } = await query.order('created_at', { ascending: false })
    if (error) throw error

    return NextResponse.json({ questions: questions || [], count: (questions || []).length })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}