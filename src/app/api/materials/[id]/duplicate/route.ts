import { NextRequest, NextResponse } from 'next/server'
import { requireParentOnlySession } from '@/lib/session'
import { createServiceRoleClient } from '@/lib/supabase'

// POST /api/materials/[id]/duplicate — "more like this": same plan, method,
// question types, topics and material, but a fresh draft whose questions will
// all be newly written (bank reuse off, so the child gets different ones).
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireParentOnlySession()
  if (!auth.ok) return NextResponse.json({ error: auth.status === 401 ? 'Unauthorized' : 'Forbidden' }, { status: auth.status })
  const db = createServiceRoleClient()
  const { data: m } = await db.from('materials').select('*').eq('id', params.id).maybeSingle()
  if (!m || m.family_id !== auth.parent.familyId) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const plan = { ...m.plan, topics: (m.plan?.topics || []).map((t: any) => ({ ...t, reuse: 0 })) }
  const { data, error } = await db.from('materials').insert({
    family_id: m.family_id, child_id: m.child_id, kind: m.kind, title: `${m.title} · עוד`,
    subject_slug: m.subject_slug, grade: m.grade, language: m.language, request_text: m.request_text,
    upload_ids: m.upload_ids, plan, time_minutes: m.time_minutes, parent_material_id: m.id,
  }).select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ material: data })
}
