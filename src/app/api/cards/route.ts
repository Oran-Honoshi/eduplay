import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const supabase = createServerClient()
  const childId = req.nextUrl.searchParams.get('childId')
  if (!childId) return NextResponse.json({ error: 'childId required' }, { status: 400 })

  const [{ data: phases }, { data: cards }, { data: owned }] = await Promise.all([
    supabase.from('card_phases').select('*').eq('is_active', true).order('sort_order'),
    supabase.from('animal_cards').select('*').eq('is_active', true).order('sort_order'),
    supabase.from('child_animal_cards').select('card_id').eq('child_id', childId),
  ])

  return NextResponse.json({
    phases: phases || [],
    cards: cards || [],
    ownedIds: (owned || []).map((r: any) => r.card_id),
  })
}

export async function POST(req: NextRequest) {
  const supabase = createServerClient()
  const { childId, cardId, useToken } = await req.json()
  if (!childId || !cardId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  // Get child token balance
  const { data: child } = await supabase
    .from('children').select('card_tokens, display_name').eq('id', childId).single()
  if (!child) return NextResponse.json({ error: 'Child not found' }, { status: 404 })
  if ((child.card_tokens ?? 0) < 1) return NextResponse.json({ error: 'No card tokens available' }, { status: 400 })

  // Check not already owned
  const { data: existing } = await supabase
    .from('child_animal_cards').select('id').eq('child_id', childId).eq('card_id', cardId).maybeSingle()
  if (existing) return NextResponse.json({ error: 'Already owned' }, { status: 400 })

  // Deduct 1 token and grant card
  const newTokens = (child.card_tokens ?? 1) - 1
  const [tokenResult, cardResult] = await Promise.all([
    supabase.from('children').update({ card_tokens: newTokens }).eq('id', childId),
    supabase.from('child_animal_cards').insert({ child_id: childId, card_id: cardId }),
  ])

  if (tokenResult.error || cardResult.error) {
    return NextResponse.json({ error: 'Collection failed' }, { status: 500 })
  }

  return NextResponse.json({ success: true, newTokens })
}
