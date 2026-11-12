// Turns a worked example such as "כמה זה 4.3 + 2.65?" into a column board:
// the place-value columns, the two rows, padded zeros, the result, and one
// step per stage (align → pad zeros → add each column right to left).
// Only column addition / subtraction with no carrying or borrowing is
// supported (that is what the approved design shows); anything else returns
// null and the lesson falls back to the plain step list.

export type PlaceKey = 'hundreds' | 'tens' | 'ones' | 'tenths' | 'hundredths'
export type BoardCol = { kind: 'op' } | { kind: 'point' } | { kind: 'digit'; place: PlaceKey; label: string }
export type BoardCell = { text: string; padded?: boolean }
export type BoardStep = {
  title: string
  text: string            // plain text; numbers are isolated LTR when rendered
  highlight?: PlaceKey     // column highlighted in this step
  points?: boolean         // the decimal points are highlighted (alignment step)
  pad?: boolean            // the padded zero(s) appear in this step
}
export type ColumnProblem = {
  op: '+' | '−'
  cols: BoardCol[]
  rowA: BoardCell[]        // one cell per column (op column empty)
  rowB: BoardCell[]
  result: { text: string; place?: PlaceKey; point?: boolean }[] // per column
  revealAt: number[]       // step number (1-based) from which result cell i shows; 0 = never
  padStep: number          // step that adds the zero(s), 0 if none
  padRow: 'A' | 'B' | null
  padCount: number
  padFrom: string          // "4.3"
  padTo: string            // "4.30"
  answer: string
  steps: BoardStep[]
}

const PLACES_INT: PlaceKey[] = ['hundreds', 'tens', 'ones']
const PLACES_DEC: PlaceKey[] = ['tenths', 'hundredths']
const NAME: Record<PlaceKey, string> = { hundreds: 'מאות', tens: 'עשרות', ones: 'יחידות', tenths: 'עשיריות', hundredths: 'מאיות' }

const NUM = /(\d+(?:\.\d+)?)\s*([+\-−–])\s*(\d+(?:\.\d+)?)/

function splitNum(s: string) {
  const [i, d = ''] = s.split('.')
  return { int: i.replace(/^0+(?=\d)/, ''), dec: d }
}

