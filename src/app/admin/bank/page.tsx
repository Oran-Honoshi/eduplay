'use client'
import { useEffect, useMemo, useState } from 'react'
import { Check, X, EyeOff, AlertTriangle, Loader2 } from 'lucide-react'
import ParentPage, { card, chip, pillBtn, GRADE_HE } from '@/components/parent/ParentPage'
import { PARENT_COLORS as C, PARENT_FONTS as F, SUBJECT_COLORS } from '@/lib/parentTheme'
import InlineMath from '@/components/InlineMath'

// Admin: review the lesson-bank upgrade. Per lesson, each question shows what
// is live today next to the proposal (hint, steps, parent tip, a corrected
// wording) and the model's answer check. Approving copies the proposal into
// the live question (a backup is kept); flagged questions are decided one by one.
const SUBJ_HE: Record<string, string> = { math: 'חשבון', hebrew: 'עברית', english: 'אנגלית' }
const FLAG_HE: Record<string, string> = { wrong_answer: 'תשובה שגויה', two_correct: 'שתי תשובות נכונות', unclear: 'לא ברור', not_grade_level: 'לא מתאים לכיתה', needs_review: 'צריך בדיקה' }

export default function BankReview() {
  const [topics, setTopics] = useState<any[] | null>(null)
  const [denied, setDenied] = useState(false)
  const [grade, setGrade] = useState(1)
  const [subject, setSubject] = useState('math')
  const [open, setOpen] = useState<string | null>(null)
  const [detail, setDetail] = useState<any>(null)
  const [busy, setBusy] = useState<string | null>(null)

  async function loadList() {
    const r = await fetch('/api/admin/bank')
    if (r.status === 403 || r.status === 401) { setDenied(true); return }
    setTopics((await r.json()).topics)
  }
  async function loadTopic(id: string) {
    setOpen(id); setDetail(null)
    setDetail(await fetch(`/api/admin/bank?topic=${id}`).then(r => r.json()))
  }
  useEffect(() => { loadList() }, [])

  async function act(body: any, key: string) {
    setBusy(key)
    await fetch('/api/admin/bank', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    setBusy(null)
    if (open) await loadTopic(open)
    loadList()
  }

  const shown = useMemo(() => (topics || []).filter(t => t.grade === grade && t.subject?.slug === subject), [topics, grade, subject])
  const totals = useMemo(() => {
    const t = { draft: 0, applied: 0, flagged: 0 }
    for (const x of topics || []) if (x.counts) { t.draft += x.counts.draft; t.applied += x.counts.applied; t.flagged += x.counts.flagged }
    return t
  }, [topics])

  if (denied) return <ParentPage section="library" title="בדיקת מאגר השיעורים"><div style={{ ...card, padding: 24 }}>העמוד הזה פתוח רק למנהל EduPlay.</div></ParentPage>

  const qs: any[] = detail?.questions || []
  const pending = qs.filter(q => q.draft?.status === 'draft')
  const clean = pending.filter(q => !(q.draft.flags || []).length)
  const flagged = pending.filter(q => (q.draft.flags || []).length)

  return (
    <ParentPage section="library" title="בדיקת מאגר השיעורים" width={1180}
      subtitle={topics ? `${totals.draft} הצעות מחכות · ${totals.flagged} מסומנות לבדיקה · ${totals.applied} כבר אושרו. מה שמאושר נכנס לשיעורים מיד; גיבוי של הנוסח הקודם נשמר.` : 'טוען…'}>
      <div style={{ ...card, padding: 14, display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {Object.entries(SUBJ_HE).map(([k, v]) => <button key={k} onClick={() => setSubject(k)} style={chip(subject === k, SUBJECT_COLORS[k].fg, SUBJECT_COLORS[k].bg)}>{v}</button>)}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[0, 1, 2, 3, 4, 5, 6].map(g => <button key={g} onClick={() => setGrade(g)} style={chip(grade === g)}>{GRADE_HE[g]}</button>)}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 300px) 1fr', gap: 14, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {shown.map(t => {
            const c = t.counts
            return (
              <button key={t.id} onClick={() => loadTopic(t.id)} style={{ ...card, textAlign: 'start', padding: '10px 12px', cursor: 'pointer', fontFamily: F.body, color: C.text, border: `1.5px solid ${open === t.id ? C.primary : C.border}` }}>
                <div style={{ fontWeight: 800, fontSize: 15 }}>{t.title_he || t.title_en}</div>
                <div style={{ fontSize: 13, color: C.textMuted, marginTop: 2 }}>
                  {!c ? 'עוד לא עבר' : `${c.draft} מחכות${c.flagged ? ` · ${c.flagged} לבדיקה` : ''}${c.applied ? ` · ${c.applied} אושרו` : ''}`}
                  {t.card === 'draft' ? ' · דף לימוד מחכה' : t.card === 'approved' ? ' · דף לימוד ✓' : ''}
                  {t.fresh ? ` · ${t.fresh} שאלות חדשות` : ''}
                </div>
              </button>
            )
          })}
          {!shown.length && <div style={{ color: C.textMuted }}>{topics ? 'אין נושאים' : 'טוען…'}</div>}
        </div>

        <div>
          {!open ? <div style={{ ...card, padding: 24, color: C.textSecondary }}>בחרו שיעור מהרשימה.</div> : !detail ? <div style={{ color: C.textMuted }}>טוען…</div> : <>
            <div style={{ ...card, padding: 16, marginBottom: 12, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <h2 style={{ fontFamily: F.heading, fontSize: 21, margin: 0, flex: 1 }}>{detail.topic.title_he || detail.topic.title_en}</h2>
              <button disabled={!clean.length && detail.card?.status !== 'draft' || busy === 'all'} onClick={() => act({ action: 'apply', topicId: detail.topic.id, questionIds: clean.map(q => q.id), card: detail.card?.status === 'draft' }, 'all')} style={pillBtn(true)}>
                {busy === 'all' ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} לאשר {clean.length} שאלות{detail.card?.status === 'draft' ? ' ודף לימוד' : ''}
              </button>
            </div>

            {detail.card && (
              <div style={{ ...card, padding: 16, marginBottom: 12, background: detail.card.status === 'draft' ? '#FFFBEF' : C.card }}>
                <div style={{ fontWeight: 800, color: C.textMuted, fontSize: 13 }}>דף הלימוד לפני התרגול {detail.card.status === 'draft' ? '(הצעה)' : '(פעיל)'}</div>
                <p style={{ fontSize: 16, lineHeight: 1.7, margin: '6px 0' }}><InlineMath text={detail.card.summary_he} /></p>
                <ul style={{ margin: '0 0 8px', paddingInlineStart: 20 }}>{(detail.card.key_points_he || []).map((k: string, i: number) => <li key={i}><InlineMath text={k} /></li>)}</ul>
                {detail.card.examples?.[0] && <div style={{ background: C.pageBg, borderRadius: 12, padding: 10 }}>
                  <b><InlineMath text={detail.card.examples[0].problem_he || ''} /></b>
                  <ol style={{ margin: '6px 0 0', paddingInlineStart: 20 }}>{(detail.card.examples[0].solution_steps_he || []).map((s: string, i: number) => <li key={i}><InlineMath text={s} /></li>)}</ol>
                </div>}
              </div>
            )}

            {(detail.fresh || []).length > 0 && <>
              <h3 style={{ fontFamily: F.heading, fontSize: 18 }}>שאלות חדשות לשיעור ({detail.fresh.length})</h3>
              {detail.fresh.map((q: any) => (
                <div key={q.id} style={{ ...card, padding: 14, marginBottom: 10, borderColor: '#B9C9F5' }}>
                  <div style={{ fontSize: 17, fontWeight: 700 }}><InlineMath text={q.prompt_he || q.prompt_en || ''} /></div>
                  <div style={{ fontSize: 14, color: C.textSecondary, marginTop: 4 }}>
                    {Array.isArray(q.options) && q.options.length ? q.options.map((o: any) => <span key={o.label} style={{ marginInlineEnd: 10, fontWeight: o.isCorrect ? 800 : 400, color: o.isCorrect ? C.mintText : undefined }}>{o.value_he || o.value_en}</span>) : <>תשובה: <b>{q.correct_answer}</b></>}
                  </div>
                  {q.hint_he && <div style={{ fontSize: 14, marginTop: 6 }}><b>רמז: </b><InlineMath text={q.hint_he} /></div>}
                  {q.explanation_he && <div style={{ fontSize: 14, marginTop: 4, whiteSpace: 'pre-line' }}><b>פתרון: </b><InlineMath text={q.explanation_he} /></div>}
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <button disabled={busy === q.id} onClick={() => act({ action: 'approve_new', questionId: q.id }, q.id)} style={{ ...pillBtn(true), minHeight: 38, fontSize: 14 }}><Check size={14} /> להוסיף לשיעור</button>
                    <button disabled={busy === q.id} onClick={() => act({ action: 'hide', questionId: q.id }, q.id)} style={{ ...pillBtn(), minHeight: 38, fontSize: 14, color: C.danger }}><X size={14} /> לא להוסיף</button>
                  </div>
                </div>
              ))}
            </>}
            {flagged.length > 0 && <h3 style={{ fontFamily: F.heading, fontSize: 18, display: 'flex', alignItems: 'center', gap: 6 }}><AlertTriangle size={18} color={C.amberText} /> לבדיקה שלך ({flagged.length})</h3>}
            {[...flagged, ...clean, ...qs.filter(q => q.draft?.status !== 'draft')].map(q => <QCard key={q.id} q={q} topicId={detail.topic.id} busy={busy} act={act} />)}
          </>}
        </div>
      </div>
    </ParentPage>
  )
}

