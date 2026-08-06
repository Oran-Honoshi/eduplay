import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const supabase = createServerClient()
  const { searchParams } = new URL(req.url)

  const grade   = searchParams.get('grade')
  const subject = searchParams.get('subject')

  if (!subject) {
    return NextResponse.json({ error: 'subject required' }, { status: 400 })
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

    // `grade` is optional: omitting it returns every grade for the subject
    // (used by the worksheet builder's cross-grade topic picker), ordering by
    // grade first so callers that want the full list can group by grade
    // without a client-side sort. Existing single-grade callers (curriculum
    // explorer) are unaffected — they always pass grade explicitly.
    let query = supabase
      .from('topics')
      .select('*')
      .eq('subject_id', subjectData.id)
    if (grade) query = query.eq('grade', parseInt(grade))
    const { data: topics, error } = await query.order('grade').order('sort_order')

    if (error) throw error

    return NextResponse.json({ topics: topics || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
