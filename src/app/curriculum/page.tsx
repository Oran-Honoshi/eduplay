'use client'
import { useState, useEffect } from 'react'
import {
  ArrowLeft, BookOpen, Calculator, Globe2,
  Play, Sun, Moon, Loader2, Zap, ChevronRight,
  Search, LayoutGrid,
} from 'lucide-react'

const L = {
  bg:'#F9FAFB', card:'#FFFFFF', border:'#E5E7EB', inputBg:'#FAFAFA',
  text:'#111827', textSec:'#6B7280', textMuted:'#9CA3AF',
}
const D = {
  bg:'#0F1117', card:'#1E2130', border:'#2A2D3E', inputBg:'#252836',
  text:'#F1F5F9', textSec:'#94A3B8', textMuted:'#64748B',
}

const GRADE_LABELS: Record<number, string>    = { 0:'Kindergarten',1:'Grade 1',2:'Grade 2',3:'Grade 3',4:'Grade 4',5:'Grade 5',6:'Grade 6' }
const GRADE_LABELS_HE: Record<number, string> = { 0:'גן חובה',1:'כיתה א׳',2:'כיתה ב׳',3:'כיתה ג׳',4:'כיתה ד׳',5:'כיתה ה׳',6:'כיתה ו׳' }

const SUBJECTS = [
  { slug:'math',    label:'Mathematics', labelHe:'מתמטיקה', icon:Calculator, color:'#4A7FD4', bg:'#EFF6FF' },
  { slug:'english', label:'English',     labelHe:'אנגלית',  icon:BookOpen,   color:'#2EC4B6', bg:'#F0FDFB' },
  { slug:'hebrew',  label:'Hebrew',      labelHe:'עברית',   icon:Globe2,     color:'#EF4444', bg:'#FEF2F2' },
]

const CHILDREN = [
  { id:'22222222-2222-2222-2222-222222222001', name:'Lia',   grade:6, emoji:'🐱', color:'#FF6B6B', grad:'linear-gradient(135deg,#FF9F43,#FF6B6B)' },
  { id:'22222222-2222-2222-2222-222222222002', name:'Tamar', grade:4, emoji:'🐻', color:'#4A7FD4', grad:'linear-gradient(135deg,#4A7FD4,#2EC4B6)' },
  { id:'22222222-2222-2222-2222-222222222003', name:'Tom',   grade:0, emoji:'🦊', color:'#8B5CF6', grad:'linear-gradient(135deg,#8B5CF6,#C084FC)' },
]

