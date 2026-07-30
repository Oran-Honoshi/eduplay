import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase'
import { authorizeChildAccess } from '@/lib/session'

// FIXED (2026-07-28): `correct` used to be a client-supplied boolean, trusted verbatim
// (this route never re-queried `questions`/`options` to verify the claim before writing
// `question_attempts` or awarding XP — a modified client, or a crafted request with a
// real childId/session but a fabricated `correct: true`, could farm XP and progress with
// zero actually-correct answers). Now re-derived below from the question's own `options`,
// matching `answerGiven` against `options[].label` and reading `isCorrect` — the same
// source of truth the lesson UI itself uses (src/app/lesson/client.tsx's checkAnswer).
// `correct_answer` on the questions table is unused for grading and inconsistently
// formatted, so `options[].isCorrect` remains the right field to check. The
// client-supplied `correct` in the body is now ignored whenever questionId is present;
// it's only still read as-is for the questionId-less step-completion POST (nextStep()),
// which carries no question to verify against.
export async function POST(req: NextRequest) {
  const supabase = createServiceRoleClient()
  const body = await req.json()
  const { childId, questionId, topicId, answerGiven, hintUsed, stepNumber, totalSteps } = body
  let { correct } = body

  if (!childId || !topicId) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const auth = await authorizeChildAccess(childId)
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.status === 401 ? 'Unauthorized' : 'Forbidden' },
      { status: auth.status }
    )
  }

  try {
    // ── Re-derive correctness server-side ──────────────────────
    if (questionId) {
      const { data: question } = await supabase
        .from('questions').select('options').eq('id', questionId).single()
      const matchedOption = Array.isArray(question?.options)
        ? question.options.find((o: any) => o.label === answerGiven)
        : null
      correct = !!matchedOption?.isCorrect
    }

    // ── Record question attempt ────────────────────────────────
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

    // ── Award XP if correct ────────────────────────────────────
    if (correct) {
      await supabase.rpc('award_xp', { p_child_id: childId, p_amount: 25 })
    }

    // ── Update streak ──────────────────────────────────────────
    await supabase.rpc('update_streak', { p_child_id: childId })

    // ── Upsert topic progress ──────────────────────────────────
    const { data: existing } = await supabase
      .from('child_topic_progress')
      .select('*')
      .eq('child_id', childId)
      .eq('topic_id', topicId)
      .maybeSingle()

    const isCompleted = !!(stepNumber && totalSteps && stepNumber >= totalSteps)

    // `steps_total` doubles as the topic's personal-best step count, gating card-token
    // awards below — it must only be written AT completion, never on the mid-lesson
    // attempt calls that precede it. Every call in an attempt (not just the last one)
    // carries the same `totalSteps`, so writing it on every call would let an attempt
    // stamp its own totalSteps as the "prior" best before it actually finishes,
    // making its own completion look like a repeat instead of a genuine new best.
    let isNewBest = false

    if (existing) {
      const newAttempts = (existing.questions_attempted || 0) + (questionId ? 1 : 0)
      const newCorrect  = (existing.questions_correct || 0) + (correct ? 1 : 0)
      const newSteps    = stepNumber ? Math.max(existing.steps_completed || 0, stepNumber) : existing.steps_completed

      const priorBestSteps = existing.steps_total || 0
      isNewBest = isCompleted && totalSteps > priorBestSteps
      // Math.max, not overwrite: without this, replaying the regular (shorter) lesson
      // after a bonus round would silently drop steps_total back down, making the next
      // bonus completion look like a fresh personal best and re-award a token for a
      // topic that was already at its true high-water mark.
      const newStepsTotal = isCompleted ? Math.max(totalSteps, priorBestSteps) : existing.steps_total

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
      isNewBest = isCompleted && totalSteps > 0
      await supabase.from('child_topic_progress').insert({
        child_id:            childId,
        topic_id:            topicId,
        status:              isCompleted ? 'completed' : 'in_progress',
        questions_attempted: questionId ? 1 : 0,
        questions_correct:   correct ? 1 : 0,
        steps_completed:     stepNumber || 0,
        steps_total:         isCompleted ? totalSteps : null,
        last_attempted_at:   new Date().toISOString(),
        completed_at:        isCompleted ? new Date().toISOString() : null,
      })
    }

    // ── Save last active topic on child ────────────────────────
    await supabase.from('children').update({
      last_topic_id:  topicId,
      last_active_at: new Date().toISOString(),
    }).eq('id', childId)

    return NextResponse.json({
      success:   true,
      xpAwarded: correct ? 25 : 0,
      isNewBest, // true only on the completion call that beats this topic's prior steps_total personal best
    })
  } catch (err: any) {
    console.error('Progress API error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const supabase = createServiceRoleClient()
  const childId = new URL(req.url).searchParams.get('childId')
  if (!childId) return NextResponse.json({ error: 'Missing childId' }, { status: 400 })

  const auth = await authorizeChildAccess(childId)
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.status === 401 ? 'Unauthorized' : 'Forbidden' },
      { status: auth.status }
    )
  }

  const { data: progress } = await supabase
    .from('child_topic_progress')
    .select('*, topic:topics(title_en, title_he, slug, subject:subjects(slug, label_en))')
    .eq('child_id', childId)

  const { data: child } = await supabase
    .from('children')
    .select('xp_balance, xp_total, streak_current')
    .eq('id', childId)
    .single()

  return NextResponse.json({
    progress: progress || [],
    xp:       child?.xp_balance || 0,
    streak:   child?.streak_current || 0,
  })
}
