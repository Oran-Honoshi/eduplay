// Deterministic post-generation decodability check for reading-acquisition
// passages. Two different validators by design, not an oversight: Hebrew
// niqqud marks are checkable per-word regardless of attached prefixes
// (ו/ה/ב/ל/מ...), which makes mark-set membership more robust than word-list
// membership for Hebrew. English has no clitic-prefix problem, so word-list
// membership (matching how real published decodable readers work — a closed
// approved word bank) is used directly instead.

const NIQQUD = {
  SHEVA: 'ְ', HATAF_SEGOL: 'ֱ', HATAF_PATAH: 'ֲ', HATAF_QAMATS: 'ֳ',
  HIRIQ: 'ִ', TSERE: 'ֵ', SEGOL: 'ֶ', PATAH: 'ַ', QAMATS: 'ָ',
  HOLAM: 'ֹ', QUBUTS: 'ֻ', DAGESH: 'ּ',
} as const

const VOWEL_MARKS = new Set<string>(Object.values(NIQQUD))

// Cumulative allowed-vowel-mark sets per niqqud level_number, matching the
// 10-level progression seeded into reading_levels. Levels 5/7/9 are pure
// review batches — same allowed set as the level that introduced their marks.
// Hataf-vowels (reduced vowels) weren't part of the originally researched
// progression; bundled into level 10 ("all combined") rather than guessed
// into an earlier slot.
const NIQQUD_LEVEL_MARKS: Record<number, Set<string>> = {
  1: new Set([NIQQUD.QAMATS, NIQQUD.PATAH]),
  2: new Set([NIQQUD.QAMATS, NIQQUD.PATAH, NIQQUD.SHEVA]),
  3: new Set([NIQQUD.QAMATS, NIQQUD.PATAH, NIQQUD.SHEVA, NIQQUD.HIRIQ]),
  4: new Set([NIQQUD.QAMATS, NIQQUD.PATAH, NIQQUD.SHEVA, NIQQUD.HIRIQ, NIQQUD.HOLAM]),
  5: new Set([NIQQUD.QAMATS, NIQQUD.PATAH, NIQQUD.SHEVA, NIQQUD.HIRIQ, NIQQUD.HOLAM]),
  6: new Set([NIQQUD.QAMATS, NIQQUD.PATAH, NIQQUD.SHEVA, NIQQUD.HIRIQ, NIQQUD.HOLAM, NIQQUD.TSERE, NIQQUD.SEGOL]),
  7: new Set([NIQQUD.QAMATS, NIQQUD.PATAH, NIQQUD.SHEVA, NIQQUD.HIRIQ, NIQQUD.HOLAM, NIQQUD.TSERE, NIQQUD.SEGOL]),
  8: new Set([NIQQUD.QAMATS, NIQQUD.PATAH, NIQQUD.SHEVA, NIQQUD.HIRIQ, NIQQUD.HOLAM, NIQQUD.TSERE, NIQQUD.SEGOL, NIQQUD.QUBUTS, 'SHURUK']),
  9: new Set([NIQQUD.QAMATS, NIQQUD.PATAH, NIQQUD.SHEVA, NIQQUD.HIRIQ, NIQQUD.HOLAM, NIQQUD.TSERE, NIQQUD.SEGOL, NIQQUD.QUBUTS, 'SHURUK']),
  10: new Set([NIQQUD.QAMATS, NIQQUD.PATAH, NIQQUD.SHEVA, NIQQUD.HIRIQ, NIQQUD.HOLAM, NIQQUD.TSERE, NIQQUD.SEGOL, NIQQUD.QUBUTS, 'SHURUK', NIQQUD.HATAF_SEGOL, NIQQUD.HATAF_PATAH, NIQQUD.HATAF_QAMATS]),
}

