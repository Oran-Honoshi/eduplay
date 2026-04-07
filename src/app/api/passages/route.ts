import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const supabase = createServerClient()
  const { searchParams } = new URL(req.url)

  const grade      = searchParams.get('grade')
  const subjectId  = searchParams.get('subjectId')
  const passageId  = searchParams.get('passageId')

  try {
    // Fetch single passage with questions
    if (passageId) {
      const { data: passage } = await supabase
        .from('reading_passages')
        .select('*')
        .eq('id', passageId)
        .eq('approved', true)
        .single()

      const { data: questions } = await supabase
        .from('passage_questions')
        .select('*')
        .eq('passage_id', passageId)
        .eq('approved', true)
        .order('sort_order')

      return NextResponse.json({ passage, questions: questions || [] })
    }

    // Fetch all passages for grade + subject
    if (!grade || !subjectId) {
      return NextResponse.json({ error: 'grade and subjectId required' }, { status: 400 })
    }

    const { data: passages } = await supabase
      .from('reading_passages')
      .select('id, title_en, title_he, passage_type, grade, is_rtl')
      .eq('grade', parseInt(grade))
      .eq('subject_id', subjectId)
      .eq('approved', true)
      .order('created_at')

    return NextResponse.json({ passages: passages || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
