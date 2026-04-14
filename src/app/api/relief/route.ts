import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const supabase = createServerClient()
  const { searchParams } = new URL(req.url)
  const childId = searchParams.get('childId')
  const grade   = parseInt(searchParams.get('grade') || '0')
  const theme   = searchParams.get('theme') || 'mixed'
  const type    = searchParams.get('type') // 'exercise' | 'brain_game' | 'video' | null

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
  const supabase = createServerClient()
  const body = await req.json()
  const { childId, activityId, xpSpent } = body

  if (!childId || !activityId) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  if (xpSpent > 0) {
    const { data: child } = await supabase
      .from('children')
      .select('xp_balance')
      .eq('id', childId)
      .single()

    if ((child?.xp_balance || 0) < xpSpent) {
      return NextResponse.json({ error: 'Not enough XP' }, { status: 400 })
    }

    await supabase.from('children').update({
      xp_balance: (child?.xp_balance || 0) - xpSpent,
    }).eq('id', childId)
  }

  await supabase.from('child_relief_history').insert({
    child_id: childId,
    activity_id: activityId,
    xp_spent: xpSpent || 0,
  })

  return NextResponse.json({ success: true })
}