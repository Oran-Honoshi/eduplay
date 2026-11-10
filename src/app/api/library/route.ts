import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// GET /api/library?q=&tags=a,b&subject=&grade=&kind=&limit=
// Ready workbooks anyone can browse (the free library): EduPlay's own and
// approved parent submissions. Tags must all match; q matches title or tags.
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const db = createServiceRoleClient()
  let q = db.from('library_items').select('id, kind, title, subject_slug, grade, n_questions, tags, share_slug, download_count, house')
  const tags = (sp.get('tags') || '').split(',').map(t => t.trim()).filter(Boolean)
  if (tags.length) q = q.contains('tags', tags)
  const text = (sp.get('q') || '').trim().replace(/[%,()]/g, ' ')
  for (const w of text.split(/\s+/).filter(Boolean).slice(0, 4)) q = q.ilike('search_text', `%${w}%`)
  if (sp.get('subject')) q = q.eq('subject_slug', sp.get('subject')!)
  const g = Number(sp.get('grade')); if (sp.get('grade') && Number.isInteger(g)) q = q.eq('grade', g)
  if (sp.get('kind')) q = q.eq('kind', sp.get('kind')!)
  const limit = Math.min(200, Number(sp.get('limit')) || 60)
  const { data, error } = await q.order('grade').order('subject_slug').order('title').limit(limit)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ items: data || [] })
}
