// Simple pictures for early-reading booklets, drawn from primitives so they
// print the same everywhere. "color" mode draws them filled; "outline" mode
// leaves them white for the child to color in.
// Also: connect-the-dots shapes (numbered points, in drawing order).

type Mode = 'color' | 'outline'

const S = '#1E2D4E'
const f = (mode: Mode, c: string) => (mode === 'outline' ? '#fff' : c)

// every picture is drawn in a 100×100 box
const PICS: Record<string, { he: string; draw: (m: Mode) => string }> = {
  house: { he: 'בית', draw: m => `<polygon points="15,48 50,15 85,48" fill="${f(m, '#E8724C')}" stroke="${S}" stroke-width="3"/><rect x="24" y="48" width="52" height="40" fill="${f(m, '#F4C430')}" stroke="${S}" stroke-width="3"/><rect x="43" y="64" width="14" height="24" fill="${f(m, '#8B5A2B')}" stroke="${S}" stroke-width="2.5"/><rect x="30" y="56" width="10" height="10" fill="${f(m, '#9ED0F5')}" stroke="${S}" stroke-width="2"/>` },
  sun: { he: 'שמש', draw: m => Array.from({ length: 8 }, (_, i) => { const a = (i * Math.PI) / 4; return `<line x1="${50 + 28 * Math.cos(a)}" y1="${50 + 28 * Math.sin(a)}" x2="${50 + 42 * Math.cos(a)}" y2="${50 + 42 * Math.sin(a)}" stroke="${m === 'outline' ? S : '#F4A100'}" stroke-width="4" stroke-linecap="round"/>` }).join('') + `<circle cx="50" cy="50" r="22" fill="${f(m, '#F4C430')}" stroke="${S}" stroke-width="3"/>` },
  tree: { he: 'עץ', draw: m => `<rect x="44" y="58" width="12" height="32" fill="${f(m, '#8B5A2B')}" stroke="${S}" stroke-width="2.5"/><circle cx="50" cy="40" r="28" fill="${f(m, '#43A047')}" stroke="${S}" stroke-width="3"/>` },
  fish: { he: 'דג', draw: m => `<ellipse cx="44" cy="50" rx="30" ry="18" fill="${f(m, '#2EC4B6')}" stroke="${S}" stroke-width="3"/><polygon points="72,50 92,34 92,66" fill="${f(m, '#2EC4B6')}" stroke="${S}" stroke-width="3" stroke-linejoin="round"/><circle cx="30" cy="46" r="3.5" fill="${S}"/>` },
  ball: { he: 'כדור', draw: m => `<circle cx="50" cy="50" r="34" fill="${f(m, '#4A7FD4')}" stroke="${S}" stroke-width="3"/><path d="M16 50 Q50 28 84 50" fill="none" stroke="${m === 'outline' ? S : '#fff'}" stroke-width="3"/><path d="M16 50 Q50 72 84 50" fill="none" stroke="${m === 'outline' ? S : '#fff'}" stroke-width="3"/>` },
  flower: { he: 'פרח', draw: m => `<line x1="50" y1="55" x2="50" y2="92" stroke="${m === 'outline' ? S : '#43A047'}" stroke-width="4"/>` + [0, 72, 144, 216, 288].map(a => { const t = (a * Math.PI) / 180; return `<circle cx="${50 + 17 * Math.cos(t)}" cy="${38 + 17 * Math.sin(t)}" r="12" fill="${f(m, '#F48FB1')}" stroke="${S}" stroke-width="2.5"/>` }).join('') + `<circle cx="50" cy="38" r="9" fill="${f(m, '#F4C430')}" stroke="${S}" stroke-width="2.5"/>` },
  apple: { he: 'תפוח', draw: m => `<path d="M50 30 C30 18 10 35 18 62 C24 84 40 92 50 84 C60 92 76 84 82 62 C90 35 70 18 50 30 Z" fill="${f(m, '#E53935')}" stroke="${S}" stroke-width="3"/><line x1="50" y1="30" x2="54" y2="14" stroke="${S}" stroke-width="3"/><ellipse cx="64" cy="16" rx="10" ry="5" fill="${f(m, '#43A047')}" stroke="${S}" stroke-width="2"/>` },
  book: { he: 'ספר', draw: m => `<path d="M50 28 L14 20 L14 78 L50 86 Z" fill="${f(m, '#4A7FD4')}" stroke="${S}" stroke-width="3" stroke-linejoin="round"/><path d="M50 28 L86 20 L86 78 L50 86 Z" fill="${f(m, '#2EC4B6')}" stroke="${S}" stroke-width="3" stroke-linejoin="round"/>` },
  boat: { he: 'סירה', draw: m => `<path d="M12 62 L88 62 L74 82 L26 82 Z" fill="${f(m, '#8B5A2B')}" stroke="${S}" stroke-width="3" stroke-linejoin="round"/><line x1="50" y1="62" x2="50" y2="14" stroke="${S}" stroke-width="3"/><polygon points="52,16 52,56 80,56" fill="${f(m, '#fff')}" stroke="${S}" stroke-width="3" stroke-linejoin="round"/>` },
  car: { he: 'מכונית', draw: m => `<rect x="10" y="48" width="80" height="24" rx="6" fill="${f(m, '#E8724C')}" stroke="${S}" stroke-width="3"/><path d="M28 48 L36 30 L64 30 L72 48 Z" fill="${f(m, '#9ED0F5')}" stroke="${S}" stroke-width="3" stroke-linejoin="round"/><circle cx="30" cy="74" r="9" fill="${f(m, '#555')}" stroke="${S}" stroke-width="3"/><circle cx="70" cy="74" r="9" fill="${f(m, '#555')}" stroke="${S}" stroke-width="3"/>` },
  star: { he: 'כוכב', draw: m => { const pts = Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? 17 : 40; return `${50 + r * Math.cos(a)},${52 + r * Math.sin(a)}` }).join(' '); return `<polygon points="${pts}" fill="${f(m, '#F4C430')}" stroke="${S}" stroke-width="3" stroke-linejoin="round"/>` } },
  heart: { he: 'לב', draw: m => `<path d="M50 86 C10 58 12 22 34 20 C44 19 50 28 50 34 C50 28 56 19 66 20 C88 22 90 58 50 86 Z" fill="${f(m, '#E53935')}" stroke="${S}" stroke-width="3"/>` },
  moon: { he: 'ירח', draw: m => `<path d="M62 14 A38 38 0 1 0 62 86 A30 30 0 1 1 62 14 Z" fill="${f(m, '#F4C430')}" stroke="${S}" stroke-width="3"/>` },
  cat: { he: 'חתול', draw: m => `<circle cx="50" cy="56" r="28" fill="${f(m, '#F2A65A')}" stroke="${S}" stroke-width="3"/><polygon points="26,40 30,14 46,30" fill="${f(m, '#F2A65A')}" stroke="${S}" stroke-width="3" stroke-linejoin="round"/><polygon points="74,40 70,14 54,30" fill="${f(m, '#F2A65A')}" stroke="${S}" stroke-width="3" stroke-linejoin="round"/><circle cx="40" cy="52" r="3.5" fill="${S}"/><circle cx="60" cy="52" r="3.5" fill="${S}"/><path d="M46 64 Q50 68 54 64" fill="none" stroke="${S}" stroke-width="2.5"/><line x1="22" y1="62" x2="38" y2="62" stroke="${S}" stroke-width="2"/><line x1="62" y1="62" x2="78" y2="62" stroke="${S}" stroke-width="2"/>` },
  dog: { he: 'כלב', draw: m => `<circle cx="50" cy="54" r="27" fill="${f(m, '#C68B59')}" stroke="${S}" stroke-width="3"/><ellipse cx="24" cy="50" rx="9" ry="20" fill="${f(m, '#8B5A2B')}" stroke="${S}" stroke-width="3"/><ellipse cx="76" cy="50" rx="9" ry="20" fill="${f(m, '#8B5A2B')}" stroke="${S}" stroke-width="3"/><circle cx="41" cy="48" r="3.5" fill="${S}"/><circle cx="59" cy="48" r="3.5" fill="${S}"/><ellipse cx="50" cy="62" rx="6" ry="4.5" fill="${S}"/><path d="M44 70 Q50 75 56 70" fill="none" stroke="${S}" stroke-width="2.5"/>` },
  bird: { he: 'ציפור', draw: m => `<ellipse cx="48" cy="56" rx="30" ry="20" fill="${f(m, '#4A7FD4')}" stroke="${S}" stroke-width="3"/><circle cx="70" cy="40" r="14" fill="${f(m, '#4A7FD4')}" stroke="${S}" stroke-width="3"/><polygon points="83,38 96,42 83,46" fill="${f(m, '#F4A100')}" stroke="${S}" stroke-width="2"/><circle cx="73" cy="37" r="2.8" fill="${S}"/><path d="M34 52 Q46 40 58 54" fill="none" stroke="${S}" stroke-width="2.5"/>` },
  cup: { he: 'כוס', draw: m => `<path d="M24 26 L76 26 L68 86 L32 86 Z" fill="${f(m, '#9ED0F5')}" stroke="${S}" stroke-width="3" stroke-linejoin="round"/>` },
  hat: { he: 'כובע', draw: m => `<ellipse cx="50" cy="72" rx="42" ry="10" fill="${f(m, '#4A7FD4')}" stroke="${S}" stroke-width="3"/><path d="M28 72 L32 30 Q50 22 68 30 L72 72 Z" fill="${f(m, '#4A7FD4')}" stroke="${S}" stroke-width="3" stroke-linejoin="round"/><rect x="30" y="58" width="40" height="8" fill="${f(m, '#E53935')}" stroke="${S}" stroke-width="2"/>` },
  hand: { he: 'יד', draw: m => `<path d="M30 90 L30 50 L22 36 Q20 30 26 30 L36 44 L36 18 Q36 12 42 12 Q46 12 46 18 L46 40 L46 12 Q46 6 52 6 Q57 6 57 12 L57 40 L57 16 Q57 10 63 10 Q68 10 68 16 L68 42 L68 26 Q68 20 74 20 Q79 20 79 26 L79 64 Q79 80 70 90 Z" fill="${f(m, '#F2C29B')}" stroke="${S}" stroke-width="3" stroke-linejoin="round"/>` },
  banana: { he: 'בננה', draw: m => `<path d="M18 30 Q22 76 78 78 Q86 78 86 72 Q40 66 30 24 Q26 18 18 30 Z" fill="${f(m, '#F4C430')}" stroke="${S}" stroke-width="3" stroke-linejoin="round"/>` },
  cloud: { he: 'ענן', draw: m => `<path d="M24 72 Q8 72 10 58 Q12 44 28 46 Q30 28 48 28 Q64 28 68 42 Q88 40 90 56 Q90 72 74 72 Z" fill="${f(m, '#E3F0FB')}" stroke="${S}" stroke-width="3"/>` },
  bed: { he: 'מיטה', draw: m => `<rect x="10" y="52" width="80" height="20" fill="${f(m, '#4A7FD4')}" stroke="${S}" stroke-width="3"/><rect x="10" y="30" width="8" height="54" fill="${f(m, '#8B5A2B')}" stroke="${S}" stroke-width="2.5"/><rect x="82" y="44" width="8" height="40" fill="${f(m, '#8B5A2B')}" stroke="${S}" stroke-width="2.5"/><rect x="20" y="42" width="22" height="10" rx="4" fill="${f(m, '#fff')}" stroke="${S}" stroke-width="2.5"/>` },
}

