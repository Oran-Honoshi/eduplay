import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { requireParentOnlySession } from '@/lib/session'

// ─── GET /api/questions/count ───────────────────────────────────
// "Check before generating" discovery signal for the question generator —
// same idea as the curriculum_question_count on notebook sections
// (api/notebook/sections/[id]/route.ts), extended with a difficulty filter
// since the generator form (unlike a notebook section) always has one
// selected. Returns { count: 0 } rather than 400 on an unresolvable
// subject/grade/topic combo — this is called on debounced, possibly
// mid-edit form state, not a hard validation boundary.
export async function GET(req: NextRequest) {
  const auth = await requireParentOnlySession()
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.status === 401 ? 'Unauthorized' : 'Forbidden' },
      { status: auth.status }
    )
  }

  const { searchParams } = new URL(req.url)
  const subject_slug = searchParams.get('subject_slug')
  const grade = searchParams.get('grade')
  const topic_slug = searchParams.get('topic_slug')
  const difficulty = searchParams.get('difficulty')

  if (!subject_slug || grade === null || !topic_slug || !difficulty) {
    return NextResponse.json({ count: 0 })
  }

  const supabase = createServerClient()

  const { data: subjectRow } = await supabase.from('subjects').select('id').eq('slug', subject_slug).single()
  if (!subjectRow) return NextResponse.json({ count: 0 })

  const { data: topicRow } = await supabase
    .from('topics')
    .select('id')
    .eq('subject_id', subjectRow.id)
    .eq('grade', parseInt(grade))
    .eq('slug', topic_slug)
    .maybeSingle()
  if (!topicRow) return NextResponse.json({ count: 0 })

  const { count } = await supabase
    .from('questions')
    .select('id', { count: 'exact', head: true })
    .eq('topic_id', topicRow.id)
    .eq('difficulty', difficulty)
    .eq('approved', true)

  return NextResponse.json({ count: count ?? 0 })
}
