import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase'
import { requireParentOnlySession } from '@/lib/session'

// ─── GET /api/questions/pending ────────────────────────────────
// Lists unapproved (approved:false) questions for review, newest first.
// Deliberately NOT scoped to the caller's family — questions/topics are a
// shared curriculum bank across all families (see supabase.ts), so review
// is shared too. Accepted tradeoff, not an oversight.

export async function GET() {
  const auth = await requireParentOnlySession()
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.status === 401 ? 'Unauthorized' : 'Forbidden' },
      { status: auth.status }
    )
  }

  const { data, error } = await createServiceRoleClient()
    .from('questions')
    .select(`
      id, topic_id, difficulty, q_type, prompt_en, prompt_he,
      options, correct_answer, hint_en, explanation_en, created_at,
      topics ( title_en, grade, subjects ( label_en, slug ) )
    `)
    .eq('approved', false)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ questions: data || [] })
}
