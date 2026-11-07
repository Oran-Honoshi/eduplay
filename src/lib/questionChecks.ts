// Deterministic checks on every AI-written question before it is saved, so a
// parent never has to catch these by eye:
//  - a question that talks about a graph / drawing must come with one
//  - a drawing must not show the answer (a point the child is asked to find)
//  - a hint must not contain the answer
//  - no repeats of questions already in the same material
const MENTIONS_PICTURE = /בגרף|באיור|בשרטוט|בציור|שבאיור|שבשרטוט|שבגרף|in the (graph|picture|diagram|figure|drawing)|shown below/i

export const normQ = (t: string) => String(t || '').replace(/[֑-ׇ]/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim().toLowerCase()

function answerText(q: any): string {
  if (Array.isArray(q.options)) {
    const c = q.options.find((o: any) => o.isCorrect)
    return String(c?.value_he || c?.value_en || '')
  }
  return String(q.correct_answer || '')
}

const asPoint = (t: string): [number, number] | null => {
  const m = String(t).match(/\(\s*(-?\d+(?:\.\d+)?)\s*[,،]\s*(-?\d+(?:\.\d+)?)\s*\)/)
  return m ? [Number(m[1]), Number(m[2])] : null
}

// Same answer + same drawn points = the same question, however it is worded
export function signature(q: any): string {
  const v = q?.visual_data || {}
  const pts = [...(Array.isArray(v.points) ? v.points : []), ...((Array.isArray(v.series) ? v.series : []).flatMap((sr: any) => sr?.points || []))]
    .map((p: any) => `${+p[0]},${+p[1]}`).sort().join(';')
  const ans = normQ(answerText(q))
  return ans ? `${ans}|${pts}` : ''
}

export function checkQuestion(q: any, existingNorm: Set<string>, existingSig: Set<string> = new Set(), opts: { drawMode?: 'child' | 'ready' } = {}): { ok: boolean; reason?: string; q: any } {
  const prompt = String(q.prompt_he || q.prompt_en || '')
  const n = normQ(prompt)
  if (n && existingNorm.has(n)) return { ok: false, reason: 'repeats an existing question', q }
  const sig = signature(q)
  if (sig && sig.includes('|') && sig.split('|')[1] && existingSig.has(sig)) return { ok: false, reason: 'same answer and drawing as an existing question', q }

  const v = q.visual_data && typeof q.visual_data === 'object' ? { ...q.visual_data } : null
  if (MENTIONS_PICTURE.test(prompt) && !v) return { ok: false, reason: 'mentions a graph or drawing but has none', q }

  const ans = answerText(q)
  const pt = asPoint(ans)
  if (v && pt) {
    // the answer point may be drawn only when the question names it (e.g. "what are A's coordinates?")
    const keep = (p: any[]) => {
      const same = +p[0] === pt[0] && +p[1] === pt[1]
      if (!same) return true
      const label = p[2] ? String(p[2]) : ''
      return !!label && new RegExp(`(^|[^A-Za-z])${label}([^A-Za-z]|$)`).test(prompt)
    }
    if (Array.isArray(v.points)) v.points = v.points.filter(keep)
    if (Array.isArray(v.series)) v.series = v.series.map((sr: any) => ({ ...sr, points: (sr.points || []).filter(keep) }))
    if (Array.isArray(v.segments)) v.segments = v.segments.filter((sg: any) => !(Array.isArray(sg) && sg.some((p: any) => +p[0] === pt[0] && +p[1] === pt[1])))
  }
  // a number line must not mark the numeric answer (e.g. marking 0 for (−7)+(+7))
  const num = Number(String(ans).replace('−', '-').replace(/[^\d.\-]/g, ''))
  if (v && v.type === 'number_line' && /\d/.test(ans) && Number.isFinite(num) && !asPoint(ans)) {
    if (Array.isArray(v.marked)) v.marked = v.marked.filter((x: any) => Number(x) !== num)
    if (v.mark != null && Number(v.mark) === num) delete v.mark
    if (Array.isArray(v.jumps)) v.jumps = v.jumps.filter((j: any) => Number(j?.to) !== num)
  }
  if (v && v.type === 'coordinate') {
    // the child draws: points the text already gives by coordinates are left for the child to mark
    const given = (p: any) => Array.isArray(p) && new RegExp(`\\(\\s*${+p[0]}\\s*[,،]\\s*${+p[1]}\\s*\\)`).test(prompt)
    if ((opts.drawMode ?? 'child') === 'child' && Array.isArray(v.points) && v.points.some(given)) {
      v.points = v.points.filter((p: any) => !given(p))
      delete v.segments; delete v.polygon
    }
    // all values non-negative → first quadrant only (four quadrants confuse here)
    const nums = [...(v.points || []), ...(v.polygon || []), ...((v.segments || []).flat())].flatMap((p: any) => (Array.isArray(p) ? [+p[0], +p[1]] : []))
      .concat((v.vlines || []).map(Number), (v.hlines || []).map(Number))
    if (v.quadrant == null && nums.every((x: number) => !(x < 0))) v.quadrant = 1
  }
  // unlabeled points would print their coordinates — give them letters instead
  if (v && Array.isArray(v.points)) {
    const letters = 'ABCDEFGHJKLMNPQRSTUVW'
    let k = 0
    v.points = v.points.map((p: any) => (Array.isArray(p) && p.length >= 2 && !p[2] ? [p[0], p[1], letters[k++ % letters.length]] : p))
  }

  // a hint that contains the answer is no hint
  const out = { ...q, visual_data: v }
  const a = normQ(ans)
  for (const k of ['hint_he', 'hint_en']) {
    if (a.length >= 2 && out[k] && normQ(out[k]).includes(a)) out[k] = null
  }
  return { ok: true, q: out }
}
