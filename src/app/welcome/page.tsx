'use client'
import { useEffect, useState } from 'react'
import { Loader2, Plus, ChevronLeft, Check } from 'lucide-react'
import AuthShell, { field, label, primaryBtn, linkBtn } from '@/components/auth/AuthShell'
import { Pip } from '@/components/Pip'
import { GRADE_HE } from '@/components/parent/ParentPage'
import { PARENT_COLORS as C, PARENT_FONTS as F } from '@/lib/parentTheme'

const GRADES = [0, 1, 2, 3, 4, 5, 6]
const THEMES = [
  { id: 'plain', he: 'רגילה', bg: '#EAF0FF' },
  { id: 'minecraft', he: 'מיינקרפט', bg: '#DDEFD5' },
  { id: 'princesses', he: 'נסיכות', bg: '#FCE4F1' },
  { id: 'sports', he: 'ספורט', bg: '#FFF1D6' },
]
const MAX = 5

// Onboarding after sign-up (and "add a child" from the family page):
// name, grade, look, and an optional 4-digit code for the kids' sign-in.
export default function WelcomePage() {
  const [kids, setKids] = useState<any[] | null>(null)
  const [adding, setAdding] = useState(false)
  const [fromFamily, setFromFamily] = useState(false)
  const [name, setName] = useState('')
  const [grade, setGrade] = useState<number | null>(null)
  const [theme, setTheme] = useState('plain')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setFromFamily(new URLSearchParams(window.location.search).has('add'))
    fetch('/api/family/children').then(r => {
      if (r.status === 401) { window.location.href = '/login'; return null }
      return r.json()
    }).then(d => { if (d) { const list = d.children || []; setKids(list); setAdding(list.length === 0 || new URLSearchParams(window.location.search).has('add')) } })
      .catch(() => setKids([]))
  }, [])

  const ready = name.trim() && grade !== null && (pin === '' || /^\d{4}$/.test(pin))

  async function save() {
    if (!ready || saving) return
    setSaving(true); setError('')
    try {
      const r = await fetch('/api/children', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ display_name: name, grade, theme, pin_code: pin || null }) })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'משהו השתבש. נסו שוב.')
      setKids(k => [...(k || []), d.child]); setAdding(false)
      setName(''); setGrade(null); setTheme('plain'); setPin('')
    } catch (e: any) { setError(e.message) }
    setSaving(false)
  }

  const chip = (on: boolean): React.CSSProperties => ({ minHeight: 44, padding: '0 14px', borderRadius: 999, border: `1.5px solid ${on ? C.primary : C.border}`, background: on ? C.primaryLight : '#fff', color: on ? C.primaryHover : C.text, fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: F.body })

  if (!kids) return <AuthShell wide><div style={{ textAlign: 'center', padding: 30, color: C.textMuted }}><Loader2 className="animate-spin" style={{ display: 'inline' }} /></div></AuthShell>

  return (
    <AuthShell wide>
      {!adding ? <>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}><Pip theme="plain" pose="celebrate" size={64} he /></div>
        <h1 style={{ fontFamily: F.heading, fontSize: 24, margin: '0 0 4px', textAlign: 'center' }}>{fromFamily ? 'הילדים במשפחה' : 'מעולה, הכול מוכן!'}</h1>
        <p style={{ margin: '0 0 16px', textAlign: 'center', color: C.textSecondary }}>אפשר להוסיף עוד ילדים, או להמשיך לדף הבית.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {kids.map(k => (
            <div key={k.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 16, border: `1px solid ${C.border}` }}>
              <span style={{ width: 40, height: 40, borderRadius: 99, background: C.mintLight, color: C.mintText, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={20} /></span>
              <span style={{ flex: 1 }}><span style={{ display: 'block', fontWeight: 800 }}>{k.display_name}</span><span style={{ fontSize: 14, color: C.textSecondary }}>{GRADE_HE[k.grade] ?? ''}</span></span>
            </div>
          ))}
        </div>
        {kids.length < MAX && <button onClick={() => setAdding(true)} style={{ ...chip(false), width: '100%', marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Plus size={18} /> להוסיף עוד ילד/ה</button>}
        <a href={fromFamily ? '/dashboard?tab=family' : '/dashboard'} style={{ ...primaryBtn(), textDecoration: 'none' }}>{fromFamily ? 'חזרה לדף המשפחה' : 'לדף הבית'} <ChevronLeft size={18} /></a>
      </> : <>
        <h1 style={{ fontFamily: F.heading, fontSize: 24, margin: '0 0 4px' }}>{kids.length ? 'ילד/ה נוסף/ת' : 'מי ילמד איתנו?'}</h1>
        <p style={{ margin: 0, color: C.textSecondary }}>{kids.length ? 'עוד כמה פרטים וסיימנו.' : 'נוסיף את הילד או הילדה הראשונים. אפשר להוסיף עוד אחר כך.'}</p>

        <label style={label} htmlFor="kid-name">שם</label>
        <input id="kid-name" value={name} onChange={e => { setName(e.target.value); setError('') }} style={field} autoFocus />

        <span style={label}>כיתה</span>
        <div role="radiogroup" aria-label="כיתה" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {GRADES.map(g => <button key={g} type="button" role="radio" aria-checked={grade === g} onClick={() => setGrade(g)} style={chip(grade === g)}>{g === 0 ? 'גן' : GRADE_HE[g].replace('כיתה ', '')}</button>)}
        </div>

        <span style={label}>איך האפליקציה תיראה</span>
        <div role="radiogroup" aria-label="עיצוב" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 8 }}>
          {THEMES.map(t => (
            <button key={t.id} type="button" role="radio" aria-checked={theme === t.id} onClick={() => setTheme(t.id)}
              style={{ ...chip(theme === t.id), borderRadius: 16, padding: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minHeight: 96 }}>
              <span style={{ width: 52, height: 44, borderRadius: 12, background: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Pip theme={t.id as any} pose="wave" size={38} he /></span>
              {t.he}
            </button>
          ))}
        </div>

        <label style={label} htmlFor="kid-pin">קוד כניסה של 4 ספרות <span style={{ fontWeight: 500, color: C.textMuted }}>(לא חובה)</span></label>
        <input id="kid-pin" value={pin} onChange={e => { setPin(e.target.value.replace(/\D/g, '').slice(0, 4)); setError('') }} inputMode="numeric" dir="ltr" placeholder="1234" style={{ ...field, maxWidth: 160, letterSpacing: 6, textAlign: 'center' }} />
        <p style={{ fontSize: 13, color: C.textMuted, margin: '6px 0 0' }}>ילדים גדולים נכנסים לבד עם התמונה שלהם והקוד. לקטנים אפשר לשלוח קישור אישי מדף המשפחה.</p>

        {error && <div role="alert" style={{ color: C.danger, fontWeight: 700, fontSize: 14, marginTop: 10 }}>{error}</div>}
        <button onClick={save} disabled={!ready || saving} style={primaryBtn(!ready || saving)}>
          {saving ? <><Loader2 size={18} className="animate-spin" /> שומרים…</> : 'שמירה'}
        </button>
        {kids.length > 0 && <div style={{ textAlign: 'center', marginTop: 12 }}><button onClick={() => setAdding(false)} style={linkBtn}>ביטול</button></div>}
      </>}
    </AuthShell>
  )
}
