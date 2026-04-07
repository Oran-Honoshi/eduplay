'use client'
import { useState, useEffect, Suspense } from 'react'

const CHILDREN = [
  { id: '22222222-2222-2222-2222-222222222001', name: 'Lia',   grade: 6, emoji: '🐱' },
  { id: '22222222-2222-2222-2222-222222222002', name: 'Tamar', grade: 4, emoji: '🐻' },
  { id: '22222222-2222-2222-2222-222222222003', name: 'Tom',   grade: 0, emoji: '🦊' },
]

const SUBJECTS = [
  { slug: 'math',    label: 'Mathematics', labelHe: 'מתמטיקה', icon: '📐', color: '#4A7FD4' },
  { slug: 'english', label: 'English',     labelHe: 'אנגלית',  icon: '📖', color: '#2EC4B6' },
  { slug: 'hebrew',  label: 'Hebrew',      labelHe: 'עברית',   icon: '🇮🇱', color: '#FF6B6B' },
]

const DIFF_COLORS: any = {
  easy:   { bg: '#EAFAF1', color: '#27AE60' },
  medium: { bg: '#FFF8EC', color: '#F5A623' },
  hard:   { bg: '#FEECEC', color: '#EF4444' },
}

function Fraction({ value }: { value: string }) {
  if (!value) return null
  const parts = value.match(/^(\d+)\/(\d+)$/)
  if (!parts) return <span>{value}</span>
  return (
    <span style={{ display:'inline-flex', flexDirection:'column', alignItems:'center', verticalAlign:'middle', margin:'0 2px', fontFamily:'Georgia,serif', lineHeight:1 }}>
      <span style={{ fontSize:12, fontWeight:700 }}>{parts[1]}</span>
      <span style={{ display:'block', width:'100%', minWidth:14, height:1, background:'currentColor', margin:'1px 0' }}/>
      <span style={{ fontSize:12, fontWeight:700 }}>{parts[2]}</span>
    </span>
  )
}

