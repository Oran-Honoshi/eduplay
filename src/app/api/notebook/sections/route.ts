import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase'
import { requireParentOnlySession } from '@/lib/session'

// ─── POST /api/notebook/sections ───────────────────────────────
// Parent-only: creates a notebook section for the caller's family.
// Body: { title, chapterName?, subcategoryName?, tags?: string[], bodyText?, topicId? }
// Checkpoint 2: title/chapter/subcategory/tags/body only — files, linked
// questions, recipe, and generator integration all come in later checkpoints.
export async function POST(req: NextRequest) {
  const auth = await requireParentOnlySession()
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.status === 401 ? 'Unauthorized' : 'Forbidden' },
      { status: auth.status }
    )
  }

  const body = await req.json()
  const { title, chapterName, subcategoryName, tags, bodyText, topicId } = body

  if (!title || typeof title !== 'string' || !title.trim()) {
    return NextResponse.json({ error: 'title is required' }, { status: 400 })
  }
  if (tags !== undefined && (!Array.isArray(tags) || tags.some((t: any) => typeof t !== 'string'))) {
    return NextResponse.json({ error: 'tags must be an array of strings' }, { status: 400 })
  }

  const supabase = createServiceRoleClient()

  if (topicId) {
    const { data: topic } = await supabase.from('topics').select('id').eq('id', topicId).maybeSingle()
    if (!topic) return NextResponse.json({ error: 'topicId does not exist' }, { status: 400 })
  }

  const { data: section, error } = await supabase
    .from('notebook_sections')
    .insert({
      family_id: auth.parent.familyId,
      created_by_parent_id: auth.parent.parentId,
      title: title.trim(),
      chapter_name: chapterName || null,
      subcategory_name: subcategoryName || null,
      tags: tags || [],
      body_text: bodyText || null,
      topic_id: topicId || null,
    })
    .select()
    .single()

  if (error || !section) {
    return NextResponse.json({ error: error?.message || 'Failed to create section' }, { status: 500 })
  }

  return NextResponse.json({ section }, { status: 201 })
}

// ─── GET /api/notebook/sections ────────────────────────────────
// Parent-only: lists the caller's family's notebook sections (lean fields —
// body_text is only returned by the single-section detail route).
export async function GET() {
  const auth = await requireParentOnlySession()
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.status === 401 ? 'Unauthorized' : 'Forbidden' },
      { status: auth.status }
    )
  }

  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from('notebook_sections')
    .select('id, title, chapter_name, subcategory_name, tags, topic_id, created_at, updated_at')
    .eq('family_id', auth.parent.familyId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ sections: data || [] })
}
