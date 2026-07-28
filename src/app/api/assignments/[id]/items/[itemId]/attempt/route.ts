import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase'
import { requireOwnChildSession } from '@/lib/session'

// ─── POST /api/assignments/[id]/items/[itemId]/attempt ─────────
// Grades one answer submission for one assignment item. Child-only (not
// authorizeChildAccess) — same class of gate as the token/XP-grant routes in
// session.ts: a parent must never be able to submit answers on the child's
// behalf, since this is exactly the gameplay XP is meant to be earned by.
//
// Re-derives correctness server-side from the question's own options — the
// same pattern just applied to api/progress/route.ts for the lesson flow —
// rather than trusting a client-supplied `correct`, so this new code path
// doesn't repeat that mistake.
//
// Body: { answerGiven: string }  (the selected option's label)
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  const supabase = createServiceRoleClient()

  const { data: item } = await supabase
    .from('assignment_items')
    .select(`
      id, assignment_id, question_id, status,
      assignment:assignments ( child_id )
    `)
    .eq('id', params.itemId)
    .eq('assignment_id', params.id)
    .maybeSingle()

  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const childId = (item.assignment as any)?.child_id
  const auth = await requireOwnChildSession(childId)
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.status === 401 ? 'Unauthorized' : 'Forbidden' },
      { status: auth.status }
    )
  }

  if (item.status !== 'not_started' && item.status !== 'attempt_1_wrong') {
    return NextResponse.json({ error: 'This question has already been answered' }, { status: 409 })
  }

  const body = await req.json()
  const { answerGiven } = body
  if (!answerGiven) return NextResponse.json({ error: 'answerGiven required' }, { status: 400 })

  const { data: question } = await supabase
    .from('questions')
    .select('options, hint_en, hint_he, explanation_en')
    .eq('id', item.question_id)
    .single()

  const options = Array.isArray(question?.options) ? question.options : []
  const matchedOption = options.find((o: any) => o.label === answerGiven)
  const isCorrect = !!matchedOption?.isCorrect
  const isFirstAttempt = item.status === 'not_started'

  const update = isFirstAttempt
    ? { attempt_1_answer: answerGiven, attempt_1_correct: isCorrect, answered_at: isCorrect ? new Date().toISOString() : null }
    : { attempt_2_answer: answerGiven, attempt_2_correct: isCorrect, answered_at: new Date().toISOString() }

  // .eq('status', item.status) is an optimistic-concurrency guard — if a duplicate
  // request already resolved this item between the read above and this write, zero rows
  // match and `updated` comes back null below rather than silently double-recording.
  const { data: updated, error: updateError } = await supabase
    .from('assignment_items')
    .update(update)
    .eq('id', item.id)
    .eq('status', item.status)
    .select('status')
    .maybeSingle()

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })
  if (!updated) return NextResponse.json({ error: 'This question has already been answered' }, { status: 409 })

  if (isCorrect) {
    await supabase.rpc('award_xp', { p_child_id: childId, p_amount: 25 })
  }

  return NextResponse.json({
    correct: isCorrect,
    status: updated.status,
    hint: !isCorrect && isFirstAttempt
      ? { hint_en: question?.hint_en, hint_he: question?.hint_he }
      : undefined,
    reveal: !isCorrect && !isFirstAttempt
      ? {
          correct: options.find((o: any) => o.isCorrect) || null,
          explanation_en: question?.explanation_en,
        }
      : undefined,
  })
}
