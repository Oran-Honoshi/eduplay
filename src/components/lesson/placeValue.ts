// Turns a place-value worked example ("מה זה 6 עשרות + 3 יחידות?", "מהו ערכה של
// הספרה 7 ב-275?") into a place-value board (Oran, 2026-11-12): the number in a
// small table with מאות / עשרות / יחידות above its digits, then step by step
// what each digit is worth, drawn as blocks: a hundred is a 10×10 square, a ten
// is a row of 10 squares (3 עשרות = 3 rows of 10 = 3 פעמים 10), and the ones are
// single squares. Returns null when the example is not about place value.

export type PVPlace = 'hundreds' | 'tens' | 'ones'
export type PVStep = { title: string; text: string; highlight?: PVPlace; show: PVPlace[] }
export type PlaceValueProblem = { n: number; digits: { place: PVPlace; label: string; d: number }[]; steps: PVStep[] }

const NAME: Record<PVPlace, string> = { hundreds: 'מאות', tens: 'עשרות', ones: 'יחידות' }
const PLACE_WORDS = /עשרות|יחידות|אחדות|מאות|ערך מקומי|ערכה של הספרה|ערך הספרה/

export function derivePlaceValue(problem: string, answer: string, steps: string[]): PlaceValueProblem | null {
  const all = [problem, answer, ...steps].join(' ').replace(/[֑-ׇ]/g, '')
  if (!PLACE_WORDS.test(all)) return null
  const nums = (problem.replace(/[֑-ׇ]/g, '').match(/\d[\d,]*/g) || []).map(x => Number(x.replace(/,/g, '')))
  const multi = nums.filter(x => x >= 10)
  const ans = Number(String(answer).replace(/[֑-ׇ,]/g, '').trim())
  let n: number | null = null
  // one number with two or three digits in the question ("ב-275"), or a number built from digits ("6 עשרות + 3 יחידות" → 63)
  if (multi.length === 1 && multi[0] < 1000) n = multi[0]
  else if (!multi.length && Number.isInteger(ans) && ans >= 10 && ans < 1000) n = ans
  if (n == null) return null
  // every other number in the question must be one of its digits ("הספרה 7 ב-275"),
  // otherwise it is a sum or a word problem, not a place-value example
  const ds = String(n).split('').map(Number)
  if (nums.some(x => x !== n && !(x < 10 && ds.includes(x)))) return null

  const h = Math.floor(n / 100), t = Math.floor((n % 100) / 10), u = n % 10
  const places: PVPlace[] = h ? ['hundreds', 'tens', 'ones'] : ['tens', 'ones']
  const val: Record<PVPlace, number> = { hundreds: h, tens: t, ones: u }
  const digits = places.map(p => ({ place: p, label: NAME[p], d: val[p] }))

  const out: PVStep[] = [{
    title: 'כותבים בטבלה',
    text: `כל ספרה של ${n} נכנסת לעמודה שלה: ${places.map(p => NAME[p]).join(', ').replace(/, ([^,]*)$/, ' ו$1')}.`,
    show: [],
  }]
  const shown: PVPlace[] = []
  if (h) {
    shown.push('hundreds')
    out.push({ title: 'המאות', text: `הספרה ${h} במקום המאות: ${h} מאות זה ${h} פעמים 100, כלומר ${h * 100}`, highlight: 'hundreds', show: [...shown] })
  }
  shown.push('tens')
  out.push({
    title: 'העשרות',
    text: t ? `הספרה ${t} במקום העשרות: ${t} עשרות זה ${t} פעמים 10, כלומר ${t * 10}. כל שורה היא עשר משבצות.` : 'במקום העשרות יש 0: אין עשרות בכלל.',
    highlight: 'tens', show: [...shown],
  })
  shown.push('ones')
  out.push({ title: 'היחידות', text: u ? `הספרה ${u} במקום היחידות: ${u} יחידות זה ${u}` : 'במקום היחידות יש 0: אין יחידות.', highlight: 'ones', show: [...shown] })
  const parts = [h * 100, t * 10, u].filter(x => x > 0)
  let sum = `${parts.join(' + ')} = ${n}`
  if (parts.length < 2) sum = `המספר הוא ${n}`
  // the example's own last step answers its own question ("לכן ערכה הוא 70"), keep it
  const last = steps.length ? steps[steps.length - 1] : ''
  const lastPlain = last.replace(/[֑-ׇ]/g, '')
  const keepLast = last && Number.isFinite(ans) && ans !== n && lastPlain.includes(String(ans)) ? ` ${last}` : ''
  out.push({ title: 'מחברים', text: `${parts.length < 2 ? sum : `מחברים: ${sum}`}${keepLast ? `.${keepLast}` : ''}`, show: [...shown] })
  return { n, digits, steps: out }
}
