// EduPlay question visuals · "Notebook + Oli"
// renderVisual(data, opts) → an SVG string for the white visual card on the question screen.
// `data` is exactly questions.visual_data (same field names as src/lib/mathVisual.ts / kidVisuals.ts).
// No dependencies. Works in the browser, in Node (SSR) and in React via dangerouslySetInnerHTML.
//
// Golden rule: the renderer draws ONLY what the data says. It never computes or prints a total,
// a result or a missing value. Anything the child must find is drawn as an empty "?" box.

import { P, iconInner } from './icons.js';

const INK = P.ink, SUB = '#4A5470', FAINT = '#9AA3B8', LINE = '#E6DFD1', PAPER = '#FFF9EC', BORDER = '#E2DACB';
export const SUBJECT = {
  math: { main: '#2F5BE3', soft: '#EAF0FF', dark: '#1E3FA8' },
  hebrew: { main: '#E85D3F', soft: '#FDECE7', dark: '#B7432A' },
  english: { main: '#12937A', soft: '#E3F5EF', dark: '#0B6B59' },
  reading: { main: '#FFC940', soft: '#FFF4D1', dark: '#B98A00' },
};
const NUMF = "Rubik, 'Assistant', system-ui, sans-serif", HEBF = "Assistant, Rubik, system-ui, sans-serif";

// ---------- helpers ----------
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const n = v => +(+v).toFixed(2);
const T = (x, y, s, { size = 22, w = 800, fill = INK, anchor = 'middle', font = NUMF, dir } = {}) =>
  `<text x="${n(x)}" y="${n(y)}" font-family="${font}" font-size="${size}" font-weight="${w}" fill="${fill}" text-anchor="${anchor}" dominant-baseline="central"${dir ? ` direction="${dir}"` : ''}>${esc(s)}</text>`;
// direction="rtl" flips what text-anchor start/end mean, so callers keep LTR semantics and we swap here
const heb = (x, y, s, o = {}) => { const a = o.anchor || 'middle'; return T(x, y, s, { font: HEBF, w: 700, size: 18, fill: SUB, dir: 'rtl', ...o, anchor: a === 'start' ? 'end' : a === 'end' ? 'start' : a }); };
const icon = (name, x, y, size, extra = '') => `<g transform="translate(${n(x)} ${n(y)}) scale(${n(size / 100)})"${extra}>${iconInner(name)}</g>`;
const qbox = (cx, cy, w = 46, h = 46, c = SUBJECT.math) =>
  `<rect x="${n(cx - w / 2)}" y="${n(cy - h / 2)}" width="${w}" height="${h}" rx="12" fill="${c.soft}" stroke="${c.main}" stroke-width="3" stroke-dasharray="7 5"/>` + T(cx, cy + 1, '?', { size: h * 0.55, fill: c.main });
const cross = (x, y, s) => { const d = `M${n(x + s * .18)} ${n(y + s * .18)} L${n(x + s * .82)} ${n(y + s * .82)} M${n(x + s * .82)} ${n(y + s * .18)} L${n(x + s * .18)} ${n(y + s * .82)}`; return `<path d="${d}" stroke="#fff" stroke-width="${n(s * .17)}" stroke-linecap="round"/><path d="${d}" stroke="#C2361B" stroke-width="${n(s * .09)}" stroke-linecap="round"/>`; };
const ring = (x, y, s, c) => `<circle cx="${n(x + s / 2)}" cy="${n(y + s / 2)}" r="${n(s * .56)}" fill="none" stroke="${c}" stroke-width="${n(s * .07)}" stroke-dasharray="${n(s * .12)} ${n(s * .08)}"/>`;
const plus = (cx, cy, c = INK, s = 26) => T(cx, cy, '+', { size: s, fill: c, w: 900 });
const isQ = v => v === null || v === undefined || v === '?' || v === '';
const frac = v => typeof v === 'string' ? (([a, b]) => ({ n: +a, d: +b }))(v.split('/')) : v;
const hebOrd = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח'];

/** Lay out `count` items in rows of 5 (ten-frame logic), max 20. Returns [{x,y}] in a box of cell size s. */
function grid5(count, s, gap, perRow = 5) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const r = Math.floor(i / perRow), c = i % perRow;
    // RTL reading: first item on the right
    out.push({ x: (perRow - 1 - c) * (s + gap) + (r % 2 && false ? s / 2 : 0), y: r * (s + gap), i });
  }
  return out;
}

// ---------- renderers: each returns { w, h, body, label } ----------
const R = {};

// objects: icon, count, crossed?, circled?, faded?, color2? (+ icon2), flying?
// crossed / faded / circled = how many of the LAST items get that treatment.
R.objects = (d, o) => {
  const count = Math.min(+d.count || 0, 20), per = d.branch ? Math.max(count, 1) : Math.min(5, Math.max(count, 1)), s = count > 10 ? 64 : (per > 5 ? 72 : 84), gap = per > 5 ? 12 : 18;
  const pts = grid5(count, s, gap, per);
  const rows = Math.ceil(count / per), W = per * (s + gap) - gap, H = rows * (s + gap) - gap;
  const crossed = +d.crossed || 0, faded = +d.faded || 0, circled = +d.circled || 0, c2 = +d.color2 || 0, flying = +d.flying || 0;
  let b = '';
  pts.forEach(({ x, y, i }) => {
    const fromEnd = count - i; // 1 = last item
    let name = d.icon;
    if (c2 && fromEnd <= c2) name = d.icon2 || d.icon;
    if (flying && fromEnd <= flying) name = d.flyIcon || (d.icon === 'bird' ? 'bird_fly' : d.icon);
    const isFaded = faded && fromEnd <= faded, isCross = crossed && fromEnd <= crossed, isFly = flying && fromEnd <= flying;
    const dy = isFly ? -s * 0.28 : 0;
    b += icon(name, x, y + dy, s, isFaded ? ' opacity=".28"' : '');
    if (isCross) b += cross(x, y, s);
    if (circled && i < circled) b += ring(x, y, s, SUBJECT.math.main);
    if (isFly) b += `<path d="M${x + s * .5} ${y + s * .9} q ${-s * .3} ${s * .25} ${-s * .55} ${s * .05}" stroke="${FAINT}" stroke-width="3" fill="none" stroke-dasharray="5 6" stroke-linecap="round"/>`;
  });
  if (d.branch) b = `<rect x="-20" y="${s - 6}" width="${W + 40}" height="12" rx="6" fill="${P.brownD}"/>` + b;
  if (d.target) b += icon(d.target, -s - 30, H / 2 - s / 2, s); // e.g. a house the kids walk to (on the left)
  return { w: W + (d.target ? s + 30 : 0), h: H, body: b, ox: d.target ? s + 30 : 0, label: `${count} ${d.label || ''}` };
};

// groups: groups, each, icon  → equal groups with a size label and "+" between them (repeated addition)
R.groups = (d, o) => {
  const g = +d.groups, e = +d.each, c = o.c;
  if (g === 0 || e === 0) return R.plates({ count: g || e || 1, icon: d.container || 'plate' }, o);
  const per = e <= 3 ? e : Math.min(Math.ceil(e / 2), 5), s = e > 6 ? 34 : 44, gap = 8, rows = Math.ceil(e / per);
  const bw = per * (s + gap) - gap + 28, bh = rows * (s + gap) - gap + 28, plusW = 36;
  const cols = Math.min(g, g > 5 ? 4 : 5), grows = Math.ceil(g / cols);
  let b = '';
  for (let k = 0; k < g; k++) {
    const gr = Math.floor(k / cols), gc = k % cols;
    const x0 = (cols - 1 - gc) * (bw + plusW), y0 = gr * (bh + 56);
    b += `<rect x="${x0}" y="${y0}" width="${bw}" height="${bh}" rx="20" fill="${c.soft}" stroke="${c.main}" stroke-width="3"/>`;
    for (let i = 0; i < e; i++) b += icon(d.icon, x0 + 14 + (per - 1 - (i % per)) * (s + gap), y0 + 14 + Math.floor(i / per) * (s + gap), s);
    b += `<rect x="${x0 + bw / 2 - 22}" y="${y0 + bh + 6}" width="44" height="30" rx="10" fill="${P.yellow}"/>` + T(x0 + bw / 2, y0 + bh + 21, e, { size: 20 });
    if (gc < cols - 1 && k < g - 1) b += plus(x0 - plusW / 2, y0 + bh / 2, c.main);
  }
  return { w: cols * (bw + plusW) - plusW, h: grows * (bh + 56) - 20, body: b, label: `${g} קבוצות של ${e}` };
};

// plates: zero groups / empty containers (0 × 7 → 7 empty plates)
R.plates = (d, o) => {
  const cnt = Math.min(+d.count || 0, 10), s = 84, per = Math.min(cnt, 5);
  let b = '';
  for (let i = 0; i < cnt; i++) b += icon(d.icon || 'plate', (per - 1 - (i % per)) * (s + 14), Math.floor(i / per) * (s + 10), s);
  return { w: per * (s + 14) - 14, h: Math.ceil(cnt / per) * (s + 10) - 10, body: b, label: `${cnt} צלחות ריקות` };
};

