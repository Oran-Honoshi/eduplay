'use client'
import ParentPage from '@/components/parent/ParentPage'
import MathVisual from '@/components/MathVisual'
import { useEffect, useState } from 'react'

// Admin: make pictures for questions with the designer's generator, then approve them one by one (or all the clean ones).
export default function AdminVisualsPage() {
  const [data, setData] = useState<{ counts: Record<string, number>; items: any[] } | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [gmax, setGmax] = useState(3)
  const [subject, setSubject] = useState('math')
  const load = () => fetch('/api/admin/visuals').then(async r => { if (!r.ok) throw new Error(r.status === 403 ? 'רק למנהלים' : 'צריך להתחבר'); return r.json() }).then(setData).catch(e => setErr(e.message))
  useEffect(() => { load() }, [])
  async function post(b: any) {
    setBusy(true); setMsg('')
    try {
      const r = await fetch('/api/admin/visuals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) })
      const j = await r.json()
      if (!r.ok) setMsg(j.error || 'שגיאה')
      else if (b.action === 'run') setMsg(`נוצרו ${j.done} הצעות. נשארו ${j.remaining} שאלות בלי תמונה.`)
      else if (b.action === 'approve_clean') setMsg(`אושרו ונשמרו ${j.saved} תמונות.`)
    } catch { setMsg('שגיאת רשת') }
    setBusy(false); load()
  }
  const c = data?.counts || {}
  return (
    <ParentPage section="library" title="תמונות לשאלות" subtitle="המחולל של דורין: מציע תמונה לכל שאלה בלי תמונה. שום דבר לא מגיע לילדים לפני אישור.">
      <div>
        {err && <p className="text-[#DC2626]">{err}</p>}
        <div className="bg-white rounded-2xl border border-[#E8E2D6] p-4 flex flex-wrap items-end gap-3 mt-4">
          <label className="text-sm font-bold">מקצוע
            <select className="block mt-1 min-h-[40px] rounded-xl border px-2" value={subject} onChange={e => setSubject(e.target.value)}>
              <option value="math">חשבון</option><option value="hebrew">עברית</option><option value="english">אנגלית</option>
            </select></label>
          <label className="text-sm font-bold">עד כיתה
            <select className="block mt-1 min-h-[40px] rounded-xl border px-2" value={gmax} onChange={e => setGmax(Number(e.target.value))}>
              {[0, 1, 2, 3, 4, 5, 6].map(g => <option key={g} value={g}>{g === 0 ? 'גן' : g}</option>)}
            </select></label>
          <button disabled={busy} className="min-h-[44px] px-5 rounded-xl bg-[#2F5BE3] text-white font-bold disabled:opacity-50" onClick={() => post({ action: 'run', grade_max: gmax, subject, limit: 12 })}>
            {busy ? 'עובד… (עד כמה דקות)' : 'ליצור 12 הצעות'}
          </button>
          <button disabled={busy || !(c.pending > 0)} className="min-h-[44px] px-5 rounded-xl border font-bold disabled:opacity-50" onClick={() => post({ action: 'approve_clean' })}>לאשר את כל הנקיות (בלי אזהרות)</button>
        </div>
        <p className="text-sm text-[#4A5672] mt-2">{msg} {data && `ממתינות ${c.pending || 0} · אושרו ${c.approved || 0} · נדחו ${c.rejected || 0} · בלי צורך בתמונה ${c.none_needed || 0} · ציור חופשי (לבדיקת אדם) ${c.custom || 0} · נכשלו ${c.failed || 0}`}</p>
        <div className="grid gap-3 mt-4 sm:grid-cols-2">
          {(data?.items || []).map(p => (
            <div key={p.id} className="bg-white rounded-2xl border border-[#E8E2D6] p-4 flex flex-col gap-2">
              <div className="font-bold" dir="auto">{p.question}</div>
              <div className="text-xs text-[#4A5672]">תשובה: <span dir="auto">{p.answer}</span></div>
              {p.visual_data
                ? <div className="rounded-xl border bg-[#FFF9EC] p-2 flex justify-center overflow-auto"><MathVisual data={p.visual_data.type === 'custom_svg' ? p.visual_data : { ...p.visual_data, lib: 'eduplay' }} size={300} /></div>
                : <div className="text-sm text-[#B7862F]">אין תמונה להצגה.</div>}
              {p.visual_data?.type === 'custom_svg' && <div className="text-xs text-[#B7862F]">ציור חופשי (לא מהספרייה): כדאי להסתכל טוב לפני האישור.</div>}
              <div className="text-sm">{p.why}</div>
              <div className="text-xs text-[#4A5672]">הוסתר: {p.hidden}</div>
              {(p.warnings || []).map((w: string, i: number) => <div key={i} className="text-xs text-[#B7862F]">⚠ {w}</div>)}
              {(p.question_fixes || []).map((w: string, i: number) => <div key={i} className="text-xs text-[#2F5BE3]">תיקון מוצע לשאלה: {w}</div>)}
              <div className="flex gap-2 mt-1">
                {p.visual_data && <button disabled={busy} className="min-h-[40px] px-4 rounded-xl bg-[#12937A] text-white font-bold text-sm" onClick={() => post({ action: 'approve', id: p.id })}>לאשר</button>}
                <button disabled={busy} className="min-h-[40px] px-4 rounded-xl border text-[#DC2626] font-bold text-sm" onClick={() => post({ action: 'reject', id: p.id })}>לדחות</button>
              </div>
            </div>
          ))}
        </div>
        {data && data.items.length === 0 && <p className="text-[#4A5672] mt-4">אין הצעות ממתינות. לחצו על "ליצור הצעות".</p>}
      </div>
    </ParentPage>
  )
}
