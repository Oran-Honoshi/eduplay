// ─── Early-reading booklets (Hebrew niqqud levels) ─────────────
// One booklet = 10–12 printable pages that build up: syllables → words →
// sentences → a short story, with activities tied to what the child read
// (match word to picture, circle the right word, connect the dots, read &
// draw, read & color). Everything the CHILD reads is fully pointed and uses
// only the niqqud of its level (checked by checkNiqqudDecodability);
// instructions are for the adult and are not limited.

import { checkNiqqudDecodability } from '@/lib/readingDecodability'
import { PICTURE_KEYS, DOT_KEYS } from '@/lib/readingPictures'

export type BookletPage =
  | { type: 'syllables'; title: string; instructions?: string; rows: string[][] }
  | { type: 'words'; title: string; instructions?: string; words: { he: string; picture?: string }[] }
  | { type: 'match'; title: string; instructions?: string; pairs: { he: string; picture: string }[] }
  | { type: 'circle'; title: string; instructions?: string; items: { picture: string; options: string[]; answer: string }[] }
  | { type: 'sentences'; title: string; instructions?: string; sentences: string[] }
  | { type: 'story'; title: string; instructions?: string; story_title: string; paragraphs: string[]; picture?: string }
  | { type: 'questions'; title: string; instructions?: string; items: { q: string; options: string[]; answer: string }[] }
  | { type: 'dots'; title: string; instructions?: string; shape: string; caption: string }
  | { type: 'draw'; title: string; instructions?: string; sentence: string }
  | { type: 'color'; title: string; instructions?: string; picture: string; sentence: string }

export const LEVEL_GUIDE: Record<number, { marks: string; examples: string }> = {
  1: { marks: 'קָמָץ (ָ) and פַּתָּח (ַ) only — no other vowel sign at all (no שְׁוָא, no חִירִיק, no חוֹלָם, no שׁוּרוּק). Dagesh and the שׁ/שׂ dot are fine.', examples: 'אַבָּא, סַבָּא, דָּג, גַּן, יָד, בַּת, חַג, שַׁבָּת, מַפָּה, גָּמָל, פַּח, דַּף, כַּף, חָם, קַר, רַץ, בָּא, נָח, טַל, סַל, חָלָב, צָב' },
  2: { marks: 'קָמָץ, פַּתָּח and שְׁוָא (ְ) only.', examples: 'כְּתַב, שְׁמַע, גְּדַל, בְּרָק, סְפָרַד, דְּבַשׁ, כְּבָר, בְּבַקָּשָׁה, מַחְבָּר' },
  3: { marks: 'קָמָץ, פַּתָּח, שְׁוָא and חִירִיק (ִ) only.', examples: 'אִמָּא, דִּיר, שִׁיר, גִּיל, יַלְדָּה, סִפְרִי, כִּתָּה, תִּיק, פִּיל' },
  4: { marks: 'קָמָץ, פַּתָּח, שְׁוָא, חִירִיק and חוֹלָם (ֹ / וֹ) only.', examples: 'שָׁלוֹם, חֹם, טוֹב, יוֹם, דּוֹד, סוֹס, גָּדוֹל, קֹר' },
  5: { marks: 'קָמָץ, פַּתָּח, שְׁוָא, חִירִיק and חוֹלָם only (review).', examples: 'שָׁלוֹם, יוֹם טוֹב, אִמָּא, פִּיל גָּדוֹל' },
  6: { marks: 'all of the above plus צֵירֵי (ֵ) and סֶגּוֹל (ֶ).', examples: 'יֶלֶד, סֵפֶר, בֵּית, שֶׁמֶשׁ, עֵץ, כֶּלֶב' },
  7: { marks: 'all of the above plus צֵירֵי and סֶגּוֹל (review).', examples: 'יֶלֶד, סֵפֶר, עֵץ, כֶּלֶב' },
  8: { marks: 'all of the above plus שׁוּרוּק (וּ) and קֻבּוּץ (ֻ).', examples: 'שׁוּק, כַּדּוּר, סֻכָּה, תּוּת, דֻּבִּי' },
  9: { marks: 'all of the above plus שׁוּרוּק and קֻבּוּץ (review).', examples: 'כַּדּוּר, תּוּת, סֻכָּה' },
  10: { marks: 'all niqqud signs.', examples: 'any everyday words' },
}

