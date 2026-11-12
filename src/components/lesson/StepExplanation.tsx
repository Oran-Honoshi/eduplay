'use client'
import InlineMath from '@/components/InlineMath'
import s from './lesson.module.css'
import { Oli } from '@/components/oli/Oli'

// The explanation of the current step, next to Oli: teaching while working
// (usage map: worked example → teach), proud on the last step (and the panel
// turns success-green).
export default function StepExplanation({ n, title, text, done, he }: { n: number; title?: string; text: string; done: boolean; he: boolean }) {
  const heading = he ? `שלב ${n}${title ? `: ${title}` : ''}` : `Step ${n}${title ? `: ${title}` : ''}`
  return (
    <div className={`${s.explain} ${done ? s.done : ''}`} aria-live="polite">
      {done
        ? <Oli state="proud" size={96} decorative className={s.explainOwlParty} />
        : <Oli state="teach" size={86} decorative className={s.explainOwl} />}
      <div>
        <h4 className={s.explainTitle}>{heading}</h4>
        <p className={s.explainText}><InlineMath text={text} /></p>
      </div>
    </div>
  )
}
