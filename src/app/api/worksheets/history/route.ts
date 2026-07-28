import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase'
import { requireParentOnlySession } from '@/lib/session'

// ─── GET /api/worksheets/history ──────────────────────────────
// Lists a family's past worksheet generations, newest first, for the
// Worksheets "History" tab and its "regenerate exact worksheet" action.
// topic_ids/question_ids are arrays, so PostgREST can't embed-join them —
// batch-fetch children/topics by collected ids and map client-side, the
// same technique builder/route.ts already uses for its own topic lookups.

export async function GET() {
  const auth = await requireParentOnlySession()
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.status === 401 ? 'Unauthorized' : 'Forbidden' },
      { status: auth.status }
    )
  }

  const supabase = createServiceRoleClient()

  const { data: rows, error } = await supabase
    .from('worksheet_generations')
    .select('*')
    .eq('family_id', auth.parent.familyId)
    .order('generated_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!rows || rows.length === 0) return NextResponse.json({ generations: [] })

  const childIds = Array.from(new Set(rows.map(r => r.child_id).filter(Boolean)))
  const topicIds = Array.from(new Set(rows.flatMap(r => r.topic_ids || [])))

  const [{ data: children }, { data: topics }] = await Promise.all([
    childIds.length > 0
      ? supabase.from('children').select('id, display_name').in('id', childIds)
      : Promise.resolve({ data: [] as any[] }),
    topicIds.length > 0
      ? supabase.from('topics').select('id, title_en').in('id', topicIds)
      : Promise.resolve({ data: [] as any[] }),
  ])

  const childById = new Map((children || []).map(c => [c.id, c]))
  const topicById = new Map((topics || []).map(t => [t.id, t]))

  const generations = rows.map(r => ({
    id: r.id,
    child: r.child_id ? childById.get(r.child_id) || null : null,
    topics: (r.topic_ids || []).map((id: string) => topicById.get(id)).filter(Boolean),
    ws_type: r.ws_type,
    difficulty: r.difficulty,
    question_count: r.question_count,
    lang_mode: r.lang_mode,
    include_answer_key: r.include_answer_key,
    include_hints: r.include_hints,
    solution_steps: r.solution_steps,
    question_ids: r.question_ids,
    generated_at: r.generated_at,
  }))

  return NextResponse.json({ generations })
}
