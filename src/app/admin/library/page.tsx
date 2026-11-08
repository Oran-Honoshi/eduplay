'use client'
import { useEffect, useState } from 'react'
import { KIND_HE, SUBJECT_HE, gradeHe } from '@/lib/publicLabels'

// Admin: approve materials offered to the free library, and read app feedback.
export default function AdminLibraryPage() {
  const [data, setData] = useState<{ items: any[]; feedback: any[] } | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const load = () => fetch('/api/admin/library').then(async r => { if (!r.ok) throw new Error(r.status === 403 ? 'רק למנהלים' : 'צריך להתחבר'); return r.json() }).then(setData).catch(e => setErr(e.message))
  useEffect(() => { load() }, [])
  async function act(id: string, action: string) {
    await fetch('/api/admin/library', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, action }) })
    load()
  }
  const statusHe: any = { submitted: 'ממתין', listed: 'בספרייה', rejected: 'נדחה' }
  return (
    <main dir="rtl" className="min-h-screen bg-[#FAF7F2] p-4" style={{ fontFamily: "'Assistant','Nunito',sans-serif" }}>
      <div className="max-w-[900px] mx-auto">
        <h1 className="text-2xl font-black">ניהול הספרייה החינמית</h1>
        {err && <p className="text-[#DC2626]">{err}</p>}
        {!data ? !err && <p>טוען…</p> : <>
          <div className="flex flex-col gap-2 mt-4">
            {data.items.length === 0 && <p className="text-[#4A5672]">אין עדיין הצעות.</p>}
            {data.items.map(m => (
              <div key={m.id} className="bg-white rounded-2xl border border-[#E8E2D6] p-4 flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[220px]">
                  <div className="font-bold">{m.title}</div>
                  <div className="text-xs text-[#4A5672]">{KIND_HE[m.kind]} · {SUBJECT_HE[m.subject_slug]} · {gradeHe(m.grade)} · {m.question_ids?.length || 0} שאלות · {statusHe[m.library_status]} · הורד {m.download_count}</div>
                </div>
                <a className="text-sm text-[#2F5BE3] underline" href={`/s/${m.share_slug}`} target="_blank" rel="noopener noreferrer">תצוגה</a>
                {m.library_status !== 'listed' && <button className="min-h-[40px] px-4 rounded-xl bg-[#2F5BE3] text-white font-bold text-sm" onClick={() => act(m.id, 'list')}>לפרסם</button>}
                {m.library_status === 'listed' && <button className="min-h-[40px] px-4 rounded-xl border font-bold text-sm" onClick={() => act(m.id, 'unlist')}>להוריד מהספרייה</button>}
                {m.library_status === 'submitted' && <button className="min-h-[40px] px-4 rounded-xl border text-[#DC2626] font-bold text-sm" onClick={() => act(m.id, 'reject')}>לדחות</button>}
              </div>
            ))}
          </div>
          <h2 className="text-xl font-black mt-8">משוב מהורים</h2>
          <div className="flex flex-col gap-2 mt-2">
            {data.feedback.length === 0 && <p className="text-[#4A5672]">עוד אין משוב.</p>}
            {data.feedback.map(f => (
              <div key={f.id} className="bg-white rounded-2xl border border-[#E8E2D6] p-3 text-sm">
                <div className="text-xs text-[#4A5672]">{f.kind === 'rating' ? 'דירוג' : 'הצעה'} · {new Date(f.created_at).toLocaleString('he-IL')} {f.context?.page ? `· ${f.context.page}` : ''}</div>
                {f.stars && <div dir="ltr" className="text-[#B7862F] text-end">{'★'.repeat(f.stars)}</div>}
                {f.message && <div className="whitespace-pre-line">{f.message}</div>}
              </div>
            ))}
          </div>
        </>}
      </div>
    </main>
  )
}
