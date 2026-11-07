'use client'

// ─── Reading booklets (Hebrew niqqud) ──────────────────────────
// A shared bank of printable early-reading booklets, one level at a time
// (קמץ ופתח → שווא → חיריק …). Every booklet is written once, checked so the
// child reads only that level's niqqud, approved by EduPlay, then available
// to every family. "Another booklet" adds a new one to the bank.

import { useEffect, useState } from 'react'
import { BookOpen, Printer, Sparkles, Eye, Check, X, Gift, Loader2 } from 'lucide-react'
import ParentHeaderBar from '@/components/ParentHeaderBar'
import { Pip } from '@/components/Pip'
import { FunLoader } from '@/components/FunLoader'

const card = 'bg-white rounded-2xl border border-[rgba(15,118,110,.14)] shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
const btnPrimary = 'inline-flex items-center justify-center gap-2 min-h-[48px] px-5 rounded-xl bg-[#0F766E] text-white font-bold text-[15px] hover:bg-[#0d665f] disabled:opacity-50'
const btnGhost = 'inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-xl border border-[rgba(15,118,110,.2)] bg-white text-[#0F766E] font-semibold text-sm hover:bg-[#E4F3F1] disabled:opacity-50'

export default function ReadingPage() {
  const [levels, setLevels] = useState<any[]>([])
  const [level, setLevel] = useState(1)
  const [items, setItems] = useState<any[] | null>(null)
  const [admin, setAdmin] = useState(false)
  const [theme, setTheme] = useState('')
  const [making, setMaking] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [fixing, setFixing] = useState<string | null>(null)

  async function load(l = level) {
    setItems(null)
    const d = await fetch(`/api/reading/booklets?level=${l}`).then(r => r.json()).catch(() => ({}))
    setItems(d.booklets || []); setLevels(d.levels || []); setAdmin(!!d.admin)
  }
  useEffect(() => { load(level) }, [level]) // eslint-disable-line react-hooks/exhaustive-deps

  async function make() {
    setMaking(true); setMsg(null)
    try {
      const r = await fetch('/api/reading/booklets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ level_number: level, theme }) })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'שגיאה')
      setTheme('')
      setMsg(admin ? 'החוברת מוכנה לבדיקה שלכם — עיינו ואשרו.' : 'החוברת נכתבה ונשלחה לבדיקה. אחרי אישור היא תופיע כאן לכולם.')
      await load()
      if (admin) setPreview(d.booklet.id)
    } catch (e: any) { setMsg(e.message) } finally { setMaking(false) }
  }
  async function patch(id: string, body: any) {
    await fetch(`/api/reading/booklets/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    await load()
  }

  const lv = levels.find(x => x.level_number === level)
  const approved = (items || []).filter(b => b.status === 'approved')
  const drafts = (items || []).filter(b => b.status === 'draft')

  return (
    <div className="min-h-screen bg-[#F7F5F0]" dir="rtl" lang="he" style={{ fontFamily: "'Assistant', 'Nunito', system-ui, sans-serif" }}>
      <ParentHeaderBar active="create" />
      <div className="max-w-[920px] mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-5">
          <Pip pose="read" size={84} he />
          <div>
            <h1 className="text-2xl font-black text-[#1f2a28] m-0">חוברות קריאה</h1>
            <p className="text-sm text-[#5b6b68] mt-1 mb-0">לגן ולכיתה א׳: כל חוברת בונה צעד אחר צעד — הברות, מילים, משפטים וסיפור קצר, עם התאמה לתמונות, חיבור נקודות וציור. הילד/ה קוראים רק בניקוד של השלב.</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {(levels.length ? levels : Array.from({ length: 10 }, (_, i) => ({ level_number: i + 1, label_he: `שלב ${i + 1}` }))).map(l => (
            <button key={l.level_number} aria-pressed={level === l.level_number} onClick={() => setLevel(l.level_number)}
              className={`min-h-[44px] px-4 rounded-full border-2 font-bold text-sm ${level === l.level_number ? 'border-[#0F766E] bg-[#E4F3F1] text-[#0F766E]' : 'border-[#e3ebe9] bg-white text-[#3d4f4b]'}`}>
              {l.level_number}. {l.label_he}
            </button>
          ))}
        </div>

        {msg && <div className="mb-3 rounded-xl border border-[#0F766E33] bg-[#E4F3F1] px-4 py-3 text-sm text-[#0F3D3A]">{msg}</div>}

        {items === null ? <div className="text-sm text-[#7a8f8b]">טוען…</div> : (
          <div className="flex flex-col gap-2">
            {approved.length === 0 && drafts.length === 0 && (
              <div className={`${card} p-6 text-center`}>
                <div className="font-bold">עוד אין חוברות בשלב “{lv?.label_he}”</div>
                <div className="text-sm text-[#5b6b68] mt-1">אפשר לבקש עכשיו חוברת ראשונה.</div>
              </div>
            )}
            {[...approved, ...drafts].map(b => (
              <div key={b.id} className={`${card} p-4 flex flex-wrap items-center gap-3 ${b.status === 'draft' ? 'border-dashed' : ''}`}>
                <div className="w-11 h-11 rounded-xl bg-[#FFF4D6] text-[#8a5a00] flex items-center justify-center shrink-0"><BookOpen size={22} /></div>
                <div className="flex-1 min-w-[200px]">
                  <div className="font-black text-[#1f2a28] text-lg">{b.title_he}</div>
                  <div className="text-xs text-[#5b6b68]">
                    {b.theme_he ? `${b.theme_he} · ` : ''}{b.page_count} עמודים
                    {b.status === 'draft' && <span className="font-bold text-[#B45309]"> · מחכה לאישור</span>}
                    {b.is_free && <span className="font-bold text-[#16A34A]"> · בספרייה החינמית</span>}
                    {admin && b.check_report && <span className={b.check_report.bad?.length ? 'text-[#DC2626]' : 'text-[#16A34A]'}> · ניקוד: {b.check_report.pct}%{b.check_report.bad?.length ? ` (${b.check_report.bad.length} מילים לבדוק)` : ' תקין'}</span>}
                  </div>
                  {admin && b.check_report?.bad?.length > 0 && <div className="text-xs text-[#7a8f8b] mt-1">לבדוק: <span className="font-bold">{b.check_report.bad.slice(0, 12).join(' · ')}</span></div>}
                </div>
                <button className={btnGhost} onClick={() => setPreview(b.id)}><Eye size={16} /> עיון</button>
                <a className={btnGhost} href={`/api/reading/booklets/${b.id}/print`} target="_blank" rel="noopener noreferrer"><Printer size={16} /> להדפסה</a>
                {admin && b.status === 'draft' && b.check_report?.bad?.length > 0 && (
                  <button className={btnGhost} disabled={fixing === b.id} onClick={async () => { setFixing(b.id); await fetch(`/api/reading/booklets/${b.id}/fix`, { method: 'POST' }); setFixing(null); await load() }}>
                    {fixing === b.id ? <><Loader2 size={16} className="animate-spin" /> מתקנים…</> : <><Sparkles size={16} /> לתקן ניקוד</>}
                  </button>
                )}
                {admin && b.status === 'draft' && <>
                  <button className={btnPrimary + ' !min-h-[44px]'} onClick={() => patch(b.id, { status: 'approved' })}><Check size={16} /> לאשר</button>
                  <button className={btnGhost + ' !text-[#DC2626]'} onClick={() => { const reason = prompt('למה לדחות? (לא חובה)') ?? ''; patch(b.id, { status: 'rejected', reason }) }}><X size={16} /> לדחות</button>
                </>}
                {admin && b.status === 'approved' && (
                  <button className={btnGhost} onClick={() => patch(b.id, { is_free: !b.is_free })}><Gift size={16} /> {b.is_free ? 'להוציא מהחינמית' : 'לספרייה החינמית'}</button>
                )}
              </div>
            ))}
          </div>
        )}

        <div className={`${card} p-5 mt-4`}>
          {making ? <FunLoader kind="build" pose="read" size={96} sub="כותבים חוברת ובודקים כל ניקוד — עד דקה וחצי" /> : <>
            <div className="font-black text-[#1f2a28] mb-1">{approved.length ? 'עוד חוברת בשלב הזה' : 'חוברת ראשונה בשלב הזה'}</div>
            <div className="text-sm text-[#5b6b68] mb-3">נושא לבחירה (לא חובה) — למשל: בים, בגן החיות, יום הולדת. החוברת נשמרת במאגר ומשמשת את כולם אחרי בדיקה.</div>
            <div className="flex flex-wrap gap-2">
              <input dir="auto" value={theme} onChange={e => setTheme(e.target.value)} placeholder="נושא…" className="flex-1 min-w-[180px] min-h-[48px] px-3 rounded-xl border border-[rgba(15,118,110,.2)] bg-white text-[15px]" />
              <button className={btnPrimary} onClick={make}><Sparkles size={18} /> לכתוב חוברת</button>
            </div>
          </>}
        </div>

        {preview && (
          <div role="dialog" aria-modal="true" className="fixed inset-0 z-[700] bg-black/50 flex items-center justify-center p-3" onClick={() => setPreview(null)}>
            <div className="bg-white rounded-2xl w-full max-w-[900px] h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-4 py-2 border-b border-[#e3ebe9]">
                <span className="font-bold text-sm">עיון בחוברת</span>
                <button aria-label="סגירה" className="w-9 h-9 rounded-full hover:bg-[#F1F5F9] flex items-center justify-center" onClick={() => setPreview(null)}><X size={18} /></button>
              </div>
              <iframe title="חוברת" src={`/api/reading/booklets/${preview}/print?noprint=1`} className="flex-1 w-full border-0" />
            </div>
          </div>
        )}
        {making && <span className="sr-only"><Loader2 /></span>}
      </div>
    </div>
  )
}
