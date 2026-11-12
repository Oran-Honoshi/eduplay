// Design tokens for the kids' question screens (designer handover
// EduPlay_QuestionScreens/tokens.json, 2026-11). Components read them as CSS
// variables set on the page, so nothing hard-codes a subject color.

export type SubjectKey = 'math' | 'heb' | 'eng' | 'read'

export const SUBJECTS: Record<SubjectKey, { he: string; en: string; main: string; soft: string; dark: string; on: string }> = {
  math: { he: 'חשבון', en: 'Math', main: '#2F5BE3', soft: '#EAF0FF', dark: '#1E3FA8', on: '#FFFFFF' },
  heb: { he: 'עברית', en: 'Hebrew', main: '#E85D3F', soft: '#FDECE7', dark: '#B7432A', on: '#16213E' },
  eng: { he: 'אנגלית', en: 'English', main: '#12937A', soft: '#E3F5EF', dark: '#0B6B59', on: '#FFFFFF' },
  read: { he: 'קריאה', en: 'Reading', main: '#FFC940', soft: '#FFF4D1', dark: '#B98A00', on: '#16213E' },
}

export const TYPE_BY_GRADE: Record<number, { q: number; opt: number; tile: number }> = {
  1: { q: 50, opt: 60, tile: 210 },
  2: { q: 48, opt: 56, tile: 200 },
  3: { q: 44, opt: 50, tile: 180 },
  4: { q: 42, opt: 46, tile: 170 },
  5: { q: 38, opt: 40, tile: 150 },
  6: { q: 38, opt: 36, tile: 140 },
}

export const GRADE_HE = ['', 'א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳']

const READING = /reading|comprehension|kriya|literature|sfrut|poetry/

/** subject slug + topic slug → the design's subject key */
export function subjectKey(subjectSlug: string | undefined, topicSlug?: string | null): SubjectKey {
  if (subjectSlug === 'english') return 'eng'
  if (subjectSlug === 'hebrew') return READING.test(topicSlug || '') ? 'read' : 'heb'
  return 'math'
}

export function subjectVars(k: SubjectKey): React.CSSProperties {
  const c = SUBJECTS[k]
  return { ['--s-main' as any]: c.main, ['--s-soft' as any]: c.soft, ['--s-dark' as any]: c.dark, ['--s-on' as any]: c.on }
}

export function gradeType(grade: number | undefined) {
  return TYPE_BY_GRADE[Math.min(6, Math.max(1, Number(grade) || 3))]
}
