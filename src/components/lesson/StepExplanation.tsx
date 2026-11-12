'use client'
import InlineMath from '@/components/InlineMath'
import s from './lesson.module.css'

// The explanation of the current step, next to Oli: thinking while working,
// celebrating on the last step (and the panel turns success-green).
export default function StepExplanation({ n, title, text, done, he }: { n: number; title?: string; text: string; done: boolean; he: boolean }) {
  const heading = he ? `שלב ${n}${title ? `: ${title}` : ''}` : `Step ${n}${title ? `: ${title}` : ''}`
  return (
    <div className={`${s.explain} ${done ? s.done : ''}`} aria-live="polite">
      {done
        ? <img src="/oli/owl-celebrating.svg" alt="" className={s.explainOwlParty} />
        : <img src="/oli/owl-thinking.svg" alt="" className={s.explainOwl} />}
      <div>
        <h4 className={s.explainTitle}>{heading}</h4>
        <p className={s.explainText}><InlineMath text={text} /></p>
      </div>
    </div>
  )
}
