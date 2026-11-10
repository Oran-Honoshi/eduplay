'use client'
import { useEffect, useRef, useState } from 'react'
import { Search, X, Printer, Play, Sparkles, Loader2, BookOpen } from 'lucide-react'

// Search the library of ready workbooks: type part of a word and pick a
// matching tag from the suggestions (or just search by the text), narrow by
// subject / grade / type, and use a workbook right away.
//   mode 'public' → open the printable page
//   mode 'parent' → use it for my child (opens in Create, ready to print or send)
//   mode 'kid'    → start it now as practice in the app
const C = { primary: '#2F5BE3', primaryLight: '#EAF0FF', text: '#16213E', sub: '#4A5672', muted: '#5E6B85', border: '#E8E2D6', page: '#FAF7F2' }
const H = '"Rubik","Assistant",sans-serif'
const SUBJ: Record<string, { he: string; bg: string; fg: string }> = {
  math: { he: 'חשבון', bg: '#EAF0FF', fg: '#2148C0' }, hebrew: { he: 'עברית', bg: '#FDECE7', fg: '#B4432A' }, english: { he: 'אנגלית', bg: '#E3F5EF', fg: '#0B6B58' },
}
const KIND: Record<string, string> = { practice: 'תרגול', exam: 'מבחן', explanation: 'דף הסבר' }
const GRADES = ['גן', 'כיתה א׳', 'כיתה ב׳', 'כיתה ג׳', 'כיתה ד׳', 'כיתה ה׳', 'כיתה ו׳', 'כיתה ז׳', 'כיתה ח׳', 'כיתה ט׳', 'כיתה י׳', 'כיתה י״א', 'כיתה י״ב']