// share: total, groups, icon, receiver?, shared? (default true)
// shared (default): the items are already dealt onto each child's plate, so the child counts one plate.
// shared:false: the whole pile above and empty plates below (only for "how would you share?" questions).
R.share = (d, o) => {
  const tot = Math.min(+d.total, 40), g = +d.groups;
  if (d.shared === false) {
    const s = tot > 20 ? 30 : 38, per = 10, gap = 6;
    const rows = Math.ceil(tot / per), pileW = Math.min(tot, per) * (s + gap) - gap;
    const rs = 76, rgap = 26, rW = g * (rs + rgap) - rgap, W = Math.max(pileW, rW);
    let b = '';
    for (let i = 0; i < tot; i++) b += icon(d.icon, (W - pileW) / 2 + (Math.min(tot, per) - 1 - (i % per)) * (s + gap), Math.floor(i / per) * (s + gap), s);
    const y1 = rows * (s + gap) + 36;
    b += `<path d="M${W / 2} ${y1 - 30} v18" stroke="${FAINT}" stroke-width="4" stroke-linecap="round"/><path d="M${W / 2 - 8} ${y1 - 18} L${W / 2} ${y1 - 8} L${W / 2 + 8} ${y1 - 18}" stroke="${FAINT}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
    for (let k = 0; k < g; k++) { const x = (W - rW) / 2 + (g - 1 - k) * (rs + rgap); b += icon(d.receiver || 'child', x, y1, rs) + icon('plate', x - 4, y1 + rs - 14, rs + 8); }
    return { w: W, h: y1 + rs + 34, body: b, label: `${tot} לחלק ל-${g}` };
  }
  // dealt out: each child with a plate and the same number of items on a soft tray (rows of up to 3)
  const each = Math.floor(tot / g), left = tot - each * g;
  const per = each <= 4 ? Math.min(each, 2) : 3, s = each > 9 ? 28 : 34, gap = 6;
  const rows = Math.max(1, Math.ceil(each / per)), trayW = per * (s + gap) - gap + 24, trayH = rows * (s + gap) - gap + 22;
  const colW = Math.max(trayW, 90), cgap = 24, kid = 74, W = g * (colW + cgap) - cgap;
  let b = '';
  for (let k = 0; k < g; k++) {
    const x0 = (g - 1 - k) * (colW + cgap); // RTL: first child on the right
    b += icon(d.receiver || 'child', x0 + colW / 2 - kid / 2, 0, kid);
    const tx = x0 + colW / 2 - trayW / 2, ty = kid + 8;
    b += `<rect x="${tx}" y="${ty}" width="${trayW}" height="${trayH}" rx="18" fill="${o.c.soft}" stroke="${o.c.main}" stroke-width="3"/>`;
    for (let i = 0; i < each; i++) b += icon(d.icon, tx + 12 + (per - 1 - (i % per)) * (s + gap), ty + 11 + Math.floor(i / per) * (s + gap), s);
  }
  let H = kid + 8 + trayH;
  if (left) { // leftovers (division with a remainder) wait on the side, below
    b += heb(W / 2, H + 26, 'נשארו', { size: 16 });
    for (let i = 0; i < left; i++) b += icon(d.icon, W / 2 - (left * (s + gap)) / 2 + i * (s + gap), H + 40, s);
    H += 40 + s;
  }
  return { w: W, h: H, body: b, label: `${tot} מחולקים ל-${g}` };
};

// array: rows, cols [, icon, hideRows] → rows of squares, each row labeled "+cols" (repeated addition)
R.array = (d, o) => {
  const r = +d.rows, cl = +d.cols, c = o.c, s = cl > 8 ? 26 : 32, gap = 6, lab = 54;
  let b = '';
  const show = d.hideRows ? 1 : r;
  for (let i = 0; i < show; i++) {
    for (let j = 0; j < cl; j++) {
      const x = lab + j * (s + gap), y = i * (s + gap);
      b += d.icon ? icon(d.icon, x, y, s) : `<rect x="${x}" y="${y}" width="${s}" height="${s}" rx="7" fill="${c.main}"/><rect x="${x + 4}" y="${y + 4}" width="${s * .35}" height="${s * .2}" rx="3" fill="#fff" opacity=".3"/>`;
    }
    b += `<rect x="0" y="${i * (s + gap) + s / 2 - 13}" width="44" height="26" rx="9" fill="${P.yellow}"/>` + T(22, i * (s + gap) + s / 2, (i ? '+' : '') + cl, { size: 15 });
  }
  if (d.hideRows) b += heb(lab + cl * (s + gap) / 2, s + 30, 'כמה שורות כאלה?', { size: 18 });
  return { w: lab + cl * (s + gap) - gap, h: d.hideRows ? s + 50 : r * (s + gap) - gap, body: b, label: `${r} שורות של ${cl}` };
};

// base_ten: hundreds, tens, ones [, arriving: {tens}] → flats, rods, units like the place-value board
R.base_ten = (d, o) => {
  const H = +d.hundreds || 0, Tn = +d.tens || 0, O = +d.ones || 0, c = o.c, u = H ? 11 : 17, g = 2;
  const flat = 10 * u + 9 * g, rodGap = 8, colGap = 40;
  const parts = [];
  const drawFlat = (x, y) => { let s = `<rect x="${x - 3}" y="${y - 3}" width="${flat + 6}" height="${flat + 6}" rx="6" fill="${c.dark}"/>`; for (let i = 0; i < 10; i++) for (let j = 0; j < 10; j++) s += `<rect x="${x + j * (u + g)}" y="${y + i * (u + g)}" width="${u}" height="${u}" rx="2" fill="${c.main}"/>`; return s; };
  const drawRod = (x, y, fill = '#5B9BF5') => { let s = `<rect x="${x - 2}" y="${y - 2}" width="${u + 4}" height="${flat + 4}" rx="4" fill="${P.blueD}"/>`; for (let i = 0; i < 10; i++) s += `<rect x="${x}" y="${y + i * (u + g)}" width="${u}" height="${u}" rx="2" fill="${fill}"/>`; return s; };
  const drawUnit = (x, y) => `<rect x="${x}" y="${y}" width="${u + 4}" height="${u + 4}" rx="3" fill="${P.yellow}" stroke="${P.yellowD}" stroke-width="2"/>`;
  if (H) parts.push({ w: H * (flat + 12) - 12, draw: x => Array.from({ length: H }, (_, i) => drawFlat(x + i * (flat + 12), 0)).join(''), lab: 'מאות' });
  if (Tn || d.arriving) parts.push({ w: Math.max(Tn + (d.arriving?.tens || 0), 1) * (u + rodGap) - rodGap + 4, draw: x => Array.from({ length: Tn }, (_, i) => drawRod(x + i * (u + rodGap), 0)).join('') + Array.from({ length: d.arriving?.tens || 0 }, (_, i) => `<g opacity=".95">${drawRod(x + (Tn + i) * (u + rodGap), -18, P.yellow)}</g>` + `<path d="M${x + (Tn + i) * (u + rodGap) + u / 2} ${-30} v-8" stroke="${P.yellowD}" stroke-width="3"/>`).join(''), lab: 'עשרות' });
  if (O) parts.push({ w: Math.min(O, 5) * (u + 10) - 6, draw: x => Array.from({ length: O }, (_, i) => drawUnit(x + (i % 5) * (u + 10), flat - (Math.ceil(O / 5) - Math.floor(i / 5)) * (u + 10) + 6)).join(''), lab: 'יחידות' });
  const W = parts.reduce((a, p) => a + p.w, 0) + colGap * (parts.length - 1);
  let x = 0, b = '';
  // LTR, same order as the place-value board (hundreds on the left)
  parts.forEach(p => { b += p.draw(x) + heb(x + p.w / 2, flat + 26, p.lab, { size: 17 }); x += p.w + colGap; });
  return { w: W, h: flat + 40, body: b, label: 'קוביות עשרוניות' };
};

// place_value: digits table (hundreds/tens/ones) with optional blocks; highlight = 'tens'; hideDigits
R.place_value = (d, o) => {
  const cols = [['מאות', 'hundreds'], ['עשרות', 'tens'], ['יחידות', 'ones']].filter(([, k]) => d[k] !== undefined || d.cols?.includes(k));
  const cw = 110, ch = 96, c = o.c; let b = '';
  cols.forEach(([lab, k], i) => {
    const x = i * cw, hi = d.highlight === k; // LTR like the place-value board: מאות | עשרות | יחידות reads as the number
    b += `<rect x="${x}" y="0" width="${cw}" height="40" fill="${['#FFF4D1', '#EAF0FF', '#FDECE7'][i]}" stroke="${BORDER}" stroke-width="2"/>` + heb(x + cw / 2, 20, lab, { size: 18, fill: INK });
    b += `<rect x="${x}" y="40" width="${cw}" height="${ch}" fill="${hi ? c.soft : '#fff'}" stroke="${hi ? c.main : BORDER}" stroke-width="${hi ? 4 : 2}"/>`;
    b += d.hideDigits || isQ(d[k]) ? qbox(x + cw / 2, 40 + ch / 2, 50, 56, c) : T(x + cw / 2, 40 + ch / 2 + 2, d[k], { size: 54, w: 900 });
  });
  if (d.blocks) { const r = R.base_ten({ hundreds: d.hundreds, tens: d.tens, ones: d.ones }, o), sc = Math.min(1, (cols.length * cw) / r.w); b += `<g transform="translate(${(cols.length * cw - r.w * sc) / 2} ${40 + ch + 24}) scale(${n(sc)})">${r.body}</g>`; return { w: cols.length * cw, h: 40 + ch + 24 + r.h * sc, body: b, label: 'טבלת ערך המקום' }; }
  return { w: cols.length * cw, h: 40 + ch, body: b, label: 'טבלת ערך המקום' };
};

// bar_model: parts[], labels?, total → part–part–whole. null/'?' = unknown. compare: [{label, parts}] rows
R.bar_model = (d, o) => {
  const c = o.c, Wd = 520;
  if (d.rows) { // comparison bars
    const max = Math.max(...d.rows.map(r => r.parts.reduce((a, v) => a + (isQ(v) ? (r.unknownSize || 6) : +v), 0)));
    let b = '', y = 0;
    d.rows.forEach((r, ri) => {
      let x = Wd; b += heb(Wd + 16, y + 28, r.label, { anchor: 'start', size: 20, fill: INK });
      r.parts.forEach((v, i) => {
        const w = (isQ(v) ? (r.unknownSize || 6) : +v) / max * (Wd - 10); x -= w;
        b += isQ(v) ? `<rect x="${x}" y="${y}" width="${w}" height="56" rx="12" fill="${c.soft}" stroke="${c.main}" stroke-width="3" stroke-dasharray="8 6"/>` + T(x + w / 2, y + 28, '?', { size: 28, fill: c.main })
          : `<rect x="${x}" y="${y}" width="${w}" height="56" rx="12" fill="${[c.main, P.yellow][i % 2]}"/>` + T(x + w / 2, y + 29, v, { size: 26, fill: i % 2 ? INK : '#fff' });
        if (r.partLabels?.[i]) b += heb(x + w / 2, y + 74, r.partLabels[i], { size: 15 });
      });
      y += 96;
    });
    return { w: Wd + 110, h: y - 20, body: b, label: 'מודל פסים להשוואה' };
  }
  const parts = d.parts, known = parts.map(v => isQ(v) ? null : +v);
  const tot = isQ(d.total) ? null : +d.total;
  const unk = known.filter(v => v === null).length;
  const sumKnown = known.reduce((a, v) => a + (v || 0), 0);
  const basis = tot ?? (sumKnown + unk * Math.max(sumKnown / Math.max(known.length - unk, 1), 1));
  const unkW = unk ? Math.max((basis - sumKnown) / unk, basis * 0.12) : 0;
  let x = Wd, b = '';
  // whole on top
  b += `<path d="M0 30 V18 H${Wd} V30" stroke="${INK}" stroke-width="3" fill="none"/>`;
  b += tot === null ? qbox(Wd / 2, 18, 54, 34, c) : `<rect x="${Wd / 2 - 34}" y="2" width="68" height="34" rx="10" fill="${P.yellow}"/>` + T(Wd / 2, 19, tot, { size: 22 });
  parts.forEach((v, i) => {
    const w = (known[i] === null ? unkW : known[i]) / (sumKnown + unk * unkW) * Wd; x -= w;
    b += known[i] === null ? `<rect x="${x + 2}" y="52" width="${w - 4}" height="64" rx="12" fill="${c.soft}" stroke="${c.main}" stroke-width="3" stroke-dasharray="8 6"/>` + T(x + w / 2, 84, '?', { size: 30, fill: c.main })
      : `<rect x="${x + 2}" y="52" width="${w - 4}" height="64" rx="12" fill="${[c.main, P.yellow, P.green][i % 3]}"/>` + T(x + w / 2, 85, v, { size: 28, fill: i % 3 === 1 ? INK : '#fff' });
    if (d.labels?.[i]) b += heb(x + w / 2, 136, d.labels[i], { size: 16 });
    if (d.plusBetween && i < parts.length - 1) b += plus(x, 84, INK, 22);
  });
  return { w: Wd, h: d.labels ? 150 : 124, body: b, label: 'מודל פסים: חלק וחלק ושלם' };
};

// clock: h, m, digital?, hideHands?
R.clock = (d, o) => {
  const r = 110, cx = r + 10, cy = r + 10;
  let b = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff" stroke="${INK}" stroke-width="8"/><circle cx="${cx}" cy="${cy}" r="${r - 14}" fill="${PAPER}"/>`;
  for (let i = 0; i < 60; i++) { const a = i * 6 * Math.PI / 180, L = i % 5 ? 6 : 12; b += `<line x1="${n(cx + (r - 6) * Math.sin(a))}" y1="${n(cy - (r - 6) * Math.cos(a))}" x2="${n(cx + (r - 6 - L) * Math.sin(a))}" y2="${n(cy - (r - 6 - L) * Math.cos(a))}" stroke="${i % 5 ? FAINT : INK}" stroke-width="${i % 5 ? 2 : 4}" stroke-linecap="round"/>`; }
  for (let i = 1; i <= 12; i++) { const a = i * 30 * Math.PI / 180; b += T(cx + (r - 40) * Math.sin(a), cy - (r - 40) * Math.cos(a) + 1, i, { size: 23, w: 800 }); }
  if (!d.hideHands) {
    const m = +d.m || 0, h = (+d.h % 12) + m / 60, am = m * 6 * Math.PI / 180, ah = h * 30 * Math.PI / 180;
    b += `<line x1="${cx}" y1="${cy}" x2="${n(cx + 54 * Math.sin(ah))}" y2="${n(cy - 54 * Math.cos(ah))}" stroke="${P.red}" stroke-width="13" stroke-linecap="round"/>`;
    b += `<line x1="${cx}" y1="${cy}" x2="${n(cx + 86 * Math.sin(am))}" y2="${n(cy - 86 * Math.cos(am))}" stroke="${P.blue}" stroke-width="6" stroke-linecap="round"/>`;
  }
  b += `<circle cx="${cx}" cy="${cy}" r="9" fill="${INK}"/>`;
  let h = 2 * r + 20;
  if (d.digital && !d.hideHands) { b += `<rect x="${cx - 62}" y="${h + 8}" width="124" height="52" rx="12" fill="${INK}"/>` + T(cx, h + 35, `${d.h}:${String(d.m || 0).padStart(2, '0')}`, { size: 30, fill: '#7CF0C4', font: "'Courier New', monospace" }); h += 66; }
  return { w: 2 * r + 20, h, body: b, label: d.hideHands ? 'שעון בלי מחוגים' : 'שעון מחוגים' };
};

// clock_span: from {h,m}, to? {h,m} → start clock → arrow → end clock (or "?" clock when hidden)
R.clock_span = (d, o) => {
  const a = R.clock({ ...(d.from || {}), hideHands: !d.from }, o), bb = R.clock({ ...(d.to || {}), hideHands: !d.to }, o);
  const gap = 110, sc = .8;
  const lab = (x, s) => heb(x, a.h * sc + 22, s, { size: 18 });
  // RTL: start on the right
  let b = `<g transform="translate(${a.w * sc + gap} 0) scale(${sc})">${a.body}${!d.from ? qbox(a.w / 2, a.h / 2, 70, 70) : ''}</g>${lab(a.w * sc * 1.5 + gap, 'התחלה')}`;
  b += `<g transform="scale(${sc})">${bb.body}${!d.to ? qbox(bb.w / 2, bb.h / 2, 70, 70) : ''}</g>${lab(a.w * sc / 2, 'סוף')}`;
  b += `<path d="M${a.w * sc + gap - 16} ${a.h * sc / 2} H${a.w * sc + 16}" stroke="${o.c.main}" stroke-width="6" stroke-linecap="round"/><path d="M${a.w * sc + 30} ${a.h * sc / 2 - 14} L${a.w * sc + 14} ${a.h * sc / 2} L${a.w * sc + 30} ${a.h * sc / 2 + 14}" stroke="${o.c.main}" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  if (d.duration) b += `<rect x="${a.w * sc + gap / 2 - 56}" y="${a.h * sc / 2 - 64}" width="112" height="34" rx="10" fill="${P.yellow}"/>` + heb(a.w * sc + gap / 2, a.h * sc / 2 - 47, d.duration, { size: 16, fill: INK });
  return { w: 2 * a.w * sc + gap, h: a.h * sc + 40, body: b, label: 'שעת התחלה ושעת סוף' };
};

// minutes_pie: hours (full circles) + extra minutes slice (2 h 20 min)
R.minutes_pie = (d, o) => {
  const r = 58, gap = 34, k = +d.hours || 0, items = k + (d.minutes ? 1 : 0); let b = '';
  for (let i = 0; i < items; i++) {
    const cx = (items - 1 - i) * (2 * r + gap) + r, cy = r;
    const full = i < k, ang = full ? 360 : (+d.minutes) * 6;
    b += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff" stroke="${INK}" stroke-width="5"/>`;
    if (full) b += `<circle cx="${cx}" cy="${cy}" r="${r - 6}" fill="${o.c.main}"/>`;
    else { const a = ang * Math.PI / 180; b += `<path d="M${cx} ${cy} L${cx} ${cy - r + 6} A${r - 6} ${r - 6} 0 ${ang > 180 ? 1 : 0} 1 ${n(cx + (r - 6) * Math.sin(a))} ${n(cy - (r - 6) * Math.cos(a))} Z" fill="${P.yellow}"/>`; }
    b += heb(cx, 2 * r + 22, full ? 'שעה' : `${d.minutes} דקות`, { size: 17 });
  }
  return { w: items * (2 * r + gap) - gap, h: 2 * r + 40, body: b, label: 'שעות ודקות' };
};