// Core Hebrew function words (מילות תפקוד) — pronouns, particles, common
// connectives. Per Israeli MOE reading-acquisition material, these are
// expected to be mastered via sight-recognition (קריאה מיידית) rather than
// sounded out — the same "heart words" convention English decodable readers
// use, which is why ALWAYS_ALLOWED_EN already exists below; this is its
// Hebrew counterpart. Exact-match only (plus a single stripped clitic
// prefix) — a small closed class of pronouns/particles has little
// vocalization variance, unlike general content vocabulary, but this hasn't
// had a native-speaker review pass the way the curated word lists need one.
const ALWAYS_ALLOWED_HE = new Set([
  'אֶת', 'שֶׁל', 'הוּא', 'הִיא', 'לֹא', 'זֶה', 'זֹאת', 'אֲנִי', 'אַתָּה', 'אַתְּ',
  'הֵם', 'הֵן', 'אֲנַחְנוּ', 'אַתֶּם', 'יֵשׁ', 'אֵין', 'כֵּן', 'עוֹד', 'גַּם', 'רַק',
  'עַכְשָׁיו', 'אֵיפֹה', 'מָתַי', 'אֵיךְ', 'כָּל',
])

const HE_PREFIX_LETTERS = new Set(['ו', 'ה', 'ב', 'ל', 'מ', 'ש', 'כ'])

// Strips a single leading clitic letter (ו/ה/ב/ל/מ/ש/כ) plus whatever niqqud
// is attached to it, so "וְהוּא" ("and he") still matches "הוּא" in the
// always-allowed set. Only one prefix layer — real Hebrew can stack more
// (e.g. וְשֶׁל), but that's rarer and this is a bounded heuristic, not a
// morphological analyzer.
function stripLeadingClitic(word: string): string | null {
  if (word.length < 2) return null
  if (!HE_PREFIX_LETTERS.has(word[0])) return null
  let i = 1
  while (i < word.length && (VOWEL_MARKS.has(word[i]) || word[i] === NIQQUD.DAGESH)) i++
  return i < word.length ? word.slice(i) : null
}

function extractHebrewWordMarks(word: string): Set<string> {
  const marks = new Set<string>()
  for (let i = 0; i < word.length; i++) {
    const ch = word[i]
    if (ch === NIQQUD.DAGESH) {
      // Vav + dagesh is the standard textual representation of שורוק;
      // dagesh on any other letter is consonantal (dagesh qal/hazak), not a vowel mark.
      if (word[i - 1] === 'ו') marks.add('SHURUK')
      continue
    }
    if (VOWEL_MARKS.has(ch)) marks.add(ch)
  }
  return marks
}

export interface DecodabilityResult {
  pct: number
  totalWords: number
  violatingWords: string[]
}

export function checkNiqqudDecodability(hebrewText: string, levelNumber: number): DecodabilityResult {
  const allowed = NIQQUD_LEVEL_MARKS[levelNumber]
  if (!allowed) throw new Error(`No niqqud mark set defined for level_number ${levelNumber}`)

  const words = hebrewText.split(/[\s.,!?"׳״\-\n]+/).filter(Boolean)
  const violatingWords: string[] = []
  for (const word of words) {
    if (ALWAYS_ALLOWED_HE.has(word)) continue
    const stripped = stripLeadingClitic(word)
    if (stripped && ALWAYS_ALLOWED_HE.has(stripped)) continue

    const marks = extractHebrewWordMarks(word)
    let ok = true
    marks.forEach(m => { if (!allowed.has(m)) ok = false })
    if (!ok) violatingWords.push(word)
  }
  const totalWords = words.length
  const pct = totalWords === 0 ? 0 : Math.round(((totalWords - violatingWords.length) / totalWords) * 100)
  return { pct, totalWords, violatingWords }
}

const ALWAYS_ALLOWED_EN = new Set(['a', 'i', 'the', 'is', 'in', 'on', 'to', 'of', 'and'])

export function checkWordListDecodability(text: string, wordList: string[]): DecodabilityResult {
  const allowed = new Set([...wordList.map(w => w.toLowerCase()), ...ALWAYS_ALLOWED_EN])
  const words = text.toLowerCase().split(/[\s.,!?"\-\n]+/).filter(Boolean).map(w => w.replace(/['"]/g, ''))
  const violatingWords: string[] = []
  for (const word of words) {
    if (!allowed.has(word)) violatingWords.push(word)
  }
  const totalWords = words.length
  const uniqueViolations = [...new Set(violatingWords)]
  const pct = totalWords === 0 ? 0 : Math.round(((totalWords - violatingWords.length) / totalWords) * 100)
  return { pct, totalWords, violatingWords: uniqueViolations }
}
