import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

const FAMILY_ID = '11111111-1111-1111-1111-111111111111'

export async function POST(req: NextRequest) {
  const supabase = createServerClient()
  const body = await req.json()
  const { pin, password } = body

  // Child PIN login
  if (pin) {
    const { data: children } = await supabase
      .from('children')
      .select('id, display_name, access_token, pin_code, grade, theme')
      .eq('family_id', FAMILY_ID)

    const child = (children || []).find((c: any) => c.pin_code === pin)

    if (!child) {
      return NextResponse.json({ error: 'Wrong PIN — try again! 🔢' }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      type: 'child',
      child: {
        id: child.id,
        name: child.display_name,
        token: child.access_token,
        grade: child.grade,
        theme: child.theme,
      }
    })
  }

  // Parent password login
if (password) {
  const { data: parentProfile } = await supabase
    .from('family_parents')
    .select('id, name, password, role, avatar_emoji')
    .eq('family_id', FAMILY_ID)
    .maybeSingle()

  // Check individual parent password first
  const { data: allParents } = await supabase
    .from('family_parents')
    .select('id, name, password, role, avatar_emoji')
    .eq('family_id', FAMILY_ID)

  const matchingParent = (allParents || []).find((p: any) => p.password === password)

  if (matchingParent) {
    return NextResponse.json({
      success: true,
      type: 'parent',
      familyId: FAMILY_ID,
      parentId: matchingParent.id,
      parentName: matchingParent.name,
    })
  }

  // Fallback to family password
  const { data: family } = await supabase
    .from('families')
    .select('id, parent_password')
    .eq('id', FAMILY_ID)
    .maybeSingle()

  const correctPassword = family?.parent_password || 'eduplay2024'
  if (password !== correctPassword) {
    return NextResponse.json({ error: 'Wrong password — try again! 🔑' }, { status: 401 })
  }

  return NextResponse.json({
    success: true,
    type: 'parent',
    familyId: FAMILY_ID,
  })
}

  return NextResponse.json({ error: 'PIN or password required' }, { status: 400 })
}