export function deriveColumnProblem(problem: string, answerText?: string): ColumnProblem | null {
  const m = (problem || '').match(NUM)
  if (!m) return null
  // only a problem that is just this one operation (no "×", no third number)
  const rest = problem.replace(m[0], '')
  if (/\d/.test(rest) || /[×÷*/]/.test(problem)) return null
  const op: '+' | '−' = m[2] === '+' ? '+' : '−'
  const A = splitNum(m[1]), B = splitNum(m[3])
  const d = Math.max(A.dec.length, B.dec.length)
  const k = Math.max(A.int.length, B.int.length)
  if (d > 2 || k > 3) return null

  // values in "hundredths" to check carries / borrows and the result
  const scale = 10 ** d
  const va = Math.round(parseFloat(m[1]) * scale), vb = Math.round(parseFloat(m[3]) * scale)
  if (op === '−' && vb > va) return null
  const vr = op === '+' ? va + vb : va - vb

  const digitsOf = (n: { int: string; dec: string }) => {
    const ints = n.int.padStart(k, ' ').split('')
    const decs = n.dec.padEnd(d, '_').split('') // _ = padded zero
    return { ints, decs }
  }
  const a = digitsOf(A), b = digitsOf(B)

  // per-column digits right to left: no carry / borrow allowed
  const colsRL: { place: PlaceKey; da: number; db: number; aBlank: boolean; bBlank: boolean }[] = []
  const intPlaces = PLACES_INT.slice(3 - k)
  const decPlaces = PLACES_DEC.slice(0, d)
  const all = [...intPlaces, ...decPlaces]
  const aDigits = [...a.ints, ...a.decs], bDigits = [...b.ints, ...b.decs]
  for (let i = all.length - 1; i >= 0; i--) {
    const ca = aDigits[i], cb = bDigits[i]
    const na = ca === ' ' || ca === '_' ? 0 : +ca, nb = cb === ' ' || cb === '_' ? 0 : +cb
    if (op === '+' && na + nb > 9) return null
    if (op === '−' && na < nb) return null
    colsRL.push({ place: all[i], da: na, db: nb, aBlank: ca === ' ', bBlank: cb === ' ' })
  }
  // the result, as written (no leading zeros except a single 0 before a point)
  const rInt = Math.floor(vr / scale).toString()
  const rDec = d ? (vr % scale).toString().padStart(d, '0') : ''
  if (rInt.length > k) return null
  const answer = d ? `${rInt}.${rDec}` : rInt
  if (answerText) {
    const got = (answerText.match(/\d+(?:\.\d+)?/) || [])[0]
    if (got && parseFloat(got) !== parseFloat(answer)) return null
  }

  // columns: op, ints, point, decimals
  const label = (p: PlaceKey) => (p === 'ones' && d > 0 && k === 1 ? 'שלמים' : NAME[p])
  const cols: BoardCol[] = [{ kind: 'op' }, ...intPlaces.map(p => ({ kind: 'digit' as const, place: p, label: label(p) })),
    ...(d ? [{ kind: 'point' as const }] : []), ...decPlaces.map(p => ({ kind: 'digit' as const, place: p, label: label(p) }))]

  const padA = A.dec.length < d ? d - A.dec.length : 0
  const padB = B.dec.length < d ? d - B.dec.length : 0
  const padRow: 'A' | 'B' | null = padA ? 'A' : padB ? 'B' : null
  const padCount = padA || padB
  const rowCells = (n: { ints: string[]; decs: string[] }): BoardCell[] => [
    { text: '' },
    ...n.ints.map(c => ({ text: c === ' ' ? '' : c })),
    ...(d ? [{ text: '.' }] : []),
    ...n.decs.map(c => (c === '_' ? { text: '0', padded: true } : { text: c })),
  ]
  const rowA = rowCells(a), rowB = rowCells(b)
  rowB[0] = { text: op }

  // steps
  const steps: BoardStep[] = []
  steps.push({ title: 'מסדרים בטורים', points: d > 0,
    text: d > 0 ? 'כותבים את המספרים אחד מתחת לשני, כך שהנקודות עומדות בדיוק אחת מתחת לשנייה.'
      : 'כותבים את המספרים אחד מתחת לשני, כך שהיחידות עומדות בדיוק אחת מתחת לשנייה.' })
  const padSrc = padRow === 'A' ? m[1] : padRow === 'B' ? m[3] : ''
  const padTo = padSrc ? (padSrc.includes('.') ? padSrc : padSrc + '.') + '0'.repeat(padCount) : ''
  let padStep = 0
  if (padRow) {
    const missing = padCount === 1 ? `ספרת ${NAME[decPlaces[d - 1]]}` : 'ספרות אחרי הנקודה'
    steps.push({ title: padCount === 1 ? 'מוסיפים 0' : 'מוסיפים אפסים', pad: true,
      text: `ל-${padSrc} אין ${missing}, אז מוסיפים ${padCount === 1 ? '0' : 'אפסים'} בסוף. ${padSrc} ו-${padTo} הם אותו מספר בדיוק!` })
    padStep = steps.length
  }
  const verb = op === '+' ? 'מחברים' : 'מחסרים'
  const colStep: Record<string, number> = {}
  colsRL.forEach((c, i) => {
    const res = op === '+' ? c.da + c.db : c.da - c.db
    const expr = c.aBlank || c.bBlank ? null : `${c.da} ${op === '+' ? '+' : '−'} ${c.db} = ${res}`
    const body = expr ? `${expr}` : `יש כאן רק ${c.aBlank ? c.db : c.da}, אז כותבים ${res}`
    const nm = c.place === 'ones' && d > 0 && k === 1 ? 'השלמים' : 'ה' + NAME[c.place]
    const last = i === colsRL.length - 1
    let text: string
    if (i === 0 && !last) text = `מתחילים מהטור הימני ביותר, ${nm}: ${body}`
    else if (!last) text = `עוברים לטור הבא, ${nm}: ${body}`
    else text = `${colsRL.length > 1 ? 'ולבסוף ' : ''}${nm}: ${body}.${d ? ' מורידים את הנקודה למטה, והתשובה היא ' + answer + '!' : ' והתשובה היא ' + answer + '!'}`
    steps.push({ title: `${verb} ${c.place === 'ones' && d > 0 && k === 1 ? 'שלמים' : NAME[c.place]}`, text, highlight: c.place })
    colStep[c.place] = steps.length
  })

  // result cells per column, and when each one appears
  const rD = rInt.padStart(k, ' ').split('')
  const result: ColumnProblem['result'] = [{ text: '' }, ...intPlaces.map((p, i) => ({ text: rD[i] === ' ' ? '' : rD[i], place: p })),
    ...(d ? [{ text: '.', point: true }] : []), ...decPlaces.map((p, i) => ({ text: rDec[i], place: p }))]
  const revealAt = result.map(r => (r.point ? colStep.ones : r.place && r.text ? colStep[r.place] : 0))

  return { op, cols, rowA, rowB, result, revealAt, padStep, padRow, padCount, padFrom: padSrc, padTo, answer, steps }
}
