'use client'
import { useState } from 'react'
import QuestionScreen, { type QStatus } from '@/components/question/QuestionScreen'
import { subjectKey, SUBJECTS, GRADE_HE } from '@/components/question/tokens'
import { win, tryAgain } from '@/lib/sfx'

// Plays any question in the real question screen, graded on the device only.
export default function DesignSandbox({ fixtures, real, groups }: { fixtures: any[]; real: any[]; groups?: { title: string; qs: any[] }[] }) {
  const all = groups ? groups.flatMap(g => g.qs) : [...fixtures, ...real]
  const [open, setOpen] = useState<number | null>(null)
  const [status, setStatus] = useState<QStatus>('open')
  const [tries, setTries] = useState<string[]>([])
  const [right, setRight] = useState<string | null>(null)
  const [lang, setLang] = useState<'bilingual' | 'en_only'>('bilingual')

  const go = (i: number | null) => { setOpen(i); setStatus('open'); setTries([]); setRight(null); window.scrollTo({ top: 0 }) }

  if (open != null) {
    const q = all[open]
    const ok = (label: string) => {
      const o = (q.options || []).find((x: any) => x.label === label)
      if (o) return !!o.isCorrect
      return String(label).trim().replace(/\s/g, '') === String(q.correct_answer || '').trim().replace(/\s/g, '')
    }
    return (
      <QuestionScreen q={q} idx={open % 10} total={10} subject={subjectKey(q.subject_slug, q.topic_slug)} grade={q.grade}
        isHE={lang !== 'en_only'} langMode={lang} stars={12} status={status} tries={tries} rightLabel={right} busy={false}
        passage={q.passage || null} hintUsed={false} onHintUsed={() => {}} onExit={() => go(null)}
        onAnswer={label => {
          if (ok(label)) { setRight(label); setStatus(status === 'open' ? 'right1' : 'right2'); win() }
          else { setTries(t => [...t, label]); setStatus(status === 'open' ? 'wrong1' : 'revealed'); tryAgain() }
        }}
        onRetry={() => {}} onNext={() => go(open + 1 < all.length ? open + 1 : null)} isLast={open + 1 >= all.length} />
    )
  }

  const card = (q: any, i: number) => {
    const k = subjectKey(q.subject_slug, q.topic_slug)
    const c = SUBJECTS[k]
    return (
      <button key={q.id} onClick={() => go(i)} style={{ textAlign: 'start', background: '#fff', border: '1px solid #E2DACB', borderRadius: 20, padding: '14px 16px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 6, fontFamily: 'Rubik, sans-serif' }}>
        <span style={{ alignSelf: 'flex-start', background: c.main, color: c.on, borderRadius: 10, padding: '2px 10px', fontWeight: 800, fontSize: 14 }}>{c.he} · כיתה {GRADE_HE[q.grade] || q.grade}</span>
        <span style={{ fontWeight: 700, fontSize: 16, color: '#16213E', lineHeight: 1.4 }}>{String(q.design?.he?.question || q.prompt_he || q.prompt_en || '').replace(/\[\[|\]\]/g, '').replace(/<<\d+:([^>]+)>>/g, '$1').slice(0, 90)}</span>
        <span style={{ fontSize: 13, color: '#4A5470' }}>{q.ref}{q.passage ? ' · עם סיפור' : ''}{Array.isArray(q.options) && q.options.length ? '' : ' · תשובה פתוחה'}{q.visual_data ? ' · עם ציור' : ''}</span>
        {q.wanted && <span dir="ltr" style={{ fontSize: 13, color: '#1F5FAD', background: '#EAF2FC', borderRadius: 10, padding: '6px 10px', textAlign: 'left' }}>{q.short} · wanted: {q.wanted}</span>}
      </button>
    )
  }

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: '#FFF9EC', padding: '28px 20px 60px', fontFamily: 'Rubik, sans-serif', color: '#16213E' }}>
      <div style={{ maxWidth: 1160, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {groups ? <>
          <h1 style={{ margin: 0, fontWeight: 900, fontSize: 36 }}>שאלות שצריכות ציור או עזר · בריף לעיצוב</h1>
          <p style={{ margin: 0, color: '#4A5470', fontSize: 18 }}>כל שאלה מהבריף, כפי שהיא נראית היום. לחיצה פותחת אותה במסך האמיתי. שום דבר לא נשמר.</p>
          {(() => { let n = 0; return groups.map(g => { const start = n; n += g.qs.length; return (
            <section key={g.title} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <h2 dir="ltr" style={{ margin: '14px 0 0', fontSize: 24, textAlign: 'left' }}>{g.title}</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>{g.qs.map((q, i) => card(q, start + i))}</div>
            </section>) }) })()}
        </> : <>
        <h1 style={{ margin: 0, fontWeight: 900, fontSize: 36 }}>מסכי שאלות · בדיקת עיצוב</h1>
        <p style={{ margin: 0, color: '#4A5470', fontSize: 18 }}>כל שאלה נפתחת במסך האמיתי. שום דבר לא נשמר. </p>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 16 }}>
          <input type="checkbox" checked={lang === 'en_only'} onChange={e => setLang(e.target.checked ? 'en_only' : 'bilingual')} /> ילד שלומד באנגלית בלבד
        </label>
        <h2 style={{ margin: '10px 0 0', fontSize: 24 }}>24 שאלות הדוגמה של המעצבת</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>{fixtures.map((q, i) => card(q, i))}</div>
        <h2 style={{ margin: '18px 0 0', fontSize: 24 }}>שאלות אמיתיות מהמאגר (מתחלפות בכל טעינה)</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>{real.map((q, i) => card(q, fixtures.length + i))}</div>
        </>}
      </div>
    </div>
  )
}
