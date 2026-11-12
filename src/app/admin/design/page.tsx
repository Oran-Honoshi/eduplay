'use client'
import { useEffect, useMemo, useState } from 'react'
import { Check, X, Loader2, Play, Square } from 'lucide-react'
import ParentPage, { card, pillBtn } from '@/components/parent/ParentPage'
import { PARENT_COLORS as C, PARENT_FONTS as F } from '@/lib/parentTheme'
import { MarkedText, FeedbackText } from '@/components/question/markup'
import { subjectKey, subjectVars } from '@/components/question/tokens'
import qs from '@/components/question/question.module.css'

// Admin: review the question-screen content pass. Per lesson, each question
// shows the new markup the way the child will see it (key concept highlighter,
// data pieces lit, number chips), the helper line and the right / wrong lines.
// Approving copies it to the live question; flagged ones are decided one by one.
const tag = (bg: string, fg: string): React.CSSProperties => ({ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 999, background: bg, color: fg, fontWeight: 800, fontSize: 13 })
const SUBJ_HE: Record<string, string> = { math: 'חשבון', hebrew: 'עברית', english: 'אנגלית' }
const GRADE = ['', 'א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳']
const FLAG_HE: Record<string, string> = {
  text_changed: 'נוסח השאלה השתנה (הסימון הוסר)', key_count: 'יותר מהדגשה אחת', no_key: 'אין הדגשה', key_has_number: 'מספר בתוך ההדגשה',
  data_no_steps: 'נתונים בלי שלבים', no_right: 'אין משפט "נכון"', no_wrong: 'אין משפט "כמעט"', unclear: 'השאלה לא ברורה', wrong_answer: 'ייתכן שהתשובה שגויה',
}

