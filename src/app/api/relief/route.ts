import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createServiceRoleClient } from '@/lib/supabase'
import { getSession, requireOwnChildSession } from '@/lib/session'

// Generic activity content, not per-child data — any authenticated session (child or
// parent) can read it, no ownership check needed.
export async function GET(req: NextRequest) {
  const { child, parent } = await getSession()
  if (!child && !parent) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createServerClient()
  const { searchParams } = new URL(req.url)
  const grade = parseInt(searchParams.get('grade') || '0')
  const theme = searchParams.get('theme') || 'mixed'
  const type  = searchParams.get('type') // 'exercise' | 'brain_game' | 'video' | null

  let query = supabase
    .from('relief_activities')
    .select('*')
    .eq('is_active', true)
    .lte('min_grade', grade)
    .gte('max_grade', grade)

  if (type) query = query.eq('type', type)
  if (theme !== 'mixed') query = query.eq('theme', theme)

  const { data: activities } = await query

  if (!activities || activities.length === 0) {
    // Fallback — ignore theme filter
    const { data: fallback } = await supabase
      .from('relief_activities')
      .select('*')
      .eq('is_active', true)
      .lte('min_grade', grade)
      .gte('max_grade', grade)
      .eq('type', type || 'exercise')
    
    const activity = fallback && fallback.length > 0
      ? fallback[Math.floor(Math.random() * fallback.length)]
      : null
    return NextResponse.json({ activity })
  }

  const activity = activities[Math.floor(Math.random() * activities.length)]
  return NextResponse.json({ activity })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { childId, activityId } = body

  if (!childId || !activityId) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const auth = await requireOwnChildSession(childId)
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.status === 401 ? 'Unauthorized' : 'Forbidden' },
      { status: auth.status }
    )
  }

  const supabase = createServiceRoleClient()

  // Cost and reward are both looked up server-side from the activity, never trusted
  // from the client — the request body has no xpSpent field to spoof in the first
  // place. Reward is granted for reaching this route at all — the frontend only
  // calls it from the natural countdown-finish and "Done Early" paths, never from
  // skip(), so simply not skipping is what earns it.
  const { data: activity } = await supabase
    .from('relief_activities')
    .select('xp_cost, xp_reward')
    .eq('id', activityId)
    .single()

  const cost = activity?.xp_cost || 0
  const reward = activity?.xp_reward || 0

  if (cost > 0 || reward > 0) {
    const { data: child } = await supabase
      .from('children')
      .select('xp_balance')
      .eq('id', childId)
      .single()

    if (cost > 0 && (child?.xp_balance || 0) < cost) {
      return NextResponse.json({ error: 'Not enough XP' }, { status: 400 })
    }

    await supabase.from('children').update({
      xp_balance: (child?.xp_balance || 0) - cost + reward,
    }).eq('id', childId)
  }

  await supabase.from('child_relief_history').insert({
    child_id: childId,
    activity_id: activityId,
    xp_spent: cost,
    xp_earned: reward,
  })

  return NextResponse.json({ success: true, xpEarned: reward })
}