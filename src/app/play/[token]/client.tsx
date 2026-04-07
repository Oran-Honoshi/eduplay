'use client'
import { useState } from 'react'

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
  minecraft:  { bg:'#1A1A2E', panel:'#2D2D2D', text:'#F5F5DC', accent:'#5D9E2F', accent2:'#FFD700', radius:'0px', font:'"Press Start 2P",monospace', mascot:'🦔' },
  princesses: { bg:'#FFF0F8', panel:'#FFFFFF', text:'#3D1A2E', accent:'#E05BA0', accent2:'#FFD700', radius:'20px', font:'"Cinzel Decorative",serif', mascot:'🦄' },
  plain:      { bg:'#F8F9FB', panel:'#FFFFFF', text:'#1E2D4E', accent:'#4A7FD4', accent2:'#2EC4B6', radius:'12px', font:'"Nunito",sans-serif', mascot:'🦉' },
}

export default function ChildPortalClient({ child, subjects, allTopics, progress, lastTopic, token }: any) {
  const theme = child.theme || 'plain'
  const T = THEME_CONFIG[theme] || THEME_CONFIG.plain
  const [selectedSubject, setSelectedSubject] = useState<string|null>(null)


  const filteredTopics = selectedSubject
    ? allTopics.filter((t: any) => t.subject?.slug === selectedSubject)
    : allTopics

  const completedCount = progress.filter((p: any) => p.status === 'completed').length
  const inProgressCount = progress.filter((p: any) => p.status === 'in_progress').length
  const totalXP = child.xp_balance || 0

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
  
async function startLesson(topicId: string) {
  // Refresh progress before navigating
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
      if (data.xp) setXpDisplay(data.xp)
    }
  } catch {}
  window.location.href = `/lesson?topicId=${topicId}&childId=${child.id}&token=${token}&theme=${child.theme || 'plain'}&lang=${langMode}`
}
  return (
    <div style={{ minHeight:'100vh', background:T.bg, color:T.text, fontFamily:'"Nunito",sans-serif' }}>

      {/* Header */}
      <header style={{ background:theme==='minecraft'?'rgba(0,0,0,0.8)':T.panel, borderBottom:`${theme==='minecraft'?'3px solid #5D9E2F':'1px solid rgba(0,0,0,0.08)'}`, padding:'0 20px', height:'60px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <div style={{ width:'32px', height:'32px', background:`linear-gradient(135deg,${T.accent},${T.accent2})`, borderRadius:T.radius, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px' }}>
            {T.mascot}
          </div>
          <div>
            <div style={{ fontFamily:T.font, fontSize:'11px', fontWeight:900, color:T.accent }}>EduPlay</div>
            <div style={{ fontSize:'11px', color:T.text, opacity:.6 }}>Hi {child.display_name}! 👋</div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          <div style={{ display:'flex', gap:'3px' }}>
            {[...Array(5)].map((_,i) => <span key={i} style={{ fontSize:'14px', opacity:i<3?1:.3 }}>❤️</span>)}
          </div>
          <div style={{ background:`${T.accent}20`, border:`2px solid ${T.accent}`, borderRadius:'50px', padding:'4px 12px', fontFamily:T.font, fontSize:'9px', color:T.accent, fontWeight:900 }}>
            {totalXP.toLocaleString()} XP
          </div>
          {child.streak_current > 0 && (
            <div style={{ background:'rgba(255,107,107,0.15)', border:'2px solid #FF6B6B', borderRadius:'50px', padding:'4px 10px', fontSize:'12px', fontWeight:800, color:'#FF6B6B' }}>
              🔥 {child.streak_current}
            </div>
          )}
        </div>
      </header>

      <div style={{ maxWidth:'860px', margin:'0 auto', padding:'20px 16px' }}>

        {/* Resume banner */}
        {lastTopic && (
          <div style={{ background:`linear-gradient(135deg,${T.accent},${T.accent2})`, borderRadius:T.radius, padding:'16px 20px', marginBottom:'20px', display:'flex', alignItems:'center', gap:'14px', boxShadow:`0 8px 24px ${T.accent}40` }}>
            <div style={{ fontSize:'32px' }}>▶️</div>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:T.font, fontSize:'9px', color:'rgba(255,255,255,0.8)', marginBottom:'3px' }}>CONTINUE WHERE YOU LEFT OFF</div>
              <div style={{ fontWeight:900, fontSize:'16px', color:'white' }}>{lastTopic.title_en}</div>
              <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.7)', marginTop:'2px' }}>{lastTopic.subject?.label_en}</div>
            </div>
            <button onClick={() => startLesson(lastTopic.id)}
              style={{ padding:'10px 20px', background:'white', border:'none', borderRadius:'50px', fontWeight:900, fontSize:'13px', color:T.accent, cursor:'pointer', whiteSpace:'nowrap' }}>
              Continue →
            </button>
          </div>
        )}

        {/* Stats row */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px', marginBottom:'20px' }}>
          {[
            { label:'Completed', value:completedDisplay, icon:'✅', color:'#27AE60' },
            { label:'In Progress', value:inProgressDisplay, icon:'▶️', color:T.accent },
            { label:'Total XP', value:xpDisplay.toLocaleString(), icon:'⭐', color:T.accent2 },          ].map(stat => (
            <div key={stat.label} style={{ background:T.panel, border:`1px solid rgba(0,0,0,0.08)`, borderRadius:T.radius, padding:'14px', textAlign:'center', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize:'22px', marginBottom:'4px' }}>{stat.icon}</div>
              <div style={{ fontFamily:T.font, fontSize:'14px', fontWeight:900, color:stat.color }}>{stat.value}</div>
              <div style={{ fontSize:'10px', color:T.text, opacity:.6, marginTop:'2px' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Subject filter */}
        <div style={{ display:'flex', gap:'8px', marginBottom:'16px', flexWrap:'wrap' }}>
          <button onClick={() => setSelectedSubject(null)}
            style={{ padding:'7px 16px', borderRadius:'50px', border:`2px solid ${!selectedSubject?T.accent:'rgba(0,0,0,0.1)'}`, background:!selectedSubject?`${T.accent}20`:T.panel, color:!selectedSubject?T.accent:T.text, fontWeight:800, fontSize:'12px', cursor:'pointer' }}>
            📚 All
          </button>
          {subjects.map((subj: any) => (
            <button key={subj.slug} onClick={() => setSelectedSubject(subj.slug)}
              style={{ padding:'7px 16px', borderRadius:'50px', border:`2px solid ${selectedSubject===subj.slug?(SUBJECT_COLORS[subj.slug]||T.accent):'rgba(0,0,0,0.1)'}`, background:selectedSubject===subj.slug?`${SUBJECT_COLORS[subj.slug]||T.accent}20`:T.panel, color:selectedSubject===subj.slug?(SUBJECT_COLORS[subj.slug]||T.accent):T.text, fontWeight:800, fontSize:'12px', cursor:'pointer' }}>
              {SUBJECT_ICONS[subj.slug]||'📚'} {subj.label_en}
            </button>
          ))}
        </div>

        {/* Topics grid */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:'12px' }}>
          {filteredTopics.map((topic: any) => {
            const p = progressMap[topic.id]
            const pct = getProgressPct(topic.id)
            const statusIcon = getStatusIcon(topic.id)
            const subjColor = SUBJECT_COLORS[topic.subject?.slug] || T.accent
            const isCompleted = p?.status === 'completed'
            const isInProgress = p?.status === 'in_progress'

            return (
              <div key={topic.id}
                onClick={() => startLesson(topic.id)}
                style={{ background:T.panel, border:`2px solid ${isInProgress?subjColor:isCompleted?'#27AE60':'rgba(0,0,0,0.08)'}`, borderRadius:T.radius, padding:'14px', cursor:'pointer', position:'relative', overflow:'hidden', transition:'transform 0.15s, box-shadow 0.15s', boxShadow:isInProgress?`0 4px 16px ${subjColor}30`:'0 2px 8px rgba(0,0,0,0.06)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform='translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow=`0 8px 24px ${subjColor}30` }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform='translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow=isInProgress?`0 4px 16px ${subjColor}30`:'0 2px 8px rgba(0,0,0,0.06)' }}>

                {/* Top color bar */}
                <div style={{ position:'absolute', top:0, left:0, right:0, height:'3px', background:subjColor }}/>

                <div style={{ display:'flex', alignItems:'flex-start', gap:'10px', marginTop:'4px' }}>
                  <div style={{ fontSize:'22px', flexShrink:0 }}>{statusIcon}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'4px' }}>
                      <span style={{ fontSize:'10px', fontWeight:800, background:`${subjColor}20`, color:subjColor, padding:'1px 7px', borderRadius:'50px' }}>
                        {SUBJECT_ICONS[topic.subject?.slug]} {topic.subject?.label_en}
                      </span>
                    </div>
                    <div style={{ fontWeight:800, fontSize:'13px', color:T.text, lineHeight:1.4, marginBottom:'6px' }}>{topic.title_en}</div>
                    {topic.title_he && (
                      <div style={{ fontSize:'11px', color:T.text, opacity:.6, direction:'rtl', textAlign:'right', fontFamily:'serif', marginBottom:'6px' }}>{topic.title_he}</div>
                    )}

                    {/* Progress bar */}
                    {p && (
                      <div style={{ marginBottom:'6px' }}>
                        <div style={{ height:'5px', background:'rgba(0,0,0,0.08)', borderRadius:'50px', overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${pct}%`, background:isCompleted?'#27AE60':subjColor, borderRadius:'50px', transition:'width 0.3s' }}/>
                        </div>
                        <div style={{ fontSize:'10px', color:T.text, opacity:.5, marginTop:'3px' }}>{pct}% complete</div>
                      </div>
                    )}

                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <span style={{ fontSize:'11px', fontWeight:800, color:T.accent2 }}>+{topic.xp_reward} XP</span>
                      <span style={{ fontSize:'11px', fontWeight:800, padding:'3px 10px', borderRadius:'50px', background:isCompleted?'#27AE60':isInProgress?subjColor:`${subjColor}20`, color:isCompleted||isInProgress?'white':subjColor }}>
                        {isCompleted?'Done!':isInProgress?'Continue':'Start'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {filteredTopics.length === 0 && (
          <div style={{ textAlign:'center', padding:'40px', background:T.panel, borderRadius:T.radius, border:'1px solid rgba(0,0,0,0.08)' }}>
            <div style={{ fontSize:'40px', marginBottom:'12px' }}>📭</div>
            <div style={{ fontWeight:800, fontSize:'16px', color:T.text }}>No topics yet for this subject</div>
            <div style={{ fontSize:'13px', color:T.text, opacity:.6, marginTop:'6px' }}>Check back soon!</div>
          </div>
        )}

        {/* Theme changer */}
        <div style={{ marginTop:'24px', display:'flex', justifyContent:'center', gap:'10px', flexWrap:'wrap' }}>
  <button onClick={() => window.location.href=`/theme?childId=${child.id}&name=${child.display_name}&current=${theme}&returnTo=/play/${token}`}
    style={{ padding:'10px 20px', background:T.panel, border:`2px solid rgba(0,0,0,0.1)`, borderRadius:'50px', fontWeight:800, fontSize:'12px', cursor:'pointer', color:T.text }}>
    🎨 Change Theme
  </button>
  <div style={{ display:'flex', background:T.panel, border:`2px solid rgba(0,0,0,0.1)`, borderRadius:'50px', overflow:'hidden' }}>
    {[
      { id:'en_only',   label:'🇺🇸 English' },
      { id:'bilingual', label:'🌐 Both' },
      { id:'he_only',   label:'🇮🇱 עברית' },
    ].map(l => (
      <button key={l.id} onClick={() => setLangMode(l.id)}
        style={{ padding:'10px 14px', border:'none', background:langMode===l.id?T.accent:`transparent`, color:langMode===l.id?'white':T.text, fontWeight:800, fontSize:'11px', cursor:'pointer' }}>
        {l.label}
      </button>
    ))}
  </div>
</div>
      </div>
    </div>
  )
}
