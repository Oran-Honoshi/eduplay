import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase'
import { requireAdmin } from '@/lib/admin'

// ─── GET /api/questions/pending ────────────────────────────────
// Lists unapproved (approved:false), not-yet-rejected (rejected_at:null)
// questions for review, newest first. A rejected question stays in the
// table (rejected_reason may hold why) but must not resurface here.
// Deliberately NOT scoped to the caller's family — questions/topics are a
// shared curriculum bank across all families (see supabase.ts), so review
// is shared too. Accepted tradeoff, not an oversight.
//
// TODO(process): this queue is global/unscoped by design (see above), which
// means any bulk-approve action against it (e.g. a UI "Approve All", or a
// test/dry-run script looping PATCH /api/questions/[id] with action:approve)
// affects real pending content from real usage, not just whatever the tester
// added. Incident 2026-08-01: a test session's bulk-approve call flipped 5
// real pending questions to approved:false→true with no human review, because
// the queue happened to contain only those 5 at the time. They were manually
// reverted after the fact. Not fixing this now (e.g. a test-mode flag or
// family-scoping) — just flagging: before any bulk-approve test against this
// queue, always query GET /api/questions/pending first and confirm its exact
// count and IDs, every time.

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.status === 401 ? 'Unauthorized' : 'Forbidden' },
      { status: auth.status }
    )
  }

  const { data, error } = await createServiceRoleClient()
    .from('questions')
    .select(`
      id, topic_id, difficulty, q_type, prompt_en, prompt_he,
      options, correct_answer, hint_en, hint_he, explanation_en, created_at,
      topics ( title_en, grade, subjects ( label_en, slug ) )
    `)
    .eq('approved', false)
    .is('rejected_at', null)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ questions: data || [] })
}
