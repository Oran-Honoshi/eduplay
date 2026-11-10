'use client'
import { useEffect, useState } from 'react'

// After a new version is deployed, a page that was already open keeps running
// the old code until it is reloaded. Check now and then (and when the tab comes
// back into view) and offer a one-tap refresh.
const BUILT = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || ''

export default function UpdateNotice() {
  const [stale, setStale] = useState(false)
  useEffect(() => {
    if (!BUILT) return
    const check = () => fetch('/api/version', { cache: 'no-store' }).then(r => r.json()).then(d => { if (d.v && d.v !== 'dev' && d.v !== BUILT) setStale(true) }).catch(() => {})
    const t = setInterval(check, 3 * 60 * 1000)
    const onVis = () => { if (document.visibilityState === 'visible') check() }
    document.addEventListener('visibilitychange', onVis)
    check()
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', onVis) }
  }, [])
  if (!stale) return null
  return (
    <div role="status" dir="rtl" style={{ position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 900, background: '#16213E', color: '#fff', borderRadius: 999, padding: '8px 8px 8px 18px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 8px 24px rgba(0,0,0,.25)', fontFamily: "'Assistant','Nunito',sans-serif", fontWeight: 700, fontSize: 14 }}>
      <span>יש גרסה חדשה של EduPlay</span>
      <button onClick={() => window.location.reload()} style={{ background: '#fff', color: '#16213E', border: 'none', borderRadius: 999, padding: '8px 16px', fontWeight: 800, cursor: 'pointer' }}>לרענן</button>
    </div>
  )
}
