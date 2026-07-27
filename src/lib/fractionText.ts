// ─────────────────────────────────────────────────────────────
//  fractionText — detects inline "a/b" and mixed "c a/b" fraction
//  patterns inside running text (e.g. "What is 3/12 + 4/12?") and
//  splits them out for typeset rendering (numerator over denominator,
//  separated by a line) instead of a raw slash.
//  Framework-agnostic: no DOM, no React — pure string/array building,
//  so it runs unchanged in the browser and in a Route Handler.
//  Mirrors the mathVisual.ts / MathVisual.tsx split: this file holds
//  the shared logic, src/components/FractionText.tsx wraps it for JSX.
// ─────────────────────────────────────────────────────────────

export interface FractionToken {
  whole?: string
  n: string
  d: string
}

export type TextSegment = string | FractionToken

// Mixed number ("2 3/4") before plain fraction ("3/4"), so the whole-number
// part isn't left dangling as a separate plain-text segment.
const FRACTION_RE = /(\d+)\s+(\d+)\/(\d+)|(\d+)\/(\d+)/g

export function tokenizeFractionText(text: string): TextSegment[] {
  if (!text) return []
  const segments: TextSegment[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  FRACTION_RE.lastIndex = 0
  while ((match = FRACTION_RE.exec(text))) {
    if (match.index > lastIndex) segments.push(text.slice(lastIndex, match.index))
    if (match[4] !== undefined) {
      segments.push({ n: match[4], d: match[5] })
    } else {
      segments.push({ whole: match[1], n: match[2], d: match[3] })
    }
    lastIndex = FRACTION_RE.lastIndex
  }
  if (lastIndex < text.length) segments.push(text.slice(lastIndex))
  return segments
}

function fractionGlyphHTML({ whole, n, d }: FractionToken): string {
  const wholePart = whole ? `${whole}&thinsp;` : ''
  return `${wholePart}<span style="display:inline-table;vertical-align:middle;text-align:center;font-family:'Times New Roman',serif;margin:0 2px;"><span style="display:table-row;"><span style="display:table-cell;padding-bottom:1px;font-weight:700;font-size:13px;border-bottom:1.5px solid #1a1a2e;">${n}</span></span><span style="display:table-row;"><span style="display:table-cell;padding-top:1px;font-weight:700;font-size:13px;">${d}</span></span></span>`
}

// HTML-string renderer for server-rendered contexts (worksheet builder).
export function fractionsToHTML(text: string): string {
  if (!text) return ''
  return tokenizeFractionText(text)
    .map(seg => (typeof seg === 'string' ? seg : fractionGlyphHTML(seg)))
    .join('')
}
