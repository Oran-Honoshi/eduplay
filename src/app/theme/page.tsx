'use client'
import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Check, Sparkles, Lock, ArrowLeft, Loader2 } from 'lucide-react'

const THEMES = [
  {
    id: 'plain',
    name: 'Classic',
    tagline: 'Clean & focused',
    emoji: '📚',
    available: true,
    preview: {
      bg: 'linear-gradient(135deg,#F9FAFB,#EFF6FF)',
      card: '#FFFFFF',
      accent: '#4A7FD4',
      accent2: '#2EC4B6',
      border: '#E5E7EB',
      text: '#111827',
      btnBg: 'linear-gradient(135deg,#4A7FD4,#2EC4B6)',
    },
  },
  {
    id: 'minecraft',
    name: 'Minecraft',
    tagline: 'Dark & adventurous',
    emoji: '⛏️',
    available: true,
    preview: {
      bg: 'linear-gradient(135deg,#1A1A2E,#2D5A1B)',
      card: '#2D2D2D',
      accent: '#5D9E2F',
      accent2: '#FFD700',
      border: '#555',
      text: '#F5F5DC',
      btnBg: 'linear-gradient(135deg,#5D9E2F,#82FF00)',
    },
  },
  {
    id: 'princesses',
    name: 'Princess',
    tagline: 'Magical & sparkly',
    emoji: '👑',
    available: true,
    preview: {
      bg: 'linear-gradient(135deg,#FFE4F4,#F8D7FF)',
      card: '#FFFFFF',
      accent: '#E05BA0',
      accent2: '#FFD700',
      border: '#F4AFCF',
      text: '#3D1A2E',
      btnBg: 'linear-gradient(135deg,#E05BA0,#C39BD3)',
    },
  },
  {
    id: 'space',
    name: 'Space',
    tagline: 'Coming soon',
    emoji: '🚀',
    available: false,
    preview: {
      bg: 'linear-gradient(135deg,#0a0a1a,#1a1a4e)',
      card: '#0D1B35',
      accent: '#9B59B6',
      accent2: '#3498DB',
      border: '#9B59B6',
      text: '#ECF0F1',
      btnBg: 'linear-gradient(135deg,#9B59B6,#3498DB)',
    },
  },
  {
    id: 'adventure',
    name: 'Adventure',
    tagline: 'Coming soon',
    emoji: '🗺️',
    available: false,
    preview: {
      bg: 'linear-gradient(135deg,#2C3E50,#3498DB)',
      card: '#1E2D3D',
      accent: '#F39C12',
      accent2: '#E74C3C',
      border: '#F39C12',
      text: '#ECF0F1',
      btnBg: 'linear-gradient(135deg,#F39C12,#E74C3C)',
    },
  },
  {
    id: 'sports',
    name: 'Sports',
    tagline: 'Coming soon',
    emoji: '⚽',
    available: false,
    preview: {
      bg: 'linear-gradient(135deg,#1a5c2a,#2ecc71)',
      card: '#1A4A2A',
      accent: '#F1C40F',
      accent2: '#E74C3C',
      border: '#F1C40F',
      text: '#FFFFFF',
      btnBg: 'linear-gradient(135deg,#F1C40F,#E74C3C)',
    },
  },
]

// Mini lesson preview card
function ThemePreview({ theme }: { theme: typeof THEMES[0] }) {
  const p = theme.preview
  return (
    <div style={{
      background: p.bg, borderRadius: 12, padding: 10,
      border: `1px solid ${p.border}`, minHeight: 100,
      display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      {/* Mini header */}
      <div style={{
        background: p.card, borderRadius: 6, padding: '5px 8px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        border: `1px solid ${p.border}`,
      }}>
        <div style={{ width: 8, height: 8, borderRadius: 2, background: p.accent }} />
        <div style={{ display: 'flex', gap: 3 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ width: 12, height: 4, borderRadius: 2, background: i <= 2 ? p.accent : p.border }} />
          ))}
        </div>
      </div>
      {/* Mini card */}
      <div style={{
        background: p.card, borderRadius: 6, padding: '6px 8px',
        border: `1px solid ${p.border}`, flex: 1,
      }}>
        <div style={{ width: '60%', height: 4, borderRadius: 2, background: p.accent, marginBottom: 5 }} />
        <div style={{ width: '80%', height: 3, borderRadius: 2, background: p.border, marginBottom: 3 }} />
        <div style={{ width: '50%', height: 3, borderRadius: 2, background: p.border, marginBottom: 6 }} />
        <div style={{
          background: p.btnBg, borderRadius: 4, padding: '3px 6px',
          width: 'fit-content',
          display: 'flex', alignItems: 'center', gap: 3,
        }}>
          <div style={{ width: 16, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.7)' }} />
        </div>
      </div>
    </div>
  )
}

