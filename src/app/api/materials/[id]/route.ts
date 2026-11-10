import { NextRequest, NextResponse } from 'next/server'
import { requireParentOnlySession } from '@/lib/session'
import { createServiceRoleClient } from '@/lib/supabase'

async function load(id: string, familyId: string) {
  const db = createServiceRoleClient()
  const { data } = await db.from('materials').select('*').eq('id', id).maybeSingle()
  if (!data || data.family_id !== familyId) return null
  return data
}

// GET /api/materials/[id] — the material plus its questions in order.
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireParentOnlySession()
  if (!auth.ok) return NextResponse.json({ error: auth.status === 401 ? 'Unauthorized' : 'Forbidden' }, { status: auth.status })
  const m = await load(params.id, auth.parent.familyId)
  if (!m) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  let questions: any[] = []
  if (m.question_ids?.length) {
    const { data } = await createServiceRoleClient().from('questions')
      .select('id, topic_id, difficulty, q_type, prompt_en, prompt_he, options, correct_answer, hint_en, hint_he, explanation_en, explanation_he, visual_data, approved, rejected_at')
      .in('id', m.question_ids)
    const byId = new Map((data || []).map(q => [q.id, q]))
    questions = m.question_ids.map((id: string) => byId.get(id)).filter(Boolean)
  }
  return NextResponse.json({ material: m, questions })
}

// PATCH /api/materials/[id] — the parent adjusts the plan, removes questions,
// marks it ready, or likes/rates it. Only these fields can change.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireParentOnlySession()
  if (!auth.ok) return NextResponse.json({ error: auth.status === 401 ? 'Unauthorized' : 'Forbidden' }, { status: auth.status })
  const m = await load(params.id, auth.parent.familyId)
  if (!m) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const b = await req.json().catch(() => ({}))
  const upd: any = { updated_at: new Date().toISOString() }
  if (typeof b.title === 'string' && b.title.trim()) upd.title = b.title.trim().slice(0, 120)
  if (b.plan && typeof b.plan === 'object') upd.plan = b.plan
  if (Array.isArray(b.question_ids)) {
    upd.question_ids = b.question_ids.filter((x: any) => (m.question_ids || []).includes(x))
    upd.section_q = Object.fromEntries(Object.entries(m.section_q || {}).map(([k, v]: any) => [k, (v || []).filter((x: string) => upd.question_ids.includes(x))]))
  }
  if (b.status === 'ready' || b.status === 'draft') upd.status = b.status
  if (b.liked === true || b.liked === false || b.liked === null) upd.liked = b.liked
  if (b.rating === null || (Number.isInteger(b.rating) && b.rating >= 1 && b.rating <= 5)) upd.rating = b.rating
  if (Number.isInteger(b.time_minutes) && b.time_minutes >= 5 && b.time_minutes <= 300) upd.time_minutes = b.time_minutes
  if (typeof b.assignment_id === 'string') upd.assignment_id = b.assignment_id
  // explanation pages to a child's app: they appear on the child's home screen
  if (typeof b.send_explanation_to === 'string' && m.kind === 'explanation') {
    const { data: kid } = await createServiceRoleClient().from('children').select('id, family_id').eq('id', b.send_explanation_to).maybeSingle()
    if (!kid || kid.family_id !== auth.parent.familyId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    upd.child_id = kid.id
    upd.plan = { ...(upd.plan || m.plan || {}), app_sent_at: new Date().toISOString() }
  }
  const { data, error } = await createServiceRoleClient().from('materials').update(upd).eq('id', m.id).select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ material: data })
}

// DELETE /api/materials/[id] — remove it from "What I made". Questions it
// wrote stay in the bank only if they were approved; the rest are set aside.
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireParentOnlySession()
  if (!auth.ok) return NextResponse.json({ error: auth.status === 401 ? 'Unauthorized' : 'Forbidden' }, { status: auth.status })
  const m = await load(params.id, auth.parent.familyId)
  if (!m) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const db = createServiceRoleClient()
  if ((m.question_ids || []).length) {
    await db.from('questions').update({ rejected_at: new Date().toISOString(), rejected_reason: 'material deleted' })
      .in('id', m.question_ids).eq('approved', false).eq('created_by_family', m.family_id).is('rejected_at', null)
  }
  const { error } = await db.from('materials').delete().eq('id', m.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
