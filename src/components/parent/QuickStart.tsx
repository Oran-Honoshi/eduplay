'use client'
import { useEffect, useRef, useState } from 'react'
import InlineMath from '@/components/InlineMath'
import { Search, Loader2, Library, User, Database, Printer, PencilLine } from 'lucide-react'

const SRC: Record<string, { he: string; Icon: any; tint: string }> = {
  mine: { he: 'יצרתם בעבר', Icon: User, tint: 'bg-[#EAF0FF] text-[#2148C0]' },
  library: { he: 'מהספרייה של ההורים', Icon: Library, tint: 'bg-[#E3F4EF] text-[#0B6B58]' },
  bank: { he: 'ממאגר השאלות', Icon: Database, tint: 'bg-[#FFF4D6] text-[#7A5600]' },
}
const SUBJ: Record<string, string> = { math: 'חשבון', english: 'אנגלית', hebrew: 'עברית' }
const gradeHe = (g: number | null) => g == null ? '' : g === 0 ? 'גן' : `כיתה ${['', 'א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ז׳', 'ח׳', 'ט׳'][g] || g}`

/**
 * Quick start on the first Create step: type what you want ("שברים כיתה ה",
 * "past simple") and get the closest ready-made sheets — your own, the parents'
 * library, or a set straight from the question bank. Use it as is (print /
 * send at once) or open it to adjust (edit, remove, add more with a note).
 */
export default function QuickStart({ child, onUse }: { child: { id: string; grade: number } | null; onUse: (material: any, ready: boolean) => void }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<any[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const timer = useRef<any>(null)

  useEffect(() => {
    clearTimeout(timer.current)
    if (q.trim().length < 2) { setResults(null); return }
    timer.current = setTimeout(async () => {
      setLoading(true)
      const p = new URLSearchParams({ q: q.trim(), ...(child ? { grade: String(child.grade) } : {}) })
      const d = await fetch(`/api/quickstart?${p}`).then(r => r.json()).catch(() => ({ results: [] }))
      setResults(d.results || []); setLoading(false)
    }, 350)
    return () => clearTimeout(timer.current)
  }, [q, child?.grade]) // eslint-disable-line react-hooks/exhaustive-deps

  async function use(r: any, ready: boolean) {
    setBusy(`${r.id}-${ready}`); setErr(null)
    const res = await fetch('/api/quickstart/use', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ source: r.source, id: r.id, child_id: child?.id, ready }) })
    const d = await res.json().catch(() => ({}))
    setBusy(null)
    if (!res.ok || !d.material) { setErr('לא הצלחנו להכין את זה. נסו שוב.'); return }
    onUse(d.material, ready)
  }

  return (
    <section aria-labelledby="qs-h" className="md:col-span-3 rounded-2xl border border-[#E8E2D6] bg-white p-5 flex flex-col gap-3">
      <div>
        <h2 id="qs-h" className="m-0 text-[20px] font-bold text-[#16213E]" style={{ fontFamily: "'Rubik', sans-serif" }}>התחלה מהירה</h2>
        <p className="m-0 mt-1 text-[15px] text-[#4A5672]">כתבו מה תרצו לתרגל — נראה מה כבר מוכן ודומה, ואפשר להתחיל בו מיד או להתאים אותו.</p>
      </div>
      <label className="relative block">
        <span className="sr-only">מה תרצו לתרגל?</span>
        <Search size={18} className="absolute top-1/2 -translate-y-1/2 start-3 text-[#8A94A8]" aria-hidden />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="למשל: שברים, אחוזים, מספרים מכוונים, past simple"
          className="w-full min-h-[48px] rounded-xl border border-[#D9D2C4] bg-[#FAF7F2] ps-10 pe-3 text-[16px] outline-none focus:border-[#2F5BE3] focus:bg-white" />
        {loading && <Loader2 size={18} className="absolute top-1/2 -translate-y-1/2 end-3 animate-spin text-[#8A94A8]" aria-hidden />}
      </label>
      {err && <div role="alert" className="text-sm text-[#B4432A]">{err}</div>}
      {results && !loading && results.length === 0 && (
        <div className="text-[15px] text-[#4A5672]">לא מצאנו משהו קרוב. בחרו למטה מה ליצור, ונכין חדש.</div>
      )}
      {results && results.length > 0 && (
        <ul className="m-0 p-0 list-none grid grid-cols-1 md:grid-cols-2 gap-3">
          {results.map(r => {
            const src = SRC[r.source]
            return (
              <li key={`${r.source}-${r.id}`} className="rounded-xl border border-[#E8E2D6] p-4 flex flex-col gap-2">
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold ${src.tint}`}><src.Icon size={13} aria-hidden /> {src.he}</span>
                  <span className="text-[#4A5672]">{[SUBJ[r.subject_slug], gradeHe(r.grade), `${r.count} שאלות`].filter(Boolean).join(' · ')}</span>
                </div>
                <div className="font-bold text-[17px] text-[#16213E]"><bdi>{r.title}</bdi></div>
                {r.sample?.length > 0 && (
                  <ul className="m-0 ps-4 text-[14px] text-[#4A5672] flex flex-col gap-0.5">
                    {r.sample.map((s: string, i: number) => <li key={i} className="line-clamp-1"><InlineMath text={s} /></li>)}
                  </ul>
                )}
                <div className="flex gap-2 flex-wrap mt-1">
                  <button onClick={() => use(r, true)} disabled={!!busy}
                    className="inline-flex items-center gap-1.5 min-h-[44px] px-4 rounded-xl bg-[#2F5BE3] text-white font-bold text-sm disabled:opacity-60">
                    {busy === `${r.id}-true` ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />} להשתמש עכשיו
                  </button>
                  <button onClick={() => use(r, false)} disabled={!!busy}
                    className="inline-flex items-center gap-1.5 min-h-[44px] px-4 rounded-xl border border-[#D9D2C4] bg-white text-[#16213E] font-bold text-sm disabled:opacity-60">
                    {busy === `${r.id}-false` ? <Loader2 size={16} className="animate-spin" /> : <PencilLine size={16} />} להתאים קודם
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
