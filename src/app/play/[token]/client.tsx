'use client'
import { Pip } from '@/components/Pip'
import { useEffect, useRef, useState } from 'react'
import { Heart, Star, Flame, Play, BookOpen, Palette, Globe, ChevronRight, ChevronLeft } from 'lucide-react'
import { THEME_CONFIG, KidNavBar, KidOverlay, CollectionButton } from '@/components/theme'
import { readKidLang, saveKidLang, kidLabel, type KidLang } from '@/lib/kidPrefs'

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

const mobileStyles = `
  @media (max-width: 640px) {
    .portal-stats { grid-template-columns: repeat(2,1fr) !important; }
    .portal-actions { grid-template-columns: repeat(2,1fr) !important; }
    .portal-cards-tile { grid-column: span 2 !important; }
    .portal-header-right { gap: 6px !important; }
    .portal-lang { display: none !important; }
  }
`

// page.tsx is a Server Component and can't set cookies during render (Next 14 only
// allows that from Route Handlers/Server Actions/Middleware), so the session cookie
// has to be minted here on the client instead, via the from-token exchange route.
async function establishChildSession(token: string): Promise<boolean> {
  try {
    const res = await fetch('/api/session/from-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
    return res.ok
  } catch {
    return false
  }
}

export default function ChildPortalClient({ child, subjects, allTopics, progress, lastTopic, pendingAssignments, token }: any) {
  const theme = child.theme || 'plain'
  const T = THEME_CONFIG[theme] || THEME_CONFIG.plain

  // Fired synchronously on first render (not inside useEffect) so the request is
  // already in flight before the user can click anything — every handler below
  // awaits this same promise before touching a session-gated API or navigating.
  const [sessionPromise] = useState(() => establishChildSession(token))
  const [sessionFailed, setSessionFailed] = useState(false)
  const [toast, setToast] = useState<string|null>(null)

  useEffect(() => {
    sessionPromise.then(ok => { if (!ok) setSessionFailed(true) })
  }, [sessionPromise])

  function showToast(text: string) {
    setToast(text)
    setTimeout(() => setToast(null), 3500)
  }

  async function withSession(action: () => void) {
    const ok = await sessionPromise
    if (!ok) { setSessionFailed(true); return }
    action()
  }

  const [selectedSubject, setSelectedSubject] = useState<string|null>(null)
  const [langMode, setLangModeState]          = useState<KidLang>((child.lang_screen || 'bilingual') as KidLang)
  // Read the device-saved choice after mount (not in the initializer) so the
  // server-rendered HTML and the first client render match.
  useEffect(() => { setLangModeState(readKidLang(child.id, child.lang_screen)) }, [child.id, child.lang_screen])
  function setLangMode(l: string) { setLangModeState(l as KidLang); saveKidLang(l as KidLang, child.id) }
  const isHE = langMode === 'he_only'
  // Open the booklet on the topic the child was last working on — this used to
  // be a separate "continue where you left off" banner competing with the card.
  const [page, setPage]                       = useState(() => {
    const i = lastTopic ? allTopics.findIndex((t: any) => t.id === lastTopic.id) : -1
    return i >= 0 ? i : 0
  })
  const dragStartX                            = useRef<number|null>(null)
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

  function chooseSubject(slug: string | null) {
    setSelectedSubject(slug)
    setPage(0)
  }

  const pageCount = filteredTopics.length
  const safePage  = pageCount > 0 ? Math.min(page, pageCount - 1) : 0
  const currentTopic = filteredTopics[safePage]

  function goPrev() { if (safePage > 0) setPage(safePage - 1) }
  function goNext() { if (safePage < pageCount - 1) setPage(safePage + 1) }

  // Swipe/drag is deliberately gesture-direction-invariant: a physical left-drag
  // always means "next" and a physical right-drag always means "previous", in
  // either language — only the chevron icons get mirrored for RTL, not this math.
  function handleDragStart(clientX: number) { dragStartX.current = clientX }
  function handleDragEnd(clientX: number) {
    if (dragStartX.current === null) return
    const delta = clientX - dragStartX.current
    dragStartX.current = null
    if (delta > 40) goPrev()
    else if (delta < -40) goNext()
  }

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
    const ok = await sessionPromise
    if (!ok) { setSessionFailed(true); return }
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
      } else {
        showToast("⚠️ Couldn't refresh your progress — showing the last saved values")
      }
    } catch {
      showToast("⚠️ Couldn't refresh your progress — showing the last saved values")
    }
    window.location.href = `/lesson?topicId=${topicId}&childId=${child.id}&token=${token}&theme=${child.theme || 'plain'}&lang=${langMode}`
  }



  const THEME_DECOS: any = {
    minecraft:  { pattern: 'repeating-linear-gradient(0deg,rgba(93,158,47,0.06) 0,rgba(93,158,47,0.06) 1px,transparent 1px,transparent 32px),repeating-linear-gradient(90deg,rgba(93,158,47,0.06) 0,rgba(93,158,47,0.06) 1px,transparent 1px,transparent 32px)', corners: ['⛏️','💎','🌲','🧱'] },
    princesses: { pattern: 'radial-gradient(circle at 15% 15%,rgba(224,91,160,0.08) 0%,transparent 40%),radial-gradient(circle at 85% 85%,rgba(155,89,182,0.08) 0%,transparent 40%)', corners: ['🌸','✨','👑','🦋'] },
    plain:      { pattern: 'none', corners: [] },
    sports:     { pattern: 'none', corners: ['⚽','🏆','⭐','🎽'] },
  }
  const TD = THEME_DECOS[theme] || THEME_DECOS.plain
  return (
    <div style={{ minHeight:'100vh', background:T.bg, fontFamily:'"Nunito",sans-serif', overflowX:'hidden', position:'relative' }} dir={isHE ? 'rtl' : 'ltr'}>
      {TD.pattern !== 'none' && <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, backgroundImage:TD.pattern }}/>}
      {TD.corners.map((emoji: string, i: number) => (
        <div key={i} style={{ position:'fixed', top:i<2?'70px':'auto', bottom:i>=2?'20px':'auto', left:i%2===0?'12px':'auto', right:i%2===1?'12px':'auto', fontSize:'28px', opacity:0.18, pointerEvents:'none', zIndex:0, userSelect:'none' }}>{emoji}</div>
      ))}

      <style>{mobileStyles}</style>

      {/* Header */}
      <header style={{ background:T.panel, borderBottom:`2px solid ${T.border}`, padding:'0 16px', height:'56px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:100, boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <div style={{ width:'44px', height:'44px', background:'transparent', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Pip theme={theme} pose="wave" size={44} he={isHE} />
          </div>
          <div>
            <div style={{ fontFamily:T.fontHead, fontSize:'10px', fontWeight:900, color:T.accent1, letterSpacing:T.fontHead.includes('Press')?'0':'normal' }}>EduPlay</div>
            <div style={{ fontSize:'11px', color:T.text, opacity:.7 }} dir={isHE ? 'rtl' : 'ltr'}>{isHE ? `היי ${child.display_name}!` : `Hi ${child.display_name}!`}</div>
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
          <div style={{ display:'flex', alignItems:'center', gap:'5px', background:`${T.accent1}15`, border:`1.5px solid ${T.accent1}40`, borderRadius:'50px', padding:'4px 12px' }}>
            <Star size={12} fill={T.accent2} color={T.accent2}/>
            <span style={{ fontWeight:900, fontSize:'13px', color:T.accent1 }}>{xpDisplay.toLocaleString()}</span>
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
                style={{ padding:'5px 10px', border:'none', background:langMode===l.id?T.accent1:'transparent', color:langMode===l.id?'white':T.text, fontWeight:800, fontSize:'13px', cursor:'pointer', transition:'all 0.15s' }}>
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div style={{ maxWidth:'900px', margin:'0 auto', padding:'16px 16px 84px' }}>

        {/* Assignments banner — shown above Resume since a parent-assigned task
            isn't something the child picked, unlike the free-choice topic grid below */}
        {pendingAssignments && pendingAssignments.length > 0 && (
          <div style={{ background:'linear-gradient(135deg,#7C5CE0,#9B59B6)', borderRadius:T.radius, padding:'16px 20px', marginBottom:'20px', display:'flex', alignItems:'center', gap:'14px', boxShadow:'0 8px 24px rgba(124,92,224,0.3)', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:'-20px', right:'-20px', width:'120px', height:'120px', borderRadius:'50%', background:'rgba(255,255,255,0.07)', pointerEvents:'none' }}/>
            <div style={{ width:'42px', height:'42px', borderRadius:T.radius, background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:'20px' }}>
              📋
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:'10px', fontWeight:800, color:'rgba(255,255,255,0.8)', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:'3px' }}>
                {langMode === 'he_only' ? 'מטלות ממתינות' : 'ASSIGNMENTS WAITING'}
              </div>
              <div style={{ fontWeight:900, fontSize:'15px', color:'white' }}>
                {langMode === 'he_only'
                  ? (pendingAssignments.length === 1 ? 'יש לך מטלה אחת להשלים!' : `יש לך ${pendingAssignments.length} מטלות להשלים!`)
                  : (pendingAssignments.length === 1 ? 'You have 1 assignment to complete!' : `You have ${pendingAssignments.length} assignments to complete!`)}
              </div>
              {pendingAssignments[0].title && (
                <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.7)', marginTop:'2px' }}>{pendingAssignments[0].title}</div>
              )}
            </div>
            <button onClick={() => withSession(() => { window.location.href = `/assignments?childId=${child.id}&token=${token}&theme=${child.theme || 'plain'}&lang=${langMode}` })}
              style={{ display:'flex', alignItems:'center', gap:'6px', padding:'10px 18px', background:'white', border:'none', borderRadius:'50px', fontWeight:900, fontSize:'13px', color:'#7C5CE0', cursor:'pointer', whiteSpace:'nowrap', flexShrink:0 }}>
              {langMode === 'he_only' ? 'התחל' : 'Start'} <ChevronRight size={14}/>
            </button>
          </div>
        )}

        {/* Subject filter */}
        <div style={{ display:'flex', gap:'8px', marginBottom:'16px', flexWrap:'wrap' }}>
          <button onClick={() => chooseSubject(null)}
            style={{ display:'flex', alignItems:'center', gap:'6px', padding:'8px 16px', borderRadius:'50px', border:`2px solid ${!selectedSubject?T.accent1:'rgba(0,0,0,0.1)'}`, background:!selectedSubject?`${T.accent1}15`:T.panel, color:!selectedSubject?T.accent1:T.text, fontWeight:800, fontSize:'12px', cursor:'pointer', transition:'all 0.15s' }}>
            <BookOpen size={14}/> {isHE ? 'כל המקצועות' : 'All Subjects'}
          </button>
          {subjects.map((subj: any) => {
            const color = SUBJECT_COLORS[subj.slug] || T.accent1
            const active = selectedSubject === subj.slug
            return (
              <button key={subj.slug} onClick={() => chooseSubject(subj.slug)}
                style={{ display:'flex', alignItems:'center', gap:'6px', padding:'8px 16px', borderRadius:'50px', border:`2px solid ${active?color:'rgba(0,0,0,0.1)'}`, background:active?`${color}15`:T.panel, color:active?color:T.text, fontWeight:800, fontSize:'12px', cursor:'pointer', transition:'all 0.15s' }}>
                {SUBJECT_ICONS[subj.slug]} {isHE ? (subj.label_he || subj.label_en) : subj.label_en}
              </button>
            )
          })}
        </div>

        {/* Booklet lesson viewer — one lesson at a time instead of a full grid, so
            the subject/topic wall doesn't freeze less-confident kids. Arrow row and
            dot pager deliberately have no manual RTL position-pinning: dir on the
            root container above already flips their flex order via normal browser
            bidi, same mechanism the assignment-runner back-button relies on. Only
            the chevrons get an icon-mirror (scaleX(-1)), matching that precedent —
            the swipe math below stays direction-invariant regardless of language. */}
        {pageCount > 0 && currentTopic && (() => {
          const p           = progressMap[currentTopic.id]
          const pct         = getProgressPct(currentTopic.id)
          const statusIcon  = getStatusIcon(currentTopic.id)
          const subjColor   = SUBJECT_COLORS[currentTopic.subject?.slug] || T.accent1
          const isCompleted  = p?.status === 'completed'
          const isInProgress = p?.status === 'in_progress'
          const statusLabel = isHE
            ? (isCompleted ? 'הושלם!' : isInProgress ? 'המשך' : 'התחל')
            : (isCompleted ? 'Done!' : isInProgress ? 'Continue' : 'Start')

          return (
            <div style={{ marginBottom:'24px' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'12px' }}>
                <button onClick={goPrev} disabled={safePage === 0}
                  aria-label={isHE ? 'הקודם' : 'Previous'}
                  style={{ width:'36px', height:'36px', flexShrink:0, borderRadius:'50%', background:T.panel, border:`1.5px solid ${T.border}`, boxShadow:T.shadow, display:'flex', alignItems:'center', justifyContent:'center', cursor:safePage===0?'default':'pointer', opacity:safePage===0?0.4:1 }}>
                  <ChevronLeft size={18} color={T.text} style={isHE ? { transform:'scaleX(-1)' } : undefined}/>
                </button>

                <div
                  onMouseDown={e => handleDragStart(e.clientX)}
                  onMouseUp={e => handleDragEnd(e.clientX)}
                  onTouchStart={e => handleDragStart(e.touches[0].clientX)}
                  onTouchEnd={e => handleDragEnd(e.changedTouches[0].clientX)}
                  style={{ background:T.panel, border:`2px solid ${isInProgress?subjColor:isCompleted?'#27AE60':T.border}`, borderRadius:T.radius, padding:'20px', width:'100%', maxWidth:'360px', boxShadow:T.shadow, position:'relative', overflow:'hidden', userSelect:'none', touchAction:'pan-y' }}>

                  <div style={{ position:'absolute', top:0, left:0, right:0, height:'3px', background:`linear-gradient(90deg,${subjColor},${subjColor}80)` }}/>

                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center' }}>
                    <div style={{ width:'64px', height:'64px', borderRadius:'50%', background:`${subjColor}15`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'32px', marginBottom:'10px' }}>
                      {SUBJECT_ICONS[currentTopic.subject?.slug]}
                    </div>

                    <div style={{ display:'inline-flex', alignItems:'center', gap:'4px', padding:'2px 10px', borderRadius:'50px', background:`${subjColor}15`, marginBottom:'8px' }}>
                      <span style={{ fontSize:'11px', fontWeight:800, color:subjColor }}>
                        {isHE ? (currentTopic.subject?.label_he || currentTopic.subject?.label_en) : currentTopic.subject?.label_en}
                      </span>
                    </div>

                    <div style={{ fontSize:'20px', marginBottom:'6px' }}>{statusIcon}</div>

                    <div style={{ fontWeight:800, fontSize:'17px', color:T.text, lineHeight:1.4, marginBottom:'4px' }}>{isHE ? (currentTopic.title_he || currentTopic.title_en) : currentTopic.title_en}</div>

                    {currentTopic.title_he && langMode === 'bilingual' && (
                      <div style={{ fontSize:'13px', color:T.text, opacity:.55, direction:'rtl', fontFamily:'"Times New Roman",serif', marginBottom:'8px' }}>{currentTopic.title_he}</div>
                    )}

                    {p && (
                      <div style={{ width:'100%', marginBottom:'10px' }}>
                        <div style={{ height:'5px', background:'rgba(0,0,0,0.06)', borderRadius:'50px', overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${pct}%`, background:isCompleted?'#27AE60':subjColor, borderRadius:'50px', transition:'width 0.4s ease' }}/>
                        </div>
                        <div style={{ fontSize:'11px', color:T.text, opacity:.5, marginTop:'3px', fontWeight:600 }}>{pct}% {isHE ? 'הושלם' : 'done'}</div>
                      </div>
                    )}

                    <div style={{ display:'flex', alignItems:'center', gap:'4px', marginBottom:'12px' }}>
                      <Star size={12} fill={T.accent2} color={T.accent2}/>
                      <span style={{ fontSize:'12px', fontWeight:800, color:T.accent2 }}>+{currentTopic.xp_reward}</span>
                    </div>

                    <button onClick={() => startLesson(currentTopic.id)}
                      style={{ width:'100%', padding:'12px 20px', fontFamily:T.fontHead, fontSize:'14px', background:isCompleted?'#27AE60':subjColor, border:'none', color:'white', borderRadius:T.radius, cursor:'pointer', fontWeight:800 }}>
                      {isHE ? `${statusLabel} שיעור` : `${statusLabel} Lesson`}
                    </button>
                  </div>
                </div>

                <button onClick={goNext} disabled={safePage >= pageCount - 1}
                  aria-label={isHE ? 'הבא' : 'Next'}
                  style={{ width:'36px', height:'36px', flexShrink:0, borderRadius:'50%', background:T.panel, border:`1.5px solid ${T.border}`, boxShadow:T.shadow, display:'flex', alignItems:'center', justifyContent:'center', cursor:safePage>=pageCount-1?'default':'pointer', opacity:safePage>=pageCount-1?0.4:1 }}>
                  <ChevronRight size={18} color={T.text} style={isHE ? { transform:'scaleX(-1)' } : undefined}/>
                </button>
              </div>

              {pageCount > 1 && (
                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', marginTop:'14px' }}>
                  {filteredTopics.map((t: any, i: number) => (
                    <button key={t.id} onClick={() => setPage(i)}
                      aria-label={isHE ? `עבור לשיעור ${i+1}` : `Go to lesson ${i+1}`}
                      style={{ width:i===safePage?'22px':'8px', height:'8px', borderRadius:'50px', border:'none', background:i===safePage?T.accent1:T.border, cursor:'pointer', transition:'width 0.2s ease,background 0.2s ease', padding:0 }}/>
                  ))}
                </div>
              )}
            </div>
          )
        })()}

        {pageCount === 0 && (
          <div style={{ textAlign:'center', padding:'40px', background:T.panel, borderRadius:T.radius, border:`1.5px solid ${T.border}` }}>
            <div style={{ fontSize:'40px', marginBottom:'12px' }}>📭</div>
            <div style={{ fontWeight:800, fontSize:'16px', color:T.text, marginBottom:'6px' }}>{isHE ? 'אין עדיין נושאים למקצוע זה' : 'No topics for this subject yet'}</div>
            <div style={{ fontSize:'13px', color:T.text, opacity:.6 }}>{isHE ? 'בדוק שוב בקרוב!' : 'Check back soon!'}</div>
          </div>
        )}

        {/* Stats — below the lesson card so "what do I do now" is the first thing a child sees */}
        <div className="portal-stats" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'10px', marginTop:'16px', marginBottom:'8px' }}>
          {[
            { label:isHE?'הושלמו':'Completed',  value:completedDisplay,         icon:'✅', color:'#27AE60' },
            { label:isHE?'בתהליך':'In Progress',value:inProgressDisplay,        icon:'▶️', color:T.accent1  },
            { label:isHE?'נקודות':'Total XP',   value:xpDisplay.toLocaleString(),icon:'⭐', color:T.accent2 },
            { label:isHE?'ימים ברצף':'Streak',     value:`${child.streak_current||0}d`, icon:'🔥', color:'#FF6B6B' },
          ].map(stat => (
            <div key={stat.label} style={{ background:T.panel, border:`1.5px solid ${T.border}`, borderRadius:T.radius, padding:'14px 10px', textAlign:'center', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize:'20px', marginBottom:'4px' }}>{stat.icon}</div>
              <div style={{ fontWeight:900, fontSize:'16px', color:stat.color }}>{stat.value}</div>
              <div style={{ fontSize:'10px', color:T.text, opacity:.6, marginTop:'2px', fontWeight:600 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Bottom actions */}
        <div className="portal-actions" style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'10px', marginTop:'8px' }}>
          <button onClick={() => withSession(() => { window.location.href=`/theme?childId=${child.id}&name=${child.display_name}&current=${theme}&returnTo=/play/${token}&lang=${langMode}` })}
            style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', padding:'12px', background:T.panel, border:`2px solid ${T.border}`, borderRadius:T.radius, fontWeight:800, fontSize:'13px', cursor:'pointer', color:T.text }}>
            <Palette size={16}/> {kidLabel('theme', langMode)}
          </button>

          {/* Lang toggle — visible only here on mobile */}
          <div style={{ display:'flex', background:T.panel, border:`2px solid ${T.border}`, borderRadius:T.radius, overflow:'hidden' }}>
            {[
              { id:'en_only',   label:'🇺🇸' },
              { id:'bilingual', label:'🌐' },
              { id:'he_only',   label:'🇮🇱' },
            ].map(l => (
              <button key={l.id} onClick={() => setLangMode(l.id)}
                style={{ flex:1, padding:'12px 4px', border:'none', background:langMode===l.id?T.accent1:'transparent', color:langMode===l.id?'white':T.text, fontWeight:800, fontSize:'14px', cursor:'pointer', transition:'all 0.15s' }}>
                {l.label}
              </button>
            ))}
          </div>

        </div>
      </div>

      {sessionFailed && (
        <KidOverlay position="top-banner">
          <div style={{ background:'#C0392B', color:'white', padding:'12px 16px', textAlign:'center', fontWeight:800, fontSize:'13px', boxShadow:'0 2px 8px rgba(0,0,0,0.2)' }}>
            ⚠️ {isHE ? 'לא הצלחנו להתחבר. סגרו את הלשונית ופתחו שוב את הקישור.' : "We couldn't start your session. Please close this tab and open your play link again."}
          </div>
        </KidOverlay>
      )}

      {toast && (
        <div style={{ position:'fixed', bottom:'84px', left:'50%', transform:'translateX(-50%)', zIndex:1000, background:'#1E2D4E', color:'white', padding:'10px 18px', borderRadius:'50px', fontWeight:700, fontSize:'13px', boxShadow:'0 4px 16px rgba(0,0,0,0.25)', maxWidth:'90vw', textAlign:'center' }}>
          {toast}
        </div>
      )}

      <CollectionButton childId={child.id} token={token} theme={theme} lang={langMode}/>
      <KidNavBar theme={theme} active="home" childId={child.id} token={token} lang={langMode}/>
    </div>
  )
}
