'use client'
import { useState } from 'react'

function Fraction({ n, d, size = 20 }: { n: any; d: any; size?: number }) {
  return (
    <span style={{ display:'inline-flex', flexDirection:'column', alignItems:'center', lineHeight:1, verticalAlign:'middle', margin:'0 4px', fontFamily:'Georgia,serif' }}>
      <span style={{ fontSize:size, fontWeight:600 }}>{n}</span>
      <span style={{ display:'block', width:'100%', minWidth:`${size*0.9}px`, height:'1.5px', background:'currentColor', margin:'2px 0' }}/>
      <span style={{ fontSize:size, fontWeight:600 }}>{d}</span>
    </span>
  )
}

const THEMES: any = {
  minecraft: { bg:'#1A1A2E', panel:'#2D2D2D', panel2:'#1a1a1a', border:'#555', accent1:'#5D9E2F', accent2:'#FFD700', accent3:'#39D9D9', accent4:'#FF6B00', xp:'#82FF00', text:'#F5F5DC', text2:'rgba(245,245,220,0.6)', radius:'0px', fontHead:'"Press Start 2P",monospace', shadow:'4px 4px 0 rgba(0,0,0,0.7)', btnShadow:'4px 4px 0 #000' },
  princesses: { bg:'#FFF0F8', panel:'#FFFFFF', panel2:'#FFF0F8', border:'#F4AFCF', accent1:'#E05BA0', accent2:'#FFD700', accent3:'#9B59B6', accent4:'#FF8C69', xp:'#E05BA0', text:'#3D1A2E', text2:'rgba(61,26,46,0.6)', radius:'20px', fontHead:'"Cinzel Decorative",serif', shadow:'0 8px 24px rgba(224,91,160,0.18)', btnShadow:'0 4px 16px rgba(224,91,160,0.35)' },
  plain: { bg:'#F8F9FA', panel:'#FFFFFF', panel2:'#F8F9FA', border:'#DEE2E6', accent1:'#4A90D9', accent2:'#F0A500', accent3:'#27AE60', accent4:'#E67E22', xp:'#27AE60', text:'#212529', text2:'#6C757D', radius:'12px', fontHead:'"Nunito",sans-serif', shadow:'0 2px 12px rgba(0,0,0,0.08)', btnShadow:'0 2px 8px rgba(0,0,0,0.12)' },
}

const MASCOTS: any = {
  minecraft:  { mascot:'🦔', pip:'Think of fractions like splitting a diamond! 💎' },
  princesses: { mascot:'🦄', pip:'Fractions are like sharing a magical cake! 🎂' },
  plain:      { mascot:'🦉', pip:'Great work! Keep going! 🌟' },
}

