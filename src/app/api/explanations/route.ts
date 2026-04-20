import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const supabase = createClient(
    'https://jbbkwomcyvuzdtagogut.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiYmt3b21jeXZ1emR0YWdvZ3V0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0OTUyMzYsImV4cCI6MjA5MTA3MTIzNn0.lKzQTIugcbmI4kua6Y4PSaLXyqCYKxxmfQpArX3vvG4'
  )
  const { data } = await supabase
    .from('topic_explanations')
    .select('topic_slug, subject, grade, title_en, title_he')
    .order('subject').order('grade').order('title_en')
  return NextResponse.json(data || [])
}
