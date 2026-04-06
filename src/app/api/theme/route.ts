import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const supabase = createServerClient()
  const { childId, theme } = await req.json()

  if (!childId || !theme) {
    return NextResponse.json({ error: 'childId and theme required' }, { status: 400 })
  }

  const validThemes = ['minecraft', 'princesses', 'adventure', 'space', 'lego', 'sports', 'plain']
  if (!validThemes.includes(theme)) {
    return NextResponse.json({ error: 'Invalid theme' }, { status: 400 })
  }

  try {
    const { error } = await supabase
      .from('children')
      .update({ theme })
      .eq('id', childId)

    if (error) throw error
    return NextResponse.json({ success: true, theme })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
