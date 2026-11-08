'use client'

// ─── Parent home (2026-11 redesign) ────────────────────────────
// Built around "what needs you today": a greeting with one main action,
// things waiting for the parent's review, each child's status, quick create
// tiles and recent creations. Hebrew, right to left; names and titles a
// user typed are isolated (<bdi>) so English or numbers never flip the line.

import { useEffect, useState } from 'react'
import { Plus, BookOpen, ClipboardCheck, ChevronLeft, Flame } from 'lucide-react'
import { Pip } from '@/components/Pip'
import { PARENT_COLORS as C, SUBJECT_COLORS, CHILD_AVATAR_COLORS } from '@/lib/parentTheme'

const gradeHe = (g: number) => (g === 0 ? 'גן' : `כיתה ${['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י', 'י״א', 'י״ב'][g - 1]}${g <= 10 ? '׳' : ''}`)
const SUBJECT_HE: Record<string, string> = { math: 'חשבון', hebrew: 'עברית', english: 'אנגלית' }
const KIND_HE: Record<string, string> = { practice: 'תרגול', exam: 'מבחן', explanation: 'דפי הסבר' }

const card: React.CSSProperties = { background: C.card, border: `1px solid ${C.border}`, borderRadius: 24 }
const h2: React.CSSProperties = { margin: 0, fontSize: 22, fontWeight: 700, color: C.text }
const btnPrimary: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 52, padding: '0 24px', borderRadius: 14, background: C.primary, color: '#fff', fontWeight: 700, fontSize: 17, textDecoration: 'none' }
const btnSoft: React.CSSProperties = { flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: 44, padding: '0 14px', borderRadius: 12, background: C.primaryLight, color: C.primaryHover, fontWeight: 700, fontSize: 15, textDecoration: 'none', border: 0, cursor: 'pointer', fontFamily: 'inherit' }
const btnLine: React.CSSProperties = { ...btnSoft, background: '#fff', color: C.text, border: `1.5px solid ${C.borderStrong}` }

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'בוקר טוב' : h < 17 ? 'צהריים טובים' : h < 21 ? 'ערב טוב' : 'לילה טוב'
}

