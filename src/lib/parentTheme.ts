// Shared design tokens for the parent portal redesign (dashboard chrome +
// worksheets/questions/curriculum/notebook pages). Centralized so the same
// hex values don't drift across the ~5 files that each render their own
// header — see the SVG-renderer / fraction-tokenizer split for what happens
// when near-duplicate logic lives in more than one place.
export const PARENT_COLORS = {
  // 2026-11 redesign: Hebrew-first, "playful professional" — navy ink,
  // action blue, sunshine yellow, one color per subject.
  primary:       '#2F5BE3',
  primaryHover:  '#2148C0',
  primaryLight:  '#EAF0FF',
  headerGradTeal:     '#EAF0FF',
  headerGradLavender: '#F0EDFF',

  accent:      '#5B4BD1',
  accentLight: '#F0EDFF',

  amber:      '#FFC940',
  amberLight: '#FFF4D1',
  amberText:  '#7A5600',

  coral:      '#E85D3F',
  coralLight: '#FDECE7',
  coralText:  '#B4432A',

  mint:      '#12937A',
  mintLight: '#E3F5EF',
  mintText:  '#0B6B58',

  danger:       '#C2361B',
  dangerLight:  '#FDECE7',
  dangerBorder: '#F6C9BD',

  pageBg: '#FAF7F2',
  card:   '#FFFFFF',

  text:          '#16213E',
  textSecondary: '#4A5672',
  textMuted:     '#5E6B85',

  border:      '#E8E2D6',
  borderStrong:'#D9D2C4',
  borderLight: '#F0EBE1',
} as const

export const PARENT_FONTS = {
  heading: '"Rubik", "Assistant", system-ui, sans-serif',
  body:    '"Assistant", "Rubik", system-ui, sans-serif',
} as const

/** subject colors: chip background / text */
export const SUBJECT_COLORS: Record<string, { bg: string; fg: string; solid: string }> = {
  math:    { bg: '#EAF0FF', fg: '#2148C0', solid: '#2F5BE3' },
  hebrew:  { bg: '#FDECE7', fg: '#B4432A', solid: '#E85D3F' },
  english: { bg: '#E3F5EF', fg: '#0B6B58', solid: '#12937A' },
  reading: { bg: '#FFF4D1', fg: '#7A5600', solid: '#E0A800' },
}

// Per-child accent used anywhere multiple children need to stay visually
// distinct at a glance (sidebar, per-child cards). Cycled by index.
export const CHILD_AVATAR_COLORS = [PARENT_COLORS.primary, PARENT_COLORS.coral, '#E0A800', PARENT_COLORS.mint, PARENT_COLORS.accent] as const
