'use client'
import { useState } from 'react'
import { Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react'
import AuthShell, { field, label, primaryBtn, rememberFamily } from '@/components/auth/AuthShell'
import { PARENT_COLORS as C, PARENT_FONTS as F } from '@/lib/parentTheme'

// Sign-up: a new family starts a free month. No card, no payment.
export default function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState<{ text: string; field?: string; exists?: boolean } | null>(null)
  const [loading, setLoading] = useState(false)
  const ready = name.trim() && email.trim() && password.length >= 8

  async function submit(e?: React.FormEvent) {
    e?.preventDefault()
    if (!ready || loading) return
    setLoading(true); setError(null)
    try {
      const r = await fetch('/api/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, password }) })
      const d = await r.json()
      if (d.success) { rememberFamily(d.familyId); window.location.href = '/welcome'; return }
      setError({ text: d.error || 'משהו השתבש. נסו שוב.', field: d.field, exists: d.exists })
    } catch { setError({ text: 'משהו השתבש. נסו שוב.' }) }
    setLoading(false)
  }

  const border = (f: string) => ({ ...field, borderColor: error?.field === f ? C.danger : C.border })

  return (
    <AuthShell footer={<>כבר יש לכם חשבון? <a href="/login" style={{ color: C.primary, fontWeight: 700 }}>להתחבר</a></>}>
      <h1 style={{ fontFamily: F.heading, fontSize: 24, margin: '0 0 4px', textAlign: 'center' }}>חודש ניסיון חינם</h1>
      <p style={{ margin: '0 0 6px', textAlign: 'center', color: C.textSecondary }}>בלי כרטיס אשראי ובלי התחייבות.</p>
      <ul style={{ listStyle: 'none', padding: 0, margin: '10px 0 4px', display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14, color: C.textSecondary }}>
        {['כל המקצועות: חשבון, אנגלית ועברית', 'יצירת דפי תרגול, מבחנים ודפי הסבר', 'אפליקציה לילדים, עם מדבקות ופרסים'].map(x => (
          <li key={x} style={{ display: 'flex', gap: 8, alignItems: 'center' }}><CheckCircle2 size={16} color={C.mint} /> {x}</li>
        ))}
      </ul>
      <form onSubmit={submit} noValidate>
        <label style={label} htmlFor="su-name">השם שלך</label>
        <input id="su-name" value={name} onChange={e => { setName(e.target.value); setError(null) }} autoComplete="name" style={border('name')} />
        <label style={label} htmlFor="su-email">אימייל</label>
        <input id="su-email" type="email" dir="ltr" value={email} onChange={e => { setEmail(e.target.value); setError(null) }} autoComplete="email" inputMode="email" style={{ ...border('email'), textAlign: 'left' }} />
        <label style={label} htmlFor="su-pw">סיסמה <span style={{ fontWeight: 500, color: C.textMuted }}>(8 תווים לפחות)</span></label>
        <div style={{ position: 'relative' }}>
          <input id="su-pw" type={show ? 'text' : 'password'} dir="ltr" value={password} onChange={e => { setPassword(e.target.value); setError(null) }} autoComplete="new-password" style={{ ...border('password'), padding: '0 46px 0 14px' }} />
          <button type="button" onClick={() => setShow(s => !s)} aria-label={show ? 'להסתיר' : 'להציג'} style={{ position: 'absolute', right: 8, top: 8, width: 34, height: 34, border: 'none', background: 'none', cursor: 'pointer', color: C.textMuted }}>{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>
        </div>
        {error && <div role="alert" style={{ color: C.danger, fontWeight: 700, fontSize: 14, marginTop: 10 }}>{error.text} {error.exists && <a href={`/login?email=${encodeURIComponent(email)}`} style={{ color: C.primary }}>להתחברות</a>}</div>}
        <button type="submit" disabled={!ready || loading} style={primaryBtn(!ready || loading)}>
          {loading ? <><Loader2 size={18} className="animate-spin" /> יוצרים את החשבון…</> : 'להתחיל ניסיון חינם'}
        </button>
      </form>
    </AuthShell>
  )
}
