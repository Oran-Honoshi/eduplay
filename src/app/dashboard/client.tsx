'use client'
import { useState, useEffect, useCallback } from 'react'
import {
  Home, BarChart2, FileText, BookOpen, Users, Settings,
  Sun, Moon, Bell, ChevronRight, RefreshCw, Plus,
  Flame, Zap, CheckCircle, Download, Globe, Copy,
  ExternalLink, Pencil, Trash2, Eye, EyeOff, LogOut,
  X, AlertCircle, Star, Trophy, Clock, Target,
} from 'lucide-react'

// ─── Design tokens ────────────────────────────────────────────
const LIGHT = {
  bg:         '#F9FAFB',
  sidebar:    '#FFFFFF',
  card:       '#FFFFFF',
  cardBorder: '#E5E7EB',
  header:     '#FFFFFF',
  headerBdr:  '#F3F4F6',
  text:       '#111827',
  textSec:    '#6B7280',
  textMuted:  '#9CA3AF',
  inputBg:    '#F9FAFB',
  inputBdr:   '#E5E7EB',
  navActive:  '#EFF6FF',
  navActiveTx:'#4A7FD4',
  navHover:   '#F9FAFB',
  shadow:     'rgba(0,0,0,0.04)',
  shadowMd:   'rgba(0,0,0,0.08)',
}
const DARK = {
  bg:         '#0F1117',
  sidebar:    '#1A1D27',
  card:       '#1E2130',
  cardBorder: '#2A2D3E',
  header:     '#1A1D27',
  headerBdr:  '#2A2D3E',
  text:       '#F1F5F9',
  textSec:    '#94A3B8',
  textMuted:  '#64748B',
  inputBg:    '#252836',
  inputBdr:   '#374151',
  navActive:  'rgba(74,127,212,0.15)',
  navActiveTx:'#60A5FA',
  navHover:   'rgba(255,255,255,0.04)',
  shadow:     'rgba(0,0,0,0.2)',
  shadowMd:   'rgba(0,0,0,0.35)',
}

const CHILD_COLORS = [
  { gradient: 'linear-gradient(135deg,#FF9F43,#FF6B6B)', light: '#FFF0E6', dot: '#FF9F43', emoji: '🐱' },
  { gradient: 'linear-gradient(135deg,#4A7FD4,#2EC4B6)', light: '#EFF8FF', dot: '#4A7FD4', emoji: '🐻' },
  { gradient: 'linear-gradient(135deg,#8B5CF6,#C084FC)', light: '#F5F3FF', dot: '#8B5CF6', emoji: '🦊' },
]

const SUBJECT_COLORS: Record<string, string> = {
  math:    '#4A7FD4',
  english: '#2EC4B6',
  hebrew:  '#EF4444',
}

const NAV_ITEMS = [
  { key: 'overview',   icon: Home,      label: 'Overview'   },
  { key: 'progress',   icon: BarChart2,  label: 'Progress'   },
  { key: 'worksheets', icon: FileText,   label: 'Worksheets' },
  { key: 'curriculum', icon: BookOpen,   label: 'Curriculum' },
  { key: 'collection', icon: Globe,      label: 'Collection' },
  { key: 'parents',    icon: Users,      label: 'Parents'    },
  { key: 'settings',   icon: Settings,   label: 'Settings'   },
]

// ─── Reusable sub-components ──────────────────────────────────

