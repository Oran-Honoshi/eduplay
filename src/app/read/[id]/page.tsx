'use client'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { X, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'
import { Pip } from '@/components/Pip'
import { lineHtml, pagePictures, pictureBig, type StoryBooklet } from '@/lib/storyBooklet'

// The interactive booklet reader: one page at a time, the illustration on top
// and big pointed text below. Tapping a word lights it up (for pointing while
// reading aloud with a parent). Swipe or the big arrows turn pages; the last
// page celebrates and records the read (first read of a booklet = a sticker).
const READ_FONT = '"Noto Sans Hebrew","Rubik","Assistant",sans-serif'

export default function ReaderPage() {
  const { id } = useParams<{ id: string }>()
  const sp = useSearchParams()
  const token = sp.get('token') || ''
  const theme = sp.get('theme') || 'plain'
  const backHref = token ? `/play/${token}` : '/stories'

  const [b, setB] = useState<StoryBooklet | null>(null)
  const [err, setErr] = useState(false)
  const [page, setPage] = useState(-1) // -1 = cover, pages.length = the end
  const [lit, setLit] = useState<string | null>(null)
  const [done, setDone] = useState<{ sticker: boolean } | null>(null)
  const sent = useRef(false)
  const touchX = useRef<number | null>(null)

  useEffect(() => {
    (async () => {
      if (token) await fetch('/api/session/from-token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) }).catch(() => {})
      const r = await fetch(`/api/stories/${id}`)
      if (!r.ok) { setErr(true); return }
      setB((await r.json()).booklet)
    })()
  }, [id, token])

  const last = b ? b.pages.length : 0
  const go = (d: number) => { setLit(null); setPage(p => Math.max(-1, Math.min(last, p + d))) }

  useEffect(() => {
    if (!b || page !== last || sent.current) return
    sent.current = true
    fetch(`/api/stories/${b.id}/read`, { method: 'POST' })
      .then(r => (r.ok ? r.json() : null))
      .then(d => setDone({ sticker: !!d?.stickerEarned }))
      .catch(() => setDone({ sticker: false }))
  }, [page, last, b])

  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'ArrowLeft') go(1); if (e.key === 'ArrowRight') go(-1) }
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k)
  })

  const words = useMemo(() => {
    if (!b || page < 0 || page >= last) return []
    return b.pages[page].lines.map(l => l.split(/\s+/).filter(Boolean))
  }, [b, page, last])

  if (err) return <Shell><div style={{ textAlign: 'center', padding: 40, fontSize: 22 }}>הספרון לא נמצא <a href={backHref} style={{ display: 'block', marginTop: 16, color: '#2F5BE3' }}>חזרה</a></div></Shell>
  if (!b) return <Shell><div style={{ textAlign: 'center', padding: 60, fontSize: 20, color: '#7A6A4F' }}>פותחים את הספרון…</div></Shell>

  const art = (url: string | null | undefined, pics: string[], coverArt = false) => url
    ? <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><img src={url} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 24 }} /></div>
    : <div style={{ width: '100%', height: '100%', borderRadius: 24, background: coverArt ? '#FFE9B8' : '#EAF4FF', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, flexWrap: 'wrap', padding: 16 }}>
        {pics.length ? pics.map(k => <span key={k} dangerouslySetInnerHTML={{ __html: pictureBig(k, 120) }} />) : <Pip theme="plain" pose={coverArt ? 'wave' : 'thumbs'} size={110} he />}
      </div>

  const arrow = (d: 1 | -1) => {
    const disabled = d === -1 ? page === -1 : page === last
    const Icon = d === 1 ? ChevronLeft : ChevronRight // RTL: next is to the left
    return (
      <button onClick={() => go(d)} disabled={disabled} aria-label={d === 1 ? 'הַבָּא' : 'הַקּוֹדֵם'}
        style={{ width: 72, height: 72, borderRadius: 24, border: 'none', background: d === 1 ? '#2F5BE3' : '#fff', color: d === 1 ? '#fff' : '#16213E', boxShadow: '0 4px 14px rgba(22,33,62,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.3 : 1, flexShrink: 0 }}>
        <Icon size={36} />
      </button>
    )
  }

  let body: React.ReactNode
  if (page === -1) {
    body = <>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#7A6A4F', textAlign: 'center' }}>ספרון {b.number}</div>
      <h1 style={{ margin: 0, fontFamily: READ_FONT, fontSize: 'clamp(38px, 9vw, 56px)', fontWeight: 800, color: '#C2337F', textAlign: 'center', lineHeight: 1.5 }} dangerouslySetInnerHTML={{ __html: lineHtml(b.title_he) }} />
      <div style={{ height: 'clamp(180px, 42vh, 460px)' }}>{art(b.cover?.image_url, [], true)}</div>
      <button onClick={() => go(1)} style={{ alignSelf: 'center', minHeight: 64, padding: '0 40px', borderRadius: 20, border: 'none', background: '#2F5BE3', color: '#fff', fontSize: 24, fontWeight: 800, fontFamily: READ_FONT, cursor: 'pointer' }}>מַתְחִילִים לִקְרֹא</button>
    </>
  } else if (page === last) {
    body = <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, textAlign: 'center' }}>
      <Pip theme="plain" pose="celebrate" size={150} he />
      <div style={{ fontFamily: READ_FONT, fontSize: 40, fontWeight: 800 }}>קָרָאתִי סֵפֶר שָׁלֵם!</div>
      {done?.sticker && <div style={{ background: '#FFF4D6', borderRadius: 18, padding: '12px 22px', fontSize: 21, fontWeight: 700 }}>⭐ קיבלת מדבקה חדשה לאלבום!</div>}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button onClick={() => { setPage(-1); setLit(null) }} style={{ minHeight: 60, padding: '0 26px', borderRadius: 18, border: '1.5px solid #E2DBCD', background: '#fff', fontSize: 20, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'inherit' }}><RotateCcw size={20} /> לקרוא שוב</button>
        <a href={backHref} style={{ minHeight: 60, padding: '0 26px', borderRadius: 18, background: '#12937A', color: '#fff', fontSize: 20, fontWeight: 800, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>לספרונים</a>
      </div>
    </div>
  } else {
    const p = b.pages[page]
    body = <>
      <div style={{ height: 'clamp(160px, 38vh, 440px)', flexShrink: 0 }}>{art(p.image_url, pagePictures(p))}</div>
      <div dir="rtl" style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center', textAlign: 'center', padding: '8px 0' }}>
        {words.map((ws, li) => (
          <div key={li} style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0 .35em' }}>
            {ws.map((w, wi) => {
              const key = `${li}-${wi}`
              const on = lit === key
              return <button key={key} className="story-word" onClick={() => setLit(on ? null : key)}
                style={{ fontFamily: READ_FONT, fontSize: 'clamp(28px, min(8.5vw, 6vh), 52px)', fontWeight: 600, lineHeight: 1.7, letterSpacing: '.02em', color: '#16213E', background: on ? '#FFE27A' : 'transparent', border: 'none', borderRadius: 14, padding: '0 .18em', cursor: 'pointer', transition: 'background .15s' }}
                dangerouslySetInnerHTML={{ __html: lineHtml(w) }} />
            })}
          </div>
        ))}
      </div>
    </>
  }

  return (
    <Shell>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+Hebrew:wght@400;600;700;800&display=swap" />
      <style>{'.story-word svg{margin:0 !important}'}</style>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <a href={backHref} aria-label="סגירה" style={{ width: 52, height: 52, borderRadius: 16, background: '#fff', border: '1.5px solid #E2DBCD', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16213E' }}><X size={26} /></a>
        <div style={{ flex: 1, display: 'flex', gap: 6, justifyContent: 'center' }} aria-hidden>
          {b.pages.map((_, i) => <span key={i} style={{ width: i === page ? 26 : 12, height: 12, borderRadius: 99, background: i <= page ? '#2F5BE3' : '#E2DBCD', transition: 'width .2s' }} />)}
        </div>
        <span style={{ width: 52 }} />
      </div>
      <div onTouchStart={e => { touchX.current = e.touches[0].clientX }}
        onTouchEnd={e => { if (touchX.current == null) return; const dx = e.changedTouches[0].clientX - touchX.current; touchX.current = null; if (Math.abs(dx) > 50) go(dx > 0 ? 1 : -1) }}
        style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, background: '#fff', borderRadius: 32, padding: 18, boxShadow: '0 6px 24px rgba(22,33,62,.08)', touchAction: 'pan-y' }}>
        {body}
      </div>
      {page >= 0 && page < last && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {arrow(-1)}
          <span style={{ fontSize: 18, fontWeight: 700, color: '#7A6A4F' }}>{page + 1} / {last}</span>
          {arrow(1)}
        </div>
      )}
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div dir="rtl" style={{ minHeight: '100dvh', background: '#FFF7E6', fontFamily: '"Rubik","Assistant",sans-serif', color: '#16213E' }}>
    <div style={{ maxWidth: 760, margin: '0 auto', minHeight: '100dvh', padding: '16px 16px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>{children}</div>
  </div>
}
