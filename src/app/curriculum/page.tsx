'use client'
import { useState, useEffect } from 'react'
import { ThemeDecorations } from '@/components/theme'

const GRADE_LABELS: Record<number,string> = {0:'Kindergarten',1:'Grade 1',2:'Grade 2',3:'Grade 3',4:'Grade 4',5:'Grade 5',6:'Grade 6'}
const GRADE_LABELS_HE: Record<number,string> = {0:'גן חובה',1:'כיתה א׳',2:'כיתה ב׳',3:'כיתה ג׳',4:'כיתה ד׳',5:'כיתה ה׳',6:'כיתה ו׳'}

const SUBJECTS = [
  { slug:'math',    label:'Mathematics', labelHe:'מתמטיקה', icon:'📐', color:'#4A7FD4', light:'#EFF6FF' },
  { slug:'english', label:'English',     labelHe:'אנגלית',  icon:'📖', color:'#2EC4B6', light:'#F0FDFB' },
  { slug:'hebrew',  label:'Hebrew',      labelHe:'עברית',   icon:'🇮🇱', color:'#FF6B6B', light:'#FFF5F5' },
]

const CHILDREN = [
  { id:'22222222-2222-2222-2222-222222222001', name:'Lia',   grade:6, emoji:'🐱', theme:'minecraft',  accent:'#5D9E2F' },
  { id:'22222222-2222-2222-2222-222222222002', name:'Tamar', grade:4, emoji:'🐻', theme:'minecraft',  accent:'#5D9E2F' },
  { id:'22222222-2222-2222-2222-222222222003', name:'Tom',   grade:0, emoji:'🦊', theme:'plain',      accent:'#4A7FD4' },
]

const THEME_BADGE: Record<string,{label:string;bg:string}> = {
  minecraft:  { label:'⛏️ Minecraft',  bg:'#1A1A2E' },
  princesses: { label:'👑 Princesses', bg:'#E05BA0' },
  plain:      { label:'📚 Classic',    bg:'#4A7FD4' },
}

