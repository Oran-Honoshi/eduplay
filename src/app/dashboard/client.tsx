'use client'
import { useState, useEffect } from 'react'
import {
  Home, BarChart2, Printer, Sparkles, ClipboardList, Notebook, Map, Users, Settings,
  Rocket, Check, Flame, RefreshCw, Zap, CheckCircle2, Download, ChevronRight,
  Target, Play, UserPlus, Trash2, Key, GraduationCap, Link2, Copy, ExternalLink, Info,
} from 'lucide-react'
import ParentHeaderBar from '@/components/ParentHeaderBar'
import { PARENT_COLORS, PARENT_FONTS, CHILD_AVATAR_COLORS } from '@/lib/parentTheme'

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

  if (loading) return <div style={{ padding:'40px', textAlign:'center', color:PARENT_COLORS.textMuted }}>Loading...</div>

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'18px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <h1 style={{ display:'flex', alignItems:'center', gap:'8px', fontFamily:PARENT_FONTS.heading, fontWeight:800, fontSize:'20px', color:PARENT_COLORS.text, margin:0 }}>
          <Users size={18} color={PARENT_COLORS.primary} /> Parent Profiles
        </h1>
        {parents.length < 3 && (
          <button onClick={() => setShowAdd(!showAdd)}
            style={{ display:'flex', alignItems:'center', gap:'6px', padding:'8px 18px', borderRadius:'50px', border:'none', background:PARENT_COLORS.primary, color:'white', fontWeight:800, fontSize:'13px', cursor:'pointer' }}>
            <UserPlus size={14} /> Add Parent
          </button>
        )}
      </div>
      <p style={{ fontSize:'13px', color:PARENT_COLORS.textSecondary, margin:0 }}>
        Up to 3 parents or guardians can share oversight of this family account. Each has their own password.
      </p>
      <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
        {parents.map((parent, i) => (
          <div key={parent.id} style={{ background:PARENT_COLORS.card, border:`1px solid ${PARENT_COLORS.border}`, borderRadius:'14px', padding:'18px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'14px', marginBottom:'14px' }}>
              <div style={{ width:'48px', height:'48px', borderRadius:'50%', background:PARENT_COLORS.primary, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'24px' }}>
                {parent.avatar_emoji || '👤'}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'2px' }}>
                  <div style={{ fontWeight:800, fontSize:'16px', color:PARENT_COLORS.text }}>{parent.name}</div>
                  {parent.role === 'admin' ? (
                    <span style={{ fontSize:'10px', fontWeight:800, padding:'2px 9px', borderRadius:'50px', background:PARENT_COLORS.primary, color:'white' }}>Admin</span>
                  ) : (
                    <span style={{ fontSize:'10px', fontWeight:800, padding:'1px 8px', borderRadius:'50px', border:`1.5px solid ${PARENT_COLORS.primary}`, color:PARENT_COLORS.primary }}>Parent</span>
                  )}
                </div>
                <div style={{ fontSize:'12px', color:PARENT_COLORS.textMuted }}>{parent.email || 'No email set'}</div>
              </div>
              {i > 0 && (
                <button onClick={() => removeParent(parent.id, parent.name)}
                  style={{ display:'flex', alignItems:'center', gap:'5px', padding:'6px 12px', borderRadius:'50px', border:`1px solid ${PARENT_COLORS.dangerBorder}`, background:PARENT_COLORS.dangerLight, color:PARENT_COLORS.danger, fontWeight:700, fontSize:'12px', cursor:'pointer' }}>
                  <Trash2 size={12} /> Remove
                </button>
              )}
            </div>
            <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
              <input type="password" placeholder="New password" id={`pwd-${parent.id}`}
                style={{ flex:1, padding:'8px 12px', borderRadius:'8px', border:`1px solid ${PARENT_COLORS.border}`, fontSize:'13px', outline:'none' }}/>
              <button onClick={() => {
                const input = document.getElementById(`pwd-${parent.id}`) as HTMLInputElement
                updatePassword(parent.id, input.value, parent.name)
                input.value = ''
              }} style={{ display:'flex', alignItems:'center', gap:'5px', padding:'8px 14px', borderRadius:'8px', border:'none', background:PARENT_COLORS.primary, color:'white', fontWeight:700, fontSize:'12px', cursor:'pointer' }}>
                <Key size={12} /> Update Password
              </button>
            </div>
          </div>
        ))}
      </div>
      {showAdd && (
        <div style={{ background:PARENT_COLORS.card, border:`2px solid ${PARENT_COLORS.primary}`, borderRadius:'14px', padding:'20px' }}>
          <h3 style={{ fontFamily:PARENT_FONTS.heading, fontWeight:800, fontSize:'16px', color:PARENT_COLORS.text, margin:'0 0 16px' }}>Add New Parent / Guardian</h3>
          <div style={{ marginBottom:'14px' }}>
            <div style={{ fontSize:'12px', fontWeight:700, color:PARENT_COLORS.textSecondary, marginBottom:'8px' }}>Avatar</div>
            <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
              {PARENT_EMOJIS.map(e => (
                <button key={e} onClick={() => setNewEmoji(e)}
                  style={{ width:'36px', height:'36px', borderRadius:'8px', border:`2px solid ${newEmoji===e?PARENT_COLORS.primary:PARENT_COLORS.border}`, background:newEmoji===e?PARENT_COLORS.primaryLight:PARENT_COLORS.card, fontSize:'18px', cursor:'pointer' }}>
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'10px', marginBottom:'16px' }}>
            <input placeholder="Full name *" value={newName} onChange={e => setNewName(e.target.value)}
              style={{ padding:'10px 14px', borderRadius:'10px', border:`1px solid ${PARENT_COLORS.border}`, fontSize:'14px', outline:'none' }}/>
            <input placeholder="Email (optional)" value={newEmail} onChange={e => setNewEmail(e.target.value)}
              style={{ padding:'10px 14px', borderRadius:'10px', border:`1px solid ${PARENT_COLORS.border}`, fontSize:'14px', outline:'none' }}/>
            <input type="password" placeholder="Password *" value={newPass} onChange={e => setNewPass(e.target.value)}
              style={{ padding:'10px 14px', borderRadius:'10px', border:`1px solid ${PARENT_COLORS.border}`, fontSize:'14px', outline:'none' }}/>
          </div>
          <div style={{ display:'flex', gap:'10px' }}>
            <button onClick={() => setShowAdd(false)}
              style={{ flex:1, padding:'10px', borderRadius:'10px', border:`1px solid ${PARENT_COLORS.border}`, background:PARENT_COLORS.card, color:PARENT_COLORS.textSecondary, fontWeight:700, fontSize:'13px', cursor:'pointer' }}>
              Cancel
            </button>
            <button onClick={addParent} disabled={saving || !newName || !newPass}
              style={{ flex:2, display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', padding:'10px', borderRadius:'10px', border:'none', background:PARENT_COLORS.primary, color:'white', fontWeight:800, fontSize:'13px', cursor:'pointer', opacity:saving||!newName||!newPass?0.6:1 }}>
              <UserPlus size={14} /> {saving ? 'Adding...' : 'Add Parent'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Assignment History ──────────────────────────────────────────
// Per-child list of past assignments with a resolution breakdown, and two
// explicit reassign actions — "retry with the same child" and "assign to a
// different child" — rather than one button with an assumption baked in.
// Both reuse the same POST /api/assignments creation endpoint: pull the
// original assignment's question IDs via GET /api/assignments/[id], then
// POST a brand-new assignment with those IDs against the chosen child.
function AssignmentsScreen({ children, showToast }: any) {
  const [assignments, setAssignments] = useState<Record<string, any[]>>({})
  const [loading, setLoading]         = useState(true)
  const [busyId, setBusyId]           = useState<string | null>(null)
  const [pickerFor, setPickerFor]     = useState<string | null>(null)
  const [pickerChildId, setPickerChildId] = useState('')

  async function loadAssignments() {
    setLoading(true)
    try {
      const entries = await Promise.all((children || []).map(async (c: any) => {
        const res  = await fetch(`/api/assignments?childId=${c.id}`)
        const data = await res.json()
        return [c.id, data.assignments || []] as const
      }))
      setAssignments(Object.fromEntries(entries))
    } catch {}
    setLoading(false)
  }

  useEffect(() => { loadAssignments() }, [])

  async function reassign(assignmentId: string, targetChildId: string, targetName: string) {
    setBusyId(assignmentId)
    try {
      const detailRes = await fetch(`/api/assignments/${assignmentId}`)
      const detail     = await detailRes.json()
      const questionIds = (detail.items || []).map((it: any) => it.question?.id).filter(Boolean)
      if (questionIds.length === 0) {
        showToast('❌', 'Nothing to reassign')
        return
      }
      const res  = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId: targetChildId, questionIds, title: detail.assignment?.title || undefined }),
      })
      const data = await res.json()
      if (res.ok) {
        showToast('🔁', `New assignment created for ${targetName}!`)
        setPickerFor(null)
        setPickerChildId('')
        loadAssignments()
      } else {
        showToast('❌', data.error || 'Could not reassign')
      }
    } catch {
      showToast('❌', 'Could not reassign')
    }
    setBusyId(null)
  }

  if (loading) return <div style={{ padding:'40px', textAlign:'center', color:PARENT_COLORS.textMuted }}>Loading...</div>

  const STATUS_META: any = {
    correctFirstTry:  '✅',
    correctAfterHint: '💡',
    revealedAnswer:   '👀',
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'18px' }}>
      <h1 style={{ display:'flex', alignItems:'center', gap:'8px', fontFamily:PARENT_FONTS.heading, fontWeight:800, fontSize:'20px', color:PARENT_COLORS.text, margin:0 }}>
        <ClipboardList size={18} color={PARENT_COLORS.primary} /> Assignment History
      </h1>

      {(children || []).map((child: any, i: number) => {
        const avatarColor = CHILD_AVATAR_COLORS[i % CHILD_AVATAR_COLORS.length]
        const list = assignments[child.id] || []
        return (
          <div key={child.id} style={{ background:PARENT_COLORS.card, border:`1px solid ${PARENT_COLORS.border}`, borderRadius:'12px', padding:'20px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'14px' }}>
              <div style={{ width:'36px', height:'36px', borderRadius:'50%', background:avatarColor, display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:800, fontSize:'15px' }}>
                {child.display_name?.[0]?.toUpperCase()}
              </div>
              <h2 style={{ fontFamily:PARENT_FONTS.heading, fontWeight:800, fontSize:'15px', margin:0, color:PARENT_COLORS.text }}>{child.display_name}</h2>
            </div>

            {list.length === 0 ? (
              <div style={{ textAlign:'center', padding:'20px', color:PARENT_COLORS.textMuted, fontSize:'13px' }}>No assignments yet.</div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                {list.map((a: any) => {
                  const pct   = a.totalItems > 0 ? Math.round((a.completedItems / a.totalItems) * 100) : 0
                  const isBusy = busyId === a.id
                  return (
                    <div key={a.id} style={{ background:PARENT_COLORS.pageBg, border:`1px solid ${PARENT_COLORS.border}`, borderRadius:'10px', padding:'14px' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'10px', marginBottom:'8px', flexWrap:'wrap' }}>
                        <div>
                          <div style={{ fontWeight:800, fontSize:'13px', color:PARENT_COLORS.text }}>{a.title || 'Untitled assignment'}</div>
                          <div style={{ fontSize:'11px', color:PARENT_COLORS.textMuted }}>{new Date(a.created_at).toLocaleDateString()} · {a.completedItems}/{a.totalItems} done ({pct}%)</div>
                        </div>
                        <div style={{ display:'flex', gap:'8px', fontSize:'11px', color:PARENT_COLORS.textSecondary }}>
                          {(['correctFirstTry', 'correctAfterHint', 'revealedAnswer'] as const).map(k => (
                            a[k] > 0 && <span key={k}>{STATUS_META[k]} {a[k]}</span>
                          ))}
                        </div>
                      </div>

                      <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', alignItems:'center' }}>
                        <button disabled={isBusy} onClick={() => reassign(a.id, child.id, child.display_name)}
                          style={{ display:'flex', alignItems:'center', gap:'5px', padding:'6px 12px', borderRadius:'50px', border:`1px solid ${PARENT_COLORS.border}`, background:PARENT_COLORS.card, color:PARENT_COLORS.primary, fontWeight:700, fontSize:'11px', cursor:'pointer', opacity:isBusy?0.6:1 }}>
                          <RefreshCw size={11} /> Retry with {child.display_name}
                        </button>

                        {pickerFor === a.id ? (
                          <>
                            <select value={pickerChildId} onChange={e => setPickerChildId(e.target.value)}
                              style={{ padding:'6px 8px', borderRadius:'8px', border:`1px solid ${PARENT_COLORS.border}`, fontSize:'11px' }}>
                              <option value="">Choose a child…</option>
                              {(children || []).filter((c: any) => c.id !== child.id).map((c: any) => (
                                <option key={c.id} value={c.id}>{c.display_name}</option>
                              ))}
                            </select>
                            <button disabled={!pickerChildId || isBusy}
                              onClick={() => reassign(a.id, pickerChildId, (children || []).find((c: any) => c.id === pickerChildId)?.display_name)}
                              style={{ display:'flex', alignItems:'center', gap:'5px', padding:'6px 12px', borderRadius:'50px', border:'none', background:PARENT_COLORS.primary, color:'white', fontWeight:700, fontSize:'11px', cursor:'pointer', opacity:(!pickerChildId||isBusy)?0.6:1 }}>
                              <Check size={11} /> Confirm
                            </button>
                            <button onClick={() => { setPickerFor(null); setPickerChildId('') }}
                              style={{ padding:'6px 10px', borderRadius:'50px', border:`1px solid ${PARENT_COLORS.border}`, background:PARENT_COLORS.card, color:PARENT_COLORS.textMuted, fontWeight:700, fontSize:'11px', cursor:'pointer' }}>
                              Cancel
                            </button>
                          </>
                        ) : (
                          (children || []).length > 1 && (
                            <button disabled={isBusy} onClick={() => { setPickerFor(a.id); setPickerChildId('') }}
                              style={{ display:'flex', alignItems:'center', gap:'5px', padding:'6px 12px', borderRadius:'50px', border:`1px solid ${PARENT_COLORS.border}`, background:PARENT_COLORS.card, color:PARENT_COLORS.textSecondary, fontWeight:700, fontSize:'11px', cursor:'pointer', opacity:isBusy?0.6:1 }}>
                              <UserPlus size={11} /> Assign to a different child
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Notebook teaser ──────────────────────────────────────────────
function NotebookScreen() {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'18px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'10px' }}>
        <h1 style={{ display:'flex', alignItems:'center', gap:'8px', fontFamily:PARENT_FONTS.heading, fontWeight:800, fontSize:'20px', color:PARENT_COLORS.text, margin:0 }}>
          <Notebook size={18} color={PARENT_COLORS.primary} /> Notebook
        </h1>
        <button onClick={() => window.location.href='/notebook'} style={{ display:'flex', alignItems:'center', gap:'6px', padding:'9px 18px', borderRadius:'50px', border:'none', background:PARENT_COLORS.primary, color:'white', fontWeight:800, fontSize:'13px', cursor:'pointer' }}>
          Open Notebook <ChevronRight size={14} />
        </button>
      </div>
      <div style={{ background:PARENT_COLORS.card, border:`1px solid ${PARENT_COLORS.border}`, borderRadius:'12px', padding:'40px', textAlign:'center' }}>
        <div style={{ width:'56px', height:'56px', borderRadius:'16px', background:PARENT_COLORS.primaryLight, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
          <Notebook size={26} color={PARENT_COLORS.primary} />
        </div>
        <div style={{ fontFamily:PARENT_FONTS.heading, fontWeight:800, fontSize:'16px', color:PARENT_COLORS.text, marginBottom:'8px' }}>Your Family's Notebook</div>
        <div style={{ fontSize:'13px', color:PARENT_COLORS.textSecondary, marginBottom:'16px', maxWidth:'420px', margin:'0 auto 16px' }}>
          Organize notes, reference material, and questions into sections by chapter and subcategory — durable context you can reuse for future question generation.
        </div>
        <div>
          <button onClick={() => window.location.href='/notebook'} style={{ display:'inline-flex', alignItems:'center', gap:'7px', padding:'12px 28px', borderRadius:'50px', border:'none', background:PARENT_COLORS.primary, color:'white', fontWeight:800, fontSize:'14px', cursor:'pointer' }}>
            <Notebook size={15} /> Open Notebook
          </button>
        </div>
      </div>
    </div>
  )
}

// ── AI Question Generator teaser ────────────────────────────────
function QuestionsScreen() {
  const [pendingCount, setPendingCount] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/questions/pending')
      .then(res => res.json())
      .then(data => setPendingCount((data.questions || []).length))
      .catch(() => {})
  }, [])

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'18px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'10px' }}>
        <h1 style={{ display:'flex', alignItems:'center', gap:'8px', fontFamily:PARENT_FONTS.heading, fontWeight:800, fontSize:'20px', color:PARENT_COLORS.text, margin:0 }}>
          <Sparkles size={18} color={PARENT_COLORS.primary} /> AI Question Generator
        </h1>
        <button onClick={() => window.location.href='/questions'} style={{ display:'flex', alignItems:'center', gap:'6px', padding:'9px 18px', borderRadius:'50px', border:'none', background:PARENT_COLORS.primary, color:'white', fontWeight:800, fontSize:'13px', cursor:'pointer' }}>
          Open Full Generator <ChevronRight size={14} />
        </button>
      </div>
      <div style={{ background:PARENT_COLORS.card, border:`1px solid ${PARENT_COLORS.border}`, borderRadius:'12px', padding:'40px', textAlign:'center' }}>
        <div style={{ width:'56px', height:'56px', borderRadius:'16px', background:PARENT_COLORS.primaryLight, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
          <Sparkles size={26} color={PARENT_COLORS.primary} />
        </div>
        <div style={{ fontFamily:PARENT_FONTS.heading, fontWeight:800, fontSize:'16px', color:PARENT_COLORS.text, marginBottom:'8px' }}>Generate Custom Practice Questions</div>
        <div style={{ fontSize:'13px', color:PARENT_COLORS.textSecondary, marginBottom:'16px', maxWidth:'420px', margin:'0 auto 16px' }}>
          Use AI to generate new questions by subject, topic and difficulty, review them before they go live, and browse the shared question library.
        </div>
        {!!pendingCount && (
          <div style={{ display:'inline-flex', alignItems:'center', gap:'6px', background:PARENT_COLORS.amberLight, border:`1px solid ${PARENT_COLORS.amber}`, color:PARENT_COLORS.amberText, borderRadius:'50px', padding:'6px 14px', fontSize:'12px', fontWeight:800, marginBottom:'20px' }}>
            ⏳ {pendingCount} question{pendingCount === 1 ? '' : 's'} awaiting review
          </div>
        )}
        <div>
          <button onClick={() => window.location.href='/questions'} style={{ display:'inline-flex', alignItems:'center', gap:'7px', padding:'12px 28px', borderRadius:'50px', border:'none', background:PARENT_COLORS.primary, color:'white', fontWeight:800, fontSize:'14px', cursor:'pointer' }}>
            <Sparkles size={15} /> Open Question Generator
          </button>
        </div>
      </div>
    </div>
  )
}

const CHILD_COLORS = [
  { bg:'linear-gradient(135deg,#FF9F43,#FF6B6B)', emoji:'🐱' },
  { bg:'linear-gradient(135deg,#5EC8F2,#4ECDC4)', emoji:'🐻' },
  { bg:'linear-gradient(135deg,#9B59B6,#C39BD3)', emoji:'🦊' },
]

const TABS = [
  { key:'overview',    label:'Overview',    icon:Home },
  { key:'progress',    label:'Progress',    icon:BarChart2 },
  { key:'worksheets',  label:'Worksheets',  icon:Printer },
  { key:'questions',   label:'AI Questions', icon:Sparkles },
  { key:'assignments', label:'Assignments', icon:ClipboardList },
  { key:'notebook',    label:'Notebook',    icon:Notebook },
  { key:'curriculum',  label:'Curriculum',  icon:Map },
  { key:'parents',     label:'Parents',     icon:Users },
  { key:'account',     label:'Account',     icon:Settings },
]

export default function DashboardClient({ data, error }: { data: any; error?: string }) {
  const { family, children, progress, recommendations, parentName, isDemo } = data
  const [screen, setScreen]         = useState('overview')
  const [toast, setToast]           = useState<{ icon:string; text:string }|null>(null)
  const [errorBanner, setErrorBanner]   = useState(error)

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

  const dashStyles = `
    @media (max-width: 767px) {
      .dashboard-sidebar { display: none !important; }
      .dashboard-tabs { overflow-x: auto; -webkit-overflow-scrolling: touch; white-space: nowrap; scrollbar-width: none; justify-content: flex-start !important; }
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
    <div style={{ minHeight:'100vh', background:PARENT_COLORS.pageBg, fontFamily:PARENT_FONTS.body }}>
      <style>{dashStyles}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', bottom:'24px', right:'24px', zIndex:9999, background:PARENT_COLORS.text, color:'white', borderRadius:'12px', padding:'12px 20px', fontSize:'13px', fontWeight:700, boxShadow:'0 8px 32px rgba(0,0,0,0.2)', display:'flex', alignItems:'center', gap:'10px' }}>
          <span style={{ fontSize:'20px' }}>{toast.icon}</span>{toast.text}
        </div>
      )}

      {/* Header */}
      <ParentHeaderBar
        center={
          <div className="dashboard-tabs" style={{ display:'flex', gap:'2px', flex:1, minWidth:0, justifyContent:'center' }}>
            {TABS.map(tab => {
              const Icon = tab.icon
              const active = screen === tab.key
              return (
                <button key={tab.key} onClick={() => setScreen(tab.key)}
                  style={{ display:'flex', alignItems:'center', gap:'6px', padding:'7px 12px', borderRadius:'8px', border:'none', fontFamily:PARENT_FONTS.body, fontWeight:700, fontSize:'12px', cursor:'pointer', background:active?PARENT_COLORS.primary:'transparent', color:active?'white':PARENT_COLORS.text, whiteSpace:'nowrap', flexShrink:0 }}>
                  <Icon size={14} />
                  {tab.label}
                </button>
              )
            })}
          </div>
        }
        right={
          <div className="header-right" style={{ display:'flex', alignItems:'center', gap:'10px', flexShrink:0 }}>
            {isDemo && <span style={{ background:PARENT_COLORS.primaryLight, color:PARENT_COLORS.primary, borderRadius:'50px', padding:'4px 10px', fontSize:'11px', fontWeight:800 }}>🧪 Demo</span>}
            <span className="days-badge" style={{ background:PARENT_COLORS.amberLight, border:`1px solid ${PARENT_COLORS.amber}`, color:PARENT_COLORS.amberText, borderRadius:'50px', padding:'4px 10px', fontSize:'12px', fontWeight:800 }}>{daysLeft} days left</span>
            <div style={{ width:'34px', height:'34px', background:PARENT_COLORS.primary, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:800, fontSize:'13px', flexShrink:0 }}>
              {parentName.split(' ').map((n: string) => n[0]).join('').slice(0,2)}
            </div>
          </div>
        }
      />

      {/* Error banner */}
      {errorBanner === 'lesson_access_denied' && (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'10px', background:'#FFF5F5', borderBottom:'1px solid #FEE2E2', color:'#DC2626', fontSize:'13px', fontWeight:700, padding:'10px 16px' }}>
          <span>⚠️ That lesson isn't available. Please pick another one.</span>
          <button onClick={() => setErrorBanner(undefined)} style={{ border:'none', background:'transparent', color:'#DC2626', fontWeight:800, cursor:'pointer', fontSize:'14px', lineHeight:1 }}>✕</button>
        </div>
      )}

      <div style={{ display:'flex', minHeight:'calc(100vh - 64px)' }}>

        {/* Sidebar */}
        <aside className="dashboard-sidebar" style={{ width:'216px', background:PARENT_COLORS.card, borderRight:`1px solid ${PARENT_COLORS.border}`, padding:'14px 0', flexShrink:0, display:'flex', flexDirection:'column' }}>
          <div style={{ padding:'0 16px', marginBottom:'8px', fontSize:'10px', fontWeight:800, letterSpacing:'1.5px', textTransform:'uppercase', color:PARENT_COLORS.textMuted }}>Family</div>
          {(children || []).map((child: any, i: number) => {
            const avatarColor = CHILD_AVATAR_COLORS[i % CHILD_AVATAR_COLORS.length]
            return (
              <div key={child.id} style={{ display:'flex', alignItems:'center', gap:'9px', padding:'8px 10px', margin:'0 6px 4px', borderRadius:'8px', cursor:'pointer' }}>
                <div style={{ width:'30px', height:'30px', borderRadius:'50%', background:avatarColor, display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:800, fontSize:'13px', flexShrink:0 }}>
                  {child.display_name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight:700, fontSize:'13px', color:PARENT_COLORS.text }}>{child.display_name}</div>
                  <div style={{ fontSize:'11px', color:PARENT_COLORS.textMuted }}>Grade {child.grade === 0 ? 'K' : child.grade} · {child.card_tokens || 0} tokens</div>
                </div>
                {child.streak_current > 0 && (
                  <span style={{ display:'flex', alignItems:'center', gap:'2px', fontSize:'12px', fontWeight:800, color:PARENT_COLORS.coralText, marginLeft:'auto' }}>
                    <Flame size={12} />{child.streak_current}
                  </span>
                )}
              </div>
            )
          })}
          <div style={{ flex:1 }}/>
          <div style={{ margin:'10px', background:PARENT_COLORS.pageBg, border:`1px solid ${PARENT_COLORS.border}`, borderRadius:'12px', padding:'14px' }}>
            <h4 style={{ fontFamily:PARENT_FONTS.heading, fontSize:'13px', fontWeight:800, color:PARENT_COLORS.text, marginBottom:'4px', display:'flex', alignItems:'center', gap:'6px' }}>
              <Rocket size={14} color={PARENT_COLORS.primary} /> Upgrade
            </h4>
            <p style={{ fontSize:'11px', color:PARENT_COLORS.textSecondary, marginBottom:'10px', lineHeight:1.5 }}>Unlimited worksheets & 5 children.</p>
            <button onClick={() => showToast('🚀','Upgrade coming soon!')} style={{ width:'100%', padding:'8px', borderRadius:'50px', border:'none', background:PARENT_COLORS.primary, color:'white', fontWeight:800, fontSize:'12px', cursor:'pointer' }}>$20/mo</button>
          </div>
        </aside>

        {/* Main */}
        <main className="dashboard-main" style={{ flex:1, padding:'24px', overflowY:'auto', maxHeight:'calc(100vh - 64px)' }}>

          {/* ── OVERVIEW ── */}
          {screen === 'overview' && (
            <div style={{ display:'flex', flexDirection:'column', gap:'18px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'10px' }}>
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                    <h1 style={{ fontFamily:PARENT_FONTS.heading, fontWeight:800, fontSize:'22px', color:PARENT_COLORS.text, margin:0 }}>Good morning, {parentName.split(' ')[0]} 👋</h1>
                    <button onClick={() => window.location.reload()}
                      style={{ display:'flex', alignItems:'center', gap:'6px', padding:'6px 14px', borderRadius:'50px', border:`1px solid ${PARENT_COLORS.border}`, background:PARENT_COLORS.card, fontWeight:700, fontSize:'12px', cursor:'pointer', color:PARENT_COLORS.textSecondary }}>
                      <RefreshCw size={13} /> Refresh
                    </button>
                  </div>
                  <p style={{ color:PARENT_COLORS.textSecondary, margin:'3px 0 0', fontSize:'13px' }}>Here's how your family is doing today</p>
                </div>
                <button onClick={() => window.location.href='/worksheets'} style={{ display:'flex', alignItems:'center', gap:'7px', padding:'8px 16px', borderRadius:'50px', border:'none', background:PARENT_COLORS.primary, color:'white', fontWeight:800, fontSize:'13px', cursor:'pointer' }}>
                  <Printer size={14} /> Worksheet Builder
                </button>
              </div>

              <div className="stat-grid" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'12px' }}>
                {[
                  { label:'Total XP',       value:(children||[]).reduce((s: number,c: any) => s+(c.xp_total||0),0).toLocaleString(), color:PARENT_COLORS.primary, bg:PARENT_COLORS.primaryLight, icon:Zap },
                  { label:'Active Streaks', value:`${(children||[]).filter((c: any) => c.streak_current>0).length}`, color:PARENT_COLORS.coralText, bg:PARENT_COLORS.coralLight, icon:Flame },
                  { label:'Lessons Done',   value:(progress||[]).filter((p: any) => p.status==='completed').length, color:PARENT_COLORS.accent, bg:PARENT_COLORS.accentLight, icon:CheckCircle2 },
                  { label:'Downloads',      value:`${family?.trial_dl_used||0} / ∞`, color:PARENT_COLORS.amberText, bg:PARENT_COLORS.amberLight, icon:Download },
                ].map(s => (
                  <div key={s.label} style={{ background:PARENT_COLORS.card, border:`1px solid ${PARENT_COLORS.border}`, borderRadius:'12px', padding:'16px', display:'flex', flexDirection:'column', gap:'10px' }}>
                    <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:s.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <s.icon size={17} color={s.color} />
                    </div>
                    <div>
                      <div style={{ fontSize:'10.5px', fontWeight:800, color:PARENT_COLORS.textMuted, textTransform:'uppercase', letterSpacing:'.5px', marginBottom:'2px' }}>{s.label}</div>
                      <div style={{ fontFamily:PARENT_FONTS.heading, fontWeight:800, fontSize:'18px', color:PARENT_COLORS.text }}>{s.value}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="child-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'14px' }}>
                {(children||[]).map((child: any, i: number) => {
                  const avatarColor = CHILD_AVATAR_COLORS[i % CHILD_AVATAR_COLORS.length]
                  const cp   = childProgress(child.id)
                  const recs = childRecs(child.id)
                  const highPri = recs.find((r: any) => r.priority==='high')
                  return (
                    <div key={child.id} onClick={() => setScreen('progress')} style={{ background:PARENT_COLORS.card, border:`1px solid ${PARENT_COLORS.border}`, borderRadius:'20px', padding:'18px', cursor:'pointer' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'14px' }}>
                        <div style={{ width:'48px', height:'48px', borderRadius:'50%', background:avatarColor, display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:800, fontSize:'19px', position:'relative' }}>
                          {child.display_name?.[0]?.toUpperCase()}
                          {child.streak_current>0 && <div style={{ position:'absolute', bottom:'-2px', right:'-2px', background:PARENT_COLORS.coral, color:'white', fontSize:'9px', fontWeight:800, width:'18px', height:'18px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', border:'2px solid white' }}>{child.streak_current}</div>}
                        </div>
                        <div>
                          <div style={{ fontFamily:PARENT_FONTS.heading, fontWeight:800, fontSize:'15px', color:PARENT_COLORS.text }}>{child.display_name}</div>
                          <div style={{ fontSize:'11px', color:PARENT_COLORS.textMuted }}>Grade {child.grade === 0 ? 'K' : child.grade} · {(child.xp_total||0)} XP</div>
                        </div>
                      </div>
                      <div style={{ display:'flex', flexDirection:'column', gap:'7px', marginBottom:'12px' }}>
                        {[
                          { label:'Math',   pct:Math.min(100,Math.round((cp.filter((p: any)=>p.status==='completed'&&p.topic?.subject?.slug==='math').length/7)*100)),   color:PARENT_COLORS.primary },
                          { label:'Hebrew', pct:Math.min(100,Math.round((cp.filter((p: any)=>p.status==='completed'&&p.topic?.subject?.slug==='hebrew').length/4)*100)), color:PARENT_COLORS.coralText },
                        ].map(subj => (
                          <div key={subj.label} style={{ display:'flex', alignItems:'center', gap:'7px' }}>
                            <div style={{ width:'7px', height:'7px', borderRadius:'50%', background:subj.color, flexShrink:0 }}/>
                            <div style={{ fontSize:'11px', fontWeight:700, color:PARENT_COLORS.textSecondary, width:'46px', flexShrink:0 }}>{subj.label}</div>
                            <div style={{ flex:1, height:'7px', background:PARENT_COLORS.borderLight, borderRadius:'50px', overflow:'hidden' }}>
                              <div style={{ height:'100%', width:`${subj.pct}%`, background:subj.color, borderRadius:'50px' }}/>
                            </div>
                            <div style={{ fontSize:'10px', fontWeight:800, color:PARENT_COLORS.textSecondary, width:'28px', textAlign:'right' }}>{subj.pct}%</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ background:highPri?PARENT_COLORS.coralLight:PARENT_COLORS.primaryLight, borderRadius:'8px', padding:'8px 10px', fontSize:'11px', color:highPri?PARENT_COLORS.coralText:PARENT_COLORS.primary, fontWeight:700, display:'flex', gap:'6px', marginBottom:'10px' }}>
                        <span>{highPri?'⚠️':'🌟'}</span>
                        <span>{highPri?<><strong>Focus: </strong>{highPri.topic?.title_en}</>:'Doing great!'}</span>
                      </div>
                      <button onClick={e => { e.stopPropagation(); window.location.href=`/lesson?childId=${child.id}` }}
                        style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', padding:'9px', borderRadius:'50px', border:`1.5px solid ${PARENT_COLORS.primary}`, background:'transparent', color:PARENT_COLORS.primary, fontWeight:800, fontSize:'12px', cursor:'pointer' }}>
                        Continue Lesson <ChevronRight size={13} />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── PROGRESS ── */}
          {screen === 'progress' && (
            <div style={{ display:'flex', flexDirection:'column', gap:'18px' }}>
              <h1 style={{ display:'flex', alignItems:'center', gap:'8px', fontFamily:PARENT_FONTS.heading, fontWeight:800, fontSize:'20px', color:PARENT_COLORS.text, margin:0 }}>
                <BarChart2 size={18} color={PARENT_COLORS.primary} /> Progress Reports
              </h1>
              {(children||[]).map((child: any, i: number) => {
                const avatarColor = CHILD_AVATAR_COLORS[i % CHILD_AVATAR_COLORS.length]
                const cp   = childProgress(child.id)
                const recs = childRecs(child.id)
                return (
                  <div key={child.id} style={{ background:PARENT_COLORS.card, border:`1px solid ${PARENT_COLORS.border}`, borderRadius:'12px', padding:'20px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'16px', flexWrap:'wrap' }}>
                      <div style={{ width:'42px', height:'42px', borderRadius:'50%', background:avatarColor, display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:800, fontSize:'17px' }}>
                        {child.display_name?.[0]?.toUpperCase()}
                      </div>
                      <div style={{ flex:1 }}>
                        <h2 style={{ fontFamily:PARENT_FONTS.heading, fontWeight:800, fontSize:'17px', margin:0, color:PARENT_COLORS.text }}>{child.display_name}</h2>
                        <div style={{ display:'flex', alignItems:'center', gap:'4px', fontSize:'12px', color:PARENT_COLORS.textMuted }}>
                          Grade {child.grade === 0 ? 'K' : child.grade} · {(child.xp_total||0).toLocaleString()} XP · {child.streak_current || 0} day streak <Flame size={12} color={PARENT_COLORS.coralText} />
                        </div>
                      </div>
                      <button onClick={() => window.location.href=`/lesson?childId=${child.id}`} style={{ display:'flex', alignItems:'center', gap:'6px', padding:'9px 18px', borderRadius:'50px', border:'none', background:PARENT_COLORS.primary, color:'white', fontWeight:800, fontSize:'13px', cursor:'pointer' }}>
                        <Play size={13} /> Start Lesson
                      </button>
                    </div>
                    {recs.length > 0 && (
                      <div style={{ background:PARENT_COLORS.coralLight, border:`1px solid ${PARENT_COLORS.coral}30`, borderRadius:'12px', padding:'14px', marginBottom:'14px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'6px', fontFamily:PARENT_FONTS.heading, fontWeight:800, fontSize:'14px', color:PARENT_COLORS.coralText, marginBottom:'10px' }}>
                          <Target size={14} /> Focus Recommendations
                        </div>
                        {recs.slice(0,2).map((rec: any) => (
                          <div key={rec.id} style={{ background:PARENT_COLORS.card, border:`1px solid ${PARENT_COLORS.coral}20`, borderRadius:'10px', padding:'12px', marginBottom:'8px', display:'flex', gap:'12px' }}>
                            <div style={{ flex:1 }}>
                              <div style={{ fontWeight:800, fontSize:'13px', color:PARENT_COLORS.text, marginBottom:'2px' }}>{rec.topic?.title_en}</div>
                              <div style={{ fontSize:'11px', color:PARENT_COLORS.textSecondary, lineHeight:1.6 }}>{rec.reason_en}</div>
                            </div>
                            <span style={{ fontSize:'10px', fontWeight:800, padding:'2px 9px', borderRadius:'50px', background:rec.priority==='high'?PARENT_COLORS.coralLight:PARENT_COLORS.amberLight, color:rec.priority==='high'?PARENT_COLORS.coralText:PARENT_COLORS.amberText, whiteSpace:'nowrap', alignSelf:'flex-start' }}>{rec.priority}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {cp.length > 0 ? (
                      <div style={{ overflowX:'auto' }}>
                        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px', minWidth:'400px' }}>
                          <thead>
                            <tr style={{ borderBottom:`2px solid ${PARENT_COLORS.border}` }}>
                              {['Topic','Status','Progress'].map(h => (
                                <th key={h} style={{ textAlign:'left', padding:'8px 10px', fontSize:'11px', fontWeight:800, color:PARENT_COLORS.textMuted, textTransform:'uppercase' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {cp.map((p: any) => {
                              const pct = Math.round((p.steps_completed/(p.steps_total||5))*100)
                              const statusColors: any = { completed:PARENT_COLORS.primary, in_progress:PARENT_COLORS.accent, needs_review:PARENT_COLORS.coralText, not_started:PARENT_COLORS.textMuted }
                              const statusBg: any     = { completed:PARENT_COLORS.primaryLight, in_progress:PARENT_COLORS.accentLight, needs_review:PARENT_COLORS.coralLight, not_started:PARENT_COLORS.borderLight }
                              const statusLabels: any = { completed:'Done', in_progress:'In Progress', needs_review:'Needs Work', not_started:'Not Started' }
                              return (
                                <tr key={p.id} style={{ borderBottom:`1px solid ${PARENT_COLORS.border}` }}>
                                  <td style={{ padding:'10px', fontWeight:700, color:PARENT_COLORS.text }}>{p.topic?.title_en}</td>
                                  <td style={{ padding:'10px' }}>
                                    <span style={{ background:statusBg[p.status], color:statusColors[p.status], fontSize:'11px', fontWeight:800, padding:'2px 9px', borderRadius:'50px' }}>{statusLabels[p.status]}</span>
                                  </td>
                                  <td style={{ padding:'10px' }}>
                                    <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                                      <div style={{ width:'80px', height:'7px', background:PARENT_COLORS.borderLight, borderRadius:'50px', overflow:'hidden' }}>
                                        <div style={{ height:'100%', width:`${pct}%`, background:statusColors[p.status], borderRadius:'50px' }}/>
                                      </div>
                                      <span style={{ fontSize:'11px', fontWeight:800, color:PARENT_COLORS.textSecondary }}>{pct}%</span>
                                    </div>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div style={{ textAlign:'center', padding:'24px', color:PARENT_COLORS.textMuted, fontSize:'13px' }}>No lessons started yet. Encourage {child.display_name} to begin! 🚀</div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* ── WORKSHEETS ── */}
          {screen === 'worksheets' && (
            <div style={{ display:'flex', flexDirection:'column', gap:'18px' }}>
              <h1 style={{ display:'flex', alignItems:'center', gap:'8px', fontFamily:PARENT_FONTS.heading, fontWeight:800, fontSize:'20px', color:PARENT_COLORS.text, margin:0 }}>
                <Printer size={18} color={PARENT_COLORS.primary} /> Worksheets & Exams
              </h1>
              <div style={{ background:PARENT_COLORS.accentLight, border:`1px solid ${PARENT_COLORS.accent}30`, borderRadius:'12px', padding:'12px 16px', display:'flex', gap:'12px', fontSize:'12px', color:PARENT_COLORS.text, lineHeight:1.6 }}>
                <Info size={18} color={PARENT_COLORS.accent} style={{ flexShrink:0 }} />
                <div><strong>Content notice:</strong> EduPlay worksheets are curriculum-aligned. Parents are encouraged to review all materials.</div>
              </div>
              <div className="child-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px' }}>
                {(children || []).map((child: any, i: number) => {
                  const avatarColor = CHILD_AVATAR_COLORS[i % CHILD_AVATAR_COLORS.length]
                  return (
                    <div key={child.id} style={{ background:PARENT_COLORS.card, border:`1px solid ${PARENT_COLORS.border}`, borderRadius:'12px', padding:'20px', textAlign:'center', cursor:'pointer' }}
                      onClick={() => window.location.href=`/worksheets?childId=${child.id}`}>
                      <div style={{ width:'52px', height:'52px', borderRadius:'50%', background:avatarColor, display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:800, fontSize:'21px', margin:'0 auto 10px' }}>
                        {child.display_name?.[0]?.toUpperCase()}
                      </div>
                      <div style={{ fontWeight:800, fontSize:'15px', color:PARENT_COLORS.text, marginBottom:'3px' }}>{child.display_name}</div>
                      <div style={{ fontSize:'12px', color:PARENT_COLORS.textMuted, marginBottom:'14px' }}>Grade {child.grade === 0 ? 'K' : child.grade}</div>
                      <button style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', width:'100%', padding:'9px', borderRadius:'50px', border:'none', background:PARENT_COLORS.primary, color:'white', fontWeight:800, fontSize:'12px', cursor:'pointer' }}>
                        <Printer size={13} /> Build Worksheet
                      </button>
                    </div>
                  )
                })}
              </div>
              <div style={{ background:PARENT_COLORS.card, border:`1px solid ${PARENT_COLORS.border}`, borderRadius:'12px', padding:'20px' }}>
                <h3 style={{ fontFamily:PARENT_FONTS.heading, fontWeight:800, fontSize:'16px', color:PARENT_COLORS.text, marginBottom:'8px' }}>Worksheet Builder</h3>
                <p style={{ fontSize:'13px', color:PARENT_COLORS.textSecondary, marginBottom:'16px' }}>Choose subject, topics, difficulty, number of questions and download a print-ready PDF.</p>
                <div style={{ display:'flex', gap:'10px', flexWrap:'wrap' }}>
                  <button onClick={() => window.location.href='/worksheets'}
                    style={{ display:'flex', alignItems:'center', gap:'7px', padding:'10px 24px', borderRadius:'50px', border:'none', background:PARENT_COLORS.primary, color:'white', fontWeight:800, fontSize:'13px', cursor:'pointer' }}>
                    Open Full Builder <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── AI QUESTIONS ── */}
          {screen === 'questions' && (
            <QuestionsScreen />
          )}

          {/* ── ASSIGNMENTS ── */}
          {screen === 'assignments' && (
            <AssignmentsScreen children={children} showToast={showToast} />
          )}

          {/* ── NOTEBOOK ── */}
          {screen === 'notebook' && (
            <NotebookScreen />
          )}

          {/* ── CURRICULUM ── */}
          {screen === 'curriculum' && (
            <div style={{ display:'flex', flexDirection:'column', gap:'18px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'10px' }}>
                <h1 style={{ display:'flex', alignItems:'center', gap:'8px', fontFamily:PARENT_FONTS.heading, fontWeight:800, fontSize:'20px', color:PARENT_COLORS.text, margin:0 }}>
                  <Map size={18} color={PARENT_COLORS.primary} /> Curriculum
                </h1>
                <button onClick={() => window.location.href='/curriculum'} style={{ display:'flex', alignItems:'center', gap:'6px', padding:'9px 18px', borderRadius:'50px', border:'none', background:PARENT_COLORS.primary, color:'white', fontWeight:800, fontSize:'13px', cursor:'pointer' }}>
                  Open Full Browser <ChevronRight size={14} />
                </button>
              </div>
              <div style={{ background:PARENT_COLORS.card, border:`1px solid ${PARENT_COLORS.border}`, borderRadius:'12px', padding:'40px', textAlign:'center' }}>
                <div style={{ width:'56px', height:'56px', borderRadius:'16px', background:PARENT_COLORS.primaryLight, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
                  <Map size={26} color={PARENT_COLORS.primary} />
                </div>
                <div style={{ fontFamily:PARENT_FONTS.heading, fontWeight:800, fontSize:'16px', color:PARENT_COLORS.text, marginBottom:'8px' }}>Browse the Full Curriculum</div>
                <div style={{ fontSize:'13px', color:PARENT_COLORS.textSecondary, marginBottom:'20px', maxWidth:'400px', margin:'0 auto 20px' }}>
                  All topics per grade and subject — Math, English and Hebrew from Kindergarten to Grade 6.
                </div>
                <button onClick={() => window.location.href='/curriculum'} style={{ display:'inline-flex', alignItems:'center', gap:'7px', padding:'12px 28px', borderRadius:'50px', border:'none', background:PARENT_COLORS.primary, color:'white', fontWeight:800, fontSize:'14px', cursor:'pointer' }}>
                  <Map size={15} /> Open Curriculum Browser
                </button>
              </div>
            </div>
          )}

          {/* ── PARENTS ── */}
          {screen === 'parents' && (
            <ParentsScreen familyId={family?.id} showToast={showToast} />
          )}

          {/* ── ACCOUNT ── */}
          {screen === 'account' && (
            <div style={{ display:'flex', flexDirection:'column', gap:'18px' }}>
              <h1 style={{ display:'flex', alignItems:'center', gap:'8px', fontFamily:PARENT_FONTS.heading, fontWeight:800, fontSize:'20px', color:PARENT_COLORS.text, margin:0 }}>
                <Settings size={18} color={PARENT_COLORS.primary} /> Account
              </h1>

              {/* Manage Children */}
              <div style={{ background:PARENT_COLORS.card, border:`1px solid ${PARENT_COLORS.border}`, borderRadius:'12px', padding:'20px' }}>
                <h3 style={{ display:'flex', alignItems:'center', gap:'7px', fontFamily:PARENT_FONTS.heading, fontWeight:800, fontSize:'16px', color:PARENT_COLORS.text, marginBottom:'4px' }}>
                  <GraduationCap size={16} color={PARENT_COLORS.primary} /> Manage Children
                </h3>
                <p style={{ fontSize:'13px', color:PARENT_COLORS.textSecondary, marginBottom:'16px' }}>Manage grade, font size, break settings and PIN for each child.</p>

                {/* Column headers */}
                <div className="manage-headers" style={{ display:'grid', gridTemplateColumns:'1fr 110px 110px 110px 120px 80px', gap:'8px', padding:'0 14px', marginBottom:'6px' }}>
                  {[
                    { label:'Child', tip:'' },
                    { label:'Grade', tip:'School year' },
                    { label:'Font Size', tip:'Text display size' },
                    { label:'Break', tip:'When to show activity breaks' },
                    { label:'PIN', tip:'4-digit login code' },
                  ].map(h => (
                    <div key={h.label} style={{ fontSize:'10px', fontWeight:800, color:PARENT_COLORS.textMuted, letterSpacing:'0.06em', textTransform:'uppercase' }} title={h.tip}>
                      {h.label}
                    </div>
                  ))}
                </div>

                <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                  {(children || []).map((child: any, i: number) => {
                    const avatarColor = CHILD_AVATAR_COLORS[i % CHILD_AVATAR_COLORS.length]
                    return (
                      <div key={child.id} className="manage-row" style={{ display:'grid', gridTemplateColumns:'1fr 110px 110px 110px 120px 80px', gap:'8px', alignItems:'center', padding:'12px 14px', background:PARENT_COLORS.pageBg, borderRadius:'10px', border:`1px solid ${PARENT_COLORS.border}` }}>

                        {/* Child */}
                        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                          <div style={{ width:'36px', height:'36px', borderRadius:'50%', background:avatarColor, display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:800, fontSize:'15px', flexShrink:0 }}>
                            {child.display_name?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight:800, fontSize:'14px', color:PARENT_COLORS.text }}>{child.display_name}</div>
                            <div style={{ fontSize:'11px', color:PARENT_COLORS.textMuted }}>Grade {child.grade === 0 ? 'K' : child.grade} · {child.card_tokens || 0} tokens</div>
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
                          style={{ padding:'6px 8px', borderRadius:'8px', border:`1px solid ${PARENT_COLORS.border}`, background:PARENT_COLORS.card, fontWeight:700, fontSize:'12px', color:PARENT_COLORS.text, cursor:'pointer', width:'100%' }}>
                          <option value={0}>Kindergarten</option>
                          <option value={1}>Grade 1</option>
                          <option value={2}>Grade 2</option>
                          <option value={3}>Grade 3</option>
                          <option value={4}>Grade 4</option>
                          <option value={5}>Grade 5</option>
                          <option value={6}>Grade 6</option>
                        </select>

                        {/* Theme */}
                        <select defaultValue={child.theme || 'plain'}
                          onChange={async (e) => {
                            await fetch('/api/children', { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ childId:child.id, theme:e.target.value }) })
                            showToast('🎨', `${child.display_name}'s theme updated!`)
                          }}
                          style={{ padding:'6px 8px', borderRadius:'8px', border:`1px solid ${PARENT_COLORS.border}`, background:PARENT_COLORS.card, fontWeight:700, fontSize:'12px', color:PARENT_COLORS.text, cursor:'pointer', width:'100%' }}>
                          <option value="plain">📚 Classic</option>
                          <option value="minecraft">⛏️ Minecraft</option>
                          <option value="princesses">👑 Princesses</option>
                        </select>

                        {/* Font size */}
                        <select defaultValue={child.font_size || 'medium'}
                          onChange={async (e) => {
                            await fetch('/api/children', { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ childId:child.id, font_size:e.target.value }) })
                            showToast('🔤', `${child.display_name}'s font size updated!`)
                          }}
                          style={{ padding:'6px 8px', borderRadius:'8px', border:`1px solid ${PARENT_COLORS.border}`, background:PARENT_COLORS.card, fontWeight:700, fontSize:'12px', color:PARENT_COLORS.text, cursor:'pointer', width:'100%' }}>
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
                          style={{ padding:'6px 8px', borderRadius:'8px', border:`1px solid ${PARENT_COLORS.border}`, background:PARENT_COLORS.card, fontWeight:700, fontSize:'12px', color:PARENT_COLORS.text, cursor:'pointer', width:'100%' }}>
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
                          style={{ padding:'6px 8px', borderRadius:'8px', border:`1px solid ${PARENT_COLORS.border}`, background:PARENT_COLORS.card, fontWeight:800, fontSize:'14px', color:PARENT_COLORS.text, textAlign:'center', letterSpacing:'4px', width:'100%', boxSizing:'border-box' as any }}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Child links */}
              <div style={{ background:PARENT_COLORS.card, border:`1px solid ${PARENT_COLORS.border}`, borderRadius:'12px', padding:'20px' }}>
                <h3 style={{ display:'flex', alignItems:'center', gap:'7px', fontFamily:PARENT_FONTS.heading, fontWeight:800, fontSize:'16px', color:PARENT_COLORS.text, marginBottom:'4px' }}>
                  <Link2 size={16} color={PARENT_COLORS.primary} /> Child Links
                </h3>
                <p style={{ fontSize:'13px', color:PARENT_COLORS.textSecondary, marginBottom:'16px' }}>Share these links — each opens a child's personal learning portal.</p>
                <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                  {(children || []).map((child: any, i: number) => {
                    const avatarColor = CHILD_AVATAR_COLORS[i % CHILD_AVATAR_COLORS.length]
                    const link = `${typeof window !== 'undefined' ? window.location.origin : 'https://eduplay-tau.vercel.app'}/play/${child.access_token}`
                    return (
                      <div key={child.id} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'12px 14px', background:PARENT_COLORS.pageBg, borderRadius:'10px', border:`1px solid ${PARENT_COLORS.border}` }}>
                        <div style={{ width:'36px', height:'36px', borderRadius:'50%', background:avatarColor, display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:800, fontSize:'15px', flexShrink:0 }}>
                          {child.display_name?.[0]?.toUpperCase()}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontWeight:800, fontSize:'13px', color:PARENT_COLORS.text, marginBottom:'2px' }}>{child.display_name} — Grade {child.grade === 0 ? 'K' : child.grade}</div>
                          <div style={{ fontSize:'11px', color:PARENT_COLORS.textMuted, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{link}</div>
                        </div>
                        <div style={{ display:'flex', gap:'6px', flexShrink:0 }}>
                          <button onClick={() => { navigator.clipboard.writeText(link); showToast('🔗', `${child.display_name}'s link copied!`) }}
                            style={{ display:'flex', alignItems:'center', gap:'5px', padding:'6px 12px', borderRadius:'50px', border:'none', background:PARENT_COLORS.primary, color:'white', fontWeight:800, fontSize:'11px', cursor:'pointer' }}>
                            <Copy size={11} /> Copy
                          </button>
                          <button onClick={() => window.open(link, '_blank')}
                            style={{ display:'flex', alignItems:'center', gap:'5px', padding:'6px 12px', borderRadius:'50px', border:`1px solid ${PARENT_COLORS.border}`, background:PARENT_COLORS.card, color:PARENT_COLORS.textSecondary, fontWeight:800, fontSize:'11px', cursor:'pointer' }}>
                            <ExternalLink size={11} /> Open
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Plan card */}
              <div style={{ background:PARENT_COLORS.primary, borderRadius:'12px', padding:'20px', color:'white' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'12px' }}>
                  <div>
                    <div style={{ display:'flex', alignItems:'center', gap:'7px', fontFamily:PARENT_FONTS.heading, fontWeight:800, fontSize:'16px', marginBottom:'4px' }}>
                      <Rocket size={16} /> EduPlay Family Plan
                    </div>
                    <div style={{ fontSize:'13px', opacity:.85 }}>Trial — {family?.trial_days_left ?? daysLeft} days remaining</div>
                  </div>
                  <div style={{ background:'rgba(255,255,255,0.2)', borderRadius:'8px', padding:'6px 12px', fontSize:'12px', fontWeight:800 }}>TRIAL</div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'12px', opacity:.9 }}>
                  <Check size={13} /> Unlimited lessons &nbsp;·&nbsp; <Check size={13} /> All subjects &nbsp;·&nbsp; <Check size={13} /> 3 children &nbsp;·&nbsp; <Check size={13} /> Worksheets
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="mobile-nav" style={{ display:'none', position:'fixed', bottom:0, left:0, right:0, background:PARENT_COLORS.card, borderTop:`1px solid ${PARENT_COLORS.border}`, padding:'8px 0 max(8px,env(safe-area-inset-bottom))', zIndex:200, boxShadow:'0 -4px 12px rgba(0,0,0,0.06)' }}>
        {TABS.map(tab => {
          const Icon = tab.icon
          const active = screen === tab.key
          return (
            <button key={tab.key} onClick={() => setScreen(tab.key)}
              style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'3px', background:'none', border:'none', cursor:'pointer', padding:'6px 4px' }}>
              <Icon size={18} color={active?PARENT_COLORS.primary:PARENT_COLORS.textMuted} />
              <span style={{ fontSize:'9px', fontWeight:700, color:active?PARENT_COLORS.primary:PARENT_COLORS.textMuted }}>
                {tab.label}
              </span>
              {active && <div style={{ width:'4px', height:'4px', borderRadius:'50%', background:PARENT_COLORS.primary }}/>}
            </button>
          )
        })}
      </nav>
    </div>
  )
}