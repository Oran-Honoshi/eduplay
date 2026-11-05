'use client'
import { useState, useEffect } from 'react'
import { ThemeDecorations } from '@/components/theme'
import { ArrowLeft, Play, Map, Inbox } from 'lucide-react'
import ParentHeaderBar from '@/components/ParentHeaderBar'
import { PARENT_COLORS, PARENT_FONTS, CHILD_AVATAR_COLORS } from '@/lib/parentTheme'
import { useFamilyChildren, EMPTY_CHILD, type FamilyChild } from '@/lib/useFamilyChildren'

const GRADE_LABELS: Record<number,string> = {0:'Kindergarten',1:'Grade 1',2:'Grade 2',3:'Grade 3',4:'Grade 4',5:'Grade 5',6:'Grade 6'}
const GRADE_LABELS_HE: Record<number,string> = {0:'גן חובה',1:'כיתה א׳',2:'כיתה ב׳',3:'כיתה ג׳',4:'כיתה ד׳',5:'כיתה ה׳',6:'כיתה ו׳'}

const SUBJECTS = [
  { slug:'math',    label:'Mathematics', labelHe:'מתמטיקה', icon:'📐', color:'#4A7FD4', light:'#EFF6FF' },
  { slug:'english', label:'English',     labelHe:'אנגלית',  icon:'📖', color:'#2EC4B6', light:'#F0FDFB' },
  { slug:'hebrew',  label:'Hebrew',      labelHe:'עברית',   icon:'🇮🇱', color:'#FF6B6B', light:'#FFF5F5' },
]


const THEME_BADGE: Record<string,{label:string;bg:string}> = {
  minecraft:  { label:'⛏️ Minecraft',  bg:'#1A1A2E' },
  princesses: { label:'👑 Princesses', bg:'#E05BA0' },
  plain:      { label:'📚 Classic',    bg:'#4A7FD4' },
}

