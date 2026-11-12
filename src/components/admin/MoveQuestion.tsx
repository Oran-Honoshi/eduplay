'use client'
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeftRight, Loader2, Undo2 } from 'lucide-react'
import { pillBtn } from '@/components/parent/ParentPage'
import { PARENT_COLORS as C, PARENT_FONTS as F } from '@/lib/parentTheme'

// "This question belongs to another grade / lesson": keep it, move it there.
// Used on both admin review pages. Same subject only; logged and undoable.
const GRADE = ['', 'א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳']
const cache: Record<string, Promise<any[]>> = {}
function lessons(subject: string) {
  return (cache[subject] ||= fetch(`/api/admin/question-move?subject=${subject}`).then(r => r.json()).then(d => d.topics || []).catch(() => []))
}

export default function MoveQuestion({ questionId, subject, grade, topicId, onMoved }: {
  questionId: string; subject: string; grade: number; topicId: string; onMoved: () => void
}) {
  const [open, setOpen] = useState(false)
  const [all, setAll] = useState<any[]>([])
  const [g, setG] = useState(grade || 1)
  const [t, setT] = useState('')
  const [busy, setBusy] = useState(false)
  const [moved, setMoved] = useState<string | null>(null)
  useEffect(() => { if (open && !all.length) lessons(subject).then(setAll) }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
  const inGrade = useMemo(() => all.filter(x => x.grade === g), [all, g])
  useEffect(() => { setT(inGrade.find(x => x.id !== topicId)?.id || '') }, [inGrade, topicId])

  async function post(body: any) {
    setBusy(true)
    const r = await fetch('/api/admin/question-move', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ questionId, ...body }) })
    setBusy(false)
    return r.ok
  }

  if (moved) {
    return (
      <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center', fontSize: 14, color: C.mintText, fontWeight: 700 }}>
        הועברה ל{moved}
        <button disabled={busy} onClick={async () => { if (await post({ action: 'undo' })) { setMoved(null); onMoved() } }} style={{ ...pillBtn(), minHeight: 34, fontSize: 13 }}><Undo2 size={13} /> לבטל</button>
      </span>
    )
  }
  if (!open) {
    return <button onClick={() => setOpen(true)} style={{ ...pillBtn(), minHeight: 36, fontSize: 14 }}><ArrowLeftRight size={14} /> שייכת לכיתה או לשיעור אחר</button>
  }
  const sel: React.CSSProperties = { minHeight: 36, borderRadius: 10, border: `1.5px solid ${C.border}`, padding: '0 8px', fontFamily: F.body, fontSize: 14, background: '#fff', maxWidth: 260 }
  return (
    <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', background: C.pageBg, borderRadius: 12, padding: '6px 8px' }}>
      <span style={{ fontSize: 14, fontWeight: 700 }}>להעביר ל:</span>
      <select value={g} onChange={e => setG(Number(e.target.value))} style={sel} aria-label="כיתה">
        {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>כיתה {GRADE[n]}</option>)}
      </select>
      <select value={t} onChange={e => setT(e.target.value)} style={sel} aria-label="שיעור">
        {!all.length && <option>טוען…</option>}
        {inGrade.map(x => <option key={x.id} value={x.id} disabled={x.id === topicId}>{x.title_he || x.title_en}{x.id === topicId ? ' (כאן עכשיו)' : ''}</option>)}
      </select>
      <button disabled={!t || busy} onClick={async () => {
        const name = inGrade.find(x => x.id === t)
        if (await post({ action: 'move', topicId: t })) { setMoved(`${name?.title_he || ''}, כיתה ${GRADE[g]}`); onMoved() }
      }} style={{ ...pillBtn(true), minHeight: 36, fontSize: 14 }}>{busy ? <Loader2 size={14} className="animate-spin" /> : null} להעביר</button>
      <button onClick={() => setOpen(false)} style={{ ...pillBtn(), minHeight: 36, fontSize: 14 }}>ביטול</button>
    </span>
  )
}
