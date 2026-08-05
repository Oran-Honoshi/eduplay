// A stored *_he value that's byte-identical to its *_en counterpart is never
// a real second-language rendering — showing a reader two identical
// "different language" blocks is never useful information, regardless of
// which field or why they ended up equal.
export const isDistinctHe = (he: string | null | undefined, en: string | null | undefined) =>
  !!he && he !== en

// difficulty is a fixed enum, not per-question content — one canonical
// wording, not something to regenerate or translate ad hoc per screen.
// Previously duplicated inline in the worksheet builder's aggregate badge
// (and missing entirely from its per-question badge and both admin review
// screens) — one shared source now.
const DIFFICULTY_HE: Record<string, string> = {
  easy: 'קל',
  medium: 'בינוני',
  hard: 'קשה',
  mixed: 'מעורב',
}

export const translateDifficulty = (difficulty: string): string =>
  DIFFICULTY_HE[difficulty] || difficulty

// Multiple-choice option labels: Israeli math worksheets label options with
// Hebrew letters (א. ב. ג. ד.), not Latin ones — confirmed against a real
// Israeli elementary math worksheet, not assumed. Options are generated/
// stored with Latin labels (A/B/C/D) regardless of language, so this only
// governs how the label is *displayed* in a Hebrew context.
const OPTION_LABEL_HE: Record<string, string> = {
  A: 'א',
  B: 'ב',
  C: 'ג',
  D: 'ד',
}

export const translateOptionLabel = (label: string): string =>
  OPTION_LABEL_HE[label] || label

// Shared with the worksheet builder's print HTML (which had its own local
// copy before this fix) — a string counts as a "bare equation" if, after
// stripping a leading imperative gloss (Calculate:/פתרו/etc.), everything
// left is digits/arithmetic/comparison symbols and whitespace. Zero real
// words in either script anywhere means this is pure math, not narrative.
export function extractBareEquation(prompt: string | null | undefined): string | null {
  if (!prompt) return null
  const stripped = prompt
    .trim()
    .replace(/^(calculate|evaluate|solve|compute)\s*:\s*/i, '')
    .replace(/^(חשבו|פתרו|חשב|פתור)\s*:?\s*/, '')
    .trim()
  if (!stripped) return null
  return /^[\d\s+\-×x÷/.,()=?_]+$/.test(stripped) ? stripped : null
}

export interface HeMathSegment { type: 'text' | 'math'; content: string }

// Same math character class as extractBareEquation, but applied as a
// substring search rather than a whole-string match — for the harder case
// where an embedded equation sits INSIDE a Hebrew narrative sentence (e.g.
// "פתרו: 3.5 + 2.4 = ___", or "5 x 3/10 = ___ בצורה פשוטה ביותר") rather
// than being the entire prompt. A run only counts as an isolatable
// expression if it contains a digit AND a qualifying operator/comparison
// sign (+ - × x ÷ = < >) — deliberately NOT a bare "/": a lone fraction
// mention ("3/8 of a pizza") is common in real word problems and is
// already safe inline (a simple num/num pair doesn't scramble under UAX#9,
// and FractionText already renders it as a glyph) — pulling every fraction
// mention onto its own line would fragment ordinary narrative sentences for
// no reason. A real arithmetic/comparison operator is the actual risk
// signal: multi-token expressions (parens, multiple operators, an equals
// sign) are what the Unicode Bidi Algorithm can visibly scramble once
// they're surrounded by RTL text with nothing to anchor them.
//
// Deliberately does NOT special-case a whole-string bare equation
// separately: a pure equation with zero surrounding Hebrew text naturally
// produces a single math-only segment here (no text segments before/
// after), which renders identically to a dedicated single-line-LTR
// treatment would — one code path covers both shapes correctly. (Using
// extractBareEquation's prefix-STRIPPING result for this decision would be
// wrong here — it deliberately treats "פתרו: 3.5 + 2.4 = ___" as "a bare
// equation with a Hebrew label," correct for deriving the work-column
// equation, but wrong for deciding whole-line direction, since "פתרו:" is
// real Hebrew text that must stay RTL, not be swept into an LTR line.)
//
// This sidesteps the inline-bidi-isolation problem structurally rather
// than fighting it: block-level elements don't bidi-interact with each
// other, so putting the equation on its own line removes the neutral-
// character-resolution risk entirely instead of requiring a character-
// level tokenizer inside one continuous run.
//
// Returns [] when the text is pure narrative with no isolatable expression
// anywhere (render as a single plain block, no special handling).
const MATH_RUN = /[\d\s+\-×x÷/.,()=<>?_]+/g
const UNAMBIGUOUS_OPERATOR = /[=<>]/
const OTHER_OPERATOR = /[+\-×x÷]/

export function segmentHebrewMath(text: string | null | undefined): HeMathSegment[] {
  if (!text) return []

  const segments: HeMathSegment[] = []
  let lastIndex = 0
  for (const match of text.matchAll(MATH_RUN)) {
    const run = match[0]
    // Real Hebrew orthography routinely glues a hyphen straight onto a
    // preceding preposition letter before a number — ל-3 ("into 3"), ב-5
    // ("in 5"), מ-10 ("from 10") — which, captured on its own, looks
    // identical to a bare "-3" subtraction/negative-number run: no
    // whitespace, single operator character, one number. A genuine
    // expression almost always has a space somewhere among its tokens
    // (e.g. "20 - (3 x 4)", "(3 + 4) x 2") or uses an unambiguous symbol
    // Hebrew never uses as punctuation (=, <, >) — so +/-/×/x/÷ only
    // qualify a run when there's also whitespace in it; = / < / > qualify
    // on their own regardless. Confirmed live against a real DB row
    // ("חתוך ל-3 חלקים") that this exact collision happens in practice,
    // not just in theory.
    if (!/\d/.test(run)) continue
    // Trim before the whitespace check: MATH_RUN's charset includes plain
    // spaces, so an ordinary sentence-boundary space right before/after the
    // run (e.g. the space between "ל-3" and the next Hebrew word) gets
    // swept into the match too — testing the untrimmed run would make
    // nearly every run "contain whitespace" regardless of whether the
    // operator itself has real token-separating spacing. Only whitespace
    // that survives trimming (i.e. sits BETWEEN math tokens) counts.
    const trimmed = run.trim()
    const qualifies = UNAMBIGUOUS_OPERATOR.test(trimmed) || (OTHER_OPERATOR.test(trimmed) && /\s/.test(trimmed))
    if (!qualifies) continue // a lone number/fraction, or a Hebrew-glued hyphen — not an expression
    const start = match.index as number
    if (start > lastIndex) {
      const before = text.slice(lastIndex, start)
      if (before.trim()) segments.push({ type: 'text', content: before.trim() })
    }
    segments.push({ type: 'math', content: run.trim() })
    lastIndex = start + run.length
  }
  if (lastIndex < text.length) {
    const rest = text.slice(lastIndex)
    if (rest.trim()) segments.push({ type: 'text', content: rest.trim() })
  }
  return segments.some(s => s.type === 'math') ? segments : []
}
