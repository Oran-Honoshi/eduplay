// ─── Workbook sections ─────────────────────────────────────────
// A Create plan can be a workbook made of ordered sections (mostly for
// vocabulary): a word table, "translate yourself", a word bank with
// fill-in sentences, sentences to translate, true/false, multiple choice,
// picture matching and easy drawing. Shared by the plan, the build route,
// the review screen and the printable.

export type SectionKind =
  | 'word_list' | 'translate_words' | 'word_bank' | 'translate_sentences'
  | 'multiple_choice' | 'true_false' | 'picture_match' | 'draw' | 'open'

export type Word = { en: string; he: string }
export type Section = {
  key: string; kind: SectionKind; title_he: string; instructions_he: string; count: number
  words?: string[]   // word_list / translate_words: which words (en); word_bank: the bank
}

export const SECTION_KINDS: Record<SectionKind, { he: string; instr: string; q: 'none' | 'fixed' | 'mc' | 'open'; def: number; appOk: boolean }> = {
  word_list:           { he: 'מילים ותרגום',            instr: 'קראו את המילים ואת התרגום שלהן.',                       q: 'none',  def: 12, appOk: false },
  translate_words:     { he: 'תרגמו בעצמכם',            instr: 'כתבו ליד כל מילה את הפירוש שלה בעברית.',                q: 'fixed', def: 10, appOk: true },
  word_bank:           { he: 'מחסן מילים',              instr: 'השלימו כל משפט במילה מתאימה מהמחסן. כל מילה פעם אחת לכל היותר, ולא חייבים להשתמש בכולן.', q: 'open', def: 8, appOk: true },
  translate_sentences: { he: 'תרגמו לעברית',            instr: 'תרגמו כל משפט לעברית. העיקר להבין את המשמעות.',         q: 'open',  def: 6, appOk: true },
  multiple_choice:     { he: 'בחרו את התשובה הנכונה',   instr: 'הקיפו את התשובה הנכונה.',                              q: 'mc',    def: 8, appOk: true },
  true_false:          { he: 'נכון או לא נכון',         instr: 'סמנו נכון או לא נכון.',                                 q: 'mc',    def: 6, appOk: true },
  picture_match:       { he: 'מה בתמונה?',              instr: 'הסתכלו בתמונה ובחרו את המילה המתאימה.',                q: 'mc',    def: 6, appOk: true },
  draw:                { he: 'ציירו',                   instr: 'קראו את המשפט וציירו אותו במסגרת.',                     q: 'open',  def: 3, appOk: false },
  open:                { he: 'שאלות פתוחות',            instr: 'ענו על השאלות.',                                         q: 'open',  def: 6, appOk: true },
}
export const SECTION_ORDER: SectionKind[] = ['word_list', 'translate_words', 'word_bank', 'translate_sentences', 'multiple_choice', 'true_false', 'picture_match', 'draw', 'open']

export const isSectionKind = (k: any): k is SectionKind => typeof k === 'string' && k in SECTION_KINDS
export const hasSections = (plan: any) => Array.isArray(plan?.sections) && plan.sections.length > 0
/** sections that produce questions (the word table is printed, not asked) */
export const questionSections = (plan: any): Section[] => (plan?.sections || []).filter((s: Section) => SECTION_KINDS[s.kind]?.q !== 'none')

export function plannedCount(plan: any, kind?: string): number {
  if (kind === 'explanation') return 0
  if (hasSections(plan)) return questionSections(plan).reduce((a, s) => a + (s.count || 0), 0)
  return (plan?.topics || []).reduce((a: number, t: any) => a + (t.count || 0), 0)
}

const isNumberWord = (w: string) => /^(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|a hundred|one hundred)([ -](one|two|three|four|five|six|seven|eight|nine))?$/i.test(w.trim())
const MONTHS = /^(january|february|march|april|may|june|july|august|september|october|november|december)$/i

/** Gives every part its own words, deterministically, so the whole list gets
 * practised: the table and "translate yourself" get different words, the bank
 * prefers everyday words, and every other part gets its own run of the words
 * no part has used yet. Words used in an earlier workbook (plan.used_before,
 * set by "more like this") come last, so a new workbook starts with new words. */
