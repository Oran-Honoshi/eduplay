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
    // Grade 7+: the shared on-request bank — topic first, grade only a tag.
    // Topics already used for this grade come first, then the rest.
    const g = grade ? parseInt(grade) : NaN
    if (Number.isFinite(g) && g >= 7) {
      const { data: bank, error: bankErr } = await supabase
        .from('topics').select('*')
        .eq('subject_id', subjectData.id).eq('origin', 'on_request')
        .order('title_en')
      if (bankErr) throw bankErr
      const rows = (bank || []).sort((a: any, b: any) =>
        Number((b.grades || []).includes(g)) - Number((a.grades || []).includes(g)))
      return NextResponse.json({ topics: rows, on_request: true })
    }

    let query = supabase
      .from('topics')
      .select('*')
      .eq('subject_id', subjectData.id)
    // a specific K–6 grade → its curated topics; no grade → everything (worksheet builder)
    if (grade) query = query.eq('grade', parseInt(grade)).eq('origin', 'curated')
    const { data: topics, error } = await query.order('grade').order('sort_order')

    if (error) throw error

    return NextResponse.json({ topics: topics || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
