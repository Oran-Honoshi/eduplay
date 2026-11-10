import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase'
import { requireAdmin } from '@/lib/admin'
import { BANK_BATCH } from '@/lib/bankUpgrade'

export const dynamic = 'force-dynamic'

// Review of the lesson-bank upgrade drafts (admin).
//   GET                 → topics with their draft counts
//   GET ?topic=<id>     → the topic's questions with current and proposed text, and its learn card
//   POST {action:'apply', topicId, questionIds?, card?} → copy the drafts into the live questions (backup first)
//   POST {action:'reject', questionId}                  → leave this question as it is
//   POST {action:'hide', questionId}                    → take a broken question out of the lessons
export async function GET(req: NextRequest) {
  const a = await requireAdmin()
  if (!a.ok) return NextResponse.json({ error: 'Forbidden' }, { status: a.status })
  const db = createServiceRoleClient()
  const topicId = req.nextUrl.searchParams.get('topic')
  if (!topicId) {
    const { data: topics } = await db.from('topics').select('id, slug, grade, title_he, title_en, sort_order, subject:subjects(slug)').lte('grade', 6).order('grade').order('sort_order')
    const { data: drafts } = await db.from('question_support_drafts').select('status, flags, question:questions!inner(topic_id)').eq('batch', BANK_BATCH)
    const { data: cards } = await db.from('topic_explanations').select('topic_slug, status').eq('batch', BANK_BATCH)
    const by: Record<string, { draft: number; applied: number; flagged: number; rejected: number }> = {}
    for (const d of drafts || []) {
      const t = (d as any).question?.topic_id; if (!t) continue
      const r = (by[t] ||= { draft: 0, applied: 0, flagged: 0, rejected: 0 })
      if (d.status === 'applied') r.applied++
      else if (d.status === 'rejected') r.rejected++
      else { r.draft++; if ((d.flags || []).length) r.flagged++ }
    }
    const card = Object.fromEntries((cards || []).map(c => [c.topic_slug, c.status]))
    return NextResponse.json({ topics: (topics || []).map(t => ({ ...t, counts: by[t.id] || null, card: card[t.slug] || null })) })
  }
  const { data: topic } = await db.from('topics').select('id, slug, grade, title_he, title_en, subject:subjects(slug)').eq('id', topicId).maybeSingle()
  if (!topic) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const { data: qs } = await db.from('questions').select('id, prompt_he, prompt_en, options, correct_answer, hint_he, explanation_he, difficulty, q_type, visual_data, approved').eq('topic_id', topicId).eq('approved', true).is('rejected_at', null)
  const ids = (qs || []).map(q => q.id)
  const { data: drafts } = ids.length ? await db.from('question_support_drafts').select('*').in('question_id', ids).eq('batch', BANK_BATCH) : { data: [] }
  const { data: card } = await db.from('topic_explanations').select('*').eq('topic_slug', topic.slug).maybeSingle()
  const dmap = Object.fromEntries((drafts || []).map((d: any) => [d.question_id, d]))
  return NextResponse.json({ topic, card, questions: (qs || []).map(q => ({ ...q, draft: dmap[q.id] || null })) })
}

export async function POST(req: NextRequest) {
  const a = await requireAdmin()
  if (!a.ok) return NextResponse.json({ error: 'Forbidden' }, { status: a.status })
  const db = createServiceRoleClient()
  const b = await req.json().catch(() => ({}))

  if (b.action === 'reject' && b.questionId) {
    await db.from('question_support_drafts').update({ status: 'rejected' }).eq('question_id', b.questionId)
    return NextResponse.json({ ok: true })
  }
  if (b.action === 'hide' && b.questionId) {
    const { data: q } = await db.from('questions').select('*').eq('id', b.questionId).maybeSingle()
    if (q) await db.from('questions_backup_20261110').upsert(q, { onConflict: 'id', ignoreDuplicates: true })
    await db.from('questions').update({ approved: false, rejected_at: new Date().toISOString(), rejected_reason: 'bank review 2026-11' }).eq('id', b.questionId)
    await db.from('question_support_drafts').update({ status: 'rejected' }).eq('question_id', b.questionId)
    return NextResponse.json({ ok: true })
  }
  if (b.action === 'apply' && b.topicId) {
    const { data: topic } = await db.from('topics').select('id, slug').eq('id', b.topicId).maybeSingle()
    if (!topic) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const { data: qs } = await db.from('questions').select('*').eq('topic_id', topic.id).eq('approved', true)
    let ids = (qs || []).map(q => q.id)
    if (Array.isArray(b.questionIds)) ids = ids.filter(id => b.questionIds.includes(id))
    const { data: drafts } = ids.length ? await db.from('question_support_drafts').select('*').in('question_id', ids).eq('batch', BANK_BATCH).eq('status', 'draft') : { data: [] }
    const qById = new Map((qs || []).map(q => [q.id, q]))
    // backup the live rows once, before the first change
    const toBackup = (drafts || []).map((d: any) => qById.get(d.question_id)).filter(Boolean)
    if (toBackup.length) await db.from('questions_backup_20261110').upsert(toBackup as any[], { onConflict: 'id', ignoreDuplicates: true })
    let applied = 0
    for (const d of drafts || []) {
      const upd: any = {}
      if (d.hint_he) upd.hint_he = d.hint_he
      if (d.hint_en) upd.hint_en = d.hint_en
      if (d.explanation_he) upd.explanation_he = d.explanation_he
      if (d.explanation_en) upd.explanation_en = d.explanation_en
      if (d.parent_tip_he) upd.parent_tip_he = d.parent_tip_he
      if (d.prompt_he_fix && b.withFixes !== false) upd.prompt_he = d.prompt_he_fix
      if (!Object.keys(upd).length) continue
      const { error } = await db.from('questions').update(upd).eq('id', d.question_id)
      if (!error) { applied++; await db.from('question_support_drafts').update({ status: 'applied' }).eq('question_id', d.question_id) }
    }
    if (b.card) await db.from('topic_explanations').update({ status: 'approved', updated_at: new Date().toISOString() }).eq('topic_slug', topic.slug).eq('status', 'draft')
    return NextResponse.json({ ok: true, applied })
  }
  return NextResponse.json({ error: 'Bad action' }, { status: 400 })
}
