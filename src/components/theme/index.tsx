'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Home, Trophy, LogOut, Dumbbell, Sticker as MapIcon } from 'lucide-react'
import { kidLabel, type KidLang, TOKENS_CHANGED_EVENT } from '@/lib/kidPrefs'

// ── Theme config (single source of truth across all screens) ──
export const THEME_CONFIG: Record<string, any> = {
  minecraft: {
    bg: '#1A1A2E',
    panel: '#2D2D2D',
    panel2: '#1a1a1a',
    border: '#555',
    accent1: '#5D9E2F',
    accent2: '#FFD700',
    accent3: '#39D9D9',
    accent4: '#FF6B00',
    xp: '#82FF00',
    text: '#F5F5DC',
    text2: 'rgba(245,245,220,0.6)',
    radius: '0px',
    fontHead: '"Press Start 2P",monospace',
    shadow: '4px 4px 0 rgba(0,0,0,0.7)',
    btnShadow: '4px 4px 0 #000',
    mascot: '🦔',
    // NES.css classes to apply
    nesPanel: 'nes-container is-dark',
    nesBtn: 'nes-btn is-success',
    // Decorative
    pattern: `repeating-linear-gradient(0deg,rgba(93,158,47,0.08) 0,rgba(93,158,47,0.08) 1px,transparent 1px,transparent 32px),
              repeating-linear-gradient(90deg,rgba(93,158,47,0.08) 0,rgba(93,158,47,0.08) 1px,transparent 1px,transparent 32px)`,
    corners: ['⛏️','💎','🌲','🧱'],
    celebrationEmoji: '💎',
    celebrationBg: 'linear-gradient(135deg,#1A1A2E,#2D4A1E)',
    celebrationBorder: '#82FF00',
    floaters: ['⛏️','🪨','🌲','💎','🧱','🐛','☁️','⭐'],
  },
  princesses: {
    bg: '#FFF0F8',
    panel: '#FFFFFF',
    panel2: '#FFF0F8',
    border: '#F4AFCF',
    accent1: '#E05BA0',
    accent2: '#FFD700',
    accent3: '#9B59B6',
    accent4: '#FF8C69',
    xp: '#E05BA0',
    text: '#3D1A2E',
    text2: 'rgba(61,26,46,0.6)',
    radius: '20px',
    fontHead: '"Cinzel Decorative",serif',
    shadow: '0 8px 24px rgba(224,91,160,0.18)',
    btnShadow: '0 4px 16px rgba(224,91,160,0.35)',
    mascot: '🦄',
    nesPanel: null,
    nesBtn: null,
    pattern: `radial-gradient(circle at 15% 15%,rgba(224,91,160,0.12) 0%,transparent 40%),
              radial-gradient(circle at 85% 85%,rgba(155,89,182,0.12) 0%,transparent 40%),
              radial-gradient(circle at 50% 50%,rgba(255,215,0,0.05) 0%,transparent 60%)`,
    corners: ['🌸','✨','👑','🦋'],
    celebrationEmoji: '👑',
    celebrationBg: 'linear-gradient(135deg,#FFF0F8,#FFE4F4)',
    celebrationBorder: '#E05BA0',
    floaters: ['🌸','✨','🦋','💫','🌺','👑','🌈','💖'],
  },
  plain: {
    bg: '#FAF7F2',
    panel: '#FFFFFF',
    panel2: '#F3EFE7',
    border: '#E8E2D6',
    accent1: '#2F5BE3',
    accent2: '#FFC940',
    accent3: '#12937A',
    accent4: '#E67E22',
    xp: '#12937A',
    text: '#16213E',
    text2: '#4A5672',
    radius: '20px',
    fontHead: '"Rubik","Assistant",sans-serif',
    shadow: '0 2px 12px rgba(0,0,0,0.08)',
    btnShadow: '0 2px 8px rgba(0,0,0,0.12)',
    mascot: '🦉',
    nesPanel: null,
    nesBtn: null,
    pattern: 'none',
    corners: [],
    celebrationEmoji: '🌟',
    celebrationBg: 'linear-gradient(135deg,#F0F8FF,#E8F5E9)',
    celebrationBorder: '#2F5BE3',
    floaters: ['⭐','🌟','✨','🎯','📚','💡','🚀','🎉'],
  },
  // Per design_handoff_eduplay_redesign/README.md: pageBg, radius, accent (orange),
  // font (Manrope) and body text (navy) are the documented spec. accent2-4/xp/pattern/
  // corners/floaters have no design reference and are this pass's own call, kept
  // consistent with how the other three themes use those slots.
  sports: {
    bg: '#EAF2FB',
    panel: '#FFFFFF',
    panel2: '#EAF2FB',
    border: '#DCE7F5',
    accent1: '#F4762A',
    accent2: '#FFD700',
    accent3: '#1D3557',
    accent4: '#2C4C7C',
    xp: '#3DDC84',
    text: '#1D3557',
    text2: 'rgba(29,53,87,0.6)',
    radius: '10px',
    fontHead: '"Manrope",sans-serif',
    shadow: '0 4px 16px rgba(29,53,87,0.12)',
    btnShadow: '0 4px 14px rgba(244,118,42,0.35)',
    mascot: '🦁',
    nesPanel: null,
    nesBtn: null,
    pattern: 'none',
    corners: ['⚽','🏆','⭐','🎽'],
    celebrationEmoji: '🏆',
    celebrationBg: 'linear-gradient(135deg,#1D3557,#2C4C7C)',
    celebrationBorder: '#F4762A',
    floaters: ['⚽','🏆','⭐','🥇','🎉','🔥','👟','🎽'],
  },
}

