import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase'
import { requireParentOnlySession } from '@/lib/session'

// ─── PATCH /api/passages/questions/[id] ─────────────────────────
// Approve, reject, or unapprove a single passage_questions row. Separate
// endpoint from PATCH /api/passages/[id] because passage_questions carries
// its own independent `approved` column — a passage being approved does
// not make its comprehension questions visible; lesson/page.tsx gates them
// with their own .eq('approved', true) filter.

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
    const { error } = await supabase.from('passage_questions').update({ approved: action === 'approve' }).eq('id', params.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  const { error } = await supabase.from('passage_questions').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
