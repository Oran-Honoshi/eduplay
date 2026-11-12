import 'server-only'
import { askClaudeJSON } from '@/lib/claude'
import { curriculumNote } from '@/lib/curriculum'

// Content pass for the question-screen design (designer handover
// EduPlay_QuestionScreens, 2026-11). For every question in the bank it adds:
//   · the key concept: one [[highlighter]] in the question (or in the helper line)
//   · data marking for word problems: <<n:data>> spans and the steps that use them
//   · a short helper line (how to think, never the answer)
//   · a "right" line (why it's right) and a "wrong" line (a strategy, never "wrong")
// The question's wording is never changed: the markup is checked against the
// original text and dropped if anything else moved. Everything is a draft until
// an admin approves it (question_design_drafts → questions.design).

export const DESIGN_BATCH = 'design-2026-11'

const SUBJ_HE: Record<string, string> = { math: 'חשבון', hebrew: 'עברית', english: 'אנגלית' }
const gradeHe = (g: number) => (g === 0 ? 'גן' : `כיתה ${'אבגדהו'[g - 1] || g}׳`)

export type DesignDraft = {
  id: string
  he?: { question?: string | null; helper?: string | null; right?: string | null; wrong?: string | null } | null
  en?: { question?: string | null; helper?: string | null; right?: string | null; wrong?: string | null } | null
  data_marking?: { step_he?: string | null; step_en?: string | null; data: number[] }[] | null
  flags?: string[]
}

const RULES = `THE TWO KINDS OF EMPHASIS
1. The key concept: wrap EXACTLY ONE word or short phrase in [[...]]. It marks what the child must notice to solve it: the operation ("[[הוסיפה]]", "[[ביחד]]", "[[שש פעמים]]"), the skill ("באיזו אות [[מתחילה]]"), what to look for ("What [[color]] is the bus?", "[[She]] ___ a new book"), a comparison ("[[הכי הרבה]]"), or which item counts when there is an extra fact ("[[על החולצה]]"). Never a whole sentence, never the answer, never a number or anything containing a digit (mark the word next to it instead). When the question is a bare exercise ("כמה זה 6 × 7?"), put the key concept in the helper line instead ("זה לחבר את 7 [[שש פעמים]]") and leave the question without [[ ]].
2. Numbers: do NOT mark numbers; the app turns every number into a chip by itself.

DATA MARKING (word problems only, i.e. a question that tells a story with several facts)
- Wrap each piece of data, the number AND what it counts, in <<n:...>> with n = 0, 1, 2… in order: "בסל יש <<0:8 תפוחים>>, ואמא [[הוסיפה]] עוד <<1:5 תפוחים>>".
- data_marking lists the steps of the solution and the data each step needs. One-step problem: [{"step_he":null,"data":[0,1]}]. Two-step problem: [{"step_he":"כמה שקלים ההנחה?","data":[0,1]},{"step_he":"כמה משלמים בסוף?","data":[0]}] with short step questions (max ~5 words).
- A fact that is not needed (a distractor) gets its own <<n:...>> but belongs to no step.
- The key concept may not sit inside a data span. Not a word problem → no << >> and data_marking null.

HELPER LINE (optional, one short line, max ~10 words): how to think, never the answer. For a×b exercises: "3 × 4 זה לחבר את 4 [[שלוש פעמים]]". null when the question is already obvious.

MULTIPLICATION is always repeated addition: a × b means adding b, a times. Use that meaning in the helper and feedback ("3 × 4 = 4 + 4 + 4 = 12").

FEEDBACK
- right: one short line saying WHY it is right ("8 ועוד 5 זה 13. ספרת נכון!"). Multi-step: name the steps ("שלב 1: … שלב 2: …").
- wrong: one short line with a strategy that teaches ("נסו לספור מ-8 קדימה: 9, 10, 11…"). Never the word "טעות", never "wrong", never the answer itself, never eliminate options by name.
- Speak to the child in the PLURAL, the way Israeli schoolbooks do, in every line: "נסו", "ספרו", "הקשיבו", "חשבו", "בדקו", "מצאתם", "ספרתם נכון!", "קראתם". Never singular masculine or feminine forms (no "ספרי", "הקשיבי", "נסה", "ספרת", "קראת", "שמעתן"). Or write impersonally ("8 ועוד 5 זה 13. נכון!").
- Do not put emoji, pictures or symbols inside [[ ]]; choose a word.
- Warm, short, in a child's language. Grades א׳–ב׳: very simple words and niqqud on hard words only if the question itself has niqqud.
- Never end a sentence with a number or a math expression (Hebrew right-to-left pushes the period to the wrong side): rephrase, or drop the final period.`

