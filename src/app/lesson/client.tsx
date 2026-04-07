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
  minecraft:  { mascot:'🦔', pip:'Keep going! Every answer makes you stronger! 💪' },
  princesses: { mascot:'🦄', pip:'You are doing amazingly! Keep shining! ✨' },
  plain:      { mascot:'🦉', pip:'Great work! Keep going! 🌟' },
}

const SUBJECT_COLORS: any = {
  math:    '#4A7FD4',
  english: '#2EC4B6',
  hebrew:  '#FF6B6B',
}

const SUBJECT_ICONS: any = {
  math:    '📐',
  english: '📖',
  hebrew:  '🇮🇱',
}

function getLearnContent(topic: any, T: any) {
  const slug = topic?.slug || ''
  const title = topic?.title_en || ''

  if (slug.includes('fraction') || slug.includes('equivalent') || slug.includes('comparing_fraction') || slug.includes('fraction_addition')) {
    return (
      <>
        <p style={{ fontSize:'13px', lineHeight:1.75, color:T.text2, margin:'0 0 12px' }}>A <strong style={{ color:T.text }}>fraction</strong> describes equal parts of a whole:</p>
        <div style={{ textAlign:'center', padding:'14px', background:T.panel, border:`1px solid ${T.border}`, borderRadius:T.radius, margin:'8px 0', color:T.text }}>
          <Fraction n={3} d={8} size={22}/>
          <span style={{ fontSize:'13px', color:T.text2, marginLeft:'12px' }}>= 3 out of 8 equal parts</span>
        </div>
        <p style={{ fontSize:'13px', lineHeight:1.75, color:T.text2, margin:0 }}>
          <strong style={{ color:T.accent3 }}>Numerator</strong> (top) = parts we have. <strong style={{ color:T.accent4 }}>Denominator</strong> (bottom) = total parts.
        </p>
      </>
    )
  }

  if (slug.includes('whole') || slug.includes('place') || slug.includes('numbers_to') || slug.includes('million') || slug.includes('counting')) {
    return (
      <>
        <p style={{ fontSize:'13px', lineHeight:1.75, color:T.text2, margin:'0 0 10px' }}>Each digit has a <strong style={{ color:T.text }}>place value</strong> depending on its position.</p>
        <div style={{ textAlign:'center', padding:'14px', background:T.panel, border:`1px solid ${T.border}`, borderRadius:T.radius, margin:'8px 0', color:T.text, fontFamily:'Georgia,serif', fontSize:'20px' }}>
          <span style={{ color:T.accent1 }}>3</span>,<span style={{ color:T.accent2 }}>4</span><span style={{ color:T.accent3 }}>5</span><span style={{ color:T.accent4 }}>6</span>
          <div style={{ fontSize:'11px', color:T.text2, marginTop:'8px', fontFamily:'sans-serif' }}>Thousands · Hundreds · Tens · Ones</div>
        </div>
        <p style={{ fontSize:'13px', color:T.text2, margin:0 }}>The <strong style={{ color:T.accent3 }}>position</strong> of a digit tells us its value.</p>
      </>
    )
  }

  if (slug.includes('decimal') || slug.includes('decimal_fraction')) {
    return (
      <>
        <p style={{ fontSize:'13px', lineHeight:1.75, color:T.text2, margin:'0 0 10px' }}><strong style={{ color:T.text }}>Decimals</strong> represent parts of a whole using a point.</p>
        <div style={{ textAlign:'center', padding:'14px', background:T.panel, border:`1px solid ${T.border}`, borderRadius:T.radius, margin:'8px 0', color:T.text, fontFamily:'Georgia,serif', fontSize:'20px' }}>
          0.7 = <Fraction n={7} d={10} size={20}/>
        </div>
        <p style={{ fontSize:'13px', color:T.text2, margin:0 }}>First place after point = <strong style={{ color:T.accent3 }}>tenths</strong>. Second = <strong style={{ color:T.accent4 }}>hundredths</strong>.</p>
      </>
    )
  }

  if (slug.includes('algebra') || slug.includes('linear') || slug.includes('equation')) {
    return (
      <>
        <p style={{ fontSize:'13px', lineHeight:1.75, color:T.text2, margin:'0 0 10px' }}>In <strong style={{ color:T.text }}>algebra</strong>, letters stand for unknown numbers.</p>
        <div style={{ textAlign:'center', padding:'14px', background:T.panel, border:`1px solid ${T.border}`, borderRadius:T.radius, margin:'8px 0', color:T.text, fontFamily:'Georgia,serif', fontSize:'18px' }}>
          x + 5 = 12 &nbsp;→&nbsp; x = 7
        </div>
        <p style={{ fontSize:'13px', color:T.text2, margin:0 }}>Do the <strong style={{ color:T.accent3 }}>opposite operation</strong> on both sides to solve.</p>
      </>
    )
  }

  if (slug.includes('geometry') || slug.includes('shape') || slug.includes('area') || slug.includes('perimeter') || slug.includes('volume') || slug.includes('surface')) {
    return (
      <>
        <p style={{ fontSize:'13px', lineHeight:1.75, color:T.text2, margin:'0 0 10px' }}><strong style={{ color:T.text }}>Area</strong> = length × width. <strong style={{ color:T.text }}>Perimeter</strong> = sum of all sides.</p>
        <div style={{ textAlign:'center', padding:'14px', background:T.panel, border:`1px solid ${T.border}`, borderRadius:T.radius, margin:'8px 0', color:T.text, fontSize:'13px' }}>
          📐 Rectangle: A = l × w &nbsp;|&nbsp; 📐 Triangle: A = ½ × b × h
        </div>
        <p style={{ fontSize:'13px', color:T.text2, margin:0 }}>Volume of a box = <strong style={{ color:T.accent3 }}>l × w × h</strong></p>
      </>
    )
  }

  if (slug.includes('ratio') || slug.includes('percent') || slug.includes('proportion')) {
    return (
      <>
        <p style={{ fontSize:'13px', lineHeight:1.75, color:T.text2, margin:'0 0 10px' }}>A <strong style={{ color:T.text }}>ratio</strong> compares two quantities. A <strong style={{ color:T.text }}>percentage</strong> is out of 100.</p>
        <div style={{ textAlign:'center', padding:'14px', background:T.panel, border:`1px solid ${T.border}`, borderRadius:T.radius, margin:'8px 0', color:T.text, fontFamily:'Georgia,serif', fontSize:'18px' }}>
          50% = <Fraction n={50} d={100} size={18}/> = <Fraction n={1} d={2} size={18}/>
        </div>
        <p style={{ fontSize:'13px', color:T.text2, margin:0 }}>To find % of a number: divide by 100 then multiply.</p>
      </>
    )
  }

  if (slug.includes('multiplication') || slug.includes('times_table') || slug.includes('division')) {
    return (
      <>
        <p style={{ fontSize:'13px', lineHeight:1.75, color:T.text2, margin:'0 0 10px' }}><strong style={{ color:T.text }}>Multiplication</strong> is repeated addition. <strong style={{ color:T.text }}>Division</strong> is equal sharing.</p>
        <div style={{ textAlign:'center', padding:'14px', background:T.panel, border:`1px solid ${T.border}`, borderRadius:T.radius, margin:'8px 0', color:T.text, fontFamily:'Georgia,serif', fontSize:'18px' }}>
          4 × 3 = 12 &nbsp;|&nbsp; 12 ÷ 3 = 4
        </div>
        <p style={{ fontSize:'13px', color:T.text2, margin:0 }}>Multiplication and division are <strong style={{ color:T.accent3 }}>opposite operations</strong>.</p>
      </>
    )
  }

  if (slug.includes('addition') || slug.includes('subtraction')) {
    return (
      <>
        <p style={{ fontSize:'13px', lineHeight:1.75, color:T.text2, margin:'0 0 10px' }}><strong style={{ color:T.text }}>Addition</strong> puts numbers together. <strong style={{ color:T.text }}>Subtraction</strong> takes away.</p>
        <div style={{ textAlign:'center', padding:'14px', background:T.panel, border:`1px solid ${T.border}`, borderRadius:T.radius, margin:'8px 0', color:T.text, fontFamily:'Georgia,serif', fontSize:'18px' }}>
          7 + 5 = 12 &nbsp;|&nbsp; 12 − 5 = 7
        </div>
        <p style={{ fontSize:'13px', color:T.text2, margin:0 }}>They are <strong style={{ color:T.accent3 }}>opposite operations</strong> — they undo each other.</p>
      </>
    )
  }

  if (slug.includes('prime') || slug.includes('factor')) {
    return (
      <>
        <p style={{ fontSize:'13px', lineHeight:1.75, color:T.text2, margin:'0 0 10px' }}>A <strong style={{ color:T.text }}>prime number</strong> has exactly 2 factors: 1 and itself.</p>
        <div style={{ textAlign:'center', padding:'14px', background:T.panel, border:`1px solid ${T.border}`, borderRadius:T.radius, margin:'8px 0', color:T.text, fontSize:'15px' }}>
          Prime: 2, 3, 5, 7, 11, 13, 17, 19...
        </div>
        <p style={{ fontSize:'13px', color:T.text2, margin:0 }}>1 is NOT prime. 2 is the only <strong style={{ color:T.accent3 }}>even prime</strong>.</p>
      </>
    )
  }

  if (slug.includes('phonics') || slug.includes('letter') || slug.includes('sound') || slug.includes('blend')) {
    return (
      <>
        <p style={{ fontSize:'13px', lineHeight:1.75, color:T.text2, margin:'0 0 10px' }}><strong style={{ color:T.text }}>Phonics</strong> helps us read by matching letters to sounds.</p>
        <div style={{ textAlign:'center', padding:'14px', background:T.panel, border:`1px solid ${T.border}`, borderRadius:T.radius, margin:'8px 0', color:T.text, fontSize:'20px', letterSpacing:'4px' }}>
          B · A · T = 🦇 bat
        </div>
        <p style={{ fontSize:'13px', color:T.text2, margin:0 }}>Sound out each letter, then <strong style={{ color:T.accent3 }}>blend</strong> them together.</p>
      </>
    )
  }

  if (slug.includes('grammar') || slug.includes('noun') || slug.includes('verb') || slug.includes('sentence') || slug.includes('clause')) {
    return (
      <>
        <p style={{ fontSize:'13px', lineHeight:1.75, color:T.text2, margin:'0 0 10px' }}>Every sentence needs a <strong style={{ color:T.text }}>subject</strong> (who) and a <strong style={{ color:T.text }}>verb</strong> (action).</p>
        <div style={{ textAlign:'center', padding:'14px', background:T.panel, border:`1px solid ${T.border}`, borderRadius:T.radius, margin:'8px 0', color:T.text, fontSize:'15px' }}>
          <span style={{ color:T.accent3 }}>Lia</span> <span style={{ color:T.accent4 }}>reads</span> a book.
          <div style={{ fontSize:'11px', color:T.text2, marginTop:'6px' }}>Subject · Verb · Object</div>
        </div>
        <p style={{ fontSize:'13px', color:T.text2, margin:0 }}>A <strong style={{ color:T.accent3 }}>noun</strong> names a person, place or thing. A <strong style={{ color:T.accent4 }}>verb</strong> shows action.</p>
      </>
    )
  }

  if (slug.includes('reading') || slug.includes('comprehension') || slug.includes('story') || slug.includes('text') || slug.includes('literature')) {
    return (
      <>
        <p style={{ fontSize:'13px', lineHeight:1.75, color:T.text2, margin:'0 0 10px' }}>Good readers ask themselves questions as they read.</p>
        <div style={{ padding:'14px', background:T.panel, border:`1px solid ${T.border}`, borderRadius:T.radius, margin:'8px 0', color:T.text, fontSize:'13px', lineHeight:1.8 }}>
          <div>📖 <strong>Who</strong> is in the story?</div>
          <div>📍 <strong>Where</strong> does it happen?</div>
          <div>❓ <strong>What</strong> is the problem?</div>
          <div>💡 <strong>Why</strong> do characters act this way?</div>
        </div>
        <p style={{ fontSize:'13px', color:T.text2, margin:0 }}>Find <strong style={{ color:T.accent3 }}>clues in the text</strong> to support your answers.</p>
      </>
    )
  }

  if (slug.includes('writing') || slug.includes('essay') || slug.includes('composition') || slug.includes('paragraph')) {
    return (
      <>
        <p style={{ fontSize:'13px', lineHeight:1.75, color:T.text2, margin:'0 0 10px' }}>Good writing has a clear <strong style={{ color:T.text }}>beginning, middle and end</strong>.</p>
        <div style={{ padding:'14px', background:T.panel, border:`1px solid ${T.border}`, borderRadius:T.radius, margin:'8px 0', color:T.text, fontSize:'13px', lineHeight:1.8 }}>
          <div>✍️ <strong>Introduction</strong> — introduce the topic</div>
          <div>📝 <strong>Body</strong> — develop your ideas</div>
          <div>🏁 <strong>Conclusion</strong> — summarise and close</div>
        </div>
        <p style={{ fontSize:'13px', color:T.text2, margin:0 }}>Start each paragraph with a <strong style={{ color:T.accent3 }}>topic sentence</strong>.</p>
      </>
    )
  }

  if (slug.includes('aleph') || slug.includes('nikud') || slug.includes('hebrew') || slug.includes('kriya') || slug.includes('ktiva') || slug.includes('binyan') || slug.includes('paal') || slug.includes('dikduk')) {
    return (
      <>
        <p style={{ fontSize:'13px', lineHeight:1.75, color:T.text2, margin:'0 0 10px' }}>עברית כתובה מ<strong style={{ color:T.text }}>ימין לשמאל</strong> ויש בה 22 אותיות.</p>
        <div style={{ textAlign:'center', padding:'14px', background:T.panel, border:`1px solid ${T.border}`, borderRadius:T.radius, margin:'8px 0', color:T.text, fontSize:'22px', fontFamily:'serif', direction:'rtl', letterSpacing:'6px' }}>
          א ב ג ד ה ו ז ח ט י
        </div>
        <p style={{ fontSize:'13px', color:T.text2, margin:0, direction:'rtl', textAlign:'right' }}>
          הניקוד עוזר לנו לדעת איך לבטא את המילים.
        </p>
      </>
    )
  }

  if (slug.includes('vocabulary') || slug.includes('sight_word') || slug.includes('word')) {
    return (
      <>
        <p style={{ fontSize:'13px', lineHeight:1.75, color:T.text2, margin:'0 0 10px' }}>Building your <strong style={{ color:T.text }}>vocabulary</strong> helps you read and write better.</p>
        <div style={{ padding:'14px', background:T.panel, border:`1px solid ${T.border}`, borderRadius:T.radius, margin:'8px 0', color:T.text, fontSize:'13px', lineHeight:1.8 }}>
          <div>🔍 Look for <strong>context clues</strong> around unfamiliar words</div>
          <div>🔤 Break words into <strong>prefix + root + suffix</strong></div>
          <div>📚 Use a dictionary when unsure</div>
        </div>
        <p style={{ fontSize:'13px', color:T.text2, margin:0 }}>The more you read, the more words you learn!</p>
      </>
    )
  }

  // Default — generic for any topic
  return (
    <>
      <p style={{ fontSize:'13px', lineHeight:1.75, color:T.text2, margin:'0 0 10px' }}>
        <strong style={{ color:T.text }}>{title}</strong> — work through the practice questions to master this topic.
      </p>
      <div style={{ padding:'14px', background:T.panel, border:`1px solid ${T.border}`, borderRadius:T.radius, margin:'8px 0', color:T.text2, fontSize:'13px', lineHeight:1.8 }}>
        <div>📖 Read each question carefully</div>
        <div>💡 Use the hint if you need help</div>
        <div>⭐ Earn XP for every correct answer</div>
      </div>
      <p style={{ fontSize:'13px', color:T.text2, margin:0 }}>
        {topic?.description_en || 'Practice makes perfect!'}
      </p>
    </>
  )
}

