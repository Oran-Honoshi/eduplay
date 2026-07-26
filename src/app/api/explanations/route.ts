import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET() {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('topic_explanations')
    .select('topic_slug, subject, grade, title_en, title_he')
    .order('subject').order('grade').order('title_en')
  return NextResponse.json(data || [])
}
