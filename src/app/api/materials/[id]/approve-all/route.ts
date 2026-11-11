import { NextRequest, NextResponse } from 'next/server'
import { requireParentOnlySession } from '@/lib/session'
import { createServiceRoleClient } from '@/lib/supabase'

// POST /api/materials/[id]/approve-all — approve every not-yet-approved
// question of this material in one update (the parent pressed "approve all").
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireParentOnlySession()
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status })
  const db = createServiceRoleClient()
  const { data: m } = await db.from('materials').select('family_id, question_ids').eq('id', params.id).maybeSingle()
  if (!m || m.family_id !== auth.parent.familyId) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!(m.question_ids || []).length) return NextResponse.json({ approved: 0 })
  const { data, error } = await db.from('questions').update({ approved: true })
    .in('id', m.question_ids).eq('approved', false).eq('created_by_family', m.family_id).is('rejected_at', null).select('id')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ approved: (data || []).length })
}
