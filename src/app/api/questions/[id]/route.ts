import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase'
import { requireParentOnlySession } from '@/lib/session'

async function isAdminFamily(familyId: string) {
  const { data } = await createServiceRoleClient().from('families').select('is_admin').eq('id', familyId).maybeSingle()
  return !!data?.is_admin
}

// ─── PATCH /api/questions/[id] ─────────────────────────────────
// Approve, reject, or unapprove a question.
// Body: { action: 'approve' | 'reject' | 'unapprove' | 'edit', reason?: string, ...fields for edit }
// Scoped (2026-11-11, open sign-up): a family may approve/reject/edit only
// questions it created itself; the shared bank is reviewed by an admin only.
//
// 'unapprove' exists to back the bulk-approve review modal's undo window —
// approve only ever flipped a boolean, so undo is just flipping it back.
// Not exposed in the Pending Review UI itself (nothing there needs to
// un-approve an already-approved question outside that undo flow).
//
// reject used to hard-delete. It now soft-rejects instead (sets rejected_at/
// rejected_reason, row stays) so an optional reason survives for review —
// GET /api/questions/pending filters rejected_at IS NULL so these don't
// keep reappearing in the queue.

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireParentOnlySession()
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.status === 401 ? 'Unauthorized' : 'Forbidden' },
      { status: auth.status }
    )
  }

  const body = await req.json()
  const { action, reason } = body
  if (action !== 'approve' && action !== 'reject' && action !== 'unapprove' && action !== 'edit') {
    return NextResponse.json({ error: 'action must be "approve", "reject", "unapprove" or "edit"' }, { status: 400 })
  }

  const db0 = createServiceRoleClient()
  const { data: own } = await db0.from('questions').select('id, approved, created_by_family').eq('id', params.id).maybeSingle()
  if (!own) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const admin = await isAdminFamily(auth.parent.familyId)
  const mine = own.created_by_family === auth.parent.familyId
  if (action !== 'edit' && !admin && !mine) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (action === 'edit' && !own.approved && !admin && !mine) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // 'edit': fix a question while reviewing it (Create review step). Only
  // questions not yet approved, or ones this family created, can be edited —
  // an approved question in the shared bank is never changed under others.
  if (action === 'edit') {
    const db = createServiceRoleClient()
    const { data: q } = await db.from('questions').select('id, approved, created_by_family, options').eq('id', params.id).maybeSingle()
    if (!q) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    // a shared bank question is never changed under others: inside one of this
    // family's sheets, editing it makes the family's own copy and swaps it in
    const forkFor = q.approved && q.created_by_family !== auth.parent.familyId
      ? (typeof body.material_id === 'string' ? body.material_id : null) : undefined
    if (forkFor === null) {
      return NextResponse.json({ error: 'Approved shared questions cannot be edited' }, { status: 403 })
    }
    const upd: any = {}
    for (const k of ['prompt_en', 'prompt_he', 'correct_answer', 'hint_en', 'hint_he', 'explanation_en', 'explanation_he']) {
      if (typeof body[k] === 'string') upd[k] = body[k].trim() || (k === 'prompt_en' || k === 'correct_answer' ? undefined : null)
    }
    if (Array.isArray(body.options) && Array.isArray(q.options) && body.options.length === q.options.length) {
      const opts = body.options.map((o: any, i: number) => ({
        ...q.options[i],
        value_en: typeof o.value_en === 'string' ? o.value_en : q.options[i].value_en,
        value_he: typeof o.value_he === 'string' ? o.value_he : q.options[i].value_he,
        isCorrect: !!o.isCorrect,
      }))
      if (opts.filter((o: any) => o.isCorrect).length === 1) upd.options = opts
    }
    for (const k of Object.keys(upd)) if (upd[k] === undefined) delete upd[k]
    if (!Object.keys(upd).length) return NextResponse.json({ error: 'Nothing to change' }, { status: 400 })
    if (forkFor) {
      const { data: m } = await db.from('materials').select('id, family_id, question_ids, section_q').eq('id', forkFor).maybeSingle()
      if (!m || m.family_id !== auth.parent.familyId || !(m.question_ids || []).includes(q.id)) {
        return NextResponse.json({ error: 'Approved shared questions cannot be edited' }, { status: 403 })
      }
      const { data: full } = await db.from('questions').select('*').eq('id', q.id).single()
      const { id: _id, created_at: _c, times_served: _t, rejected_at: _ra, rejected_reason: _rr, ...rest } = full as any
      const { data: copy, error: insErr } = await db.from('questions')
        .insert({ ...rest, ...upd, approved: true, created_by_family: auth.parent.familyId, times_served: 0 }).select('*').single()
      if (insErr || !copy) return NextResponse.json({ error: insErr?.message || 'copy failed' }, { status: 500 })
      const swap = (ids: string[]) => (ids || []).map(x => (x === q.id ? copy.id : x))
      const sectionQ = m.section_q ? Object.fromEntries(Object.entries(m.section_q).map(([k, v]) => [k, swap(v as string[])])) : m.section_q
      await db.from('materials').update({ question_ids: swap(m.question_ids), section_q: sectionQ, updated_at: new Date().toISOString() }).eq('id', m.id)
      return NextResponse.json({ success: true, question: copy, replaced: q.id })
    }
    const { data, error } = await db.from('questions').update(upd).eq('id', params.id).select('*').single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, question: data })
  }
  if (reason !== undefined && typeof reason !== 'string') {
    return NextResponse.json({ error: 'reason must be a string' }, { status: 400 })
  }

  const supabase = createServiceRoleClient()

  if (action === 'approve' || action === 'unapprove') {
    const { error } = await supabase.from('questions').update({ approved: action === 'approve' }).eq('id', params.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  const { error } = await supabase
    .from('questions')
    .update({ approved: false, rejected_at: new Date().toISOString(), rejected_reason: reason?.trim() || null })
    .eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
