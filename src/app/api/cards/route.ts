import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/cards?childId=xxx  — phases + cards + ownership
export async function GET(req: NextRequest) {
  const childId = req.nextUrl.searchParams.get('childId')
  if (!childId) return NextResponse.json({ error: 'childId required' }, { status: 400 })

  const [{ data: phases }, { data: cards }, { data: owned }] = await Promise.all([
    supabase.from('card_phases').select('*').eq('is_active', true).order('sort_order'),
    supabase.from('animal_cards').select('*').eq('is_active', true).order('sort_order'),
    supabase.from('child_animal_cards').select('card_id, obtained_at').eq('child_id', childId),
  ])

  const ownedIds = new Set((owned || []).map((r: any) => r.card_id))

  return NextResponse.json({ phases: phases || [], cards: cards || [], ownedIds: [...ownedIds] })
}

// POST /api/cards  — purchase a card with XP
export async function POST(req: NextRequest) {
  const { childId, cardId } = await req.json()
  if (!childId || !cardId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  // Get card cost + child XP balance
  const [{ data: card }, { data: child }] = await Promise.all([
    supabase.from('animal_cards').select('xp_cost, name_en').eq('id', cardId).single(),
    supabase.from('children').select('xp_balance').eq('id', childId).single(),
  ])

  if (!card || !child) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const balance = child.xp_balance ?? 0
  if (balance < card.xp_cost) {
    return NextResponse.json({ error: 'Not enough XP', needed: card.xp_cost, have: balance }, { status: 400 })
  }

  // Check not already owned
  const { data: existing } = await supabase
    .from('child_animal_cards')
    .select('id')
    .eq('child_id', childId)
    .eq('card_id', cardId)
    .maybeSingle()

  if (existing) return NextResponse.json({ error: 'Already owned' }, { status: 400 })

  // Deduct XP and grant card in one transaction-like sequence
  const newBalance = balance - card.xp_cost

  const [xpResult, cardResult] = await Promise.all([
    supabase.from('children').update({ xp_balance: newBalance }).eq('id', childId),
    supabase.from('child_animal_cards').insert({ child_id: childId, card_id: cardId, xp_spent: card.xp_cost }),
  ])

  if (xpResult.error || cardResult.error) {
    return NextResponse.json({ error: 'Purchase failed' }, { status: 500 })
  }

  return NextResponse.json({ success: true, newXP: newBalance, cardName: card.name_en })
}
