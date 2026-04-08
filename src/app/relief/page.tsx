'use client'
import { useState, useEffect, useRef } from 'react'

const TYPE_ICONS: any = { exercise: '🏃', brain_game: '🧩', video: '🎬' }
const TYPE_LABELS: any = { exercise: 'Physical Activity', brain_game: 'Brain Game', video: 'Fun Video' }
const TYPE_COLORS: any = { exercise: '#E63946', brain_game: '#7209B7', video: '#2EC4B6' }

// Curated safe YouTube video IDs (no suggestions, no autoplay next)
const SAFE_VIDEOS: any = {
  animals: 'HkCKyGLsHpA',
  science: 'S9GgUbL4GHw',
  funny:   'GJGfMjO7fVY',
}

export default function ReliefPage() {
  const [activity, setActivity]     = useState<any>(null)
  const [loading, setLoading]       = useState(true)
  const [phase, setPhase]           = useState<'intro'|'doing'|'done'>('intro')
  const [countdown, setCountdown]   = useState(0)
  const [videoOpen, setVideoOpen]   = useState(false)
  const [videoTime, setVideoTime]   = useState(60)
  const intervalRef                 = useRef<any>(null)
  const videoIntervalRef            = useRef<any>(null)

  const childId = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('childId') || ''
    : ''
  const grade = parseInt(
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('grade') || '0'
      : '0'
  )
  const token = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('token') || ''
    : ''
  const returnTo = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('returnTo') || (token ? `/play/${token}` : '/dashboard')
    : '/dashboard'

  useEffect(() => {
    loadActivity()
    return () => {
      clearInterval(intervalRef.current)
      clearInterval(videoIntervalRef.current)
    }
  }, [])

  async function loadActivity() {
    try {
      const res = await fetch(`/api/relief?childId=${childId}&grade=${grade}`)
      const data = await res.json()
      setActivity(data.activity)
      if (data.activity) setCountdown(data.activity.duration_seconds || 60)
    } catch {}
    setLoading(false)
  }

  function startActivity() {
    setPhase('doing')
    if (activity?.type === 'video') {
      openVideo()
    } else {
      // Start countdown
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
        body: JSON.stringify({
          childId,
          activityId: activity.id,
          xpSpent: 0,
        }),
      })
    } catch {}
  }

  function skipActivity() {
    clearInterval(intervalRef.current)
    window.location.href = returnTo
  }

  function finish() {
    window.location.href = returnTo
  }

  const color = activity ? TYPE_COLORS[activity.type] || '#4A7FD4' : '#4A7FD4'
  const videoId = activity?.theme ? SAFE_VIDEOS[activity.theme] || SAFE_VIDEOS.funny : SAFE_VIDEOS.funny
  const pct = activity ? Math.round((countdown / (activity.duration_seconds || 60)) * 100) : 0

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#1E2D4E,#4A7FD4)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontFamily:'"Nunito",sans-serif', fontSize:'20px' }}>
      🎉 Loading your reward...
    </div>
  )

  if (!activity) {
    window.location.href = returnTo
    return null
  }

  return (
    <div style={{ minHeight:'100vh', background:`linear-gradient(135deg,${color}22,#0F1729)`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'"Nunito",sans-serif', padding:'20px' }}>

      {/* Video Modal — safe sandboxed player */}
      {videoOpen && (
        <div style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.97)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
          {/* Timer bar */}
          <div style={{ position:'absolute', top:0, left:0, right:0, height:'4px', background:'rgba(255,255,255,0.1)' }}>
            <div style={{ height:'100%', background:color, width:`${(videoTime/(activity?.duration_seconds||60))*100}%`, transition:'width 1s linear' }}/>
          </div>

          {/* Header */}
          <div style={{ position:'absolute', top:'16px', left:0, right:0, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 20px' }}>
            <div style={{ color:'white', fontWeight:800, fontSize:'14px' }}>
              🎬 {activity?.title_en}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
              <div style={{ color:'rgba(255,255,255,0.7)', fontWeight:700, fontSize:'14px' }}>
                ⏱ {videoTime}s
              </div>
              <button onClick={closeVideo}
                style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:'8px', padding:'6px 14px', color:'white', fontWeight:800, fontSize:'13px', cursor:'pointer' }}>
                ✓ Done
              </button>
            </div>
          </div>

          {/* Sandboxed YouTube iframe */}
          <div style={{ width:'min(800px,90vw)', aspectRatio:'16/9', borderRadius:'16px', overflow:'hidden', boxShadow:'0 32px 64px rgba(0,0,0,0.8)' }}>
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&disablekb=0&fs=0&iv_load_policy=3&cc_load_policy=0&controls=1`}
              style={{ width:'100%', height:'100%', border:'none' }}
              allow="autoplay; encrypted-media"
              sandbox="allow-scripts allow-same-origin allow-presentation"
              title="Fun video break"
            />
          </div>

          {/* Safety message */}
          <div style={{ marginTop:'16px', color:'rgba(255,255,255,0.4)', fontSize:'12px', textAlign:'center' }}>
            🔒 Safe video player · No ads · No suggestions · Auto-closes in {videoTime}s
          </div>
        </div>
      )}

      {/* Main card */}
      <div style={{ background:'rgba(255,255,255,0.06)', backdropFilter:'blur(20px)', borderRadius:'24px', padding:'36px', maxWidth:'520px', width:'100%', border:`2px solid ${color}40`, boxShadow:`0 32px 64px rgba(0,0,0,0.4)`, textAlign:'center' }}>

        {phase === 'intro' && (
          <>
            <div style={{ fontSize:'64px', marginBottom:'16px' }}>
              {TYPE_ICONS[activity.type]}
            </div>
            <div style={{ fontSize:'13px', fontWeight:700, color:color, marginBottom:'8px', letterSpacing:'2px', textTransform:'uppercase' }}>
              {TYPE_LABELS[activity.type]} · {activity.duration_seconds}s
            </div>
            <h2 style={{ fontFamily:'"Nunito",sans-serif', fontWeight:900, fontSize:'28px', color:'white', margin:'0 0 8px' }}>
              {activity.title_en}
            </h2>
            <p style={{ fontSize:'15px', color:'rgba(255,255,255,0.7)', margin:'0 0 24px', lineHeight:1.6 }}>
              {activity.description_en}
            </p>
            <div style={{ background:`${color}20`, border:`1px solid ${color}40`, borderRadius:'16px', padding:'18px', marginBottom:'24px', textAlign:'left' }}>
              <div style={{ fontSize:'12px', fontWeight:700, color:color, marginBottom:'8px' }}>📋 INSTRUCTIONS</div>
              <p style={{ fontSize:'14px', color:'rgba(255,255,255,0.85)', margin:0, lineHeight:1.7 }}>
                {activity.instructions_en}
              </p>
            </div>
            <div style={{ display:'flex', gap:'10px' }}>
              <button onClick={skipActivity}
                style={{ flex:1, padding:'14px', borderRadius:'12px', border:'1px solid rgba(255,255,255,0.15)', background:'rgba(255,255,255,0.05)', color:'rgba(255,255,255,0.6)', fontWeight:700, fontSize:'14px', cursor:'pointer' }}>
                Skip
              </button>
              <button onClick={startActivity}
                style={{ flex:2, padding:'14px', borderRadius:'12px', border:'none', background:`linear-gradient(135deg,${color},${color}88)`, color:'white', fontWeight:900, fontSize:'16px', cursor:'pointer', boxShadow:`0 8px 24px ${color}40` }}>
                {activity.type === 'video' ? '▶ Watch Video' : "🚀 Let's Go!"}
              </button>
            </div>
          </>
        )}

        {phase === 'doing' && activity.type !== 'video' && (
          <>
            <div style={{ fontSize:'64px', marginBottom:'16px' }}>{TYPE_ICONS[activity.type]}</div>
            <h2 style={{ fontWeight:900, fontSize:'24px', color:'white', margin:'0 0 8px' }}>{activity.title_en}</h2>
            <p style={{ fontSize:'14px', color:'rgba(255,255,255,0.7)', margin:'0 0 28px', lineHeight:1.6 }}>
              {activity.instructions_en}
            </p>

            {/* Countdown ring */}
            <div style={{ position:'relative', width:'140px', height:'140px', margin:'0 auto 24px' }}>
              <svg width="140" height="140" style={{ transform:'rotate(-90deg)' }}>
                <circle cx="70" cy="70" r="60" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8"/>
                <circle cx="70" cy="70" r="60" fill="none" stroke={color} strokeWidth="8"
                  strokeDasharray={`${2*Math.PI*60}`}
                  strokeDashoffset={`${2*Math.PI*60*(1-pct/100)}`}
                  strokeLinecap="round"
                  style={{ transition:'stroke-dashoffset 1s linear' }}/>
              </svg>
              <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                <div style={{ fontWeight:900, fontSize:'36px', color:'white' }}>{countdown}</div>
                <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.5)' }}>seconds</div>
              </div>
            </div>

            <button onClick={() => { clearInterval(intervalRef.current); setPhase('done'); recordCompletion() }}
              style={{ padding:'12px 32px', borderRadius:'12px', border:'none', background:`${color}`, color:'white', fontWeight:800, fontSize:'14px', cursor:'pointer' }}>
              ✓ Done Early
            </button>
          </>
        )}

        {phase === 'done' && (
          <>
            <div style={{ fontSize:'72px', marginBottom:'16px' }}>🌟</div>
            <h2 style={{ fontWeight:900, fontSize:'28px', color:'white', margin:'0 0 8px' }}>
              Amazing job!
            </h2>
            <p style={{ fontSize:'16px', color:'rgba(255,255,255,0.7)', margin:'0 0 28px' }}>
              You completed your break activity! Ready to keep learning?
            </p>
            <div style={{ background:'rgba(240,165,0,0.15)', border:'2px solid #F0A500', borderRadius:'16px', padding:'16px', marginBottom:'24px' }}>
              <div style={{ fontWeight:900, fontSize:'20px', color:'#F0A500' }}>+10 XP Bonus! 🎉</div>
              <div style={{ fontSize:'13px', color:'rgba(255,255,255,0.6)', marginTop:'4px' }}>For completing your activity break</div>
            </div>
            <button onClick={finish}
              style={{ width:'100%', padding:'16px', borderRadius:'12px', border:'none', background:'linear-gradient(135deg,#F0A500,#E63946)', color:'white', fontWeight:900, fontSize:'16px', cursor:'pointer', boxShadow:'0 8px 24px rgba(240,165,0,0.3)' }}>
              🚀 Continue Learning!
            </button>
          </>
        )}
      </div>
    </div>
  )
}
