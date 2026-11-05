import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase'
import { authorizeChildAccess } from '@/lib/session'

// ─── GET /api/assignments/[id] ─────────────────────────────────
// Full detail for one assignment: its items in sort_order, each joined with
// the underlying question (prompt/options/hint/explanation/visual_data) so
// the child runner can render straight off this response. Same ownership
// rule as the list route — child self, or a parent in that family — since
// this also backs the parent-facing per-assignment results view.
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServiceRoleClient()

  const { data: assignment } = await supabase
    .from('assignments')
    .select('id, title, created_at, child_id, family_id, topic_id, topic:topics(title_en, title_he)')
    .eq('id', params.id)
    .maybeSingle()

  if (!assignment) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const auth = await authorizeChildAccess(assignment.child_id)
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.status === 401 ? 'Unauthorized' : 'Forbidden' },
      { status: auth.status }
    )
  }

  const { data: items, error } = await supabase
    .from('assignment_items')
    .select(`
      id, sort_order, status, attempt_1_answer, attempt_1_correct, attempt_2_answer, attempt_2_correct, answered_at,
      question:questions ( id, topic_id, difficulty, q_type, prompt_en, prompt_he, options, hint_en, hint_he, explanation_en, explanation_he, visual_data )
    `)
    .eq('assignment_id', params.id)
    .order('sort_order')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ assignment, items: items || [] })
}
