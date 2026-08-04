import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { requireParentOnlySession } from '@/lib/session'

// ─── GET /api/passages/count ─────────────────────────────────────
// "Check before generating" discovery signal for the passage generator —
// same pattern as /api/questions/count, filtered on grade/subject/type/
// difficulty (+ level_id when a reading-acquisition level is selected).
// Returns { count: 0 } rather than 400 on an unresolvable combo — called
// on debounced, possibly mid-edit form state, not a hard validation boundary.
export async function GET(req: NextRequest) {
  const auth = await requireParentOnlySession()
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.status === 401 ? 'Unauthorized' : 'Forbidden' },
      { status: auth.status }
    )
  }

  const { searchParams } = new URL(req.url)
  const grade = searchParams.get('grade')
  const subject = searchParams.get('subject')
  const type = searchParams.get('type')
  const difficulty = searchParams.get('difficulty')
  const level_id = searchParams.get('level_id')

  if (grade === null || !subject || !type || !difficulty) {
    return NextResponse.json({ count: 0 })
  }

  const supabase = createServerClient()

  const { data: subjectRow } = await supabase.from('subjects').select('id').eq('slug', subject).single()
  if (!subjectRow) return NextResponse.json({ count: 0 })

  let query = supabase
    .from('reading_passages')
    .select('id', { count: 'exact', head: true })
    .eq('subject_id', subjectRow.id)
    .eq('grade', parseInt(grade))
    .eq('passage_type', type)
    .eq('difficulty', difficulty)
    .eq('approved', true)

  if (level_id) query = query.eq('level_id', level_id)

  const { count } = await query

  return NextResponse.json({ count: count ?? 0 })
}
