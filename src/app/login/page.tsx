'use client'
import { useState } from 'react'
import { Lock, Eye, EyeOff, ChevronRight, ArrowLeft, Users, Shield } from 'lucide-react'

const FAMILY_ID = '11111111-1111-1111-1111-111111111111'

// Child avatar definitions — kept as emoji content (not UI icons)
const CHILD_AVATARS = [
  { emoji: '🐱', name: 'Lia',   color: '#EF4444', bg: '#FEF2F2', light: '#FEE2E2' },
  { emoji: '🐻', name: 'Tamar', color: '#4A7FD4', bg: '#EFF6FF', light: '#DBEAFE' },
  { emoji: '🦊', name: 'Tom',   color: '#2EC4B6', bg: '#F0FDFB', light: '#CCFBF1' },
]

export default function LoginPage() {
  const [mode, setMode]           = useState<'choose' | 'pin' | 'parent'>('choose')
  const [parents, setParents]     = useState<any[]>([])
  const [selectedChild, setChild] = useState<any>(null)
  const [selectedParent, setParent] = useState<any>(null)
  const [pin, setPin]             = useState('')
  const [password, setPassword]   = useState('')
  const [showPass, setShowPass]   = useState(false)
  const [error, setError]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [shake, setShake]         = useState(false)
  const [parentsLoaded, setPL]    = useState(false)

  function triggerShake() {
    setShake(true)
    setTimeout(() => setShake(false), 480)
  }

  async function loadParents() {
    if (parentsLoaded) return
    try {
      const res  = await fetch(`/api/parents?familyId=${FAMILY_ID}`)
      const data = await res.json()
      setParents(data.parents || [])
    } catch {
      setParents([{ id: 'default', name: 'Parent', avatar_emoji: '👤' }])
    }
    setPL(true)
  }

  function handleChildClick(avatar: any) {
    setChild(avatar); setPin(''); setError(''); setMode('pin')
  }

  function handleParentClick() {
    loadParents(); setMode('parent'); setError('')
  }

  function handlePinDigit(digit: string) {
    if (pin.length >= 4) return
    const next = pin + digit
    setPin(next)
    if (next.length === 4) submitPin(next)
  }

  async function submitPin(pinValue: string) {
    setLoading(true); setError('')
    try {
      const res  = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinValue, familyId: FAMILY_ID }),
      })
      const data = await res.json()
      if (data.success) {
        window.location.href = `/play/${data.child.token}`
      } else {
        setError(data.error || 'Wrong PIN — try again')
        setPin(''); triggerShake()
      }
    } catch {
      setError('Something went wrong'); setPin(''); triggerShake()
    } finally { setLoading(false) }
  }

  async function submitPassword() {
    if (!password) return
    setLoading(true); setError('')
    try {
      const res  = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, familyId: FAMILY_ID, parentId: selectedParent?.id }),
      })
      const data = await res.json()
      if (data.success) {
        window.location.href = '/dashboard'
      } else {
        setError(data.error || 'Wrong password'); triggerShake()
      }
    } catch {
      setError('Something went wrong'); triggerShake()
    } finally { setLoading(false) }
  }

  const numpadKeys = ['1','2','3','4','5','6','7','8','9','','0','⌫']

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F9FAFB',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16, fontFamily: '"Nunito", sans-serif',
      position: 'relative', overflow: 'hidden',
    }}>
      <style>{`
        @keyframes fadeIn { from{opacity:0;transform:scale(0.97)} to{opacity:1;transform:scale(1)} }
        @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-6px)} 75%{transform:translateX(6px)} }
        @keyframes slideUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .login-card { animation: fadeIn 0.2s ease; }
        .shake { animation: shake 0.45s ease; }
        .numpad-btn { transition: all 0.12s ease !important; }
        .numpad-btn:hover { transform: translateY(-1px); }
        .numpad-btn:active { transform: scale(0.95); }
        .child-btn:hover { transform: translateY(-3px) !important; }
        .child-btn:active { transform: scale(0.97) !important; }
        @media (max-width:480px) {
          .login-inner { padding: 24px 18px !important; }
          .child-grid { grid-template-columns: repeat(3,1fr) !important; gap: 8px !important; }
        }
      `}</style>

      {/* Soft background blobs */}
      <div style={{ position: 'absolute', top: -120, left: -120, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(74,127,212,0.1), transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -100, right: -100, width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle, rgba(46,196,182,0.08), transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '30%', right: '10%', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.06), transparent 70%)', pointerEvents: 'none' }} />

      {/* Card */}
      <div
        className={`login-card ${shake ? 'shake' : ''}`}
        style={{
          background: 'rgba(255,255,255,0.96)',
          backdropFilter: 'blur(20px)',
          borderRadius: 24, padding: '36px 32px',
          maxWidth: 420, width: '100%',
          boxShadow: '0 20px 60px rgba(74,127,212,0.12), 0 4px 20px rgba(0,0,0,0.06)',
          border: '1px solid rgba(255,255,255,0.9)',
          textAlign: 'center', position: 'relative',
        }}
      >
        <div className="login-inner" style={{ padding: 0 }}>
          {/* Logo */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ margin: '0 auto 12px', width: 'fit-content' }}>
              <img
                src="/icons/icon-512.png"
                alt="EduPlay"
                style={{ width: 72, height: 72, borderRadius: 20, display: 'block', boxShadow: '0 8px 24px rgba(74,127,212,0.3)' }}
              />
            </div>
            <div style={{ fontWeight: 900, fontSize: 27, color: '#111827', letterSpacing: '-0.02em' }}>
              Edu
              <span style={{
                background: 'linear-gradient(135deg, #4A7FD4, #2EC4B6)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                Play
              </span>
            </div>
            <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4, fontWeight: 600 }}>
              {mode === 'choose' ? 'Who is learning today?' :
               mode === 'pin'    ? `Hi ${selectedChild?.name}! 👋` :
               'Parent Dashboard'}
            </div>
          </div>

          {/* ── CHOOSE ── */}
          {mode === 'choose' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, animation: 'slideUp 0.2s ease' }}>

              {/* Children grid */}
              <div className="child-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                {CHILD_AVATARS.map(avatar => (
                  <button
                    key={avatar.name}
                    className="child-btn"
                    onClick={() => handleChildClick(avatar)}
                    style={{
                      padding: '18px 8px', borderRadius: 16,
                      border: `1.5px solid ${avatar.color}30`,
                      background: avatar.bg, cursor: 'pointer',
                      transition: 'all 0.18s ease', fontFamily: 'inherit',
                    }}
                  >
                    <div style={{ fontSize: 34, marginBottom: 6, lineHeight: 1 }}>{avatar.emoji}</div>
                    <div style={{ fontWeight: 800, fontSize: 13, color: '#111827' }}>{avatar.name}</div>
                  </button>
                ))}
              </div>

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1, height: 1, background: '#F3F4F6' }} />
                <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 700 }}>OR</span>
                <div style={{ flex: 1, height: 1, background: '#F3F4F6' }} />
              </div>

              {/* Parent button */}
              <button
                onClick={handleParentClick}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '14px 16px', borderRadius: 14,
                  border: '1.5px solid #E5E7EB', background: '#F9FAFB',
                  cursor: 'pointer', textAlign: 'left',
                  transition: 'all 0.18s ease', fontFamily: 'inherit',
                  width: '100%',
                }}
                onMouseEnter={e => {
                  (e.currentTarget.style.borderColor = '#4A7FD4')
                  ;(e.currentTarget.style.background = '#EFF6FF')
                }}
                onMouseLeave={e => {
                  (e.currentTarget.style.borderColor = '#E5E7EB')
                  ;(e.currentTarget.style.background = '#F9FAFB')
                }}
              >
                <div style={{
                  width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                  background: 'linear-gradient(135deg, #4A7FD4, #2EC4B6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Users size={20} color="white" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: '#111827' }}>Parent / Guardian</div>
                  <div style={{ fontSize: 12, color: '#6B7280', marginTop: 1 }}>Access the family dashboard</div>
                </div>
                <ChevronRight size={16} color="#9CA3AF" />
              </button>

              <button
                onClick={() => window.location.href = '/dashboard'}
                style={{
                  background: 'none', border: 'none',
                  fontSize: 12, color: '#9CA3AF', cursor: 'pointer',
                  fontWeight: 600, padding: 4, fontFamily: 'inherit',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = '#6B7280')}
                onMouseLeave={e => (e.currentTarget.style.color = '#9CA3AF')}
              >
                Skip to dashboard
              </button>
            </div>
          )}

          {/* ── PIN ── */}
          {mode === 'pin' && selectedChild && (
            <div style={{ animation: 'slideUp 0.2s ease' }}>
              {/* Avatar */}
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: selectedChild.light, border: `3px solid ${selectedChild.color}40`,
                margin: '0 auto 16px', display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontSize: 40,
              }}>
                {selectedChild.emoji}
              </div>

              {/* PIN dots */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 6 }}>
                {[0, 1, 2, 3].map(i => (
                  <div key={i} style={{
                    width: 14, height: 14, borderRadius: '50%',
                    background: i < pin.length ? selectedChild.color : '#E5E7EB',
                    transition: 'background 0.15s, transform 0.1s',
                    transform: i < pin.length ? 'scale(1.2)' : 'scale(1)',
                    boxShadow: i < pin.length ? `0 2px 8px ${selectedChild.color}40` : 'none',
                  }} />
                ))}
              </div>

              {/* Error */}
              {error && (
                <div style={{
                  fontSize: 12, color: '#EF4444', fontWeight: 700,
                  marginBottom: 12, minHeight: 18,
                }}>
                  {error}
                </div>
              )}
              {!error && <div style={{ minHeight: 30 }} />}

              {/* Numpad */}
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 8, maxWidth: 260, margin: '0 auto',
              }}>
                {numpadKeys.map((key, i) => {
                  if (key === '') return <div key={i} />
                  const isDelete = key === '⌫'
                  return (
                    <button
                      key={i}
                      className="numpad-btn"
                      onClick={() => isDelete ? (setPin(p => p.slice(0, -1)), setError('')) : handlePinDigit(key)}
                      disabled={loading}
                      style={{
                        padding: '14px 8px', borderRadius: 12,
                        border: `1.5px solid ${isDelete ? '#FEE2E2' : '#E5E7EB'}`,
                        background: isDelete ? '#FEF2F2' : 'white',
                        color: isDelete ? '#EF4444' : '#111827',
                        fontSize: isDelete ? 16 : 20,
                        fontWeight: 800, cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                        fontFamily: 'inherit',
                        opacity: loading ? 0.6 : 1,
                      }}
                    >
                      {loading && key !== '⌫' && pin.length === 4 ? '…' : key}
                    </button>
                  )
                })}
              </div>

              <button
                onClick={() => { setMode('choose'); setPin(''); setError('') }}
                style={{
                  marginTop: 20, display: 'flex', alignItems: 'center', gap: 5,
                  background: 'none', border: 'none', color: '#9CA3AF',
                  fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  margin: '20px auto 0', fontFamily: 'inherit',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = '#6B7280')}
                onMouseLeave={e => (e.currentTarget.style.color = '#9CA3AF')}
              >
                <ArrowLeft size={12} /> Back
              </button>
            </div>
          )}

          {/* ── PARENT LOGIN ── */}
          {mode === 'parent' && (
            <div style={{ animation: 'slideUp 0.2s ease', textAlign: 'left' }}>
              {/* Parent selector */}
              {parents.length > 1 && (
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                    Select account
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {parents.map(p => (
                      <button
                        key={p.id}
                        onClick={() => setParent(p)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '10px 14px', borderRadius: 12,
                          border: `1.5px solid ${selectedParent?.id === p.id ? '#4A7FD4' : '#E5E7EB'}`,
                          background: selectedParent?.id === p.id ? '#EFF6FF' : '#F9FAFB',
                          cursor: 'pointer', transition: 'all 0.15s',
                          fontFamily: 'inherit', width: '100%', textAlign: 'left',
                        }}
                      >
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%',
                          background: 'linear-gradient(135deg, #4A7FD4, #2EC4B6)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 18, flexShrink: 0,
                        }}>
                          {p.avatar_emoji || '👤'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 13, color: '#111827' }}>{p.name}</div>
                          <div style={{ fontSize: 11, color: '#9CA3AF' }}>{p.role === 'admin' ? 'Admin' : 'Parent'}</div>
                        </div>
                        {selectedParent?.id === p.id && (
                          <div style={{ marginLeft: 'auto', width: 20, height: 20, borderRadius: '50%', background: '#4A7FD4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="10" height="10" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Password input */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} color="#9CA3AF" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError('') }}
                    onKeyDown={e => e.key === 'Enter' && submitPassword()}
                    placeholder="Enter password"
                    style={{
                      width: '100%', padding: '11px 44px 11px 42px',
                      background: '#FAFAFA', border: '1.5px solid #E5E7EB',
                      borderRadius: 12, fontSize: 14, fontWeight: 600,
                      color: '#111827', outline: 'none', fontFamily: 'inherit',
                      transition: 'all 0.2s',
                    }}
                    onFocus={e => {
                      e.currentTarget.style.borderColor = '#4A7FD4'
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(74,127,212,0.15)'
                      e.currentTarget.style.background = 'white'
                    }}
                    onBlur={e => {
                      e.currentTarget.style.borderColor = '#E5E7EB'
                      e.currentTarget.style.boxShadow = 'none'
                      e.currentTarget.style.background = '#FAFAFA'
                    }}
                  />
                  <button
                    onClick={() => setShowPass(v => !v)}
                    style={{
                      position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#9CA3AF',
                    }}
                  >
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div style={{
                  fontSize: 12, color: '#EF4444', fontWeight: 700,
                  marginBottom: 12, display: 'flex', alignItems: 'center', gap: 5,
                }}>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>!</div>
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                onClick={submitPassword}
                disabled={!password || loading}
                style={{
                  width: '100%', padding: '13px',
                  background: 'linear-gradient(135deg, #4A7FD4, #2EC4B6)',
                  color: 'white', border: 'none', borderRadius: 50,
                  fontWeight: 800, fontSize: 14, cursor: !password || loading ? 'not-allowed' : 'pointer',
                  opacity: !password || loading ? 0.65 : 1,
                  boxShadow: '0 4px 14px rgba(74,127,212,0.35)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'all 0.18s', fontFamily: 'inherit',
                }}
                onMouseEnter={e => { if (password && !loading) (e.currentTarget.style.transform = 'translateY(-1px)') }}
                onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
              >
                {loading
                  ? <><div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Signing in...</>
                  : <><Shield size={14} /> Sign In</>
                }
              </button>

              <button
                onClick={() => { setMode('choose'); setError(''); setPassword('') }}
                style={{
                  marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                  background: 'none', border: 'none', color: '#9CA3AF',
                  fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  width: '100%', fontFamily: 'inherit', transition: 'color 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = '#6B7280')}
                onMouseLeave={e => (e.currentTarget.style.color = '#9CA3AF')}
              >
                <ArrowLeft size={12} /> Back to login
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