// number_line: min, max, step?, marked[] / mark, segment? [a,b], jumps? {from, size, count}, denominator? (fractions), blank[], circled[], labels? ('all'|'ends'|'none')
R.number_line = (d, o) => {
  const c = o.c, W = (d.max - d.min) / (d.step || 1) > 12 && !d.denominator ? 660 : 560, x0 = 20, y = 70;
  if (d.lines) { // stacked lines (compare fractions)
    let b = '', h = 0;
    d.lines.forEach(L => { const r = R.number_line({ ...L, compact: true }, o); b += `<g transform="translate(0 ${h})">${r.body}</g>`; h += r.h + 10; });
    return { w: W + 40, h, body: b, label: 'שני ישרי מספרים' };
  }
  const den = +d.denominator || 0, min = +d.min || 0, max = +d.max ?? 10;
  const step = den ? 1 / den : +(d.step || 1), ticks = Math.round((max - min) / step);
  const X = v => x0 + (v - min) / (max - min) * W;
  let b = `<line x1="${x0 - 12}" y1="${y}" x2="${x0 + W + 12}" y2="${y}" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`;
  b += `<path d="M${x0 + W + 4} ${y - 9} L${x0 + W + 18} ${y} L${x0 + W + 4} ${y + 9}" fill="${INK}"/>`;
  if (d.segment) b += `<line x1="${X(d.segment[0])}" y1="${y}" x2="${X(d.segment[1])}" y2="${y}" stroke="${c.main}" stroke-width="12" stroke-linecap="round"/>`;
  const marked = [].concat(d.marked || [], d.mark !== undefined ? [d.mark] : []);
  const blank = d.blank || [], circled = d.circled || [], labels = d.labels || (ticks > 20 ? 'ends' : 'all');
  for (let i = 0; i <= ticks; i++) {
    const v = n(min + i * step), x = X(v), big = den ? (i % den === 0) : (i % 5 === 0 || ticks <= 12);
    b += `<line x1="${x}" y1="${y - (big ? 14 : 9)}" x2="${x}" y2="${y + (big ? 14 : 9)}" stroke="${INK}" stroke-width="${big ? 4 : 3}" stroke-linecap="round"/>`;
    const lab = den ? (i % den === 0 ? String(v) : (d.fractionLabels ? `${i % den}/${den}` : '')) : (labels === 'all' || (labels === 'ends' && (i === 0 || i === ticks)) ? String(v) : '');
    if (blank.includes(v)) b += qbox(x, y + 42, 38, 36, c);
    else if (lab && labels !== 'none') b += T(x, y + 38, lab, { size: den && i % den ? 16 : (ticks > 12 ? 15 : 20), w: 800 });
    if (circled.includes(v)) b += `<circle cx="${x}" cy="${y + 38}" r="19" fill="none" stroke="${c.main}" stroke-width="4"/>`;
  }
  marked.forEach(v => { b += `<circle cx="${X(v)}" cy="${y}" r="11" fill="${P.red}" stroke="#fff" stroke-width="3"/>`; });
  if (d.jumps) { const { from, size, count } = d.jumps; for (let k = 0; k < count; k++) { const a = X(from + k * size), z = X(from + (k + 1) * size); b += `<path d="M${a} ${y - 16} Q${(a + z) / 2} ${y - 62} ${z} ${y - 16}" stroke="${c.main}" stroke-width="4" fill="none"/><path d="M${z - 9} ${y - 25} L${z} ${y - 15} L${z + 3} ${y - 28}" stroke="${c.main}" stroke-width="4" fill="none" stroke-linecap="round"/>`; } }
  if (d.label) b += heb(x0 - 20, y, d.label, { anchor: 'end', size: 16 });
  return { w: W + 50, h: d.compact ? 110 : 116, body: b, label: 'ישר מספרים' };
};

