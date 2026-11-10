'use client'
import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import ExplanationPage from '@/components/ExplanationPage'
import { THEME_CONFIG } from '@/components/theme'
import { Pip } from '@/components/Pip'

// The child's reader for explanation pages sent from Create: one topic page
// at a time, examples opening step by step, "your turn" and self-check
// answers hidden until the child asks.
export default function LearnReader() {
  const { id } = useParams<{ id: string }>()
  const sp = useSearchParams()
  const childId = sp.get('childId') || ''
  const token = sp.get('token') || ''
  const theme = sp.get('theme') || 'plain'
  const T = THEME_CONFIG[theme] || THEME_CONFIG.plain
  const back = token ? `/play/${token}` : '/dashboard'
  const [data, setData] = useState<any>(null)
  const [err, setErr] = useState(false)
  const [i, setI] = useState(0)

  useEffect(() => {
    (async () => {
      if (token) await fetch('/api/session/from-token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) }).catch(() => {})
      const r = await fetch(`/api/learn/${id}?childId=${childId}`)
      if (!r.ok) { setErr(true); return }
      setData(await r.json())
    })()
  }, [id, childId, token])

  const he = data?.language !== 'en_only'
  const pages = data?.pages || []
  const cur = pages[i]

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: '"Assistant",sans-serif' }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 10, background: T.bg, maxWidth: 720, margin: '0 auto', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <a href={back} aria-label="יציאה" style={{ width: 48, height: 48, borderRadius: 14, background: T.panel, border: `1.5px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.text }}><X size={24} /></a>
        <span style={{ flex: 1, fontFamily: '"Rubik","Assistant",sans-serif', fontWeight: 800, fontSize: 18 }}>{data?.title || ''}</span>
        {pages.length > 1 && <span dir="ltr" style={{ fontWeight: 800 }}>{i + 1}/{pages.length}</span>}
      </header>
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '4px 16px 40px' }}>
        {err ? <div style={{ textAlign: 'center', padding: 40, fontSize: 20 }}><Pip theme={theme} pose="think" size={100} he /> <div>הדף לא נמצא.</div></div>
          : !data ? <div style={{ textAlign: 'center', padding: 40, fontSize: 18 }}>פותחים את הדף…</div>
          : cur && <div style={{ background: '#fff', borderRadius: 24, padding: 18, border: `1.5px solid ${T.border}` }}>
            <ExplanationPage key={cur.key} page={{ ...cur.page, title_he: cur.page.title_he || cur.title_he }} he={he} mode="learn" accent={T.accent1} />
          </div>}
        {pages.length > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14 }}>
            <button disabled={i === 0} onClick={() => { setI(i - 1); window.scrollTo({ top: 0 }) }} style={nav(T, i === 0)}><ChevronRight size={22} /> הקודם</button>
            <button disabled={i >= pages.length - 1} onClick={() => { setI(i + 1); window.scrollTo({ top: 0 }) }} style={nav(T, i >= pages.length - 1, true)}>הבא <ChevronLeft size={22} /></button>
          </div>
        )}
      </main>
    </div>
  )
}

function nav(T: any, disabled: boolean, primary = false): React.CSSProperties {
  return { minHeight: 56, padding: '0 20px', borderRadius: 16, border: primary ? 'none' : `1.5px solid ${T.border}`, background: primary ? T.accent1 : T.panel, color: primary ? '#fff' : T.text, fontFamily: '"Rubik","Assistant",sans-serif', fontWeight: 800, fontSize: 18, cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.35 : 1, display: 'flex', alignItems: 'center', gap: 6 }
}
