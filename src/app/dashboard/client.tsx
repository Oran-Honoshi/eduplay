'use client'
import { useState, useEffect, useRef } from 'react'
import {
  Home, BarChart2, Printer, Sparkles, ClipboardList, Notebook, Map, Users, Settings,
  Rocket, Check, Flame, RefreshCw, Zap, CheckCircle2, Download, ChevronRight,
  Target, Play, UserPlus, Trash2, Key, GraduationCap, Link2, Copy, ExternalLink, Info,
  BookOpen, FileText,
} from 'lucide-react'
import ParentHeaderBar from '@/components/ParentHeaderBar'
import { PARENT_COLORS, PARENT_FONTS, CHILD_AVATAR_COLORS } from '@/lib/parentTheme'
import { ParentModal, ParentModalFooter } from '@/components/ParentModal'
import HomeScreen from '@/components/parent/HomeScreen'
import { apiErrorText, isSessionExpiredStatus } from '@/lib/apiError'

// Shared error-toast helper for requireParentOnlySession()-gated calls, used
// by every screen in this file (each only has its own local `showToast`
// closure, not shared state) — a 401/403 gets the friendly session-expired
// copy + a real Log in link, anything else falls back to the raw API error text.
function showApiErrorToast(
  showToast: (icon: string, text: string, link?: string) => void,
  status: number,
  rawError: string | undefined,
  fallback: string
) {
  showToast(
    isSessionExpiredStatus(status) ? '🔒' : '❌',
    apiErrorText(status, rawError, fallback),
    isSessionExpiredStatus(status) ? '/login' : undefined
  )
}

