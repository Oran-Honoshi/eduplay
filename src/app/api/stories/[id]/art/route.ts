import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase'
import { requireAdmin } from '@/lib/admin'

// POST (admin, multipart): file + slot ('cover' or a page index) — the
// illustration for the cover or one page. Stored in the public story-art bucket.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const a = await requireAdmin()
  if (!a.ok) return NextResponse.json({ error: 'Forbidden' }, { status: a.status })
  const db = createServiceRoleClient()
  const { data: b } = await db.from('story_booklets').select('*').eq('id', params.id).maybeSingle()
  if (!b) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const form = await req.formData()
  const file = form.get('file') as File | null
  const slot = String(form.get('slot') ?? '')
  if (!file || !['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) return NextResponse.json({ error: 'PNG, JPG or WEBP only' }, { status: 400 })
  if (file.size > 6 * 1024 * 1024) return NextResponse.json({ error: 'Up to 6MB' }, { status: 400 })
  const idx = slot === 'cover' ? -1 : Number(slot)
  if (slot !== 'cover' && !(Number.isInteger(idx) && idx >= 0 && idx < b.pages.length)) return NextResponse.json({ error: 'Bad slot' }, { status: 400 })
  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
  const path = `${b.id}/${slot}-${Date.now()}.${ext}`
  const { error: upErr } = await db.storage.from('story-art').upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type, upsert: true })
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })
  const url = db.storage.from('story-art').getPublicUrl(path).data.publicUrl
  const upd = slot === 'cover'
    ? { cover: { ...b.cover, image_url: url } }
    : { pages: b.pages.map((p: any, i: number) => (i === idx ? { ...p, image_url: url } : p)) }
  const { data, error } = await db.from('story_booklets').update({ ...upd, updated_at: new Date().toISOString() }).eq('id', b.id).select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ booklet: data })
}
