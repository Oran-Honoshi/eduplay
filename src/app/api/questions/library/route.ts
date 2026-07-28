import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase'
import { requireParentOnlySession } from '@/lib/session'

// ─── GET /api/questions/library ───────────────────────────────
// Browse approved questions for one or more topics, for the parent-facing
// Question Library tab. Deliberately separate from the public GET on
// /api/questions (anon-key, single-topic, used by /lesson) rather than an
// extension of it — that route's contract is relied on by /lesson and
// shouldn't shift shape for this feature.

const DEFAULT_LIMIT = 200
const MAX_LIMIT = 500

export async function GET(req: NextRequest) {
  const auth = await requireParentOnlySession()
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.status === 401 ? 'Unauthorized' : 'Forbidden' },
      { status: auth.status }
    )
  }

  const { searchParams } = new URL(req.url)
  const topicIds = searchParams.get('topicIds')?.split(',').filter(Boolean) || []
  const difficulty = searchParams.get('difficulty') || undefined
  const limit = Math.min(MAX_LIMIT, parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT)))

  if (topicIds.length === 0) {
    return NextResponse.json({ error: 'topicIds required' }, { status: 400 })
  }

  let query = createServiceRoleClient()
    .from('questions')
    .select(`
      id, topic_id, difficulty, q_type, prompt_en, prompt_he,
      options, correct_answer, hint_en, hint_he, explanation_en, created_at,
      topics ( title_en, grade, subjects ( label_en, slug ) )
    `)
    .eq('approved', true)
    .in('topic_id', topicIds)

  if (difficulty && difficulty !== 'mixed') query = query.eq('difficulty', difficulty)

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const questions = data || []
  return NextResponse.json({ questions, count: questions.length, mayHaveMore: questions.length === limit })
}
