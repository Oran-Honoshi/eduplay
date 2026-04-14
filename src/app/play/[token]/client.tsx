'use client'
import { useState } from 'react'
import { Heart, Star, Flame, Play, BookOpen, Palette, ShoppingBag, Globe, ChevronRight } from 'lucide-react'

const SUBJECT_COLORS: any = {
  math:    '#4A7FD4',
  english: '#2EC4B6',
  hebrew:  '#FF6B6B',
}

const SUBJECT_ICONS: any = {
  math:    '📐',
  english: '📖',
  hebrew:  '🇮🇱',
}

const THEME_CONFIG: any = {
  minecraft:  { bg:'#1A1A2E', panel:'#2D2D2D', border:'#555', text:'#F5F5DC', accent:'#5D9E2F', accent2:'#FFD700', radius:'0px',  font:'"Press Start 2P",monospace', mascot:'🦔' },
  princesses: { bg:'#FFF0F8', panel:'#FFFFFF', border:'#F4AFCF', text:'#3D1A2E', accent:'#E05BA0', accent2:'#FFD700', radius:'20px', font:'"Cinzel Decorative",serif',   mascot:'🦄' },
  plain:      { bg:'#F8F9FB', panel:'#FFFFFF', border:'#EEF1F6', text:'#1E2D4E', accent:'#4A7FD4', accent2:'#2EC4B6', radius:'12px', font:'"Nunito",sans-serif',          mascot:'🦉' },
}

const mobileStyles = `
  @media (max-width: 640px) {
    .portal-stats { grid-template-columns: repeat(2,1fr) !important; }
    .portal-topics { grid-template-columns: repeat(2,1fr) !important; }
    .portal-actions { grid-template-columns: repeat(2,1fr) !important; }
    .portal-header-right { gap: 6px !important; }
    .portal-lang { display: none !important; }
  }
`

