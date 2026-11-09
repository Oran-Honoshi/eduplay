import { NextRequest, NextResponse } from 'next/server'
import { requireParentOnlySession, requireFamilyMatch } from '@/lib/session'
import { createServiceRoleClient } from '@/lib/supabase'

// POST /api/quickstart/use { source, id, child_id, ready, count? }
// Makes a new sheet for this family from a quick-start result — no writing
// needed, so it's instant. ready=true → finished (print / send right away);
// ready=false → a draft to adjust (edit, remove, add more with a note).
// The questions are shared rows; removing one only takes it out of this copy,
// and editing one makes this family's own copy (see /api/questions/[id]).
export async function POST(req: NextRequest) {
  const auth = await requireParentOnlySession()
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status })
  const b = await req.json().catch(() => ({}))
  const fam = auth.parent.familyId
  const db = createServiceRoleClient()
  if (b.child_id && !(await requireFamilyMatch(b.child_id, fam))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { data: kid } = b.child_id ? await db.from('children').select('grade, lang_screen').eq('id', b.child_id).maybeSingle() : { data: null }
  const status = b.ready ? 'ready' : 'draft'

  if (b.source === 'mine' || b.source === 'library') {
    const { data: m } = await db.from('materials').select('*').eq('id', b.id).maybeSingle()
    const allowed = m && m.status === 'ready' && (m.family_id === fam || (b.source === 'library' && m.library_status === 'listed'))
    if (!allowed) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const { data, error } = await db.from('materials').insert({
      family_id: fam, child_id: b.child_id || null, kind: m.kind, title: m.title,
      subject_slug: m.subject_slug, grade: m.grade, language: m.language, request_text: m.request_text,
      plan: { ...m.plan, topics: (m.plan?.topics || []).map((t: any) => ({ ...t, reuse: 0 })), quickstart_from: m.id },
      question_ids: m.question_ids, topic_ids: m.topic_ids, section_q: m.section_q, time_minutes: m.time_minutes, status,
      parent_material_id: m.family_id === fam ? m.id : null,
    }).select('*').single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (b.source === 'library') await db.from('materials').update({ download_count: (m.download_count || 0) + 1 }).eq('id', m.id)
    return NextResponse.json({ material: data })
  }

  if (b.source === 'bank') {
    const { data: t } = await db.from('topic_bank').select('*').eq('topic_id', b.id).maybeSingle()
    const { data: topic } = await db.from('topics').select('id, slug, title_he, title_en').eq('id', b.id).maybeSingle()
    if (!t || !topic) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const want = Math.max(4, Math.min(20, Number(b.count) || 12, t.n))
    const { data: qs } = await db.from('questions').select('id, difficulty, q_type').eq('topic_id', b.id).eq('approved', true).limit(400)
    const order: Record<string, number> = { easy: 0, medium: 1, hard: 2 }
    const pick = (qs || []).sort(() => Math.random() - 0.5).slice(0, want)
      .sort((a: any, c: any) => (order[a.difficulty] ?? 1) - (order[c.difficulty] ?? 1))
    const ids = pick.map((q: any) => q.id)
    const qTypes = [...new Set(pick.map((q: any) => q.q_type))]
    const lang = t.subject_slug === 'english' ? 'bilingual' : 'he_only'
    const { data, error } = await db.from('materials').insert({
      family_id: fam, child_id: b.child_id || null, kind: 'practice', title: `תרגול: ${topic.title_he || topic.title_en}`,
      subject_slug: t.subject_slug, grade: kid?.grade ?? t.grade, language: lang,
      plan: {
        difficulty: 'progressive', q_types: qTypes, quickstart_from: `topic:${topic.id}`,
        topics: [{ key: 't1', title_he: topic.title_he, title_en: topic.title_en, topic_id: topic.id, topic_slug: topic.slug, count: ids.length, reuse: 0, bank_count: t.n, is_new: false }],
      },
      question_ids: ids, topic_ids: [topic.id], status,
    }).select('*').single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ material: data })
  }
  return NextResponse.json({ error: 'Unknown source' }, { status: 400 })
}
