import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

// POST /api/cards/token — award 1 card token on lesson completion
export async function POST(req: NextRequest) {
  const supabase = createServerClient()
  const { childId } = await req.json()
  if (!childId) return NextResponse.json({ error: 'childId required' }, { status: 400 })

  const { data: child } = await supabase
    .from('children')
    .select('card_tokens, xp_total, xp_toward_next_token, xp_per_token')
    .eq('id', childId)
    .single()

  if (!child) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const newTokens = (child.card_tokens || 0) + 1
  const newXpToward = 0 // reset progress bar after earning token

  await supabase.from('children').update({
    card_tokens: newTokens,
    xp_toward_next_token: newXpToward,
  }).eq('id', childId)

  return NextResponse.json({ success: true, newTokens })
}