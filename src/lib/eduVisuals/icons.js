// EduPlay icon set · flat shapes in the EduPlay palette · viewBox 0 0 100 100
// Same style as public/qicons: flat fills, no outlines, one soft white highlight.
// Add an icon = add one entry. Keys are the `icon` values used in visual_data.

export const P = {
  ink: '#16213E', blue: '#2F5BE3', blueL: '#5B7FEE', blueD: '#1E3FA8',
  yellow: '#FFC940', yellowD: '#E0A800', red: '#E85D3F', redD: '#B7432A',
  green: '#12937A', greenL: '#5CC46A', greenD: '#2E7D3A', white: '#FFFFFF',
  brown: '#C98A4B', brownD: '#A86E35', orange: '#F4A259', pink: '#FF9AA8',
  sky: '#8FC8FF', skyL: '#BFE0FF', purple: '#8B6FD6', gray: '#C7CDD8', cream: '#FFE8B0',
  skin: '#F6C9A0', skinD: '#C98A62', hair: '#5A3A22',
};
const { ink: INK, blue: B, yellow: Y, yellowD: YD, red: R, green: G, white: W, brown: BR } = P;
const hl = (cx, cy, rx = 6, ry = 9) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#fff" opacity=".35"/>`;
const star5 = (cx, cy, r, ri, fill) => {
  let d = '';
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? ri : r;
    d += (i ? 'L' : 'M') + (cx + rr * Math.cos(a)).toFixed(1) + ' ' + (cy + rr * Math.sin(a)).toFixed(1);
  }
  return `<path d="${d}Z" fill="${fill}" stroke="${fill}" stroke-width="6" stroke-linejoin="round"/>`;
};
const flower = (petal) => [0, 72, 144, 216, 288].map(a => `<ellipse cx="50" cy="24" rx="14" ry="19" fill="${petal}" transform="rotate(${a} 50 44)"/>`).join('') + `<circle cx="50" cy="44" r="12" fill="${YD}"/><rect x="47" y="58" width="6" height="34" rx="3" fill="${P.greenD}"/><path d="M50 78 C40 70 30 72 26 76 C34 82 44 82 50 78Z" fill="${P.greenL}"/>`;
const kid = (shirt, girl) =>
  (girl ? `<path d="M30 30 C26 52 28 60 22 66 L78 66 C72 60 74 52 70 30 Z" fill="${P.hair}"/>` : '') +
  `<circle cx="50" cy="32" r="18" fill="${P.skin}"/>` +
  (girl ? `<path d="M32 30 C32 14 68 14 68 30 C60 22 42 22 32 30Z" fill="${P.hair}"/><circle cx="70" cy="22" r="6" fill="${R}"/>`
        : `<path d="M32 28 C32 12 68 12 68 28 C60 20 42 22 32 28Z" fill="${P.hair}"/>`) +
  `<circle cx="43" cy="33" r="2.6" fill="${INK}"/><circle cx="57" cy="33" r="2.6" fill="${INK}"/><path d="M44 41 Q50 45 56 41" stroke="${INK}" stroke-width="2.4" fill="none" stroke-linecap="round"/>` +
  (girl ? `<path d="M30 92 L38 52 H62 L70 92 Z" fill="${shirt}"/>` : `<rect x="34" y="52" width="32" height="26" rx="10" fill="${shirt}"/><rect x="36" y="74" width="12" height="18" rx="5" fill="${P.blueD}"/><rect x="52" y="74" width="12" height="18" rx="5" fill="${P.blueD}"/>`);

