import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase'
import { requireOwnChildSession } from '@/lib/session'

// POST /api/cards/token — award 1 card token on lesson completion
export async function POST(req: NextRequest) {
  const supabase = createServiceRoleClient()
  const { childId } = await req.json()
  if (!childId) return NextResponse.json({ error: 'childId required' }, { status: 400 })

  const auth = await requireOwnChildSession(childId)
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.status === 401 ? 'Unauthorized' : 'Forbidden' },
      { status: auth.status }
    )
  }

  const { data: child } = await supabase
    .from('children')
    .select('card_tokens')
    .eq('id', childId)
    .single()

  if (!child) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const newTokens = (child.card_tokens || 0) + 1

  await supabase.from('children').update({
    card_tokens: newTokens,
  }).eq('id', childId)

  return NextResponse.json({ success: true, newTokens })
}