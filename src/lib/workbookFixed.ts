// Workbook sections written straight from the word list (see build route).
import type { Section, Word } from '@/lib/workbook'

const ONES = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen']
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety']
const numWord = (n: number) => n === 100 ? 'one hundred' : n < 20 ? ONES[n] : TENS[Math.floor(n / 10)] + (n % 10 ? ` ${ONES[n % 10]}` : '')
const ICONS: Record<string, [string, string]> = { apple: ['apple', 'apples'], star: ['star', 'stars'], ball: ['ball', 'balls'], flower: ['flower', 'flowers'], coin: ['coin', 'coins'], cookie: ['cookie', 'cookies'], fish: ['fish', 'fish'], car: ['car', 'cars'], pencil: ['pencil', 'pencils'], book: ['book', 'books'], candy: ['candy', 'candies'] }
function shuffle<T>(a: T[], seed: number): T[] {
  const r = [...a]; let x = seed * 9301 + 49297
  for (let i = r.length - 1; i > 0; i--) { x = (x * 9301 + 49297) % 233280; const j = Math.floor((x / 233280) * (i + 1)); [r[i], r[j]] = [r[j], r[i]] }
  return r
}
const opts = (correct: string, wrong: string[], seed: number) =>
  shuffle([correct, ...wrong.slice(0, 3)], seed).map((v, k) => ({ label: 'ABCD'[k], value_en: v, value_he: v, isCorrect: v === correct }))

export function buildFixed(section: Section, words: Word[], he: boolean, want: number, used: Set<string>, seed: number): any[] {
  const out: any[] = []
  const push = (q: any) => { if (out.length < want && !used.has(q.prompt_en)) { used.add(q.prompt_en); out.push(q) } }
  if (section.kind === 'translate_words') {
    const byEn = new Map(words.map(w => [w.en.toLowerCase(), w]))
    for (const en of (section.words?.length ? section.words : words.map(w => w.en)))
      push({ difficulty: 'easy', q_type: 'word_problem', prompt_en: en, correct_answer: byEn.get(en.toLowerCase())?.he || en })
    return out
  }
  if (section.kind === 'true_false') {
    const [T, F] = he ? ['נכון', 'לא נכון'] : ['True', 'False']
    const focus = section.words?.length ? words.filter(w => section.words!.some(x => x.toLowerCase() === w.en.toLowerCase())) : []
    ;(focus.length ? [...focus, ...shuffle(words.filter(w => !focus.includes(w)), seed + 7)] : shuffle(words, seed + 7)).forEach((w, i) => {
      const truth = i % 2 === 0
      const other = words[(words.indexOf(w) + 3 + i) % words.length]
      const shown = truth || !other || other.he === w.he ? w.he : other.he
      const isTrue = shown === w.he
      push({
        difficulty: 'easy', q_type: 'multiple_choice',
        prompt_en: `"${w.en}" means "${shown}".`, prompt_he: he ? `המילה ${w.en} פירושה ״${shown}״.` : undefined,
        options: [{ label: 'A', value_en: T, value_he: T, isCorrect: isTrue }, { label: 'B', value_en: F, value_he: F, isCorrect: !isTrue }],
        correct_answer: isTrue ? T : F,
        explanation_he: he ? `${w.en} = ${w.he}` : undefined,
      })
    })
    return out
  }
  // picture_match: half quantities → number words, half pictured practice items → words
  const items = words.filter(w => ICONS[w.en.toLowerCase()])
  const everyday = words.filter(w => !/\d/.test(w.en) && !ICONS[w.en.toLowerCase()] && w.en.split(' ').length === 1).map(w => w.en)
  const counts = shuffle([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20], seed + 3)
  const iconNames = Object.keys(ICONS)
  let ci = 0, ii = 0
  for (let k = 0; out.length < want && k < want * 4; k++) {
    if ((k % 2 === 1 && items.length) || ci >= counts.length) {
      const w = items[ii++ % Math.max(1, items.length)]
      if (!w) continue
      const [one] = ICONS[w.en.toLowerCase()]
      const wrong = shuffle([...items.map(x => x.en).filter(x => x !== w.en), ...everyday], seed + k).slice(0, 3)
      if (wrong.length < 3) continue
      push({ difficulty: 'easy', q_type: 'multiple_choice', prompt_en: `What is in the picture?${'\u2060'.repeat(1 + Object.keys(ICONS).indexOf(one))}`  /* never name the item: the marker only keeps each picture a separate saved question */, prompt_he: he ? 'מה רואים בתמונה? בחרו את המילה באנגלית' : undefined,
        visual_data: { type: 'objects', icon: one, count: 1 }, options: opts(w.en, wrong, seed + k), correct_answer: w.en, explanation_he: he ? `${w.en} = ${w.he}` : undefined })
    } else {
      const n = counts[ci++]
      const icon = iconNames[(ci + seed) % iconNames.length]
      const [, many] = ICONS[icon]
      const ones = n % 10, tens = Math.floor(n / 10)
      const near = n < 10 ? [n + 10, n * 10, n + 1] : n < 20 ? [ones || 1, (ones || 1) * 10, n + 1] : [tens, tens + 10, n + 1]
      const wrong = [...new Set(near.filter(x => x !== n && x > 0 && x <= 100))].map(numWord)
      // same wording for every count; an invisible marker keeps each count a separate saved question
      push({ difficulty: 'easy', q_type: 'multiple_choice', prompt_en: `Count the ${many}. Which number is it?${'\u2060'.repeat(n)}`,
        prompt_he: he ? 'כמה יש בתמונה? בחרו את המספר באנגלית' : undefined,
        visual_data: { type: 'objects', icon, count: n }, options: opts(numWord(n), wrong, seed + k), correct_answer: numWord(n), explanation_he: he ? `${n} = ${numWord(n)}` : undefined })
    }
  }
  return out
}
