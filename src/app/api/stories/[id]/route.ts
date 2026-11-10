import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase'
import { getSession } from '@/lib/session'
import { requireAdmin } from '@/lib/admin'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { parent, child } = await getSession()
  if (!parent && !child) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = createServiceRoleClient()
  const { data: b } = await db.from('story_booklets').select('*').eq('id', params.id).maybeSingle()
  if (!b) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (b.status !== 'approved') {
    const a = await requireAdmin()
    if (!a.ok) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json({ booklet: b })
}

// PATCH (admin): { status?, is_free?, clear_image?: 'cover' | number }
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const a = await requireAdmin()
  if (!a.ok) return NextResponse.json({ error: 'Forbidden' }, { status: a.status })
  const db = createServiceRoleClient()
  const { data: b } = await db.from('story_booklets').select('*').eq('id', params.id).maybeSingle()
  if (!b) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const body = await req.json().catch(() => ({}))
  const upd: any = { updated_at: new Date().toISOString() }
  if (['draft', 'approved', 'hidden'].includes(body.status)) upd.status = body.status
  if (typeof body.is_free === 'boolean') upd.is_free = body.is_free
  if (body.clear_image === 'cover') upd.cover = { ...b.cover, image_url: null }
  else if (Number.isInteger(body.clear_image)) upd.pages = b.pages.map((p: any, i: number) => (i === body.clear_image ? { ...p, image_url: null } : p))
  const { data, error } = await db.from('story_booklets').update(upd).eq('id', b.id).select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ booklet: data })
}
