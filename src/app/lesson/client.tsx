'use client'
import { useEffect, useMemo, useState } from 'react'
import { X, Lightbulb, ListOrdered, ChevronRight, ChevronLeft, Play, RotateCcw } from 'lucide-react'
import KidOpenAnswer from '@/components/kid/KidOpenAnswer'
import PlotGate from '@/components/kid/PlotGate'
import MathVisual from '@/components/MathVisual'
import FractionText from '@/components/FractionText'
import InlineMath from '@/components/InlineMath'
import HebrewMathText from '@/components/HebrewMathText'
import { AnimatedBtn, Sparkles, THEME_CONFIG } from '@/components/theme'
import { Pip } from '@/components/Pip'
import LessonLearn from '@/components/lesson/LessonLearn'
import { hidesPicture } from '@/lib/interactive'
import { getFontSize } from '@/lib/fontSize'
import { announceTokensChanged, saveKidLang, type KidLang } from '@/lib/kidPrefs'
import { isDistinctHe, translateOptionLabel } from '@/lib/text'

// The lesson, built like the assignment screen so the child meets one way of
// working everywhere: a short "learn" card first (what it is, key points, a
// worked example revealed step by step), then one question per screen. A
// wrong first try opens help (a hint, or the solution step by step with the
// last step left for the child); a second wrong try shows the answer and the
// full explanation. Every answer is graded and recorded by /api/progress.
const F = '"Rubik","Assistant",sans-serif'
const splitSteps = (t: string) => (t || '').split(/(?<=[.!?])\s+(?=\S)|\n+/).map(x => x.trim()).filter(Boolean)

type Status = 'open' | 'wrong1' | 'right1' | 'right2' | 'revealed'

