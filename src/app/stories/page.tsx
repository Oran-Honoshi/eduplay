'use client'
import React, { useEffect, useState } from 'react'
import { Printer, BookOpen, Upload, Check, EyeOff, FileText, Trash2 } from 'lucide-react'
import { PARENT_COLORS as C, PARENT_FONTS as F } from '@/lib/parentTheme'
import ParentPage from '@/components/parent/ParentPage'
import { lineHtml, type StoryBooklet } from '@/lib/storyBooklet'

// Parents: the story booklets — print one, or open it in the reader to read
// together. The admin also sees drafts, approves/hides them, and uploads the
// illustration for each page (cover + pages).
export default function StoriesPage() {
  const [list, setList] = useState<StoryBooklet[] | null>(null)
  const [admin, setAdmin] = useState(false)
  const [open, setOpen] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  // one niqqud level at a time (remembered in the link: /stories?level=3)
  const [level, setLevel] = useState(1)
  useEffect(() => { const l = Number(new URLSearchParams(window.location.search).get('level')); if (l >= 1 && l <= 6) setLevel(l) }, [])
  const pick = (l: number) => { setLevel(l); try { window.history.replaceState(null, '', `?level=${l}`) } catch {} }

  async function load() {
    const r = await fetch('/api/stories?all=1')
    if (r.status === 401) { window.location.href = '/'; return }
    const d = await r.json(); setList(d.booklets); setAdmin(!!d.admin)
  }
  useEffect(() => { load() }, [])

  const LEVELS: [number, string][] = [[1, 'קמץ ופתח'], [2, 'שווא'], [3, 'חטף פתח וחיריק'], [4, 'צירה וסגול'], [5, 'חולם'], [6, 'שורוק וקובוץ']]
  const countOf = (l: number) => (list || []).filter(b => b.level_number === l).length
  const shown = (list || []).filter(b => b.level_number === level)

  const replace = (b: StoryBooklet) => setList(l => (l || []).map(x => (x.id === b.id ? b : x)))
  async function patch(id: string, body: any) {
    const r = await fetch(`/api/stories/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (r.ok) replace((await r.json()).booklet)
  }
  async function upload(id: string, slot: string, file: File) {
    setBusy(`${id}:${slot}`); setMsg(null)
    const fd = new FormData(); fd.append('file', file); fd.append('slot', slot)
    const r = await fetch(`/api/stories/${id}/art`, { method: 'POST', body: fd })
    setBusy(null)
    if (r.ok) replace((await r.json()).booklet); else setMsg((await r.json().catch(() => ({}))).error || 'ההעלאה נכשלה')
  }

  const pill = (bg: string, fg: string): React.CSSProperties => ({ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 50, border: 'none', background: bg, color: fg, fontWeight: 800, fontSize: 13, cursor: 'pointer', textDecoration: 'none', fontFamily: 'inherit' })
  const STATUS: Record<string, [string, string, string]> = { draft: ['טיוטה', C.amberLight, C.amberText], approved: ['פעיל', C.accentLight, C.accent], hidden: ['מוסתר', '#EEE', '#666'] }

  const slotBox = (b: StoryBooklet, slot: string, url: string | null | undefined, label: string, lines: string[], scene?: string) => (
    <div key={slot} style={{ border: `1px solid ${C.border}`, borderRadius: 12, padding: 10, display: 'flex', gap: 10, alignItems: 'flex-start', background: '#fff' }}>
      <label style={{ width: 96, height: 96, flexShrink: 0, borderRadius: 10, border: `1.5px dashed ${C.border}`, background: url ? `center/cover url(${url})` : '#FAF8F3', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.textMuted }}>
        {busy === `${b.id}:${slot}` ? '…' : !url && <Upload size={20} />}
        <input type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={e => { const f = e.target.files?.[0]; if (f) upload(b.id, slot, f); e.target.value = '' }} />
      </label>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 800, fontSize: 13, color: C.textSecondary }}>{label}</div>
        {lines.map((l, i) => <div key={i} style={{ fontSize: 17, fontWeight: 600 }} dangerouslySetInnerHTML={{ __html: lineHtml(l) }} />)}
        {scene && <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4, lineHeight: 1.5 }}>{scene}</div>}
        {url && <button onClick={() => patch(b.id, { clear_image: slot === 'cover' ? 'cover' : Number(slot) })} style={{ ...pill('transparent', '#B42318'), padding: '4px 0', fontSize: 12 }}><Trash2 size={12} /> הסרת האיור</button>}
      </div>
    </div>
  )

  return (
    <ParentPage section="create" title="ספרוני קריאה ראשונה" back={{ href: '/dashboard?tab=create', label: 'יצירה' }}
      subtitle="סיפורים קצרים לפי רמות ניקוד (רמה 1: קמץ ופתח, רמה 2: גם שווא, רמה 3: גם חטף פתח וחיריק, רמה 4: גם צירה וסגול, רמה 5: גם חולם, רמה 6: גם שורוק וקובוץ), עם תמונות קטנות במקום מילים שעוד לא למדו. אפשר להדפיס (A5) או לקרוא יחד באפליקציה — הילדים מוצאים אותם גם במסך הבית שלהם.">
        {msg && <div style={{ background: '#FDECEC', color: '#B42318', padding: '10px 14px', borderRadius: 12, fontWeight: 700 }}>{msg}</div>}
        <div role="tablist" aria-label="רמות ניקוד" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {LEVELS.map(([l, name]) => (
            <button key={l} role="tab" aria-selected={level === l} onClick={() => pick(l)}
              style={{ minHeight: 48, padding: '0 16px', borderRadius: 50, border: `2px solid ${level === l ? C.primary : C.border}`, background: level === l ? C.primaryLight : '#fff', color: level === l ? C.primary : C.text, fontWeight: 800, fontSize: 15, cursor: 'pointer' }}>
              רמה {l}: {name}{list ? ` (${countOf(l)})` : ''}
            </button>
          ))}
        </div>
        {!list ? <div style={{ color: C.textMuted }}>טוען…</div> : shown.length === 0 ? <div style={{ color: C.textMuted }}>עוד אין ספרונים פעילים ברמה הזו.</div> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 12 }}>
            {shown.map(b => {
              const [sl, sbg, sfg] = STATUS[b.status] || STATUS.draft
              const drawn = [b.cover?.image_url, ...b.pages.map(p => p.image_url)].filter(Boolean).length
              return (
                <div key={b.id} style={{ gridColumn: open === b.id ? '1 / -1' : undefined, background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ width: 64, height: 64, borderRadius: 12, flexShrink: 0, background: b.cover?.image_url ? `center/cover url(${b.cover.image_url})` : '#FFE9B8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 22, color: '#C2337F' }}>{!b.cover?.image_url && b.number}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, color: C.textMuted, fontWeight: 700 }}>רמה {b.level_number} · ספרון {b.number} · {b.pages.length} עמודים</div>
                      <div style={{ fontFamily: '"Noto Sans Hebrew","Rubik",sans-serif', fontSize: 21, fontWeight: 800 }} dangerouslySetInnerHTML={{ __html: lineHtml(b.title_he) }} />
                      {admin && <div style={{ display: 'flex', gap: 6, marginTop: 4, fontSize: 12 }}><span style={{ background: sbg, color: sfg, borderRadius: 50, padding: '2px 8px', fontWeight: 800 }}>{sl}</span><span style={{ color: C.textMuted }}>איורים: {drawn}/{b.pages.length + 1}</span></div>}
                    </div>
                  </div>
                  {b.cover?.theme && <div style={{ fontSize: 12, color: C.textMuted, fontWeight: 700 }}>{b.cover.theme}</div>}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <a href={`/api/stories/${b.id}/print`} target="_blank" rel="noreferrer" style={pill(C.primary, '#fff')}><Printer size={14} /> הדפסה</a>
                    <a href={`/read/${b.id}`} style={pill(C.primaryLight, C.primary)}><BookOpen size={14} /> לקרוא יחד</a>
                    {admin && <>
                      <button onClick={() => setOpen(open === b.id ? null : b.id)} style={pill('#F3EFE6', C.text)}><Upload size={14} /> איורים</button>
                      <a href={`/api/stories/${b.id}/print?brief=1&noprint=1`} target="_blank" rel="noreferrer" style={pill('#F3EFE6', C.text)}><FileText size={14} /> הנחיות איור</a>
                      {b.status !== 'approved' && <button onClick={() => patch(b.id, { status: 'approved' })} style={pill(C.accentLight, C.accent)}><Check size={14} /> אישור</button>}
                      {b.status === 'approved' && <button onClick={() => patch(b.id, { status: 'hidden' })} style={pill('#EEE', '#555')}><EyeOff size={14} /> הסתרה</button>}
                    </>}
                  </div>
                  {admin && open === b.id && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 8 }}>
                      {slotBox(b, 'cover', b.cover?.image_url, 'כריכה', [b.title_he], b.cover?.scene)}
                      {b.pages.map((p, i) => slotBox(b, String(i), p.image_url, `עמוד ${i + 1}`, p.lines, p.scene))}
                      {b.cover?.parents?.text?.length ? (
                        <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, padding: 12, background: '#F4F7FF', fontSize: 13, lineHeight: 1.7 }}>
                          <div style={{ fontWeight: 800 }}>פינת הורים{b.cover.parents.title ? ` · ${b.cover.parents.title}` : ''}</div>
                          {b.cover.parents.text.map((t, i) => <div key={i}>{t}</div>)}
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
    </ParentPage>
  )
}
