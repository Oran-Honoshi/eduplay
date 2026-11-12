'use client'
import React, { useEffect, useMemo, useState } from 'react'
import { X, Lightbulb, Highlighter, ListOrdered, Volume2, VolumeX } from 'lucide-react'
import KidOpenAnswer from '@/components/kid/KidOpenAnswer'
import PlotGate from '@/components/kid/PlotGate'
import MathVisual from '@/components/MathVisual'
import { hidesPicture } from '@/lib/interactive'
import { isDistinctHe } from '@/lib/text'
import { Oli, OliLogo } from '@/components/oli/Oli'
import { soundOn, setSoundOn } from '@/lib/sfx'
import { MarkedText, FeedbackText, Chips, plainText, tileDir } from './markup'
import { SUBJECTS, GRADE_HE, gradeType, subjectVars, type SubjectKey } from './tokens'
import s from './question.module.css'

// One kid question screen for every subject, grade and topic, drawn from the
// question's data (designer handover EduPlay_QuestionScreens, 2026-11):
// header · question card (key concept, number chips, data marking) · optional
// visual · answers (4 tiles, a stacked list, the passage split, or the number
// pad) · footer (hint + check) that turns into the right / wrong bar with Oli.
//
// Grading stays with the lesson (status comes in from the parent): a wrong
// first try shows the "almost" bar and lets the child try again; a second wrong
// try shows the answer and the solution step by step.

export type QStatus = 'open' | 'wrong1' | 'right1' | 'right2' | 'revealed'
export type DataStep = { step_he?: string; step_en?: string; data: number[] }
export type QDesign = {
  he?: { question?: string; helper?: string; right?: string; wrong?: string }
  en?: { question?: string; helper?: string; right?: string; wrong?: string }
  data_marking?: DataStep[] | null
}

const splitSteps = (t: string) => (t || '').split(/(?<=[.!?])\s+(?=\S)|\n+/).map(x => x.trim()).filter(Boolean)

const DATA_TAG = /<<\d+:/

export function shrinkFor(len: number) {
  return len > 160 ? 0.66 : len > 110 ? 0.74 : len > 70 ? 0.84 : 1
}