export function assignSectionWords(plan: any): any {
  if (!hasSections(plan)) return plan
  const words: Word[] = (plan.words || []).filter((w: Word) => w?.en)
  const before = new Set<string>((plan.used_before || []).map((x: string) => x.toLowerCase()))
  const all = [...words.filter(w => !before.has(w.en.toLowerCase())), ...words.filter(w => before.has(w.en.toLowerCase()))].map(w => w.en)
  const taken = new Set<string>()
  const spread = (pool: string[], n: number) => {
    const st = pool.length / Math.max(1, n)
    return Array.from({ length: Math.min(n, pool.length) }, (_, i) => pool[Math.floor(i * st)])
  }
  // fresh words first; when they run out, words already given to another part
  const pick = (n: number, ok: (w: string) => boolean = () => true, spreadOut = false) => {
    const free = all.filter(w => !taken.has(w) && ok(w))
    let got = spreadOut ? spread(free, n) : free.slice(0, n)
    if (got.length < n) got = [...got, ...all.filter(w => ok(w) && !got.includes(w)).slice(0, n - got.length)]
    got.forEach(w => taken.add(w))
    return got
  }
  const out: Record<string, Section> = {}
  const order = ['word_list', 'translate_words', 'word_bank']
  const secs: Section[] = plan.sections
  for (const kind of order) for (const sc of secs.filter(x => x.kind === kind)) {
    if (kind === 'word_list') out[sc.key] = { ...sc, words: pick(Math.min(sc.count || 12, all.length), undefined, true) }
    if (kind === 'translate_words') { const w = pick(sc.count || 10, undefined, true); out[sc.key] = { ...sc, count: w.length, words: w } }
    if (kind === 'word_bank') {
      const everyday = (w: string) => !isNumberWord(w) && !MONTHS.test(w)
      const bank = pick(10, all.filter(everyday).length >= 6 ? everyday : undefined, true)
      out[sc.key] = { ...sc, count: Math.min(sc.count || 8, bank.length), words: bank }
    }
  }
  // the parts written from words: each gets its own run of not-yet-used words
  for (const sc of secs) if (!out[sc.key]) {
    out[sc.key] = ['translate_sentences', 'multiple_choice', 'true_false', 'draw', 'open'].includes(sc.kind)
      ? { ...sc, words: pick(sc.kind === 'translate_sentences' ? (sc.count || 6) * 2 : sc.count || 6) }
      : sc
  }
  return { ...plan, sections: secs.map(sc => out[sc.key] || sc) }
}

/** every word a workbook practised (to prefer new words next time) */
export const usedWords = (plan: any): string[] =>
  [...new Set<string>([...(plan?.used_before || []), ...((plan?.sections || []) as Section[]).flatMap(sc => sc.words || [])])]

export function cleanWords(raw: any): Word[] {
  const seen = new Set<string>()
  const out: Word[] = []
  for (const w of Array.isArray(raw) ? raw : []) {
    const en = String(w?.en || '').trim().slice(0, 60), he = String(w?.he || '').trim().slice(0, 60)
    if (!en || seen.has(en.toLowerCase())) continue
    seen.add(en.toLowerCase()); out.push({ en, he })
  }
  return out.slice(0, 200)
}

export function cleanSections(raw: any): Section[] {
  return (Array.isArray(raw) ? raw : []).filter((s: any) => isSectionKind(s?.kind)).slice(0, 10).map((s: any, i: number) => {
    const k = SECTION_KINDS[s.kind as SectionKind]
    const max = s.kind === 'word_bank' ? 10 : s.kind === 'draw' ? 6 : s.kind === 'word_list' || s.kind === 'translate_words' ? 30 : 15
    return {
      key: typeof s.key === 'string' && s.key ? s.key : `s${i + 1}`,
      kind: s.kind,
      title_he: String(s.title_he || k.he).slice(0, 80),
      instructions_he: String(s.instructions_he || k.instr).slice(0, 300),
      count: Math.max(1, Math.min(max, Number(s.count) || k.def)),
      ...(Array.isArray(s.words) ? { words: s.words.filter((x: any) => typeof x === 'string').slice(0, 30) } : {}),
    }
  })
}

