// Checks a generated visual before it is saved. Used by generate.mjs, and usable on its own (CI, admin screen).
// validateVisual(question, result) → { ok, errors[], warnings[], svg }
import { renderVisual, VISUAL_TYPES } from './visuals.js';
import { ICONS, ICON_ALIASES } from './icons.js';

// required fields per type (the rest are optional)
export const REQUIRED = {
  objects: ['icon', 'count'], compare_groups: ['a', 'b'], pairs: [], ten_frame: ['filled'], number_track: ['from', 'to'],
  hundred_chart: ['from', 'to'], number_line: [], base_ten: [], place_value: [], pattern_strip: ['items'],
  groups: ['groups', 'each', 'icon'], array: ['rows', 'cols'], share: ['total', 'groups', 'icon'], plates: ['count'],
  bar_model: [], op_cards: ['items'], function_machine: ['ops'], steps: ['items'], money: ['items'],
  clock: [], clock_span: [], minutes_pie: ['hours'], ruler: ['unit'], strips: ['items'], scale: [], measuring_cup: ['max'],
  bar_chart: ['xlabels', 'values'], graph: ['xlabels', 'values'], pictograph: ['key', 'rows'], tally: ['rows'],
  shape_cards: ['shapes'], squares_on_grid: ['sizes'], symmetry: ['shape'], fraction: ['n', 'd'], fraction_pie: [], fraction_compare: [],
  picture_card: ['icon'], picture_cards: ['icons'], color_swatch: ['color'], letter_card: ['letter'], syllable_beats: ['picture', 'beats'],
  position_scene: ['layout'], grid: ['cols', 'rows'],
};
// types whose drawn numbers are scaffolding (axes, ticks, cells, clock faces): the "numbers come from the question" check skips them
const SCAFFOLD = new Set(['number_line', 'number_track', 'hundred_chart', 'ruler', 'strips', 'clock', 'clock_span', 'minutes_pie', 'bar_chart', 'graph', 'measuring_cup', 'position_scene', 'array', 'groups']);
const ICON_FIELDS = ['icon', 'icon2', 'receiver', 'target', 'real', 'picture', 'keyIcon'];
const MAX_OBJECTS = 20;

// a drawn number is "from the question" if it is a question number, or a digit/part of one (382 → 3, 8, 2)
const fromQuestion = (num, qNums) => qNums.has(num) || [...qNums].some(q => q.includes(num) && num.length < q.length);
const CLOCKS = new Set(['clock', 'clock_span', 'minutes_pie']);
const numbersIn = s => (String(s).match(/\d+(?:[.,/]\d+)?/g) || []).map(x => x.replace(',', '.'));
const iconOk = k => !!(ICONS[k] || ICON_ALIASES[k]);

function walk(v, fn, path = 'visual_data') {
  if (Array.isArray(v)) v.forEach((x, i) => walk(x, fn, `${path}[${i}]`));
  else if (v && typeof v === 'object') { fn(v, path); Object.entries(v).forEach(([k, x]) => walk(x, fn, `${path}.${k}`)); }
}

/** Answer forms worth hunting for in the picture: "12", "1/2", "3800" … (words like "כלבים" are not checked) */
function answerTokens(answer) {
  if (answer === undefined || answer === null) return [];
  return numbersIn(answer);
}

