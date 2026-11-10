'use client'
import React from 'react'
import { ChevronRight } from 'lucide-react'
import ParentHeaderBar, { type ParentSection } from '@/components/ParentHeaderBar'
import { PARENT_COLORS as C, PARENT_FONTS as F } from '@/lib/parentTheme'

// The one frame every parent page sits in: the shared header with the four
// sections, Hebrew right-to-left, the same fonts and page width, and a
// "back" link to the section the page belongs to. Pages only supply their
// title, an optional subtitle and actions, and their content.
const SECTION_HOME: Record<ParentSection, { href: string; he: string }> = {
  home: { href: '/dashboard?tab=home', he: 'בית' },
  create: { href: '/dashboard?tab=create', he: 'יצירה' },
  library: { href: '/dashboard?tab=library', he: 'ספרייה' },
  family: { href: '/dashboard?tab=family', he: 'משפחה' },
}

export default function ParentPage({ section, title, subtitle, actions, back, width = 1060, children }: {
  section: ParentSection
  title: React.ReactNode
  subtitle?: React.ReactNode
  actions?: React.ReactNode
  /** where "back" leads; defaults to the section's page */
  back?: { href: string; label: string } | false
  width?: number
  children: React.ReactNode
}) {
  const b = back === false ? null : back || { href: SECTION_HOME[section].href, label: SECTION_HOME[section].he }
  return (
    <div dir="rtl" lang="he" className="ep-parent" style={{ minHeight: '100vh', background: C.pageBg, fontFamily: F.body, color: C.text }}>
      <ParentHeaderBar active={section} />
      <main style={{ maxWidth: width, margin: '0 auto', padding: '20px 18px 96px' }}>
        {b && (
          <a href={b.href} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, minHeight: 36, color: C.textSecondary, textDecoration: 'none', fontWeight: 700, fontSize: 14 }}>
            <ChevronRight size={16} aria-hidden /> {b.label}
          </a>
        )}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', margin: '6px 0 20px' }}>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontFamily: F.heading, fontWeight: 800, fontSize: 28, lineHeight: 1.25, margin: 0 }}>{title}</h1>
            {subtitle && <p style={{ margin: '6px 0 0', color: C.textSecondary, fontSize: 15, lineHeight: 1.6 }}>{subtitle}</p>}
          </div>
          {actions && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{actions}</div>}
        </div>
        {children}
      </main>
    </div>
  )
}

/** shared building blocks so pages look alike */
export const card: React.CSSProperties = { background: C.card, border: `1px solid ${C.border}`, borderRadius: 16 }
export const pillBtn = (primary = false): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 44, padding: '0 18px', borderRadius: 999,
  border: primary ? 'none' : `1px solid ${C.border}`, background: primary ? C.primary : C.card, color: primary ? '#fff' : C.text,
  fontWeight: 800, fontSize: 15, cursor: 'pointer', textDecoration: 'none', fontFamily: F.body,
})
export const chip = (on: boolean, color: string = C.primary, light: string = C.primaryLight): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 40, padding: '0 14px', borderRadius: 999, cursor: 'pointer', fontFamily: F.body,
  border: `1.5px solid ${on ? color : C.border}`, background: on ? light : C.card, color: on ? color : C.text, fontWeight: on ? 800 : 600, fontSize: 14,
})
export const GRADE_HE: Record<number, string> = { 0: 'גן', 1: 'כיתה א׳', 2: 'כיתה ב׳', 3: 'כיתה ג׳', 4: 'כיתה ד׳', 5: 'כיתה ה׳', 6: 'כיתה ו׳', 7: 'כיתה ז׳', 8: 'כיתה ח׳', 9: 'כיתה ט׳', 10: 'כיתה י׳', 11: 'כיתה י״א', 12: 'כיתה י״ב' }
