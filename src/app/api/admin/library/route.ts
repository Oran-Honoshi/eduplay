import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { createServiceRoleClient } from '@/lib/supabase'

// GET  /api/admin/library — materials offered to the free library + recent app feedback
// PATCH /api/admin/library { id, action: 'list'|'reject'|'unlist' }
export async function GET() {
  const a = await requireAdmin()
  if (!a.ok) return NextResponse.json({ error: 'Forbidden' }, { status: a.status })
  const db = createServiceRoleClient()
  const { data: items } = await db.from('materials')
    .select('id, kind, title, subject_slug, grade, share_slug, library_status, library_submitted_at, question_ids, download_count')
    .in('library_status', ['submitted', 'listed', 'rejected']).order('library_submitted_at', { ascending: false }).limit(200)
  const { data: feedback } = await db.from('app_feedback').select('id, kind, stars, message, context, created_at')
    .neq('kind', 'dismissed').order('created_at', { ascending: false }).limit(200)
  return NextResponse.json({ items: items || [], feedback: feedback || [] })
}

export async function PATCH(req: NextRequest) {
  const a = await requireAdmin()
  if (!a.ok) return NextResponse.json({ error: 'Forbidden' }, { status: a.status })
  const { id, action } = await req.json().catch(() => ({}))
  const status = ({ list: 'listed', reject: 'rejected', unlist: 'submitted' } as Record<string, string>)[action]
  if (!id || !status) return NextResponse.json({ error: 'id and action required' }, { status: 400 })
  const { error } = await createServiceRoleClient().from('materials').update({ library_status: status }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