export default function HomeScreen({ children, progress, parentName, onProgress }: { children: any[]; progress: any[]; parentName: string; onProgress: () => void }) {
  const [materials, setMaterials] = useState<any[] | null>(null)
  const [booklets, setBooklets] = useState<{ drafts: number; admin: boolean }>({ drafts: 0, admin: false })
  useEffect(() => {
    fetch('/api/materials').then(r => r.json()).then(d => setMaterials(d.materials || [])).catch(() => setMaterials([]))
    fetch('/api/reading/booklets').then(r => r.json()).then(d => setBooklets({ admin: !!d.admin, drafts: (d.booklets || []).filter((b: any) => b.status === 'draft').length })).catch(() => {})
  }, [])

  const kids = children || []
  const waiting = (materials || []).filter(m => m.status === 'draft' && (m.question_ids || []).length > 0).slice(0, 4)
  const recent = (materials || []).filter(m => m.status === 'ready').slice(0, 5)
  const nameOf = (id: string) => kids.find(k => k.id === id)?.display_name
  const toReview = waiting.length + (booklets.admin && booklets.drafts ? 1 : 0)
  const first = (parentName || '').split(' ')[0]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* greeting */}
      <section style={{ ...card, borderRadius: 28, padding: '22px 26px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 20 }}>
        <Pip pose="wave" size={92} he />
        <div style={{ flex: '1 1 300px' }}>
          <h1 style={{ margin: 0, fontSize: 30, fontWeight: 800, color: C.text }}>{greeting()}{first ? <>, <bdi>{first}</bdi></> : ''}</h1>
          <p style={{ margin: '6px 0 0', fontSize: 17, color: C.textSecondary }}>
            {materials === null ? 'טוענים…' : toReview ? `${toReview === 1 ? 'דבר אחד מחכה' : `${toReview} דברים מחכים`} לבדיקה שלך.` : 'הכול מעודכן. מה נכין היום?'}
          </p>
        </div>
        <a href="/create" style={btnPrimary}><Plus size={20} aria-hidden /> יצירה חדשה</a>
      </section>

      {/* waiting for review */}
      {toReview > 0 && (
        <section aria-labelledby="h-wait" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h2 id="h-wait" style={h2}>מחכה לבדיקה שלך</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 14 }}>
            {waiting.map(m => {
              const sc = SUBJECT_COLORS[m.subject_slug] || SUBJECT_COLORS.math
              return (
                <a key={m.id} href={`/create?open=${m.id}`} style={{ ...card, borderRadius: 20, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14, textDecoration: 'none', color: C.text }}>
                  <span style={{ width: 46, height: 46, borderRadius: 14, background: sc.bg, color: sc.fg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><ClipboardCheck size={22} aria-hidden /></span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontWeight: 700, fontSize: 17, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}><bdi>{m.title}</bdi></span>
                    <span style={{ fontSize: 14, color: C.textSecondary }}>{nameOf(m.child_id) ? <><bdi>{nameOf(m.child_id)}</bdi> · </> : ''}{SUBJECT_HE[m.subject_slug] || ''} · {(m.question_ids || []).length} שאלות</span>
                  </span>
                  <span style={{ ...btnLine, flex: '0 0 auto' }}>לבדוק</span>
                </a>
              )
            })}
            {booklets.admin && booklets.drafts > 0 && (
              <a href="/reading" style={{ ...card, borderRadius: 20, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14, textDecoration: 'none', color: C.text }}>
                <span style={{ width: 46, height: 46, borderRadius: 14, background: SUBJECT_COLORS.reading.bg, color: SUBJECT_COLORS.reading.fg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><BookOpen size={22} aria-hidden /></span>
                <span style={{ flex: 1 }}>
                  <span style={{ display: 'block', fontWeight: 700, fontSize: 17 }}>{booklets.drafts === 1 ? 'חוברת קריאה חדשה' : `${booklets.drafts} חוברות קריאה חדשות`}</span>
                  <span style={{ fontSize: 14, color: C.textSecondary }}>לאישור לפני שכולם רואים</span>
                </span>
                <span style={{ ...btnLine, flex: '0 0 auto' }}>לעבור עליהן</span>
              </a>
            )}
          </div>
        </section>
      )}

      {/* children */}
      <section aria-labelledby="h-kids" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <h2 id="h-kids" style={h2}>הילדים</h2>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {kids.length > 0 && <a href="/kids" style={{ display: 'inline-flex', alignItems: 'center', minHeight: 44, padding: '0 14px', borderRadius: 12, background: C.primary, color: '#fff', fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>מי לומד עכשיו?</a>}
            <button type="button" onClick={onProgress} style={{ border: 0, background: 'transparent', color: C.primary, fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit', minHeight: 44 }}>התקדמות מפורטת ←</button>
          </div>
        </div>
        {kids.length === 0 ? (
          <div style={{ ...card, padding: 24, color: C.textSecondary }}>עוד אין ילדים בחשבון. <a href="/dashboard?tab=family" style={{ color: C.primary, fontWeight: 700 }}>להוספת ילד/ה</a></div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: 14 }}>
            {kids.map((k, i) => {
              const color = CHILD_AVATAR_COLORS[i % CHILD_AVATAR_COLORS.length]
              const topics = (progress || []).filter(p => p.child_id === k.id && p.status !== 'not_started' && p.topic)
                .sort((a, b) => String(b.last_attempted_at || '').localeCompare(String(a.last_attempted_at || ''))).slice(0, 2)
              const latest = (materials || []).find(m => m.child_id === k.id)
              return (
                <div key={k.id} style={{ ...card, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span aria-hidden style={{ width: 48, height: 48, borderRadius: '50%', background: color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 20, fontFamily: 'Rubik, sans-serif' }}>{(k.display_name || '?')[0]?.toUpperCase()}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'Rubik, sans-serif', fontSize: 20, fontWeight: 700 }}><bdi>{k.display_name}</bdi></div>
                      <div style={{ fontSize: 14, color: C.textSecondary }}>{gradeHe(k.grade)}{k.streak_current > 0 ? ` · ${k.streak_current} ימים ברצף` : ''}</div>
                    </div>
                    {k.streak_current > 0 && <Flame size={20} color={C.coral} aria-hidden />}
                  </div>
                  {topics.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {topics.map(t => {
                        const pct = t.steps_total ? Math.round((t.steps_completed / t.steps_total) * 100) : t.status === 'completed' ? 100 : 0
                        const sc = SUBJECT_COLORS[t.topic?.subject?.slug] || SUBJECT_COLORS.math
                        return (
                          <div key={t.id}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 15 }}><span><bdi>{t.topic.title_he || t.topic.title_en}</bdi></span><b>{pct}%</b></div>
                            <div style={{ height: 8, borderRadius: 99, background: '#EEEAE2', marginTop: 4 }}><div style={{ width: `${pct}%`, height: 8, borderRadius: 99, background: sc.solid }} /></div>
                          </div>
                        )
                      })}
                    </div>
                  ) : <div style={{ fontSize: 15, color: C.textSecondary }}>עוד לא התחיל/ה שיעורים באפליקציה.</div>}
                  {latest && (
                    <a href={`/create?open=${latest.id}`} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F7F4EE', borderRadius: 14, padding: '10px 12px', textDecoration: 'none', color: C.text, fontSize: 14 }}>
                      <span style={{ color: C.textSecondary }}>אחרון:</span><span style={{ flex: 1, minWidth: 0, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}><bdi>{latest.title}</bdi></span><ChevronLeft size={16} aria-hidden />
                    </a>
                  )}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <a href="/create" style={btnSoft}>ליצור תרגול</a>
                    <a href={`/lesson?childId=${k.id}`} style={btnLine}>לשיעור</a>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* quick create */}
      <section aria-labelledby="h-quick" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2 id="h-quick" style={h2}>ליצור במהירות</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14 }}>
          {[
            { href: '/create?kind=practice', t: 'תרגול', d: 'נושא אחד, מהקל לקשה', bg: '#EAF0FF' },
            { href: '/create?kind=exam', t: 'מבחן', d: 'כמה נושאים, עם זמן ודף תשובות', bg: '#F0EDFF' },
            { href: '/create?kind=practice&mirror=1', t: 'דף דומה לדף שלי', d: 'מעלים דף, מקבלים אחד כמוהו', bg: '#E3F5EF' },
            { href: '/reading', t: 'חוברת קריאה', d: 'לגן ולכיתה א׳, לפי ניקוד', bg: '#FFF4D1' },
          ].map(x => (
            <a key={x.t} href={x.href} style={{ display: 'flex', flexDirection: 'column', gap: 6, background: x.bg, borderRadius: 22, padding: 20, color: C.text, textDecoration: 'none' }}>
              <span style={{ fontFamily: 'Rubik, sans-serif', fontSize: 19, fontWeight: 700 }}>{x.t}</span>
              <span style={{ fontSize: 15, color: '#33415F' }}>{x.d}</span>
            </a>
          ))}
        </div>
      </section>

      {/* recent */}
      {recent.length > 0 && (
        <section aria-labelledby="h-recent" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 id="h-recent" style={h2}>יצרת לאחרונה</h2>
            <a href="/create?view=history" style={{ color: C.primary, fontWeight: 700 }}>הכול</a>
          </div>
          <div style={{ ...card, borderRadius: 22, overflow: 'hidden' }}>
            {recent.map((m, i) => {
              const sc = SUBJECT_COLORS[m.subject_slug] || SUBJECT_COLORS.math
              return (
                <a key={m.id} href={`/create?open=${m.id}`} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, padding: '14px 20px', borderTop: i ? `1px solid ${C.borderLight}` : 0, textDecoration: 'none', color: C.text }}>
                  <span style={{ padding: '4px 10px', borderRadius: 999, background: sc.bg, color: sc.fg, fontSize: 13, fontWeight: 700 }}>{SUBJECT_HE[m.subject_slug] || ''}</span>
                  <span style={{ flex: '1 1 220px', minWidth: 0, fontWeight: 700 }}><bdi>{m.title}</bdi></span>
                  <span style={{ fontSize: 14, color: C.textSecondary }}>{nameOf(m.child_id) ? <><bdi>{nameOf(m.child_id)}</bdi> · </> : ''}{KIND_HE[m.kind]} · {(m.question_ids || []).length} שאלות · {new Date(m.created_at).toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' })}</span>
                </a>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
