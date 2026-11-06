'use client'
import { useEffect, useState } from 'react'
import { Star, Share2, Printer, Check } from 'lucide-react'

// Download + rate + share controls on a public material page.
// Rating unlocks only after this browser opened the printable (the server
// checks the same thing), so stars come from people who actually used it.
export function PublicActions({ slug, title, url, kind }: { slug: string; title: string; url: string; kind: string }) {
  const [used, setUsed] = useState(false)
  const [stars, setStars] = useState(0)
  const [sent, setSent] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  useEffect(() => {
    try { setUsed(localStorage.getItem(`edp:dl:${slug}`) === '1'); setStars(Number(localStorage.getItem(`edp:rate:${slug}`) || 0)) } catch {}
  }, [slug])
  function open(key: boolean) {
    try { localStorage.setItem(`edp:dl:${slug}`, '1') } catch {}
    setUsed(true)
    window.open(`/api/free/${slug}/print${key ? '?key=1' : ''}`, '_blank')
  }
  async function rate(s: number) {
    setStars(s)
    const r = await fetch(`/api/free/${slug}/rate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stars: s }) })
    if (r.ok) { setSent(true); try { localStorage.setItem(`edp:rate:${slug}`, String(s)) } catch {} }
    else setMsg('קודם פותחים או מדפיסים, ואז מדרגים.')
  }
  const shareText = `${title} — ${kind} חינם מ-EduPlay 🦉\n${url}`
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <button onClick={() => open(false)} className="inline-flex items-center gap-2 min-h-[52px] px-6 rounded-xl bg-[#0F766E] text-white font-bold text-[16px]"><Printer size={18} /> הורדה / הדפסה בחינם</button>
        {kind !== 'דפי הסבר' && <button onClick={() => open(true)} className="inline-flex items-center gap-2 min-h-[52px] px-5 rounded-xl border border-[#0F766E55] bg-white text-[#0F766E] font-bold">עם דף תשובות</button>}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-xl bg-[#25D366] text-white font-bold"><Share2 size={16} /> שיתוף בוואטסאפ</a>
        <button onClick={async () => { try { await navigator.clipboard.writeText(url); setMsg('הקישור הועתק') } catch {} }}
          className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-xl border border-[#e3ebe9] bg-white text-[#3d4f4b] font-semibold">העתקת קישור</button>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-[#3d4f4b]">{used ? 'איך היה?' : 'אחרי שמשתמשים אפשר לדרג'}</span>
        <div className="flex" dir="ltr">
          {[1, 2, 3, 4, 5].map(s => (
            <button key={s} disabled={!used} onClick={() => rate(s)} aria-label={`${s} כוכבים`} className="p-1 disabled:opacity-40">
              <Star size={24} className={s <= stars ? 'fill-[#F4C430] text-[#F4C430]' : 'text-[#cbd5d3]'} />
            </button>
          ))}
        </div>
        {sent && <span className="text-sm text-[#16A34A] inline-flex items-center gap-1"><Check size={14} /> תודה!</span>}
      </div>
      {msg && <div className="text-sm text-[#5b6b68]">{msg}</div>}
    </div>
  )
}
