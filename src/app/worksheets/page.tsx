'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  ArrowLeft, FileText, BookOpen, Calculator, Globe2,
  ChevronRight, Loader2, Sun, Moon,
  ToggleLeft, ToggleRight, Sliders, Users, RefreshCw,
} from 'lucide-react'
import EduPlayLogo from '@/components/EduPlayLogo'
import { useFamilyChildren, EMPTY_CHILD, type FamilyChild } from '@/lib/useFamilyChildren'
import ParentHeaderBar from '@/components/ParentHeaderBar'
import TopicMultiSelect from '@/components/TopicMultiSelect'
import { PARENT_COLORS, PARENT_FONTS, CHILD_AVATAR_COLORS } from '@/lib/parentTheme'

// ─── Tokens ───────────────────────────────────────────────────
// Light palette matches the rest of the redesigned parent portal. Dark mode
// is a real, self-contained feature with no equivalent anywhere else in the
// app (the design doc has no dark-mode spec at all) — left as its own
// internally-consistent palette rather than inventing a "dark PARENT_COLORS"
// that doesn't exist anywhere else.
const L = {
  bg:PARENT_COLORS.pageBg, card:PARENT_COLORS.card, border:PARENT_COLORS.border, inputBg:PARENT_COLORS.pageBg,
  text:PARENT_COLORS.text, textSec:PARENT_COLORS.textSecondary, textMuted:PARENT_COLORS.textMuted, label:PARENT_COLORS.textSecondary,
}
const D = {
  bg:'#0F1117', card:'#1E2130', border:'#2A2D3E', inputBg:'#252836',
  text:'#F1F5F9', textSec:'#94A3B8', textMuted:'#64748B', label:'#CBD5E1',
}


// Kept as distinct per-subject identity colors (same call as curriculum/page.tsx's
// SUBJECTS) rather than flattened to one teal — real informational signal, not decoration.
const SUBJECTS = [
  { slug:'math',    label:'Mathematics', labelHe:'מתמטיקה', icon:Calculator, color:'#4A7FD4', bg:'#EFF6FF' },
  { slug:'english', label:'English',     labelHe:'אנגלית',  icon:BookOpen,   color:'#2EC4B6', bg:'#F0FDFB' },
  { slug:'hebrew',  label:'Hebrew',      labelHe:'עברית',   icon:Globe2,     color:'#EF4444', bg:'#FEF2F2' },
]

const DIFFICULTIES = [
  { id:'easy',   label:'Easy',   color:PARENT_COLORS.primary,  bg:PARENT_COLORS.primaryLight },
  { id:'medium', label:'Medium', color:PARENT_COLORS.amberText,bg:PARENT_COLORS.amberLight },
  { id:'hard',   label:'Hard',   color:PARENT_COLORS.coralText,bg:PARENT_COLORS.coralLight },
  { id:'mixed',  label:'Mixed',  color:PARENT_COLORS.accent,   bg:PARENT_COLORS.accentLight },
]

const WS_TYPES = [
  { id:'practice', label:'Practice',  desc:'Hints and examples included',     color:PARENT_COLORS.primary },
  { id:'quiz',     label:'Quiz',      desc:'Questions only, no hints',         color:PARENT_COLORS.accent },
  { id:'exam',     label:'Exam',      desc:'Full coverage, exam conditions',   color:PARENT_COLORS.coralText },
]

// ─── Toggle switch ────────────────────────────────────────────
function Toggle({ value, onChange, color = PARENT_COLORS.primary }: { value: boolean; onChange: () => void; color?: string }) {
  return (
    <div onClick={onChange} style={{
      width: 44, height: 24, borderRadius: 12,
      background: value ? color : '#D1D5DB',
      cursor: 'pointer', position: 'relative',
      transition: 'background 0.2s', flexShrink: 0,
    }}>
      <div style={{
        position: 'absolute', top: 3,
        left: value ? 22 : 3,
        width: 18, height: 18, borderRadius: '50%',
        background: 'white', transition: 'left 0.2s',
        boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
      }} />
    </div>
  )
}

