// ─── Early-reading booklets (Hebrew niqqud levels) ─────────────
// One booklet = 10–12 printable pages that build up: syllables → words →
// sentences → a short story, with activities tied to what the child read
// (match word to picture, circle the right word, connect the dots, read &
// draw, read & color). Everything the CHILD reads is fully pointed and uses
// only the niqqud of its level (checked by checkNiqqudDecodability);
// instructions are for the adult and are not limited.

import { checkNiqqudDecodability } from '@/lib/readingDecodability'
import { askClaudeJSON } from '@/lib/claude'
import { outsideBank, wordBank } from '@/lib/readingWordBank'
import { PICTURE_KEYS, DOT_KEYS, pictureWord } from '@/lib/readingPictures'

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
${wordBank(level.level_number) ? `CLOSED WORD BANK: at this level every word the child reads (except the syllables page) must be one of these words, exactly as pointed here, optionally with the prefix ${level.level_number === 1 ? 'הַ/בַּ/לַ (or הָ/בָּ/לָ)' : 'הַ/בַּ/לַ, וְ/בְּ/לְ/כְּ'}, or one of: אֶת, שֶׁל, הוּא, הִיא, לֹא, זֶה, יֵשׁ, אֵין, גַּם, רַק, כָּל, אֵיפֹה. The bank: ${wordBank(level.level_number)!.join(', ')}. Build short, natural, meaningful sentences from these words only (e.g. "דָּן אָכַל בָּנָנָה.", "הַצָּב נָח בַּגַּן.", "אֵיפֹה הַדָּג?").` : `Good words at this level, for example: ${g.examples}.`} Before writing a word, check each vowel sign in it; if a natural word needs another sign, choose a different word.
NEVER change a word's real niqqud to fit the level (כֶּלֶב must never become "כַּלָּב"; if the correct spelling uses other signs, do not use that word). Only real words with their standard dictionary niqqud, and only meaningful, natural sentences — never nonsense words or phrases made up to fit the rule. Short, simple, everyday words and sentences; a little humor is welcome. Correct Hebrew and correct niqqud only.
The fields "title" and "instructions" are read by the ADULT — plain Hebrew without niqqud, short and friendly (e.g. "קראו את ההברות", "מתחו קו מהמילה לתמונה").
${theme ? `Theme of the booklet: ${theme}.` : 'Pick one warm everyday theme (family, the park, animals, the sea, a holiday, the kitchen…).'}${avoidTitles.length ? ` Booklets that already exist at this level (choose a different theme and different words): ${avoidTitles.join('; ')}.` : ''}
Pictures you may use — key and the exact word it shows: ${pictureHint}. A picture goes ONLY with exactly that word (a picture never stands for another word). Words without a picture are fine.
Connect-the-dots shapes: ${dotsHint}.
Write 10 to 12 pages that build up, in this order, using these page types:
1. "syllables": 4–5 rows of 4–6 single syllables — ONE letter with one vowel sign of this level (e.g. בָּ, מַ, דָ${level.level_number >= 2 ? ', בְּ' : ''}${level.level_number >= 3 ? ', פִּי' : ''}), using the letters of the words in this booklet; each row practises one letter or one vowel. Not whole words.
2. "words": 8–10 words (with a picture key when one fits).
3. "match": 4–5 words, each with its picture — the child draws a line from the word to the picture.
4. "circle": 4 items — a picture and 3 DIFFERENT REAL words that look alike (e.g. דָּג / דַּף / גַּן), each correctly pointed; answer = the word for the picture, exactly as listed for that picture key. Never a misspelled or wrongly pointed word as a distractor.
5. "sentences": 5–6 short sentences (2–5 words each) built only from words of this level.
6. "story": a short story (3–4 short paragraphs, 2–3 sentences each) with "story_title"; optional "picture".
7. "questions": 3–4 questions about the story whose answers are clearly in the story; options are 2–3 DIFFERENT short answers taken from the story (all pointed, this level only); "answer" = the right option, true to the story.
8. "dots": a connect-the-dots shape linked to the story, with a one-line "caption" the child reads (pointed).
9. "draw": one sentence from the story's world to read and draw (very easy to draw).
10. "color": a picture key and a sentence that contains that picture's word, to read, then color the picture.
The title is a short phrase about what happens in the story, using only words that appear in it. Check everything once more before answering: every word real with correct niqqud, every answer true to the story, every picture matching its word.
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
const bare = (t: string) => t.replace(/[\u0591-\u05C7]/g, '').replace(/[^\u05D0-\u05EA]/g, '')
/** a picture belongs to a word only if the word IS that thing (ה/ו/ב/ל prefix allowed) */
const picFor = (word: string, key: any) => {
  const k = pic(key); if (!k) return undefined
  const w = bare(word), p = bare(pictureWord(k))
  return w === p || (w.length === p.length + 1 && 'הובלכמש'.includes(w[0]) && w.slice(1) === p) ? k : undefined
}
/** the picture that shows exactly this word, if there is one */
const autoPic = (word: string) => PICTURE_KEYS.find(k => picFor(word, k))
const uniq = (a: string[]) => a.filter((x, i) => a.indexOf(x) === i)