function ThemeSelector() {
  const searchParams = useSearchParams()
  const childId   = searchParams.get('childId') || ''
  const childName = searchParams.get('name') || 'there'
  const current   = searchParams.get('current') || 'plain'
  const returnTo  = searchParams.get('returnTo') || `/play/${childId}`

  const [selected, setSelected] = useState(current)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)

  const selectedTheme = THEMES.find(t => t.id === selected) || THEMES[0]
  const p = selectedTheme.preview

  async function saveTheme() {
    if (selected === current) { window.location.href = returnTo; return }
    setSaving(true)
    try {
      await fetch('/api/theme', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId, theme: selected }),
      })
      setSaved(true)
      setTimeout(() => { window.location.href = returnTo }, 1200)
    } catch { setSaving(false) }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: p.bg,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: 20,
      fontFamily: '"Nunito", system-ui, sans-serif',
      transition: 'background 0.4s ease',
    }}>
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:scale(0.96)} to{opacity:1;transform:scale(1)} }
        @keyframes slideUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        .theme-card { transition: all 0.2s ease !important; }
        .theme-card:hover { transform: translateY(-3px) !important; }
        .theme-card.active { transform: scale(1.04) !important; }
        @media (max-width:600px) {
          .theme-grid { grid-template-columns: repeat(2,1fr) !important; }
        }
      `}</style>

      {/* Back button */}
      <button onClick={() => window.location.href = returnTo} style={{
        position: 'fixed', top: 16, left: 16,
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '8px 14px', borderRadius: 50,
        background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
        border: `1px solid rgba(255,255,255,0.25)`,
        color: 'white', fontWeight: 700, fontSize: 13,
        cursor: 'pointer', fontFamily: 'inherit',
        transition: 'all 0.15s',
      }}>
        <ArrowLeft size={13} /> Back
      </button>

      {/* Main panel */}
      <div style={{
        background: 'rgba(255,255,255,0.13)',
        backdropFilter: 'blur(16px)',
        borderRadius: 24, padding: '32px 28px',
        maxWidth: 640, width: '100%',
        border: `2px solid rgba(255,255,255,0.25)`,
        boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
        animation: 'fadeIn 0.22s ease',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, margin: '0 auto 12px',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
            border: '1px solid rgba(255,255,255,0.3)',
          }}>
            🎨
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'white', margin: 0, letterSpacing: '-0.02em', textShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
            Pick your theme, {childName}!
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 5 }}>
            Your whole learning experience will change to match
          </p>
        </div>

        {/* Theme grid */}
        <div className="theme-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 22 }}>
          {THEMES.map(theme => {
            const isActive = selected === theme.id
            return (
              <div
                key={theme.id}
                className={`theme-card ${isActive ? 'active' : ''}`}
                onClick={() => theme.available && setSelected(theme.id)}
                style={{
                  borderRadius: 16, padding: 12,
                  background: 'rgba(255,255,255,0.12)',
                  backdropFilter: 'blur(8px)',
                  border: isActive
                    ? `2.5px solid rgba(255,255,255,0.8)`
                    : `1.5px solid rgba(255,255,255,0.15)`,
                  cursor: theme.available ? 'pointer' : 'not-allowed',
                  opacity: theme.available ? 1 : 0.5,
                  position: 'relative',
                  boxShadow: isActive ? '0 8px 28px rgba(0,0,0,0.25)' : 'none',
                }}
              >
                {/* Active check */}
                {isActive && (
                  <div style={{
                    position: 'absolute', top: 8, right: 8,
                    width: 20, height: 20, borderRadius: '50%',
                    background: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Check size={12} color={theme.preview.accent} strokeWidth={3} />
                  </div>
                )}
                {/* Coming soon badge */}
                {!theme.available && (
                  <div style={{
                    position: 'absolute', top: 7, left: 7,
                    background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
                    borderRadius: 20, padding: '2px 7px',
                    fontSize: 8, color: 'white', fontWeight: 800,
                    display: 'flex', alignItems: 'center', gap: 3,
                  }}>
                    <Lock size={7} /> Soon
                  </div>
                )}

                {/* Mini preview */}
                <ThemePreview theme={theme} />

                {/* Label */}
                <div style={{ textAlign: 'center', marginTop: 8 }}>
                  <div style={{ fontSize: 16, marginBottom: 2 }}>{theme.emoji}</div>
                  <div style={{ fontSize: 12, fontWeight: 900, color: 'white' }}>{theme.name}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 1 }}>{theme.tagline}</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Save button */}
        <button
          onClick={saveTheme}
          disabled={saving || saved}
          style={{
            width: '100%', padding: '15px',
            borderRadius: 50,
            background: saved
              ? 'linear-gradient(135deg,#10B981,#059669)'
              : `linear-gradient(135deg,rgba(255,255,255,0.25),rgba(255,255,255,0.15))`,
            backdropFilter: 'blur(8px)',
            border: '1.5px solid rgba(255,255,255,0.4)',
            color: 'white', fontSize: 15, fontWeight: 900,
            cursor: saving || saved ? 'default' : 'pointer',
            fontFamily: 'inherit',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => { if (!saving && !saved) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.25)' }}
          onMouseLeave={e => { if (!saving && !saved) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.15)' }}
        >
          {saved ? (
            <><Check size={18} strokeWidth={3} /> Theme saved! Loading…</>
          ) : saving ? (
            <><Loader2 size={16} style={{ animation: 'spin 0.7s linear infinite' }} /> Saving…</>
          ) : (
            <><Sparkles size={16} /> Use {selectedTheme.name} Theme!</>
          )}
        </button>
      </div>
    </div>
  )
}

export default function ThemePage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"Nunito",sans-serif', fontSize: 16, color: '#6B7280' }}>
        <Loader2 size={24} style={{ animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    }>
      <ThemeSelector />
    </Suspense>
  )
}