// number_track: from, to, highlight[], blank[], circled[] → one row of cells (1–30 wraps into rows of 10)
// hundred_chart: from, to, highlight[], blank[], arrow? {from, dir:'down'|'up'|'right'|'left'}
R.hundred_chart = (d, o) => {
  const from = d.from !== undefined ? +d.from : 1, to = d.to !== undefined ? +d.to : 100, cnt0 = to - from + 1, per = d.type === 'number_track' && cnt0 <= 10 ? cnt0 : (d.type === 'number_track' && cnt0 < 20 ? Math.ceil(cnt0 / 2) : 10);
  const cnt = to - from + 1, rows = Math.ceil(cnt / per), s = rows > 4 ? 44 : (per <= 6 ? 64 : 54), c = o.c;
  const hi = new Set(d.highlight || []), bl = new Set(d.blank || []), ci = new Set(d.circled || []);
  let b = '';
  const pos = v => { const k = v - from; return { x: (k % per) * s, y: Math.floor(k / per) * s }; };
  for (let v = from; v <= to; v++) {
    const { x, y } = pos(v);
    b += `<rect x="${x + 2}" y="${y + 2}" width="${s - 4}" height="${s - 4}" rx="9" fill="${hi.has(v) ? P.yellow : '#fff'}" stroke="${hi.has(v) ? P.yellowD : BORDER}" stroke-width="2"/>`;
    b += bl.has(v) ? qbox(x + s / 2, y + s / 2, s - 12, s - 12, c) : T(x + s / 2, y + s / 2 + 1, v, { size: s * .4, w: hi.has(v) ? 900 : 700, fill: hi.has(v) ? INK : SUB });
    if (ci.has(v)) b += `<circle cx="${x + s / 2}" cy="${y + s / 2}" r="${s * .46}" fill="none" stroke="${c.main}" stroke-width="4"/>`;
  }
  if (d.arrow) {
    const { x, y } = pos(d.arrow.from), dir = d.arrow.dir || 'down', cx = x + s / 2, cy = y + s / 2;
    const [dx, dy] = { down: [0, 1], up: [0, -1], right: [1, 0], left: [-1, 0] }[dir];
    // a short arrow across the border between the two cells, so no digit is covered
    const x1 = cx + dx * s * .38, y1 = cy + dy * s * .38, x2 = cx + dx * s * .66, y2 = cy + dy * s * .66;
    b += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c.main}" stroke-width="5" stroke-linecap="round"/>`;
    b += `<path d="M${x2 + dx * 7} ${y2 + dy * 7} L${x2 - dy * 7 - dx * 3} ${y2 - dx * 7 - dy * 3} L${x2 + dy * 7 - dx * 3} ${y2 + dx * 7 - dy * 3}Z" fill="${c.main}"/>`;
    b += `<rect x="${x + 2}" y="${y + 2}" width="${s - 4}" height="${s - 4}" rx="9" fill="none" stroke="${c.main}" stroke-width="3"/>`;
  }
  // numbers read left-to-right (LTR) even on RTL screens
  return { w: per * s, h: rows * s, body: b, label: d.type === 'number_track' ? 'רצועת מספרים' : 'לוח המאה' };
};
R.number_track = R.hundred_chart;

// ten_frame: filled, frames 1|2, color2? (last N in a second colour), crossed? (last N crossed), icon?
R.ten_frame = (d, o) => {
  const frames = +d.frames || (+d.filled > 10 ? 2 : 1), s = 62, pad = 10, fw = 5 * s + 2 * pad, fh = 2 * s + 2 * pad, gap = 30;
  const filled = +d.filled || 0, c2 = +d.color2 || 0, cr = +d.crossed || 0;
  let b = '';
  for (let f = 0; f < frames; f++) {
    const fx = (frames - 1 - f) * 0, fy = f * (fh + gap);
    b += `<rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" rx="18" fill="#fff" stroke="${INK}" stroke-width="5"/>`;
    for (let i = 1; i < 5; i++) b += `<line x1="${fx + pad + i * s}" y1="${fy + pad}" x2="${fx + pad + i * s}" y2="${fy + fh - pad}" stroke="${LINE}" stroke-width="3"/>`;
    b += `<line x1="${fx + pad}" y1="${fy + pad + s}" x2="${fx + fw - pad}" y2="${fy + pad + s}" stroke="${LINE}" stroke-width="3"/>`;
    for (let k = 0; k < 10; k++) {
      const idx = f * 10 + k, r = Math.floor(k / 5), col = k % 5;
      const x = fx + pad + (4 - col) * s, y = fy + pad + r * s; // RTL: fill from the right
      if (idx < filled) {
        const fromEnd = filled - idx, second = c2 && fromEnd <= c2;
        if (d.icon) b += icon(second && d.icon2 ? d.icon2 : d.icon, x + 6, y + 6, s - 12);
        else b += `<circle cx="${x + s / 2}" cy="${y + s / 2}" r="${s * .36}" fill="${second ? P.yellow : o.c.main}"/>` + (second ? `<circle cx="${x + s / 2}" cy="${y + s / 2}" r="${s * .16}" fill="${P.yellowD}"/>` : '');
        if (cr && fromEnd <= cr) b += cross(x + 4, y + 4, s - 8);
      } else b += `<circle cx="${x + s / 2}" cy="${y + s / 2}" r="${s * .3}" fill="none" stroke="${LINE}" stroke-width="3" stroke-dasharray="5 5"/>`;
    }
  }
  return { w: fw, h: frames * (fh + gap) - gap, body: b, label: `מסגרת עשר, ${filled} מלאים` };
};

// compare_groups: a {icon,count}, b {icon,count}, labels ['א','ב'] → two rows lined up one-to-one
R.compare_groups = (d, o) => {
  const rows = [d.a, d.b], labels = d.labels || ['א', 'ב'], s = 58, gap = 12, lab = 60;
  const max = Math.max(...rows.map(r => +r.count)), extra = Math.max(...labels.map(l => Math.max(44, String(l).length * 13 + 22))) - 44, W = lab + max * (s + gap);
  let b = '';
  rows.forEach((r, ri) => {
    const y = ri * (s + 34);
    const lw = Math.max(44, String(labels[ri]).length * 13 + 22); b += `<rect x="${W - lab + 14}" y="${y + s / 2 - 22}" width="${lw}" height="44" rx="14" fill="${o.c.soft}" stroke="${o.c.main}" stroke-width="3"/>` + heb(W - lab + 14 + lw / 2, y + s / 2, labels[ri], { size: lw > 44 ? 19 : 24, fill: o.c.dark, w: 800 });
    for (let i = 0; i < +r.count; i++) b += icon(r.icon, W - lab - (i + 1) * (s + gap), y, s);
  });
  for (let i = 0; i < max; i++) { const x = W - lab - (i + 1) * (s + gap) + s / 2; b += `<line x1="${x}" y1="${s + 4}" x2="${x}" y2="${s + 30}" stroke="${LINE}" stroke-width="3" stroke-dasharray="4 4"/>`; }
  return { w: W + extra, h: 2 * s + 34, body: b, label: 'השוואה בין שתי קבוצות' };
};

