'use client'
import { useState, useEffect } from 'react'
import {
  Heart, Star, Flame, Play, BookOpen,
  Palette, Globe, ChevronRight, X, Sparkles,
  CheckCircle, Zap,
} from 'lucide-react'

const SUBJECT_COLORS: any = {
  math:    '#4A7FD4',
  english: '#2EC4B6',
  hebrew:  '#EF4444',
}
const SUBJECT_ICONS: any = {
  math: '📐', english: '📖', hebrew: '🇮🇱',
}

const THEME_CONFIG: any = {
  minecraft:  { bg:'#1A1A2E', panel:'#2D2D2D', border:'#555',    text:'#F5F5DC', accent:'#5D9E2F', accent2:'#FFD700', radius:'0px',  font:'"Press Start 2P",monospace', mascot:'🦔', shadow:'4px 4px 0 rgba(0,0,0,0.5)' },
  princesses: { bg:'#FFF0F8', panel:'#FFFFFF', border:'#F4AFCF', text:'#3D1A2E', accent:'#E05BA0', accent2:'#FFD700', radius:'20px', font:'"Cinzel Decorative",serif',   mascot:'🦄', shadow:'0 8px 24px rgba(224,91,160,0.2)' },
  plain:      { bg:'#F9FAFB', panel:'#FFFFFF', border:'#E5E7EB', text:'#111827', accent:'#4A7FD4', accent2:'#F59E0B', radius:'14px', font:'"Nunito",sans-serif',          mascot:'🦉', shadow:'0 2px 12px rgba(0,0,0,0.06)' },
}

