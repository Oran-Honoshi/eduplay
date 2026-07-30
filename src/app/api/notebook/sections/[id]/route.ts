import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase'
import { requireParentOnlySession } from '@/lib/session'

// ─── GET /api/notebook/sections/[id] ───────────────────────────
// Full detail for one section, plus the primary discovery signal: a count of
// already-approved questions in the curriculum bank for the section's linked
// topic (null when no topic is linked). This reads only public `questions`
// data (approved=true, no family_id column at all) — zero new cross-family
// exposure, distinct from the separate/cuttable secondary discovery endpoint.
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
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
    .select('*, topic:topics(id, title_en, grade, subject:subjects(label_en, slug))')
    .eq('id', params.id)
    .maybeSingle()

  if (!section) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (section.family_id !== auth.parent.familyId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let curriculumQuestionCount: number | null = null
  if (section.topic_id) {
    const { count } = await supabase
      .from('questions')
      .select('id', { count: 'exact', head: true })
      .eq('topic_id', section.topic_id)
      .eq('approved', true)
    curriculumQuestionCount = count ?? 0
  }

  return NextResponse.json({ section: { ...section, curriculum_question_count: curriculumQuestionCount } })
}

// ─── PATCH /api/notebook/sections/[id] ─────────────────────────
// Body: any subset of { title, chapterName, subcategoryName, tags, bodyText, topicId }
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireParentOnlySession()
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.status === 401 ? 'Unauthorized' : 'Forbidden' },
      { status: auth.status }
    )
  }

  const supabase = createServiceRoleClient()

  const { data: existing } = await supabase
    .from('notebook_sections')
    .select('id, family_id')
    .eq('id', params.id)
    .maybeSingle()

  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (existing.family_id !== auth.parent.familyId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { title, chapterName, subcategoryName, tags, bodyText, topicId } = body

  if (title !== undefined && (typeof title !== 'string' || !title.trim())) {
    return NextResponse.json({ error: 'title must be a non-empty string' }, { status: 400 })
  }
  if (tags !== undefined && (!Array.isArray(tags) || tags.some((t: any) => typeof t !== 'string'))) {
    return NextResponse.json({ error: 'tags must be an array of strings' }, { status: 400 })
  }
  if (topicId) {
    const { data: topic } = await supabase.from('topics').select('id').eq('id', topicId).maybeSingle()
    if (!topic) return NextResponse.json({ error: 'topicId does not exist' }, { status: 400 })
  }

  const updates: Record<string, any> = { updated_at: new Date().toISOString() }
  if (title !== undefined) updates.title = title.trim()
  if (chapterName !== undefined) updates.chapter_name = chapterName || null
  if (subcategoryName !== undefined) updates.subcategory_name = subcategoryName || null
  if (tags !== undefined) updates.tags = tags
  if (bodyText !== undefined) updates.body_text = bodyText || null
  if (topicId !== undefined) updates.topic_id = topicId || null

  const { data: section, error } = await supabase
    .from('notebook_sections')
    .update(updates)
    .eq('id', params.id)
    .select()
    .single()

  if (error || !section) {
    return NextResponse.json({ error: error?.message || 'Failed to update section' }, { status: 500 })
  }

  return NextResponse.json({ section })
}

// ─── DELETE /api/notebook/sections/[id] ────────────────────────
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireParentOnlySession()
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.status === 401 ? 'Unauthorized' : 'Forbidden' },
      { status: auth.status }
    )
  }

  const supabase = createServiceRoleClient()

  const { data: existing } = await supabase
    .from('notebook_sections')
    .select('id, family_id')
    .eq('id', params.id)
    .maybeSingle()

  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (existing.family_id !== auth.parent.familyId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await supabase.from('notebook_sections').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