function QCard({ q, topicId, busy, act }: { q: any; topicId: string; busy: string | null; act: (b: any, k: string) => void }) {
  const d = q.draft
  const flags: string[] = d?.flags || []
  const opts = Array.isArray(q.options) ? q.options : []
  const status = d?.status
  return (
    <div style={{ ...card, padding: 14, marginBottom: 10, opacity: status && status !== 'draft' ? 0.6 : 1, borderColor: flags.length && status === 'draft' ? '#F2C36B' : C.border }}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
        {flags.map(f => <span key={f} style={{ fontSize: 12, fontWeight: 800, padding: '2px 8px', borderRadius: 99, background: '#FFF1D6', color: C.amberText }}>{FLAG_HE[f] || f}</span>)}
        {status === 'applied' && <span style={{ fontSize: 12, fontWeight: 800, padding: '2px 8px', borderRadius: 99, background: C.mintLight, color: C.mintText }}>אושר</span>}
        {status === 'rejected' && <span style={{ fontSize: 12, fontWeight: 800, padding: '2px 8px', borderRadius: 99, background: '#EEE', color: '#555' }}>נשאר כמו שהיה</span>}
      </div>
      <div style={{ fontSize: 17, fontWeight: 700 }}><InlineMath text={q.prompt_he || q.prompt_en || ''} /></div>
      {d?.prompt_he_fix && <div style={{ fontSize: 16, marginTop: 4, color: C.primaryHover }}>נוסח מתוקן: <InlineMath text={d.prompt_he_fix} /></div>}
      <div style={{ fontSize: 14, color: C.textSecondary, marginTop: 4 }}>
        {opts.length ? opts.map((o: any) => <span key={o.label} style={{ marginInlineEnd: 10, fontWeight: o.isCorrect ? 800 : 400, color: o.isCorrect ? C.mintText : undefined }}>{o.value_he || o.value_en}</span>) : <>תשובה: <b>{q.correct_answer}</b></>}
      </div>
      {d?.answer_check && <div style={{ fontSize: 14, marginTop: 6, color: flags.includes('wrong_answer') ? C.danger : C.textMuted }}>בדיקה: {d.answer_check}</div>}
      {d && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 10, marginTop: 10 }}>
          <div style={{ background: C.pageBg, borderRadius: 12, padding: 10, fontSize: 15 }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: C.textMuted }}>רמז</div>
            {q.hint_he && <div style={{ textDecoration: 'line-through', color: C.textMuted }}>{q.hint_he}</div>}
            <InlineMath text={d.hint_he || ''} />
            <div style={{ fontWeight: 800, fontSize: 13, color: C.textMuted, marginTop: 8 }}>טיפ להורה</div>
            <div>{d.parent_tip_he}</div>
          </div>
          <div style={{ background: C.pageBg, borderRadius: 12, padding: 10, fontSize: 15 }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: C.textMuted }}>צעד אחר צעד</div>
            <ol style={{ margin: '4px 0 0', paddingInlineStart: 20 }}>{(d.steps || []).map((s: any, i: number) => <li key={i}><InlineMath text={s.he} /></li>)}</ol>
          </div>
        </div>
      )}
      {status === 'draft' && (
        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          <button disabled={busy === q.id} onClick={() => act({ action: 'apply', topicId, questionIds: [q.id] }, q.id)} style={{ ...pillBtn(true), minHeight: 38, fontSize: 14 }}><Check size={14} /> לאשר</button>
          <button disabled={busy === q.id} onClick={() => act({ action: 'reject', questionId: q.id }, q.id)} style={{ ...pillBtn(), minHeight: 38, fontSize: 14 }}><X size={14} /> להשאיר כמו שהיה</button>
          <button disabled={busy === q.id} onClick={() => act({ action: 'hide', questionId: q.id }, q.id)} style={{ ...pillBtn(), minHeight: 38, fontSize: 14, color: C.danger }}><EyeOff size={14} /> להוציא מהשיעור</button>
        </div>
      )}
    </div>
  )
}
