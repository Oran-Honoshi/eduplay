import { NextRequest, NextResponse } from 'next/server'
import { requireParentOnlySession } from '@/lib/session'
import { createServiceRoleClient } from '@/lib/supabase'
import { tokens, textScore, fitScore } from '@/lib/quickstart'

export const dynamic = 'force-dynamic'

// GET /api/quickstart?q=&grade=&subject= — the closest ready-made starts.
export async function GET(req: NextRequest) {
  const auth = await requireParentOnlySession()
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status })
  const sp = req.nextUrl.searchParams
  const words = tokens(sp.get('q') || '')
  if (!words.length) return NextResponse.json({ results: [] })
  // "כיתה ה" in the search wins over the chosen child's grade
  const gm = (sp.get('q') || '').match(/כיתה\s*([א-ט])['׳]?(?![א-ת])/)
  const grade = gm ? 'אבגדהוזחט'.indexOf(gm[1]) + 1 : sp.get('grade') ? Number(sp.get('grade')) : null
  const subject = sp.get('subject') || null
  const db = createServiceRoleClient()
  const fam = auth.parent.familyId

  const [{ data: mine }, { data: lib }, { data: bank }] = await Promise.all([
    db.from('materials').select('id, kind, title, subject_slug, grade, question_ids, plan, request_text, created_at')
      .eq('family_id', fam).eq('status', 'ready').in('kind', ['practice', 'exam']).order('created_at', { ascending: false }).limit(150),
    db.from('materials').select('id, kind, title, subject_slug, grade, question_ids, plan, download_count')
      .eq('library_status', 'listed').eq('status', 'ready').neq('family_id', fam).in('kind', ['practice', 'exam']).limit(300),
    db.from('topic_bank').select('topic_id, title_he, title_en, grade, grades, subject_slug, n').gte('n', 8).limit(500),
  ])

  const matText = (m: any) => [m.title, m.request_text, ...(m.plan?.tags || []), ...(m.plan?.topics || []).flatMap((t: any) => [t.title_he, t.title_en, ...(t.subtopics_he || [])])].join(' ')
  type R = { source: 'mine' | 'library' | 'bank'; id: string; title: string; kind: string; subject_slug: string; grade: number | null; count: number; score: number; topics?: string[] }
  const out: R[] = []
  for (const m of mine || []) {
    const ts = textScore(words, matText(m)); if (!ts) continue
    out.push({ source: 'mine', id: m.id, title: m.title, kind: m.kind, subject_slug: m.subject_slug, grade: m.grade, count: (m.question_ids || []).length, score: ts + fitScore(grade, subject, m) + 0.5 })
  }
  for (const m of lib || []) {
    const ts = textScore(words, matText(m)); if (!ts) continue
    out.push({ source: 'library', id: m.id, title: m.title, kind: m.kind, subject_slug: m.subject_slug, grade: m.grade, count: (m.question_ids || []).length, score: ts + fitScore(grade, subject, m) + Math.min(1, (m.download_count || 0) / 20) })
  }
  for (const t of bank || []) {
    const ts = textScore(words, `${t.title_he} ${t.title_en}`); if (!ts) continue
    out.push({ source: 'bank', id: t.topic_id, title: t.title_he || t.title_en, kind: 'practice', subject_slug: t.subject_slug, grade: t.grade, count: t.n, score: ts + fitScore(grade, subject, t) })
  }
  const top = out.filter(r => r.score > 0).sort((a, b) => b.score - a.score).slice(0, 8)

  // a peek at what's inside: three questions from each
  const sample = async (r: R) => {
    if (r.source === 'bank') {
      const { data } = await db.from('questions').select('prompt_he, prompt_en').eq('topic_id', r.id).eq('approved', true).limit(3)
      return (data || []).map((q: any) => q.prompt_he || q.prompt_en)
    }
    const m = [...(mine || []), ...(lib || [])].find((x: any) => x.id === r.id)
    const ids = (m?.question_ids || []).slice(0, 3)
    if (!ids.length) return []
    const { data } = await db.from('questions').select('id, prompt_he, prompt_en').in('id', ids)
    return ids.map((id: string) => (data || []).find((q: any) => q.id === id)).filter(Boolean).map((q: any) => q.prompt_he || q.prompt_en)
  }
  const results = await Promise.all(top.map(async r => ({ ...r, sample: await sample(r) })))
  return NextResponse.json({ results })
}
