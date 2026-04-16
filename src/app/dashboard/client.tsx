'use client'
import { useState, useEffect } from 'react'

function ParentsScreen({ familyId, showToast }: any) {
  const [parents, setParents]   = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [showAdd, setShowAdd]   = useState(false)
  const [newName, setNewName]   = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPass, setNewPass]   = useState('')
  const [newEmoji, setNewEmoji] = useState('👤')
  const [saving, setSaving]     = useState(false)

  const PARENT_EMOJIS = ['👤','👨','👩','👴','👵','🧑','👨‍💼','👩‍💼','🧔','👱']

  useEffect(() => { loadParents() }, [])

  async function loadParents() {
    try {
      const res  = await fetch(`/api/parents?familyId=${familyId}`)
      const data = await res.json()
      setParents(data.parents || [])
    } catch {}
    setLoading(false)
  }

  async function addParent() {
    if (!newName || !newPass) return
    setSaving(true)
    try {
      const res  = await fetch('/api/parents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ familyId, name:newName, email:newEmail, password:newPass, avatar_emoji:newEmoji, role:'parent' }),
      })
      const data = await res.json()
      if (data.success) {
        showToast('👨‍👩‍👧', `${newName} added as parent!`)
        setNewName(''); setNewEmail(''); setNewPass(''); setNewEmoji('👤')
        setShowAdd(false)
        loadParents()
      } else {
        showToast('❌', data.error || 'Error adding parent')
      }
    } catch {}
    setSaving(false)
  }

  async function removeParent(parentId: string, name: string) {
    if (!confirm(`Remove ${name} as a parent?`)) return
    await fetch(`/api/parents?parentId=${parentId}`, { method:'DELETE' })
    showToast('🗑️', `${name} removed`)
    loadParents()
  }

  async function updatePassword(parentId: string, newPassword: string, name: string) {
    if (!newPassword || newPassword.length < 4) return
    await fetch('/api/parents', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parentId, password:newPassword }),
    })
    showToast('🔑', `${name}'s password updated!`)
  }

  if (loading) return <div style={{ padding:'40px', textAlign:'center', color:'#9AA5B8' }}>Loading...</div>

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'18px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <h1 style={{ fontFamily:'"Nunito",sans-serif', fontWeight:900, fontSize:'20px', color:'#1E2D4E', margin:0 }}>👨‍👩‍👧 Parent Profiles</h1>
        {parents.length < 3 && (
          <button onClick={() => setShowAdd(!showAdd)}
            style={{ padding:'8px 18px', borderRadius:'50px', border:'none', background:'#4A7FD4', color:'white', fontWeight:800, fontSize:'13px', cursor:'pointer' }}>
            + Add Parent
          </button>
        )}
      </div>
      <p style={{ fontSize:'13px', color:'#5A6A7E', margin:0 }}>
        Up to 3 parents or guardians can share oversight of this family account. Each has their own password.
      </p>
      <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
        {parents.map((parent, i) => (
          <div key={parent.id} style={{ background:'white', border:'1px solid #EEF1F6', borderRadius:'14px', padding:'18px', boxShadow:'0 2px 8px rgba(30,45,78,0.07)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'14px', marginBottom:'14px' }}>
              <div style={{ width:'48px', height:'48px', borderRadius:'50%', background:'linear-gradient(135deg,#4A7FD4,#2EC4B6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'24px' }}>
                {parent.avatar_emoji || '👤'}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:800, fontSize:'16px', color:'#1E2D4E' }}>{parent.name}</div>
                <div style={{ fontSize:'12px', color:'#9AA5B8' }}>{parent.email || 'No email set'} · {parent.role === 'admin' ? '⚙️ Admin' : '👤 Parent'}</div>
              </div>
              {i > 0 && (
                <button onClick={() => removeParent(parent.id, parent.name)}
                  style={{ padding:'6px 12px', borderRadius:'50px', border:'1px solid #FEE2E2', background:'#FFF5F5', color:'#DC2626', fontWeight:700, fontSize:'12px', cursor:'pointer' }}>
                  Remove
                </button>
              )}
            </div>
            <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
              <input type="password" placeholder="New password" id={`pwd-${parent.id}`}
                style={{ flex:1, padding:'8px 12px', borderRadius:'8px', border:'1px solid #EEF1F6', fontSize:'13px', outline:'none' }}/>
              <button onClick={() => {
                const input = document.getElementById(`pwd-${parent.id}`) as HTMLInputElement
                updatePassword(parent.id, input.value, parent.name)
                input.value = ''
              }} style={{ padding:'8px 14px', borderRadius:'8px', border:'none', background:'#4A7FD4', color:'white', fontWeight:700, fontSize:'12px', cursor:'pointer' }}>
                Update Password
              </button>
            </div>
          </div>
        ))}
      </div>
      {showAdd && (
        <div style={{ background:'white', border:'2px solid #4A7FD4', borderRadius:'14px', padding:'20px', boxShadow:'0 4px 16px rgba(74,127,212,0.15)' }}>
          <h3 style={{ fontFamily:'"Nunito",sans-serif', fontWeight:900, fontSize:'16px', color:'#1E2D4E', margin:'0 0 16px' }}>Add New Parent / Guardian</h3>
          <div style={{ marginBottom:'14px' }}>
            <div style={{ fontSize:'12px', fontWeight:700, color:'#5A6A7E', marginBottom:'8px' }}>Avatar</div>
            <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
              {PARENT_EMOJIS.map(e => (
                <button key={e} onClick={() => setNewEmoji(e)}
                  style={{ width:'36px', height:'36px', borderRadius:'8px', border:`2px solid ${newEmoji===e?'#4A7FD4':'#EEF1F6'}`, background:newEmoji===e?'#4A7FD420':'white', fontSize:'18px', cursor:'pointer' }}>
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'10px', marginBottom:'16px' }}>
            <input placeholder="Full name *" value={newName} onChange={e => setNewName(e.target.value)}
              style={{ padding:'10px 14px', borderRadius:'10px', border:'1px solid #EEF1F6', fontSize:'14px', outline:'none' }}/>
            <input placeholder="Email (optional)" value={newEmail} onChange={e => setNewEmail(e.target.value)}
              style={{ padding:'10px 14px', borderRadius:'10px', border:'1px solid #EEF1F6', fontSize:'14px', outline:'none' }}/>
            <input type="password" placeholder="Password *" value={newPass} onChange={e => setNewPass(e.target.value)}
              style={{ padding:'10px 14px', borderRadius:'10px', border:'1px solid #EEF1F6', fontSize:'14px', outline:'none' }}/>
          </div>
          <div style={{ display:'flex', gap:'10px' }}>
            <button onClick={() => setShowAdd(false)}
              style={{ flex:1, padding:'10px', borderRadius:'10px', border:'1px solid #EEF1F6', background:'white', color:'#5A6A7E', fontWeight:700, fontSize:'13px', cursor:'pointer' }}>
              Cancel
            </button>
            <button onClick={addParent} disabled={saving || !newName || !newPass}
              style={{ flex:2, padding:'10px', borderRadius:'10px', border:'none', background:'#4A7FD4', color:'white', fontWeight:800, fontSize:'13px', cursor:'pointer', opacity:saving||!newName||!newPass?0.6:1 }}>
              {saving ? 'Adding...' : '+ Add Parent'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const CHILD_COLORS = [
  { bg:'linear-gradient(135deg,#FF9F43,#FF6B6B)', emoji:'🐱' },
  { bg:'linear-gradient(135deg,#5EC8F2,#4ECDC4)', emoji:'🐻' },
  { bg:'linear-gradient(135deg,#9B59B6,#C39BD3)', emoji:'🦊' },
]

const TABS = [
  { key:'overview',   label:'🏠 Overview'    },
  { key:'progress',   label:'📊 Progress'    },
  { key:'worksheets', label:'🖨️ Worksheets'  },
  { key:'curriculum', label:'📚 Curriculum'  },
  { key:'parents',    label:'👨‍👩‍👧 Parents'   },
  { key:'account',    label:'⚙️ Account'     },
]

export default function DashboardClient({ data }: { data: any }) {
  const { family, children, progress, recommendations, parentName, isDemo } = data
  const [screen, setScreen]         = useState('overview')
  const [toast, setToast]           = useState<{ icon:string; text:string }|null>(null)
  const [approvalOpen, setApprovalOpen] = useState(false)

  const daysLeft = family
    ? Math.max(0, Math.ceil((new Date(family.trial_ends_at).getTime() - Date.now()) / 86400000))
    : 7

  function showToast(icon: string, text: string) {
    setToast({ icon, text })
    setTimeout(() => setToast(null), 3000)
  }

  function childProgress(childId: string) {
    return (progress || []).filter((p: any) => p.child_id === childId)
  }

  function childRecs(childId: string) {
    return (recommendations || []).filter((r: any) => r.child_id === childId)
  }

  const pendingApprovals = (progress || []).filter(
    (p: any) => p.status === 'completed' && !p.parent_approved && p.approval_requested_at
  )

  const dashStyles = `
    @media (max-width: 767px) {
      .dashboard-sidebar { display: none !important; }
      .dashboard-tabs { overflow-x: auto; -webkit-overflow-scrolling: touch; white-space: nowrap; scrollbar-width: none; }
      .dashboard-tabs::-webkit-scrollbar { display: none; }
      .stat-grid { grid-template-columns: repeat(2,1fr) !important; }
      .child-grid { grid-template-columns: 1fr !important; }
      .worksheet-grid { grid-template-columns: 1fr !important; }
      .header-right { gap: 6px !important; }
      .days-badge { display: none !important; }
      .mobile-nav { display: flex !important; }
      .dashboard-main { padding-bottom: 72px !important; }
      .manage-headers { grid-template-columns: 1fr 80px 80px 80px 64px !important; font-size: 9px !important; }
      .manage-row { grid-template-columns: 1fr 80px 80px 80px 64px !important; gap: 4px !important; }
      .manage-row select, .manage-row input { font-size: 11px !important; padding: 4px 4px !important; }
    }
  `

  return (
    <div style={{ minHeight:'100vh', background:'#F8F9FB', fontFamily:'"Nunito Sans",sans-serif' }}>
      <style>{dashStyles}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', bottom:'24px', right:'24px', zIndex:9999, background:'#1E2D4E', color:'white', borderRadius:'12px', padding:'12px 20px', fontSize:'13px', fontWeight:700, boxShadow:'0 8px 32px rgba(0,0,0,0.2)', display:'flex', alignItems:'center', gap:'10px' }}>
          <span style={{ fontSize:'20px' }}>{toast.icon}</span>{toast.text}
        </div>
      )}

      {/* Approval modal */}
      {approvalOpen && (
        <div style={{ position:'fixed', inset:0, zIndex:999, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }} onClick={() => setApprovalOpen(false)}>
          <div style={{ background:'white', borderRadius:'20px', padding:'28px', maxWidth:'440px', width:'100%' }} onClick={e => e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'16px' }}>
              <h3 style={{ fontFamily:'"Nunito",sans-serif', fontWeight:900, fontSize:'18px', margin:0 }}>✅ Approve Completion</h3>
              <button onClick={() => setApprovalOpen(false)} style={{ border:'none', background:'#F3F4F6', borderRadius:'50%', width:'28px', height:'28px', cursor:'pointer' }}>✕</button>
            </div>
            {pendingApprovals[0] ? (
              <div style={{ background:'#F9FAFB', borderRadius:'12px', padding:'14px', marginBottom:'14px', fontSize:'13px', color:'#4B5563', lineHeight:1.8 }}>
                <strong>Topic:</strong> {pendingApprovals[0].topic?.title_en}<br/>
                <strong>Questions:</strong> {pendingApprovals[0].questions_attempted} attempted · {pendingApprovals[0].questions_correct} correct
              </div>
            ) : (
              <p style={{ color:'#6B7A8D', fontSize:'14px', marginBottom:'16px' }}>No pending approvals right now.</p>
            )}
            <div style={{ display:'flex', gap:'10px' }}>
              <button onClick={() => { setApprovalOpen(false); showToast('✅','Approved!') }} style={{ flex:1, padding:'12px', background:'#2EC4B6', border:'none', borderRadius:'50px', color:'white', fontWeight:800, fontSize:'14px', cursor:'pointer' }}>✅ Approve</button>
              <button onClick={() => setApprovalOpen(false)} style={{ flex:1, padding:'12px', background:'#F3F4F6', border:'1px solid #E5E7EB', borderRadius:'50px', color:'#4B5563', fontWeight:800, fontSize:'14px', cursor:'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header style={{ background:'white', borderBottom:'1px solid #EEF1F6', padding:'0 16px', height:'58px', display:'flex', alignItems:'center', justifyContent:'space-between', boxShadow:'0 2px 8px rgba(30,45,78,0.07)', position:'sticky', top:0, zIndex:100, gap:'8px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'8px', fontFamily:'"Nunito",sans-serif', fontWeight:900, fontSize:'18px', color:'#1E2D4E', flexShrink:0 }}>
          <img src="/icons/icon-512.png" alt="EduPlay" style={{ width:32, height:32, borderRadius:9, objectFit:'contain', display:'block', flexShrink:0, boxShadow:'0 2px 8px rgba(74,127,212,0.25)' }}/>
          <span>Edu<span style={{ background:'linear-gradient(135deg,#4A7FD4,#2EC4B6)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Play</span></span>
        </div>

        {/* Tabs */}
        <div className="dashboard-tabs" style={{ display:'flex', gap:'2px', flex:1, justifyContent:'center' }}>
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setScreen(tab.key)}
              style={{ padding:'6px 12px', borderRadius:'50px', border:'none', fontWeight:700, fontSize:'12px', cursor:'pointer', background:screen===tab.key?'#EBF2FF':'transparent', color:screen===tab.key?'#4A7FD4':'#6B7A8D', whiteSpace:'nowrap', flexShrink:0 }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right */}
        <div className="header-right" style={{ display:'flex', alignItems:'center', gap:'10px', flexShrink:0 }}>
          {isDemo && <span style={{ background:'#EBF2FF', color:'#4A7FD4', borderRadius:'50px', padding:'4px 10px', fontSize:'11px', fontWeight:800 }}>🧪 Demo</span>}
          <span className="days-badge" style={{ background:'#FFF8EC', border:'1px solid #F5A623', color:'#F5A623', borderRadius:'50px', padding:'4px 10px', fontSize:'12px', fontWeight:800 }}>⏳ {daysLeft}d left</span>
          {pendingApprovals.length > 0 && (
            <button onClick={() => setApprovalOpen(true)} style={{ position:'relative', width:'34px', height:'34px', background:'#F9FAFB', border:'1px solid #E5E7EB', borderRadius:'50%', cursor:'pointer', fontSize:'15px', flexShrink:0 }}>
              🔔<span style={{ position:'absolute', top:'4px', right:'4px', width:'9px', height:'9px', background:'#FF6B6B', borderRadius:'50%', border:'2px solid white' }}/>
            </button>
          )}
          <div style={{ width:'34px', height:'34px', background:'linear-gradient(135deg,#4A7FD4,#1E2D4E)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:800, fontSize:'13px', flexShrink:0 }}>
            {parentName.split(' ').map((n: string) => n[0]).join('').slice(0,2)}
          </div>
        </div>
      </header>

      <div style={{ display:'flex', minHeight:'calc(100vh - 58px)' }}>

        {/* Sidebar */}
        <aside className="dashboard-sidebar" style={{ width:'240px', background:'white', borderRight:'1px solid #EEF1F6', padding:'14px 0', flexShrink:0, display:'flex', flexDirection:'column' }}>
          <div style={{ padding:'0 16px', marginBottom:'8px', fontSize:'10px', fontWeight:800, letterSpacing:'1.5px', textTransform:'uppercase', color:'#9AA5B8' }}>Family</div>
          {(children || []).map((child: any, i: number) => {
            const col = CHILD_COLORS[i % CHILD_COLORS.length]
            return (
              <div key={child.id} style={{ display:'flex', alignItems:'center', gap:'9px', padding:'8px 10px', margin:'0 6px 4px', borderRadius:'8px', cursor:'pointer' }}>
                <div style={{ width:'30px', height:'30px', borderRadius:'50%', background:col.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'15px', flexShrink:0 }}>{col.emoji}</div>
                <div>
                  <div style={{ fontWeight:700, fontSize:'13px', color:'#1E2D4E' }}>{child.display_name}</div>
                  <div style={{ fontSize:'11px', color:'#9AA5B8' }}>Grade {child.grade === 0 ? 'K' : child.grade}</div>
                </div>
                {child.streak_current > 0 && <span style={{ fontSize:'12px', fontWeight:800, color:'#FF6B6B', marginLeft:'auto' }}>🔥{child.streak_current}</span>}
              </div>
            )
          })}
          <div style={{ flex:1 }}/>
          <div style={{ margin:'10px', background:'linear-gradient(135deg,#1E2D4E,#2C3E6B)', borderRadius:'12px', padding:'14px', color:'white' }}>
            <h4 style={{ fontFamily:'"Nunito",sans-serif', fontSize:'13px', fontWeight:800, marginBottom:'4px' }}>🚀 Upgrade</h4>
            <p style={{ fontSize:'11px', opacity:.7, marginBottom:'10px', lineHeight:1.5 }}>Unlimited worksheets & 5 children.</p>
            <button onClick={() => showToast('🚀','Upgrade coming soon!')} style={{ width:'100%', padding:'8px', borderRadius:'50px', border:'none', background:'linear-gradient(135deg,#F5A623,#FF9F43)', color:'white', fontWeight:800, fontSize:'12px', cursor:'pointer' }}>$20/mo</button>
          </div>
        </aside>

        {/* Main */}
        <main className="dashboard-main" style={{ flex:1, padding:'24px', overflowY:'auto', maxHeight:'calc(100vh - 58px)' }}>

          {/* ── OVERVIEW ── */}
          {screen === 'overview' && (
            <div style={{ display:'flex', flexDirection:'column', gap:'18px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'10px' }}>
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                    <h1 style={{ fontFamily:'"Nunito",sans-serif', fontWeight:900, fontSize:'22px', color:'#1E2D4E', margin:0 }}>Good morning, {parentName.split(' ')[0]} 👋</h1>
                    <button onClick={() => window.location.reload()}
                      style={{ padding:'6px 14px', borderRadius:'50px', border:'1px solid #EEF1F6', background:'white', fontWeight:700, fontSize:'12px', cursor:'pointer', color:'#5A6A7E' }}>
                      🔄 Refresh
                    </button>
                  </div>
                  <p style={{ color:'#5A6A7E', margin:'3px 0 0', fontSize:'13px' }}>Here's how your family is doing today</p>
                </div>
                <button onClick={() => window.location.href='/worksheets'} style={{ padding:'8px 16px', borderRadius:'50px', border:'none', background:'#4A7FD4', color:'white', fontWeight:800, fontSize:'13px', cursor:'pointer' }}>🖨️ Worksheet Builder</button>
              </div>

              <div className="stat-grid" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'12px' }}>
                {[
                  { label:'Total XP',      value:(children||[]).reduce((s: number,c: any) => s+(c.xp_total||0),0).toLocaleString(), color:'#4A7FD4' },
                  { label:'Active Streaks',value:`${(children||[]).filter((c: any) => c.streak_current>0).length} 🔥`, color:'#FF6B6B' },
                  { label:'Lessons Done',  value:(progress||[]).filter((p: any) => p.status==='completed').length, color:'#2EC4B6' },
                  { label:'Downloads',     value:`${family?.trial_dl_used||0} / ∞`, color:'#F5A623' },
                ].map(s => (
                  <div key={s.label} style={{ background:'white', border:'1px solid #EEF1F6', borderRadius:'12px', padding:'16px', boxShadow:'0 2px 8px rgba(30,45,78,0.07)', position:'relative', overflow:'hidden' }}>
                    <div style={{ position:'absolute', top:0, left:0, right:0, height:'3px', background:s.color }}/>
                    <div style={{ fontSize:'10px', fontWeight:800, color:'#9AA5B8', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:'4px' }}>{s.label}</div>
                    <div style={{ fontFamily:'"Nunito",sans-serif', fontWeight:900, fontSize:'24px', color:s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>

              <div className="child-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'14px' }}>
                {(children||[]).map((child: any, i: number) => {
                  const col  = CHILD_COLORS[i % CHILD_COLORS.length]
                  const cp   = childProgress(child.id)
                  const recs = childRecs(child.id)
                  const highPri = recs.find((r: any) => r.priority==='high')
                  return (
                    <div key={child.id} onClick={() => setScreen('progress')} style={{ background:'white', border:'1px solid #EEF1F6', borderRadius:'20px', padding:'18px', boxShadow:'0 2px 8px rgba(30,45,78,0.07)', cursor:'pointer' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'14px' }}>
                        <div style={{ width:'48px', height:'48px', borderRadius:'50%', background:col.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'24px', position:'relative' }}>
                          {col.emoji}
                          {child.streak_current>0 && <div style={{ position:'absolute', bottom:'-2px', right:'-2px', background:'#FF6B6B', color:'white', fontSize:'9px', fontWeight:800, width:'18px', height:'18px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', border:'2px solid white' }}>{child.streak_current}</div>}
                        </div>
                        <div>
                          <div style={{ fontFamily:'"Nunito",sans-serif', fontWeight:800, fontSize:'15px' }}>{child.display_name}</div>
                          <div style={{ fontSize:'11px', color:'#9AA5B8' }}>Grade {child.grade === 0 ? 'K' : child.grade} · {(child.xp_total||0)} XP</div>
                        </div>
                      </div>
                      <div style={{ display:'flex', flexDirection:'column', gap:'7px', marginBottom:'12px' }}>
                        {[
                          { label:'Math',   pct:Math.min(100,Math.round((cp.filter((p: any)=>p.status==='completed'&&p.topic?.subject?.slug==='math').length/7)*100)),   color:'#4A7FD4' },
                          { label:'Hebrew', pct:Math.min(100,Math.round((cp.filter((p: any)=>p.status==='completed'&&p.topic?.subject?.slug==='hebrew').length/4)*100)), color:'#FF6B6B' },
                        ].map(subj => (
                          <div key={subj.label} style={{ display:'flex', alignItems:'center', gap:'7px' }}>
                            <div style={{ width:'7px', height:'7px', borderRadius:'50%', background:subj.color, flexShrink:0 }}/>
                            <div style={{ fontSize:'11px', fontWeight:700, color:'#5A6A7E', width:'46px', flexShrink:0 }}>{subj.label}</div>
                            <div style={{ flex:1, height:'7px', background:'#EEF1F6', borderRadius:'50px', overflow:'hidden' }}>
                              <div style={{ height:'100%', width:`${subj.pct}%`, background:subj.color, borderRadius:'50px' }}/>
                            </div>
                            <div style={{ fontSize:'10px', fontWeight:800, color:'#5A6A7E', width:'28px', textAlign:'right' }}>{subj.pct}%</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ background:highPri?'#FFF0F0':'#EAFAF1', border:`1px solid ${highPri?'rgba(255,107,107,.2)':'rgba(39,174,96,.2)'}`, borderRadius:'8px', padding:'8px 10px', fontSize:'11px', color:highPri?'#FF6B6B':'#27AE60', fontWeight:700, display:'flex', gap:'6px' }}>
                        <span>{highPri?'⚠️':'🌟'}</span>
                        <span>{highPri?<><strong>Focus: </strong>{highPri.topic?.title_en}</>:'Doing great!'}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── PROGRESS ── */}
          {screen === 'progress' && (
            <div style={{ display:'flex', flexDirection:'column', gap:'18px' }}>
              <h1 style={{ fontFamily:'"Nunito",sans-serif', fontWeight:900, fontSize:'20px', color:'#1E2D4E', margin:0 }}>📊 Progress Reports</h1>
              {(children||[]).map((child: any, i: number) => {
                const col  = CHILD_COLORS[i % CHILD_COLORS.length]
                const cp   = childProgress(child.id)
                const recs = childRecs(child.id)
                return (
                  <div key={child.id} style={{ background:'white', border:'1px solid #EEF1F6', borderRadius:'12px', padding:'20px', boxShadow:'0 2px 8px rgba(30,45,78,0.07)' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'16px', flexWrap:'wrap' }}>
                      <div style={{ width:'42px', height:'42px', borderRadius:'50%', background:col.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'21px' }}>{col.emoji}</div>
                      <div style={{ flex:1 }}>
                        <h2 style={{ fontFamily:'"Nunito",sans-serif', fontWeight:900, fontSize:'17px', margin:0 }}>{child.display_name}</h2>
                        <div style={{ fontSize:'12px', color:'#9AA5B8' }}>Grade {child.grade === 0 ? 'K' : child.grade} · {(child.xp_total||0).toLocaleString()} XP · {child.streak_current || 0} day streak 🔥</div>
                      </div>
                      <button onClick={() => window.location.href=`/lesson?childId=${child.id}`} style={{ padding:'9px 18px', borderRadius:'50px', border:'none', background:'#4A7FD4', color:'white', fontWeight:800, fontSize:'13px', cursor:'pointer' }}>
                        ▶ Start Lesson
                      </button>
                    </div>
                    {recs.length > 0 && (
                      <div style={{ background:'linear-gradient(135deg,#FFF0F0,#FFF5F0)', border:'1px solid rgba(255,107,107,.18)', borderRadius:'12px', padding:'14px', marginBottom:'14px' }}>
                        <div style={{ fontFamily:'"Nunito",sans-serif', fontWeight:800, fontSize:'14px', color:'#FF6B6B', marginBottom:'10px' }}>🎯 Focus Recommendations</div>
                        {recs.slice(0,2).map((rec: any) => (
                          <div key={rec.id} style={{ background:'white', border:'1px solid rgba(255,107,107,.12)', borderRadius:'10px', padding:'12px', marginBottom:'8px', display:'flex', gap:'12px' }}>
                            <div style={{ flex:1 }}>
                              <div style={{ fontWeight:800, fontSize:'13px', color:'#1E2D4E', marginBottom:'2px' }}>{rec.topic?.title_en}</div>
                              <div style={{ fontSize:'11px', color:'#5A6A7E', lineHeight:1.6 }}>{rec.reason_en}</div>
                            </div>
                            <span style={{ fontSize:'10px', fontWeight:800, padding:'2px 9px', borderRadius:'50px', background:rec.priority==='high'?'#FEECEC':'#FFF8EC', color:rec.priority==='high'?'#FF6B6B':'#F5A623', whiteSpace:'nowrap', alignSelf:'flex-start' }}>{rec.priority}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {cp.length > 0 ? (
                      <div style={{ overflowX:'auto' }}>
                        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px', minWidth:'400px' }}>
                          <thead>
                            <tr style={{ borderBottom:'2px solid #EEF1F6' }}>
                              {['Topic','Status','Progress'].map(h => (
                                <th key={h} style={{ textAlign:'left', padding:'8px 10px', fontSize:'11px', fontWeight:800, color:'#9AA5B8', textTransform:'uppercase' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {cp.map((p: any) => {
                              const pct = Math.round((p.steps_completed/(p.steps_total||5))*100)
                              const statusColors: any = { completed:'#27AE60', in_progress:'#4A7FD4', needs_review:'#FF6B6B', not_started:'#9AA5B8' }
                              const statusLabels: any = { completed:'Done', in_progress:'In Progress', needs_review:'Needs Work', not_started:'Not Started' }
                              return (
                                <tr key={p.id} style={{ borderBottom:'1px solid #EEF1F6' }}>
                                  <td style={{ padding:'10px', fontWeight:700, color:'#1E2D4E' }}>{p.topic?.title_en}</td>
                                  <td style={{ padding:'10px' }}>
                                    <span style={{ background:`${statusColors[p.status]}22`, color:statusColors[p.status], fontSize:'11px', fontWeight:800, padding:'2px 9px', borderRadius:'50px' }}>{statusLabels[p.status]}</span>
                                  </td>
                                  <td style={{ padding:'10px' }}>
                                    <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                                      <div style={{ width:'80px', height:'7px', background:'#EEF1F6', borderRadius:'50px', overflow:'hidden' }}>
                                        <div style={{ height:'100%', width:`${pct}%`, background:statusColors[p.status], borderRadius:'50px' }}/>
                                      </div>
                                      <span style={{ fontSize:'11px', fontWeight:800, color:'#5A6A7E' }}>{pct}%</span>
                                    </div>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div style={{ textAlign:'center', padding:'24px', color:'#9AA5B8', fontSize:'13px' }}>No lessons started yet. Encourage {child.display_name} to begin! 🚀</div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* ── WORKSHEETS ── */}
          {screen === 'worksheets' && (
            <div style={{ display:'flex', flexDirection:'column', gap:'18px' }}>
              <h1 style={{ fontFamily:'"Nunito",sans-serif', fontWeight:900, fontSize:'20px', color:'#1E2D4E', margin:0 }}>🖨️ Worksheets & Exams</h1>
              <div style={{ background:'#F3F4F6', border:'1px solid #D1D5DB', borderRadius:'12px', padding:'12px 16px', display:'flex', gap:'12px', fontSize:'12px', color:'#4B5563', lineHeight:1.6 }}>
                <span style={{ fontSize:'20px' }}>📋</span>
                <div><strong>Content notice:</strong> EduPlay worksheets are curriculum-aligned. Parents are encouraged to review all materials.</div>
              </div>
              <div className="child-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px' }}>
                {(children || []).map((child: any, i: number) => {
                  const col = CHILD_COLORS[i % CHILD_COLORS.length]
                  return (
                    <div key={child.id} style={{ background:'white', border:'1px solid #EEF1F6', borderRadius:'12px', padding:'20px', boxShadow:'0 2px 8px rgba(30,45,78,0.07)', textAlign:'center', cursor:'pointer' }}
                      onClick={() => window.location.href=`/worksheets?childId=${child.id}`}>
                      <div style={{ width:'52px', height:'52px', borderRadius:'50%', background:col.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'26px', margin:'0 auto 10px' }}>{col.emoji}</div>
                      <div style={{ fontWeight:800, fontSize:'15px', color:'#1E2D4E', marginBottom:'3px' }}>{child.display_name}</div>
                      <div style={{ fontSize:'12px', color:'#9AA5B8', marginBottom:'14px' }}>Grade {child.grade === 0 ? 'K' : child.grade}</div>
                      <button style={{ width:'100%', padding:'9px', borderRadius:'50px', border:'none', background:'#4A7FD4', color:'white', fontWeight:800, fontSize:'12px', cursor:'pointer' }}>
                        🖨️ Build Worksheet
                      </button>
                    </div>
                  )
                })}
              </div>
              <div style={{ background:'white', border:'1px solid #EEF1F6', borderRadius:'12px', padding:'20px', boxShadow:'0 2px 8px rgba(30,45,78,0.07)' }}>
                <h3 style={{ fontFamily:'"Nunito",sans-serif', fontWeight:900, fontSize:'16px', color:'#1E2D4E', marginBottom:'8px' }}>📐 Worksheet Builder</h3>
                <p style={{ fontSize:'13px', color:'#5A6A7E', marginBottom:'16px' }}>Choose subject, topics, difficulty, number of questions and download a print-ready PDF.</p>
                <div style={{ display:'flex', gap:'10px', flexWrap:'wrap' }}>
                  <button onClick={() => window.location.href='/worksheets'}
                    style={{ padding:'10px 24px', borderRadius:'50px', border:'none', background:'linear-gradient(135deg,#4A7FD4,#2EC4B6)', color:'white', fontWeight:800, fontSize:'13px', cursor:'pointer', boxShadow:'0 4px 16px rgba(74,127,212,0.3)' }}>
                    🚀 Open Full Builder
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── CURRICULUM ── */}
          {screen === 'curriculum' && (
            <div style={{ display:'flex', flexDirection:'column', gap:'18px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'10px' }}>
                <h1 style={{ fontFamily:'"Nunito",sans-serif', fontWeight:900, fontSize:'20px', color:'#1E2D4E', margin:0 }}>📚 Curriculum</h1>
                <button onClick={() => window.location.href='/curriculum'} style={{ padding:'9px 18px', borderRadius:'50px', border:'none', background:'#4A7FD4', color:'white', fontWeight:800, fontSize:'13px', cursor:'pointer' }}>
                  Open Full Browser →
                </button>
              </div>
              <div style={{ background:'white', border:'1px solid #EEF1F6', borderRadius:'12px', padding:'40px', boxShadow:'0 2px 8px rgba(30,45,78,0.07)', textAlign:'center' }}>
                <div style={{ fontSize:'48px', marginBottom:'12px' }}>🗺️</div>
                <div style={{ fontFamily:'"Nunito",sans-serif', fontWeight:800, fontSize:'16px', color:'#1E2D4E', marginBottom:'8px' }}>Browse the Full Curriculum</div>
                <div style={{ fontSize:'13px', color:'#5A6A7E', marginBottom:'20px', maxWidth:'400px', margin:'0 auto 20px' }}>
                  All topics per grade and subject — Math, English and Hebrew from Kindergarten to Grade 6.
                </div>
                <button onClick={() => window.location.href='/curriculum'} style={{ padding:'12px 28px', borderRadius:'50px', border:'none', background:'linear-gradient(135deg,#4A7FD4,#2EC4B6)', color:'white', fontWeight:800, fontSize:'14px', cursor:'pointer', boxShadow:'0 4px 16px rgba(74,127,212,0.3)' }}>
                  📚 Open Curriculum Browser
                </button>
              </div>
            </div>
          )}

          {/* ── PARENTS ── */}
          {screen === 'parents' && (
            <ParentsScreen familyId="11111111-1111-1111-1111-111111111111" showToast={showToast} />
          )}

          {/* ── ACCOUNT ── */}
          {screen === 'account' && (
            <div style={{ display:'flex', flexDirection:'column', gap:'18px' }}>
              <h1 style={{ fontFamily:'"Nunito",sans-serif', fontWeight:900, fontSize:'20px', color:'#1E2D4E', margin:0 }}>⚙️ Account</h1>

              {/* Manage Children */}
              <div style={{ background:'white', border:'1px solid #EEF1F6', borderRadius:'12px', padding:'20px', boxShadow:'0 2px 8px rgba(30,45,78,0.07)' }}>
                <h3 style={{ fontFamily:'"Nunito",sans-serif', fontWeight:900, fontSize:'16px', color:'#1E2D4E', marginBottom:'4px' }}>🎓 Manage Children</h3>
                <p style={{ fontSize:'13px', color:'#5A6A7E', marginBottom:'16px' }}>Manage grade, font size, break settings and PIN for each child.</p>

                {/* Column headers */}
                <div className="manage-headers" style={{ display:'grid', gridTemplateColumns:'1fr 120px 110px 130px 80px', gap:'8px', padding:'0 14px', marginBottom:'6px' }}>
                  {[
                    { label:'Child', tip:'' },
                    { label:'Grade', tip:'School year' },
                    { label:'Font Size', tip:'Text display size' },
                    { label:'Break', tip:'When to show activity breaks' },
                    { label:'PIN', tip:'4-digit login code' },
                  ].map(h => (
                    <div key={h.label} style={{ fontSize:'10px', fontWeight:800, color:'#9AA5B8', letterSpacing:'0.06em', textTransform:'uppercase' }} title={h.tip}>
                      {h.label}
                    </div>
                  ))}
                </div>

                <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                  {(children || []).map((child: any, i: number) => {
                    const col = CHILD_COLORS[i % CHILD_COLORS.length]
                    return (
                      <div key={child.id} className="manage-row" style={{ display:'grid', gridTemplateColumns:'1fr 120px 110px 130px 80px', gap:'8px', alignItems:'center', padding:'12px 14px', background:'#F8F9FB', borderRadius:'10px', border:'1px solid #EEF1F6' }}>

                        {/* Child */}
                        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                          <div style={{ width:'36px', height:'36px', borderRadius:'50%', background:col.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', flexShrink:0 }}>{col.emoji}</div>
                          <div>
                            <div style={{ fontWeight:800, fontSize:'14px', color:'#1E2D4E' }}>{child.display_name}</div>
                            <div style={{ fontSize:'11px', color:'#9AA5B8' }}>Grade {child.grade === 0 ? 'K' : child.grade}</div>
                          </div>
                        </div>

                        {/* Grade */}
                        <select defaultValue={child.grade}
                          onChange={async (e) => {
                            const newGrade = parseInt(e.target.value)
                            await fetch('/api/children', { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ childId:child.id, grade:newGrade }) })
                            showToast('🎓', `${child.display_name} moved to Grade ${newGrade === 0 ? 'K' : newGrade}!`)
                            setTimeout(() => window.location.reload(), 1000)
                          }}
                          style={{ padding:'6px 8px', borderRadius:'8px', border:'1px solid #EEF1F6', background:'white', fontWeight:700, fontSize:'12px', color:'#1E2D4E', cursor:'pointer', width:'100%' }}>
                          <option value={0}>Kindergarten</option>
                          <option value={1}>Grade 1</option>
                          <option value={2}>Grade 2</option>
                          <option value={3}>Grade 3</option>
                          <option value={4}>Grade 4</option>
                          <option value={5}>Grade 5</option>
                          <option value={6}>Grade 6</option>
                        </select>

                        {/* Font size */}
                        <select defaultValue={child.font_size || 'medium'}
                          onChange={async (e) => {
                            await fetch('/api/children', { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ childId:child.id, font_size:e.target.value }) })
                            showToast('🔤', `${child.display_name}'s font size updated!`)
                          }}
                          style={{ padding:'6px 8px', borderRadius:'8px', border:'1px solid #EEF1F6', background:'white', fontWeight:700, fontSize:'12px', color:'#1E2D4E', cursor:'pointer', width:'100%' }}>
                          <option value="small">A− Small</option>
                          <option value="medium">A Medium</option>
                          <option value="large">A+ Large</option>
                          <option value="xl">A++ XL</option>
                        </select>

                        {/* Break */}
                        <select defaultValue={child.relief_trigger || 'topic'}
                          onChange={async (e) => {
                            await fetch('/api/children', { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ childId:child.id, relief_trigger:e.target.value }) })
                            showToast('🎉', `${child.display_name}'s break updated!`)
                          }}
                          style={{ padding:'6px 8px', borderRadius:'8px', border:'1px solid #EEF1F6', background:'white', fontWeight:700, fontSize:'12px', color:'#1E2D4E', cursor:'pointer', width:'100%' }}>
                          <option value="off">Off</option>
                          <option value="lesson">Per Lesson</option>
                          <option value="topic">Per Topic</option>
                          <option value="both">Both</option>
                        </select>

                        {/* PIN */}
                        <input type="text" maxLength={4} defaultValue={child.pin_code || ''} placeholder="PIN"
                          onBlur={async (e) => {
                            const newPin = e.target.value.trim()
                            if (newPin.length === 4 && /^\d{4}$/.test(newPin)) {
                              await fetch('/api/children', { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ childId:child.id, pin_code:newPin }) })
                              showToast('🔢', `${child.display_name}'s PIN updated!`)
                            }
                          }}
                          style={{ padding:'6px 8px', borderRadius:'8px', border:'1px solid #EEF1F6', background:'white', fontWeight:800, fontSize:'14px', color:'#1E2D4E', textAlign:'center', letterSpacing:'4px', width:'100%', boxSizing:'border-box' as any }}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Child links */}
              <div style={{ background:'white', border:'1px solid #EEF1F6', borderRadius:'12px', padding:'20px', boxShadow:'0 2px 8px rgba(30,45,78,0.07)' }}>
                <h3 style={{ fontFamily:'"Nunito",sans-serif', fontWeight:900, fontSize:'16px', color:'#1E2D4E', marginBottom:'4px' }}>🔗 Child Links</h3>
                <p style={{ fontSize:'13px', color:'#5A6A7E', marginBottom:'16px' }}>Share these links — each opens a child's personal learning portal.</p>
                <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                  {(children || []).map((child: any, i: number) => {
                    const col  = CHILD_COLORS[i % CHILD_COLORS.length]
                    const link = `${typeof window !== 'undefined' ? window.location.origin : 'https://eduplay-tau.vercel.app'}/play/${child.access_token}`
                    return (
                      <div key={child.id} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'12px 14px', background:'#F8F9FB', borderRadius:'10px', border:'1px solid #EEF1F6' }}>
                        <div style={{ width:'36px', height:'36px', borderRadius:'50%', background:col.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', flexShrink:0 }}>{col.emoji}</div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontWeight:800, fontSize:'13px', color:'#1E2D4E', marginBottom:'2px' }}>{child.display_name} — Grade {child.grade === 0 ? 'K' : child.grade}</div>
                          <div style={{ fontSize:'11px', color:'#9AA5B8', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{link}</div>
                        </div>
                        <div style={{ display:'flex', gap:'6px', flexShrink:0 }}>
                          <button onClick={() => { navigator.clipboard.writeText(link); showToast('🔗', `${child.display_name}'s link copied!`) }}
                            style={{ padding:'6px 12px', borderRadius:'50px', border:'none', background:'#4A7FD4', color:'white', fontWeight:800, fontSize:'11px', cursor:'pointer' }}>
                            📋 Copy
                          </button>
                          <button onClick={() => window.open(link, '_blank')}
                            style={{ padding:'6px 12px', borderRadius:'50px', border:'1px solid #EEF1F6', background:'white', color:'#4B5563', fontWeight:800, fontSize:'11px', cursor:'pointer' }}>
                            👁️ Open
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Plan card */}
              <div style={{ background:'linear-gradient(135deg,#4A7FD4,#2EC4B6)', borderRadius:'12px', padding:'20px', color:'white' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'12px' }}>
                  <div>
                    <div style={{ fontFamily:'"Nunito",sans-serif', fontWeight:900, fontSize:'16px', marginBottom:'4px' }}>🚀 EduPlay Family Plan</div>
                    <div style={{ fontSize:'13px', opacity:.85 }}>Trial — {family?.trial_days_left ?? daysLeft} days remaining</div>
                  </div>
                  <div style={{ background:'rgba(255,255,255,0.2)', borderRadius:'8px', padding:'6px 12px', fontSize:'12px', fontWeight:800 }}>TRIAL</div>
                </div>
                <div style={{ fontSize:'12px', opacity:.8, lineHeight:1.6 }}>
                  ✅ Unlimited lessons · ✅ All subjects · ✅ 3 children · ✅ Worksheets
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="mobile-nav" style={{ display:'none', position:'fixed', bottom:0, left:0, right:0, background:'white', borderTop:'1px solid #EEF1F6', padding:'8px 0 max(8px,env(safe-area-inset-bottom))', zIndex:200, boxShadow:'0 -4px 12px rgba(0,0,0,0.06)' }}>
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => setScreen(tab.key)}
            style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'3px', background:'none', border:'none', cursor:'pointer', padding:'6px 4px' }}>
            <span style={{ fontSize:'18px' }}>{tab.label.split(' ')[0]}</span>
            <span style={{ fontSize:'9px', fontWeight:700, color:screen===tab.key?'#4A7FD4':'#9CA3AF' }}>
              {tab.label.split(' ').slice(1).join(' ')}
            </span>
            {screen === tab.key && <div style={{ width:'4px', height:'4px', borderRadius:'50%', background:'#4A7FD4' }}/>}
          </button>
        ))}
      </nav>
    </div>
  )
}