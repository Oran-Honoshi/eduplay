import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const supabase = createServerClient()
  const childId = req.nextUrl.searchParams.get('childId')
  if (!childId) return NextResponse.json({ error: 'childId required' }, { status: 400 })

  const { data: child, error } = await supabase
    .from('children')
    .select('id, display_name, xp_total, xp_balance, xp_toward_next_token, xp_per_token, card_tokens, card_collect_mode, grade, theme, font_size, lang_screen, pin_code, relief_trigger')
    .eq('id', childId)
    .single()

  if (error || !child) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ child })
}

export async function PATCH(req: NextRequest) {
  const supabase = createServerClient()
  const body = await req.json()
  const { childId } = body
  if (!childId) return NextResponse.json({ error: 'childId required' }, { status: 400 })

  const allowed = ['grade','theme','font_size','lang_screen','pin_code','relief_trigger','card_collect_mode','card_tokens','xp_toward_next_token']
  const update: Record<string, any> = {}
  for (const field of allowed) {
    if (body[field] !== undefined) update[field] = body[field]
  }

  if (update.card_collect_mode && !['choice','region_random','full_random'].includes(update.card_collect_mode))
    return NextResponse.json({ error: 'Invalid card_collect_mode' }, { status: 400 })
  if (update.theme && !['plain','minecraft','princesses','adventure','space','sports'].includes(update.theme))
    return NextResponse.json({ error: 'Invalid theme' }, { status: 400 })
  if (update.font_size && !['small','medium','large','xl'].includes(update.font_size))
    return NextResponse.json({ error: 'Invalid font_size' }, { status: 400 })
  if (update.grade !== undefined && (update.grade < 0 || update.grade > 6))
    return NextResponse.json({ error: 'Invalid grade' }, { status: 400 })
  if (Object.keys(update).length === 0)
    return NextResponse.json({ error: 'No valid fields' }, { status: 400 })

  const { error } = await supabase.from('children').update(update).eq('id', childId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, updated: Object.keys(update) })
}