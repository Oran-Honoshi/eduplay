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
  '₪', '$', '%', '°',
]

function stripUnits(s: string): string {
  let out = s
  for (const u of UNITS) out = out.split(u).join(' ')
  return out
}

// Parses "3", "-2.5", "3/4", "2 1/2", "1,000" into a number; null if not numeric.
export function parseNumeric(raw: string): number | null {
  const s = stripUnits(String(raw ?? '')).replace(/[‎‏⁦-⁩]/g, '').replace(/,(?=\d{3}\b)/g, '').trim()
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

export function answersMatch(given: string, correct: string): boolean {
  if (given == null || correct == null) return false
  const a = parseNumeric(given), b = parseNumeric(correct)
  if (a !== null && b !== null) return Math.abs(a - b) < 1e-9
  return normalizeText(given) !== '' && normalizeText(given) === normalizeText(correct)
}
