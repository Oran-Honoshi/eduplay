'use client'
import { useState, useEffect } from 'react'

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
    bg: '#F8F9FB',
    panel: '#FFFFFF',
    panel2: '#F8F9FB',
    border: '#EEF1F6',
    accent1: '#4A7FD4',
    accent2: '#F0A500',
    accent3: '#27AE60',
    accent4: '#E67E22',
    xp: '#27AE60',
    text: '#1E2D4E',
    text2: '#6B7280',
    radius: '12px',
    fontHead: '"Nunito",sans-serif',
    shadow: '0 2px 12px rgba(0,0,0,0.08)',
    btnShadow: '0 2px 8px rgba(0,0,0,0.12)',
    mascot: '🦉',
    nesPanel: null,
    nesBtn: null,
    pattern: 'none',
    corners: [],
    celebrationEmoji: '🌟',
    celebrationBg: 'linear-gradient(135deg,#F0F8FF,#E8F5E9)',
    celebrationBorder: '#4A7FD4',
    floaters: ['⭐','🌟','✨','🎯','📚','💡','🚀','🎉'],
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

// ── NES Panel wrapper for Minecraft ───────────────────────────
export function ThemePanel({
  theme, T, children, style, className
}: {
  theme: string, T: any, children: React.ReactNode, style?: any, className?: string
}) {
  if (theme === 'minecraft') {
    return (
      <div
        className={`nes-container is-dark ${className || ''}`}
        style={{
          background: T.panel,
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
      background: T.panel,
      border: `2px solid ${T.border}`,
      borderRadius: T.radius,
      boxShadow: T.shadow,
      ...style,
    }}>
      {children}
    </div>
  )
}