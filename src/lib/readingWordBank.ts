// Closed word banks for the earliest niqqud levels. At these levels natural
// Hebrew is very hard to write freely, so — like published decodable readers —
// every word the child reads must come from this list (with a prefix such as
// הַ / בַּ / לַ, and at level 2 also וְ / בְּ / לְ / כְּ). Each word carries its
// standard dictionary niqqud. To extend a level, add words here.

// Level 1 follows published first readers (e.g. "גָּד זָכָה בַּ…", "בַּקָּשָׁה לַשָּׁנָה
// הַחֲדָשָׁה"): only "a" sounds, and every word ENDS on an open "a" — a silent א/ה
// (סַבָּא, מַתָּנָה) or a final letter carrying the vowel (שָׁמַע, בַּ). No word ends
// on a bare consonant, so the child never has to sound out a final letter without
// a vowel. The one exception is the hero's name (גָּד), as in those books.
const L1_NAMES_CLOSED = ['גָּד']
const L1 = [
  // people (names) — mostly from Oran's list of level-1 words
  'אַבָּא', 'סַבָּא', 'חַנָּה', 'דָּנָה', 'הֲדַסָּה', 'שָׂרָה', 'רָנָה', 'נַעֲמָה', 'לָנָה', 'אַיָּלָה', ...L1_NAMES_CLOSED,
  // things
  'מַתָּנָה', 'בָּנָנָה', 'מַפָּה', 'מַצָּה', 'חַלָּה', 'כַּלָּה', 'שָׁנָה', 'שָׁעָה', 'פָּרָה', 'גַּנָּה', 'בָּמָה', 'סַפָּה', 'עֲגָלָה', 'בַּקָּשָׁה', 'צָבָא', 'אַהֲבָה',
  'צָרָה', 'אֲדָמָה', 'גָּדָה', 'מָנָה', 'אַוָּזָה', 'סַכָּנָה', 'חֲזָרָה', 'חַסָּה', 'רָמָה',
  // describing (she / it)
  'יָפָה', 'נָאָה', 'חֲדָשָׁה', 'חַמָּה', 'קָרָה', 'רַכָּה', 'קָשָׁה', 'רַעֲנַנָּה',
  // doing — he
  'בָּא', 'קָנָה', 'שָׁתָה', 'רָאָה', 'קָרָא', 'מָצָא', 'זָכָה', 'עָלָה', 'בָּנָה', 'עָנָה', 'הָיָה', 'שָׂחָה', 'רָצָה', 'נָמָה', 'מָנָה', 'שָׁמַע', 'יָדַע',
  // doing — she
  'בָּאָה', 'נָחָה', 'שָׁרָה', 'קָמָה', 'שָׂמָה', 'לָנָה', 'שָׁטָה', 'צָחֲקָה', 'שָׁאֲלָה', 'לָחֲשָׁה', 'רָאֲתָה', 'אָהֲבָה', 'פָּחֲדָה', 'טָעֲמָה', 'כָּעֲסָה', 'טָעֲתָה',
  // calls & little words
  'גַּע', 'מָה', 'מַה', 'לָמָּה', 'כַּמָּה', 'שָׁמָּה', 'כָּכָה', 'אַתָּה',
]
const L1_OLD = [
  'דָּן', 'דָּג', 'יָד', 'גַּן', 'סַל', 'כַּד', 'כַּף', 'צָב', 'גָּמָל', 'עָנָן', 'חַג', 'בַּת', 'דַּף', 'פַּח', 'יָם', 'חָלָב', 'קַשׁ', 'שַׁבָּת', 'נָחָשׁ', 'גַּל', 'קַן', 'חָתָן',
  'קָטָן', 'חַם', 'קַר', 'רַךְ', 'לָבָן', 'רָץ', 'נָח', 'שָׁר', 'קָם', 'שָׂם', 'טָס', 'שָׁט', 'אָכַל', 'נָתַן', 'צָחַק', 'גָּדַל', 'יָשַׁב', 'הָלַךְ', 'כָּתַב', 'סָגַר', 'נָפַל', 'קָפַץ', 'שָׁכַב', 'אָהַב', 'שָׁם', 'עַל', 'אָז', 'כָּךְ', 'אַחַת', 'שָׁלָם',
]
const L2 = [
  ...L1, ...L1_OLD,
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
  if (level === 1) always.clear()
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

const VOWEL_A = /[ֲַָ]/
/** level 1: words that end on a bare consonant (no "a" after the last letter) */
export function closedEndings(level: number, lines: string[]): string[] {
  if (level !== 1) return []
  const names = new Set(L1_NAMES_CLOSED.map(norm))
  const bad = new Set<string>()
  for (const line of lines) {
    for (const raw of line.split(/[\s.,!?:;"׳״()\-–]+/).filter(Boolean)) {
      if (!/[א-ת]/.test(raw)) continue
      const w = raw.normalize('NFC')
      if (names.has(norm(w))) continue
      // last letter and the marks after it
      const m = w.match(/([א-ת])([\u0591-\u05C7]*)$/)
      if (!m) continue
      const [, letter, marks] = m
      if (VOWEL_A.test(marks)) continue                 // שָׁמַע, בַּ, לָ
      if ((letter === 'א' || letter === 'ה' || letter === 'ע') && !/[ּ\u05B0-\u05BB]/.test(marks)) continue // silent א/ה/ע (סַבָּא, קָנָה, שָׁמַע)
      bad.add(raw)
    }
  }
  return [...bad]
}

/** extra writing rules for a level with a closed bank */
export function bankRules(level: number): string {
  if (level === 1) return 'LEVEL 1 RULE, as in published first readers: every word ENDS on an open "a" sound — a silent א or ה (סַבָּא, מַתָּנָה, קָנָה) a silent final ע (שָׁמַע, יָדַע), or a lone prefix before a picture (בַּ[[book]]). Words like שָׂמַח, לָקַח, גַּן, דָּן end on a sounded consonant and are NOT allowed. No word may end on a bare consonant. The only exception is the hero גָּד. Use NO other words (no הוּא, הִיא, אֶת, לֹא…). Grammar: verbs about a girl or woman (חַנָּה, דָּנָה, הֲדַסָּה, שָׂרָה, רָנָה, נַעֲמָה, לָנָה, אַיָּלָה, הָאַוָּזָה, הַפָּרָה) may only be the "she" verbs: בָּאָה, נָחָה, שָׁרָה, קָמָה, שָׂמָה, לָנָה, שָׁטָה, רָצָה (ran), צָחֲקָה, שָׁאֲלָה, לָחֲשָׁה, רָאֲתָה, אָהֲבָה, פָּחֲדָה, טָעֲמָה, כָּעֲסָה, טָעֲתָה; the "he" verbs need גָּד, אַבָּא or סַבָּא. The describing words are feminine, so they describe feminine nouns (הַמַּצָּה קָשָׁה, הַחַסָּה רַעֲנַנָּה, הָעֲגָלָה יָפָה). A name never takes הַ/לַ/בַּ. Repetition is good and natural at this level ("סַבָּא בָּא! סַבָּא בָּא!"). A picture token with a prefix is great for things the child cannot read ("גָּד קָרָא בַּ[[book]]."). Objects are indefinite ("סַבָּא קָנָה מַתָּנָה", never "רָאָה סַבָּא" — that would need אֶת, which this level cannot use). Verbs are past tense only; the one call allowed is "גַּע!" (touch!). QUESTIONS at this level are only of the form "מָה [name] [verb]?" or "מָה בַּ…?" (מָה סַבָּא קָנָה? → מַתָּנָה), or a sentence to finish ("הַמַּתָּנָה…" → יָפָה); the options are things or describing words from the story, and the answer is written in the story.'
  if (level === 2) return 'Grammar: verbs agree with the subject in gender (a girl: אָכְלָה, הָלְכָה, יָשְׁבָה…). A name never takes הַ/בַּ; "to Dan" is לְדָן. Every question must have its answer stated in the story.'
  return ''
}
