'use client'
import { useEffect, useState } from 'react'
import { Delete, Loader2 } from 'lucide-react'
import { Pip } from '@/components/Pip'
import { CHILD_AVATAR_COLORS } from '@/lib/parentTheme'

const F = '"Rubik","Assistant",sans-serif'
const C = { bg: '#FAF7F2', ink: '#16213E', sub: '#4A5672', line: '#E8E2D6', primary: '#2F5BE3' }

type Kid = { id: string; name: string; grade: number; hasPin?: boolean }

function gradeHe(g: number) {
  if (g === 0) return 'גן'
  const L = ['', 'א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ז׳', 'ח׳', 'ט׳']
  return `כיתה ${L[g] || g}`
}

// "Who is learning now?" — big picture buttons. Two modes:
//  parent: on the parent's device, tapping a child opens their screen (no code).
//  family: the shared family link; the child taps their picture, then their code.
export default function WhoIsLearning({ kids, mode, familyId }: { kids: Kid[]; mode: 'parent' | 'family'; familyId?: string }) {
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [picked, setPicked] = useState<Kid | null>(null)
  const [pin, setPin] = useState('')
  const [shake, setShake] = useState(false)

  async function openAsParent(k: Kid) {
    setBusy(k.id); setError('')
    try {
      const res = await fetch('/api/session/as-child', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ childId: k.id }) })
      const d = await res.json()
      if (res.ok && d.token) { window.location.href = `/play/${d.token}`; return }
      setError(res.status === 401 ? 'צריך להתחבר שוב לחשבון ההורה' : 'לא הצלחנו לפתוח — נסו שוב')
    } catch { setError('אין חיבור — נסו שוב') }
    setBusy(null)
  }

  async function submit(code: string) {
    if (!picked) return
    setBusy(picked.id); setError('')
    try {
      const res = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pin: code, familyId, childId: picked.id }) })
      const d = await res.json()
      if (res.ok && d.success) { window.location.href = `/play/${d.child.token}`; return }
      setError(res.status === 429 ? 'יותר מדי ניסיונות — מחכים כמה דקות' : 'הקוד לא נכון — נסו שוב')
      setPin(''); setShake(true); setTimeout(() => setShake(false), 450)
    } catch { setError('אין חיבור — נסו שוב'); setPin('') }
    setBusy(null)
  }

  function press(k: string) {
    if (busy) return
    if (k === '⌫') { setPin(p => p.slice(0, -1)); setError(''); return }
    if (pin.length >= 4) return
    const next = pin + k
    setPin(next)
    if (next.length === 4) submit(next)
  }

  // this device now knows its family (the sign-in page's kids' button goes here)
  useEffect(() => { try { if (mode === 'family' && familyId) localStorage.setItem('ep_family', familyId) } catch {} }, [mode, familyId])

  // A real keyboard works on the code pad too (digits, Backspace).
  useEffect(() => {
    if (!picked) return
    const onKey = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) { press(e.key); e.preventDefault() }
      else if (e.key === 'Backspace') { press('⌫'); e.preventDefault() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const shell = (inner: React.ReactNode) => (
    <main dir="rtl" style={{ minHeight: '100vh', background: C.bg, color: C.ink, fontFamily: '"Assistant",sans-serif', display: 'flex', justifyContent: 'center', padding: '36px 20px' }}>
      <style>{`@keyframes wl-shake{0%,100%{transform:translateX(0)}25%,75%{transform:translateX(-8px)}50%{transform:translateX(8px)}}`}</style>
      <div style={{ width: '100%', maxWidth: 520, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22, textAlign: 'center' }}>{inner}</div>
    </main>
  )

  // ── PIN step (family link) ──
  if (picked) {
    const i = kids.findIndex(k => k.id === picked.id)
    return shell(<>
      <span style={{ width: 88, height: 88, borderRadius: '50%', background: CHILD_AVATAR_COLORS[i % CHILD_AVATAR_COLORS.length], color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F, fontSize: 38, fontWeight: 800 }}>{picked.name[0]}</span>
      <h1 style={{ margin: 0, fontFamily: F, fontSize: 28, fontWeight: 800 }}>היי <bdi>{picked.name}</bdi>, מה הקוד שלך?</h1>
      <div dir="ltr" aria-label={`${pin.length} מתוך 4`} style={{ display: 'flex', gap: 16, animation: shake ? 'wl-shake .45s ease' : 'none' }}>
        {[0, 1, 2, 3].map(n => <span key={n} style={{ width: 20, height: 20, borderRadius: '50%', background: n < pin.length ? C.ink : 'transparent', border: `2.5px solid ${n < pin.length ? C.ink : '#9AA5B8'}` }} />)}
      </div>
      <div role="alert" style={{ minHeight: 24, color: '#B4432A', fontWeight: 700, fontSize: 17 }}>{error}</div>
      <div dir="ltr" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12, width: '100%', maxWidth: 340 }}>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((k, j) => k === '' ? <span key={j} /> : (
          <button key={j} type="button" onClick={() => press(k)} disabled={!!busy} aria-label={k === '⌫' ? 'מחיקה' : k}
            style={{ minHeight: 68, border: 0, borderRadius: 20, background: '#fff', color: C.ink, fontFamily: F, fontSize: 30, fontWeight: 800, boxShadow: `0 2px 0 ${C.line}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'manipulation' }}>
            {k === '⌫' ? <Delete size={28} /> : k}
          </button>
        ))}
      </div>
      {busy && <Loader2 size={24} className="animate-spin" />}
      <div style={{ fontSize: 16, color: C.sub }}>שכחת? ההורה יכול/ה לשנות את הקוד בהגדרות.</div>
      <button type="button" onClick={() => { setPicked(null); setPin(''); setError('') }}
        style={{ minHeight: 48, border: 0, background: 'transparent', color: C.primary, fontFamily: F, fontSize: 18, fontWeight: 700, cursor: 'pointer' }}>
        זה לא אני — חזרה
      </button>
    </>)
  }

  return shell(<>
    <Pip theme="plain" pose="wave" size={120} he />
    <h1 style={{ margin: 0, fontFamily: F, fontSize: 32, fontWeight: 800 }}>מי לומד עכשיו?</h1>
    {kids.length === 0 && <div style={{ fontSize: 18, color: C.sub }}>עוד אין ילדים בחשבון.</div>}
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${kids.length === 1 ? 1 : 2}, minmax(0, 1fr))`, gap: 14, width: '100%' }}>
      {kids.map((k, i) => {
        const noPin = mode === 'family' && !k.hasPin
        return (
          <button key={k.id} type="button" disabled={!!busy || noPin}
            onClick={() => mode === 'parent' ? openAsParent(k) : setPicked(k)}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '20px 12px', borderRadius: 26, border: 0, background: '#fff', boxShadow: '0 4px 14px rgba(22,33,62,0.08)', cursor: noPin ? 'default' : 'pointer', fontFamily: 'inherit', color: C.ink, opacity: noPin ? 0.55 : 1, minHeight: 180 }}>
            <span style={{ width: 88, height: 88, borderRadius: '50%', background: CHILD_AVATAR_COLORS[i % CHILD_AVATAR_COLORS.length], color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F, fontSize: 38, fontWeight: 800 }}>
              {busy === k.id ? <Loader2 size={32} className="animate-spin" /> : (k.name || '?')[0]}
            </span>
            <span style={{ fontFamily: F, fontSize: 22, fontWeight: 800 }}><bdi>{k.name}</bdi></span>
            <span style={{ fontSize: 15, color: C.sub }}>{noPin ? 'צריך קוד מההורה' : gradeHe(k.grade)}</span>
          </button>
        )
      })}
    </div>
    <div role="alert" style={{ minHeight: 24, color: '#B4432A', fontWeight: 700, fontSize: 17 }}>{error}</div>
    {mode === 'parent'
      ? <a href="/dashboard" style={{ fontSize: 18, fontWeight: 700, color: C.primary, textDecoration: 'none', minHeight: 44, display: 'inline-flex', alignItems: 'center' }}>חזרה לחשבון ההורה</a>
      : <a href="/login" style={{ fontSize: 16, fontWeight: 700, color: C.sub, textDecoration: 'none', minHeight: 44, display: 'inline-flex', alignItems: 'center' }}>כניסת הורים</a>}
  </>)
}
