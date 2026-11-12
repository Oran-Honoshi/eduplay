import 'server-only'
import { askClaudeJSON } from '@/lib/claude'
import { curriculumNote, readingLevel } from '@/lib/curriculum'

// The reading-level pass (Oran, 2026-11-12). For every question:
//   1. does it fit the Ministry goals for its grade? (else: suggested grade, reason)
//   2. the Hebrew text gets the niqqud its grade needs: full in א׳–ב׳, partial in ג׳,
//      only on ambiguous words in ד׳, none after. Only niqqud is added: the letters
//      are checked to be identical, or the change is dropped.
// Niqqud is applied straight away (with a backup); the grade suggestions wait in
// /admin/design next to each question, with the move button.

export const LEVEL_BATCH = 'level-2026-11'

const SUBJ_HE: Record<string, string> = { math: 'חשבון', hebrew: 'עברית', english: 'אנגלית' }

export type LevelDraft = {
  id: string
  fit: 'fits' | 'too_easy' | 'too_hard' | 'other_subject'
  suggest_grade?: number | null
  reason_he?: string | null
  text?: { prompt_he?: string | null; options_he?: (string | null)[] | null; hint_he?: string | null; explanation_he?: string | null; question?: string | null; helper?: string | null; right?: string | null; wrong?: string | null } | null
}

const NIQQUD_RULE: Record<string, string> = {
  full: 'Add FULL niqqud to every Hebrew word (school-book style, as in a first-grade reader).',
  partial: 'Add niqqud ONLY to words a third-grader may misread (rare words, homographs, names); leave common words plain.',
  ambiguous: 'Add niqqud ONLY where a word is genuinely ambiguous without it; most questions need none.',
  none: '',
}

export async function draftLevel(topic: any, questions: any[]) {
  const subj = topic.subject?.slug || 'math'
  const grade = Number(topic.grade) || 3
  const lvl = readingLevel(grade)
  const withText = lvl.niqqud !== 'none'
  const system = `You check practice questions of an Israeli kids' learning app against the Ministry of Education program. Subject: ${SUBJ_HE[subj] || subj}, grade ${grade}, lesson "${topic.title_he || topic.title_en}".
${curriculumNote(subj, grade)}
For EACH question return one object:
{"id":"<same id>","fit":"fits"|"too_easy"|"too_hard"|"other_subject","suggest_grade":<1–6 or null>,"reason_he":"<one short Hebrew sentence, only when not fits>"${withText ? ',"text":{"prompt_he":"...","options_he":["..."],"hint_he":"...","explanation_he":"...","question":"...","helper":"...","right":"...","wrong":"..."}' : ''}}
FIT: "fits" when the question practises a goal of this grade (or a natural review of the grade below). "too_easy"/"too_hard" when it clearly belongs to another grade: give suggest_grade. "other_subject" when it belongs to another subject. Be fair: do not flag a question just because it is easy or hard within the grade.
${withText ? `NIQQUD: ${NIQQUD_RULE[lvl.niqqud]}
In "text", return each Hebrew field you were given (prompt_he, options_he in the same order, hint_he, explanation_he, and design question/helper/right/wrong), with niqqud ADDED. Change NOTHING else: the same letters, words, spaces, punctuation, numbers, English words and markup ([[ ]], <<n: >>) must stay exactly as given. A field you were not given or that has no Hebrew: null.` : ''}
Output JSON only: an array with exactly one object per question, same ids.`
  const items = questions.map(q => ({
    id: q.id,
    prompt_he: q.prompt_he || null,
    prompt_en: subj === 'english' ? q.prompt_en || null : undefined,
    options_he: Array.isArray(q.options) ? q.options.map((o: any) => o.value_he ?? null) : null,
    correct: Array.isArray(q.options) ? q.options.find((o: any) => o.isCorrect)?.value_he ?? q.options.find((o: any) => o.isCorrect)?.value_en ?? null : q.correct_answer,
    ...(withText ? { hint_he: q.hint_he || null, explanation_he: q.explanation_he || null, question: q.design?.he?.question || null, helper: q.design?.he?.helper || null, right: q.design?.he?.right || null, wrong: q.design?.he?.wrong || null } : {}),
  }))
  return askClaudeJSON<LevelDraft[]>({ system, content: JSON.stringify(items), maxTokens: (withText ? 1400 : 250) * questions.length + 400 })
}

// ── checks ─────────────────────────────────────────────────
const NIQQUD = /[֑-ׇ]/g
export const bare = (t: string | null | undefined) => String(t ?? '').replace(NIQQUD, '').replace(/\s+/g, ' ').trim()
const same = (a: any, b: any) => bare(a) === bare(b)

/** the changes to save: only fields whose letters are unchanged */
export function checkLevel(q: any, d: LevelDraft): { update: any; design: any | null; fit: any; dropped: string[] } {
  const update: any = {}
  const dropped: string[] = []
  const t = d.text || {}
  for (const f of ['prompt_he', 'hint_he', 'explanation_he'] as const) {
    if (t[f] && q[f]) { if (same(t[f], q[f])) { if (t[f] !== q[f]) update[f] = t[f] } else dropped.push(f) }
  }
  if (Array.isArray(t.options_he) && Array.isArray(q.options) && t.options_he.length === q.options.length) {
    let ok = true
    const opts = q.options.map((o: any, i: number) => {
      const n = t.options_he![i]
      if (!o.value_he || !n) return o
      if (!same(n, o.value_he)) { ok = false; return o }
      return { ...o, value_he: n }
    })
    if (ok) { if (JSON.stringify(opts) !== JSON.stringify(q.options)) update.options = opts } else dropped.push('options')
  }
  let design: any = null
  if (q.design?.he) {
    const he = { ...q.design.he }
    let changed = false
    for (const f of ['question', 'helper', 'right', 'wrong'] as const) {
      const n = (t as any)[f]
      if (n && he[f]) { if (same(n, he[f])) { if (n !== he[f]) { he[f] = n; changed = true } } else dropped.push(`design.${f}`) }
    }
    if (changed) design = { ...q.design, he }
  }
  const fit = { fit: d.fit || 'fits', suggest_grade: d.suggest_grade ?? null, reason_he: d.reason_he || null }
  return { update, design, fit, dropped }
}
