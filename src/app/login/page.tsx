import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const supabase = createServerClient()
  const familyId = new URL(req.url).searchParams.get('familyId')
    || '11111111-1111-1111-1111-111111111111'

  const { data: parents } = await supabase
    .from('family_parents')
    .select('id, name, email, avatar_emoji, role, sort_order')
    .eq('family_id', familyId)
    .order('sort_order')

  return NextResponse.json({ parents: parents || [] })
}

export async function POST(req: NextRequest) {
  const supabase = createServerClient()
  const body = await req.json()
  const { familyId, name, email, password, avatar_emoji, role } = body

  // Max 3 parents check
  const { data: existing } = await supabase
    .from('family_parents')
    .select('id')
    .eq('family_id', familyId)

  if ((existing?.length || 0) >= 3) {
    return NextResponse.json({ error: 'Maximum 3 parents per family' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('family_parents')
    .insert({
      family_id: familyId,
      name,
      email,
      password,
      avatar_emoji: avatar_emoji || '👤',
      role: role || 'parent',
      sort_order: (existing?.length || 0) + 1,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, parent: data })
}

export async function PATCH(req: NextRequest) {
  const supabase = createServerClient()
  const body = await req.json()
  const { parentId, name, email, password, avatar_emoji } = body

  const updates: any = {}
  if (name) updates.name = name
  if (email) updates.email = email
  if (password) updates.password = password
  if (avatar_emoji) updates.avatar_emoji = avatar_emoji

  await supabase.from('family_parents').update(updates).eq('id', parentId)
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const supabase = createServerClient()
  const parentId = new URL(req.url).searchParams.get('parentId')
  if (!parentId) return NextResponse.json({ error: 'Missing parentId' }, { status: 400 })

  await supabase.from('family_parents').delete().eq('id', parentId)
  return NextResponse.json({ success: true })
}
