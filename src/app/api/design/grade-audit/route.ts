import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase'
import { designAllowed } from '@/lib/designAccess'

// A file for checking the bank against the grades, to share with another reviewer (a person or a model).
//   /api/design/grade-audit?key=…                 → Markdown: grade → subject → unit → topic, counts and 3 sample questions each
//   /api/design/grade-audit?key=…&format=csv      → CSV: every approved question (id, grade, subject, unit, topic, type, prompt, answer)
//   &held=1 also lists questions on hold. Read-only; shows bank questions only, never children or families.
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const GRADE = (g: number | null) => (g === 0 ? 'גן' : g == null ? 'ללא כיתה' : `כיתה ${['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י', 'יא', 'יב'][g] || g}`)
const SUBJ: Record<string, string> = { math: 'חשבון', hebrew: 'עברית', english: 'אנגלית' }
const one = (s: unknown, n = 140) => String(s ?? '').replace(/[֑-ׇ]/g, '').replace(/\s+/g, ' ').trim().slice(0, n)
const subjOf = (t: any): string => (Array.isArray(t.subject) ? t.subject[0]?.slug : subjOf(t)) || ''
const csv = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`

export async function GET(req: NextRequest) {
  const sp = Object.fromEntries(req.nextUrl.searchParams)
  if (!designAllowed(sp)) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const sb = createServiceRoleClient()

  const { data: topicsRaw } = await sb.from('topics').select('id, slug, grade, sort_order, title_he, title_en, description_en, unit_he, unit_en, subject:subjects(slug)').order('grade').order('sort_order')
  const topics: any[] = topicsRaw || []
  const byTopic = new Map<string, any>((topics).map((t: any) => [t.id, t]))

  const rows: any[] = []
  for (let from = 0; ; from += 1000) {   // the database returns at most 1,000 rows per request
    let q = sb.from('questions').select('id, topic_id, q_type, difficulty, grade, prompt_he, prompt_en, correct_answer, options, approved').order('id').range(from, from + 999)
    if (sp.held !== '1') q = q.eq('approved', true)
    const { data, error } = await q
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    rows.push(...(data || []))
    if (!data || data.length < 1000) break
  }

  const kind = (q: any) => (Array.isArray(q.options) && q.options.length ? 'בחירה' : 'פתוחה')
  const text = (q: any) => one(q.prompt_he || q.prompt_en)

  if (sp.format === 'csv') {
    const out = ['id,grade,subject,unit,topic_slug,topic,type,difficulty,question,answer']
    for (const q of rows) {
      const t = byTopic.get(q.topic_id); if (!t) continue
      out.push([q.id, t.grade, subjOf(t), t.unit_he || t.unit_en, t.slug, t.title_he || t.title_en, kind(q), q.difficulty, one(q.prompt_he || q.prompt_en, 400), one(q.correct_answer, 80)].map(csv).join(','))
    }
    return new NextResponse('﻿' + out.join('\n'), { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': 'attachment; filename="eduplay-questions-by-grade.csv"' } })
  }

  // questions for the visual generator (scripts/visual-generator): ?format=json&grade_max=3&subject=math&no_visual=1
  if (sp.format === 'json') {
    const gmax = Number(sp.grade_max ?? 3)
    const LET = ['גן', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז']
    const list = rows.filter(q => { const t = byTopic.get(q.topic_id); return t && t.grade != null && t.grade <= gmax && (!sp.subject || subjOf(t) === sp.subject) })
    const ids = new Set(list.map(q => q.id))
    const vis = new Map<string, any>()
    for (let from = 0; ; from += 1000) {
      const { data } = await sb.from('questions').select('id, visual_data').order('id').range(from, from + 999)
      ;(data || []).forEach((r: any) => ids.has(r.id) && vis.set(r.id, r.visual_data))
      if (!data || data.length < 1000) break
    }
    const out = list.filter(q => sp.no_visual !== '1' || !vis.get(q.id)).map(q => {
      const t = byTopic.get(q.topic_id)
      const opts: any[] = Array.isArray(q.options) ? q.options : []
      const right = opts.find(o => o.isCorrect)
      return { id: q.id, text: q.prompt_he || q.prompt_en, answer: right ? (right.value_he || right.value_en) : q.correct_answer, subject: subjOf(t), grade: LET[t.grade] ?? String(t.grade), lesson: t.slug, options: opts.map(o => o.value_he || o.value_en) }
    })
    return NextResponse.json(out, { headers: { 'content-disposition': 'attachment; filename="visual-generator-input.json"' } })
  }

  const perTopic = new Map<string, any[]>()
  for (const q of rows) { const a = perTopic.get(q.topic_id) || []; a.push(q); perTopic.set(q.topic_id, a) }

  const L: string[] = []
  L.push('# EduPlay: נושאי השאלות לפי כיתה', '')
  L.push('**מטרה לבודק (אדם או מודל):** לכל נושא, האם הוא מתאים לכיתה שבה הוא נמצא לפי תוכנית הלימודים הישראלית? סמנו: ✔ מתאים · ⬆ מוקדם מדי (להעביר לכיתה גבוהה יותר) · ⬇ קל מדי (להעביר נמוך יותר) · ✖ לא רלוונטי לגיל, עם הכיתה המומלצת ונימוק של משפט אחד. שימו לב גם לשאלות הדוגמה: לפעמים הנושא מתאים והשאלה לא.', '')
  L.push('כיתה 0 = גן. "n" = מספר השאלות המאושרות בנושא. "כיתות השאלות" מופיע רק כשהוא שונה מכיתת הנושא.', '')
  const groups = new Map<string, any[]>()
  for (const t of topics || []) {
    const key = `${t.grade ?? 99}|${subjOf(t)}`
    groups.set(key, [...(groups.get(key) || []), t])
  }
  let lastGrade: string | null = null
  const total = { topics: 0, qs: 0 }
  for (const key of [...groups.keys()].sort((a, b) => (Number(a.split('|')[0]) - Number(b.split('|')[0])) || a.localeCompare(b))) {
    const [g, subj] = key.split('|')
    if (g !== lastGrade) { L.push(`\n## ${GRADE(g === '99' ? null : Number(g))}`); lastGrade = g }
    L.push(`\n### ${SUBJ[subj] || subj}`)
    for (const t of groups.get(key)!) {
      const qs = perTopic.get(t.id) || []
      if (!qs.length) continue
      total.topics++; total.qs += qs.length
      const gr = new Map<string, number>(); qs.forEach(q => gr.set(String(q.grade ?? '?'), (gr.get(String(q.grade ?? '?')) || 0) + 1))
      const diff = [...gr.keys()].some(k => k !== String(t.grade))
      const open = qs.filter(q => kind(q) === 'פתוחה').length
      L.push(`\n**${t.title_he || t.title_en}**${t.unit_he || t.unit_en ? ` · יחידה: ${t.unit_he || t.unit_en}` : ''} · \`${t.slug}\` · n=${qs.length}${open ? ` (פתוחות: ${open})` : ''}${diff ? ` · כיתות השאלות: ${[...gr].map(([k, v]) => `${k}:${v}`).join(', ')}` : ''}`)
      if (t.description_en) L.push(`  - תיאור: ${one(t.description_en, 120)}`)
      const step = Math.max(1, Math.floor(qs.length / 3))
      for (const q of [0, 1, 2].map(i => qs[Math.min(qs.length - 1, i * step)]).filter((q, i, a) => a.indexOf(q) === i)) L.push(`  - ${text(q)}`)
    }
  }
  L.splice(5, 0, `סה״כ ${total.topics} נושאים · ${total.qs} שאלות מאושרות.`, '')
  return new NextResponse(L.join('\n'), { headers: { 'content-type': 'text/markdown; charset=utf-8', 'content-disposition': 'attachment; filename="eduplay-topics-by-grade.md"' } })
}