/** the shared page frame + header (also used by the lesson's done screen) */
export function QuestionFrame({ subject, grade, isHE, stars, progress, onExit, children, footer }: {
  subject: SubjectKey; grade?: number; isHE: boolean; stars?: number | null
  progress?: { idx: number; total: number } | null
  onExit: () => void; children: React.ReactNode; footer?: React.ReactNode
}) {
  const c = SUBJECTS[subject]
  const [sound, setSound] = useState(true)
  useEffect(() => { setSound(soundOn()) }, [])
  const gradeLabel = grade ? (isHE ? ` · כיתה ${GRADE_HE[grade] || grade}` : ` · Grade ${grade}`) : ''
  return (
    <div className={s.page} dir={isHE ? 'rtl' : 'ltr'} style={subjectVars(subject)} lang={isHE ? 'he' : 'en'}>
      <header className={s.header}>
        <button className={s.exit} onClick={onExit} aria-label={isHE ? 'לצאת מהשיעור' : 'Leave the lesson'}><X size={26} strokeWidth={2.6} /></button>
        <span className={s.subjectChip}>{(isHE ? c.he : c.en) + gradeLabel}</span>
        {progress && progress.total > 0
          ? <div className={s.progress} role="progressbar" aria-valuemin={1} aria-valuemax={progress.total} aria-valuenow={progress.idx + 1}
              aria-label={isHE ? `שאלה ${progress.idx + 1} מתוך ${progress.total}` : `Question ${progress.idx + 1} of ${progress.total}`}>
              {Array.from({ length: progress.total }, (_, i) => (
                <span key={i} className={`${s.seg} ${i < progress.idx ? s.segDone : i === progress.idx ? s.segNow : ''}`} />
              ))}
            </div>
          : <div className={s.progress} />}
        <button className={s.sound} onClick={() => { setSoundOn(!sound); setSound(!sound) }} aria-pressed={sound}
          aria-label={sound ? (isHE ? 'להשתיק צלילים' : 'Mute sounds') : (isHE ? 'להפעיל צלילים' : 'Turn sounds on')}>
          {sound ? <Volume2 size={22} /> : <VolumeX size={22} />}
        </button>
        {stars != null && (
          <span className={s.stars} aria-label={isHE ? `${stars} כוכבים` : `${stars} stars`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#FFC940" stroke="#16213E" strokeWidth="1.5" strokeLinejoin="round" aria-hidden="true"><path d="M12 2l2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17l-6.1 3.4 1.5-6.8L2.2 9l6.9-.7z" /></svg>
            {stars}
          </span>
        )}
        <span className={s.logoWrap}><OliLogo /></span>
      </header>
      <main className={s.main}>{children}</main>
      {footer && <footer className={s.footer}>{footer}</footer>}
    </div>
  )
}

export default function QuestionScreen({
  q, idx, total, subject, grade, isHE, langMode, stars, status, tries, rightLabel, busy, passage,
  hintUsed, onHintUsed, onExit, onAnswer, onRetry, onNext, isLast,
}: {
  q: any; idx: number; total: number; subject: SubjectKey; grade?: number; isHE: boolean; langMode: string; stars?: number | null
  status: QStatus; tries: string[]; rightLabel?: string | null; busy: boolean; passage?: any
  hintUsed: boolean; onHintUsed: () => void
  onExit: () => void; onAnswer: (label: string) => void; onRetry: () => void; onNext: () => void; isLast: boolean
}) {
  const design: QDesign = (q?.design && typeof q.design === 'object') ? q.design : {}
  const isEng = subject === 'eng'
  const [picked, setPicked] = useState<string | null>(null)
  const [markStep, setMarkStep] = useState<number | null>(null)
  const [showHint, setShowHint] = useState(false)
  const [stepsShown, setStepsShown] = useState(0)
  useEffect(() => { setPicked(null); setMarkStep(null); setShowHint(false); setStepsShown(0) }, [q?.id])
  useEffect(() => { if (status === 'open' || status === 'wrong1') setPicked(null) }, [tries.length]) // eslint-disable-line react-hooks/exhaustive-deps

  const resolved = status === 'right1' || status === 'right2' || status === 'revealed'
  const [showWrongBar, setShowWrongBar] = useState(false)
  useEffect(() => { setShowWrongBar(status === 'wrong1') }, [status, tries.length])
  const canAnswer = (status === 'open' || status === 'wrong1') && !busy && !showWrongBar

  // ── text ──
  const he = design.he || {}, en = design.en || {}
  const qHe = he.question || q?.prompt_he || ''
  const qEn = en.question || q?.prompt_en || ''
  // English lessons: the Hebrew line first, as part of the question, then the English sentence
  const engBoth = isEng && langMode !== 'en_only' && !!q?.prompt_he && !!qEn && isDistinctHe(q?.prompt_he, q?.prompt_en)
  const mainText = isEng ? (qEn || qHe) : (isHE ? (qHe || qEn) : (qEn || qHe))
  const mainDir = isEng || !isHE ? 'ltr' : 'rtl'
  const helper = isHE ? he.helper : (en.helper || he.helper)
  const steps: DataStep[] = Array.isArray(design.data_marking) && DATA_TAG.test(mainText) ? design.data_marking.filter(d => Array.isArray(d?.data)) : []
  const marking = { active: markStep == null ? null : (steps[markStep]?.data || []) }

  const expl = ((isHE ? q?.explanation_he : q?.explanation_en) || q?.explanation_he || q?.explanation_en || '').trim()
  const explSteps = splitSteps(expl)
  const hint = (isHE ? q?.hint_he : q?.hint_en) || q?.hint_he || q?.hint_en || ''
  const rightLine = (isHE ? he.right : en.right || he.right) || (explSteps.length <= 2 ? expl : explSteps[explSteps.length - 1])
  const wrongLine = (isHE ? he.wrong : en.wrong || he.wrong) || hint || (isHE ? 'קראו שוב את השאלה לאט, וחשבו שלב אחרי שלב.' : 'Read the question again slowly and think step by step.')

  // ── answers ──
  const options: any[] = Array.isArray(q?.options) ? q.options : []
  const optText = (o: any) => (isEng ? (o.value_en || o.value_he || '') : isHE ? (o.value_he || o.value_en || '') : (o.value_en || o.value_he || ''))
  const longest = Math.max(0, ...options.map(o => plainText(optText(o)).length))
  const correctOpt = options.find(o => o.isCorrect)
  const layout = passage ? 'stack' : options.length === 4 && longest <= 14 ? 'grid4' : options.length === 3 && longest <= 14 ? 'grid3' : options.length === 2 && longest <= 18 ? 'grid2' : 'stack'
  const tilesClass = layout === 'grid4' ? s.tiles : layout === 'grid3' ? `${s.tiles} ${s.tiles3}` : layout === 'grid2' ? `${s.tiles} ${s.tiles2}` : s.tilesStack

  const t = gradeType(grade)
  const shrink = shrinkFor(plainText(mainText).length + (engBoth ? plainText(q?.prompt_he).length * 0.5 : 0))
  const vars = { ['--q-size' as any]: `${Math.round(t.q * shrink)}px`, ['--opt-size' as any]: `${t.opt}px`, ['--tile-h' as any]: `${t.tile}px` }

  const showVisual = q?.visual_data && !hidesPicture(q)
  const T = useMemo(() => ({ // palette for the shared answer widgets (number pad, grid, number line…)
    bg: '#FFF9EC', panel: '#FFFFFF', panel2: SUBJECTS[subject].soft, border: '#E2DACB', text: '#16213E', text2: '#4A5470',
    accent1: SUBJECTS[subject].main, accent2: '#FFC940', xp: SUBJECTS[subject].dark,
  }), [subject])

  const L = (h: string, e: string) => (isHE ? h : e)
  const openHint = () => { setShowHint(true); onHintUsed() }

  // ── footer ──
  let footer: React.ReactNode
  if (status === 'right1' || status === 'right2') {
    footer = (
      <div className={`${s.bar} ${s.barRight}`} role="status" aria-live="polite">
        <Oli state="happy" size={110} className={s.barOli} />
        <div className={s.barText}>
          <p className={s.barHead}>{L('יופי!', 'Great!')}</p>
          {rightLine && <p className={s.barLine}><FeedbackText text={rightLine} /></p>}
        </div>
        <button className={s.next} onClick={onNext}>{isLast ? L('לסיום', 'Finish') : L('הלאה', 'Next')}</button>
      </div>
    )
  } else if (status === 'revealed') {
    footer = (
      <div className={`${s.bar} ${s.barReveal}`} role="status" aria-live="polite">
        <Oli state="teach" size={110} className={s.barOli} />
        <div className={s.barText}>
          <p className={s.barHead}>{L('בואו נראה יחד', "Let's see it together")}</p>
          <p className={s.barLine}>{L('התשובה היא ', 'The answer is ')}<bdi className={s.chip}>{plainText(correctOpt ? optText(correctOpt) : q?.correct_answer || '')}</bdi></p>
          {explSteps.length > 0 && (
            <ol className={s.steps} style={{ marginTop: 10 }}>
              {explSteps.map((st, i) => <li key={i} className={s.step}><span className={s.stepNum}>{i + 1}</span><span><FeedbackText text={st} /></span></li>)}
            </ol>
          )}
          <p className={s.barLine} style={{ color: '#4A5470' }}>{L('זה בסדר, ככה לומדים.', "That's okay, that's how we learn.")}</p>
        </div>
        <button className={s.next} onClick={onNext}>{isLast ? L('לסיום', 'Finish') : L('הלאה', 'Next')}</button>
      </div>
    )
  } else if (showWrongBar) {
    footer = (
      <div className={`${s.bar} ${s.barWrong}`} role="status" aria-live="polite">
        <Oli state="sad" size={110} className={s.barOli} />
        <div className={s.barText}>
          <p className={s.barHead}>{L('כמעט!', 'Almost!')}</p>
          <p className={s.barLine}><FeedbackText text={wrongLine} /></p>
        </div>
        <button className={s.retry} onClick={() => { setShowWrongBar(false); onRetry() }}>{L('לנסות שוב', 'Try again')}</button>
      </div>
    )
  } else {
    footer = (
      <div className={s.idle}>
        <button className={s.hintBtn} onClick={openHint} aria-expanded={showHint}><Lightbulb size={24} /> {L('רמז', 'Hint')}</button>
        {options.length > 0 && (
          <button className={s.check} disabled={!picked || busy} onClick={() => picked && onAnswer(picked)}>{L('לבדוק', 'Check')}</button>
        )}
      </div>
    )
  }

  // ── question card ──
  const questionCard = (
    <section className={`${s.qCard} ${s.enter}`} key={q?.id}>
      <div className={s.qBody}>
        {isHE && (grade ?? 3) <= 1 && <p className={s.readTogether}>{L('מקריאים יחד עם הורה', 'Read it together with a parent')}</p>}
        {engBoth && <p className={s.qTextHe} dir="rtl"><MarkedText text={he.question || q.prompt_he} /></p>}
        <p className={s.qText} dir={mainDir} style={{ textAlign: mainDir === 'rtl' ? 'right' : 'left' }}>
          <MarkedText text={mainText} marking={marking} />
        </p>
        {helper && <p className={s.helper} dir="rtl"><MarkedText text={helper} /></p>}
        {steps.length === 1 && (
          <div className={s.markRow}>
            <button className={`${s.markBtn} ${s.markBtnSingle}`} aria-pressed={markStep === 0} onClick={() => setMarkStep(markStep === 0 ? null : 0)}>
              <Highlighter size={20} /> {L('לסמן את הנתונים', 'Mark the data')}
            </button>
          </div>
        )}
        {steps.length > 1 && (
          <div className={s.markRow}>
            <span className={s.markLabel}><Highlighter size={18} /> {L('לסמן נתונים לפי שלב:', 'Mark the data by step:')}</span>
            {steps.map((st, i) => (
              <button key={i} className={s.markBtn} aria-pressed={markStep === i} onClick={() => setMarkStep(markStep === i ? null : i)}>
                <span className={s.stepNum}>{i + 1}</span> {(isHE ? st.step_he : st.step_en || st.step_he) || L(`שלב ${i + 1}`, `Step ${i + 1}`)}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  )

  const hintCard = showHint && !resolved && (
    <section className={s.hintCard} aria-live="polite">
      <div className={s.hintHead}><Lightbulb size={24} /> {L('רמז', 'Hint')}</div>
      <p className={s.hintText}><FeedbackText text={hint || L('קראו שוב את השאלה לאט, ובדקו כל תשובה אחת-אחת.', 'Read the question again slowly and check each answer.')} /></p>
      {explSteps.length > 1 && (
        <>
          {stepsShown > 0 && (
            <ol className={s.steps}>
              {explSteps.slice(0, -1).slice(0, stepsShown).map((st, i) => (
                <li key={i} className={s.step}><span className={s.stepNum}>{i + 1}</span><span><FeedbackText text={st} /></span></li>
              ))}
            </ol>
          )}
          {stepsShown < explSteps.length - 1
            ? <button className={s.smallBtn} onClick={() => { setStepsShown(n => n + 1); onHintUsed() }}><ListOrdered size={20} /> {stepsShown === 0 ? L('צעד אחר צעד', 'Step by step') : L('הצעד הבא', 'Next step')}</button>
            : <p className={s.hintText} style={{ color: '#4A5470' }}>{L('הצעד האחרון שלכם! עכשיו בחרו תשובה.', 'The last step is yours. Now pick an answer.')}</p>}
        </>
      )}
    </section>
  )

  const tiles = options.length > 0 && (
    <div className={tilesClass} dir={isEng ? 'ltr' : undefined} role="group" aria-label={L('תשובות', 'Answers')}>
      {options.map(o => {
        const tried = tries.includes(o.label)
        const right = resolved && o.isCorrect
        const wrongNow = showWrongBar && tries[tries.length - 1] === o.label
        const sel = picked === o.label && !resolved && !showWrongBar
        const cls = [s.tile, plainText(optText(o)).length > 14 ? s.tileLong : '', right ? s.tileRight : wrongNow ? s.tileWrong : sel ? s.tileSel : tried && !resolved ? s.tileTried : ''].join(' ')
        return (
          <button key={o.label} className={cls} aria-pressed={sel} disabled={!canAnswer || tried}
            onClick={() => setPicked(o.label)} dir={tileDir(plainText(optText(o)))}>
            {plainText(optText(o))}
          </button>
        )
      })}
    </div>
  )

  const answers = (
    <PlotGate q={q} T={T} isHE={isHE} fresh={status === 'open'}>
      {tiles}
      {options.length === 0 && q && (
        <div className={s.openCard}>
          <KidOpenAnswer q={q} T={T} isHE={isHE} canAnswer={canAnswer} submitting={busy} tries={tries} resolved={resolved}
            rightAnswer={rightLabel ?? null} onSubmit={onAnswer} />
        </div>
      )}
    </PlotGate>
  )

  return (
    <QuestionFrame subject={subject} grade={grade} isHE={isHE} stars={stars} progress={{ idx, total }} onExit={onExit} footer={footer}>
      <div style={vars as React.CSSProperties} className={s.enter} key={q?.id}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {questionCard}
          {hintCard}
          {passage ? (
            <div className={s.split}>
              <div className={s.passageCol}><Passage passage={passage} isHE={isHE} isEng={isEng} /></div>
              <div className={s.answersCol}>{answers}</div>
            </div>
          ) : (
            <>
              {showVisual && (
                <div className={s.visualWrap}>
                  <div className={s.visual} role="img" aria-label={L('ציור לשאלה', 'Picture for the question')}>
                    <MathVisual data={q.visual_data} size={240} color={SUBJECTS[subject].main} dark={false} />
                  </div>
                </div>
              )}
              {answers}
            </>
          )}
        </div>
      </div>
    </QuestionFrame>
  )
}

function Passage({ passage, isHE, isEng }: { passage: any; isHE: boolean; isEng: boolean }) {
  const useEn = isEng || !isHE
  const title = useEn ? passage?.title_en || passage?.title_he : passage?.title_he || passage?.title_en
  const body = String((useEn ? passage?.content_en || passage?.content_he : passage?.content_he || passage?.content_en) || '')
  const paras = body.split(/\n+/).map(p => p.trim()).filter(Boolean)
  return (
    <article className={s.passage} dir={useEn ? 'ltr' : 'rtl'}>
      <div className={s.tape} aria-hidden="true" />
      {title && <p className={s.passageTitle}>{title}</p>}
      {paras.map((p, i) => <p key={i} className={s.passageP}><Chips text={p} inPassage /></p>)}
    </article>
  )
}
