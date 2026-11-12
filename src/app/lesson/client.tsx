'use client'
import { useEffect, useMemo, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import LessonLearn from '@/components/lesson/LessonLearn'
import QuestionScreen, { QuestionFrame } from '@/components/question/QuestionScreen'
import qs from '@/components/question/question.module.css'
import { subjectKey } from '@/components/question/tokens'
import { Oli } from '@/components/oli/Oli'
import { win, tryAgain } from '@/lib/sfx'
import { announceTokensChanged, saveKidLang, type KidLang } from '@/lib/kidPrefs'

// The lesson: a short "learn" screen first (what it is, key points, a worked
// example revealed step by step), then one question per screen in the
// notebook design (src/components/question), then the done screen. A wrong
// first try shows the "almost" bar and lets the child try again (a hint and
// step-by-step help are always one tap away); a second wrong try shows the
// answer and the solution. Every answer is graded and recorded by /api/progress.
// Reading lessons with a story keep the story beside every question.

type Status = 'open' | 'wrong1' | 'right1' | 'right2' | 'revealed'

export default function LessonClient({ child, topic, questions: plainQs, explanation, progress, passage, passageQuestions }: any) {
  const sp = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  const token = sp?.get('token') || ''
  const from = sp?.get('from') || ''
  const langMode = (sp?.get('lang') || child?.lang_screen || 'bilingual') as string
  const isHE = langMode !== 'en_only'
  const L = (he: string, en: string) => (isHE ? he : en)
  const subj = topic?.subject?.slug || 'math'
  const sk = subjectKey(subj, topic?.slug)
  useEffect(() => { if (child?.id) saveKidLang(langMode as KidLang, child.id) }, [langMode, child?.id])

  // a reading lesson with a story: its own questions, with the story beside them
  const isPassage = !!passage && Array.isArray(passageQuestions) && passageQuestions.length > 0
  const questions: any[] = useMemo(() => (isPassage ? passageQuestions.map((x: any) => ({ ...x, _passage: true })) : plainQs || []), [isPassage, passageQuestions, plainQs])
  const stars = Array.isArray(progress) ? progress.filter((p: any) => p.status === 'completed').length : null

  const total = questions.length
  const [phase, setPhase] = useState<'learn' | 'quiz' | 'done'>(isPassage && !explanation ? 'quiz' : 'learn')
  const [idx, setIdx] = useState(0)
  const [status, setStatus] = useState<Status>('open')
  const [tries, setTries] = useState<string[]>([])
  const [rightLabel, setRightLabel] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [help, setHelp] = useState<{ hint: boolean; steps: number }>({ hint: false, steps: 0 })
  const [results, setResults] = useState<Status[]>([])
  const [sticker, setSticker] = useState(false)

  const q = questions[idx]
  const canAnswer = (status === 'open' || status === 'wrong1') && !busy
  const options: any[] = Array.isArray(q?.options) ? q.options : []

  function exitTo() {
    if (from === 'curriculum') return '/curriculum'
    return token ? `/play/${token}` : '/dashboard'
  }
  function exit() {
    if (phase === 'quiz' && idx > 0) {
      fetch('/api/progress', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ childId: child?.id, topicId: topic?.id, stepNumber: idx, totalSteps: total }) }).catch(() => {})
    }
    window.location.href = exitTo()
  }

  async function answer(label: string) {
    if (!q || !canAnswer) return
    setBusy(true)
    let correct = false
    try {
      const r = await fetch('/api/progress', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId: child?.id, ...(q._passage ? { passageQuestionId: q.id } : { questionId: q.id }), topicId: topic?.id, answerGiven: label, hintUsed: help.hint || help.steps > 0, stepNumber: idx, totalSteps: total }) })
      const d = await r.json()
      correct = !!d.correct
    } catch {
      const o = options.find(x => x.label === label); correct = !!o?.isCorrect
    }
    setBusy(false)
    if (correct) {
      setRightLabel(label)
      setStatus(status === 'open' ? 'right1' : 'right2')
      win()
    } else {
      setTries(t => [...t, label])
      setStatus(status === 'open' ? 'wrong1' : 'revealed')
      tryAgain()
    }
  }

  function next() {
    const res = [...results, status]
    setResults(res)
    if (idx + 1 >= total) return finish()
    setIdx(idx + 1); setStatus('open'); setTries([]); setRightLabel(null); setHelp({ hint: false, steps: 0 })
    window.scrollTo({ top: 0 })
  }

  function finish() {
    setPhase('done')
    fetch('/api/progress', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ childId: child?.id, topicId: topic?.id, stepNumber: total, totalSteps: total }) })
      .then(r => r.json()).then(d => {
        if (d?.isNewBest) {
          setSticker(true)
          fetch('/api/cards/token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ childId: child?.id }) }).then(() => announceTokensChanged()).catch(() => {})
        }
      }).catch(() => {})
    const trig = child?.relief_trigger || 'topic'
    if (trig === 'lesson' || trig === 'both') {
      setTimeout(() => { window.location.href = `/relief?childId=${child?.id}&grade=${child?.grade || 0}&token=${token}&returnTo=${encodeURIComponent(exitTo())}` }, 4000)
    }
  }

  const title = isHE ? topic?.title_he || topic?.title_en : topic?.title_en

  // ── 1. learn ─────────────────────────────────────────────
  // Notebook design (designer pilot, 2026-11): see src/components/lesson.
  if (phase === 'learn') {
    return (
      <LessonLearn title={title || ''} subject={subj} explanation={explanation} he={isHE}
        topicDescription={isHE ? topic?.description_he || topic?.description_en : topic?.description_en}
        stars={stars} questionCount={total} onClose={exit}
        onStart={() => { setPhase('quiz'); window.scrollTo({ top: 0 }) }} />
    )
  }

  // ── 3. done ──────────────────────────────────────────────
  // Notebook design with Oli (designer handover, 2026-11).
  if (phase === 'done') {
    const first = results.filter(r => r === 'right1').length
    const second = results.filter(r => r === 'right2').length
    const correct = first + second
    const pct = total ? correct / total : 0
    const oli = pct >= 0.8 ? 'party' : pct >= 0.5 ? 'soso' : 'love'
    return (
      <QuestionFrame subject={sk} grade={child?.grade} isHE={isHE} stars={stars} onExit={exit}>
        <section className={qs.doneCard}>
          <Oli state={oli} size={220} />
          <h1 className={qs.doneTitle}>{pct >= 0.8 ? L('כל הכבוד!', 'Amazing!') : L('סיימת את השיעור!', 'Lesson done!')}</h1>
          <p className={qs.doneLine}>{L(`ענית נכון על ${correct} מתוך ${total}`, `${correct} of ${total} correct`)}</p>
          <div className={qs.pills}>
            <span className={qs.pill} style={{ background: '#DDF4EA', color: '#0B6B59' }}>{L(`${first} בפעם הראשונה`, `${first} first try`)}</span>
            {second > 0 && <span className={qs.pill} style={{ background: '#FFF4D1', color: '#7A5600' }}>{L(`${second} בניסיון השני`, `${second} on the second try`)}</span>}
          </div>
          {sticker && <div className={qs.sticker}>{L('קיבלת מדבקה חדשה לאלבום!', 'You earned a new sticker!')}</div>}
          <div className={qs.doneBtns}>
            <button className={qs.next} onClick={() => window.location.reload()}><RotateCcw size={24} style={{ marginInlineEnd: 10 }} /> {L('עוד סיבוב תרגול', 'Practice again')}</button>
            <button className={qs.ghost} onClick={() => { window.location.href = exitTo() }}>{L('חזרה הביתה', 'Back home')}</button>
          </div>
        </section>
      </QuestionFrame>
    )
  }

  // ── 2. quiz ──────────────────────────────────────────────
  // One screen for every subject and grade: src/components/question.
  return (
    <QuestionScreen q={q} idx={idx} total={total} subject={sk} grade={child?.grade} isHE={isHE} langMode={langMode} stars={stars}
      status={status} tries={tries} rightLabel={rightLabel} busy={busy} passage={isPassage ? passage : null}
      hintUsed={help.hint} onHintUsed={() => setHelp(h => ({ ...h, hint: true }))}
      onExit={exit} onAnswer={answer} onRetry={() => {}} onNext={next} isLast={idx + 1 >= total} />
  )
}