export function bookletPrompt(level: { level_number: number; label_he: string }, theme: string | null, avoidTitles: string[], pictureHint: string, dotsHint: string) {
  const g = LEVEL_GUIDE[level.level_number] || LEVEL_GUIDE[10]
  return `You write a printable early-reading booklet (חוברת קריאה) for an Israeli child in kindergarten or first grade, at niqqud level ${level.level_number}: "${level.label_he}".
STRICT RULE for every word the CHILD reads (syllables, words, sentences, story, options, captions): full niqqud on every letter that needs a vowel, using ONLY these vowel signs: ${g.marks}
Good words at this level, for example: ${g.examples}. Before writing a word, check each vowel sign in it; if a natural word needs another sign, choose a different word. Short, simple, everyday words and sentences; a little humor is welcome. Correct Hebrew and correct niqqud only.
The fields "title" and "instructions" are read by the ADULT — plain Hebrew without niqqud, short and friendly (e.g. "קראו את ההברות", "מתחו קו מהמילה לתמונה").
${theme ? `Theme of the booklet: ${theme}.` : 'Pick one warm everyday theme (family, the park, animals, the sea, a holiday, the kitchen…).'}${avoidTitles.length ? ` Booklets that already exist at this level (choose a different theme and different words): ${avoidTitles.join('; ')}.` : ''}
Pictures you may use (key and its meaning): ${pictureHint}. Use a picture only where the Hebrew word you write means exactly that thing.
Connect-the-dots shapes: ${dotsHint}.
Write 10 to 12 pages that build up, in this order, using these page types:
1. "syllables": 4–5 rows of 4–6 syllables (letters + this level's vowels), from the letters used later in the booklet.
2. "words": 8–10 words (with a picture key when one fits).
3. "match": 4–5 words, each with its picture — the child draws a line from the word to the picture.
4. "circle": 4 items — a picture and 3 similar-looking words; answer = the right one.
5. "sentences": 5–6 short sentences (2–5 words each) built only from words of this level.
6. "story": a short story (3–4 short paragraphs, 2–3 sentences each) with "story_title"; optional "picture".
7. "questions": 3–4 questions about the story; options are 2–3 short answers taken from the story (all pointed, this level only); "answer" = the right option.
8. "dots": a connect-the-dots shape linked to the story, with a one-line "caption" the child reads (pointed).
9. "draw": one sentence from the story's world to read and draw (very easy to draw).
10. "color": a picture key and a sentence about it to read, then color the picture.
You may repeat a type once (e.g. a second "words" or "sentences" page) if it helps the progression.
OUTPUT JSON only: {"title_he":"short booklet title (pointed, this level)","theme_he":"plain Hebrew theme","pages":[...]} with each page exactly one of:
{"type":"syllables","title":"…","instructions":"…","rows":[["…","…"]]}
{"type":"words","title":"…","instructions":"…","words":[{"he":"…","picture":"key"|null}]}
{"type":"match","title":"…","instructions":"…","pairs":[{"he":"…","picture":"key"}]}
{"type":"circle","title":"…","instructions":"…","items":[{"picture":"key","options":["…","…","…"],"answer":"…"}]}
{"type":"sentences","title":"…","instructions":"…","sentences":["…"]}
{"type":"story","title":"…","instructions":"…","story_title":"…","paragraphs":["…"],"picture":"key"|null}
{"type":"questions","title":"…","instructions":"…","items":[{"q":"…","options":["…","…"],"answer":"…"}]}
{"type":"dots","title":"…","instructions":"…","shape":"key","caption":"…"}
{"type":"draw","title":"…","instructions":"…","sentence":"…"}
{"type":"color","title":"…","instructions":"…","picture":"key","sentence":"…"}`
}

const str = (x: any, n = 300) => (typeof x === 'string' ? x.trim().slice(0, n) : '')
const pic = (x: any) => (typeof x === 'string' && PICTURE_KEYS.includes(x) ? x : undefined)

