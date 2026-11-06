import { NextRequest, NextResponse } from 'next/server'
import { requireParentOnlySession } from '@/lib/session'
import { createServiceRoleClient } from '@/lib/supabase'

// GET  /api/feedback — should we show the occasional "how was it?" prompt?
//      Only after 3+ finished creations, and at most once a month (answered or dismissed).
// POST /api/feedback { kind: 'rating'|'suggestion'|'dismissed', stars?, message?, context? }
export async function GET() {
  const auth = await requireParentOnlySession()
  if (!auth.ok) return NextResponse.json({ ask: false })
  const db = createServiceRoleClient()
  const { count } = await db.from('materials').select('id', { count: 'exact', head: true }).eq('family_id', auth.parent.familyId).eq('status', 'ready')
  if ((count || 0) < 3) return NextResponse.json({ ask: false })
  const since = new Date(Date.now() - 30 * 864e5).toISOString()
  const { count: recent } = await db.from('app_feedback').select('id', { count: 'exact', head: true })
    .eq('family_id', auth.parent.familyId).in('kind', ['rating', 'dismissed']).gte('created_at', since)
  return NextResponse.json({ ask: (recent || 0) === 0 })
}

export async function POST(req: NextRequest) {
  const auth = await requireParentOnlySession()
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const b = await req.json().catch(() => ({}))
  if (!['rating', 'suggestion', 'dismissed'].includes(b.kind)) return NextResponse.json({ error: 'kind' }, { status: 400 })
  const stars = Number.isInteger(b.stars) && b.stars >= 1 && b.stars <= 5 ? b.stars : null
  const message = typeof b.message === 'string' ? b.message.trim().slice(0, 4000) || null : null
  if (b.kind === 'suggestion' && !message) return NextResponse.json({ error: 'Write something first.' }, { status: 400 })
  const context = b.context && typeof b.context === 'object' ? { page: String(b.context.page || '').slice(0, 200), material_id: b.context.material_id || null } : {}
  const { error } = await createServiceRoleClient().from('app_feedback').insert({ family_id: auth.parent.familyId, kind: b.kind, stars, message, context })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
