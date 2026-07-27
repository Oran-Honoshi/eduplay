import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase'
import { requireParentOnlySession } from '@/lib/session'

// ─── GET/PATCH /api/family/settings ─────────────────────────────
// Small family-scoped settings surface — currently just the
// question-generation style preference folded into the AI system
// prompt in /api/questions/generate. families has RLS with no anon
// read/write policy, so this needs the service-role client;
// requireParentOnlySession() is the actual gate, and every query is
// scoped to the caller's own familyId so one family can never read
// or write another's row even via the service-role client.

export async function GET() {
  const auth = await requireParentOnlySession()
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.status === 401 ? 'Unauthorized' : 'Forbidden' },
      { status: auth.status }
    )
  }

  const { data, error } = await createServiceRoleClient()
    .from('families')
    .select('question_gen_style')
    .eq('id', auth.parent.familyId)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ question_gen_style: data?.question_gen_style ?? null })
}

export async function PATCH(req: NextRequest) {
  const auth = await requireParentOnlySession()
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.status === 401 ? 'Unauthorized' : 'Forbidden' },
      { status: auth.status }
    )
  }

  const body = await req.json()
  const { question_gen_style } = body

  if (question_gen_style !== null && question_gen_style !== undefined && typeof question_gen_style !== 'string') {
    return NextResponse.json({ error: 'question_gen_style must be a string or null' }, { status: 400 })
  }

  const { error } = await createServiceRoleClient()
    .from('families')
    .update({ question_gen_style: question_gen_style || null })
    .eq('id', auth.parent.familyId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
