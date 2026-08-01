import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase'
import { requireParentOnlySession } from '@/lib/session'

// ─── PATCH /api/questions/[id] ─────────────────────────────────
// Approve, reject, or unapprove a question.
// Body: { action: 'approve' | 'reject' | 'unapprove' }
// Deliberately NOT scoped to the caller's family — same shared-review
// tradeoff as GET /api/questions/pending. Accepted, not an oversight.
//
// 'unapprove' exists to back the bulk-approve review modal's undo window —
// approve only ever flipped a boolean, so undo is just flipping it back.
// Not exposed in the Pending Review UI itself (nothing there needs to
// un-approve an already-approved question outside that undo flow).

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireParentOnlySession()
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.status === 401 ? 'Unauthorized' : 'Forbidden' },
      { status: auth.status }
    )
  }

  const { action } = await req.json()
  if (action !== 'approve' && action !== 'reject' && action !== 'unapprove') {
    return NextResponse.json({ error: 'action must be "approve", "reject", or "unapprove"' }, { status: 400 })
  }

  const supabase = createServiceRoleClient()

  if (action === 'approve' || action === 'unapprove') {
    const { error } = await supabase.from('questions').update({ approved: action === 'approve' }).eq('id', params.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  // reject — hard delete. No FK dependents: question_generations.question_ids is a
  // plain uuid[], not FK-enforced, and there's no soft-delete column (accepted
  // tradeoff at current scale — see plan discussion).
  const { error } = await supabase.from('questions').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
