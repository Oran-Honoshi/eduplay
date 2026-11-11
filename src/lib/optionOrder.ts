// Multiple-choice answers came back from the AI mostly in position B and almost
// never D. Options are shuffled before a question is saved so the right answer
// lands evenly on A–D. correct_answer is stored as the value, so order is free.
// Options that point at other options ("all of the above") keep their order.
const REFERS = /(all|none|both) of (the )?(above|these|them)|both [a-d] and|כל התשובות|אף אחת|אף תשובה|שתי התשובות|תשובות [א-ד]/i

export function shuffleOptions<T extends { label?: string; isCorrect?: boolean }>(options: T[] | null | undefined): T[] | null | undefined {
  if (!Array.isArray(options) || options.length < 2 || options.length > 6) return options
  if (options.some(o => REFERS.test(`${(o as any).value_en || ''} ${(o as any).value_he || ''}`))) return options
  const labels = options.map(o => o.label)
  const out = [...options]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out.map((o, k) => (labels[k] !== undefined ? { ...o, label: labels[k] } : o))
}

// Some questions store the right answer as its letter ("B"). After a shuffle
// that letter must follow the correct option to its new place.
export function letterAfterShuffle(answer: string, before: any[] | null | undefined, after: any[] | null | undefined): string {
  if (!Array.isArray(before) || !Array.isArray(after)) return answer
  const was = before.find(o => o?.isCorrect)
  const now = after.find(o => o?.isCorrect)
  if (was?.label != null && now?.label != null && String(answer).trim() === String(was.label)) return String(now.label)
  return answer
}
