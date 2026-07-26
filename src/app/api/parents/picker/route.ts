import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase'

// Public, pre-auth endpoint for the login screen's "pick your parent" avatar picker.
// Deliberately returns only id/name/avatar_emoji — no email, password hash, role, or
// anything else — so it's safe to call before a session exists. Full parent records
// (api/parents GET) stay locked behind requireParentOnlySession.
export async function GET(req: NextRequest) {
  const familyId = req.nextUrl.searchParams.get('familyId')
  if (!familyId) return NextResponse.json({ error: 'familyId required' }, { status: 400 })

  const supabase = createServiceRoleClient()
  const { data: parents } = await supabase
    .from('family_parents')
    .select('id, name, avatar_emoji')
    .eq('family_id', familyId)
    .order('sort_order')

  return NextResponse.json({ parents: parents || [] })
}