// money: items [{value, kind:'coin'|'note', count}], price?
const NOTE_C = { 20: '#5BA36B', 50: '#5B9BF5', 100: '#E8A33C', 200: '#C76BA8' };
const coinSvg = (v, x, y) => { const r = v === 10 ? 38 : v === 5 ? 36 : v === 2 ? 33 : 30; const gold = v === 10 || v === 1;
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="${gold && v === 10 ? '#F2C14E' : v === 1 ? '#E3C27A' : '#D7DCE4'}" stroke="${v === 10 ? P.yellowD : '#AEB6C4'}" stroke-width="5"/>${v === 10 ? `<circle cx="${x}" cy="${y}" r="${r - 10}" fill="#D7DCE4"/>` : ''}` + T(x, y - 3, v, { size: r * .72, w: 900 }) + T(x, y + r * .6, '₪', { size: Math.max(12, r * .34), w: 800, fill: SUB }); };
const noteSvg = (v, x, y) => `<rect x="${x}" y="${y}" width="150" height="76" rx="10" fill="${NOTE_C[v] || '#5B9BF5'}"/><rect x="${x + 8}" y="${y + 8}" width="134" height="60" rx="7" fill="none" stroke="#fff" stroke-width="2" opacity=".6"/><circle cx="${x + 46}" cy="${y + 38}" r="18" fill="#fff" opacity=".25"/>` + T(x + 104, y + 38, v, { size: 34, w: 900, fill: '#fff' }) + T(x + 46, y + 39, '₪', { size: 20, fill: '#fff' });
R.money = (d, o) => {
  const notes = d.items.filter(i => i.kind === 'note'), coins = d.items.filter(i => i.kind !== 'note');
  const groups = [];
  notes.forEach(it => groups.push({ w: 150 + (Math.min(it.count, 5) - 1) * 14, h: 96, draw: (gx, gy) => Array.from({ length: it.count }, (_, k) => noteSvg(it.value, gx + k * 14, gy + 6 + k * 3)).join('') + (it.count > 1 ? `<rect x="${gx + 150 + (it.count - 1) * 14 - 40}" y="${gy + 76 + it.count * 3 - 6}" width="46" height="28" rx="10" fill="${INK}"/>` + T(gx + 150 + (it.count - 1) * 14 - 17, gy + 76 + it.count * 3 + 8, `×${it.count}`, { size: 16, fill: '#fff', dir: 'ltr' }) : '') }));
  coins.forEach(it => { for (let k = 0; k < it.count; k++) groups.push({ w: 84, h: 96, br: k === 0 && groups.length > 0, draw: (gx, gy) => coinSvg(it.value, gx + 42, gy + 48) }); });
  // flow into rows (max ~5 coins per row), biggest value first on the right (RTL)
  const maxW = 5 * 84 + 4 * 14, rows = [[]]; let rw = 0;
  groups.forEach(g => { if (rw && (rw + g.w > maxW || (g.br && rw + 84 * 3 > maxW))) { rows.push([]); rw = 0; } rows[rows.length - 1].push(g); rw += g.w + 14; });
  const rowW = r => r.reduce((a, g) => a + g.w + 14, -14), W0 = Math.max(...rows.map(rowW));
  let b = '', y = 0;
  rows.forEach(r => { let gx = W0 - (W0 - rowW(r)) / 2; r.forEach(g => { gx -= g.w; b += g.draw(gx, y); gx -= 14; }); y += 106; });
  let W = W0, H = y - 10;
  if (d.price !== undefined) { // price tag on the left, apart from the money
    b = `<g transform="translate(170 0)">${b}</g>` + `<g transform="translate(0 ${H / 2 - 66})">${icon('tag', 0, 0, 140)}${T(64, 76, d.price + ' ₪', { size: 28, w: 900, dir: 'ltr' })}</g>`;
    W += 170; H = Math.max(H, 140);
  }
  return { w: W, h: H, body: b, label: 'כסף' };
};

// ruler: unit 'cm'|'m', length, object, start
R.ruler = (d, o) => {
  if (d.unit === 'm') { // metre stick with 10 cm marks
    const total = Math.max(100, +d.objectLength || 0), u = 600 / total, W = 100 * u; let b = `<rect x="0" y="70" width="${W}" height="50" rx="8" fill="${P.yellow}" stroke="${P.yellowD}" stroke-width="3"/>`;
    for (let i = 0; i <= 100; i += 10) b += `<line x1="${i * u}" y1="70" x2="${i * u}" y2="${i % 50 ? 88 : 98}" stroke="${INK}" stroke-width="3"/>` + T(Math.min(Math.max(i * u, 16), W - 22), 108, i, { size: 19 });
    b += heb(W / 2, 140, 'מטר אחד = 100 ס״מ', { size: 21, fill: INK });
    if (d.object) { const L = Math.min(+d.objectLength || 120, 200) * u; b += `<rect x="0" y="22" width="${L}" height="30" rx="7" fill="${P.red}"/>`; }
    return { w: 600, h: 156, body: b, label: 'מטר' };
  }
  const len = +d.length, max = Math.max(len + (d.start || 0) + 2, 10), u = Math.min(40, 560 / max), W = max * u;
  let b = `<rect x="0" y="66" width="${W}" height="56" rx="8" fill="${P.yellow}" stroke="${P.yellowD}" stroke-width="3"/>`;
  for (let i = 0; i <= max; i++) { b += `<line x1="${i * u}" y1="66" x2="${i * u}" y2="${86}" stroke="${INK}" stroke-width="3"/>` + T(i * u, 102, i, { size: 14 }); if (i < max) b += `<line x1="${i * u + u / 2}" y1="66" x2="${i * u + u / 2}" y2="76" stroke="${INK}" stroke-width="2"/>`; }
  b += T(W - 16, 112, 'ס״מ', { size: 12, font: HEBF, w: 700, fill: SUB });
  const s0 = (d.start || 0) * u, L = len * u;
  if (d.object === 'pencil') b += `<rect x="${s0 + 12}" y="28" width="${L - 22}" height="28" rx="4" fill="${P.yellow}" stroke="${P.yellowD}" stroke-width="2"/><rect x="${s0 + L - 26}" y="28" width="16" height="28" rx="4" fill="${P.pink}"/><path d="M${s0 + 12} 28 L${s0} 42 L${s0 + 12} 56Z" fill="#F4D7A8"/><path d="M${s0 + 4} 38 L${s0} 42 L${s0 + 4} 46Z" fill="${INK}"/>`;
  else b += `<rect x="${s0}" y="28" width="${L}" height="26" rx="6" fill="${P.red}"/>`;
  b += `<line x1="${s0}" y1="24" x2="${s0}" y2="66" stroke="${FAINT}" stroke-width="2" stroke-dasharray="4 4"/><line x1="${s0 + L}" y1="24" x2="${s0 + L}" y2="66" stroke="${FAINT}" stroke-width="2" stroke-dasharray="4 4"/>`;
  return { w: W, h: 124, body: b, label: 'סרגל' };
};

// strips: compare lengths above a metre ruler. items [{label, length, unit}]
R.strips = (d, o) => { // LTR like a ruler: 0 on the left
  const max = Math.max(...d.items.map(i => i.cm)), W = 520, u = W / max; let b = '', y = 0;
  d.items.forEach((it, k) => { const w = it.cm * u; b += `<rect x="0" y="${y}" width="${w}" height="34" rx="8" fill="${[o.c.main, P.red][k % 2]}"/>` + heb(W + 14, y + 17, it.label, { anchor: 'start', size: 18, fill: INK }); y += 52; });
  b += `<line x1="0" y1="${y + 4}" x2="${W}" y2="${y + 4}" stroke="${INK}" stroke-width="3"/>`;
  for (let m = 0; m * 100 <= max; m++) b += `<line x1="${m * 100 * u}" y1="${y - 6}" x2="${m * 100 * u}" y2="${y + 14}" stroke="${INK}" stroke-width="3"/>` + heb(m * 100 * u, y + 30, `${m} מ׳`, { size: 15 });
  return { w: W + 90, h: y + 42, body: b, label: 'השוואת אורכים' };
};

// fraction: n, d (bar)  · fraction_pie: n, d  · fraction_compare: a, b (n/d each), shade?
const fBar = (f, W, h, c, shade = true) => { const w = W / f.d; let b = ''; for (let i = 0; i < f.d; i++) b += `<rect x="${W - (i + 1) * w + 2}" y="0" width="${w - 4}" height="${h}" rx="8" fill="${shade && i < f.n ? c.main : '#fff'}" stroke="${INK}" stroke-width="3"/>`; return b; };
R.fraction = (d, o) => ({ w: 480, h: 70, body: fBar({ n: +d.n, d: +d.d }, 480, 70, o.c, d.shade !== false), label: 'פס שברים' });
R.fraction_pie = (d, o) => {
  const pies = d.pies || [{ n: d.n, d: d.d, label: d.label }], r = 92, gap = 60; let b = '';
  pies.forEach((p, k) => {
    const cx = (pies.length - 1 - k) * (2 * r + gap) + r, cy = r, D = +p.d, N = d.shade === false ? 0 : +p.n;
    b += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#F4D7A8" stroke="${INK}" stroke-width="4"/>`;
    for (let i = 0; i < D; i++) { const a0 = i / D * 2 * Math.PI, a1 = (i + 1) / D * 2 * Math.PI; if (i < N) b += `<path d="M${cx} ${cy} L${n(cx + r * Math.sin(a0))} ${n(cy - r * Math.cos(a0))} A${r} ${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${n(cx + r * Math.sin(a1))} ${n(cy - r * Math.cos(a1))}Z" fill="${o.c.main}"/>`; b += `<line x1="${cx}" y1="${cy}" x2="${n(cx + r * Math.sin(a0))}" y2="${n(cy - r * Math.cos(a0))}" stroke="${INK}" stroke-width="3"/>`; }
    if (p.label) b += heb(cx, 2 * r + 24, p.label, { size: 19, fill: INK });
  });
  return { w: pies.length * (2 * r + gap) - gap, h: 2 * r + (pies.some(p => p.label) ? 42 : 6), body: b, label: 'עיגולי שברים' };
};
R.fraction_compare = (d, o) => {
  const fs = (d.bars || [d.a, d.b]).map(frac), W = 460, h = 54; let b = '';
  fs.forEach((f, k) => { b += `<g transform="translate(0 ${k * (h + 22)})">${fBar(f, W, h, o.c, d.shade === true)}</g>`; if (d.labels?.[k]) b += heb(W + 14, k * (h + 22) + h / 2, d.labels[k], { anchor: 'start', size: 18, fill: INK }); });
  return { w: W + (d.labels ? 80 : 0), h: fs.length * (h + 22) - 22, body: b, label: 'השוואת שברים' };
};

// graph / bar_chart: xlabels, values, ylabel?, step?, colors?
R.graph = (d, o) => {
  const vals = d.values, max = Math.max(...vals), step = +d.step || (max > 12 ? 2 : 1), top = Math.ceil(max / step) * step;
  const bw = 70, gap = 30, H = 250, left = 44, W = left + vals.length * (bw + gap);
  const Y = v => H - v / top * H;
  let b = '';
  for (let v = 0; v <= top; v += step) b += `<line x1="${left}" y1="${Y(v)}" x2="${W}" y2="${Y(v)}" stroke="${v ? LINE : INK}" stroke-width="${v ? 2 : 4}"/>` + T(left - 14, Y(v), v, { size: 14, w: 700, fill: SUB });
  // RTL: first category on the right
  vals.forEach((v, i) => {
    const x = W - (i + 1) * (bw + gap) + gap / 2, col = d.colors?.[i] || [o.c.main, P.yellow, P.green, P.red, P.purple][i % 5];
    b += isQ(v) ? `<rect x="${x}" y="${Y(top * .5)}" width="${bw}" height="${H - Y(top * .5)}" rx="10" fill="none" stroke="${o.c.main}" stroke-width="3" stroke-dasharray="7 5"/>` : `<rect x="${x}" y="${Y(v)}" width="${bw}" height="${H - Y(v)}" rx="10" fill="${col}" stroke="${col === '#FFFFFF' || col === 'white' ? INK : 'none'}" stroke-width="2"/>`;
    b += heb(x + bw / 2, H + 24, d.xlabels[i], { size: 17, fill: INK });
  });
  if (d.ylabel) b += heb(left - 10, -18, d.ylabel, { anchor: 'start', size: 14 });
  return { w: W, h: H + 44, body: b, label: 'תרשים עמודות' };
};
R.bar_chart = R.graph;

// pictograph: key, keyIcon?, rows [{label, icon, count}] — count = number of SYMBOLS drawn
R.pictograph = (d, o) => {
  const s = 46, gap = 8, lab = 110, max = Math.max(...d.rows.map(r => +r.count)), W = lab + max * (s + gap);
  let b = '';
  d.rows.forEach((r, i) => {
    const y = i * (s + 16);
    b += `<rect x="0" y="${y - 4}" width="${W}" height="${s + 8}" rx="12" fill="${i % 2 ? '#fff' : PAPER}"/>` + heb(W - 10, y + s / 2, r.label, { anchor: 'end', size: 18, fill: INK });
    for (let k = 0; k < +r.count; k++) b += icon(r.icon || d.icon || 'star', W - lab - (k + 1) * (s + gap), y, s);
  });
  const ky = d.rows.length * (s + 16) + 10;
  b += `<rect x="${W - 190}" y="${ky}" width="190" height="50" rx="14" fill="${P.yellow}"/>` + heb(W - 16, ky + 25, 'כל', { anchor: 'end', size: 20, fill: INK, w: 800 }) + icon(d.keyIcon || d.rows[0].icon || 'star', W - 92, ky + 6, 38) + T(W - 104, ky + 25, `${d.key} =`, { anchor: 'end', size: 24, w: 900, dir: 'ltr' });
  return { w: W, h: ky + 52, body: b, label: `תרשים תמונות, כל סמל = ${d.key}` };
};

