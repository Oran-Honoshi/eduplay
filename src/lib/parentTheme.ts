// Shared design tokens for the parent portal redesign (dashboard chrome +
// worksheets/questions/curriculum/notebook pages). Centralized so the same
// hex values don't drift across the ~5 files that each render their own
// header — see the SVG-renderer / fraction-tokenizer split for what happens
// when near-duplicate logic lives in more than one place.
export const PARENT_COLORS = {
  primary:       '#0F766E',
  primaryHover:  '#0B5C56',
  primaryLight:  '#E4F3F1',
  headerGradTeal:     '#BFE8DE',
  headerGradLavender: '#DCD3F5',

  accent:      '#7C6BAE',
  accentLight: '#EFE9FA',

  amber:      '#E0A927',
  amberLight: '#FFF3D6',
  amberText:  '#B7862F',

  coral:      '#E8724C',
  coralLight: '#FFE3D9',
  coralText:  '#B45435',

  danger:       '#DC2626',
  dangerLight:  '#FFF5F5',
  dangerBorder: '#FEE2E2',

  pageBg: '#F7F5F0',
  card:   '#FFFFFF',

  text:          '#1f2a28',
  textSecondary: '#7a8f8b',
  textMuted:     '#9aa6a3',

  border:      'rgba(15,118,110,.14)',
  borderLight: '#f0efe9',
} as const

export const PARENT_FONTS = {
  heading: '"Manrope", system-ui, sans-serif',
  body:    '"Manrope", system-ui, sans-serif',
} as const

// Per-child accent used anywhere multiple children need to stay visually
// distinct at a glance (sidebar, per-child cards). Cycled by index.
export const CHILD_AVATAR_COLORS = [PARENT_COLORS.primary, PARENT_COLORS.accent, PARENT_COLORS.amberText] as const
