'use client'
import { useState } from 'react'
import { Lock, Eye, EyeOff, ChevronRight, ArrowLeft, Users, Loader2 } from 'lucide-react'

const FAMILY_ID = '11111111-1111-1111-1111-111111111111'

const CHILD_AVATARS = [
  { emoji: '🐱', name: 'Lia',   color: '#EF4444', bg: 'linear-gradient(135deg,#FF9F43,#FF6B6B)' },
  { emoji: '🐻', name: 'Tamar', color: '#4A7FD4', bg: 'linear-gradient(135deg,#4A7FD4,#2EC4B6)' },
  { emoji: '🦊', name: 'Tom',   color: '#8B5CF6', bg: 'linear-gradient(135deg,#8B5CF6,#C084FC)' },
]

export default function LoginPage() {
  const [mode, setMode]                     = useState<'choose' | 'pin' | 'parent'>('choose')
  const [parents, setParents]               = useState<any[]>([])
  const [selectedChild, setChild]           = useState<any>(null)
  const [selectedParent, setParent]         = useState<any>(null)
  const [pin, setPin]                       = useState('')
  const [password, setPassword]             = useState('')
  const [showPass, setShowPass]             = useState(false)
  const [error, setError]                   = useState('')
  const [loading, setLoading]               = useState(false)
  const [shake, setShake]                   = useState(false)
  const [parentsLoaded, setParentsLoaded]   = useState(false)

  function triggerShake() {
    setShake(true)
    setTimeout(() => setShake(false), 500)
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
    setParentsLoaded(true)
  }

  function handleChildClick(avatar: any) {
    setChild(avatar); setPin(''); setError(''); setMode('pin')
  }

  function handleParentClick() {
    loadParents(); setMode('parent'); setError('')
  }

  function handlePinDigit(digit: string) {
    if (pin.length >= 4 || loading) return
    const next = pin + digit
    setPin(next)
    if (next.length === 4) submitPin(next)
  }

  function handlePinDelete() {
    setPin(p => p.slice(0, -1)); setError('')
  }

  async function submitPin(pinValue: string) {
    setLoading(true); setError('')
    try {
      const res  = await fetch('/api/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
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
    if (!password || loading) return
    setLoading(true); setError('')
    try {
      const res  = await fetch('/api/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
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

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1E3A5F 0%, #2A5298 50%, #1A7A5E 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, fontFamily: '"Nunito", system-ui, sans-serif',
      position: 'relative', overflow: 'hidden',
    }}>
      <style>{`
        @keyframes shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-8px)} 40%,80%{transform:translateX(8px)} }
        @keyframes pop { 0%{transform:scale(0.8);opacity:0} 100%{transform:scale(1);opacity:1} }
        @keyframes slideUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        .pin-dots { animation: ${shake ? 'shake 0.4s ease' : 'none'}; }
        .login-card { animation: pop 0.25s ease; }
        .child-btn { transition: all 0.18s ease !important; }
        .child-btn:hover { transform: translateY(-4px) !important; box-shadow: 0 12px 32px rgba(0,0,0,0.2) !important; }
        .numpad-btn { transition: all 0.1s ease !important; }
        .numpad-btn:active { transform: scale(0.94) !important; }
        input:focus { outline: none; border-color: #4A7FD4 !important; box-shadow: 0 0 0 3px rgba(74,127,212,0.15) !important; }
        @media(max-width:480px) {
          .login-card { padding: 28px 20px !important; }
          .numpad-btn { padding: 14px 8px !important; }
        }
      `}</style>

      {/* Background blobs */}
      <div style={{ position: 'absolute', top: -100, left: -100, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle,rgba(74,127,212,0.2),transparent)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -80, right: -80, width: 340, height: 340, borderRadius: '50%', background: 'radial-gradient(circle,rgba(46,196,182,0.15),transparent)', pointerEvents: 'none' }} />

      {/* Card */}
      <div className="login-card" style={{
        background: 'rgba(255,255,255,0.98)',
        borderRadius: 24, padding: '36px 32px',
        maxWidth: 420, width: '100%',
        boxShadow: '0 24px 80px rgba(0,0,0,0.28)',
        border: '1px solid rgba(255,255,255,0.9)',
        textAlign: 'center', position: 'relative',
      }}>

        {/* Logo */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ width: 62, height: 62, margin: '0 auto 12px', borderRadius: 18, overflow: 'hidden', boxShadow: '0 8px 24px rgba(74,127,212,0.3)' }}>
            <img src="/icons/icon-512.png" alt="EduPlay" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ fontWeight: 900, fontSize: 26, color: '#111827', letterSpacing: '-0.02em' }}>
            Edu<span style={{ background: 'linear-gradient(135deg,#4A7FD4,#2EC4B6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Play</span>
          </div>
          <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4, fontWeight: 600 }}>
            {mode === 'choose' ? 'Who is learning today?' :
             mode === 'pin'    ? `Hi ${selectedChild?.name}! Enter your PIN 👋` :
             'Parent Dashboard'}
          </div>
        </div>

        {/* ── CHOOSE ── */}
        {mode === 'choose' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, animation: 'slideUp 0.2s ease' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
              {CHILD_AVATARS.map(avatar => (
                <button key={avatar.name}
                  className="child-btn"
                  onClick={() => handleChildClick(avatar)}
                  style={{
                    padding: '20px 10px', borderRadius: 18,
                    border: 'none', background: 'white',
                    cursor: 'pointer', boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                    outline: `2px solid ${avatar.color}20`,
                  }}
                >
                  <div style={{
                    width: 52, height: 52, borderRadius: '50%',
                    background: avatar.bg, margin: '0 auto 10px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 26, boxShadow: `0 4px 14px ${avatar.color}30`,
                  }}>
                    {avatar.emoji}
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 14, color: '#111827' }}>{avatar.name}</div>
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, height: 1, background: '#F3F4F6' }} />
              <span style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 600 }}>or</span>
              <div style={{ flex: 1, height: 1, background: '#F3F4F6' }} />
            </div>

            <button onClick={handleParentClick} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '15px 16px', borderRadius: 14,
              border: '1.5px solid #E5E7EB', background: '#F9FAFB',
              cursor: 'pointer', textAlign: 'left', width: '100%',
              transition: 'all 0.15s', fontFamily: 'inherit',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#4A7FD4'; (e.currentTarget as HTMLElement).style.background = '#EFF6FF' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#E5E7EB'; (e.currentTarget as HTMLElement).style.background = '#F9FAFB' }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#4A7FD4,#2EC4B6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Users size={20} color="white" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: '#111827' }}>Parent / Guardian</div>
                <div style={{ fontSize: 12, color: '#6B7280', marginTop: 1 }}>Access the family dashboard</div>
              </div>
              <ChevronRight size={17} color="#9CA3AF" />
            </button>
          </div>
        )}

        {/* ── PIN ── */}
        {mode === 'pin' && selectedChild && (
          <div style={{ animation: 'slideUp 0.2s ease' }}>
            <button onClick={() => { setMode('choose'); setPin(''); setError('') }} style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: 'none', border: 'none', fontSize: 13,
              cursor: 'pointer', color: '#6B7280', fontWeight: 700,
              marginBottom: 20, fontFamily: 'inherit',
            }}>
              <ArrowLeft size={14} /> Back
            </button>

            {/* Avatar */}
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: selectedChild.bg, margin: '0 auto 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 36, boxShadow: `0 8px 24px ${selectedChild.color}35`,
            }}>
              {selectedChild.emoji}
            </div>

            {/* PIN dots */}
            <div className="pin-dots" style={{ display: 'flex', justifyContent: 'center', gap: 14, marginBottom: 24 }}>
              {[0, 1, 2, 3].map(i => (
                <div key={i} style={{
                  width: 18, height: 18, borderRadius: '50%',
                  background: pin.length > i ? selectedChild.color : '#F3F4F6',
                  border: `2px solid ${pin.length > i ? selectedChild.color : '#E5E7EB'}`,
                  boxShadow: pin.length > i ? `0 2px 8px ${selectedChild.color}40` : 'none',
                  transition: 'all 0.15s',
                }} />
              ))}
            </div>

            {error && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', borderRadius: 10, padding: '10px 14px', fontSize: 13, fontWeight: 700, marginBottom: 16 }}>
                {error}
              </div>
            )}

            {/* Numpad */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, maxWidth: 260, margin: '0 auto' }}>
              {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((digit, i) => (
                <button key={i}
                  className="numpad-btn"
                  onClick={() => digit === '⌫' ? handlePinDelete() : digit ? handlePinDigit(digit) : undefined}
                  disabled={loading || !digit}
                  style={{
                    padding: '16px', borderRadius: 14,
                    border: `1.5px solid ${digit === '⌫' ? '#FECACA' : digit ? '#E5E7EB' : 'transparent'}`,
                    background: digit === '⌫' ? '#FEF2F2' : digit ? 'white' : 'transparent',
                    fontWeight: 900, fontSize: 22,
                    color: digit === '⌫' ? '#DC2626' : '#111827',
                    cursor: digit ? 'pointer' : 'default',
                    boxShadow: digit ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                    opacity: loading ? 0.6 : 1,
                    fontFamily: 'inherit',
                  }}
                >
                  {loading && digit === '0' ? <Loader2 size={18} style={{ animation: 'spin 0.7s linear infinite', margin: '0 auto' }} /> : digit}
                </button>
              ))}
            </div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        )}

        {/* ── PARENT ── */}
        {mode === 'parent' && (
          <div style={{ animation: 'slideUp 0.2s ease' }}>
            <button onClick={() => { setMode('choose'); setPassword(''); setError(''); setParent(null) }} style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: 'none', border: 'none', fontSize: 13,
              cursor: 'pointer', color: '#6B7280', fontWeight: 700,
              marginBottom: 20, fontFamily: 'inherit',
            }}>
              <ArrowLeft size={14} /> Back
            </button>

            {/* Profile picker */}
            {parents.length > 1 && !selectedParent && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 14, color: '#6B7280', marginBottom: 12, fontWeight: 600 }}>Select your profile:</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {parents.map(parent => (
                    <button key={parent.id} onClick={() => setParent(parent)} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '13px 16px', borderRadius: 14,
                      border: '1.5px solid #E5E7EB', background: '#F9FAFB',
                      cursor: 'pointer', textAlign: 'left', width: '100%',
                      transition: 'all 0.15s', fontFamily: 'inherit',
                    }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#4A7FD4'; (e.currentTarget as HTMLElement).style.background = '#EFF6FF' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#E5E7EB'; (e.currentTarget as HTMLElement).style.background = '#F9FAFB' }}
                    >
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#4A7FD4,#2EC4B6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                        {parent.avatar_emoji || '👤'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 800, fontSize: 14, color: '#111827' }}>{parent.name}</div>
                        <div style={{ fontSize: 12, color: '#6B7280' }}>{parent.role === 'admin' ? 'Admin' : 'Parent'}</div>
                      </div>
                      <ChevronRight size={15} color="#9CA3AF" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Password form */}
            {(parents.length <= 1 || selectedParent) && (
              <>
                {selectedParent && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, padding: '10px 14px', background: '#F9FAFB', borderRadius: 12, border: '1px solid #E5E7EB' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#4A7FD4,#2EC4B6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                      {selectedParent.avatar_emoji || '👤'}
                    </div>
                    <span style={{ fontWeight: 800, fontSize: 14, color: '#111827', flex: 1 }}>{selectedParent.name}</span>
                    <button onClick={() => setParent(null)} style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit' }}>
                      Change
                    </button>
                  </div>
                )}

                <div style={{ fontSize: 46, marginBottom: 8 }}>{selectedParent?.avatar_emoji || '👨‍👩‍👧'}</div>
                <div style={{ fontWeight: 900, fontSize: 18, color: '#111827', marginBottom: 3 }}>
                  {selectedParent ? `Hi ${selectedParent.name}!` : 'Welcome back!'}
                </div>
                <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 20, fontWeight: 600 }}>Enter your password</div>

                {error && (
                  <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', borderRadius: 10, padding: '10px 14px', fontSize: 13, fontWeight: 700, marginBottom: 14 }}>
                    {error}
                  </div>
                )}

                <div style={{ position: 'relative', marginBottom: 12 }}>
                  <Lock size={15} color="#9CA3AF" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  <input
                    type={showPass ? 'text' : 'password'}
                    placeholder="Your password"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError('') }}
                    onKeyDown={e => e.key === 'Enter' && submitPassword()}
                    autoFocus
                    style={{
                      width: '100%', padding: '14px 44px 14px 42px',
                      borderRadius: 12, border: `1.5px solid ${error ? '#EF4444' : '#E5E7EB'}`,
                      fontSize: 15, color: '#111827', background: '#FAFAFA',
                      transition: 'all 0.15s', boxSizing: 'border-box' as any,
                      fontFamily: 'inherit',
                    }}
                  />
                  <button onClick={() => setShowPass(v => !v)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', padding: 2 }}>
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>

                <button onClick={submitPassword} disabled={loading || !password} style={{
                  width: '100%', padding: 15, borderRadius: 50, border: 'none',
                  background: 'linear-gradient(135deg,#4A7FD4,#2EC4B6)',
                  color: 'white', fontWeight: 800, fontSize: 15,
                  cursor: loading || !password ? 'not-allowed' : 'pointer',
                  opacity: loading || !password ? 0.6 : 1,
                  boxShadow: '0 4px 14px rgba(74,127,212,0.35)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  fontFamily: 'inherit', transition: 'all 0.15s',
                }}>
                  {loading ? <><Loader2 size={16} style={{ animation: 'spin 0.7s linear infinite' }} /> Logging in…</> : 'Enter Dashboard →'}
                </button>

                <div style={{ marginTop: 12, fontSize: 12, color: '#9CA3AF', fontWeight: 600 }}>
                  Default password: <strong style={{ color: '#6B7280' }}>eduplay2024</strong>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
