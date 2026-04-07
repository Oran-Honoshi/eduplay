import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const supabase = createServerClient()
  const body = await req.json()
  const { childId, questionId, topicId, answerGiven, correct, hintUsed, stepNumber, totalSteps } = body

  if (!childId || !topicId) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  try {
    // Record the question attempt
    if (questionId) {
      await supabase.from('question_attempts').insert({
        child_id:     childId,
        question_id:  questionId,
        topic_id:     topicId,
        answer_given: answerGiven,
        correct:      correct,
        hint_used:    hintUsed || false,
      })
    }

    // Award XP if correct
if (correct) {
  await supabase.rpc('award_xp', { p_child_id: childId, p_amount: 25 })
}

// Always update streak on activity
await supabase.rpc('update_streak', { p_child_id: childId })
    

    // Upsert topic progress — saves mid-lesson position
    const { data: existing } = await supabase
      .from('child_topic_progress')
      .select('*')
      .eq('child_id', childId)
      .eq('topic_id', topicId)
      .maybeSingle()

    if (existing) {
      const newAttempts = (existing.questions_attempted || 0) + (questionId ? 1 : 0)
      const newCorrect  = (existing.questions_correct || 0) + (correct ? 1 : 0)
      const newSteps    = stepNumber ? Math.max(existing.steps_completed || 0, stepNumber) : existing.steps_completed

      // Mark completed if all steps done
      const isCompleted = stepNumber && totalSteps && stepNumber >= totalSteps
      const newStatus   = isCompleted ? 'completed' : 'in_progress'

      await supabase.from('child_topic_progress').update({
        questions_attempted: newAttempts,
        questions_correct:   newCorrect,
        steps_completed:     newSteps,
        steps_total:         totalSteps || existing.steps_total || 5,
        status:              newStatus,
        completed_at:        isCompleted ? new Date().toISOString() : existing.completed_at,
        last_attempted_at:   new Date().toISOString(),
      }).eq('child_id', childId).eq('topic_id', topicId)
    } else {
      await supabase.from('child_topic_progress').insert({
        child_id:            childId,
        topic_id:            topicId,
        status:              'in_progress',
        questions_attempted: questionId ? 1 : 0,
        questions_correct:   correct ? 1 : 0,
        steps_completed:     stepNumber || 0,
        steps_total:         totalSteps || 5,
        last_attempted_at:   new Date().toISOString(),
      })
    }

    // Save last topic + active timestamp on child record
    await supabase.from('children').update({
      last_topic_id:   topicId,
      last_active_at:  new Date().toISOString(),
    }).eq('id', childId)

    return NextResponse.json({ success: true, xpAwarded: correct ? 25 : 0 })
  } catch (err: any) {
    console.error('Progress API error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
