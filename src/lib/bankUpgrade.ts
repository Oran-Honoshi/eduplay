import 'server-only'
import { askClaudeJSON } from '@/lib/claude'

// Bringing the ready K–6 lesson bank up to the level of Create: every question
// gets a Hebrew hint, a step-by-step solution (one short step per line, the
// last one ending with the answer), a parent tip, an answer check and, if the
// Hebrew wording breaks the school math style, a corrected wording. Each topic
// also gets a short "learn" card (summary, key points, one worked example).
// Everything is written as drafts; nothing reaches a child before approval.

export const BANK_BATCH = 'bank-2026-11'

export const MATH_STYLE = `Writing math (Israeli school style): signed numbers in brackets like (+5), (−3); an exercise reads left to right, e.g. (+5) − (+9) = −4; mixed numbers as whole, space, fraction — 3 3/4 (never Unicode fraction characters like ¾); fractions as a/b; × for multiplication and : for division in the lower grades; degrees as 5°C; angles as ∢ABC; a missing number or sign is the box ☐. Comparisons are read left to right. In Hebrew abbreviations use ״ or ׳, never a plain double quote. Keep every exercise whole on one line.`

const SUBJ_HE: Record<string, string> = { math: 'חשבון', hebrew: 'עברית', english: 'אנגלית' }
const gradeHe = (g: number) => (g === 0 ? 'גן' : `כיתה ${'אבגדהוזחטיכ'[g - 1] || g}׳`)

export type SupportDraft = {
  id: string
  ok: boolean
  answer_check: string
  prompt_he_fix: string | null
  hint_he: string
  hint_en: string | null
  steps: { he: string; en: string | null }[]
  parent_tip_he: string
  flags: string[]
}

export async function draftSupport(topic: any, questions: any[]) {
  const subj = topic.subject?.slug || 'math'
  const english = subj === 'english'
  const system = `You are an expert Israeli teacher and children's educational writer reviewing ready practice questions for ${SUBJ_HE[subj] || subj}, ${gradeHe(topic.grade)}, topic "${topic.title_he || topic.title_en}".
For EACH question you are given, return one object:
{"id":"<same id>","ok":true|false,"answer_check":"<one short sentence: is the marked answer right and the question clear?>","prompt_he_fix":"<corrected Hebrew question>"|null,"hint_he":"...","hint_en":${english ? '"..."' : 'null'},"steps":[{"he":"...","en":${english ? '"..."' : 'null'}}],"parent_tip_he":"...","flags":[...]}
Rules:
- ok=false only if the marked correct answer is wrong, two options are correct, or the question cannot be understood; explain in answer_check and add a flag ("wrong_answer", "two_correct", "unclear", "not_grade_level").
- hint_he: one or two short sentences that point to the method or the first thing to notice. Never contain the answer or eliminate options by name.
- steps: 2–5 steps a child of this age can follow alone, each one short sentence (max ~20 words), in the order a teacher would solve on the board. Show the actual numbers in each step. The LAST step ends with the answer ("התשובה היא …"). For multiple choice, name the right option's value, not its letter.
- For young children (גן–ב׳) use very simple words and concrete objects (fingers, apples, jumps on a number line).
- parent_tip_he: one or two sentences for a parent sitting with the child: a quick way to explain or check it at home (objects, drawing, a question to ask). Not the answer itself.
- prompt_he_fix: only if the Hebrew question breaks the math writing style below, has a typo, is not natural Hebrew, or is missing; otherwise null. Never change numbers, the answer or the meaning.
- ${english ? 'English lessons: the question content stays in English; hints and steps are in Hebrew (he) with the English words kept in English, and also in simple English (en).' : 'Write in Hebrew only (en fields null).'}
${MATH_STYLE}
Output JSON only: an array with exactly one object per question, same ids.`
  const items = questions.map(q => ({
    id: q.id, type: q.q_type, difficulty: q.difficulty,
    question_he: q.prompt_he, question_en: q.prompt_en,
    options: Array.isArray(q.options) ? q.options.map((o: any) => ({ label: o.label, he: o.value_he ?? null, en: o.value_en ?? null, correct: !!o.isCorrect })) : null,
    correct_answer: q.correct_answer || null,
    picture: q.visual_data?.type || null,
  }))
  return askClaudeJSON<SupportDraft[]>({ system, content: JSON.stringify(items), maxTokens: 900 * questions.length + 500 })
}

export type LearnCard = {
  title_he: string; summary_he: string; key_points_he: string[]
  example: { problem_he: string; steps_he: string[]; answer_he: string; visual: any }
}

export async function draftLearnCard(topic: any, sample: any[]) {
  const subj = topic.subject?.slug || 'math'
  const system = `You write the short "learn" card a child sees before practising a topic, in Hebrew, for ${SUBJ_HE[subj] || subj}, ${gradeHe(topic.grade)}, topic "${topic.title_he || topic.title_en}".
Return JSON only:
{"title_he":"...","summary_he":"2–3 short sentences: what this is and when we use it, in a child's words","key_points_he":["3 short points to remember"],"example":{"problem_he":"one typical exercise like the practice questions","steps_he":["2–5 short steps, the last ends with the answer"],"answer_he":"...","visual":null|{...}}}
The example must be like the practice questions below but not identical to any of them. For young children (גן–ב׳) use concrete objects and very simple words. ${subj === 'english' ? 'English lessons: explain in Hebrew, keep the English words and example in English.' : ''}
Optional visual for the example, only if it helps: {"type":"number_line","min":0,"max":10,"marked":[...]}, {"type":"fraction","n":1,"d":4}, {"type":"fraction_pie","n":1,"d":4}, {"type":"objects","icon":"apple","count":5,"crossed":2}, {"type":"rectangle","w":6,"h":4}, {"type":"clock","h":3,"m":30}, {"type":"coordinate","steps":6,"quadrant":1,"points":[[2,3,"A"]]}. Never show the answer in it.
${MATH_STYLE}`
  const content = 'Practice questions in this lesson:\n' + sample.slice(0, 8).map(q => `- ${q.prompt_he || q.prompt_en}`).join('\n')
  return askClaudeJSON<LearnCard>({ system, content, maxTokens: 1800 })
}
