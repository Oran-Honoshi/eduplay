'use client'
import { useState, useEffect } from 'react'

const GRADE_LABELS: any = {
  0: 'Kindergarten',
  1: 'Grade 1',
  2: 'Grade 2',
  3: 'Grade 3',
  4: 'Grade 4',
  5: 'Grade 5',
  6: 'Grade 6',
}

const GRADE_LABELS_HE: any = {
  0: 'גן חובה',
  1: 'כיתה א׳',
  2: 'כיתה ב׳',
  3: 'כיתה ג׳',
  4: 'כיתה ד׳',
  5: 'כיתה ה׳',
  6: 'כיתה ו׳',
}

const SUBJECTS = [
  { slug: 'math',    label: 'Mathematics', labelHe: 'מתמטיקה', icon: '📐', color: '#4A7FD4' },
  { slug: 'english', label: 'English',     labelHe: 'אנגלית',  icon: '📖', color: '#2EC4B6' },
  { slug: 'hebrew',  label: 'Hebrew',      labelHe: 'עברית',   icon: '🇮🇱', color: '#FF6B6B' },
]

const CHILDREN = [
  { id: '22222222-2222-2222-2222-222222222001', name: 'Lia',   grade: 6, emoji: '🐱' },
  { id: '22222222-2222-2222-2222-222222222002', name: 'Tamar', grade: 4, emoji: '🐻' },
  { id: '22222222-2222-2222-2222-222222222003', name: 'Tom',   grade: 0, emoji: '🦊' },
]