function svgTexts(svg) {
  return [...svg.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map(m => m[1].replace(/&amp;/g, '&').trim()).filter(Boolean);
}

// colours the library itself uses (icons + visuals): in draw mode these are on-brand too
export const BRAND_COLORS = new Set(["#0B6B59", "#12937A", "#16213E", "#1E3FA8", "#2B7FD4", "#2E7D3A", "#2EA44F", "#2F5BE3", "#4A5470", "#4BB35A", "#4FA3F7", "#5A3A22", "#5B7FEE", "#5B9BF5", "#5BA36B", "#5CC46A", "#6B4226", "#7A4A2A", "#7C9BF2", "#7CF0C4", "#8B5A2B", "#8B6FD6", "#8FC8FF", "#9AA3B8", "#9AA6BD", "#A86E35", "#AEB6C4", "#B57A3C", "#B5BFD2", "#B7432A", "#B98250", "#B98A00", "#BFE0FF", "#C2361B", "#C76BA8", "#C7CDD8", "#C98A4B", "#C98A62", "#D7DCE4", "#D9A066", "#D9D0BE", "#DCEBFF", "#E08A2E", "#E0A800", "#E23D28", "#E2DACB", "#E3B47C", "#E3C27A", "#E3F5EF", "#E6DFD1", "#E7DDFB", "#E85D3F", "#E8A33C", "#E9E4DA", "#EAF0FF", "#EAF6FF", "#EBDDBF", "#F2C14E", "#F3EEE4", "#F4A259", "#F4D7A8", "#F6C9A0", "#F7931E", "#F7F3EA", "#FDECE7", "#FF8FB1", "#FF9AA8", "#FFC940", "#FFE8B0", "#FFF4D1", "#FFF4DD", "#FFF9EC", "#FFFFFF"]);

/** @param {{draw?: boolean}} [opt] draw = the model draws every picture itself (looser size/text limits, library colours allowed) */
export function sanitizeCustomSvg(svg, opt = {}) {
  const errors = [];
  const MAXW = opt.draw ? 1000 : 720, MAXH = opt.draw ? 800 : 480, MAXT = opt.draw ? 140 : 6, MINF = opt.draw ? 12 : 16;
  if (!/^\s*<svg[\s>]/.test(svg)) errors.push('custom svg must start with <svg');
  if (!/viewBox="0 0 \d+(\.\d+)? \d+(\.\d+)?"/.test(svg)) errors.push('custom svg needs viewBox="0 0 W H"');
  const vb = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/); if (vb && (+vb[1] > MAXW || +vb[2] > MAXH)) errors.push(`viewBox too big (max ${MAXW}×${MAXH})`);
  for (const bad of ['<script', '<foreignObject', '<image', 'xlink:href="http', 'href="http', '<style', 'javascript:', ' on[a-z]+=', 'filter=', 'Gradient', '<pattern'])
    if (new RegExp(bad, 'i').test(svg)) errors.push(`custom svg contains forbidden ${bad.replace(/\\|\[a-z\]\+/g, '')}`);
  if (/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(svg)) errors.push('custom svg contains emoji');
  const PALETTE = ['#16213E', '#4A5470', '#9AA3B8', '#E6DFD1', '#E2DACB', '#FFF9EC', '#FFFFFF', '#FFF', '#2F5BE3', '#EAF0FF', '#1E3FA8', '#FFC940', '#FFE89A', '#E0A800', '#E85D3F', '#FDECE7', '#12937A', '#5CC46A', '#E3F5EF', '#C98A4B', '#A86E35', '#8FC8FF', '#FF9AA8', '#8B6FD6', '#F6C9A0', '#C2361B', 'NONE', 'WHITE', 'TRANSPARENT', 'CURRENTCOLOR'];
  const cols = [...svg.matchAll(/(?:fill|stroke)="([^"]+)"/g)].map(m => m[1].toUpperCase());
  const off = [...new Set(cols.filter(c => !PALETTE.includes(c) && !(opt.draw && BRAND_COLORS.has(c)) && !/^URL\(/.test(c)))];
  if (off.length) errors.push(`colours outside the palette: ${off.join(', ')}`);
  const sizes = [...svg.matchAll(/font-size="([\d.]+)"/g)].map(m => +m[1]); if (sizes.some(s => s < MINF)) errors.push(`font-size below ${MINF}`);
  if (svgTexts(svg).length > MAXT) errors.push(`more than ${MAXT} text labels`);
  // brand: only our two fonts, bold weights, round line ends on strokes
  const fams = [...svg.matchAll(/font-family="([^"]+)"/g)].map(m => m[1].replace(/&apos;|&#39;/g, "'"));
  if (fams.some(f => !/^(Assistant|Rubik)\b/.test(f.replace(/['"]/g, '').trim()))) errors.push('fonts other than Assistant / Rubik');
  if ([...svg.matchAll(/<text\b[^>]*>/g)].some(m => !/font-family=/.test(m[0]))) errors.push('every <text> needs font-family Assistant or Rubik');
  const ws = [...svg.matchAll(/font-weight="(\d+)"/g)].map(m => +m[1]); if (ws.some(w => w < 700)) errors.push('font-weight below 700');
  if (/stroke-width="(0?\.\d+|1(\.\d+)?)"/.test(svg)) errors.push('hairline strokes (< 2) are off-brand');
  if (/opacity="0?\.(0\d|1\d|2\d)"/.test(svg) && (svg.match(/opacity=/g) || []).length > 8) errors.push('too many transparent layers');
  return errors;
}

/**
 * @param {{text:string, answer?:string, grade?:string, subject?:string}} question
 * @param {{mode:'library'|'custom'|'none', visual_data?:object, svg?:string, alt?:string}} result
 */
export function validateVisual(question, result, opt = {}) {
  const errors = [], warnings = [];
  if (!result || !['library', 'custom', 'none'].includes(result.mode)) return { ok: false, errors: ['mode must be library | custom | none'], warnings };
  if (result.mode === 'none') return { ok: true, errors, warnings, svg: null };

  let svg = '';
  if (result.mode === 'library') {
    const v = result.visual_data;
    if (!v || !v.type) return { ok: false, errors: ['visual_data.type is missing'], warnings };
    walk(v, (o, path) => {
      if (!o.type || typeof o.type !== 'string') return;
      if (!VISUAL_TYPES.includes(o.type)) { errors.push(`${path}: unknown type "${o.type}"`); return; }
      for (const f of REQUIRED[o.type] || []) if (o[f] === undefined) errors.push(`${path}: "${o.type}" needs "${f}"`);
      for (const f of ICON_FIELDS) if (typeof o[f] === 'string' && !iconOk(o[f])) errors.push(`${path}.${f}: unknown icon "${o[f]}"`);
      if (o.type === 'objects' && +o.count > MAX_OBJECTS) errors.push(`${path}: ${o.count} objects is too many (max ${MAX_OBJECTS}); use base_ten, bar_model or op_cards`);
      if (o.type === 'share' && +o.total > 40) errors.push(`${path}: share total ${o.total} > 40`);
      if (['crossed', 'faded', 'flying', 'color2'].some(k => +o[k] > +o.count && o.type === 'objects')) errors.push(`${path}: crossed/faded/flying/color2 larger than count`);
      if (o.type === 'ten_frame' && +o.filled > 20) errors.push(`${path}: ten_frame holds at most 20`);
      for (const k of ['icons']) if (Array.isArray(o[k])) o[k].forEach(ic => { if (ic !== '?' && ic !== null && !iconOk(ic)) errors.push(`${path}.icons: unknown icon "${ic}"`); });
      if (Array.isArray(o.rows)) o.rows.forEach((r, i) => { if (r && typeof r.icon === 'string' && !iconOk(r.icon)) errors.push(`${path}.rows[${i}].icon: unknown icon "${r.icon}"`); });
      if (o.a?.icon && !iconOk(o.a.icon)) errors.push(`${path}.a.icon: unknown icon "${o.a.icon}"`);
      if (o.b?.icon && !iconOk(o.b.icon)) errors.push(`${path}.b.icon: unknown icon "${o.b.icon}"`);
    });
    if (errors.length) return { ok: false, errors, warnings };
    try { svg = renderVisual(v, { subject: question.subject }); } catch (e) { return { ok: false, errors: [`renderer crashed: ${e.message}`], warnings }; }
    if (svg.includes('סוג ויזואל לא מוכר')) errors.push('renderer did not recognise a nested type');

    // quantities come from the question (only for types where drawn numbers are data, not scaffolding)
    const qNums = new Set(numbersIn(question.text));
    if (!SCAFFOLD.has(v.type)) {
      for (const t of svgTexts(svg)) for (const num of numbersIn(t)) if (!fromQuestion(num, qNums) && !['0', '1'].includes(num)) warnings.push(`the picture shows "${num}", which is not in the question`);
    }
    // object counts vs question numbers (warning: "8 children, 5 girls" → count 8 is fine; count 7 is suspicious)
    if (qNums.size) walk(v, o => { if (o.type === 'objects' && !qNums.has(String(o.count))) warnings.push(`objects count ${o.count} is not a number from the question`); });
  } else {
    if (!result.svg) return { ok: false, errors: ['custom mode needs svg'], warnings };
    errors.push(...sanitizeCustomSvg(result.svg, opt));
    if (!result.alt) warnings.push('custom svg has no alt text');
    svg = result.svg;
    const qNums = new Set(numbersIn(question.text));
    if (!opt.draw) for (const t of svgTexts(svg)) for (const num of numbersIn(t)) if (!fromQuestion(num, qNums)) warnings.push(`custom svg shows "${num}", which is not in the question`);
  }

  // THE rule: the answer must not appear in the picture (when it is not already in the question)
  // clock faces always show 1–12: there the full answer (e.g. "6:30") is checked, not its parts
  const types = new Set(); if (result.mode === 'library') walk(result.visual_data, o => o.type && types.add(o.type));
  const hasClock = [...types].some(t => CLOCKS.has(t));
  let texts = svgTexts(svg);
  const faceDigits = new Set(texts.filter(t => /^(1[0-2]|[1-9])$/.test(t)));
  if (hasClock || (result.mode === 'custom' && faceDigits.size === 12)) texts = texts.filter(t => !/^(1[0-2]|[1-9])$/.test(t)); // a drawn clock face
  const qN = new Set(numbersIn(question.text));
  const ansFull = String(question.answer ?? '').match(/\d+:\d{2}/g) || [];
  for (const tok of [...answerTokens(question.answer), ...ansFull]) {
    if (fromQuestion(tok, qN)) continue; // the answer is (part of) a number the question already shows, e.g. "which digit is in the tens place of 382?"
    if (texts.some(t => t === tok || numbersIn(t).includes(tok))) errors.push(`the answer "${tok}" is visible in the picture`);
  }
  // answers that leak without any text: clock hands, a shaded fraction, a marked point on a line
  if (result.mode === 'library') {
    const ans = String(question.answer ?? '');
    const time = ans.match(/(\d{1,2}):(\d{2})/);
    const fr = ans.match(/^\s*(\d+)\/(\d+)\s*$/);
    walk(result.visual_data, o => {
      if (time) {
        const same = t => t && +t.h % 12 === +time[1] % 12 && +(t.m || 0) === +time[2];
        if (o.type === 'clock' && !o.hideHands && same(o)) warnings.push(`the clock shows ${time[0]}: fine for "what time is it?" (reading the clock is the task), wrong for anything else`);
        if (o.type === 'clock_span' && (same(o.to) || same(o.from))) errors.push(`clock_span shows the answer ${time[0]}; leave that end out`);
      }
      if (fr) {
        const v = +fr[1] / +fr[2];
        if (o.type === 'fraction' && o.shade !== false && +o.n / +o.d === v) warnings.push('the shaded part equals the answer: fine when it models the story, wrong for "what fraction is shaded?"');
        if (o.type === 'fraction_pie' && o.shade !== false && (o.pies || [o]).some(p => +p.n / +p.d === v)) warnings.push('the shaded pie equals the answer: fine when it models the story, wrong for "what fraction is shaded?"');
        if (o.type === 'number_line' && [].concat(o.marked || [], o.mark ?? []).some(m => Math.abs(m - v) < 0.01) && !(o.blank || []).some(b => Math.abs(b - v) < 0.01)) errors.push('a marked point on the line is the answer');
      }
    });
  }
  return { ok: errors.length === 0, errors, warnings, svg };
}
