import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase'
import { requireParentOnlySession } from '@/lib/session'

// ─── PATCH /api/passages/[id] ───────────────────────────────────
// Approve, reject, or unapprove a reading passage. Same shape as
// PATCH /api/questions/[id] — approve/unapprove just flip the boolean,
// reject hard-deletes. Deliberately NOT scoped to the caller's family,
// same shared-review tradeoff as questions.
//
// Approving the passage does NOT touch its passage_questions — those carry
// their own independent `approved` column (see /api/passages/questions/[id])
// and are gated separately at lesson/page.tsx, so they need their own
// review action.

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
    const { error } = await supabase.from('reading_passages').update({ approved: action === 'approve' }).eq('id', params.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  // reject — hard delete. passage_questions.passage_id has no FK-cascade
  // guarantee to rely on, so delete the questions first, then the passage.
  const { error: qError } = await supabase.from('passage_questions').delete().eq('passage_id', params.id)
  if (qError) return NextResponse.json({ error: qError.message }, { status: 500 })
  const { error } = await supabase.from('reading_passages').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
