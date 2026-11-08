'use client'
import { useEffect, useState } from 'react'
import { MessageSquareHeart, Star, X } from 'lucide-react'
import { Pip } from '@/components/Pip'

// "Your opinion matters to us": a rare rating pop-up (after 3+ creations,
// at most monthly, one tap to dismiss) and an always-available suggestions box.
function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div role="dialog" aria-modal="true" dir="rtl" className="fixed inset-0 z-[600] bg-black/40 flex items-end sm:items-center justify-center p-3" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-[420px] p-5 relative" style={{ fontFamily: "'Assistant','Nunito',sans-serif" }} onClick={e => e.stopPropagation()}>
        <button aria-label="סגירה" onClick={onClose} className="absolute top-3 end-3 w-9 h-9 rounded-full flex items-center justify-center text-[#5E6B85] hover:bg-[#F1F5F9]"><X size={18} /></button>
        {children}
      </div>
    </div>
  )
}

function Form({ mode, materialId, onDone }: { mode: 'rating' | 'suggestion'; materialId?: string; onDone: () => void }) {
  const [stars, setStars] = useState(0)
  const [msg, setMsg] = useState('')
  const [sent, setSent] = useState(false)
  async function send() {
    await fetch('/api/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: mode === 'rating' && stars ? 'rating' : 'suggestion', stars: stars || undefined, message: msg, context: { page: location.pathname, material_id: materialId } }) })
    setSent(true); setTimeout(onDone, 1400)
  }
  if (sent) return <div className="text-center py-4"><Pip pose="celebrate" size={96} he style={{ margin: '0 auto' }} /><div className="font-black text-lg mt-2">תודה! קראנו כל מילה.</div></div>
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <Pip pose={mode === 'rating' ? 'wave' : 'think'} size={64} he />
        <div>
          <div className="font-black text-lg text-[#16213E]">{mode === 'rating' ? 'איך היה עד עכשיו?' : 'יש לכם הצעה?'}</div>
          <div className="text-sm text-[#4A5672]">הדעה שלכם חשובה לנו ועוזרת לנו לשפר.</div>
        </div>
      </div>
      {mode === 'rating' && (
        <div className="flex justify-center" dir="ltr">
          {[1, 2, 3, 4, 5].map(s => <button key={s} aria-label={`${s} כוכבים`} onClick={() => setStars(s)} className="p-1.5"><Star size={32} className={s <= stars ? 'fill-[#F4C430] text-[#F4C430]' : 'text-[#cbd5d3]'} /></button>)}
        </div>
      )}
      <textarea value={msg} onChange={e => setMsg(e.target.value)} rows={3} dir="auto"
        placeholder={mode === 'rating' ? 'משהו שאהבתם, או שהיה קשה? (לא חובה)' : 'מה הייתם רוצים שנוסיף או נשפר? איך היה התהליך?'}
        className="w-full px-3 py-2 rounded-xl border border-[#D9D2C4] text-[15px]" />
      <button onClick={send} disabled={mode === 'rating' ? !stars && !msg.trim() : !msg.trim()}
        className="min-h-[48px] rounded-xl bg-[#2F5BE3] text-white font-bold disabled:opacity-50">שליחה</button>
    </div>
  )
}

export function FeedbackPrompt({ materialId }: { materialId?: string }) {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => { fetch('/api/feedback').then(r => r.json()).then(d => d.ask && setOpen(true)).catch(() => {}) }, 2500)
    return () => clearTimeout(t)
  }, [])
  if (!open) return null
  const dismiss = () => { setOpen(false); fetch('/api/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: 'dismissed' }) }) }
  return <Modal onClose={dismiss}><Form mode="rating" materialId={materialId} onDone={() => setOpen(false)} /></Modal>
}

export function SuggestionsButton({ label = 'הצעות לשיפור' }: { label?: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 min-h-[36px] px-3 rounded-full border border-[#D9D2C4] bg-white text-[#2F5BE3] text-xs font-bold hover:bg-[#EAF0FF]">
        <MessageSquareHeart size={14} /> {label}
      </button>
      {open && <Modal onClose={() => setOpen(false)}><Form mode="suggestion" onDone={() => setOpen(false)} /></Modal>}
    </>
  )
}
