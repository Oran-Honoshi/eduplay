import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase'
import { requireParentOnlySession } from '@/lib/session'

// ─── POST /api/notebook/sections/[id]/questions ────────────────
// Parent-only, family-scoped: links existing approved questions to a
// section (e.g. from the Library tab's "Add to Notebook Section" action).
// Body: { questionIds: string[] }
// Duplicate links (same section+question already linked) are silently
// no-op'd via the DB's unique(section_id, question_id) + ignoreDuplicates,
// mirroring insertQuestions.ts's dedupe-on-upsert pattern.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireParentOnlySession()
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.status === 401 ? 'Unauthorized' : 'Forbidden' },
      { status: auth.status }
    )
  }

  const supabase = createServiceRoleClient()

  const { data: section } = await supabase
    .from('notebook_sections')
    .select('id, family_id')
    .eq('id', params.id)
    .maybeSingle()

  if (!section) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (section.family_id !== auth.parent.familyId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { questionIds } = body

  if (!Array.isArray(questionIds) || questionIds.length === 0) {
    return NextResponse.json({ error: 'questionIds must be a non-empty array' }, { status: 400 })
  }

  const { data: validQuestions, error: validateError } = await supabase
    .from('questions')
    .select('id')
    .in('id', questionIds)
    .eq('approved', true)

  if (validateError) return NextResponse.json({ error: validateError.message }, { status: 500 })

  const validIds = new Set((validQuestions || []).map(q => q.id))
  const invalidIds = questionIds.filter((id: string) => !validIds.has(id))
  if (invalidIds.length > 0) {
    return NextResponse.json(
      { error: 'Some selected questions are not linkable (must be approved)', invalidIds },
      { status: 400 }
    )
  }

  const rows = questionIds.map((questionId: string) => ({
    section_id: section.id,
    question_id: questionId,
    added_via: 'manual',
  }))

  const { error } = await supabase
    .from('notebook_section_questions')
    .upsert(rows, { onConflict: 'section_id,question_id', ignoreDuplicates: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, linked: rows.length }, { status: 201 })
}
