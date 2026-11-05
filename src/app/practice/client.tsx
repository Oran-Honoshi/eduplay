'use client'
import { useEffect, useState } from 'react'
import { Dumbbell, Play, RotateCcw, CheckCircle2, Clock } from 'lucide-react'
import { THEME_CONFIG, KidNavBar, ThemeDecorations, CollectionButton } from '@/components/theme'
import { readKidLang, type KidLang } from '@/lib/kidPrefs'

const SUBJECT_ICON: Record<string, string> = { math: '🔢', english: '🔤', hebrew: 'א' }
const GRADE_LABEL_HE = ['גן', 'א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳']
const GRADE_LABEL_EN = ['K', '1', '2', '3', '4', '5', '6']
// A normal lesson uses 10 questions; below that a topic can't fill one round.
const MIN_FOR_LESSON = 10

export default function PracticeClient({ child, token, grade, subjects, topics, progress, counts }: any) {
  const theme = child.theme || 'plain'
  const T = THEME_CONFIG[theme] || THEME_CONFIG.plain
  const [lang, setLang] = useState<KidLang>((child.lang_screen || 'bilingual') as KidLang)
  useEffect(() => { setLang(readKidLang(child.id, child.lang_screen)) }, [child.id, child.lang_screen])
  const isHE = lang === 'he_only'
  const [subject, setSubject] = useState<string | null>(null)

  const progressBy: Record<string, any> = {}
  for (const p of progress) progressBy[p.topic_id] = p

  const shown = topics.filter((t: any) => !subject || t.subject?.slug === subject)
  const qs = `childId=${child.id}${token ? `&token=${token}` : ''}&theme=${theme}&lang=${lang}`

  function open(topicId: string, more: boolean) {
    window.location.href = `/lesson?topicId=${topicId}&${qs}${more ? '&bonus=true' : ''}`
  }
  function switchGrade(g: number) {
    window.location.href = `/practice?${qs}&grade=${g}`
  }

  const t = (he: string, en: string) => (isHE ? he : en)

  return (
    <div dir={isHE ? 'rtl' : 'ltr'} style={{ minHeight: '100vh', background: T.bg, fontFamily: '"Nunito",sans-serif', position: 'relative' }}>
      <ThemeDecorations theme={theme}/>

      <header style={{ background: T.panel, borderBottom: `2px solid ${T.border}`, padding: '0 16px', height: 56, display: 'flex', alignItems: 'center', gap: 10, position: 'sticky', top: 0, zIndex: 100 }}>
        <Dumbbell size={20} color={T.accent1}/>
        <div style={{ fontFamily: T.fontHead, fontWeight: 900, fontSize: theme === 'minecraft' ? 11 : 17, color: T.text }}>
          {t('תרגול', 'Practice')}
        </div>
      </header>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '16px 16px 150px', position: 'relative', zIndex: 1 }}>
        <p style={{ margin: '0 0 14px', color: T.text, opacity: .7, fontSize: 14, fontWeight: 600 }}>
          {t('בחרו נושא ותרגלו כמה שרוצים — גם אחרי שסיימתם את השיעור.', 'Pick a topic and practice as much as you like — even after you finish the lesson.')}
        </p>

        {/* Grade — a starting point, not a wall */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12, alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: T.text, opacity: .7, marginInlineEnd: 4 }}>{t('כיתה', 'Grade')}</span>
          {GRADE_LABEL_EN.map((_, g) => (
            <button key={g} onClick={() => switchGrade(g)} aria-pressed={g === grade}
              style={{ minWidth: 40, height: 40, borderRadius: theme === 'minecraft' ? 4 : 999, cursor: 'pointer', fontWeight: 900, fontSize: 14,
                border: `2px solid ${g === grade ? T.accent1 : T.border}`, background: g === grade ? T.accent1 : T.panel, color: g === grade ? '#fff' : T.text }}>
              {isHE ? GRADE_LABEL_HE[g] : GRADE_LABEL_EN[g]}
            </button>
          ))}
        </div>

        {/* Subject */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
          {[{ slug: null, label_en: 'All', label_he: 'הכול' }, ...subjects].map((s: any) => {
            const active = subject === s.slug
            return (
              <button key={s.slug ?? 'all'} onClick={() => setSubject(s.slug)}
                style={{ padding: '10px 18px', minHeight: 44, borderRadius: theme === 'minecraft' ? 4 : 999, cursor: 'pointer', fontWeight: 800, fontSize: 14,
                  border: `2px solid ${active ? T.accent1 : T.border}`, background: active ? `${T.accent1}22` : T.panel, color: active ? T.accent1 : T.text }}>
                {s.slug ? `${SUBJECT_ICON[s.slug] || ''} ` : ''}{isHE ? (s.label_he || s.label_en) : s.label_en}
              </button>
            )
          })}
        </div>

        {shown.length === 0 && (
          <div style={{ textAlign: 'center', padding: '50px 20px', background: T.panel, border: `1.5px solid ${T.border}`, borderRadius: T.radius, color: T.text }}>
            {t('אין עדיין נושאים כאן', 'No topics here yet')}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 12 }}>
          {shown.map((topic: any) => {
            const p = progressBy[topic.id]
            const done = p?.status === 'completed'
            const started = !!p && !done
            const n = counts[topic.id] || 0
            const title = isHE ? (topic.title_he || topic.title_en) : topic.title_en
            const disabled = n === 0
            return (
              <div key={topic.id} style={{ background: T.panel, border: `2px solid ${done ? T.accent3 || T.accent1 : T.border}`, borderRadius: T.radius, padding: 14, display: 'flex', flexDirection: 'column', gap: 8, boxShadow: T.shadow }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 20 }}>{SUBJECT_ICON[topic.subject?.slug] || '📘'}</span>
                  <span style={{ fontWeight: 900, fontSize: 15, color: T.text, lineHeight: 1.3, flex: 1 }}>{title}</span>
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.text, opacity: .65, display: 'flex', alignItems: 'center', gap: 5 }}>
                  {done ? <><CheckCircle2 size={14}/> {t('סיימת! אפשר לתרגל עוד', 'Done! You can practice more')}</>
                    : started ? <><Clock size={14}/> {t('בתהליך', 'In progress')}</>
                    : t('חדש', 'New')}
                </div>
                {n > 0 && n < MIN_FOR_LESSON && (
                  <div style={{ fontSize: 11, color: T.text, opacity: .5 }}>{t('עוד שאלות בדרך', 'More questions coming soon')}</div>
                )}
                <button disabled={disabled} onClick={() => open(topic.id, done)}
                  style={{ marginTop: 'auto', minHeight: 46, padding: '10px', borderRadius: T.radius, border: 'none', cursor: disabled ? 'default' : 'pointer',
                    background: disabled ? T.border : done ? T.accent2 : T.accent1, color: done ? '#000' : '#fff', fontWeight: 900, fontSize: 14,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: disabled ? .5 : 1, fontFamily: T.fontHead }}>
                  {disabled ? t('בקרוב', 'Coming soon')
                    : done ? <><RotateCcw size={16}/> {t('תרגול נוסף', 'Practice more')}</>
                    : started ? <><Play size={16}/> {t('המשך', 'Continue')}</>
                    : <><Play size={16}/> {t('התחל', 'Start')}</>}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      <CollectionButton childId={child.id} token={token} theme={theme} lang={lang}/>
      <KidNavBar theme={theme} active="practice" childId={child.id} token={token} lang={lang}/>
    </div>
  )
}
