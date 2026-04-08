'use client'
import { useState } from 'react'

const FAMILY_ID = '11111111-1111-1111-1111-111111111111'

export default function LoginPage() {
  const [mode, setMode]       = useState<'choose'|'pin'|'parent'>('choose')
  const [parents, setParents] = useState<any[]>([])
  const [selectedChild, setSelectedChild]   = useState<any>(null)
  const [selectedParent, setSelectedParent] = useState<any>(null)
  const [pin, setPin]         = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const [shake, setShake]     = useState(false)
  const [parentsLoaded, setParentsLoaded] = useState(false)

  const CHILD_AVATARS = [
    { emoji:'🐱', name:'Lia',   color:'#FF6B6B' },
    { emoji:'🐻', name:'Tamar', color:'#4A7FD4' },
    { emoji:'🦊', name:'Tom',   color:'#2EC4B6' },
  ]

  function triggerShake() {
    setShake(true)
    setTimeout(() => setShake(false), 500)
  }

  async function loadParents() {
    if (parentsLoaded) return
    try {
      const res = await fetch(`/api/parents?familyId=${FAMILY_ID}`)
      const data = await res.json()
      setParents(data.parents || [])
    } catch {
      setParents([{ id:'default', name:'Parent', avatar_emoji:'👤', password:'eduplay2024' }])
    }
    setParentsLoaded(true)
  }

  function handleChildClick(avatar: any) {
    setSelectedChild(avatar)
    setPin('')
    setError('')
    setMode('pin')
  }

  function handleParentClick() {
    loadParents()
    setMode('parent')
    setError('')
  }

  function handlePinDigit(digit: string) {
    if (pin.length >= 4) return
    const newPin = pin + digit
    setPin(newPin)
    if (newPin.length === 4) submitPin(newPin)
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
    if (!password) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password,
          familyId: FAMILY_ID,
          parentId: selectedParent?.id,
        }),
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
      <div style={{ background:'white', borderRadius:'24px', padding:'36px', maxWidth:'440px', width:'100%', boxShadow:'0 24px 64px rgba(0,0,0,0.3)', textAlign:'center', position:'relative' }}>

        {/* Logo */}
        <div style={{ marginBottom:'24px' }}>
          <div style={{ width:'56px', height:'56px', background:'linear-gradient(135deg,#4A7FD4,#2EC4B6)', borderRadius:'16px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'28px', margin:'0 auto 10px' }}>🦔</div>
          <div style={{ fontWeight:900, fontSize:'24px', color:'#1E2D4E' }}>
            Edu<span style={{ color:'#4A7FD4' }}>Play</span>
          </div>
          <div style={{ fontSize:'13px', color:'#9AA5B8', marginTop:'4px' }}>
            {mode === 'choose' ? 'Who is learning today?' : mode === 'pin' ? `Hi ${selectedChild?.name}! 👋` : 'Parent Login'}
          </div>
        </div>

        {/* CHOOSE */}
        {mode === 'choose' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px', marginBottom:'4px' }}>
              {CHILD_AVATARS.map(avatar => (
                <button key={avatar.name} onClick={() => handleChildClick(avatar)}
                  style={{ padding:'18px 10px', borderRadius:'16px', border:`2px solid ${avatar.color}20`, background:`${avatar.color}10`, cursor:'pointer', transition:'all 0.15s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform='scale(1.05)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform='scale(1)' }}>
                  <div style={{ fontSize:'32px', marginBottom:'6px' }}>{avatar.emoji}</div>
                  <div style={{ fontWeight:800, fontSize:'13px', color:'#1E2D4E' }}>{avatar.name}</div>
                </button>
              ))}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'10px', margin:'4px 0' }}>
              <div style={{ flex:1, height:'1px', background:'#EEF1F6' }}/>
              <span style={{ fontSize:'12px', color:'#9AA5B8', fontWeight:600 }}>or</span>
              <div style={{ flex:1, height:'1px', background:'#EEF1F6' }}/>
            </div>
            <button onClick={handleParentClick}
              style={{ padding:'14px', borderRadius:'14px', border:'2px solid #EEF1F6', background:'#F8F9FB', cursor:'pointer', display:'flex', alignItems:'center', gap:'12px' }}>
              <div style={{ width:'40px', height:'40px', borderRadius:'50%', background:'linear-gradient(135deg,#4A7FD4,#2EC4B6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px' }}>👨‍👩‍👧</div>
              <div style={{ textAlign:'left' }}>
                <div style={{ fontWeight:800, fontSize:'14px', color:'#1E2D4E' }}>Parent / Guardian</div>
                <div style={{ fontSize:'11px', color:'#9AA5B8' }}>Access family dashboard</div>
              </div>
              <span style={{ marginLeft:'auto', color:'#9AA5B8' }}>→</span>
            </button>
            <button onClick={() => window.location.href='/dashboard'}
              style={{ background:'none', border:'none', fontSize:'11px', color:'#C0C8D4', cursor:'pointer', marginTop:'4px' }}>
              Skip to dashboard
            </button>
          </div>
        )}

        {/* PIN */}
        {mode === 'pin' && selectedChild && (
          <div style={{ position:'relative' }}>
            <button onClick={() => { setMode('choose'); setPin(''); setError('') }}
              style={{ position:'absolute', top:'-20px', left:0, background:'none', border:'none', fontSize:'20px', cursor:'pointer', color:'#9AA5B8' }}>←</button>
            <div style={{ fontSize:'48px', marginBottom:'16px' }}>{selectedChild.emoji}</div>
            <div style={{ display:'flex', justifyContent:'center', gap:'14px', marginBottom:'24px' }}>
              {[0,1,2,3].map(i => (
                <div key={i} style={{ width:'18px', height:'18px', borderRadius:'50%', background:pin.length > i ? selectedChild.color : '#EEF1F6', border:`2px solid ${pin.length > i ? selectedChild.color : '#DEE2E6'}`, transition:'all 0.15s', transform:shake?'translateX(5px)':'translateX(0)' }}/>
              ))}
            </div>
            {error && (
              <div style={{ background:'#FEE2E2', color:'#DC2626', borderRadius:'10px', padding:'8px 14px', fontSize:'13px', fontWeight:700, marginBottom:'16px' }}>{error}</div>
            )}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px', maxWidth:'240px', margin:'0 auto' }}>
              {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((digit, i) => (
                <button key={i}
                  onClick={() => digit === '⌫' ? handlePinDelete() : digit ? handlePinDigit(digit) : null}
                  disabled={loading || !digit}
                  style={{ padding:'16px', borderRadius:'12px', border:`2px solid ${digit?'#EEF1F6':'transparent'}`, background:digit==='⌫'?'#FEE2E2':digit?'white':'transparent', fontWeight:800, fontSize:'20px', color:digit==='⌫'?'#DC2626':'#1E2D4E', cursor:digit?'pointer':'default', boxShadow:digit?'0 2px 8px rgba(0,0,0,0.06)':'none', opacity:loading?0.5:1 }}>
                  {loading && digit === '0' ? '...' : digit}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* PARENT */}
        {mode === 'parent' && (
          <div style={{ position:'relative' }}>
            <button onClick={() => { setMode('choose'); setPassword(''); setError(''); setSelectedParent(null) }}
              style={{ position:'absolute', top:'-20px', left:0, background:'none', border:'none', fontSize:'20px', cursor:'pointer', color:'#9AA5B8' }}>←</button>

            {parents.length > 1 && !selectedParent && (
              <div style={{ marginBottom:'20px' }}>
                <div style={{ fontSize:'13px', color:'#5A6A7E', marginBottom:'12px' }}>Select your profile:</div>
                <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                  {parents.map(parent => (
                    <button key={parent.id} onClick={() => setSelectedParent(parent)}
                      style={{ padding:'12px 16px', borderRadius:'12px', border:'2px solid #EEF1F6', background:'#F8F9FB', cursor:'pointer', display:'flex', alignItems:'center', gap:'12px' }}>
                      <div style={{ width:'36px', height:'36px', borderRadius:'50%', background:'linear-gradient(135deg,#4A7FD4,#2EC4B6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px' }}>
                        {parent.avatar_emoji || '👤'}
                      </div>
                      <div style={{ textAlign:'left' }}>
                        <div style={{ fontWeight:800, fontSize:'14px', color:'#1E2D4E' }}>{parent.name}</div>
                        <div style={{ fontSize:'11px', color:'#9AA5B8' }}>{parent.role === 'admin' ? '⚙️ Admin' : '👤 Parent'}</div>
                      </div>
                      <span style={{ marginLeft:'auto', color:'#9AA5B8' }}>→</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(parents.length <= 1 || selectedParent) && (
              <>
                {selectedParent && (
                  <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'20px', padding:'10px 14px', background:'#F8F9FB', borderRadius:'12px' }}>
                    <div style={{ width:'32px', height:'32px', borderRadius:'50%', background:'linear-gradient(135deg,#4A7FD4,#2EC4B6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px' }}>
                      {selectedParent.avatar_emoji || '👤'}
                    </div>
                    <span style={{ fontWeight:800, fontSize:'14px', color:'#1E2D4E' }}>{selectedParent.name}</span>
                    <button onClick={() => setSelectedParent(null)} style={{ marginLeft:'auto', background:'none', border:'none', color:'#9AA5B8', cursor:'pointer', fontSize:'12px' }}>Change</button>
                  </div>
                )}
                <div style={{ fontSize:'48px', marginBottom:'8px' }}>{selectedParent?.avatar_emoji || '👨‍👩‍👧'}</div>
                <div style={{ fontWeight:800, fontSize:'16px', color:'#1E2D4E', marginBottom:'4px' }}>
                  {selectedParent ? `Hi ${selectedParent.name}!` : 'Parent Login'}
                </div>
                <div style={{ fontSize:'13px', color:'#9AA5B8', marginBottom:'20px' }}>Enter your password</div>
                {error && (
                  <div style={{ background:'#FEE2E2', color:'#DC2626', borderRadius:'10px', padding:'8px 14px', fontSize:'13px', fontWeight:700, marginBottom:'16px' }}>{error}</div>
                )}
                <input type="password" placeholder="Password" value={password}
                  onChange={e => { setPassword(e.target.value); setError('') }}
                  onKeyDown={e => e.key === 'Enter' && submitPassword()}
                  autoFocus
                  style={{ width:'100%', padding:'14px 16px', borderRadius:'12px', border:`2px solid ${error?'#DC2626':'#EEF1F6'}`, fontSize:'16px', outline:'none', marginBottom:'12px', boxSizing:'border-box', color:'#1E2D4E' }}
                />
                <button onClick={submitPassword} disabled={loading || !password}
                  style={{ width:'100%', padding:'14px', borderRadius:'12px', border:'none', background:'linear-gradient(135deg,#4A7FD4,#2EC4B6)', color:'white', fontWeight:800, fontSize:'16px', cursor:'pointer', opacity:loading||!password?0.6:1 }}>
                  {loading ? 'Logging in...' : 'Enter Dashboard →'}
                </button>
                <div style={{ marginTop:'12px', fontSize:'11px', color:'#9AA5B8' }}>
                  Default password: <strong>eduplay2024</strong>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
