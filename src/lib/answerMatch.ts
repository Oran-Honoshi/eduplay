// Grades a typed answer against a question's stored correct_answer, for
// questions with no multiple-choice options (word problems). Accepts
// equivalent forms so a child isn't marked wrong for writing 4/5 instead of
// 8/10, 0.5 instead of 1/2, "60 cm³" instead of "60", or 2,000 instead of 2000.
// Shared by the lesson/assignment UI and the server-side grader in
// /api/progress, so both always agree.

// Units and currency words to ignore (English + Hebrew), longest first.
const UNITS = [
  'cm³', 'cm3', 'cm²', 'cm2', 'm²', 'm2', 'km', 'cm', 'mm', 'kg', 'mg', 'ml', 'm', 'g', 'l',
  'סמ"ק', 'סמ״ק', 'ס"מ', 'ס״מ', 'ק"מ', 'ק״מ', 'מ"מ', 'מ״מ', 'ק"ג', 'ק״ג', 'מ"ל', 'מ״ל',
  'מטר', 'מטרים', 'גרם', 'ליטר', 'שקלים', 'שקל', 'דקות', 'דקה', 'שניות', 'שעות',
  'minutes', 'minute', 'seconds', 'hours', 'meters', 'metres', 'grams', 'liters', 'shekels',
  'מעלות', 'מעלה', 'מעלת', 'ס"מ', 'אחוז', 'אחוזים', 'ילדים', 'תלמידים', 'צפיות', 'כרטיסים',
  '₪', '$', '%',
]

function stripUnits(s: string): string {
  // "(-3)°C", "20°", "5 °F" → the bare number; the stored answer often carries the unit
  let out = String(s ?? '').replace(/\s*°\s*[CFcf]?(?![A-Za-z])/g, ' ')
  for (const u of UNITS) out = out.split(u).join(' ')
  return out
}

// "(+4)" "(-3)" "+4" → the plain signed number: directed-number answers are written both ways
function unwrapSigned(s: string): string {
  return s.replace(/^\(\s*([+-]?\s*[\d.,/ ]+?)\s*\)$/, '$1').replace(/^\+\s*/, '')
}

// Parses "3", "-2.5", "3/4", "2 1/2", "1,000" into a number; null if not numeric.
export function parseNumeric(raw: string): number | null {
  let s = stripUnits(String(raw ?? '')).replace(/[−–‐-―]/g, '-').replace(/[‎‏⁦-⁩]/g, '').replace(/,(?=\d{3}\b)/g, '').trim()
  s = unwrapSigned(s).replace(/^-\s+(?=\d)/, '-')
  s = s.replace(/^(-?\d+),(\d{1,2})$/, '$1.$2')   // 2,5 → 2.5
  if (!s) return null
  const mixed = s.match(/^(-?\d+)\s+(\d+)\s*\/\s*(\d+)$/)
  if (mixed) {
    const w = Number(mixed[1]), n = Number(mixed[2]), d = Number(mixed[3])
    if (!d) return null
    return w < 0 ? w - n / d : w + n / d
  }
  const frac = s.match(/^(-?\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/)
  if (frac) {
    const d = Number(frac[2])
    return d ? Number(frac[1]) / d : null
  }
  const dec = s.replace(/\s+/g, '').match(/^-?\d+(?:\.\d+)?$/)
  return dec ? Number(dec[0]) : null
}

function normalizeText(s: string): string {
  return String(s ?? '')
    .toLowerCase()
    .replace(/[֑-ׇ]/g, '')              // ignore niqqud/cantillation
    .replace(/[‎‏⁦-⁩]/g, '')
    .replace(/["'״׳.,!?;:()\[\]{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Words that only dress up an answer: "ציר ה-y" is "y", "יום ה׳" is "ה", "∢M" is "M".
const FILLER = new Set(['ציר', 'יום', 'זווית', 'קודקוד', 'נקודה', 'הנקודה', 'הציר', 'הזווית', 'axis', 'the', 'day', 'angle', 'point'])
function coreText(s: string): string {
  const t = normalizeText(s).replace(/[∢∠Δ△▵]/gu, ' ').replace(/-/g, ' ')
  let kept = t.split(' ').filter(w => w && !FILLER.has(w))
  if (kept.length > 1) kept = kept.filter(w => w !== 'ה')   // the article in "ציר ה-y"; alone it is the day letter ה׳
  return (kept.length ? kept : t.split(' ').filter(Boolean)).join(' ')
}

// "U(8,1), היקף 20" → [8,1,20]; "(8,1) 20" → [8,1,20]
function numberSequence(s: string): number[] {
  return (stripUnits(String(s ?? '')).replace(/[−–]/g, '-').match(/-?\d+(?:\.\d+)?/g) || []).map(Number)
}
const hasWords = (s: string) => /[A-Za-zא-ת]{2,}/.test(stripUnits(s).replace(/[A-Z]\(/g, '('))

export function answersMatch(given: string, correct: string): boolean {
  if (given == null || correct == null) return false
  const a = parseNumeric(given), b = parseNumeric(correct)
  if (a !== null && b !== null) return Math.abs(a - b) < 1e-9
  // the stored answer is a number with words around it ("8 מעלות", "x = 5"): the child types the number
  const bs = numberSequence(correct)
  if (a !== null && bs.length === 1 && b === null) return Math.abs(a - bs[0]) < 1e-9
  // several numbers (a point plus a value): same numbers in the same order, whatever the decoration
  const as = numberSequence(given)
  if (bs.length >= 2 && as.length === bs.length) return as.every((n, i) => Math.abs(n - bs[i]) < 1e-9)
  const ga = coreText(given), cb = coreText(correct)
  return ga !== '' && ga === cb
}
