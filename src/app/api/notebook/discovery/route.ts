import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase'
import { requireParentOnlySession } from '@/lib/session'

// ─── GET /api/notebook/discovery ────────────────────────────────
// Secondary discovery signal (checkpoint 7): "are other families building
// notebook content like mine?" — exact-match on chapterName/subcategoryName,
// overlap-match on tags, counting DISTINCT other families (never the
// caller's own). Deliberately count-only: no family ids, section titles, or
// any other raw string ever leaves this endpoint, and counts below
// SUPPRESSION_THRESHOLD collapse to 0 so a lone matching family (or two)
// can never be singled out from the response.
//
// Query: ?chapterName=&subcategoryName=&tags=comma,separated — at least one required.

const SUPPRESSION_THRESHOLD = 3

export async function GET(req: NextRequest) {
  const auth = await requireParentOnlySession()
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.status === 401 ? 'Unauthorized' : 'Forbidden' },
      { status: auth.status }
    )
  }

  const { searchParams } = new URL(req.url)
  const chapterName = searchParams.get('chapterName')?.trim() || undefined
  const subcategoryName = searchParams.get('subcategoryName')?.trim() || undefined
  const tags = (searchParams.get('tags')?.trim() || '')
    .split(',')
    .map(t => t.trim())
    .filter(Boolean)

  if (!chapterName && !subcategoryName && tags.length === 0) {
    return NextResponse.json(
      { error: 'At least one of chapterName, subcategoryName, or tags is required' },
      { status: 400 }
    )
  }

  const supabase = createServiceRoleClient()

  let query = supabase
    .from('notebook_sections')
    .select('family_id')
    .neq('family_id', auth.parent.familyId)

  if (chapterName) query = query.eq('chapter_name', chapterName)
  if (subcategoryName) query = query.eq('subcategory_name', subcategoryName)
  if (tags.length > 0) query = query.overlaps('tags', tags)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const distinctFamilyCount = new Set((data || []).map(r => r.family_id)).size

  return NextResponse.json({
    count: distinctFamilyCount >= SUPPRESSION_THRESHOLD ? distinctFamilyCount : 0,
  })
}
