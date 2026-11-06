import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { createServiceRoleClient } from '@/lib/supabase'
import { brandBits } from '@/lib/printBrand'
import { loadPublicMaterial, renderPublicHTML } from '@/lib/publicMaterial'

// GET /api/free/[slug]/print?key=1 — free, no account: the branded printable
// of a shared / library material. Opening it counts as a download and marks
// this browser as having used it (only then can it be rated).
export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const p = await loadPublicMaterial(params.slug)
  if (!p) return new NextResponse('Not found', { status: 404 })
  const html = await renderPublicHTML(p, await brandBits(new URL(req.url).origin), req.nextUrl.searchParams.get('key') === '1')
  await createServiceRoleClient().from('materials').update({ download_count: (p.m.download_count || 0) + 1 }).eq('id', p.m.id)
  const res = new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  const year = 60 * 60 * 24 * 365
  if (!req.cookies.get('edp_rid')) res.cookies.set('edp_rid', randomUUID(), { httpOnly: true, sameSite: 'lax', secure: true, path: '/', maxAge: year })
  res.cookies.set(`edp_dl_${params.slug}`, '1', { httpOnly: true, sameSite: 'lax', secure: true, path: '/', maxAge: year })
  return res
}
