import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function PATCH(req: NextRequest) {
  const supabase = createServerClient()
  const body = await req.json()
  const { childId, grade, theme } = body

  if (!childId) {
    return NextResponse.json({ error: 'Missing childId' }, { status: 400 })
  }

  const updates: any = {}
  if (grade !== undefined) updates.grade = grade
  if (theme !== undefined) updates.theme = theme

  const { error } = await supabase
    .from('children')
    .update(updates)
    .eq('id', childId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
