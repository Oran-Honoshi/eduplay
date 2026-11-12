'use client'
import s from './lesson.module.css'

// Progress through the worked example: done steps green, the current step a
// wide blue pill, future steps grey. Decorative (the step title says "שלב N").
export default function StepDots({ total, step }: { total: number; step: number }) {
  return (
    <div className={s.dots} aria-hidden="true">
      {Array.from({ length: total }, (_, i) => <span key={i} className={i + 1 < step ? s.done : i + 1 === step ? s.now : ''} />)}
    </div>
  )
}
