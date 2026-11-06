import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { requireParentOnlySession } from '@/lib/session'
import { createServiceRoleClient } from '@/lib/supabase'

// POST /api/materials/[id]/share { library?: boolean }
// Makes a share link for a ready material (the page shows the material only,
// never the child). library:true also offers it to the free sample library,
// where it appears after an admin approves it.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireParentOnlySession()
  if (!auth.ok) return NextResponse.json({ error: auth.status === 401 ? 'Unauthorized' : 'Forbidden' }, { status: auth.status })
  const db = createServiceRoleClient()
  const { data: m } = await db.from('materials').select('id, family_id, status, share_slug, library_status').eq('id', params.id).maybeSingle()
  if (!m || m.family_id !== auth.parent.familyId) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (m.status !== 'ready') return NextResponse.json({ error: 'Finish reviewing it first.' }, { status: 400 })
  const b = await req.json().catch(() => ({}))
  const upd: any = {}
  let slug = m.share_slug
  if (!slug) {
    slug = randomBytes(8).toString('base64url').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10).padEnd(10, '0')
    upd.share_slug = slug; upd.shared_at = new Date().toISOString()
  }
  if (b.library === true && (m.library_status === 'none' || m.library_status === 'rejected')) {
    upd.library_status = 'submitted'; upd.library_submitted_at = new Date().toISOString()
  }
  if (b.library === false && m.library_status !== 'none') upd.library_status = 'none'
  if (Object.keys(upd).length) {
    const { error } = await db.from('materials').update(upd).eq('id', m.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }
  const origin = (process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin).replace(/\/$/, '')
  return NextResponse.json({ slug, url: `${origin}/s/${slug}`, library_status: upd.library_status ?? m.library_status })
}