// tally: rows [{label, count}]
R.tally = (d, o) => {
  let b = '', y = 0, maxX = 0;
  d.rows.forEach(r => {
    let x = 0;
    for (let k = 0; k < Math.floor(r.count / 5); k++) { for (let i = 0; i < 4; i++) b += `<line x1="${x + i * 16}" y1="${y}" x2="${x + i * 16}" y2="${y + 64}" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>`; b += `<line x1="${x - 10}" y1="${y + 50}" x2="${x + 58}" y2="${y + 14}" stroke="${P.red}" stroke-width="6" stroke-linecap="round"/>`; x += 100; }
    for (let i = 0; i < r.count % 5; i++) b += `<line x1="${x + i * 16}" y1="${y}" x2="${x + i * 16}" y2="${y + 64}" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>`;
    x += (r.count % 5) * 16 - (r.count % 5 ? 0 : 40);
    if (r.label) { b += heb(x + 30, y + 32, r.label, { anchor: 'start', size: 18, fill: INK }); x += 130; }
    maxX = Math.max(maxX, x); y += 90;
  });
  return { w: maxX + 24, h: y - 26, body: `<g transform="translate(12 0)">${b}</g>`, label: 'סימני ספירה' };
};

// pattern_strip: items [...shape names | numbers | '?']
const SHAPE_MINI = { triangle: (x, y, s, c) => `<path d="M${x + s / 2} ${y + 4} L${x + s - 4} ${y + s - 6} L${x + 4} ${y + s - 6}Z" fill="${c}"/>`, circle: (x, y, s, c) => `<circle cx="${x + s / 2}" cy="${y + s / 2}" r="${s * .42}" fill="${c}"/>`, square: (x, y, s, c) => `<rect x="${x + 6}" y="${y + 6}" width="${s - 12}" height="${s - 12}" rx="6" fill="${c}"/>`, star: (x, y, s) => icon('star', x, y, s), heart: (x, y, s) => icon('heart', x, y, s) };
const SHAPE_COL = { triangle: P.green, circle: P.red, square: P.blue };
R.pattern_strip = (d, o) => {
  const it = d.items, s = it.length > 8 ? 62 : 74, gap = 12; let b = '';
  it.forEach((v, i) => { const x = (it.length - 1 - i) * (s + gap); // RTL
    b += `<rect x="${x}" y="0" width="${s}" height="${s}" rx="16" fill="#fff" stroke="${BORDER}" stroke-width="3"/>`;
    if (isQ(v)) b += qbox(x + s / 2, s / 2, s - 14, s - 14, o.c);
    else if (typeof v === 'number' || /^\d+$/.test(v)) b += T(x + s / 2, s / 2 + 1, v, { size: s * .36, w: 900 });
    else b += (SHAPE_MINI[v] || ((x, y, s) => icon(v, x, y, s)))(x + 8, 8, s - 16, SHAPE_COL[v] || P.blue);
  });
  return { w: it.length * (s + gap) - gap, h: s, body: b, label: 'סדרה' };
};

// pairs: count | counts [a, b] → dots in two columns; odd leaves one alone
R.pairs = (d, o) => {
  const sets = d.counts || [d.count], r = 18, g = 14; let b = '', x = 0;
  const widths = sets.map(() => 2 * (2 * r) + g + 20);
  let X = widths.reduce((a, w) => a + w + 50, -50);
  const W = X;
  sets.forEach((cnt, si) => {
    X -= widths[si];
    for (let i = 0; i < cnt; i++) { const row = Math.floor(i / 2), col = i % 2, alone = i === cnt - 1 && cnt % 2;
      if (col === 0 && !alone) b += `<rect x="${X + 4}" y="${row * (2 * r + 12) + 2}" width="${2 * (2 * r) + g + 12}" height="${2 * r + 4}" rx="${r + 2}" fill="${o.c.soft}"/>`;
      b += `<circle cx="${X + 10 + r + col * (2 * r + g)}" cy="${row * (2 * r + 12) + r + 4}" r="${r}" fill="${alone ? P.yellow : o.c.main}"/>`; }
    if (si < sets.length - 1) b += plus(X - 25, 60, INK, 30);
    X -= 50;
  });
  const rows = Math.ceil(Math.max(...sets) / 2);
  return { w: W, h: rows * (2 * r + 12), body: b, label: 'נקודות בזוגות' };
};

// position_scene: layout 'row' (items left→right with ימין/שמאל), 'grid' (rows, cols, items [{icon,row,col}]), 'line' (children, names, mark)
R.position_scene = (d, o) => {
  let b = '';
  if (d.layout === 'grid') {
    const rows = d.rows || 4, cols = d.cols || 4, s = 64;
    for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) b += `<rect x="${44 + j * s}" y="${30 + i * s}" width="${s}" height="${s}" fill="#fff" stroke="${BORDER}" stroke-width="2"/>`;
    for (let j = 0; j < cols; j++) b += T(44 + j * s + s / 2, 14, j + 1, { size: 15, fill: SUB });
    for (let i = 0; i < rows; i++) b += T(20, 30 + i * s + s / 2, i + 1, { size: 15, fill: SUB });
    (d.items || []).forEach(it => b += icon(it.icon, 44 + (it.col - 1) * s + 8, 30 + (it.row - 1) * s + 8, s - 16));
    b += heb(44 + cols * s / 2, 30 + rows * s + 22, 'שורות למטה, עמודות לרוחב', { size: 14 });
    return { w: 44 + cols * s, h: 30 + rows * s + 34, body: b, label: 'טבלת מקומות' };
  }
  if (d.layout === 'line') {
    const s = 96, items = d.items || []; // items [{icon:'girl', name:'איה'|'?'}] from right (first) to left
    items.forEach((it, i) => { const x = (items.length - 1 - i) * (s + 26); b += icon(it.icon || 'child', x, 0, s);
      b += isQ(it.name) ? qbox(x + s / 2, s + 26, 60, 34, o.c) : `<rect x="${x + 6}" y="${s + 10}" width="${s - 12}" height="32" rx="10" fill="${P.yellow}"/>` + heb(x + s / 2, s + 26, it.name, { size: 17, fill: INK }); });
    if (d.arrow !== false) b += `<path d="M${items.length * (s + 26) - 26} ${s + 66} H20" stroke="${FAINT}" stroke-width="4" stroke-dasharray="6 6"/><path d="M30 ${s + 58} L18 ${s + 66} L30 ${s + 74}" stroke="${FAINT}" stroke-width="4" fill="none"/>` + heb(items.length * (s + 26) - 26, s + 86, 'ראשון', { anchor: 'end', size: 14 });
    return { w: items.length * (s + 26) - 26, h: s + 96, body: b, label: 'ילדים בשורה' };
  }
  // row on a shelf, displayed left→right as given in items (items[0] = leftmost)
  const s = 100, items = d.items || [], W = items.length * (s + 30) - 30;
  b += `<rect x="-14" y="${s + 4}" width="${W + 28}" height="16" rx="6" fill="${P.brownD}"/>`;
  items.forEach((it, i) => { const x = i * (s + 30); b += isQ(it) ? qbox(x + s / 2, s / 2, s - 20, s - 20, o.c) : icon(it, x, 0, s); });
  b += `<path d="M${W} ${s + 46} H${W - 70}" stroke="${o.c.main}" stroke-width="5" stroke-linecap="round"/><path d="M${W - 12} ${s + 38} L${W} ${s + 46} L${W - 12} ${s + 54}" stroke="${o.c.main}" stroke-width="5" fill="none" stroke-linecap="round"/>` + heb(W - 80, s + 46, 'ימין', { anchor: 'end', size: 17, fill: o.c.dark });
  b += `<path d="M0 ${s + 46} H70" stroke="${o.c.main}" stroke-width="5" stroke-linecap="round"/><path d="M12 ${s + 38} L0 ${s + 46} L12 ${s + 54}" stroke="${o.c.main}" stroke-width="5" fill="none" stroke-linecap="round"/>` + heb(80, s + 46, 'שמאל', { anchor: 'start', size: 17, fill: o.c.dark });
  return { w: W, h: s + 62, body: b, label: 'חפצים על מדף' };
};

// symmetry: shape, half? (draw half + mirror line), line? 'vertical'|'horizontal'|null (never for "how many lines")
R.symmetry = (d, o) => {
  const shp = R[d.shape] ? R[d.shape]({ ...d, plain: true }, o) : R.shape({ shape: d.shape }, o);
  let b = shp.body;
  if (d.line === 'vertical') b += `<line x1="${shp.w / 2}" y1="-14" x2="${shp.w / 2}" y2="${shp.h + 14}" stroke="${P.red}" stroke-width="4" stroke-dasharray="10 8"/>`;
  if (d.line === 'horizontal') b += `<line x1="-14" y1="${shp.h / 2}" x2="${shp.w + 14}" y2="${shp.h / 2}" stroke="${P.red}" stroke-width="4" stroke-dasharray="10 8"/>`;
  if (d.half) b = `<clipPath id="half"><rect x="${shp.w / 2}" y="-20" width="${shp.w}" height="${shp.h + 40}"/></clipPath><g clip-path="url(#half)">${shp.body}</g><rect x="0" y="0" width="${shp.w / 2}" height="${shp.h}" fill="none" stroke="${LINE}" stroke-width="2" stroke-dasharray="4 6"/><line x1="${shp.w / 2}" y1="-14" x2="${shp.w / 2}" y2="${shp.h + 14}" stroke="${P.red}" stroke-width="4" stroke-dasharray="10 8"/>`;
  return { w: shp.w, h: shp.h, body: b, label: 'סימטריה' };
};