// ─── Card Unlock Modal ────────────────────────────────────────
function CardUnlockModal({ card, onClose }: { card: { id: string; name_en: string } | null; onClose: () => void }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    if (card) setTimeout(() => setVisible(true), 50)
    else setVisible(false)
  }, [card])
  if (!card) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, fontFamily: '"Nunito", system-ui, sans-serif',
      opacity: visible ? 1 : 0, transition: 'opacity 0.3s ease',
    }}>
      <style>{`
        @keyframes cardPop { 0%{transform:scale(0.5) rotate(-8deg);opacity:0} 70%{transform:scale(1.08) rotate(2deg)} 100%{transform:scale(1) rotate(0deg);opacity:1} }
        @keyframes starSpin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes confetti { 0%{transform:translateY(0) rotate(0deg);opacity:1} 100%{transform:translateY(-120px) rotate(720deg);opacity:0} }
        .card-pop { animation: cardPop 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards; }
      `}</style>
      {Array.from({ length: 12 }, (_, i) => (
        <div key={i} style={{
          position: 'absolute', left: `${8 + i * 7.5}%`, bottom: '38%',
          width: 10, height: 10, borderRadius: i % 3 === 0 ? '50%' : 2,
          background: ['#4A7FD4','#2EC4B6','#F59E0B','#EF4444','#8B5CF6','#10B981'][i % 6],
          animation: `confetti ${0.8 + (i % 4) * 0.25}s ease-out ${i * 0.07}s forwards`,
          pointerEvents: 'none',
        }} />
      ))}
      <div className="card-pop" style={{
        background: 'white', borderRadius: 28, padding: '40px 32px',
        maxWidth: 380, width: '100%', textAlign: 'center',
        boxShadow: '0 32px 80px rgba(0,0,0,0.35)', position: 'relative',
      }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, width: 28, height: 28, borderRadius: '50%', border: 'none', background: '#F3F4F6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280' }}>
          <X size={14} />
        </button>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg,#4A7FD4,#2EC4B6)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 28px rgba(74,127,212,0.4)', animation: 'starSpin 4s linear infinite' }}>
          <Globe size={38} color="white" />
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 14px', borderRadius: 20, marginBottom: 14, background: 'linear-gradient(135deg,#4A7FD4,#2EC4B6)' }}>
          <Sparkles size={12} color="white" fill="white" />
          <span style={{ fontSize: 11, fontWeight: 800, color: 'white', letterSpacing: '0.06em', textTransform: 'uppercase' }}>New Card Unlocked!</span>
        </div>
        <h2 style={{ fontWeight: 900, fontSize: 24, color: '#111827', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
          🎉 {card.name_en}
        </h2>
        <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 22px', lineHeight: 1.6 }}>
          You earned this card by completing a topic! Check your collection to see it.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 20px', borderRadius: 12, marginBottom: 20, background: '#FFFBEB', border: '1.5px solid #F59E0B30' }}>
          <Zap size={16} fill="#F59E0B" color="#F59E0B" />
          <span style={{ fontWeight: 900, fontSize: 15, color: '#B45309' }}>Topic Complete! +100 XP</span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 12, borderRadius: 50, border: '1.5px solid #E5E7EB', background: 'white', color: '#6B7280', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
            Keep Learning
          </button>
          <button onClick={() => window.location.href = '/cards'} style={{ flex: 1.4, padding: 12, borderRadius: 50, border: 'none', background: 'linear-gradient(135deg,#4A7FD4,#2EC4B6)', color: 'white', fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(74,127,212,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Globe size={14} /> View Collection
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Portal ──────────────────────────────────────────────
export default function ChildPortalClient({ child, subjects, allTopics, progress, lastTopic, token }: any) {
  const theme   = child.theme || 'plain'
  const T       = THEME_CONFIG[theme] || THEME_CONFIG.plain
  const isPlain = theme === 'plain'

  const [selectedSubject, setSubject]  = useState<string | null>(null)
  const [langMode, setLang]            = useState(child.lang_screen || 'bilingual')
  const [progressMap, setProgressMap]  = useState<any>(() => {
    const map: any = {}
    progress.forEach((p: any) => { map[p.topic_id] = p })
    return map
  })
  const [xpDisplay, setXp]            = useState(child.xp_balance || 0)
  const [completedCount, setCompleted] = useState(progress.filter((p: any) => p.status === 'completed').length)
  const [inProgressCount, setInProg]  = useState(progress.filter((p: any) => p.status === 'in_progress').length)
  const [awardedCard, setAwardedCard]  = useState<{ id: string; name_en: string } | null>(null)

  // Check for card award passed back via URL param after lesson completion
  useEffect(() => {
    const params   = new URLSearchParams(window.location.search)
    const cardName = params.get('newCard')
    const cardId   = params.get('cardId')
    if (cardName && cardId) {
      setAwardedCard({ id: cardId, name_en: decodeURIComponent(cardName) })
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  const filteredTopics = selectedSubject
    ? allTopics.filter((t: any) => t.subject?.slug === selectedSubject)
    : allTopics

  function getProgressPct(topicId: string) {
    const p = progressMap[topicId]
    if (!p) return 0
    return Math.round((p.steps_completed / (p.steps_total || 5)) * 100)
  }

  function getStatus(topicId: string) {
    return progressMap[topicId]?.status || 'not_started'
  }

  async function startLesson(topicId: string) {
    try {
      const res  = await fetch(`/api/progress?childId=${child.id}`)
      if (res.ok) {
        const data = await res.json()
        if (data.progress) {
          const map: any = {}
          data.progress.forEach((p: any) => { map[p.topic_id] = p })
          setProgressMap(map)
          setCompleted(data.progress.filter((p: any) => p.status === 'completed').length)
          setInProg(data.progress.filter((p: any) => p.status === 'in_progress').length)
        }
        if (data.xp !== undefined) setXp(data.xp)
      }
    } catch {}
    window.location.href = `/lesson?topicId=${topicId}&childId=${child.id}&token=${token}&theme=${theme}&lang=${langMode}`
  }

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: '"Nunito", system-ui, sans-serif', overflowX: 'hidden', color: T.text }}>
      <style>{`
        @keyframes slideUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .topic-card { transition: transform 0.18s ease, box-shadow 0.18s ease !important; }
        .topic-card:hover { transform: translateY(-3px) !important; }
        .subj-pill { transition: all 0.15s ease !important; }
        @media(max-width:640px) {
          .portal-stats  { grid-template-columns: repeat(2,1fr) !important; }
          .topic-grid    { grid-template-columns: repeat(2,1fr) !important; }
          .action-grid   { grid-template-columns: repeat(2,1fr) !important; }
          .lang-header   { display: none !important; }
        }
      `}</style>

      <CardUnlockModal card={awardedCard} onClose={() => setAwardedCard(null)} />

      {/* ── Header ── */}
      <header style={{
        background: theme === 'minecraft' ? 'rgba(0,0,0,0.82)' : T.panel,
        borderBottom: `${theme === 'minecraft' ? 4 : 2}px solid ${T.border}`,
        padding: '0 16px', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: isPlain ? '0 2px 12px rgba(0,0,0,0.05)' : 'none', gap: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {isPlain ? (
            <img src="/icons/icon-512.png" alt="EduPlay" style={{ width: 32, height: 32, borderRadius: 9, boxShadow: '0 2px 6px rgba(74,127,212,0.2)' }} />
          ) : (
            <div style={{ width: 34, height: 34, background: `linear-gradient(135deg,${T.accent},${T.accent2})`, borderRadius: theme === 'minecraft' ? 4 : T.radius, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
              {T.mascot}
            </div>
          )}
          <div>
            {isPlain
              ? <div style={{ fontWeight: 900, fontSize: 14, color: T.text }}>Edu<span style={{ background: 'linear-gradient(135deg,#4A7FD4,#2EC4B6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Play</span></div>
              : <div style={{ fontFamily: T.font, fontSize: theme === 'minecraft' ? '8px' : '11px', fontWeight: 900, color: T.accent }}>EduPlay</div>
            }
            <div style={{ fontSize: 11, color: T.text, opacity: 0.65 }}>Hi {child.display_name}! 👋</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Hearts */}
          <div style={{ display: 'flex', gap: 2 }}>
            {[...Array(5)].map((_, i) =>
              isPlain
                ? <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={i < 3 ? '#EF4444' : 'none'} stroke={i < 3 ? '#EF4444' : '#D1D5DB'} strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                : <Heart key={i} size={14} fill={i < 3 ? '#FF6B6B' : 'none'} color={i < 3 ? '#FF6B6B' : '#D1D5DB'} style={{ opacity: i < 3 ? 1 : 0.4 }} />
            )}
          </div>
          {/* XP */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 50, background: isPlain ? '#FFFBEB' : `${T.accent}18`, border: `1.5px solid ${isPlain ? '#F59E0B40' : `${T.accent}40`}` }}>
            <Star size={11} fill={isPlain ? '#F59E0B' : T.accent2} color={isPlain ? '#F59E0B' : T.accent2} />
            <span style={{ fontWeight: 900, fontSize: 13, color: isPlain ? '#B45309' : T.accent }}>{xpDisplay.toLocaleString()}</span>
          </div>
          {/* Streak */}
          {child.streak_current > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'rgba(239,68,68,0.12)', border: '1.5px solid #EF4444', borderRadius: 50, padding: '4px 9px' }}>
              <Flame size={12} color="#EF4444" fill="#EF4444" />
              <span style={{ fontWeight: 800, fontSize: 12, color: '#EF4444' }}>{child.streak_current}</span>
            </div>
          )}
          {/* Language */}
          <div className="lang-header" style={{ display: 'flex', background: isPlain ? '#F3F4F6' : T.border, borderRadius: 50, padding: 3, gap: 2 }}>
            {[{ id: 'en_only', label: '🇺🇸' }, { id: 'bilingual', label: '🌐' }, { id: 'he_only', label: '🇮🇱' }].map(l => (
              <button key={l.id} onClick={() => setLang(l.id)} style={{ padding: '4px 9px', border: 'none', borderRadius: 50, background: langMode === l.id ? (isPlain ? 'white' : T.accent) : 'transparent', boxShadow: langMode === l.id && isPlain ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', color: langMode === l.id && !isPlain ? 'white' : T.text, fontWeight: 800, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit' }}>
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '16px 16px 80px' }}>

        {/* Resume banner */}
        {lastTopic && (
          <div style={{ background: `linear-gradient(135deg,${T.accent},${T.accent2})`, borderRadius: T.radius, padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14, boxShadow: `0 8px 24px ${T.accent}35`, position: 'relative', overflow: 'hidden', animation: 'slideUp 0.25s ease' }}>
            <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', pointerEvents: 'none' }} />
            <div style={{ width: 42, height: 42, borderRadius: T.radius, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Play size={20} fill="white" color="white" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.75)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 3 }}>Continue where you left off</div>
              <div style={{ fontWeight: 900, fontSize: 15, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lastTopic.title_en}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>{lastTopic.subject?.label_en}</div>
            </div>
            <button onClick={() => startLesson(lastTopic.id)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '10px 18px', background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: 50, fontWeight: 900, fontSize: 13, color: T.accent, cursor: 'pointer', flexShrink: 0, fontFamily: 'inherit', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
              Continue <ChevronRight size={13} />
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="portal-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Completed',   value: completedCount,              icon: <CheckCircle size={18} color="#10B981" fill="#10B981" />, color: '#10B981' },
            { label: 'In Progress', value: inProgressCount,             icon: <Play size={18} color={T.accent} fill={T.accent} />,       color: T.accent  },
            { label: 'Total XP',    value: xpDisplay.toLocaleString(),  icon: <Zap size={18} color="#F59E0B" fill="#F59E0B" />,          color: '#F59E0B' },
            { label: 'Streak',      value: `${child.streak_current || 0}d`, icon: <Flame size={18} color="#EF4444" fill="#EF4444" />,   color: '#EF4444' },
          ].map(stat => (
            <div key={stat.label} style={{ background: T.panel, border: `1.5px solid ${T.border}`, borderRadius: T.radius, padding: '13px 10px', textAlign: 'center', boxShadow: T.shadow }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 5 }}>{stat.icon}</div>
              <div style={{ fontWeight: 900, fontSize: 17, color: stat.color, letterSpacing: '-0.01em' }}>{stat.value}</div>
              <div style={{ fontSize: 10, color: T.text, opacity: 0.55, marginTop: 2, fontWeight: 700 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Subject filter */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <button className="subj-pill" onClick={() => setSubject(null)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 50, border: `2px solid ${!selectedSubject ? T.accent : T.border}`, background: !selectedSubject ? `${T.accent}15` : T.panel, color: !selectedSubject ? T.accent : T.text, fontWeight: 800, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
            <BookOpen size={13} /> All
          </button>
          {subjects.map((subj: any) => {
            const color = SUBJECT_COLORS[subj.slug] || T.accent
            const active = selectedSubject === subj.slug
            return (
              <button key={subj.slug} className="subj-pill" onClick={() => setSubject(subj.slug)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 50, border: `2px solid ${active ? color : T.border}`, background: active ? `${color}15` : T.panel, color: active ? color : T.text, fontWeight: 800, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                {SUBJECT_ICONS[subj.slug]} {subj.label_en}
              </button>
            )
          })}
        </div>

        {/* Topics */}
        <div className="topic-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(160px,44vw),1fr))', gap: 12, marginBottom: 24 }}>
          {filteredTopics.map((topic: any) => {
            const status      = getStatus(topic.id)
            const pct         = getProgressPct(topic.id)
            const subjColor   = SUBJECT_COLORS[topic.subject?.slug] || T.accent
            const isCompleted = status === 'completed'
            const isInProg    = status === 'in_progress'
            return (
              <div key={topic.id} className="topic-card" onClick={() => startLesson(topic.id)} style={{ background: T.panel, border: `2px solid ${isCompleted ? '#10B981' : isInProg ? subjColor : T.border}`, borderRadius: T.radius, padding: 14, cursor: 'pointer', position: 'relative', overflow: 'hidden', boxShadow: isInProg ? `0 4px 16px ${subjColor}25` : isCompleted ? '0 4px 16px rgba(16,185,129,0.15)' : T.shadow }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: isCompleted ? '#10B981' : `linear-gradient(90deg,${subjColor},${subjColor}80)` }} />
                <div style={{ marginTop: 8 }}>
                  <div style={{ marginBottom: 8 }}>
                    {isCompleted
                      ? <CheckCircle size={22} color="#10B981" fill="#10B981" />
                      : isInProg
                        ? <Play size={22} color={subjColor} fill={subjColor} />
                        : <div style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${T.border}` }} />}
                  </div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 50, background: `${subjColor}15`, marginBottom: 7 }}>
                    <span style={{ fontSize: 10 }}>{SUBJECT_ICONS[topic.subject?.slug]}</span>
                    <span style={{ fontSize: 10, fontWeight: 800, color: subjColor }}>{topic.subject?.label_en}</span>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 13, color: T.text, lineHeight: 1.4, marginBottom: 4 }}>{topic.title_en}</div>
                  {langMode !== 'en_only' && topic.title_he && (
                    <div style={{ fontSize: 11, color: T.text, opacity: 0.5, direction: 'rtl', textAlign: 'right', fontFamily: '"Times New Roman",serif', marginBottom: 6 }}>{topic.title_he}</div>
                  )}
                  {progressMap[topic.id] && (
                    <div style={{ marginBottom: 8 }}>
                      <div style={{ height: 5, background: 'rgba(0,0,0,0.06)', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: isCompleted ? '#10B981' : subjColor, borderRadius: 99, transition: 'width 0.4s ease' }} />
                      </div>
                      <div style={{ fontSize: 10, color: T.text, opacity: 0.45, marginTop: 3, fontWeight: 600 }}>{pct}% done</div>
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Star size={11} fill="#F59E0B" color="#F59E0B" />
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#B45309' }}>+{topic.xp_reward}</span>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 9px', borderRadius: 50, background: isCompleted ? '#10B981' : isInProg ? subjColor : `${subjColor}18`, color: isCompleted || isInProg ? 'white' : subjColor }}>
                      {isCompleted ? 'Done!' : isInProg ? 'Continue' : 'Start'}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {filteredTopics.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, background: T.panel, borderRadius: T.radius, border: `1.5px solid ${T.border}` }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
            <div style={{ fontWeight: 800, fontSize: 16, color: T.text, marginBottom: 6 }}>No topics here yet</div>
            <div style={{ fontSize: 13, color: T.text, opacity: 0.6 }}>Check back soon!</div>
          </div>
        )}

        {/* Actions */}
        <div className="action-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
          <button onClick={() => window.location.href = `/cards?childId=${child.id}&token=${token}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '13px 10px', border: 'none', borderRadius: T.radius, background: `linear-gradient(135deg,${T.accent},${T.accent2})`, color: 'white', fontWeight: 800, fontSize: 13, cursor: 'pointer', boxShadow: `0 4px 14px ${T.accent}35`, fontFamily: 'inherit' }}>
            <Globe size={15} /> Collection
          </button>
          <button onClick={() => window.location.href = `/theme?childId=${child.id}&name=${child.display_name}&current=${theme}&returnTo=/play/${token}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '13px 10px', border: `2px solid ${T.border}`, borderRadius: T.radius, background: T.panel, color: T.text, fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', boxShadow: T.shadow }}>
            <Palette size={15} /> Theme
          </button>
          <div style={{ display: 'flex', background: T.panel, border: `2px solid ${T.border}`, borderRadius: T.radius, overflow: 'hidden' }}>
            {[{ id: 'en_only', label: '🇺🇸' }, { id: 'bilingual', label: '🌐' }, { id: 'he_only', label: '🇮🇱' }].map(l => (
              <button key={l.id} onClick={() => setLang(l.id)} style={{ flex: 1, padding: '13px 4px', border: 'none', background: langMode === l.id ? T.accent : 'transparent', color: langMode === l.id ? 'white' : T.text, fontWeight: 800, fontSize: 14, cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit' }}>
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
