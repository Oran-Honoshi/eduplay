import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// ─── POST /api/questions ──────────────────────────────────────
// Auto-saves generated questions to the database so they
// accumulate over time for future lessons and worksheets.
//
// Body: { questions: QuestionInput[], source?: string }
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

export async function POST(req: NextRequest) {
  const supabase = createServerClient()

  try {
    const body = await req.json()
    const { questions, source = 'generated' }: { questions: QuestionInput[]; source?: string } = body

    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: 'questions array required' }, { status: 400 })
    }

    // Validate each question has minimum required fields
    for (const q of questions) {
      if (!q.topic_slug || !q.prompt_en || !q.correct_answer || !q.difficulty) {
        return NextResponse.json({
          error: 'Each question needs: topic_slug, prompt_en, correct_answer, difficulty',
        }, { status: 400 })
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
      // Manually provided questions come in as approved=true
      approved:       q.approved ?? (source === 'manual'),
      source,
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
      source,
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