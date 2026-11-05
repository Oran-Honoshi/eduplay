import { answersMatch } from '@/lib/answerMatch'
import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase'
import { authorizeChildAccess } from '@/lib/session'
import { creditTopicProgress } from '@/lib/progressCredit'

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
  const { childId, questionId, passageQuestionId, topicId, answerGiven, hintUsed, stepNumber, totalSteps } = body
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
    // Passage-quiz answers (passageQuestionId) come from `passage_questions` — a separate
    // table the reading-passage generator writes to, not the regular `questions` pool.
    // Re-derive against whichever table the answer actually belongs to; same anti-cheat
    // principle as the questionId branch (never trust a client-supplied `correct`).
    if (questionId) {
      const { data: question } = await supabase
        .from('questions').select('options, correct_answer').eq('id', questionId).single()
      const hasOptions = Array.isArray(question?.options) && question.options.length > 0
      if (hasOptions) {
        const matchedOption = question.options.find((o: any) => o.label === answerGiven)
        correct = !!matchedOption?.isCorrect
      } else {
        // Word problems have no options: grade the typed answer, accepting
        // equivalent forms (4/5 = 8/10, 0.5 = 1/2, units optional).
        correct = answersMatch(String(answerGiven ?? ''), String(question?.correct_answer ?? ''))
      }
    } else if (passageQuestionId) {
      const { data: passageQuestion } = await supabase
        .from('passage_questions').select('options').eq('id', passageQuestionId).single()
      const matchedOption = Array.isArray(passageQuestion?.options)
        ? passageQuestion.options.find((o: any) => o.label === answerGiven)
        : null
      correct = !!matchedOption?.isCorrect
    }

    // ── Record question attempt ────────────────────────────────
    // `question_attempts.question_id` has a hard NOT-NULL FK to `questions.id`, so a
    // passage_questions row (separate table, separate id space) can't be inserted here.
    // Passage-quiz attempts skip this raw audit-log row; XP/streak/progress below still
    // apply the same as any other answer. Known, deliberate gap — not a silent omission.
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

    // ── Update streak ──────────────────────────────────────────
    // FIXED (2026-08-03): this used to run after award_xp below. award_xp unconditionally
    // stamps last_active_at = now() as a side effect, and update_streak decides
    // extend/reset/same-day purely by reading last_active_at's existing date — so on the
    // day's first correct answer, award_xp running first silently erased the "was this
    // already updated today" signal before update_streak ever read it, meaning the streak
    // could never advance from a correct answer, only from a wrong one (or a step-only
    // call with no XP). award_xp never reads last_active_at itself, so running
    // update_streak first has no effect on it — safe reorder, not a behavior change to XP.
    await supabase.rpc('update_streak', { p_child_id: childId })

    // ── Award XP if correct ────────────────────────────────────
    if (correct) {
      await supabase.rpc('award_xp', { p_child_id: childId, p_amount: 25 })
    }

    // ── Upsert topic progress (shared with the assignment-completion flow) ──
    const { isNewBest } = await creditTopicProgress(supabase, {
      childId, topicId, stepNumber, totalSteps,
      questionAnswered: !!questionId, correct,
    })

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
