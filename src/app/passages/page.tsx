'use client'
import { useEffect, useMemo, useState } from 'react'
import { BookOpen, Printer, Search, Sparkles, X, Check, Loader2 } from 'lucide-react'
import ParentPage, { card, chip, pillBtn, GRADE_HE } from '@/components/parent/ParentPage'
import { PARENT_COLORS as C, PARENT_FONTS as F, SUBJECT_COLORS } from '@/lib/parentTheme'
import { createBrowserClient } from '@/lib/supabase'
import { apiErrorText } from '@/lib/apiError'

// Reading passages (Library): short stories and texts with comprehension
// questions, by grade. Read on screen, print with questions, or write a new
// one. The EduPlay admin also sees the review queue here.
const supabase = createBrowserClient()

const TYPE_HE: Record<string, string> = { story: 'סיפור', informational: 'מידע', argumentative: 'טיעון', poem: 'שיר' }
const DIFF_HE: Record<string, string> = { easy: 'קל', medium: 'בינוני', hard: 'מאתגר' }
const SUBJ_HE: Record<string, string> = { hebrew: 'עברית', english: 'אנגלית' }

type Q = { id: string; prompt_en: string | null; prompt_he: string | null; options: any; correct_answer: string | null; sort_order: number | null; approved: boolean }
type P = {
  id: string; grade: number; subject: string; passage_type: string; difficulty: string
  title_en: string; title_he: string | null; content_en: string | null; content_he: string | null
  word_count_en: number | null; word_count_he: number | null; questions: Q[]
}

const esc = (s: string) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' } as any)[c])
const optText = (o: any) => (typeof o === 'string' ? o : o?.text_he || o?.text || o?.label || o?.text_en || '')

