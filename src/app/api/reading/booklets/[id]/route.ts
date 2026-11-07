import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { createServiceRoleClient } from '@/lib/supabase'
import { checkBooklet, cleanPages } from '@/lib/readingBooklet'

// PATCH /api/reading/booklets/[id] — admin only: approve / reject, mark it as
// a free sample, or save edited pages (re-checked against the level).
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: 'Forbidden' }, { status: auth.status })
  const db = createServiceRoleClient()
  const { data: bk } = await db.from('reading_booklets').select('*').eq('id', params.id).maybeSingle()
  if (!bk) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const b = await req.json().catch(() => ({}))
  const upd: any = {}
  if (b.status === 'approved') { upd.status = 'approved'; upd.approved_at = new Date().toISOString() }
  if (b.status === 'rejected') { upd.status = 'rejected'; upd.reject_reason = typeof b.reason === 'string' ? b.reason.slice(0, 300) : null; upd.is_free = false }
  if (b.status === 'draft') upd.status = 'draft'
  if (typeof b.is_free === 'boolean') upd.is_free = b.is_free
  if (typeof b.title_he === 'string' && b.title_he.trim()) upd.title_he = b.title_he.trim().slice(0, 80)
  if (Array.isArray(b.pages)) {
    upd.pages = cleanPages(b.pages)
    upd.check_report = checkBooklet(bk.level_number, upd.title_he || bk.title_he, upd.pages)
  }
  const { data, error } = await db.from('reading_booklets').update(upd).eq('id', bk.id).select('id, level_number, title_he, theme_he, status, is_free, check_report, created_at').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ booklet: data })
}
