'use client'
import { Pip } from '@/components/Pip'
import React, { useEffect, useRef, useState } from 'react'
import { Star, Play, BookOpen, Palette, ChevronRight, ChevronLeft } from 'lucide-react'
import { THEME_CONFIG, KidNavBar, KidOverlay, CollectionButton } from '@/components/theme'
import { readKidLang, saveKidLang, kidLabel, type KidLang } from '@/lib/kidPrefs'


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

  const [parentHere, setParentHere] = useState(false)
  useEffect(() => {
    fetch('/api/session/whoami').then(r => r.ok ? r.json() : null).then(d => setParentHere(!!d?.parent)).catch(() => {})
  }, [])
  async function backToParent() {
    await fetch('/api/session/logout', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ scope:'child' }) }).catch(() => {})
    window.location.href = '/dashboard'
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
        showToast(isHE ? 'לא הצלחנו לרענן את ההתקדמות' : "Couldn't refresh your progress")
      }
    } catch {
      showToast(isHE ? 'לא הצלחנו לרענן את ההתקדמות' : "Couldn't refresh your progress")
    }
    window.location.href = `/lesson?topicId=${topicId}&childId=${child.id}&token=${token}&theme=${child.theme || 'plain'}&lang=${langMode}`
  }



  // Calm look for the plain theme (older kids); themed worlds keep a soft wash.
  // Rubik everywhere for readability; the theme's display font only on the greeting.
  const H = { fontFamily: '"Rubik","Assistant",sans-serif' }
  const HG = { fontFamily: theme === 'plain' || theme === 'minecraft' ? H.fontFamily : T.fontHead }
  const L = (he: string, en: string) => (isHE ? he : en)
  const dark = theme === 'minecraft'
  const card: React.CSSProperties = { background:T.panel, border:`1.5px solid ${T.border}`, borderRadius: theme === 'minecraft' ? 4 : 24, boxShadow: dark ? T.shadow : 'none' }
  const big = (bg: string, fg = '#FFFFFF'): React.CSSProperties => ({ minHeight:60, padding:'0 26px', border:'none', borderRadius: theme === 'minecraft' ? 4 : 18, background:bg, color:fg, ...H, fontSize:20, fontWeight:800, cursor:'pointer', display:'inline-flex', alignItems:'center', justifyContent:'center', gap:8 })
  const task = pendingAssignments && pendingAssignments.length > 0 ? pendingAssignments[0] : null
  const lastP = lastTopic ? progressMap[lastTopic.id] : null
  const showContinue = lastTopic && lastP && lastP.status !== 'completed'
  const goAssignments = () => withSession(() => {
    // One task waiting → straight into it; several → the list to choose from.
    window.location.href = pendingAssignments.length === 1
      ? `/assignment?id=${pendingAssignments[0].id}&childId=${child.id}&token=${token}&theme=${theme}&lang=${langMode}`
      : `/assignments?childId=${child.id}&token=${token}&theme=${theme}&lang=${langMode}`
  })
  const subjLabel = (s: any) => isHE ? (s?.label_he || s?.label_en) : s?.label_en
  const topicTitle = (t: any) => isHE ? (t?.title_he || t?.title_en) : t?.title_en
  const SUBJ_MARK: any = { math:'1+2', hebrew:'אב', english:'Ab' }
  const SUBJ_TINT: any = { math:['#EAF0FF','#2148C0'], hebrew:['#FDECE7','#B4432A'], english:['#E3F4EF','#0B6B58'] }

  return (
    <div style={{ minHeight:'100vh', background:T.bg, fontFamily:'"Assistant","Nunito",sans-serif', color:T.text, overflowX:'hidden', position:'relative' }} dir={isHE ? 'rtl' : 'ltr'}>
      {T.pattern !== 'none' && <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, backgroundImage:T.pattern }}/>}

      {parentHere && (child.grade ?? 0) >= 4 && (
        <div style={{ position:'relative', zIndex:2, background:'#16213E', color:'#fff', display:'flex', alignItems:'center', gap:10, padding:'10px 16px', fontSize:16 }}>
          <span style={{ flex:1 }}>{L(`את/ה צופה במסך של ${child.display_name}`, `You're viewing ${child.display_name}'s screen`)}</span>
          <button onClick={backToParent} style={{ minHeight:40, padding:'0 14px', borderRadius:10, border:'none', background:'#fff', color:'#16213E', fontWeight:800, fontSize:15, cursor:'pointer', fontFamily:'inherit' }}>
            {L('חזרה להורה', 'Back to parent')}
          </button>
        </div>
      )}
      <div style={{ position:'relative', zIndex:1, maxWidth:'720px', margin:'0 auto', padding:'20px 18px 110px', display:'flex', flexDirection:'column', gap:18 }}>

        {/* Greeting */}
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <Pip theme={theme} pose="wave" size={theme === 'plain' ? 56 : 76} he={isHE} />
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ ...HG, fontSize:28, fontWeight:800, lineHeight:1.2 }}>{L(`היי ${child.display_name}!`, `Hi ${child.display_name}!`)}</div>
            <div style={{ fontSize:17, color:T.text2 }}>
              {child.streak_current > 0
                ? L(`${child.streak_current} ימים ברצף · ${xpDisplay.toLocaleString()} נקודות`, `${child.streak_current}-day streak · ${xpDisplay.toLocaleString()} XP`)
                : L('מוכנים להרפתקה של היום?', "Ready for today's adventure?")}
            </div>
          </div>
        </div>

        {/* Hero: the parent's task comes first, then "continue" */}
        {task ? (
          <button onClick={goAssignments} style={{ textAlign:'start', display:'flex', flexDirection:'column', gap:12, background:T.accent1, color:'#FFFFFF', border:'none', borderRadius: theme === 'minecraft' ? 4 : 28, padding:22, cursor:'pointer', boxShadow:`0 10px 24px ${T.accent1}40`, fontFamily:'inherit' }}>
            <span style={{ fontSize:16, fontWeight:700, opacity:.9 }}>
              {L('המשימה של היום', "Today's task")}{pendingAssignments.length > 1 ? L(` · עוד ${pendingAssignments.length - 1} מחכות`, ` · ${pendingAssignments.length - 1} more waiting`) : ''}
            </span>
            <span style={{ ...H, fontSize:26, fontWeight:800, lineHeight:1.25 }}><bdi>{task.title || L('משימה מההורים', 'A task from your parents')}</bdi></span>
            <span style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ flex:1, height:12, borderRadius:99, background:'rgba(255,255,255,0.3)' }}>
                <span style={{ display:'block', width:`${Math.round(100 * task.completedItems / Math.max(1, task.totalItems))}%`, height:12, borderRadius:99, background:'#FFFFFF' }}/>
              </span>
              <span style={{ fontWeight:800, fontSize:17 }}>{L(`${task.completedItems} מתוך ${task.totalItems}`, `${task.completedItems} of ${task.totalItems}`)}</span>
            </span>
            <span style={{ ...big('#FFFFFF', T.accent1), alignSelf:'flex-start' }}>
              {task.completedItems > 0 ? L('ממשיכים', 'Continue') : L('מתחילים', 'Start')}
              <ChevronRight size={20} style={isHE ? { transform:'scaleX(-1)' } : undefined}/>
            </span>
          </button>
        ) : showContinue ? null : (
          <div style={{ ...card, padding:18, display:'flex', alignItems:'center', gap:12 }}>
            <Pip theme={theme} pose="thumbs" size={52} he={isHE} />
            <div style={{ fontSize:18, fontWeight:700 }}>{L('אין משימות היום — בחרו משהו כיפי למטה!', 'No tasks today — pick something fun below!')}</div>
          </div>
        )}

        {showContinue && (
          <button onClick={() => startLesson(lastTopic.id)} style={{ ...card, textAlign:'start', padding:16, display:'flex', alignItems:'center', gap:14, cursor:'pointer', fontFamily:'inherit', color:T.text }}>
            <span style={{ width:56, height:56, flexShrink:0, borderRadius:16, background:(SUBJ_TINT[lastTopic.subject?.slug]||['#EAF0FF'])[0], color:(SUBJ_TINT[lastTopic.subject?.slug]||['','#2148C0'])[1], display:'flex', alignItems:'center', justifyContent:'center', ...H, fontSize:22, fontWeight:800 }} dir="ltr">{SUBJ_MARK[lastTopic.subject?.slug] || <Play size={24}/>}</span>
            <span style={{ flex:1, minWidth:0 }}>
              <span style={{ display:'block', fontSize:15, color:T.text2, fontWeight:700 }}>{L('להמשיך מאיפה שעצרתי', 'Continue where I stopped')}</span>
              <span style={{ display:'block', ...H, fontSize:19, fontWeight:700 }}>{topicTitle(lastTopic)}</span>
              <span style={{ display:'block', height:8, borderRadius:99, background:dark ? '#444' : '#EEEAE2', marginTop:6 }}>
                <span style={{ display:'block', width:`${getProgressPct(lastTopic.id)}%`, height:8, borderRadius:99, background:T.accent1 }}/>
              </span>
            </span>
            <span style={{ width:48, height:48, flexShrink:0, borderRadius:14, background:T.accent1, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Play size={22} fill="#fff" style={isHE ? { transform:'scaleX(-1)' } : undefined}/>
            </span>
          </button>
        )}

        {/* Free choice: subject tiles filter the one-at-a-time lesson card */}
        <div style={{ ...H, fontSize:21, fontWeight:700, marginTop:4 }}>{L('עוד דברים כיפיים', 'More fun stuff')}</div>
        <div style={{ display:'grid', gridTemplateColumns:`repeat(${Math.min(3, subjects.length + 1)}, minmax(0, 1fr))`, gap:10 }}>
          {[{ slug:null, label_he:'הכול', label_en:'All' }, ...subjects].map((subj: any) => {
            const active = selectedSubject === subj.slug
            const tint = SUBJ_TINT[subj.slug] || [T.panel2, T.accent1]
            return (
              <button key={subj.slug || 'all'} onClick={() => chooseSubject(subj.slug)} aria-pressed={active}
                style={{ ...card, minHeight:64, padding:'10px 12px', display:'flex', alignItems:'center', gap:10, cursor:'pointer', fontFamily:'inherit', color:T.text, border:`2px solid ${active ? T.accent1 : T.border}`, background: active ? (dark ? T.panel2 : `${T.accent1}12`) : T.panel }}>
                <span style={{ width:40, height:40, flexShrink:0, borderRadius:12, background:tint[0], color:tint[1], display:'flex', alignItems:'center', justifyContent:'center', ...H, fontSize:16, fontWeight:800 }} dir="ltr">{subj.slug ? SUBJ_MARK[subj.slug] || '★' : <BookOpen size={20}/>}</span>
                <span style={{ ...H, fontSize:18, fontWeight:700 }}>{subjLabel(subj)}</span>
              </button>
            )
          })}
        </div>

        {pageCount > 0 && currentTopic && (() => {
          const p = progressMap[currentTopic.id]
          const pct = getProgressPct(currentTopic.id)
          const isCompleted = p?.status === 'completed'
          const isInProgress = p?.status === 'in_progress'
          const tint = SUBJ_TINT[currentTopic.subject?.slug] || ['#EAF0FF', T.accent1]
          const arrow = (dirn: 'prev' | 'next') => {
            const disabled = dirn === 'prev' ? safePage === 0 : safePage >= pageCount - 1
            const Icon = dirn === 'prev' ? ChevronLeft : ChevronRight
            return (
              <button onClick={dirn === 'prev' ? goPrev : goNext} disabled={disabled} aria-label={dirn === 'prev' ? L('הקודם', 'Previous') : L('הבא', 'Next')}
                style={{ width:52, height:52, flexShrink:0, borderRadius:16, background:T.panel, border:`1.5px solid ${T.border}`, display:'flex', alignItems:'center', justifyContent:'center', cursor:disabled ? 'default' : 'pointer', opacity:disabled ? 0.35 : 1 }}>
                <Icon size={24} color={T.text} style={isHE ? { transform:'scaleX(-1)' } : undefined}/>
              </button>
            )
          }
          return (
            <div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
                {arrow('prev')}
                <div onMouseDown={e => handleDragStart(e.clientX)} onMouseUp={e => handleDragEnd(e.clientX)}
                  onTouchStart={e => handleDragStart(e.touches[0].clientX)} onTouchEnd={e => handleDragEnd(e.changedTouches[0].clientX)}
                  style={{ ...card, padding:20, width:'100%', maxWidth:380, userSelect:'none', touchAction:'pan-y', display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', gap:10 }}>
                  <span style={{ width:64, height:64, borderRadius:20, background:tint[0], color:tint[1], display:'flex', alignItems:'center', justifyContent:'center', ...H, fontSize:24, fontWeight:800 }} dir="ltr">{SUBJ_MARK[currentTopic.subject?.slug] || '★'}</span>
                  <span style={{ fontSize:15, fontWeight:700, color:T.text2 }}>{subjLabel(currentTopic.subject)}</span>
                  <span style={{ ...H, fontSize:21, fontWeight:700, lineHeight:1.3 }}>{topicTitle(currentTopic)}</span>
                  {currentTopic.title_he && langMode === 'bilingual' && (
                    <span dir="rtl" style={{ fontSize:16, color:T.text2 }}>{currentTopic.title_he}</span>
                  )}
                  {p && (
                    <span style={{ width:'100%' }}>
                      <span style={{ display:'block', height:8, background:dark ? '#444' : '#EEEAE2', borderRadius:99 }}>
                        <span style={{ display:'block', height:8, width:`${pct}%`, background:isCompleted ? '#12937A' : T.accent1, borderRadius:99 }}/>
                      </span>
                      <span style={{ display:'block', fontSize:14, color:T.text2, marginTop:4 }}>{isCompleted ? L('סיימת! אפשר שוב', 'Done! Play again') : L(`${pct}% הושלם`, `${pct}% done`)}</span>
                    </span>
                  )}
                  <button onClick={() => startLesson(currentTopic.id)} style={{ ...big(isCompleted ? '#12937A' : T.accent1), width:'100%' }}>
                    {isCompleted ? L('לשחק שוב', 'Play again') : isInProgress ? L('ממשיכים', 'Continue') : L('מתחילים', 'Start')}
                    <span style={{ fontSize:15, opacity:.85, display:'inline-flex', alignItems:'center', gap:3 }}><Star size={14} fill="currentColor"/>+{currentTopic.xp_reward}</span>
                  </button>
                </div>
                {arrow('next')}
              </div>
              {pageCount > 1 && pageCount <= 24 && (
                <div style={{ display:'flex', justifyContent:'center', flexWrap:'wrap', gap:6, marginTop:12 }}>
                  {filteredTopics.map((t: any, i: number) => (
                    <button key={t.id} onClick={() => setPage(i)} aria-label={L(`לשיעור ${i + 1}`, `Go to lesson ${i + 1}`)}
                      style={{ width:i === safePage ? 22 : 9, height:9, borderRadius:99, border:'none', padding:0, background:i === safePage ? T.accent1 : T.border, cursor:'pointer' }}/>
                  ))}
                </div>
              )}
              {pageCount > 24 && <div style={{ textAlign:'center', marginTop:10, fontSize:15, color:T.text2 }} dir="ltr">{safePage + 1} / {pageCount}</div>}
            </div>
          )
        })()}

        {pageCount === 0 && (
          <div style={{ ...card, textAlign:'center', padding:32 }}>
            <Pip theme={theme} pose="thumbs" size={64} he={isHE} />
            <div style={{ ...H, fontWeight:700, fontSize:19, marginTop:8 }}>{L('עוד אין כאן שיעורים', 'No lessons here yet')}</div>
          </div>
        )}

        {/* Small summary + world picker */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2, minmax(0, 1fr))', gap:10 }}>
          <div style={{ ...card, padding:14, display:'flex', alignItems:'center', gap:10 }}>
            <Star size={26} fill={T.accent2} color={T.accent2}/>
            <div><div style={{ ...H, fontSize:20, fontWeight:800 }}>{completedDisplay}</div><div style={{ fontSize:14, color:T.text2 }}>{L('שיעורים שסיימתי', 'Lessons done')}</div></div>
          </div>
          <button onClick={() => withSession(() => { window.location.href = `/theme?childId=${child.id}&name=${encodeURIComponent(child.display_name)}&current=${theme}&returnTo=/play/${token}&lang=${langMode}` })}
            style={{ ...card, padding:14, display:'flex', alignItems:'center', gap:10, cursor:'pointer', fontFamily:'inherit', color:T.text, textAlign:'start' }}>
            <Palette size={26} color={T.accent1}/>
            <div><div style={{ ...H, fontSize:18, fontWeight:700 }}>{L('איזה עולם?', 'My world')}</div><div style={{ fontSize:14, color:T.text2 }}>{L('להחליף מראה', 'Change the look')}</div></div>
          </button>
        </div>
      </div>

      {sessionFailed && (
        <KidOverlay position="top-banner">
          <div style={{ background:'#B4432A', color:'white', padding:'12px 16px', textAlign:'center', fontWeight:800, fontSize:16 }}>
            {L('לא הצלחנו להתחבר. סגרו את הלשונית ופתחו שוב את הקישור.', "We couldn't start your session. Please close this tab and open your play link again.")}
          </div>
        </KidOverlay>
      )}

      {toast && (
        <div style={{ position:'fixed', bottom:'96px', left:'50%', transform:'translateX(-50%)', zIndex:1000, background:'#16213E', color:'white', padding:'12px 18px', borderRadius:16, fontWeight:700, fontSize:15, maxWidth:'90vw', textAlign:'center' }}>
          {toast}
        </div>
      )}

      <CollectionButton childId={child.id} token={token} theme={theme} lang={langMode}/>
      <KidNavBar theme={theme} active="home" childId={child.id} token={token} lang={langMode}/>
    </div>
  )
}
