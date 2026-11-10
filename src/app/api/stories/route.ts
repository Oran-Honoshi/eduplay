import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase'
import { getSession, requireFamilyMatch } from '@/lib/session'

export const dynamic = 'force-dynamic'

// GET /api/stories[?childId=] — the story booklets. Children and parents see
// approved ones; the admin also sees drafts. With childId: which ones that
// child has finished.
export async function GET(req: NextRequest) {
  const { parent, child } = await getSession()
  if (!parent && !child) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = createServiceRoleClient()
  let admin = false
  if (parent) {
    const { data } = await db.from('families').select('is_admin').eq('id', parent.familyId).maybeSingle()
    admin = !!data?.is_admin
  }
  let q = db.from('story_booklets').select('id, series, level_number, number, title_he, cover, pages, status, is_free').order('level_number').order('number')
  if (!admin) q = q.eq('status', 'approved')
  const { data } = await q
  const childId = req.nextUrl.searchParams.get('childId')
  let read: string[] = []
  if (childId && (child?.childId === childId || (parent && await requireFamilyMatch(childId, parent.familyId)))) {
    const { data: r } = await db.from('story_reads').select('booklet_id').eq('child_id', childId)
    read = [...new Set((r || []).map((x: any) => x.booklet_id))]
  }
  return NextResponse.json({ booklets: data || [], read, admin })
}
