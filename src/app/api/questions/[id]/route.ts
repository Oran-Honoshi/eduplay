import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase'
import { requireParentOnlySession } from '@/lib/session'

// ─── PATCH /api/questions/[id] ─────────────────────────────────
// Approve, reject, or unapprove a question.
// Body: { action: 'approve' | 'reject' | 'unapprove' | 'edit', reason?: string, ...fields for edit }
// Deliberately NOT scoped to the caller's family — same shared-review
// tradeoff as GET /api/questions/pending. Accepted, not an oversight.
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

  // 'edit': fix a question while reviewing it (Create review step). Only
  // questions not yet approved, or ones this family created, can be edited —
  // an approved question in the shared bank is never changed under others.
  if (action === 'edit') {
    const db = createServiceRoleClient()
    const { data: q } = await db.from('questions').select('id, approved, created_by_family, options').eq('id', params.id).maybeSingle()
    if (!q) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (q.approved && q.created_by_family !== auth.parent.familyId) {
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
