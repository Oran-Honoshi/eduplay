// The Ministry of Education goals per grade and subject (Oran's summary,
// 2026-11-12; project doc "curriculum-rules-by-grade"), and who reads the
// question at each age. Every writer and checker of questions reads these.

export const CURRICULUM: Record<string, Record<number, string>> = {
  hebrew: {
    0: 'sound and syllable awareness, rhyme, letter recognition, vocabulary, understanding a story read aloud, first writing',
    1: 'learning to read, letters and niqqud, blending sounds into words, reading short sentences, writing words and sentences',
    2: 'reading fluency, understanding short texts, finding explicit information, writing a short paragraph, basic punctuation',
    3: 'sequence of events, simple inferences, main idea, organized writing, wider vocabulary',
    4: 'informational and narrative texts, fact vs opinion, inferences, multi-paragraph writing',
    5: 'comparing texts, explicit and implicit information, claim and reason, first argumentative writing, precise language',
    6: 'critical reading, merging information from sources, interpretation, developed argumentative writing, editing',
  },
  math: {
    0: 'counting, matching quantity to number, comparing quantities, patterns, sorting, shapes, spatial concepts',
    1: 'numbers to 100, addition and subtraction, tens and ones, simple word problems, shapes and measuring',
    2: 'numbers to 1,000, addition and subtraction, first multiplication and division, sequences, money, time, solids and shapes',
    3: 'multiplication and division table, larger numbers, operations, simple fractions, measurement and perimeter',
    4: 'large numbers, harder multiplication and division, fractions, factors and multiples, angles and quadrilaterals, area',
    5: 'operations with fractions, decimals, multi-step problems, area and volume, data and graphs',
    6: 'fractions and decimals, percentages, ratio and scale, complex problems, geometry, data analysis',
  },
  english: {
    0: 'optional playful exposure: songs, colors, numbers, greetings; no formal mastery',
    1: 'ORAL exposure only: common words and phrases, short instructions, songs and language games (no reading or writing English)',
    2: 'wider SPOKEN vocabulary, recognizing familiar words, simple questions and instructions (no formal reading or writing)',
    3: 'English letters and sounds, common words, simple sentences, first reading',
    4: 'reading sentences and short texts, writing words and sentences, questions and answers, everyday vocabulary',
    5: 'short texts, writing sentences and short paragraphs, basic sentence structures and tenses (Pre-A1/A1)',
    6: 'longer texts, independent writing, language structures, explicit and implicit information (A1)',
  },
}

/** who reads the question, and how much niqqud the Hebrew gets */
export type ReadingLevel = { reader: 'parent' | 'child'; niqqud: 'full' | 'partial' | 'ambiguous' | 'none'; note: string }

export function readingLevel(grade: number): ReadingLevel {
  if (grade <= 1) return { reader: 'parent', niqqud: 'full', note: 'A parent reads the question aloud (later the read-aloud voice); the child answers. Very short, concrete, one idea per sentence.' }
  if (grade === 2) return { reader: 'child', niqqud: 'full', note: 'The child reads the Hebrew instructions alone, with full niqqud. Short sentences, everyday words.' }
  if (grade === 3) return { reader: 'child', niqqud: 'partial', note: 'The main move to reading without niqqud starts now, but reading is not yet full: niqqud only on words a child may misread.' }
  if (grade === 4) return { reader: 'child', niqqud: 'ambiguous', note: 'Reads without niqqud, still supported: niqqud only where a word is ambiguous.' }
  return { reader: 'child', niqqud: 'none', note: 'Reads alone without niqqud.' }
}

export function curriculumNote(subject: string, grade: number): string {
  const c = CURRICULUM[subject] || CURRICULUM.math
  const r = readingLevel(grade)
  return `Ministry of Education goals for this grade (${subject}, grade ${grade}): ${c[grade] || ''}. One grade below: ${c[grade - 1] || '-'}. One grade above: ${c[grade + 1] || '-'}.
Reading: ${r.note}`
}
