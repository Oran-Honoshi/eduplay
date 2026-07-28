import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase'
import { requireParentOnlySession } from '@/lib/session'

// ─── GET /api/family/children ─────────────────────────────────
// Lists the calling parent's own children (id/name/grade only) for
// client-side pickers — e.g. the Question Library's "create worksheet for"
// selector. No existing endpoint does this: /api/children requires a specific
// childId up front, and dashboard/page.tsx's equivalent query only runs
// server-side.

export async function GET() {
  const auth = await requireParentOnlySession()
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.status === 401 ? 'Unauthorized' : 'Forbidden' },
      { status: auth.status }
    )
  }

  const { data, error } = await createServiceRoleClient()
    .from('children')
    .select('id, display_name, grade')
    .eq('family_id', auth.parent.familyId)
    .order('created_at')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ children: data || [] })
}
