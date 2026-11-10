'use client'
import { useState } from 'react'
import { Eye, EyeOff, ChevronLeft, ChevronRight, Loader2, Users, Smile } from 'lucide-react'
import EduPlayLogo from '@/components/EduPlayLogo'
import { Pip } from '@/components/Pip'
import { PARENT_COLORS as C, PARENT_FONTS as F } from '@/lib/parentTheme'

// Sign-in. Parents pick their profile and type their password; children go
// to the family's "who is learning?" screen (picture + code).
const FAMILY_ID = '11111111-1111-1111-1111-111111111111'

export default function LoginPage() {
  const [mode, setMode] = useState<'choose' | 'parent'>('choose')
  const [parents, setParents] = useState<any[] | null>(null)
  const [selected, setSelected] = useState<any>(null)
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function openParent() {
    setMode('parent'); setError('')
    if (parents) return
    try {
      const d = await fetch(`/api/parents/picker?familyId=${FAMILY_ID}`).then(r => r.json())
      const list = d.parents || []
      setParents(list); if (list.length === 1) setSelected(list[0])
    } catch { setParents([]) }
  }

  async function submit() {
    if (!password || loading) return
    setLoading(true); setError('')
    try {
      const r = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password, familyId: FAMILY_ID, parentId: selected?.id }) })
      const d = await r.json()
      if (d.success) { window.location.href = '/dashboard'; return }
      setError(r.status === 429 ? 'יותר מדי ניסיונות. נסו שוב בעוד כמה דקות.' : 'הסיסמה לא נכונה. נסו שוב.')
    } catch { setError('משהו השתבש. נסו שוב.') }
    setLoading(false)
  }

  const big: React.CSSProperties = { width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: 18, borderRadius: 18, border: `1.5px solid ${C.border}`, background: '#fff', cursor: 'pointer', textAlign: 'start', fontFamily: F.body, color: C.text, textDecoration: 'none' }

  return (
    <div dir="rtl" lang="he" style={{ minHeight: '100vh', background: C.pageBg, fontFamily: F.body, color: C.text, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <EduPlayLogo showName={false} size={56} iconRadius={14} iconShadow="none" />
          <div style={{ fontFamily: F.heading, fontWeight: 800, fontSize: 26 }}><bdi>Edu<span style={{ color: C.primary }}>Play</span></bdi></div>
        </div>

        <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 24, padding: 22 }}>
          {mode === 'choose' && <>
            <h1 style={{ fontFamily: F.heading, fontSize: 22, margin: '0 0 14px', textAlign: 'center' }}>מי נכנס?</h1>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <a href={`/f/${FAMILY_ID}`} style={big}>
                <span style={{ width: 52, height: 52, borderRadius: 16, background: C.amberLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Pip theme="plain" pose="wave" size={44} he /></span>
                <span style={{ flex: 1 }}><span style={{ display: 'block', fontWeight: 800, fontSize: 18 }}>ילד או ילדה</span><span style={{ display: 'block', fontSize: 14, color: C.textSecondary }}>לבחור את התמונה שלי ולהקליד קוד</span></span>
                <ChevronLeft size={20} color={C.textMuted} />
              </a>
              <button onClick={openParent} style={big}>
                <span style={{ width: 52, height: 52, borderRadius: 16, background: C.primaryLight, color: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Users size={26} /></span>
                <span style={{ flex: 1 }}><span style={{ display: 'block', fontWeight: 800, fontSize: 18 }}>הורה</span><span style={{ display: 'block', fontSize: 14, color: C.textSecondary }}>יצירה, מעקב והגדרות המשפחה</span></span>
                <ChevronLeft size={20} color={C.textMuted} />
              </button>
            </div>
          </>}

          {mode === 'parent' && <>
            <button onClick={() => { setMode('choose'); setPassword(''); setError('') }} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: C.textSecondary, fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: F.body, padding: 0, marginBottom: 12 }}>
              <ChevronRight size={16} /> חזרה
            </button>
            {!parents ? <div style={{ color: C.textMuted, textAlign: 'center', padding: 20 }}>טוען…</div>
              : !selected && parents.length > 1 ? <>
                <h1 style={{ fontFamily: F.heading, fontSize: 20, margin: '0 0 12px' }}>מי את/ה?</h1>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {parents.map(p => (
                    <button key={p.id} onClick={() => setSelected(p)} style={{ ...big, padding: 14 }}>
                      <span style={{ width: 40, height: 40, borderRadius: 99, background: C.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{p.avatar_emoji || <Smile size={20} color={C.primary} />}</span>
                      <span style={{ flex: 1, fontWeight: 800, fontSize: 16 }}>{p.name}</span>
                      <ChevronLeft size={18} color={C.textMuted} />
                    </button>
                  ))}
                </div>
              </> : <>
                <h1 style={{ fontFamily: F.heading, fontSize: 22, margin: '0 0 4px' }}>{selected ? `שלום ${selected.name}!` : 'ברוכים השבים!'}</h1>
                {selected && parents.length > 1 && <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: C.primary, fontWeight: 700, cursor: 'pointer', padding: 0, fontFamily: F.body, fontSize: 14 }}>לא את/ה? להחליף</button>}
                <label style={{ display: 'block', fontWeight: 700, fontSize: 14, margin: '16px 0 6px' }}>סיסמה</label>
                <div style={{ position: 'relative' }}>
                  <input type={show ? 'text' : 'password'} value={password} autoFocus onChange={e => { setPassword(e.target.value); setError('') }} onKeyDown={e => e.key === 'Enter' && submit()}
                    dir="ltr" style={{ width: '100%', boxSizing: 'border-box', minHeight: 50, borderRadius: 14, border: `1.5px solid ${error ? C.danger : C.border}`, padding: '0 46px 0 14px', fontSize: 16, fontFamily: F.body }} />
                  <button onClick={() => setShow(s => !s)} aria-label={show ? 'להסתיר' : 'להציג'} style={{ position: 'absolute', right: 8, top: 8, width: 34, height: 34, border: 'none', background: 'none', cursor: 'pointer', color: C.textMuted }}>{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                </div>
                {error && <div style={{ color: C.danger, fontWeight: 700, fontSize: 14, marginTop: 8 }}>{error}</div>}
                <button onClick={submit} disabled={!password || loading} style={{ width: '100%', minHeight: 52, marginTop: 16, borderRadius: 999, border: 'none', background: C.primary, color: '#fff', fontWeight: 800, fontSize: 17, cursor: 'pointer', fontFamily: F.body, opacity: !password || loading ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  {loading ? <><Loader2 size={18} className="animate-spin" /> נכנסים…</> : 'כניסה'}
                </button>
              </>}
          </>}
        </div>
        <p style={{ textAlign: 'center', fontSize: 14, color: C.textMuted, marginTop: 16 }}><a href="/free" style={{ color: C.primary, fontWeight: 700 }}>לספרייה החינמית</a> · בלי הרשמה</p>
      </div>
    </div>
  )
}
