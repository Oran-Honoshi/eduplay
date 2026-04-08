import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const supabase = createServerClient()
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category')
  const childId = searchParams.get('childId')

  // Fetch store items
  let query = supabase
    .from('store_items')
    .select('*')
    .eq('is_active', true)
    .order('xp_cost')

  if (category) query = query.eq('category', category)

  const { data: items } = await query

  // Fetch child purchases if childId provided
  let purchases: any[] = []
  if (childId) {
    const { data: p } = await supabase
      .from('child_purchases')
      .select('item_id')
      .eq('child_id', childId)
    purchases = (p || []).map((p: any) => p.item_id)
  }

  // Fetch child park if childId provided
  let park = null
  if (childId) {
    const { data: p } = await supabase
      .from('child_park')
      .select('*')
      .eq('child_id', childId)
      .maybeSingle()
    park = p
  }

  return NextResponse.json({ items: items || [], purchases, park })
}

export async function POST(req: NextRequest) {
  const supabase = createServerClient()
  const body = await req.json()
  const { childId, itemId, action, parkData } = body

  if (!childId) return NextResponse.json({ error: 'Missing childId' }, { status: 400 })

  // Update park layout
  if (action === 'update_park' && parkData) {
    const { data: existing } = await supabase
      .from('child_park')
      .select('id')
      .eq('child_id', childId)
      .maybeSingle()

    if (existing) {
      await supabase.from('child_park').update({
        placed_items: parkData.placed_items,
        park_name: parkData.park_name || 'My Amazing Park',
        updated_at: new Date().toISOString(),
      }).eq('child_id', childId)
    } else {
      await supabase.from('child_park').insert({
        child_id: childId,
        placed_items: parkData.placed_items,
        park_name: parkData.park_name || 'My Amazing Park',
      })
    }
    return NextResponse.json({ success: true })
  }

  // Purchase item
  if (!itemId) return NextResponse.json({ error: 'Missing itemId' }, { status: 400 })

  // Get item details
  const { data: item } = await supabase
    .from('store_items')
    .select('*')
    .eq('id', itemId)
    .single()

  if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 })

  // Check child XP
  const { data: child } = await supabase
    .from('children')
    .select('xp_balance, avatar_set')
    .eq('id', childId)
    .single()

  const cost = item.xp_cost || item.xp_price || 0
  if ((child?.xp_balance || 0) < cost) {
    return NextResponse.json({ error: 'Not enough XP!' }, { status: 400 })
  }

  // Check not already purchased
  const { data: existing } = await supabase
    .from('child_purchases')
    .select('id')
    .eq('child_id', childId)
    .eq('item_id', itemId)
    .maybeSingle()

  if (existing) return NextResponse.json({ error: 'Already purchased!' }, { status: 400 })

  // Deduct XP
  await supabase.from('children').update({
    xp_balance: (child?.xp_balance || 0) - cost,
  }).eq('id', childId)

  // Record purchase
  await supabase.from('child_purchases').insert({
    child_id: childId,
    item_id: itemId,
    xp_spent: cost,
  })

  // Apply avatar set if applicable
  if (item.category === 'avatar_set') {
    await supabase.from('children').update({
      avatar_set: item.set_name,
    }).eq('id', childId)
  }

  // Create park if first park item
  if (item.category === 'park_item') {
    const { data: park } = await supabase
      .from('child_park')
      .select('id')
      .eq('child_id', childId)
      .maybeSingle()

    if (!park) {
      await supabase.from('child_park').insert({
        child_id: childId,
        placed_items: [],
        park_name: 'My Amazing Park',
      })
    }
  }

  return NextResponse.json({ success: true, newXP: (child?.xp_balance || 0) - cost })
}
