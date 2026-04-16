'use client'
import { useState, useEffect, useRef } from 'react'
import {
  Play, Brain, Video, Dumbbell, X, CheckCircle,
  ChevronRight, Timer, Star, Zap, ArrowLeft,
  Volume2, Maximize2,
} from 'lucide-react'

// ─── Exercise illustrations (SVG-based, no external deps) ─────
// Each exercise type gets an animated SVG diagram
function ExerciseIllustration({ type, color }: { type: string; color: string }) {
  const size = 160

  if (type === 'exercise') {
    return (
      <svg width={size} height={size} viewBox="0 0 160 160" style={{ display: 'block' }}>
        <style>{`
          @keyframes jumpUp { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-18px)} }
          @keyframes armWave { 0%,100%{transform:rotate(-30deg)} 50%{transform:rotate(30deg)} }
          @keyframes legBend { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(20deg)} }
          .body-jump { animation: jumpUp 0.9s ease-in-out infinite; transform-origin: 80px 130px; }
          .arm-l { animation: armWave 0.9s ease-in-out infinite; transform-origin: 68px 85px; }
          .arm-r { animation: armWave 0.9s ease-in-out infinite reverse; transform-origin: 92px 85px; }
        `}</style>
        {/* Ground */}
        <ellipse cx="80" cy="148" rx="38" ry="6" fill={`${color}20`} />
        <g className="body-jump">
          {/* Body */}
          <ellipse cx="80" cy="105" rx="16" ry="22" fill={color} opacity="0.9" />
          {/* Head */}
          <circle cx="80" cy="75" r="18" fill={color} opacity="0.9" />
          {/* Face */}
          <circle cx="74" cy="73" r="2.5" fill="white" opacity="0.9" />
          <circle cx="86" cy="73" r="2.5" fill="white" opacity="0.9" />
          <path d="M74 80 Q80 85 86 80" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
          {/* Arms */}
          <g className="arm-l">
            <rect x="56" y="83" width="13" height="5" rx="2.5" fill={color} opacity="0.8" />
            <rect x="44" y="80" width="14" height="5" rx="2.5" fill={color} opacity="0.8" transform="rotate(-25 44 82)" />
          </g>
          <g className="arm-r">
            <rect x="91" y="83" width="13" height="5" rx="2.5" fill={color} opacity="0.8" />
            <rect x="102" y="80" width="14" height="5" rx="2.5" fill={color} opacity="0.8" transform="rotate(25 102 82)" />
          </g>
          {/* Legs */}
          <rect x="68" y="124" width="10" height="20" rx="5" fill={color} opacity="0.8" />
          <rect x="82" y="124" width="10" height="20" rx="5" fill={color} opacity="0.8" />
          {/* Shoes */}
          <ellipse cx="73" cy="144" rx="8" ry="4" fill={`${color}CC`} />
          <ellipse cx="87" cy="144" rx="8" ry="4" fill={`${color}CC`} />
        </g>
        {/* Stars */}
        {[30, 130, 80].map((x, i) => (
          <text key={i} x={x} y={[30, 25, 15][i]} style={{ fontSize: 12, animation: `jumpUp ${0.7 + i * 0.2}s ease-in-out ${i * 0.15}s infinite` }} fill={color} opacity="0.6">
            ★
          </text>
        ))}
      </svg>
    )
  }

  if (type === 'brain_game') {
    return (
      <svg width={size} height={size} viewBox="0 0 160 160">
        <style>{`
          @keyframes pulse { 0%,100%{opacity:0.4;transform:scale(1)} 50%{opacity:1;transform:scale(1.1)} }
          @keyframes float2 { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
          .brain-glow { animation: pulse 1.5s ease-in-out infinite; }
          .idea { animation: float2 2s ease-in-out infinite; }
        `}</style>
        {/* Brain shape */}
        <g className="brain-glow" style={{ transformOrigin: '80px 85px' }}>
          <ellipse cx="80" cy="88" rx="38" ry="32" fill={color} opacity="0.15" />
          <path d="M80 60 C55 60 48 72 48 82 C48 92 54 98 62 100 C64 108 72 115 80 115 C88 115 96 108 98 100 C106 98 112 92 112 82 C112 72 105 60 80 60 Z" fill={color} opacity="0.85" />
          {/* Brain wrinkles */}
          <path d="M65 75 Q72 70 80 75 Q88 80 95 75" stroke="white" strokeWidth="1.5" fill="none" opacity="0.5" strokeLinecap="round" />
          <path d="M62 88 Q72 83 80 88 Q88 93 98 88" stroke="white" strokeWidth="1.5" fill="none" opacity="0.5" strokeLinecap="round" />
          <path d="M65 100 Q72 96 80 100" stroke="white" strokeWidth="1.5" fill="none" opacity="0.5" strokeLinecap="round" />
          {/* Center divide */}
          <line x1="80" y1="62" x2="80" y2="114" stroke="white" strokeWidth="1" opacity="0.3" />
        </g>
        {/* Floating idea bulb */}
        <g className="idea" style={{ transformOrigin: '80px 35px' }}>
          <circle cx="80" cy="35" r="14" fill="#FFD700" opacity="0.9" />
          <path d="M75 42 L85 42 L85 48 L75 48 Z" fill="#FFD700" opacity="0.7" />
          <line x1="80" y1="22" x2="80" y2="17" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" />
          <line x1="90" y1="25" x2="94" y2="21" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" />
          <line x1="70" y1="25" x2="66" y2="21" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" />
          {/* Filament */}
          <path d="M76 32 Q80 36 84 32" stroke="white" strokeWidth="1.5" fill="none" />
        </g>
        {/* Floating question marks */}
        {[
          { x: 28, y: 55, delay: '0s' },
          { x: 125, y: 60, delay: '0.5s' },
          { x: 35, y: 108, delay: '1s' },
        ].map((dot, i) => (
          <text key={i} x={dot.x} y={dot.y} fill={color} opacity="0.5" style={{ fontSize: 16, animation: `pulse 1.8s ease-in-out ${dot.delay} infinite` }}>?</text>
        ))}
      </svg>
    )
  }

  // Video / default
  return (
    <svg width={size} height={size} viewBox="0 0 160 160">
      <style>{`
        @keyframes screenFlicker { 0%,100%{opacity:1} 50%{opacity:0.85} }
        .screen { animation: screenFlicker 2s ease-in-out infinite; }
      `}</style>
      {/* TV/Screen */}
      <rect x="20" y="35" width="120" height="80" rx="10" fill={`${color}20`} stroke={color} strokeWidth="2" />
      <rect x="26" y="41" width="108" height="68" rx="6" fill={color} opacity="0.12" />
      {/* Screen content */}
      <g className="screen">
        <rect x="30" y="45" width="100" height="60" rx="4" fill={color} opacity="0.15" />
        {/* Play button */}
        <circle cx="80" cy="75" r="20" fill={color} opacity="0.8" />
        <polygon points="73,65 73,85 95,75" fill="white" opacity="0.95" />
      </g>
      {/* Stand */}
      <rect x="68" y="115" width="24" height="8" rx="2" fill={color} opacity="0.5" />
      <rect x="55" y="122" width="50" height="5" rx="2.5" fill={color} opacity="0.4" />
      {/* Antenna dots */}
      <circle cx="50" cy="30" r="4" fill={color} opacity="0.7" />
      <circle cx="110" cy="30" r="4" fill={color} opacity="0.7" />
      {/* Signal waves */}
      {[1, 2, 3].map(i => (
        <path key={i}
          d={`M ${50 + i * 6} ${30 - i * 4} Q ${50 + i * 8} ${22 - i * 3} ${50 + i * 10} ${30 - i * 4}`}
          stroke={color} strokeWidth="1.5" fill="none" opacity={0.6 - i * 0.15}
          strokeLinecap="round"
        />
      ))}
    </svg>
  )
}

