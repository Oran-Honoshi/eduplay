export type AnswerFormat = 'multiple_choice' | 'open' | 'both'

export function normalizeAnswerFormat(v: any): AnswerFormat {
  return v === 'open' || v === 'both' ? v : 'multiple_choice'
}

/** Is question number `index` (0-based) answered "open" (options hidden until asked)?
 *  "both" alternates: 1st multiple choice, 2nd open, 3rd multiple choice, ... */
export function isOpenAt(format: AnswerFormat, index: number): boolean {
  return format === 'open' || (format === 'both' && index % 2 === 1)
}
