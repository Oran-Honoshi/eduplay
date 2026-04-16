'use client'
import { useState } from 'react'
import {
  Heart, Star, Flame, Play, BookOpen, Palette,
  Globe, ChevronRight, CheckCircle, Clock, Lock,
  Zap, Trophy, BarChart2, ShoppingBag,
} from 'lucide-react'

const SUBJECT_COLORS: Record<string, string> = {
  math:    '#4A7FD4',
  english: '#2EC4B6',
  hebrew:  '#FF6B6B',
}
const SUBJECT_BG: Record<string, string> = {
  math:    '#EFF6FF',
  english: '#F0FDFB',
  hebrew:  '#FFF0F0',
}
const SUBJECT_ICONS: Record<string, string> = {
  math:    '📐',
  english: '📖',
  hebrew:  '🇮🇱',
}

// Themes kept for Minecraft/Princess — but "plain" now uses the new SaaS design
const THEME_CONFIG: Record<string, any> = {
  minecraft: {
    bg: '#1A1A2E', panel: '#2D2D2D', border: '#444', text: '#F5F5DC',
    accent: '#5D9E2F', accent2: '#FFD700', radius: '4px',
    font: '"Press Start 2P",monospace', mascot: '🦔', dark: true,
  },
  princesses: {
    bg: '#FFF0F8', panel: '#FFFFFF', border: '#F4AFCF', text: '#3D1A2E',
    accent: '#E05BA0', accent2: '#FFD700', radius: '20px',
    font: '"Cinzel Decorative",serif', mascot: '🦄', dark: false,
  },
  plain: {
    bg: '#F9FAFB', panel: '#FFFFFF', border: '#E5E7EB', text: '#111827',
    accent: '#4A7FD4', accent2: '#2EC4B6', radius: '14px',
    font: '"Nunito",sans-serif', mascot: '🦉', dark: false,
  },
}

