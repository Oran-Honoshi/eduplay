'use client'
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
    <nav aria-label="ניווט ראשי" dir="rtl" style={{ display: 'flex', gap: 4, background: '#F1F5F4', padding: 4, borderRadius: 999 }}>
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
    <header style={{
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
          Edu<span style={{ color: PARENT_COLORS.primary }}>Play</span>
        </span>
      </a>
      {center ?? (active ? <ParentNav active={active} /> : null)}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}><span className="hidden md:inline-flex"><SuggestionsButton /></span>{right}</div>
    </header>
  )
}