export async function draftDesign(topic: any, questions: any[]) {
  const subj = topic.subject?.slug || 'math'
  const english = subj === 'english'
  const system = `You prepare practice questions for a new kids' question screen (Hebrew-first app, grades א׳–ו׳). Subject: ${SUBJ_HE[subj] || subj}, ${gradeHe(topic.grade)}, topic "${topic.title_he || topic.title_en}".
${curriculumNote(subj, Number.isFinite(Number(topic.grade)) ? Number(topic.grade) : 3)}
For EACH question return one object:
${english
  ? `{"id":"<same id>","he":{"question":"<the Hebrew question line exactly as given, no [[ ]]>","helper":null,"right":"<Hebrew, English words kept in English>","wrong":"<Hebrew, English words kept in English>"},"en":{"question":"<the English question exactly as given, with ONE [[key concept]]>","helper":null,"right":"<simple English>","wrong":"<simple English>"},"data_marking":null,"flags":[]}`
  : `{"id":"<same id>","he":{"question":"<the Hebrew question exactly as given, with the markup added>","helper":"<or null>","right":"...","wrong":"..."},"en":null,"data_marking":null|[...],"flags":[]}`}
CRITICAL: the question text must stay EXACTLY as given, letter for letter (same words, niqqud, punctuation, spaces). You only ADD [[ ]] and <<n: >> around existing text. If the question is missing, broken or the marked answer looks wrong, still return it unchanged and add a flag ("unclear", "wrong_answer").
${RULES}
Output JSON only: an array with exactly one object per question, same ids.`
  const items = questions.map(q => ({
    id: q.id,
    question_he: q.prompt_he || null,
    question_en: english ? (q.prompt_en || null) : undefined,
    options: Array.isArray(q.options) && q.options.length ? q.options.map((o: any) => ({ he: o.value_he ?? null, en: o.value_en ?? null, correct: !!o.isCorrect })) : null,
    answer: Array.isArray(q.options) && q.options.length ? undefined : (q.correct_answer || null),
    solution: q.explanation_he || null,
    hint: q.hint_he || null,
  }))
  return askClaudeJSON<DesignDraft[]>({ system, content: JSON.stringify(items), maxTokens: 700 * questions.length + 400 })
}

// ── checks ─────────────────────────────────────────────────
const norm = (t: string | null | undefined) => String(t ?? '').replace(/\s+/g, ' ').trim()
const strip = (t: string | null | undefined) => String(t ?? '').replace(/\[\[([\s\S]+?)\]\]/g, '$1').replace(/<<\d+:([\s\S]+?)>>/g, '$1')
const keys = (t: string | null | undefined) => (String(t ?? '').match(/\[\[[\s\S]+?\]\]/g) || [])

/** keeps only markup that leaves the question's wording untouched; returns the design to save + flags */
export function checkDesign(q: any, d: DesignDraft, english: boolean): { design: any; flags: string[] } {
  const flags = [...(Array.isArray(d.flags) ? d.flags : [])]
  const he = { ...(d.he || {}) }
  const en = d.en ? { ...d.en } : null

  // the marked question must read exactly like the original
  const orig = english ? q.prompt_en : q.prompt_he
  const main = english ? en : he
  if (main?.question && norm(strip(main.question)) !== norm(orig)) { flags.push('text_changed'); main.question = null }
  if (english && he.question && norm(strip(he.question)) !== norm(q.prompt_he)) he.question = null
  if (english && he.question) he.question = strip(he.question) // the Hebrew line carries no highlighter

  // exactly one key concept, never on a number
  const allKeys = [...keys(main?.question), ...keys(he.helper), ...keys(en?.helper)]
  if (allKeys.length !== 1) flags.push(allKeys.length ? 'key_count' : 'no_key')
  if (allKeys.some(k => /\d/.test(k))) flags.push('key_has_number')

  // data marking must point at real data
  const dataIdx = new Set(Array.from(String(main?.question || '').matchAll(/<<(\d+):/g)).map(m => Number(m[1])))
  let marking = Array.isArray(d.data_marking) ? d.data_marking.filter(s => Array.isArray(s?.data) && s.data.length && s.data.every(n => dataIdx.has(n))) : null
  if (!dataIdx.size || !marking?.length) marking = null
  if (dataIdx.size && !marking) flags.push('data_no_steps')

  for (const f of ['right', 'wrong'] as const) if (!he[f]) flags.push(`no_${f}`)
  const design: any = { he: clean(he), data_marking: marking }
  if (en) design.en = clean(en)
  return { design, flags: Array.from(new Set(flags)) }
}

function clean(o: any) {
  const r: any = {}
  for (const k of ['question', 'helper', 'right', 'wrong']) if (o?.[k] && String(o[k]).trim()) r[k] = String(o[k]).trim()
  return r
}
