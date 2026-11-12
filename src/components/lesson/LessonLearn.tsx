'use client'
import InlineMath from '@/components/InlineMath'
import StickyNote, { keyPointParts, type KeyPoint } from './StickyNote'
import WorkedExampleCard from './WorkedExampleCard'
import PracticeCTA from './PracticeCTA'
import s from './lesson.module.css'
import './kidFonts.css'

const SUBJECT: Record<string, { he: string; en: string; cls: string }> = {
  math: { he: 'חשבון', en: 'Math', cls: s.chipMath },
  hebrew: { he: 'עברית', en: 'Hebrew', cls: s.chipHebrew },
  english: { he: 'אנגלית', en: 'English', cls: s.chipEnglish },
}

// The child lesson's opening screen (before practice), in the notebook
// design: header, hero with Oli, key points as sticky notes, the worked
// example, and the practice button. Everything comes from the lesson data.
export default function LessonLearn({ title, subject, explanation, topicDescription, he, stars, questionCount, onClose, onStart }: {
  title: string; subject: string; explanation: any; topicDescription?: string; he: boolean
  stars: number | null; questionCount: number; onClose: () => void; onStart: () => void
}) {
  const ex = explanation
  const summary: string = ex ? (he ? ex.summary_he || ex.summary_en : ex.summary_en || ex.summary_he) || '' : topicDescription || ''
  // sticky-note key points (title + text + optional visual) when the lesson has them,
  // else the plain key-point sentences
  const rich: KeyPoint[] = Array.isArray(ex?.key_points_rich) ? ex.key_points_rich : []
  const useRich = rich.length > 0 && (he || rich.some((r: any) => r?.text_en))
  const points: KeyPoint[] = useRich ? rich : ex ? ((he ? ex.key_points_he : ex.key_points_en) || ex.key_points_he || []) : []
  const example = ex?.examples?.[0]
  const subj = SUBJECT[subject] || SUBJECT.math

  // the highlighter goes under the last word of the title
  const words = (title || '').trim().split(/\s+/)
  const lastWord = words.pop() || ''
  const head = words.join(' ')

  return (
    <div className={s.page} dir={he ? 'rtl' : 'ltr'} lang={he ? 'he' : 'en'}>
      <header className={s.header}>
        <button type="button" className={s.iconBtn} onClick={onClose} aria-label={he ? 'סגירת השיעור' : 'Close the lesson'}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
        <span className={`${s.chip} ${subj.cls}`}>{he ? `${subj.he} · שיעור` : `${subj.en} · Lesson`}</span>
        <span style={{ flex: 1 }} />
        {stars !== null && (
          <span className={s.stars} aria-label={he ? `${stars} כוכבים` : `${stars} stars`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#FFC940" stroke="#16213E" strokeWidth="1.5" strokeLinejoin="round" aria-hidden="true"><path d="M12 2l2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17l-6.1 3.4 1.5-6.8L2.2 9l6.9-.7z" /></svg>
            <span className={s.ltr}>{stars}</span>
          </span>
        )}
        <span className={s.logo} aria-label="EduPlay">
          <span className={s.logoPeek}><svg width="40" height="40" viewBox="0 0 60 60" aria-hidden="true"><path d="M12 14 L18 4 L24 13 Z M48 14 L42 4 L36 13 Z" fill="#2347C9" /><rect x="8" y="10" width="44" height="44" rx="20" fill="#2F5BE3" /><circle cx="22" cy="28" r="10" fill="#FFFFFF" /><circle cx="38" cy="28" r="10" fill="#FFFFFF" /><circle cx="23" cy="29" r="4.5" fill="#16213E" /><circle cx="37" cy="29" r="4.5" fill="#16213E" /><path d="M27 37 L33 37 L30 43 Z" fill="#FFC940" /></svg></span>
          <span className={s.logoWord}>Edu<span className={s.logoPlay}>Play</span></span>
        </span>
      </header>

      <main className={s.main}>
        <section className={s.hero}>
          <img src="/oli/owl-reading.svg" alt={he ? 'אוֹלִי קורא ספר' : 'Oli reading a book'} className={s.heroOwl} />
          <div className={s.heroText}>
            <h1 className={s.title}>{head && <>{head} </>}<span className={s.marker}>{lastWord}</span></h1>
            {summary && <p className={s.bubble}><InlineMath text={summary} /></p>}
          </div>
        </section>

        {(points.length > 0 || example) && (
          <div className={s.layout}>
            {points.length > 0 && (
              <aside className={s.keyPoints} aria-labelledby="kp-title">
                <h2 className={s.sectionTitle} id="kp-title">{he ? 'חשוב לזכור' : 'Remember'}</h2>
                {points.map((p, i) => { const k = keyPointParts(p, he); return <StickyNote key={i} index={i} title={k.title} body={k.body} visual={k.visual} /> })}
              </aside>
            )}
            {example && <WorkedExampleCard example={example} he={he} />}
          </div>
        )}

        <PracticeCTA count={questionCount} he={he} onStart={onStart} />
      </main>
    </div>
  )
}
