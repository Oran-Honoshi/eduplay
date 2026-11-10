import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase'
import { authorizeChildAccess } from '@/lib/session'

export const dynamic = 'force-dynamic'

// GET /api/learn/[id]?childId= — one explanation material for the child's reader.
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const childId = req.nextUrl.searchParams.get('childId') || ''
  const auth = await authorizeChildAccess(childId)
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status })
  const { data: m } = await createServiceRoleClient().from('materials').select('id, title, language, plan, explanation, child_id, kind').eq('id', params.id).maybeSingle()
  if (!m || m.kind !== 'explanation' || m.child_id !== childId) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const pages = (m.plan?.topics || []).map((t: any) => ({ key: t.key, title_he: t.title_he, title_en: t.title_en, page: m.explanation?.[t.key] })).filter((x: any) => x.page)
  return NextResponse.json({ title: m.title, language: m.language, pages })
}
