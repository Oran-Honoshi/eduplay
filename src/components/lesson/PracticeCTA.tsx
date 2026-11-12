'use client'
import s from './lesson.module.css'

// The primary action of the lesson: start the practice set (fixed to the
// bottom of the screen on phones).
export default function PracticeCTA({ count, he, onStart }: { count: number; he: boolean; onStart: () => void }) {
  if (!count) return <div className={s.ctaEmpty}>{he ? 'השאלות לנושא הזה עוד בהכנה. בינתיים אפשר לבחור נושא אחר.' : 'Questions for this topic are on the way.'}</div>
  return (
    <button type="button" className={s.cta} onClick={onStart}>
      {he ? `מתחילים לתרגל · ${count} שאלות` : `Let's practice · ${count} questions`}
    </button>
  )
}
