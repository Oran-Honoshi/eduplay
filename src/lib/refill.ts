import 'server-only'
import { askClaudeJSON } from '@/lib/claude'
import { MATH_STYLE } from '@/lib/bankUpgrade'
import { insertQuestions } from '@/lib/insertQuestions'
import { curriculumNote, readingLevel } from '@/lib/curriculum'

// When a question is moved out of a lesson in review, the lesson gets a new
// question in its place: written like the lesson's other questions, saved as
// NOT approved, so it waits under "שאלות חדשות לשיעור" in /admin/bank.

const SUBJ_HE: Record<string, string> = { math: 'חשבון', hebrew: 'עברית', english: 'אנגלית' }

type NewQ = { difficulty: 'easy' | 'medium' | 'hard'; prompt_he: string; prompt_en: string; options: { he: string; en: string; correct: boolean }[]; hint_he: string; explanation_he: string }

export async function refillTopic(db: any, topicId: string, count: number, removed?: any) {
  const { data: t } = await db.from('topics').select('id, slug, grade, title_he, title_en, description_he, subject:subjects(slug)').eq('id', topicId).maybeSingle()
  if (!t) return { ok: false, error: 'no topic' }
  const { data: sample } = await db.from('questions').select('prompt_he, prompt_en, difficulty').eq('topic_id', topicId).eq('approved', true).is('rejected_at', null).limit(12)
  const subj = t.subject?.slug || 'math'
  const english = subj === 'english'
  const system = `You write new multiple-choice practice questions for an Israeli kids' learning app: ${SUBJ_HE[subj] || subj}, grade ${t.grade} (כיתה ${'אבגדהו'[t.grade - 1] || t.grade}׳), lesson "${t.title_he || t.title_en}".
${curriculumNote(subj, t.grade)}
Niqqud for this grade: ${({ full: 'full niqqud on all Hebrew text', partial: 'niqqud only on words a child may misread', ambiguous: 'niqqud only on ambiguous words', none: 'no niqqud' } as any)[readingLevel(t.grade).niqqud]}.
${t.description_he ? `What this lesson teaches: ${t.description_he}` : ''}
${english && t.grade <= 2 ? 'ORAL ENGLISH (grades 1–2): the child does not read English yet. A parent reads the question and the answers aloud. Write the question in Hebrew (prompt_he), e.g. "איך אומרים כֶּלֶב באנגלית?" or "מה פירוש המילה red?", with English options of one or two very common words. The options are ALWAYS English words (never Hebrew), so never ask "מה פירוש המילה …?" with English options; ask "איך אומרים … באנגלית?", "איזו מילה באנגלית מתאימה ל…?" or a short spoken instruction ("מה עושים כששומעים Stand up?" with English or simple Hebrew-free choices). No English sentences to read, no spelling, no grammar. prompt_en: the same question in simple English.' : ''}
Write ${count} new question(s) that fit THIS lesson and grade exactly, in the style of the lesson's questions below (if there are any), but none identical to them. Vary them: easy, medium and a few harder ones.
${removed ? `A question was just moved OUT of this lesson because it did not belong here: "${removed.prompt_he || removed.prompt_en}". Do not write anything like it.` : ''}
Return JSON only: an array of {"difficulty":"easy"|"medium"|"hard","prompt_he":"...","prompt_en":"...","options":[{"he":"...","en":"...","correct":true|false} ×4],"hint_he":"one short hint, never the answer","explanation_he":"2–4 short steps, one per line, the last ends with the answer"}.
Exactly one correct option; the wrong options are plausible mistakes a child would make. ${english ? 'English lessons: the question and options are in English (en); prompt_he is the same question in Hebrew for the Hebrew line; the hint and steps are in Hebrew with English words kept in English.' : 'prompt_he is the question in natural Hebrew; prompt_en a faithful English translation; options he and en.'}
Questions must not refer to a picture. Speak to the child in the plural (נסו, ספרו).
${MATH_STYLE}`
  const r = await askClaudeJSON<NewQ[]>({ system, content: (sample || []).length ? 'The lesson\'s questions:\n' + (sample || []).map((q: any) => `- ${q.prompt_he || q.prompt_en}`).join('\n') : 'This is a new lesson with no questions yet.', maxTokens: 900 * count + 400 })
  if (!r.ok || !Array.isArray(r.data)) return { ok: false, error: r.ok ? 'bad' : r.error }
  const L = 'ABCD'
  const rows = r.data.filter(q => q && Array.isArray(q.options) && q.options.length === 4 && q.options.filter(o => o.correct).length === 1).slice(0, count).map(q => ({
    topic_slug: t.slug, topic_id: t.id, grade: t.grade, difficulty: (['easy', 'medium', 'hard'].includes(q.difficulty) ? q.difficulty : 'medium') as any,
    q_type: 'multiple_choice', prompt_en: q.prompt_en || q.prompt_he, prompt_he: q.prompt_he,
    options: q.options.map((o, i) => ({ label: L[i], value_he: english ? (o.en || o.he) : (o.he || o.en), value_en: o.en || o.he, isCorrect: !!o.correct })),
    correct_answer: L[q.options.findIndex(o => o.correct)], hint_he: q.hint_he, explanation_he: q.explanation_he, approved: false,
  }))
  if (!rows.length) return { ok: false, error: 'nothing usable' }
  const res = await insertQuestions(rows as any)
  return { ok: res.ok, added: rows.length }
}
