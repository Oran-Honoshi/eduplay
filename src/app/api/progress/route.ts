import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// ── Card auto-award on topic completion ───────────────────────
// When a child completes a topic for the first time, we pick
// a random card they don't yet own from the current active phase
// and unlock it automatically.
async function awardCardForTopicCompletion(supabase: any, childId: string) {
  try {
    // 1. Get all cards this child already owns
    const { data: owned } = await supabase
      .from('child_animal_cards')
      .select('card_id')
      .eq('child_id', childId)

    const ownedIds = new Set((owned || []).map((r: any) => r.card_id))

    // 2. Get all phases ordered by sort_order — find the first incomplete one
    const { data: phases } = await supabase
      .from('card_phases')
      .select('id, slug, cards_needed')
      .order('sort_order')

    if (!phases || phases.length === 0) return null

    // Find active phase: first phase where child hasn't collected all cards
    let activePhaseId: string | null = null
    for (const phase of phases) {
      const { data: phaseCards } = await supabase
        .from('animal_cards')
        .select('id')
        .eq('phase_id', phase.id)

      const phaseCardIds = (phaseCards || []).map((c: any) => c.id)
      const unownedInPhase = phaseCardIds.filter((id: string) => !ownedIds.has(id))

      if (unownedInPhase.length > 0) {
        activePhaseId = phase.id
        break
      }
    }

    if (!activePhaseId) return null // All cards collected!

    // 3. Pick a random unowned card from the active phase
    const { data: availableCards } = await supabase
      .from('animal_cards')
      .select('id, name_en, phase_id')
      .eq('phase_id', activePhaseId)

    const unowned = (availableCards || []).filter((c: any) => !ownedIds.has(c.id))
    if (unowned.length === 0) return null

    // Weighted random: prefer common cards first (lower xp_cost)
    const card = unowned[Math.floor(Math.random() * Math.min(unowned.length, 6))]

    // 4. Award the card
    await supabase.from('child_animal_cards').insert({
      child_id:   childId,
      card_id:    card.id,
      earned_at:  new Date().toISOString(),
      earned_via: 'topic_completion',
    })

    return card // Return so the client can show the unlock animation
  } catch (err) {
    console.error('Card award error:', err)
    return null
  }
}

export async function POST(req: NextRequest) {
  const supabase = createServerClient()
  const body = await req.json()
  const { childId, questionId, topicId, answerGiven, correct, hintUsed, stepNumber, totalSteps } = body

  if (!childId || !topicId) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  try {
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

    // Only award card if this is a FRESH completion (not already completed)
    const wasAlreadyCompleted = existing?.status === 'completed'

    if (existing) {
      const newAttempts = (existing.questions_attempted || 0) + (questionId ? 1 : 0)
      const newCorrect  = (existing.questions_correct || 0) + (correct ? 1 : 0)
      const newSteps    = stepNumber ? Math.max(existing.steps_completed || 0, stepNumber) : existing.steps_completed

      await supabase.from('child_topic_progress').update({
        questions_attempted: newAttempts,
        questions_correct:   newCorrect,
        steps_completed:     newSteps,
        steps_total:         totalSteps || existing.steps_total || 5,
        status:              isCompleted ? 'completed' : 'in_progress',
        completed_at:        isCompleted ? new Date().toISOString() : existing.completed_at,
        last_attempted_at:   new Date().toISOString(),
      }).eq('child_id', childId).eq('topic_id', topicId)
    } else {
      await supabase.from('child_topic_progress').insert({
        child_id:            childId,
        topic_id:            topicId,
        status:              isCompleted ? 'completed' : 'in_progress',
        questions_attempted: questionId ? 1 : 0,
        questions_correct:   correct ? 1 : 0,
        steps_completed:     stepNumber || 0,
        steps_total:         totalSteps || 5,
        last_attempted_at:   new Date().toISOString(),
        completed_at:        isCompleted ? new Date().toISOString() : null,
      })
    }

    // ── Save last active topic on child ────────────────────────
    await supabase.from('children').update({
      last_topic_id:  topicId,
      last_active_at: new Date().toISOString(),
    }).eq('id', childId)

    // ── Auto-award card on first topic completion ──────────────
    let awardedCard = null
    if (isCompleted && !wasAlreadyCompleted) {
      awardedCard = await awardCardForTopicCompletion(supabase, childId)
    }

    return NextResponse.json({
      success:     true,
      xpAwarded:   correct ? 25 : 0,
      // awardedCard is returned to the client so it can show the unlock animation
      awardedCard: awardedCard ? {
        id:      awardedCard.id,
        name_en: awardedCard.name_en,
      } : null,
    })
  } catch (err: any) {
    console.error('Progress API error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const supabase = createServerClient()
  const childId = new URL(req.url).searchParams.get('childId')
  if (!childId) return NextResponse.json({ error: 'Missing childId' }, { status: 400 })

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
