'use client'
import { useState, useEffect } from 'react'
import { ClipboardList } from 'lucide-react'
import { THEME_CONFIG, KidNavBar, ThemeDecorations } from '@/components/theme'

interface AssignmentSummary {
  id: string
  title: string | null
  created_at: string
  totalItems: number
  completedItems: number
  correctFirstTry: number
  correctAfterHint: number
  revealedAnswer: number
}

export default function AssignmentsClient({ child, token }: { child: any, token: string }) {
  const theme = child.theme || 'plain'
  const T = THEME_CONFIG[theme] || THEME_CONFIG.plain
  const langMode = child.lang_screen || 'bilingual'
  const isHE = langMode === 'he_only'

  const [assignments, setAssignments] = useState<AssignmentSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/assignments?childId=${child.id}`)
      .then(r => r.json())
      .then(data => setAssignments(data.assignments || []))
      .finally(() => setLoading(false))
  }, [child.id])

  function openAssignment(id: string) {
    window.location.href = `/assignment?id=${id}&childId=${child.id}&token=${token}&theme=${theme}&lang=${langMode}`
  }

  const pending   = assignments.filter(a => a.totalItems > 0 && a.completedItems < a.totalItems)
  const completed = assignments.filter(a => a.totalItems > 0 && a.completedItems >= a.totalItems)

  return (
    <div style={{ minHeight:'100vh', background:T.bg, fontFamily:'"Nunito",sans-serif', position:'relative' }} dir={isHE ? 'rtl' : 'ltr'}>
      <ThemeDecorations theme={theme}/>

      <header style={{ background:T.panel, borderBottom:`2px solid ${T.border}`, padding:'0 16px', height:'56px', display:'flex', alignItems:'center', gap:'10px', position:'sticky', top:0, zIndex:100, boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
        <ClipboardList size={20} color={T.accent1}/>
        <div style={{ fontFamily:T.fontHead, fontWeight:900, fontSize: theme === 'minecraft' ? '11px' : '16px', color:T.text }}>
          {isHE ? 'המטלות שלי' : 'My Assignments'}
        </div>
      </header>

      <div style={{ maxWidth:'700px', margin:'0 auto', padding:'16px 16px 84px', position:'relative', zIndex:1 }}>
        {loading && (
          <div style={{ textAlign:'center', padding:'60px 20px', color:T.text2 }}>{isHE ? 'טוען...' : 'Loading...'}</div>
        )}

        {!loading && assignments.length === 0 && (
          <div style={{ textAlign:'center', padding:'60px 20px', background:T.panel, borderRadius:T.radius, border:`1.5px solid ${T.border}` }}>
            <div style={{ fontSize:'40px', marginBottom:'12px' }}>📭</div>
            <div style={{ fontWeight:800, fontSize:'15px', color:T.text }}>{isHE ? 'אין מטלות עדיין' : 'No assignments yet'}</div>
            <div style={{ fontSize:'13px', color:T.text2, marginTop:'6px' }}>{isHE ? 'ההורה שלך עדיין לא הקצה לך מטלה' : "Your parent hasn't assigned you anything yet"}</div>
          </div>
        )}

        {!loading && pending.length > 0 && (
          <>
            <div style={{ fontSize:'11px', fontWeight:800, color:T.text2, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'8px' }}>
              {isHE ? 'ממתינות' : 'To Do'}
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'10px', marginBottom:'24px' }}>
              {pending.map(a => (
                <AssignmentCard key={a.id} a={a} T={T} isHE={isHE} onOpen={() => openAssignment(a.id)} kind="pending"/>
              ))}
            </div>
          </>
        )}

        {!loading && completed.length > 0 && (
          <>
            <div style={{ fontSize:'11px', fontWeight:800, color:T.text2, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'8px' }}>
              {isHE ? 'הושלמו' : 'Completed'}
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
              {completed.map(a => (
                <AssignmentCard key={a.id} a={a} T={T} isHE={isHE} onOpen={() => openAssignment(a.id)} kind="completed"/>
              ))}
            </div>
          </>
        )}
      </div>

      <KidNavBar theme={theme} active="assignments" childId={child.id} token={token}/>
    </div>
  )
}

function AssignmentCard({ a, T, isHE, onOpen, kind }: {
  a: AssignmentSummary, T: any, isHE: boolean, onOpen: () => void, kind: 'pending' | 'completed'
}) {
  const pct = a.totalItems > 0 ? Math.round((a.completedItems / a.totalItems) * 100) : 0
  return (
    <div onClick={onOpen} style={{ background:T.panel, border:`2px solid ${kind === 'pending' ? T.accent1 : T.border}`, borderRadius:T.radius, padding:'14px 16px', cursor:'pointer', display:'flex', alignItems:'center', gap:'12px' }}>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontWeight:800, fontSize:'14px', color:T.text, marginBottom:'4px' }}>{a.title || (isHE ? 'מטלה ללא שם' : 'Untitled assignment')}</div>
        {kind === 'pending' ? (
          <div style={{ height:'6px', background:'rgba(0,0,0,0.08)', borderRadius:'50px', overflow:'hidden', marginBottom:'4px' }}>
            <div style={{ height:'100%', width:`${pct}%`, background:T.accent1, borderRadius:'50px' }}/>
          </div>
        ) : (
          <div style={{ fontSize:'11px', color:T.text2, display:'flex', gap:'10px', marginBottom:'2px' }}>
            {a.correctFirstTry > 0 && <span>✅ {a.correctFirstTry}</span>}
            {a.correctAfterHint > 0 && <span>💡 {a.correctAfterHint}</span>}
            {a.revealedAnswer > 0 && <span>👀 {a.revealedAnswer}</span>}
          </div>
        )}
        <div style={{ fontSize:'11px', color:T.text2, fontWeight:600 }}>{a.completedItems}/{a.totalItems} {isHE ? 'הושלמו' : 'done'}</div>
      </div>
      <div style={{ fontSize:'11px', fontWeight:800, padding:'6px 14px', borderRadius:'50px', background: kind === 'pending' ? T.accent1 : T.border, color: kind === 'pending' ? 'white' : T.text, whiteSpace:'nowrap', flexShrink:0 }}>
        {kind === 'pending' ? (pct > 0 ? (isHE ? 'המשך' : 'Continue') : (isHE ? 'התחל' : 'Start')) : (isHE ? 'סקירה' : 'Review')}
      </div>
    </div>
  )
}