// ── Animated Answer Button ─────────────────────────────────────
export function AnimatedBtn({
  onClick, disabled, correct, wrong, theme, T, children, style
}: {
  onClick: () => void, disabled: boolean, correct: boolean, wrong: boolean,
  theme: string, T: any, children: React.ReactNode, style?: any
}) {
  const [shake, setShake] = useState(false)
  const [bounce, setBounce] = useState(false)
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    if (wrong) { setShake(true); setTimeout(() => setShake(false), 500) }
    if (correct) { setBounce(true); setTimeout(() => setBounce(false), 600) }
  }, [wrong, correct])

  const animation = shake
    ? 'shake 0.5s ease'
    : bounce
    ? 'bounce 0.6s cubic-bezier(0.175,0.885,0.32,1.275)'
    : hovered && !disabled
    ? 'none'
    : 'none'

  const transform = hovered && !disabled && !shake && !bounce
    ? theme === 'minecraft' ? 'translate(-2px,-2px)' : 'scale(1.03)'
    : bounce ? 'scale(1.08)' : 'none'

  const boxShadow = hovered && !disabled
    ? theme === 'minecraft'
      ? `6px 6px 0 #000`
      : `0 8px 24px ${correct ? T.accent3 : T.accent1}40`
    : style?.boxShadow || T.btnShadow

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...style,
        animation,
        transform,
        boxShadow,
        transition: shake || bounce ? 'none' : 'transform 0.15s ease, box-shadow 0.15s ease',
        cursor: disabled ? 'default' : 'pointer',
      }}
    >
      {children}
    </button>
  )
}