function ParentsScreen({ familyId, showToast }: any) {
  const [parents, setParents]   = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [showAdd, setShowAdd]   = useState(false)
  const [newName, setNewName]   = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPass, setNewPass]   = useState('')
  const [newEmoji, setNewEmoji] = useState('👤')
  const [saving, setSaving]     = useState(false)
  const [removeTarget, setRemoveTarget] = useState<{ id: string; name: string } | null>(null)
  const [removing, setRemoving] = useState(false)

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
        showToast('👨‍👩‍👧', `${newName} נוסף/ה כהורה`)
        setNewName(''); setNewEmail(''); setNewPass(''); setNewEmoji('👤')
        setShowAdd(false)
        loadParents()
      } else {
        showApiErrorToast(showToast, res.status, data.error, 'לא הצלחנו להוסיף הורה')
      }
    } catch {}
    setSaving(false)
  }

  async function confirmRemoveParent() {
    if (!removeTarget) return
    setRemoving(true)
    await fetch(`/api/parents?parentId=${removeTarget.id}`, { method:'DELETE' })
    setRemoving(false)
    showToast('🗑️', `${removeTarget.name} הוסר/ה`)
    setRemoveTarget(null)
    loadParents()
  }

  async function updatePassword(parentId: string, newPassword: string, name: string) {
    if (!newPassword || newPassword.length < 4) return
    await fetch('/api/parents', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parentId, password:newPassword }),
    })
    showToast('🔑', `הסיסמה של ${name} עודכנה`)
  }

  if (loading) return <div style={{ padding:'40px', textAlign:'center', color:PARENT_COLORS.textMuted }}>טוען…</div>

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'18px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <h1 style={{ display:'flex', alignItems:'center', gap:'8px', fontFamily:PARENT_FONTS.heading, fontWeight:800, fontSize:'20px', color:PARENT_COLORS.text, margin:0 }}>
          <Users size={18} color={PARENT_COLORS.primary} /> ההורים במשפחה
        </h1>
        {parents.length < 3 && (
          <button onClick={() => setShowAdd(!showAdd)}
            style={{ display:'flex', alignItems:'center', gap:'6px', padding:'8px 18px', borderRadius:'50px', border:'none', background:PARENT_COLORS.primary, color:'white', fontWeight:800, fontSize:'13px', cursor:'pointer' }}>
            <UserPlus size={14} /> הוספת הורה
          </button>
        )}
      </div>
      <p style={{ fontSize:'13px', color:PARENT_COLORS.textSecondary, margin:0 }}>
        עד 3 הורים או אפוטרופוסים יכולים לנהל יחד את חשבון המשפחה, לכל אחד סיסמה משלו.
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
                    <span style={{ fontSize:'10px', fontWeight:800, padding:'2px 9px', borderRadius:'50px', background:PARENT_COLORS.primary, color:'white' }}>מנהל/ת</span>
                  ) : (
                    <span style={{ fontSize:'10px', fontWeight:800, padding:'1px 8px', borderRadius:'50px', border:`1.5px solid ${PARENT_COLORS.primary}`, color:PARENT_COLORS.primary }}>הורה</span>
                  )}
                </div>
                <div style={{ fontSize:'12px', color:PARENT_COLORS.textMuted }}>{parent.email || 'אין אימייל'}</div>
              </div>
              {i > 0 && (
                <button onClick={() => setRemoveTarget({ id: parent.id, name: parent.name })}
                  style={{ display:'flex', alignItems:'center', gap:'5px', padding:'6px 12px', borderRadius:'50px', border:`1px solid ${PARENT_COLORS.dangerBorder}`, background:PARENT_COLORS.dangerLight, color:PARENT_COLORS.danger, fontWeight:700, fontSize:'12px', cursor:'pointer' }}>
                  <Trash2 size={12} /> הסרה
                </button>
              )}
            </div>
            <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
              <input type="password" placeholder="סיסמה חדשה" id={`pwd-${parent.id}`}
                style={{ flex:1, padding:'8px 12px', borderRadius:'8px', border:`1px solid ${PARENT_COLORS.border}`, fontSize:'13px', outline:'none' }}/>
              <button onClick={() => {
                const input = document.getElementById(`pwd-${parent.id}`) as HTMLInputElement
                updatePassword(parent.id, input.value, parent.name)
                input.value = ''
              }} style={{ display:'flex', alignItems:'center', gap:'5px', padding:'8px 14px', borderRadius:'8px', border:'none', background:PARENT_COLORS.primary, color:'white', fontWeight:700, fontSize:'12px', cursor:'pointer' }}>
                <Key size={12} /> עדכון סיסמה
              </button>
            </div>
          </div>
        ))}
      </div>
      {showAdd && (
        <div style={{ background:PARENT_COLORS.card, border:`2px solid ${PARENT_COLORS.primary}`, borderRadius:'14px', padding:'20px' }}>
          <h3 style={{ fontFamily:PARENT_FONTS.heading, fontWeight:800, fontSize:'16px', color:PARENT_COLORS.text, margin:'0 0 16px' }}>הוספת הורה או אפוטרופוס</h3>
          <div style={{ marginBottom:'14px' }}>
            <div style={{ fontSize:'12px', fontWeight:700, color:PARENT_COLORS.textSecondary, marginBottom:'8px' }}>תמונה</div>
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
            <input placeholder="שם מלא *" value={newName} onChange={e => setNewName(e.target.value)}
              style={{ padding:'10px 14px', borderRadius:'10px', border:`1px solid ${PARENT_COLORS.border}`, fontSize:'14px', outline:'none' }}/>
            <input placeholder="אימייל (לא חובה)" value={newEmail} onChange={e => setNewEmail(e.target.value)}
              style={{ padding:'10px 14px', borderRadius:'10px', border:`1px solid ${PARENT_COLORS.border}`, fontSize:'14px', outline:'none' }}/>
            <input type="password" placeholder="סיסמה *" value={newPass} onChange={e => setNewPass(e.target.value)}
              style={{ padding:'10px 14px', borderRadius:'10px', border:`1px solid ${PARENT_COLORS.border}`, fontSize:'14px', outline:'none' }}/>
          </div>
          <div style={{ display:'flex', gap:'10px' }}>
            <button onClick={() => setShowAdd(false)}
              style={{ flex:1, padding:'10px', borderRadius:'10px', border:`1px solid ${PARENT_COLORS.border}`, background:PARENT_COLORS.card, color:PARENT_COLORS.textSecondary, fontWeight:700, fontSize:'13px', cursor:'pointer' }}>
              Cancel
            </button>
            <button onClick={addParent} disabled={saving || !newName || !newPass}
              style={{ flex:2, display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', padding:'10px', borderRadius:'10px', border:'none', background:PARENT_COLORS.primary, color:'white', fontWeight:800, fontSize:'13px', cursor:'pointer', opacity:saving||!newName||!newPass?0.6:1 }}>
              <UserPlus size={14} /> {saving ? 'מוסיפים…' : 'הוספת הורה'}
            </button>
          </div>
        </div>
      )}
      {removeTarget && (
        <ParentModal
          variant="danger"
          eyebrowText="הסרת הורה"
          title={`להסיר את ${removeTarget.name} מהמשפחה?`}
          description="לא תהיה לו/ה עוד גישה לחשבון המשפחה. אי אפשר לבטל."
          onCancel={() => setRemoveTarget(null)}
        >
          <ParentModalFooter
            variant="danger"
            confirmLabel="להסיר"
            confirmingLabel="מסירים…"
            confirming={removing}
            onConfirm={confirmRemoveParent}
            onCancel={() => setRemoveTarget(null)}
          />
        </ParentModal>
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
        showToast('❌', 'אין מה לשלוח שוב')
        return
      }
      const res  = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId: targetChildId, questionIds, title: detail.assignment?.title || undefined }),
      })
      const data = await res.json()
      if (res.ok) {
        showToast('🔁', `נשלחה משימה חדשה ל${targetName}`)
        setPickerFor(null)
        setPickerChildId('')
        loadAssignments()
      } else {
        showApiErrorToast(showToast, res.status, data.error, 'לא הצלחנו לשלוח שוב')
      }
    } catch {
      showToast('❌', 'לא הצלחנו לשלוח שוב')
    }
    setBusyId(null)
  }

  if (loading) return <div style={{ padding:'40px', textAlign:'center', color:PARENT_COLORS.textMuted }}>טוען…</div>

  const STATUS_META: any = {
    correctFirstTry:  '✅',
    correctAfterHint: '💡',
    revealedAnswer:   '👀',
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'18px' }}>
      <h1 style={{ display:'flex', alignItems:'center', gap:'8px', fontFamily:PARENT_FONTS.heading, fontWeight:800, fontSize:'20px', color:PARENT_COLORS.text, margin:0 }}>
        <ClipboardList size={18} color={PARENT_COLORS.primary} /> היסטוריית משימות
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
              <div style={{ textAlign:'center', padding:'20px', color:PARENT_COLORS.textMuted, fontSize:'13px' }}>עוד אין משימות.</div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                {list.map((a: any) => {
                  const pct   = a.totalItems > 0 ? Math.round((a.completedItems / a.totalItems) * 100) : 0
                  const isBusy = busyId === a.id
                  return (
                    <div key={a.id} style={{ background:PARENT_COLORS.pageBg, border:`1px solid ${PARENT_COLORS.border}`, borderRadius:'10px', padding:'14px' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'10px', marginBottom:'8px', flexWrap:'wrap' }}>
                        <div>
                          <div style={{ fontWeight:800, fontSize:'13px', color:PARENT_COLORS.text }}>{a.title || 'משימה ללא שם'}</div>
                          <div style={{ fontSize:'11px', color:PARENT_COLORS.textMuted }}>{new Date(a.created_at).toLocaleDateString('he-IL')} · {a.completedItems} מתוך {a.totalItems} ({pct}%)</div>
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
                          <RefreshCw size={11} /> שוב ל<bdi>{child.display_name}</bdi>
                        </button>

                        {pickerFor === a.id ? (
                          <>
                            <select value={pickerChildId} onChange={e => setPickerChildId(e.target.value)}
                              style={{ padding:'6px 8px', borderRadius:'8px', border:`1px solid ${PARENT_COLORS.border}`, fontSize:'11px' }}>
                              <option value="">לבחור ילד/ה…</option>
                              {(children || []).filter((c: any) => c.id !== child.id).map((c: any) => (
                                <option key={c.id} value={c.id}>{c.display_name}</option>
                              ))}
                            </select>
                            <button disabled={!pickerChildId || isBusy}
                              onClick={() => reassign(a.id, pickerChildId, (children || []).find((c: any) => c.id === pickerChildId)?.display_name)}
                              style={{ display:'flex', alignItems:'center', gap:'5px', padding:'6px 12px', borderRadius:'50px', border:'none', background:PARENT_COLORS.primary, color:'white', fontWeight:700, fontSize:'11px', cursor:'pointer', opacity:(!pickerChildId||isBusy)?0.6:1 }}>
                              <Check size={11} /> אישור
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
                              <UserPlus size={11} /> לשלוח לילד/ה אחר/ת
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
// ── Create / Library hubs ─────────────────────────────────────
// One place to make things and one place to find them, replacing the five
// teaser tabs (Worksheets, AI Questions, Reading, Notebook, Curriculum).
type HubItem = { icon: any, title: string, desc: string, href: string, tone?: 'primary' | 'accent' | 'amber' }

function HubGrid({ items }: { items: HubItem[] }) {
  const tones: any = {
    primary: [PARENT_COLORS.primaryLight, PARENT_COLORS.primary],
    accent:  [PARENT_COLORS.accentLight,  PARENT_COLORS.accent],
    amber:   [PARENT_COLORS.amberLight,   PARENT_COLORS.amberText],
  }
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:'12px' }}>
      {items.map(it => {
        const [bg, fg] = tones[it.tone || 'primary']
        const Icon = it.icon
        return (
          <a key={it.title} href={it.href} style={{ textDecoration:'none', background:PARENT_COLORS.card, border:`1px solid ${PARENT_COLORS.border}`, borderRadius:'14px', padding:'18px', display:'flex', flexDirection:'column', gap:'10px' }}>
            <div style={{ width:'40px', height:'40px', borderRadius:'12px', background:bg, display:'flex', alignItems:'center', justifyContent:'center' }}><Icon size={20} color={fg}/></div>
            <div style={{ fontFamily:PARENT_FONTS.heading, fontWeight:800, fontSize:'15px', color:PARENT_COLORS.text }}>{it.title}</div>
            <div style={{ fontSize:'13px', color:PARENT_COLORS.textSecondary, lineHeight:1.5 }}>{it.desc}</div>
            <div style={{ marginTop:'auto', display:'flex', alignItems:'center', gap:'4px', fontSize:'13px', fontWeight:700, color:PARENT_COLORS.primary }}>לפתיחה <ChevronRight size={14}/></div>
          </a>
        )
      })}
    </div>
  )
}

function SectionTitle({ icon: Icon, title, subtitle }: { icon: any, title: string, subtitle: string }) {
  return (
    <div>
      <h1 style={{ display:'flex', alignItems:'center', gap:'8px', fontFamily:PARENT_FONTS.heading, fontWeight:800, fontSize:'22px', color:PARENT_COLORS.text, margin:0 }}>
        <Icon size={20} color={PARENT_COLORS.primary}/> {title}
      </h1>
      <p style={{ margin:'6px 0 0', fontSize:'14px', color:PARENT_COLORS.textSecondary }}>{subtitle}</p>
    </div>
  )
}

function CreateHub({ children }: any) {
  const [prompt, setPrompt] = useState('')
  const [err, setErr] = useState(false)
  function go() {
    if (!prompt.trim()) { setErr(true); return }
    window.location.href = `/create?prompt=${encodeURIComponent(prompt.trim())}`
  }
  const names = (children || []).map((c: any) => c.display_name).filter(Boolean)
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
      <SectionTitle icon={Sparkles} title="יצירה" subtitle="תרגול לילד/ה — להדפסה, לאפליקציה, או לשניהם." />
      <div style={{ background:`linear-gradient(135deg, ${PARENT_COLORS.headerGradTeal}, ${PARENT_COLORS.headerGradLavender})`, borderRadius:'16px', padding:'20px' }}>
        <label htmlFor="create-prompt" style={{ display:'block', fontFamily:PARENT_FONTS.heading, fontWeight:800, fontSize:'16px', color:PARENT_COLORS.text, marginBottom:'8px' }}>מה תרצו להכין?</label>
        <textarea id="create-prompt" value={prompt} onChange={e => { setPrompt(e.target.value); setErr(false) }} rows={3}
          placeholder={`לדוגמה: תרגול אוצר מילים באנגלית ל${names[0] || 'בת שלי'} מרשימת המילים, 15 שאלות`}
          style={{ width:'100%', boxSizing:'border-box', borderRadius:'12px', border:`1.5px solid ${err ? PARENT_COLORS.danger : PARENT_COLORS.border}`, padding:'12px 14px', fontSize:'14px', fontFamily:PARENT_FONTS.body, resize:'vertical', background:'#fff' }}/>
        {err && <div style={{ color:PARENT_COLORS.danger, fontSize:'13px', marginTop:'6px' }}>כתבו קודם מה צריך.</div>}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'10px', flexWrap:'wrap', marginTop:'10px' }}>
          <span style={{ fontSize:'12px', color:PARENT_COLORS.textSecondary }}>בשלב הבא בוחרים תרגול, מבחן או דפי הסבר, ואפשר לצרף תמונות, PDF או מסמכים.</span>
          <button onClick={go} style={{ display:'flex', alignItems:'center', gap:'6px', padding:'10px 22px', borderRadius:'50px', border:'none', background:PARENT_COLORS.primary, color:'#fff', fontWeight:800, fontSize:'14px', cursor:'pointer' }}>
            המשך <ChevronRight size={15}/>
          </button>
        </div>
      </div>
      <HubGrid items={[
        { icon:Sparkles, title:'תרגול', desc:'נושא אחד או שניים, מהקל לקשה, עם רמזים ופתרונות. להדפסה, לאפליקציה, או לשניהם.', href:'/create?kind=practice', tone:'accent' },
        { icon:Printer,  title:'מבחן', desc:'כמה נושאים, רמות מעורבות, זמן מוגבל ודף תשובות — לפני מבחן.', href:'/create?kind=exam' },
        { icon:FileText, title:'דפי הסבר', desc:'דף לימוד לכל נושא: הסבר, דוגמאות פתורות, טעויות נפוצות.', href:'/create?kind=explanation', tone:'amber' },
        { icon:BookOpen, title:'מה כבר יצרתי', desc:'כל מה שיצרתם, האהובים קודם. להדפיס שוב, לשלוח, או עוד כזה.', href:'/create?view=history' },
      ]}/>
      <div style={{ fontSize:'13px', fontWeight:800, color:PARENT_COLORS.textMuted }}>קריאה</div>
      <HubGrid items={[
        { icon:BookOpen, title:'חוברות קריאה (ניקוד)', desc:'חוברות לפי רמות הניקוד, מקמץ ופתח ועד כל הניקוד.', href:'/reading', tone:'amber' },
        { icon:BookOpen, title:'ספרוני קריאה ראשונה', desc:'ספרונים מאוירים לקמץ ופתח — להדפסה, או לקריאה באפליקציה עם הילד.', href:'/stories', tone:'accent' },
        { icon:BookOpen, title:'קטעי קריאה', desc:'סיפורים קצרים עם שאלות הבנה, לפי כיתה ורמה.', href:'/passages' },
      ]}/>
    </div>
  )
}