export const PICTURE_KEYS = Object.keys(PICS)
export const pictureHint = () => PICTURE_KEYS.map(k => `${k} (${PICS[k].he})`).join(', ')
export function pictureSVG(key: string, size = 90, mode: Mode = 'color'): string {
  const p = PICS[key]
  if (!p) return ''
  return `<svg viewBox="0 0 100 100" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" style="direction:ltr">${p.draw(mode)}</svg>`
}

// ── connect the dots: points in drawing order on a 100×100 box ──
const DOTS: Record<string, { he: string; pts: [number, number][] }> = {
  star: { he: 'כוכב', pts: Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? 18 : 44; return [Math.round(50 + r * Math.cos(a)), Math.round(52 + r * Math.sin(a))] as [number, number] }) },
  heart: { he: 'לב', pts: [[50, 30], [60, 18], [74, 14], [88, 22], [92, 38], [84, 56], [68, 72], [50, 88], [32, 72], [16, 56], [8, 38], [12, 22], [26, 14], [40, 18]] },
  house: { he: 'בית', pts: [[20, 90], [20, 48], [10, 48], [50, 10], [90, 48], [80, 48], [80, 90], [58, 90], [58, 66], [42, 66], [42, 90]] },
  fish: { he: 'דג', pts: [[8, 50], [20, 34], [38, 26], [56, 28], [70, 38], [90, 24], [86, 50], [90, 76], [70, 62], [56, 72], [38, 74], [20, 66]] },
  boat: { he: 'סירה', pts: [[24, 86], [8, 64], [48, 64], [48, 10], [82, 56], [52, 56], [52, 64], [92, 64], [76, 86]] },
  apple: { he: 'תפוח', pts: [[50, 30], [62, 22], [76, 24], [88, 38], [88, 58], [80, 76], [66, 88], [50, 84], [34, 88], [20, 76], [12, 58], [12, 38], [24, 24], [38, 22]] },
  tree: { he: 'עץ', pts: [[44, 92], [44, 70], [20, 70], [34, 52], [24, 52], [40, 32], [32, 32], [50, 8], [68, 32], [60, 32], [76, 52], [66, 52], [80, 70], [56, 70], [56, 92]] },
  balloon: { he: 'בלון', pts: [[50, 8], [66, 12], [78, 26], [80, 44], [72, 60], [58, 70], [54, 74], [56, 92], [46, 92], [48, 74], [42, 70], [28, 60], [20, 44], [22, 26], [34, 12]] },
}
export const DOT_KEYS = Object.keys(DOTS)
export const dotsHint = () => DOT_KEYS.map(k => `${k} (${DOTS[k].he})`).join(', ')
export function dotsSVG(key: string, size = 360): string {
  const d = DOTS[key]
  if (!d) return ''
  const pts = d.pts
  return `<svg viewBox="-6 -6 112 112" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" style="direction:ltr">${pts.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="1.6" fill="${S}"/><text x="${x + 2.4}" y="${y - 2}" font-size="4.6" font-family="Nunito,Arial" font-weight="800" fill="#4A7FD4">${i + 1}</text>`).join('')}</svg>`
}
