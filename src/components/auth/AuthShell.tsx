'use client'
import EduPlayLogo from '@/components/EduPlayLogo'
import { PARENT_COLORS as C, PARENT_FONTS as F } from '@/lib/parentTheme'

// The centered card used by sign-in, sign-up and onboarding.
export default function AuthShell({ children, wide, footer }: { children: React.ReactNode; wide?: boolean; footer?: React.ReactNode }) {
  return (
    <div dir="rtl" lang="he" style={{ minHeight: '100vh', background: C.pageBg, fontFamily: F.body, color: C.text, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: wide ? 560 : 420 }}>
        <a href="/" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginBottom: 20, textDecoration: 'none', color: C.text }}>
          <EduPlayLogo showName={false} size={56} iconRadius={14} iconShadow="none" />
          <div style={{ fontFamily: F.heading, fontWeight: 800, fontSize: 26 }}><bdi>Edu<span style={{ color: C.primary }}>Play</span></bdi></div>
        </a>
        <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 24, padding: 22 }}>{children}</div>
        {footer && <div style={{ textAlign: 'center', fontSize: 14, color: C.textMuted, marginTop: 16 }}>{footer}</div>}
      </div>
    </div>
  )
}

export const field: React.CSSProperties = { width: '100%', boxSizing: 'border-box', minHeight: 50, borderRadius: 14, border: `1.5px solid ${C.border}`, padding: '0 14px', fontSize: 16, fontFamily: F.body, color: C.text, background: '#fff' }
export const label: React.CSSProperties = { display: 'block', fontWeight: 700, fontSize: 14, margin: '14px 0 6px' }
export const primaryBtn = (disabled?: boolean): React.CSSProperties => ({ width: '100%', minHeight: 52, marginTop: 18, borderRadius: 999, border: 'none', background: C.primary, color: '#fff', fontWeight: 800, fontSize: 17, cursor: disabled ? 'default' : 'pointer', fontFamily: F.body, opacity: disabled ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 })
export const linkBtn: React.CSSProperties = { background: 'none', border: 'none', color: C.primary, fontWeight: 700, cursor: 'pointer', padding: 0, fontFamily: F.body, fontSize: 14 }

// This device's family, so the kids' button and the profile picker know where to go.
export function rememberFamily(id?: string) { try { if (id) localStorage.setItem('ep_family', id) } catch {} }
export function rememberedFamily(): string | null { try { return localStorage.getItem('ep_family') } catch { return null } }
