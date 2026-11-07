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
  Sparkles, ThumbsUp, Star, Copy, History, ArrowLeft, ArrowUp, Loader2, AlertTriangle, Trash2, Share2, Library,
} from 'lucide-react'
import ParentHeaderBar from '@/components/ParentHeaderBar'
import { MaterialUpload, type UploadedMaterial } from '@/components/MaterialUpload'
import MathVisual from '@/components/MathVisual'
import FractionText from '@/components/FractionText'
import { Pip } from '@/components/Pip'
import { FeedbackPrompt } from '@/components/Feedback'
import { FunLoader, FunLine } from '@/components/FunLoader'
import { useFamilyChildren, type FamilyChild } from '@/lib/useFamilyChildren'
import { PARENT_COLORS } from '@/lib/parentTheme'
import { SECTION_KINDS, SECTION_ORDER, assignSectionWords, hasSections, plannedCount, questionSections, visibleOption, type Section, type SectionKind } from '@/lib/workbook'

const isHeText = (t: any) => /[\u0590-\u05FF]/.test(String(t || ''))

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
  const [mirror, setMirror] = useState(false)   // "make one just like the sheet I uploaded"
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

  // Every step can be left with the browser's back button or the step bar.
  const go = (s: Step) => {
    setStep(s); setError(null)
    try { window.history.pushState({ createStep: s }, '') } catch {}
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  useEffect(() => {
    try { window.history.replaceState({ createStep: step }, '') } catch {}
    const onPop = (e: PopStateEvent) => { if (e.state?.createStep) setStep(e.state.createStep) }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const [failed, setFailed] = useState<any[]>([])
  const [sampling, setSampling] = useState(false)
  const [editing, setEditing] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // "New creation" always starts from the beginning (never reopens the last one)
  function startNew() {
    setMat(null); setQuestions([]); setMaterials([]); setMirror(false); setRequest(''); setError(null); setFailed([]); setEditing(false)
    setKind('practice'); if (children.length) pickChild(children[0])
    setView('make'); setStep('kind')
    try { window.history.replaceState({ createStep: 'kind' }, '', '/create') } catch {}
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function pickChild(c: FamilyChild) {
    setChild(c); setGrade(c.grade)
  }

  // ── step 2 → 3: plan ──
  async function makePlan() {
    setBusy(true); setError(null)
    try {
      const res = await fetch('/api/create/plan', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, child_id: child?.id, subject_slug: subject, grade, language: lang, request_text: request, mirror: mirror && (materials.length > 0 || (mat?.upload_ids || []).length > 0),
          upload_ids: materials.length ? materials.map(m => m.id) : (mat?.upload_ids || []),
          material_id: mat?.status === 'draft' && !(mat?.question_ids || []).length ? mat.id : undefined }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'משהו השתבש. נסו שוב.')
      setMat(d.material); setQuestions([]); setEditing(false)
      if (step !== 'plan') go('plan')
      if (d.material.kind !== 'explanation') makeSamples(d.material)
    } catch (e: any) { setError(e.message) } finally { setBusy(false) }
  }

  async function savePlan(plan: any, extra: any = {}) {
    const res = await fetch(`/api/materials/${mat.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan, ...extra }) })
    const d = await res.json()
    if (res.ok) setMat(d.material)
    return d.material
  }

  // ── step 3 → 4: build. Each topic is split into parts of ≤5 questions;
  // 3 parts run at the same time. Questions already in the bank quietly fill
  // part of a topic when no material was uploaded (with material, everything is
  // written fresh to match it). Failed parts can be retried from the review step.
  type Job = { key: string; label: string; reuse: number; generate: number; part: number; parts: number; section?: boolean }
  async function runJobs(m: any, jobs: Job[], note?: string) {
    setProgress({ done: 0, total: jobs.length, label: '' })
    const bad: Job[] = []
    let done = 0
    // parts of the same topic run one after another, so each part sees the
    // questions already written and never repeats them; topics run side by side
    const byTopic = new Map<string, Job[]>()
    for (const j of jobs) byTopic.set(j.key, [...(byTopic.get(j.key) || []), j])
    const queues = [...byTopic.values()]
    let nextQ = 0
    async function worker() {
      while (nextQ < queues.length) {
        const q = queues[nextQ++]
        for (const j of q) {
          setProgress(p => ({ ...p, label: j.label }))
          const r = await fetch(`/api/materials/${m.id}/build`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ [j.section ? 'section_key' : 'topic_key']: j.key, generate: j.generate, reuse: j.reuse, part: j.part, parts: j.parts, note }) }).catch(() => null)
          if (!r || !r.ok) bad.push(j)
          setProgress(p => ({ ...p, done: ++done }))
        }
      }
    }
    await Promise.all(Array.from({ length: Math.min(3, queues.length) }, worker))
    return bad
  }

  // "Add questions" after review: a few more, optionally with a note like "more hard ones"
  async function addMore(count: number, topicKey: string, note: string) {
    const secMode = hasSections(mat.plan)
    const topics = (secMode ? questionSections(mat.plan).filter(x => x.kind !== 'translate_words') : (mat.plan?.topics || [])).filter((t: any) => topicKey === 'all' || t.key === topicKey)
    if (!topics.length) return
    if (mat.status === 'ready') await savePlan(mat.plan, { status: 'draft' })
    const per = Math.max(1, Math.round(count / topics.length))
    const jobs: Job[] = []
    for (const t of topics) {
      const parts = Math.ceil(per / 5)
      for (let k = 0; k < parts; k++) jobs.push({ key: t.key, label: t.title_he || t.title_en, reuse: 0, generate: Math.min(5, per - k * 5), part: k, parts, section: secMode })
    }
    go('build')
    const bad = await runJobs(mat, jobs, note)
    if (bad.length) setError(`${bad.length} חלקים לא נוצרו הפעם. אפשר לנסות שוב.`)
    await reload(mat.id)
    go('review')
  }

  // Remove with an optional reason; the reason steers the next questions
  const [removing, setRemoving] = useState<any>(null)
  async function removeQuestion(q: any, reasons: string[], note: string) {
    await fetch(`/api/materials/${mat.id}/remove-question`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question_id: q.id, reasons, note }) })
    setRemoving(null)
    await reload()
  }

  // 3 sample questions (easy → hard) from the first topic, so the parent can
  // judge the result before everything is made. They stay part of the material.
  async function makeSamples(m: any) {
    const t = m.plan?.topics?.[0]
    if (!t) return
    setSampling(true)
    try {
      if (hasSections(m.plan)) {
        // one sample from each of up to 3 different written sections
        const pref: SectionKind[] = ['word_bank', 'multiple_choice', 'picture_match', 'true_false', 'translate_sentences', 'draw', 'open']
        const secs = questionSections(m.plan).filter(x => x.kind !== 'translate_words')
          .sort((a, b) => pref.indexOf(a.kind) - pref.indexOf(b.kind)).slice(0, 3)
        const rs = await Promise.all(secs.map(sc => fetch(`/api/materials/${m.id}/build`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ section_key: sc.key, generate: 1, part: 0, parts: 1 }) }).catch(() => null)))
        if (rs.some(r => !r || !r.ok)) setError('חלק מהדוגמאות לא נוצרו הפעם. לחצו "דוגמה אחרת" כדי לנסות שוב.')
        await reload(m.id)
        return
      }
      const r = await fetch(`/api/materials/${m.id}/build`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ topic_key: t.key, generate: 3, reuse: 0, part: 0, parts: 1 }) }).catch(() => null)
      if (!r || !r.ok) setError('הדוגמה לא נוצרה הפעם. לחצו "ליצור דוגמה" כדי לנסות שוב.')
      await reload(m.id)
    } finally { setSampling(false) }
  }
  async function newSamples() {
    const m = await savePlan(assignSectionWords(mat.plan))
    for (const q of questions) await fetch(`/api/questions/${q.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'reject' }) })
    await fetch(`/api/materials/${mat.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question_ids: [] }) })
    setQuestions([])
    await makeSamples(m || mat)
  }
  function openPreview() {
    const ids = questions.map(q => q.id)
    if (!ids.length) return
    const params = new URLSearchParams({
      childId: mat.child_id || child?.id || '', topicIds: (mat.topic_ids || []).join(','), questionIds: ids.join(','),
      lang: mat.language, answerKey: 'false', includeHints: String(mat.kind !== 'exam'), solutionSteps: 'false',
      wsType: mat.kind === 'exam' ? 'exam' : 'practice', questionCount: String(ids.length), materialId: mat.id, noprint: '1',
      ...(mat.plan?.time_minutes ? { timeMinutes: String(mat.plan.time_minutes) } : {}),
    })
    setPreviewUrl(`/api/worksheets/builder?${params}`)
  }

  async function build() {
    const m = await savePlan(assignSectionWords(mat.plan), { time_minutes: mat.plan.time_minutes ?? undefined })
    if (!m) return
    go('build')
    const topics = m.plan.topics
    if (m.kind === 'explanation') {
      setProgress({ done: 0, total: topics.length, label: '' })
      let done = 0
      const bad: any[] = []
      await Promise.all(topics.map(async (t: any) => {
        const r = await fetch(`/api/materials/${m.id}/explain`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ topic_key: t.key }) }).catch(() => null)
        if (!r || !r.ok) bad.push(t)
        setProgress(p => ({ ...p, done: ++done, label: t.title_he || t.title_en }))
      }))
      if (bad.length) setError(`לא הצלחנו לכתוב ${bad.length} דפים. אפשר לחזור לתוכנית ולנסות שוב.`)
    } else if (hasSections(m.plan)) {
      // workbook: every section on its own; the word bank in one go (each word once)
      const fresh0 = await fetch(`/api/materials/${m.id}`).then(r => r.json()).catch(() => ({}))
      const sq = fresh0.material?.section_q || {}
      const jobs: Job[] = []
      for (const sc of questionSections(m.plan)) {
        const fresh = Math.max(0, sc.count - (sq[sc.key] || []).length)
        if (!fresh) continue
        const size = sc.kind === 'word_bank' || sc.kind === 'translate_words' ? fresh : 5
        const parts = Math.ceil(fresh / size)
        for (let k = 0; k < parts; k++) jobs.push({ key: sc.key, label: sc.title_he, reuse: 0, generate: Math.min(size, fresh - k * size), part: k, parts, section: true })
      }
      const bad = await runJobs(m, jobs)
      setFailed(bad)
      if (bad.length) setError(`${bad.length} חלקים לא נוצרו הפעם. אפשר לבדוק את מה שכן נוצר, וללחוץ "להשלים את החסר".`)
    } else {
      const hasMaterial = (m.upload_ids || []).length > 0 || !!m.plan.digest
      const jobs: Job[] = []
      const fresh0 = await fetch(`/api/materials/${m.id}`).then(r => r.json()).catch(() => ({ questions: [] }))
      const made = (fresh0.questions || []) as any[]
      const planNow = fresh0.material?.plan?.topics || topics
      for (const t of planNow) {
        const already = made.filter(q => t.topic_id && q.topic_id === t.topic_id).length
        const reuse = hasMaterial || already ? 0 : Math.min(t.bank_count || 0, Math.floor(t.count / 2))
        const fresh = Math.max(0, t.count - reuse - already)
        const parts = Math.max(1, Math.ceil(fresh / 5))
        for (let k = 0; k < parts; k++) {
          const size = Math.min(5, fresh - k * 5)
          jobs.push({ key: t.key, label: t.title_he || t.title_en, reuse: k === 0 ? reuse : 0, generate: size, part: k, parts })
        }
        if (fresh === 0 && reuse > 0) jobs.push({ key: t.key, label: t.title_he || t.title_en, reuse, generate: 0, part: 0, parts: 1 })
      }
      const bad = await runJobs(m, jobs)
      setFailed(bad)
      if (bad.length) setError(`${bad.length} חלקים לא נוצרו הפעם. אפשר לבדוק את מה שכן נוצר, וללחוץ "להשלים את החסר".`)
    }
    await reload(m.id)
    go('review')
  }

  async function retryFailed() {
    const jobs = failed
    setFailed([]); go('build')
    const bad = await runJobs(mat, jobs)
    setFailed(bad)
    setError(bad.length ? `עדיין ${bad.length} חלקים לא נוצרו. אפשר לנסות שוב בעוד רגע.` : null)
    await reload(mat.id)
    go('review')
  }

  async function reload(id = mat.id) {
    const d = await fetch(`/api/materials/${id}`).then(r => r.json())
    setMat(d.material); setQuestions(d.questions || [])
  }

  async function act(q: any, action: 'approve' | 'reject') {
    if (action === 'reject') { setRemoving(q); return }
    setQuestions(qs => qs.map(x => x.id === q.id ? { ...x, approved: true } : x)) // instant feedback
    await fetch(`/api/questions/${q.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) })
    await reload()
  }

  const [approving, setApproving] = useState(false)
  async function approveAll() {
    setApproving(true)
    try {
      await fetch(`/api/materials/${mat.id}/approve-all`, { method: 'POST' })
      await savePlan(mat.plan, { status: 'ready' })
      await reload()
      go('done')
    } finally { setApproving(false) }
  }
  async function finishReview() { await savePlan(mat.plan, { status: 'ready' }); go('done') }

  const pending = questions.filter(q => !q.approved).length
  const planned = mat ? plannedCount(mat.plan, mat.kind) : 0
  const missing = Math.max(0, planned - questions.length)
  async function makeTheRest() {
    if (mat.status === 'ready') await savePlan(mat.plan, { status: 'draft' })
    await build()
  }
  const MissingBanner = () => step === 'review' && missing >= Math.max(3, Math.ceil(planned * 0.3)) ? (
    <div className="mb-3 rounded-2xl border-2 border-[#0F766E] bg-[#E4F3F1] p-4 flex flex-wrap items-center gap-3" dir="rtl">
      <Pip pose="wave" size={48} he />
      <div className="flex-1 min-w-[200px]">
        <div className="font-black text-[#0F3D3A]">נוצרו {questions.length} מתוך {planned} שאלות</div>
        <div className="text-sm text-[#3d4f4b]">אלה היו הדוגמאות. ליצור עכשיו את {missing} השאלות הנוספות לפי התוכנית?</div>
      </div>
      <button className={btnPrimary} onClick={makeTheRest}><Sparkles size={18} /> ליצור עוד {missing} שאלות</button>
    </div>
  ) : null

  // ── render ──
  return (
    <div className="min-h-screen bg-[#F7F5F0]" dir="rtl" lang="he" style={{ fontFamily: "'Assistant', 'Nunito', system-ui, sans-serif" }}>
      <ParentHeaderBar active="create" />
      <div className="max-w-[920px] mx-auto px-4 py-6">
        <div className="flex items-center justify-between gap-3 mb-5">
          <div>
            <h1 className="text-2xl font-black text-[#1f2a28] m-0">יצירה</h1>
            <p className="text-sm text-[#5b6b68] mt-1 mb-0">תרגול, מבחן או דפי הסבר — להדפסה, לאפליקציה, או לשניהם.</p>
          </div>
          <div className="flex gap-2">
            <button className={btnGhost} onClick={() => (view === 'make' ? setView('history') : startNew())}>
              {view === 'make' ? <><History size={16} /> מה כבר יצרתי</> : <><Sparkles size={16} /> יצירה חדשה</>}
            </button>
          </div>
        </div>

        {removing && <RemoveModal q={removing} onCancel={() => setRemoving(null)} onRemove={(r: string[], n: string) => removeQuestion(removing, r, n)} />}
        <BackToTop />
        {previewUrl && (
          <div role="dialog" aria-modal="true" className="fixed inset-0 z-[700] bg-black/50 flex items-center justify-center p-3" onClick={() => setPreviewUrl(null)}>
            <div className="bg-white rounded-2xl w-full max-w-[900px] h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-4 py-2 border-b border-[#e3ebe9]">
                <span className="font-bold text-sm">תצוגה מקדימה — כך ייראה הדף המודפס (עם הדוגמאות)</span>
                <button aria-label="סגירה" className="w-9 h-9 rounded-full hover:bg-[#F1F5F9] flex items-center justify-center" onClick={() => setPreviewUrl(null)}><X size={18} /></button>
              </div>
              <iframe title="תצוגה מקדימה" src={previewUrl} className="flex-1 w-full border-0" />
            </div>
          </div>
        )}
        {view === 'history' ? <HistoryList kidsList={children} onMore={(m: any) => { window.location.href = `/create?from=${m.id}` }} /> : (
          <>
            {step !== 'kind' && step !== 'build' && (
              <button className="inline-flex items-center gap-1.5 text-sm font-bold text-[#0F766E] mb-2 min-h-[36px]"
                onClick={() => { const order: Step[] = ['kind', 'details', 'plan', 'review', 'done']; const i = order.indexOf(step); go(order[Math.max(0, i - 1)]) }}>
                <ArrowLeft size={16} className="rotate-180" /> חזרה
              </button>
            )}
            <Steps step={step} canGo={(s: Step) => step !== 'build' && (s === 'kind' || s === 'details' || (s === 'plan' && !!mat) || (s === 'review' && !!mat && ((mat.question_ids || []).length > 0 || !!mat.explanation)) || (s === 'done' && mat?.status === 'ready'))} onGo={go} />
            {error && (
              <div className="mb-4 flex items-start gap-2 rounded-xl border border-[#F59E0B55] bg-[#FFFBEB] px-4 py-3 text-sm text-[#7c4a03]">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" /> <span>{error}</span>
              </div>
            )}

            {step === 'kind' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {KINDS.map(k => (
                  <button key={k.id} onClick={() => { setKind(k.id); go('details') }}
                    className={`${card} p-5 text-start hover:border-[#0F766E] hover:shadow-md transition`}>
                    <div className="w-12 h-12 rounded-xl bg-[#E4F3F1] text-[#0F766E] flex items-center justify-center mb-3"><k.Icon size={24} /></div>
                    <div className="text-lg font-black text-[#1f2a28]">{k.he}</div>
                    <div className="text-sm text-[#5b6b68] mt-1 leading-relaxed">{k.desc}</div>
                  </button>
                ))}
                <a href="/reading" className={`${card} md:col-span-3 p-4 flex items-center gap-4 text-start hover:border-[#0F766E] hover:shadow-md transition no-underline`}>
                  <div className="w-12 h-12 rounded-xl bg-[#FFF4D6] text-[#8a5a00] flex items-center justify-center shrink-0"><BookOpen size={24} /></div>
                  <div><div className="text-lg font-black text-[#1f2a28]">חוברות קריאה (גן–א׳)</div><div className="text-sm text-[#5b6b68]">קמץ, שווא, חיריק ועוד: הברות, מילים, משפטים וסיפור, עם התאמה לתמונות, חיבור נקודות וציור.</div></div>
                </a>
                <a href="/worksheets" className="md:col-span-3 text-sm text-[#0F766E] font-semibold underline-offset-2 hover:underline">
                  רק להדפיס דף עבודה מהמאגר המוכן (גן–ו׳)? לבונה דפי העבודה ←
                </a>
              </div>
            )}

            {step === 'details' && busy && (
              <div className={`${card} p-8`}><FunLoader kind="plan" pose="think" size={110} sub={materials.length > 4 ? 'הרבה דפים — זה ייקח עד דקה' : undefined} /></div>
            )}
            {step === 'details' && !busy && (
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
                  <MaterialUpload value={materials} onChange={setMaterials} he autoRead />
                </Field>
                {materials.length > 0 && kind !== 'explanation' && (
                  <label className={`flex items-start gap-3 rounded-2xl border-2 p-3 cursor-pointer ${mirror ? 'border-[#0F766E] bg-[#E4F3F1]' : 'border-[#e3ebe9] bg-white'}`}>
                    <input type="checkbox" className="mt-1 w-5 h-5 accent-[#0F766E]" checked={mirror} onChange={e => setMirror(e.target.checked)} />
                    <span>
                      <span className="font-bold block text-[#1f2a28]">ליצור {kind === 'exam' ? 'מבחן' : 'דף'} דומה למה שהעליתי</span>
                      <span className="text-xs text-[#5b6b68]">אותו מבנה, אותו סדר, אותה רמה ואותם סוגי שאלות — רק מספרים ובעיות אחרים</span>
                    </span>
                  </label>
                )}
                <div className="flex gap-2 justify-between">
                  <button className={btnGhost} onClick={() => go('kind')}><ArrowLeft size={16} className="rotate-180" /> חזרה</button>
                  <button className={btnPrimary} disabled={busy || (!request.trim() && !materials.length)} onClick={makePlan}>
                    {busy ? <><Loader2 size={18} className="animate-spin" /> <FunLine kind="plan" /></> : <><Sparkles size={18} /> הכינו לי תוכנית</>}
                  </button>
                </div>
              </div>
            )}

            {step === 'plan' && mat && (
              busy ? <div className={`${card} p-8`}><FunLoader kind="plan" pose="think" size={110} /></div> : <>
              <PlanSummary mat={mat} editing={editing} onEdit={() => setEditing(e => !e)} />
              {editing && <div className="mt-3"><PlanEditor mat={mat} setMat={setMat} request={request} setRequest={setRequest} replanning={busy} onReplan={makePlan} onBack={() => go('details')} onBuild={build} /></div>}
              {mat.kind !== 'explanation' && (
                <div className={`${card} p-5 mt-3`} dir="rtl">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <h3 className="text-base font-black text-[#1f2a28] m-0">כך ייראו השאלות</h3>
                    <div className="flex gap-2">
                      <button className={btnGhost} disabled={!questions.length || sampling} onClick={openPreview}><Printer size={16} /> תצוגה מקדימה של הדף</button>
                      <button className={btnGhost} disabled={sampling} onClick={newSamples}><Sparkles size={16} /> {questions.length ? 'דוגמה אחרת' : 'ליצור דוגמה'}</button>
                    </div>
                  </div>
                  {sampling
                    ? <div className="py-4"><FunLoader kind="build" pose="read" size={84} /></div>
                    : questions.length
                      ? <div className="flex flex-col gap-2">{questions.slice(0, 3).map((q, i) => <QuestionCard key={q.id} q={q} n={i + 1} lang={mat.language} onApprove={() => act(q, 'approve')} onRemove={() => act(q, 'reject')} onSaved={() => reload()} />)}</div>
                      : <p className="text-sm text-[#5b6b68] m-0">עוד אין דוגמה. לחצו "ליצור דוגמה".</p>}
                  {editing && questions.length > 0 && <p className="text-xs text-[#7a8f8b] mt-2 mb-0">שיניתם את התוכנית? לחצו "דוגמה אחרת" כדי לראות שאלות לפי השינויים.</p>}
                </div>
              )}
              <div className="flex flex-wrap gap-2 justify-between mt-3" dir="rtl">
                <button className={btnGhost} onClick={() => go('details')}><ArrowLeft size={16} className="rotate-180" /> לפרטים ולקבצים</button>
                <button className={btnPrimary} disabled={sampling || !mat.plan.topics.length} onClick={build}>
                  <Sparkles size={18} /> {mat.kind === 'explanation' ? 'לכתוב את הדפים' : questions.length ? `נראה טוב — ליצור את כל ${plannedCount(mat.plan, mat.kind)} השאלות` : 'ליצור את השאלות'}
                </button>
              </div>
              </>
            )}

            {step === 'build' && (
              <div className={`${card} p-8`}>
                <FunLoader kind={mat?.kind === 'explanation' ? 'explain' : 'build'} pose="read" size={120}
                  sub={progress.label ? `עכשיו: ${progress.label}` : undefined} />
                <div className="h-2 rounded-full bg-[#E4F3F1] mt-5 overflow-hidden">
                  <div className="h-full bg-[#0F766E] transition-all duration-700" style={{ width: `${progress.total ? Math.max(6, (progress.done / progress.total) * 100) : 6}%` }} />
                </div>
                <div className="text-xs text-[#7a8f8b] mt-2 text-center">אפשר להשאיר את המסך פתוח ולחזור בעוד דקה</div>
              </div>
            )}

            {mat && <MissingBanner />}
            {step === 'review' && mat && (
              mat.kind === 'explanation'
                ? <ExplanationReview mat={mat} onDone={async () => { await savePlan(mat.plan, { status: 'ready' }); go('done') }} />
                : (
                  <div className="flex flex-col gap-3">
                    <div className={`${card} p-4 flex flex-wrap items-center justify-between gap-3`}>
                      <div>
                        <div className="font-black text-[#1f2a28]">{mat.title}</div>
                        <div className="text-sm text-[#5b6b68]">{questions.length} שאלות{questions.length ? ` · ${pending ? `${pending} מחכות לאישור שלכם` : 'הכול אושר'}` : ''}</div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button className={btnGhost} onClick={() => go('plan')}><ArrowLeft size={16} className="rotate-180" /> לתוכנית</button>
                        {failed.length > 0 && <button className={btnGhost} onClick={retryFailed}><Sparkles size={16} /> להשלים את החסר</button>}
                        {pending > 0
                          ? <button className={btnPrimary} disabled={approving} onClick={approveAll}>{approving ? <><Loader2 size={18} className="animate-spin" /> מאשרים…</> : <><Check size={18} /> לאשר את כל {pending} השאלות ולהמשיך</>}</button>
                          : <button className={btnPrimary} disabled={questions.length === 0} onClick={finishReview}>סיימתי — להדפסה ולאפליקציה ←</button>}
                      </div>
                    </div>
                    {questions.length === 0 ? (
                      <div className={`${card} p-6 text-center`}>
                        <Pip pose="think" size={90} he style={{ margin: '0 auto' }} />
                        <div className="font-bold mt-2">עוד לא נוצרו שאלות</div>
                        <div className="text-sm text-[#5b6b68] mb-3">זה קורה לפעמים כשהשרת עמוס. אפשר לנסות שוב, או לחזור לתוכנית ולשנות.</div>
                        <div className="flex justify-center gap-2">
                          <button className={btnPrimary} onClick={failed.length ? retryFailed : build}><Sparkles size={16} /> לנסות שוב</button>
                          <button className={btnGhost} onClick={() => go('plan')}>לתוכנית</button>
                        </div>
                      </div>
                    ) : <p className="text-xs text-[#7a8f8b] m-0">רק שאלות שאישרתם יגיעו לילד/ה. אפשר לערוך שאלה, או להסיר אותה.</p>}
                    {questions.length > 0 && <AddMorePanel topics={hasSections(mat.plan) ? questionSections(mat.plan).filter(x => x.kind !== 'translate_words') : (mat.plan?.topics || [])} onAdd={addMore} />}
                    {hasSections(mat.plan) && <SectionReview mat={mat} questions={questions} act={act} reload={reload} />}
                    {!hasSections(mat.plan) && (mat.plan?.topics || []).map((t: any) => {
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

function Steps({ step, canGo, onGo }: { step: Step; canGo: (s: Step) => boolean; onGo: (s: Step) => void }) {
  const order: Step[] = ['kind', 'details', 'plan', 'build', 'review', 'done']
  const labels = ['מה', 'פרטים', 'תוכנית', 'בנייה', 'בדיקה', 'מוכן']
  const at = order.indexOf(step)
  return (
    <ol className="flex gap-1 mb-4 overflow-x-auto p-0 list-none" dir="rtl">
      {labels.map((l, i) => {
        const s = order[i]
        const clickable = s !== step && s !== 'build' && canGo(s)
        const cls = `w-full text-center text-xs font-bold py-1.5 rounded-full ${i <= at ? 'bg-[#0F766E] text-white' : 'bg-white text-[#9aa6a3] border border-[#e3ebe9]'} ${clickable ? 'cursor-pointer hover:opacity-80 underline-offset-2 hover:underline' : ''}`
        return (
          <li key={l} className="flex-1 min-w-[60px]">
            {clickable ? <button className={cls} onClick={() => onGo(s)}>{i + 1}. {l}</button> : <div className={cls} aria-current={s === step ? 'step' : undefined}>{i + 1}. {l}</div>}
          </li>
        )
      })}
    </ol>
  )
}

// ── Plan: organised by issue, every part editable, the request always visible ──
function Section({ title, children, hint }: { title: string; children: React.ReactNode; hint?: string }) {
  return (
    <section className="rounded-2xl border border-[#e3ebe9] p-4" dir="rtl">
      <h3 className="text-sm font-black text-[#0F766E] m-0 mb-2">{title}</h3>
      {hint && <p className="text-xs text-[#7a8f8b] mt-0 mb-2">{hint}</p>}
      {children}
    </section>
  )
}

function BulletList({ items, onChange, placeholder }: { items: string[]; onChange: (next: string[]) => void; placeholder: string }) {
  const [draft, setDraft] = useState('')
  return (
    <div className="flex flex-col gap-1.5">
      <ul className="m-0 p-0 list-none flex flex-col gap-1.5">
        {items.map((x, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0F766E] shrink-0" aria-hidden />
            <input dir="auto" value={x} onChange={e => onChange(items.map((y, j) => j === i ? e.target.value : y))}
              className="flex-1 min-h-[38px] px-2 rounded-lg border border-transparent hover:border-[#e3ebe9] focus:border-[#0F766E] focus:outline-none bg-transparent text-[15px]" />
            <button aria-label="הסרה" onClick={() => onChange(items.filter((_, j) => j !== i))} className="w-8 h-8 rounded-lg text-[#9aa6a3] hover:text-[#DC2626] flex items-center justify-center"><X size={15} /></button>
          </li>
        ))}
      </ul>
      <form className="flex items-center gap-2" onSubmit={e => { e.preventDefault(); if (draft.trim()) { onChange([...items, draft.trim()]); setDraft('') } }}>
        <Plus size={15} className="text-[#0F766E] shrink-0" />
        <input dir="auto" value={draft} onChange={e => setDraft(e.target.value)} placeholder={placeholder}
          className="flex-1 min-h-[38px] px-2 rounded-lg border border-dashed border-[#cfdcd9] focus:border-[#0F766E] focus:outline-none bg-white text-sm" />
        {draft.trim() && <button className="text-sm font-bold text-[#0F766E] px-2">הוספה</button>}
      </form>
    </div>
  )
}

function Chips({ options, value, onChange, multi = false }: { options: [string, string][]; value: string | string[]; onChange: (v: any) => void; multi?: boolean }) {
  const on = (v: string) => (multi ? (value as string[]).includes(v) : value === v)
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(([v, l]) => (
        <button key={v} aria-pressed={on(v)} onClick={() => {
          if (!multi) return onChange(v)
          const cur = value as string[]
          const next = on(v) ? cur.filter(x => x !== v) : [...cur, v]
          if (next.length) onChange(next)
        }} className={`min-h-[40px] px-4 rounded-full border-2 text-sm font-bold ${on(v) ? 'border-[#0F766E] bg-[#E4F3F1] text-[#0F766E]' : 'border-[#e3ebe9] bg-white text-[#3d4f4b]'}`}>{l}</button>
      ))}
    </div>
  )
}

function PlanEditor({ mat, setMat, request, setRequest, replanning, onReplan, onBack, onBuild }: any) {
  const plan = mat.plan
  const [newTopic, setNewTopic] = useState('')
  const [showDigest, setShowDigest] = useState(false)
  const set = (p: any) => setMat({ ...mat, plan: { ...plan, ...p } })
  const setTopic = (key: string, patch: any) => set({ topics: plan.topics.map((t: any) => t.key === key ? { ...t, ...patch } : t) })
  const total = plannedCount(plan, mat.kind)
  const isExpl = mat.kind === 'explanation'
  const files = (mat.upload_ids || []).length

  if (replanning) return <div className={`${card} p-8`}><FunLoader kind="plan" pose="think" size={110} /></div>

  return (
    <div className={`${card} p-5 flex flex-col gap-4`} dir="rtl">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <div className="text-xs font-bold text-[#5b6b68] mb-1">שם</div>
          <input dir="auto" aria-label="שם" value={mat.title} onChange={e => setMat({ ...mat, title: e.target.value })}
            className="w-full text-xl font-black text-[#1f2a28] bg-transparent border-b border-dashed border-[#cfdcd9] focus:outline-none focus:border-[#0F766E]" />
        </div>
      </div>

      <Section title="הבקשה שלכם" hint={files ? `${files} קבצים מצורפים` : undefined}>
        <textarea dir="auto" rows={3} value={request} onChange={e => setRequest(e.target.value)}
          className="w-full px-3 py-2 text-[15px] rounded-xl border border-[rgba(15,118,110,.2)] bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E33]" />
        <button className={btnGhost + ' mt-2'} onClick={onReplan}><Sparkles size={16} /> לתכנן מחדש לפי הבקשה</button>
      </Section>

      {plan.digest && (
        <Section title="מה הבנו מהחומר" hint="כך נכתוב את השאלות. אפשר לתקן או להוסיף.">
          {showDigest
            ? <textarea dir="auto" rows={10} value={plan.digest} onChange={e => set({ digest: e.target.value })} className="w-full px-3 py-2 text-sm leading-relaxed rounded-xl border border-[rgba(15,118,110,.2)] bg-white" />
            : <><p className="text-sm text-[#3d4f4b] m-0 leading-relaxed line-clamp-3 whitespace-pre-line">{plan.digest}</p>
               <button className="text-sm font-bold text-[#0F766E] mt-1" onClick={() => setShowDigest(true)}>להציג הכול ולערוך</button></>}
        </Section>
      )}

      {plan.missing_he?.length > 0 && (
        <Section title="כדאי לבדוק">
          <BulletList items={plan.missing_he} onChange={v => set({ missing_he: v })} placeholder="הערה נוספת…" />
          <p className="text-xs text-[#7a8f8b] mb-0">אפשר לענות בבקשה למעלה ולתכנן מחדש, או להמשיך כמו שזה.</p>
        </Section>
      )}

      {hasSections(plan) && <WordsEditor words={plan.words || []} onChange={(w: any[]) => set({ words: w })} />}
      {hasSections(plan) && <SectionsEditor sections={plan.sections} onChange={(sc: Section[]) => set({ sections: sc })} />}

      <Section title="תגיות" hint="עוזרות למצוא את זה אחר כך ב&quot;מה כבר יצרתי&quot;">
        <BulletList items={plan.tags || []} onChange={v => set({ tags: v })} placeholder="להוסיף תגית… (למשל: מבחן חנוכה)" />
      </Section>

      {!hasSections(plan) && <Section title="נושאים">
        <div className="flex flex-col gap-3">
          {plan.topics.map((t: any, idx: number) => (
            <div key={t.key} className="rounded-xl bg-[#F7FBFA] border border-[#e3ebe9] p-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-[#0F766E] w-5">{idx + 1}.</span>
                <input dir="auto" aria-label="שם הנושא" value={t.title_he || t.title_en} onChange={e => setTopic(t.key, { title_he: e.target.value })}
                  className="flex-1 min-h-[40px] px-2 rounded-lg border border-transparent hover:border-[#e3ebe9] focus:border-[#0F766E] focus:outline-none bg-transparent font-bold text-[15px]" />
                {!isExpl && (
                  <div className="flex items-center gap-1" aria-label="כמות שאלות">
                    <button aria-label="פחות" className="w-9 h-9 rounded-lg border border-[#e3ebe9] bg-white flex items-center justify-center" onClick={() => setTopic(t.key, { count: Math.max(1, t.count - 1) })}><Minus size={14} /></button>
                    <span className="w-14 text-center text-sm"><b>{t.count}</b> שאלות</span>
                    <button aria-label="יותר" className="w-9 h-9 rounded-lg border border-[#e3ebe9] bg-white flex items-center justify-center" onClick={() => setTopic(t.key, { count: Math.min(30, t.count + 1) })}><Plus size={14} /></button>
                  </div>
                )}
                <button aria-label="הסרת נושא" className="w-9 h-9 rounded-lg text-[#9aa6a3] hover:text-[#DC2626] flex items-center justify-center" onClick={() => set({ topics: plan.topics.filter((x: any) => x.key !== t.key) })}><Trash2 size={16} /></button>
              </div>
              <div className="ps-7 mt-2">
                <div className="text-xs font-bold text-[#5b6b68] mb-1">במה להתמקד</div>
                <BulletList items={t.subtopics_he || []} onChange={v => setTopic(t.key, { subtopics_he: v })} placeholder="להוסיף נקודה למיקוד…" />
              </div>
            </div>
          ))}
          <form className="flex gap-2" onSubmit={e => { e.preventDefault(); if (!newTopic.trim()) return
            set({ topics: [...plan.topics, { key: `t${Date.now()}`, title_he: newTopic.trim(), title_en: newTopic.trim(), subtopics_he: [], topic_slug: null, topic_id: null, is_new: true, bank_count: 0, count: isExpl ? 0 : 8 }] }); setNewTopic('') }}>
            <input dir="auto" value={newTopic} onChange={e => setNewTopic(e.target.value)} placeholder="להוסיף נושא…"
              className="flex-1 min-h-[44px] px-3 rounded-xl border border-dashed border-[#cfdcd9] bg-white text-sm" />
            <button className={btnGhost} disabled={!newTopic.trim()}><Plus size={16} /> נושא</button>
          </form>
        </div>
      </Section>}

      <Section title="דגשים כלליים" hint="למשל: רק רביע ראשון, מספרים עד 20, בלי שברים">
        <BulletList items={plan.focus_he || []} onChange={v => set({ focus_he: v })} placeholder="להוסיף דגש…" />
      </Section>

      {!isExpl && <>
        <Section title="רמת קושי">
          <Chips options={Object.entries(DIFF_LABEL) as [string, string][]} value={plan.difficulty} onChange={v => set({ difficulty: v })} />
        </Section>
        {mat.subject_slug === 'math' && !hasSections(plan) && (
          <Section title="שרטוטים ומערכת צירים" hint="כשהילד/ה מסמנים בעצמם, הנקודות כתובות בשאלה ומקבלים מערכת צירים ריקה.">
            <Chips options={[['child', 'הילד/ה מסמנים ומשרטטים'], ['ready', 'מוכנים מראש (למתחילים)']]} value={plan.draw_mode || 'child'} onChange={v => set({ draw_mode: v })} />
          </Section>
        )}
        {!hasSections(plan) && <Section title="סוגי שאלות">
          <Chips multi options={[['multiple_choice', 'אמריקאיות'], ['word_problem', 'פתוחות']]} value={plan.q_types} onChange={v => set({ q_types: v })} />
        </Section>}
        <Section title={mat.kind === 'exam' ? 'כמות וזמן' : 'כמות'}>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span>סה״כ <b>{total}</b> שאלות</span>
            {mat.kind === 'exam' && (
              <label className="flex items-center gap-2">זמן המבחן:
                <input type="number" min={5} max={300} value={plan.time_minutes || 45} onChange={e => set({ time_minutes: parseInt(e.target.value) || 45 })}
                  className="w-20 min-h-[40px] px-2 rounded-lg border border-[rgba(15,118,110,.2)] bg-white" /> דקות
              </label>
            )}
          </div>
        </Section>
      </>}

    </div>
  )
}

// ── Short plan: what will be made, in one glance ──
function PlanSummary({ mat, editing, onEdit }: { mat: any; editing: boolean; onEdit: () => void }) {
  const plan = mat.plan
  const total = plannedCount(plan, mat.kind)
  const secMode = hasSections(plan)
  const types = (plan.q_types || []).map((t: string) => (t === 'multiple_choice' ? 'אמריקאיות' : 'פתוחות')).join(' + ')
  return (
    <div className={`${card} p-5`} dir="rtl">
      <div className="flex items-start gap-3">
        <Pip pose="thumbs" size={60} he />
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-black text-[#1f2a28] m-0">{mat.title}</h2>
          {plan.summary_he && <p className="text-sm text-[#3d4f4b] mt-1 mb-0">{plan.summary_he}</p>}
          {plan.mirror && <div className="inline-flex items-center gap-1.5 mt-2 text-xs font-bold px-3 py-1 rounded-full bg-[#FFF4D6] text-[#8a5a00]"><Copy size={13} /> דומה לדף שהעליתם — אותו מבנה, מספרים אחרים</div>}
          {secMode ? (
            <ol className="mt-3 mb-0 p-0 list-none flex flex-col gap-1">
              {plan.sections.map((sc: Section, i: number) => (
                <li key={sc.key} className="flex items-center gap-2 text-sm">
                  <span className="w-6 h-6 rounded-full bg-[#E4F3F1] text-[#0F766E] font-black flex items-center justify-center text-xs shrink-0">{i + 1}</span>
                  <b className="text-[#1f2a28]">{sc.title_he}</b>
                  <span className="text-[#7a8f8b]">· {SECTION_KINDS[sc.kind].q === 'none' ? `${(sc.words || []).length || sc.count} מילים` : sc.kind === 'word_bank' ? `${sc.count} משפטים, מחסן של ${(sc.words || []).length} מילים` : `${sc.count}`}</span>
                </li>
              ))}
            </ol>
          ) : <div className="flex flex-wrap gap-1.5 mt-3">
            {plan.topics.map((t: any) => (
              <span key={t.key} className="text-sm font-bold px-3 py-1 rounded-full bg-[#E4F3F1] text-[#0F766E]">
                {t.title_he || t.title_en}{mat.kind !== 'explanation' ? ` · ${t.count}` : ''}
              </span>
            ))}
          </div>}
          <div className="text-sm text-[#5b6b68] mt-2">
            {mat.kind === 'explanation' ? `${plan.topics.length} דפי הסבר` : secMode ? <>{(plan.words || []).length} מילים לתרגול · {total} שאלות · {plan.sections.length} חלקים</> : <>{total} שאלות · {DIFF_LABEL[plan.difficulty] || ''} · {types}{mat.kind === 'exam' && plan.time_minutes ? ` · ${plan.time_minutes} דקות` : ''}</>}
          </div>
          {(plan.missing_he || []).slice(0, 2).map((x: string, i: number) => (
            <div key={i} className="text-xs text-[#92400E] bg-[#FFFBEB] rounded-lg px-3 py-1.5 mt-2">💡 {x}</div>
          ))}
        </div>
        <button className={btnGhost + ' shrink-0'} onClick={onEdit}><Pencil size={15} /> {editing ? 'סגירת העריכה' : 'לערוך את התוכנית'}</button>
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
        <span className="px-2 py-0.5 rounded-full bg-[#F1F5F9] text-[#475569] font-bold">{q.options ? (q.options.length === 2 ? 'נכון / לא נכון' : 'אמריקאית') : 'פתוחה'}</span>
        {q.approved && <span className="ms-auto inline-flex items-center gap-1 text-[#16A34A] font-bold"><Check size={14} /> אושרה</span>}
      </div>
      {!edit ? (
        <>
          {lang === 'bilingual' && q.prompt_he && q.prompt_en && !isHeText(q.prompt_en) && !q.prompt_he.includes(q.prompt_en) && (
            <div className="text-[15px] text-[#1f2a28] leading-relaxed mb-1" dir="ltr"><FractionText text={q.prompt_en} /></div>
          )}
          <div className="text-[15px] font-bold text-[#1f2a28] leading-relaxed text-start" dir={isHeText(prompt) ? 'rtl' : 'ltr'}><FractionText text={prompt} /></div>
          {q.visual_data && <div className="flex justify-center my-2"><MathVisual data={q.visual_data} size={180} color="#0F766E" /></div>}
          {q.options ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-2">
              {q.options.map((o: any) => (
                <div key={o.label} className={`rounded-lg px-3 py-2 text-sm border ${o.isCorrect ? 'border-[#16A34A] bg-[#F0FDF4] font-bold' : 'border-[#e3ebe9]'}`} dir={isHeText(visibleOption(o, q.options, lang)) ? 'rtl' : 'ltr'}>
                  <FractionText text={visibleOption(o, q.options, lang)} />{o.isCorrect && ' ✓'}
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
  // drawing tasks are for paper only
  const paperOnly = useMemo(() => new Set<string>((mat.plan?.sections || []).filter((sc: Section) => !SECTION_KINDS[sc.kind]?.appOk).flatMap((sc: Section) => (mat.section_q || {})[sc.key] || [])), [mat])
  const appIds = approvedIds.filter((id: string) => !paperOnly.has(id))
  const isExpl = mat.kind === 'explanation'

  const [printOpen, setPrintOpen] = useState(false)
  const [opts, setOpts] = useState({ hints: false, solutions: false, answers: true })
  function print(o = opts) {
    if (isExpl) { window.open(`/api/materials/${mat.id}/print`, '_blank'); return }
    const params = new URLSearchParams({
      childId: mat.child_id || child?.id || '', topicIds: (mat.topic_ids || []).join(','), questionIds: approvedIds.join(','),
      lang: mat.language, answerKey: String(o.answers), includeHints: String(o.hints && mat.kind !== 'exam'), solutionSteps: String(o.solutions),
      wsType: mat.kind === 'exam' ? 'exam' : 'practice', questionCount: String(approvedIds.length), materialId: mat.id,
      ...(mat.time_minutes ? { timeMinutes: String(mat.time_minutes) } : {}),
    })
    window.open(`/api/worksheets/builder?${params}`, '_blank')
  }
  async function sendToApp() {
    setSending(true); setErr(null)
    try {
      const r = await fetch('/api/assignments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ childId: mat.child_id || child?.id, questionIds: appIds, title: mat.title }) })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'שגיאה')
      const id = d.assignment?.id
      if (id) await fetch(`/api/materials/${mat.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ assignment_id: id }) })
      setSent('sent')
    } catch (e: any) { setErr(e.message) } finally { setSending(false) }
  }
  const [share, setShare] = useState<{ url: string; library_status: string } | null>(
    mat.share_slug ? { url: `${typeof window !== 'undefined' ? window.location.origin : ''}/s/${mat.share_slug}`, library_status: mat.library_status || 'none' } : null)
  async function makeShare(library?: boolean) {
    const r = await fetch(`/api/materials/${mat.id}/share`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(library === undefined ? {} : { library }) })
    const d = await r.json()
    if (r.ok) setShare(d); else setErr(d.error || 'שגיאה')
    return r.ok ? d : null
  }
  async function shareWhatsApp() {
    const s = share || await makeShare()
    if (!s) return
    const text = `${mat.title} — דף ${({ practice: 'תרגול', exam: 'מבחן', explanation: 'הסבר' } as any)[mat.kind]} חינם מ-EduPlay 🦉\n${s.url}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
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
        <button className={`${card} p-4 text-start hover:border-[#0F766E]`} onClick={() => (isExpl ? print() : setPrintOpen(true))}>
          <Printer className="text-[#0F766E]" /><div className="font-bold mt-2">להדפסה</div><div className="text-xs text-[#5b6b68]">{isExpl ? 'דפי הסבר ממותגים' : 'בוחרים: רמזים, פתרונות, תשובות בסוף'}</div>
        </button>
        {!isExpl && (
          <button className={`${card} p-4 text-start hover:border-[#0F766E] disabled:opacity-60`} disabled={sending || !!sent || !(mat.child_id || child?.id)} onClick={sendToApp}>
            <Smartphone className="text-[#0F766E]" /><div className="font-bold mt-2">{sent ? 'נשלח לאפליקציה ✓' : 'לשלוח לאפליקציה'}</div>
            <div className="text-xs text-[#5b6b68]">{child ? `יופיע ל${child.name} ב"היום"` : 'בחרו ילד/ה'}{paperOnly.size ? ' · משימות הציור רק בדף' : ''}</div>
          </button>
        )}
      </div>
      {err && <div className="text-sm text-[#DC2626]">{err}</div>}

      <div className="border-t border-[#e3ebe9] pt-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold text-[#3d4f4b]">לשתף:</span>
          <button className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-xl bg-[#25D366] text-white font-bold text-sm" onClick={shareWhatsApp}><Share2 size={16} /> בוואטסאפ</button>
          <button className={btnGhost} onClick={async () => { const s = share || await makeShare(); if (s) { try { await navigator.clipboard.writeText(s.url) } catch {} } }}>העתקת קישור</button>
          {share && <a href={share.url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#0F766E] underline" dir="ltr">{share.url.replace(/^https?:\/\//, '')}</a>}
        </div>
        <p className="text-xs text-[#7a8f8b] m-0">בקישור רואים רק את הדף עצמו, בלי שם הילד/ה ובלי פרטים על המשפחה.</p>
        <label className="flex items-center gap-2 text-sm text-[#3d4f4b]">
          <input type="checkbox" checked={!!share && share.library_status !== 'none'} onChange={e => makeShare(e.target.checked)} />
          <Library size={15} className="text-[#0F766E]" /> להציע לספרייה החינמית של EduPlay, כדי שהורים אחרים ייהנו (נבדק לפני שמתפרסם)
          {share?.library_status === 'listed' && <span className="text-xs font-bold text-[#16A34A]">· מופיע בספרייה</span>}
        </label>
      </div>

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
      <FeedbackPrompt materialId={mat.id} />
      {printOpen && (
        <div role="dialog" aria-modal="true" dir="rtl" className="fixed inset-0 z-[700] bg-black/40 flex items-end sm:items-center justify-center p-3" onClick={() => setPrintOpen(false)}>
          <div className="bg-white rounded-3xl w-full max-w-[420px] p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4"><Printer className="text-[#0F766E]" /><div className="font-black text-lg">מה להדפיס?</div></div>
            {([
              ['hints', 'רמזים ליד כל שאלה', 'עזרה קטנה שלא מגלה את התשובה'],
              ['solutions', 'פתרון מלא צעד אחר צעד', 'בעמודים נפרדים בסוף'],
              ['answers', 'דף תשובות', 'בעמוד האחרון, כדי לבדוק אחר כך'],
            ] as const).filter(([k]) => !(k === 'hints' && mat.kind === 'exam')).map(([k, l, d]) => (
              <label key={k} className="flex items-start gap-3 py-2.5 border-b border-[#f0f3f2] cursor-pointer">
                <input type="checkbox" className="mt-1 w-5 h-5 accent-[#0F766E]" checked={(opts as any)[k]} onChange={e => setOpts(o => ({ ...o, [k]: e.target.checked }))} />
                <span><span className="font-bold block">{l}</span><span className="text-xs text-[#5b6b68]">{d}</span></span>
              </label>
            ))}
            <div className="flex gap-2 justify-between mt-4">
              <button className={btnGhost} onClick={() => setPrintOpen(false)}>ביטול</button>
              <button className={btnPrimary} onClick={() => { setPrintOpen(false); print() }}><Printer size={16} /> להדפסה</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── history: everything this family made — filter by child, grade, subject, tag; remove ──
function HistoryList({ onMore, kidsList: children }: any) {
  const [items, setItems] = useState<any[] | null>(null)
  const [f, setF] = useState({ child: 'all', grade: 'all', subject: 'all', tag: 'all' })
  const [confirm, setConfirm] = useState<any>(null)
  const [moreTags, setMoreTags] = useState(false)
  useEffect(() => { fetch('/api/materials').then(r => r.json()).then(d => setItems(d.materials || [])) }, [])
  if (!items) return <div className="text-sm text-[#7a8f8b]">טוען…</div>
  if (!items.length) return <div className={`${card} p-6 text-sm text-[#5b6b68]`}>עוד לא יצרתם כלום. בואו נתחיל!</div>
  const kindHe: any = { practice: 'תרגול', exam: 'מבחן', explanation: 'דפי הסבר' }
  const subjHe = (sl: string) => SUBJECTS.find(x => x.slug === sl)?.he || sl
  const childName = (id: string) => (children || []).find((c: any) => c.id === id)?.name
  const grades = [...new Set(items.map(m => m.grade))].sort((a, b) => a - b)
  const subjects = [...new Set(items.map(m => m.subject_slug))]
  // most used tags first; the rest behind "more"
  const freq = new Map<string, number>()
  for (const t of items.flatMap(m => m.tags || []) as string[]) freq.set(t, (freq.get(t) || 0) + 1)
  const allTags = [...freq.keys()].sort((a, b) => (freq.get(b)! - freq.get(a)!))
  const tags = moreTags ? allTags : allTags.slice(0, 10)
  const kids = (children || []).filter((c: any) => items.some(m => m.child_id === c.id))
  const shown = items
    .filter(m => (f.child === 'all' || m.child_id === f.child) && (f.grade === 'all' || String(m.grade) === f.grade)
      && (f.subject === 'all' || m.subject_slug === f.subject) && (f.tag === 'all' || (m.tags || []).includes(f.tag)))
    .sort((a, b) => Number(!!b.liked) - Number(!!a.liked))
  async function remove(m: any) {
    const r = await fetch(`/api/materials/${m.id}`, { method: 'DELETE' })
    if (r.ok) setItems(xs => (xs || []).filter(x => x.id !== m.id))
    setConfirm(null)
  }
  const sel = 'min-h-[40px] px-3 rounded-xl border border-[rgba(15,118,110,.2)] bg-white text-sm'
  const pill = (on: boolean) => `min-h-[36px] px-3 rounded-full border-2 text-sm font-bold ${on ? 'border-[#0F766E] bg-[#E4F3F1] text-[#0F766E]' : 'border-[#e3ebe9] bg-white text-[#3d4f4b]'}`
  return (
    <div className="flex flex-col gap-2" dir="rtl">
      <div className={`${card} p-3 flex flex-col gap-2`}>
        <div className="flex flex-wrap gap-2">
          {kids.length > 1 && <>
            <button className={pill(f.child === 'all')} onClick={() => setF({ ...f, child: 'all' })}>כל הילדים</button>
            {kids.map((c: any) => <button key={c.id} className={pill(f.child === c.id)} onClick={() => setF({ ...f, child: c.id })}>{c.name}</button>)}
          </>}
          {grades.length > 1 && <select aria-label="כיתה" className={sel} value={f.grade} onChange={e => setF({ ...f, grade: e.target.value })}>
            <option value="all">כל הכיתות</option>{grades.map(g => <option key={g} value={g}>{gradeHe(g)}</option>)}
          </select>}
          {subjects.length > 1 && <select aria-label="מקצוע" className={sel} value={f.subject} onChange={e => setF({ ...f, subject: e.target.value })}>
            <option value="all">כל המקצועות</option>{subjects.map(x => <option key={x} value={x}>{subjHe(x)}</option>)}
          </select>}
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <button className={pill(f.tag === 'all') + ' !min-h-[30px] !text-xs'} onClick={() => setF({ ...f, tag: 'all' })}># הכול</button>
            {tags.map(t => <button key={t} className={pill(f.tag === t) + ' !min-h-[30px] !text-xs'} onClick={() => setF({ ...f, tag: f.tag === t ? 'all' : t })}># {t}</button>)}
            {allTags.length > 10 && <button className="text-xs font-bold text-[#0F766E] px-2" onClick={() => setMoreTags(v => !v)}>{moreTags ? 'פחות' : `עוד ${allTags.length - 10}`}</button>}
          </div>
        )}
      </div>
      {shown.length === 0 && <div className={`${card} p-5 text-sm text-[#5b6b68]`}>אין כאן כלום עם הסינון הזה.</div>}
      {shown.map(m => (
        <div key={m.id} className={`${card} p-4 flex flex-wrap items-center gap-3`}>
          <div className="flex-1 min-w-[200px]">
            <div className="font-bold text-[#1f2a28]">{m.title} {m.liked && <ThumbsUp size={14} className="inline text-[#0F766E]" />}</div>
            <div className="text-xs text-[#5b6b68]">{kindHe[m.kind]} · {subjHe(m.subject_slug)} · {gradeHe(m.grade)}{childName(m.child_id) ? ` · ${childName(m.child_id)}` : ''} · {m.question_ids?.length || 0} שאלות · {new Date(m.created_at).toLocaleDateString('he-IL')}{m.status === 'draft' ? ' · טיוטה' : ''}</div>
            {(m.tags || []).length > 0 && <div className="flex flex-wrap gap-1 mt-1">{m.tags.slice(0, 5).map((t: string) => <span key={t} className="text-[11px] px-2 py-0.5 rounded-full bg-[#F1F5F9] text-[#475569]">#{t}</span>)}</div>}
          </div>
          {m.rating && <div className="text-xs text-[#B7862F]" dir="ltr">{'★'.repeat(m.rating)}</div>}
          <a className={btnGhost} href={`/create?open=${m.id}`}>פתיחה</a>
          <button className={btnGhost} onClick={() => onMore(m)}><Copy size={15} /> עוד כזה</button>
          <button aria-label="מחיקה" className={btnGhost + ' !text-[#DC2626] !px-3'} onClick={() => setConfirm(m)}><Trash2 size={16} /></button>
        </div>
      ))}
      {confirm && (
        <div role="dialog" aria-modal="true" dir="rtl" className="fixed inset-0 z-[700] bg-black/40 flex items-end sm:items-center justify-center p-3" onClick={() => setConfirm(null)}>
          <div className="bg-white rounded-3xl w-full max-w-[400px] p-5" onClick={e => e.stopPropagation()}>
            <div className="font-black text-lg mb-1">למחוק את "{confirm.title}"?</div>
            <div className="text-sm text-[#5b6b68] mb-4">הוא ייעלם מהרשימה{confirm.library_status === 'listed' ? ' ומהספרייה החינמית' : ''}. מה שכבר נשלח לאפליקציה נשאר אצל הילד/ה.</div>
            <div className="flex gap-2 justify-between">
              <button className={btnGhost} onClick={() => setConfirm(null)}>ביטול</button>
              <button className={btnPrimary + ' !bg-[#DC2626]'} onClick={() => remove(confirm)}><Trash2 size={16} /> למחוק</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Workbook: the word list to approve (English + Hebrew), editable ──
function WordsEditor({ words, onChange }: { words: { en: string; he: string }[]; onChange: (w: any[]) => void }) {
  const [en, setEn] = useState(''), [he, setHe] = useState('')
  const [all, setAll] = useState(false)
  const shown = all ? words : words.slice(0, 24)
  const upd = (i: number, k: 'en' | 'he', v: string) => onChange(words.map((w, j) => (j === i ? { ...w, [k]: v } : w)))
  return (
    <Section title={`המילים לתרגול (${words.length})`} hint="זו הרשימה שממנה ייכתבו כל החלקים. אפשר לתקן תרגום, למחוק או להוסיף מילים.">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
        {shown.map((w, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <input dir="ltr" aria-label="מילה באנגלית" value={w.en} onChange={e => upd(i, 'en', e.target.value)} className="w-[42%] min-h-[36px] px-2 rounded-lg border border-[#e3ebe9] bg-white font-bold text-sm" />
            <input dir="rtl" aria-label="תרגום" value={w.he} onChange={e => upd(i, 'he', e.target.value)} className="flex-1 min-h-[36px] px-2 rounded-lg border border-[#e3ebe9] bg-white text-sm" />
            <button aria-label="הסרה" onClick={() => onChange(words.filter((_, j) => j !== i))} className="w-8 h-8 rounded-lg text-[#9aa6a3] hover:text-[#DC2626] flex items-center justify-center shrink-0"><X size={15} /></button>
          </div>
        ))}
      </div>
      {words.length > 24 && <button className="text-sm font-bold text-[#0F766E] mt-2" onClick={() => setAll(a => !a)}>{all ? 'להציג פחות' : `להציג את כל ${words.length} המילים`}</button>}
      <form className="flex items-center gap-1.5 mt-2" onSubmit={e => { e.preventDefault(); if (!en.trim()) return; onChange([...words, { en: en.trim(), he: he.trim() }]); setEn(''); setHe('') }}>
        <Plus size={15} className="text-[#0F766E] shrink-0" />
        <input dir="ltr" value={en} onChange={e => setEn(e.target.value)} placeholder="word" className="w-[38%] min-h-[38px] px-2 rounded-lg border border-dashed border-[#cfdcd9] bg-white text-sm" />
        <input dir="rtl" value={he} onChange={e => setHe(e.target.value)} placeholder="תרגום" className="flex-1 min-h-[38px] px-2 rounded-lg border border-dashed border-[#cfdcd9] bg-white text-sm" />
        <button className="text-sm font-bold text-[#0F766E] px-2" disabled={!en.trim()}>הוספה</button>
      </form>
    </Section>
  )
}

// ── Workbook: the parts, in order — count, rename, remove, add ──
function SectionsEditor({ sections, onChange }: { sections: Section[]; onChange: (s: Section[]) => void }) {
  const [add, setAdd] = useState<SectionKind | ''>('')
  const upd = (key: string, patch: any) => onChange(sections.map(x => (x.key === key ? { ...x, ...patch } : x)))
  const move = (i: number, d: number) => { const a = [...sections]; const [x] = a.splice(i, 1); a.splice(Math.max(0, Math.min(a.length, i + d)), 0, x); onChange(a) }
  const unit = (k: SectionKind) => (k === 'word_list' || k === 'translate_words' ? 'מילים' : k === 'word_bank' || k === 'translate_sentences' || k === 'draw' ? 'משפטים' : 'שאלות')
  return (
    <Section title="חלקי החוברת" hint="בסדר הזה הם יודפסו. אפשר לשנות כמות, לשנות סדר, להסיר או להוסיף חלק.">
      <div className="flex flex-col gap-2">
        {sections.map((sc, i) => (
          <div key={sc.key} className="rounded-xl bg-[#F7FBFA] border border-[#e3ebe9] p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-black text-[#0F766E] w-5">{i + 1}.</span>
              <input dir="auto" aria-label="שם החלק" value={sc.title_he} onChange={e => upd(sc.key, { title_he: e.target.value })}
                className="flex-1 min-w-[140px] min-h-[40px] px-2 rounded-lg border border-transparent hover:border-[#e3ebe9] focus:border-[#0F766E] focus:outline-none bg-transparent font-bold text-[15px]" />
              <div className="flex items-center gap-1">
                <button aria-label="פחות" className="w-9 h-9 rounded-lg border border-[#e3ebe9] bg-white flex items-center justify-center" onClick={() => upd(sc.key, { count: Math.max(1, sc.count - 1) })}><Minus size={14} /></button>
                <span className="w-20 text-center text-sm"><b>{sc.count}</b> {unit(sc.kind)}</span>
                <button aria-label="יותר" className="w-9 h-9 rounded-lg border border-[#e3ebe9] bg-white flex items-center justify-center" onClick={() => upd(sc.key, { count: Math.min(sc.kind === 'word_bank' ? 10 : 30, sc.count + 1) })}><Plus size={14} /></button>
              </div>
              <button aria-label="למעלה" disabled={i === 0} className="w-8 h-8 rounded-lg text-[#5b6b68] disabled:opacity-30 flex items-center justify-center" onClick={() => move(i, -1)}><ArrowUp size={15} /></button>
              <button aria-label="הסרת חלק" className="w-8 h-8 rounded-lg text-[#9aa6a3] hover:text-[#DC2626] flex items-center justify-center" onClick={() => onChange(sections.filter(x => x.key !== sc.key))}><Trash2 size={16} /></button>
            </div>
            <input dir="auto" aria-label="ההוראה לילד/ה" value={sc.instructions_he} onChange={e => upd(sc.key, { instructions_he: e.target.value })}
              className="w-full mt-1 ps-7 min-h-[34px] px-2 rounded-lg border border-transparent hover:border-[#e3ebe9] focus:border-[#0F766E] focus:outline-none bg-transparent text-sm text-[#5b6b68]" />
          </div>
        ))}
        <div className="flex gap-2">
          <select aria-label="להוסיף חלק" value={add} onChange={e => setAdd(e.target.value as any)} className="flex-1 min-h-[44px] px-3 rounded-xl border border-dashed border-[#cfdcd9] bg-white text-sm">
            <option value="">להוסיף חלק…</option>
            {SECTION_ORDER.map(k => <option key={k} value={k}>{SECTION_KINDS[k].he}</option>)}
          </select>
          <button className={btnGhost} disabled={!add} onClick={() => { if (!add) return
            const k = SECTION_KINDS[add]; onChange([...sections, { key: `s${Date.now()}`, kind: add, title_he: k.he, instructions_he: k.instr, count: k.def }]); setAdd('') }}><Plus size={16} /> חלק</button>
        </div>
      </div>
    </Section>
  )
}

// ── Workbook review: the parts in order, with the word table and the bank ──
function SectionReview({ mat, questions, act, reload }: any) {
  const words: { en: string; he: string }[] = mat.plan?.words || []
  const byId = new Map(questions.map((q: any) => [q.id, q]))
  let n = 0
  return (
    <>
      {(mat.plan.sections as Section[]).map((sc, si) => {
        const qs = (((mat.section_q || {})[sc.key] || []) as string[]).map(id => byId.get(id)).filter(Boolean) as any[]
        const head = (
          <div className="mt-3 mb-2">
            <h3 className="text-base font-black text-[#0F766E] m-0">{si + 1}. {sc.title_he} <span className="text-xs font-semibold text-[#7a8f8b]">{SECTION_KINDS[sc.kind].q === 'none' ? '' : `· ${qs.length}`}</span></h3>
            <div className="text-xs text-[#5b6b68]">{sc.instructions_he}{!SECTION_KINDS[sc.kind].appOk ? ' · רק בדף המודפס' : ''}</div>
          </div>
        )
        if (sc.kind === 'word_list') return (
          <div key={sc.key}>{head}
            <div className={`${card} p-3 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-sm`}>
              {(sc.words || []).map(en => <div key={en} className="flex justify-between gap-2 border-b border-[#f0f3f2] py-1"><b dir="ltr">{en}</b><span>{words.find(w => w.en === en)?.he}</span></div>)}
            </div>
          </div>
        )
        if (!qs.length) return null
        return (
          <div key={sc.key}>{head}
            {sc.kind === 'word_bank' && (sc.words || []).length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 border-2 border-dashed border-[#0F766E55] rounded-2xl p-3 mb-2" dir="ltr">
                {(sc.words || []).map(w => <span key={w} className="px-3 py-1 rounded-lg bg-[#E4F3F1] font-bold text-sm">{w}</span>)}
              </div>
            )}
            <div className="flex flex-col gap-2">
              {qs.map(q => <QuestionCard key={q.id} q={q} n={++n} lang={mat.language} onApprove={() => act(q, 'approve')} onRemove={() => act(q, 'reject')} onSaved={reload} />)}
            </div>
          </div>
        )
      })}
    </>
  )
}

// ── Remove a question, optionally saying why (the reason improves the next ones) ──
const REMOVE_REASONS = ['קשה לקרוא / הציור לא ברור', 'לא לשרטט מראש — שהילד/ה יסמנו', 'ציור מיותר', 'חוזרת על שאלה אחרת', 'התשובה מופיעה בשאלה או בציור', 'חסר ציור או גרף', 'לא מתאים לחומר', 'קלה מדי', 'קשה מדי', 'ניסוח לא ברור', 'יש טעות']
function RemoveModal({ q, onCancel, onRemove }: any) {
  const [picked, setPicked] = useState<string[]>([])
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const go = async (withReason: boolean) => { setBusy(true); await onRemove(withReason ? picked : [], withReason ? note : '') }
  return (
    <div role="dialog" aria-modal="true" dir="rtl" className="fixed inset-0 z-[700] bg-black/40 flex items-end sm:items-center justify-center p-3" onClick={onCancel}>
      <div className="bg-white rounded-3xl w-full max-w-[480px] p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-3">
          <Pip pose="think" size={56} he />
          <div>
            <div className="font-black text-lg">למה להסיר?</div>
            <div className="text-sm text-[#5b6b68]">זה עוזר לנו לכתוב שאלות טובות יותר בהמשך. לא חובה.</div>
          </div>
        </div>
        <div className="text-sm text-[#3d4f4b] bg-[#F7FBFA] rounded-xl px-3 py-2 mb-3 line-clamp-2"><FractionText text={q.prompt_he || q.prompt_en} /></div>
        <div className="flex flex-wrap gap-2 mb-3">
          {REMOVE_REASONS.map(r => (
            <button key={r} aria-pressed={picked.includes(r)} onClick={() => setPicked(p => p.includes(r) ? p.filter(x => x !== r) : [...p, r])}
              className={`min-h-[38px] px-3 rounded-full border-2 text-sm font-bold ${picked.includes(r) ? 'border-[#0F766E] bg-[#E4F3F1] text-[#0F766E]' : 'border-[#e3ebe9] text-[#3d4f4b]'}`}>{r}</button>
          ))}
        </div>
        <textarea dir="auto" rows={2} value={note} onChange={e => setNote(e.target.value)} placeholder="משהו נוסף? למשל: לשאול על היקף ולא על שטח"
          className="w-full px-3 py-2 rounded-xl border border-[rgba(15,118,110,.2)] text-[15px] mb-3" />
        <div className="flex flex-wrap gap-2 justify-between">
          <button className={btnGhost} onClick={onCancel}>ביטול</button>
          <div className="flex gap-2">
            <button className={btnGhost} disabled={busy} onClick={() => go(false)}>להסיר בלי לפרט</button>
            <button className={btnPrimary} disabled={busy || (!picked.length && !note.trim())} onClick={() => go(true)}><X size={16} /> להסיר</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Add a few more questions, with an optional note ("more hard ones") ──
function AddMorePanel({ topics, onAdd }: { topics: any[]; onAdd: (count: number, topicKey: string, note: string) => void }) {
  const [open, setOpen] = useState(false)
  const [count, setCount] = useState(5)
  const [topic, setTopic] = useState('all')
  const [note, setNote] = useState('')
  if (!open) return (
    <button className={btnGhost + ' self-start'} onClick={() => setOpen(true)}><Plus size={16} /> להוסיף שאלות</button>
  )
  return (
    <div className={`${card} p-4 flex flex-col gap-3`} dir="rtl">
      <div className="font-black text-[#1f2a28]">להוסיף שאלות</div>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span>כמה?</span>
        {[3, 5, 10].map(n => <button key={n} aria-pressed={count === n} onClick={() => setCount(n)} className={`min-h-[38px] px-4 rounded-full border-2 font-bold ${count === n ? 'border-[#0F766E] bg-[#E4F3F1] text-[#0F766E]' : 'border-[#e3ebe9]'}`}>{n}</button>)}
        {topics.length > 1 && (
          <select value={topic} onChange={e => setTopic(e.target.value)} className="min-h-[40px] px-3 rounded-xl border border-[rgba(15,118,110,.2)] bg-white">
            <option value="all">כל הנושאים</option>
            {topics.map(t => <option key={t.key} value={t.key}>{t.title_he || t.title_en}</option>)}
          </select>
        )}
      </div>
      <input dir="auto" value={note} onChange={e => setNote(e.target.value)} placeholder="על מה? למשל: עוד שאלות קשות על היקף ושטח"
        className="min-h-[44px] px-3 rounded-xl border border-[rgba(15,118,110,.2)] bg-white text-[15px]" />
      <div className="flex gap-2">
        <button className={btnPrimary} onClick={() => { setOpen(false); onAdd(count, topic, note) }}><Sparkles size={16} /> ליצור {count} שאלות</button>
        <button className={btnGhost} onClick={() => setOpen(false)}>ביטול</button>
      </div>
    </div>
  )
}

// ── Floating "back to top" once the page is scrolled ──
function BackToTop() {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const on = () => setShow(window.scrollY > 600)
    window.addEventListener('scroll', on, { passive: true }); on()
    return () => window.removeEventListener('scroll', on)
  }, [])
  if (!show) return null
  return (
    <button aria-label="לראש הדף" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-5 left-5 z-[500] w-12 h-12 rounded-full bg-[#0F766E] text-white shadow-lg flex items-center justify-center hover:bg-[#0d665f]">
      <ArrowUp size={22} />
    </button>
  )
}
