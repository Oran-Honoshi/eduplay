import { NextRequest, NextResponse } from 'next/server'
import { answersMatch } from '@/lib/answerMatch'
import { createServiceRoleClient } from '@/lib/supabase'
import { requireOwnChildSession } from '@/lib/session'
import { creditTopicProgress } from '@/lib/progressCredit'

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
      assignment:assignments ( child_id, topic_id )
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
    .select('options, correct_answer, hint_en, hint_he, explanation_en, explanation_he')
    .eq('id', item.question_id)
    .single()

  const options = Array.isArray(question?.options) ? question.options : []
  // Open questions (no options) are graded against correct_answer with the same
  // forgiving match the lessons use (fractions, units, Hebrew niqqud…).
  const isCorrect = options.length > 0
    ? !!options.find((o: any) => o.label === answerGiven)?.isCorrect
    : answersMatch(String(answerGiven), String(question?.correct_answer ?? ''))
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

  // FIXED (2026-08-03): same ordering bug just fixed in api/progress/route.ts — award_xp
  // unconditionally stamps last_active_at, and update_streak decides extend/reset/same-day
  // purely by reading that field first, so running award_xp first could silently erase the
  // "already active today" signal before update_streak ever saw it. award_xp never reads
  // last_active_at itself, so running update_streak first is a safe reorder, not a
  // behavior change to XP.
  await supabase.rpc('update_streak', { p_child_id: childId })
  if (isCorrect) {
    await supabase.rpc('award_xp', { p_child_id: childId, p_amount: 25 })
  }

  // Credit child_topic_progress for the assignment's topic (if one was derived at
  // creation — see api/assignments/route.ts) once this item is genuinely resolved, not on
  // an intermediate wrong-first-attempt. Reuses the exact same upsert the lesson flow
  // uses (api/progress/route.ts), so an assignment-driven topic completion shows up
  // consistently in the Progress tab instead of leaving "assignment: done, topic: not
  // started" — the mismatch this whole fix exists to close. Deliberately does NOT award a
  // card token on isNewBest here — whether an assignment-driven completion should earn a
  // card is a separate, already-deferred product decision, not part of this fix's scope.
  const topicId = (item.assignment as any)?.topic_id
  const isResolved = updated.status !== 'attempt_1_wrong'
  if (isResolved && topicId) {
    const { data: allItems } = await supabase
      .from('assignment_items')
      .select('status')
      .eq('assignment_id', params.id)
    const items = allItems || []
    const resolvedCount = items.filter(
      (it: any) => it.status !== 'not_started' && it.status !== 'attempt_1_wrong'
    ).length
    await creditTopicProgress(supabase, {
      childId, topicId,
      stepNumber: resolvedCount, totalSteps: items.length,
      questionAnswered: true, correct: isCorrect,
    })
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
          correct_answer: options.length === 0 ? question?.correct_answer ?? null : undefined,
          explanation_en: question?.explanation_en,
          explanation_he: question?.explanation_he,
        }
      : undefined,
  })
}
