// Shared child_topic_progress upsert — extracted from api/progress/route.ts (2026-08-03)
// so the lesson flow and the assignment-completion flow credit progress through the exact
// same, already-twice-patched logic instead of each keeping their own copy. See that
// route's history for the two real bugs this exact code used to have: an explicit `null`
// into the NOT NULL `steps_total` column on a first-ever, not-yet-completed attempt (fixed
// to insert 0, the same fallback every reader already uses), and a personal-best
// (`isNewBest`) calc that must only be written at real completion, never on the
// intermediate calls that precede it.
export async function creditTopicProgress(supabase: any, {
  childId, topicId, stepNumber, totalSteps, questionAnswered, correct,
}: {
  childId: string
  topicId: string
  stepNumber?: number
  totalSteps?: number
  questionAnswered?: boolean
  correct?: boolean
}): Promise<{ isCompleted: boolean; isNewBest: boolean }> {
  const { data: existing } = await supabase
    .from('child_topic_progress')
    .select('*')
    .eq('child_id', childId)
    .eq('topic_id', topicId)
    .maybeSingle()

  const isCompleted = !!(stepNumber && totalSteps && stepNumber >= totalSteps)
  let isNewBest = false

  if (existing) {
    const newAttempts = (existing.questions_attempted || 0) + (questionAnswered ? 1 : 0)
    const newCorrect  = (existing.questions_correct || 0) + (correct ? 1 : 0)
    const newSteps    = stepNumber ? Math.max(existing.steps_completed || 0, stepNumber) : existing.steps_completed

    const priorBestSteps = existing.steps_total || 0
    isNewBest = isCompleted && (totalSteps || 0) > priorBestSteps
    const newStepsTotal = isCompleted ? Math.max(totalSteps || 0, priorBestSteps) : existing.steps_total

    await supabase.from('child_topic_progress').update({
      questions_attempted: newAttempts,
      questions_correct:   newCorrect,
      steps_completed:     newSteps,
      steps_total:         newStepsTotal,
      status:              isCompleted ? 'completed' : 'in_progress',
      completed_at:        isCompleted ? new Date().toISOString() : existing.completed_at,
      last_attempted_at:   new Date().toISOString(),
    }).eq('child_id', childId).eq('topic_id', topicId)
  } else {
    isNewBest = isCompleted && (totalSteps || 0) > 0
    const { error: insertErr } = await supabase.from('child_topic_progress').insert({
      child_id:            childId,
      topic_id:            topicId,
      status:              isCompleted ? 'completed' : 'in_progress',
      questions_attempted: questionAnswered ? 1 : 0,
      questions_correct:   correct ? 1 : 0,
      steps_completed:     stepNumber || 0,
      steps_total:         isCompleted ? (totalSteps || 0) : 0,
      last_attempted_at:   new Date().toISOString(),
      completed_at:        isCompleted ? new Date().toISOString() : null,
    })
    if (insertErr) console.error('child_topic_progress insert error:', insertErr)
  }

  return { isCompleted, isNewBest }
}
