// Kid-side language preference that survives moving between kid pages.
//
// Before this, Home kept the chosen language only in React state, /cards had
// its own hard-coded 'en' default, and /assignments only knew the language if
// the link that opened it happened to carry ?lang=. A child who switched Home
// to Hebrew lost it the moment they tapped Rewards.
//
// Order of precedence: ?lang= in the URL → the child's last choice on this
// device (localStorage) → the child's saved lang_screen → 'bilingual'.
// localStorage is per device and can be unavailable (private mode, blocked
// storage), so every access is wrapped and failure just falls through.

export type KidLang = 'en_only' | 'bilingual' | 'he_only'

const KEY = 'eduplay:kidLang'
const VALID: KidLang[] = ['en_only', 'bilingual', 'he_only']

function storageKey(childId?: string) {
  return childId ? `${KEY}:${childId}` : KEY
}

export function readKidLang(childId?: string, fallback?: string | null): KidLang {
  if (typeof window !== 'undefined') {
    const fromUrl = new URLSearchParams(window.location.search).get('lang')
    if (fromUrl && (VALID as string[]).includes(fromUrl)) return fromUrl as KidLang
    try {
      const saved = window.localStorage.getItem(storageKey(childId))
      if (saved && (VALID as string[]).includes(saved)) return saved as KidLang
    } catch { /* storage unavailable — ignore */ }
  }
  if (fallback && (VALID as string[]).includes(fallback)) return fallback as KidLang
  return 'bilingual'
}

export function saveKidLang(lang: KidLang, childId?: string) {
  if (typeof window === 'undefined') return
  try { window.localStorage.setItem(storageKey(childId), lang) } catch { /* ignore */ }
}

// Labels shared by the kid chrome (nav bar, home buttons, rewards page).
export const KID_LABELS = {
  home:        { en: 'Today',        he: 'היום' },
  practice:    { en: 'Practice',     he: 'תרגול' },
  rewards:     { en: 'Stickers',     he: 'המדבקות שלי' },
  assignments: { en: 'Assignments',  he: 'משימות' },
  parent:      { en: 'Parent',       he: 'הורה' },
  theme:       { en: 'Theme',        he: 'עיצוב' },
} as const

export function kidLabel(key: keyof typeof KID_LABELS, lang: KidLang) {
  return lang === 'en_only' ? KID_LABELS[key].en : KID_LABELS[key].he
}

// Fired after anything that can change a child's card tokens (lesson finished,
// card collected) so the always-on collection button refreshes its count.
export const TOKENS_CHANGED_EVENT = 'eduplay:tokens-changed'
export function announceTokensChanged() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(TOKENS_CHANGED_EVENT))
}
