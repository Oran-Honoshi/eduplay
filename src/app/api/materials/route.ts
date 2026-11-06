import { NextResponse } from 'next/server'
import { requireParentOnlySession } from '@/lib/session'
import { createServiceRoleClient } from '@/lib/supabase'

// GET /api/materials — the family's Create history (newest first).
export async function GET() {
  const auth = await requireParentOnlySession()
  if (!auth.ok) return NextResponse.json({ error: auth.status === 401 ? 'Unauthorized' : 'Forbidden' }, { status: auth.status })
  const { data, error } = await createServiceRoleClient()
    .from('materials')
    .select('id, kind, title, subject_slug, grade, child_id, status, liked, rating, question_ids, time_minutes, parent_material_id, created_at, library_status, plan')
    .eq('family_id', auth.parent.familyId)
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  // only what the list and its filters need from the plan
  const materials = (data || []).map(({ plan, ...m }: any) => ({
    ...m, tags: [...new Set([...(plan?.tags || []), ...(plan?.topics || []).map((t: any) => t.title_he || t.title_en)].filter(Boolean))],
  }))
  return NextResponse.json({ materials })
}