// ── Sparkle effect for Princesses theme ───────────────────────
export function Sparkles({ active, theme }: { active: boolean; theme: string }) {
  const [sparks, setSparks] = useState<Array<{id: number; x: number; y: number; emoji: string}>>([])

  useEffect(() => {
    if (!active || theme !== 'princesses') return
    const emojis = ['✨','⭐','💫','🌟','💖']
    const newSparks = Array.from({length: 8}, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      emoji: emojis[i % emojis.length],
    }))
    setSparks(newSparks)
    setTimeout(() => setSparks([]), 1200)
  }, [active, theme])

  if (sparks.length === 0) return null
  return (
    <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:9998 }}>
      {sparks.map(s => (
        <div key={s.id} style={{
          position:'absolute', left:`${s.x}%`, top:`${s.y}%`,
          fontSize:Math.random() > 0.5 ? '24px' : '16px',
          animation: 'sparkleUp 1.2s ease forwards',
          pointerEvents: 'none',
        }}>{s.emoji}</div>
      ))}
      <style>{`
        @keyframes sparkleUp {
          0%   { transform:translateY(0) scale(0); opacity:1; }
          50%  { transform:translateY(-40px) scale(1.3); opacity:1; }
          100% { transform:translateY(-80px) scale(0); opacity:0; }
        }
        @keyframes shake {
          0%,100%{ transform:translateX(0) }
          20%    { transform:translateX(-6px) }
          40%    { transform:translateX(6px) }
          60%    { transform:translateX(-4px) }
          80%    { transform:translateX(4px) }
        }
        @keyframes bounce {
          0%  { transform:scale(1) }
          40% { transform:scale(1.12) }
          70% { transform:scale(0.96) }
          100%{ transform:scale(1.08) }
        }
        @keyframes celebPop {
          0%  { transform:scale(0.4) translateY(30px); opacity:0; }
          60% { transform:scale(1.08) translateY(-6px); opacity:1; }
          100%{ transform:scale(1) translateY(0); opacity:1; }
        }
        @keyframes floatUp0 { from{transform:translateY(24px) scale(0);opacity:0} to{transform:translateY(0) scale(1);opacity:1} }
        @keyframes floatUp1 { from{transform:translateY(36px) scale(0);opacity:0} to{transform:translateY(0) scale(1);opacity:1} }
        @keyframes floatUp2 { from{transform:translateY(28px) scale(0);opacity:0} to{transform:translateY(0) scale(1);opacity:1} }
        @keyframes spinBig  { from{transform:rotate(-20deg) scale(0.5);opacity:0} to{transform:rotate(8deg) scale(1);opacity:1} }
        @keyframes nesFlicker { 0%,100%{opacity:1} 50%{opacity:0.85} }
      `}</style>
    </div>
  )
}

// ── Theme Background + Corner Decorations ─────────────────────
export function ThemeDecorations({ theme }: { theme: string }) {
  const cfg = THEME_CONFIG[theme] || THEME_CONFIG.plain
  if (cfg.pattern === 'none' && cfg.corners.length === 0) return null

  return (
    <>
      {cfg.pattern !== 'none' && (
        <div style={{
          position:'fixed', inset:0, pointerEvents:'none', zIndex:0,
          backgroundImage: cfg.pattern,
        }}/>
      )}
      {cfg.corners.map((emoji: string, i: number) => (
        <div key={i} style={{
          position:'fixed',
          top:    i < 2 ? '70px' : 'auto',
          bottom: i >= 2 ? '20px' : 'auto',
          left:   i % 2 === 0 ? '14px' : 'auto',
          right:  i % 2 === 1 ? '14px' : 'auto',
          fontSize: '26px',
          opacity: theme === 'minecraft' ? 0.22 : 0.18,
          pointerEvents: 'none',
          zIndex: 0,
          userSelect: 'none',
          animation: theme === 'princesses' ? `floatUp${i%3} 0.8s ease ${i*0.15}s both` : 'none',
        }}>{emoji}</div>
      ))}
    </>
  )
}

