'use client'
import { Suspense, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Check, ChevronRight } from 'lucide-react'
import { Pip } from '@/components/Pip'
import { THEME_CONFIG } from '@/components/theme'

// The child picks the look of their app. Only real, working themes are shown;
// the preview is the actual home layout in that theme's colors.
const H = '"Rubik","Assistant",sans-serif'
const THEMES = [
  { id: 'plain', he: 'רגילה', en: 'Classic', desc: 'נקי, בהיר ושמח' },
  { id: 'minecraft', he: 'מיינקרפט', en: 'Minecraft', desc: 'כהה, פיקסלים והרפתקה' },
  { id: 'princesses', he: 'נסיכות', en: 'Princesses', desc: 'ורוד, נוצץ ומלכותי' },
  { id: 'sports', he: 'ספורט', en: 'Sports', desc: 'צבעי קבוצה, יוצאים למשחק' },
]

function Preview({ theme }: { theme: string }) {
  const T = THEME_CONFIG[theme] || THEME_CONFIG.plain
  const r = theme === 'minecraft' ? 4 : 18
  return (
    <div dir="rtl" style={{ background: T.bg, borderRadius: 20, padding: 14, border: `1.5px solid ${T.border}`, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Pip theme={theme} pose="wave" size={44} he />
        <div style={{ fontFamily: H, fontWeight: 800, fontSize: 18, color: T.text }}>היי!</div>
      </div>
      <div style={{ background: T.accent1, color: '#fff', borderRadius: r, padding: 14 }}>
        <div style={{ fontSize: 13, opacity: .9, fontWeight: 700 }}>המשימה של היום</div>
        <div style={{ fontFamily: H, fontWeight: 800, fontSize: 18 }}>שברים: חלקים שווים</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
        {['1+2', 'אב', 'Ab'].map(m => (
          <div key={m} style={{ background: T.panel, border: `1.5px solid ${T.border}`, borderRadius: r, padding: 10, textAlign: 'center', fontFamily: H, fontWeight: 800, color: T.text }} dir="ltr">{m}</div>
        ))}
      </div>
    </div>
  )
}

function ThemeSelector() {
  const sp = useSearchParams()
  const router = useRouter()
  const childId = sp.get('childId') || ''
  const name = sp.get('name') || ''
  const current = sp.get('current') || 'plain'
  const returnTo = sp.get('returnTo') || `/lesson?childId=${childId}`
  const [selected, setSelected] = useState(THEMES.some(t => t.id === current) ? current : 'plain')
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const T = THEME_CONFIG[selected] || THEME_CONFIG.plain
  const dest = (t: string) => `${returnTo}${returnTo.includes('?') ? '&' : '?'}theme=${t}`

  async function save() {
    if (selected === current) { router.push(returnTo); return }
    setState('saving')
    try {
      const r = await fetch('/api/theme', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ childId, theme: selected }) })
      if (!r.ok) throw new Error()
      setState('saved')
      setTimeout(() => router.push(dest(selected)), 900)
    } catch { setState('error') }
  }

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: '"Assistant",sans-serif', transition: 'background .3s' }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '16px 16px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <button onClick={() => router.push(returnTo)} style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 4, minHeight: 44, background: 'none', border: 'none', color: T.text, fontWeight: 700, fontSize: 17, cursor: 'pointer', fontFamily: 'inherit' }}>
          <ChevronRight size={20} /> חזרה
        </button>
        <h1 style={{ fontFamily: H, fontWeight: 800, fontSize: 28, margin: 0 }}>{name ? `${name}, איזה עיצוב בא לך?` : 'איזה עיצוב בא לך?'}</h1>
        <p style={{ margin: 0, fontSize: 18, opacity: .8 }}>כל האפליקציה תתלבש בעיצוב שתבחרו.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 10 }}>
          {THEMES.map(t => {
            const tc = THEME_CONFIG[t.id] || THEME_CONFIG.plain
            const on = selected === t.id
            return (
              <button key={t.id} onClick={() => setSelected(t.id)} aria-pressed={on}
                style={{ position: 'relative', background: tc.bg, border: `3px solid ${on ? tc.accent1 : tc.border}`, borderRadius: 20, padding: '14px 10px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, fontFamily: 'inherit', color: tc.text, minHeight: 150 }}>
                {on && <span style={{ position: 'absolute', top: 8, insetInlineStart: 8, width: 28, height: 28, borderRadius: 99, background: tc.accent1, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={18} /></span>}
                <Pip theme={t.id} pose="wave" size={64} he />
                <span style={{ fontFamily: H, fontWeight: 800, fontSize: 19 }}>{t.he}</span>
                <span style={{ fontSize: 14, opacity: .75 }}>{t.desc}</span>
              </button>
            )
          })}
        </div>
        <div style={{ fontWeight: 800, fontSize: 16, opacity: .75 }}>ככה זה ייראה:</div>
        <Preview theme={selected} />
        {state === 'error' && <div style={{ color: '#B4432A', fontWeight: 700 }}>לא הצלחנו לשמור. נסו שוב.</div>}
        <button onClick={save} disabled={state === 'saving' || state === 'saved'}
          style={{ minHeight: 64, borderRadius: 18, border: 'none', background: state === 'saved' ? '#12937A' : T.accent1, color: '#fff', fontFamily: H, fontWeight: 800, fontSize: 22, cursor: 'pointer' }}>
          {state === 'saved' ? 'נשמר!' : state === 'saving' ? 'שומרים…' : selected === current ? 'נשאר עם העיצוב הזה' : `לבחור ${THEMES.find(t => t.id === selected)?.he}`}
        </button>
      </div>
    </div>
  )
}

export default function ThemePage() {
  return <Suspense fallback={<div dir="rtl" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>טוען…</div>}><ThemeSelector /></Suspense>
}
