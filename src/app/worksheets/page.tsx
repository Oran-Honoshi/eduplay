'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

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

function WorksheetBuilder() {
  const [step, setStep]                   = useState(1)
  const [selectedChild, setSelectedChild] = useState(CHILDREN[1])
  const [selectedSubject, setSelectedSubject] = useState(SUBJECTS[0])
  const [topics, setTopics]               = useState<any[]>([])
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])
  const [difficulty, setDifficulty]       = useState('mixed')
  const [questionCount, setQuestionCount] = useState(20)
  const [langMode, setLangMode]           = useState('bilingual')
  const [answerKey, setAnswerKey]         = useState(false)
  const [wsType, setWsType]               = useState('practice')
  const [loading, setLoading]             = useState(false)
  const [loadingTopics, setLoadingTopics] = useState(false)

  useEffect(() => {
    loadTopics()
  }, [selectedChild, selectedSubject])

  async function loadTopics() {
    setLoadingTopics(true)
    setSelectedTopics([])
    try {
      const res = await fetch(`/api/topics?grade=${selectedChild.grade}&subject=${selectedSubject.slug}`)
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
    setSelectedTopics(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    )
  }

  function toggleAllTopics() {
    if (selectedTopics.length === topics.length) {
      setSelectedTopics([])
    } else {
      setSelectedTopics(topics.map(t => t.id))
    }
  }

  async function generateWorksheet() {
    if (selectedTopics.length === 0) return
    setLoading(true)
    const params = new URLSearchParams({
      childId:       selectedChild.id,
      topicIds:      selectedTopics.join(','),
      difficulty,
      questionCount: questionCount.toString(),
      lang:          langMode,
      answerKey:     answerKey.toString(),
      wsType,
    })
    window.open(`/api/worksheets/builder?${params}`, '_blank')
    setLoading(false)
  }

  const S = { background: 'white', fontFamily: '"Nunito Sans", sans-serif', minHeight: '100vh' }

  return (
    <div style={S}>

      {/* Header */}
      <header style={{ background: 'white', borderBottom: '1px solid #EEF1F6', padding: '0 24px', height: '58px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(30,45,78,0.07)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: '"Nunito",sans-serif', fontWeight: 900, fontSize: '20px', color: '#1E2D4E' }}>
          <div style={{ width: '30px', height: '30px', background: 'linear-gradient(135deg,#4A7FD4,#2EC4B6)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px' }}>🦔</div>
          Edu<span style={{ color: '#4A7FD4' }}>Play</span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#9AA5B8' }}>· Worksheet Builder</span>
        </div>
        <button onClick={() => window.location.href = '/dashboard'} style={{ padding: '7px 16px', borderRadius: '50px', border: '1px solid #EEF1F6', background: 'white', fontWeight: 700, fontSize: '13px', cursor: 'pointer', color: '#4B5563' }}>
          ← Dashboard
        </button>
      </header>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px' }}>

        <h1 style={{ fontFamily: '"Nunito",sans-serif', fontWeight: 900, fontSize: '26px', color: '#1E2D4E', marginBottom: '6px' }}>🖨️ Worksheet Builder</h1>
        <p style={{ color: '#5A6A7E', marginBottom: '32px', fontSize: '14px' }}>Create a custom worksheet or exam for any child, subject and topic combination.</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px', alignItems: 'start' }}>

          {/* Left — main options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Step 1 — Child */}
            <div style={{ background: 'white', border: '1px solid #EEF1F6', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(30,45,78,0.07)' }}>
              <div style={{ fontFamily: '"Nunito",sans-serif', fontWeight: 800, fontSize: '15px', color: '#1E2D4E', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '26px', height: '26px', background: '#EBF2FF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 900, color: '#4A7FD4' }}>1</div>
                Select Child
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                {CHILDREN.map(child => (
                  <div key={child.id} onClick={() => setSelectedChild(child)}
                    style={{ flex: 1, padding: '12px', border: `2px solid ${selectedChild.id === child.id ? '#4A7FD4' : '#EEF1F6'}`, borderRadius: '12px', textAlign: 'center', cursor: 'pointer', background: selectedChild.id === child.id ? '#EBF2FF' : 'white', transition: 'all 0.15s' }}>
                    <div style={{ fontSize: '28px', marginBottom: '4px' }}>{child.emoji}</div>
                    <div style={{ fontWeight: 800, fontSize: '14px', color: '#1E2D4E' }}>{child.name}</div>
                    <div style={{ fontSize: '11px', color: '#9AA5B8' }}>Grade {child.grade}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 2 — Subject */}
            <div style={{ background: 'white', border: '1px solid #EEF1F6', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(30,45,78,0.07)' }}>
              <div style={{ fontFamily: '"Nunito",sans-serif', fontWeight: 800, fontSize: '15px', color: '#1E2D4E', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '26px', height: '26px', background: '#EBF2FF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 900, color: '#4A7FD4' }}>2</div>
                Select Subject
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                {SUBJECTS.map(subj => (
                  <div key={subj.slug} onClick={() => setSelectedSubject(subj)}
                    style={{ flex: 1, padding: '12px', border: `2px solid ${selectedSubject.slug === subj.slug ? subj.color : '#EEF1F6'}`, borderRadius: '12px', textAlign: 'center', cursor: 'pointer', background: selectedSubject.slug === subj.slug ? `${subj.color}15` : 'white', transition: 'all 0.15s' }}>
                    <div style={{ fontSize: '26px', marginBottom: '4px' }}>{subj.icon}</div>
                    <div style={{ fontWeight: 800, fontSize: '13px', color: '#1E2D4E' }}>{subj.label}</div>
                    <div style={{ fontSize: '11px', color: '#9AA5B8', direction: 'rtl' }}>{subj.labelHe}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 3 — Topics */}
            <div style={{ background: 'white', border: '1px solid #EEF1F6', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(30,45,78,0.07)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ fontFamily: '"Nunito",sans-serif', fontWeight: 800, fontSize: '15px', color: '#1E2D4E', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '26px', height: '26px', background: '#EBF2FF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 900, color: '#4A7FD4' }}>3</div>
                  Select Topics
                </div>
                <button onClick={toggleAllTopics} style={{ padding: '4px 12px', borderRadius: '50px', border: '1px solid #EEF1F6', background: 'white', fontSize: '12px', fontWeight: 700, cursor: 'pointer', color: '#4B5563' }}>
                  {selectedTopics.length === topics.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              {loadingTopics ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#9AA5B8', fontSize: '13px' }}>Loading topics...</div>
              ) : topics.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#9AA5B8', fontSize: '13px' }}>
                  No topics found for {selectedChild.name} in {selectedSubject.label} yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {topics.map(topic => (
                    <div key={topic.id} onClick={() => toggleTopic(topic.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', border: `1.5px solid ${selectedTopics.includes(topic.id) ? selectedSubject.color : '#EEF1F6'}`, borderRadius: '10px', cursor: 'pointer', background: selectedTopics.includes(topic.id) ? `${selectedSubject.color}10` : 'white', transition: 'all 0.12s' }}>
                      <div style={{ width: '20px', height: '20px', border: `2px solid ${selectedTopics.includes(topic.id) ? selectedSubject.color : '#DEE2E6'}`, borderRadius: '5px', background: selectedTopics.includes(topic.id) ? selectedSubject.color : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.12s' }}>
                        {selectedTopics.includes(topic.id) && <span style={{ color: 'white', fontSize: '12px', fontWeight: 900 }}>✓</span>}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '13px', color: '#1E2D4E' }}>{topic.title_en}</div>
                        {topic.title_he && <div style={{ fontSize: '11px', color: '#9AA5B8', direction: 'rtl', textAlign: 'right' }}>{topic.title_he}</div>}
                      </div>
                      <div style={{ fontSize: '11px', color: '#9AA5B8', fontWeight: 700 }}>+{topic.xp_reward} XP</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Step 4 — Options */}
            <div style={{ background: 'white', border: '1px solid #EEF1F6', borderRadius: '16px', padding: '20px', boxShadow: '0 2px 8px rgba(30,45,78,0.07)' }}>
              <div style={{ fontFamily: '"Nunito",sans-serif', fontWeight: 800, fontSize: '15px', color: '#1E2D4E', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '26px', height: '26px', background: '#EBF2FF', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 900, color: '#4A7FD4' }}>4</div>
                Worksheet Options
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

                {/* Worksheet type */}
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#5A6A7E', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '.5px' }}>Type</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {[
                      { id: 'practice', label: '📝 Practice', desc: 'With hints & examples' },
                      { id: 'quiz',     label: '✅ Quiz',     desc: 'Questions only' },
                      { id: 'exam',     label: '🎓 Exam',     desc: 'Full coverage, timed' },
                    ].map(t => (
                      <div key={t.id} onClick={() => setWsType(t.id)}
                        style={{ padding: '8px 12px', border: `2px solid ${wsType === t.id ? '#4A7FD4' : '#EEF1F6'}`, borderRadius: '8px', cursor: 'pointer', background: wsType === t.id ? '#EBF2FF' : 'white' }}>
                        <div style={{ fontWeight: 700, fontSize: '13px', color: '#1E2D4E' }}>{t.label}</div>
                        <div style={{ fontSize: '11px', color: '#9AA5B8' }}>{t.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Difficulty */}
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: '#5A6A7E', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '.5px' }}>Difficulty</div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {[
                        { id: 'easy',   label: 'Easy',   color: '#27AE60' },
                        { id: 'medium', label: 'Medium', color: '#F5A623' },
                        { id: 'hard',   label: 'Hard',   color: '#FF6B6B' },
                        { id: 'mixed',  label: 'Mixed',  color: '#9B59B6' },
                      ].map(d => (
                        <button key={d.id} onClick={() => setDifficulty(d.id)}
                          style={{ padding: '6px 12px', borderRadius: '50px', border: `2px solid ${difficulty === d.id ? d.color : '#EEF1F6'}`, background: difficulty === d.id ? `${d.color}20` : 'white', color: difficulty === d.id ? d.color : '#6B7A8D', fontWeight: 800, fontSize: '12px', cursor: 'pointer' }}>
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Question count */}
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: '#5A6A7E', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '.5px' }}>
                      Questions: <span style={{ color: '#4A7FD4' }}>{questionCount}</span>
                    </div>
                    <input type="range" min={10} max={30} step={1} value={questionCount}
                      onChange={e => setQuestionCount(parseInt(e.target.value))}
                      style={{ width: '100%', accentColor: '#4A7FD4' }}/>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#9AA5B8', marginTop: '4px' }}>
                      <span>10</span><span>30</span>
                    </div>
                  </div>

                  {/* Language */}
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: '#5A6A7E', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '.5px' }}>Language</div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {[
                        { id: 'en_only',   label: '🇺🇸 English' },
                        { id: 'bilingual', label: '🌐 Both' },
                        { id: 'he_only',   label: '🇮🇱 Hebrew' },
                      ].map(l => (
                        <button key={l.id} onClick={() => setLangMode(l.id)}
                          style={{ flex: 1, padding: '6px 8px', borderRadius: '8px', border: `2px solid ${langMode === l.id ? '#4A7FD4' : '#EEF1F6'}`, background: langMode === l.id ? '#EBF2FF' : 'white', color: langMode === l.id ? '#4A7FD4' : '#6B7A8D', fontWeight: 700, fontSize: '11px', cursor: 'pointer' }}>
                          {l.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Answer key */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#F8F9FB', borderRadius: '8px' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '13px', color: '#1E2D4E' }}>Include Answer Key</div>
                      <div style={{ fontSize: '11px', color: '#9AA5B8' }}>Added as a separate page</div>
                    </div>
                    <div onClick={() => setAnswerKey(v => !v)}
                      style={{ width: '44px', height: '24px', borderRadius: '12px', background: answerKey ? '#4A7FD4' : '#DEE2E6', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                      <div style={{ position: 'absolute', top: '3px', left: answerKey ? '22px' : '3px', width: '18px', height: '18px', borderRadius: '50%', background: 'white', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }}/>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right — summary + generate */}
          <div style={{ position: 'sticky', top: '78px' }}>
            <div style={{ background: 'white', border: '1px solid #EEF1F6', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 16px rgba(30,45,78,0.1)' }}>
              <div style={{ fontFamily: '"Nunito",sans-serif', fontWeight: 800, fontSize: '16px', color: '#1E2D4E', marginBottom: '16px' }}>📋 Worksheet Summary</div>

              {[
                { label: 'Child',      value: `${selectedChild.emoji} ${selectedChild.name} (Grade ${selectedChild.grade})` },
                { label: 'Subject',    value: `${selectedSubject.icon} ${selectedSubject.label}` },
                { label: 'Topics',     value: `${selectedTopics.length} of ${topics.length} selected` },
                { label: 'Type',       value: wsType.charAt(0).toUpperCase() + wsType.slice(1) },
                { label: 'Difficulty', value: difficulty.charAt(0).toUpperCase() + difficulty.slice(1) },
                { label: 'Questions',  value: `${questionCount} questions` },
                { label: 'Language',   value: langMode === 'bilingual' ? '🌐 Bilingual' : langMode === 'he_only' ? '🇮🇱 Hebrew' : '🇺🇸 English' },
                { label: 'Answer Key', value: answerKey ? '✅ Included' : '❌ Not included' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid #EEF1F6', fontSize: '13px' }}>
                  <span style={{ color: '#9AA5B8', fontWeight: 700 }}>{item.label}</span>
                  <span style={{ color: '#1E2D4E', fontWeight: 700, textAlign: 'right', maxWidth: '160px' }}>{item.value}</span>
                </div>
              ))}

              {selectedTopics.length > 0 && (
                <div style={{ marginTop: '10px', padding: '8px 10px', background: '#F8F9FB', borderRadius: '8px', fontSize: '11px', color: '#5A6A7E' }}>
                  💡 ~{Math.round(questionCount / Math.max(selectedTopics.length, 1))} questions per topic
                </div>
              )}

              <button
                onClick={generateWorksheet}
                disabled={loading || selectedTopics.length === 0}
                style={{
                  width: '100%', marginTop: '16px', padding: '14px',
                  borderRadius: '50px', border: 'none',
                  background: selectedTopics.length === 0 ? '#DEE2E6' : 'linear-gradient(135deg,#4A7FD4,#2EC4B6)',
                  color: 'white', fontSize: '15px', fontWeight: 900,
                  cursor: selectedTopics.length === 0 ? 'not-allowed' : 'pointer',
                  fontFamily: '"Nunito", sans-serif',
                  boxShadow: selectedTopics.length === 0 ? 'none' : '0 6px 20px rgba(74,127,212,0.4)',
                }}>
                {loading ? 'Generating...' : '🖨️ Generate Worksheet'}
              </button>

              {selectedTopics.length === 0 && (
                <p style={{ textAlign: 'center', fontSize: '12px', color: '#FF6B6B', marginTop: '8px', fontWeight: 700 }}>
                  ⚠️ Select at least one topic
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
