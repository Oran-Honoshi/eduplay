'use client'
import WorkedExampleCard from '@/components/lesson/WorkedExampleCard'
import s from '@/components/lesson/lesson.module.css'
import '@/components/lesson/kidFonts.css'

const EXAMPLES = [
  { problem_he: 'מה זה 6 עשרות + 3 יחידות?', answer_he: '63', solution_steps_he: ['6 עשרות זה 60', 'עוד 3 יחידות זה 3', '60 ועוד 3 שווה 63'] },
  { problem_he: 'מהו ערכה של הספרה 7 ב-275?', answer_he: '70', solution_steps_he: ['במספר 275 יש 2 מאות, 7 עשרות ו-5 יחידות', 'הספרה 7 נמצאת במקום העשרות', 'לכן ערכה הוא 70'] },
  { problem_he: 'פרק את 807 לערכי מקום', answer_he: '800 + 7', solution_steps_he: ['8 מאות = 800', '0 עשרות = 0', '807 = 800 + 7'] },
  { problem_he: 'כמה זה 4.3 + 2.65?', answer_he: '6.95', solution_steps_he: [] },
]

export default function Examples() {
  return (
    <div className={s.page} dir="rtl">
      <main className={s.main} style={{ paddingTop: 30 }}>
        {EXAMPLES.map((e, i) => <WorkedExampleCard key={i} example={e} he />)}
      </main>
    </div>
  )
}