/** What the model must write for one section (overrides the general format rules). */
export function sectionSpec(s: Section, words: Word[], language: string): { q_types: string[]; text: string } {
  const list = words.map(w => `${w.en} = ${w.he}`).join('; ')
  const he = language !== 'en_only'
  const both = 'For every option write the text the child sees in BOTH value_en and value_he (the same text). All options must be different words/meanings.'
  const focus = s.kind !== 'word_bank' && s.words?.length
    ? ` FOCUS WORDS for this section, in order: ${s.words.join(', ')}. Build each question around a different focus word (go down the list) so all of them get practised; other practice words may appear only as distractors or context.`
    : ''
  const base = `This question set is one SECTION of a vocabulary workbook. The goal is understanding meaning, not spelling. Use only these practice words (with their meaning): ${list}.${focus}`
  const t = (k: string) => `Every question in this section has "q_type":"${k}".`
  switch (s.kind) {
    case 'word_bank': return { q_types: ['word_problem'], text: `${base}
SECTION "word bank". ${t('word_problem')} The bank is exactly: ${(s.words || []).join(', ')}.
Each question: prompt_en = ONE short English sentence for the grade with exactly one blank written as ____ where one bank word fits; the sentence makes the meaning clear. prompt_he = null. correct_answer = that bank word exactly as written in the bank. Every question uses a DIFFERENT bank word (never the same word twice); not every bank word has to be used. No hints. explanation_he = the Hebrew translation of the full sentence.` }
    case 'translate_sentences': return { q_types: ['word_problem'], text: `${base}
SECTION "translate to Hebrew". ${t('word_problem')} Each question: prompt_en = one short, simple English sentence using one or two practice words (different words in each sentence). prompt_he = null. correct_answer = a natural Hebrew translation of the sentence. No hints. explanation_he = which practice word means what.` }
    case 'multiple_choice': return { q_types: ['multiple_choice'], text: `${base}
SECTION "multiple choice" about meaning. ${t('multiple_choice')} Mix: ${he ? '(a) prompt_he like "מה פירוש המילה village?" with 4 Hebrew meanings as options; (b) prompt_he "מה המילה באנגלית ל-כפר?" with 4 English words as options; (c) prompt_en = an English sentence with one word underlined in *asterisks*, prompt_he = "מה פירוש המילה המסומנת?" with Hebrew meanings.' : 'questions about the meaning of practice words in English.'} ${both} Each option is ONE word or meaning only (never "December - a month"), distractors are other practice words or meanings, never the same meaning twice, and a question asks about exactly ONE word. correct_answer = the text of the correct option.` }
    case 'true_false': return { q_types: ['multiple_choice'], text: `${base}
SECTION "true / false". ${t('multiple_choice')} (a true/false question is multiple_choice with exactly 2 options) Each question is ONE statement to judge, e.g. prompt_he "המילה market פירושה שוק." or prompt_en "There are twelve months in a year." with prompt_he null. Exactly 2 options: [{"label":"A","value_en":"${he ? 'נכון' : 'True'}","value_he":"${he ? 'נכון' : 'True'}","isCorrect":...},{"label":"B","value_en":"${he ? 'לא נכון' : 'False'}","value_he":"${he ? 'לא נכון' : 'False'}","isCorrect":...}] — about half true and half false.` }
    case 'picture_match': return { q_types: ['multiple_choice'], text: `${base}
SECTION "match the picture". ${t('multiple_choice')} Every question MUST have visual_data {"type":"objects","icon":ICON,"count":N} with ICON one of: apple, star, ball, flower, coin, cookie, fish, car, pencil, book, candy. Mix two kinds: (a) N from 2 to 20 and prompt_he "כמה יש בתמונה? בחרו את המספר באנגלית" — options are English number words that are easy to confuse (e.g. seven / seventeen / seventy / eleven); (b) N = 1–3 of an item that is a practice word (e.g. flower, book) and prompt_he "מה רואים בתמונה?" — options are English words. ${both}` }
    case 'draw': return { q_types: ['word_problem'], text: `${base}
SECTION "draw it". ${t('word_problem')} Each question: prompt_en = one short English sentence describing something VERY easy to draw, using practice words and numbers (e.g. "Draw three red flowers.", "Draw a ball under a book."). prompt_he = null. correct_answer = the Hebrew translation of the sentence (for the parent). No visual_data, no hints.` }
    default: return { q_types: ['word_problem', 'multiple_choice'], text: base }
  }
}

/** The printed / shown option text: never four identical words */
export function visibleOption(opt: any, opts: any[], langMode: string): string {
  const en = String(opt?.value_en ?? ''), heV = opt?.value_he ? String(opt.value_he) : ''
  if (langMode === 'he_only') return heV || en
  if (langMode === 'bilingual') {
    const enSame = new Set(opts.map(o => String(o?.value_en ?? ''))).size < opts.length
    if (enSame && heV) return heV
  }
  return en || heV
}