export default function CurriculumPage() {
  const [selectedGrade, setGrade]   = useState(4)
  const [subj,          setSubject] = useState(SUBJECTS[0])
  const [child,         setChild]   = useState(CHILDREN[0])
  const [topics,        setTopics]  = useState<any[]>([])
  const [loading,       setLoading] = useState(false)
  const [lang,          setLang]    = useState<'en'|'he'>('en')
  const [hovered,       setHovered] = useState<string|null>(null)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/topics?grade=${selectedGrade}&subject=${subj.slug}`)
      .then(r => r.json())
      .then(d => { setTopics(d.topics || []); setLoading(false) })
      .catch(() => { setTopics([]); setLoading(false) })
  }, [selectedGrade, subj.slug])

  const go = (topicId?: string) => {
    window.location.href = topicId
      ? `/lesson?childId=${child.id}&topicId=${topicId}&theme=${child.theme}`
      : `/lesson?childId=${child.id}&theme=${child.theme}`
  }

  const badge = THEME_BADGE[child.theme] || THEME_BADGE.plain

  return (
    <div style={{ minHeight:'100vh', background:'#F8F9FB', fontFamily:'"Nunito",sans-serif', position:'relative' }}>
      <ThemeDecorations theme={child.theme}/>

      {/* Header */}
      <header style={{ background:'white', borderBottom:'1px solid #EEF1F6', padding:'0 28px', height:60, display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:100, boxShadow:'0 1px 12px rgba(30,45,78,0.06)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:34, height:34, background:'linear-gradient(135deg,#4A7FD4,#2EC4B6)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>🦔</div>
          <span style={{ fontWeight:900, fontSize:20, color:'#1E2D4E', letterSpacing:'-0.02em' }}>Edu<span style={{ color:'#4A7FD4' }}>Play</span></span>
          <span style={{ fontSize:13, color:'#9AA5B8', fontWeight:600, marginLeft:4 }}>/ Curriculum</span>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => setLang(l => l==='en'?'he':'en')} style={{ padding:'6px 14px', borderRadius:50, border:'1.5px solid #EEF1F6', background:'white', fontWeight:700, fontSize:12, cursor:'pointer', color:'#4B5563' }}>
            {lang==='en'?'🇮🇱 עברית':'🇺🇸 English'}
          </button>
          <button onClick={() => window.location.href='/dashboard'} style={{ padding:'6px 14px', borderRadius:50, border:'1.5px solid #EEF1F6', background:'white', fontWeight:700, fontSize:13, cursor:'pointer', color:'#4B5563' }}>
            ← Dashboard
          </button>
        </div>
      </header>

      <div style={{ maxWidth:1060, margin:'0 auto', padding:'32px 24px', position:'relative', zIndex:1 }}>

        {/* Page title */}
        <div style={{ marginBottom:28 }}>
          <h1 style={{ fontWeight:900, fontSize:28, color:'#1E2D4E', margin:0, letterSpacing:'-0.02em' }}>
            {lang==='en' ? '📚 Curriculum Explorer' : '📚 מפת הלימודים'}
          </h1>
          <p style={{ color:'#6B7280', fontSize:14, marginTop:6, marginBottom:0 }}>
            {lang==='en' ? 'Browse all topics by grade and subject — click any topic to start a lesson' : 'גלה נושאים לפי כיתה ומקצוע — לחץ על נושא להתחלת שיעור'}
          </p>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'240px 1fr', gap:24, alignItems:'start' }}>

          {/* ── Left sidebar ── */}
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

            {/* Child picker */}
            <div style={{ background:'white', borderRadius:16, border:'1px solid #EEF1F6', padding:16, boxShadow:'0 2px 8px rgba(30,45,78,0.05)' }}>
              <div style={{ fontSize:11, fontWeight:800, color:'#9AA5B8', letterSpacing:'0.08em', marginBottom:10, textTransform:'uppercase' }}>
                {lang==='en' ? 'Learning as' : 'לומד בתור'}
              </div>
              {CHILDREN.map(c => (
                <button key={c.id} onClick={() => { setChild(c); setGrade(c.grade) }}
                  style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:12, border:`2px solid ${child.id===c.id ? c.accent : 'transparent'}`, background:child.id===c.id ? `${c.accent}12` : 'transparent', cursor:'pointer', marginBottom:6, textAlign:'left', transition:'all 0.15s' }}>
                  <span style={{ fontSize:22 }}>{c.emoji}</span>
                  <div>
                    <div style={{ fontWeight:800, fontSize:14, color:'#1E2D4E' }}>{c.name}</div>
                    <div style={{ fontSize:11, color:'#9AA5B8' }}>{GRADE_LABELS[c.grade]}</div>
                  </div>
                  {child.id===c.id && <div style={{ marginLeft:'auto', width:8, height:8, borderRadius:'50%', background:c.accent }}/>}
                </button>
              ))}
            </div>

            {/* Subject picker */}
            <div style={{ background:'white', borderRadius:16, border:'1px solid #EEF1F6', padding:16, boxShadow:'0 2px 8px rgba(30,45,78,0.05)' }}>
              <div style={{ fontSize:11, fontWeight:800, color:'#9AA5B8', letterSpacing:'0.08em', marginBottom:10, textTransform:'uppercase' }}>
                {lang==='en' ? 'Subject' : 'מקצוע'}
              </div>
              {SUBJECTS.map(s => (
                <button key={s.slug} onClick={() => setSubject(s)}
                  style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:12, border:`2px solid ${subj.slug===s.slug ? s.color : 'transparent'}`, background:subj.slug===s.slug ? s.light : 'transparent', cursor:'pointer', marginBottom:6, textAlign:'left', transition:'all 0.15s' }}>
                  <span style={{ fontSize:20 }}>{s.icon}</span>
                  <span style={{ fontWeight:800, fontSize:14, color:subj.slug===s.slug ? s.color : '#374151' }}>
                    {lang==='en' ? s.label : s.labelHe}
                  </span>
                </button>
              ))}
            </div>

            {/* Theme badge */}
            <div style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:50, background:badge.bg }}>
              <span style={{ fontSize:12, fontWeight:700, color:'white' }}>{badge.label}</span>
            </div>

            {/* Grade overview mini */}
            <div style={{ background:'white', borderRadius:16, border:'1px solid #EEF1F6', padding:16, boxShadow:'0 2px 8px rgba(30,45,78,0.05)' }}>
              <div style={{ fontSize:11, fontWeight:800, color:'#9AA5B8', letterSpacing:'0.08em', marginBottom:10, textTransform:'uppercase' }}>
                {lang==='en' ? 'Grades' : 'כיתות'}
              </div>
              {[0,1,2,3,4,5,6].map(g => {
                const gc = CHILDREN.find(c => c.grade === g)
                const active = selectedGrade === g
                return (
                  <button key={g} onClick={() => setGrade(g)}
                    style={{ width:'100%', display:'flex', alignItems:'center', gap:8, padding:'8px 10px', borderRadius:10, border:'none', background:active ? subj.light : 'transparent', cursor:'pointer', marginBottom:3, textAlign:'left' }}>
                    <span style={{ fontSize:14 }}>{gc?.emoji || '📘'}</span>
                    <span style={{ fontSize:12, fontWeight:active?800:600, color:active ? subj.color : '#6B7280' }}>
                      {lang==='en' ? GRADE_LABELS[g] : GRADE_LABELS_HE[g]}
                    </span>
                    {active && <div style={{ marginLeft:'auto', width:6, height:6, borderRadius:'50%', background:subj.color }}/>}
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── Main content ── */}
          <div>

            {/* Quick-start banner */}
            <div style={{ background:`linear-gradient(135deg,${subj.color},${subj.color}BB)`, borderRadius:16, padding:'18px 22px', marginBottom:20, display:'flex', alignItems:'center', gap:16 }}>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:900, fontSize:17, color:'white', marginBottom:4 }}>
                  {lang==='en' ? `${GRADE_LABELS[selectedGrade]} · ${subj.label}` : `${GRADE_LABELS_HE[selectedGrade]} · ${subj.labelHe}`}
                </div>
                <div style={{ fontSize:13, color:'rgba(255,255,255,0.85)' }}>
                  {topics.length} {lang==='en' ? 'topics' : 'נושאים'}
                  {child && ` · ${child.emoji} ${lang==='en' ? `Starting as ${child.name}` : `מתחיל בשם ${child.name}`}`}
                </div>
              </div>
              <button onClick={() => go(topics[0]?.id)} disabled={topics.length===0}
                style={{ padding:'11px 24px', borderRadius:50, border:'2px solid rgba(255,255,255,0.45)', background:'rgba(255,255,255,0.2)', color:'white', fontWeight:800, fontSize:14, cursor:'pointer', whiteSpace:'nowrap', backdropFilter:'blur(4px)' }}>
                ▶ {lang==='en' ? 'Start' : 'התחל'}
              </button>
            </div>

            {/* Topics */}
            {loading ? (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(270px,1fr))', gap:14 }}>
                {[1,2,3,4,5,6].map(i => <div key={i} style={{ height:110, background:'white', borderRadius:14, border:'1px solid #EEF1F6', opacity:0.6, animation:'pulse 1.5s ease infinite' }}/>)}
              </div>
            ) : topics.length === 0 ? (
              <div style={{ textAlign:'center', padding:'56px 24px', background:'white', borderRadius:20, border:'1px solid #EEF1F6' }}>
                <div style={{ fontSize:52, marginBottom:14 }}>📭</div>
                <div style={{ fontWeight:900, fontSize:20, color:'#1E2D4E', marginBottom:8 }}>{lang==='en' ? 'No topics yet' : 'אין נושאים עדיין'}</div>
                <div style={{ fontSize:14, color:'#9AA5B8' }}>{lang==='en' ? 'Topics for this grade are coming soon!' : 'נושאים לכיתה זו יתווספו בקרוב!'}</div>
              </div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(270px,1fr))', gap:14 }}>
                {topics.map((topic, i) => (
                  <div key={topic.id}
                    onClick={() => go(topic.id)}
                    onMouseEnter={() => setHovered(topic.id)}
                    onMouseLeave={() => setHovered(null)}
                    style={{ background:'white', borderRadius:16, border:`2px solid ${hovered===topic.id ? subj.color : '#EEF1F6'}`, padding:'16px 18px', cursor:'pointer', position:'relative', overflow:'hidden', boxShadow:hovered===topic.id ? `0 8px 24px ${subj.color}25` : '0 2px 8px rgba(30,45,78,0.05)', transform:hovered===topic.id ? 'translateY(-2px)' : 'none', transition:'all 0.15s ease' }}>
                    <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${subj.color},${subj.color}66)` }}/>
                    <div style={{ display:'flex', alignItems:'flex-start', gap:12, paddingTop:6 }}>
                      <div style={{ width:36, height:36, borderRadius:10, background:subj.light, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:14, color:subj.color, flexShrink:0 }}>{i+1}</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:800, fontSize:14, color:'#1E2D4E', marginBottom:4, lineHeight:1.3 }}>
                          {lang==='en' ? topic.title_en : (topic.title_he || topic.title_en)}
                        </div>
                        {topic.description_en && (
                          <div style={{ fontSize:12, color:'#6B7280', lineHeight:1.5, marginBottom:10 }}>
                            {lang==='en' ? topic.description_en : (topic.description_he || topic.description_en)}
                          </div>
                        )}
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <span style={{ fontSize:11, fontWeight:800, background:subj.light, color:subj.color, padding:'3px 10px', borderRadius:50 }}>+{topic.xp_reward} XP</span>
                          <span style={{ fontSize:11, color:'#9AA5B8', fontWeight:600 }}>{topic.lesson_count} {lang==='en'?'lessons':'שיעורים'}</span>
                          {hovered===topic.id && <span style={{ marginLeft:'auto', fontSize:12, fontWeight:800, color:subj.color }}>{lang==='en'?'Start →':'התחל ←'}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
    </div>
  )
}