export default function CurriculumPage() {
  const [selectedGrade, setGrade]   = useState(4)
  const [subj,          setSubject] = useState(SUBJECTS[0])
  const { children: CHILDREN } = useFamilyChildren()
  const [child,         setChild]   = useState<FamilyChild>(EMPTY_CHILD)
  useEffect(() => {
    if (!child.id && CHILDREN.length) { setChild(CHILDREN[0]); setGrade(CHILDREN[0].grade) }
  }, [CHILDREN, child.id])
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
    <div style={{ minHeight:'100vh', background:PARENT_COLORS.pageBg, fontFamily:PARENT_FONTS.body, position:'relative' }}>
      <ThemeDecorations theme={child.theme}/>

      {/* Header */}
      <ParentHeaderBar
        center={<span style={{ fontSize:13, color:PARENT_COLORS.textMuted, fontWeight:600 }}>/ Curriculum</span>}
        right={
          <>
            <button onClick={() => setLang(l => l==='en'?'he':'en')} style={{ padding:'6px 14px', borderRadius:50, border:`1.5px solid ${PARENT_COLORS.border}`, background:PARENT_COLORS.card, fontWeight:700, fontSize:12, cursor:'pointer', color:PARENT_COLORS.textSecondary }}>
              {lang==='en'?'🇮🇱 עברית':'🇺🇸 English'}
            </button>
            <button onClick={() => window.location.href='/dashboard'} style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 14px', borderRadius:50, border:`1.5px solid ${PARENT_COLORS.border}`, background:PARENT_COLORS.card, fontWeight:700, fontSize:13, cursor:'pointer', color:PARENT_COLORS.textSecondary }}>
              <ArrowLeft size={13} /> Dashboard
            </button>
          </>
        }
      />

      <div style={{ maxWidth:1060, margin:'0 auto', padding:'32px 24px', position:'relative', zIndex:1 }}>

        {/* Page title */}
        <div style={{ marginBottom:28 }}>
          <h1 style={{ display:'flex', alignItems:'center', gap:10, fontFamily:PARENT_FONTS.heading, fontWeight:800, fontSize:28, color:PARENT_COLORS.text, margin:0, letterSpacing:'-0.02em' }}>
            <Map size={24} color={PARENT_COLORS.primary} /> {lang==='en' ? 'Curriculum Explorer' : 'מפת הלימודים'}
          </h1>
          <p style={{ color:PARENT_COLORS.textSecondary, fontSize:14, marginTop:6, marginBottom:0 }}>
            {lang==='en' ? 'Browse all topics by grade and subject — click any topic to start a lesson' : 'גלה נושאים לפי כיתה ומקצוע — לחץ על נושא להתחלת שיעור'}
          </p>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'240px 1fr', gap:24, alignItems:'start' }}>

          {/* ── Left sidebar ── */}
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

            {/* Child picker */}
            <div style={{ background:PARENT_COLORS.card, borderRadius:16, border:`1px solid ${PARENT_COLORS.border}`, padding:16 }}>
              <div style={{ fontSize:11, fontWeight:800, color:PARENT_COLORS.textMuted, letterSpacing:'0.08em', marginBottom:10, textTransform:'uppercase' }}>
                {lang==='en' ? 'Learning as' : 'לומד בתור'}
              </div>
              {CHILDREN.map(c => (
                <button key={c.id} onClick={() => { setChild(c); setGrade(c.grade) }}
                  style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:12, border:`2px solid ${child.id===c.id ? c.accent : 'transparent'}`, background:child.id===c.id ? `${c.accent}12` : 'transparent', cursor:'pointer', marginBottom:6, textAlign:'left', transition:'all 0.15s' }}>
                  <div style={{ width:30, height:30, borderRadius:'50%', background:c.accent, display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:800, fontSize:13, flexShrink:0 }}>
                    {c.name[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight:800, fontSize:14, color:PARENT_COLORS.text }}>{c.name}</div>
                    <div style={{ fontSize:11, color:PARENT_COLORS.textMuted }}>{GRADE_LABELS[c.grade]}</div>
                  </div>
                  {child.id===c.id && <div style={{ marginLeft:'auto', width:8, height:8, borderRadius:'50%', background:c.accent }}/>}
                </button>
              ))}
            </div>

            {/* Subject picker */}
            <div style={{ background:PARENT_COLORS.card, borderRadius:16, border:`1px solid ${PARENT_COLORS.border}`, padding:16 }}>
              <div style={{ fontSize:11, fontWeight:800, color:PARENT_COLORS.textMuted, letterSpacing:'0.08em', marginBottom:10, textTransform:'uppercase' }}>
                {lang==='en' ? 'Subject' : 'מקצוע'}
              </div>
              {SUBJECTS.map(s => (
                <button key={s.slug} onClick={() => setSubject(s)}
                  style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:12, border:`2px solid ${subj.slug===s.slug ? s.color : 'transparent'}`, background:subj.slug===s.slug ? s.light : 'transparent', cursor:'pointer', marginBottom:6, textAlign:'left', transition:'all 0.15s' }}>
                  <span style={{ fontSize:20 }}>{s.icon}</span>
                  <span style={{ fontWeight:800, fontSize:14, color:subj.slug===s.slug ? s.color : PARENT_COLORS.textSecondary }}>
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
            <div style={{ background:PARENT_COLORS.card, borderRadius:16, border:`1px solid ${PARENT_COLORS.border}`, padding:16 }}>
              <div style={{ fontSize:11, fontWeight:800, color:PARENT_COLORS.textMuted, letterSpacing:'0.08em', marginBottom:10, textTransform:'uppercase' }}>
                {lang==='en' ? 'Grades' : 'כיתות'}
              </div>
              {[0,1,2,3,4,5,6].map(g => {
                const gc = CHILDREN.find(c => c.grade === g)
                const active = selectedGrade === g
                return (
                  <button key={g} onClick={() => setGrade(g)}
                    style={{ width:'100%', display:'flex', alignItems:'center', gap:8, padding:'8px 10px', borderRadius:10, border:'none', background:active ? subj.light : 'transparent', cursor:'pointer', marginBottom:3, textAlign:'left' }}>
                    {gc ? (
                      <span style={{ width:8, height:8, borderRadius:'50%', background:gc.accent, flexShrink:0 }}/>
                    ) : (
                      <span style={{ width:8, height:8, borderRadius:'50%', background:PARENT_COLORS.borderLight, flexShrink:0 }}/>
                    )}
                    <span style={{ fontSize:12, fontWeight:active?800:600, color:active ? subj.color : PARENT_COLORS.textSecondary }}>
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
                <div style={{ fontFamily:PARENT_FONTS.heading, fontWeight:800, fontSize:17, color:'white', marginBottom:4 }}>
                  {lang==='en' ? `${GRADE_LABELS[selectedGrade]} · ${subj.label}` : `${GRADE_LABELS_HE[selectedGrade]} · ${subj.labelHe}`}
                </div>
                <div style={{ fontSize:13, color:'rgba(255,255,255,0.85)' }}>
                  {topics.length} {lang==='en' ? 'topics' : 'נושאים'}
                  {child && ` · ${lang==='en' ? `Starting as ${child.name}` : `מתחיל בשם ${child.name}`}`}
                </div>
              </div>
              <button onClick={() => go(topics[0]?.id)} disabled={topics.length===0}
                style={{ display:'flex', alignItems:'center', gap:7, padding:'11px 24px', borderRadius:50, border:'2px solid rgba(255,255,255,0.45)', background:'rgba(255,255,255,0.2)', color:'white', fontWeight:800, fontSize:14, cursor:'pointer', whiteSpace:'nowrap', backdropFilter:'blur(4px)' }}>
                <Play size={14} /> {lang==='en' ? 'Start' : 'התחל'}
              </button>
            </div>

            {/* Topics */}
            {loading ? (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(270px,1fr))', gap:14 }}>
                {[1,2,3,4,5,6].map(i => <div key={i} style={{ height:110, background:PARENT_COLORS.card, borderRadius:14, border:`1px solid ${PARENT_COLORS.border}`, opacity:0.6, animation:'pulse 1.5s ease infinite' }}/>)}
              </div>
            ) : topics.length === 0 ? (
              <div style={{ textAlign:'center', padding:'56px 24px', background:PARENT_COLORS.card, borderRadius:20, border:`1px solid ${PARENT_COLORS.border}` }}>
                <div style={{ width:64, height:64, borderRadius:18, background:PARENT_COLORS.primaryLight, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
                  <Inbox size={30} color={PARENT_COLORS.primary} />
                </div>
                <div style={{ fontFamily:PARENT_FONTS.heading, fontWeight:800, fontSize:20, color:PARENT_COLORS.text, marginBottom:8 }}>{lang==='en' ? 'No topics yet' : 'אין נושאים עדיין'}</div>
                <div style={{ fontSize:14, color:PARENT_COLORS.textMuted }}>{lang==='en' ? 'Topics for this grade are coming soon!' : 'נושאים לכיתה זו יתווספו בקרוב!'}</div>
              </div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(270px,1fr))', gap:14 }}>
                {topics.map((topic, i) => (
                  <div key={topic.id}
                    onClick={() => go(topic.id)}
                    onMouseEnter={() => setHovered(topic.id)}
                    onMouseLeave={() => setHovered(null)}
                    style={{ background:PARENT_COLORS.card, borderRadius:16, border:`2px solid ${hovered===topic.id ? subj.color : PARENT_COLORS.border}`, padding:'16px 18px', cursor:'pointer', position:'relative', overflow:'hidden', boxShadow:hovered===topic.id ? `0 8px 24px ${subj.color}25` : 'none', transform:hovered===topic.id ? 'translateY(-2px)' : 'none', transition:'all 0.15s ease' }}>
                    <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${subj.color},${subj.color}66)` }}/>
                    <div style={{ display:'flex', alignItems:'flex-start', gap:12, paddingTop:6 }}>
                      <div style={{ width:36, height:36, borderRadius:10, background:subj.light, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:14, color:subj.color, flexShrink:0 }}>{i+1}</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:800, fontSize:14, color:PARENT_COLORS.text, marginBottom:4, lineHeight:1.3 }}>
                          {lang==='en' ? topic.title_en : (topic.title_he || topic.title_en)}
                        </div>
                        {topic.description_en && (
                          <div style={{ fontSize:12, color:PARENT_COLORS.textSecondary, lineHeight:1.5, marginBottom:10 }}>
                            {lang==='en' ? topic.description_en : (topic.description_he || topic.description_en)}
                          </div>
                        )}
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <span style={{ fontSize:11, fontWeight:800, background:subj.light, color:subj.color, padding:'3px 10px', borderRadius:50 }}>+{topic.xp_reward} XP</span>
                          <span style={{ fontSize:11, color:PARENT_COLORS.textMuted, fontWeight:600 }}>{topic.lesson_count} {lang==='en'?'lessons':'שיעורים'}</span>
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
