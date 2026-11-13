import 'server-only'
import { CLAUDE_MODEL } from '@/lib/claude'
// @ts-ignore: plain JS module shipped by the designer
import { validateVisual } from './validate.js'
import { SYSTEM } from './prompt'
import EXAMPLES from './few_shot.json'

// The designer's generator (scripts/visual-generator/generate.mjs) running inside the app, in LIBRARY mode:
// the model picks a visual type and fills its data; the library draws it. Every result is validated (retries up to 3 times)
// and saved as a proposal for a person to approve. Uses the app's ANTHROPIC_API_KEY.

export type GenQuestion = { id: string; text: string; answer?: string; subject?: string; grade?: string; options?: string[]; lesson?: string }

const TOOL = {
  name: 'submit_visual',
  description: 'Submit the visual aid for one EduPlay question (or decide that it needs none).',
  input_schema: {
    type: 'object',
    required: ['mode', 'why', 'hidden', 'numbers_used'],
    properties: {
      mode: { type: 'string', enum: ['library', 'custom', 'none'] },
      visual_data: { type: 'object', description: 'mode=library: data for the renderer, with a "type" from the catalogue', additionalProperties: true },
      svg: { type: 'string', description: 'mode=custom: one <svg> that follows the custom SVG rules' },
      alt: { type: 'string' },
      why: { type: 'string', description: 'One Hebrew line: what the picture helps the child see' },
      hidden: { type: 'string', description: 'What was deliberately left out or drawn as "?"' },
      numbers_used: { type: 'array', items: { type: 'string' } },
      question_fixes: { type: 'array', items: { type: 'string' } },
      missing_icons: { type: 'array', items: { type: 'string' } },
      new_type_suggestion: { type: 'string' },
    },
  },
}

const userMessage = (q: GenQuestion) => [
  `שאלה: ${q.text}`,
  q.answer !== undefined ? `תשובה נכונה (לבדיקה בלבד, אסור שתופיע בציור): ${q.answer}` : '',
  q.options?.length ? `אפשרויות תשובה: ${q.options.join(' | ')}` : '',
  `מקצוע: ${q.subject || 'math'} · כיתה: ${q.grade || 'לא צוין'}`,
  q.lesson ? `שיעור: ${q.lesson}` : '',
].filter(Boolean).join('\n')

function fewShot(): any[] {
  const msgs: any[] = []
  ;(EXAMPLES as any[]).forEach((ex, i) => {
    msgs.push({ role: 'user', content: userMessage(ex.question) })
    msgs.push({ role: 'assistant', content: [{ type: 'tool_use', id: `ex${i}`, name: TOOL.name, input: ex.result }] })
    msgs.push({ role: 'user', content: [{ type: 'tool_result', tool_use_id: `ex${i}`, content: 'נשמר. השאלה הבאה:' }] })
  })
  return msgs
}

export async function generateVisual(q: GenQuestion): Promise<any> {
  const messages = fewShot()
  messages[messages.length - 1].content.push({ type: 'text', text: userMessage(q) })
  let last: any = { errors: ['no answer'] }
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY!, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: process.env.EDUPLAY_VISUAL_MODEL || CLAUDE_MODEL, max_tokens: 6000, system: SYSTEM, thinking: { type: 'disabled' }, tools: [TOOL], tool_choice: { type: 'tool', name: TOOL.name }, messages }),
    })
    if (!res.ok) return { failed: true, errors: [`AI request failed (${res.status}): ${(await res.text()).slice(0, 200)}`], attempts: attempt }
    const body = await res.json()
    const call = (body.content || []).find((b: any) => b.type === 'tool_use')
    if (!call) { last = { errors: ['the model did not call submit_visual'], attempts: attempt }; continue }
    const check = validateVisual({ text: q.text, answer: q.answer, subject: q.subject, grade: q.grade }, call.input, {})
    last = { ...call.input, ...check, attempts: attempt }
    if (check.ok) return last
    messages.push({ role: 'assistant', content: body.content })
    messages.push({ role: 'user', content: [{ type: 'tool_result', tool_use_id: call.id, is_error: true, content: `הציור נדחה בבדיקה האוטומטית. תקן וקרא שוב ל-submit_visual:\n- ${check.errors.join('\n- ')}` }] })
  }
  return { ...last, failed: true }
}

/** a clean result (passes the validator with no warnings) as the visual_data to save, or null when there is nothing safe to save */
export function savableVisual(g: any): any | null {
  if (!g || g.failed || g.errors?.length || g.warnings?.length) return null
  if (g.mode === 'library' && g.visual_data) return { ...g.visual_data, lib: 'eduplay' }
  if (g.mode === 'custom' && g.svg) return { type: 'custom_svg', svg: g.svg, alt: g.alt || '' }
  return null
}
