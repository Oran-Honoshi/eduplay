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

/** Deterministically gives the word table, "translate yourself" and the word bank
 * their own words: the table and the translate list are different words, the
 * bank prefers everyday words (not months or numbers) that fit in a sentence. */
export function assignSectionWords(plan: any): any {
  if (!hasSections(plan)) return plan
  const words: Word[] = (plan.words || []).filter((w: Word) => w?.en)
  const all = words.map(w => w.en)
  const everyday = all.filter(w => !isNumberWord(w) && !MONTHS.test(w))
  const table = plan.sections.find((s: Section) => s.kind === 'word_list')
  const tableN = table ? Math.min(table.count || 12, all.length) : 0
  // spread the table across the list (some of each group), the rest go to "translate"
  const step = tableN ? all.length / tableN : 1
  const tableWords = tableN ? Array.from({ length: tableN }, (_, i) => all[Math.floor(i * step)]) : []
  const rest = all.filter(w => !tableWords.includes(w))
  const sections = plan.sections.map((s: Section) => {
    if (s.kind === 'word_list') return { ...s, words: tableWords }
    if (s.kind === 'translate_words') {
      const n = Math.min(s.count || 10, rest.length || all.length)
      const pool = rest.length ? rest : all
      const st = pool.length / Math.max(1, n)
      const picked = Array.from({ length: n }, (_, i) => pool[Math.floor(i * st)])
      return { ...s, count: picked.length, words: picked }
    }
    if (s.kind === 'word_bank') {
      const pool = everyday.length >= 6 ? everyday : all
      const size = Math.min(10, pool.length)
      const st = pool.length / Math.max(1, size)
      const bank = Array.from({ length: size }, (_, i) => pool[Math.floor(i * st)])
      return { ...s, count: Math.min(s.count || 8, bank.length), words: bank }
    }
    return s
  })
  return { ...plan, sections }
}

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
  const base = `This question set is one SECTION of a vocabulary workbook. The goal is understanding meaning, not spelling. Use only these practice words (with their meaning): ${list}.`
  switch (s.kind) {
    case 'word_bank': return { q_types: ['word_problem'], text: `${base}
SECTION "word bank". The bank is exactly: ${(s.words || []).join(', ')}.
Each question: prompt_en = ONE short English sentence for the grade with exactly one blank written as ____ where one bank word fits; the sentence makes the meaning clear. prompt_he = null. correct_answer = that bank word exactly as written in the bank. Every question uses a DIFFERENT bank word (never the same word twice); not every bank word has to be used. No hints. explanation_he = the Hebrew translation of the full sentence.` }
    case 'translate_sentences': return { q_types: ['word_problem'], text: `${base}
SECTION "translate to Hebrew". Each question: prompt_en = one short, simple English sentence using one or two practice words (different words in each sentence). prompt_he = null. correct_answer = a natural Hebrew translation of the sentence. No hints. explanation_he = which practice word means what.` }
    case 'multiple_choice': return { q_types: ['multiple_choice'], text: `${base}
SECTION "multiple choice" about meaning. Mix: ${he ? '(a) prompt_he like "מה פירוש המילה village?" with 4 Hebrew meanings as options; (b) prompt_he "מה המילה באנגלית ל-כפר?" with 4 English words as options; (c) prompt_en = an English sentence with one word underlined in *asterisks*, prompt_he = "מה פירוש המילה המסומנת?" with Hebrew meanings.' : 'questions about the meaning of practice words in English.'} ${both} Distractors are other practice words or meanings, never the same meaning twice.` }
    case 'true_false': return { q_types: ['multiple_choice'], text: `${base}
SECTION "true / false". Each question is ONE statement to judge, e.g. prompt_he "המילה market פירושה שוק." or prompt_en "There are twelve months in a year." with prompt_he null. Exactly 2 options: [{"label":"A","value_en":"${he ? 'נכון' : 'True'}","value_he":"${he ? 'נכון' : 'True'}","isCorrect":...},{"label":"B","value_en":"${he ? 'לא נכון' : 'False'}","value_he":"${he ? 'לא נכון' : 'False'}","isCorrect":...}] — about half true and half false.` }
    case 'picture_match': return { q_types: ['multiple_choice'], text: `${base}
SECTION "match the picture". Every question MUST have visual_data {"type":"objects","icon":ICON,"count":N} with ICON one of: apple, star, ball, flower, coin, cookie, fish, car, pencil, book, candy. Mix two kinds: (a) N from 2 to 20 and prompt_he "כמה יש בתמונה? בחרו את המספר באנגלית" — options are English number words that are easy to confuse (e.g. seven / seventeen / seventy / eleven); (b) N = 1–3 of an item that is a practice word (e.g. flower, book) and prompt_he "מה רואים בתמונה?" — options are English words. ${both}` }
    case 'draw': return { q_types: ['word_problem'], text: `${base}
SECTION "draw it". Each question: prompt_en = one short English sentence describing something VERY easy to draw, using practice words and numbers (e.g. "Draw three red flowers.", "Draw a ball under a book."). prompt_he = null. correct_answer = the Hebrew translation of the sentence (for the parent). No visual_data, no hints.` }
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
