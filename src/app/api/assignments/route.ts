import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase'
import { requireParentOnlySession, requireFamilyMatch, authorizeChildAccess } from '@/lib/session'

// ─── POST /api/assignments ─────────────────────────────────────
// Parent-only: creates an assignment for one child from a set of
// already-approved question IDs. Called from the Library tab's "Assign to
// Child" button (questions/page.tsx's LibraryPanel, next to "Create
// Worksheet from N Selected") and from the dashboard's Assignments history
// tab's reassign actions (dashboard/client.tsx's AssignmentsScreen).
// Body: { childId, questionIds: string[], title?: string }
//
// v1 only accepts options-based (multiple-choice-shaped) questions — the grading
// endpoint (assignments/[id]/items/[itemId]/attempt) reuses the lesson's
// options[].isCorrect check, which has no equivalent for free-text q_types
// (fill_blank, word_problem, writing, etc.). Non-conforming IDs are rejected
// up front rather than silently dropped, so the parent knows what didn't make it in.
export async function POST(req: NextRequest) {
  const auth = await requireParentOnlySession()
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.status === 401 ? 'Unauthorized' : 'Forbidden' },
      { status: auth.status }
    )
  }

  const body = await req.json()
  const { childId, questionIds, title } = body

  if (!childId || !Array.isArray(questionIds) || questionIds.length === 0) {
    return NextResponse.json({ error: 'childId and a non-empty questionIds array are required' }, { status: 400 })
  }

  const ownsChild = await requireFamilyMatch(childId, auth.parent.familyId)
  if (!ownsChild) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = createServiceRoleClient()

  const { data: validQuestions, error: validateError } = await supabase
    .from('questions')
    .select('id, topic_id')
    .in('id', questionIds)
    .eq('approved', true)
    .not('options', 'is', null)

  if (validateError) return NextResponse.json({ error: validateError.message }, { status: 500 })

  const validIds = new Set((validQuestions || []).map(q => q.id))
  const invalidIds = questionIds.filter((id: string) => !validIds.has(id))
  if (invalidIds.length > 0) {
    return NextResponse.json(
      { error: 'Some selected questions are not assignable (must be approved, multiple-choice questions)', invalidIds },
      { status: 400 }
    )
  }

  // Derived server-side, never trusted from the client: if every selected question shares
  // one topic, tag the assignment with it so completing the assignment can also credit
  // child_topic_progress for that topic (see api/assignments/[id]/items/[itemId]/attempt).
  // A mixed-topic selection (possible when the Library's topic filter is left on "all
  // topics") just leaves this null — there's no single topic to credit, and assignment
  // creation is unaffected either way.
  const distinctTopicIds = new Set((validQuestions || []).map(q => q.topic_id))
  const topicId = distinctTopicIds.size === 1 ? [...distinctTopicIds][0] : null

  const { data: assignment, error: assignmentError } = await supabase
    .from('assignments')
    .insert({
      family_id: auth.parent.familyId,
      child_id: childId,
      created_by_parent_id: auth.parent.parentId,
      title: title || null,
      topic_id: topicId,
    })
    .select()
    .single()

  if (assignmentError || !assignment) {
    return NextResponse.json({ error: assignmentError?.message || 'Failed to create assignment' }, { status: 500 })
  }

  const items = questionIds.map((questionId: string, i: number) => ({
    assignment_id: assignment.id,
    question_id: questionId,
    sort_order: i,
  }))

  const { error: itemsError } = await supabase.from('assignment_items').insert(items)
  if (itemsError) {
    // Roll back the now-orphaned assignment row rather than leaving a parentless assignment behind
    await supabase.from('assignments').delete().eq('id', assignment.id)
    return NextResponse.json({ error: itemsError.message }, { status: 500 })
  }

  return NextResponse.json({ assignment: { ...assignment, itemCount: items.length } }, { status: 201 })
}

// ─── GET /api/assignments?childId= ─────────────────────────────
// Lists a child's assignments with a per-item completion summary, for both
// the child's "My Assignments" screen and a parent's history view — same
// ownership rule as GET /api/progress (child self, or a parent in that family).
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const childId = searchParams.get('childId')
  if (!childId) return NextResponse.json({ error: 'childId required' }, { status: 400 })

  const auth = await authorizeChildAccess(childId)
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.status === 401 ? 'Unauthorized' : 'Forbidden' },
      { status: auth.status }
    )
  }

  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from('assignments')
    .select('id, title, created_at, assignment_items(status)')
    .eq('child_id', childId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const assignments = (data || []).map((a: any) => {
    const items = a.assignment_items || []
    const total = items.length
    const completed = items.filter(
      (it: any) => it.status !== 'not_started' && it.status !== 'attempt_1_wrong'
    ).length
    return {
      id: a.id,
      title: a.title,
      created_at: a.created_at,
      totalItems: total,
      completedItems: completed,
      // Breakdown for a parent's history view — how the child did on each
      // resolved item, not just a pass/fail count.
      correctFirstTry: items.filter((it: any) => it.status === 'correct_first_try').length,
      correctAfterHint: items.filter((it: any) => it.status === 'correct_after_hint').length,
      revealedAnswer: items.filter((it: any) => it.status === 'revealed_answer').length,
    }
  })

  return NextResponse.json({ assignments })
}
