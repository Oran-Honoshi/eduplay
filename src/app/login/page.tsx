'use client'
import { useEffect, useState } from 'react'
import { Eye, EyeOff, ChevronLeft, ChevronRight, Loader2, Users, Smile, Mail } from 'lucide-react'
import { Pip } from '@/components/Pip'
import AuthShell, { field, label, primaryBtn, linkBtn, rememberFamily, rememberedFamily } from '@/components/auth/AuthShell'
import { PARENT_COLORS as C, PARENT_FONTS as F } from '@/lib/parentTheme'

// Sign-in. Parents sign in with email + password; on a device that already
// knows its family they can just pick their profile. Children go to their
// family's "who is learning?" screen (picture + code).
export default function LoginPage() {
  const [mode, setMode] = useState<'choose' | 'parent' | 'kid-help'>('choose')
  const [family, setFamily] = useState<string | null>(null)
  const [parents, setParents] = useState<any[] | null>(null)
  const [useEmail, setUseEmail] = useState(false)
  const [selected, setSelected] = useState<any>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const q = new URLSearchParams(window.location.search)
    const e = q.get('email')
    setFamily(rememberedFamily())
    if (e) { setEmail(e); setUseEmail(true); setMode('parent') }
  }, [])

  async function openParent() {
    setMode('parent'); setError('')
    if (parents || !family) { if (!family) setUseEmail(true); return }
    try {
      const d = await fetch(`/api/parents/picker?familyId=${family}`).then(r => r.json())
      const list = d.parents || []
      setParents(list); if (list.length === 1) setSelected(list[0])
      if (!list.length) setUseEmail(true)
    } catch { setUseEmail(true) }
  }

  function openKids() {
    if (family) window.location.href = `/f/${family}`
    else setMode('kid-help')
  }

  const byEmail = useEmail || !family
  const ready = !!password && (!byEmail || /\S+@\S+/.test(email))

  async function submit() {
    if (!ready || loading) return
    setLoading(true); setError('')
    try {
      const body = byEmail ? { email, password } : { password, familyId: family, parentId: selected?.id }
      const r = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const d = await r.json()
      if (d.success) { rememberFamily(d.familyId); window.location.href = '/dashboard'; return }
      setError(r.status === 429 ? 'יותר מדי ניסיונות. נסו שוב בעוד כמה דקות.' : byEmail ? 'האימייל או הסיסמה לא נכונים. נסו שוב.' : 'הסיסמה לא נכונה. נסו שוב.')
    } catch { setError('משהו השתבש. נסו שוב.') }
    setLoading(false)
  }

  const big: React.CSSProperties = { width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: 18, borderRadius: 18, border: `1.5px solid ${C.border}`, background: '#fff', cursor: 'pointer', textAlign: 'start', fontFamily: F.body, color: C.text, textDecoration: 'none' }
  const back = (
    <button onClick={() => { setMode('choose'); setPassword(''); setError('') }} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: C.textSecondary, fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: F.body, padding: 0, marginBottom: 12 }}>
      <ChevronRight size={16} /> חזרה
    </button>
  )

  return (
    <AuthShell footer={<>
      <div>עוד אין לכם חשבון? <a href="/signup" style={{ color: C.primary, fontWeight: 700 }}>חודש ניסיון חינם</a></div>
      <div style={{ marginTop: 6 }}><a href="/free" style={{ color: C.primary, fontWeight: 700 }}>לספרייה החינמית</a> · בלי הרשמה</div>
    </>}>
      {mode === 'choose' && <>
        <h1 style={{ fontFamily: F.heading, fontSize: 22, margin: '0 0 14px', textAlign: 'center' }}>מי נכנס?</h1>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={openKids} style={big}>
            <span style={{ width: 52, height: 52, borderRadius: 16, background: C.amberLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Pip theme="plain" pose="wave" size={44} he /></span>
            <span style={{ flex: 1 }}><span style={{ display: 'block', fontWeight: 800, fontSize: 18 }}>ילד או ילדה</span><span style={{ display: 'block', fontSize: 14, color: C.textSecondary }}>לבחור את התמונה שלי ולהקליד קוד</span></span>
            <ChevronLeft size={20} color={C.textMuted} />
          </button>
          <button onClick={openParent} style={big}>
            <span style={{ width: 52, height: 52, borderRadius: 16, background: C.primaryLight, color: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Users size={26} /></span>
            <span style={{ flex: 1 }}><span style={{ display: 'block', fontWeight: 800, fontSize: 18 }}>הורה</span><span style={{ display: 'block', fontSize: 14, color: C.textSecondary }}>יצירה, מעקב והגדרות המשפחה</span></span>
            <ChevronLeft size={20} color={C.textMuted} />
          </button>
        </div>
      </>}

      {mode === 'kid-help' && <>
        {back}
        <div style={{ display: 'flex', justifyContent: 'center' }}><Pip theme="plain" pose="think" size={72} he /></div>
        <h1 style={{ fontFamily: F.heading, fontSize: 20, margin: '8px 0 6px', textAlign: 'center' }}>צריך את הקישור של המשפחה</h1>
        <p style={{ margin: 0, color: C.textSecondary, textAlign: 'center', lineHeight: 1.7 }}>בפעם הראשונה במכשיר הזה, ההורה פותח את קישור הכניסה של הילדים. הוא נמצא בדף <b>משפחה</b>, אחרי שההורה מתחבר. מהפעם הבאה הכפתור יעבוד מיד.</p>
        <button onClick={openParent} style={primaryBtn()}>כניסת הורה</button>
      </>}

      {mode === 'parent' && <>
        {back}
        {!byEmail && !parents ? <div style={{ color: C.textMuted, textAlign: 'center', padding: 20 }}>טוען…</div>
          : !byEmail && !selected && parents!.length > 1 ? <>
            <h1 style={{ fontFamily: F.heading, fontSize: 20, margin: '0 0 12px' }}>מי את/ה?</h1>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {parents!.map(p => (
                <button key={p.id} onClick={() => setSelected(p)} style={{ ...big, padding: 14 }}>
                  <span style={{ width: 40, height: 40, borderRadius: 99, background: C.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{p.avatar_emoji || <Smile size={20} color={C.primary} />}</span>
                  <span style={{ flex: 1, fontWeight: 800, fontSize: 16 }}>{p.name}</span>
                  <ChevronLeft size={18} color={C.textMuted} />
                </button>
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: 14 }}><button onClick={() => setUseEmail(true)} style={linkBtn}>להתחבר עם אימייל</button></div>
          </> : <>
            <h1 style={{ fontFamily: F.heading, fontSize: 22, margin: '0 0 4px' }}>{!byEmail && selected ? `שלום ${selected.name}!` : 'ברוכים השבים!'}</h1>
            {!byEmail && selected && parents!.length > 1 && <button onClick={() => setSelected(null)} style={linkBtn}>לא את/ה? להחליף</button>}
            {byEmail && <>
              <label style={label} htmlFor="li-email">אימייל</label>
              <input id="li-email" type="email" dir="ltr" value={email} autoFocus={!email} onChange={e => { setEmail(e.target.value); setError('') }} autoComplete="email" inputMode="email" style={{ ...field, textAlign: 'left' }} />
            </>}
            <label style={label} htmlFor="li-pw">סיסמה</label>
            <div style={{ position: 'relative' }}>
              <input id="li-pw" type={show ? 'text' : 'password'} value={password} autoFocus={!byEmail || !!email} onChange={e => { setPassword(e.target.value); setError('') }} onKeyDown={e => e.key === 'Enter' && submit()}
                dir="ltr" autoComplete="current-password" style={{ ...field, borderColor: error ? C.danger : C.border, padding: '0 46px 0 14px' }} />
              <button onClick={() => setShow(s => !s)} aria-label={show ? 'להסתיר' : 'להציג'} style={{ position: 'absolute', right: 8, top: 8, width: 34, height: 34, border: 'none', background: 'none', cursor: 'pointer', color: C.textMuted }}>{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </div>
            {error && <div role="alert" style={{ color: C.danger, fontWeight: 700, fontSize: 14, marginTop: 8 }}>{error}</div>}
            <button onClick={submit} disabled={!ready || loading} style={primaryBtn(!ready || loading)}>
              {loading ? <><Loader2 size={18} className="animate-spin" /> נכנסים…</> : 'כניסה'}
            </button>
            {!byEmail && <div style={{ textAlign: 'center', marginTop: 12 }}><button onClick={() => setUseEmail(true)} style={{ ...linkBtn, display: 'inline-flex', alignItems: 'center', gap: 4 }}><Mail size={14} /> להתחבר עם אימייל</button></div>}
          </>}
      </>}
    </AuthShell>
  )
}
