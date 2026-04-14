'use client'
import { useState } from 'react'
import { Lock, Eye, EyeOff, ChevronRight, ArrowLeft, Users } from 'lucide-react'

const FAMILY_ID = '11111111-1111-1111-1111-111111111111'

const mobileStyles = `
  @media (max-width: 480px) {
    .login-card { padding: 24px 20px !important; border-radius: 16px !important; }
    .child-grid { grid-template-columns: repeat(3,1fr) !important; gap: 8px !important; }
    .numpad { max-width: 100% !important; }
    .numpad button { padding: 14px 8px !important; }
  }
`

export default function LoginPage() {
  const [mode, setMode]             = useState<'choose'|'pin'|'parent'>('choose')
  const [parents, setParents]       = useState<any[]>([])
  const [selectedChild, setSelectedChild]   = useState<any>(null)
  const [selectedParent, setSelectedParent] = useState<any>(null)
  const [pin, setPin]               = useState('')
  const [password, setPassword]     = useState('')
  const [showPass, setShowPass]     = useState(false)
  const [error, setError]           = useState('')
  const [loading, setLoading]       = useState(false)
  const [shake, setShake]           = useState(false)
  const [parentsLoaded, setParentsLoaded] = useState(false)

  const CHILD_AVATARS = [
    { emoji:'🐱', name:'Lia',   color:'#FF6B6B', bg:'#FFF0F0' },
    { emoji:'🐻', name:'Tamar', color:'#4A7FD4', bg:'#EFF6FF' },
    { emoji:'🦊', name:'Tom',   color:'#2EC4B6', bg:'#F0FDFB' },
  ]

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
      setParents([{ id:'default', name:'Parent', avatar_emoji:'👤' }])
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
      const res  = await fetch('/api/login', {
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
      const res  = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, familyId: FAMILY_ID, parentId: selectedParent?.id }),
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
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#1E2D4E 0%,#2D4A8A 50%,#4A7FD4 100%)', display:'flex', alignItems:'center', justifyContent:'center', padding:'16px', fontFamily:'"Nunito",sans-serif', position:'relative', overflow:'hidden' }}>
      <style>{mobileStyles}</style>

      {/* Decorative blobs */}
      <div style={{ position:'absolute', top:'-80px', left:'-80px', width:'300px', height:'300px', borderRadius:'50%', background:'radial-gradient(circle,rgba(74,127,212,0.2),transparent)', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', bottom:'-80px', right:'-80px', width:'300px', height:'300px', borderRadius:'50%', background:'radial-gradient(circle,rgba(46,196,182,0.15),transparent)', pointerEvents:'none' }}/>

      <div className="login-card" style={{ background:'rgba(255,255,255,0.97)', backdropFilter:'blur(20px)', borderRadius:'24px', padding:'36px 32px', maxWidth:'420px', width:'100%', boxShadow:'0 20px 60px rgba(0,0,0,0.25)', border:'1px solid rgba(255,255,255,0.8)', textAlign:'center', position:'relative' }}>

        {/* Logo */}
        <div style={{ marginBottom:'28px' }}>
          <div style={{ width:'64px', height:'64px', background:'linear-gradient(135deg,#4A7FD4,#2EC4B6)', borderRadius:'18px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'32px', margin:'0 auto 12px', boxShadow:'0 8px 24px rgba(74,127,212,0.3)' }}>
            🦔
          </div>
          <div style={{ fontWeight:900, fontSize:'26px', color:'#111827', letterSpacing:'-0.02em' }}>
            Edu<span style={{ background:'linear-gradient(135deg,#4A7FD4,#2EC4B6)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Play</span>
          </div>
          <div style={{ fontSize:'13px', color:'#9CA3AF', marginTop:'4px', fontWeight:600 }}>
            {mode === 'choose' ? 'Who is learning today?' :
             mode === 'pin'    ? `Hi ${selectedChild?.name}! 👋` :
             'Parent Dashboard'}
          </div>
        </div>

        {/* ── CHOOSE ── */}
        {mode === 'choose' && (
          <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>

            {/* Children */}
            <div className="child-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px' }}>
              {CHILD_AVATARS.map(avatar => (
                <button key={avatar.name} onClick={() => handleChildClick(avatar)}
                  style={{ padding:'20px 10px', borderRadius:'16px', border:`2px solid ${avatar.color}25`, background:avatar.bg, cursor:'pointer', transition:'all 0.15s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform='translateY(-3px)'; (e.currentTarget as HTMLElement).style.boxShadow=`0 8px 24px ${avatar.color}30` }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform='translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow='none' }}>
                  <div style={{ fontSize:'34px', marginBottom:'6px' }}>{avatar.emoji}</div>
                  <div style={{ fontWeight:800, fontSize:'13px', color:'#111827' }}>{avatar.name}</div>
                </button>
              ))}
            </div>

            {/* Divider */}
            <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
              <div style={{ flex:1, height:'1px', background:'#F3F4F6' }}/>
              <span style={{ fontSize:'12px', color:'#9CA3AF', fontWeight:600 }}>or</span>
              <div style={{ flex:1, height:'1px', background:'#F3F4F6' }}/>
            </div>

            {/* Parent */}
            <button onClick={handleParentClick}
              style={{ display:'flex', alignItems:'center', gap:'14px', padding:'16px', borderRadius:'14px', border:'1.5px solid #E5E7EB', background:'#F9FAFB', cursor:'pointer', textAlign:'left', transition:'all 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor='#4A7FD4'; (e.currentTarget as HTMLElement).style.background='#EFF6FF' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor='#E5E7EB'; (e.currentTarget as HTMLElement).style.background='#F9FAFB' }}>
              <div style={{ width:'44px', height:'44px', borderRadius:'12px', background:'linear-gradient(135deg,#4A7FD4,#2EC4B6)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Users size={22} color="white"/>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:800, fontSize:'15px', color:'#111827' }}>Parent / Guardian</div>
                <div style={{ fontSize:'12px', color:'#6B7280', marginTop:'2px' }}>Access the family dashboard</div>
              </div>
              <ChevronRight size={18} color="#9CA3AF"/>
            </button>

            <button onClick={() => window.location.href='/dashboard'}
              style={{ background:'none', border:'none', fontSize:'12px', color:'#9CA3AF', cursor:'pointer', fontWeight:600, padding:'4px' }}>
              Skip to dashboard
            </button>
          </div>
        )}

        {/* ── PIN ── */}
        {mode === 'pin' && selectedChild && (
          <div style={{ position:'relative' }}>
            <button onClick={() => { setMode('choose'); setPin(''); setError('') }}
              style={{ position:'absolute', top:'-48px', left:0, display:'flex', alignItems:'center', gap:'4px', background:'none', border:'none', fontSize:'13px', cursor:'pointer', color:'#6B7280', fontWeight:700 }}>
              <ArrowLeft size={14}/> Back
            </button>

            <div style={{ fontSize:'56px', marginBottom:'16px' }}>{selectedChild.emoji}</div>

            {/* PIN dots */}
            <div style={{ display:'flex', justifyContent:'center', gap:'14px', marginBottom:'24px' }}>
              {[0,1,2,3].map(i => (
                <div key={i} style={{
                  width:'18px', height:'18px', borderRadius:'50%',
                  background: pin.length > i ? selectedChild.color : '#F3F4F6',
                  border: `2px solid ${pin.length > i ? selectedChild.color : '#E5E7EB'}`,
                  transition:'all 0.15s',
                  transform: shake ? 'translateX(6px)' : 'translateX(0)',
                  boxShadow: pin.length > i ? `0 2px 8px ${selectedChild.color}40` : 'none',
                }}/>
              ))}
            </div>

            {error && (
              <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', color:'#DC2626', borderRadius:'10px', padding:'10px 14px', fontSize:'13px', fontWeight:700, marginBottom:'16px' }}>
                {error}
              </div>
            )}

            {/* Numpad */}
            <div className="numpad" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px', maxWidth:'260px', margin:'0 auto' }}>
              {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((digit, i) => (
                <button key={i}
                  onClick={() => digit === '⌫' ? handlePinDelete() : digit ? handlePinDigit(digit) : null}
                  disabled={loading || !digit}
                  style={{
                    padding:'16px', borderRadius:'14px',
                    border: `1.5px solid ${digit ? '#E5E7EB' : 'transparent'}`,
                    background: digit === '⌫' ? '#FEF2F2' : digit ? 'white' : 'transparent',
                    fontWeight:900, fontSize:'22px',
                    color: digit === '⌫' ? '#DC2626' : '#111827',
                    cursor: digit ? 'pointer' : 'default',
                    boxShadow: digit ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                    opacity: loading ? 0.5 : 1,
                    transition:'all 0.1s',
                  }}
                  onMouseEnter={e => { if(digit) (e.currentTarget as HTMLElement).style.background=digit==='⌫'?'#FEE2E2':'#F9FAFB' }}
                  onMouseLeave={e => { if(digit) (e.currentTarget as HTMLElement).style.background=digit==='⌫'?'#FEF2F2':'white' }}>
                  {loading && digit === '0' ? '...' : digit}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── PARENT ── */}
        {mode === 'parent' && (
          <div style={{ position:'relative' }}>
            <button onClick={() => { setMode('choose'); setPassword(''); setError(''); setSelectedParent(null) }}
              style={{ position:'absolute', top:'-48px', left:0, display:'flex', alignItems:'center', gap:'4px', background:'none', border:'none', fontSize:'13px', cursor:'pointer', color:'#6B7280', fontWeight:700 }}>
              <ArrowLeft size={14}/> Back
            </button>

            {/* Parent profile selector */}
            {parents.length > 1 && !selectedParent && (
              <div style={{ marginBottom:'20px' }}>
                <div style={{ fontSize:'14px', color:'#6B7280', marginBottom:'12px', fontWeight:600 }}>Select your profile:</div>
                <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                  {parents.map(parent => (
                    <button key={parent.id} onClick={() => setSelectedParent(parent)}
                      style={{ display:'flex', alignItems:'center', gap:'12px', padding:'14px 16px', borderRadius:'14px', border:'1.5px solid #E5E7EB', background:'#F9FAFB', cursor:'pointer', transition:'all 0.15s', textAlign:'left' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor='#4A7FD4'; (e.currentTarget as HTMLElement).style.background='#EFF6FF' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor='#E5E7EB'; (e.currentTarget as HTMLElement).style.background='#F9FAFB' }}>
                      <div style={{ width:'40px', height:'40px', borderRadius:'50%', background:'linear-gradient(135deg,#4A7FD4,#2EC4B6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', flexShrink:0 }}>
                        {parent.avatar_emoji || '👤'}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:800, fontSize:'15px', color:'#111827' }}>{parent.name}</div>
                        <div style={{ fontSize:'12px', color:'#6B7280' }}>{parent.role === 'admin' ? '⚙️ Admin' : '👤 Parent'}</div>
                      </div>
                      <ChevronRight size={16} color="#9CA3AF"/>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Password form */}
            {(parents.length <= 1 || selectedParent) && (
              <>
                {selectedParent && (
                  <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'20px', padding:'10px 14px', background:'#F9FAFB', borderRadius:'12px', border:'1px solid #E5E7EB' }}>
                    <div style={{ width:'32px', height:'32px', borderRadius:'50%', background:'linear-gradient(135deg,#4A7FD4,#2EC4B6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', flexShrink:0 }}>
                      {selectedParent.avatar_emoji || '👤'}
                    </div>
                    <span style={{ fontWeight:800, fontSize:'14px', color:'#111827', flex:1 }}>{selectedParent.name}</span>
                    <button onClick={() => setSelectedParent(null)} style={{ background:'none', border:'none', color:'#9CA3AF', cursor:'pointer', fontSize:'12px', fontWeight:600 }}>Change</button>
                  </div>
                )}

                <div style={{ fontSize:'48px', marginBottom:'8px' }}>{selectedParent?.avatar_emoji || '👨‍👩‍👧'}</div>
                <div style={{ fontWeight:800, fontSize:'18px', color:'#111827', marginBottom:'4px' }}>
                  {selectedParent ? `Hi ${selectedParent.name}!` : 'Welcome back!'}
                </div>
                <div style={{ fontSize:'13px', color:'#6B7280', marginBottom:'20px', fontWeight:600 }}>Enter your password</div>

                {error && (
                  <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', color:'#DC2626', borderRadius:'10px', padding:'10px 14px', fontSize:'13px', fontWeight:700, marginBottom:'16px' }}>
                    {error}
                  </div>
                )}

                {/* Password input with icon */}
                <div style={{ position:'relative', marginBottom:'14px' }}>
                  <Lock size={16} color="#9CA3AF" style={{ position:'absolute', left:'14px', top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}/>
                  <input type={showPass?'text':'password'} placeholder="Your password" value={password}
                    onChange={e => { setPassword(e.target.value); setError('') }}
                    onKeyDown={e => e.key === 'Enter' && submitPassword()}
                    autoFocus
                    style={{ width:'100%', padding:'14px 44px 14px 42px', borderRadius:'12px', border:`1.5px solid ${error?'#EF4444':'#E5E7EB'}`, fontSize:'15px', outline:'none', boxSizing:'border-box', color:'#111827', background:'#FAFAFA', transition:'border-color 0.15s' }}
                    onFocus={e => { if(!error) e.target.style.borderColor='#4A7FD4'; e.target.style.boxShadow='0 0 0 3px rgba(74,127,212,0.1)' }}
                    onBlur={e => { e.target.style.borderColor=error?'#EF4444':'#E5E7EB'; e.target.style.boxShadow='none' }}
                  />
                  <button onClick={() => setShowPass(v => !v)}
                    style={{ position:'absolute', right:'14px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#9CA3AF', padding:'2px' }}>
                    {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
                  </button>
                </div>

                <button onClick={submitPassword} disabled={loading || !password}
                  style={{ width:'100%', padding:'15px', borderRadius:'50px', border:'none', background:'linear-gradient(135deg,#4A7FD4,#2EC4B6)', color:'white', fontWeight:800, fontSize:'15px', cursor:'pointer', opacity:loading||!password?0.6:1, boxShadow:'0 4px 14px rgba(74,127,212,0.35)', transition:'all 0.15s' }}
                  onMouseEnter={e => { if(!loading && password) (e.currentTarget as HTMLElement).style.transform='translateY(-1px)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform='translateY(0)' }}>
                  {loading ? 'Logging in...' : 'Enter Dashboard →'}
                </button>

                <div style={{ marginTop:'14px', fontSize:'12px', color:'#9CA3AF', fontWeight:600 }}>
                  Default password: <strong style={{ color:'#6B7280' }}>eduplay2024</strong>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}