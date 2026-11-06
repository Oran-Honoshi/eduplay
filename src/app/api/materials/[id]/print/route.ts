import { NextRequest, NextResponse } from 'next/server'
import { requireParentOnlySession } from '@/lib/session'
import { createServiceRoleClient } from '@/lib/supabase'
import { brandBits } from '@/lib/printBrand'
import { renderExplanationHTML } from '@/lib/explanationHtml'

// GET /api/materials/[id]/print — branded, printable explanation pages
// (one page per topic) for an "explanation" material from Create.
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireParentOnlySession()
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: m } = await createServiceRoleClient().from('materials').select('*').eq('id', params.id).maybeSingle()
  if (!m || m.family_id !== auth.parent.familyId) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const html = renderExplanationHTML(m, await brandBits(new URL(req.url).origin))
  return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}