export default function CurriculumPage() {
  const [selectedGrade,   setSelectedGrade]   = useState(4)
  const [selectedSubject, setSelectedSubject] = useState(SUBJECTS[0])
  const [topics,          setTopics]          = useState<any[]>([])
  const [loading,         setLoading]         = useState(false)
  const [langMode,        setLangMode]        = useState<'en'|'he'>('en')

  useEffect(() => { loadTopics() }, [selectedGrade, selectedSubject])

  async function loadTopics() {
    setLoading(true)
    try {
      const res  = await fetch(`/api/topics?grade=${selectedGrade}&subject=${selectedSubject.slug}`)
      const data = await res.json()
      setTopics(data.topics || [])
    } catch {
      setTopics([])
    } finally {
      setLoading(false)
    }
  }

  const childForGrade = CHILDREN.find(c => c.grade === selectedGrade)

  return (
    <div style={{ minHeight:'100vh', background:'#F8F9FB', fontFamily:'"Nunito Sans",sans-serif' }}>

      {/* Header */}
      <header style={{ background:'white', borderBottom:'1px solid #EEF1F6', padding:'0 24px', height:'58px', display:'flex', alignItems:'center', justifyContent:'space-between', boxShadow:'0 2px 8px rgba(30,45,78,0.07)', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'8px', fontFamily:'"Nunito",sans-serif', fontWeight:900, fontSize:'20px', color:'#1E2D4E' }}>
          <div style={{ width:'30px', height:'30px', background:'linear-gradient(135deg,#4A7FD4,#2EC4B6)', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'15px' }}>🦔</div>
          Edu<span style={{ color:'#4A7FD4' }}>Play</span>
          <span style={{ fontSize:'13px', fontWeight:700, color:'#9AA5B8' }}>· Curriculum</span>
        </div>
        <div style={{ display:'flex', gap:'8px' }}>
          <button onClick={() => setLangMode(l => l==='en'?'he':'en')} style={{ padding:'6px 14px', borderRadius:'50px', border:'1px solid #EEF1F6', background:'white', fontWeight:700, fontSize:'12px', cursor:'pointer', color:'#4B5563' }}>
            {langMode==='en'?'🇮🇱 עברית':'🇺🇸 English'}
          </button>
          <button onClick={() => window.location.href='/dashboard'} style={{ padding:'6px 14px', borderRadius:'50px', border:'1px solid #EEF1F6', background:'white', fontWeight:700, fontSize:'13px', cursor:'pointer', color:'#4B5563' }}>← Dashboard</button>
        </div>
      </header>

      <div style={{ maxWidth:'1000px', margin:'0 auto', padding:'28px 24px' }}>

        <h1 style={{ fontFamily:'"Nunito",sans-serif', fontWeight:900, fontSize:'24px', color:'#1E2D4E', marginBottom:'4px' }}>
          📚 {langMode==='en'?'Curriculum Browser':'מפה מקצועית'}
        </h1>
        <p style={{ color:'#5A6A7E', marginBottom:'24px', fontSize:'14px' }}>
          {langMode==='en'
            ? 'Explore all topics by grade and subject. See what your child is learning.'
            : 'גלה את כל הנושאים לפי כיתה ומקצוע. ראה מה הילד שלך לומד.'}
        </p>

        {/* Subject selector */}
        <div style={{ display:'flex', gap:'10px', marginBottom:'20px', flexWrap:'wrap' }}>
          {SUBJECTS.map(subj => (
            <button key={subj.slug} onClick={() => setSelectedSubject(subj)}
              style={{ padding:'10px 20px', borderRadius:'50px', border:`2px solid ${selectedSubject.slug===subj.slug?subj.color:'#EEF1F6'}`, background:selectedSubject.slug===subj.slug?`${subj.color}15`:'white', color:selectedSubject.slug===subj.slug?subj.color:'#5A6A7E', fontWeight:800, fontSize:'14px', cursor:'pointer', display:'flex', alignItems:'center', gap:'6px' }}>
              {subj.icon} {langMode==='en'?subj.label:subj.labelHe}
            </button>
          ))}
        </div>

        {/* Grade selector */}
        <div style={{ display:'flex', gap:'6px', marginBottom:'24px', flexWrap:'wrap' }}>
          {[0,1,2,3,4,5,6].map(grade => {
            const child = CHILDREN.find(c => c.grade === grade)
            return (
              <button key={grade} onClick={() => setSelectedGrade(grade)}
                style={{ padding:'8px 16px', borderRadius:'50px', border:`2px solid ${selectedGrade===grade?selectedSubject.color:'#EEF1F6'}`, background:selectedGrade===grade?`${selectedSubject.color}15`:'white', color:selectedGrade===grade?selectedSubject.color:'#5A6A7E', fontWeight:800, fontSize:'12px', cursor:'pointer', display:'flex', alignItems:'center', gap:'5px' }}>
                {child && <span>{child.emoji}</span>}
                {langMode==='en'?GRADE_LABELS[grade]:GRADE_LABELS_HE[grade]}
              </button>
            )
          })}
        </div>

        {/* Child indicator */}
        {childForGrade && (
          <div style={{ background:'white', border:`1px solid #EEF1F6`, borderRadius:'12px', padding:'12px 16px', marginBottom:'20px', display:'flex', alignItems:'center', gap:'12px', boxShadow:'0 2px 8px rgba(30,45,78,0.07)' }}>
            <span style={{ fontSize:'28px' }}>{childForGrade.emoji}</span>
            <div>
              <div style={{ fontWeight:800, fontSize:'14px', color:'#1E2D4E' }}>
                {childForGrade.name} {langMode==='en'?'is in this grade':'לומד/ת בכיתה זו'}
              </div>
              <div style={{ fontSize:'12px', color:'#9AA5B8' }}>
                {langMode==='en'
                  ? `${topics.length} topics available for ${GRADE_LABELS[selectedGrade]}`
                  : `${topics.length} נושאים זמינים ל${GRADE_LABELS_HE[selectedGrade]}`}
              </div>
            </div>
            <button onClick={() => {
  const firstTopic = topics[0]
  const url = firstTopic 
    ? `/lesson?childId=${childForGrade.id}&topicId=${firstTopic.id}`
    : `/lesson?childId=${childForGrade.id}`
  window.location.href = url
}}
              style={{ marginLeft:'auto', padding:'8px 18px', borderRadius:'50px', border:'none', background:selectedSubject.color, color:'white', fontWeight:800, fontSize:'12px', cursor:'pointer' }}>
              ▶ {langMode==='en'?'Start Lesson':'התחל שיעור'}
            </button>
          </div>
        )}

        {/* Topics grid */}
        {loading ? (
          <div style={{ textAlign:'center', padding:'40px', color:'#9AA5B8' }}>Loading topics...</div>
        ) : topics.length === 0 ? (
          <div style={{ textAlign:'center', padding:'40px', background:'white', borderRadius:'16px', border:'1px solid #EEF1F6' }}>
            <div style={{ fontSize:'40px', marginBottom:'12px' }}>📭</div>
            <div style={{ fontWeight:800, fontSize:'16px', color:'#1E2D4E', marginBottom:'6px' }}>
              {langMode==='en'?'No topics yet':'אין נושאים עדיין'}
            </div>
            <div style={{ fontSize:'13px', color:'#9AA5B8' }}>
              {langMode==='en'
                ? `${langMode==='en'?GRADE_LABELS[selectedGrade]:GRADE_LABELS_HE[selectedGrade]} ${selectedSubject.label} topics are coming soon!`
                : 'נושאים אלו יתווספו בקרוב!'}
            </div>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:'14px' }}>
            {topics.map((topic, i) => (
              <div key={topic.id} 
  onClick={() => childForGrade && (window.location.href = `/lesson?childId=${childForGrade.id}&topicId=${topic.id}`)}
  style={{ background:'white', border:'1px solid #EEF1F6', borderRadius:'14px', padding:'16px', boxShadow:'0 2px 8px rgba(30,45,78,0.07)', position:'relative', overflow:'hidden', cursor:childForGrade?'pointer':'default' }}>
                <div style={{ position:'absolute', top:0, left:0, right:0, height:'3px', background:selectedSubject.color }}/>
                <div style={{ display:'flex', alignItems:'flex-start', gap:'10px' }}>
                  <div style={{ width:'32px', height:'32px', background:`${selectedSubject.color}20`, borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'"Nunito",sans-serif', fontWeight:900, fontSize:'13px', color:selectedSubject.color, flexShrink:0 }}>
                    {i+1}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:800, fontSize:'14px', color:'#1E2D4E', marginBottom:'3px' }}>
                      {langMode==='en' ? topic.title_en : (topic.title_he || topic.title_en)}
                    </div>
                    {topic.description_en && (
                      <div style={{ fontSize:'12px', color:'#5A6A7E', lineHeight:1.5, marginBottom:'8px' }}>
                        {langMode==='en' ? topic.description_en : (topic.description_he || topic.description_en)}
                      </div>
                    )}
                    <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                      <span style={{ fontSize:'11px', fontWeight:800, background:`${selectedSubject.color}15`, color:selectedSubject.color, padding:'2px 9px', borderRadius:'50px' }}>
                        +{topic.xp_reward} XP
                      </span>
                      <span style={{ fontSize:'11px', color:'#9AA5B8' }}>
                        {topic.lesson_count} {langMode==='en'?'lessons':'שיעורים'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Full curriculum overview */}
        <div style={{ marginTop:'32px', background:'white', border:'1px solid #EEF1F6', borderRadius:'16px', padding:'20px', boxShadow:'0 2px 8px rgba(30,45,78,0.07)' }}>
          <h2 style={{ fontFamily:'"Nunito",sans-serif', fontWeight:900, fontSize:'16px', color:'#1E2D4E', marginBottom:'16px' }}>
            🗺️ {langMode==='en'?'Full Curriculum Overview':'סקירת תכנית לימודים מלאה'}
          </h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'8px' }}>
            {[0,1,2,3,4,5,6].map(grade => {
              const child = CHILDREN.find(c => c.grade === grade)
              return (
                <div key={grade} onClick={() => setSelectedGrade(grade)}
                  style={{ padding:'10px 8px', borderRadius:'10px', border:`2px solid ${selectedGrade===grade?selectedSubject.color:'#EEF1F6'}`, background:selectedGrade===grade?`${selectedSubject.color}10`:'#F8F9FB', cursor:'pointer', textAlign:'center' }}>
                  {child && <div style={{ fontSize:'18px', marginBottom:'3px' }}>{child.emoji}</div>}
                  <div style={{ fontSize:'10px', fontWeight:800, color:selectedGrade===grade?selectedSubject.color:'#5A6A7E' }}>
                    {langMode==='en'?GRADE_LABELS[grade]:GRADE_LABELS_HE[grade]}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
