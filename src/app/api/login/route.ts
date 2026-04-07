import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const supabase = createServerClient()
  const body = await req.json()
  const { pin, password, familyId } = body

  const fid = familyId || '11111111-1111-1111-1111-111111111111'

  // Child PIN login
  if (pin) {
    const { data: child } = await supabase
      .from('children')
      .select('id, display_name, access_token, pin_code, grade, theme')
      .eq('pin_code', pin)
      .eq('family_id', fid)
      .single()

    if (!child) {
      return NextResponse.json({ error: 'Wrong PIN — try again!' }, { status: 401 })
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
    const { data: family } = await supabase
      .from('families')
      .select('id, parent_password, name')
      .eq('id', fid)
      .single()

    if (!family || family.parent_password !== password) {
      return NextResponse.json({ error: 'Wrong password — try again!' }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      type: 'parent',
      familyId: family.id,
    })
  }

  return NextResponse.json({ error: 'PIN or password required' }, { status: 400 })
}
