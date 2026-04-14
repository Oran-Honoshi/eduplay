'use client'
import { useState, useEffect, useRef } from 'react'
import { Play, Brain, Video, Dumbbell, X, CheckCircle, ChevronRight, Timer, Star } from 'lucide-react'

const TYPE_CONFIG: any = {
  exercise:   { icon: Dumbbell, label: 'Physical Activity', labelHe: 'פעילות גופנית', color: '#E63946', bg: '#E6394615' },
  brain_game: { icon: Brain,    label: 'Brain Game',        labelHe: 'משחק מח',       color: '#7209B7', bg: '#7209B715' },
  video:      { icon: Video,    label: 'Fun Video',         labelHe: 'סרטון כיף',     color: '#2EC4B6', bg: '#2EC4B615' },
}

export default function ReliefPage() {
  const [phase, setPhase]         = useState<'choose'|'intro'|'doing'|'done'>('choose')
  const [selectedType, setType]   = useState<string|null>(null)
  const [activity, setActivity]   = useState<any>(null)
  const [loading, setLoading]     = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [videoOpen, setVideoOpen] = useState(false)
  const [videoTime, setVideoTime] = useState(60)
  const intervalRef               = useRef<any>(null)
  const videoIntervalRef          = useRef<any>(null)

  const childId = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('childId') || '' : ''
  const grade = parseInt(typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('grade') || '0' : '0')
  const token = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('token') || '' : ''
  const returnTo = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('returnTo') || (token ? `/play/${token}` : '/dashboard') : '/dashboard'

  useEffect(() => {
    return () => {
      clearInterval(intervalRef.current)
      clearInterval(videoIntervalRef.current)
    }
  }, [])

  async function pickActivity(type: string) {
    setType(type)
    setLoading(true)
    try {
      const res = await fetch(`/api/relief?childId=${childId}&grade=${grade}&type=${type}`)
      const data = await res.json()
      setActivity(data.activity)
      if (data.activity) setCountdown(data.activity.duration_seconds || 60)
    } catch {}
    setLoading(false)
    setPhase('intro')
  }

  function startActivity() {
    setPhase('doing')
    if (activity?.type === 'video') {
      openVideo()
    } else {
      intervalRef.current = setInterval(() => {
        setCountdown(c => {
          if (c <= 1) {
            clearInterval(intervalRef.current)
            setPhase('done')
            recordCompletion()
            return 0
          }
          return c - 1
        })
      }, 1000)
    }
  }

  function openVideo() {
    setVideoOpen(true)
    setVideoTime(activity?.duration_seconds || 60)
    videoIntervalRef.current = setInterval(() => {
      setVideoTime(t => {
        if (t <= 1) {
          clearInterval(videoIntervalRef.current)
          setVideoOpen(false)
          setPhase('done')
          recordCompletion()
          return 0
        }
        return t - 1
      })
    }, 1000)
  }

  function closeVideo() {
    clearInterval(videoIntervalRef.current)
    setVideoOpen(false)
    setPhase('done')
    recordCompletion()
  }

  async function recordCompletion() {
    if (!childId || !activity) return
    try {
      await fetch('/api/relief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId, activityId: activity.id, xpSpent: 0 }),
      })
    } catch {}
  }

  function finish() { window.location.href = returnTo }
  function skip()   { clearInterval(intervalRef.current); window.location.href = returnTo }

  const cfg   = selectedType ? TYPE_CONFIG[selectedType] : TYPE_CONFIG.exercise
  const color = cfg?.color || '#4A7FD4'
  const pct   = activity ? Math.round((countdown / (activity.duration_seconds || 60)) * 100) : 0

  // Extract YouTube video ID from URL
  function getVideoId(url: string) {
    if (!url) return ''
    const match = url.match(/embed\/([a-zA-Z0-9_-]+)/)
    return match ? match[1] : ''
  }

  return (
    <div style={{ minHeight:'100vh', background:'#F9FAFB', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'"Nunito",sans-serif', padding:'20px' }}>

      {/* Decorative blobs */}
      <div style={{ position:'fixed', top:'-100px', left:'-100px', width:'400px', height:'400px', borderRadius:'50%', background:`radial-gradient(circle, ${color}15, transparent)`, pointerEvents:'none' }}/>
      <div style={{ position:'fixed', bottom:'-100px', right:'-100px', width:'400px', height:'400px', borderRadius:'50%', background:`radial-gradient(circle, ${color}10, transparent)`, pointerEvents:'none' }}/>

      {/* Video Modal */}
      {videoOpen && (
        <div style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.97)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
          {/* Progress bar */}
          <div style={{ position:'absolute', top:0, left:0, right:0, height:'4px', background:'rgba(255,255,255,0.1)' }}>
            <div style={{ height:'100%', background:`linear-gradient(90deg,${color},#F0A500)`, width:`${(videoTime/(activity?.duration_seconds||60))*100}%`, transition:'width 1s linear' }}/>
          </div>

          {/* Header */}
          <div style={{ position:'absolute', top:'16px', left:0, right:0, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 20px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'8px', color:'white' }}>
              <Video size={16}/>
              <span style={{ fontWeight:800, fontSize:'14px' }}>{activity?.title_en}</span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'6px', color:'rgba(255,255,255,0.7)', fontWeight:700, fontSize:'14px' }}>
                <Timer size={14}/> {videoTime}s
              </div>
              <button onClick={closeVideo}
                style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:'10px', padding:'8px 16px', color:'white', fontWeight:800, fontSize:'13px', cursor:'pointer', display:'flex', alignItems:'center', gap:'6px' }}>
                <CheckCircle size={14}/> Done
              </button>
            </div>
          </div>

          {/* Video */}
          <div style={{ width:'min(800px,90vw)', aspectRatio:'16/9', borderRadius:'16px', overflow:'hidden', boxShadow:'0 32px 64px rgba(0,0,0,0.8)' }}>
            <iframe
              src={`${activity?.url}?autoplay=1&rel=0&modestbranding=1&fs=0&iv_load_policy=3&controls=1`}
              style={{ width:'100%', height:'100%', border:'none' }}
              allow="autoplay; encrypted-media"
              sandbox="allow-scripts allow-same-origin allow-presentation"
              title={activity?.title_en}
            />
          </div>

          <div style={{ marginTop:'16px', color:'rgba(255,255,255,0.4)', fontSize:'12px', textAlign:'center', display:'flex', alignItems:'center', gap:'6px' }}>
            🔒 Safe video player · No ads · No suggestions · Auto-closes in {videoTime}s
          </div>
        </div>
      )}

      <div style={{ background:'white', borderRadius:'24px', padding:'36px', maxWidth:'520px', width:'100%', boxShadow:'0 20px 60px rgba(0,0,0,0.08)', border:'1px solid #F3F4F6', textAlign:'center' }}>

        {/* PHASE: CHOOSE TYPE */}
        {phase === 'choose' && (
          <>
            <div style={{ width:'56px', height:'56px', borderRadius:'16px', background:'linear-gradient(135deg,#4A7FD4,#2EC4B6)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
              <Star size={28} color="white" fill="white"/>
            </div>
            <h2 style={{ fontWeight:900, fontSize:'24px', color:'#111827', margin:'0 0 6px', letterSpacing:'-0.02em' }}>
              Break Time! 🎉
            </h2>
            <p style={{ fontSize:'15px', color:'#6B7280', margin:'0 0 28px', lineHeight:1.6 }}>
              You earned a break! What kind of activity do you want?
            </p>

            <div style={{ display:'flex', flexDirection:'column', gap:'12px', marginBottom:'24px' }}>
              {Object.entries(TYPE_CONFIG).map(([type, cfg]: any) => {
                const Icon = cfg.icon
                return (
                  <button key={type} onClick={() => pickActivity(type)}
                    style={{ display:'flex', alignItems:'center', gap:'16px', padding:'18px 20px', borderRadius:'16px', border:`1.5px solid ${cfg.color}30`, background:cfg.bg, cursor:'pointer', textAlign:'left', transition:'all 0.2s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform='translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow=`0 8px 24px ${cfg.color}20` }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform='translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow='none' }}>
                    <div style={{ width:'48px', height:'48px', borderRadius:'14px', background:`${cfg.color}20`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <Icon size={24} color={cfg.color}/>
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:800, fontSize:'16px', color:'#111827', marginBottom:'2px' }}>{cfg.label}</div>
                      <div style={{ fontSize:'13px', color:'#6B7280' }}>
                        {type === 'exercise' ? 'Get moving with fun physical challenges!' :
                         type === 'brain_game' ? 'Puzzles, riddles and brain teasers!' :
                         'Watch a short funny or educational clip!'}
                      </div>
                    </div>
                    <ChevronRight size={20} color="#9CA3AF"/>
                  </button>
                )
              })}
            </div>

            <button onClick={skip}
              style={{ background:'none', border:'none', fontSize:'13px', color:'#9CA3AF', cursor:'pointer', fontWeight:600 }}>
              Skip break
            </button>
          </>
        )}

        {/* PHASE: INTRO */}
        {phase === 'intro' && (
          <>
            {loading ? (
              <div style={{ padding:'40px', color:'#6B7280', fontSize:'16px' }}>Loading activity...</div>
            ) : activity ? (
              <>
                <div style={{ width:'64px', height:'64px', borderRadius:'18px', background:cfg.bg, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
                  {(() => { const Icon = cfg.icon; return <Icon size={32} color={color}/> })()}
                </div>
                <div style={{ display:'inline-flex', alignItems:'center', gap:'6px', padding:'4px 12px', borderRadius:'20px', background:cfg.bg, border:`1px solid ${color}30`, marginBottom:'12px' }}>
                  <Timer size={12} color={color}/>
                  <span style={{ fontSize:'12px', fontWeight:700, color, letterSpacing:'0.06em', textTransform:'uppercase' }}>
                    {cfg.label} · {activity.duration_seconds}s
                  </span>
                </div>
                <h2 style={{ fontWeight:900, fontSize:'24px', color:'#111827', margin:'0 0 8px', letterSpacing:'-0.02em' }}>
                  {activity.title_en}
                </h2>
                <p style={{ fontSize:'15px', color:'#6B7280', margin:'0 0 20px', lineHeight:1.6 }}>
                  {activity.description_en}
                </p>
                <div style={{ background:'#F9FAFB', border:`1.5px solid ${color}30`, borderRadius:'16px', padding:'18px', marginBottom:'24px', textAlign:'left' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'11px', fontWeight:700, color, letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:'10px' }}>
                    <ChevronRight size={12}/> INSTRUCTIONS
                  </div>
                  <p style={{ fontSize:'14px', color:'#374151', margin:0, lineHeight:1.7 }}>
                    {activity.instructions_en}
                  </p>
                </div>
                <div style={{ display:'flex', gap:'10px' }}>
                  <button onClick={() => setPhase('choose')}
                    style={{ flex:1, padding:'14px', borderRadius:'12px', border:'1.5px solid #E5E7EB', background:'white', color:'#6B7280', fontWeight:700, fontSize:'14px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' }}>
                    <X size={14}/> Back
                  </button>
                  <button onClick={startActivity}
                    style={{ flex:2, padding:'14px', borderRadius:'50px', border:'none', background:`linear-gradient(135deg,${color},${color}cc)`, color:'white', fontWeight:800, fontSize:'15px', cursor:'pointer', boxShadow:`0 4px 14px ${color}35`, display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}>
                    <Play size={16} fill="white"/>
                    {activity.type === 'video' ? 'Watch Video' : "Let's Go!"}
                  </button>
                </div>
              </>
            ) : (
              <div style={{ padding:'40px', color:'#6B7280' }}>No activity found. <button onClick={() => setPhase('choose')} style={{ color:'#4A7FD4', background:'none', border:'none', cursor:'pointer', fontWeight:700 }}>Try again</button></div>
            )}
          </>
        )}

        {/* PHASE: DOING */}
        {phase === 'doing' && activity?.type !== 'video' && (
          <>
            <div style={{ width:'64px', height:'64px', borderRadius:'18px', background:cfg.bg, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
              {(() => { const Icon = cfg.icon; return <Icon size={32} color={color}/> })()}
            </div>
            <h2 style={{ fontWeight:900, fontSize:'22px', color:'#111827', margin:'0 0 8px' }}>{activity.title_en}</h2>
            <p style={{ fontSize:'14px', color:'#6B7280', margin:'0 0 28px', lineHeight:1.6 }}>{activity.instructions_en}</p>

            {/* Countdown ring */}
            <div style={{ position:'relative', width:'140px', height:'140px', margin:'0 auto 24px' }}>
              <svg width="140" height="140" style={{ transform:'rotate(-90deg)' }}>
                <circle cx="70" cy="70" r="60" fill="none" stroke="#F3F4F6" strokeWidth="8"/>
                <circle cx="70" cy="70" r="60" fill="none" stroke={color} strokeWidth="8"
                  strokeDasharray={`${2*Math.PI*60}`}
                  strokeDashoffset={`${2*Math.PI*60*(1-pct/100)}`}
                  strokeLinecap="round"
                  style={{ transition:'stroke-dashoffset 1s linear' }}/>
              </svg>
              <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                <div style={{ fontWeight:900, fontSize:'36px', color:'#111827' }}>{countdown}</div>
                <div style={{ fontSize:'11px', color:'#9CA3AF', fontWeight:600 }}>seconds</div>
              </div>
            </div>

            <button onClick={() => { clearInterval(intervalRef.current); setPhase('done'); recordCompletion() }}
              style={{ padding:'12px 32px', borderRadius:'50px', border:'none', background:`linear-gradient(135deg,${color},${color}cc)`, color:'white', fontWeight:800, fontSize:'14px', cursor:'pointer', display:'flex', alignItems:'center', gap:'8px', margin:'0 auto' }}>
              <CheckCircle size={16}/> Done Early
            </button>
          </>
        )}

        {/* PHASE: DONE */}
        {phase === 'done' && (
          <>
            <div style={{ width:'80px', height:'80px', borderRadius:'50%', background:'linear-gradient(135deg,#10B981,#059669)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', boxShadow:'0 8px 24px #10B98135' }}>
              <CheckCircle size={40} color="white" fill="white"/>
            </div>
            <h2 style={{ fontWeight:900, fontSize:'26px', color:'#111827', margin:'0 0 8px', letterSpacing:'-0.02em' }}>
              Amazing job! 🌟
            </h2>
            <p style={{ fontSize:'15px', color:'#6B7280', margin:'0 0 24px', lineHeight:1.6 }}>
              You completed your break activity! Ready to keep learning?
            </p>
            <div style={{ background:'#FFFBEB', border:'1.5px solid #F59E0B40', borderRadius:'16px', padding:'16px', marginBottom:'24px', display:'flex', alignItems:'center', gap:'12px' }}>
              <div style={{ width:'40px', height:'40px', borderRadius:'12px', background:'#F59E0B20', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Star size={20} color="#F59E0B" fill="#F59E0B"/>
              </div>
              <div style={{ textAlign:'left' }}>
                <div style={{ fontWeight:900, fontSize:'18px', color:'#B45309' }}>+10 XP Bonus!</div>
                <div style={{ fontSize:'13px', color:'#92400E' }}>For completing your activity break</div>
              </div>
            </div>
            <button onClick={finish}
              style={{ width:'100%', padding:'16px', borderRadius:'50px', border:'none', background:'linear-gradient(135deg,#4A7FD4,#2EC4B6)', color:'white', fontWeight:800, fontSize:'16px', cursor:'pointer', boxShadow:'0 4px 14px #4A7FD435', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}>
              <Play size={16} fill="white"/> Continue Learning!
            </button>
          </>
        )}
      </div>
    </div>
  )
}