function WorksheetBuilder() {
  const [selectedChild,   setSelectedChild]   = useState(CHILDREN[1])
  const [selectedSubject, setSelectedSubject] = useState(SUBJECTS[0])
  const [topics,          setTopics]          = useState<any[]>([])
  const [selectedTopics,  setSelectedTopics]  = useState<string[]>([])
  const [difficulty,      setDifficulty]      = useState('mixed')
  const [questionCount,   setQuestionCount]   = useState(20)
  const [langMode,        setLangMode]        = useState('bilingual')
  const [answerKey,       setAnswerKey]       = useState(false)
  const [includeHints,    setIncludeHints]    = useState(false)
  const [solutionSteps,   setSolutionSteps]   = useState(false)
  const [wsType,          setWsType]          = useState('practice')
  const [loadingTopics,   setLoadingTopics]   = useState(false)
  const [loadingPreview,  setLoadingPreview]  = useState(false)
  const [generating,      setGenerating]      = useState(false)

  // Preview state
  const [previewQuestions, setPreviewQuestions] = useState<any[]>([])
  const [selectedQIds,     setSelectedQIds]     = useState<string[]>([])
  const [showPreview,      setShowPreview]      = useState(false)

  useEffect(() => { loadTopics() }, [selectedChild, selectedSubject])

  async function loadTopics() {
    setLoadingTopics(true)
    setSelectedTopics([])
    setShowPreview(false)
    setPreviewQuestions([])
    try {
      const res  = await fetch(`/api/topics?grade=${selectedChild.grade}&subject=${selectedSubject.slug}`)
      const data = await res.json()
      setTopics(data.topics || [])
      setSelectedTopics((data.topics || []).map((t: any) => t.id))
    } catch {
      setTopics([])
    } finally {
      setLoadingTopics(false)
    }
  }

  function toggleTopic(id: string) {
    setSelectedTopics(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id])
  }

  function toggleAllTopics() {
    setSelectedTopics(selectedTopics.length === topics.length ? [] : topics.map(t => t.id))
  }

  async function loadPreview() {
    if (selectedTopics.length === 0) return
    setLoadingPreview(true)
    setShowPreview(false)
    try {
      const params = new URLSearchParams({
        childId:       selectedChild.id,
        topicIds:      selectedTopics.join(','),
        difficulty,
        questionCount: questionCount.toString(),
        lang:          langMode,
        preview:       'true',
      })
      const res  = await fetch(`/api/worksheets/builder?${params}`)
      const data = await res.json()
      setPreviewQuestions(data.questions || [])
      setSelectedQIds((data.questions || []).map((q: any) => q.id))
      setShowPreview(true)
    } catch {
    } finally {
      setLoadingPreview(false)
    }
  }

  function toggleQuestion(id: string) {
    setSelectedQIds(prev => prev.includes(id) ? prev.filter(q => q !== id) : [...prev, id])
  }

  function toggleAllQuestions() {
    setSelectedQIds(selectedQIds.length === previewQuestions.length
      ? [] : previewQuestions.map(q => q.id))
  }

  function generate() {
    if (selectedQIds.length === 0) return
    setGenerating(true)
    const params = new URLSearchParams({
      childId:       selectedChild.id,
      topicIds:      selectedTopics.join(','),
      questionIds:   selectedQIds.join(','),
      difficulty,
      questionCount: questionCount.toString(),
      lang:          langMode,
      answerKey:     answerKey.toString(),
      includeHints:  includeHints.toString(),
      solutionSteps: solutionSteps.toString(),
      wsType,
    })
    window.open(`/api/worksheets/builder?${params}`, '_blank')
    setTimeout(() => setGenerating(false), 2000)
  }

  const S = { background:'white', fontFamily:'"Nunito Sans",sans-serif', minHeight:'100vh' }

  return (
    <div style={S}>
      {/* Header */}
      <header style={{ background:'white', borderBottom:'1px solid #EEF1F6', padding:'0 24px', height:'58px', display:'flex', alignItems:'center', justifyContent:'space-between', boxShadow:'0 2px 8px rgba(30,45,78,0.07)', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'8px', fontFamily:'"Nunito",sans-serif', fontWeight:900, fontSize:'20px', color:'#1E2D4E' }}>
          <div style={{ width:'30px', height:'30px', background:'linear-gradient(135deg,#4A7FD4,#2EC4B6)', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'15px' }}>🦔</div>
          Edu<span style={{ color:'#4A7FD4' }}>Play</span>
          <span style={{ fontSize:'13px', fontWeight:700, color:'#9AA5B8' }}>· Worksheet Builder</span>
        </div>
        <button onClick={() => window.location.href='/dashboard'} style={{ padding:'7px 16px', borderRadius:'50px', border:'1px solid #EEF1F6', background:'white', fontWeight:700, fontSize:'13px', cursor:'pointer', color:'#4B5563' }}>← Dashboard</button>
      </header>

      <div style={{ maxWidth:'1100px', margin:'0 auto', padding:'28px 24px' }}>
        <h1 style={{ fontFamily:'"Nunito",sans-serif', fontWeight:900, fontSize:'24px', color:'#1E2D4E', marginBottom:'6px' }}>🖨️ Worksheet Builder</h1>
        <p style={{ color:'#5A6A7E', marginBottom:'28px', fontSize:'14px' }}>Build a custom worksheet — preview questions, select what to include, then generate.</p>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:'22px', alignItems:'start' }}>

          {/* Left */}
          <div style={{ display:'flex', flexDirection:'column', gap:'18px' }}>

            {/* Step 1 — Child */}
            <div style={{ background:'white', border:'1px solid #EEF1F6', borderRadius:'16px', padding:'18px', boxShadow:'0 2px 8px rgba(30,45,78,0.07)' }}>
              <div style={{ fontFamily:'"Nunito",sans-serif', fontWeight:800, fontSize:'14px', color:'#1E2D4E', marginBottom:'12px', display:'flex', alignItems:'center', gap:'8px' }}>
                <div style={{ width:'24px', height:'24px', background:'#EBF2FF', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:900, color:'#4A7FD4' }}>1</div>
                Child
              </div>
              <div style={{ display:'flex', gap:'10px' }}>
                {CHILDREN.map(child => (
                  <div key={child.id} onClick={() => setSelectedChild(child)}
                    style={{ flex:1, padding:'11px', border:`2px solid ${selectedChild.id===child.id?'#4A7FD4':'#EEF1F6'}`, borderRadius:'12px', textAlign:'center', cursor:'pointer', background:selectedChild.id===child.id?'#EBF2FF':'white', transition:'all 0.15s' }}>
                    <div style={{ fontSize:'26px', marginBottom:'3px' }}>{child.emoji}</div>
                    <div style={{ fontWeight:800, fontSize:'13px', color:'#1E2D4E' }}>{child.name}</div>
                    <div style={{ fontSize:'11px', color:'#9AA5B8' }}>Grade {child.grade}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 2 — Subject */}
            <div style={{ background:'white', border:'1px solid #EEF1F6', borderRadius:'16px', padding:'18px', boxShadow:'0 2px 8px rgba(30,45,78,0.07)' }}>
              <div style={{ fontFamily:'"Nunito",sans-serif', fontWeight:800, fontSize:'14px', color:'#1E2D4E', marginBottom:'12px', display:'flex', alignItems:'center', gap:'8px' }}>
                <div style={{ width:'24px', height:'24px', background:'#EBF2FF', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:900, color:'#4A7FD4' }}>2</div>
                Subject
              </div>
              <div style={{ display:'flex', gap:'10px' }}>
                {SUBJECTS.map(subj => (
                  <div key={subj.slug} onClick={() => setSelectedSubject(subj)}
                    style={{ flex:1, padding:'11px', border:`2px solid ${selectedSubject.slug===subj.slug?subj.color:'#EEF1F6'}`, borderRadius:'12px', textAlign:'center', cursor:'pointer', background:selectedSubject.slug===subj.slug?`${subj.color}15`:'white', transition:'all 0.15s' }}>
                    <div style={{ fontSize:'24px', marginBottom:'3px' }}>{subj.icon}</div>
                    <div style={{ fontWeight:800, fontSize:'12px', color:'#1E2D4E' }}>{subj.label}</div>
                    <div style={{ fontSize:'10px', color:'#9AA5B8', direction:'rtl' }}>{subj.labelHe}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 3 — Topics */}
            <div style={{ background:'white', border:'1px solid #EEF1F6', borderRadius:'16px', padding:'18px', boxShadow:'0 2px 8px rgba(30,45,78,0.07)' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
                <div style={{ fontFamily:'"Nunito",sans-serif', fontWeight:800, fontSize:'14px', color:'#1E2D4E', display:'flex', alignItems:'center', gap:'8px' }}>
                  <div style={{ width:'24px', height:'24px', background:'#EBF2FF', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:900, color:'#4A7FD4' }}>3</div>
                  Topics
                </div>
                <button onClick={toggleAllTopics} style={{ padding:'3px 11px', borderRadius:'50px', border:'1px solid #EEF1F6', background:'white', fontSize:'11px', fontWeight:700, cursor:'pointer', color:'#4B5563' }}>
                  {selectedTopics.length === topics.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              {loadingTopics ? (
                <div style={{ textAlign:'center', padding:'16px', color:'#9AA5B8', fontSize:'13px' }}>Loading...</div>
              ) : topics.length === 0 ? (
                <div style={{ textAlign:'center', padding:'16px', color:'#9AA5B8', fontSize:'13px' }}>No topics found for Grade {selectedChild.grade} {selectedSubject.label}.</div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                  {topics.map(topic => (
                    <div key={topic.id} onClick={() => toggleTopic(topic.id)}
                      style={{ display:'flex', alignItems:'center', gap:'10px', padding:'9px 12px', border:`1.5px solid ${selectedTopics.includes(topic.id)?selectedSubject.color:'#EEF1F6'}`, borderRadius:'9px', cursor:'pointer', background:selectedTopics.includes(topic.id)?`${selectedSubject.color}10`:'white', transition:'all 0.12s' }}>
                      <div style={{ width:'18px', height:'18px', border:`2px solid ${selectedTopics.includes(topic.id)?selectedSubject.color:'#DEE2E6'}`, borderRadius:'4px', background:selectedTopics.includes(topic.id)?selectedSubject.color:'white', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        {selectedTopics.includes(topic.id) && <span style={{ color:'white', fontSize:'11px', fontWeight:900 }}>✓</span>}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:700, fontSize:'13px', color:'#1E2D4E' }}>{topic.title_en}</div>
                        {topic.title_he && <div style={{ fontSize:'11px', color:'#9AA5B8', direction:'rtl', textAlign:'right' }}>{topic.title_he}</div>}
                      </div>
                      <div style={{ fontSize:'11px', color:'#9AA5B8', fontWeight:700 }}>+{topic.xp_reward}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Step 4 — Options */}
            <div style={{ background:'white', border:'1px solid #EEF1F6', borderRadius:'16px', padding:'18px', boxShadow:'0 2px 8px rgba(30,45,78,0.07)' }}>
              <div style={{ fontFamily:'"Nunito",sans-serif', fontWeight:800, fontSize:'14px', color:'#1E2D4E', marginBottom:'14px', display:'flex', alignItems:'center', gap:'8px' }}>
                <div style={{ width:'24px', height:'24px', background:'#EBF2FF', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:900, color:'#4A7FD4' }}>4</div>
                Options
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
                <div>
                  <div style={{ fontSize:'11px', fontWeight:800, color:'#5A6A7E', marginBottom:'7px', textTransform:'uppercase', letterSpacing:'.5px' }}>Type</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
                    {[
                      { id:'practice', label:'📝 Practice', desc:'With hints & examples' },
                      { id:'quiz',     label:'✅ Quiz',     desc:'Questions only' },
                      { id:'exam',     label:'🎓 Exam',     desc:'Full coverage' },
                    ].map(t => (
                      <div key={t.id} onClick={() => setWsType(t.id)}
                        style={{ padding:'7px 11px', border:`2px solid ${wsType===t.id?'#4A7FD4':'#EEF1F6'}`, borderRadius:'8px', cursor:'pointer', background:wsType===t.id?'#EBF2FF':'white' }}>
                        <div style={{ fontWeight:700, fontSize:'12px', color:'#1E2D4E' }}>{t.label}</div>
                        <div style={{ fontSize:'10px', color:'#9AA5B8' }}>{t.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                  <div>
                    <div style={{ fontSize:'11px', fontWeight:800, color:'#5A6A7E', marginBottom:'7px', textTransform:'uppercase', letterSpacing:'.5px' }}>Difficulty</div>
                    <div style={{ display:'flex', gap:'5px', flexWrap:'wrap' }}>
                      {[
                        { id:'easy',   label:'Easy',   color:'#27AE60' },
                        { id:'medium', label:'Medium', color:'#F5A623' },
                        { id:'hard',   label:'Hard',   color:'#EF4444' },
                        { id:'mixed',  label:'Mixed',  color:'#8B5CF6' },
                      ].map(d => (
                        <button key={d.id} onClick={() => setDifficulty(d.id)}
                          style={{ padding:'5px 10px', borderRadius:'50px', border:`2px solid ${difficulty===d.id?d.color:'#EEF1F6'}`, background:difficulty===d.id?`${d.color}20`:'white', color:difficulty===d.id?d.color:'#6B7A8D', fontWeight:800, fontSize:'11px', cursor:'pointer' }}>
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize:'11px', fontWeight:800, color:'#5A6A7E', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'.5px' }}>
                      Questions: <span style={{ color:'#4A7FD4' }}>{questionCount}</span>
                    </div>
                    <input type="range" min={10} max={30} step={1} value={questionCount}
                      onChange={e => setQuestionCount(parseInt(e.target.value))}
                      style={{ width:'100%', accentColor:'#4A7FD4' }}/>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:'10px', color:'#9AA5B8', marginTop:'3px' }}>
                      <span>10</span><span>30</span>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize:'11px', fontWeight:800, color:'#5A6A7E', marginBottom:'7px', textTransform:'uppercase', letterSpacing:'.5px' }}>Language</div>
                    <div style={{ display:'flex', gap:'5px' }}>
                      {[
                        { id:'en_only',   label:'🇺🇸 EN' },
                        { id:'bilingual', label:'🌐 Both' },
                        { id:'he_only',   label:'🇮🇱 HE' },
                      ].map(l => (
                        <button key={l.id} onClick={() => setLangMode(l.id)}
                          style={{ flex:1, padding:'5px 7px', borderRadius:'7px', border:`2px solid ${langMode===l.id?'#4A7FD4':'#EEF1F6'}`, background:langMode===l.id?'#EBF2FF':'white', color:langMode===l.id?'#4A7FD4':'#6B7A8D', fontWeight:700, fontSize:'11px', cursor:'pointer' }}>
                          {l.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Toggles */}
                  {[
                    { label:'Answer Key',     desc:'Answers at end',              val:answerKey,      set:setAnswerKey,      color:'#4A7FD4' },
                    { label:'Include Hints',  desc:'Hint below each question',    val:includeHints,   set:setIncludeHints,   color:'#F5A623' },
                    { label:'Solution Steps', desc:'Full steps at end',           val:solutionSteps,  set:setSolutionSteps,  color:'#27AE60' },
                  ].map(tog => (
                    <div key={tog.label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 11px', background:'#F8F9FB', borderRadius:'8px' }}>
                      <div>
                        <div style={{ fontWeight:700, fontSize:'12px', color:'#1E2D4E' }}>{tog.label}</div>
                        <div style={{ fontSize:'10px', color:'#9AA5B8' }}>{tog.desc}</div>
                      </div>
                      <div onClick={() => tog.set((v: boolean) => !v)}
                        style={{ width:'40px', height:'22px', borderRadius:'11px', background:tog.val?tog.color:'#DEE2E6', cursor:'pointer', position:'relative', transition:'background 0.2s', flexShrink:0 }}>
                        <div style={{ position:'absolute', top:'3px', left:tog.val?'21px':'3px', width:'16px', height:'16px', borderRadius:'50%', background:'white', transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }}/>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Step 5 — Preview questions */}
            <div style={{ background:'white', border:'1px solid #EEF1F6', borderRadius:'16px', padding:'18px', boxShadow:'0 2px 8px rgba(30,45,78,0.07)' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'14px' }}>
                <div style={{ fontFamily:'"Nunito",sans-serif', fontWeight:800, fontSize:'14px', color:'#1E2D4E', display:'flex', alignItems:'center', gap:'8px' }}>
                  <div style={{ width:'24px', height:'24px', background:'#EBF2FF', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:900, color:'#4A7FD4' }}>5</div>
                  Preview & Select Questions
                </div>
                <button onClick={loadPreview} disabled={loadingPreview || selectedTopics.length===0}
                  style={{ padding:'7px 16px', borderRadius:'50px', border:'none', background:selectedTopics.length===0?'#DEE2E6':'#4A7FD4', color:'white', fontWeight:800, fontSize:'12px', cursor:selectedTopics.length===0?'not-allowed':'pointer' }}>
                  {loadingPreview ? 'Loading...' : '👁️ Preview Questions'}
                </button>
              </div>

              {!showPreview && !loadingPreview && (
                <div style={{ textAlign:'center', padding:'20px', color:'#9AA5B8', fontSize:'13px', background:'#F8F9FB', borderRadius:'10px' }}>
                  Click "Preview Questions" to see candidate questions and choose which to include.
                </div>
              )}

              {showPreview && previewQuestions.length > 0 && (
                <>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'10px' }}>
                    <div style={{ fontSize:'13px', color:'#5A6A7E', fontWeight:700 }}>
                      {selectedQIds.length} of {previewQuestions.length} selected
                      {selectedQIds.length > questionCount && (
                        <span style={{ color:'#EF4444', marginLeft:'8px' }}>⚠️ Max {questionCount}</span>
                      )}
                    </div>
                    <button onClick={toggleAllQuestions} style={{ padding:'3px 11px', borderRadius:'50px', border:'1px solid #EEF1F6', background:'white', fontSize:'11px', fontWeight:700, cursor:'pointer', color:'#4B5563' }}>
                      {selectedQIds.length===previewQuestions.length?'Deselect All':'Select All'}
                    </button>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:'6px', maxHeight:'400px', overflowY:'auto' }}>
                    {previewQuestions.map((q, i) => {
                      const isSelected = selectedQIds.includes(q.id)
                      const dc = DIFF_COLORS[q.difficulty] || DIFF_COLORS.medium
                      return (
                        <div key={q.id} onClick={() => toggleQuestion(q.id)}
                          style={{ display:'flex', alignItems:'flex-start', gap:'10px', padding:'10px 12px', border:`1.5px solid ${isSelected?'#4A7FD4':'#EEF1F6'}`, borderRadius:'9px', cursor:'pointer', background:isSelected?'#EBF2FF':'white', transition:'all 0.12s' }}>
                          <div style={{ width:'18px', height:'18px', border:`2px solid ${isSelected?'#4A7FD4':'#DEE2E6'}`, borderRadius:'4px', background:isSelected?'#4A7FD4':'white', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:'1px' }}>
                            {isSelected && <span style={{ color:'white', fontSize:'11px', fontWeight:900 }}>✓</span>}
                          </div>
                          <div style={{ flex:1 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'3px', flexWrap:'wrap' }}>
                              <span style={{ fontSize:'11px', fontWeight:800, color:'#9AA5B8' }}>Q{i+1}</span>
                              <span style={{ fontSize:'10px', fontWeight:800, background:'#EBF2FF', color:'#4A7FD4', padding:'1px 7px', borderRadius:'50px' }}>{q.topicTitle}</span>
                              <span style={{ fontSize:'10px', fontWeight:800, background:dc.bg, color:dc.color, padding:'1px 7px', borderRadius:'50px' }}>{q.difficulty}</span>
                            </div>
                            <div style={{ fontSize:'12px', color:'#1E2D4E', fontWeight:600, lineHeight:1.5 }}>{q.prompt_en}</div>
                            {q.prompt_he && <div style={{ fontSize:'11px', color:'#4A7FD4', direction:'rtl', textAlign:'right', fontFamily:'serif', marginTop:'2px' }}>{q.prompt_he}</div>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right — summary */}
          <div style={{ position:'sticky', top:'78px' }}>
            <div style={{ background:'white', border:'1px solid #EEF1F6', borderRadius:'16px', padding:'18px', boxShadow:'0 4px 16px rgba(30,45,78,0.1)' }}>
              <div style={{ fontFamily:'"Nunito",sans-serif', fontWeight:800, fontSize:'15px', color:'#1E2D4E', marginBottom:'14px' }}>📋 Summary</div>
              {[
                { label:'Child',      value:`${selectedChild.emoji} ${selectedChild.name} (Grade ${selectedChild.grade})` },
                { label:'Subject',    value:`${selectedSubject.icon} ${selectedSubject.label}` },
                { label:'Topics',     value:`${selectedTopics.length} selected` },
                { label:'Type',       value:wsType.charAt(0).toUpperCase()+wsType.slice(1) },
                { label:'Difficulty', value:difficulty.charAt(0).toUpperCase()+difficulty.slice(1) },
                { label:'Max Q',      value:questionCount },
                { label:'Selected Q', value:showPreview ? `${Math.min(selectedQIds.length, questionCount)} questions` : 'Preview first' },
                { label:'Language',   value:langMode==='bilingual'?'🌐 Both':langMode==='he_only'?'🇮🇱 Hebrew':'🇺🇸 English' },
                { label:'Answer Key', value:answerKey?'✅ Yes':'❌ No' },
                { label:'Hints',      value:includeHints?'✅ Yes':'❌ No' },
                { label:'Steps',      value:solutionSteps?'✅ Yes':'❌ No' },
              ].map(item => (
                <div key={item.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 0', borderBottom:'1px solid #EEF1F6', fontSize:'12px' }}>
                  <span style={{ color:'#9AA5B8', fontWeight:700 }}>{item.label}</span>
                  <span style={{ color:'#1E2D4E', fontWeight:700, textAlign:'right', maxWidth:'160px' }}>{item.value}</span>
                </div>
              ))}

              {showPreview && selectedQIds.length > 0 && (
                <div style={{ marginTop:'10px', padding:'7px 10px', background:'#F0FDF4', borderRadius:'8px', fontSize:'11px', color:'#166534' }}>
                  ✅ {Math.min(selectedQIds.length, questionCount)} questions ready to generate
                </div>
              )}

              {!showPreview && (
                <div style={{ marginTop:'10px', padding:'7px 10px', background:'#FFF8EC', borderRadius:'8px', fontSize:'11px', color:'#92400E' }}>
                  💡 Preview questions first to select which to include
                </div>
              )}

              <button onClick={generate}
                disabled={generating || selectedQIds.length===0}
                style={{ width:'100%', marginTop:'14px', padding:'13px', borderRadius:'50px', border:'none', background:selectedQIds.length===0?'#DEE2E6':'linear-gradient(135deg,#4A7FD4,#2EC4B6)', color:'white', fontSize:'14px', fontWeight:900, cursor:selectedQIds.length===0?'not-allowed':'pointer', fontFamily:'"Nunito",sans-serif', boxShadow:selectedQIds.length===0?'none':'0 6px 20px rgba(74,127,212,0.4)' }}>
                {generating ? 'Opening...' : '🖨️ Generate Worksheet'}
              </button>

              {selectedQIds.length === 0 && (
                <p style={{ textAlign:'center', fontSize:'11px', color:'#EF4444', marginTop:'7px', fontWeight:700 }}>
                  Preview and select questions first
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function WorksheetsPage() {
  return (
    <Suspense fallback={<div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>Loading...</div>}>
      <WorksheetBuilder/>
    </Suspense>
  )
}
