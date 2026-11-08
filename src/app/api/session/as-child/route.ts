import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase'
import { createChildSession, requireParentSession } from '@/lib/session'

// POST /api/session/as-child — a signed-in parent opens one of their children's
// screens on this device ("who is learning now?"). No PIN needed: the parent
// is already signed in. The parent session stays, so the way back is one tap.
export async function POST(req: NextRequest) {
  const parent = await requireParentSession()
  if (!parent) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { childId } = await req.json().catch(() => ({}))
  if (!childId) return NextResponse.json({ error: 'childId required' }, { status: 400 })

  const supabase = createServiceRoleClient()
  const { data: child } = await supabase
    .from('children').select('id, family_id, access_token').eq('id', childId).maybeSingle()
  if (!child || child.family_id !== parent.familyId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await createChildSession(child.id, child.family_id)
  return NextResponse.json({ success: true, token: child.access_token })
}
