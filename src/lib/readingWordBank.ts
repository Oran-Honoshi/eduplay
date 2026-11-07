// Closed word banks for the earliest niqqud levels. At these levels natural
// Hebrew is very hard to write freely, so — like published decodable readers —
// every word the child reads must come from this list (with a prefix such as
// הַ / בַּ / לַ, and at level 2 also וְ / בְּ / לְ / כְּ). Each word carries its
// standard dictionary niqqud. To extend a level, add words here.

const L1 = [
  // people
  'אַבָּא', 'סַבָּא', 'דָּן', 'טַל', 'חַנָּה', 'גַּד',
  // things & animals
  'דָּג', 'יָד', 'גַּן', 'סַל', 'כַּד', 'כַּף', 'צָב', 'גָּמָל', 'בָּנָנָה', 'עָנָן', 'חַג', 'בַּת', 'דַּף', 'פַּח', 'יָם', 'חָלָב', 'קַשׁ', 'שַׁבָּת', 'מַפָּה', 'חַלָּה', 'נָחָשׁ', 'גַּל', 'קַן', 'שָׁעָה', 'חָתָן', 'כַּלָּה', 'מַתָּנָה', 'שָׁנָה', 'פָּרָה',
  // describing
  'קָטָן', 'חַם', 'קַר', 'רַךְ', 'לָבָן',
  // doing (he / she)
  'בָּא', 'בָּאָה', 'רָץ', 'רָצָה', 'נָח', 'נָחָה', 'שָׁר', 'שָׁרָה', 'קָם', 'קָמָה', 'שָׂם', 'שָׂמָה', 'טָס', 'שָׁט', 'שָׂחָה', 'אָכַל', 'שָׁתָה', 'לָקַח', 'נָתַן', 'רָאָה', 'שָׂמַח', 'צָחַק', 'גָּדַל', 'יָשַׁב', 'הָלַךְ', 'קָרָא', 'כָּתַב', 'פָּתַח', 'סָגַר', 'נָפַל', 'קָפַץ', 'שָׁכַב', 'אָהַב',
  // little words
  'מָה', 'מַה', 'שָׁם', 'עַל', 'אָז', 'הָיָה', 'כָּךְ', 'אַחַת', 'שָׁלָם',
]
const L2 = [
  ...L1,
  'יַלְדָּה', 'סַבְתָּא', 'אַרְנָב', 'כַּלְבָּה', 'קַלְמָר', 'דְּבַשׁ', 'בְּרָק', 'כְּבָר', 'בְּבַקָּשָׁה',
  'אָכְלָה', 'שָׁתְתָה', 'יָשְׁבָה', 'הָלְכָה', 'רָקְדָה', 'רָקַד', 'שָׂמְחָה', 'גָּדְלָה', 'כָּתְבָה', 'לָמְדָה', 'לָמַד', 'קָרְאָה', 'לָקְחָה', 'נָתְנָה', 'פָּתְחָה', 'סָגְרָה', 'נָפְלָה', 'קָפְצָה', 'שָׁכְבָה', 'הָיְתָה',
]

const BANKS: Record<number, string[]> = { 1: L1, 2: L2 }
const PREFIXES: Record<number, string[]> = {
  1: ['הַ', 'הָ', 'בַּ', 'בָּ', 'לַ', 'לָ', 'כַּ'],
  2: ['הַ', 'הָ', 'בַּ', 'בָּ', 'לַ', 'לָ', 'כַּ', 'וְ', 'בְּ', 'לְ', 'כְּ'],
}

// compare without dagesh / meteg / shin-sin dots, so הַ+סַל = הַסַּל matches
const norm = (w: string) => w.normalize('NFC').replace(/[ּֽׁׂ]/g, '')

export function wordBank(level: number): string[] | null { return BANKS[level] || null }

/** words (after stripping punctuation) that are not in the level's bank */
export function outsideBank(level: number, lines: string[]): string[] {
  const bank = BANKS[level]
  if (!bank) return []
  const set = new Set(bank.map(norm))
  const pre = (PREFIXES[level] || []).map(norm)
  const always = new Set(['אֶת', 'שֶׁל', 'הוּא', 'הִיא', 'לֹא', 'זֶה', 'זֹאת', 'יֵשׁ', 'אֵין', 'גַּם', 'רַק', 'כָּל', 'אֵיפֹה', 'כֵּן', 'עוֹד'].map(norm))
  const bad = new Set<string>()
  for (const line of lines) {
    for (const raw of line.split(/[\s.,!?:;"׳״()\-–]+/).filter(Boolean)) {
      if (!/[א-ת]/.test(raw)) continue
      const w = norm(raw)
      if (set.has(w) || always.has(w)) continue
      if (pre.some(p => w.startsWith(p) && (set.has(w.slice(p.length)) || always.has(w.slice(p.length))))) continue
      bad.add(raw)
    }
  }
  return [...bad]
}
