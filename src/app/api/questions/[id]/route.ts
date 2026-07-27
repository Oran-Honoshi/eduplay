import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase'
import { requireParentOnlySession } from '@/lib/session'

// ─── PATCH /api/questions/[id] ─────────────────────────────────
// Approve or reject a pending (approved:false) question.
// Body: { action: 'approve' | 'reject' }
// Deliberately NOT scoped to the caller's family — same shared-review
// tradeoff as GET /api/questions/pending. Accepted, not an oversight.

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireParentOnlySession()
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.status === 401 ? 'Unauthorized' : 'Forbidden' },
      { status: auth.status }
    )
  }

  const { action } = await req.json()
  if (action !== 'approve' && action !== 'reject') {
    return NextResponse.json({ error: 'action must be "approve" or "reject"' }, { status: 400 })
  }

  const supabase = createServiceRoleClient()

  if (action === 'approve') {
    const { error } = await supabase.from('questions').update({ approved: true }).eq('id', params.id)
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