// ── Celebration Modal ─────────────────────────────────────────
export function CelebrationModal({
  celebration, T, theme
}: {
  celebration: { message: string; emoji: string } | null,
  T: any, theme: string
}) {
  const cfg = THEME_CONFIG[theme] || THEME_CONFIG.plain
  if (!celebration) return null

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:9999,
      display:'flex', alignItems:'center', justifyContent:'center',
      background:'rgba(0,0,0,0.4)',
      pointerEvents:'none',
    }}>
      <div style={{
        background: cfg.celebrationBg,
        border: `4px solid ${cfg.celebrationBorder}`,
        borderRadius: theme === 'minecraft' ? '0px' : '24px',
        padding: '36px 48px',
        textAlign: 'center',
        maxWidth: '380px',
        width: '90%',
        boxShadow: theme === 'minecraft'
          ? `8px 8px 0 #000`
          : `0 24px 60px rgba(0,0,0,0.3)`,
        animation: 'celebPop 0.5s cubic-bezier(0.175,0.885,0.32,1.275) both',
      }}>
        <div style={{
          fontSize: 80, marginBottom: 16,
          display: 'block',
          animation: 'spinBig 0.5s ease both',
        }}>{celebration.emoji}</div>
        <div style={{
          fontFamily: T.fontHead,
          fontSize: theme === 'minecraft' ? '13px' : '20px',
          color: T.text,
          fontWeight: 800,
          lineHeight: 1.5,
          marginBottom: 20,
        }}>{celebration.message}</div>
        <div style={{ display:'flex', justifyContent:'center', gap:10, fontSize:28 }}>
          {cfg.floaters.slice(0,5).map((e: string, i: number) => (
            <span key={i} style={{ animation:`floatUp${i%3} 0.6s ease ${i*0.12}s both`, display:'inline-block' }}>{e}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Kid Overlay — shared fixed-position shell for the kid side's other
// fixed overlays (XP notification, lesson-complete screen, session-failed
// banner). Deliberately separate from CelebrationModal above: that one is a
// different, already-shared shape (always centered, non-interactive,
// caller-timed auto-dismiss) used by both lesson and assignment celebration
// moments, and its signature didn't need to change for these three. This
// only covers the 3 position/interaction combinations those three actually
// use — not a general-purpose overlay system.
export function KidOverlay({
  position, interactive, children
}: {
  position: 'top-right' | 'top-banner' | 'center'
  interactive?: boolean
  children: React.ReactNode
}) {
  const positionStyle: React.CSSProperties =
    position === 'top-right' ? { top: '70px', right: '20px' } :
    position === 'top-banner' ? { top: 0, left: 0, right: 0 } :
    { inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: interactive ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.4)' }

  return (
    <div style={{
      position: 'fixed', zIndex: 9999,
      pointerEvents: interactive ? 'auto' : 'none',
      ...positionStyle,
    }}>
      {children}
    </div>
  )
}

// ── NES Panel wrapper for Minecraft ───────────────────────────
export function ThemePanel({
  theme, T, children, style, className, bg, borderColor, borderWidth
}: {
  theme: string, T: any, children: React.ReactNode, style?: any, className?: string,
  bg?: string, borderColor?: string, borderWidth?: number
}) {
  if (theme === 'minecraft') {
    return (
      <div
        className={`nes-container is-dark ${className || ''}`}
        style={{
          background: bg || T.panel,
          color: T.text,
          fontFamily: T.fontHead,
          ...style,
        }}
      >
        {children}
      </div>
    )
  }
  return (
    <div style={{
      background: bg || T.panel,
      border: `${borderWidth ?? 2}px solid ${borderColor || T.border}`,
      borderRadius: T.radius,
      boxShadow: T.shadow,
      ...style,
    }}>
      {children}
    </div>
  )
}

// ── Kid Nav Bar — persistent Home / Assignments / Rewards shell ────────
// Mounted on /play/[token] and /cards only; /lesson and /assignment stay
// nav-free focused runners. The "Assignments" destination doesn't exist yet
// (that's its own checkpoint) — the link is wired now so nothing here needs
// to change once that page lands.
export function KidNavBar({
  theme, active, childId, token, lang = 'bilingual'
}: {
  // 'assignments' is a sub-page of Today (parent tasks), so it highlights Today.
  theme: string, active: 'home' | 'practice' | 'assignments' | 'rewards', childId: string, token?: string, lang?: KidLang
}) {
  const T = THEME_CONFIG[theme] || THEME_CONFIG.plain
  // Carry the theme and language to every kid page so a child never "falls
  // out" of their look or their language when switching tabs.
  const qs = `${token ? `&token=${token}` : ''}&theme=${theme}&lang=${lang}`
  const [gate, setGate] = useState<{ a: number, b: number } | null>(null)
  const [answer, setAnswer] = useState('')
  const [gateError, setGateError] = useState(false)
  const [parentHere, setParentHere] = useState(false)
  const isHE = lang !== 'en_only'
  // A parent who opened this screen from their own account gets a clear way back.
  useEffect(() => {
    fetch('/api/session/whoami').then(r => r.ok ? r.json() : null).then(d => setParentHere(!!d?.parent)).catch(() => {})
  }, [])

  const items: Array<{ key: 'home' | 'practice' | 'rewards', Icon: any, href: string }> = [
    { key: 'home',     Icon: Home,     href: token ? `/play/${token}?lang=${lang}` : '/dashboard' },
    { key: 'practice', Icon: Dumbbell, href: `/practice?childId=${childId}${qs}` },
    { key: 'rewards',  Icon: MapIcon,  href: `/cards?childId=${childId}${qs}` },
  ]

  function openGate() {
    setGate({ a: 6 + Math.floor(Math.random() * 4), b: 6 + Math.floor(Math.random() * 4) })
    setAnswer(''); setGateError(false)
  }
  function submitGate() {
    if (!gate) return
    if (answer.trim() === '') { setGateError(true); return }
    if (Number(answer) === gate.a * gate.b) {
      if (parentHere) backToParent()
      else window.location.href = '/login'
    }
    else { setGateError(true); setAnswer('') }
  }

  async function backToParent() {
    await fetch('/api/session/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scope: 'child' }) }).catch(() => {})
    window.location.href = '/dashboard'
  }

  const linkStyle = (isActive: boolean): React.CSSProperties => ({
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
    textDecoration: 'none', color: isActive ? T.accent1 : T.text,
    opacity: isActive ? 1 : 0.6, fontFamily: T.fontHead,
    fontSize: '14px', fontWeight: 800, padding: '6px 10px', flex: 1, minHeight: 64,
    cursor: isActive ? 'default' : 'pointer', background: 'none', border: 'none',
  })

  return (
    <>
      <nav dir={isHE ? 'rtl' : 'ltr'} style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
        background: T.panel, borderTop: `2px solid ${T.border}`,
        display: 'flex', justifyContent: 'space-around',
        padding: '6px 0', boxShadow: '0 -2px 12px rgba(0,0,0,0.08)',
      }}>
        {items.map(({ key, Icon, href }) => {
          const isActive = key === active || (key === 'home' && active === 'assignments')
          return (
            <Link key={key} href={href}
              onClick={e => { if (isActive) e.preventDefault() }}
              style={linkStyle(isActive)}>
              <span style={{ width: 56, height: 32, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isActive ? `${T.accent1}1F` : 'transparent' }}>
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2}/>
              </span>
              <span>{kidLabel(key, lang)}</span>
            </Link>
          )
        })}
        {/* The only exit from kid mode back to the parent login. It sits
            behind a quick grown-ups question so a young child doesn't land on
            the parent password screen by accident. */}
        <button onClick={openGate} aria-label={parentHere ? (isHE ? 'חזרה לחשבון ההורה' : 'Back to parent account') : (isHE ? 'כניסת הורים' : 'Parent login')}
          style={{ ...linkStyle(false), opacity: parentHere ? 0.85 : 0.35, flex: 0.6 }}>
          <LogOut size={18} strokeWidth={2}/>
          <span style={{ fontSize: parentHere ? '12px' : '10px' }}>{parentHere ? (isHE ? 'חזרה להורה' : 'Back to parent') : kidLabel('parent', lang)}</span>
        </button>
      </nav>

      {gate && (
        <div onClick={() => setGate(null)} style={{
          position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}>
          <div onClick={e => e.stopPropagation()} dir={isHE ? 'rtl' : 'ltr'} style={{
            background: '#fff', borderRadius: 16, padding: '22px 22px 18px', width: 'min(320px, 100%)',
            fontFamily: '"Manrope", system-ui, sans-serif', textAlign: 'center', color: '#1f2a28',
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#7a8f8b', marginBottom: 6 }}>
              {isHE ? 'להורים בלבד' : 'For grown-ups'}
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 14 }} dir="ltr">
              {gate.a} × {gate.b} = ?
            </div>
            <input autoFocus inputMode="numeric" value={answer}
              onChange={e => { setAnswer(e.target.value.replace(/\D/g, '')); setGateError(false) }}
              onKeyDown={e => { if (e.key === 'Enter') submitGate() }}
              style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', fontSize: 18, textAlign: 'center',
                borderRadius: 10, border: `1.5px solid ${gateError ? '#DC2626' : 'rgba(15,118,110,.3)'}` }}/>
            {gateError && (
              <div style={{ color: '#DC2626', fontSize: 13, marginTop: 6 }}>{isHE ? 'נסו שוב' : 'Try again'}</div>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button onClick={() => setGate(null)} style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1px solid #e5e7eb', background: '#fff', fontWeight: 700, cursor: 'pointer' }}>
                {isHE ? 'ביטול' : 'Cancel'}
              </button>
              <button onClick={submitGate} style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', background: '#2F5BE3', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
                {isHE ? 'המשך' : 'Continue'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}


// ── Always-on collection button ───────────────────────────────
// A floating map/cards button with the child's unspent card tokens, shown on
// every kid screen (including inside a lesson) so the collection is always one
// tap away. Sits just above the kid nav bar, or near the bottom edge on screens
// without one (lesson, assignment runner).
export function CollectionButton({
  childId, token, theme, lang = 'bilingual', aboveNav = true, compact = false,
}: { childId: string, token?: string, theme: string, lang?: KidLang, aboveNav?: boolean, compact?: boolean }) {
  // compact: smaller and lower, for busy screens like the lesson player
  const size = compact ? 46 : 58
  const T = THEME_CONFIG[theme] || THEME_CONFIG.plain
  const [tokens, setTokens] = useState<number | null>(null)
  const [bump, setBump] = useState(false)
  const isHE = lang !== 'en_only'

  useEffect(() => {
    if (!childId) return
    let last: number | null = null
    const load = () => fetch(`/api/children?childId=${childId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        const n = d?.child?.card_tokens
        if (typeof n !== 'number') return
        if (last !== null && n > last) { setBump(true); setTimeout(() => setBump(false), 900) }
        last = n; setTokens(n)
      })
      .catch(() => {})
    load()
    const onFocus = () => { if (document.visibilityState === 'visible') load() }
    window.addEventListener(TOKENS_CHANGED_EVENT, load)
    document.addEventListener('visibilitychange', onFocus)
    return () => { window.removeEventListener(TOKENS_CHANGED_EVENT, load); document.removeEventListener('visibilitychange', onFocus) }
  }, [childId])

  const href = `/cards?childId=${childId}${token ? `&token=${token}` : ''}&theme=${theme}&lang=${lang}`
  const hasTokens = (tokens ?? 0) > 0
  return (
    <Link href={href} aria-label={isHE ? 'המדבקות שלי' : 'My stickers'}
      style={{
        position: 'fixed', zIndex: 210, insetInlineEnd: compact ? 10 : 16, bottom: aboveNav ? 82 : (compact ? 10 : 18),
        width: size, height: size, borderRadius: theme === 'minecraft' ? 6 : 999,
        background: hasTokens ? '#E0A927' : T.panel, color: hasTokens ? '#fff' : T.text,
        border: `2px solid ${hasTokens ? '#B7862F' : T.border}`,
        boxShadow: '0 6px 18px rgba(0,0,0,0.18)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none',
        transform: bump ? 'scale(1.18)' : 'scale(1)', transition: 'transform .25s cubic-bezier(.2,.9,.3,1.4)',
        animation: hasTokens ? 'collectionPulse 2.2s ease-in-out infinite' : 'none',
      }}>
      <style>{`@keyframes collectionPulse{0%,100%{box-shadow:0 6px 18px rgba(0,0,0,.18)}50%{box-shadow:0 0 0 8px rgba(224,169,39,.25),0 6px 18px rgba(0,0,0,.18)}}@media (prefers-reduced-motion: reduce){a[aria-label]{animation:none!important}}`}</style>
      <MapIcon size={compact ? 21 : 26} strokeWidth={2.2}/>
      {tokens !== null && (
        <span style={{
          position: 'absolute', top: -6, insetInlineEnd: -6, minWidth: 22, height: 22, padding: '0 6px',
          borderRadius: 999, background: hasTokens ? '#DC2626' : T.border, color: '#fff',
          fontSize: 12, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: '"Nunito", sans-serif',
        }}>{tokens}</span>
      )}
    </Link>
  )
}
