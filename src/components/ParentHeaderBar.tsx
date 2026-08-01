'use client'
import EduPlayLogo from './EduPlayLogo'
import { PARENT_COLORS, PARENT_FONTS } from '@/lib/parentTheme'

// Sticky top bar shared across the parent portal: dashboard passes a full
// tab nav as `center`, the standalone pages (worksheets/questions/curriculum/
// notebook) pass just a back-to-dashboard button as `center` instead.
export default function ParentHeaderBar({ center, right }: { center?: React.ReactNode; right?: React.ReactNode }) {
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <EduPlayLogo showName={false} size={32} iconRadius={8} iconShadow="none" />
        <span style={{ fontFamily: PARENT_FONTS.heading, fontWeight: 800, fontSize: '17px', color: PARENT_COLORS.text, letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
          Edu<span style={{ color: PARENT_COLORS.primary }}>Play</span>
        </span>
      </div>
      {center}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>{right}</div>
    </header>
  )
}
