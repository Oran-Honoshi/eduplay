import 'server-only'
import { CLAUDE_MODEL } from '@/lib/claude'
import { answersMatch } from '@/lib/answerMatch'
import { deterministicIssues, type Issue } from '@/lib/questionRules'

// A generated question is saved only if it passes ALL of these, in order:
//   1. deterministic rules (questionRules.ts): answer key, arithmetic, every named point/ray is drawn, figures closed…
//   2. an independent solver: a separate model call that never sees the answer key and must reach the same answer
//   3. an independent reviewer: a separate call that checks the text against the picture, ambiguity, grade level, wording
// Anything that fails is discarded with the reason, logged to question_check_log, and the reasons are fed back to the
// generator as lessons. If the checkers cannot run, the question is NOT saved (fail closed).

export type VerifyInput = { prompt_he?: string | null; prompt_en?: string | null; q_type?: string; options?: any[] | null; correct_answer?: any; visual_data?: any }
export type Verdict = { pass: boolean; issues: Issue[]; solver?: string }
export type VerifyCtx = { subject: string; grade: number | string; topic: string }

const enabled = () => process.env.EDUPLAY_VERIFY !== '0' && !!process.env.ANTHROPIC_API_KEY
const MODEL = () => process.env.EDUPLAY_VERIFY_MODEL || CLAUDE_MODEL
const txt = (q: VerifyInput) => String(q.prompt_he || q.prompt_en || '').replace(/\s+/g, ' ').trim()
const LET = 'ABCDEFGH'

function pictureNote(v: any): string {
  if (!v || typeof v !== 'object') return '(no picture)'
  if (v.type === 'custom_svg') return `(custom drawing: ${String(v.alt || '').slice(0, 200)})`
  return `the picture is drawn from exactly this data: ${JSON.stringify(v).slice(0, 1400)}`
}

async function callTool(system: string, user: string, tool: any): Promise<any> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY!, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: MODEL(), max_tokens: 6000, system, thinking: { type: 'disabled' }, tools: [tool], tool_choice: { type: 'tool', name: tool.name }, messages: [{ role: 'user', content: user }] }),
        signal: AbortSignal.timeout(75_000),
      })
      if (!res.ok) continue
      const body = await res.json()
      const call = (body.content || []).find((b: any) => b.type === 'tool_use')
      if (call?.input) return call.input
    } catch { /* retry once */ }
  }
  return null
}

const SOLVER_TOOL = {
  name: 'submit_answers',
  description: 'Your own answer to every question.',
  input_schema: { type: 'object', required: ['answers'], properties: { answers: { type: 'array', items: { type: 'object', required: ['id', 'answer'], properties: {
    id: { type: 'string' },
    answer: { type: 'string', description: 'multiple choice: the option letter only (A, B, C…). open question: the bare answer.' },
    problems: { type: 'array', items: { type: 'string' }, description: 'anything that stops you answering with certainty: missing information, ambiguity, an object the text mentions that the picture data does not contain, two defensible answers' },
  } } } } },
}

const REVIEW_TOOL = {
  name: 'submit_review',
  description: 'The review of every question.',
  input_schema: { type: 'object', required: ['reviews'], properties: { reviews: { type: 'array', items: { type: 'object', required: ['id', 'issues'], properties: {
    id: { type: 'string' },
    issues: { type: 'array', items: { type: 'object', required: ['code', 'severity', 'detail'], properties: {
      code: { type: 'string', enum: ['TEXT_MENTIONS_MISSING_ELEMENT', 'PICTURE_SHOWS_ANSWER', 'AMBIGUOUS', 'WRONG_ANSWER', 'MULTIPLE_CORRECT', 'WRONG_GRADE_LEVEL', 'LANGUAGE_ERROR', 'PICTURE_CONTRADICTS_TEXT', 'ANSWER_GIVEN_AWAY', 'OTHER'] },
      severity: { type: 'string', enum: ['block', 'minor'] },
      detail: { type: 'string', description: 'one short sentence, in English' },
    } } },
  } } } } },
}

const SOLVER_SYSTEM = `You are a careful Israeli primary/middle-school teacher. Answer each question on your own, exactly as a strong student of that grade would. You are NOT told which option is right. If a picture is described, use ONLY what the picture data shows. If the text depends on something that is not in the question or the picture data, say so in "problems" instead of guessing.`

const REVIEW_SYSTEM = `You review generated school questions (Israeli curriculum, Hebrew/English) before children see them. For every question you get the text, the options, the marked correct answer, and the exact data a picture is drawn from. Report an issue ONLY when it is real, with severity "block" when a child could be misled, stuck or taught something wrong, and "minor" for polish.
Check, in this order:
1. TEXT_MENTIONS_MISSING_ELEMENT: the text refers to something the picture data does not contain (a flag that is not drawn, a third ray that is missing, a point with no label, "the shaded part" with nothing shaded). Also anything the text says about the picture that the data contradicts (PICTURE_CONTRADICTS_TEXT).
2. WRONG_ANSWER / MULTIPLE_CORRECT: work the question yourself; the marked answer must be correct and the only correct one.
3. PICTURE_SHOWS_ANSWER / ANSWER_GIVEN_AWAY: the picture, the text, or the hint writes or points at the answer.
4. AMBIGUOUS: a child could reasonably read it two ways.
5. WRONG_GRADE_LEVEL: clearly too hard or too easy for the stated grade.
6. LANGUAGE_ERROR: wrong grammar, gender or number agreement, wrong terminology, mixed languages, or a nonsense sentence.
Do not invent problems. A question that is fine has an empty issues list.`