// shape / 2D: shape name, numberSides? numberCorners? highlight 'sides'|'corners' (static: all marked)
const POLY = {
  triangle: [[110, 10], [210, 190], [10, 190]], equilateral: [[110, 14], [214, 194], [6, 194]],
  square: [[20, 20], [200, 20], [200, 200], [20, 200]], rectangle: [[10, 40], [290, 40], [290, 190], [10, 190]],
  parallelogram: [[70, 40], [290, 40], [230, 190], [10, 190]], trapezoid: [[80, 30], [220, 30], [290, 190], [10, 190]],
  pentagon: [0, 1, 2, 3, 4].map(i => [110 + 100 * Math.sin(i * 1.2566), 112 - 100 * Math.cos(i * 1.2566)]),
  hexagon: [0, 1, 2, 3, 4, 5].map(i => [110 + 100 * Math.sin(i * 1.0472 + .5236), 110 - 100 * Math.cos(i * 1.0472 + .5236)]),
};
R.shape = (d, o) => {
  const k = d.shape || d.type, c = o.c;
  if (k === 'circle') return { w: 220, h: 220, body: `<circle cx="110" cy="110" r="100" fill="${c.soft}" stroke="${c.main}" stroke-width="7"/>`, label: 'עיגול' };
  const pts = POLY[k] || POLY.square, xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const w = Math.max(...xs) + 10, h = Math.max(...ys) + 10;
  let b = `<polygon points="${pts.map(p => p.map(n).join(',')).join(' ')}" fill="${c.soft}" stroke="${c.main}" stroke-width="7" stroke-linejoin="round"/>`;
  if (d.highlight === 'corners') pts.forEach((p, i) => b += `<circle cx="${n(p[0])}" cy="${n(p[1])}" r="13" fill="${P.yellow}" stroke="${INK}" stroke-width="3"/>` + (d.numbered ? T(p[0], p[1] + 1, i + 1, { size: 14 }) : ''));
  if (d.highlight === 'sides') pts.forEach((p, i) => { const q = pts[(i + 1) % pts.length]; b += `<line x1="${n(p[0])}" y1="${n(p[1])}" x2="${n(q[0])}" y2="${n(q[1])}" stroke="${[P.red, P.yellow, P.green, P.purple, '#4FA3F7', P.orange][i % 6]}" stroke-width="11" stroke-linecap="round"/>` + (d.numbered ? `<circle cx="${n((p[0] + q[0]) / 2)}" cy="${n((p[1] + q[1]) / 2)}" r="13" fill="#fff" stroke="${INK}" stroke-width="2"/>` + T((p[0] + q[0]) / 2, (p[1] + q[1]) / 2 + 1, i + 1, { size: 14 }) : ''); });
  return { w, h, body: b, label: k };
};
['triangle', 'rectangle', 'square', 'circle', 'parallelogram', 'trapezoid', 'pentagon', 'hexagon', 'equilateral'].forEach(k => { R[k] = (d, o) => R.shape({ ...d, shape: k }, o); });

// shape_cards: shapes [{shape, label?, icon?}] → row of cards (labels = א/ב/ג by default); grid? for comparing sizes
R.shape_cards = (d, o) => {
  const cards = d.shapes, cw = 170; let b = '';
  cards.forEach((s, i) => { const x = (cards.length - 1 - i) * (cw + 24);
    b += `<rect x="${x}" y="0" width="${cw}" height="${cw + 30}" rx="24" fill="#fff" stroke="${BORDER}" stroke-width="3"/>`;
    if (s.icon) b += icon(s.icon, x + 25, 18, cw - 50);
    else { const r = R.shape({ ...s }, o), sc = Math.min((cw - 46) / r.w, (cw - 46) / r.h) * (s.scale || 1); b += `<g transform="translate(${x + cw / 2 - r.w * sc / 2} ${18 + (cw - 36) / 2 - r.h * sc / 2}) scale(${n(sc)})">${r.body}</g>`; }
    if (s.label !== false) b += heb(x + cw / 2, cw + 8, s.label || hebOrd[i], { size: 20, fill: INK, w: 800 }); });
  return { w: cards.length * (cw + 24) - 24, h: cw + 30, body: b, label: 'כרטיסי צורות' };
};

// squares_on_grid: compare sizes: sizes [3,5] (side in grid units, no numbers shown)
R.squares_on_grid = (d, o) => {
  const u = 24, sizes = d.sizes, W = sizes.reduce((a, s) => a + s * u + 40, -40), H = Math.max(...sizes) * u;
  let b = `<rect x="-12" y="-12" width="${W + 24}" height="${H + 24}" fill="#fff"/>`;
  for (let x = -12; x <= W + 12; x += u) b += `<line x1="${x}" y1="-12" x2="${x}" y2="${H + 12}" stroke="${LINE}" stroke-width="1.5"/>`;
  for (let y = -12; y <= H + 12; y += u) b += `<line x1="-12" y1="${y}" x2="${W + 12}" y2="${y}" stroke="${LINE}" stroke-width="1.5"/>`;
  let x = W; sizes.forEach((s, i) => { x -= s * u; b += `<rect x="${x}" y="${H - s * u}" width="${s * u}" height="${s * u}" fill="${[o.c.soft, '#FFF4D1'][i]}" stroke="${[o.c.main, P.yellowD][i]}" stroke-width="5"/>` + heb(x + s * u / 2, H + 30, hebOrd[i], { size: 22, fill: INK, w: 800 }); x -= 40; });
  return { w: W, h: H + 44, body: b, label: 'ריבועים על משבצות' };
};

// 3D solids: cube, cuboid, cylinder, cone, sphere, pyramid, net_cube [+ real? icon beside]
const SOLID = {
  cube: c => `<path d="M40 70 L130 70 L130 160 L40 160Z" fill="${c.main}"/><path d="M40 70 L80 30 L170 30 L130 70Z" fill="#7C9BF2"/><path d="M130 70 L170 30 L170 120 L130 160Z" fill="${c.dark}"/>`,
  cuboid: c => `<path d="M20 80 L170 80 L170 160 L20 160Z" fill="${c.main}"/><path d="M20 80 L60 40 L210 40 L170 80Z" fill="#7C9BF2"/><path d="M170 80 L210 40 L210 120 L170 160Z" fill="${c.dark}"/>`,
  cylinder: c => `<path d="M40 40 V150 A70 22 0 0 0 180 150 V40Z" fill="${c.main}"/><ellipse cx="110" cy="40" rx="70" ry="22" fill="#7C9BF2"/>`,
  cone: c => `<path d="M110 10 L180 150 A70 22 0 0 1 40 150Z" fill="${c.main}"/><ellipse cx="110" cy="150" rx="70" ry="22" fill="${c.dark}"/><path d="M110 10 L180 150 A70 22 0 0 1 40 150Z" fill="${c.main}" opacity=".0"/>`,
  sphere: c => `<circle cx="110" cy="95" r="80" fill="${c.main}"/><ellipse cx="80" cy="65" rx="22" ry="16" fill="#fff" opacity=".3"/>`,
  pyramid: c => `<path d="M110 14 L40 150 L140 172Z" fill="${c.main}"/><path d="M110 14 L140 172 L190 130Z" fill="${c.dark}"/>`,
  net_cube: c => [[70, 0], [0, 70], [70, 70], [140, 70], [210, 70], [70, 140]].map(([x, y]) => `<rect x="${x}" y="${y}" width="70" height="70" fill="${c.soft}" stroke="${c.main}" stroke-width="5"/>`).join(''),
};
Object.keys(SOLID).forEach(k => { R[k] = (d, o) => { let b = SOLID[k](o.c), w = k === 'net_cube' ? 280 : 220; if (d.real) { b += icon(d.real, w + 30, 50, 120); w += 160; } return { w, h: k === 'net_cube' ? 210 : 180, body: b, label: k }; }; });

// scale: mode 'balance' (left[], right[]) or 'kitchen' (bags [{label}], unit) ; measuring_cup: max, unit, level? (no level when it's the answer)
R.scale = (d, o) => {
  let b = '';
  if (d.mode === 'balance') {
    b += `<rect x="190" y="40" width="12" height="170" fill="${INK}"/><rect x="140" y="204" width="112" height="16" rx="6" fill="${INK}"/><rect x="30" y="40" width="332" height="10" rx="5" fill="${INK}"/>`;
    [['left', 30], ['right', 250]].forEach(([k, x]) => { b += `<path d="M${x + 56} 50 L${x} 120 M${x + 56} 50 L${x + 112} 120" stroke="${SUB}" stroke-width="3"/><path d="M${x - 6} 120 H${x + 118} A62 24 0 0 1 ${x - 6} 120Z" fill="${P.gray}"/>`; (d[k] || []).forEach((it, i) => b += icon(it, x + 6 + i * 36, 74, 46)); });
    return { w: 392, h: 222, body: b, label: 'מאזניים' };
  }
  b += `<rect x="60" y="150" width="240" height="70" rx="18" fill="${o.c.main}"/><circle cx="180" cy="186" r="26" fill="#fff"/><path d="M180 186 L196 170" stroke="${P.red}" stroke-width="5" stroke-linecap="round"/><rect x="40" y="134" width="280" height="18" rx="8" fill="${P.gray}"/>`;
  (d.bags || []).forEach((g, i) => { const x = 70 + i * 116; b += icon('bag', x, 36, 110) + `<rect x="${x + 18}" y="86" width="74" height="34" rx="10" fill="#fff"/>` + heb(x + 55, 103, g.label, { size: 17, fill: INK, w: 800 }); });
  return { w: 360, h: 222, body: b, label: 'משקל' };
};
R.measuring_cup = (d, o) => {
  const max = +d.max || 1000, H = 230, W = 150; let b = `<path d="M20 10 H${W} V${H} Q${W} ${H + 20} ${W - 20} ${H + 20} H40 Q20 ${H + 20} 20 ${H}Z" fill="#EAF6FF" stroke="${INK}" stroke-width="5"/><path d="M${W} 40 C${W + 46} 40 ${W + 46} 130 ${W} 130" stroke="${INK}" stroke-width="10" fill="none"/>`;
  if (d.level !== undefined) b += `<path d="M24 ${H - d.level / max * (H - 20)} H${W - 4} V${H} Q${W - 4} ${H + 16} ${W - 22} ${H + 16} H42 Q24 ${H + 16} 24 ${H}Z" fill="#8FC8FF"/>`;
  const marks = d.marks || [0, .25, .5, .75, 1].map(f => f * max);
  marks.forEach(m => { const y = H - m / max * (H - 20); b += `<line x1="20" y1="${y}" x2="60" y2="${y}" stroke="${INK}" stroke-width="3"/>` + T(70, y, d.unit === 'l' ? `${m / 1000} ל׳` : `${m} מ״ל`, { size: 15, anchor: 'start', font: HEBF, w: 700 }); });
  return { w: W + 50, h: H + 26, body: b, label: 'כוס מדידה' };
};