export default function DesignReview() {
  const [topics, setTopics] = useState<any[] | null>(null)
  const [status, setStatus] = useState<any>(null)
  const [denied, setDenied] = useState(false)
  const [grade, setGrade] = useState(1)
  const [subject, setSubject] = useState('math')
  const [open, setOpen] = useState<string | null>(null)
  const [items, setItems] = useState<any[] | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  async function loadList() {
    const r = await fetch('/api/admin/design-pass?list=1')
    if (r.status === 403 || r.status === 401) { setDenied(true); return }
    setTopics((await r.json()).topics)
    setStatus(await fetch('/api/admin/design-pass').then(x => x.json()))
  }
  async function loadTopic(id: string) {
    setOpen(id); setItems(null)
    setItems((await fetch(`/api/admin/design-pass?topicId=${id}`).then(r => r.json())).items)
  }
  useEffect(() => { loadList() }, [])
  // keep the job going while this page is open: refresh every minute, and
  // restart the chains when nothing new arrived for 4 minutes
  useEffect(() => {
    let last = -1, since = Date.now()
    const t = setInterval(async () => {
      const st = await fetch('/api/admin/design-pass').then(r => r.json()).catch(() => null)
      if (!st) return
      setStatus(st)
      if (st.job?.status !== 'running') return
      if (st.drafts !== last) { last = st.drafts; since = Date.now(); loadList(); return }
      if (Date.now() - since > 240_000) {
        since = Date.now()
        await fetch('/api/admin/design-pass', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'start', chains: 4, revive: true }) }).catch(() => {})
      }
    }, 60_000)
    return () => clearInterval(t)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  async function act(body: any, key: string) {
    setBusy(key)
    await fetch('/api/admin/design-pass', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    setBusy(null)
    if (open) await loadTopic(open)
    loadList()
  }

  const shown = useMemo(() => (topics || []).filter(t => t.id === 'passages' ? grade === 0 : t.grade === grade && t.subject?.slug === subject), [topics, grade, subject])
  const totals = useMemo(() => {
    const t = { draft: 0, applied: 0, flagged: 0 }
    for (const x of topics || []) if (x.counts) { t.draft += x.counts.draft; t.applied += x.counts.applied; t.flagged += x.counts.flagged }
    return t
  }, [topics])

  if (denied) return <ParentPage section="library" title="מסכי שאלות · בדיקת תוכן"><div style={{ ...card, padding: 24 }}>העמוד הזה פתוח רק למנהל EduPlay.</div></ParentPage>
  const running = status?.job?.status === 'running'
  const openTopic = (topics || []).find(t => t.id === open)
  const clean = (items || []).filter(i => i.draft?.status === 'draft' && !(i.draft.flags || []).length)

  return (
    <ParentPage section="library" title="מסכי שאלות · בדיקת תוכן">
      <div style={{ ...card, padding: 14, display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', fontSize: 15 }}>
          <b>הדגשה, סימון נתונים ומשפטי משוב לכל שאלה.</b>
          <span style={tag(C.primaryLight, C.primary)}>{totals.draft} מחכות</span>
          <span style={tag('#FFF4D6', '#7A5600')}>{totals.flagged} לבדיקה</span>
          <span style={tag('#E3F4EF', '#0B6B58')}>{totals.applied} אושרו</span>
          {status && <span style={{ color: C.textMuted }}>· {status.topicsDone} שיעורים הושלמו{running ? ' · רץ עכשיו' : status.job?.status === 'done' ? ' · הסתיים' : ''}</span>}
          <span style={{ flex: 1 }} />
          {running
            ? <button onClick={() => act({ action: 'stop' }, 'job')} style={pillBtn()}><Square size={14} /> לעצור</button>
            : <button onClick={() => act({ action: 'start', chains: 4 }, 'job')} style={pillBtn()}><Play size={14} /> להריץ</button>}
          <button disabled={!totals.draft || busy === 'allclean'} onClick={() => act({ action: 'apply', cleanOnly: true }, 'allclean')} style={pillBtn(true)}>
            {busy === 'allclean' ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} לאשר את כל {totals.draft} התקינות
          </button>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['math', 'hebrew', 'english'].map(s => <button key={s} onClick={() => setSubject(s)} style={{ ...pillBtn(subject === s), minHeight: 36 }}>{SUBJ_HE[s]}</button>)}
          <span style={{ width: 10 }} />
          {[1, 2, 3, 4, 5, 6].map(g => <button key={g} onClick={() => setGrade(g)} style={{ ...pillBtn(grade === g), minHeight: 36 }}>כיתה {GRADE[g]}</button>)}
          <button onClick={() => setGrade(0)} style={{ ...pillBtn(grade === 0), minHeight: 36 }}>סיפורים</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ flex: '0 1 300px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {!topics ? <div style={{ color: C.textMuted }}>טוען…</div> : shown.map(t => (
            <button key={t.id} onClick={() => loadTopic(t.id)} style={{ ...card, textAlign: 'start', padding: '10px 12px', cursor: 'pointer', fontFamily: F.body, color: C.text, border: `1.5px solid ${open === t.id ? C.primary : C.border}` }}>
              <div style={{ fontWeight: 700 }}>{t.title_he || t.title_en}</div>
              <div style={{ fontSize: 13, color: C.textMuted }}>
                {t.counts ? `${t.counts.draft} מחכות · ${t.counts.flagged} לבדיקה · ${t.counts.applied} אושרו` : 'עוד לא הוכן'}
              </div>
            </button>
          ))}
        </div>

        <div style={{ flex: '1 1 520px', minWidth: 0 }}>
          {!open ? <div style={{ ...card, padding: 24, color: C.textSecondary }}>בחרו שיעור מהרשימה.</div> : !items ? <div style={{ color: C.textMuted }}>טוען…</div> : <>
            <div style={{ ...card, padding: 14, marginBottom: 12, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <b style={{ fontSize: 18 }}>{openTopic?.title_he}</b>
              <span style={{ flex: 1 }} />
              <button disabled={!clean.length || busy === 'topic'} onClick={() => act({ action: 'apply', ids: clean.map(i => i.draft.id) }, 'topic')} style={pillBtn(true)}>
                {busy === 'topic' ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} לאשר {clean.length} תקינות בשיעור
              </button>
            </div>
            {items.map(({ q, draft }) => {
              const d = draft?.design || {}
              const eng = openTopic?.subject?.slug === 'english'
              const sk = subjectKey(openTopic?.subject?.slug, openTopic?.slug)
              const main = eng ? d.en?.question : d.he?.question
              const allData = Array.from(String(main || '').matchAll(/<<(\d+):/g)).map(m => Number(m[1]))
              const lit = Array.from(new Set((d.data_marking || []).flatMap((s: any) => s.data)))
              return (
                <div key={q.id} style={{ ...card, padding: 14, marginBottom: 10, opacity: draft?.status === 'rejected' ? 0.5 : 1, borderColor: (draft?.flags || []).length ? '#F2C66A' : C.border }}>
                  {!draft ? <div style={{ color: C.textMuted }}>{q.prompt_he || q.prompt_en} · <i>עוד לא הוכן</i></div> : <>
                    <div className={qs.page} style={{ ...subjectVars(sk), minHeight: 0, background: 'none', display: 'block', fontSize: 20, lineHeight: 1.6 }}>
                      {eng && d.he?.question && <div dir="rtl" style={{ fontWeight: 700 }}>{d.he.question}</div>}
                      <div dir={eng ? 'ltr' : 'rtl'} style={{ fontWeight: 800 }}>
                        <MarkedText text={main || (eng ? q.prompt_en : q.prompt_he)} marking={allData.length ? { active: lit as number[] } : undefined} />
                      </div>
                      {(d.he?.helper) && <div style={{ color: '#4A5470', fontWeight: 700, fontSize: 17 }}><MarkedText text={d.he.helper} /></div>}
                    </div>
                    {(d.data_marking || []).length > 1 && <div style={{ fontSize: 14, color: C.textSecondary, marginTop: 6 }}>שלבים: {d.data_marking.map((s: any, i: number) => `${i + 1}. ${s.step_he || ''} (${s.data.join(', ')})`).join(' · ')}</div>}
                    <div style={{ display: 'grid', gap: 4, marginTop: 8, fontSize: 15 }}>
                      <div><b style={{ color: '#0B6B58' }}>יופי! </b><FeedbackText text={d.he?.right} /></div>
                      <div><b style={{ color: '#B7432A' }}>כמעט! </b><FeedbackText text={d.he?.wrong} /></div>
                      {eng && d.en && <div dir="ltr" style={{ color: C.textSecondary }}>EN: {d.en.right} · {d.en.wrong}</div>}
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8, flexWrap: 'wrap' }}>
                      {(draft.flags || []).map((f: string) => <span key={f} style={tag('#FFF4D6', '#7A5600')}>{FLAG_HE[f] || f}</span>)}
                      <span style={{ flex: 1 }} />
                      {draft.status === 'draft' && <>
                        <button disabled={busy === draft.id} onClick={() => act({ action: 'apply', ids: [draft.id] }, draft.id)} style={{ ...pillBtn(true), minHeight: 36, fontSize: 14 }}><Check size={14} /> לאשר</button>
                        <button disabled={busy === draft.id} onClick={() => act({ action: 'reject', id: draft.id }, draft.id)} style={{ ...pillBtn(), minHeight: 36, fontSize: 14, color: C.danger }}><X size={14} /> לא</button>
                      </>}
                      {draft.status !== 'draft' && <span style={{ fontSize: 13, color: C.textMuted }}>{draft.status === 'applied' ? 'אושר' : 'נדחה'}</span>}
                    </div>
                  </>}
                </div>
              )
            })}
          </>}
        </div>
      </div>
    </ParentPage>
  )
}
