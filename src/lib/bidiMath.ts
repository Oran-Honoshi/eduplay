// ─────────────────────────────────────────────────────────────
//  Math inside Hebrew text, written the way Israeli schools write it.
//
//  In a right-to-left paragraph the browser reorders "neutral" characters,
//  so "(+5)°C" shows as "(5+)", "-4" as "4-", "3¾" as "¾3" and
//  "(+5)-(+9)=" comes out backwards. Every math run inside Hebrew text is
//  therefore isolated as left-to-right. This one module is used by the app
//  (FractionText), the printed worksheets and the explanation pages, so math
//  looks the same everywhere.
// ─────────────────────────────────────────────────────────────

const VULGAR: Record<string, string> = {
  '¼': '1/4', '½': '1/2', '¾': '3/4', '⅓': '1/3', '⅔': '2/3', '⅕': '1/5', '⅖': '2/5', '⅗': '3/5', '⅘': '4/5',
  '⅙': '1/6', '⅚': '5/6', '⅛': '1/8', '⅜': '3/8', '⅝': '5/8', '⅞': '7/8', '⅐': '1/7', '⅑': '1/9', '⅒': '1/10',
}

// "3¾" → "3 3/4", "¾" → "3/4": one way of writing fractions everywhere, which
// the fraction renderer then draws as a stacked fraction with the whole first.
export function normalizeFractions(text: string): string {
  return text.replace(/(\d)?([¼½¾⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞⅐⅑⅒])/g, (_, whole, f) => (whole ? `${whole} ${VULGAR[f]}` : VULGAR[f]))
}

const HEB = /[֐-׿]/
// A comparison or equation (expression ☐ expression, a < b, a = b) is ONE run —
// any box or blank shape (☐ ▢ □ ◻ ⬜ ___) counts as part of the math —
// so the expression written first stays on the left, where the child reads it
// first — otherwise a right-to-left sentence swaps the two sides and the
// correct sign looks wrong.
// A math run: starts with a digit, a Latin letter, a sign, an opening bracket,
// an absolute-value bar or an angle mark; continues through math characters
// and spaces; ends on a digit, letter, closing bracket, bar or degree sign.
// A hyphen glued to a Hebrew letter (ל-3, ב-5) is Hebrew punctuation, so a
// run never starts right after a Hebrew letter.
const RUN = /(?<![֐-׿])(?:[-−+]?\(?[-−+]?[0-9A-Za-z∢∠△|(\u25A0-\u25FF\u2B1A-\u2B1C\u2610_?])(?:[0-9A-Za-z.,:+\-−×÷·=<>≤≥≠*/%()|'_ °∢∠△\[\]\u25A0-\u25FF\u2B1A-\u2B1C\u2610?]*[0-9A-Za-z)|°\]=\u25A0-\u25FF\u2B1A-\u2B1C\u2610_])?(?:\s*=\s*\?)?/g

export type BidiPart = { ltr: boolean; text: string }

export function splitMathRuns(input: string): BidiPart[] {
  const text = normalizeFractions(input)
  if (!HEB.test(text)) return [{ ltr: true, text }]
  const out: BidiPart[] = []
  let last = 0
  for (const m of text.matchAll(RUN)) {
    let run = m[0]
    let start = m.index ?? 0
    // brackets must pair inside the run: an unmatched ")" at the end or "(" at the start belongs
    // to the Hebrew sentence ("(מספר מכוון: -60)"), otherwise it flips and no longer pairs
    const cnt = (str: string, ch: string) => str.split(ch).length - 1
    while (run.endsWith(')') && cnt(run, ')') > cnt(run, '(')) run = run.slice(0, -1)
    while (run.startsWith('(') && cnt(run, '(') > cnt(run, ')')) { run = run.slice(1); start += 1 }
    // a lone word in Latin letters (a name like "Tom") can stay inline; isolate anything with a digit, sign or symbol
    if (!/[0-9+\-−=<>|°∢∠△()]/.test(run)) continue
    // a run must contain a digit or a math sign — a lone "?" or blank is not math
    if (!/[0-9=<>+\-−×÷∢∠△]/.test(run)) continue
    if (start > last) out.push({ ltr: false, text: text.slice(last, start) })
    out.push({ ltr: true, text: run })
    last = start + run.length
  }
  if (last < text.length) out.push({ ltr: false, text: text.slice(last) })
  return out
}

// A math run never breaks across lines (a break inside it would scramble its
// order in a right-to-left paragraph).
// HTML-string version for printed pages; `render` turns each piece into HTML
// (escaping, fraction glyphs).
export function mathRunsToHTML(text: string, render: (s: string) => string): string {
  return splitMathRuns(String(text ?? '')).map(p => (p.ltr ? `<bdi dir="ltr" style="white-space:nowrap">${render(p.text)}</bdi>` : render(p.text))).join('')
}
