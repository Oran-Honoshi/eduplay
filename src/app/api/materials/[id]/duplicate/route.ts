import { NextRequest, NextResponse } from 'next/server'
import { requireParentOnlySession } from '@/lib/session'
import { createServiceRoleClient } from '@/lib/supabase'
import { insertDuplicate } from '@/lib/duplicateMaterial'

// POST /api/materials/[id]/duplicate — "more like this". If a spare set was
// already prepared in the background (see prepare-next), it is handed over at
// once, ready to review; otherwise a fresh draft with the same plan is made.
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireParentOnlySession()
  if (!auth.ok) return NextResponse.json({ error: auth.status === 401 ? 'Unauthorized' : 'Forbidden' }, { status: auth.status })
  const db = createServiceRoleClient()
  const { data: m } = await db.from('materials').select('*').eq('id', params.id).maybeSingle()
  if (!m || m.family_id !== auth.parent.familyId) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // claim a finished spare (status guard so two clicks can't claim the same one)
  const { data: spare } = await db.from('materials').select('id')
    .eq('parent_material_id', m.id).eq('status', 'prepared').order('created_at').limit(1).maybeSingle()
  if (spare) {
    const { data: claimed } = await db.from('materials')
      .update({ status: 'draft', created_at: new Date().toISOString() })
      .eq('id', spare.id).eq('status', 'prepared').select('*').maybeSingle()
    if (claimed && (claimed.question_ids || []).length) return NextResponse.json({ material: claimed, prepared: true })
  }

  const { data, error } = await insertDuplicate(db, m, 'draft')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ material: data })
}
