'use client'
import { useEffect, useState } from 'react'
import { Play, Printer, Inbox, Loader2 } from 'lucide-react'
import ParentPage, { card, chip, pillBtn, GRADE_HE } from '@/components/parent/ParentPage'
import { PARENT_COLORS as C, PARENT_FONTS as F, SUBJECT_COLORS } from '@/lib/parentTheme'
import { useFamilyChildren, EMPTY_CHILD, type FamilyChild } from '@/lib/useFamilyChildren'

// Curriculum map (Library): every K–6 topic by grade and subject. From a topic
// the parent can open the lesson as the child sees it, or make a practice
// sheet from the ready bank (it opens in Create to print or send).
const SUBJECTS = [
  { slug: 'math', he: 'חשבון' },
  { slug: 'hebrew', he: 'עברית' },
  { slug: 'english', he: 'אנגלית' },
]

export default function CurriculumPage() {
  const { children } = useFamilyChildren()
  const [child, setChild] = useState<FamilyChild>(EMPTY_CHILD)
  const [grade, setGrade] = useState(1)
  const [subject, setSubject] = useState('math')
  const [topics, setTopics] = useState<any[] | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => {
    if (!child.id && children.length) { setChild(children[0]); setGrade(Math.min(6, children[0].grade)) }
  }, [children, child.id])

  useEffect(() => {
    setTopics(null)
    fetch(`/api/topics?grade=${grade}&subject=${subject}`).then(r => r.json()).then(d => setTopics(d.topics || [])).catch(() => setTopics([]))
  }, [grade, subject])

  const col = SUBJECT_COLORS[subject] || SUBJECT_COLORS.math
  const lessonHref = (t: any) => `/lesson?childId=${child.id}&topicId=${t.id}&theme=${child.theme}&from=curriculum`

  async function makeSheet(t: any) {
    setBusy(t.id)
    try {
      const r = await fetch('/api/quickstart/use', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ source: 'bank', id: t.id, child_id: child.id || null, ready: false }) })
      const d = await r.json()
      if (d.material?.id) window.location.href = `/create?open=${d.material.id}`
    } finally { setBusy(null) }
  }

  return (
    <ParentPage section="library" title="תוכנית הלימודים" subtitle="כל הנושאים מגן ועד כיתה ו׳. אפשר לפתוח שיעור כמו שהילד רואה אותו, או להכין דף תרגול מהמאגר.">
      <div style={{ ...card, padding: 16, display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 18 }}>
        {children.length > 0 && (
          <Row label="בשביל">
            {children.map(c => (
              <button key={c.id} onClick={() => { setChild(c); setGrade(Math.min(6, c.grade)) }} style={chip(child.id === c.id)}>
                <span style={{ width: 22, height: 22, borderRadius: 99, background: c.accent, color: '#fff', fontSize: 12, fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{c.name[0]}</span>
                {c.name}
              </button>
            ))}
          </Row>
        )}
        <Row label="מקצוע">
          {SUBJECTS.map(s => {
            const sc = SUBJECT_COLORS[s.slug]
            return <button key={s.slug} onClick={() => setSubject(s.slug)} style={chip(subject === s.slug, sc.fg, sc.bg)}>{s.he}</button>
          })}
        </Row>
        <Row label="כיתה">
          {[0, 1, 2, 3, 4, 5, 6].map(g => <button key={g} onClick={() => setGrade(g)} style={chip(grade === g)}>{GRADE_HE[g]}</button>)}
        </Row>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <span style={{ width: 10, height: 10, borderRadius: 99, background: col.solid }} />
        <h2 style={{ fontFamily: F.heading, fontSize: 20, margin: 0 }}>{SUBJECTS.find(s => s.slug === subject)?.he} · {GRADE_HE[grade]}</h2>
        {topics && <span style={{ color: C.textMuted, fontSize: 14 }}>{topics.length} נושאים</span>}
      </div>

      {!topics ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 12 }}>
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} style={{ ...card, height: 132, opacity: 0.5 }} />)}
        </div>
      ) : topics.length === 0 ? (
        <div style={{ ...card, padding: 40, textAlign: 'center' }}>
          <Inbox size={32} color={C.primary} />
          <div style={{ fontFamily: F.heading, fontWeight: 800, fontSize: 19, marginTop: 10 }}>אין עדיין נושאים לכיתה הזו</div>
          <div style={{ color: C.textMuted, marginTop: 4 }}>אפשר ליצור תרגול לכל נושא דרך "יצירה".</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 12 }}>
          {topics.map((t, i) => (
            <div key={t.id} style={{ ...card, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ width: 36, height: 36, flexShrink: 0, borderRadius: 10, background: col.bg, color: col.fg, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 16, lineHeight: 1.35 }}>{t.title_he || t.title_en}</div>
                  {(t.description_he) && <div style={{ fontSize: 13, color: C.textSecondary, lineHeight: 1.5, marginTop: 3 }}>{t.description_he}</div>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 'auto', flexWrap: 'wrap' }}>
                <a href={child.id ? lessonHref(t) : '#'} style={{ ...pillBtn(true), minHeight: 40, fontSize: 14, opacity: child.id ? 1 : 0.5 }}><Play size={14} /> לשיעור</a>
                <button onClick={() => makeSheet(t)} disabled={busy === t.id} style={{ ...pillBtn(), minHeight: 40, fontSize: 14 }}>
                  {busy === t.id ? <Loader2 size={14} className="animate-spin" /> : <Printer size={14} />} דף תרגול
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </ParentPage>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <span style={{ width: 56, flexShrink: 0, fontSize: 13, fontWeight: 800, color: C.textMuted }}>{label}</span>
      {children}
    </div>
  )
}
