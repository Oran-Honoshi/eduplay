import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// GET /api/library/tags?q= — tags of library workbooks that contain the typed
// text (any part of it), most used first. Feeds the search box suggestions.
export async function GET(req: NextRequest) {
  const text = (req.nextUrl.searchParams.get('q') || '').trim().replace(/[%,()]/g, '')
  let q = createServiceRoleClient().from('library_tags').select('tag, n')
  if (text) q = q.ilike('tag', `%${text}%`)
  const { data } = await q.order('n', { ascending: false }).limit(text ? 12 : 40)
  return NextResponse.json({ tags: (data || []).map((r: any) => ({ tag: r.tag, n: r.n })) })
}
