// Deterministic checks on a generated question, before it can be saved. No model involved: these are facts that can be
// computed, so they are never left to a prompt. Each issue says what is wrong; "block" ones discard the question.
// (The model-based second opinion lives in questionVerify.ts.)
import { answersMatch, parseNumeric } from '@/lib/answerMatch'

export type Issue = { code: string; detail: string; block: boolean }
export type CheckQ = { prompt_he?: string | null; prompt_en?: string | null; q_type?: string; options?: any[] | null; correct_answer?: any; visual_data?: any }

const textOf = (q: CheckQ) => `${q.prompt_he || ''} ${q.prompt_en || ''}`.trim()
const optVal = (o: any) => String(o?.value_he ?? o?.value_en ?? '').trim()

/** every point/ray label the picture shows: any short capital-letter string in the data */
function visualLetters(v: any): Set<string> {
  const out = new Set<string>()
  const walk = (x: any, key = '') => {
    if (typeof x === 'string') { if (/^[A-Z]{1,3}$/.test(x.trim()) && key !== 'type') for (const ch of x.trim()) out.add(ch) }
    else if (Array.isArray(x)) x.forEach(e => walk(e, key))
    else if (x && typeof x === 'object') for (const [k, e] of Object.entries(x)) walk(e, k)
  }
  walk(v)
  return out
}

const COUNT_WORDS: Record<string, number> = { 'שתי': 2, 'שני': 2, 'שלוש': 3, 'שלושה': 3, 'ארבע': 4, 'ארבעה': 4, 'חמש': 5, 'חמישה': 5 }
const FIGURE = /(משולש|מרובע|מלבן|ריבוע|מקבילית|טרפז|מעוין|דלתון|מצולע)\s+([A-Z]{3,6})(?![A-Za-z])/g

/** the safe evaluator for "a + b × c = ?" style prompts */
export function evalArithmetic(expr: string): number | null {
  let s = expr.replace(/[−–‐-―]/g, '-').replace(/[×x*·]/gi, '*').replace(/[÷:]/g, '/').replace(/\^/g, '**')
  s = s.replace(/(\d),(\d{3})(?!\d)/g, '$1$2').replace(/(\d),(\d{1,2})(?!\d)/g, '$1.$2')
  if (!/^[\d\s+\-*/().]+$/.test(s) || s.length > 70) return null
  if (!/\d\s*[+\-*/]|[*/]|\*\*/.test(s.replace(/^\s*[-+]/, ''))) return null
  try {
    const v = Function(`"use strict";return (${s})`)()
    return typeof v === 'number' && isFinite(v) ? v : null
  } catch { return null }
}