export default function LessonClient({ child, topic, questions, explanation, difficulty, progress }: any) {
  const sp = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  const theme = (sp?.get('theme') || child?.theme || 'plain') as string
  const token = sp?.get('token') || ''
  const from = sp?.get('from') || ''
  const langMode = (sp?.get('lang') || child?.lang_screen || 'bilingual') as string
  const isBonus = sp?.get('bonus') === 'true'
  const isHE = langMode !== 'en_only'
  const L = (he: string, en: string) => (isHE ? he : en)
  const T = THEME_CONFIG[theme] || THEME_CONFIG.plain
  const R = theme === 'minecraft' ? 4 : 24
  const dark = theme === 'minecraft'
  const FS = getFontSize(child?.font_size)
  const subj = topic?.subject?.slug || 'math'
  useEffect(() => { if (child?.id) saveKidLang(langMode as KidLang, child.id) }, [langMode, child?.id])

  const total = questions.length
  const [phase, setPhase] = useState<'learn' | 'quiz' | 'done'>(total ? 'learn' : 'learn')
  const [idx, setIdx] = useState(0)
  const [status, setStatus] = useState<Status>('open')
  const [tries, setTries] = useState<string[]>([])
  const [rightLabel, setRightLabel] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [help, setHelp] = useState<{ hint: boolean; steps: number }>({ hint: false, steps: 0 })
  const [results, setResults] = useState<Status[]>([])
  const [sparkle, setSparkle] = useState(false)
  const [xp, setXp] = useState<string | null>(null)
  const [sticker, setSticker] = useState(false)
  const [exStep, setExStep] = useState(1)

  const q = questions[idx]
  const resolved = status === 'right1' || status === 'right2' || status === 'revealed'
  const canAnswer = (status === 'open' || status === 'wrong1') && !busy
  const expl = ((isHE ? q?.explanation_he : q?.explanation_en) || q?.explanation_he || q?.explanation_en || '').trim()
  const steps = splitSteps(expl)
  const stepsBefore = steps.length > 1 ? steps.slice(0, -1) : []
  const hint = (isHE ? q?.hint_he : q?.hint_en) || q?.hint_he || q?.hint_en || ''
  const options: any[] = Array.isArray(q?.options) ? q.options : []
  const optText = (o: any) => (isHE ? o.value_he || o.value_en || '' : o.value_en || '')
  const twoCols = options.length === 4 && options.every(o => optText(o).length <= 14)
  const qSize = Math.max(22, FS?.question || 0)

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
        body: JSON.stringify({ childId: child?.id, questionId: q.id, topicId: topic?.id, answerGiven: label, hintUsed: help.hint || help.steps > 0, stepNumber: idx, totalSteps: total }) })
      const d = await r.json()
      correct = !!d.correct
    } catch {
      const o = options.find(x => x.label === label); correct = !!o?.isCorrect
    }
    setBusy(false)
    if (correct) {
      setRightLabel(label)
      setStatus(status === 'open' ? 'right1' : 'right2')
      setSparkle(true); setTimeout(() => setSparkle(false), 1200)
      setXp('+25'); setTimeout(() => setXp(null), 1800)
    } else {
      setTries(t => [...t, label])
      setStatus(status === 'open' ? 'wrong1' : 'revealed')
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
  const shell = (children: React.ReactNode, header = true) => (
    <div dir={isHE ? 'rtl' : 'ltr'} style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: '"Assistant",sans-serif', position: 'relative' }}>
      <Sparkles active={sparkle} theme={theme} />
      {header && (
        <header style={{ position: 'sticky', top: 0, zIndex: 100, background: T.bg, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, maxWidth: 640, margin: '0 auto' }}>
          <button onClick={exit} aria-label={L('יציאה', 'Exit')} style={{ width: 48, height: 48, flexShrink: 0, borderRadius: 14, background: T.panel, border: `1.5px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.text, cursor: 'pointer' }}><X size={24} /></button>
          {phase === 'quiz' ? <>
            <div style={{ flex: 1, height: 14, borderRadius: 99, background: dark ? '#444' : 'rgba(22,33,62,0.10)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.max(4, (idx / total) * 100)}%`, background: T.accent1, borderRadius: 99, transition: 'width .3s ease' }} />
            </div>
            <span style={{ fontFamily: F, fontWeight: 800, fontSize: 18 }} dir="ltr">{idx + 1}/{total}</span>
          </> : <span style={{ flex: 1, fontFamily: F, fontWeight: 800, fontSize: 18, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>}
          {xp && <span style={{ fontFamily: F, fontWeight: 800, color: T.xp || T.accent1 }}>{xp}</span>}
        </header>
      )}
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '4px 16px 40px', display: 'flex', flexDirection: 'column', gap: 14 }}>{children}</div>
    </div>
  )
  const bigBtn = (bg: string, fg = '#fff'): React.CSSProperties => ({ width: '100%', minHeight: 64, background: bg, color: fg, border: 'none', borderRadius: R - 6, fontFamily: F, fontSize: 22, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 })
  const box: React.CSSProperties = { background: T.panel, border: `1.5px solid ${T.border}`, borderRadius: R, padding: '18px 16px' }

  // ── 1. learn ─────────────────────────────────────────────
  // Notebook design (designer pilot, 2026-11): see src/components/lesson.
  if (phase === 'learn') {
    const stars = Array.isArray(progress) ? progress.filter((p: any) => p.status === 'completed').length : null
    return (
      <LessonLearn title={title || ''} subject={subj} explanation={explanation} he={isHE}
        topicDescription={isHE ? topic?.description_he || topic?.description_en : topic?.description_en}
        stars={stars} questionCount={total} onClose={exit}
        onStart={() => { setPhase('quiz'); window.scrollTo({ top: 0 }) }} />
    )
  }

  // ── 3. done ──────────────────────────────────────────────
  if (phase === 'done') {
    const first = results.filter(r => r === 'right1').length
    const second = results.filter(r => r === 'right2').length
    const correct = first + second
    const great = correct >= Math.ceil(total * 0.7)
    return shell(
      <div style={{ ...box, marginTop: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center' }}>
        <Sparkles active={great} theme={theme} />
        <Pip theme={theme} pose={great ? 'celebrate' : 'thumbs'} size={140} he={isHE} bounce />
        <div style={{ fontFamily: F, fontSize: 30, fontWeight: 800 }}>{great ? L('כל הכבוד!', 'Amazing!') : L('סיימת את השיעור!', 'Lesson done!')}</div>
        <div style={{ fontSize: 19, color: T.text2 }}>{L(`ענית נכון על ${correct} מתוך ${total}`, `${correct} of ${total} correct`)}</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', fontSize: 16 }}>
          <span style={{ padding: '6px 12px', borderRadius: 999, background: dark ? T.panel2 : '#E3F4EF', color: dark ? T.text : '#0B6B58', fontWeight: 700 }}>{L(`${first} בפעם הראשונה`, `${first} first try`)}</span>
          {second > 0 && <span style={{ padding: '6px 12px', borderRadius: 999, background: dark ? T.panel2 : '#FFF4D6', color: dark ? T.text : '#7A5600', fontWeight: 700 }}>{L(`${second} בניסיון השני`, `${second} on the second try`)}</span>}
        </div>
        {sticker && <div style={{ fontSize: 19, fontWeight: 800, background: dark ? T.panel2 : '#FFF4D6', color: dark ? '#FFE08A' : '#7A5600', borderRadius: 16, padding: '10px 14px', width: '100%', boxSizing: 'border-box' }}>{L('קיבלת מדבקה חדשה לאלבום!', 'You earned a new sticker!')}</div>}
        <button onClick={() => window.location.reload()} style={bigBtn(T.accent1)}><RotateCcw size={20} /> {L('עוד סיבוב תרגול', 'Practice again')}</button>
        <button onClick={() => { window.location.href = exitTo() }} style={{ ...bigBtn('transparent', T.accent1), minHeight: 52, fontSize: 19 }}>{L('חזרה הביתה', 'Back home')}</button>
      </div>, false)
  }

  // ── 2. quiz ──────────────────────────────────────────────
  const correctOpt = options.find(o => o.isCorrect)
  return shell(<>
    <div style={{ ...box, display: 'flex', flexDirection: 'column', gap: 12, padding: '22px 18px' }}>
      {isHE && q?.prompt_he
        ? <HebrewMathText text={q.prompt_he} style={{ fontSize: `${qSize}px`, fontWeight: 700, color: T.text, margin: 0, lineHeight: 1.55, direction: 'rtl', textAlign: 'right' }} />
        : <p style={{ fontSize: `${qSize}px`, fontWeight: 700, margin: 0, lineHeight: 1.55, direction: 'ltr', textAlign: 'left' }}><FractionText text={q?.prompt_en} /></p>}
      {langMode === 'bilingual' && isHE && q?.prompt_he && subj === 'english' && isDistinctHe(q?.prompt_he, q?.prompt_en) && (
        <p dir="ltr" style={{ fontSize: 18, color: T.text2, textAlign: 'left', margin: 0, lineHeight: 1.6 }}><FractionText text={q?.prompt_en} /></p>
      )}
      {q?.visual_data && !hidesPicture(q) && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 12, background: T.panel2, borderRadius: R - 6 }}>
          <MathVisual data={q.visual_data} size={220} color={T.accent1} dark={dark} />
        </div>
      )}
    </div>

    {status === 'wrong1' && (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, background: dark ? T.panel : '#FFF4D6', border: `2px solid ${T.accent2}`, borderRadius: R - 4, padding: 14 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Pip theme={theme} pose="think" size={56} he={isHE} style={{ flexShrink: 0 }} />
          <div style={{ fontFamily: F, fontSize: 19, fontWeight: 800 }}>{L('כמעט! רוצים עזרה, או לנסות שוב?', 'Almost! Want some help, or try again?')}</div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {!help.hint && <button onClick={() => setHelp(h => ({ ...h, hint: true }))} style={helpBtn(T)}><Lightbulb size={20} /> {L('רמז', 'A hint')}</button>}
          {stepsBefore.length > 0 && help.steps === 0 && <button onClick={() => setHelp(h => ({ ...h, steps: 1 }))} style={helpBtn(T)}><ListOrdered size={20} /> {L('צעד אחר צעד', 'Step by step')}</button>}
        </div>
        {help.hint && (
          <div style={{ fontSize: 18, lineHeight: 1.55, background: T.panel, borderRadius: 14, padding: '10px 12px' }}>
            <b>{L('רמז: ', 'Hint: ')}</b><InlineMath text={hint || L('קראו את השאלה שוב לאט, ובדקו כל תשובה אחת-אחת.', 'Read the question again slowly.')} />
          </div>
        )}
        {help.steps > 0 && (
          <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {stepsBefore.slice(0, help.steps).map((st, i) => (
              <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: T.panel, borderRadius: 14, padding: '10px 12px', fontSize: 18, lineHeight: 1.55 }}>
                <span style={{ width: 28, height: 28, flexShrink: 0, borderRadius: '50%', background: T.accent1, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F, fontWeight: 800, fontSize: 15 }}>{i + 1}</span>
                <span><InlineMath text={st} /></span>
              </li>
            ))}
            {help.steps < stepsBefore.length
              ? <button onClick={() => setHelp(h => ({ ...h, steps: h.steps + 1 }))} style={{ alignSelf: 'flex-start', minHeight: 48, padding: '0 18px', borderRadius: 14, border: 'none', background: T.accent1, color: '#fff', fontFamily: F, fontSize: 17, fontWeight: 800, cursor: 'pointer' }}>{L('הצעד הבא', 'Next step')}</button>
              : <div style={{ fontSize: 17, fontWeight: 700, color: T.text2 }}>{L('הצעד האחרון — שלך! עכשיו ענו שוב.', 'The last step is yours — now answer again.')}</div>}
          </ol>
        )}
      </div>
    )}

    <PlotGate q={q} T={T} isHE={isHE} fresh={status === 'open'}>
      {options.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: twoCols ? 'repeat(2, minmax(0, 1fr))' : '1fr', gap: 10 }}>
          {options.map(o => {
            const wrong = tries.includes(o.label) && !(resolved && o.isCorrect)
            const right = (resolved && o.isCorrect) || rightLabel === o.label
            return (
              <AnimatedBtn key={o.label} theme={theme} T={T} correct={right} wrong={wrong} disabled={!canAnswer || tries.includes(o.label)} onClick={() => answer(o.label)}
                style={{ background: right ? (dark ? '#1F4D2E' : '#E3F4EF') : wrong ? (dark ? '#4D1F1F' : '#FDECE7') : T.panel, border: `2.5px solid ${right ? '#12937A' : wrong ? '#E85D3F' : T.border}`, borderRadius: R - 6, minHeight: twoCols ? 84 : 64, padding: '12px 16px', fontSize: 22, fontWeight: 700, fontFamily: F, color: T.text, display: 'flex', alignItems: 'center', justifyContent: twoCols ? 'center' : 'flex-start', gap: 12, textAlign: twoCols ? 'center' : 'start', width: '100%', boxShadow: 'none', opacity: wrong ? 0.75 : 1 }}>
                {!twoCols && <span style={{ width: 34, height: 34, borderRadius: 10, background: T.panel2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0, color: T.text2 }}>{isHE ? translateOptionLabel(o.label) : o.label}</span>}
                <span style={{ unicodeBidi: 'plaintext' }}><FractionText text={optText(o)} /></span>
              </AnimatedBtn>
            )
          })}
        </div>
      )}
      {options.length === 0 && q && (
        <KidOpenAnswer q={q} T={T} isHE={isHE} canAnswer={canAnswer} submitting={busy} tries={tries} resolved={resolved} rightAnswer={rightLabel} onSubmit={answer} />
      )}
    </PlotGate>

    {(status === 'right1' || status === 'right2') && (
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: dark ? '#1F4D2E' : '#E3F4EF', border: '2px solid #12937A', borderRadius: R - 4, padding: 14 }}>
        <Pip theme={theme} pose="thumbs" size={60} he={isHE} bounce style={{ flexShrink: 0 }} />
        <div>
          <div style={{ fontFamily: F, fontSize: 21, fontWeight: 800, color: dark ? '#9BE3C9' : '#0B6B58' }}>{status === 'right1' ? L('נכון! בפעם הראשונה', 'Correct — first try!') : L('נכון!', 'Correct!')}</div>
          {expl && <div style={{ fontSize: 17, lineHeight: 1.6, marginTop: 4 }}><InlineMath text={expl} /></div>}
        </div>
      </div>
    )}
    {status === 'revealed' && (
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: dark ? T.panel : '#FDF3EF', border: `2px solid ${dark ? T.border : '#F2C3B5'}`, borderRadius: R - 4, padding: 14 }}>
        <Pip theme={theme} pose="read" size={56} he={isHE} style={{ flexShrink: 0 }} />
        <div>
          <div style={{ fontFamily: F, fontSize: 19, fontWeight: 800 }}>{L('התשובה היא', 'The answer is')} <bdi><FractionText text={correctOpt ? optText(correctOpt) : q?.correct_answer || ''} /></bdi></div>
          {steps.length > 0 && <ol style={{ margin: '8px 0 0', paddingInlineStart: 22, display: 'flex', flexDirection: 'column', gap: 4, fontSize: 17, lineHeight: 1.6 }}>{steps.map((st, i) => <li key={i}><InlineMath text={st} /></li>)}</ol>}
          <div style={{ fontSize: 16, color: T.text2, marginTop: 6 }}>{L('זה בסדר — ככה לומדים.', "That's okay — that's how we learn.")}</div>
        </div>
      </div>
    )}

    {resolved && (
      <button onClick={next} style={bigBtn(T.accent1)}>
        {idx + 1 >= total ? L('סיום', 'Finish') : L('הבא', 'Next')}
        <ChevronRight size={22} style={isHE ? { transform: 'scaleX(-1)' } : undefined} />
      </button>
    )}
  </>)
}

function helpBtn(T: any): React.CSSProperties {
  return { flex: '1 1 140px', minHeight: 56, borderRadius: 16, border: `2px solid ${T.accent2}`, background: T.panel, color: T.text, fontFamily: F, fontSize: 18, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }
}
