'use client'

// ─── Create ────────────────────────────────────────────────────
// The one place a parent makes something: practice, an exam, or learning
// pages. Same steps every time:
//   1. what to make  2. for whom + describe / upload  3. see the plan, adjust
//   4. build (bank first, then generate)  5. review & approve  6. print / app / both
// Nothing reaches a child before the parent approves it.

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Target, ClipboardList, BookOpen, Printer, Smartphone, Check, X, Pencil, Plus, Minus,
  Sparkles, ThumbsUp, Star, Copy, History, ArrowLeft, Loader2, AlertTriangle, Trash2,
} from 'lucide-react'
import ParentHeaderBar from '@/components/ParentHeaderBar'
import { MaterialUpload, type UploadedMaterial } from '@/components/MaterialUpload'
import MathVisual from '@/components/MathVisual'
import FractionText from '@/components/FractionText'
import { Pip } from '@/components/Pip'
import { useFamilyChildren, type FamilyChild } from '@/lib/useFamilyChildren'
import { PARENT_COLORS } from '@/lib/parentTheme'

type Kind = 'practice' | 'exam' | 'explanation'
type Lang = 'he_only' | 'bilingual' | 'en_only'
type Step = 'kind' | 'details' | 'plan' | 'build' | 'review' | 'done'

const P = PARENT_COLORS
const SUBJECTS = [
  { slug: 'math', he: 'חשבון ומתמטיקה' },
  { slug: 'hebrew', he: 'עברית' },
  { slug: 'english', he: 'אנגלית' },
]
const KINDS: { id: Kind; he: string; desc: string; Icon: any }[] = [
  { id: 'practice', he: 'תרגול', desc: 'נושא אחד או שניים, הרבה שאלות מהקל לקשה, עם רמזים ופתרונות.', Icon: Target },
  { id: 'exam', he: 'מבחן', desc: 'הרבה נושאים, רמות מעורבות, זמן מוגבל ודף תשובות.', Icon: ClipboardList },
  { id: 'explanation', he: 'דפי הסבר', desc: 'דף לימוד לכל נושא: הסבר, דוגמאות פתורות, טעויות נפוצות.', Icon: BookOpen },
]
const DIFF_LABEL: Record<string, string> = { progressive: 'מהקל לקשה', mixed: 'מעורב', easy: 'קל', medium: 'בינוני', hard: 'קשה' }
const gradeHe = (g: number) => (g === 0 ? 'גן' : `כיתה ${['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י', 'י״א', 'י״ב'][g - 1]}${g <= 10 ? '׳' : ''}`)

const card = 'bg-white rounded-2xl border border-[rgba(15,118,110,.14)] shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
const btnPrimary = 'inline-flex items-center justify-center gap-2 min-h-[48px] px-5 rounded-xl bg-[#0F766E] text-white font-bold text-[15px] hover:bg-[#0d665f] disabled:opacity-50'
const btnGhost = 'inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-xl border border-[rgba(15,118,110,.2)] bg-white text-[#0F766E] font-semibold text-sm hover:bg-[#E4F3F1] disabled:opacity-50'

export default function CreatePage() {
  return <Suspense fallback={null}><CreateInner /></Suspense>
}

