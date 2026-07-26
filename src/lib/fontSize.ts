export const FONT_SIZES = {
  small:  { base: 13, question: 14, passage: 13, label: 'A-',  scale: 0.85 },
  medium: { base: 16, question: 16, passage: 15, label: 'A',   scale: 1.0  },
  large:  { base: 19, question: 19, passage: 18, label: 'A+',  scale: 1.2  },
  xl:     { base: 22, question: 22, passage: 21, label: 'A++', scale: 1.4  },
}

export type FontSizeKey = keyof typeof FONT_SIZES

export function getFontSize(key?: string | null): typeof FONT_SIZES.medium {
  return FONT_SIZES[(key as FontSizeKey) || 'medium'] || FONT_SIZES.medium
}
