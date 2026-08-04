import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase'
import { requireParentOnlySession } from '@/lib/session'

// ─── PATCH /api/questions/[id] ─────────────────────────────────
// Approve, reject, or unapprove a question.
// Body: { action: 'approve' | 'reject' | 'unapprove', reason?: string }
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

  const { action, reason } = await req.json()
  if (action !== 'approve' && action !== 'reject' && action !== 'unapprove') {
    return NextResponse.json({ error: 'action must be "approve", "reject", or "unapprove"' }, { status: 400 })
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