/** keeps only well-formed pages with known pictures / shapes */
export function cleanPages(raw: any): BookletPage[] {
  const out: BookletPage[] = []
  for (const p of Array.isArray(raw) ? raw.slice(0, 16) : []) {
    const base = { title: str(p?.title, 80), instructions: str(p?.instructions, 200) || undefined }
    switch (p?.type) {
      case 'syllables': { const rows = (p.rows || []).map((r: any) => (Array.isArray(r) ? r.map((x: any) => str(x, 12)).filter(Boolean).slice(0, 8) : [])).filter((r: string[]) => r.length).slice(0, 8); if (rows.length) out.push({ type: 'syllables', ...base, rows }); break }
      case 'words': {
        const seen = new Set<string>()
        const words = (p.words || []).map((w: any) => ({ he: str(w?.he, 30), picture: picFor(str(w?.he, 30), w?.picture) || autoPic(str(w?.he, 30)) }))
          .filter((w: any) => w.he && !seen.has(w.he) && seen.add(w.he)).slice(0, 14)
        if (words.length) out.push({ type: 'words', ...base, words }); break
      }
      case 'match': {
        const pairs = (p.pairs || []).map((w: any) => ({ he: str(w?.he, 30), picture: picFor(str(w?.he, 30), w?.picture) || autoPic(str(w?.he, 30)) }))
          .filter((w: any, i: number, a: any[]) => w.he && w.picture && a.findIndex(x => x.picture === w.picture) === i).slice(0, 6) as any
        if (pairs.length >= 3) out.push({ type: 'match', ...base, pairs }); break
      }
      case 'circle': {
        const items = (p.items || []).map((it: any) => ({ picture: pic(it?.picture), options: uniq((it?.options || []).map((o: any) => str(o, 30)).filter(Boolean)).slice(0, 4), answer: str(it?.answer, 30) }))
          .filter((it: any) => it.picture && it.options.length >= 2 && it.options.includes(it.answer) && picFor(it.answer, it.picture)).slice(0, 6) as any
        if (items.length) out.push({ type: 'circle', ...base, items }); break
      }
      case 'sentences': { const sentences = (p.sentences || []).map((x: any) => str(x, 120)).filter(Boolean).slice(0, 10); if (sentences.length) out.push({ type: 'sentences', ...base, sentences }); break }
      case 'story': { const paragraphs = (p.paragraphs || []).map((x: any) => str(x, 500)).filter(Boolean).slice(0, 6); if (paragraphs.length) out.push({ type: 'story', ...base, story_title: str(p.story_title, 60), paragraphs, picture: pic(p.picture) }); break }
      case 'questions': { const items = (p.items || []).map((it: any) => ({ q: str(it?.q, 160), options: uniq((it?.options || []).map((o: any) => str(o, 60)).filter(Boolean)).slice(0, 4), answer: str(it?.answer, 60) })).filter((it: any) => it.q && it.options.length >= 2 && it.options.includes(it.answer)).slice(0, 6); if (items.length) out.push({ type: 'questions', ...base, items }); break }
      case 'dots': if (DOT_KEYS.includes(p.shape)) out.push({ type: 'dots', ...base, shape: p.shape, caption: str(p.caption, 120) }); break
      case 'draw': if (str(p.sentence)) out.push({ type: 'draw', ...base, sentence: str(p.sentence, 160) }); break
      case 'color': if (pic(p.picture) && str(p.sentence) && bare(str(p.sentence, 160)).includes(bare(pictureWord(p.picture)))) out.push({ type: 'color', ...base, picture: pic(p.picture)!, sentence: str(p.sentence, 160) }); break
    }
  }
  return out
}

