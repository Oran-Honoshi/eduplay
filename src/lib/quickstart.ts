// Quick start: find something close to what the parent wants among
//   · their own finished sheets,
//   · sheets in the free library (shared by parents, approved by EduPlay),
//   · the question bank, by topic.
// Plain word matching with light Hebrew prefix handling, plus grade/subject fit.

const PREFIX = /^(?:ו|ה|ב|ל|מ|ש|כ){1,2}(?=[א-ת]{2,})/
const STOP = new Set(['של', 'את', 'על', 'עם', 'גם', 'או', 'לי', 'אני', 'רוצה', 'צריך', 'צריכה', 'דף', 'דפי', 'תרגול', 'תרגיל', 'תרגילים', 'שאלות', 'for', 'the', 'and', 'practice', 'worksheet', 'כיתה', 'grade'])

export function tokens(q: string): string[] {
  return [...new Set(String(q || '').toLowerCase().normalize('NFC')
    .replace(/[֑-ׇ]/g, '')
    .split(/[^a-z0-9א-ת]+/).filter(w => w.length >= 2 && !STOP.has(w)))]
}

const stem = (w: string) => w.replace(PREFIX, '').replace(/(ים|ות)$/, '')

/** how well a text matches the search words (0 = no word found) */
export function textScore(words: string[], text: string): number {
  const t = String(text || '').toLowerCase().normalize('NFC').replace(/[֑-ׇ]/g, '')
  const stems = t.split(/[^a-z0-9א-ת]+/).filter(Boolean).map(stem)
  let s = 0
  for (const w of words) {
    if (t.includes(w)) { s += 2; continue }
    const ws = stem(w)
    if (ws.length >= 2 && stems.some(x => x.startsWith(ws) || ws.startsWith(x) && x.length >= 3)) s += 1
  }
  return s
}

export function fitScore(grade: number | null, subject: string | null, item: { grade?: number | null; grades?: number[] | null; subject_slug?: string | null }) {
  let s = 0
  if (grade != null) {
    const gs = [item.grade, ...(item.grades || [])].filter((g): g is number => typeof g === 'number')
    const d = gs.length ? Math.min(...gs.map(g => Math.abs(g - grade))) : 2
    s += d === 0 ? 2 : d === 1 ? 1 : -1.5
  }
  if (subject && item.subject_slug) s += item.subject_slug === subject ? 1 : -3
  return s
}