export default function PassagesPage() {
  const [tab, setTab] = useState<'library' | 'new' | 'review'>('library')
  const [all, setAll] = useState<P[] | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [subject, setSubject] = useState('all')
  const [grade, setGrade] = useState<number | 'all'>('all')
  const [q, setQ] = useState('')
  const [open, setOpen] = useState<P | null>(null)

  async function load() {
    const [{ data: subjects }, { data }] = await Promise.all([
      supabase.from('subjects').select('id,slug'),
      supabase.from('reading_passages').select('*, passage_questions(id,prompt_en,prompt_he,options,correct_answer,sort_order,approved)').eq('approved', true).order('grade'),
    ])
    const slug: Record<string, string> = Object.fromEntries((subjects || []).map((s: any) => [s.id, s.slug]))
    setAll((data || []).map((p: any) => ({ ...p, subject: slug[p.subject_id] || p.subject || 'english', questions: (p.passage_questions || []).filter((x: Q) => x.approved).sort((a: Q, b: Q) => (a.sort_order ?? 0) - (b.sort_order ?? 0)) })))
  }
  useEffect(() => {
    load()
    fetch('/api/stories?all=1').then(r => (r.ok ? r.json() : {})).then((d: any) => setIsAdmin(!!d.admin)).catch(() => {})
  }, [])

  const shown = useMemo(() => (all || []).filter(p =>
    (subject === 'all' || p.subject === subject) && (grade === 'all' || p.grade === grade) &&
    (!q.trim() || `${p.title_en} ${p.title_he || ''}`.toLowerCase().includes(q.trim().toLowerCase()))), [all, subject, grade, q])

  return (
    <ParentPage section="library" title="קטעי קריאה" subtitle="סיפורים וטקסטים קצרים עם שאלות הבנה, לפי כיתה. לקרוא על המסך, להדפיס עם השאלות, או לכתוב קטע חדש.">
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <button onClick={() => setTab('library')} style={chip(tab === 'library')}><BookOpen size={15} /> כל הקטעים</button>
        <button onClick={() => setTab('new')} style={chip(tab === 'new')}><Sparkles size={15} /> קטע חדש</button>
        {isAdmin && <button onClick={() => setTab('review')} style={chip(tab === 'review')}>ממתינים לאישור</button>}
      </div>

      {tab === 'library' && <>
        <div style={{ ...card, padding: 14, display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} color={C.textMuted} style={{ position: 'absolute', insetInlineStart: 14, top: 14 }} />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="חיפוש לפי שם" style={{ width: '100%', boxSizing: 'border-box', minHeight: 44, borderRadius: 12, border: `1px solid ${C.border}`, paddingInlineStart: 38, fontSize: 15, fontFamily: F.body }} />
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => setSubject('all')} style={chip(subject === 'all')}>כל השפות</button>
            {['hebrew', 'english'].map(s => <button key={s} onClick={() => setSubject(s)} style={chip(subject === s, SUBJECT_COLORS[s].fg, SUBJECT_COLORS[s].bg)}>{SUBJ_HE[s]}</button>)}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => setGrade('all')} style={chip(grade === 'all')}>כל הכיתות</button>
            {[0, 1, 2, 3, 4, 5, 6].map(g => <button key={g} onClick={() => setGrade(g)} style={chip(grade === g)}>{GRADE_HE[g]}</button>)}
          </div>
        </div>
        {all === null ? <div style={{ color: C.textMuted }}>טוען…</div> : shown.length === 0 ? (
          <div style={{ ...card, padding: 32, textAlign: 'center', color: C.textSecondary }}>אין קטעים שמתאימים לבחירה. אפשר לכתוב קטע חדש.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 12 }}>
            {shown.map(p => {
              const he = p.subject === 'hebrew' || (!p.content_en && !!p.content_he)
              const sc = SUBJECT_COLORS[p.subject] || SUBJECT_COLORS.english
              const words = p.word_count_he ?? p.word_count_en ?? 0
              return (
                <button key={p.id} onClick={() => setOpen(p)} style={{ ...card, padding: 16, textAlign: 'start', cursor: 'pointer', fontFamily: F.body, color: C.text, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <Tag bg={sc.bg} fg={sc.fg}>{SUBJ_HE[p.subject] || p.subject}</Tag>
                    <Tag>{GRADE_HE[p.grade]}</Tag>
                    <Tag>{TYPE_HE[p.passage_type] || p.passage_type}</Tag>
                    <Tag>{DIFF_HE[p.difficulty] || p.difficulty}</Tag>
                  </span>
                  <span dir={he ? 'rtl' : 'ltr'} style={{ fontFamily: F.heading, fontWeight: 800, fontSize: 17, lineHeight: 1.35, textAlign: 'start' }}>{he ? (p.title_he || p.title_en) : p.title_en}</span>
                  <span style={{ fontSize: 13, color: C.textMuted }}>{words ? `כ־${words} מילים` : ''}{p.questions.length ? ` · ${p.questions.length} שאלות הבנה` : ''}</span>
                </button>
              )
            })}
          </div>
        )}
      </>}

      {tab === 'new' && <NewPassage onDone={() => { load(); setTab(isAdmin ? 'review' : 'library') }} isAdmin={isAdmin} />}
      {tab === 'review' && isAdmin && <Review onChanged={load} />}
      {open && <Reader p={open} onClose={() => setOpen(null)} />}
    </ParentPage>
  )
}

function Tag({ children, bg = '#F3EFE6', fg = C.textSecondary }: { children: React.ReactNode; bg?: string; fg?: string }) {
  return <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: bg, color: fg }}>{children}</span>
}