/** how much content a booklet holds (pages + items), so a fix can never quietly drop any */
export function contentSize(pages: BookletPage[]): number {
  return pages.reduce((a, p: any) => a + 1 + (p.rows?.length || 0) + (p.words?.length || 0) + (p.pairs?.length || 0) + (p.items?.length || 0) + (p.sentences?.length || 0) + (p.paragraphs?.length || 0), 0)
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
  // the earliest levels: words outside the closed bank count too (the syllables page is exempt)
  const offBank = outsideBank(levelNumber, childText(title, pages.filter(p => p.type !== 'syllables')))
  return { pct: r.pct, total: r.totalWords, bad: [...new Set([...r.violatingWords, ...offBank])].slice(0, 60) }
}

/** Replaces every child-read word that breaks the level's niqqud: the model
 * gets each bad word with the exact line it sits in and returns replacements
 * for those lines (small answers, so a few rounds stay fast). */
let lastProofError: string | null = null
/** a second reader: real words, correct standard niqqud, natural sentences */
export async function proofread(lines: string[]): Promise<{ text: string; why: string }[]> {
  const r = await askClaudeJSON<any>({
    system: `You proofread an early-reading booklet for Israeli children (fully pointed Hebrew). Find every problem a careful Hebrew teacher would mark: a word that is not a real Hebrew word, a real word with WRONG niqqud (e.g. "כַּלָּב" instead of "כֶּלֶב", "גָּדָל" instead of "גָּדַל"), or a line that is not natural, meaningful Hebrew. Ignore single syllables (one letter with a vowel). Be strict but do not invent problems.
Output JSON only: {"problems":[{"text":"the exact wrong word or line as written","why":"short Hebrew explanation"}]}`,
    content: lines.map((l, i) => `${i + 1}. ${l}`).join('\n'),
    maxTokens: 2500,
    think: 2500,
  })
  if (!r.ok) { lastProofError = r.error.slice(0, 200); return [] }
  lastProofError = null
  return (Array.isArray(r.data?.problems) ? r.data.problems : [])
    .filter((p: any) => typeof p?.text === 'string' && p.text.trim() && lines.some(l => l.includes(p.text.trim())))
    .map((p: any) => ({ text: p.text.trim(), why: String(p.why || '').slice(0, 120) })).slice(0, 40)
}