export default function ChildPortalClient({ child, subjects, allTopics, progress, lastTopic, token }: any) {
  const theme = child.theme || 'plain'
  const T = THEME_CONFIG[theme] || THEME_CONFIG.plain

  const [selectedSubject, setSelectedSubject] = useState<string|null>(null)
  const [langMode, setLangMode]               = useState(child.lang_screen || 'bilingual')
  const [progressMap, setProgressMap]         = useState<any>(() => {
    const map: any = {}
    progress.forEach((p: any) => { map[p.topic_id] = p })
    return map
  })
  const [xpDisplay, setXpDisplay]             = useState(child.xp_balance || 0)
  const [completedDisplay, setCompletedDisplay] = useState(
    progress.filter((p: any) => p.status === 'completed').length
  )
  const [inProgressDisplay, setInProgressDisplay] = useState(
    progress.filter((p: any) => p.status === 'in_progress').length
  )

  const filteredTopics = selectedSubject
    ? allTopics.filter((t: any) => t.subject?.slug === selectedSubject)
    : allTopics

  function getStatusIcon(topicId: string) {
    const p = progressMap[topicId]
    if (!p) return '⭕'
    if (p.status === 'completed') return '✅'
    if (p.status === 'in_progress') return '▶️'
    return '⭕'
  }

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

  return (
    <div style={{ minHeight:'100vh', background:T.bg, fontFamily:'"Nunito",sans-serif', overflowX:'hidden' }}>
      <style>{mobileStyles}</style>

      {/* Header */}
      <header style={{ background:T.panel, borderBottom:`2px solid ${T.border}`, padding:'0 16px', height:'56px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:100, boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <div style={{ width:'34px', height:'34px', background:`linear-gradient(135deg,${T.accent},${T.accent2})`, borderRadius:T.radius==='0px'?'4px':T.radius, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px' }}>
            {T.mascot}
          </div>
          <div>
            <div style={{ fontFamily:T.font, fontSize:'10px', fontWeight:900, color:T.accent, letterSpacing:T.font.includes('Press')?'0':'normal' }}>EduPlay</div>
            <div style={{ fontSize:'11px', color:T.text, opacity:.7 }}>Hi {child.display_name}! 👋</div>
          </div>
        </div>

        <div className="portal-header-right" style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          {/* Hearts */}
          <div style={{ display:'flex', gap:'2px' }}>
            {[...Array(5)].map((_,i) => (
              <Heart key={i} size={14} fill={i<3?'#FF6B6B':'none'} color={i<3?'#FF6B6B':'#D1D5DB'} style={{ opacity:i<3?1:0.4 }}/>
            ))}
          </div>

          {/* XP */}
          <div style={{ display:'flex', alignItems:'center', gap:'5px', background:`${T.accent}15`, border:`1.5px solid ${T.accent}40`, borderRadius:'50px', padding:'4px 12px' }}>
            <Star size={12} fill={T.accent2} color={T.accent2}/>
            <span style={{ fontWeight:900, fontSize:'13px', color:T.accent }}>{xpDisplay.toLocaleString()}</span>
          </div>

          {/* Streak */}
          {child.streak_current > 0 && (
            <div style={{ display:'flex', alignItems:'center', gap:'4px', background:'rgba(255,107,107,0.12)', border:'1.5px solid #FF6B6B', borderRadius:'50px', padding:'4px 10px' }}>
              <Flame size={12} color="#FF6B6B" fill="#FF6B6B"/>
              <span style={{ fontWeight:800, fontSize:'12px', color:'#FF6B6B' }}>{child.streak_current}</span>
            </div>
          )}

          {/* Lang toggle — hidden on mobile */}
          <div className="portal-lang" style={{ display:'flex', background:`${T.border}`, borderRadius:'50px', overflow:'hidden', border:`1px solid ${T.border}` }}>
            {[
              { id:'en_only', label:'🇺🇸' },
              { id:'bilingual', label:'🌐' },
              { id:'he_only', label:'🇮🇱' },
            ].map(l => (
              <button key={l.id} onClick={() => setLangMode(l.id)}
                style={{ padding:'5px 10px', border:'none', background:langMode===l.id?T.accent:'transparent', color:langMode===l.id?'white':T.text, fontWeight:800, fontSize:'13px', cursor:'pointer', transition:'all 0.15s' }}>
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div style={{ maxWidth:'900px', margin:'0 auto', padding:'16px' }}>

        {/* Resume banner */}
        {lastTopic && (
          <div style={{ background:`linear-gradient(135deg,${T.accent},${T.accent2})`, borderRadius:T.radius, padding:'16px 20px', marginBottom:'20px', display:'flex', alignItems:'center', gap:'14px', boxShadow:`0 8px 24px ${T.accent}30`, position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:'-20px', right:'-20px', width:'120px', height:'120px', borderRadius:'50%', background:'rgba(255,255,255,0.07)', pointerEvents:'none' }}/>
            <div style={{ width:'42px', height:'42px', borderRadius:T.radius, background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <Play size={20} fill="white" color="white"/>
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:'10px', fontWeight:800, color:'rgba(255,255,255,0.8)', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:'3px' }}>CONTINUE WHERE YOU LEFT OFF</div>
              <div style={{ fontWeight:900, fontSize:'15px', color:'white', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{lastTopic.title_en}</div>
              <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.7)', marginTop:'2px' }}>{lastTopic.subject?.label_en}</div>
            </div>
            <button onClick={() => startLesson(lastTopic.id)}
              style={{ display:'flex', alignItems:'center', gap:'6px', padding:'10px 18px', background:'white', border:'none', borderRadius:'50px', fontWeight:900, fontSize:'13px', color:T.accent, cursor:'pointer', whiteSpace:'nowrap', flexShrink:0 }}>
              Continue <ChevronRight size={14}/>
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="portal-stats" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'10px', marginBottom:'20px' }}>
          {[
            { label:'Completed',  value:completedDisplay,         icon:'✅', color:'#27AE60' },
            { label:'In Progress',value:inProgressDisplay,        icon:'▶️', color:T.accent  },
            { label:'Total XP',   value:xpDisplay.toLocaleString(),icon:'⭐', color:T.accent2 },
            { label:'Streak',     value:`${child.streak_current||0}d`, icon:'🔥', color:'#FF6B6B' },
          ].map(stat => (
            <div key={stat.label} style={{ background:T.panel, border:`1.5px solid ${T.border}`, borderRadius:T.radius, padding:'14px 10px', textAlign:'center', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize:'20px', marginBottom:'4px' }}>{stat.icon}</div>
              <div style={{ fontWeight:900, fontSize:'16px', color:stat.color }}>{stat.value}</div>
              <div style={{ fontSize:'10px', color:T.text, opacity:.6, marginTop:'2px', fontWeight:600 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Subject filter */}
        <div style={{ display:'flex', gap:'8px', marginBottom:'16px', flexWrap:'wrap' }}>
          <button onClick={() => setSelectedSubject(null)}
            style={{ display:'flex', alignItems:'center', gap:'6px', padding:'8px 16px', borderRadius:'50px', border:`2px solid ${!selectedSubject?T.accent:'rgba(0,0,0,0.1)'}`, background:!selectedSubject?`${T.accent}15`:T.panel, color:!selectedSubject?T.accent:T.text, fontWeight:800, fontSize:'12px', cursor:'pointer', transition:'all 0.15s' }}>
            <BookOpen size={14}/> All Subjects
          </button>
          {subjects.map((subj: any) => {
            const color = SUBJECT_COLORS[subj.slug] || T.accent
            const active = selectedSubject === subj.slug
            return (
              <button key={subj.slug} onClick={() => setSelectedSubject(subj.slug)}
                style={{ display:'flex', alignItems:'center', gap:'6px', padding:'8px 16px', borderRadius:'50px', border:`2px solid ${active?color:'rgba(0,0,0,0.1)'}`, background:active?`${color}15`:T.panel, color:active?color:T.text, fontWeight:800, fontSize:'12px', cursor:'pointer', transition:'all 0.15s' }}>
                {SUBJECT_ICONS[subj.slug]} {subj.label_en}
              </button>
            )
          })}
        </div>

        {/* Topics grid */}
        <div className="portal-topics" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(min(160px,44vw),1fr))', gap:'12px', marginBottom:'24px' }}>
          {filteredTopics.map((topic: any) => {
            const p          = progressMap[topic.id]
            const pct        = getProgressPct(topic.id)
            const statusIcon = getStatusIcon(topic.id)
            const subjColor  = SUBJECT_COLORS[topic.subject?.slug] || T.accent
            const isCompleted  = p?.status === 'completed'
            const isInProgress = p?.status === 'in_progress'

            return (
              <div key={topic.id} onClick={() => startLesson(topic.id)}
                style={{ background:T.panel, border:`2px solid ${isInProgress?subjColor:isCompleted?'#27AE60':T.border}`, borderRadius:T.radius, padding:'14px', cursor:'pointer', position:'relative', overflow:'hidden', transition:'transform 0.15s,box-shadow 0.15s', boxShadow:isInProgress?`0 4px 16px ${subjColor}25`:isCompleted?'0 4px 16px rgba(39,174,96,0.15)':'0 2px 8px rgba(0,0,0,0.04)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform='translateY(-3px)'; (e.currentTarget as HTMLElement).style.boxShadow=`0 10px 28px ${subjColor}30` }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform='translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow=isInProgress?`0 4px 16px ${subjColor}25`:'0 2px 8px rgba(0,0,0,0.04)' }}>

                {/* Top color strip */}
                <div style={{ position:'absolute', top:0, left:0, right:0, height:'3px', background:`linear-gradient(90deg,${subjColor},${subjColor}80)` }}/>

                <div style={{ marginTop:'6px' }}>
                  <div style={{ fontSize:'22px', marginBottom:'8px' }}>{statusIcon}</div>

                  <div style={{ display:'inline-flex', alignItems:'center', gap:'4px', padding:'2px 8px', borderRadius:'50px', background:`${subjColor}15`, marginBottom:'6px' }}>
                    <span style={{ fontSize:'10px' }}>{SUBJECT_ICONS[topic.subject?.slug]}</span>
                    <span style={{ fontSize:'10px', fontWeight:800, color:subjColor }}>{topic.subject?.label_en}</span>
                  </div>

                  <div style={{ fontWeight:800, fontSize:'13px', color:T.text, lineHeight:1.4, marginBottom:'4px' }}>{topic.title_en}</div>

                  {topic.title_he && langMode !== 'en_only' && (
                    <div style={{ fontSize:'11px', color:T.text, opacity:.55, direction:'rtl', textAlign:'right', fontFamily:'"Times New Roman",serif', marginBottom:'6px' }}>{topic.title_he}</div>
                  )}

                  {p && (
                    <div style={{ marginBottom:'8px' }}>
                      <div style={{ height:'5px', background:'rgba(0,0,0,0.06)', borderRadius:'50px', overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${pct}%`, background:isCompleted?'#27AE60':subjColor, borderRadius:'50px', transition:'width 0.4s ease' }}/>
                      </div>
                      <div style={{ fontSize:'10px', color:T.text, opacity:.5, marginTop:'3px', fontWeight:600 }}>{pct}% done</div>
                    </div>
                  )}

                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'4px' }}>
                      <Star size={11} fill={T.accent2} color={T.accent2}/>
                      <span style={{ fontSize:'11px', fontWeight:800, color:T.accent2 }}>+{topic.xp_reward}</span>
                    </div>
                    <span style={{ fontSize:'11px', fontWeight:800, padding:'3px 10px', borderRadius:'50px', background:isCompleted?'#27AE60':isInProgress?subjColor:`${subjColor}20`, color:isCompleted||isInProgress?'white':subjColor }}>
                      {isCompleted?'Done!':isInProgress?'Continue':'Start'}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {filteredTopics.length === 0 && (
          <div style={{ textAlign:'center', padding:'40px', background:T.panel, borderRadius:T.radius, border:`1.5px solid ${T.border}` }}>
            <div style={{ fontSize:'40px', marginBottom:'12px' }}>📭</div>
            <div style={{ fontWeight:800, fontSize:'16px', color:T.text, marginBottom:'6px' }}>No topics for this subject yet</div>
            <div style={{ fontSize:'13px', color:T.text, opacity:.6 }}>Check back soon!</div>
          </div>
        )}

        {/* Bottom actions */}
        <div className="portal-actions" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px', marginTop:'8px' }}>
          <button onClick={() => window.location.href=`/store?childId=${child.id}&token=${token}`}
            style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', padding:'12px', background:`linear-gradient(135deg,${T.accent},${T.accent2})`, border:'none', borderRadius:T.radius, fontWeight:800, fontSize:'13px', cursor:'pointer', color:'white', boxShadow:`0 4px 14px ${T.accent}30` }}>
            <ShoppingBag size={16}/> XP Store
          </button>

          <button onClick={() => window.location.href=`/theme?childId=${child.id}&name=${child.display_name}&current=${theme}&returnTo=/play/${token}`}
            style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', padding:'12px', background:T.panel, border:`2px solid ${T.border}`, borderRadius:T.radius, fontWeight:800, fontSize:'13px', cursor:'pointer', color:T.text }}>
            <Palette size={16}/> Theme
          </button>

          {/* Lang toggle — visible only here on mobile */}
          <div style={{ display:'flex', background:T.panel, border:`2px solid ${T.border}`, borderRadius:T.radius, overflow:'hidden' }}>
            {[
              { id:'en_only',   label:'🇺🇸' },
              { id:'bilingual', label:'🌐' },
              { id:'he_only',   label:'🇮🇱' },
            ].map(l => (
              <button key={l.id} onClick={() => setLangMode(l.id)}
                style={{ flex:1, padding:'12px 4px', border:'none', background:langMode===l.id?T.accent:'transparent', color:langMode===l.id?'white':T.text, fontWeight:800, fontSize:'14px', cursor:'pointer', transition:'all 0.15s' }}>
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}