/** keeps only well-formed pages with known pictures / shapes */
export function cleanPages(raw: any): BookletPage[] {
  const out: BookletPage[] = []
  for (const p of Array.isArray(raw) ? raw.slice(0, 16) : []) {
    const base = { title: str(p?.title, 80), instructions: str(p?.instructions, 200) || undefined }
    switch (p?.type) {
      case 'syllables': { const rows = (p.rows || []).map((r: any) => (Array.isArray(r) ? r.map((x: any) => str(x, 12)).filter(Boolean).slice(0, 8) : [])).filter((r: string[]) => r.length).slice(0, 8); if (rows.length) out.push({ type: 'syllables', ...base, rows }); break }
      case 'words': { const words = (p.words || []).map((w: any) => ({ he: str(w?.he, 30), picture: pic(w?.picture) })).filter((w: any) => w.he).slice(0, 14); if (words.length) out.push({ type: 'words', ...base, words }); break }
      case 'match': { const pairs = (p.pairs || []).map((w: any) => ({ he: str(w?.he, 30), picture: pic(w?.picture) })).filter((w: any) => w.he && w.picture).slice(0, 6) as any; if (pairs.length >= 3) out.push({ type: 'match', ...base, pairs }); break }
      case 'circle': { const items = (p.items || []).map((it: any) => ({ picture: pic(it?.picture), options: (it?.options || []).map((o: any) => str(o, 30)).filter(Boolean).slice(0, 4), answer: str(it?.answer, 30) })).filter((it: any) => it.picture && it.options.length >= 2 && it.options.includes(it.answer)).slice(0, 6) as any; if (items.length) out.push({ type: 'circle', ...base, items }); break }
      case 'sentences': { const sentences = (p.sentences || []).map((x: any) => str(x, 120)).filter(Boolean).slice(0, 10); if (sentences.length) out.push({ type: 'sentences', ...base, sentences }); break }
      case 'story': { const paragraphs = (p.paragraphs || []).map((x: any) => str(x, 500)).filter(Boolean).slice(0, 6); if (paragraphs.length) out.push({ type: 'story', ...base, story_title: str(p.story_title, 60), paragraphs, picture: pic(p.picture) }); break }
      case 'questions': { const items = (p.items || []).map((it: any) => ({ q: str(it?.q, 160), options: (it?.options || []).map((o: any) => str(o, 60)).filter(Boolean).slice(0, 4), answer: str(it?.answer, 60) })).filter((it: any) => it.q && it.options.length >= 2).slice(0, 6); if (items.length) out.push({ type: 'questions', ...base, items }); break }
      case 'dots': if (DOT_KEYS.includes(p.shape)) out.push({ type: 'dots', ...base, shape: p.shape, caption: str(p.caption, 120) }); break
      case 'draw': if (str(p.sentence)) out.push({ type: 'draw', ...base, sentence: str(p.sentence, 160) }); break
      case 'color': if (pic(p.picture) && str(p.sentence)) out.push({ type: 'color', ...base, picture: pic(p.picture)!, sentence: str(p.sentence, 160) }); break
    }
  }
  return out
}

/** everything the child reads, page by page */
export function childText(title: string, pages: BookletPage[]): string[] {
  const t: string[] = [title]
  for (const p of pages) {
    if (p.type === 'syllables') t.push(...p.rows.flat())
    if (p.type === 'words') t.push(...p.words.map(w => w.he))
    if (p.type === 'match') t.push(...p.pairs.map(w => w.he))
    if (p.type === 'circle') t.push(...p.items.flatMap(i => i.options))
    if (p.type === 'sentences') t.push(...p.sentences)
    if (p.type === 'story') t.push(p.story_title, ...p.paragraphs)
    if (p.type === 'questions') t.push(...p.items.flatMap(i => [i.q, ...i.options]))
    if (p.type === 'dots') t.push(p.caption)
    if (p.type === 'draw') t.push(p.sentence)
    if (p.type === 'color') t.push(p.sentence)
  }
  return t.filter(Boolean)
}

export function checkBooklet(levelNumber: number, title: string, pages: BookletPage[]) {
  const text = childText(title, pages).join('\n')
  const r = checkNiqqudDecodability(text, Math.min(10, Math.max(1, levelNumber)))
  return { pct: r.pct, total: r.totalWords, bad: [...new Set(r.violatingWords)].slice(0, 60) }
}