export default function LessonClient({ child, topic, questions, progress, allTopics, difficulty }: any) {
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
const theme = (params?.get('theme') || child?.theme || 'plain') as string
  const T = THEMES[theme] || THEMES.plain
  const TD = MASCOTS[theme] || MASCOTS.plain
  const langMode = child?.lang_screen || 'bilingual'

  const [currentStep, setCurrentStep] = useState(0)
  const totalSteps = topic?.lesson_count || 5
  const [qIndex, setQIndex]       = useState(0)
  const [answered, setAnswered]   = useState(false)
  const [selected, setSelected]   = useState<string|null>(null)
  const [feedback, setFeedback]   = useState<any>(null)
  const [hintVisible, setHint]    = useState(false)
  const [xpBalance, setXp]        = useState(child?.xp_balance || 0)
  const [xpNotif, setXpNotif]     = useState<string|null>(null)
  const [completed, setCompleted] = useState(false)
  const [pipText, setPip]         = useState(TD.pip)

  const currentQ = questions[qIndex]
  const progressPct = Math.round((currentStep / totalSteps) * 100)

  function showXP(text: string) {
    setXpNotif(text)
    setTimeout(() => setXpNotif(null), 2500)
  }

  function speak(text: string, lang: string) {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = lang === 'he' ? 'he-IL' : 'en-US'
    u.rate = 0.9
    window.speechSynthesis.speak(u)
  }

  async function checkAnswer(opt: any) {
    if (answered) return
    setAnswered(true)
    setSelected(opt.label)
    const correct = opt.isCorrect
    setFeedback({ correct, explanation: correct ? (currentQ.explanation_en || 'Correct! Well done!') : (currentQ.hint_en || 'Not quite — try the hint!') })
    setPip(correct ? '🎉 Excellent! You nailed it!' : '💡 Don\'t give up!')
    if (correct) {
      setXp((b: number) => b + 25)
      showXP('+25 XP ⬆')
      try {
        await fetch('/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ childId: child?.id, questionId: currentQ.id, topicId: topic?.id, answerGiven: opt.label, correct, hintUsed: hintVisible }),
        })
      } catch {}
    }
  }

  function nextStep() {
    if (!answered) { setPip('⚠️ Answer the question first!'); return }
    const next = currentStep + 1
    if (next >= totalSteps) { setCompleted(true); return }
    setCurrentStep(next)
    setQIndex(i => Math.min(i + 1, questions.length - 1))
    setAnswered(false); setSelected(null); setFeedback(null); setHint(false)
    setPip(TD.pip)
  }

  return (
    <div style={{ minHeight:'100vh', background:T.bg, color:T.text, fontFamily:'"Nunito",sans-serif' }}>

      {xpNotif && (
        <div style={{ position:'fixed', top:'70px', right:'20px', zIndex:9999, background:T.panel, border:`3px solid ${T.xp}`, borderRadius:T.radius, padding:'10px 18px', fontFamily:T.fontHead, fontSize:'11px', color:T.xp, boxShadow:T.shadow, pointerEvents:'none' }}>
          {xpNotif}
        </div>
      )}

      {completed && (
        <div style={{ position:'fixed', inset:0, zIndex:9998, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
          <div style={{ background:T.panel, border:`4px solid ${T.accent2}`, borderRadius:T.radius, padding:'36px', textAlign:'center', maxWidth:'380px', width:'100%', boxShadow:T.shadow }}>
            <h2 style={{ fontFamily:T.fontHead, fontSize:'13px', color:T.accent2, marginBottom:'10px' }}>LESSON COMPLETE! 🎉</h2>
            <div style={{ fontSize:'44px', letterSpacing:'6px', margin:'12px 0' }}>⭐⭐⭐</div>
            <p style={{ fontSize:'13px', color:T.text2, marginBottom:'20px' }}>You mastered <strong style={{ color:T.accent2 }}>{topic?.title_en}</strong>!<br/>+100 XP earned!</p>
            <div style={{ display:'flex', gap:'10px' }}>
              <button onClick={() => window.location.href='/dashboard'} style={{ flex:1, padding:'12px', background:T.accent1, border:'none', borderRadius:T.radius, color:'white', fontFamily:T.fontHead, fontSize:'8px', cursor:'pointer' }}>DASHBOARD</button>
              <button onClick={() => { setCompleted(false); setCurrentStep(0); setQIndex(0); setAnswered(false); setSelected(null); setFeedback(null) }} style={{ flex:1, padding:'12px', background:T.accent3, border:'none', borderRadius:T.radius, color:'#000', fontFamily:T.fontHead, fontSize:'8px', cursor:'pointer' }}>AGAIN</button>
            </div>
          </div>
        </div>
      )}

      <header style={{ background:theme==='minecraft'?'rgba(0,0,0,0.75)':T.panel, borderBottom:`${theme==='minecraft'?4:1}px solid ${T.border}`, padding:'0 20px', height:'58px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ fontFamily:T.fontHead, fontSize:'13px', color:T.accent1 }}>Edu<span style={{ color:T.accent2 }}>Play</span></div>
        <div style={{ display:'flex', alignItems:'center', gap:'16px' }}>
          <div style={{ display:'flex', gap:'3px' }}>{[...Array(5)].map((_,i) => <span key={i} style={{ fontSize:'14px', opacity:i<3?1:0.3 }}>❤️</span>)}</div>
         <span style={{ fontFamily:T.fontHead, fontSize:'7px', color:T.xp }}>{xpBalance.toLocaleString()} XP</span>
<button
  onClick={() => window.location.href=`/theme?childId=${child?.id}&name=${child?.display_name}&current=${theme}`}
  style={{ background:T.panel, border:`2px solid ${T.border}`, borderRadius:T.radius, padding:'6px 10px', cursor:'pointer', color:T.text, boxShadow:T.btnShadow, fontFamily:T.fontHead, fontSize:'7px' }}>
  🎨 THEME
</button>
        </div>
      </header>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 280px', gap:'16px', padding:'20px', maxWidth:'1200px', margin:'0 auto' }}>
        <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>

          <div style={{ display:'flex', alignItems:'center', gap:'12px', flexWrap:'wrap' }}>
            <button onClick={() => window.location.href='/dashboard'} style={{ fontFamily:T.fontHead, fontSize:'7px', background:T.panel, border:`2px solid ${T.border}`, color:T.text, padding:'8px 12px', borderRadius:T.radius, cursor:'pointer', boxShadow:T.btnShadow }}>◀ BACK</button>
            <div style={{ flex:1, height:'12px', background:T.panel2, border:`2px solid ${T.border}`, borderRadius:T.radius, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${progressPct}%`, background:`linear-gradient(90deg,${T.accent3},${T.xp})`, transition:'width 0.5s ease' }}/>
            </div>
            <span style={{ fontFamily:T.fontHead, fontSize:'7px', color:T.accent2, whiteSpace:'nowrap' }}>STEP {currentStep+1}/{totalSteps}</span>
          </div>

          <div style={{ background:T.panel, border:`${theme==='minecraft'?3:1}px solid ${T.border}`, borderRadius:T.radius, padding:'20px', boxShadow:T.shadow }}>
            <div style={{ fontFamily:T.fontHead, fontSize:'10px', color:T.accent2, marginBottom:'4px' }}>{topic?.title_en}</div>
            <div style={{ background:T.panel2, border:`2px solid ${T.border}`, borderLeft:`5px solid ${T.accent3}`, padding:'16px', marginBottom:'14px' }}>
              <div style={{ fontFamily:T.fontHead, fontSize:'6px', color:T.accent3, marginBottom:'8px' }}>📘 LEARN THIS</div>
              <p style={{ fontSize:'13px', lineHeight:1.75, color:T.text2, margin:'0 0 12px' }}>A <strong style={{ color:T.text }}>fraction</strong> describes equal parts of a whole:</p>
              <div style={{ textAlign:'center', padding:'16px', background:T.panel, border:`1px solid ${T.border}`, borderRadius:T.radius, margin:'10px 0', color:T.text }}>
                <Fraction n={3} d={8} size={22}/>
                <span style={{ fontSize:'13px', color:T.text2, marginLeft:'12px' }}>= 3 out of 8 equal parts</span>
              </div>
              <p style={{ fontSize:'13px', lineHeight:1.75, color:T.text2, margin:0 }}>
                <strong style={{ color:T.accent3 }}>Numerator</strong> (top) = parts we have.<br/>
                <strong style={{ color:T.accent4 }}>Denominator</strong> (bottom) = total parts.
              </p>
            </div>
            {langMode !== 'en_only' && (
              <div style={{ padding:'10px 12px', fontSize:'13px', lineHeight:1.7, direction:'rtl', textAlign:'right', border:`1px solid ${T.border}`, borderRadius:T.radius, background:'rgba(0,0,0,0.03)', fontFamily:'"Times New Roman",serif', color:T.accent3, marginBottom:'10px' }}>
                🇮🇱 שבר מספר שמחלק שלם לחלקים שווים. המונה למעלה, המכנה למטה.
              </div>
            )}
            <div style={{ display:'flex', gap:'8px' }}>
              <button onClick={() => speak('A fraction tells us how many equal parts of a whole we have.','en')} style={{ background:T.panel, border:`2px solid ${T.border}`, borderRadius:T.radius, padding:'6px 12px', cursor:'pointer', fontSize:'12px', color:T.text, boxShadow:T.btnShadow }}>
                🔊 <span style={{ background:T.accent3, color:'#000', borderRadius:'4px', padding:'1px 7px', fontSize:'10px', fontWeight:800 }}>EN</span>
              </button>
              {langMode !== 'en_only' && (
                <button onClick={() => speak('שבר מספר שמחלק שלם לחלקים שווים.','he')} style={{ background:T.panel, border:`2px solid ${T.border}`, borderRadius:T.radius, padding:'6px 12px', cursor:'pointer', fontSize:'12px', color:T.text, boxShadow:T.btnShadow }}>
                  🔊 <span style={{ background:T.accent2, color:'#000', borderRadius:'4px', padding:'1px 7px', fontSize:'10px', fontWeight:800 }}>עב</span>
                </button>
              )}
            </div>
          </div>

          {currentQ ? (
            <div style={{ background:T.panel2, border:`${theme==='minecraft'?3:2}px solid ${T.border}`, borderRadius:T.radius, padding:'18px', boxShadow:T.shadow }}>
              <div style={{ fontFamily:T.fontHead, fontSize:'6px', color:T.accent4, marginBottom:'10px' }}>⚔️ PRACTICE QUESTION</div>
              <div style={{ marginBottom:'12px' }}>
                {langMode !== 'he_only' && <p style={{ fontSize:'14px', fontWeight:700, color:T.text, margin:'0 0 6px' }}>{currentQ.prompt_en}</p>}
                {langMode !== 'en_only' && currentQ.prompt_he && (
                  <p style={{ fontSize:'13px', color:T.accent3, direction:'rtl', textAlign:'right', fontFamily:'"Times New Roman",serif', margin:0 }}>{currentQ.prompt_he}</p>
                )}
              </div>

              {currentQ.visual_data?.type === 'fraction' && (
                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', padding:'14px', background:T.panel, border:`2px dashed ${T.border}`, borderRadius:T.radius, marginBottom:'14px', flexWrap:'wrap' }}>
                  {[...Array(currentQ.visual_data.d||8)].map((_,i) => (
                    <div key={i} style={{ width:'28px', height:'28px', background:i<(currentQ.visual_data.n||3)?T.accent1:'transparent', border:`2px solid ${T.border}`, borderRadius:'4px' }}/>
                  ))}
                  <span style={{ marginLeft:'12px', fontSize:'16px', color:T.text2 }}>= <Fraction n={currentQ.visual_data.n} d={currentQ.visual_data.d} size={18}/></span>
                </div>
              )}

              {currentQ.options && (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'12px' }}>
                  {currentQ.options.map((opt: any) => {
                    const isCorrect = opt.isCorrect && answered && selected !== null
const isWrong = selected===opt.label && !opt.isCorrect && answered
const showGreen = isCorrect && selected !== null
                    return (
                      <button key={opt.label} onClick={() => checkAnswer(opt)} disabled={answered}
                        style={{ background:showGreen?'rgba(0,200,83,0.15)':isWrong?'rgba(224,48,48,0.15)':T.panel, border:`2px solid ${showGreen?T.accent3:isWrong?'#E03030':T.border}`, borderRadius:T.radius, padding:'12px 14px', cursor:answered?'default':'pointer', fontFamily:'Georgia,serif', fontSize:'16px', fontWeight:800, boxShadow:T.btnShadow, display:'flex', alignItems:'center', gap:'10px', color:T.text }}>
                        <span style={{ width:'20px', height:'20px', background:T.panel2, border:`1px solid ${T.border}`, borderRadius:T.radius, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:T.fontHead, fontSize:'7px', flexShrink:0 }}>{opt.label}</span>
                        {opt.value_en.includes('/')?<Fraction n={opt.value_en.split('/')[0]} d={opt.value_en.split('/')[1]} size={18}/>:opt.value_en}
                      </button>
                    )
                  })}
                </div>
              )}

              {hintVisible && currentQ.hint_en && (
                <div style={{ background:'rgba(255,215,0,0.07)', border:`2px solid ${T.accent2}`, borderRadius:T.radius, padding:'12px 14px', marginBottom:'10px' }}>
                  <div style={{ fontFamily:T.fontHead, fontSize:'6px', color:T.accent2, marginBottom:'6px' }}>💡 HINT</div>
                  <p style={{ fontSize:'13px', color:T.text2, margin:0 }}>{currentQ.hint_en}</p>
                </div>
              )}

              {feedback && (
                <div style={{ border:`2px solid ${feedback.correct?T.accent3:'#E03030'}`, background:feedback.correct?'rgba(0,200,83,0.1)':'rgba(224,48,48,0.1)', borderRadius:T.radius, padding:'14px 16px', display:'flex', alignItems:'flex-start', gap:'12px', marginBottom:'10px' }}>
                  <span style={{ fontSize:'26px' }}>{feedback.correct?'🎉':'💔'}</span>
                  <div>
                    <div style={{ fontFamily:T.fontHead, fontSize:'8px', color:feedback.correct?T.accent3:'#E03030', marginBottom:'4px' }}>{feedback.correct?'CORRECT!':'NOT QUITE!'}</div>
                    <div style={{ fontSize:'12px', color:T.text2, lineHeight:1.6 }}>{feedback.explanation}</div>
                  </div>
                </div>
              )}

              <div style={{ display:'flex', gap:'8px' }}>
                <button onClick={() => setHint(v=>!v)} style={{ padding:'10px 16px', fontFamily:T.fontHead, fontSize:'7px', background:T.panel, border:`2px solid ${T.accent2}`, color:T.accent2, borderRadius:T.radius, cursor:'pointer', boxShadow:T.btnShadow }}>💡 HINT</button>
                <button onClick={() => { setQIndex(i=>(i+1)%Math.max(questions.length,1)); setAnswered(false); setSelected(null); setFeedback(null); setHint(false) }} style={{ padding:'10px 16px', fontFamily:T.fontHead, fontSize:'7px', background:T.panel, border:`2px solid ${T.accent3}`, color:T.accent3, borderRadius:T.radius, cursor:'pointer', boxShadow:T.btnShadow }}>🔄 NEW Q</button>
                <button onClick={nextStep} style={{ padding:'10px 18px', fontFamily:T.fontHead, fontSize:'7px', background:T.accent1, border:'none', color:'white', borderRadius:T.radius, cursor:'pointer', boxShadow:T.btnShadow, flex:1 }}>NEXT ▶</button>
              </div>
            </div>
          ) : (
            <div style={{ background:T.panel, border:`2px solid ${T.border}`, borderRadius:T.radius, padding:'24px', textAlign:'center', color:T.text2 }}>
              <div style={{ fontSize:'32px', marginBottom:'12px' }}>📚</div>
              <div style={{ fontFamily:T.fontHead, fontSize:'9px', color:T.accent2, marginBottom:'8px' }}>NO QUESTIONS YET</div>
              <p style={{ fontSize:'13px' }}>Questions will appear once the database is seeded.</p>
            </div>
          )}
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
          <div style={{ background:T.panel, border:`${theme==='minecraft'?3:2}px solid ${T.accent2}`, borderRadius:T.radius, padding:'16px', textAlign:'center', boxShadow:T.shadow }}>
            <span style={{ fontSize:'64px', display:'block' }}>{TD.mascot}</span>
            <div style={{ fontFamily:T.fontHead, fontSize:'7px', color:T.accent2, margin:'8px 0 4px' }}>PIP SAYS:</div>
            <div style={{ background:T.panel2, border:`1px solid ${T.border}`, borderRadius:T.radius, padding:'10px', fontSize:'12px', color:T.text2, lineHeight:1.6, textAlign:'left' }}>{pipText}</div>
          </div>

          <div style={{ background:T.panel, border:`${theme==='minecraft'?3:2}px solid ${T.border}`, borderRadius:T.radius, overflow:'hidden', boxShadow:T.shadow }}>
            <div style={{ background:T.panel2, borderBottom:`2px solid ${T.border}`, padding:'10px 14px', fontFamily:T.fontHead, fontSize:'7px', color:T.accent2 }}>📋 TOPICS</div>
            {allTopics.slice(0,7).map((t: any, i: number) => {
              const isActive = t.id === topic?.id
              return (
                <div key={t.id} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'9px 12px', borderBottom:`1px solid rgba(128,128,128,0.1)`, background:isActive?`${T.accent1}22`:'transparent', cursor:'pointer' }}
                  onClick={() => window.location.href=`/lesson?topicId=${t.id}&childId=${child?.id}`}>
                  <div style={{ width:'22px', height:'22px', borderRadius:T.radius, background:isActive?T.accent1:T.panel2, border:`2px solid ${isActive?T.accent1:T.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:T.fontHead, fontSize:'7px', color:isActive?'#000':T.text2, flexShrink:0 }}>{i+1}</div>
                  <div style={{ flex:1, fontSize:'12px', fontWeight:700, color:T.text }}>{t.title_en}</div>
                  <div style={{ fontFamily:T.fontHead, fontSize:'6px', color:T.xp }}>+{t.xp_reward}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