export default function LessonClient({ child, topic, questions, allTopics, subjects, progress, difficulty }: any) {
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  const theme = (urlParams?.get('theme') || child?.theme || 'plain') as string
  const token = urlParams?.get('token') || ''
  const T = THEMES[theme] || THEMES.plain
  const TD = MASCOTS[theme] || MASCOTS.plain
  const langMode = child?.lang_screen || 'bilingual'
  const subjSlug = topic?.subject?.slug || 'math'
  const subjColor = SUBJECT_COLORS[subjSlug] || T.accent1

  const progressMap: any = {}
  progress.forEach((p: any) => { progressMap[p.topic_id] = p })

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

  function navigateToTopic(topicId: string) {
    const base = `/lesson?topicId=${topicId}&childId=${child?.id}`
    const themeParam = theme !== child?.theme ? `&theme=${theme}` : ''
    const tokenParam = token ? `&token=${token}` : ''
    window.location.href = `${base}${themeParam}${tokenParam}`
  }

  function goBack() {
    if (token) {
      window.location.href = `/play/${token}`
    } else {
      window.location.href = '/dashboard'
    }
  }

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
    setPip(correct ? '🎉 Excellent! You nailed it!' : '💡 Don\'t give up — try again!')
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
              <button onClick={goBack} style={{ flex:1, padding:'12px', background:T.accent1, border:'none', borderRadius:T.radius, color:'white', fontFamily:T.fontHead, fontSize:'8px', cursor:'pointer' }}>HOME</button>
              <button onClick={() => { setCompleted(false); setCurrentStep(0); setQIndex(0); setAnswered(false); setSelected(null); setFeedback(null) }} style={{ flex:1, padding:'12px', background:T.accent3, border:'none', borderRadius:T.radius, color:'#000', fontFamily:T.fontHead, fontSize:'8px', cursor:'pointer' }}>AGAIN</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header style={{ background:theme==='minecraft'?'rgba(0,0,0,0.75)':T.panel, borderBottom:`${theme==='minecraft'?4:1}px solid ${T.border}`, padding:'0 20px', height:'58px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ fontFamily:T.fontHead, fontSize:'13px', color:T.accent1 }}>Edu<span style={{ color:T.accent2 }}>Play</span></div>
        <div style={{ display:'flex', alignItems:'center', gap:'16px' }}>
          <div style={{ display:'flex', gap:'3px' }}>{[...Array(5)].map((_,i) => <span key={i} style={{ fontSize:'14px', opacity:i<3?1:0.3 }}>❤️</span>)}</div>
          <span style={{ fontFamily:T.fontHead, fontSize:'7px', color:T.xp }}>{xpBalance.toLocaleString()} XP</span>
          <button onClick={() => window.location.href=`/theme?childId=${child?.id}&name=${child?.display_name}&current=${theme}${token?`&returnTo=/play/${token}`:''}`}
            style={{ background:T.panel, border:`2px solid ${T.border}`, borderRadius:T.radius, padding:'5px 10px', cursor:'pointer', color:T.text, boxShadow:T.btnShadow, fontFamily:T.fontHead, fontSize:'7px' }}>
            🎨
          </button>
        </div>
      </header>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 260px', gap:'14px', padding:'16px', maxWidth:'1200px', margin:'0 auto' }}>
        <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>

          {/* Progress bar */}
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <button onClick={goBack} style={{ fontFamily:T.fontHead, fontSize:'7px', background:T.panel, border:`2px solid ${T.border}`, color:T.text, padding:'7px 10px', borderRadius:T.radius, cursor:'pointer', boxShadow:T.btnShadow, whiteSpace:'nowrap' }}>◀ BACK</button>
            <div style={{ flex:1, height:'10px', background:T.panel2, border:`2px solid ${T.border}`, borderRadius:T.radius, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${progressPct}%`, background:`linear-gradient(90deg,${subjColor},${T.xp})`, transition:'width 0.5s ease' }}/>
            </div>
            <span style={{ fontFamily:T.fontHead, fontSize:'7px', color:T.accent2, whiteSpace:'nowrap' }}>STEP {currentStep+1}/{totalSteps}</span>
          </div>

          {/* Subject + topic header */}
          <div style={{ display:'flex', alignItems:'center', gap:'10px', flexWrap:'wrap' }}>
            <span style={{ fontSize:'11px', fontWeight:800, background:`${subjColor}20`, color:subjColor, padding:'3px 10px', borderRadius:'50px' }}>
              {SUBJECT_ICONS[subjSlug]} {topic?.subject?.label_en}
            </span>
            <span style={{ fontFamily:T.fontHead, fontSize:'8px', color:T.accent2 }}>{topic?.title_en}</span>
            {topic?.title_he && <span style={{ fontSize:'11px', color:T.text2, fontFamily:'serif', direction:'rtl' }}>{topic.title_he}</span>}
          </div>

          {/* Learn panel */}
          <div style={{ background:T.panel, border:`${theme==='minecraft'?3:1}px solid ${T.border}`, borderRadius:T.radius, padding:'18px', boxShadow:T.shadow }}>
            <div style={{ background:T.panel2, border:`2px solid ${T.border}`, borderLeft:`5px solid ${subjColor}`, padding:'14px', marginBottom:'12px' }}>
              <div style={{ fontFamily:T.fontHead, fontSize:'6px', color:subjColor, marginBottom:'8px' }}>📘 LEARN THIS</div>
              {getLearnContent(topic, T)}
            </div>
            {langMode !== 'en_only' && topic?.description_he && (
              <div style={{ padding:'8px 12px', fontSize:'13px', lineHeight:1.7, direction:'rtl', textAlign:'right', border:`1px solid ${T.border}`, borderRadius:T.radius, background:'rgba(0,0,0,0.03)', fontFamily:'"Times New Roman",serif', color:subjColor, marginBottom:'10px' }}>
                🇮🇱 {topic.description_he}
              </div>
            )}
            <div style={{ display:'flex', gap:'8px' }}>
              <button onClick={() => speak(topic?.description_en || topic?.title_en || '', 'en')} style={{ background:T.panel, border:`2px solid ${T.border}`, borderRadius:T.radius, padding:'5px 10px', cursor:'pointer', fontSize:'12px', color:T.text, boxShadow:T.btnShadow }}>
                🔊 <span style={{ background:T.accent3, color:'#000', borderRadius:'4px', padding:'1px 7px', fontSize:'10px', fontWeight:800 }}>EN</span>
              </button>
              {langMode !== 'en_only' && (
                <button onClick={() => speak(topic?.description_he || topic?.title_he || '', 'he')} style={{ background:T.panel, border:`2px solid ${T.border}`, borderRadius:T.radius, padding:'5px 10px', cursor:'pointer', fontSize:'12px', color:T.text, boxShadow:T.btnShadow }}>
                  🔊 <span style={{ background:T.accent2, color:'#000', borderRadius:'4px', padding:'1px 7px', fontSize:'10px', fontWeight:800 }}>עב</span>
                </button>
              )}
            </div>
          </div>

          {/* Question panel */}
          {currentQ ? (
            <div style={{ background:T.panel2, border:`${theme==='minecraft'?3:2}px solid ${T.border}`, borderRadius:T.radius, padding:'16px', boxShadow:T.shadow }}>
              <div style={{ fontFamily:T.fontHead, fontSize:'6px', color:T.accent4, marginBottom:'10px' }}>⚔️ PRACTICE QUESTION</div>
              <div style={{ marginBottom:'10px' }}>
                {langMode !== 'he_only' && <p style={{ fontSize:'14px', fontWeight:700, color:T.text, margin:'0 0 6px' }}>{currentQ.prompt_en}</p>}
                {langMode !== 'en_only' && currentQ.prompt_he && (
                  <p style={{ fontSize:'13px', color:subjColor, direction:'rtl', textAlign:'right', fontFamily:'"Times New Roman",serif', margin:0 }}>{currentQ.prompt_he}</p>
                )}
              </div>

              {currentQ.visual_data?.type === 'fraction' && (
                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'5px', padding:'12px', background:T.panel, border:`2px dashed ${T.border}`, borderRadius:T.radius, marginBottom:'12px', flexWrap:'wrap' }}>
                  {[...Array(currentQ.visual_data.d||8)].map((_,i) => (
                    <div key={i} style={{ width:'26px', height:'26px', background:i<(currentQ.visual_data.n||3)?subjColor:'transparent', border:`2px solid ${T.border}`, borderRadius:'4px' }}/>
                  ))}
                </div>
              )}

              {currentQ.options && (
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'12px' }}>
                  {currentQ.options.map((opt: any) => {
                    const isCorrect = opt.isCorrect && answered
                    const isWrong = selected===opt.label && !opt.isCorrect && answered
                    return (
                      <button key={opt.label} onClick={() => checkAnswer(opt)} disabled={answered}
                        style={{ background:isCorrect?'rgba(0,200,83,0.15)':isWrong?'rgba(224,48,48,0.15)':T.panel, border:`2px solid ${isCorrect?T.accent3:isWrong?'#E03030':T.border}`, borderRadius:T.radius, padding:'11px 12px', cursor:answered?'default':'pointer', fontFamily:'Georgia,serif', fontSize:'15px', fontWeight:800, boxShadow:T.btnShadow, display:'flex', alignItems:'center', gap:'8px', color:T.text }}>
                        <span style={{ width:'20px', height:'20px', background:T.panel2, border:`1px solid ${T.border}`, borderRadius:T.radius, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:T.fontHead, fontSize:'7px', flexShrink:0 }}>{opt.label}</span>
                        {opt.value_en}
                      </button>
                    )
                  })}
                </div>
              )}

              {hintVisible && currentQ.hint_en && (
                <div style={{ background:'rgba(255,215,0,0.07)', border:`2px solid ${T.accent2}`, borderRadius:T.radius, padding:'10px 12px', marginBottom:'10px' }}>
                  <div style={{ fontFamily:T.fontHead, fontSize:'6px', color:T.accent2, marginBottom:'4px' }}>💡 HINT</div>
                  <p style={{ fontSize:'13px', color:T.text2, margin:0 }}>{currentQ.hint_en}</p>
                </div>
              )}

              {feedback && (
                <div style={{ border:`2px solid ${feedback.correct?T.accent3:'#E03030'}`, background:feedback.correct?'rgba(0,200,83,0.1)':'rgba(224,48,48,0.1)', borderRadius:T.radius, padding:'12px 14px', display:'flex', alignItems:'flex-start', gap:'10px', marginBottom:'10px' }}>
                  <span style={{ fontSize:'24px' }}>{feedback.correct?'🎉':'💔'}</span>
                  <div>
                    <div style={{ fontFamily:T.fontHead, fontSize:'8px', color:feedback.correct?T.accent3:'#E03030', marginBottom:'3px' }}>{feedback.correct?'CORRECT!':'NOT QUITE!'}</div>
                    <div style={{ fontSize:'12px', color:T.text2, lineHeight:1.6 }}>{feedback.explanation}</div>
                  </div>
                </div>
              )}

              <div style={{ display:'flex', gap:'8px' }}>
                <button onClick={() => setHint(v=>!v)} style={{ padding:'9px 14px', fontFamily:T.fontHead, fontSize:'7px', background:T.panel, border:`2px solid ${T.accent2}`, color:T.accent2, borderRadius:T.radius, cursor:'pointer', boxShadow:T.btnShadow }}>💡</button>
                <button onClick={() => { setQIndex(i=>(i+1)%Math.max(questions.length,1)); setAnswered(false); setSelected(null); setFeedback(null); setHint(false) }} style={{ padding:'9px 14px', fontFamily:T.fontHead, fontSize:'7px', background:T.panel, border:`2px solid ${T.accent3}`, color:T.accent3, borderRadius:T.radius, cursor:'pointer', boxShadow:T.btnShadow }}>🔄</button>
                <button onClick={nextStep} style={{ padding:'9px 16px', fontFamily:T.fontHead, fontSize:'7px', background:T.accent1, border:'none', color:'white', borderRadius:T.radius, cursor:'pointer', boxShadow:T.btnShadow, flex:1 }}>NEXT ▶</button>
              </div>
            </div>
          ) : (
            <div style={{ background:T.panel, border:`2px solid ${T.border}`, borderRadius:T.radius, padding:'24px', textAlign:'center', color:T.text2 }}>
              <div style={{ fontSize:'32px', marginBottom:'12px' }}>📚</div>
              <div style={{ fontFamily:T.fontHead, fontSize:'9px', color:T.accent2, marginBottom:'8px' }}>NO QUESTIONS YET</div>
              <p style={{ fontSize:'13px' }}>Questions for this topic are coming soon!</p>
              <button onClick={goBack} style={{ marginTop:'12px', padding:'8px 20px', background:T.accent1, border:'none', borderRadius:T.radius, color:'white', fontFamily:T.fontHead, fontSize:'7px', cursor:'pointer' }}>BACK</button>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>

          {/* Mascot */}
          <div style={{ background:T.panel, border:`${theme==='minecraft'?3:2}px solid ${T.accent2}`, borderRadius:T.radius, padding:'14px', textAlign:'center', boxShadow:T.shadow }}>
            <span style={{ fontSize:'56px', display:'block' }}>{TD.mascot}</span>
            <div style={{ fontFamily:T.fontHead, fontSize:'7px', color:T.accent2, margin:'6px 0 3px' }}>PIP SAYS:</div>
            <div style={{ background:T.panel2, border:`1px solid ${T.border}`, borderRadius:T.radius, padding:'8px', fontSize:'11px', color:T.text2, lineHeight:1.5, textAlign:'left' }}>{pipText}</div>
          </div>

          {/* Subject switcher */}
          <div style={{ background:T.panel, border:`2px solid ${T.border}`, borderRadius:T.radius, padding:'10px', boxShadow:T.shadow }}>
            <div style={{ fontFamily:T.fontHead, fontSize:'6px', color:T.accent2, marginBottom:'8px' }}>📚 SUBJECTS</div>
            <div style={{ display:'flex', gap:'6px' }}>
              {['math','english','hebrew'].map(s => (
                <button key={s} onClick={() => {
                  const first = allTopics.find((t: any) => t.subject?.slug === s)
                  if (first) navigateToTopic(first.id)
                }} style={{ flex:1, padding:'6px 4px', background:subjSlug===s?`${SUBJECT_COLORS[s]}20`:T.panel2, border:`2px solid ${subjSlug===s?SUBJECT_COLORS[s]:T.border}`, borderRadius:T.radius, cursor:'pointer', fontSize:'16px', display:'flex', flexDirection:'column', alignItems:'center', gap:'2px' }}>
                  <span>{SUBJECT_ICONS[s]}</span>
                  <span style={{ fontFamily:T.fontHead, fontSize:'5px', color:subjSlug===s?SUBJECT_COLORS[s]:T.text2 }}>{s.toUpperCase().slice(0,4)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Topics list */}
          <div style={{ background:T.panel, border:`${theme==='minecraft'?3:2}px solid ${T.border}`, borderRadius:T.radius, overflow:'hidden', boxShadow:T.shadow }}>
            <div style={{ background:T.panel2, borderBottom:`2px solid ${T.border}`, padding:'8px 12px', fontFamily:T.fontHead, fontSize:'6px', color:subjColor }}>
              📋 {topic?.subject?.label_en?.toUpperCase() || 'TOPICS'}
            </div>
            <div style={{ maxHeight:'320px', overflowY:'auto' }}>
              {allTopics.slice(0,15).map((t: any, i: number) => {
                const isActive = t.id === topic?.id
                const tp = progressMap[t.id]
                const isDone = tp?.status === 'completed'
                const isInProg = tp?.status === 'in_progress'
                return (
                  <div key={t.id} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'8px 10px', borderBottom:`1px solid rgba(128,128,128,0.1)`, background:isActive?`${subjColor}22`:'transparent', cursor:'pointer' }}
                    onClick={() => navigateToTopic(t.id)}>
                    <div style={{ width:'20px', height:'20px', borderRadius:T.radius, background:isActive?subjColor:isDone?'#27AE60':T.panel2, border:`2px solid ${isActive?subjColor:isDone?'#27AE60':T.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:T.fontHead, fontSize:'6px', color:isActive||isDone?'white':T.text2, flexShrink:0 }}>
                      {isDone?'✓':i+1}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:'11px', fontWeight:700, color:T.text, lineHeight:1.3 }}>{t.title_en}</div>
                      {isInProg && <div style={{ fontSize:'9px', color:subjColor, marginTop:'1px' }}>In progress</div>}
                    </div>
                    <div style={{ fontFamily:T.fontHead, fontSize:'5px', color:T.xp, flexShrink:0 }}>+{t.xp_reward}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