// function_machine: start '?'|number, ops ['×4','−12'], result
R.function_machine = (d, o) => {
  const steps = [d.start, ...d.ops, d.result], bw = 96, gap = 46; let b = '';
  const W = steps.length * (bw + gap) - gap;
  steps.forEach((v, i) => { const x = i * (bw + gap), isOp = i > 0 && i < steps.length - 1;
    if (isOp) b += `<rect x="${x}" y="6" width="${bw}" height="78" rx="18" fill="${o.c.main}"/>` + T(x + bw / 2, 46, v, { size: 30, fill: '#fff', w: 900, dir: 'ltr' }) + `<circle cx="${x + 24}" cy="20" r="5" fill="${P.yellow}"/><circle cx="${x + 40}" cy="20" r="5" fill="#fff" opacity=".5"/>`;
    else b += isQ(v) ? qbox(x + bw / 2, 45, bw - 10, 70, o.c) : `<rect x="${x + 5}" y="10" width="${bw - 10}" height="70" rx="16" fill="${P.yellow}"/>` + T(x + bw / 2, 46, v, { size: 32, w: 900 });
    if (i < steps.length - 1) b += `<path d="M${x + bw + 8} 45 H${x + bw + gap - 10}" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><path d="M${x + bw + gap - 20} 35 L${x + bw + gap - 8} 45 L${x + bw + gap - 20} 55" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
  });
  // machines read in the order you calculate: left → right like an equation
  return { w: W, h: 90, body: b, label: 'מכונת מספרים' };
};

// Hebrew: syllable_beats {word, picture, beats, showBeats}; letter_card {letter, picture?}
R.syllable_beats = (d, o) => {
  const s = 170; let b = icon(d.picture, 0, 0, s);
  const k = +d.beats, gap = 40, W = Math.max(s, k * gap);
  if (d.showBeats) for (let i = 0; i < k; i++) b += `<circle cx="${s / 2 + (i - (k - 1) / 2) * gap}" cy="${s + 30}" r="13" fill="${o.c.main}"/>`;
  else b += `<rect x="${s / 2 - 70}" y="${s + 12}" width="140" height="38" rx="19" fill="${o.c.soft}" stroke="${o.c.main}" stroke-width="3" stroke-dasharray="7 5"/>` + `<g transform="translate(${s / 2 - 17} ${s + 13}) scale(.34)"><path d="M30 92 C24 76 22 62 22 50 C22 44 30 42 32 50 L34 58 V20 C34 14 42 14 42 20 V48 V14 C42 8 50 8 50 14 V48 V18 C50 12 58 12 58 18 V50 V28 C58 22 66 22 66 28 V62 C66 78 60 88 56 92Z" fill="${o.c.main}"/></g>`;
  return { w: W, h: s + 56, body: b, label: 'תמונה ומחיאות כפיים' };
};
R.letter_card = (d, o) => {
  let b = `<rect x="0" y="0" width="190" height="230" rx="30" fill="#fff" stroke="${o.c.main}" stroke-width="6"/><rect x="14" y="14" width="162" height="14" rx="7" fill="${o.c.soft}"/>` + T(95, 132, d.letter, { size: 150, w: 900, font: "'Frank Ruhl Libre', Rubik, serif", fill: INK, dir: 'rtl' });
  let w = 190; if (d.picture) { b += icon(d.picture, 230, 40, 150); w = 390; }
  return { w, h: 230, body: b, label: `האות ${d.letter}` };
};

// picture_card {icon} / picture_cards {icons[]} / color_swatch {color}
const COLORS = { black: '#16213E', blue: '#2F5BE3', green: '#2EA44F', orange: '#F7931E', pink: '#FF8FB1', purple: '#8B6FD6', red: '#E23D28', white: '#FFFFFF', yellow: '#FFC940', brown: '#8B5A2B', gray: '#9AA3B8' };
R.picture_card = (d, o) => ({ w: 240, h: 240, body: `<rect x="0" y="0" width="240" height="240" rx="34" fill="#fff" stroke="${BORDER}" stroke-width="4"/>` + icon(d.icon, 30, 30, 180), label: 'כרטיס תמונה' });
R.picture_cards = (d, o) => { const s = 150; let b = ''; d.icons.forEach((ic, i) => { const x = (d.icons.length - 1 - i) * (s + 20); b += `<rect x="${x}" y="0" width="${s}" height="${s}" rx="26" fill="#fff" stroke="${BORDER}" stroke-width="3"/>` + (isQ(ic) ? qbox(x + s / 2, s / 2, s - 50, s - 50, o.c) : icon(ic, x + 20, 20, s - 40)); if (d.labels?.[i]) b += heb(x + s / 2, s + 20, d.labels[i], { size: 18, fill: INK }); }); return { w: d.icons.length * (s + 20) - 20, h: s + (d.labels ? 36 : 0), body: b, label: 'כרטיסי תמונה' }; };
R.color_swatch = (d, o) => { const col = COLORS[d.color] || d.color; return { w: 240, h: 220, body: `<path d="M120 14 C170 10 222 40 220 96 C236 112 230 150 206 160 C210 196 170 214 140 200 C116 222 72 214 64 190 C26 196 6 160 22 132 C2 108 16 64 50 60 C60 30 92 12 120 14Z" fill="${col}" stroke="${col === '#FFFFFF' ? BORDER : 'none'}" stroke-width="4"/><ellipse cx="88" cy="70" rx="20" ry="12" fill="#fff" opacity="${col === '#FFFFFF' ? 0 : .3}"/>`, label: 'כתם צבע' }; };

// grid: cols, rows, filled (count, filled in reading order from the right)
R.grid = (d, o) => { const s = 40; let b = ''; for (let i = 0; i < d.rows; i++) for (let j = 0; j < d.cols; j++) { const k = i * d.cols + j; b += `<rect x="${(d.cols - 1 - j) * s}" y="${i * s}" width="${s}" height="${s}" fill="${k < (d.filled || 0) ? o.c.main : '#fff'}" stroke="${o.c.dark}" stroke-width="2"/>`; } return { w: d.cols * s, h: d.rows * s, body: b, label: 'משבצות' }; };

// steps: a row of visuals with operators between (e.g. 2 apples + 1 apple) : items [visualData|'+'|'−'|'=']
R.steps = (d, o) => {
  const parts = d.items.map(it => typeof it === 'string' ? { op: it } : renderParts(it, o));
  const gap = 30, sc = d.scale || .8; let x = 0, H = Math.max(...parts.map(p => (p.h || 0) * sc));
  const items = [];
  parts.forEach(p => { if (p.op) { items.push({ w: 40, draw: X => T(X + 20, H / 2, p.op, { size: 44, w: 900, fill: o.c.main, dir: 'ltr' }) }); } else items.push({ w: p.w * sc, draw: X => `<g transform="translate(${X} ${(H - p.h * sc) / 2}) scale(${sc})"><g transform="translate(${p.ox || 0} 0)">${p.body}</g></g>` }); });
  const W = items.reduce((a, i) => a + i.w + gap, -gap); let X = W, b = '';
  items.forEach(i => { X -= i.w; b += i.draw(X); X -= gap; }); // RTL order
  return { w: W, h: H, body: b, label: 'צעדים' };
};


// op_cards: a worked-step board: items [{icon, text, crossed?} | '+' | '−' | '×'] → cards with an icon and a number, operators between
R.op_cards = (d, o) => {
  const cw = 132, ch = 150, gap = 18, ow = 34; let b = '';
  const items = d.items, W = items.reduce((a, it) => a + (typeof it === 'string' ? ow : cw) + gap, -gap);
  let x = W;
  items.forEach(it => {
    if (typeof it === 'string') { x -= ow; b += T(x + ow / 2, ch / 2, it, { size: 44, w: 900, fill: o.c.main }); x -= gap; return; }
    x -= cw;
    b += `<rect x="${x}" y="0" width="${cw}" height="${ch}" rx="24" fill="#fff" stroke="${BORDER}" stroke-width="3"/>` + icon(it.icon, x + 31, 14, 70);
    if (it.crossed) b += cross(x + 31, 14, 70);
    b += isQ(it.text) ? qbox(x + cw / 2, 116, 70, 40, o.c) : `<rect x="${x + 16}" y="96" width="${cw - 32}" height="40" rx="12" fill="${P.yellow}"/>` + T(x + cw / 2, 117, it.text, { size: 24, w: 900, dir: 'ltr' });
    if (it.label) b += heb(x + cw / 2, ch + 20, it.label, { size: 16 });
    x -= gap;
  });
  return { w: W, h: ch + (items.some(i => i.label) ? 34 : 0), body: b, label: 'שלבי הסיפור' };
};

// ---------- public API ----------
function renderParts(data, o) {
  const type = data?.type;
  const f = R[type];
  if (!f) return { w: 300, h: 80, body: heb(150, 40, `סוג ויזואל לא מוכר: ${type}`, { fill: '#C2361B' }), label: '' };
  return f(data, o);
}

/**
 * @param {object} data  questions.visual_data (must have `type`)
 * @param {object} [opts]
 * @param {'math'|'hebrew'|'english'|'reading'} [opts.subject='math']
 * @param {'color'|'print'} [opts.mode='color']  print = grayscale, still readable (shapes carry meaning)
 * @param {number} [opts.maxWidth] css max-width in px (default 100%)
 * @param {string} [opts.label]  Hebrew aria-label override
 */
export function renderVisual(data, opts = {}) {
  const c = SUBJECT[opts.subject || data.subject || 'math'] || SUBJECT.math;
  const o = { c, mode: opts.mode || 'color' };
  const r = renderParts(data, o);
  const pad = 24, w = Math.ceil(r.w + 2 * pad), h = Math.ceil(r.h + 2 * pad);
  const label = esc(opts.label || data.alt || r.label || 'איור');
  const print = o.mode === 'print' ? `<filter id="ep-gray"><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncR type="linear" slope="1.1" intercept="-.04"/><feFuncG type="linear" slope="1.1" intercept="-.04"/><feFuncB type="linear" slope="1.1" intercept="-.04"/></feComponentTransfer></filter>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${label}" style="max-width:${opts.maxWidth ? opts.maxWidth + 'px' : '100%'};height:auto;display:block;margin:0 auto" direction="ltr">${print ? `<defs>${print}</defs>` : ''}<g transform="translate(${pad + (r.ox || 0)} ${pad})"${print ? ' filter="url(#ep-gray)"' : ''}>${r.body}</g></svg>`;
}

export const VISUAL_TYPES = Object.keys(R);
export default renderVisual;
export { iconSvg } from './icons.js';
