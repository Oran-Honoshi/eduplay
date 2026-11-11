'use client'
import { useEffect, useRef, useState } from 'react'
import { LogOut, Clock, UserCircle2 } from 'lucide-react'
import { PARENT_COLORS as C, PARENT_FONTS as F } from '@/lib/parentTheme'

// Trial chip: days left in the free month, links to the plan screen.
export function TrialChip() {
  const [t, setT] = useState<any>(null)
  useEffect(() => { fetch('/api/family/trial').then(r => r.ok ? r.json() : null).then(setT).catch(() => {}) }, [])
  if (!t?.isTrial) return null
  const low = t.daysLeft <= 5
  return (
    <a href="/upgrade" title={`${t.used} מתוך ${t.limit} יצירות החודש`}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 34, padding: '0 12px', borderRadius: 999, textDecoration: 'none', fontWeight: 800, fontSize: 13, fontFamily: F.body, whiteSpace: 'nowrap',
        background: low ? C.coralLight : C.amberLight, color: low ? C.coralText : C.amberText }}>
      <Clock size={14} aria-hidden /> {t.ended ? 'הניסיון הסתיים' : <>ניסיון · עוד {t.daysLeft} ימים</>}
    </a>
  )
}

// Account menu: sign out of the parent area.
export function AccountMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])
  async function logout() {
    await fetch('/api/session/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scope: 'parent' }) }).catch(() => {})
    window.location.href = '/login'
  }
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} aria-label="החשבון" aria-expanded={open}
        style={{ width: 40, height: 40, borderRadius: 999, border: `1px solid ${C.border}`, background: '#fff', color: C.textSecondary, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
        <UserCircle2 size={22} />
      </button>
      {open && (
        <div role="menu" style={{ position: 'absolute', insetInlineEnd: 0, top: 46, minWidth: 190, background: '#fff', border: `1px solid ${C.border}`, borderRadius: 14, boxShadow: '0 8px 24px rgba(22,33,62,.12)', padding: 6, zIndex: 500 }}>
          <a role="menuitem" href="/dashboard?tab=family" style={{ display: 'block', padding: '10px 12px', borderRadius: 10, color: C.text, textDecoration: 'none', fontWeight: 700, fontSize: 15, fontFamily: F.body }}>המשפחה והחשבון</a>
          <button role="menuitem" onClick={logout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 10, border: 'none', background: 'none', color: C.danger, fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: F.body, textAlign: 'start' }}>
            <LogOut size={16} /> יציאה
          </button>
        </div>
      )}
    </div>
  )
}
