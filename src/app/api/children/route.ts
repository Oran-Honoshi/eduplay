import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const supabase = createServerClient()
  const childId = req.nextUrl.searchParams.get('childId')
  if (!childId) return NextResponse.json({ error: 'childId required' }, { status: 400 })

  const { data: child, error } = await supabase
    .from('children')
    .select('id, display_name, xp_total, xp_balance, xp_toward_next_token, xp_per_token, card_tokens, card_collect_mode, grade, theme')
    .eq('id', childId)
    .single()

  if (error || !child) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ child })
}

export async function PATCH(req: NextRequest) {
  const supabase = createServerClient()
  const { childId, card_collect_mode } = await req.json()
  if (!childId) return NextResponse.json({ error: 'childId required' }, { status: 400 })

  const validModes = ['choice', 'region_random', 'full_random']
  if (card_collect_mode && !validModes.includes(card_collect_mode)) {
    return NextResponse.json({ error: 'Invalid mode' }, { status: 400 })
  }

  const { error } = await supabase
    .from('children').update({ card_collect_mode }).eq('id', childId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
