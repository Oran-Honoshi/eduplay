'use client'
import { useEffect } from 'react'
import { Home, Sparkles, BookOpen, Users } from 'lucide-react'
import EduPlayLogo from './EduPlayLogo'
import { SuggestionsButton } from './Feedback'
import { PARENT_COLORS, PARENT_FONTS } from '@/lib/parentTheme'

export type ParentSection = 'home' | 'create' | 'library' | 'family'

// The four parent sections, reachable from every parent page in one tap.
const SECTIONS: { key: ParentSection; he: string; href: string; Icon: any }[] = [
  { key: 'home', he: 'בית', href: '/dashboard?tab=home', Icon: Home },
  { key: 'create', he: 'יצירה', href: '/create', Icon: Sparkles },
  { key: 'library', he: 'ספרייה', href: '/dashboard?tab=library', Icon: BookOpen },
  { key: 'family', he: 'משפחה', href: '/dashboard?tab=family', Icon: Users },
]

export function ParentNav({ active }: { active?: ParentSection }) {
  return (
    <nav aria-label="ניווט ראשי" dir="rtl" style={{ display: 'flex', gap: 4 }}>
      {SECTIONS.map(({ key, he, href, Icon }) => {
        const on = key === active
        return (
          <a key={key} href={href} aria-current={on ? 'page' : undefined}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 40, padding: '0 14px', borderRadius: 999, textDecoration: 'none',
              fontWeight: 800, fontSize: 14, fontFamily: "'Assistant', 'Nunito', sans-serif",
              background: on ? '#fff' : 'transparent', color: on ? PARENT_COLORS.primary : '#4B5D59',
              boxShadow: on ? '0 1px 4px rgba(15,61,58,.12)' : 'none' }}>
            <Icon size={16} aria-hidden /> <span className="hidden sm:inline">{he}</span>
          </a>
        )
      })}
    </nav>
  )
}

// Sticky top bar shared across the parent portal. The logo always leads home.
// Pages either pass their own `center` (dashboard tab nav, back buttons) or an
// `active` section to show the shared four-section nav.
export default function ParentHeaderBar({ center, right, active }: { center?: React.ReactNode; right?: React.ReactNode; active?: ParentSection }) {
  return (
    <header dir="rtl" style={{
      background: PARENT_COLORS.card,
      borderBottom: `1px solid ${PARENT_COLORS.border}`,
      padding: '0 16px',
      height: '64px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      gap: '12px',
    }}>
      <a href="/dashboard" aria-label="EduPlay — לדף הבית" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, textDecoration: 'none' }}>
        <EduPlayLogo showName={false} size={32} iconRadius={8} iconShadow="none" />
        <span className="hidden sm:inline" style={{ fontFamily: PARENT_FONTS.heading, fontWeight: 800, fontSize: '17px', color: PARENT_COLORS.text, letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
          <bdi>Edu<span style={{ color: PARENT_COLORS.primary }}>Play</span></bdi>
        </span>
      </a>
      {center ?? (active ? <span className="hidden md:flex"><ParentNav active={active} /></span> : null)}
      {!center && active && <ParentTabBar active={active} />}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}><span className="hidden md:inline-flex"><SuggestionsButton /></span>{right}</div>
    </header>
  )
}

// Phone: the four sections as a bottom tab bar (the top bar keeps only the logo).
export function ParentTabBar({ active }: { active?: ParentSection }) {
  useEffect(() => {
    document.body.classList.add('ep-tabbar')
    return () => document.body.classList.remove('ep-tabbar')
  }, [])
  return (
    <nav aria-label="ניווט ראשי" dir="rtl" className="md:hidden" style={{ position: 'fixed', insetInline: 0, bottom: 0, zIndex: 450, background: '#fff', borderTop: `1px solid ${PARENT_COLORS.border}`, display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {SECTIONS.map(({ key, he, href, Icon }) => {
        const on = key === active
        return (
          <a key={key} href={href} aria-current={on ? 'page' : undefined}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, minHeight: 64, textDecoration: 'none', fontSize: 13, fontWeight: on ? 800 : 600, color: on ? PARENT_COLORS.primaryHover : PARENT_COLORS.textMuted, fontFamily: "'Assistant', sans-serif" }}>
            <span style={{ width: 48, height: 28, borderRadius: 999, background: on ? PARENT_COLORS.primaryLight : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={20} aria-hidden /></span>
            {he}
          </a>
        )
      })}
    </nav>
  )
}