function LibraryHub({ isAdmin }: { isAdmin?: boolean }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
      <SectionTitle icon={BookOpen} title="ספרייה" subtitle="כל מה שמוכן לשימוש: חוברות מוכנות, תוכנית הלימודים, מה שכבר יצרתם, מחברת ההסברים וקטעי קריאה." />
      <HubGrid items={[
        { icon:Printer,  title:'ספרייה מוכנה', desc:'מאות חוברות תרגול מוכנות לכל נושא. מחפשים לפי נושא או מיומנות, ומשתמשים מיד — בלי ליצור מאפס.', href:'/library', tone:'accent' },
        { icon:Map,      title:'תוכנית הלימודים', desc:'כל הנושאים לפי כיתה ומקצוע, גן–ו׳. לפתוח שיעור או להכין דף מהמאגר.', href:'/curriculum' },
        { icon:Printer,  title:'מה כבר יצרתי', desc:'כל הדפים, המבחנים ודפי ההסבר שהכנתם — להדפיס שוב, לשלוח או עוד כזה.', href:'/create?view=history', tone:'accent' },
        { icon:Notebook, title:'מחברת ההסברים', desc:'דפי ההסבר שהכנתם, מסודרים לפי מקצוע ונושא — לעבור עליהם עם הילד.', href:'/notebook', tone:'amber' },
        { icon:BookOpen, title:'קטעי קריאה', desc:'סיפורים עם שאלות הבנה, לפי רמה.', href:'/passages' },
      ]}/>
      {isAdmin && <>
        <div style={{ fontSize:'13px', fontWeight:800, color:PARENT_COLORS.textMuted }}>ניהול EduPlay</div>
        <HubGrid items={[
          { icon:ClipboardList, title:'בדיקת מאגר השיעורים', desc:'רמזים, פתרונות צעד אחר צעד ודפי לימוד חדשים לשיעורים — לאשר לפני שהם עולים.', href:'/admin/bank', tone:'amber' },
          { icon:Map, title:'אישורים לספרייה החינמית', desc:'דפים שהורים הציעו לשתף.', href:'/admin/library' },
          { icon:BookOpen, title:'ספרוני קריאה ראשונה', desc:'איורים, אישור והסתרה.', href:'/stories', tone:'accent' },
        ]}/>
      </>}
    </div>
  )
}

