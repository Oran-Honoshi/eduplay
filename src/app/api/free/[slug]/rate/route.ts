import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { createServiceRoleClient } from '@/lib/supabase'

// POST /api/free/[slug]/rate { stars } — only a browser that actually opened
// the material (download cookie) can rate it, once per material (re-rating
// replaces the earlier stars). Ratings order the free library; they never
// decide what is correct — every question was approved by a parent.
export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const used = req.cookies.get(`edp_dl_${params.slug}`)?.value === '1'
  const rid = req.cookies.get('edp_rid')?.value
  if (!used || !rid) return NextResponse.json({ error: 'Open or print the material first, then rate it.' }, { status: 403 })
  const { stars } = await req.json().catch(() => ({}))
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) return NextResponse.json({ error: 'stars 1–5' }, { status: 400 })
  const db = createServiceRoleClient()
  const { data: m } = await db.from('materials').select('id').eq('share_slug', params.slug).eq('status', 'ready').maybeSingle()
  if (!m) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const rater_key = createHash('sha256').update(rid).digest('hex').slice(0, 32)
  const { error } = await db.from('material_ratings').upsert({ material_id: m.id, rater_key, stars }, { onConflict: 'material_id,rater_key' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
