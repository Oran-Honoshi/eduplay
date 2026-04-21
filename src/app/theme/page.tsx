'use client'
import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

const THEMES = [
  {
    id: 'minecraft',
    name: 'Minecraft',
    emoji: '⛏️',
    desc: 'Dark, pixelated, adventure!',
    bg: 'linear-gradient(135deg,#1A1A2E,#2D5A1B)',
    border: '#5D9E2F',
    text: '#F5F5DC',
    accent: '#FFD700',
    available: true,
  },
  {
    id: 'princesses',
    name: 'Princesses',
    emoji: '👑',
    desc: 'Magical, sparkly, royal!',
    bg: 'linear-gradient(135deg,#FFE4F4,#F8D7FF)',
    border: '#E05BA0',
    text: '#3D1A2E',
    accent: '#FFD700',
    available: true,
  },
  {
    id: 'plain',
    name: 'Classic',
    emoji: '📚',
    desc: 'Clean and simple.',
    bg: 'linear-gradient(135deg,#F8F9FA,#EEF2FF)',
    border: '#4A90D9',
    text: '#212529',
    accent: '#4A90D9',
    available: true,
  },
  {
    id: 'adventure',
    name: 'Adventure',
    emoji: '🗺️',
    desc: 'Coming soon!',
    bg: 'linear-gradient(135deg,#2C3E50,#3498DB)',
    border: '#F39C12',
    text: '#ECF0F1',
    accent: '#F39C12',
    available: false,
  },
  {
    id: 'space',
    name: 'Space',
    emoji: '🚀',
    desc: 'Coming soon!',
    bg: 'linear-gradient(135deg,#0a0a1a,#1a1a4e)',
    border: '#9B59B6',
    text: '#ECF0F1',
    accent: '#9B59B6',
    available: false,
  },
  {
    id: 'sports',
    name: 'Sports',
    emoji: '⚽',
    desc: 'Coming soon!',
    bg: 'linear-gradient(135deg,#1a5c2a,#2ecc71)',
    border: '#F1C40F',
    text: '#FFFFFF',
    accent: '#F1C40F',
    available: false,
  },
]

function ThemeSelector() {
  const searchParams = useSearchParams()
  const childId   = searchParams.get('childId') || ''
  const childName = searchParams.get('name') || 'there'
  const current   = searchParams.get('current') || 'plain'
  const returnTo  = searchParams.get('returnTo') || `/lesson?childId=${childId}`

  const [selected, setSelected]   = useState(current)
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState(false)

  async function saveTheme() {
    if (selected === current) {
      window.location.href = returnTo
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId, theme: selected }),
      })
      if (!res.ok) throw new Error('Save failed')
      setSaved(true)
      setTimeout(() => {
        // Return to where they came from, with new theme in URL
        const dest = returnTo.includes('?')
          ? `${returnTo}&theme=${selected}`
          : `${returnTo}?theme=${selected}`
        window.location.href = dest
      }, 1200)
    } catch {
      setSaving(false)
    }
  }

  const selectedTheme = THEMES.find(t => t.id === selected) || THEMES[2]

  return (
    <div style={{
      minHeight: '100vh',
      background: selectedTheme.bg,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px', transition: 'background 0.4s ease',
      fontFamily: '"Nunito", sans-serif',
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.12)',
        backdropFilter: 'blur(12px)',
        borderRadius: '24px',
        padding: '32px',
        maxWidth: '600px',
        width: '100%',
        border: `2px solid ${selectedTheme.border}`,
        boxShadow: '0 16px 48px rgba(0,0,0,0.2)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>🎨</div>
          <h1 style={{ fontSize: '22px', fontWeight: 900, color: selectedTheme.text, margin: 0 }}>
            Pick your theme, {childName}!
          </h1>
          <p style={{ fontSize: '13px', color: selectedTheme.text, opacity: .7, marginTop: '6px' }}>
            Your whole app will change to match!
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '24px' }}>
          {THEMES.map(theme => (
            <div key={theme.id}
              onClick={() => theme.available && setSelected(theme.id)}
              style={{
                background: theme.bg,
                border: `3px solid ${selected === theme.id ? theme.border : 'transparent'}`,
                borderRadius: '16px',
                padding: '16px 12px',
                textAlign: 'center',
                cursor: theme.available ? 'pointer' : 'not-allowed',
                opacity: theme.available ? 1 : 0.5,
                transition: 'all 0.2s',
                transform: selected === theme.id ? 'scale(1.05)' : 'scale(1)',
                boxShadow: selected === theme.id ? `0 8px 24px rgba(0,0,0,0.3)` : 'none',
                position: 'relative',
              }}>
              {selected === theme.id && (
                <div style={{ position: 'absolute', top: '8px', right: '8px', background: theme.border, borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: 'white', fontWeight: 900 }}>✓</div>
              )}
              {!theme.available && (
                <div style={{ position: 'absolute', top: '8px', left: '8px', background: 'rgba(0,0,0,0.5)', borderRadius: '50px', padding: '2px 8px', fontSize: '9px', color: 'white', fontWeight: 800 }}>SOON</div>
              )}
              <div style={{ fontSize: '32px', marginBottom: '6px' }}>{theme.emoji}</div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: theme.text }}>{theme.name}</div>
              <div style={{ fontSize: '10px', color: theme.text, opacity: .7, marginTop: '3px' }}>{theme.desc}</div>
            </div>
          ))}
        </div>

        <button
          onClick={saveTheme}
          disabled={saving || saved}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: '50px',
            border: 'none',
            background: saved ? '#27AE60' : selectedTheme.border,
            color: 'white',
            fontSize: '16px',
            fontWeight: 900,
            cursor: saving || saved ? 'default' : 'pointer',
            fontFamily: '"Nunito", sans-serif',
            boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
            transition: 'all 0.2s',
          }}>
          {saved ? '✅ Theme saved! Loading...' : saving ? 'Saving...' : `✨ Use ${selectedTheme.name} Theme!`}
        </button>

        <button
          onClick={() => window.location.href = returnTo}
          style={{ display: 'block', margin: '12px auto 0', background: 'transparent', border: 'none', color: selectedTheme.text, opacity: .7, fontSize: '13px', cursor: 'pointer', fontFamily: '"Nunito", sans-serif' }}>
          ← Back without changing
        </button>
      </div>
    </div>
  )
}

export default function ThemePage() {
  return (
    <Suspense fallback={<div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Nunito,sans-serif', fontSize:'18px' }}>Loading...</div>}>
      <ThemeSelector/>
    </Suspense>
  )
}