// Approved structure (Nov 2026): four parent sections instead of ten tabs.
const GRADE_NAME_HE: Record<number, string> = { 0: 'גן', 1: 'כיתה א׳', 2: 'כיתה ב׳', 3: 'כיתה ג׳', 4: 'כיתה ד׳', 5: 'כיתה ה׳', 6: 'כיתה ו׳', 7: 'כיתה ז׳', 8: 'כיתה ח׳', 9: 'כיתה ט׳', 10: 'כיתה י׳', 11: 'כיתה י״א', 12: 'כיתה י״ב' }

const TABS = [
  { key:'home',    label:'בית',     icon:Home },
  { key:'create',  label:'יצירה',   icon:Sparkles },
  { key:'library', label:'ספרייה',  icon:BookOpen },
  { key:'family',  label:'משפחה',   icon:Users },
]
// Old tab keys (bookmarks, ?tab= links) → the section that now holds them.
const LEGACY_TAB: Record<string, string> = {
  overview:'home', progress:'progress', assignments:'progress',
  worksheets:'create', questions:'create', passages:'library',
  notebook:'library', curriculum:'library', parents:'family', account:'family',
}

export default function DashboardClient({ data, error }: { data: any; error?: string }) {
  const { family, children, progress, recommendations, parentName, isDemo } = data
  const [screen, setScreen]         = useState('home')
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('tab')
    if (t) setScreen(TABS.some(x => x.key === t) || t === 'progress' ? t : (LEGACY_TAB[t] || 'home'))
  }, [])
  const [toast, setToast]           = useState<{ icon:string; text:string; link?: string }|null>(null)
  const [errorBanner, setErrorBanner]   = useState(error)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const daysLeft = family
    ? Math.max(0, Math.ceil((new Date(family.trial_ends_at).getTime() - Date.now()) / 86400000))
    : 7

  // link toasts (session-expired) skip auto-dismiss — a parent needs time to
  // actually click through to /login before the toast would otherwise vanish.
  function showToast(icon: string, text: string, link?: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = null
    setToast({ icon, text, link })
    if (!link) toastTimer.current = setTimeout(() => setToast(null), 3000)
  }

  function childProgress(childId: string) {
    return (progress || []).filter((p: any) => p.child_id === childId)
  }

  function childRecs(childId: string) {
    return (recommendations || []).filter((r: any) => r.child_id === childId)
  }

  const dashStyles = `
    /* Unconditional (not viewport-width-gated): the tab strip scrolls inside
       its own flex-allotted space whenever the logo + tabs + right cluster
       don't all fit — this covers browser zoom too, which shrinks available
       CSS-pixel width the same way a narrow window does but doesn't
       necessarily land below the 767px mobile cutover below. Without this,
       there was a dead zone above 767px (e.g. a normal desktop window zoomed
       to 125-175%) where the 10 non-shrinking tab buttons had nowhere to go
       but overflow past the logo on the left and push under the right
       cluster, since only the mobile breakpoint used to give this container
       overflow handling. */
    .dashboard-tabs { overflow-x: auto; -webkit-overflow-scrolling: touch; white-space: nowrap; scrollbar-width: none; justify-content: flex-start !important; }
    .dashboard-tabs::-webkit-scrollbar { display: none; }

    @media (max-width: 767px) {
      .dashboard-sidebar { display: none !important; }
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
    <div dir="rtl" lang="he" className="ep-parent" style={{ minHeight:'100vh', background:PARENT_COLORS.pageBg, fontFamily:PARENT_FONTS.body }}>
      <style>{dashStyles}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', bottom:'24px', right:'24px', zIndex:9999, background:PARENT_COLORS.text, color:'white', borderRadius:'12px', padding:'12px 20px', fontSize:'13px', fontWeight:700, boxShadow:'0 8px 32px rgba(0,0,0,0.2)', display:'flex', alignItems:'center', gap:'10px' }}>
          <span style={{ fontSize:'20px' }}>{toast.icon}</span>{toast.text}
          {toast.link && (
            <a href={toast.link} style={{ color:'white', textDecoration:'underline', fontWeight:800 }}>להתחברות</a>
          )}
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
                  aria-current={active ? 'page' : undefined}
                  style={{ display:'flex', alignItems:'center', gap:'6px', minHeight:'40px', padding:'0 16px', borderRadius:'12px', border:'none', fontFamily:PARENT_FONTS.body, fontWeight:active?800:600, fontSize:'15px', cursor:'pointer', background:active?PARENT_COLORS.primaryLight:'transparent', color:active?PARENT_COLORS.primaryHover:PARENT_COLORS.text, whiteSpace:'nowrap', flexShrink:0 }}>
                  <Icon size={14} />
                  {tab.label}
                </button>
              )
            })}
          </div>
        }
        right={
          <div className="header-right" style={{ display:'flex', alignItems:'center', gap:'10px', flexShrink:0 }}>
            {isDemo && <span style={{ background:PARENT_COLORS.primaryLight, color:PARENT_COLORS.primary, borderRadius:'50px', padding:'4px 10px', fontSize:'11px', fontWeight:800 }}>🧪 הדגמה</span>}
            <span className="days-badge" style={{ background:PARENT_COLORS.amberLight, color:PARENT_COLORS.amberText, borderRadius:'50px', padding:'6px 12px', fontSize:'13px', fontWeight:700 }}>ניסיון חינם · עוד {daysLeft} ימים</span>
            <div style={{ width:'38px', height:'38px', background:PARENT_COLORS.text, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:800, fontSize:'13px', flexShrink:0 }}>
              {(parentName || 'E').split(' ').map((n: string) => n[0]).join('').slice(0,2).toUpperCase()}
            </div>
          </div>
        }
      />

      {/* Error banner */}
      {errorBanner === 'lesson_access_denied' && (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'10px', background:'#FFF5F5', borderBottom:'1px solid #FEE2E2', color:'#DC2626', fontSize:'13px', fontWeight:700, padding:'10px 16px' }}>
          <span>⚠️ השיעור הזה לא זמין. בחרו שיעור אחר.</span>
          <button onClick={() => setErrorBanner(undefined)} style={{ border:'none', background:'transparent', color:'#DC2626', fontWeight:800, cursor:'pointer', fontSize:'14px', lineHeight:1 }}>✕</button>
        </div>
      )}

      <div style={{ display:'flex', minHeight:'calc(100vh - 64px)' }}>

        {/* Sidebar */}
        <aside className="dashboard-sidebar" style={{ display:'none', width:'216px', background:PARENT_COLORS.card, borderRight:`1px solid ${PARENT_COLORS.border}`, padding:'14px 0', flexShrink:0, flexDirection:'column' }}>
          <div style={{ padding:'0 16px', marginBottom:'8px', fontSize:'10px', fontWeight:800, letterSpacing:'1.5px', textTransform:'uppercase', color:PARENT_COLORS.textMuted }}>המשפחה</div>
          {(children || []).map((child: any, i: number) => {
            const avatarColor = CHILD_AVATAR_COLORS[i % CHILD_AVATAR_COLORS.length]
            return (
              <div key={child.id} style={{ display:'flex', alignItems:'center', gap:'9px', padding:'8px 10px', margin:'0 6px 4px', borderRadius:'8px', cursor:'pointer' }}>
                <div style={{ width:'30px', height:'30px', borderRadius:'50%', background:avatarColor, display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:800, fontSize:'13px', flexShrink:0 }}>
                  {child.display_name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight:700, fontSize:'13px', color:PARENT_COLORS.text }}>{child.display_name}</div>
                  <div style={{ fontSize:'11px', color:PARENT_COLORS.textMuted }}>{child.grade === 0 ? 'גן' : `כיתה ${child.grade}`} · {child.card_tokens || 0} אסימונים</div>
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
              <Rocket size={14} color={PARENT_COLORS.primary} /> שדרוג
            </h4>
            <p style={{ fontSize:'11px', color:PARENT_COLORS.textSecondary, marginBottom:'10px', lineHeight:1.5 }}>דפים ללא הגבלה ועד 5 ילדים.</p>
            <button onClick={() => showToast('🚀','השדרוג יהיה זמין בקרוב')} style={{ width:'100%', padding:'8px', borderRadius:'50px', border:'none', background:PARENT_COLORS.primary, color:'white', fontWeight:800, fontSize:'12px', cursor:'pointer' }}>20$ לחודש</button>
          </div>
        </aside>

        {/* Main */}
        <main className="dashboard-main" style={{ flex:1, padding:'28px 24px 64px', overflowY:'auto', maxHeight:'calc(100vh - 64px)' }}>
          <div style={{ maxWidth:'1200px', margin:'0 auto' }}>

          {/* ── OVERVIEW ── */}
          {screen === 'progress' && (
            <div style={{ display:'flex', flexDirection:'column', gap:'18px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'10px' }}>
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                    <h1 style={{ fontFamily:PARENT_FONTS.heading, fontWeight:800, fontSize:'22px', color:PARENT_COLORS.text, margin:0 }}>התקדמות</h1>
                    <button onClick={() => window.location.reload()}
                      style={{ display:'flex', alignItems:'center', gap:'6px', padding:'6px 14px', borderRadius:'50px', border:`1px solid ${PARENT_COLORS.border}`, background:PARENT_COLORS.card, fontWeight:700, fontSize:'12px', cursor:'pointer', color:PARENT_COLORS.textSecondary }}>
                      <RefreshCw size={13} /> רענון
                    </button>
                  </div>
                  <p style={{ color:PARENT_COLORS.textSecondary, margin:'3px 0 0', fontSize:'13px' }}>התקדמות מפורטת של כל ילד</p>
                </div>
                <button onClick={() => window.location.href='/create'} style={{ display:'flex', alignItems:'center', gap:'7px', padding:'8px 16px', borderRadius:'50px', border:'none', background:PARENT_COLORS.primary, color:'white', fontWeight:800, fontSize:'13px', cursor:'pointer' }}>
                  <Printer size={14} /> דף חדש
                </button>
              </div>

              <div className="stat-grid" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'12px' }}>
                {[
                  { label:'נקודות XP',       value:(children||[]).reduce((s: number,c: any) => s+(c.xp_total||0),0).toLocaleString(), color:PARENT_COLORS.primary, bg:PARENT_COLORS.primaryLight, icon:Zap },
                  { label:'רצפים פעילים', value:`${(children||[]).filter((c: any) => c.streak_current>0).length}`, color:PARENT_COLORS.coralText, bg:PARENT_COLORS.coralLight, icon:Flame },
                  { label:'שיעורים שהושלמו',   value:(progress||[]).filter((p: any) => p.status==='completed').length, color:PARENT_COLORS.accent, bg:PARENT_COLORS.accentLight, icon:CheckCircle2 },
                  { label:'הורדות',      value:`${family?.trial_dl_used||0} / ∞`, color:PARENT_COLORS.amberText, bg:PARENT_COLORS.amberLight, icon:Download },
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
                    <div key={child.id} onClick={() => document.getElementById('progress-section')?.scrollIntoView({ behavior:'smooth' })} style={{ background:PARENT_COLORS.card, border:`1px solid ${PARENT_COLORS.border}`, borderRadius:'20px', padding:'18px', cursor:'pointer' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'14px' }}>
                        <div style={{ width:'48px', height:'48px', borderRadius:'50%', background:avatarColor, display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:800, fontSize:'19px', position:'relative' }}>
                          {child.display_name?.[0]?.toUpperCase()}
                          {child.streak_current>0 && <div style={{ position:'absolute', bottom:'-2px', right:'-2px', background:PARENT_COLORS.coral, color:'white', fontSize:'9px', fontWeight:800, width:'18px', height:'18px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', border:'2px solid white' }}>{child.streak_current}</div>}
                        </div>
                        <div>
                          <div style={{ fontFamily:PARENT_FONTS.heading, fontWeight:800, fontSize:'15px', color:PARENT_COLORS.text }}>{child.display_name}</div>
                          <div style={{ fontSize:'11px', color:PARENT_COLORS.textMuted }}>{child.grade === 0 ? 'גן' : `כיתה ${child.grade}`} · {(child.xp_total||0)} XP</div>
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
                        <span>{highPri?<><strong>להתמקד: </strong>{highPri.topic?.title_he || highPri.topic?.title_en}</>:'מצוין!'}</span>
                      </div>
                      <button onClick={e => { e.stopPropagation(); window.location.href=`/lesson?childId=${child.id}` }}
                        style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', padding:'9px', borderRadius:'50px', border:`1.5px solid ${PARENT_COLORS.primary}`, background:'transparent', color:PARENT_COLORS.primary, fontWeight:800, fontSize:'12px', cursor:'pointer' }}>
                        להמשך השיעור <ChevronRight size={13} className="rotate-180" />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── PROGRESS ── */}
          {screen === 'progress' && (
            <div id="progress-section" style={{ display:'flex', flexDirection:'column', gap:'18px', marginTop:'28px' }}>
              <h1 style={{ display:'flex', alignItems:'center', gap:'8px', fontFamily:PARENT_FONTS.heading, fontWeight:800, fontSize:'20px', color:PARENT_COLORS.text, margin:0 }}>
                <BarChart2 size={18} color={PARENT_COLORS.primary} /> דוחות התקדמות
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
                          {GRADE_NAME_HE[child.grade] ?? ''} · {(child.xp_total||0).toLocaleString()} נקודות · {child.streak_current || 0} ימים ברצף <Flame size={12} color={PARENT_COLORS.coralText} />
                        </div>
                      </div>
                      <button onClick={() => window.location.href=`/lesson?childId=${child.id}`} style={{ display:'flex', alignItems:'center', gap:'6px', padding:'9px 18px', borderRadius:'50px', border:'none', background:PARENT_COLORS.primary, color:'white', fontWeight:800, fontSize:'13px', cursor:'pointer' }}>
                        <Play size={13} /> לשיעור
                      </button>
                    </div>
                    {recs.length > 0 && (
                      <div style={{ background:PARENT_COLORS.coralLight, border:`1px solid ${PARENT_COLORS.coral}30`, borderRadius:'12px', padding:'14px', marginBottom:'14px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'6px', fontFamily:PARENT_FONTS.heading, fontWeight:800, fontSize:'14px', color:PARENT_COLORS.coralText, marginBottom:'10px' }}>
                          <Target size={14} /> כדאי להתמקד
                        </div>
                        {recs.slice(0,2).map((rec: any) => (
                          <div key={rec.id} style={{ background:PARENT_COLORS.card, border:`1px solid ${PARENT_COLORS.coral}20`, borderRadius:'10px', padding:'12px', marginBottom:'8px', display:'flex', gap:'12px' }}>
                            <div style={{ flex:1 }}>
                              <div style={{ fontWeight:800, fontSize:'13px', color:PARENT_COLORS.text, marginBottom:'2px' }}>{rec.topic?.title_he || rec.topic?.title_en}</div>
                              <div style={{ fontSize:'11px', color:PARENT_COLORS.textSecondary, lineHeight:1.6 }}>{rec.reason_he || rec.reason_en}</div>
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
                              {['נושא','מצב','התקדמות'].map(h => (
                                <th key={h} style={{ textAlign:'left', padding:'8px 10px', fontSize:'11px', fontWeight:800, color:PARENT_COLORS.textMuted, textTransform:'uppercase' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {cp.map((p: any) => {
                              const pct = Math.round((p.steps_completed/(p.steps_total||5))*100)
                              const statusColors: any = { completed:PARENT_COLORS.primary, in_progress:PARENT_COLORS.accent, needs_review:PARENT_COLORS.coralText, not_started:PARENT_COLORS.textMuted }
                              const statusBg: any     = { completed:PARENT_COLORS.primaryLight, in_progress:PARENT_COLORS.accentLight, needs_review:PARENT_COLORS.coralLight, not_started:PARENT_COLORS.borderLight }
                              const statusLabels: any = { completed:'Done', in_progress:'בתהליך', needs_review:'צריך חיזוק', not_started:'לא התחיל' }
                              return (
                                <tr key={p.id} style={{ borderBottom:`1px solid ${PARENT_COLORS.border}` }}>
                                  <td style={{ padding:'10px', fontWeight:700, color:PARENT_COLORS.text }}>{p.topic?.title_he || p.topic?.title_en}</td>
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
                      <div style={{ textAlign:'center', padding:'24px', color:PARENT_COLORS.textMuted, fontSize:'13px' }}>{child.display_name} עוד לא התחיל/ה שיעורים. אפשר לפתוח שיעור ראשון מכאן.</div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* ── ASSIGNMENTS (part of Home) ── */}
          {screen === 'progress' && (
            <div style={{ marginTop:'28px' }}><AssignmentsScreen children={children} showToast={showToast} /></div>
          )}

          {/* ── HOME (redesign) ── */}
          {screen === 'home' && (
            <HomeScreen children={children} progress={progress} parentName={parentName} onProgress={() => setScreen('progress')} />
          )}

          {/* ── CREATE ── */}
          {screen === 'create' && <CreateHub children={children} />}

          {/* ── LIBRARY ── */}
          {screen === 'library' && <LibraryHub isAdmin={!!family?.is_admin} />}

          {/* ── PARENTS ── */}
          {screen === 'family' && (
            <ParentsScreen familyId={family?.id} showToast={showToast} />
          )}

          {/* ── ACCOUNT ── */}
          {screen === 'family' && (
            <div style={{ display:'flex', flexDirection:'column', gap:'18px', marginTop:'28px' }}>
              <h1 style={{ display:'flex', alignItems:'center', gap:'8px', fontFamily:PARENT_FONTS.heading, fontWeight:800, fontSize:'20px', color:PARENT_COLORS.text, margin:0 }}>
                <Settings size={18} color={PARENT_COLORS.primary} /> החשבון
              </h1>

              {/* Manage Children */}
              <div style={{ background:PARENT_COLORS.card, border:`1px solid ${PARENT_COLORS.border}`, borderRadius:'12px', padding:'20px' }}>
                <h3 style={{ display:'flex', alignItems:'center', gap:'7px', fontFamily:PARENT_FONTS.heading, fontWeight:800, fontSize:'16px', color:PARENT_COLORS.text, marginBottom:'4px' }}>
                  <GraduationCap size={16} color={PARENT_COLORS.primary} /> הילדים
                </h3>
                <p style={{ fontSize:'13px', color:PARENT_COLORS.textSecondary, marginBottom:'16px' }}>כיתה, גודל טקסט, הפסקות וקוד כניסה לכל ילד/ה.</p>

                {/* Column headers */}
                <div className="manage-headers" style={{ display:'grid', gridTemplateColumns:'1fr 110px 110px 110px 120px 80px', gap:'8px', padding:'0 14px', marginBottom:'6px' }}>
                  {[
                    { label:'ילד/ה', tip:'' },
                    { label:'כיתה', tip:'שנת לימודים' },
                    { label:'גודל טקסט', tip:'גודל הכתב במסך' },
                    { label:'הפסקות', tip:'מתי להציע הפסקה' },
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
                            <div style={{ fontSize:'11px', color:PARENT_COLORS.textMuted }}>{child.grade === 0 ? 'גן' : `כיתה ${child.grade}`} · {child.card_tokens || 0} אסימונים</div>
                          </div>
                        </div>

                        {/* Grade */}
                        <select defaultValue={child.grade}
                          onChange={async (e) => {
                            const newGrade = parseInt(e.target.value)
                            const res = await fetch('/api/children', { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ childId:child.id, grade:newGrade }) })
                            if (!res.ok) {
                              const data = await res.json().catch(() => ({}))
                              showApiErrorToast(showToast, res.status, data.error, 'לא הצלחנו לעדכן כיתה')
                              return
                            }
                            showToast('🎓', `${child.display_name} עבר/ה ל${GRADE_NAME_HE[newGrade] ?? 'כיתה ' + newGrade}`)
                            setTimeout(() => window.location.reload(), 1000)
                          }}
                          style={{ padding:'6px 8px', borderRadius:'8px', border:`1px solid ${PARENT_COLORS.border}`, background:PARENT_COLORS.card, fontWeight:700, fontSize:'12px', color:PARENT_COLORS.text, cursor:'pointer', width:'100%' }}>
                          <option value={0}>גן</option>
                          <option value={1}>כיתה א׳</option>
                          <option value={2}>כיתה ב׳</option>
                          <option value={3}>כיתה ג׳</option>
                          <option value={4}>כיתה ד׳</option>
                          <option value={5}>כיתה ה׳</option>
                          <option value={6}>כיתה ו׳</option>
                          <option value={7}>כיתה ז׳</option>
                          <option value={8}>כיתה ח׳</option>
                          <option value={9}>כיתה ט׳</option>
                          <option value={10}>כיתה י׳</option>
                          <option value={11}>כיתה י״א</option>
                          <option value={12}>כיתה י״ב</option>
                        </select>

                        {/* Theme */}
                        <select defaultValue={child.theme || 'plain'}
                          onChange={async (e) => {
                            const res = await fetch('/api/children', { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ childId:child.id, theme:e.target.value }) })
                            if (!res.ok) {
                              const data = await res.json().catch(() => ({}))
                              showApiErrorToast(showToast, res.status, data.error, 'לא הצלחנו לעדכן עיצוב')
                              return
                            }
                            showToast('🎨', `ערכת הנושא של ${child.display_name} עודכנה`)
                          }}
                          style={{ padding:'6px 8px', borderRadius:'8px', border:`1px solid ${PARENT_COLORS.border}`, background:PARENT_COLORS.card, fontWeight:700, fontSize:'12px', color:PARENT_COLORS.text, cursor:'pointer', width:'100%' }}>
                          <option value="plain">רגיל</option>
                          <option value="minecraft">מיינקראפט</option>
                          <option value="princesses">נסיכות</option>
                        </select>

                        {/* Font size */}
                        <select defaultValue={child.font_size || 'medium'}
                          onChange={async (e) => {
                            const res = await fetch('/api/children', { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ childId:child.id, font_size:e.target.value }) })
                            if (!res.ok) {
                              const data = await res.json().catch(() => ({}))
                              showApiErrorToast(showToast, res.status, data.error, 'לא הצלחנו לעדכן גודל טקסט')
                              return
                            }
                            showToast('🔤', `גודל הכתב של ${child.display_name} עודכן`)
                          }}
                          style={{ padding:'6px 8px', borderRadius:'8px', border:`1px solid ${PARENT_COLORS.border}`, background:PARENT_COLORS.card, fontWeight:700, fontSize:'12px', color:PARENT_COLORS.text, cursor:'pointer', width:'100%' }}>
                          <option value="small">קטן</option>
                          <option value="medium">בינוני</option>
                          <option value="large">גדול</option>
                          <option value="xl">A++ XL</option>
                        </select>

                        {/* Break */}
                        <select defaultValue={child.relief_trigger || 'topic'}
                          onChange={async (e) => {
                            const res = await fetch('/api/children', { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ childId:child.id, relief_trigger:e.target.value }) })
                            if (!res.ok) {
                              const data = await res.json().catch(() => ({}))
                              showApiErrorToast(showToast, res.status, data.error, 'לא הצלחנו לעדכן הפסקות')
                              return
                            }
                            showToast('🎉', `ההפסקה של ${child.display_name} עודכנה`)
                          }}
                          style={{ padding:'6px 8px', borderRadius:'8px', border:`1px solid ${PARENT_COLORS.border}`, background:PARENT_COLORS.card, fontWeight:700, fontSize:'12px', color:PARENT_COLORS.text, cursor:'pointer', width:'100%' }}>
                          <option value="off">בלי</option>
                          <option value="lesson">בכל שיעור</option>
                          <option value="topic">בכל נושא</option>
                          <option value="both">שניהם</option>
                        </select>

                        {/* PIN */}
                        <input type="text" maxLength={4} defaultValue={child.pin_code || ''} placeholder="קוד"
                          onBlur={async (e) => {
                            const newPin = e.target.value.trim()
                            if (newPin.length === 4 && /^\d{4}$/.test(newPin)) {
                              const res = await fetch('/api/children', { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ childId:child.id, pin_code:newPin }) })
                              if (!res.ok) {
                                const data = await res.json().catch(() => ({}))
                                showApiErrorToast(showToast, res.status, data.error, 'לא הצלחנו לעדכן קוד')
                                return
                              }
                              showToast('🔢', `הקוד של ${child.display_name} עודכן`)
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
                  <Link2 size={16} color={PARENT_COLORS.primary} /> קישורים לילדים
                </h3>
                <p style={{ fontSize:'13px', color:PARENT_COLORS.textSecondary, marginBottom:'16px' }}>כל קישור פותח לילד/ה את המרחב האישי באפליקציה.</p>
                {(() => {
                  const famLink = `${typeof window !== 'undefined' ? window.location.origin : 'https://eduplay-tau.vercel.app'}/f/${family?.id || ''}`
                  return family?.id ? (
                    <div style={{ display:'flex', alignItems:'center', gap:'12px', padding:'12px 14px', background:PARENT_COLORS.primaryLight || '#EAF0FF', borderRadius:'10px', marginBottom:'14px', flexWrap:'wrap' }}>
                      <div style={{ flex:'1 1 220px', minWidth:0 }}>
                        <div style={{ fontWeight:800, fontSize:'14px', color:PARENT_COLORS.text }}>קישור משפחתי לילדים הגדולים</div>
                        <div style={{ fontSize:'12px', color:PARENT_COLORS.textSecondary }}>הילד/ה בוחר/ת את התמונה ומקליד/ה את הקוד האישי (קוד נקבע בטבלה למעלה).</div>
                      </div>
                      <button onClick={() => { navigator.clipboard.writeText(famLink); showToast('🔗', 'הקישור המשפחתי הועתק') }}
                        style={{ display:'flex', alignItems:'center', gap:'5px', padding:'8px 14px', borderRadius:'50px', border:'none', background:PARENT_COLORS.primary, color:'white', fontWeight:800, fontSize:'12px', cursor:'pointer' }}>
                        <Copy size={12} /> העתקת הקישור
                      </button>
                    </div>
                  ) : null
                })()}
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
                          <div style={{ fontWeight:800, fontSize:'13px', color:PARENT_COLORS.text, marginBottom:'2px' }}><bdi>{child.display_name}</bdi> — {child.grade === 0 ? 'גן' : `כיתה ${child.grade}`}</div>
                          <div style={{ fontSize:'11px', color:PARENT_COLORS.textMuted, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{link}</div>
                        </div>
                        <div style={{ display:'flex', gap:'6px', flexShrink:0 }}>
                          <button onClick={() => { navigator.clipboard.writeText(link); showToast('🔗', `הקישור של ${child.display_name} הועתק`) }}
                            style={{ display:'flex', alignItems:'center', gap:'5px', padding:'6px 12px', borderRadius:'50px', border:'none', background:PARENT_COLORS.primary, color:'white', fontWeight:800, fontSize:'11px', cursor:'pointer' }}>
                            <Copy size={11} /> העתקה
                          </button>
                          <button onClick={() => window.open(link, '_blank')}
                            style={{ display:'flex', alignItems:'center', gap:'5px', padding:'6px 12px', borderRadius:'50px', border:`1px solid ${PARENT_COLORS.border}`, background:PARENT_COLORS.card, color:PARENT_COLORS.textSecondary, fontWeight:800, fontSize:'11px', cursor:'pointer' }}>
                            <ExternalLink size={11} /> פתיחה
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
                      <Rocket size={16} /> מנוי משפחתי EduPlay
                    </div>
                    <div style={{ fontSize:'13px', opacity:.85 }}>ניסיון — עוד {family?.trial_days_left ?? daysLeft} ימים</div>
                  </div>
                  <div style={{ background:'rgba(255,255,255,0.2)', borderRadius:'8px', padding:'6px 12px', fontSize:'12px', fontWeight:800 }}>ניסיון</div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'12px', opacity:.9 }}>
                  <Check size={13} /> שיעורים ללא הגבלה &nbsp;·&nbsp; <Check size={13} /> כל המקצועות &nbsp;·&nbsp; <Check size={13} /> 3 ילדים &nbsp;·&nbsp; <Check size={13} /> דפי עבודה
                </div>
              </div>
            </div>
          )}

          </div>
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
              <span style={{ fontSize:'12px', fontWeight:active?800:600, color:active?PARENT_COLORS.primaryHover:PARENT_COLORS.textMuted }}>
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