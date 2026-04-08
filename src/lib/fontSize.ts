export const FONT_SIZES = {
  small:  { base: 11, question: 12, passage: 12, label: 'A-',  scale: 0.85 },
  medium: { base: 13, question: 14, passage: 14, label: 'A',   scale: 1.0  },
  large:  { base: 15, question: 17, passage: 16, label: 'A+',  scale: 1.2  },
  xl:     { base: 18, question: 20, passage: 19, label: 'A++', scale: 1.4  },
}

export type FontSizeKey = keyof typeof FONT_SIZES

export function getFontSize(key?: string | null): typeof FONT_SIZES.medium {
  return FONT_SIZES[(key as FontSizeKey) || 'medium'] || FONT_SIZES.medium
}