export default function LibrarySearch({ mode, childId, grade: grade0, subject: subject0, compact = false, initialText = '' }: {
  mode: 'public' | 'parent' | 'kid'; childId?: string; grade?: number | null; subject?: string | null; compact?: boolean; initialText?: string
}) {
  const [text, setText] = useState(initialText)
  const [tags, setTags] = useState<string[]>([])
  const [subject, setSubject] = useState<string>(subject0 || '')
  const [grade, setGrade] = useState<string>(grade0 != null ? String(grade0) : '')
  const [kind, setKind] = useState<string>(mode === 'kid' ? 'practice' : '')
  const [sugg, setSugg] = useState<{ tag: string; n: number }[]>([])
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<any[] | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = setTimeout(() => {
      fetch(`/api/library/tags?q=${encodeURIComponent(text.trim())}`).then(r => r.json()).then(d => setSugg((d.tags || []).filter((x: any) => !tags.includes(x.tag)))).catch(() => {})
    }, 150)
    return () => clearTimeout(t)
  }, [text, tags])

  useEffect(() => {
    const p = new URLSearchParams()
    if (text.trim()) p.set('q', text.trim())
    if (tags.length) p.set('tags', tags.join(','))
    if (subject) p.set('subject', subject)
    if (grade) p.set('grade', grade)
    if (kind) p.set('kind', kind)
    p.set('limit', compact ? '6' : '60')
    const t = setTimeout(() => { setItems(null); fetch(`/api/library?${p}`).then(r => r.json()).then(d => setItems(d.items || [])).catch(() => setItems([])) }, 200)
    return () => clearTimeout(t)
  }, [text, tags, subject, grade, kind, compact])

  useEffect(() => {
    const close = (e: MouseEvent) => { if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', close); return () => document.removeEventListener('mousedown', close)
  }, [])

  function addTag(t: string) { setTags(x => [...x, t]); setText(''); setOpen(false) }

  async function use(item: any) {
    setBusy(item.id)
    try {
      if (mode === 'parent') {
        const r = await fetch('/api/quickstart/use', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ source: 'library', id: item.id, child_id: childId || null, ready: true }) })
        const d = await r.json()
        if (d.material?.id) { window.location.href = `/create?open=${d.material.id}`; return }
      } else if (mode === 'kid') {
        const r = await fetch('/api/kid/workbook', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ materialId: item.id }) })
        const d = await r.json()
        if (d.assignmentId) { const sp = new URLSearchParams(window.location.search); window.location.href = `/assignment?id=${d.assignmentId}&childId=${childId}${sp.get('token') ? `&token=${sp.get('token')}` : ''}${sp.get('theme') ? `&theme=${sp.get('theme')}` : ''}`; return }
      }
    } catch {}
    setBusy(null)
  }

  const sel: React.CSSProperties = { minHeight: 44, borderRadius: 12, border: `1px solid ${C.border}`, padding: '0 10px', fontSize: 15, fontFamily: 'inherit', background: '#fff', color: C.text }
  const kidBig = mode === 'kid'

  return (
    <div dir="rtl" style={{ display: 'flex', flexDirection: 'column', gap: 12, fontFamily: '"Assistant",sans-serif', color: C.text }}>
      <div ref={boxRef} style={{ position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', minHeight: kidBig ? 56 : 50, background: '#fff', border: `1.5px solid ${open ? C.primary : C.border}`, borderRadius: 16, padding: '6px 12px' }}>
          <Search size={18} color={C.muted} />
          {tags.map(t => (
            <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: C.primaryLight, color: '#2148C0', borderRadius: 999, padding: '4px 10px', fontWeight: 700, fontSize: 14 }}>
              {t}<button aria-label={`להסיר ${t}`} onClick={() => setTags(x => x.filter(y => y !== t))} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#2148C0', padding: 0, display: 'flex' }}><X size={14} /></button>
            </span>
          ))}
          <input value={text} onChange={e => { setText(e.target.value); setOpen(true) }} onFocus={() => setOpen(true)}
            onKeyDown={e => { if (e.key === 'Enter' && sugg[0] && text.trim()) addTag(sugg[0].tag); if (e.key === 'Backspace' && !text && tags.length) setTags(x => x.slice(0, -1)) }}
            placeholder={tags.length ? 'עוד מילה…' : mode === 'kid' ? 'על מה בא לך לתרגל? (למשל: שברים)' : 'חיפוש: נושא, מיומנות, כיתה… (למשל: שברים, כפל, מבחן)'}
            style={{ flex: 1, minWidth: 160, border: 'none', outline: 'none', fontSize: kidBig ? 18 : 16, fontFamily: 'inherit', background: 'transparent', color: C.text }} />
        </div>
        {open && sugg.length > 0 && (
          <div role="listbox" style={{ position: 'absolute', insetInline: 0, top: '100%', marginTop: 4, background: '#fff', border: `1px solid ${C.border}`, borderRadius: 14, boxShadow: '0 10px 30px rgba(22,33,62,.12)', zIndex: 50, maxHeight: 300, overflowY: 'auto', padding: 6 }}>
            {!text.trim() && <div style={{ fontSize: 12, fontWeight: 800, color: C.muted, padding: '4px 8px' }}>חיפושים נפוצים</div>}
            {sugg.map(s => (
              <button key={s.tag} role="option" onClick={() => addTag(s.tag)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, minHeight: 40, padding: '0 10px', border: 'none', background: 'none', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: 15, color: C.text, textAlign: 'start' }}
                onMouseEnter={e => (e.currentTarget.style.background = C.page)} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                <span>{highlight(s.tag, text)}</span><span style={{ fontSize: 12, color: C.muted }}>{s.n}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {!compact && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <select aria-label="מקצוע" value={subject} onChange={e => setSubject(e.target.value)} style={sel}>
            <option value="">כל המקצועות</option>
            {Object.entries(SUBJ).map(([k, v]) => <option key={k} value={k}>{v.he}</option>)}
          </select>
          <select aria-label="כיתה" value={grade} onChange={e => setGrade(e.target.value)} style={sel}>
            <option value="">כל הכיתות</option>
            {GRADES.map((g, i) => <option key={i} value={i}>{g}</option>)}
          </select>
          {mode !== 'kid' && (
            <select aria-label="סוג" value={kind} onChange={e => setKind(e.target.value)} style={sel}>
              <option value="">כל הסוגים</option>
              {Object.entries(KIND).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          )}
        </div>
      )}

      {items === null ? <div style={{ color: C.muted }}>מחפשים…</div> : items.length === 0 ? (
        <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, color: C.sub }}>
          לא מצאנו חוברת מוכנה בדיוק לזה.{mode === 'parent' ? ' אפשר ליצור אחת מותאמת בדקה.' : ''}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill,minmax(${kidBig ? 240 : 250}px,1fr))`, gap: 10 }}>
          {items.map(it => {
            const s = SUBJ[it.subject_slug] || SUBJ.math
            return (
              <div key={it.id} style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 16, padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', fontSize: 12, fontWeight: 800 }}>
                  <span style={{ background: s.bg, color: s.fg, borderRadius: 99, padding: '2px 8px' }}>{s.he}</span>
                  <span style={{ background: '#F3EFE6', color: C.sub, borderRadius: 99, padding: '2px 8px' }}>{GRADES[it.grade] || ''}</span>
                  <span style={{ background: '#F3EFE6', color: C.sub, borderRadius: 99, padding: '2px 8px' }}>{KIND[it.kind] || ''}{it.n_questions ? ` · ${it.n_questions} שאלות` : ''}</span>
                  {it.house && <span style={{ background: '#FFF4D1', color: '#7A5600', borderRadius: 99, padding: '2px 8px' }}>EduPlay</span>}
                </div>
                <div style={{ fontFamily: H, fontWeight: 700, fontSize: kidBig ? 18 : 16, lineHeight: 1.35 }}>{it.title}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 'auto', flexWrap: 'wrap' }}>
                  {mode === 'kid' ? (
                    <button disabled={busy === it.id} onClick={() => use(it)} style={btn(true, kidBig)}>{busy === it.id ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />} מתחילים</button>
                  ) : <>
                    {mode === 'parent' && <button disabled={busy === it.id} onClick={() => use(it)} style={btn(true)}>{busy === it.id ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />} להשתמש</button>}
                    {it.share_slug && <a href={`/s/${it.share_slug}`} target="_blank" rel="noopener noreferrer" style={btn(mode === 'public')}><Printer size={16} /> {mode === 'public' ? 'להורדה ולהדפסה' : 'תצוגה'}</a>}
                  </>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function btn(primary: boolean, big = false): React.CSSProperties {
  return { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: big ? 52 : 40, padding: '0 14px', borderRadius: 999, border: primary ? 'none' : '1px solid #E8E2D6', background: primary ? '#2F5BE3' : '#fff', color: primary ? '#fff' : '#16213E', fontWeight: 800, fontSize: big ? 17 : 14, cursor: 'pointer', textDecoration: 'none', fontFamily: '"Assistant",sans-serif', flex: big ? 1 : undefined }
}

function highlight(tag: string, q: string) {
  const t = q.trim(); if (!t) return tag
  const i = tag.indexOf(t); if (i < 0) return tag
  return <>{tag.slice(0, i)}<b style={{ color: '#2148C0' }}>{tag.slice(i, i + t.length)}</b>{tag.slice(i + t.length)}</>
}

export { BookOpen as LibraryIcon }