// ─── Step badge ───────────────────────────────────────────────
function StepBadge({ n, color }: { n: number; color: string }) {
  return (
    <div style={{
      width: 26, height: 26, borderRadius: '50%',
      background: `${color}18`, color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 12, fontWeight: 900, flexShrink: 0,
    }}>
      {n}
    </div>
  )
}

// ─── Page header ─────────────────────────────────────────────
function PageHeader({ dark, onToggleDark, tab, onSwitchTab }: {
  dark: boolean; onToggleDark: () => void
  tab: 'builder' | 'history'; onSwitchTab: (t: 'builder' | 'history') => void
}) {
  const T = dark ? D : L
  return (
    <header style={{
      background: T.card, borderBottom: `1px solid ${T.border}`,
      padding: '0 24px', height: 60,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      position: 'sticky', top: 0, zIndex: 100,
      boxShadow: `0 2px 12px rgba(0,0,0,${dark ? '0.2' : '0.04'})`,
      gap: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <EduPlayLogo showName={false} size={32} iconRadius={9} />
          <div>
            <div style={{ fontFamily: PARENT_FONTS.heading, fontWeight: 800, fontSize: 15, color: T.text, letterSpacing: '-0.01em' }}>
              Edu<span style={{ color: PARENT_COLORS.primary }}>Play</span>
            </div>
            <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 600 }}>Worksheet Builder</div>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={() => window.location.href = '/dashboard'} style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '7px 14px', borderRadius: 50,
          border: `1px solid ${T.border}`, background: T.card,
          color: T.textSec, fontWeight: 700, fontSize: 12,
          cursor: 'pointer', fontFamily: 'inherit',
          transition: 'all 0.15s',
        }}>
          <ArrowLeft size={13} /> Dashboard
        </button>
        <div style={{ display: 'flex', background: dark ? '#252836' : PARENT_COLORS.pageBg, borderRadius: 10, padding: 3, gap: 2 }}>
          {([['builder', 'Builder'], ['history', 'History']] as const).map(([id, label]) => (
            <button key={id} onClick={() => onSwitchTab(id)} style={{
              padding: '6px 14px', border: 'none', borderRadius: 7,
              background: tab === id ? T.card : 'transparent',
              boxShadow: tab === id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              color: tab === id ? T.text : T.textMuted,
              fontWeight: 800, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              {label}
            </button>
          ))}
        </div>
        <button onClick={onToggleDark} style={{
          width: 34, height: 34, borderRadius: '50%',
          border: `1px solid ${T.border}`, background: T.inputBg,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: T.textSec,
        }}>
          {dark ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </div>
    </header>
  )
}

// ─── Main builder ─────────────────────────────────────────────
function WorksheetBuilder({ tab, onSwitchTab }: {
  tab: 'builder' | 'history'; onSwitchTab: (t: 'builder' | 'history') => void
}) {
  const searchParams = useSearchParams()
  const preChildId   = searchParams.get('childId')

  const [dark, setDark]             = useState(false)
  const { children: CHILDREN } = useFamilyChildren()
  const [selectedChild, setChild]   = useState<FamilyChild>(EMPTY_CHILD)
  useEffect(() => {
    if (!selectedChild.id && CHILDREN.length) setChild(CHILDREN.find(c => c.id === preChildId) || CHILDREN[0])
  }, [CHILDREN, preChildId, selectedChild.id])
  const [selectedSubject, setSubj]  = useState(SUBJECTS[0])
  const [topics, setTopics]         = useState<any[]>([])
  const [selectedTopics, setSel]    = useState<string[]>([])
  const [difficulty, setDiff]       = useState('mixed')
  const [questionCount, setQCount]  = useState(20)
  const [langMode, setLang]         = useState('bilingual')
  const [answerKey, setAnswerKey]   = useState(false)
  const [includeHints, setHints]    = useState(false)
  const [solutionSteps, setSteps]   = useState(false)
  const [wsType, setType]           = useState('practice')
  const [loading, setLoading]       = useState(false)
  const [loadingTopics, setLT]      = useState(false)

  const T = dark ? D : L

  // Topics are fetched once per subject, across ALL grades — the picker
  // browses/searches the full cross-grade list, unlike the old checklist
  // which was hard-scoped to the selected child's own grade. Grade filtering
  // now only drives the *default* selection, not what's fetchable at all.
  useEffect(() => { loadTopics() }, [selectedSubject])

  // Switching the child clears the current selection rather than carrying it
  // over: a cross-grade topic pick is a judgment call about a specific
  // child, and silently keeping it for a different child (different grade,
  // different needs) could produce a nonsensical worksheet. Matches the
  // pre-redesign reset-on-switch behavior, now scoped to the new child's
  // own grade as the default instead of "everything for this grade".
  useEffect(() => {
    if (topics.length) setSel(topics.filter((t: any) => t.grade === selectedChild.grade).map((x: any) => x.id))
  }, [selectedChild])

  async function loadTopics() {
    setLT(true)
    try {
      const res  = await fetch(`/api/topics?subject=${selectedSubject.slug}`)
      const data = await res.json()
      const t    = data.topics || []
      setTopics(t)
      setSel(t.filter((x: any) => x.grade === selectedChild.grade).map((x: any) => x.id))
    } catch { setTopics([]); setSel([]) }
    setLT(false)
  }

  async function generate() {
    if (selectedTopics.length === 0 || loading) return
    setLoading(true)
    const params = new URLSearchParams({
      childId: selectedChild.id, topicIds: selectedTopics.join(','),
      difficulty, questionCount: questionCount.toString(),
      lang: langMode, answerKey: answerKey.toString(),
      includeHints: includeHints.toString(), solutionSteps: solutionSteps.toString(),
      wsType,
    })
    window.open(`/api/worksheets/builder?${params}`, '_blank')
    setLoading(false)
  }

  const selSubj = selectedSubject

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: PARENT_FONTS.body, color: T.text, transition: 'background 0.2s' }}>
      <style>{`
        * { box-sizing: border-box; }
        .card { transition: box-shadow 0.18s ease, transform 0.18s ease !important; }
        .card:hover { box-shadow: 0 8px 24px rgba(0,0,0,${dark ? '0.25' : '0.08'}) !important; transform: translateY(-1px) !important; }
        .sel-option { transition: all 0.15s ease !important; }
        .sel-option:hover { transform: translateY(-1px) !important; }
        input[type=range] { accent-color: ${PARENT_COLORS.primary}; width: 100%; }
        @media (max-width: 768px) {
          .builder-grid { grid-template-columns: 1fr !important; }
          .sticky-summary { position: static !important; }
        }
      `}</style>

      <PageHeader dark={dark} onToggleDark={() => setDark(v => !v)} tab={tab} onSwitchTab={onSwitchTab} />

      <div style={{ maxWidth: 980, margin: '0 auto', padding: '28px 20px' }}>

        {/* Page title */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontWeight: 900, fontSize: 24, margin: 0, letterSpacing: '-0.02em', color: T.text }}>
            Worksheet Builder
          </h1>
          <p style={{ color: T.textMuted, margin: '5px 0 0', fontSize: 13 }}>
            Create a custom worksheet or exam — choose a child, subject, topics and options, then download.
          </p>
        </div>

        <div className="builder-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>

          {/* ── Left column ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Step 1 — Child */}
            <div className="card" style={{ background: T.card, borderRadius: 20, padding: 20, border: `1px solid ${T.border}`, boxShadow: `0 2px 8px rgba(0,0,0,${dark?'0.15':'0.04'})` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <StepBadge n={1} color={PARENT_COLORS.primary} />
                <div style={{ fontWeight: 800, fontSize: 14, color: T.text }}>Select Child</div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                {CHILDREN.map(child => {
                  const active = selectedChild.id === child.id
                  return (
                    <div key={child.id}
                      className="sel-option"
                      onClick={() => setChild(child)}
                      style={{
                        flex: 1, padding: '14px 10px',
                        border: `2px solid ${active ? child.color : T.border}`,
                        borderRadius: 14, textAlign: 'center', cursor: 'pointer',
                        background: active ? `${child.color}12` : T.inputBg,
                      }}
                    >
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: child.color, color: 'white', fontWeight: 800, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 5px' }}>
                        {child.name[0].toUpperCase()}
                      </div>
                      <div style={{ fontWeight: 800, fontSize: 13, color: active ? child.color : T.text }}>{child.name}</div>
                      <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>
                        Grade {child.grade === 0 ? 'K' : child.grade}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Step 2 — Subject */}
            <div className="card" style={{ background: T.card, borderRadius: 20, padding: 20, border: `1px solid ${T.border}`, boxShadow: `0 2px 8px rgba(0,0,0,${dark?'0.15':'0.04'})` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <StepBadge n={2} color={PARENT_COLORS.accent} />
                <div style={{ fontWeight: 800, fontSize: 14, color: T.text }}>Select Subject</div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                {SUBJECTS.map(subj => {
                  const Icon   = subj.icon
                  const active = selectedSubject.slug === subj.slug
                  return (
                    <div key={subj.slug}
                      className="sel-option"
                      onClick={() => setSubj(subj)}
                      style={{
                        flex: 1, padding: '14px 10px',
                        border: `2px solid ${active ? subj.color : T.border}`,
                        borderRadius: 14, textAlign: 'center', cursor: 'pointer',
                        background: active ? `${subj.color}12` : T.inputBg,
                      }}
                    >
                      <div style={{
                        width: 40, height: 40, borderRadius: 12, margin: '0 auto 8px',
                        background: active ? `${subj.color}20` : `${T.border}60`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Icon size={18} color={active ? subj.color : T.textMuted} />
                      </div>
                      <div style={{ fontWeight: 800, fontSize: 13, color: active ? subj.color : T.text }}>{subj.label}</div>
                      <div style={{ fontSize: 11, color: T.textMuted, direction: 'rtl', marginTop: 2 }}>{subj.labelHe}</div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Step 3 — Topics */}
            <div className="card" style={{ background: T.card, borderRadius: 20, padding: 20, border: `1px solid ${T.border}`, boxShadow: `0 2px 8px rgba(0,0,0,${dark?'0.15':'0.04'})` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <StepBadge n={3} color={selSubj.color} />
                <div style={{ fontWeight: 800, fontSize: 14, color: T.text }}>
                  Select Topics
                  {!loadingTopics && topics.length > 0 && (
                    <span style={{ fontSize: 12, color: T.textMuted, fontWeight: 600, marginLeft: 6 }}>
                      ({selectedTopics.length}/{topics.length} selected · all grades)
                    </span>
                  )}
                </div>
              </div>

              {loadingTopics ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24, color: T.textMuted, fontSize: 13 }}>
                  <Loader2 size={16} style={{ animation: 'spin 0.7s linear infinite' }} />
                  Loading topics…
                </div>
              ) : topics.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 24, color: T.textMuted, fontSize: 13 }}>
                  No topics found for {selSubj.label} yet.
                </div>
              ) : (
                <TopicMultiSelect
                  topics={topics}
                  selectedIds={selectedTopics}
                  onChange={setSel}
                  accentColor={selSubj.color}
                  theme={{ card: T.card, border: T.border, text: T.text, textMuted: T.textMuted, inputBg: T.inputBg }}
                />
              )}
            </div>

            {/* Step 4 — Options */}
            <div className="card" style={{ background: T.card, borderRadius: 20, padding: 20, border: `1px solid ${T.border}`, boxShadow: `0 2px 8px rgba(0,0,0,${dark?'0.15':'0.04'})` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                <StepBadge n={4} color={PARENT_COLORS.amberText} />
                <div style={{ fontWeight: 800, fontSize: 14, color: T.text }}>Options</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

                {/* Worksheet type */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                    Worksheet Type
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {WS_TYPES.map(t => {
                      const active = wsType === t.id
                      return (
                        <div key={t.id} onClick={() => setType(t.id)}
                          style={{
                            padding: '10px 13px',
                            border: `1.5px solid ${active ? t.color : T.border}`,
                            borderRadius: 12, cursor: 'pointer',
                            background: active ? `${t.color}10` : T.inputBg,
                            transition: 'all 0.13s',
                          }}
                        >
                          <div style={{ fontWeight: 800, fontSize: 13, color: active ? t.color : T.text }}>{t.label}</div>
                          <div style={{ fontSize: 11, color: T.textMuted, marginTop: 1 }}>{t.desc}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Difficulty */}
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                      Difficulty
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {DIFFICULTIES.map(d => {
                        const active = difficulty === d.id
                        return (
                          <button key={d.id} onClick={() => setDiff(d.id)}
                            style={{
                              padding: '5px 12px', borderRadius: 50,
                              border: `1.5px solid ${active ? d.color : T.border}`,
                              background: active ? d.bg : T.inputBg,
                              color: active ? d.color : T.textSec,
                              fontWeight: 800, fontSize: 12, cursor: 'pointer',
                              fontFamily: 'inherit',
                            }}>
                            {d.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Question count */}
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                      Questions: <span style={{ color: PARENT_COLORS.primary }}>{questionCount}</span>
                    </div>
                    <input type="range" min={10} max={40} step={1} value={questionCount}
                      onChange={e => setQCount(parseInt(e.target.value))} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: T.textMuted, marginTop: 3 }}>
                      <span>10</span><span>40</span>
                    </div>
                  </div>

                  {/* Language */}
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                      Language
                    </div>
                    <div style={{ display: 'flex', background: dark ? '#252836' : '#F3F4F6', borderRadius: 10, padding: 3, gap: 2 }}>
                      {[
                        { id:'en_only',   label:'🇺🇸 EN' },
                        { id:'bilingual', label:'🌐 Both' },
                        { id:'he_only',   label:'🇮🇱 HE' },
                      ].map(l => (
                        <button key={l.id} onClick={() => setLang(l.id)} style={{
                          flex: 1, padding: '6px 4px', border: 'none',
                          borderRadius: 7,
                          background: langMode === l.id ? T.card : 'transparent',
                          boxShadow: langMode === l.id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                          color: langMode === l.id ? T.text : T.textMuted,
                          fontWeight: 700, fontSize: 11, cursor: 'pointer',
                          fontFamily: 'inherit',
                        }}>
                          {l.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Toggles */}
                  {[
                    { label:'Answer Key',      desc:'Answers at the end',            val:answerKey,    set:() => setAnswerKey(v => !v),  color:PARENT_COLORS.primary },
                    { label:'Include Hints',   desc:'Small hint per question',       val:includeHints, set:() => setHints(v => !v),      color:PARENT_COLORS.amberText },
                    { label:'Solution Steps',  desc:'Step-by-step explanations',    val:solutionSteps,set:() => setSteps(v => !v),      color:PARENT_COLORS.accent },
                  ].map(t => (
                    <div key={t.label} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 12px', background: T.inputBg,
                      borderRadius: 10, border: `1px solid ${T.border}`,
                    }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 12, color: T.text }}>{t.label}</div>
                        <div style={{ fontSize: 10, color: T.textMuted }}>{t.desc}</div>
                      </div>
                      <Toggle value={t.val} onChange={t.set} color={t.color} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Right column — Summary + Generate ── */}
          <div className="sticky-summary" style={{ position: 'sticky', top: 76 }}>
            <div style={{
              background: T.card, borderRadius: 20, padding: 22,
              border: `1px solid ${T.border}`,
              boxShadow: `0 4px 20px rgba(0,0,0,${dark?'0.25':'0.08'})`,
            }}>
              <div style={{ fontWeight: 900, fontSize: 16, color: T.text, letterSpacing: '-0.01em', marginBottom: 16 }}>
                Worksheet Summary
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {[
                  { label:'Child',      value:`${selectedChild.name} (Grade ${selectedChild.grade === 0 ? 'K' : selectedChild.grade})` },
                  { label:'Subject',    value:selSubj.label },
                  { label:'Topics',     value:`${selectedTopics.length} of ${topics.length} selected` },
                  { label:'Type',       value:WS_TYPES.find(t => t.id === wsType)?.label || wsType },
                  { label:'Difficulty', value:DIFFICULTIES.find(d => d.id === difficulty)?.label || difficulty },
                  { label:'Questions',  value:`${questionCount} questions` },
                  { label:'Language',   value:langMode === 'bilingual' ? '🌐 Bilingual' : langMode === 'he_only' ? '🇮🇱 Hebrew' : '🇺🇸 English' },
                  { label:'Answer Key', value:answerKey     ? '✓ Yes' : '✗ No' },
                  { label:'Hints',      value:includeHints  ? '✓ Yes' : '✗ No' },
                  { label:'Steps',      value:solutionSteps ? '✓ Yes' : '✗ No' },
                ].map(item => (
                  <div key={item.label} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px 0', borderBottom: `1px solid ${T.border}`, fontSize: 13,
                  }}>
                    <span style={{ color: T.textMuted, fontWeight: 600 }}>{item.label}</span>
                    <span style={{ color: T.text, fontWeight: 700, textAlign: 'right', maxWidth: 160 }}>{item.value}</span>
                  </div>
                ))}
              </div>

              {selectedTopics.length > 0 && (
                <div style={{
                  marginTop: 12, padding: '8px 12px',
                  background: dark ? '#252836' : '#F3F4F6',
                  borderRadius: 8, fontSize: 11, color: T.textSec,
                }}>
                  ~{Math.round(questionCount / Math.max(selectedTopics.length, 1))} questions per topic
                </div>
              )}

              <button onClick={generate}
                disabled={loading || selectedTopics.length === 0}
                style={{
                  width: '100%', marginTop: 16, padding: '14px',
                  borderRadius: 50, border: 'none',
                  background: selectedTopics.length === 0
                    ? (dark ? '#2A2D3E' : PARENT_COLORS.borderLight)
                    : PARENT_COLORS.primary,
                  color: selectedTopics.length === 0 ? T.textMuted : 'white',
                  fontSize: 14, fontWeight: 900,
                  cursor: selectedTopics.length === 0 ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  boxShadow: selectedTopics.length === 0 ? 'none' : `0 6px 20px ${PARENT_COLORS.primary}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'all 0.18s ease',
                }}>
                {loading
                  ? <><Loader2 size={16} style={{ animation: 'spin 0.7s linear infinite' }} /> Generating…</>
                  : <><FileText size={16} /> Generate Worksheet</>
                }
              </button>

              {selectedTopics.length === 0 && (
                <p style={{ textAlign: 'center', fontSize: 12, color: PARENT_COLORS.danger, marginTop: 8, fontWeight: 700 }}>
                  Select at least one topic to continue
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ─── History list ─────────────────────────────────────────────
// Doesn't need useSearchParams, so it's kept out of the Suspense boundary
// WorksheetBuilder requires — switching tabs never shows a loading flash.
function WorksheetHistoryList({ onSwitchTab }: { onSwitchTab: (t: 'builder' | 'history') => void }) {
  const [generations, setGenerations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/worksheets/history')
      .then(r => r.json())
      .then(data => setGenerations(data.generations || []))
      .finally(() => setLoading(false))
  }, [])

  function regenerate(g: any) {
    const params = new URLSearchParams({
      childId: g.child?.id || '',
      topicIds: (g.topics || []).map((t: any) => t.id).join(','),
      questionIds: (g.question_ids || []).join(','),
      difficulty: g.difficulty,
      lang: g.lang_mode,
      answerKey: String(g.include_answer_key),
      includeHints: String(g.include_hints),
      solutionSteps: String(g.solution_steps),
      wsType: g.ws_type,
      regenerate: 'true',
    })
    window.open(`/api/worksheets/builder?${params}`, '_blank')
  }

  return (
    <div style={{ minHeight: '100vh', background: L.bg, fontFamily: PARENT_FONTS.body, color: L.text }}>
      <ParentHeaderBar
        center={
          <div style={{ display: 'flex', background: PARENT_COLORS.pageBg, borderRadius: 10, padding: 3, gap: 2 }}>
            {([['builder', 'Builder'], ['history', 'History']] as const).map(([id, label]) => (
              <button key={id} onClick={() => onSwitchTab(id)} style={{
                padding: '6px 14px', border: 'none', borderRadius: 7,
                background: id === 'history' ? L.card : 'transparent',
                boxShadow: id === 'history' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                color: id === 'history' ? L.text : L.textMuted,
                fontWeight: 800, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
              }}>
                {label}
              </button>
            ))}
          </div>
        }
        right={
          <button onClick={() => window.location.href = '/dashboard'} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '7px 14px', borderRadius: 50,
            border: `1px solid ${L.border}`, background: L.card,
            color: L.textSec, fontWeight: 700, fontSize: 12,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
            <ArrowLeft size={13} /> Dashboard
          </button>
        }
      />

      <div style={{ maxWidth: 780, margin: '0 auto', padding: '28px 20px' }}>
        <h1 style={{ fontWeight: 900, fontSize: 24, margin: '0 0 5px', letterSpacing: '-0.02em', color: L.text }}>Worksheet History</h1>
        <p style={{ color: L.textMuted, margin: '0 0 20px', fontSize: 13 }}>
          Every worksheet you've generated, with an exact reprint of any of them.
        </p>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: L.textMuted, fontSize: 13 }}>
            <Loader2 size={16} style={{ animation: 'spin 0.7s linear infinite' }} /> Loading…
          </div>
        ) : generations.length === 0 ? (
          <p style={{ color: L.textMuted, fontSize: 13 }}>No worksheets generated yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {generations.map(g => (
              <div key={g.id} style={{
                background: L.card, border: `1px solid ${L.border}`, borderRadius: 16,
                padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
              }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 13, color: L.text }}>
                    {g.child?.display_name || 'Unknown child'} · {(g.topics || []).map((t: any) => t.title_en).join(', ') || '—'}
                  </div>
                  <div style={{ fontSize: 11, color: L.textMuted, marginTop: 2 }}>
                    {g.ws_type} · {g.difficulty} · {g.question_count} question{g.question_count === 1 ? '' : 's'} · {new Date(g.generated_at).toLocaleString()}
                  </div>
                </div>
                <button onClick={() => regenerate(g)} style={{
                  flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 50,
                  border: 'none', background: PARENT_COLORS.primary,
                  color: 'white', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                }}>
                  <RefreshCw size={12} /> Regenerate
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function WorksheetsPage() {
  const [tab, setTab] = useState<'builder' | 'history'>('builder')

  if (tab === 'history') {
    return <WorksheetHistoryList onSwitchTab={setTab} />
  }

  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: PARENT_FONTS.body, color: PARENT_COLORS.textSecondary }}>
        <Loader2 size={24} style={{ animation: 'spin 0.7s linear infinite' }} />
      </div>
    }>
      <WorksheetBuilder tab={tab} onSwitchTab={setTab} />
    </Suspense>
  )
}
