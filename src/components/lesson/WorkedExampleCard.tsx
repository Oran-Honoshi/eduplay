'use client'
import { useMemo, useState } from 'react'
import InlineMath from '@/components/InlineMath'
import MathVisual from '@/components/MathVisual'
import ColumnBoard from './ColumnBoard'
import StepDots from './StepDots'
import StepExplanation from './StepExplanation'
import { deriveColumnProblem } from './columnMath'
import s from './lesson.module.css'

// "דוגמה פתורה": the question, step dots, then either the interactive column
// board (column addition/subtraction) or — for every other kind of lesson —
// the example's own steps, one at a time, in the same explanation panel.
export default function WorkedExampleCard({ example, he }: { example: any; he: boolean }) {
  const problem: string = (he ? example.problem_he || example.problem_en : example.problem_en || example.problem_he) || ''
  const answer: string = (he ? example.answer_he || example.answer_en : example.answer_en || example.answer_he) || ''
  const rawSteps: string[] = ((he ? example.solution_steps_he : example.solution_steps_en) || example.solution_steps_he || []).filter(Boolean)
  const board = useMemo(() => (he ? deriveColumnProblem(problem, answer) : null), [he, problem, answer])

  // fallback steps: the example's own, with the answer merged into the last one
  const listSteps = useMemo(() => {
    const st = rawSteps.length ? [...rawSteps] : []
    const ansNum = (answer.match(/\d+(?:\.\d+)?/) || [])[0]
    if (answer && !(st.length && (st[st.length - 1].includes(answer) || (ansNum && st[st.length - 1].includes(ansNum))))) {
      st.push(he ? `התשובה: ${answer}` : `Answer: ${answer}`)
    }
    return st.map(t => ({ title: '', text: t }))
  }, [rawSteps.join('\n'), answer, he])

  const steps = board ? board.steps : listSteps
  const total = steps.length
  const [step, setStep] = useState(1)
  if (!total) return null
  const done = step === total
  const cur = steps[step - 1]

  // the question: math inside it is isolated left-to-right
  return (
    <section className={s.example} aria-labelledby="ex-q">
      <div className={s.exampleHead}>
        <div>
          <p className={s.eyebrow}>{he ? 'דוגמה פתורה' : 'Worked example'}</p>
          <p className={s.question} id="ex-q"><InlineMath text={problem} /></p>
        </div>
        <StepDots total={total} step={step} />
      </div>

      {board
        ? <ColumnBoard p={board} step={step} />
        : example.visual?.type ? <div className={s.visualBox}><MathVisual data={example.visual} size={220} color="#2F5BE3" /></div> : null}

      <StepExplanation n={step} title={cur.title} text={cur.text} done={done} he={he} />

      <div className={s.nav}>
        <button type="button" className={`${s.btn} ${s.btnSecondary}`} disabled={step === 1} onClick={() => setStep(x => Math.max(1, x - 1))}>{he ? 'הקודם' : 'Back'}</button>
        <button type="button" className={`${s.btn} ${done ? s.btnSecondary : s.btnDark}`} onClick={() => setStep(x => (x >= total ? 1 : x + 1))}>
          {done ? (he ? 'לראות שוב מההתחלה' : 'Watch again') : (he ? 'השלב הבא' : 'Next step')}
        </button>
      </div>
    </section>
  )
}
