// A stored *_he value that's byte-identical to its *_en counterpart is never
// a real second-language rendering — showing a reader two identical
// "different language" blocks is never useful information, regardless of
// which field or why they ended up equal.
export const isDistinctHe = (he: string | null | undefined, en: string | null | undefined) =>
  !!he && he !== en
