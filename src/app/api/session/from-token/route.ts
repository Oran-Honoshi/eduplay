import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase'
import { createChildSession } from '@/lib/session'

// POST /api/session/from-token — exchanges a child's play-link access_token for
// a session cookie. Needed because the /play/[token] page is a Server Component
// and can't set cookies itself; the client calls this once on mount instead.
export async function POST(req: NextRequest) {
  const { token } = await req.json()
  if (!token) return NextResponse.json({ error: 'token required' }, { status: 400 })

  const supabase = createServiceRoleClient()
  const { data: child } = await supabase
    .from('children')
    .select('id, family_id')
    .eq('access_token', token)
    .single()

  if (!child) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

  await createChildSession(child.id, child.family_id)
  return NextResponse.json({ success: true })
}