function StatCard({ icon: Icon, label, value, color, bg, dark }: any) {
  const T = dark ? DARK : LIGHT
  return (
    <div style={{
      background: T.card, borderRadius: 16, padding: '18px 20px',
      border: `1px solid ${T.cardBorder}`,
      boxShadow: `0 2px 12px ${T.shadow}`,
      display: 'flex', flexDirection: 'column', gap: 10,
      transition: 'all 0.18s ease',
    }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
        ;(e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px ${T.shadowMd}`
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
        ;(e.currentTarget as HTMLElement).style.boxShadow = `0 2px 12px ${T.shadow}`
      }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: 12,
        background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={18} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 900, color, letterSpacing: '-0.02em', lineHeight: 1 }}>
          {value}
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </div>
      </div>
    </div>
  )
}

function SectionHeader({ title, subtitle, action, dark }: any) {
  const T = dark ? DARK : LIGHT
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 3, height: 20, borderRadius: 2, background: 'linear-gradient(180deg,#4A7FD4,#2EC4B6)' }} />
        <div>
          <div style={{ fontWeight: 900, fontSize: 17, color: T.text, letterSpacing: '-0.02em' }}>{title}</div>
          {subtitle && <div style={{ fontSize: 12, color: T.textMuted, marginTop: 1 }}>{subtitle}</div>}
        </div>
      </div>
      {action}
    </div>
  )
}

function Badge({ label, color, bg }: any) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 9px', borderRadius: 20,
      fontSize: 11, fontWeight: 700,
      background: bg, color,
      border: `1px solid ${color}30`,
    }}>
      {label}
    </span>
  )
}

// ─── Parents screen ───────────────────────────────────────────
function ParentsScreen({ familyId, showToast, dark }: any) {
  const T = dark ? DARK : LIGHT
  const [parents, setParents]   = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [showAdd, setShowAdd]   = useState(false)
  const [newName, setNewName]   = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPass, setNewPass]   = useState('')
  const [saving, setSaving]     = useState(false)

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
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ familyId, name: newName, email: newEmail, password: newPass, role: 'parent' }),
      })
      const data = await res.json()
      if (data.success) {
        showToast('success', `${newName} added as parent`)
        setNewName(''); setNewEmail(''); setNewPass(''); setShowAdd(false)
        loadParents()
      }
    } catch {}
    setSaving(false)
  }

  async function removeParent(parentId: string, name: string) {
    if (!confirm(`Remove ${name}?`)) return
    await fetch(`/api/parents?parentId=${parentId}`, { method: 'DELETE' })
    showToast('success', `${name} removed`)
    loadParents()
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: T.textMuted }}>Loading…</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionHeader
        title="Parent Profiles"
        subtitle="Up to 3 parents or guardians can share oversight of this family."
        dark={dark}
        action={
          parents.length < 3 && (
            <button onClick={() => setShowAdd(v => !v)} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 50, border: 'none',
              background: 'linear-gradient(135deg,#4A7FD4,#2EC4B6)',
              color: 'white', fontWeight: 800, fontSize: 12, cursor: 'pointer',
              fontFamily: 'inherit',
            }}>
              <Plus size={13} /> Add Parent
            </button>
          )
        }
      />

      {parents.map((parent, i) => (
        <div key={parent.id} style={{
          background: T.card, border: `1px solid ${T.cardBorder}`,
          borderRadius: 16, padding: 18,
          boxShadow: `0 2px 8px ${T.shadow}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              background: 'linear-gradient(135deg,#4A7FD4,#2EC4B6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 900, fontSize: 16,
            }}>
              {parent.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 15, color: T.text }}>{parent.name}</div>
              <div style={{ fontSize: 12, color: T.textMuted }}>
                {parent.email || 'No email'} · {parent.role === 'admin' ? 'Admin' : 'Parent'}
              </div>
            </div>
            {i > 0 && (
              <button onClick={() => removeParent(parent.id, parent.name)} style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '6px 12px', borderRadius: 8,
                border: `1px solid #FCA5A5`, background: '#FEF2F2',
                color: '#EF4444', fontWeight: 700, fontSize: 12, cursor: 'pointer',
                fontFamily: 'inherit',
              }}>
                <Trash2 size={11} /> Remove
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="password" placeholder="New password" id={`pwd-${parent.id}`}
              style={{
                flex: 1, padding: '9px 12px', borderRadius: 10,
                border: `1.5px solid ${T.inputBdr}`, background: T.inputBg,
                fontSize: 13, outline: 'none', color: T.text, fontFamily: 'inherit',
              }} />
            <button onClick={() => {
              const el = document.getElementById(`pwd-${parent.id}`) as HTMLInputElement
              if (el.value.length >= 4) {
                fetch('/api/parents', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ parentId: parent.id, password: el.value }) })
                showToast('success', `${parent.name}'s password updated`)
                el.value = ''
              }
            }} style={{
              padding: '9px 14px', borderRadius: 10, border: 'none',
              background: '#4A7FD4', color: 'white', fontWeight: 700,
              fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
            }}>
              Update
            </button>
          </div>
        </div>
      ))}

      {showAdd && (
        <div style={{
          background: T.card, border: `2px solid #4A7FD4`,
          borderRadius: 16, padding: 20,
          boxShadow: `0 4px 20px rgba(74,127,212,0.15)`,
        }}>
          <div style={{ fontWeight: 900, fontSize: 15, color: T.text, marginBottom: 14 }}>Add Parent / Guardian</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
            {[
              { ph: 'Full name *', val: newName, set: setNewName, type: 'text' },
              { ph: 'Email (optional)', val: newEmail, set: setNewEmail, type: 'email' },
              { ph: 'Password *', val: newPass, set: setNewPass, type: 'password' },
            ].map(f => (
              <input key={f.ph} type={f.type} placeholder={f.ph} value={f.val}
                onChange={e => f.set(e.target.value)}
                style={{
                  padding: '10px 14px', borderRadius: 10,
                  border: `1.5px solid ${T.inputBdr}`, background: T.inputBg,
                  fontSize: 13, outline: 'none', color: T.text, fontFamily: 'inherit',
                }} />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowAdd(false)} style={{
              flex: 1, padding: 10, borderRadius: 10,
              border: `1px solid ${T.cardBorder}`, background: T.card,
              color: T.textSec, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              Cancel
            </button>
            <button onClick={addParent} disabled={saving || !newName || !newPass} style={{
              flex: 2, padding: 10, borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg,#4A7FD4,#2EC4B6)',
              color: 'white', fontWeight: 800, fontSize: 13,
              cursor: saving || !newName || !newPass ? 'not-allowed' : 'pointer',
              opacity: saving || !newName || !newPass ? 0.6 : 1,
              fontFamily: 'inherit',
            }}>
              {saving ? 'Adding…' : '+ Add Parent'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────
export default function DashboardClient({ data }: { data: any }) {
  const { family, children, subjects, progress, recommendations, parentName, isDemo } = data
  const familyId = '11111111-1111-1111-1111-111111111111'

  const [screen, setScreen]   = useState('overview')
  const [dark, setDark]       = useState(false)
  const [sidebarOpen, setSidebar] = useState(false) // mobile
  const [toast, setToast]     = useState<{ type: string; text: string } | null>(null)
  const [approvalOpen, setApprovalOpen] = useState(false)

  const T = dark ? DARK : LIGHT

  const daysLeft = family
    ? Math.max(0, Math.ceil((new Date(family.trial_ends_at).getTime() - Date.now()) / 86400000))
    : 7

  const showToast = useCallback((type: string, text: string) => {
    setToast({ type, text })
    setTimeout(() => setToast(null), 3200)
  }, [])

  function childProgress(childId: string) {
    return (progress || []).filter((p: any) => p.child_id === childId)
  }
  function childRecs(childId: string) {
    return (recommendations || []).filter((r: any) => r.child_id === childId)
  }

  const pendingApprovals = (progress || []).filter(
    (p: any) => p.status === 'completed' && !p.parent_approved && p.approval_requested_at
  )

  const totalXP       = (children || []).reduce((s: number, c: any) => s + (c.xp_total || 0), 0)
  const activeStreaks  = (children || []).filter((c: any) => c.streak_current > 0).length
  const lessonsDone   = (progress || []).filter((p: any) => p.status === 'completed').length
  const downloads     = family?.trial_dl_used || 0

  // Greeting
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const toastColors: any = {
    success: { bg: '#F0FDF4', border: '#86EFAC', text: '#166534' },
    error:   { bg: '#FEF2F2', border: '#FCA5A5', text: '#991B1B' },
    info:    { bg: '#EFF6FF', border: '#93C5FD', text: '#1E40AF' },
  }

  return (
    <div style={{
      minHeight: '100vh', background: T.bg,
      fontFamily: '"Nunito", system-ui, sans-serif',
      color: T.text, transition: 'background 0.2s, color 0.2s',
    }}>

      {/* ── Global styles ── */}
      <style>{`
        * { box-sizing: border-box; }
        @keyframes slideInRight { from{opacity:0;transform:translateX(60px)} to{opacity:1;transform:translateX(0)} }
        @keyframes fadeIn { from{opacity:0;transform:scale(0.97)} to{opacity:1;transform:scale(1)} }
        @keyframes slideUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .nav-item { transition: all 0.15s ease !important; }
        .nav-item:hover { background: ${T.navHover} !important; }
        .card-hover { transition: all 0.18s ease !important; }
        .card-hover:hover { transform: translateY(-2px); box-shadow: 0 8px 24px ${T.shadowMd} !important; }
        .btn-primary { transition: all 0.18s ease !important; }
        .btn-primary:hover { transform: translateY(-1px); filter: brightness(1.06); }
        .btn-primary:active { transform: scale(0.98); }
        input:focus { border-color: #4A7FD4 !important; box-shadow: 0 0 0 3px rgba(74,127,212,0.15) !important; }
        select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 8px center; padding-right: 28px !important; }
        @media (max-width:768px) {
          .sidebar { display: none !important; }
          .sidebar.open { display: flex !important; position: fixed; inset: 0; z-index: 300; }
          .mobile-nav { display: flex !important; }
          .stat-grid { grid-template-columns: repeat(2,1fr) !important; }
          .child-grid { grid-template-columns: 1fr !important; }
          .main-content { padding: 16px !important; padding-bottom: 80px !important; }
        }
      `}</style>

      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          padding: '12px 18px', borderRadius: 14,
          background: toastColors[toast.type]?.bg || '#F0FDF4',
          border: `1px solid ${toastColors[toast.type]?.border || '#86EFAC'}`,
          color: toastColors[toast.type]?.text || '#166534',
          fontWeight: 700, fontSize: 13,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          animation: 'slideInRight 0.25s ease',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <CheckCircle size={15} />
          {toast.text}
        </div>
      )}

      {/* ── Approval modal ── */}
      {approvalOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 999,
          background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
          animation: 'fadeIn 0.15s ease',
        }} onClick={() => setApprovalOpen(false)}>
          <div style={{
            background: T.card, borderRadius: 24, padding: 28,
            maxWidth: 440, width: '100%',
            boxShadow: '0 24px 80px rgba(0,0,0,0.2)',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div style={{ fontWeight: 900, fontSize: 18, color: T.text }}>Approve Completion</div>
              <button onClick={() => setApprovalOpen(false)} style={{
                width: 28, height: 28, borderRadius: '50%', border: 'none',
                background: T.inputBg, cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center', color: T.textSec,
              }}>
                <X size={14} />
              </button>
            </div>
            {pendingApprovals[0] ? (
              <div style={{ background: T.inputBg, borderRadius: 12, padding: 14, marginBottom: 16, fontSize: 13, color: T.textSec, lineHeight: 1.8 }}>
                <strong style={{ color: T.text }}>Topic:</strong> {pendingApprovals[0].topic?.title_en}<br />
                <strong style={{ color: T.text }}>Score:</strong> {pendingApprovals[0].questions_correct}/{pendingApprovals[0].questions_attempted}
              </div>
            ) : (
              <p style={{ color: T.textMuted, fontSize: 14, marginBottom: 16 }}>No pending approvals.</p>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setApprovalOpen(false); showToast('success', 'Approved!') }} style={{
                flex: 1, padding: 12, background: '#10B981', border: 'none', borderRadius: 50,
                color: 'white', fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
              }}>
                Approve
              </button>
              <button onClick={() => setApprovalOpen(false)} style={{
                flex: 1, padding: 12, background: T.inputBg, border: `1px solid ${T.cardBorder}`,
                borderRadius: 50, color: T.textSec, fontWeight: 800, fontSize: 14,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', minHeight: '100vh' }}>

        {/* ── Sidebar ── */}
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`} style={{
          width: 240, background: T.sidebar,
          borderRight: `1px solid ${T.cardBorder}`,
          display: 'flex', flexDirection: 'column',
          position: 'sticky', top: 0, height: '100vh',
          boxShadow: `2px 0 12px ${T.shadow}`,
          flexShrink: 0,
          transition: 'background 0.2s',
        }}>
          {/* Logo */}
          <div style={{
            padding: '20px 20px 16px',
            borderBottom: `1px solid ${T.cardBorder}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <img src="/icons/icon-512.png" alt="EduPlay"
                style={{ width: 36, height: 36, borderRadius: 10, boxShadow: '0 2px 8px rgba(74,127,212,0.25)' }} />
              <div>
                <div style={{ fontWeight: 900, fontSize: 17, letterSpacing: '-0.02em', lineHeight: 1 }}>
                  Edu<span style={{
                    background: 'linear-gradient(135deg,#4A7FD4,#2EC4B6)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  }}>Play</span>
                </div>
                <div style={{ fontSize: 10, color: T.textMuted, fontWeight: 600, marginTop: 1 }}>
                  Family Dashboard
                </div>
              </div>
            </div>
          </div>

          {/* Nav items */}
          <nav style={{ padding: '12px 10px', flex: 1, overflowY: 'auto' }}>
            {NAV_ITEMS.map(item => {
              const Icon    = item.icon
              const isActive = screen === item.key
              return (
                <button
                  key={item.key}
                  className="nav-item"
                  onClick={() => { setScreen(item.key); setSidebar(false) }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', borderRadius: 12, border: 'none',
                    background: isActive ? T.navActive : 'transparent',
                    color: isActive ? T.navActiveTx : T.textSec,
                    fontWeight: isActive ? 800 : 600, fontSize: 13,
                    cursor: 'pointer', marginBottom: 2, textAlign: 'left',
                    fontFamily: 'inherit',
                  }}
                >
                  <div style={{ width: 24, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={18} />
                  </div>
                  {item.label}
                  {item.key === 'collection' && (
                    <span style={{
                      marginLeft: 'auto', fontSize: 10, fontWeight: 800,
                      padding: '1px 6px', borderRadius: 10,
                      background: dark ? 'rgba(74,127,212,0.2)' : '#EFF6FF',
                      color: '#4A7FD4',
                    }}>
                      New
                    </span>
                  )}
                </button>
              )
            })}
          </nav>

          {/* Children in sidebar */}
          <div style={{ padding: '12px 10px', borderTop: `1px solid ${T.cardBorder}` }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: T.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0 12px', marginBottom: 8 }}>
              Family
            </div>
            {(children || []).map((child: any, i: number) => {
              const col = CHILD_COLORS[i % CHILD_COLORS.length]
              return (
                <div key={child.id} style={{
                  display: 'flex', alignItems: 'center', gap: 9,
                  padding: '8px 10px', borderRadius: 10, cursor: 'pointer',
                  marginBottom: 2,
                }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = T.navHover}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  onClick={() => { setScreen('progress'); setSidebar(false) }}
                >
                  <div style={{
                    width: 30, height: 30, borderRadius: '50%',
                    background: col.gradient, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 15,
                  }}>
                    {col.emoji}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 12, color: T.text }}>{child.display_name}</div>
                    <div style={{ fontSize: 10, color: T.textMuted }}>Grade {child.grade === 0 ? 'K' : child.grade}</div>
                  </div>
                  {child.streak_current > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Flame size={11} color="#EF4444" fill="#EF4444" />
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#EF4444' }}>{child.streak_current}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Upgrade card */}
          <div style={{ padding: '12px 12px 16px' }}>
            <div style={{
              background: dark
                ? 'linear-gradient(135deg,#1E3A5F,#0F2942)'
                : 'linear-gradient(135deg,#EFF6FF,#F0FDFB)',
              border: `1px solid ${dark ? '#2A4A6F' : '#BFDBFE'}`,
              borderRadius: 14, padding: 14,
            }}>
              <div style={{ fontWeight: 800, fontSize: 13, color: dark ? '#60A5FA' : '#1D4ED8', marginBottom: 4 }}>
                🚀 Upgrade
              </div>
              <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 10, lineHeight: 1.5 }}>
                Unlimited worksheets & up to 5 children.
              </div>
              <button onClick={() => showToast('info', 'Upgrade coming soon!')} style={{
                width: '100%', padding: '8px', borderRadius: 50, border: 'none',
                background: 'linear-gradient(135deg,#F59E0B,#EF4444)',
                color: 'white', fontWeight: 800, fontSize: 12, cursor: 'pointer',
                fontFamily: 'inherit',
                boxShadow: '0 4px 12px rgba(245,158,11,0.3)',
              }}>
                Go Premium
              </button>
            </div>
          </div>
        </aside>

        {/* ── Main area ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

          {/* ── Top header ── */}
          <header style={{
            background: T.header,
            borderBottom: `1px solid ${T.headerBdr}`,
            padding: '0 24px', height: 60,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            position: 'sticky', top: 0, zIndex: 100,
            boxShadow: `0 2px 12px ${T.shadow}`,
            gap: 16, flexShrink: 0,
            transition: 'background 0.2s',
          }}>
            {/* Mobile hamburger */}
            <button onClick={() => setSidebar(v => !v)} style={{
              display: 'none', border: 'none', background: 'none',
              cursor: 'pointer', padding: 4, color: T.textSec,
              // shown via CSS on mobile
            }} className="mobile-menu-btn">
              ☰
            </button>

            {/* Page title */}
            <div style={{ fontWeight: 900, fontSize: 16, color: T.text, letterSpacing: '-0.01em' }}>
              {NAV_ITEMS.find(n => n.key === screen)?.label || 'Dashboard'}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>
              {/* Trial badge */}
              {daysLeft > 0 && (
                <span style={{
                  background: dark ? 'rgba(245,158,11,0.15)' : '#FEF3C7',
                  border: '1px solid #F59E0B50',
                  color: '#B45309', borderRadius: 50,
                  padding: '4px 10px', fontSize: 11, fontWeight: 800,
                }}>
                  {daysLeft}d trial
                </span>
              )}

              {/* Bell */}
              {pendingApprovals.length > 0 && (
                <button onClick={() => setApprovalOpen(true)} style={{
                  position: 'relative', width: 36, height: 36,
                  borderRadius: '50%', border: `1px solid ${T.cardBorder}`,
                  background: T.inputBg, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: T.textSec,
                }}>
                  <Bell size={16} />
                  <span style={{
                    position: 'absolute', top: 6, right: 6, width: 8, height: 8,
                    background: '#EF4444', borderRadius: '50%',
                    border: `2px solid ${T.header}`,
                  }} />
                </button>
              )}

              {/* Dark mode toggle */}
              <button onClick={() => setDark(v => !v)} style={{
                width: 36, height: 36, borderRadius: '50%',
                border: `1px solid ${T.cardBorder}`,
                background: T.inputBg, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: T.textSec, transition: 'all 0.15s',
              }}>
                {dark ? <Sun size={15} /> : <Moon size={15} />}
              </button>

              {/* Avatar */}
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'linear-gradient(135deg,#4A7FD4,#2EC4B6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 900, fontSize: 13,
                boxShadow: '0 2px 8px rgba(74,127,212,0.3)',
              }}>
                {parentName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
              </div>
            </div>
          </header>

          {/* ── Page content ── */}
          <main className="main-content" style={{
            flex: 1, padding: 24, overflowY: 'auto',
            animation: 'slideUp 0.2s ease',
          }}>

            {/* ══ OVERVIEW ══ */}
            {screen === 'overview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                {/* Greeting row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <h1 style={{ fontWeight: 900, fontSize: 24, margin: 0, letterSpacing: '-0.02em', color: T.text }}>
                      {greeting}, {parentName.split(' ')[0]} 👋
                    </h1>
                    <p style={{ color: T.textMuted, margin: '4px 0 0', fontSize: 13 }}>
                      Here's how your family is doing today
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => window.location.reload()} style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '8px 14px', borderRadius: 50,
                      border: `1px solid ${T.cardBorder}`, background: T.card,
                      color: T.textSec, fontWeight: 700, fontSize: 12,
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}>
                      <RefreshCw size={12} /> Refresh
                    </button>
                    <button onClick={() => window.location.href = '/worksheets'} className="btn-primary" style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '8px 16px', borderRadius: 50, border: 'none',
                      background: 'linear-gradient(135deg,#4A7FD4,#2EC4B6)',
                      color: 'white', fontWeight: 800, fontSize: 12,
                      cursor: 'pointer', fontFamily: 'inherit',
                      boxShadow: '0 4px 14px rgba(74,127,212,0.35)',
                    }}>
                      <FileText size={13} /> Worksheet Builder
                    </button>
                  </div>
                </div>

                {/* Stat cards */}
                <div className="stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
                  <StatCard icon={Zap}          label="Total XP"      value={totalXP.toLocaleString()} color="#F59E0B" bg={dark ? 'rgba(245,158,11,0.15)' : '#FEF3C7'} dark={dark} />
                  <StatCard icon={Flame}        label="Active Streaks" value={`${activeStreaks} 🔥`}   color="#EF4444" bg={dark ? 'rgba(239,68,68,0.15)'   : '#FEE2E2'} dark={dark} />
                  <StatCard icon={CheckCircle}  label="Lessons Done"  value={lessonsDone}              color="#10B981" bg={dark ? 'rgba(16,185,129,0.15)'  : '#D1FAE5'} dark={dark} />
                  <StatCard icon={Download}     label="Downloads"     value={`${downloads} / ∞`}       color="#4A7FD4" bg={dark ? 'rgba(74,127,212,0.15)'  : '#EFF6FF'} dark={dark} />
                </div>

                {/* Children cards */}
                <div>
                  <SectionHeader
                    title="Your Children"
                    subtitle="Click a card to view detailed progress"
                    dark={dark}
                    action={
                      <button onClick={() => setScreen('progress')} style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '7px 14px', borderRadius: 50,
                        border: `1px solid ${T.cardBorder}`, background: T.card,
                        color: T.textSec, fontWeight: 700, fontSize: 12,
                        cursor: 'pointer', fontFamily: 'inherit',
                      }}>
                        View all <ChevronRight size={13} />
                      </button>
                    }
                  />
                  <div className="child-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
                    {(children || []).map((child: any, i: number) => {
                      const col  = CHILD_COLORS[i % CHILD_COLORS.length]
                      const cp   = childProgress(child.id)
                      const recs = childRecs(child.id)
                      const highPri = recs.find((r: any) => r.priority === 'high')

                      const subjStats = ['math', 'english', 'hebrew'].map(slug => ({
                        slug, label: slug.charAt(0).toUpperCase() + slug.slice(1),
                        color: SUBJECT_COLORS[slug],
                        pct: Math.min(100, Math.round(
                          (cp.filter((p: any) => p.status === 'completed' && p.topic?.subject?.slug === slug).length / 7) * 100
                        )),
                      }))

                      return (
                        <div key={child.id}
                          className="card-hover"
                          onClick={() => setScreen('progress')}
                          style={{
                            background: T.card, borderRadius: 20, padding: 20,
                            border: `1px solid ${T.cardBorder}`,
                            boxShadow: `0 2px 12px ${T.shadow}`,
                            cursor: 'pointer',
                          }}
                        >
                          {/* Child header */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                            <div style={{
                              width: 52, height: 52, borderRadius: '50%',
                              background: col.gradient, flexShrink: 0,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 26, position: 'relative',
                              boxShadow: `0 4px 12px ${col.dot}40`,
                            }}>
                              {col.emoji}
                              {child.streak_current > 0 && (
                                <div style={{
                                  position: 'absolute', bottom: -2, right: -2,
                                  background: '#EF4444', color: 'white',
                                  fontSize: 9, fontWeight: 900,
                                  width: 18, height: 18, borderRadius: '50%',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  border: `2px solid ${T.card}`,
                                }}>
                                  {child.streak_current}
                                </div>
                              )}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 900, fontSize: 16, color: T.text, letterSpacing: '-0.01em' }}>
                                {child.display_name}
                              </div>
                              <div style={{ fontSize: 12, color: T.textMuted, marginTop: 1 }}>
                                Grade {child.grade === 0 ? 'K' : child.grade} · {(child.xp_total || 0).toLocaleString()} XP
                              </div>
                            </div>
                            <div style={{
                              display: 'flex', alignItems: 'center', gap: 3,
                              padding: '4px 8px', borderRadius: 8,
                              background: dark ? 'rgba(245,158,11,0.15)' : '#FEF3C7',
                            }}>
                              <Star size={11} fill="#F59E0B" color="#F59E0B" />
                              <span style={{ fontSize: 11, fontWeight: 800, color: '#B45309' }}>
                                {child.xp_total || 0}
                              </span>
                            </div>
                          </div>

                          {/* Subject progress bars */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                            {subjStats.map(s => (
                              <div key={s.slug} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                                <div style={{ width: 52, fontSize: 11, fontWeight: 700, color: T.textSec, flexShrink: 0 }}>{s.label}</div>
                                <div style={{ flex: 1, height: 6, background: dark ? '#2A2D3E' : '#F3F4F6', borderRadius: 99, overflow: 'hidden' }}>
                                  <div style={{ height: '100%', width: `${s.pct}%`, background: s.color, borderRadius: 99, transition: 'width 0.5s ease' }} />
                                </div>
                                <div style={{ fontSize: 11, fontWeight: 800, color: T.textMuted, width: 30, textAlign: 'right' }}>{s.pct}%</div>
                              </div>
                            ))}
                          </div>

                          {/* Status chip */}
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '8px 12px', borderRadius: 10,
                            background: highPri
                              ? (dark ? 'rgba(239,68,68,0.1)' : '#FEF2F2')
                              : (dark ? 'rgba(16,185,129,0.1)' : '#ECFDF5'),
                            border: `1px solid ${highPri ? '#FCA5A540' : '#86EFAC40'}`,
                          }}>
                            {highPri ? (
                              <>
                                <AlertCircle size={13} color="#EF4444" />
                                <span style={{ fontSize: 12, fontWeight: 700, color: '#EF4444' }}>
                                  Focus: {highPri.topic?.title_en}
                                </span>
                              </>
                            ) : (
                              <>
                                <CheckCircle size={13} color="#10B981" />
                                <span style={{ fontSize: 12, fontWeight: 700, color: '#10B981' }}>
                                  Doing great!
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Animal Collection widget */}
                <div style={{
                  background: 'linear-gradient(135deg,#4A7FD4,#2EC4B6)',
                  borderRadius: 20, padding: '20px 24px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  boxShadow: '0 8px 28px rgba(74,127,212,0.3)',
                  position: 'relative', overflow: 'hidden', cursor: 'pointer',
                }}
                  onClick={() => setScreen('collection')}
                >
                  <div style={{ position: 'absolute', top: -20, right: 60, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
                  <div style={{ position: 'absolute', bottom: -30, right: -10, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
                  <div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: 700, marginBottom: 4 }}>
                      Animal Collection
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: 'white', letterSpacing: '-0.02em' }}>
                      Explore the World Map
                    </div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 3 }}>
                      Unlock animal cards by earning XP
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <div style={{
                      background: 'rgba(255,255,255,0.15)', borderRadius: 50,
                      padding: '10px 20px', color: 'white', fontWeight: 800, fontSize: 13,
                      display: 'flex', alignItems: 'center', gap: 6,
                      backdropFilter: 'blur(4px)',
                    }}>
                      <Globe size={15} /> Open Map <ChevronRight size={14} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ══ PROGRESS ══ */}
            {screen === 'progress' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <SectionHeader title="Progress Reports" subtitle="Detailed view of each child's learning journey" dark={dark} />

                {(children || []).map((child: any, i: number) => {
                  const col  = CHILD_COLORS[i % CHILD_COLORS.length]
                  const cp   = childProgress(child.id)
                  const recs = childRecs(child.id)

                  return (
                    <div key={child.id} style={{
                      background: T.card, borderRadius: 20, padding: 22,
                      border: `1px solid ${T.cardBorder}`,
                      boxShadow: `0 2px 12px ${T.shadow}`,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18, flexWrap: 'wrap' }}>
                        <div style={{
                          width: 48, height: 48, borderRadius: '50%',
                          background: col.gradient,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
                        }}>
                          {col.emoji}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 900, fontSize: 17, color: T.text }}>{child.display_name}</div>
                          <div style={{ fontSize: 12, color: T.textMuted }}>
                            Grade {child.grade === 0 ? 'K' : child.grade} · {(child.xp_total || 0).toLocaleString()} XP · {child.streak_current || 0} day streak
                          </div>
                        </div>
                        <button onClick={() => window.location.href = `/play/${child.access_token}`} className="btn-primary" style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          padding: '9px 18px', borderRadius: 50, border: 'none',
                          background: 'linear-gradient(135deg,#4A7FD4,#2EC4B6)',
                          color: 'white', fontWeight: 800, fontSize: 13,
                          cursor: 'pointer', fontFamily: 'inherit',
                          boxShadow: '0 4px 14px rgba(74,127,212,0.35)',
                        }}>
                          <ExternalLink size={13} /> Open Portal
                        </button>
                      </div>

                      {recs.length > 0 && (
                        <div style={{
                          background: dark ? 'rgba(239,68,68,0.08)' : '#FEF2F2',
                          border: `1px solid #FCA5A530`,
                          borderRadius: 14, padding: 14, marginBottom: 16,
                        }}>
                          <div style={{ fontWeight: 800, fontSize: 13, color: '#EF4444', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Target size={14} /> Focus Recommendations
                          </div>
                          {recs.slice(0, 2).map((rec: any) => (
                            <div key={rec.id} style={{
                              background: T.card, borderRadius: 10, padding: 12, marginBottom: 8,
                              border: `1px solid ${T.cardBorder}`,
                              display: 'flex', gap: 12, alignItems: 'flex-start',
                            }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 800, fontSize: 13, color: T.text, marginBottom: 2 }}>{rec.topic?.title_en}</div>
                                <div style={{ fontSize: 11, color: T.textSec, lineHeight: 1.6 }}>{rec.reason_en}</div>
                              </div>
                              <Badge label={rec.priority} color={rec.priority === 'high' ? '#EF4444' : '#F59E0B'} bg={rec.priority === 'high' ? '#FEF2F2' : '#FEF3C7'} />
                            </div>
                          ))}
                        </div>
                      )}

                      {cp.length > 0 ? (
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 400 }}>
                            <thead>
                              <tr style={{ borderBottom: `2px solid ${T.cardBorder}` }}>
                                {['Topic', 'Subject', 'Status', 'Progress'].map(h => (
                                  <th key={h} style={{
                                    textAlign: 'left', padding: '8px 12px',
                                    fontSize: 10, fontWeight: 800, color: T.textMuted,
                                    textTransform: 'uppercase', letterSpacing: '0.05em',
                                  }}>
                                    {h}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {cp.map((p: any) => {
                                const pct = Math.round((p.steps_completed / (p.steps_total || 5)) * 100)
                                const statusMap: any = {
                                  completed:   { label: 'Done',        color: '#10B981', bg: '#D1FAE5' },
                                  in_progress: { label: 'In Progress', color: '#4A7FD4', bg: '#EFF6FF' },
                                  needs_review:{ label: 'Needs Work',  color: '#EF4444', bg: '#FEE2E2' },
                                  not_started: { label: 'Not Started', color: '#6B7280', bg: '#F3F4F6' },
                                }
                                const st = statusMap[p.status] || statusMap.not_started
                                const subjColor = SUBJECT_COLORS[p.topic?.subject?.slug] || '#6B7280'
                                return (
                                  <tr key={p.id} style={{ borderBottom: `1px solid ${T.cardBorder}` }}>
                                    <td style={{ padding: '11px 12px', fontWeight: 700, color: T.text }}>{p.topic?.title_en}</td>
                                    <td style={{ padding: '11px 12px' }}>
                                      <span style={{ fontSize: 11, fontWeight: 700, color: subjColor }}>
                                        {p.topic?.subject?.label_en}
                                      </span>
                                    </td>
                                    <td style={{ padding: '11px 12px' }}>
                                      <Badge label={st.label} color={st.color} bg={st.bg} />
                                    </td>
                                    <td style={{ padding: '11px 12px' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <div style={{ width: 80, height: 6, background: dark ? '#2A2D3E' : '#F3F4F6', borderRadius: 99, overflow: 'hidden' }}>
                                          <div style={{ height: '100%', width: `${pct}%`, background: st.color, borderRadius: 99 }} />
                                        </div>
                                        <span style={{ fontSize: 11, fontWeight: 700, color: T.textMuted }}>{pct}%</span>
                                      </div>
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div style={{ textAlign: 'center', padding: 32, color: T.textMuted, fontSize: 13 }}>
                          No lessons started yet. Encourage {child.display_name} to begin! 🚀
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* ══ WORKSHEETS ══ */}
            {screen === 'worksheets' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <SectionHeader title="Worksheets & Exams" subtitle="Build print-ready PDFs for any topic and grade" dark={dark} action={
                  <button onClick={() => window.location.href = '/worksheets'} className="btn-primary" style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '9px 18px', borderRadius: 50, border: 'none',
                    background: 'linear-gradient(135deg,#4A7FD4,#2EC4B6)',
                    color: 'white', fontWeight: 800, fontSize: 13,
                    cursor: 'pointer', fontFamily: 'inherit',
                    boxShadow: '0 4px 14px rgba(74,127,212,0.3)',
                  }}>
                    <Plus size={13} /> Open Builder
                  </button>
                } />

                <div className="child-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
                  {(children || []).map((child: any, i: number) => {
                    const col = CHILD_COLORS[i % CHILD_COLORS.length]
                    return (
                      <div key={child.id}
                        className="card-hover"
                        style={{
                          background: T.card, borderRadius: 20, padding: 20,
                          border: `1px solid ${T.cardBorder}`,
                          boxShadow: `0 2px 12px ${T.shadow}`,
                          cursor: 'pointer', textAlign: 'center',
                        }}
                        onClick={() => window.location.href = `/worksheets?childId=${child.id}`}
                      >
                        <div style={{
                          width: 56, height: 56, borderRadius: '50%',
                          background: col.gradient, margin: '0 auto 12px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
                          boxShadow: `0 4px 14px ${col.dot}40`,
                        }}>
                          {col.emoji}
                        </div>
                        <div style={{ fontWeight: 900, fontSize: 15, color: T.text, marginBottom: 2 }}>{child.display_name}</div>
                        <div style={{ fontSize: 12, color: T.textMuted, marginBottom: 14 }}>Grade {child.grade === 0 ? 'K' : child.grade}</div>
                        <button style={{
                          width: '100%', padding: '9px', borderRadius: 50, border: 'none',
                          background: 'linear-gradient(135deg,#4A7FD4,#2EC4B6)',
                          color: 'white', fontWeight: 800, fontSize: 12,
                          cursor: 'pointer', fontFamily: 'inherit',
                          boxShadow: '0 4px 12px rgba(74,127,212,0.3)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        }}>
                          <FileText size={13} /> Build Worksheet
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ══ CURRICULUM ══ */}
            {screen === 'curriculum' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <SectionHeader title="Curriculum Browser" subtitle="All topics across grades K–6" dark={dark} action={
                  <button onClick={() => window.location.href = '/curriculum'} className="btn-primary" style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '9px 18px', borderRadius: 50, border: 'none',
                    background: 'linear-gradient(135deg,#4A7FD4,#2EC4B6)',
                    color: 'white', fontWeight: 800, fontSize: 13,
                    cursor: 'pointer', fontFamily: 'inherit',
                    boxShadow: '0 4px 14px rgba(74,127,212,0.3)',
                  }}>
                    <ExternalLink size={13} /> Full Browser
                  </button>
                } />
                <div style={{
                  background: T.card, borderRadius: 20, padding: 40,
                  border: `1px solid ${T.cardBorder}`,
                  textAlign: 'center', boxShadow: `0 2px 12px ${T.shadow}`,
                }}>
                  <div style={{ fontSize: 48, marginBottom: 14 }}>📚</div>
                  <div style={{ fontWeight: 900, fontSize: 18, color: T.text, marginBottom: 8 }}>
                    Browse the Full Curriculum
                  </div>
                  <div style={{ fontSize: 13, color: T.textMuted, marginBottom: 20, maxWidth: 400, margin: '0 auto 20px' }}>
                    Math, English and Hebrew from Kindergarten to Grade 6 — all topics in one place.
                  </div>
                  <button onClick={() => window.location.href = '/curriculum'} className="btn-primary" style={{
                    padding: '12px 28px', borderRadius: 50, border: 'none',
                    background: 'linear-gradient(135deg,#4A7FD4,#2EC4B6)',
                    color: 'white', fontWeight: 800, fontSize: 14,
                    cursor: 'pointer', fontFamily: 'inherit',
                    boxShadow: '0 4px 16px rgba(74,127,212,0.35)',
                  }}>
                    Open Curriculum Browser
                  </button>
                </div>
              </div>
            )}

            {/* ══ COLLECTION ══ */}
            {screen === 'collection' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <SectionHeader title="Animal Collection" subtitle="Each child's card collection progress" dark={dark} />
                <div className="child-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
                  {(children || []).map((child: any, i: number) => {
                    const col = CHILD_COLORS[i % CHILD_COLORS.length]
                    return (
                      <div key={child.id}
                        className="card-hover"
                        style={{
                          background: T.card, borderRadius: 20, padding: 20,
                          border: `1px solid ${T.cardBorder}`,
                          boxShadow: `0 2px 12px ${T.shadow}`,
                          cursor: 'pointer',
                        }}
                        onClick={() => window.location.href = `/cards?childId=${child.id}&token=${child.access_token}`}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                          <div style={{
                            width: 44, height: 44, borderRadius: '50%',
                            background: col.gradient, fontSize: 22,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            {col.emoji}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: 15, color: T.text }}>{child.display_name}</div>
                            <div style={{ fontSize: 12, color: T.textMuted }}>Grade {child.grade === 0 ? 'K' : child.grade}</div>
                          </div>
                        </div>
                        <button style={{
                          width: '100%', padding: '9px', borderRadius: 50, border: 'none',
                          background: 'linear-gradient(135deg,#4A7FD4,#2EC4B6)',
                          color: 'white', fontWeight: 800, fontSize: 12,
                          cursor: 'pointer', fontFamily: 'inherit',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                          boxShadow: '0 4px 12px rgba(74,127,212,0.3)',
                        }}>
                          <Globe size={13} /> View Collection
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ══ PARENTS ══ */}
            {screen === 'parents' && (
              <ParentsScreen familyId={familyId} showToast={showToast} dark={dark} />
            )}

            {/* ══ SETTINGS ══ */}
            {screen === 'settings' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <SectionHeader title="Settings" subtitle="Manage children, links and your plan" dark={dark} />

                {/* Manage children */}
                <div style={{
                  background: T.card, borderRadius: 20, padding: 22,
                  border: `1px solid ${T.cardBorder}`,
                  boxShadow: `0 2px 12px ${T.shadow}`,
                }}>
                  <div style={{ fontWeight: 900, fontSize: 15, color: T.text, marginBottom: 4 }}>Manage Children</div>
                  <div style={{ fontSize: 13, color: T.textMuted, marginBottom: 16 }}>
                    Set grade, font size, break preferences and PIN for each child.
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {(children || []).map((child: any, i: number) => {
                      const col = CHILD_COLORS[i % CHILD_COLORS.length]
                      return (
                        <div key={child.id} style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr repeat(4, minmax(90px, 130px))',
                          gap: 10, alignItems: 'center',
                          padding: '14px 16px', background: T.inputBg,
                          borderRadius: 12, border: `1px solid ${T.cardBorder}`,
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: col.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                              {col.emoji}
                            </div>
                            <div>
                              <div style={{ fontWeight: 800, fontSize: 14, color: T.text }}>{child.display_name}</div>
                              <div style={{ fontSize: 11, color: T.textMuted }}>Grade {child.grade === 0 ? 'K' : child.grade}</div>
                            </div>
                          </div>

                          {[
                            {
                              label: 'Grade', id: 'grade', val: child.grade,
                              opts: [[0,'Kindergarten'],[1,'Grade 1'],[2,'Grade 2'],[3,'Grade 3'],[4,'Grade 4'],[5,'Grade 5'],[6,'Grade 6']],
                              onChange: async (v: string) => {
                                await fetch('/api/children', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ childId: child.id, grade: parseInt(v) }) })
                                showToast('success', `${child.display_name} moved to Grade ${parseInt(v) === 0 ? 'K' : v}`)
                                setTimeout(() => window.location.reload(), 800)
                              },
                            },
                            {
                              label: 'Font', id: 'font', val: child.font_size || 'medium',
                              opts: [['small','Small'],['medium','Medium'],['large','Large'],['xl','XL']],
                              onChange: async (v: string) => {
                                await fetch('/api/children', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ childId: child.id, font_size: v }) })
                                showToast('success', `Font size updated`)
                              },
                            },
                            {
                              label: 'Break', id: 'break', val: child.relief_trigger || 'topic',
                              opts: [['off','Off'],['lesson','Per Lesson'],['topic','Per Topic'],['both','Both']],
                              onChange: async (v: string) => {
                                await fetch('/api/children', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ childId: child.id, relief_trigger: v }) })
                                showToast('success', `Break setting updated`)
                              },
                            },
                          ].map(field => (
                            <select key={field.id} defaultValue={field.val}
                              onChange={e => field.onChange(e.target.value)}
                              style={{
                                padding: '8px 10px', borderRadius: 10,
                                border: `1.5px solid ${T.inputBdr}`,
                                background: T.card, fontWeight: 700, fontSize: 12,
                                color: T.text, cursor: 'pointer', width: '100%',
                                fontFamily: 'inherit', outline: 'none',
                              }}>
                              {field.opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                            </select>
                          ))}

                          <input type="text" maxLength={4} defaultValue={child.pin_code || ''}
                            placeholder="PIN"
                            onBlur={async e => {
                              const v = e.target.value.trim()
                              if (v.length === 4 && /^\d{4}$/.test(v)) {
                                await fetch('/api/children', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ childId: child.id, pin_code: v }) })
                                showToast('success', `${child.display_name}'s PIN updated`)
                              }
                            }}
                            style={{
                              padding: '8px 10px', borderRadius: 10,
                              border: `1.5px solid ${T.inputBdr}`, background: T.card,
                              fontWeight: 800, fontSize: 14, color: T.text,
                              textAlign: 'center', letterSpacing: '4px', width: '100%',
                              fontFamily: 'inherit', outline: 'none',
                            }} />
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Child links */}
                <div style={{
                  background: T.card, borderRadius: 20, padding: 22,
                  border: `1px solid ${T.cardBorder}`,
                  boxShadow: `0 2px 12px ${T.shadow}`,
                }}>
                  <div style={{ fontWeight: 900, fontSize: 15, color: T.text, marginBottom: 4 }}>Child Links</div>
                  <div style={{ fontSize: 13, color: T.textMuted, marginBottom: 16 }}>Share these links to open each child's learning portal.</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {(children || []).map((child: any, i: number) => {
                      const col  = CHILD_COLORS[i % CHILD_COLORS.length]
                      const link = `${typeof window !== 'undefined' ? window.location.origin : 'https://eduplay-tau.vercel.app'}/play/${child.access_token}`
                      return (
                        <div key={child.id} style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '12px 14px', background: T.inputBg,
                          borderRadius: 12, border: `1px solid ${T.cardBorder}`,
                        }}>
                          <div style={{ width: 36, height: 36, borderRadius: '50%', background: col.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                            {col.emoji}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 800, fontSize: 13, color: T.text }}>{child.display_name}</div>
                            <div style={{ fontSize: 11, color: T.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{link}</div>
                          </div>
                          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                            <button onClick={() => { navigator.clipboard.writeText(link); showToast('success', `${child.display_name}'s link copied!`) }}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 4,
                                padding: '6px 12px', borderRadius: 8, border: 'none',
                                background: '#4A7FD4', color: 'white',
                                fontWeight: 700, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
                              }}>
                              <Copy size={11} /> Copy
                            </button>
                            <button onClick={() => window.open(link, '_blank')}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 4,
                                padding: '6px 12px', borderRadius: 8,
                                border: `1px solid ${T.cardBorder}`, background: T.card,
                                color: T.textSec, fontWeight: 700, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
                              }}>
                              <ExternalLink size={11} /> Open
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Plan */}
                <div style={{
                  background: 'linear-gradient(135deg,#4A7FD4,#2EC4B6)',
                  borderRadius: 20, padding: 22, color: 'white',
                  boxShadow: '0 8px 28px rgba(74,127,212,0.3)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontWeight: 900, fontSize: 17, marginBottom: 3 }}>EduPlay Family Plan</div>
                      <div style={{ fontSize: 13, opacity: 0.8 }}>Trial — {daysLeft} days remaining</div>
                    </div>
                    <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 800 }}>
                      TRIAL
                    </span>
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.85, lineHeight: 1.7 }}>
                    ✅ Unlimited lessons · ✅ All subjects · ✅ 3 children · ✅ Worksheets
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* ── Mobile bottom nav ── */}
      <nav className="mobile-nav" style={{
        display: 'none', position: 'fixed', bottom: 0, left: 0, right: 0,
        background: T.header, borderTop: `1px solid ${T.cardBorder}`,
        padding: '8px 0 max(8px,env(safe-area-inset-bottom))',
        zIndex: 200, boxShadow: `0 -4px 12px ${T.shadow}`,
      }}>
        {NAV_ITEMS.slice(0, 5).map(item => {
          const Icon = item.icon
          const isActive = screen === item.key
          return (
            <button key={item.key} onClick={() => setScreen(item.key)} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              background: 'none', border: 'none', cursor: 'pointer', padding: '6px 4px',
              color: isActive ? '#4A7FD4' : T.textMuted,
            }}>
              <Icon size={20} />
              <span style={{ fontSize: 9, fontWeight: 700 }}>{item.label}</span>
              {isActive && <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#4A7FD4' }} />}
            </button>
          )
        })}
      </nav>
    </div>
  )
}