function CreateInner() {
  const sp = useSearchParams()
  const { children, loaded } = useFamilyChildren()
  const [view, setView] = useState<'make' | 'history'>(sp.get('view') === 'history' ? 'history' : 'make')

  const kindParam = sp.get('kind') as Kind | null
  const validKind = kindParam && ['practice', 'exam', 'explanation'].includes(kindParam) ? kindParam : null
  const [step, setStep] = useState<Step>(validKind || sp.get('prompt') ? (validKind ? 'details' : 'kind') : 'kind')
  const [kind, setKind] = useState<Kind>(validKind || 'practice')
  const [child, setChild] = useState<FamilyChild | null>(null)
  const [subject, setSubject] = useState('math')
  const [grade, setGrade] = useState(1)
  const [lang, setLang] = useState<Lang>('he_only')
  const [request, setRequest] = useState(sp.get('prompt') || '')
  const [materials, setMaterials] = useState<UploadedMaterial[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [mat, setMat] = useState<any>(null)       // the saved material row
  const [questions, setQuestions] = useState<any[]>([])
  const [progress, setProgress] = useState<{ done: number; total: number; label: string }>({ done: 0, total: 0, label: '' })

  // first child preselected; grade/language follow the child
  useEffect(() => {
    if (loaded && children.length && !child) pickChild(children[0])
  }, [loaded, children]) // eslint-disable-line react-hooks/exhaustive-deps

  // /create?from=<id> → "more like this" (fresh copy of the plan)
  // /create?open=<id> → reopen something already made (review or done)
  useEffect(() => {
    const from = sp.get('from'), open = sp.get('open')
    if (!from && !open) return
    ;(async () => {
      let m: any
      if (from) {
        const r = await fetch(`/api/materials/${from}/duplicate`, { method: 'POST' })
        m = (await r.json()).material
      } else {
        m = (await fetch(`/api/materials/${open}`).then(r => r.json())).material
      }
      if (!m) { setError('לא מצאנו את החומר הזה.'); return }
      setKind(m.kind); setSubject(m.subject_slug); setGrade(m.grade); setLang(m.language); setRequest(m.request_text || '')
      setMat(m)
      if (from || (!m.question_ids?.length && !m.explanation)) { setStep('plan'); return }
      await reload(m.id)
      setStep(m.status === 'ready' ? 'done' : 'review')
    })()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function pickChild(c: FamilyChild) {
    setChild(c); setGrade(c.grade)
  }

  // ── step 2 → 3: plan ──
  async function makePlan() {
    setBusy(true); setError(null)
    try {
      const res = await fetch('/api/create/plan', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, child_id: child?.id, subject_slug: subject, grade, language: lang, request_text: request, upload_ids: materials.map(m => m.id) }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'שגיאה')
      const m = d.material
      m.plan.topics = m.plan.topics.map((t: any) => ({ ...t, reuse: Math.min(t.bank_count || 0, t.count) }))
      setMat(m); setStep('plan')
    } catch (e: any) { setError(e.message) } finally { setBusy(false) }
  }

  async function savePlan(plan: any, extra: any = {}) {
    const res = await fetch(`/api/materials/${mat.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan, ...extra }) })
    const d = await res.json()
    if (res.ok) setMat(d.material)
    return d.material
  }

  // ── step 3 → 4: build, topic by topic, ≤10 new questions per request ──
  async function build() {
    const m = await savePlan(mat.plan, { time_minutes: mat.plan.time_minutes ?? undefined })
    if (!m) return
    setStep('build'); setError(null)
    const topics = m.plan.topics
    if (m.kind === 'explanation') {
      setProgress({ done: 0, total: topics.length, label: '' })
      for (let i = 0; i < topics.length; i++) {
        setProgress({ done: i, total: topics.length, label: topics[i].title_he || topics[i].title_en })
        const r = await fetch(`/api/materials/${m.id}/explain`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ topic_key: topics[i].key }) })
        if (!r.ok) setError(`לא הצלחנו לכתוב את הדף "${topics[i].title_he || topics[i].title_en}". אפשר לנסות שוב.`)
      }
    } else {
      const jobs: { key: string; label: string; reuse: number; generate: number }[] = []
      for (const t of topics) {
        const reuse = Math.min(t.reuse || 0, t.count)
        let left = t.count - reuse
        jobs.push({ key: t.key, label: t.title_he || t.title_en, reuse, generate: Math.min(10, left) })
        left -= Math.min(10, left)
        while (left > 0) { jobs.push({ key: t.key, label: t.title_he || t.title_en, reuse: 0, generate: Math.min(10, left) }); left -= Math.min(10, left) }
      }
      setProgress({ done: 0, total: jobs.length, label: '' })
      for (let i = 0; i < jobs.length; i++) {
        const j = jobs[i]
        setProgress({ done: i, total: jobs.length, label: j.label })
        const r = await fetch(`/api/materials/${m.id}/build`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ topic_key: j.key, generate: j.generate, reuse: j.reuse }) })
        if (!r.ok) {
          const d = await r.json().catch(() => ({}))
          setError(`חלק מ"${j.label}" לא נוצר (${d.error || 'שגיאה'}). אפשר להמשיך ולבדוק את מה שכן נוצר.`)
        }
      }
    }
    setProgress(p => ({ ...p, done: p.total }))
    await reload(m.id)
    setStep('review')
  }

  async function reload(id = mat.id) {
    const d = await fetch(`/api/materials/${id}`).then(r => r.json())
    setMat(d.material); setQuestions(d.questions || [])
  }

  async function act(q: any, action: 'approve' | 'reject') {
    await fetch(`/api/questions/${q.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) })
    if (action === 'reject') {
      const ids = mat.question_ids.filter((x: string) => x !== q.id)
      await fetch(`/api/materials/${mat.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question_ids: ids }) })
    }
    await reload()
  }

  async function approveAll() {
    setBusy(true)
    for (const q of questions.filter(q => !q.approved)) {
      await fetch(`/api/questions/${q.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'approve' }) })
    }
    await reload(); setBusy(false)
  }

  const pending = questions.filter(q => !q.approved).length

  // ── render ──
  return (
    <div className="min-h-screen bg-[#F7F5F0]" dir="rtl" lang="he">
      <ParentHeaderBar />
      <div className="max-w-[920px] mx-auto px-4 py-6">
        <div className="flex items-center justify-between gap-3 mb-5">
          <div>
            <h1 className="text-2xl font-black text-[#1f2a28] m-0">יצירה</h1>
            <p className="text-sm text-[#5b6b68] mt-1 mb-0">תרגול, מבחן או דפי הסבר — להדפסה, לאפליקציה, או לשניהם.</p>
          </div>
          <div className="flex gap-2">
            <button className={btnGhost} onClick={() => setView(view === 'make' ? 'history' : 'make')}>
              {view === 'make' ? <><History size={16} /> מה כבר יצרתי</> : <><Sparkles size={16} /> יצירה חדשה</>}
            </button>
          </div>
        </div>

        {view === 'history' ? <HistoryList onMore={(m: any) => { window.location.href = `/create?from=${m.id}` }} /> : (
          <>
            <Steps step={step} />
            {error && (
              <div className="mb-4 flex items-start gap-2 rounded-xl border border-[#F59E0B55] bg-[#FFFBEB] px-4 py-3 text-sm text-[#7c4a03]">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" /> <span>{error}</span>
              </div>
            )}

            {step === 'kind' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {KINDS.map(k => (
                  <button key={k.id} onClick={() => { setKind(k.id); setStep('details') }}
                    className={`${card} p-5 text-start hover:border-[#0F766E] hover:shadow-md transition`}>
                    <div className="w-12 h-12 rounded-xl bg-[#E4F3F1] text-[#0F766E] flex items-center justify-center mb-3"><k.Icon size={24} /></div>
                    <div className="text-lg font-black text-[#1f2a28]">{k.he}</div>
                    <div className="text-sm text-[#5b6b68] mt-1 leading-relaxed">{k.desc}</div>
                  </button>
                ))}
                <a href="/worksheets" className="md:col-span-3 text-sm text-[#0F766E] font-semibold underline-offset-2 hover:underline">
                  רק להדפיס דף עבודה מהמאגר המוכן (גן–ו׳)? לבונה דפי העבודה ←
                </a>
              </div>
            )}

            {step === 'details' && (
              <div className={`${card} p-5 flex flex-col gap-5`}>
                <Field label="בשביל מי?">
                  <div className="flex flex-wrap gap-2">
                    {children.map(c => (
                      <button key={c.id} onClick={() => pickChild(c)}
                        className={`min-h-[44px] px-4 rounded-full border-2 font-bold text-sm ${child?.id === c.id ? 'border-[#0F766E] bg-[#E4F3F1] text-[#0F766E]' : 'border-[#e3ebe9] bg-white text-[#3d4f4b]'}`}>
                        {c.name} · {gradeHe(c.grade)}
                      </button>
                    ))}
                    {loaded && children.length === 0 && <span className="text-sm text-[#7a8f8b]">עוד אין ילדים בחשבון — אפשר להוסיף במשפחה.</span>}
                  </div>
                </Field>
                <div className="flex flex-wrap gap-4">
                  <Field label="מקצוע">
                    <div className="flex flex-wrap gap-2">
                      {SUBJECTS.map(s => (
                        <button key={s.slug} onClick={() => { setSubject(s.slug); setLang(s.slug === 'english' ? 'bilingual' : 'he_only') }}
                          className={`min-h-[44px] px-4 rounded-full border-2 font-bold text-sm ${subject === s.slug ? 'border-[#0F766E] bg-[#E4F3F1] text-[#0F766E]' : 'border-[#e3ebe9] bg-white text-[#3d4f4b]'}`}>{s.he}</button>
                      ))}
                    </div>
                  </Field>
                  <Field label="כיתה">
                    <select value={grade} onChange={e => setGrade(parseInt(e.target.value))} className="min-h-[44px] px-3 rounded-xl border border-[rgba(15,118,110,.2)] bg-white text-sm">
                      {Array.from({ length: 13 }, (_, g) => <option key={g} value={g}>{gradeHe(g)}</option>)}
                    </select>
                  </Field>
                  <Field label="שפת השאלות">
                    <select value={lang} onChange={e => setLang(e.target.value as Lang)} className="min-h-[44px] px-3 rounded-xl border border-[rgba(15,118,110,.2)] bg-white text-sm">
                      <option value="he_only">עברית</option>
                      <option value="bilingual">עברית + אנגלית</option>
                      <option value="en_only">אנגלית</option>
                    </select>
                  </Field>
                </div>
                <Field label="מה צריך? (במילים שלכם)">
                  <textarea value={request} onChange={e => setRequest(e.target.value)} rows={3} dir="auto"
                    placeholder={kind === 'exam' ? 'לדוגמה: מבחן ב-18.11 על מערכת צירים, מספרים מכוונים ומבוא לזוויות' : kind === 'explanation' ? 'לדוגמה: היא לא מבינה איך מחסרים מספרים שליליים' : 'לדוגמה: תרגול שברים עם הרבה בעיות מילוליות'}
                    className="w-full px-3 py-2 text-[15px] rounded-xl border border-[rgba(15,118,110,.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E33]" />
                </Field>
                <Field label="חומר של הילד/ה (לא חובה)">
                  <MaterialUpload value={materials} onChange={setMaterials} he />
                </Field>
                <div className="flex gap-2 justify-between">
                  <button className={btnGhost} onClick={() => setStep('kind')}><ArrowLeft size={16} className="rotate-180" /> חזרה</button>
                  <button className={btnPrimary} disabled={busy || (!request.trim() && !materials.length)} onClick={makePlan}>
                    {busy ? <><Loader2 size={18} className="animate-spin" /> קוראים ומתכננים…</> : <><Sparkles size={18} /> הכינו לי תוכנית</>}
                  </button>
                </div>
              </div>
            )}

            {step === 'plan' && mat && (
              <PlanEditor mat={mat} setMat={setMat} onBack={() => setStep('details')} onBuild={build} />
            )}

            {step === 'build' && (
              <div className={`${card} p-8 text-center`}>
                <Pip pose="read" size={120} he style={{ margin: '0 auto 8px' }} />
                <div className="text-lg font-black text-[#1f2a28]">בונים את החומר…</div>
                <div className="text-sm text-[#5b6b68] mt-1">{progress.label ? `עכשיו: ${progress.label}` : 'מתחילים'} · זה לוקח בערך חצי דקה לכל חלק</div>
                <div className="h-2 rounded-full bg-[#E4F3F1] mt-4 overflow-hidden">
                  <div className="h-full bg-[#0F766E] transition-all" style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 5}%` }} />
                </div>
                <div className="text-xs text-[#7a8f8b] mt-2">{progress.done} / {progress.total}</div>
              </div>
            )}

            {step === 'review' && mat && (
              mat.kind === 'explanation'
                ? <ExplanationReview mat={mat} onDone={async () => { await savePlan(mat.plan, { status: 'ready' }); setStep('done') }} />
                : (
                  <div className="flex flex-col gap-3">
                    <div className={`${card} p-4 flex flex-wrap items-center justify-between gap-3`}>
                      <div>
                        <div className="font-black text-[#1f2a28]">{mat.title}</div>
                        <div className="text-sm text-[#5b6b68]">{questions.length} שאלות · {pending ? `${pending} מחכות לאישור שלכם` : 'הכול אושר'}</div>
                      </div>
                      <div className="flex gap-2">
                        {pending > 0 && <button className={btnGhost} disabled={busy} onClick={approveAll}><Check size={16} /> לאשר את כל השאר</button>}
                        <button className={btnPrimary} disabled={questions.length === 0 || pending > 0} onClick={async () => { await savePlan(mat.plan, { status: 'ready' }); setStep('done') }}>
                          המשך
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-[#7a8f8b] m-0">רק שאלות שאישרתם יגיעו לילד/ה. אפשר לערוך שאלה, או להסיר אותה.</p>
                    {(mat.plan?.topics || []).map((t: any) => {
                      const qs = questions.filter(q => q.topic_id === t.topic_id)
                      if (!qs.length) return null
                      return (
                        <div key={t.key}>
                          <h3 className="text-base font-black text-[#0F766E] mt-3 mb-2">{t.title_he || t.title_en} <span className="text-xs font-semibold text-[#7a8f8b]">· {qs.length}</span></h3>
                          <div className="flex flex-col gap-2">
                            {qs.map((q, i) => <QuestionCard key={q.id} q={q} n={i + 1} lang={mat.language} onApprove={() => act(q, 'approve')} onRemove={() => act(q, 'reject')} onSaved={reload} />)}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
            )}

            {step === 'done' && mat && <DonePanel mat={mat} setMat={setMat} child={children.find(c => c.id === mat.child_id) || child} questions={questions} />}
          </>
        )}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><div className="text-xs font-bold text-[#5b6b68] mb-1.5">{label}</div>{children}</div>
}

function Steps({ step }: { step: Step }) {
  const order: Step[] = ['kind', 'details', 'plan', 'build', 'review', 'done']
  const labels = ['מה', 'פרטים', 'תוכנית', 'בנייה', 'בדיקה', 'מוכן']
  const at = order.indexOf(step)
  return (
    <ol className="flex gap-1 mb-4 overflow-x-auto p-0 list-none">
      {labels.map((l, i) => (
        <li key={l} className={`flex-1 min-w-[60px] text-center text-xs font-bold py-1.5 rounded-full ${i <= at ? 'bg-[#0F766E] text-white' : 'bg-white text-[#9aa6a3] border border-[#e3ebe9]'}`}>{i + 1}. {l}</li>
      ))}
    </ol>
  )
}

// ── Plan: the parent adjusts before anything is generated ──
function PlanEditor({ mat, setMat, onBack, onBuild }: any) {
  const plan = mat.plan
  const [newTopic, setNewTopic] = useState('')
  const set = (p: any) => setMat({ ...mat, plan: { ...plan, ...p } })
  const setTopic = (key: string, patch: any) => set({ topics: plan.topics.map((t: any) => t.key === key ? { ...t, ...patch } : t) })
  const total = plan.topics.reduce((s: number, t: any) => s + (t.count || 0), 0)
  const isExpl = mat.kind === 'explanation'
  return (
    <div className={`${card} p-5 flex flex-col gap-4`}>
      <div className="flex items-start gap-3">
        <Pip pose="think" size={64} he />
        <div className="flex-1">
          <input value={mat.title} onChange={e => setMat({ ...mat, title: e.target.value })}
            className="w-full text-lg font-black text-[#1f2a28] bg-transparent border-b border-dashed border-[#cfdcd9] focus:outline-none focus:border-[#0F766E]" />
          {plan.summary_he && <p className="text-sm text-[#3d4f4b] mt-2 mb-0 leading-relaxed">{plan.summary_he}</p>}
        </div>
      </div>
      {plan.missing_he?.length > 0 && (
        <div className="rounded-xl bg-[#FFFBEB] border border-[#F59E0B44] px-4 py-3 text-sm text-[#7c4a03]">
          <div className="font-bold mb-1">כדאי לבדוק:</div>
          <ul className="m-0 ps-5">{plan.missing_he.map((x: string, i: number) => <li key={i}>{x}</li>)}</ul>
          <div className="text-xs mt-1">אפשר להוסיף פרטים או חומר ולתכנן מחדש, או להמשיך כמו שזה.</div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {plan.topics.map((t: any) => (
          <div key={t.key} className="rounded-xl border border-[#e3ebe9] p-3">
            <div className="flex items-start gap-2">
              <div className="flex-1">
                <div className="font-bold text-[#1f2a28]">{t.title_he || t.title_en} {t.title_en && t.title_he && <span className="text-xs font-normal text-[#7a8f8b]" dir="ltr">· {t.title_en}</span>}</div>
                {t.subtopics_he?.length > 0 && <div className="text-xs text-[#5b6b68] mt-1">{t.subtopics_he.join(' · ')}</div>}
                {!isExpl && (t.bank_count > 0
                  ? <label className="flex items-center gap-2 text-xs text-[#0F766E] mt-2">
                      <input type="checkbox" checked={(t.reuse || 0) > 0} onChange={e => setTopic(t.key, { reuse: e.target.checked ? Math.min(t.bank_count, t.count) : 0 })} />
                      יש כבר {t.bank_count} שאלות מאושרות במאגר — להשתמש בהן קודם
                    </label>
                  : <div className="text-xs text-[#7a8f8b] mt-2">{t.is_new ? 'נושא חדש — ייכתבו שאלות חדשות' : 'אין עדיין שאלות במאגר — ייכתבו חדשות'}</div>)}
              </div>
              {!isExpl && (
                <div className="flex items-center gap-1" dir="ltr">
                  <button aria-label="פחות" className="w-9 h-9 rounded-lg border border-[#e3ebe9] flex items-center justify-center" onClick={() => setTopic(t.key, { count: Math.max(1, t.count - 1), reuse: Math.min(t.reuse || 0, Math.max(1, t.count - 1)) })}><Minus size={14} /></button>
                  <span className="w-8 text-center font-bold">{t.count}</span>
                  <button aria-label="יותר" className="w-9 h-9 rounded-lg border border-[#e3ebe9] flex items-center justify-center" onClick={() => setTopic(t.key, { count: Math.min(30, t.count + 1) })}><Plus size={14} /></button>
                </div>
              )}
              <button aria-label="הסרת נושא" className="w-9 h-9 rounded-lg text-[#9aa6a3] hover:text-[#DC2626] flex items-center justify-center" onClick={() => set({ topics: plan.topics.filter((x: any) => x.key !== t.key) })}><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
        <div className="flex gap-2">
          <input value={newTopic} onChange={e => setNewTopic(e.target.value)} dir="auto" placeholder="להוסיף נושא…"
            className="flex-1 min-h-[44px] px-3 rounded-xl border border-[rgba(15,118,110,.2)] bg-white text-sm" />
          <button className={btnGhost} disabled={!newTopic.trim() || mat.grade < 7} title={mat.grade < 7 ? 'בגן–ו׳ הנושאים מגיעים מתוכנית הלימודים' : ''}
            onClick={() => { set({ topics: [...plan.topics, { key: `t${Date.now()}`, title_he: newTopic.trim(), title_en: newTopic.trim(), subtopics_he: [], topic_slug: null, topic_id: null, is_new: true, bank_count: 0, reuse: 0, count: isExpl ? 0 : 10 }] }); setNewTopic('') }}>
            <Plus size={16} /> הוספה
          </button>
        </div>
      </div>

      {!isExpl && (
        <div className="flex flex-wrap gap-4 items-end">
          <Field label="רמת קושי">
            <select value={plan.difficulty} onChange={e => set({ difficulty: e.target.value })} className="min-h-[44px] px-3 rounded-xl border border-[rgba(15,118,110,.2)] bg-white text-sm">
              {Object.entries(DIFF_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
          <Field label="סוגי שאלות">
            <div className="flex gap-3 min-h-[44px] items-center">
              {[['multiple_choice', 'אמריקאיות'], ['word_problem', 'פתוחות']].map(([v, l]) => (
                <label key={v} className="flex items-center gap-1.5 text-sm">
                  <input type="checkbox" checked={plan.q_types.includes(v)} onChange={e => {
                    const next = e.target.checked ? [...plan.q_types, v] : plan.q_types.filter((x: string) => x !== v)
                    if (next.length) set({ q_types: next })
                  }} /> {l}
                </label>
              ))}
            </div>
          </Field>
          {mat.kind === 'exam' && (
            <Field label="זמן (דקות)">
              <input type="number" min={5} max={300} value={plan.time_minutes || 45} onChange={e => set({ time_minutes: parseInt(e.target.value) || 45 })}
                className="w-24 min-h-[44px] px-3 rounded-xl border border-[rgba(15,118,110,.2)] bg-white text-sm" />
            </Field>
          )}
          <div className="text-sm text-[#5b6b68] min-h-[44px] flex items-center">סה״כ {total} שאלות</div>
        </div>
      )}

      <div className="flex gap-2 justify-between">
        <button className={btnGhost} onClick={onBack}><ArrowLeft size={16} className="rotate-180" /> לשנות פרטים</button>
        <button className={btnPrimary} disabled={!plan.topics.length} onClick={onBuild}><Sparkles size={18} /> {isExpl ? 'לכתוב את הדפים' : 'ליצור את השאלות'}</button>
      </div>
    </div>
  )
}

// ── one question in review ──
function QuestionCard({ q, n, lang, onApprove, onRemove, onSaved }: any) {
  const he = lang !== 'en_only'
  const [edit, setEdit] = useState(false)
  const [draft, setDraft] = useState<any>(null)
  const prompt = he ? (q.prompt_he || q.prompt_en) : q.prompt_en
  const hint = he ? (q.hint_he || q.hint_en) : q.hint_en
  const expl = he ? (q.explanation_he || q.explanation_en) : q.explanation_en
  const diffColor = { easy: '#16A34A', medium: '#D97706', hard: '#DC2626' }[q.difficulty as string] || '#64748B'

  async function save() {
    const body: any = { action: 'edit', correct_answer: draft.correct_answer }
    body[he ? 'prompt_he' : 'prompt_en'] = draft.prompt
    body[he ? 'hint_he' : 'hint_en'] = draft.hint
    body[he ? 'explanation_he' : 'explanation_en'] = draft.expl
    if (q.options) body.options = draft.options
    const r = await fetch(`/api/questions/${q.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (r.ok) { setEdit(false); onSaved() }
  }

  return (
    <div className={`${card} p-4 ${q.approved ? 'border-[#16A34A55]' : ''}`}>
      <div className="flex items-center gap-2 mb-2 text-xs">
        <span className="font-black text-[#0F766E]">#{n}</span>
        <span className="px-2 py-0.5 rounded-full font-bold" style={{ background: `${diffColor}18`, color: diffColor }}>{({ easy: 'קל', medium: 'בינוני', hard: 'קשה' } as any)[q.difficulty]}</span>
        <span className="px-2 py-0.5 rounded-full bg-[#F1F5F9] text-[#475569] font-bold">{q.options ? 'אמריקאית' : 'פתוחה'}</span>
        {q.approved && <span className="ms-auto inline-flex items-center gap-1 text-[#16A34A] font-bold"><Check size={14} /> אושרה</span>}
      </div>
      {!edit ? (
        <>
          <div className="text-[15px] font-bold text-[#1f2a28] leading-relaxed" dir="auto"><FractionText text={prompt} /></div>
          {q.visual_data && <div className="flex justify-center my-2"><MathVisual data={q.visual_data} size={180} color="#0F766E" /></div>}
          {q.options ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-2">
              {q.options.map((o: any) => (
                <div key={o.label} className={`rounded-lg px-3 py-2 text-sm border ${o.isCorrect ? 'border-[#16A34A] bg-[#F0FDF4] font-bold' : 'border-[#e3ebe9]'}`} dir="auto">
                  <FractionText text={he ? (o.value_he || o.value_en) : o.value_en} />{o.isCorrect && ' ✓'}
                </div>
              ))}
            </div>
          ) : <div className="mt-2 text-sm"><span className="text-[#5b6b68]">תשובה: </span><bdi className="font-bold"><FractionText text={q.correct_answer} /></bdi></div>}
          {hint && <div className="mt-2 text-sm text-[#7c4a03] bg-[#FFFBEB] rounded-lg px-3 py-2">💡 <FractionText text={hint} /></div>}
          {expl && <details className="mt-2 text-sm text-[#3d4f4b]"><summary className="cursor-pointer font-semibold text-[#0F766E]">פתרון צעד אחר צעד</summary><div className="mt-1 leading-relaxed whitespace-pre-line"><FractionText text={expl} /></div></details>}
        </>
      ) : (
        <div className="flex flex-col gap-2 text-sm">
          <textarea dir="auto" rows={2} value={draft.prompt} onChange={e => setDraft({ ...draft, prompt: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-[#cfdcd9]" />
          {q.options ? draft.options.map((o: any, i: number) => (
            <label key={i} className="flex items-center gap-2">
              <input type="radio" name={`c${q.id}`} checked={o.isCorrect} onChange={() => setDraft({ ...draft, options: draft.options.map((x: any, j: number) => ({ ...x, isCorrect: j === i })) })} />
              <input dir="auto" value={he ? (o.value_he ?? o.value_en) : o.value_en} onChange={e => setDraft({ ...draft, options: draft.options.map((x: any, j: number) => j === i ? { ...x, [he ? 'value_he' : 'value_en']: e.target.value } : x) })}
                className="flex-1 px-3 py-1.5 rounded-lg border border-[#cfdcd9]" />
            </label>
          )) : (
            <input dir="auto" value={draft.correct_answer} onChange={e => setDraft({ ...draft, correct_answer: e.target.value })} placeholder="התשובה הנכונה" className="px-3 py-1.5 rounded-lg border border-[#cfdcd9]" />
          )}
          <input dir="auto" value={draft.hint} onChange={e => setDraft({ ...draft, hint: e.target.value })} placeholder="רמז" className="px-3 py-1.5 rounded-lg border border-[#cfdcd9]" />
          <textarea dir="auto" rows={3} value={draft.expl} onChange={e => setDraft({ ...draft, expl: e.target.value })} placeholder="פתרון צעד אחר צעד" className="px-3 py-2 rounded-lg border border-[#cfdcd9]" />
        </div>
      )}
      <div className="flex flex-wrap gap-2 mt-3">
        {!edit ? <>
          {!q.approved && <button className={btnPrimary + ' !min-h-[40px] !text-sm'} onClick={onApprove}><Check size={16} /> אישור</button>}
          {(!q.approved) && <button className={btnGhost} onClick={() => { setDraft({ prompt: prompt || '', hint: hint || '', expl: expl || '', correct_answer: q.correct_answer || '', options: q.options ? q.options.map((o: any) => ({ ...o })) : null }); setEdit(true) }}><Pencil size={15} /> עריכה</button>}
          <button className={btnGhost + ' !text-[#DC2626]'} onClick={onRemove}><X size={15} /> הסרה</button>
        </> : <>
          <button className={btnPrimary + ' !min-h-[40px] !text-sm'} onClick={save}><Check size={16} /> שמירה</button>
          <button className={btnGhost} onClick={() => setEdit(false)}>ביטול</button>
        </>}
      </div>
    </div>
  )
}

// ── explanation pages in review ──
function ExplanationReview({ mat, onDone }: any) {
  const he = mat.language !== 'en_only'
  const pages = (mat.plan?.topics || []).map((t: any) => ({ t, page: mat.explanation?.[t.key] })).filter((x: any) => x.page)
  const L = (o: any, k: string) => (he ? (o?.[`${k}_he`] ?? o?.[`${k}_en`]) : (o?.[`${k}_en`] ?? o?.[`${k}_he`]))
  return (
    <div className="flex flex-col gap-3">
      {pages.length === 0 && <div className={`${card} p-5 text-sm`}>לא נכתבו דפים. אפשר לחזור ולנסות שוב.</div>}
      {pages.map(({ t, page }: any) => (
        <div key={t.key} className={`${card} p-5`} dir={he ? 'rtl' : 'ltr'}>
          <h2 className="text-xl font-black text-[#0F766E] mt-0 mb-2">{L(page, 'title') || t.title_he}</h2>
          <p className="text-[15px] text-[#1f2a28] leading-relaxed">{L(page, 'intro')}</p>
          <ul className="ps-5 text-[15px] leading-relaxed">{(L(page, 'key_points') || []).map((x: string, i: number) => <li key={i}><FractionText text={x} /></li>)}</ul>
          {(page.examples || []).map((ex: any, i: number) => (
            <div key={i} className="rounded-xl bg-[#F7FBFA] border border-[#e3ebe9] p-3 my-2">
              <div className="font-bold"><FractionText text={L(ex, 'question')} /></div>
              {ex.visual_data && <div className="flex justify-center my-2"><MathVisual data={ex.visual_data} size={180} color="#0F766E" /></div>}
              <ol className="ps-5 my-1 text-sm leading-relaxed">{(L(ex, 'steps') || []).map((s: string, j: number) => <li key={j}><FractionText text={s} /></li>)}</ol>
              <div className="text-sm font-bold text-[#16A34A]"><FractionText text={L(ex, 'answer')} /></div>
            </div>
          ))}
          {(L(page, 'mistakes') || []).length > 0 && <div className="text-sm mt-2"><b>טעויות נפוצות:</b><ul className="ps-5 my-1">{L(page, 'mistakes').map((x: string, i: number) => <li key={i}><FractionText text={x} /></li>)}</ul></div>}
        </div>
      ))}
      {pages.length > 0 && <div className="flex justify-end"><button className={btnPrimary} onClick={onDone}><Check size={18} /> הדפים נראים טוב</button></div>}
    </div>
  )
}

// ── done: print / app / both, plus like & stars ──
function DonePanel({ mat, setMat, child, questions }: any) {
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState<string | null>(mat.assignment_id ? 'sent' : null)
  const [err, setErr] = useState<string | null>(null)
  const approvedIds = useMemo(() => questions.filter((q: any) => q.approved).map((q: any) => q.id), [questions])
  const isExpl = mat.kind === 'explanation'

  function print(withKey: boolean) {
    if (isExpl) { window.open(`/api/materials/${mat.id}/print`, '_blank'); return }
    const params = new URLSearchParams({
      childId: mat.child_id || child?.id || '', topicIds: (mat.topic_ids || []).join(','), questionIds: approvedIds.join(','),
      lang: mat.language, answerKey: String(withKey), includeHints: String(mat.kind !== 'exam'), solutionSteps: String(withKey),
      wsType: mat.kind === 'exam' ? 'exam' : 'practice', questionCount: String(approvedIds.length), materialId: mat.id,
      ...(mat.time_minutes ? { timeMinutes: String(mat.time_minutes) } : {}),
    })
    window.open(`/api/worksheets/builder?${params}`, '_blank')
  }
  async function sendToApp() {
    setSending(true); setErr(null)
    try {
      const r = await fetch('/api/assignments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ childId: mat.child_id || child?.id, questionIds: approvedIds, title: mat.title }) })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'שגיאה')
      const id = d.assignment?.id
      if (id) await fetch(`/api/materials/${mat.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ assignment_id: id }) })
      setSent('sent')
    } catch (e: any) { setErr(e.message) } finally { setSending(false) }
  }
  async function rate(patch: any) {
    const r = await fetch(`/api/materials/${mat.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) })
    const d = await r.json(); if (r.ok) setMat(d.material)
  }

  return (
    <div className={`${card} p-6 flex flex-col gap-5`}>
      <div className="flex items-center gap-4">
        <Pip pose="celebrate" size={96} he bounce />
        <div>
          <div className="text-xl font-black text-[#1f2a28]">{mat.title} מוכן!</div>
          <div className="text-sm text-[#5b6b68]">{isExpl ? `${Object.keys(mat.explanation || {}).length} דפי הסבר` : `${approvedIds.length} שאלות מאושרות`}{mat.kind === 'exam' && mat.time_minutes ? ` · ${mat.time_minutes} דקות` : ''}</div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button className={`${card} p-4 text-start hover:border-[#0F766E]`} onClick={() => print(false)}>
          <Printer className="text-[#0F766E]" /><div className="font-bold mt-2">להדפסה</div><div className="text-xs text-[#5b6b68]">{isExpl ? 'דפי הסבר ממותגים' : 'דף לילד/ה'}</div>
        </button>
        {!isExpl && (
          <button className={`${card} p-4 text-start hover:border-[#0F766E]`} onClick={() => print(true)}>
            <ClipboardList className="text-[#0F766E]" /><div className="font-bold mt-2">עם דף תשובות</div><div className="text-xs text-[#5b6b68]">תשובות ופתרונות להורה</div>
          </button>
        )}
        {!isExpl && (
          <button className={`${card} p-4 text-start hover:border-[#0F766E] disabled:opacity-60`} disabled={sending || !!sent || !(mat.child_id || child?.id)} onClick={sendToApp}>
            <Smartphone className="text-[#0F766E]" /><div className="font-bold mt-2">{sent ? 'נשלח לאפליקציה ✓' : 'לשלוח לאפליקציה'}</div>
            <div className="text-xs text-[#5b6b68]">{child ? `יופיע ל${child.name} ב"היום"` : 'בחרו ילד/ה'}</div>
          </button>
        )}
      </div>
      {err && <div className="text-sm text-[#DC2626]">{err}</div>}

      <div className="border-t border-[#e3ebe9] pt-4 flex flex-wrap items-center gap-4">
        <span className="text-sm font-bold text-[#3d4f4b]">איך יצא?</span>
        <button aria-pressed={!!mat.liked} onClick={() => rate({ liked: mat.liked ? null : true })}
          className={`inline-flex items-center gap-1.5 min-h-[40px] px-3 rounded-full border ${mat.liked ? 'bg-[#0F766E] text-white border-[#0F766E]' : 'border-[#e3ebe9] text-[#3d4f4b]'}`}><ThumbsUp size={16} /> אהבתי</button>
        <div className="flex" dir="ltr" aria-label="דירוג">
          {[1, 2, 3, 4, 5].map(s => (
            <button key={s} aria-label={`${s} כוכבים`} onClick={() => rate({ rating: s })} className="p-1">
              <Star size={22} className={s <= (mat.rating || 0) ? 'fill-[#F4C430] text-[#F4C430]' : 'text-[#cbd5d3]'} />
            </button>
          ))}
        </div>
        <a href={`/create?from=${mat.id}`} className={btnGhost + ' ms-auto'}><Copy size={16} /> עוד כזה, עם שאלות אחרות</a>
      </div>
    </div>
  )
}

// ── history: everything this family made ──
function HistoryList({ onMore }: any) {
  const [items, setItems] = useState<any[] | null>(null)
  useEffect(() => { fetch('/api/materials').then(r => r.json()).then(d => setItems(d.materials || [])) }, [])
  if (!items) return <div className="text-sm text-[#7a8f8b]">טוען…</div>
  if (!items.length) return <div className={`${card} p-6 text-sm text-[#5b6b68]`}>עוד לא יצרתם כלום. בואו נתחיל!</div>
  const kindHe: any = { practice: 'תרגול', exam: 'מבחן', explanation: 'דפי הסבר' }
  const sorted = [...items].sort((a, b) => Number(!!b.liked) - Number(!!a.liked))
  return (
    <div className="flex flex-col gap-2">
      {sorted.map(m => (
        <div key={m.id} className={`${card} p-4 flex flex-wrap items-center gap-3`}>
          <div className="flex-1 min-w-[200px]">
            <div className="font-bold text-[#1f2a28]">{m.title} {m.liked && <ThumbsUp size={14} className="inline text-[#0F766E]" />}</div>
            <div className="text-xs text-[#5b6b68]">{kindHe[m.kind]} · {gradeHe(m.grade)} · {m.question_ids?.length || 0} שאלות · {new Date(m.created_at).toLocaleDateString('he-IL')}{m.status === 'draft' ? ' · טיוטה' : ''}</div>
          </div>
          {m.rating && <div className="text-xs text-[#B7862F]" dir="ltr">{'★'.repeat(m.rating)}</div>}
          <a className={btnGhost} href={`/create?open=${m.id}`}>פתיחה</a>
          <button className={btnGhost} onClick={() => onMore(m)}><Copy size={15} /> עוד כזה</button>
        </div>
      ))}
    </div>
  )
}
