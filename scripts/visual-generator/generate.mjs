// EduPlay visual generator: question → visual (library visual_data, or a custom SVG) → validated → saved.
//
//   npm i @anthropic-ai/sdk
//   export ANTHROPIC_API_KEY=...
//   node generator/generate.mjs questions.json out.json          # batch (array of questions)
//   node generator/generate.mjs --one "כמה זה 3 × 4?" 12 math ג   # one question (text, answer, subject, grade)
//   EDUPLAY_VISUAL_STRATEGY=draw node generator/generate.mjs …      # the model draws every picture itself
//
// Each question: { id?, text, answer?, subject?: 'math'|'hebrew'|'english'|'reading', grade?: 'גן'|'א'|…, options?: [] }
// Output per question: { id, mode, visual_data | svg, alt, why, hidden, warnings, attempts, needs_review }
//
// Nothing is written to the database here. Import the output in your admin screen and approve it there.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Anthropic from '@anthropic-ai/sdk';
import { validateVisual } from '../../src/lib/eduVisuals/validate.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
// STRATEGY: 'library' = the model fills visual_data and the library draws it (today's default: exact brand, cheap)
//           'draw'    = the model draws every picture itself as SVG, in the library's style (the goal; see DRAW_MODE.md)
export const STRATEGY = process.env.EDUPLAY_VISUAL_STRATEGY || 'library';
const DRAW = STRATEGY === 'draw';
const SYSTEM = fs.readFileSync(path.join(HERE, 'SYSTEM_PROMPT.md'), 'utf8') + (DRAW ? fs.readFileSync(path.join(HERE, 'DRAW_MODE.md'), 'utf8') : '');
const EXAMPLES = JSON.parse(fs.readFileSync(path.join(HERE, DRAW ? 'few_shot_draw.json' : 'few_shot.json'), 'utf8'));
const MODEL = process.env.EDUPLAY_VISUAL_MODEL || 'claude-sonnet-5-5'; // any current Claude model works; Opus for the hardest custom SVGs
const MAX_ATTEMPTS = 3;

export const TOOL = {
  name: 'submit_visual',
  description: 'Submit the visual aid for one EduPlay question (or decide that it needs none).',
  input_schema: {
    type: 'object',
    required: ['mode', 'why', 'hidden', 'numbers_used'],
    properties: {
      mode: { type: 'string', enum: ['library', 'custom', 'none'] },
      visual_data: { type: 'object', description: 'mode=library: data for the renderer, with a "type" from the catalogue', additionalProperties: true },
      svg: { type: 'string', description: 'mode=custom: one <svg> that follows the custom SVG rules' },
      alt: { type: 'string', description: 'Hebrew description of the picture for screen readers (no answer)' },
      why: { type: 'string', description: 'One Hebrew line: what the picture helps the child see' },
      hidden: { type: 'string', description: 'What was deliberately left out or drawn as "?"' },
      numbers_used: { type: 'array', items: { type: 'string' }, description: 'Every number in the picture and where it comes from in the question' },
      question_fixes: { type: 'array', items: { type: 'string' } },
      missing_icons: { type: 'array', items: { type: 'string' } },
      new_type_suggestion: { type: 'string' },
    },
  },
};

let client = null;
const api = () => (client ??= new Anthropic());
/** for tests: inject a fake client with messages.create() */
export function setClient(c) { client = c; }

function userMessage(q) {
  return [
    `שאלה: ${q.text}`,
    q.answer !== undefined ? `תשובה נכונה (לבדיקה בלבד, אסור שתופיע בציור): ${q.answer}` : '',
    q.options?.length ? `אפשרויות תשובה: ${q.options.join(' | ')}` : '',
    `מקצוע: ${q.subject || 'math'} · כיתה: ${q.grade || 'לא צוין'}`,
    q.lesson ? `שיעור: ${q.lesson}` : '',
  ].filter(Boolean).join('\n');
}

// few-shot: earlier turns that show the expected tool call for typical questions
function fewShot() {
  const msgs = [];
  EXAMPLES.forEach((ex, i) => {
    msgs.push({ role: 'user', content: userMessage(ex.question) });
    msgs.push({ role: 'assistant', content: [{ type: 'tool_use', id: `ex${i}`, name: TOOL.name, input: ex.result }] });
    msgs.push({ role: 'user', content: [{ type: 'tool_result', tool_use_id: `ex${i}`, content: 'נשמר. השאלה הבאה:' }] });
  });
  return msgs;
}

export async function generateOne(q) {
  const messages = [...fewShot()];
  // the last few-shot turn is a user tool_result; append the real question to it
  messages[messages.length - 1].content.push({ type: 'text', text: userMessage(q) });
  let last;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const res = await api().messages.create({
      model: MODEL, max_tokens: DRAW ? 16000 : 4000, system: SYSTEM,
      tools: [TOOL], tool_choice: { type: 'tool', name: TOOL.name }, messages,
    });
    const call = res.content.find(b => b.type === 'tool_use');
    if (!call) { last = { errors: ['the model did not call submit_visual'] }; continue; }
    const check = validateVisual(q, call.input, { draw: DRAW });
    if (DRAW && call.input.mode === 'library') check.warnings.push('draw mode: the model used the library instead of drawing');
    last = { ...call.input, ...check, attempts: attempt };
    if (check.ok) return finish(q, last);
    // send the errors back and ask for a corrected call
    messages.push({ role: 'assistant', content: res.content });
    messages.push({ role: 'user', content: [{ type: 'tool_result', tool_use_id: call.id, is_error: true,
      content: `הציור נדחה בבדיקה האוטומטית. תקן וקרא שוב ל-submit_visual:\n- ${check.errors.join('\n- ')}` }] });
  }
  return finish(q, { ...last, failed: true });
}

function finish(q, r) {
  return {
    id: q.id, mode: r.mode,
    ...(r.mode === 'library' ? { visual_data: r.visual_data } : {}),
    ...(r.mode === 'custom' ? { svg: r.svg, alt: r.alt } : {}),
    why: r.why, hidden: r.hidden, numbers_used: r.numbers_used,
    question_fixes: r.question_fixes, missing_icons: r.missing_icons, new_type_suggestion: r.new_type_suggestion,
    warnings: r.warnings || [], errors: r.errors || [], attempts: r.attempts,
    // custom drawings, warnings and failures go to a person; clean library visuals can be auto-approved
    needs_review: !!(r.failed || (r.mode === 'custom' && !DRAW) || (r.warnings || []).length || (r.question_fixes || []).length),
  };
}

// ---------- CLI ----------
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args[0] === '--one') {
    const [, text, answer, subject, grade] = args;
    console.log(JSON.stringify(await generateOne({ text, answer, subject, grade }), null, 2));
  } else {
    const [inFile, outFile = 'visuals.out.json'] = args;
    const qs = JSON.parse(fs.readFileSync(inFile, 'utf8'));
    const out = [];
    for (const q of qs) { // sequential keeps it simple and within rate limits; parallelise in small batches if needed
      const r = await generateOne(q); out.push(r);
      console.log(`${q.id || ''} ${r.mode}${r.errors?.length ? ' ✗' : ' ✓'}${r.needs_review ? ' (review)' : ''}`);
      fs.writeFileSync(outFile, JSON.stringify(out, null, 2));
    }
    const s = k => out.filter(k).length;
    console.log(`\n${out.length} questions · library ${s(r => r.mode === 'library')} · custom ${s(r => r.mode === 'custom')} · none ${s(r => r.mode === 'none')} · to review ${s(r => r.needs_review)} · failed ${s(r => r.errors?.length)}`);
  }
}
