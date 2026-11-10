import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase'
import { authorizeChildAccess } from '@/lib/session'

export const dynamic = 'force-dynamic'

// GET /api/learn?childId= — explanation pages a parent sent to this child's app.
export async function GET(req: NextRequest) {
  const childId = req.nextUrl.searchParams.get('childId') || ''
  const auth = await authorizeChildAccess(childId)
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status })
  const { data } = await createServiceRoleClient().from('materials').select('id, title, subject_slug, plan, created_at')
    .eq('child_id', childId).eq('kind', 'explanation').eq('status', 'ready').order('updated_at', { ascending: false }).limit(30)
  return NextResponse.json({ pages: (data || []).filter((m: any) => m.plan?.app_sent_at).map((m: any) => ({ id: m.id, title: m.title, subject: m.subject_slug })) })
}