function Reader({ p, onClose }: { p: P; onClose: () => void }) {
  const both = !!(p.content_en && p.content_he)
  const [lang, setLang] = useState<'he' | 'en'>(p.subject === 'english' && p.content_en ? 'en' : p.content_he ? 'he' : 'en')
  const he = lang === 'he'
  const title = he ? (p.title_he || p.title_en) : p.title_en
  const content = (he ? p.content_he : p.content_en) || ''
  const qText = (x: Q) => (he ? x.prompt_he || x.prompt_en : x.prompt_en || x.prompt_he) || ''

  function print(withAnswers: boolean) {
    const w = window.open('', '_blank'); if (!w) return
    const qs = p.questions.map((x, i) => {
      const opts = Array.isArray(x.options) ? x.options.map(optText).filter(Boolean) : []
      return `<li><div class="q">${esc(qText(x))}</div>${opts.length ? `<ol class="opts">${opts.map(o => `<li>${esc(o)}</li>`).join('')}</ol>` : '<div class="line"></div><div class="line"></div>'}${withAnswers && x.correct_answer ? `<div class="ans">תשובה: ${esc(x.correct_answer)}</div>` : ''}</li>`
    }).join('')
    w.document.write(`<!DOCTYPE html><html lang="${lang}" dir="${he ? 'rtl' : 'ltr'}"><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Hebrew:wght@400;700&display=swap');
body{font-family:'Noto Sans Hebrew',Arial,sans-serif;max-width:720px;margin:0 auto;padding:32px;color:#16213E}
h1{font-size:24px;margin:0 0 4px}.meta{color:#5E6B85;font-size:13px;margin-bottom:20px}.name{margin-bottom:20px;font-size:14px}
p{font-size:16px;line-height:1.9;margin:0 0 12px}h2{font-size:18px;margin:28px 0 10px}ol{padding-inline-start:22px}li{margin-bottom:14px}
.q{font-weight:700}.opts{list-style:hebrew;margin-top:6px}.opts li{margin-bottom:4px}.line{border-bottom:1px solid #999;height:26px}.ans{color:#0B6B58;font-size:13px;margin-top:4px}
@media print{body{padding:0}}</style></head><body>
<div class="name">שם: ____________ &nbsp; תאריך: ________</div>
<h1>${esc(title)}</h1><div class="meta">${GRADE_HE[p.grade] || ''} · ${TYPE_HE[p.passage_type] || ''} · EduPlay</div>
${content.split(/\n\s*\n/).map(x => `<p>${esc(x)}</p>`).join('')}
${qs ? `<h2>${he ? 'שאלות' : 'Questions'}</h2><ol>${qs}</ol>` : ''}
<script>setTimeout(()=>window.print(),500)</script></body></html>`)
    w.document.close()
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(22,33,62,.45)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={e => e.stopPropagation()} dir="rtl" style={{ ...card, width: '100%', maxWidth: 720, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: `1px solid ${C.border}`, flexWrap: 'wrap' }}>
          {both && <>
            <button onClick={() => setLang('he')} style={chip(he)}>עברית</button>
            <button onClick={() => setLang('en')} style={chip(!he)}>English</button>
          </>}
          <span style={{ flex: 1 }} />
          <button onClick={() => print(false)} style={{ ...pillBtn(), minHeight: 40, fontSize: 14 }}><Printer size={15} /> הדפסה</button>
          {p.questions.length > 0 && <button onClick={() => print(true)} style={{ ...pillBtn(), minHeight: 40, fontSize: 14 }}>עם תשובות</button>}
          <button onClick={onClose} aria-label="סגירה" style={{ width: 40, height: 40, borderRadius: 99, border: `1px solid ${C.border}`, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} /></button>
        </div>
        <div dir={he ? 'rtl' : 'ltr'} style={{ overflowY: 'auto', padding: '20px 24px 28px', textAlign: 'start' }}>
          <h2 style={{ fontFamily: F.heading, fontSize: 24, margin: '0 0 14px' }}>{title}</h2>
          {content ? content.split(/\n\s*\n/).map((x, i) => <p key={i} style={{ fontSize: 17, lineHeight: 1.9, margin: '0 0 12px' }}>{x}</p>) : <p style={{ color: C.textMuted }}>{he ? 'אין נוסח בשפה הזו.' : 'No text in this language.'}</p>}
          {p.questions.length > 0 && <>
            <h3 style={{ fontFamily: F.heading, fontSize: 19, margin: '24px 0 10px' }}>{he ? 'שאלות הבנה' : 'Comprehension questions'}</h3>
            <ol style={{ paddingInlineStart: 22, margin: 0 }}>
              {p.questions.map(x => <li key={x.id} style={{ marginBottom: 12, fontSize: 16, lineHeight: 1.6 }}>
                <div style={{ fontWeight: 700 }}>{qText(x)}</div>
                {Array.isArray(x.options) && <ul style={{ margin: '4px 0 0', paddingInlineStart: 18, color: C.textSecondary }}>{x.options.map((o: any, i: number) => <li key={i}>{optText(o)}</li>)}</ul>}
              </li>)}
            </ol>
          </>}
        </div>
      </div>
    </div>
  )
}

function NewPassage({ onDone, isAdmin }: { onDone: () => void; isAdmin: boolean }) {
  const [grade, setGrade] = useState(2)
  const [subject, setSubject] = useState('hebrew')
  const [type, setType] = useState('story')
  const [difficulty, setDifficulty] = useState('medium')
  const [topic, setTopic] = useState('')
  const [extra, setExtra] = useState('')
  const [withQ, setWithQ] = useState(true)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function go() {
    setBusy(true); setMsg(null)
    try {
      const r = await fetch('/api/passages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ grade, subject, type, difficulty, topic: topic || undefined, custom_prompt: extra || undefined, generate_questions: withQ || undefined }) })
      const d = await r.json()
      if (d.success) { setMsg({ ok: true, text: isAdmin ? 'הקטע נכתב ומחכה לאישור בלשונית "ממתינים לאישור".' : 'הקטע נכתב ונשלח לבדיקה. אחרי האישור הוא יופיע בספרייה.' }); setTopic(''); setExtra(''); setTimeout(onDone, 1200) }
      else setMsg({ ok: false, text: apiErrorText(r.status, d.error, 'לא הצלחנו לכתוב את הקטע. נסו שוב.') })
    } catch { setMsg({ ok: false, text: 'לא הצלחנו לכתוב את הקטע. נסו שוב.' }) }
    setBusy(false)
  }

  const field: React.CSSProperties = { width: '100%', boxSizing: 'border-box', minHeight: 44, borderRadius: 12, border: `1px solid ${C.border}`, padding: '10px 12px', fontSize: 15, fontFamily: F.body, background: '#fff' }
  return (
    <div style={{ ...card, padding: 18, display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 720 }}>
      <Group label="שפה">{['hebrew', 'english'].map(s => <button key={s} onClick={() => setSubject(s)} style={chip(subject === s, SUBJECT_COLORS[s].fg, SUBJECT_COLORS[s].bg)}>{SUBJ_HE[s]}</button>)}</Group>
      <Group label="כיתה">{[0, 1, 2, 3, 4, 5, 6].map(g => <button key={g} onClick={() => setGrade(g)} style={chip(grade === g)}>{GRADE_HE[g]}</button>)}</Group>
      <Group label="סוג">{Object.entries(TYPE_HE).map(([k, v]) => <button key={k} onClick={() => setType(k)} style={chip(type === k)}>{v}</button>)}</Group>
      <Group label="רמה">{Object.entries(DIFF_HE).map(([k, v]) => <button key={k} onClick={() => setDifficulty(k)} style={chip(difficulty === k)}>{v}</button>)}</Group>
      <label style={{ fontWeight: 800, fontSize: 14 }}>על מה? (לא חובה)
        <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="לדוגמה: דבורים, הירח, חברות" style={{ ...field, marginTop: 6, fontWeight: 400 }} />
      </label>
      <label style={{ fontWeight: 800, fontSize: 14 }}>הערות נוספות (לא חובה)
        <textarea value={extra} onChange={e => setExtra(e.target.value)} rows={2} placeholder="לדוגמה: משפטים קצרים, דמות שמתמודדת עם פחד" style={{ ...field, marginTop: 6, fontWeight: 400, resize: 'vertical' }} />
      </label>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15 }}><input type="checkbox" checked={withQ} onChange={e => setWithQ(e.target.checked)} style={{ width: 18, height: 18 }} /> להוסיף שאלות הבנה</label>
      {msg && <div style={{ padding: '10px 14px', borderRadius: 12, background: msg.ok ? C.mintLight : C.dangerLight, color: msg.ok ? C.mintText : C.danger, fontWeight: 700 }}>{msg.text}</div>}
      <button onClick={go} disabled={busy} style={{ ...pillBtn(true), alignSelf: 'flex-start', opacity: busy ? 0.7 : 1 }}>{busy ? <><Loader2 size={16} className="animate-spin" /> כותבים… (עד דקה)</> : <><Sparkles size={16} /> לכתוב את הקטע</>}</button>
    </div>
  )
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}><span style={{ width: 48, fontSize: 13, fontWeight: 800, color: C.textMuted }}>{label}</span>{children}</div>
}

