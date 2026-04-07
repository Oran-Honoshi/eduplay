'use client'
import { useState } from 'react'

const FAMILY_ID = '11111111-1111-1111-1111-111111111111'

const AVATARS = [
  { emoji: '🐱', color: '#FF6B6B', name: 'Lia' },
  { emoji: '🐻', color: '#4A7FD4', name: 'Tamar' },
  { emoji: '🦊', color: '#2EC4B6', name: 'Tom' },
  { emoji: '👩', color: '#9B59B6', name: 'Parent' },
]

export default function LoginPage() {
  const [mode, setMode]         = useState<'choose'|'pin'|'parent'>('choose')
  const [selectedAvatar, setSelectedAvatar] = useState<any>(null)
  const [pin, setPin]           = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [shake, setShake]       = useState(false)

  function triggerShake() {
    setShake(true)
    setTimeout(() => setShake(false), 500)
  }

  function handleAvatarClick(avatar: any) {
    setSelectedAvatar(avatar)
    setPin('')
    setError('')
    if (avatar.name === 'Parent') {
      setMode('parent')
    } else {
      setMode('pin')
    }
  }

  function handlePinDigit(digit: string) {
    if (pin.length >= 4) return
    const newPin = pin + digit
    setPin(newPin)
    if (newPin.length === 4) {
      submitPin(newPin)
    }
  }

  function handlePinDelete() {
    setPin(p => p.slice(0, -1))
    setError('')
  }

  async function submitPin(pinValue: string) {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinValue, familyId: FAMILY_ID }),
      })
      const data = await res.json()
      if (data.success) {
        window.location.href = `/play/${data.child.token}`
      } else {
        setError(data.error || 'Wrong PIN!')
        setPin('')
        triggerShake()
      }
    } catch {
      setError('Something went wrong!')
      setPin('')
      triggerShake()
    } finally {
      setLoading(false)
    }
  }

  async function submitPassword() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, familyId: FAMILY_ID }),
      })
      const data = await res.json()
      if (data.success) {
        window.location.href = '/dashboard'
      } else {
        setError(data.error || 'Wrong password!')
        triggerShake()
      }
    } catch {
      setError('Something went wrong!')
      triggerShake()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#1E2D4E,#4A7FD4)', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px', fontFamily:'"Nunito",sans-serif' }}>

      <div style={{ background:'white', borderRadius:'24px', padding:'36px', maxWidth:'420px', width:'100%', boxShadow:'0 24px 64px rgba(0,0,0,0.3)', textAlign:'center' }}>

        {/* Logo */}
        <div style={{ marginBottom:'24px' }}>
          <div style={{ width:'56px', height:'56px', background:'linear-gradient(135deg,#4A7FD4,#2EC4B6)', borderRadius:'16px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'28px', margin:'0 auto 10px' }}>🦔</div>
          <div style={{ fontFamily:'"Nunito",sans-serif', fontWeight:900, fontSize:'24px', color:'#1E2D4E' }}>
            Edu<span style={{ color:'#4A7FD4' }}>Play</span>
          </div>
          <div style={{ fontSize:'13px', color:'#9AA5B8', marginTop:'4px' }}>Who is learning today?</div>
        </div>

        {/* Avatar chooser */}
        {mode === 'choose' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
            {AVATARS.map(avatar => (
              <button key={avatar.name} onClick={() => handleAvatarClick(avatar)}
                style={{ padding:'20px 12px', borderRadius:'16px', border:`2px solid ${avatar.color}20`, background:`${avatar.color}10`, cursor:'pointer', transition:'all 0.2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform='scale(1.05)'; (e.currentTarget as HTMLElement).style.boxShadow=`0 8px 24px ${avatar.color}40` }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform='scale(1)'; (e.currentTarget as HTMLElement).style.boxShadow='none' }}>
                <div style={{ fontSize:'36px', marginBottom:'8px' }}>{avatar.emoji}</div>
                <div style={{ fontWeight:800, fontSize:'14px', color:'#1E2D4E' }}>{avatar.name}</div>
              </button>
            ))}
          </div>
        )}

        {/* PIN entry */}
        {mode === 'pin' && selectedAvatar && (
          <div>
            <button onClick={() => { setMode('choose'); setPin(''); setError('') }}
              style={{ position:'absolute', top:'20px', left:'20px', background:'none', border:'none', fontSize:'20px', cursor:'pointer', color:'#9AA5B8' }}>←</button>

            <div style={{ fontSize:'48px', marginBottom:'8px' }}>{selectedAvatar.emoji}</div>
            <div style={{ fontWeight:800, fontSize:'18px', color:'#1E2D4E', marginBottom:'4px' }}>Hi {selectedAvatar.name}! 👋</div>
            <div style={{ fontSize:'13px', color:'#9AA5B8', marginBottom:'24px' }}>Enter your 4-digit PIN</div>

            {/* PIN dots */}
            <div style={{ display:'flex', justifyContent:'center', gap:'12px', marginBottom:'24px' }}>
              {[0,1,2,3].map(i => (
                <div key={i} style={{
                  width:'16px', height:'16px', borderRadius:'50%',
                  background: pin.length > i ? selectedAvatar.color : '#EEF1F6',
                  border:`2px solid ${pin.length > i ? selectedAvatar.color : '#DEE2E6'}`,
                  transition:'all 0.15s',
                  transform: shake ? 'translateX(4px)' : 'translateX(0)',
                }}/>
              ))}
            </div>

            {error && (
              <div style={{ background:'#FEE2E2', color:'#DC2626', borderRadius:'8px', padding:'8px 14px', fontSize:'13px', fontWeight:700, marginBottom:'16px' }}>
                {error}
              </div>
            )}

            {/* Numpad */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px', maxWidth:'240px', margin:'0 auto' }}>
              {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((digit, i) => (
                <button key={i} onClick={() => digit === '⌫' ? handlePinDelete() : digit ? handlePinDigit(digit) : null}
                  disabled={loading || !digit}
                  style={{
                    padding:'16px', borderRadius:'12px',
                    border:`2px solid ${digit ? '#EEF1F6' : 'transparent'}`,
                    background: digit === '⌫' ? '#FEE2E2' : digit ? 'white' : 'transparent',
                    fontWeight:800, fontSize:'20px',
                    color: digit === '⌫' ? '#DC2626' : '#1E2D4E',
                    cursor: digit ? 'pointer' : 'default',
                    boxShadow: digit ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                    opacity: loading ? 0.5 : 1,
                  }}>
                  {loading && digit === '0' ? '...' : digit}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Parent password */}
        {mode === 'parent' && (
          <div style={{ position:'relative' }}>
            <button onClick={() => { setMode('choose'); setPassword(''); setError('') }}
              style={{ position:'absolute', top:'-60px', left:'0', background:'none', border:'none', fontSize:'20px', cursor:'pointer', color:'#9AA5B8' }}>←</button>

            <div style={{ fontSize:'48px', marginBottom:'8px' }}>👩</div>
            <div style={{ fontWeight:800, fontSize:'18px', color:'#1E2D4E', marginBottom:'4px' }}>Parent Login</div>
            <div style={{ fontSize:'13px', color:'#9AA5B8', marginBottom:'24px' }}>Enter your password</div>

            {error && (
              <div style={{ background:'#FEE2E2', color:'#DC2626', borderRadius:'8px', padding:'8px 14px', fontSize:'13px', fontWeight:700, marginBottom:'16px' }}>
                {error}
              </div>
            )}

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && submitPassword()}
              style={{ width:'100%', padding:'14px 16px', borderRadius:'12px', border:'2px solid #EEF1F6', fontSize:'16px', outline:'none', marginBottom:'14px', boxSizing:'border-box',
                borderColor: error ? '#DC2626' : '#EEF1F6' }}
            />

            <button onClick={submitPassword} disabled={loading || !password}
              style={{ width:'100%', padding:'14px', borderRadius:'12px', border:'none', background:'linear-gradient(135deg,#4A7FD4,#2EC4B6)', color:'white', fontWeight:800, fontSize:'16px', cursor:'pointer', opacity: loading || !password ? 0.6 : 1 }}>
              {loading ? 'Logging in...' : 'Enter Dashboard →'}
            </button>

            <div style={{ marginTop:'16px', fontSize:'12px', color:'#9AA5B8' }}>
              Default password: <strong>eduplay2024</strong>
            </div>
          </div>
        )}

        {/* Skip to dashboard link */}
        {mode === 'choose' && (
          <div style={{ marginTop:'20px' }}>
            <button onClick={() => window.location.href='/dashboard'}
              style={{ background:'none', border:'none', fontSize:'12px', color:'#9AA5B8', cursor:'pointer', textDecoration:'underline' }}>
              Go to dashboard without login
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
