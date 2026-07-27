import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { requireParentOnlySession } from '@/lib/session'
import { insertQuestions, QuestionInput } from '@/lib/insertQuestions'

// ─── POST /api/questions ──────────────────────────────────────
// Auto-saves generated questions to the database so they
// accumulate over time for future lessons and worksheets.
// See src/lib/insertQuestions.ts for the request body shape and
// the shared validate + topic-lookup + upsert logic.

export async function POST(req: NextRequest) {
  const auth = await requireParentOnlySession()
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.status === 401 ? 'Unauthorized' : 'Forbidden' },
      { status: auth.status }
    )
  }

  try {
    const body = await req.json()
    const { questions }: { questions: QuestionInput[] } = body

    const result = await insertQuestions(questions)
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    const savedCount = result.inserted.length

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
