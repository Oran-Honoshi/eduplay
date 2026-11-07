import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { createServiceRoleClient } from '@/lib/supabase'
import { repairBooklet } from '@/lib/readingBooklet'

export const maxDuration = 300

// POST /api/reading/booklets/[id]/fix — admin: run the niqqud repair again on a draft
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: 'Forbidden' }, { status: auth.status })
  const db = createServiceRoleClient()
  const { data: bk } = await db.from('reading_booklets').select('*').eq('id', params.id).maybeSingle()
  if (!bk) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const { data: level } = await db.from('reading_levels').select('level_number, label_he').eq('id', bk.level_id).single()
  const out = await repairBooklet(level!, bk.title_he, bk.pages || [], 4)
  const { data, error } = await db.from('reading_booklets').update({ title_he: out.title, pages: out.pages, check_report: out.report })
    .eq('id', bk.id).select('id, level_number, title_he, theme_he, status, is_free, check_report, created_at').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ booklet: data })
}