export function deterministicIssues(q: CheckQ): Issue[] {
  const issues: Issue[] = []
  const text = textOf(q)
  const opts = Array.isArray(q.options) ? q.options : []
  const v = q.visual_data && typeof q.visual_data === 'object' ? q.visual_data : null

  // 1. the answer key
  let answerText = ''
  if (opts.length) {
    const right = opts.filter(o => o?.isCorrect)
    if (right.length !== 1) issues.push({ code: right.length ? 'MULTIPLE_CORRECT' : 'NO_CORRECT', detail: `${right.length} options are marked correct`, block: true })
    answerText = optVal(right[0])
    const ca = String(q.correct_answer ?? '').trim()
    if (right.length === 1 && ca) {
      const same = [right[0].value_he, right[0].value_en, right[0].label].some(x => x != null && (String(x).trim() === ca || answersMatch(ca, String(x))))
      if (!same) issues.push({ code: 'ANSWER_KEY_MISMATCH', detail: `correct_answer "${ca}" is not the option marked correct ("${answerText}")`, block: true })
    }
  } else answerText = String(q.correct_answer ?? '').trim()

  // 1b. a dash used as a list separator before a number ("יום א׳ - 15 תלמידים"):
  //     it displays as a minus sign and breaks the line. Data must be written "יום א׳: 15 תלמידים".
  if (/[א-ת׳'"]\s[-–−]\s\d/.test(String((q as any).prompt_he ?? text))) {
    issues.push({ code: 'DASH_AS_SEPARATOR', detail: 'a dash is used as a separator before a number; write "יום א׳: 15 תלמידים" instead', block: true })
  }

  // 1c. the text points at a figure that does not exist ("בגרף", "במשולש KLM", "באיור", "משורטט")
  if (!v && !(q as any).image_url && /(?:באיור|בציור|בשרטוט|בגרף|בתרשים|במערכת הצירים|משורטט|מצויר|מוצג(?:ת)? (?:בגרף|באיור)|במשולש [A-Z]{3}|במלבן [A-Z]{4}|בריבוע [A-Z]{4}|בזווית [A-Z]{3})/.test(String((q as any).prompt_he ?? text))) {
    issues.push({ code: 'FIGURE_MISSING', detail: 'the question refers to a figure/graph/table but has no picture data', block: true })
  }

  // 1d. options written in visual right-to-left order: the minus sits after the number ("35-"),
  //     or the English gloss leaks the answer ("... correct"). Math is always stored left to right.
  if (/\(\s*\d[\d.,/]*\s*-\s*\)|\d\s*-\s*(?:מטר|מעלות|ש״ח|₪)/.test(String((q as any).prompt_he ?? text))) {
    issues.push({ code: 'SIGN_AFTER_NUMBER', detail: 'the question text has a minus after the number ("(4-)"); write "(-4)"', block: true })
  }
  for (const o of opts) {
    for (const val of [o?.value_he, o?.value_en]) {
      const t = String(val ?? '').trim()
      if (/\d\s*[-−–]$/.test(t) || /[=+×÷]\s*\d[\d.,/]*\s*[-−–]\s*$/.test(t)) {
        issues.push({ code: 'SIGN_AFTER_NUMBER', detail: `option "${t}" has the minus after the number; write math left to right ("-35")`, block: true })
      }
    }
    if (/\b(correct|wrong|incorrect)\b/i.test(String(o?.value_en ?? ''))) {
      issues.push({ code: 'ANSWER_LEAK', detail: `option value_en "${o.value_en}" contains the word correct/wrong`, block: true })
    }
  }

  // 1e. two options that are the same expression with different results, or a doubled minus
  const exprs = opts.map(o => String(o?.value_he ?? o?.value_en ?? '').replace(/\s/g, ''))
  for (let i = 0; i < exprs.length; i++) {
    for (let j = i + 1; j < exprs.length; j++) {
      if (exprs[i].includes('=') && exprs[i].split('=')[0] === exprs[j].split('=')[0] && exprs[i] !== exprs[j]) {
        issues.push({ code: 'SAME_EXPRESSION_DIFFERENT_RESULT', detail: `options "${exprs[i]}" and "${exprs[j]}" have the same expression with different results; each option needs its own expression`, block: true })
      }
    }
  }
  if (exprs.some(e => /[-−]\s*[-−]/.test(e.replace(/\)-\(/g, '')) )) {
    issues.push({ code: 'DOUBLE_MINUS', detail: 'an option has two minus signs in a row (e.g. "=--150")', block: true })
  }

  // 2. arithmetic that can simply be computed
  const m = text.match(/([\d\s+\-−×x÷:*/.,()^]{3,70}?)\s*=\s*(?:\?|☐|_{2,}|□|$)/)
  if (m && answerText) {
    const val = evalArithmetic(m[1])
    if (val != null && /\d/.test(answerText)) {
      const num = parseNumeric(answerText)
      const r6 = Math.round(val * 1e6) / 1e6
      if (num != null && Math.abs(num - val) > 1e-6 * Math.max(1, Math.abs(val)) && !answersMatch(answerText, String(r6)))
        issues.push({ code: 'ARITHMETIC_WRONG', detail: `${m[1].trim()} = ${Math.round(val * 1e6) / 1e6}, but the marked answer is "${answerText}"`, block: true })
    }
  }

  if (v) {
    const type = String(v.type || '')
    const strict = true   // every picture type that can carry letters must carry the ones the text uses
    // 3. every point or ray named in the text is in the picture
    const named = new Set<string>()
    for (const t of text.matchAll(/(?<![A-Za-z])([A-Z]{1,6})(?![A-Za-z])/g)) for (const ch of t[1]) named.add(ch)
    if (named.size && ['coordinate', 'angle', 'triangle', 'rectangle', 'square', 'parallelogram', 'trapezoid', 'polygon'].includes(type)) {
      const have = visualLetters(v)
      const missing = [...named].filter(c => !have.has(c))
      if (missing.length) issues.push({ code: 'TEXT_NAMES_MISSING_POINT', detail: `the text names ${missing.join(', ')} but the picture does not show ${missing.length > 1 ? 'them' : 'it'}`, block: strict })
    }
    // 3b. "the angle marked in the figure" means an angle is marked in the figure
    if (['triangle', 'rectangle', 'square', 'parallelogram', 'trapezoid', 'polygon'].includes(type) && /(מסומנת הזווית|הזווית המסומנת|מסומנת בקשת|בקשת|marked angle|angle marked)/.test(text) && (v.mark_angle == null || v.mark_angle === '') && !(Array.isArray(v.angles) && v.angles.length))
      issues.push({ code: 'ANGLE_MARK_MISSING', detail: 'the text refers to a marked angle but the picture marks none', block: true })
    // 4. "three rays" means three rays are drawn
    if (type === 'angle') {
      const cm = text.match(/(שתי|שני|שלוש|שלושה|ארבע|ארבעה|חמש|חמישה)\s+קרניים/)
      if (cm) {
        const drawn = Array.isArray(v.rays) ? v.rays.length : 2
        if (drawn !== COUNT_WORDS[cm[1]]) issues.push({ code: 'RAY_COUNT_MISMATCH', detail: `the text says ${cm[1]} rays, the picture draws ${drawn}`, block: true })
      }
    }
    // 5. a named figure (triangle CDE, rectangle ABCD) is actually drawn closed
    if (type === 'coordinate' && Array.isArray(v.points)) {
      const at = new Map<string, [number, number]>(); for (const p of v.points) if (Array.isArray(p) && p[2]) at.set(String(p[2]), [Number(p[0]), Number(p[1])])
      const key = (a: number[], b: number[]) => [a.join(','), b.join(',')].sort().join('|')
      const edges = new Set<string>()
      const ring = (pts: any[]) => { for (let i = 0; i < pts.length; i++) edges.add(key(pts[i], pts[(i + 1) % pts.length])) }
      if (Array.isArray(v.polygon) && v.polygon.length > 2) ring(v.polygon)
      for (const s of Array.isArray(v.segments) ? v.segments : []) if (Array.isArray(s) && s.length === 2) edges.add(key(s[0], s[1]))
      for (const f of text.matchAll(FIGURE)) {
        const L = f[2].split(''); const pts = L.map(c => at.get(c))
        if (pts.some(p => !p)) continue   // missing letters are reported by check 3
        const open = L.filter((_, i) => !edges.has(key(pts[i]!, pts[(i + 1) % L.length]!))).map((c, i, a) => `${c}${L[(L.indexOf(c) + 1) % L.length]}`)
        if (open.length) issues.push({ code: 'FIGURE_NOT_DRAWN', detail: `${f[1]} ${f[2]} is named in the text but the side${open.length > 1 ? 's' : ''} ${open.join(', ')} ${open.length > 1 ? 'are' : 'is'} not drawn`, block: true })
      }
    }
  }
  return issues
}
