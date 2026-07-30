import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase'
import { requireParentOnlySession } from '@/lib/session'

// ─── DELETE /api/notebook/sections/[id]/questions/[linkId] ─────
// Parent-only, family-scoped. Unlinks a question from a section — never
// touches the underlying `questions` row, only the junction record.
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; linkId: string } }
) {
  const auth = await requireParentOnlySession()
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.status === 401 ? 'Unauthorized' : 'Forbidden' },
      { status: auth.status }
    )
  }

  const supabase = createServiceRoleClient()

  const { data: link } = await supabase
    .from('notebook_section_questions')
    .select('id, section:notebook_sections(id, family_id)')
    .eq('id', params.linkId)
    .eq('section_id', params.id)
    .maybeSingle()

  if (!link) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const section = Array.isArray(link.section) ? link.section[0] : link.section
  if (!section || section.family_id !== auth.parent.familyId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await supabase.from('notebook_section_questions').delete().eq('id', params.linkId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
