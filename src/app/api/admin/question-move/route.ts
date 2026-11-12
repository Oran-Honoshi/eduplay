import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase'
import { requireAdmin } from '@/lib/admin'

export const dynamic = 'force-dynamic'

// Admin review: keep a question but move it to the lesson and grade it belongs to.
//   GET ?subject=math            → K–6 lessons of that subject, for the picker
//   POST {action:'move', questionId, topicId} → move (logged in question_moves)
//   POST {action:'undo', questionId}          → back to where it was before the last move
export async function GET(req: NextRequest) {
  const a = await requireAdmin()
  if (!a.ok) return NextResponse.json({ error: 'Forbidden' }, { status: a.status })
  const db = createServiceRoleClient()
  const subject = req.nextUrl.searchParams.get('subject') || 'math'
  const { data: sub } = await db.from('subjects').select('id').eq('slug', subject).maybeSingle()
  if (!sub) return NextResponse.json({ topics: [] })
  const { data: topics } = await db.from('topics').select('id, grade, title_he, title_en, sort_order').eq('subject_id', sub.id).lte('grade', 6).gte('grade', 1).order('grade').order('sort_order')
  return NextResponse.json({ topics: topics || [] })
}

export async function POST(req: NextRequest) {
  const a = await requireAdmin()
  if (!a.ok) return NextResponse.json({ error: 'Forbidden' }, { status: a.status })
  const db = createServiceRoleClient()
  const b = await req.json().catch(() => ({}))
  if (!b.questionId) return NextResponse.json({ error: 'Missing question' }, { status: 400 })
  const { data: q } = await db.from('questions').select('id, topic_id, grade').eq('id', b.questionId).maybeSingle()
  if (!q) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (b.action === 'move' && b.topicId) {
    const { data: t } = await db.from('topics').select('id, grade, subject_id').eq('id', b.topicId).maybeSingle()
    const { data: from } = await db.from('topics').select('subject_id').eq('id', q.topic_id).maybeSingle()
    if (!t) return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    if (from && from.subject_id !== t.subject_id) return NextResponse.json({ error: 'Same subject only' }, { status: 400 })
    if (t.id === q.topic_id) return NextResponse.json({ ok: true, unchanged: true })
    const { error } = await db.from('questions').update({ topic_id: t.id, grade: t.grade }).eq('id', q.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await db.from('question_moves').insert({ question_id: q.id, from_topic: q.topic_id, to_topic: t.id, from_grade: q.grade, to_grade: t.grade, moved_by: a.familyId })
    return NextResponse.json({ ok: true })
  }

  if (b.action === 'undo') {
    const { data: m } = await db.from('question_moves').select('*').eq('question_id', q.id).is('undone_at', null).order('moved_at', { ascending: false }).limit(1).maybeSingle()
    if (!m || !m.from_topic) return NextResponse.json({ error: 'Nothing to undo' }, { status: 404 })
    await db.from('questions').update({ topic_id: m.from_topic, grade: m.from_grade }).eq('id', q.id)
    await db.from('question_moves').update({ undone_at: new Date().toISOString() }).eq('id', m.id)
    return NextResponse.json({ ok: true })
  }
  return NextResponse.json({ error: 'Bad action' }, { status: 400 })
}