export default function ChildPortalClient({
  child, subjects, allTopics, progress, lastTopic, token,
}: any) {
  const theme = child.theme || 'plain'
  const T = THEME_CONFIG[theme] || THEME_CONFIG.plain
  const isPlain = theme === 'plain'

  const [selectedSubject, setSelectedSubject] = useState<string | null>(null)
  const [langMode, setLangMode] = useState(child.lang_screen || 'bilingual')
  const [progressMap, setProgressMap] = useState<any>(() => {
    const map: any = {}
    progress.forEach((p: any) => { map[p.topic_id] = p })
    return map
  })
  const [xpDisplay, setXpDisplay] = useState(child.xp_balance || 0)
  const [completedDisplay, setCompletedDisplay] = useState(
    progress.filter((p: any) => p.status === 'completed').length
  )
  const [inProgressDisplay, setInProgressDisplay] = useState(
    progress.filter((p: any) => p.status === 'in_progress').length
  )

  const filteredTopics = selectedSubject
    ? allTopics.filter((t: any) => t.subject?.slug === selectedSubject)
    : allTopics

  function getProgressPct(topicId: string) {
    const p = progressMap[topicId]
    if (!p) return 0
    return Math.round((p.steps_completed / (p.steps_total || 5)) * 100)
  }

  async function startLesson(topicId: string) {
    try {
      const res = await fetch(`/api/progress?childId=${child.id}`)
      if (res.ok) {
        const data = await res.json()
        if (data.progress) {
          const map: any = {}
          data.progress.forEach((p: any) => { map[p.topic_id] = p })
          setProgressMap(map)
          setCompletedDisplay(data.progress.filter((p: any) => p.status === 'completed').length)
          setInProgressDisplay(data.progress.filter((p: any) => p.status === 'in_progress').length)
        }
        if (data.xp !== undefined) setXpDisplay(data.xp)
      }
    } catch {}
    window.location.href = `/lesson?topicId=${topicId}&childId=${child.id}&token=${token}&theme=${child.theme || 'plain'}&lang=${langMode}`
  }

  const totalTopics = allTopics.length
  const overallPct = totalTopics > 0 ? Math.round((completedDisplay / totalTopics) * 100) : 0

  // For non-plain themes, render original-style layout
  if (!isPlain) {
    return (
      <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.font, overflowX: 'hidden' }}>
        <style>{`
          @media (max-width:640px) {
            .portal-stats { grid-template-columns: repeat(2,1fr) !important; }
            .portal-topics { grid-template-columns: repeat(2,1fr) !important; }
          }
        `}</style>

        <header style={{ background: T.panel, borderBottom: `2px solid ${T.border}`, padding: '0 16px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, background: `linear-gradient(135deg,${T.accent},${T.accent2})`, borderRadius: T.radius, overflow:'hidden', flexShrink: 0 }}>
              <img src="/icons/icon-512.png" alt="EduPlay" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}/>
            </div>
            <div style={{ fontWeight: 900, fontSize: 13, color: T.accent }}>{child.display_name}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: `${T.accent}15`, border: `1.5px solid ${T.accent}40`, borderRadius: 50, padding: '4px 12px' }}>
              <Star size={12} fill={T.accent2} color={T.accent2} />
              <span style={{ fontWeight: 900, fontSize: 13, color: T.accent }}>{xpDisplay.toLocaleString()}</span>
            </div>
          </div>
        </header>

        <div style={{ maxWidth: 900, margin: '0 auto', padding: 16 }}>
          {lastTopic && (
            <div onClick={() => startLesson(lastTopic.id)} style={{ background: `linear-gradient(135deg,${T.accent},${T.accent2})`, borderRadius: T.radius, padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', boxShadow: `0 8px 24px ${T.accent}30` }}>
              <Play size={20} fill="white" color="white" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Continue</div>
                <div style={{ fontSize: 15, fontWeight: 900, color: 'white' }}>{lastTopic.title_en}</div>
              </div>
              <ChevronRight size={18} color="white" />
            </div>
          )}

          <div className="portal-topics" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(160px,44vw),1fr))', gap: 12 }}>
            {filteredTopics.map((topic: any) => {
              const p = progressMap[topic.id]
              const pct = getProgressPct(topic.id)
              const subjColor = SUBJECT_COLORS[topic.subject?.slug] || T.accent
              const isCompleted = p?.status === 'completed'
              const isInProgress = p?.status === 'in_progress'
              return (
                <div key={topic.id} onClick={() => startLesson(topic.id)}
                  style={{ background: T.panel, border: `2px solid ${isInProgress ? subjColor : isCompleted ? '#27AE60' : T.border}`, borderRadius: T.radius, padding: 14, cursor: 'pointer', transition: 'transform 0.15s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'}>
                  <div style={{ fontWeight: 800, fontSize: 13, color: T.text, marginBottom: 6 }}>{topic.title_en}</div>
                  {p && (
                    <div style={{ height: 5, background: 'rgba(0,0,0,0.08)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: isCompleted ? '#27AE60' : subjColor, borderRadius: 99 }} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // ── PLAIN THEME — Full SaaS redesign ─────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', fontFamily: '"Nunito", sans-serif' }}>
      <style>{`
        @keyframes slideUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
        .topic-card { transition: transform 0.18s ease, box-shadow 0.18s ease !important; }
        .topic-card:hover { transform: translateY(-3px) !important; box-shadow: 0 10px 28px rgba(0,0,0,0.1) !important; }
        .subj-btn { transition: all 0.15s ease !important; }
        .action-btn { transition: all 0.18s ease !important; }
        .action-btn:hover { transform: translateY(-1px) !important; filter: brightness(1.05); }
        @media (max-width:640px) {
          .stats-grid { grid-template-columns: repeat(2,1fr) !important; }
          .topics-grid { grid-template-columns: repeat(2,1fr) !important; }
          .actions-grid { grid-template-columns: repeat(2,1fr) !important; }
          .lang-desktop { display: none !important; }
        }
      `}</style>

      {/* ── Header ── */}
      <header style={{
        background: 'white', borderBottom: '1px solid #F3F4F6',
        padding: '0 20px', height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
      }}>
        {/* Logo + greeting */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 12,
            background: 'linear-gradient(135deg, #4A7FD4, #2EC4B6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, boxShadow: '0 4px 12px rgba(74,127,212,0.3)', overflow:'hidden',
          }}>
            <img src="/icons/icon-512.png" alt="EduPlay" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}/>
          </div>
          <div>
            <div style={{ fontWeight: 900, fontSize: 15, color: '#111827', letterSpacing: '-0.02em' }}>
              Hi {child.display_name}! 👋
            </div>
            <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600 }}>
              Ready to learn something new?
            </div>
          </div>
        </div>

        {/* Right side: hearts, XP, streak, lang */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Hearts */}
          <div style={{ display: 'flex', gap: 2 }}>
            {[...Array(5)].map((_, i) => (
              <Heart key={i} size={14}
                fill={i < 3 ? '#EF4444' : 'none'}
                color={i < 3 ? '#EF4444' : '#D1D5DB'}
                style={{ opacity: i < 3 ? 1 : 0.4 }}
              />
            ))}
          </div>

          {/* XP */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '6px 14px', borderRadius: 50,
            background: '#FFFBEB', border: '1.5px solid #F59E0B50',
          }}>
            <Star size={13} fill="#F59E0B" color="#F59E0B" />
            <span style={{ fontWeight: 900, fontSize: 14, color: '#B45309' }}>
              {xpDisplay.toLocaleString()}
            </span>
          </div>

          {/* Streak */}
          {child.streak_current > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '6px 10px', borderRadius: 50,
              background: '#FFF1F2', border: '1.5px solid #FCA5A5',
            }}>
              <Flame size={13} color="#EF4444" fill="#EF4444" />
              <span style={{ fontWeight: 800, fontSize: 13, color: '#DC2626' }}>
                {child.streak_current}
              </span>
            </div>
          )}

          {/* Lang toggle — desktop only */}
          <div className="lang-desktop" style={{
            display: 'flex', background: '#F3F4F6',
            borderRadius: 10, overflow: 'hidden', padding: 3, gap: 2,
          }}>
            {[
              { id: 'en_only', label: '🇺🇸' },
              { id: 'bilingual', label: '🌐' },
              { id: 'he_only', label: '🇮🇱' },
            ].map(l => (
              <button key={l.id} onClick={() => setLangMode(l.id)}
                style={{
                  padding: '4px 10px', border: 'none', borderRadius: 7,
                  background: langMode === l.id ? 'white' : 'transparent',
                  boxShadow: langMode === l.id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                  fontSize: 13, cursor: 'pointer', transition: 'all 0.15s',
                }}>
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '20px 16px' }}>

        {/* ── Hero progress banner ── */}
        <div style={{
          background: 'linear-gradient(135deg, #4A7FD4, #2EC4B6)',
          borderRadius: 20, padding: '20px 24px', marginBottom: 20,
          boxShadow: '0 8px 28px rgba(74,127,212,0.3)',
          position: 'relative', overflow: 'hidden',
          animation: 'slideUp 0.25s ease',
        }}>
          <div style={{ position: 'absolute', top: -30, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -20, right: 80, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: 700, marginBottom: 4 }}>
                Overall Progress
              </div>
              <div style={{ fontSize: 30, fontWeight: 900, color: 'white', letterSpacing: '-0.02em', lineHeight: 1 }}>
                {completedDisplay}
                <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)' }}>/{totalTopics}</span>
                <span style={{ fontSize: 14, color: '#FFD700', marginLeft: 10, fontWeight: 800 }}>
                  {overallPct}%
                </span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <Trophy size={28} color="#FFD700" fill="#FFD700" />
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 4, fontWeight: 700 }}>
                {completedDisplay === 0 ? 'Just starting!' : completedDisplay < 5 ? 'Explorer' : completedDisplay < 15 ? 'Learner' : 'Champion'}
              </div>
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 99, height: 8, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'white', borderRadius: 99, width: `${overallPct}%`, transition: 'width 0.6s ease' }} />
          </div>
        </div>

        {/* ── Continue banner ── */}
        {lastTopic && (
          <div
            onClick={() => startLesson(lastTopic.id)}
            style={{
              background: 'white', borderRadius: 16, padding: '14px 18px',
              marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14,
              cursor: 'pointer', border: '1px solid #F3F4F6',
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
              transition: 'all 0.18s ease', animation: 'slideUp 0.3s ease',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(74,127,212,0.15)'
              ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.04)'
              ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
            }}
          >
            <div style={{
              width: 46, height: 46, borderRadius: 14, flexShrink: 0,
              background: 'linear-gradient(135deg, #4A7FD4, #2EC4B6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(74,127,212,0.3)',
            }}>
              <Play size={20} fill="white" color="white" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#9CA3AF', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 2 }}>
                Continue where you left off
              </div>
              <div style={{ fontWeight: 900, fontSize: 15, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>
                {lastTopic.title_en}
              </div>
              <div style={{ fontSize: 12, color: '#6B7280', marginTop: 1 }}>
                {lastTopic.subject?.label_en}
              </div>
            </div>
            <ChevronRight size={18} color="#9CA3AF" />
          </div>
        )}

        {/* ── Stats grid ── */}
        <div className="stats-grid" style={{
          display: 'grid', gridTemplateColumns: 'repeat(4,1fr)',
          gap: 10, marginBottom: 20,
        }}>
          {[
            { label: 'Completed',   value: completedDisplay,           icon: CheckCircle, color: '#10B981', bg: '#D1FAE5' },
            { label: 'In Progress', value: inProgressDisplay,          icon: Clock,       color: '#4A7FD4', bg: '#EFF6FF' },
            { label: 'Total XP',    value: xpDisplay.toLocaleString(), icon: Zap,         color: '#F59E0B', bg: '#FEF3C7' },
            { label: 'Streak',      value: `${child.streak_current || 0}d`, icon: Flame,  color: '#EF4444', bg: '#FEE2E2' },
          ].map(stat => {
            const Icon = stat.icon
            return (
              <div key={stat.label} style={{
                background: 'white', borderRadius: 16, padding: '14px 12px',
                border: '1px solid #F3F4F6', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                textAlign: 'center',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, margin: '0 auto 8px',
                  background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={16} color={stat.color} />
                </div>
                <div style={{ fontWeight: 900, fontSize: 17, color: stat.color, letterSpacing: '-0.01em' }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 700, marginTop: 2 }}>
                  {stat.label}
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Subject filter tabs ── */}
        <div style={{
          display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap',
        }}>
          <button
            className="subj-btn"
            onClick={() => setSelectedSubject(null)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 50,
              border: `1.5px solid ${!selectedSubject ? '#4A7FD4' : '#E5E7EB'}`,
              background: !selectedSubject ? '#EFF6FF' : 'white',
              color: !selectedSubject ? '#4A7FD4' : '#6B7280',
              fontWeight: 800, fontSize: 12, cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <BookOpen size={13} /> All Subjects
          </button>
          {subjects.map((subj: any) => {
            const color = SUBJECT_COLORS[subj.slug] || '#4A7FD4'
            const bg    = SUBJECT_BG[subj.slug] || '#EFF6FF'
            const active = selectedSubject === subj.slug
            return (
              <button key={subj.slug}
                className="subj-btn"
                onClick={() => setSelectedSubject(subj.slug)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', borderRadius: 50,
                  border: `1.5px solid ${active ? color : '#E5E7EB'}`,
                  background: active ? bg : 'white',
                  color: active ? color : '#6B7280',
                  fontWeight: 800, fontSize: 12, cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                <span>{SUBJECT_ICONS[subj.slug]}</span>
                {subj.label_en}
              </button>
            )
          })}
        </div>

        {/* ── Topics grid ── */}
        <div className="topics-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(170px, 44vw), 1fr))',
          gap: 12, marginBottom: 24,
        }}>
          {filteredTopics.map((topic: any) => {
            const p = progressMap[topic.id]
            const pct = getProgressPct(topic.id)
            const subjColor = SUBJECT_COLORS[topic.subject?.slug] || '#4A7FD4'
            const subjBg    = SUBJECT_BG[topic.subject?.slug] || '#EFF6FF'
            const isCompleted  = p?.status === 'completed'
            const isInProgress = p?.status === 'in_progress'

            return (
              <div
                key={topic.id}
                className="topic-card"
                onClick={() => startLesson(topic.id)}
                style={{
                  background: 'white', borderRadius: 16, padding: '14px 14px 12px',
                  cursor: 'pointer', position: 'relative', overflow: 'hidden',
                  border: `1.5px solid ${isInProgress ? subjColor + '60' : isCompleted ? '#10B98130' : '#F3F4F6'}`,
                  boxShadow: isInProgress ? `0 4px 16px ${subjColor}18` : '0 2px 8px rgba(0,0,0,0.04)',
                }}
              >
                {/* Top accent line */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                  background: isCompleted ? '#10B981' : subjColor,
                  opacity: isCompleted || isInProgress ? 1 : 0.3,
                }} />

                {/* Subject badge */}
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '2px 8px', borderRadius: 50,
                  background: subjBg, marginBottom: 8, marginTop: 4,
                }}>
                  <span style={{ fontSize: 10 }}>{SUBJECT_ICONS[topic.subject?.slug]}</span>
                  <span style={{ fontSize: 10, fontWeight: 800, color: subjColor }}>
                    {topic.subject?.label_en}
                  </span>
                </div>

                {/* Title */}
                <div style={{
                  fontWeight: 800, fontSize: 13, color: '#111827',
                  lineHeight: 1.4, marginBottom: 4,
                }}>
                  {topic.title_en}
                </div>

                {/* Hebrew title */}
                {topic.title_he && langMode !== 'en_only' && (
                  <div style={{
                    fontSize: 11, color: '#6B7280',
                    direction: 'rtl', textAlign: 'right',
                    fontFamily: '"Times New Roman",serif', marginBottom: 6,
                  }}>
                    {topic.title_he}
                  </div>
                )}

                {/* Progress bar */}
                {p ? (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ height: 5, background: '#F3F4F6', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 99,
                        width: `${pct}%`,
                        background: isCompleted ? '#10B981' : subjColor,
                        transition: 'width 0.4s ease',
                      }} />
                    </div>
                    <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 3, fontWeight: 600 }}>
                      {pct}% complete
                    </div>
                  </div>
                ) : <div style={{ marginBottom: 10 }} />}

                {/* Footer */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Star size={11} fill="#F59E0B" color="#F59E0B" />
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#B45309' }}>
                      +{topic.xp_reward}
                    </span>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 800,
                    padding: '3px 10px', borderRadius: 50,
                    background: isCompleted ? '#10B981' : isInProgress ? subjColor : `${subjColor}18`,
                    color: isCompleted || isInProgress ? 'white' : subjColor,
                  }}>
                    {isCompleted ? '✓ Done' : isInProgress ? 'Continue' : 'Start'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {filteredTopics.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '48px 20px',
            background: 'white', borderRadius: 20,
            border: '1px solid #F3F4F6',
          }}>
            <BookOpen size={36} style={{ opacity: 0.2, marginBottom: 12 }} />
            <div style={{ fontWeight: 800, fontSize: 15, color: '#374151', marginBottom: 4 }}>
              No topics yet for this subject
            </div>
            <div style={{ fontSize: 13, color: '#9CA3AF' }}>Check back soon!</div>
          </div>
        )}

        {/* ── Bottom actions ── */}
        <div className="actions-grid" style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 10, marginTop: 8,
        }}>
          {/* Collection */}
          <button
            className="action-btn"
            onClick={() => window.location.href = `/cards?childId=${child.id}&token=${token}`}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '13px', background: 'linear-gradient(135deg, #4A7FD4, #2EC4B6)',
              border: 'none', borderRadius: 14, fontWeight: 800, fontSize: 13,
              cursor: 'pointer', color: 'white', fontFamily: 'inherit',
              boxShadow: '0 4px 14px rgba(74,127,212,0.35)',
            }}
          >
            <Globe size={15} /> My Collection
          </button>

          {/* Theme */}
          <button
            className="action-btn"
            onClick={() => window.location.href = `/theme?childId=${child.id}&name=${child.display_name}&current=${theme}&returnTo=/play/${token}`}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '13px', background: 'white',
              border: '1.5px solid #E5E7EB', borderRadius: 14,
              fontWeight: 800, fontSize: 13, cursor: 'pointer',
              color: '#374151', fontFamily: 'inherit',
            }}
          >
            <Palette size={15} /> Theme
          </button>

          {/* Lang toggle — mobile only here */}
          <div style={{
            display: 'flex', background: '#F3F4F6',
            borderRadius: 14, overflow: 'hidden', padding: 3, gap: 2,
          }}>
            {[
              { id: 'en_only', label: '🇺🇸' },
              { id: 'bilingual', label: '🌐' },
              { id: 'he_only', label: '🇮🇱' },
            ].map(l => (
              <button key={l.id} onClick={() => setLangMode(l.id)}
                style={{
                  flex: 1, padding: '10px 4px', border: 'none', borderRadius: 10,
                  background: langMode === l.id ? 'white' : 'transparent',
                  boxShadow: langMode === l.id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                  fontSize: 14, cursor: 'pointer', transition: 'all 0.15s',
                  fontFamily: 'inherit',
                }}>
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}