export const ICONS = {
  // ---- existing qicons (unchanged) ----
  apple: `<path d="M50 30 C36 18 14 26 16 50 C18 74 34 90 50 84 C66 90 82 74 84 50 C86 26 64 18 50 30 Z" fill="${R}"/><path d="M50 30 C50 22 52 14 58 10" stroke="#7A4A2A" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M54 20 C62 10 76 12 78 18 C70 24 60 24 54 20 Z" fill="${G}"/>${hl(34, 44)}`,
  ball: `<circle cx="50" cy="52" r="36" fill="${R}"/><path d="M18 46 Q50 60 82 46" stroke="${W}" stroke-width="6" fill="none"/><path d="M26 74 Q50 62 74 74" stroke="${W}" stroke-width="6" fill="none" opacity=".7"/><ellipse cx="38" cy="34" rx="8" ry="5" fill="${W}" opacity=".4"/>`,
  cat: `<path d="M22 34 L28 10 L44 26 Z M78 34 L72 10 L56 26 Z" fill="${P.orange}"/><circle cx="50" cy="54" r="32" fill="${P.orange}"/><circle cx="38" cy="50" r="5" fill="${INK}"/><circle cx="62" cy="50" r="5" fill="${INK}"/><path d="M46 62 L54 62 L50 67 Z" fill="${R}"/><path d="M24 62 H38 M24 70 H38 M62 62 H76 M62 70 H76" stroke="${INK}" stroke-width="2.5" stroke-linecap="round"/>`,
  sun: `<circle cx="50" cy="50" r="22" fill="${Y}"/>` + [0, 45, 90, 135, 180, 225, 270, 315].map(a => `<rect x="47" y="6" width="6" height="16" rx="3" fill="${YD}" transform="rotate(${a} 50 50)"/>`).join(''),
  fish: `<path d="M14 50 C30 26 62 26 76 50 C62 74 30 74 14 50 Z" fill="#4FA3F7"/><path d="M76 50 L94 34 L94 66 Z" fill="#4FA3F7"/><circle cx="32" cy="46" r="5" fill="${INK}"/><path d="M48 38 Q56 50 48 62" stroke="${W}" stroke-width="4" fill="none" opacity=".6"/>`,
  house: `<path d="M14 48 L50 16 L86 48 Z" fill="${R}"/><rect x="24" y="46" width="52" height="40" fill="${P.cream}"/><rect x="42" y="62" width="16" height="24" rx="3" fill="${BR}"/><rect x="30" y="54" width="10" height="10" fill="${P.sky}"/><rect x="60" y="54" width="10" height="10" fill="${P.sky}"/>`,
  frog: `<ellipse cx="50" cy="60" rx="36" ry="26" fill="${P.greenL}"/><circle cx="32" cy="34" r="13" fill="${P.greenL}"/><circle cx="68" cy="34" r="13" fill="${P.greenL}"/><circle cx="32" cy="33" r="7" fill="${W}"/><circle cx="68" cy="33" r="7" fill="${W}"/><circle cx="33" cy="34" r="4" fill="${INK}"/><circle cx="67" cy="34" r="4" fill="${INK}"/><path d="M34 62 Q50 74 66 62" stroke="${P.greenD}" stroke-width="4" fill="none" stroke-linecap="round"/>`,
  pencil: `<g transform="rotate(-40 50 50)"><rect x="42" y="8" width="16" height="66" rx="3" fill="${Y}"/><rect x="42" y="8" width="16" height="12" rx="3" fill="${P.pink}"/><path d="M42 74 L58 74 L50 92 Z" fill="#F4D7A8"/><path d="M47 84 L53 84 L50 92 Z" fill="${INK}"/></g>`,
  box: `<rect x="12" y="40" width="76" height="48" rx="6" fill="${BR}"/><rect x="12" y="40" width="76" height="12" fill="${P.brownD}"/>`,
  book: `<path d="M50 24 C38 16 22 16 12 20 L12 80 C22 76 38 76 50 84 Z" fill="${B}"/><path d="M50 24 C62 16 78 16 88 20 L88 80 C78 76 62 76 50 84 Z" fill="${P.blueL}"/><path d="M50 24 V84" stroke="${P.blueD}" stroke-width="3"/>`,
  bee: `<ellipse cx="34" cy="34" rx="16" ry="12" fill="#DCEBFF" transform="rotate(-25 34 34)"/><ellipse cx="62" cy="30" rx="16" ry="12" fill="#DCEBFF" transform="rotate(25 62 30)"/><ellipse cx="50" cy="58" rx="30" ry="22" fill="${Y}"/><path d="M42 38 Q38 58 42 78 M58 38 Q62 58 58 78" stroke="${INK}" stroke-width="8" fill="none"/><circle cx="76" cy="54" r="4" fill="${INK}"/>`,
  bus: `<rect x="8" y="22" width="84" height="54" rx="12" fill="${Y}"/><rect x="16" y="30" width="18" height="18" rx="3" fill="${P.skyL}"/><rect x="40" y="30" width="18" height="18" rx="3" fill="${P.skyL}"/><rect x="64" y="30" width="20" height="18" rx="3" fill="${P.skyL}"/><rect x="8" y="58" width="84" height="6" fill="${YD}"/><circle cx="28" cy="78" r="9" fill="${INK}"/><circle cx="72" cy="78" r="9" fill="${INK}"/>`,
  tag: `<path d="M14 20 H56 L90 54 L56 88 L14 46 Z" fill="${Y}" transform="rotate(-8 50 54)"/><circle cx="28" cy="34" r="6" fill="${W}"/>`,
  tree: `<rect x="44" y="56" width="12" height="34" rx="3" fill="${P.brownD}"/><circle cx="50" cy="40" r="28" fill="${P.greenL}"/><circle cx="34" cy="50" r="16" fill="#4BB35A"/><circle cx="66" cy="50" r="16" fill="#4BB35A"/>`,
  cloud: `<path d="M24 70 C10 70 10 50 24 48 C24 32 44 28 52 40 C60 28 82 32 80 50 C94 52 92 70 78 70 Z" fill="${P.sky}"/>`,

  // ---- new: counting stories (brief 2.1) ----
  star: star5(50, 52, 38, 17, Y) + hl(40, 40, 5, 7),
  heart: `<path d="M50 86 C20 64 8 46 14 30 C20 14 42 12 50 30 C58 12 80 14 86 30 C92 46 80 64 50 86Z" fill="${R}"/>${hl(30, 34)}`,
  bird: `<ellipse cx="46" cy="56" rx="30" ry="24" fill="#4FA3F7"/><circle cx="70" cy="38" r="16" fill="#4FA3F7"/><path d="M84 36 L96 40 L84 44Z" fill="${Y}"/><circle cx="74" cy="34" r="3.5" fill="${INK}"/><path d="M30 50 C40 40 58 44 60 58 C48 64 36 62 30 50Z" fill="#2B7FD4"/><path d="M16 50 L4 40 L8 58Z" fill="#2B7FD4"/><path d="M40 78 V90 M52 78 V90" stroke="${YD}" stroke-width="4" stroke-linecap="round"/>`,
  bird_fly: `<path d="M50 54 C36 30 18 28 6 36 C24 40 34 50 40 62Z" fill="#2B7FD4"/><path d="M50 54 C64 30 82 28 94 36 C76 40 66 50 60 62Z" fill="#2B7FD4"/><ellipse cx="50" cy="62" rx="16" ry="12" fill="#4FA3F7"/><circle cx="50" cy="50" r="9" fill="#4FA3F7"/><path d="M50 52 L46 58 H54Z" fill="${Y}"/>`,
  girl: kid(P.pink, true),
  boy: kid('#5B9BF5', false),
  child: kid(P.gray, false),
  flower: flower(R),
  flower_red: flower(R),
  flower_yellow: flower(Y),
  sticker: star5(50, 50, 40, 18, P.purple) + `<path d="M64 76 L84 76 L84 56Z" fill="#E7DDFB"/>` + hl(40, 40, 5, 7),
  grape: [[38, 34], [62, 34], [50, 48], [26, 48], [74, 48], [38, 62], [62, 62], [50, 76]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="12" fill="${P.purple}"/>`).join('') + `<path d="M50 24 V8" stroke="${P.brownD}" stroke-width="5" stroke-linecap="round"/><path d="M52 14 C62 6 74 8 76 14 C68 20 58 20 52 14Z" fill="${P.greenL}"/>` + hl(34, 30, 3, 4),
  cup: `<path d="M22 24 H78 L70 88 H30 Z" fill="#DCEBFF"/><path d="M26 44 H74 L70 88 H30 Z" fill="#4FA3F7"/><rect x="18" y="18" width="64" height="10" rx="5" fill="${P.gray}"/>`,
  cup_empty: `<path d="M22 24 H78 L70 88 H30 Z" fill="#DCEBFF"/><rect x="18" y="18" width="64" height="10" rx="5" fill="${P.gray}"/>`,
  capsule: `<rect x="34" y="10" width="32" height="80" rx="16" fill="${R}"/><path d="M34 50 H66 V74 A16 16 0 0 1 34 74 Z" fill="${W}"/>${hl(44, 28, 4, 8)}`,
  cookie: `<circle cx="50" cy="50" r="38" fill="#D9A066"/>` + [[36, 36], [60, 32], [44, 58], [66, 56], [52, 74], [30, 62]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="#6B4226"/>`).join(''),
  candy: `<path d="M30 50 L10 34 L12 66Z M70 50 L90 34 L88 66Z" fill="${P.pink}"/><circle cx="50" cy="50" r="22" fill="${R}"/><path d="M36 42 Q50 36 64 42" stroke="${W}" stroke-width="5" fill="none" opacity=".6"/>`,
  stamp: `<rect x="16" y="16" width="68" height="68" fill="${W}" stroke="#E2DACB" stroke-width="5" stroke-dasharray="6 5"/><rect x="26" y="26" width="48" height="48" fill="${P.skyL}"/><circle cx="50" cy="46" r="10" fill="${Y}"/><path d="M26 74 L42 56 L54 66 L62 58 L74 70 V74Z" fill="${P.greenL}"/>`,
  crayon: `<g transform="rotate(-35 50 50)"><rect x="38" y="20" width="24" height="64" rx="4" fill="${B}"/><path d="M38 20 L50 2 L62 20Z" fill="${B}"/><rect x="38" y="36" width="24" height="6" fill="${P.blueD}"/><rect x="38" y="66" width="24" height="6" fill="${P.blueD}"/></g>`,
  dog: `<ellipse cx="22" cy="44" rx="11" ry="22" fill="${P.brownD}" transform="rotate(15 22 44)"/><ellipse cx="78" cy="44" rx="11" ry="22" fill="${P.brownD}" transform="rotate(-15 78 44)"/><circle cx="50" cy="52" r="30" fill="#E3B47C"/><ellipse cx="50" cy="66" rx="16" ry="12" fill="${P.cream}"/><circle cx="39" cy="46" r="5" fill="${INK}"/><circle cx="61" cy="46" r="5" fill="${INK}"/><ellipse cx="50" cy="60" rx="7" ry="5" fill="${INK}"/><path d="M50 65 V70 M44 72 Q50 76 56 72" stroke="${INK}" stroke-width="2.5" fill="none" stroke-linecap="round"/>`,
  egg: `<path d="M50 10 C26 10 16 50 18 66 C20 84 34 92 50 92 C66 92 80 84 82 66 C84 50 74 10 50 10Z" fill="#FFF4DD"/><path d="M50 10 C26 10 16 50 18 66 C20 84 34 92 50 92" fill="none" stroke="#EBDDBF" stroke-width="4"/>${hl(36, 36, 5, 9)}`,
  banana: `<path d="M14 30 C18 70 52 92 88 74 C84 70 82 68 80 66 C52 78 30 60 26 28 Z" fill="${Y}"/><path d="M14 30 L20 22 L26 28Z" fill="#7A4A2A"/>`,
  orange: `<circle cx="50" cy="54" r="34" fill="#F7931E"/><path d="M50 20 C50 14 52 10 56 8" stroke="#7A4A2A" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M52 18 C60 8 74 10 76 16 C68 22 58 22 52 18Z" fill="${G}"/>${hl(36, 42)}`,
  strawberry: `<path d="M50 90 C24 74 14 52 20 38 C26 26 40 28 50 32 C60 28 74 26 80 38 C86 52 76 74 50 90Z" fill="${R}"/><path d="M30 30 L40 18 L50 28 L60 18 L70 30 C60 36 40 36 30 30Z" fill="${G}"/>` + [[36, 48], [56, 46], [46, 60], [64, 60], [40, 72], [56, 74]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="2" ry="3" fill="${P.cream}"/>`).join(''),
  balloon: `<ellipse cx="50" cy="40" rx="28" ry="32" fill="${R}"/><path d="M46 72 L54 72 L50 78Z" fill="${R}"/><path d="M50 78 C44 86 56 90 50 98" stroke="${INK}" stroke-width="2" fill="none"/>${hl(40, 28, 6, 10)}`,
  car: `<path d="M10 62 L18 44 C22 36 28 32 36 32 H62 C70 32 76 36 80 44 L90 62 V72 H10Z" fill="${R}"/><path d="M28 46 L34 38 H48 V48 H26Z M54 38 H64 L72 48 H54Z" fill="${P.skyL}"/><circle cx="30" cy="74" r="10" fill="${INK}"/><circle cx="70" cy="74" r="10" fill="${INK}"/><circle cx="30" cy="74" r="4" fill="${P.gray}"/><circle cx="70" cy="74" r="4" fill="${P.gray}"/>`,
  coin: `<circle cx="50" cy="50" r="36" fill="${Y}"/><circle cx="50" cy="50" r="28" fill="none" stroke="${YD}" stroke-width="4"/>`,
  plate: `<ellipse cx="50" cy="60" rx="44" ry="26" fill="#D9D0BE"/><ellipse cx="50" cy="56" rx="44" ry="26" fill="#F3EEE4"/><ellipse cx="50" cy="56" rx="30" ry="17" fill="#FFFFFF"/><ellipse cx="50" cy="58" rx="30" ry="15" fill="none" stroke="#E6DFD1" stroke-width="2"/>`,
  page: `<rect x="20" y="10" width="60" height="80" rx="6" fill="${W}" stroke="#E2DACB" stroke-width="4"/><path d="M30 30 H70 M30 44 H70 M30 58 H60" stroke="#E6DFD1" stroke-width="4" stroke-linecap="round"/>`,
  chair: `<rect x="26" y="14" width="48" height="40" rx="8" fill="${BR}"/><rect x="20" y="52" width="60" height="12" rx="5" fill="${P.brownD}"/><rect x="24" y="62" width="8" height="28" rx="3" fill="${P.brownD}"/><rect x="68" y="62" width="8" height="28" rx="3" fill="${P.brownD}"/>`,
  bag: `<path d="M24 34 H76 L84 88 H16Z" fill="${P.cream}"/><path d="M38 34 C38 18 62 18 62 34" stroke="${P.brownD}" stroke-width="5" fill="none"/>`,
  marble: `<circle cx="50" cy="50" r="30" fill="#4FA3F7"/><path d="M30 46 C42 36 56 60 70 50" stroke="${W}" stroke-width="5" fill="none" opacity=".6"/>${hl(40, 38, 6, 6)}`,
  hand: `<rect x="24.5" y="16" width="11" height="40" rx="5.5" fill="${P.skin}" transform="rotate(-14 30 50)"/><rect x="37.5" y="12" width="11" height="40" rx="5.5" fill="${P.skin}" transform="rotate(-5 43 46)"/><rect x="51.5" y="12" width="11" height="40" rx="5.5" fill="${P.skin}" transform="rotate(5 57 46)"/><rect x="64.5" y="16" width="11" height="40" rx="5.5" fill="${P.skin}" transform="rotate(14 70 50)"/><rect x="16" y="50" width="12" height="36" rx="6" fill="${P.skin}" transform="rotate(-40 24 80)"/><path d="M24 50 H76 V72 C76 86 66 94 50 94 C34 94 24 86 24 72Z" fill="${P.skin}"/>`,
  wheel: `<circle cx="50" cy="50" r="40" fill="${INK}"/><circle cx="50" cy="50" r="22" fill="${P.gray}"/><circle cx="50" cy="50" r="7" fill="${INK}"/>` + [0, 60, 120].map(a => `<rect x="48" y="30" width="4" height="40" fill="${INK}" transform="rotate(${a} 50 50)"/>`).join(''),
  dice: `<rect x="14" y="14" width="72" height="72" rx="14" fill="${W}" stroke="#E2DACB" stroke-width="5"/>` + [[32, 32], [68, 32], [50, 50], [32, 68], [68, 68]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" fill="${INK}"/>`).join(''),
  ribbon: `<rect x="4" y="40" width="92" height="20" rx="4" fill="${R}"/><path d="M4 40 L12 50 L4 60Z" fill="${P.redD}"/>`,
  ruler_icon: `<rect x="6" y="34" width="88" height="32" rx="4" fill="${Y}"/>` + [14, 26, 38, 50, 62, 74, 86].map((x, i) => `<rect x="${x - 1}" y="34" width="2" height="${i % 2 ? 9 : 15}" fill="${INK}"/>`).join(''),
  eraser: `<rect x="14" y="34" width="72" height="32" rx="8" fill="${P.pink}"/><rect x="58" y="34" width="28" height="32" rx="8" fill="#5B9BF5"/>`,
  moon: `<path d="M64 14 C36 16 20 40 26 64 C32 86 60 94 80 80 C54 80 40 56 50 34 C54 24 58 18 64 14Z" fill="${Y}"/>`,
  // vocabulary (Hebrew K / English oral)
  camel: `<path d="M18 52 C22 30 34 30 40 42 C46 26 60 26 64 44 L64 64 H18Z" fill="#D9A066"/><path d="M62 48 C68 42 70 26 76 20 C80 16 88 18 88 24 C84 28 80 28 78 34 L74 56Z" fill="#D9A066"/><circle cx="83" cy="22" r="2" fill="${INK}"/>` + [22, 32, 52, 60].map(x => `<rect x="${x}" y="60" width="6" height="30" rx="3" fill="#B98250"/>`).join(''),
  sheep: [[30, 40], [48, 34], [66, 40], [24, 56], [70, 56], [38, 64], [56, 64], [48, 50]].map(([x, y]) => `<circle cx="${x}" cy="${y + 2}" r="15" fill="#D9D0BE"/>`).join('') + [[30, 40], [48, 34], [66, 40], [24, 56], [70, 56], [38, 64], [56, 64], [48, 50]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="15" fill="#F7F3EA"/>`).join('') + [32, 44, 56, 66].map(x => `<rect x="${x}" y="70" width="6" height="20" rx="3" fill="${INK}"/>`).join('') + `<ellipse cx="78" cy="46" rx="12" ry="14" fill="${INK}"/><ellipse cx="70" cy="38" rx="6" ry="3.5" fill="${INK}" transform="rotate(-30 70 38)"/><circle cx="82" cy="44" r="2.6" fill="#fff"/>`,
  cow: `<rect x="14" y="36" width="62" height="36" rx="16" fill="${W}" stroke="#E6DFD1" stroke-width="2"/><ellipse cx="34" cy="48" rx="9" ry="7" fill="${INK}"/><ellipse cx="58" cy="60" rx="8" ry="6" fill="${INK}"/><ellipse cx="80" cy="44" rx="13" ry="15" fill="${W}" stroke="#E6DFD1" stroke-width="2"/><ellipse cx="82" cy="54" rx="10" ry="7" fill="${P.pink}"/><circle cx="78" cy="40" r="2.5" fill="${INK}"/>` + [20, 32, 56, 66].map(x => `<rect x="${x}" y="68" width="7" height="22" rx="3" fill="${INK}"/>`).join(''),
  horse: `<rect x="16" y="40" width="56" height="28" rx="14" fill="${P.brownD}"/><path d="M62 46 L72 18 C76 12 86 14 88 22 L84 36 C78 38 76 44 74 52Z" fill="${P.brownD}"/><path d="M70 18 C66 26 64 34 62 44" stroke="${INK}" stroke-width="6" fill="none"/><circle cx="80" cy="22" r="2.4" fill="${INK}"/>` + [20, 30, 54, 64].map(x => `<rect x="${x}" y="64" width="7" height="26" rx="3" fill="${P.brownD}"/>`).join('') + `<path d="M16 46 C6 50 6 62 10 70" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/>`,
  lion: [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(a => `<circle cx="50" cy="20" r="13" fill="#E08A2E" transform="rotate(${a} 50 50)"/>`).join('') + `<circle cx="50" cy="50" r="26" fill="${Y}"/><circle cx="41" cy="46" r="3.5" fill="${INK}"/><circle cx="59" cy="46" r="3.5" fill="${INK}"/><path d="M46 56 H54 L50 61Z" fill="${INK}"/>`,
  elephant: `<ellipse cx="46" cy="52" rx="34" ry="26" fill="#9AA6BD"/><ellipse cx="72" cy="40" rx="16" ry="20" fill="#B5BFD2"/><path d="M80 50 C88 62 86 76 78 84" stroke="#9AA6BD" stroke-width="9" fill="none" stroke-linecap="round"/><circle cx="76" cy="40" r="3" fill="${INK}"/>` + [20, 32, 52, 62].map(x => `<rect x="${x}" y="70" width="9" height="20" rx="4" fill="#9AA6BD"/>`).join(''),
  rabbit: `<ellipse cx="40" cy="18" rx="7" ry="18" fill="#E9E4DA"/><ellipse cx="60" cy="18" rx="7" ry="18" fill="#E9E4DA"/><circle cx="50" cy="46" r="20" fill="#E9E4DA"/><ellipse cx="50" cy="76" rx="24" ry="18" fill="#E9E4DA"/><circle cx="43" cy="44" r="3" fill="${INK}"/><circle cx="57" cy="44" r="3" fill="${INK}"/><circle cx="50" cy="52" r="3" fill="${P.pink}"/>`,
  mouse: `<circle cx="30" cy="34" r="14" fill="#B5BFD2"/><circle cx="70" cy="34" r="14" fill="#B5BFD2"/><circle cx="30" cy="34" r="7" fill="${P.pink}"/><circle cx="70" cy="34" r="7" fill="${P.pink}"/><ellipse cx="50" cy="58" rx="26" ry="24" fill="#B5BFD2"/><circle cx="42" cy="54" r="3" fill="${INK}"/><circle cx="58" cy="54" r="3" fill="${INK}"/><circle cx="50" cy="66" r="4" fill="${P.pink}"/>`,
  hat: `<ellipse cx="50" cy="70" rx="42" ry="10" fill="${B}"/><path d="M26 70 C26 34 74 34 74 70Z" fill="${B}"/><rect x="26" y="58" width="48" height="8" fill="${Y}"/>`,
  shirt: `<path d="M34 14 L14 26 L22 44 L30 40 V88 H70 V40 L78 44 L86 26 L66 14 C62 22 38 22 34 14Z" fill="${G}"/>`,
  shoe: `<path d="M10 70 V54 C10 48 16 44 22 46 L46 52 C56 54 70 56 82 60 C90 62 92 70 90 74 H10Z" fill="${R}"/><rect x="10" y="72" width="82" height="8" rx="3" fill="${INK}"/>`,
  dress: `<path d="M38 12 H62 L66 34 L84 88 H16 L34 34Z" fill="${P.pink}"/><rect x="34" y="32" width="32" height="6" fill="${R}"/>`,
  bread: `<path d="M14 50 C14 30 86 30 86 50 C86 56 80 56 80 60 V82 H20 V60 C20 56 14 56 14 50Z" fill="#D9A066"/><path d="M30 44 L38 36 M46 44 L54 36 M62 44 L70 36" stroke="#B57A3C" stroke-width="4" stroke-linecap="round"/>`,
  milk: `<path d="M30 30 L40 12 H60 L70 30 V90 H30Z" fill="${W}" stroke="#E6DFD1" stroke-width="3"/><rect x="30" y="46" width="40" height="24" fill="#5B9BF5"/><path d="M40 12 H60 V6 H40Z" fill="${B}"/>`,
};

export const ICON_ALIASES = { kid: 'child', flowers: 'flower', children: 'child', stars: 'star', capsules: 'capsule', glass: 'cup' };

export function iconInner(name) {
  const k = ICON_ALIASES[name] || name;
  return ICONS[k] || ICONS.star;
}

/** A standalone SVG for one icon (for <img> or inline use). */
export function iconSvg(name, size = 100, label) {
  const a = label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"';
  return `<svg xmlns="http://www.w3.org/2000/svg" ${a} width="${size}" height="${size}" viewBox="0 0 100 100">${iconInner(name)}</svg>`;
}
