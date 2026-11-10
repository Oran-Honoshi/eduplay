'use client'
import { useEffect, useState } from 'react'
import { FileText, Plus, Notebook } from 'lucide-react'
import ParentPage, { card, chip, pillBtn, GRADE_HE } from '@/components/parent/ParentPage'
import { PARENT_COLORS as C, PARENT_FONTS as F, SUBJECT_COLORS } from '@/lib/parentTheme'

// "Explanation notebook" (Library): every explanation page the family made in
// Create, by subject, so a parent can go back to a topic with the child.
const SUBJ_HE: Record<string, string> = { math: 'חשבון', hebrew: 'עברית', english: 'אנגלית' }

export default function NotebookPage() {
  const [items, setItems] = useState<any[] | null>(null)
  const [subject, setSubject] = useState<string>('all')

  useEffect(() => {
    fetch('/api/materials').then(r => (r.ok ? r.json() : { materials: [] }))
      .then(d => setItems((d.materials || []).filter((m: any) => m.kind === 'explanation' && m.status === 'ready')))
      .catch(() => setItems([]))
  }, [])

  const subjects = [...new Set((items || []).map(m => m.subject_slug).filter(Boolean))]
  const shown = (items || []).filter(m => subject === 'all' || m.subject_slug === subject)

  return (
    <ParentPage section="library" title="מחברת ההסברים"
      subtitle="דפי ההסבר שהכנתם, לפי מקצוע. אפשר לפתוח, להדפיס, לשלוח לילד או להכין עוד אחד."
      actions={<a href="/create?kind=explanation" style={pillBtn(true)}><Plus size={16} /> דף הסבר חדש</a>}>
      {subjects.length > 1 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          <button onClick={() => setSubject('all')} style={chip(subject === 'all')}>הכול</button>
          {subjects.map(s => <button key={s} onClick={() => setSubject(s)} style={chip(subject === s, SUBJECT_COLORS[s]?.fg, SUBJECT_COLORS[s]?.bg)}>{SUBJ_HE[s] || s}</button>)}
        </div>
      )}
      {items === null ? <div style={{ color: C.textMuted }}>טוען…</div> : shown.length === 0 ? (
        <div style={{ ...card, padding: 36, textAlign: 'center' }}>
          <Notebook size={32} color={C.primary} />
          <div style={{ fontFamily: F.heading, fontWeight: 800, fontSize: 19, marginTop: 10 }}>המחברת עוד ריקה</div>
          <p style={{ color: C.textSecondary, margin: '6px auto 16px', maxWidth: 440, lineHeight: 1.6 }}>דף הסבר הוא דף לימוד לנושא אחד: הסבר קצר, דוגמאות פתורות שלב אחר שלב, טעויות נפוצות ותרגול קטן. כל דף שתכינו יישמר כאן.</p>
          <a href="/create?kind=explanation" style={pillBtn(true)}><Plus size={16} /> להכין דף הסבר ראשון</a>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 12 }}>
          {shown.map(m => {
            const sc = SUBJECT_COLORS[m.subject_slug] || SUBJECT_COLORS.math
            return (
              <a key={m.id} href={`/create?open=${m.id}`} style={{ ...card, padding: 16, textDecoration: 'none', color: C.text, display: 'flex', gap: 12 }}>
                <span style={{ width: 44, height: 44, flexShrink: 0, borderRadius: 12, background: sc.bg, color: sc.fg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FileText size={22} /></span>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontWeight: 800, fontSize: 16, lineHeight: 1.35 }}>{m.title || 'דף הסבר'}</span>
                  <span style={{ display: 'block', fontSize: 13, color: C.textMuted, marginTop: 4 }}>{SUBJ_HE[m.subject_slug] || ''}{m.grade != null ? ` · ${GRADE_HE[m.grade] || ''}` : ''} · {new Date(m.created_at).toLocaleDateString('he-IL')}</span>
                </span>
              </a>
            )
          })}
        </div>
      )}
    </ParentPage>
  )
}
