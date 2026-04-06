'use client'
import { useState } from 'react'

const CHILD_COLORS = [
  { bg: 'linear-gradient(135deg,#FF9F43,#FF6B6B)', emoji: '🐱' },
  { bg: 'linear-gradient(135deg,#5EC8F2,#4ECDC4)', emoji: '🐻' },
  { bg: 'linear-gradient(135deg,#9B59B6,#C39BD3)', emoji: '🦊' },
]

export default function DashboardClient({ data }: { data: any }) {
  const { family, children, progress, recommendations, parentName, isDemo } = data
  const [screen, setScreen] = useState('overview')
  const [toast, setToast] = useState<{ icon: string; text: string } | null>(null)
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

  const TABS = [
    { key: 'overview',   label: '🏠 Overview' },
    { key: 'progress',   label: '📊 Progress' },
    { key: 'worksheets', label: '🖨️ Worksheets' },
    { key: 'account',    label: '⚙️ Account' },
  ]

  return (
    <div style={{ minHeight:'100vh', background:'#F8F9FB', fontFamily:'"Nunito Sans",sans-serif' }}>

      {toast && (
        <div style={{ position:'fixed', bottom:'24px', right:'24px', zIndex:9999, background:'#1E2D4E', color:'white', borderRadius:'12px', padding:'12px 20px', fontSize:'13px', fontWeight:700, boxShadow:'0 8px 32px rgba(0,0,0,0.2)', display:'flex', alignItems:'center', gap:'10px' }}>
          <span style={{ fontSize:'20px' }}>{toast.icon}</span>{toast.text}
        </div>
      )}

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

      <header style={{ background:'white', borderBottom:'1px solid #EEF1F6', padding:'0 24px', height:'58px', display:'flex', alignItems:'center', justifyContent:'space-between', boxShadow:'0 2px 8px rgba(30,45,78,0.07)', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'8px', fontFamily:'"Nunito",sans-serif', fontWeight:900, fontSize:'20px', color:'#1E2D4E' }}>
          <div style={{ width:'30px', height:'30px', background:'linear-gradient(135deg,#4A7FD4,#2EC4B6)', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'15px' }}>🦔</div>
          Edu<span style={{ color:'#4A7FD4' }}>Play</span>
          <span style={{ fontSize:'11px', fontWeight:700, color:'#9AA5B8', marginLeft:'4px' }}>Parents</span>
        </div>
        <div style={{ display:'flex', gap:'4px' }}>
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setScreen(tab.key)} style={{ padding:'7px 14px', borderRadius:'50px', border:'none', fontWeight:700, fontSize:'13px', cursor:'pointer', background:screen===tab.key?'#EBF2FF':'transparent', color:screen===tab.key?'#4A7FD4':'#6B7A8D' }}>
              {tab.label}
            </button>
          ))}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          {isDemo && <span style={{ background:'#EBF2FF', color:'#4A7FD4', borderRadius:'50px', padding:'4px 12px', fontSize:'11px', fontWeight:800 }}>🧪 Demo</span>}
          <span style={{ background:'#FFF8EC', border:'1px solid #F5A623', color:'#F5A623', borderRadius:'50px', padding:'4px 12px', fontSize:'12px', fontWeight:800 }}>⏳ {daysLeft} days left</span>
          {pendingApprovals.length > 0 && (
            <button onClick={() => setApprovalOpen(true)} style={{ position:'relative', width:'34px', height:'34px', background:'#F9FAFB', border:'1px solid #E5E7EB', borderRadius:'50%', cursor:'pointer', fontSize:'15px' }}>
              🔔<span style={{ position:'absolute', top:'4px', right:'4px', width:'9px', height:'9px', background:'#FF6B6B', borderRadius:'50%', border:'2px solid white' }}/>
            </button>
          )}
          <div style={{ width:'34px', height:'34px', background:'linear-gradient(135deg,#4A7FD4,#1E2D4E)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:800, fontSize:'13px' }}>
            {parentName.split(' ').map((n: string) => n[0]).join('').slice(0,2)}
          </div>
        </div>
      </header>

      <div style={{ display:'flex', minHeight:'calc(100vh - 58px)' }}>
        <aside style={{ width:'240px', background:'white', borderRight:'1px solid #EEF1F6', padding:'14px 0', flexShrink:0, display:'flex', flexDirection:'column' }}>
          <div style={{ padding:'0 16px', marginBottom:'8px', fontSize:'10px', fontWeight:800, letterSpacing:'1.5px', textTransform:'uppercase', color:'#9AA5B8' }}>Family</div>
          {(children || []).map((child: any, i: number) => {
            const col = CHILD_COLORS[i % CHILD_COLORS.length]
            return (
              <div key={child.id} style={{ display:'flex', alignItems:'center', gap:'9px', padding:'8px 10px', margin:'0 6px 4px', borderRadius:'8px', cursor:'pointer' }}>
                <div style={{ width:'30px', height:'30px', borderRadius:'50%', background:col.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'15px', flexShrink:0 }}>{col.emoji}</div>
                <div>
                  <div style={{ fontWeight:700, fontSize:'13px', color:'#1E2D4E' }}>{child.display_name}</div>
                  <div style={{ fontSize:'11px', color:'#9AA5B8' }}>Grade {child.grade}</div>
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

        <main style={{ flex:1, padding:'24px', overflowY:'auto', maxHeight:'calc(100vh - 58px)' }}>

          {screen === 'overview' && (
            <div style={{ display:'flex', flexDirection:'column', gap:'18px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'10px' }}>
                <div>
                  <h1 style={{ fontFamily:'"Nunito",sans-serif', fontWeight:900, fontSize:'22px', color:'#1E2D4E', margin:0 }}>Good morning, {parentName.split(' ')[0]} 👋</h1>
                  <p style={{ color:'#5A6A7E', margin:'3px 0 0', fontSize:'13px' }}>Here's how your family is doing today</p>
                </div>
                <button onClick={() => setScreen('worksheets')} style={{ padding:'8px 16px', borderRadius:'50px', border:'none', background:'#4A7FD4', color:'white', fontWeight:800, fontSize:'13px', cursor:'pointer' }}>🖨️ Print Worksheet</button>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'12px' }}>
                {[
                  { label:'Total XP', value:(children||[]).reduce((s: number,c: any) => s+(c.xp_total||0),0).toLocaleString(), color:'#4A7FD4' },
                  { label:'Active Streaks', value:`${(children||[]).filter((c: any) => c.streak_current>0).length} 🔥`, color:'#FF6B6B' },
                  { label:'Lessons Done', value:(progress||[]).filter((p: any) => p.status==='completed').length, color:'#2EC4B6' },
                  { label:'Downloads Used', value:`${family?.trial_dl_used||0} / ∞`, color:'#F5A623' },
                ].map(s => (
                  <div key={s.label} style={{ background:'white', border:'1px solid #EEF1F6', borderRadius:'12px', padding:'16px', boxShadow:'0 2px 8px rgba(30,45,78,0.07)', position:'relative', overflow:'hidden' }}>
                    <div style={{ position:'absolute', top:0, left:0, right:0, height:'3px', background:s.color }}/>
                    <div style={{ fontSize:'10px', fontWeight:800, color:'#9AA5B8', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:'4px' }}>{s.label}</div>
                    <div style={{ fontFamily:'"Nunito",sans-serif', fontWeight:900, fontSize:'24px', color:s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'14px' }}>
                {(children||[]).map((child: any, i: number) => {
                  const col = CHILD_COLORS[i % CHILD_COLORS.length]
                  const cp = childProgress(child.id)
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
                          <div style={{ fontSize:'11px', color:'#9AA5B8' }}>Grade {child.grade} · {child.theme}</div>
                        </div>
                      </div>
                      <div style={{ display:'flex', flexDirection:'column', gap:'7px', marginBottom:'12px' }}>
                        {[
                          { label:'Math', pct:Math.min(100,cp.filter((p: any)=>p.status==='completed').length*15), color:'#4A7FD4' },
                          { label:'English', pct:Math.min(100,cp.filter((p: any)=>p.status==='completed').length*10), color:'#FF6B6B' },
                        ].map(subj => (
                          <div key={subj.label} style={{ display:'flex', alignItems:'center', gap:'7px' }}>
                            <div style={{ width:'7px', height:'7px', borderRadius:'50%', background:subj.color, flexShrink:0 }}/>
                            <div style={{ fontSize:'11px', fontWeight:700, color:'#5A6A7E', width:'54px', flexShrink:0 }}>{subj.label}</div>
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

          {screen === 'progress' && (
            <div style={{ display:'flex', flexDirection:'column', gap:'18px' }}>
              <h1 style={{ fontFamily:'"Nunito",sans-serif', fontWeight:900, fontSize:'20px', color:'#1E2D4E', margin:0 }}>📊 Progress Reports</h1>
              {(children||[]).map((child: any, i: number) => {
                const col = CHILD_COLORS[i % CHILD_COLORS.length]
                const cp = childProgress(child.id)
                const recs = childRecs(child.id)
                return (
                  <div key={child.id} style={{ background:'white', border:'1px solid #EEF1F6', borderRadius:'12px', padding:'20px', boxShadow:'0 2px 8px rgba(30,45,78,0.07)' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'16px' }}>
                      <div style={{ width:'42px', height:'42px', borderRadius:'50%', background:col.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'21px' }}>{col.emoji}</div>
                      <div>
                        <h2 style={{ fontFamily:'"Nunito",sans-serif', fontWeight:900, fontSize:'17px', margin:0 }}>{child.display_name}</h2>
                        <div style={{ fontSize:'12px', color:'#9AA5B8' }}>Grade {child.grade} · {(child.xp_total||0).toLocaleString()} XP · {child.streak_current} day streak 🔥</div>
                      </div>
                      <button onClick={() => window.location.href=`/lesson?childId=${child.id}`} style={{ marginLeft:'auto', padding:'9px 18px', borderRadius:'50px', border:'none', background:'#4A7FD4', color:'white', fontWeight:800, fontSize:'13px', cursor:'pointer' }}>
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
                      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px' }}>
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
                    ) : (
                      <div style={{ textAlign:'center', padding:'24px', color:'#9AA5B8', fontSize:'13px' }}>No lessons started yet. Encourage {child.display_name} to begin! 🚀</div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {screen === 'worksheets' && (
            <div style={{ display:'flex', flexDirection:'column', gap:'18px' }}>
              <h1 style={{ fontFamily:'"Nunito",sans-serif', fontWeight:900, fontSize:'20px', color:'#1E2D4E', margin:0 }}>🖨️ Worksheets & Exams</h1>
              <div style={{ background:'#F3F4F6', border:'1px solid #D1D5DB', borderRadius:'12px', padding:'12px 16px', display:'flex', gap:'12px', fontSize:'12px', color:'#4B5563', lineHeight:1.6 }}>
                <span style={{ fontSize:'20px' }}>📋</span>
                <div><strong>Content notice:</strong> EduPlay worksheets are curriculum-aligned. Parents are encouraged to review all materials. EduPlay does not replace professional educational assessment.</div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px' }}>
                {[
                  { icon:'📐', title:'Fractions — Equal Parts', meta:'Math · Grade 4 · Easy', color:'#4A7FD4', diff:'Easy', dc:'#27AE60' },
                  { icon:'📐', title:'Comparing Fractions', meta:'Math · Grade 4 · Medium', color:'#F5A623', diff:'Medium', dc:'#F5A623' },
                  { icon:'📝', title:'Mid-Year Mixed Exam', meta:'Math · Grade 4', color:'#8B5CF6', diff:'Exam', dc:'#8B5CF6' },
                  { icon:'📖', title:'Reading Comprehension', meta:'English · Grade 6 · Easy', color:'#2EC4B6', diff:'Easy', dc:'#27AE60' },
                  { icon:'🔢', title:'Numbers to 20', meta:'Math · Grade 1 · Easy', color:'#2EC4B6', diff:'Easy', dc:'#27AE60' },
                  { icon:'🇮🇱', title:'Nikud — Vowel Points', meta:'Hebrew · Grade 4', color:'#FF6B6B', diff:'Hebrew', dc:'#FF6B6B' },
                ].map((ws,i) => (
                  <div key={i} style={{ background:'white', border:'1px solid #EEF1F6', borderRadius:'12px', padding:'16px', boxShadow:'0 2px 8px rgba(30,45,78,0.07)', position:'relative', overflow:'hidden' }}>
                    <div style={{ position:'absolute', top:0, left:0, right:0, height:'3px', background:ws.color }}/>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' }}>
                      <span style={{ fontSize:'28px' }}>{ws.icon}</span>
                      <span style={{ background:`${ws.dc}22`, color:ws.dc, fontSize:'10px', fontWeight:800, padding:'2px 9px', borderRadius:'50px' }}>{ws.diff}</span>
                    </div>
                    <div style={{ fontWeight:800, fontSize:'13px', color:'#1E2D4E', marginBottom:'4px' }}>{ws.title}</div>
                    <div style={{ fontSize:'11px', color:'#9AA5B8', marginBottom:'12px' }}>{ws.meta}</div>
                    <button onClick={() => showToast('⬇️',`Downloading "${ws.title}"...`)} style={{ width:'100%', padding:'8px', borderRadius:'50px', border:'none', background:ws.color, color:'white', fontWeight:800, fontSize:'12px', cursor:'pointer' }}>⬇ Download</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {screen === 'account' && (
            <div style={{ display:'flex', flexDirection:'column', gap:'18px' }}>
              <h1 style={{ fontFamily:'"Nunito",sans-serif', fontWeight:900, fontSize:'20px', color:'#1E2D4E', margin:0 }}>⚙️ Account</h1>
              <div style={{ background:'linear-gradient(135deg,#1E2D4E,#2C3E6B)', borderRadius:'20px', padding:'24px', color:'white', maxWidth:'400px' }}>
                <div style={{ fontSize:'11px', fontWeight:700, opacity:.6, letterSpacing:'1px', textTransform:'uppercase' }}>Current Plan</div>
                <h3 style={{ fontFamily:'"Nunito",sans-serif', fontWeight:900, fontSize:'18px', margin:'4px 0' }}>Family Plan</h3>
                <div style={{ fontFamily:'"Nunito",sans-serif', fontSize:'36px', fontWeight:900, color:'#F5A623', margin:'10px 0' }}>Active <span style={{ fontSize:'14px', opacity:.7 }}>· {daysLeft} days left</span></div>
                <ul style={{ listStyle:'none', padding:0, display:'flex', flexDirection:'column', gap:'5px', margin:'0 0 16px' }}>
                  {['3 children (Lia, Tamar, Tom)','Math, English & Hebrew','Unlimited worksheets','Bilingual EN + HE'].map(f => (
                    <li key={f} style={{ fontSize:'12px', opacity:.85, display:'flex', alignItems:'center', gap:'7px' }}>
                      <span style={{ color:'#2EC4B6', fontWeight:900 }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  )
}