// ─── Type config ──────────────────────────────────────────────
const TYPE_CONFIG: any = {
  exercise:   { icon: Dumbbell, label: 'Physical Activity', labelHe: 'פעילות גופנית', color: '#EF4444', bg: '#FEF2F2', desc: 'Get moving with fun physical challenges!' },
  brain_game: { icon: Brain,    label: 'Brain Game',        labelHe: 'משחק מח',       color: '#8B5CF6', bg: '#F5F3FF', desc: 'Puzzles, riddles and brain teasers!'     },
  video:      { icon: Video,    label: 'Fun Video',         labelHe: 'סרטון כיף',     color: '#2EC4B6', bg: '#F0FDFB', desc: 'Watch a short educational clip!'         },
}

export default function ReliefPage() {
  const [phase, setPhase]         = useState<'choose' | 'intro' | 'doing' | 'done'>('choose')
  const [selectedType, setType]   = useState<string | null>(null)
  const [activity, setActivity]   = useState<any>(null)
  const [loading, setLoading]     = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [videoOpen, setVideoOpen] = useState(false)
  const [videoTime, setVideoTime] = useState(60)
  const intervalRef               = useRef<any>(null)
  const videoIntervalRef          = useRef<any>(null)

  const params   = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  const childId  = params?.get('childId') || ''
  const grade    = parseInt(params?.get('grade') || '0')
  const token    = params?.get('token') || ''
  const returnTo = params?.get('returnTo') || (token ? `/play/${token}` : '/dashboard')

  useEffect(() => () => {
    clearInterval(intervalRef.current)
    clearInterval(videoIntervalRef.current)
  }, [])

  async function pickActivity(type: string) {
    setType(type); setLoading(true)
    try {
      const res  = await fetch(`/api/relief?childId=${childId}&grade=${grade}&type=${type}`)
      const data = await res.json()
      setActivity(data.activity)
      if (data.activity) setCountdown(data.activity.duration_seconds || 60)
    } catch {}
    setLoading(false); setPhase('intro')
  }

  function startActivity() {
    setPhase('doing')
    if (activity?.type === 'video') {
      openVideo()
    } else {
      intervalRef.current = setInterval(() => {
        setCountdown(c => {
          if (c <= 1) { clearInterval(intervalRef.current); setPhase('done'); recordCompletion(); return 0 }
          return c - 1
        })
      }, 1000)
    }
  }

  function openVideo() {
    setVideoOpen(true); setVideoTime(activity?.duration_seconds || 60)
    videoIntervalRef.current = setInterval(() => {
      setVideoTime(t => {
        if (t <= 1) { clearInterval(videoIntervalRef.current); setVideoOpen(false); setPhase('done'); recordCompletion(); return 0 }
        return t - 1
      })
    }, 1000)
  }

  function closeVideo() {
    clearInterval(videoIntervalRef.current); setVideoOpen(false); setPhase('done'); recordCompletion()
  }

  async function recordCompletion() {
    if (!childId || !activity) return
    try {
      await fetch('/api/relief', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId, activityId: activity.id, xpSpent: 0 }),
      })
    } catch {}
  }

  function finish() { window.location.href = returnTo }
  function skip()   { clearInterval(intervalRef.current); window.location.href = returnTo }

  const cfg     = selectedType ? TYPE_CONFIG[selectedType] : TYPE_CONFIG.exercise
  const color   = cfg?.color || '#4A7FD4'
  const total   = activity?.duration_seconds || 60
  const pct     = Math.round((countdown / total) * 100)
  const circR   = 60
  const circC   = 2 * Math.PI * circR

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F9FAFB',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: '"Nunito", system-ui, sans-serif',
      padding: 20, position: 'relative', overflow: 'hidden',
    }}>
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:scale(0.96)} to{opacity:1;transform:scale(1)} }
        @keyframes slideUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.04)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        .type-btn { transition: all 0.18s ease !important; }
        .type-btn:hover { transform: translateY(-3px) !important; }
        .type-btn:active { transform: scale(0.98) !important; }
      `}</style>

      {/* Background blobs */}
      <div style={{ position: 'fixed', top: -120, left: -120, width: 400, height: 400, borderRadius: '50%', background: `radial-gradient(circle, ${color}12, transparent)`, pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: -100, right: -100, width: 360, height: 360, borderRadius: '50%', background: `radial-gradient(circle, ${color}08, transparent)`, pointerEvents: 'none' }} />

      {/* ── Full-screen video player ── */}
      {videoOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.97)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          {/* Timer bar */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'rgba(255,255,255,0.1)' }}>
            <div style={{ height: '100%', background: `linear-gradient(90deg,${color},#F59E0B)`, width: `${(videoTime / total) * 100}%`, transition: 'width 1s linear' }} />
          </div>
          {/* Header */}
          <div style={{ position: 'absolute', top: 16, left: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'white' }}>
              <Video size={16} />
              <span style={{ fontWeight: 800, fontSize: 14 }}>{activity?.title_en}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'rgba(255,255,255,0.7)', fontWeight: 700, fontSize: 13 }}>
                <Timer size={13} /> {videoTime}s
              </div>
              <button onClick={closeVideo} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(255,255,255,0.15)', border: 'none',
                borderRadius: 10, padding: '8px 16px',
                color: 'white', fontWeight: 800, fontSize: 13, cursor: 'pointer',
                fontFamily: 'inherit', backdropFilter: 'blur(4px)',
              }}>
                <CheckCircle size={14} /> Done
              </button>
            </div>
          </div>
          {/* Video frame */}
          <div style={{ width: 'min(820px, 92vw)', aspectRatio: '16/9', borderRadius: 16, overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.7)' }}>
            <iframe
              src={`${activity?.url}?autoplay=1&rel=0&modestbranding=1&iv_load_policy=3&controls=1`}
              style={{ width: '100%', height: '100%', border: 'none' }}
              allow="autoplay; encrypted-media"
              sandbox="allow-scripts allow-same-origin allow-presentation"
              title={activity?.title_en}
            />
          </div>
          <div style={{ marginTop: 14, color: 'rgba(255,255,255,0.35)', fontSize: 12, textAlign: 'center', display: 'flex', alignItems: 'center', gap: 6 }}>
            🔒 Safe video player · No ads · No suggestions · Auto-closes in {videoTime}s
          </div>
        </div>
      )}

      {/* ── Main card ── */}
      <div style={{
        background: 'white', borderRadius: 24, padding: '36px 32px',
        maxWidth: 520, width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
        border: '1px solid #F3F4F6',
        textAlign: 'center',
        animation: 'fadeIn 0.2s ease',
      }}>

        {/* ══ CHOOSE ══ */}
        {phase === 'choose' && (
          <div style={{ animation: 'slideUp 0.22s ease' }}>
            {/* Logo icon */}
            <div style={{
              width: 60, height: 60, borderRadius: 18, margin: '0 auto 16px',
              background: 'linear-gradient(135deg,#4A7FD4,#2EC4B6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(74,127,212,0.3)',
            }}>
              <Star size={28} color="white" fill="white" />
            </div>
            <h2 style={{ fontWeight: 900, fontSize: 26, color: '#111827', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
              Break Time! 🎉
            </h2>
            <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 28px', lineHeight: 1.6 }}>
              You've earned a break! Pick an activity to recharge.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22 }}>
              {Object.entries(TYPE_CONFIG).map(([type, c]: any) => {
                const Icon = c.icon
                return (
                  <button key={type}
                    className="type-btn"
                    onClick={() => pickActivity(type)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 16,
                      padding: '16px 18px', borderRadius: 16,
                      border: `1.5px solid ${c.color}25`,
                      background: c.bg, cursor: 'pointer', textAlign: 'left',
                      fontFamily: 'inherit', width: '100%',
                    }}
                  >
                    <div style={{
                      width: 48, height: 48, borderRadius: 14,
                      background: `${c.color}20`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <Icon size={22} color={c.color} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: 15, color: '#111827', marginBottom: 2 }}>{c.label}</div>
                      <div style={{ fontSize: 12, color: '#6B7280' }}>{c.desc}</div>
                    </div>
                    <ChevronRight size={18} color="#9CA3AF" />
                  </button>
                )
              })}
            </div>

            <button onClick={skip} style={{
              background: 'none', border: 'none',
              fontSize: 13, color: '#9CA3AF', cursor: 'pointer',
              fontWeight: 600, fontFamily: 'inherit',
              transition: 'color 0.15s',
            }}
              onMouseEnter={e => (e.currentTarget.style.color = '#6B7280')}
              onMouseLeave={e => (e.currentTarget.style.color = '#9CA3AF')}
            >
              Skip break
            </button>
          </div>
        )}

        {/* ══ INTRO ══ */}
        {phase === 'intro' && (
          <div style={{ animation: 'slideUp 0.22s ease' }}>
            {loading ? (
              <div style={{ padding: 48, color: '#6B7280', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <div style={{ width: 20, height: 20, border: '2px solid #E5E7EB', borderTopColor: '#4A7FD4', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                Loading activity…
              </div>
            ) : activity ? (
              <>
                {/* Exercise illustration */}
                <div style={{
                  width: 180, height: 180, margin: '0 auto 16px',
                  background: `${color}08`, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: `2px solid ${color}20`,
                }}>
                  <ExerciseIllustration type={activity.type} color={color} />
                </div>

                {/* Type + duration badge */}
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '4px 14px', borderRadius: 20, marginBottom: 12,
                  background: cfg.bg, border: `1px solid ${color}30`,
                }}>
                  <Timer size={12} color={color} />
                  <span style={{ fontSize: 11, fontWeight: 800, color, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    {cfg.label} · {activity.duration_seconds}s
                  </span>
                </div>

                <h2 style={{ fontWeight: 900, fontSize: 24, color: '#111827', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
                  {activity.title_en}
                </h2>
                <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 18px', lineHeight: 1.6 }}>
                  {activity.description_en}
                </p>

                {/* Instructions box */}
                <div style={{
                  background: '#F9FAFB', border: `1.5px solid ${color}25`,
                  borderRadius: 14, padding: 16, marginBottom: 20, textAlign: 'left',
                }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    fontSize: 10, fontWeight: 800, color,
                    letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 10,
                  }}>
                    <ChevronRight size={11} /> Instructions
                  </div>
                  <p style={{ fontSize: 13, color: '#374151', margin: 0, lineHeight: 1.75 }}>
                    {activity.instructions_en}
                  </p>
                </div>

                {/* Video URL note */}
                {activity.type === 'video' && activity.url && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '10px 14px', borderRadius: 10,
                    background: cfg.bg, border: `1px solid ${color}20`,
                    marginBottom: 16, fontSize: 12, color,
                  }}>
                    <Volume2 size={14} />
                    <span style={{ fontWeight: 700 }}>Turn up your volume for the best experience!</span>
                  </div>
                )}

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setPhase('choose')} style={{
                    flex: 1, padding: 13, borderRadius: 12,
                    border: '1.5px solid #E5E7EB', background: 'white',
                    color: '#6B7280', fontWeight: 700, fontSize: 14,
                    cursor: 'pointer', fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    transition: 'all 0.15s',
                  }}>
                    <ArrowLeft size={14} /> Back
                  </button>
                  <button onClick={startActivity} style={{
                    flex: 2, padding: 13, borderRadius: 50,
                    border: 'none',
                    background: `linear-gradient(135deg,${color},${color}CC)`,
                    color: 'white', fontWeight: 900, fontSize: 15,
                    cursor: 'pointer', fontFamily: 'inherit',
                    boxShadow: `0 4px 16px ${color}35`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    transition: 'all 0.18s ease',
                  }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'}
                  >
                    <Play size={16} fill="white" />
                    {activity.type === 'video' ? 'Watch Video' : "Let's Go!"}
                  </button>
                </div>
              </>
            ) : (
              <div style={{ padding: 40, color: '#6B7280' }}>
                No activity found.{' '}
                <button onClick={() => setPhase('choose')} style={{ color: '#4A7FD4', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit' }}>
                  Try again
                </button>
              </div>
            )}
          </div>
        )}

        {/* ══ DOING ══ */}
        {phase === 'doing' && activity?.type !== 'video' && (
          <div style={{ animation: 'slideUp 0.22s ease' }}>
            {/* Illustration stays visible during activity */}
            <div style={{
              width: 160, height: 160, margin: '0 auto 18px',
              background: `${color}08`, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `2px solid ${color}20`,
            }}>
              <ExerciseIllustration type={activity.type} color={color} />
            </div>

            <h2 style={{ fontWeight: 900, fontSize: 20, color: '#111827', margin: '0 0 6px' }}>
              {activity.title_en}
            </h2>
            <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 22px', lineHeight: 1.6 }}>
              {activity.instructions_en}
            </p>

            {/* Countdown ring */}
            <div style={{ position: 'relative', width: 148, height: 148, margin: '0 auto 24px' }}>
              <svg width="148" height="148" style={{ transform: 'rotate(-90deg)', display: 'block' }}>
                <circle cx="74" cy="74" r={circR} fill="none" stroke="#F3F4F6" strokeWidth="10" />
                <circle
                  cx="74" cy="74" r={circR}
                  fill="none" stroke={color} strokeWidth="10"
                  strokeDasharray={circC}
                  strokeDashoffset={circC * (1 - pct / 100)}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1s linear' }}
                />
              </svg>
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{ fontWeight: 900, fontSize: 38, color: '#111827', letterSpacing: '-0.02em', lineHeight: 1 }}>
                  {countdown}
                </div>
                <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 700, marginTop: 3 }}>seconds</div>
              </div>
            </div>

            <button
              onClick={() => { clearInterval(intervalRef.current); setPhase('done'); recordCompletion() }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '12px 28px', borderRadius: 50,
                border: 'none',
                background: `linear-gradient(135deg,${color},${color}CC)`,
                color: 'white', fontWeight: 800, fontSize: 14,
                cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: `0 4px 14px ${color}35`,
              }}
            >
              <CheckCircle size={16} /> Done Early
            </button>
          </div>
        )}

        {/* ══ DONE ══ */}
        {phase === 'done' && (
          <div style={{ animation: 'slideUp 0.22s ease' }}>
            <div style={{
              width: 84, height: 84, borderRadius: '50%',
              background: 'linear-gradient(135deg,#10B981,#059669)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
              boxShadow: '0 8px 28px rgba(16,185,129,0.35)',
              animation: 'pulse 1.5s ease-in-out 2',
            }}>
              <CheckCircle size={42} color="white" fill="white" />
            </div>

            <h2 style={{ fontWeight: 900, fontSize: 26, color: '#111827', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
              Amazing job! 🌟
            </h2>
            <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 24px', lineHeight: 1.6 }}>
              You completed your break activity! Ready to keep learning?
            </p>

            {/* XP reward */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: '#FFFBEB', border: '1.5px solid #F59E0B30',
              borderRadius: 16, padding: '14px 18px', marginBottom: 22,
            }}>
              <div style={{
                width: 42, height: 42, borderRadius: 13, flexShrink: 0,
                background: '#FEF3C7',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Zap size={20} color="#F59E0B" fill="#F59E0B" />
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 900, fontSize: 19, color: '#B45309', letterSpacing: '-0.01em' }}>
                  +10 XP Bonus!
                </div>
                <div style={{ fontSize: 12, color: '#92400E', fontWeight: 600 }}>
                  For completing your activity break
                </div>
              </div>
            </div>

            <button onClick={finish} style={{
              width: '100%', padding: 16, borderRadius: 50, border: 'none',
              background: 'linear-gradient(135deg,#4A7FD4,#2EC4B6)',
              color: 'white', fontWeight: 900, fontSize: 16,
              cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 4px 16px rgba(74,127,212,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all 0.18s ease',
            }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'
                ;(e.currentTarget as HTMLElement).style.filter = 'brightness(1.06)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
                ;(e.currentTarget as HTMLElement).style.filter = 'none'
              }}
            >
              <Play size={16} fill="white" /> Continue Learning!
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
