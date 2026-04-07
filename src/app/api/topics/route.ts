import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const supabase = createServerClient()
  const { searchParams } = new URL(req.url)

  const grade   = searchParams.get('grade')
  const subject = searchParams.get('subject')

  if (!grade || !subject) {
    return NextResponse.json({ error: 'grade and subject required' }, { status: 400 })
  }

  try {
    const { data: subjectData } = await supabase
      .from('subjects')
      .select('id')
      .eq('slug', subject)
      .single()

    if (!subjectData) {
      return NextResponse.json({ topics: [] })
    }

    const { data: topics, error } = await supabase
      .from('topics')
      .select('*')
      .eq('subject_id', subjectData.id)
      .eq('grade', parseInt(grade))
      .order('sort_order')

    if (error) throw error

    return NextResponse.json({ topics: topics || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