function block(q: VerifyInput, i: number, withKey: boolean): string {
  const opts = Array.isArray(q.options) ? q.options : []
  const lines = [`[id ${i}]`, `question: ${txt(q)}`]
  if (opts.length) {
    lines.push('options:'); opts.forEach((o, k) => lines.push(`  ${LET[k]}. ${String(o?.value_he ?? o?.value_en ?? '')}${withKey && o?.isCorrect ? '   <- marked correct' : ''}`))
  } else if (withKey) lines.push(`marked correct answer: ${String(q.correct_answer ?? '')}`)
  else lines.push('(open question: write the bare answer)')
  lines.push(pictureNote(q.visual_data))
  return lines.join('\n')
}

/** verifies a batch; the result array lines up with the input */
export async function verifyBatch(qs: VerifyInput[], ctx: VerifyCtx): Promise<Verdict[]> {
  const out: Verdict[] = qs.map(q => ({ pass: true, issues: deterministicIssues(q) }))
  out.forEach(v => { if (v.issues.some(i => i.block)) v.pass = false })
  if (!enabled()) return out
  const live = qs.map((_, i) => i).filter(i => out[i].pass)
  if (!live.length) return out
  const head = `subject: ${ctx.subject}\ngrade: ${ctx.grade}\ntopic: ${ctx.topic}\n\n`
  const [solved, reviewed] = await Promise.all([
    callTool(SOLVER_SYSTEM, head + live.map(i => block(qs[i], i, false)).join('\n\n'), SOLVER_TOOL),
    callTool(REVIEW_SYSTEM, head + live.map(i => block(qs[i], i, true)).join('\n\n'), REVIEW_TOOL),
  ])
  for (const i of live) {
    const q = qs[i], v = out[i], opts = Array.isArray(q.options) ? q.options : []
    if (!solved || !reviewed) { v.pass = false; v.issues.push({ code: 'CHECKER_UNAVAILABLE', detail: 'the independent check could not run, so the question was not saved', block: true }); continue }
    const s = (solved.answers || []).find((a: any) => String(a.id) === String(i))
    const r = (reviewed.reviews || []).find((a: any) => String(a.id) === String(i))
    if (!s) { v.pass = false; v.issues.push({ code: 'SOLVER_NO_ANSWER', detail: 'the independent solver gave no answer', block: true }) }
    else {
      v.solver = String(s.answer || '')
      const mine = String(s.answer || '').trim()
      if (opts.length) {
        const picked = opts[LET.indexOf(mine.replace(/[^A-H]/gi, '').toUpperCase()[0] || '?')]
        if (!picked) { if (mine) v.issues.push({ code: 'SOLVER_UNCLEAR', detail: `the solver answered "${mine.slice(0, 40)}", not an option letter`, block: false }) }
        else if (!picked.isCorrect) { v.pass = false; v.issues.push({ code: 'SOLVER_DISAGREES', detail: `an independent solver chose "${String(picked.value_he ?? picked.value_en)}", the key says "${String(opts.find(o => o?.isCorrect)?.value_he ?? opts.find(o => o?.isCorrect)?.value_en ?? '')}"`, block: true }) }
      } else if (mine && !answersMatch(mine, String(q.correct_answer ?? ''))) {
        v.pass = false; v.issues.push({ code: 'SOLVER_DISAGREES', detail: `an independent solver answered "${mine.slice(0, 60)}", the key says "${String(q.correct_answer ?? '').slice(0, 60)}"`, block: true })
      }
      for (const p of (s.problems || []).slice(0, 3)) v.issues.push({ code: 'SOLVER_PROBLEM', detail: String(p).slice(0, 200), block: false })
    }
    for (const it of (r?.issues || [])) {
      const blockIt = it.severity === 'block'
      v.issues.push({ code: String(it.code || 'OTHER'), detail: String(it.detail || '').slice(0, 220), block: blockIt })
      if (blockIt) v.pass = false
    }
  }
  return out
}

/** one row per checked question (pass and fail), so repeated failures show where the generator needs work */
export async function logVerdicts(sb: any, qs: VerifyInput[], vs: Verdict[], ctx: VerifyCtx, topicSlug: string): Promise<void> {
  try {
    const rows = qs.map((q, i) => ({ stage: 'generate', verdict: vs[i].pass ? 'pass' : 'fail', subject: ctx.subject, grade: Number(ctx.grade) || null, topic_slug: topicSlug, prompt: txt(q).slice(0, 400), issues: vs[i].issues, solver_answer: vs[i].solver || null }))
    if (rows.length) await sb.from('question_check_log').insert(rows)
  } catch { /* logging must never break generation */ }
}

/** what the checkers rejected lately for this subject, as lessons for the generator's prompt */
export async function loadCheckLessons(sb: any, subject: string): Promise<string> {
  try {
    const { data } = await sb.from('question_check_log').select('issues').eq('verdict', 'fail').eq('subject', subject).order('created_at', { ascending: false }).limit(40)
    const seen = new Set<string>(), lines: string[] = []
    for (const r of data || []) for (const i of (r.issues || [])) {
      if (!i.block) continue
      const k = String(i.code); if (seen.has(k)) continue
      seen.add(k); lines.push(`- ${i.code}: ${String(i.detail).slice(0, 160)}`)
      if (lines.length >= 8) break
    }
    return lines.length ? `\n\nRecent mistakes caught by the automatic checkers (do not repeat them; every picture must contain everything the text names, answers must be verifiable):\n${lines.join('\n')}\n` : ''
  } catch { return '' }
}