export default function CurriculumPage() {
  const [dark, setDark]                   = useState(false)
  const [selectedGrade, setGrade]         = useState(4)
  const [selectedSubject, setSubj]        = useState(SUBJECTS[0])
  const [topics, setTopics]               = useState<any[]>([])
  const [loading, setLoading]             = useState(false)
  const [langMode, setLang]               = useState<'en'|'he'>('en')
  const [search, setSearch]               = useState('')

  const T = dark ? D : L

  useEffect(() => { loadTopics() }, [selectedGrade, selectedSubject])

  async function loadTopics() {
    setLoading(true)
    try {
      const res  = await fetch(`/api/topics?grade=${selectedGrade}&subject=${selectedSubject.slug}`)
      const data = await res.json()
      setTopics(data.topics || [])
    } catch { setTopics([]) }
    setLoading(false)
  }

  const childForGrade = CHILDREN.find(c => c.grade === selectedGrade)
  const filtered      = topics.filter(t =>
    !search ||
    t.title_en?.toLowerCase().includes(search.toLowerCase()) ||
    t.title_he?.includes(search)
  )

  const selSubj = selectedSubject

  return (
    <div style={{ minHeight:'100vh', background:T.bg, fontFamily:'"Nunito", system-ui, sans-serif', color:T.text, transition:'background 0.2s' }}>
      <style>{`
        * { box-sizing: border-box; }
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes slideUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .topic-card { transition: all 0.18s ease !important; }
        .topic-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,${dark?'0.25':'0.08'}) !important; }
        .grade-btn { transition: all 0.15s ease !important; }
        .grade-btn:hover { transform: translateY(-1px); }
        @media (max-width:640px) {
          .grade-grid { grid-template-columns: repeat(4,1fr) !important; }
          .topic-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ── Header ── */}
      <header style={{
        background: T.card, borderBottom: `1px solid ${T.border}`,
        padding: '0 24px', height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: `0 2px 12px rgba(0,0,0,${dark?'0.2':'0.04'})`,
        gap: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => window.location.href = '/dashboard'} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '7px 14px', borderRadius: 50,
            border: `1px solid ${T.border}`, background: T.card,
            color: T.textSec, fontWeight: 700, fontSize: 12,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
            <ArrowLeft size={13} /> Dashboard
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/icons/icon-512.png" alt="EduPlay"
              style={{ width: 32, height: 32, borderRadius: 9, boxShadow: '0 2px 8px rgba(74,127,212,0.25)' }} />
            <div>
              <div style={{ fontWeight: 900, fontSize: 15, color: T.text, letterSpacing: '-0.01em' }}>
                Edu<span style={{ background:'linear-gradient(135deg,#4A7FD4,#2EC4B6)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Play</span>
              </div>
              <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 600 }}>Curriculum Browser</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Language toggle */}
          <div style={{ display: 'flex', background: dark ? '#252836' : '#F3F4F6', borderRadius: 10, padding: 3, gap: 2 }}>
            {(['en','he'] as const).map(l => (
              <button key={l} onClick={() => setLang(l)} style={{
                padding: '5px 12px', border: 'none', borderRadius: 7,
                background: langMode === l ? T.card : 'transparent',
                boxShadow: langMode === l ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                color: langMode === l ? T.text : T.textMuted,
                fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
              }}>
                {l === 'en' ? '🇺🇸 EN' : '🇮🇱 HE'}
              </button>
            ))}
          </div>
          {/* Dark mode */}
          <button onClick={() => setDark(v => !v)} style={{
            width: 34, height: 34, borderRadius: '50%',
            border: `1px solid ${T.border}`, background: T.inputBg,
            cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: T.textSec,
          }}>
            {dark ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </header>

      <div style={{ maxWidth: 1020, margin: '0 auto', padding: '28px 20px' }}>

        {/* Page title */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontWeight: 900, fontSize: 24, margin: 0, letterSpacing: '-0.02em', color: T.text }}>
            {langMode === 'en' ? 'Curriculum Browser' : 'מפת הלימודים'}
          </h1>
          <p style={{ color: T.textMuted, margin: '5px 0 0', fontSize: 13 }}>
            {langMode === 'en'
              ? 'Explore all topics by grade and subject. Click any topic to start a lesson.'
              : 'גלה את כל הנושאים לפי כיתה ומקצוע.'}
          </p>
        </div>

        {/* Subject tabs */}
        <div style={{ display: 'flex', background: dark ? '#252836' : '#F3F4F6', borderRadius: 14, padding: 4, gap: 3, marginBottom: 20, width: 'fit-content' }}>
          {SUBJECTS.map(subj => {
            const Icon   = subj.icon
            const active = selectedSubject.slug === subj.slug
            return (
              <button key={subj.slug} onClick={() => setSubj(subj)} style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '9px 18px', borderRadius: 10, border: 'none',
                background: active ? T.card : 'transparent',
                boxShadow: active ? `0 2px 8px rgba(0,0,0,0.08)` : 'none',
                color: active ? selSubj.color : T.textMuted,
                fontWeight: 800, fontSize: 13, cursor: 'pointer',
                fontFamily: 'inherit', transition: 'all 0.15s',
              }}>
                <Icon size={15} />
                {langMode === 'en' ? subj.label : subj.labelHe}
              </button>
            )
          })}
        </div>

        {/* Grade pills */}
        <div className="grade-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 8, marginBottom: 22 }}>
          {[0,1,2,3,4,5,6].map(grade => {
            const child  = CHILDREN.find(c => c.grade === grade)
            const active = selectedGrade === grade
            return (
              <button key={grade}
                className="grade-btn"
                onClick={() => setGrade(grade)}
                style={{
                  padding: '10px 6px', borderRadius: 14, border: 'none',
                  background: active ? selSubj.color : T.inputBg,
                  boxShadow: active ? `0 4px 14px ${selSubj.color}40` : 'none',
                  cursor: 'pointer', textAlign: 'center',
                  outline: active ? 'none' : `1px solid ${T.border}`,
                  fontFamily: 'inherit',
                }}
              >
                {child && <div style={{ fontSize: 18, marginBottom: 4, lineHeight: 1 }}>{child.emoji}</div>}
                <div style={{
                  fontSize: 10, fontWeight: 800,
                  color: active ? 'white' : T.textSec,
                  lineHeight: 1.2,
                }}>
                  {langMode === 'en' ? GRADE_LABELS[grade] : GRADE_LABELS_HE[grade]}
                </div>
              </button>
            )
          })}
        </div>

        {/* Child banner */}
        {childForGrade && (
          <div style={{
            background: T.card, borderRadius: 16, padding: '14px 18px',
            marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14,
            border: `1px solid ${T.border}`,
            boxShadow: `0 2px 8px rgba(0,0,0,${dark?'0.15':'0.04'})`,
            animation: 'slideUp 0.2s ease',
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              background: childForGrade.grad, fontSize: 22,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 4px 12px ${childForGrade.color}40`,
              flexShrink: 0,
            }}>
              {childForGrade.emoji}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: T.text }}>
                {childForGrade.name} {langMode === 'en' ? 'is in this grade' : 'לומד/ת בכיתה זו'}
              </div>
              <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>
                {topics.length} {langMode === 'en' ? 'topics available' : 'נושאים זמינים'} · {GRADE_LABELS[selectedGrade]}
              </div>
            </div>
            <button onClick={() => {
              const firstTopic = topics[0]
              const url = firstTopic
                ? `/lesson?childId=${childForGrade.id}&topicId=${firstTopic.id}`
                : `/lesson?childId=${childForGrade.id}`
              window.location.href = url
            }} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '9px 18px', borderRadius: 50, border: 'none',
              background: selSubj.color, color: 'white',
              fontWeight: 800, fontSize: 13, cursor: 'pointer',
              fontFamily: 'inherit', flexShrink: 0,
              boxShadow: `0 4px 12px ${selSubj.color}40`,
            }}>
              <Play size={13} fill="white" color="white" />
              {langMode === 'en' ? 'Start Lesson' : 'התחל שיעור'}
            </button>
          </div>
        )}

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 18 }}>
          <Search size={15} color={T.textMuted} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder={langMode === 'en' ? 'Search topics…' : 'חפש נושא…'}
            style={{
              width: '100%', padding: '11px 14px 11px 40px',
              borderRadius: 12, border: `1.5px solid ${T.border}`,
              background: T.inputBg, fontSize: 13, color: T.text,
              outline: 'none', fontFamily: 'inherit',
              transition: 'border-color 0.2s',
            }}
            onFocus={e => e.currentTarget.style.borderColor = selSubj.color}
            onBlur={e => e.currentTarget.style.borderColor = T.border}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              border: 'none', background: 'none', cursor: 'pointer', color: T.textMuted,
              fontSize: 16, lineHeight: 1, padding: 2,
            }}>×</button>
          )}
        </div>

        {/* Topics grid */}
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 48, color: T.textMuted }}>
            <Loader2 size={20} style={{ animation: 'spin 0.7s linear infinite' }} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Loading topics…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: 48,
            background: T.card, borderRadius: 20, border: `1px solid ${T.border}`,
          }}>
            <BookOpen size={36} style={{ opacity: 0.2, marginBottom: 12 }} />
            <div style={{ fontWeight: 800, fontSize: 16, color: T.text, marginBottom: 6 }}>
              {search ? 'No topics match your search' : (langMode === 'en' ? 'No topics yet' : 'אין נושאים עדיין')}
            </div>
            <div style={{ fontSize: 13, color: T.textMuted }}>
              {search ? 'Try a different search term' : `${GRADE_LABELS[selectedGrade]} ${selSubj.label} topics coming soon!`}
            </div>
          </div>
        ) : (
          <div className="topic-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 12, animation: 'slideUp 0.2s ease' }}>
            {filtered.map((topic, i) => (
              <div key={topic.id}
                className="topic-card"
                onClick={() => childForGrade && (window.location.href = `/lesson?childId=${childForGrade.id}&topicId=${topic.id}`)}
                style={{
                  background: T.card, borderRadius: 16, padding: '16px 18px',
                  border: `1px solid ${T.border}`,
                  boxShadow: `0 2px 8px rgba(0,0,0,${dark?'0.15':'0.04'})`,
                  cursor: childForGrade ? 'pointer' : 'default',
                  position: 'relative', overflow: 'hidden',
                }}
              >
                {/* Top accent */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: selSubj.color, opacity: 0.7 }} />

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  {/* Number badge */}
                  <div style={{
                    width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                    background: `${selSubj.color}15`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 900, fontSize: 13, color: selSubj.color,
                  }}>
                    {i + 1}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: 14, color: T.text, marginBottom: 3, lineHeight: 1.3 }}>
                      {langMode === 'en' ? topic.title_en : (topic.title_he || topic.title_en)}
                    </div>
                    {topic.description_en && (
                      <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.55, marginBottom: 8 }}>
                        {langMode === 'en' ? topic.description_en : (topic.description_he || topic.description_en)}
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 3,
                        padding: '3px 9px', borderRadius: 50,
                        background: `${selSubj.color}12`,
                      }}>
                        <Zap size={10} fill={selSubj.color} color={selSubj.color} />
                        <span style={{ fontSize: 11, fontWeight: 800, color: selSubj.color }}>+{topic.xp_reward} XP</span>
                      </div>
                      {topic.lesson_count > 0 && (
                        <span style={{ fontSize: 11, color: T.textMuted, fontWeight: 600 }}>
                          {topic.lesson_count} {langMode === 'en' ? 'lessons' : 'שיעורים'}
                        </span>
                      )}
                    </div>
                  </div>

                  {childForGrade && (
                    <ChevronRight size={16} color={T.textMuted} style={{ flexShrink: 0, marginTop: 2 }} />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Grade overview strip */}
        <div style={{
          marginTop: 36, background: T.card, borderRadius: 20,
          padding: 22, border: `1px solid ${T.border}`,
          boxShadow: `0 2px 8px rgba(0,0,0,${dark?'0.15':'0.04'})`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div style={{ width: 3, height: 18, borderRadius: 2, background: 'linear-gradient(180deg,#4A7FD4,#2EC4B6)' }} />
            <div style={{ fontWeight: 900, fontSize: 15, color: T.text }}>
              {langMode === 'en' ? 'Full Curriculum Overview' : 'סקירת תכנית לימודים'}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 8 }}>
            {[0,1,2,3,4,5,6].map(grade => {
              const child  = CHILDREN.find(c => c.grade === grade)
              const active = selectedGrade === grade
              return (
                <div key={grade} onClick={() => setGrade(grade)}
                  style={{
                    padding: '12px 8px', borderRadius: 12,
                    border: `1.5px solid ${active ? selSubj.color : T.border}`,
                    background: active ? `${selSubj.color}10` : T.inputBg,
                    cursor: 'pointer', textAlign: 'center',
                    transition: 'all 0.15s',
                    boxShadow: active ? `0 4px 12px ${selSubj.color}25` : 'none',
                  }}
                >
                  {child && <div style={{ fontSize: 20, marginBottom: 4 }}>{child.emoji}</div>}
                  <div style={{ fontSize: 10, fontWeight: 800, color: active ? selSubj.color : T.textSec, lineHeight: 1.2 }}>
                    {langMode === 'en' ? GRADE_LABELS[grade] : GRADE_LABELS_HE[grade]}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
