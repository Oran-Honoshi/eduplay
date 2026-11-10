import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase'
import { requireChildSession } from '@/lib/session'

// POST /api/kid/workbook { materialId } — a child picks a ready workbook from
// the library and starts it as practice. It becomes one of the child's tasks
// (so the parent sees it with the rest), marked as chosen by the child.
export async function POST(req: NextRequest) {
  const child = await requireChildSession()
  if (!child) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const b = await req.json().catch(() => ({}))
  const db = createServiceRoleClient()
  const { data: m } = await db.from('materials').select('id, title, question_ids, library_status, status, kind').eq('id', b.materialId).maybeSingle()
  if (!m || m.library_status !== 'listed' || m.status !== 'ready' || m.kind === 'explanation' || !(m.question_ids || []).length)
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const { data: ok } = await db.from('questions').select('id, topic_id').in('id', m.question_ids).eq('approved', true)
  const ids = (m.question_ids as string[]).filter(id => (ok || []).some(q => q.id === id))
  if (!ids.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const topics = new Set((ok || []).map(q => q.topic_id))
  const { data: a, error } = await db.from('assignments').insert({
    family_id: child.familyId, child_id: child.childId, created_by_parent_id: null,
    title: `${m.title} · בחרתי בעצמי`, topic_id: topics.size === 1 ? [...topics][0] : null, allow_hints: true, allow_steps: true,
  }).select('id').single()
  if (error || !a) return NextResponse.json({ error: error?.message || 'Failed' }, { status: 500 })
  const { error: e2 } = await db.from('assignment_items').insert(ids.map((q, i) => ({ assignment_id: a.id, question_id: q, sort_order: i })))
  if (e2) { await db.from('assignments').delete().eq('id', a.id); return NextResponse.json({ error: e2.message }, { status: 500 }) }
  return NextResponse.json({ assignmentId: a.id })
}
