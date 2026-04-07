import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const supabase = createServerClient()
  const body = await req.json()
  const { childId, questionId, topicId, answerGiven, correct, hintUsed } = body

  if (!childId || !topicId) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  try {
    // Record attempt
    if (questionId) {
      await supabase.from('question_attempts').insert({
        child_id: childId,
        question_id: questionId,
        topic_id: topicId,
        answer_given: answerGiven,
        correct: correct,
        hint_used: hintUsed || false,
      })
    }

    // Award XP if correct
    if (correct) {
      await supabase.rpc('award_xp', { p_child_id: childId, p_amount: 25 })
    }

    // Update topic progress
    const { data: existing } = await supabase
      .from('child_topic_progress')
      .select('*')
      .eq('child_id', childId)
      .eq('topic_id', topicId)
      .single()

    if (existing) {
      await supabase.from('child_topic_progress').update({
        questions_attempted: (existing.questions_attempted || 0) + 1,
        questions_correct:   (existing.questions_correct || 0) + (correct ? 1 : 0),
        status: 'in_progress',
        last_attempted_at: new Date().toISOString(),
      }).eq('child_id', childId).eq('topic_id', topicId)
    } else {
      await supabase.from('child_topic_progress').insert({
        child_id: childId,
        topic_id: topicId,
        status: 'in_progress',
        questions_attempted: 1,
        questions_correct: correct ? 1 : 0,
        steps_completed: 0,
        steps_total: 5,
        last_attempted_at: new Date().toISOString(),
      })
    }

    // Update last_topic on child
    await supabase.from('children').update({
      last_topic_id: topicId,
      last_active_at: new Date().toISOString(),
    }).eq('id', childId)

    return NextResponse.json({ success: true, xpAwarded: correct ? 25 : 0 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