export async function repairBooklet(level: { level_number: number; label_he: string }, title: string, pages: BookletPage[], rounds = 4, withProof = true) {
  const g = LEVEL_GUIDE[level.level_number] || LEVEL_GUIDE[10]
  // one repair round: each problem with the exact line it sits in → new lines
  async function fixLines(items: { word: string; problem: string }[]) {
    const lines = childText(title, pages)
    const where = items.map(it => ({ ...it, line: lines.find(l => l.includes(it.word)) || it.word }))
    const fix = await askClaudeJSON<any>({
      system: `You fix an early-reading booklet for Israeli children at niqqud level ${level.level_number} ("${level.label_he}"). Allowed vowel signs: ${g.marks} Good words: ${g.examples}.
${wordBank(level.level_number) ? `Use ONLY words from this closed bank (exactly as pointed, prefixes הַ/בַּ/לַ${level.level_number === 2 ? '/וְ/בְּ/לְ/כְּ' : ''} allowed, plus אֶת, שֶׁל, הוּא, הִיא, לֹא, זֶה, יֵשׁ, אֵין, גַּם, רַק, כָּל, אֵיפֹה): ${wordBank(level.level_number)!.join(', ')}.\n` : ''}Each item below is a problem (a forbidden vowel sign, a word outside the bank, a wrong word, wrong niqqud or an unnatural line) and the exact line it appears in. Rewrite each line so it keeps its meaning as far as possible, is natural, correct Hebrew with correct full niqqud, and uses ONLY the allowed signs — choose different real words when needed (never change a word's correct niqqud to fit the rule). A single-word line gets a single different word that fits the same picture or context. Never shorten or invent a word (קָטָן must never become "קָט"); if no real word fits, rewrite the sentence with other real words. Keep every answer of a question true to the story. Keep lines short.
Output JSON only: {"replace":[{"old":"the exact line as given","new":"the fixed line"}]}`,
      content: JSON.stringify(where),
      maxTokens: 2500,
    })
    if (!fix.ok) return false
    let json = JSON.stringify({ title_he: title, pages })
    let changed = false
    for (const r of Array.isArray(fix.data?.replace) ? fix.data.replace : []) {
      if (typeof r?.old !== 'string' || typeof r?.new !== 'string' || !r.old || r.old === r.new) continue
      const o = JSON.stringify(r.old).slice(1, -1), n = JSON.stringify(r.new).slice(1, -1)
      if (json.includes(o)) { json = json.split(o).join(n); changed = true }
    }
    if (!changed) return false
    try {
      const parsed = JSON.parse(json)
      const next = cleanPages(parsed.pages)
      if (contentSize(next) < contentSize(pages)) return false   // a fix that loses content is not used
      title = String(parsed.title_he || title); pages = next
      return true
    } catch { return false }
  }
  const niqqudItems = () => checkBooklet(level.level_number, title, pages).bad.map(w => ({ word: w, problem: 'forbidden vowel sign or no niqqud' }))

  // 1) niqqud of the level
  for (let r = 0; r < rounds; r++) { const bad = niqqudItems(); if (!bad.length) break; await fixLines(bad) }
  // 2) a second reader: real words, correct pointing, natural lines
  if (!withProof) { const report: any = checkBooklet(level.level_number, title, pages); return { title, pages, report } }
  for (let r = 0; r < 2; r++) {
    const proof = await proofread(childText(title, pages))
    if (!proof.length) break
    const before = { title, pages, bad: niqqudItems().length }
    await fixLines([...proof.map(p => ({ word: p.text, problem: p.why })), ...niqqudItems()])
    for (let k = 0; k < 2 && niqqudItems().length; k++) await fixLines(niqqudItems())
    // a fix that brings back words outside the level is undone
    if (niqqudItems().length > before.bad) { title = before.title; pages = before.pages }
  }
  // 3) what is left for the admin to look at
  const report: any = checkBooklet(level.level_number, title, pages)
  report.proof = await proofread(childText(title, pages))
  if (lastProofError) report.proof_error = lastProofError
  return { title, pages, report }
}

/** the admin's own note ("remove the repeated sentence", "use סֵפֶר not סִפְרִי"):
 * the model rewrites only the lines the note is about, then niqqud and a
 * second reading run as usual */
export async function fixWithNote(level: { level_number: number; label_he: string }, title: string, pages: BookletPage[], note: string) {
  const g = LEVEL_GUIDE[level.level_number] || LEVEL_GUIDE[10]
  const lines = childText(title, pages)
  const r = await askClaudeJSON<any>({
    system: `You edit an early-reading booklet for Israeli children at niqqud level ${level.level_number} ("${level.label_he}"). Allowed vowel signs: ${g.marks}
A teacher wrote a note about it. Change only the lines the note is about; keep correct full niqqud, real words, natural sentences, and only the allowed vowel signs. If the teacher asks for a word whose correct niqqud is not allowed at this level, use the closest natural alternative.
Output JSON only: {"replace":[{"old":"the exact line as given","new":"the new line"}]}`,
    content: `The teacher's note: ${note}\n\nThe lines:\n${lines.map((l, i) => `${i + 1}. ${l}`).join('\n')}`,
    maxTokens: 3000,
    think: 3000,
  })
  if (r.ok) {
    let json = JSON.stringify({ title_he: title, pages })
    for (const x of Array.isArray(r.data?.replace) ? r.data.replace : []) {
      if (typeof x?.old !== 'string' || typeof x?.new !== 'string' || !x.old) continue
      json = json.split(JSON.stringify(x.old).slice(1, -1)).join(JSON.stringify(x.new).slice(1, -1))
    }
    try {
      const parsed = JSON.parse(json); const next = cleanPages(parsed.pages)
      if (contentSize(next) >= contentSize(pages)) { title = String(parsed.title_he || title); pages = next }
    } catch {}
  }
  const out = await repairBooklet(level, title, pages, 2, false)
  out.report.proof = await proofread(childText(out.title, out.pages))
  return out
}