function Review({ onChanged }: { onChanged: () => void }) {
  const [list, setList] = useState<any[] | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  async function load() { const r = await fetch('/api/passages/pending'); const d = await r.json().catch(() => ({})); setList(d.passages || []) }
  useEffect(() => { load() }, [])
  async function act(kind: 'passage' | 'question', id: string, action: 'approve' | 'reject') {
    setBusy(id)
    await fetch(kind === 'passage' ? `/api/passages/${id}` : `/api/passages/questions/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) })
    setBusy(null); await load(); onChanged()
  }
  if (!list) return <div style={{ color: C.textMuted }}>טוען…</div>
  if (!list.length) return <div style={{ ...card, padding: 28, textAlign: 'center', color: C.textSecondary }}>אין קטעים שממתינים לאישור.</div>
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {list.map((p: any) => {
        const he = !!p.content_he && !p.content_en
        const qs = (p.passage_questions || []).filter((x: any) => !x.approved && !x.rejected_at)
        return (
          <div key={p.id} style={{ ...card, padding: 16 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <strong style={{ fontSize: 17, flex: 1 }} dir={he ? 'rtl' : 'ltr'}>{he ? p.title_he || p.title_en : p.title_en}</strong>
              {!p.approved && <>
                <button disabled={busy === p.id} onClick={() => act('passage', p.id, 'approve')} style={{ ...pillBtn(true), minHeight: 38, fontSize: 14 }}><Check size={14} /> לאשר</button>
                <button disabled={busy === p.id} onClick={() => act('passage', p.id, 'reject')} style={{ ...pillBtn(), minHeight: 38, fontSize: 14, color: C.danger }}>לדחות</button>
              </>}
            </div>
            <p dir={he ? 'rtl' : 'ltr'} style={{ whiteSpace: 'pre-wrap', fontSize: 15, lineHeight: 1.8, color: C.textSecondary, maxHeight: 220, overflow: 'auto' }}>{p.content_he || p.content_en}</p>
            {qs.map((x: any) => (
              <div key={x.id} style={{ display: 'flex', gap: 8, alignItems: 'center', borderTop: `1px solid ${C.borderLight}`, padding: '8px 0' }}>
                <span style={{ flex: 1, fontSize: 14 }}>{x.prompt_he || x.prompt_en}</span>
                <button disabled={busy === x.id} onClick={() => act('question', x.id, 'approve')} style={{ ...pillBtn(), minHeight: 34, fontSize: 13 }}>לאשר</button>
                <button disabled={busy === x.id} onClick={() => act('question', x.id, 'reject')} style={{ ...pillBtn(), minHeight: 34, fontSize: 13, color: C.danger }}>לדחות</button>
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}
