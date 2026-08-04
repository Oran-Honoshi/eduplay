// A stored *_he value that's byte-identical to its *_en counterpart is never
// a real second-language rendering — showing a reader two identical
// "different language" blocks is never useful information, regardless of
// which field or why they ended up equal.
export const isDistinctHe = (he: string | null | undefined, en: string | null | undefined) =>
  !!he && he !== en

// difficulty is a fixed enum, not per-question content — one canonical
// wording, not something to regenerate or translate ad hoc per screen.
// Previously duplicated inline in the worksheet builder's aggregate badge
// (and missing entirely from its per-question badge and both admin review
// screens) — one shared source now.
const DIFFICULTY_HE: Record<string, string> = {
  easy: 'קל',
  medium: 'בינוני',
  hard: 'קשה',
  mixed: 'מעורב',
}

export const translateDifficulty = (difficulty: string): string =>
  DIFFICULTY_HE[difficulty] || difficulty

// Multiple-choice option labels: Israeli math worksheets label options with
// Hebrew letters (א. ב. ג. ד.), not Latin ones — confirmed against a real
// Israeli elementary math worksheet, not assumed. Options are generated/
// stored with Latin labels (A/B/C/D) regardless of language, so this only
// governs how the label is *displayed* in a Hebrew context.
const OPTION_LABEL_HE: Record<string, string> = {
  A: 'א',
  B: 'ב',
  C: 'ג',
  D: 'ד',
}

export const translateOptionLabel = (label: string): string =>
  OPTION_LABEL_HE[label] || label
