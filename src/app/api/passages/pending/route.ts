import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase'
import { requireParentOnlySession } from '@/lib/session'

// ─── GET /api/passages/pending ──────────────────────────────────
// Lists passages needing review: any not-yet-rejected passage with
// approved:false, PLUS any already-approved passage that still has its own
// not-yet-rejected unapproved passage_questions attached (those need their
// own review — see /api/passages/questions/[id]). Same global/unscoped-queue
// tradeoff as /api/questions/pending. A rejected passage or passage_question
// stays in its table (rejected_reason may hold why) but must not resurface here.

export async function GET() {
  const auth = await requireParentOnlySession()
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.status === 401 ? 'Unauthorized' : 'Forbidden' },
      { status: auth.status }
    )
  }

  const supabase = createServiceRoleClient()

  const { data: pendingQuestionRows, error: pqError } = await supabase
    .from('passage_questions').select('passage_id').eq('approved', false).is('rejected_at', null)
  if (pqError) return NextResponse.json({ error: pqError.message }, { status: 500 })

  const passageIdsWithPendingQuestions = [...new Set((pendingQuestionRows || []).map((r: any) => r.passage_id))]

  let query = supabase
    .from('reading_passages')
    .select('*, subjects(slug), passage_questions(*)')
    .is('rejected_at', null)
    .order('created_at', { ascending: false })
    .limit(50)

  query = passageIdsWithPendingQuestions.length > 0
    ? query.or(`approved.eq.false,id.in.(${passageIdsWithPendingQuestions.join(',')})`)
    : query.eq('approved', false)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ passages: data || [] })
}
