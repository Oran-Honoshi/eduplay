// Which kind of tap-to-answer a question gets in the kids' app.
// Everything is read from the question itself (prompt, answer, picture), so
// existing questions light up without any change to the data.
import { parsePoint, givenPoints, isGridQuestion } from '@/components/kid/GridAnswer'

export type InteractiveKind = 'grid' | 'numberline' | 'shade' | null

const MARK_VERBS = /(סמנו|סמן|סמני|שרטטו|שרטט|ציירו|צייר|mark|plot|draw)/i
// "סומנו שלושה קודקודים…", "נתונים הנקודות…": the points are already there — draw them, don't ask the child to place them
const GIVEN_VERBS = /(סומנו|סומנה|סומן|מסומנ|נתונ|הנקודות הבאות נתונות|are marked|is marked|are given|is given)/i
const SHAPE_WORDS = /(מלבן|ריבוע|משולש|מרובע|מצולע|מקבילית|טרפז|rectangle|square|triangle|quadrilateral|polygon|parallelogram|trapezoid)/i
const FRACTION_RE = /^\s*(\d+)\s*\/\s*(\d+)\s*$/

const isOpen = (q: any) => !(Array.isArray(q?.options) && q.options.length)
const promptOf = (q: any) => String(q?.prompt_he || q?.prompt_en || '')

/** "mark the points A(2,3), B(9,3)…" → the points to place first, and how to join them */
export function plotTask(q: any): { points: [number, number, string][]; join: 'segment' | 'polygon' | 'path' | null; given?: boolean } | null {
  if (q?.visual_data?.type !== 'coordinate') return null
  const given = !MARK_VERBS.test(promptOf(q)) && GIVEN_VERBS.test(promptOf(q))
  if (!given && !MARK_VERBS.test(promptOf(q))) return null
  const steps = q.visual_data.steps || q.visual_data.range || 5
  const q1 = q.visual_data.quadrant === 1 || q.visual_data.quadrant === '1'
  const ans = parsePoint(q.correct_answer)
  const pts = givenPoints(promptOf(q)).filter(([x, y]) =>
    (q1 ? x >= 0 && y >= 0 : true) && Math.abs(x) <= steps && Math.abs(y) <= steps
    && !(ans && ans[0] === x && ans[1] === y))
  if (!pts.length || pts.length > 6) return null
  // given points of a shape the child must complete: join them as an open path, never as a closed (wrong) shape
  const join = given
    ? (pts.length >= 2 ? 'path' : null)
    : pts.length === 2 ? 'segment' : pts.length >= 3 && SHAPE_WORDS.test(promptOf(q)) ? 'polygon' : null
  return { points: pts, join, ...(given ? { given: true } : {}) }
}

/** the number line is the answer: an integer inside its range */
export function isNumberLineQuestion(q: any): boolean {
  if (!isOpen(q) || q?.visual_data?.type !== 'number_line') return false
  const a = Number(String(q.correct_answer ?? '').replace(/[−–]/g, '-').replace(/[()+\s]/g, ''))
  if (!Number.isInteger(a)) return false
  const min = Math.round(Number(q.visual_data.min ?? 0)), max = Math.round(Number(q.visual_data.max ?? 10))
  return a >= min && a <= max && max - min <= 30
}

/** shade parts of a fraction shape; the answer is a fraction it can show */
export function shadeTask(q: any): { d: number; pie: boolean } | null {
  const t = q?.visual_data?.type
  if (!isOpen(q) || (t !== 'fraction' && t !== 'fraction_pie')) return null
  const m = String(q.correct_answer ?? '').match(FRACTION_RE)
  if (!m) return null
  const a = Number(m[1]), b = Number(m[2])
  const d = Number(q.visual_data.d ?? q.visual_data.denominator) || b
  if (!b || a > b || d > 24 || (a * d) % b !== 0) return null   // the shape must be able to show it exactly
  return { d, pie: t === 'fraction_pie' }
}

export function interactiveKind(q: any): InteractiveKind {
  if (isGridQuestion(q)) return 'grid'
  if (isNumberLineQuestion(q)) return 'numberline'
  if (shadeTask(q)) return 'shade'
  return null
}

/** the static picture is replaced by the interactive one */
export const hidesPicture = (q: any) => !!(interactiveKind(q) || plotTask(q))
