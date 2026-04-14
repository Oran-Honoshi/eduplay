'use client'
import { useState } from 'react'
import MathVisual from '@/components/MathVisual'


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
  minecraft:  { bg:'#1A1A2E', panel:'#2D2D2D', panel2:'#1a1a1a', border:'#555', accent1:'#5D9E2F', accent2:'#FFD700', accent3:'#39D9D9', accent4:'#FF6B00', xp:'#82FF00', text:'#F5F5DC', text2:'rgba(245,245,220,0.6)', radius:'0px', fontHead:'"Press Start 2P",monospace', shadow:'4px 4px 0 rgba(0,0,0,0.7)', btnShadow:'4px 4px 0 #000' },
  princesses: { bg:'#FFF0F8', panel:'#FFFFFF', panel2:'#FFF0F8', border:'#F4AFCF', accent1:'#E05BA0', accent2:'#FFD700', accent3:'#9B59B6', accent4:'#FF8C69', xp:'#E05BA0', text:'#3D1A2E', text2:'rgba(61,26,46,0.6)', radius:'20px', fontHead:'"Cinzel Decorative",serif', shadow:'0 8px 24px rgba(224,91,160,0.18)', btnShadow:'0 4px 16px rgba(224,91,160,0.35)' },
  plain:      { bg:'#F8F9FA', panel:'#FFFFFF', panel2:'#F8F9FA', border:'#DEE2E6', accent1:'#4A90D9', accent2:'#F0A500', accent3:'#27AE60', accent4:'#E67E22', xp:'#27AE60', text:'#212529', text2:'#6C757D', radius:'12px', fontHead:'"Nunito",sans-serif', shadow:'0 2px 12px rgba(0,0,0,0.08)', btnShadow:'0 2px 8px rgba(0,0,0,0.12)' },
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

const lessonStyles = `
  @media (max-width: 767px) {
    .lesson-grid { grid-template-columns: 1fr !important; }
    .lesson-sidebar { display: none !important; }
    .lesson-header { padding: 0 10px !important; height: 48px !important; }
    .lesson-header-controls { gap: 6px !important; }
    .font-size-controls { display: none !important; }
  }
`

function getLearnContent(topic: any, T: any) {
  const slug = topic?.slug || ''
  const subj = topic?.subject?.slug || ''

  if (subj === 'hebrew' && !slug.includes('aleph') && !slug.includes('nikud') &&
      !slug.includes('binyan') && !slug.includes('paal') && !slug.includes('dikduk')) {
    return (
      <>
        <p style={{ fontSize:'13px', lineHeight:1.75, color:T.text2, margin:'0 0 10px', direction:'rtl', textAlign:'right' }}>
          <strong style={{ color:T.text }}>{topic?.title_he || topic?.title_en}</strong> — עבדו על השאלות כדי לשפר את העברית שלכם.
        </p>
        <div style={{ padding:'14px', background:T.panel, border:`1px solid ${T.border}`, borderRadius:T.radius, margin:'8px 0', color:T.text, fontSize:'13px', lineHeight:1.8, direction:'rtl', textAlign:'right' }}>
          <div>📖 קראו כל שאלה בעיון</div>
          <div>💡 השתמשו ברמז אם צריך</div>
          <div>⭐ צברו XP על כל תשובה נכונה</div>
        </div>
        {topic?.description_he && (
          <p style={{ fontSize:'13px', color:T.text2, margin:0, direction:'rtl', textAlign:'right', fontFamily:'serif' }}>
            {topic.description_he}
          </p>
        )}
      </>
    )
  }

  if (subj === 'english' && !slug.includes('grammar') && !slug.includes('reading') &&
      !slug.includes('writing') && !slug.includes('phonics') && !slug.includes('vocabulary')) {
    return (
      <>
        <p style={{ fontSize:'13px', lineHeight:1.75, color:T.text2, margin:'0 0 10px' }}>
          <strong style={{ color:T.text }}>{topic?.title_en}</strong> — work through the questions to improve your English skills.
        </p>
        <div style={{ padding:'14px', background:T.panel, border:`1px solid ${T.border}`, borderRadius:T.radius, margin:'8px 0', color:T.text, fontSize:'13px', lineHeight:1.8 }}>
          <div>📖 Read each question carefully</div>
          <div>💡 Use the hint if you need help</div>
          <div>⭐ Earn XP for every correct answer</div>
        </div>
        {topic?.description_en && (
          <p style={{ fontSize:'13px', color:T.text2, margin:0 }}>{topic.description_en}</p>
        )}
      </>
    )
  }

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

  if (slug.includes('decimal')) {
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
          x + 5 = 12 → x = 7
        </div>
        <p style={{ fontSize:'13px', color:T.text2, margin:0 }}>Do the <strong style={{ color:T.accent3 }}>opposite operation</strong> on both sides to solve.</p>
      </>
    )
  }

  if (slug.includes('geometry') || slug.includes('shape') || slug.includes('area') || slug.includes('perimeter') || slug.includes('volume') || slug.includes('surface') || slug.includes('triangle')) {
    return (
      <>
        <p style={{ fontSize:'13px', lineHeight:1.75, color:T.text2, margin:'0 0 10px' }}><strong style={{ color:T.text }}>Area</strong> = length × width. <strong style={{ color:T.text }}>Perimeter</strong> = sum of all sides.</p>
        <div style={{ textAlign:'center', padding:'14px', background:T.panel, border:`1px solid ${T.border}`, borderRadius:T.radius, margin:'8px 0', color:T.text, fontSize:'13px' }}>
          📐 Rectangle: A = l × w | Triangle: A = ½ × b × h
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

  if (slug.includes('multiplication') || slug.includes('times_table') || slug.includes('division') || slug.includes('averages')) {
    return (
      <>
        <p style={{ fontSize:'13px', lineHeight:1.75, color:T.text2, margin:'0 0 10px' }}><strong style={{ color:T.text }}>Multiplication</strong> is repeated addition. <strong style={{ color:T.text }}>Division</strong> is equal sharing.</p>
        <div style={{ textAlign:'center', padding:'14px', background:T.panel, border:`1px solid ${T.border}`, borderRadius:T.radius, margin:'8px 0', color:T.text, fontFamily:'Georgia,serif', fontSize:'18px' }}>
          4 × 3 = 12 | 12 ÷ 3 = 4
        </div>
        <p style={{ fontSize:'13px', color:T.text2, margin:0 }}>Average = <strong style={{ color:T.accent3 }}>sum of all numbers ÷ count</strong></p>
      </>
    )
  }

  if (slug.includes('addition') || slug.includes('subtraction')) {
    return (
      <>
        <p style={{ fontSize:'13px', lineHeight:1.75, color:T.text2, margin:'0 0 10px' }}><strong style={{ color:T.text }}>Addition</strong> puts numbers together. <strong style={{ color:T.text }}>Subtraction</strong> takes away.</p>
        <div style={{ textAlign:'center', padding:'14px', background:T.panel, border:`1px solid ${T.border}`, borderRadius:T.radius, margin:'8px 0', color:T.text, fontFamily:'Georgia,serif', fontSize:'18px' }}>
          7 + 5 = 12 | 12 − 5 = 7
        </div>
        <p style={{ fontSize:'13px', color:T.text2, margin:0 }}>They are <strong style={{ color:T.accent3 }}>opposite operations</strong>.</p>
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

  if (slug.includes('grammar') || slug.includes('noun') || slug.includes('verb') || slug.includes('sentence') || slug.includes('clause') || slug.includes('dikduk') || slug.includes('binyan') || slug.includes('paal')) {
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

  if (slug.includes('aleph') || slug.includes('nikud') || slug.includes('kriya') || slug.includes('ktiva')) {
    return (
      <>
        <p style={{ fontSize:'13px', lineHeight:1.75, color:T.text2, margin:'0 0 10px' }}>עברית כתובה מ<strong style={{ color:T.text }}>ימין לשמאל</strong> ויש בה 22 אותיות.</p>
        <div style={{ textAlign:'center', padding:'14px', background:T.panel, border:`1px solid ${T.border}`, borderRadius:T.radius, margin:'8px 0', color:T.text, fontSize:'22px', fontFamily:'serif', direction:'rtl', letterSpacing:'6px' }}>
          א ב ג ד ה ו ז ח ט י
        </div>
        <p style={{ fontSize:'13px', color:T.text2, margin:0, direction:'rtl', textAlign:'right' }}>הניקוד עוזר לנו לדעת איך לבטא את המילים.</p>
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
      </>
    )
  }

  return (
    <>
      <p style={{ fontSize:'13px', lineHeight:1.75, color:T.text2, margin:'0 0 10px' }}>
        <strong style={{ color:T.text }}>{topic?.title_en}</strong> — work through the practice questions to master this topic.
      </p>
      <div style={{ padding:'14px', background:T.panel, border:`1px solid ${T.border}`, borderRadius:T.radius, margin:'8px 0', color:T.text2, fontSize:'13px', lineHeight:1.8 }}>
        <div>📖 Read each question carefully</div>
        <div>💡 Use the hint if you need help</div>
        <div>⭐ Earn XP for every correct answer</div>
      </div>
      <p style={{ fontSize:'13px', color:T.text2, margin:0 }}>{topic?.description_en || 'Practice makes perfect!'}</p>
    </>
  )
}

// ── PASSAGE READER ────────────────────────────────────────────
function PassageReader({ passage, questions, T, langMode, isHE, UI, child, topic, subjColor, token, theme, FS }: any) {
  const [phase, setPhase]       = useState<'reading'|'questions'>('reading')
  const [qIndex, setQIndex]     = useState(0)
  const [answered, setAnswered] = useState(false)
  const [selected, setSelected] = useState<string|null>(null)
  const [feedback, setFeedback] = useState<any>(null)
  const [score, setScore]       = useState(0)
  const [done, setDone]         = useState(false)

  const currentQ = questions[qIndex]
  const isRTL    = passage?.is_rtl && isHE

  function checkAnswer(opt: any) {
    if (answered) return
    setAnswered(true)
    setSelected(opt.label)
    const correct = opt.isCorrect
    if (correct) setScore(s => s + 1)
    setFeedback({ correct, explanation: correct ? '✅ ' + UI.correct : '❌ ' + UI.notQuite })
  }

  function next() {
    if (qIndex + 1 >= questions.length) {
      setDone(true)
    } else {
      setQIndex(i => i + 1)
      setAnswered(false)
      setSelected(null)
      setFeedback(null)
    }
  }

  function goBack() {
    if (token) window.location.href = `/play/${token}`
    else window.location.href = '/dashboard'
  }

  if (done) {
    return (
      <div style={{ textAlign:'center', padding:'40px', background:T.panel, border:`2px solid ${T.accent2}`, borderRadius:T.radius, boxShadow:T.shadow }}>
        <div style={{ fontSize:'48px', marginBottom:'12px' }}>🎉</div>
        <h2 style={{ fontFamily:T.fontHead, fontSize:'12px', color:T.accent2, marginBottom:'8px' }}>{UI.complete}</h2>
        <p style={{ fontSize:'14px', color:T.text2, marginBottom:'8px' }}>
          {isHE ? `ענית נכון על ${score} מתוך ${questions.length} שאלות` : `You got ${score} out of ${questions.length} correct!`}
        </p>
        <div style={{ fontSize:'36px', margin:'12px 0' }}>
          {score === questions.length ? '⭐⭐⭐' : score >= questions.length / 2 ? '⭐⭐' : '⭐'}
        </div>
        <div style={{ display:'flex', gap:'10px', justifyContent:'center', marginTop:'16px' }}>
          <button onClick={goBack} style={{ padding:'10px 20px', background:T.accent1, border:'none', borderRadius:T.radius, color:'white', fontFamily:T.fontHead, fontSize:'8px', cursor:'pointer' }}>{UI.home}</button>
          <button onClick={() => { setPhase('reading'); setQIndex(0); setAnswered(false); setSelected(null); setFeedback(null); setScore(0); setDone(false) }}
            style={{ padding:'10px 20px', background:T.accent3, border:'none', borderRadius:T.radius, color:'#000', fontFamily:T.fontHead, fontSize:'8px', cursor:'pointer' }}>{UI.again}</button>
        </div>
      </div>
    )
  }

  if (phase === 'reading') {
    return (
      <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
        <div style={{ background:T.panel, border:`2px solid ${subjColor}`, borderRadius:T.radius, overflow:'hidden', boxShadow:T.shadow }}>
          <div style={{ background:subjColor, padding:'12px 16px', display:'flex', alignItems:'center', gap:'10px' }}>
            <span style={{ fontSize:'20px' }}>📖</span>
            <div>
              <div style={{ fontFamily:T.fontHead, fontSize:'8px', color:'white', opacity:.8 }}>{isHE ? 'קטע לקריאה' : 'READING PASSAGE'}</div>
              <div style={{ fontWeight:800, fontSize:'14px', color:'white' }}>{isHE && passage.title_he ? passage.title_he : passage.title_en}</div>
            </div>
            <span style={{ marginLeft:'auto', fontSize:'10px', fontWeight:800, background:'rgba(255,255,255,0.2)', color:'white', padding:'3px 10px', borderRadius:'50px' }}>
              {passage.passage_type}
            </span>
          </div>
          <div style={{ padding:'20px', maxHeight:'420px', overflowY:'auto' }}>
            {!isHE && passage.content_en && (
              <p style={{ fontSize:`${FS?.passage || 14}px`, lineHeight:1.9, color:T.text, margin:0, fontFamily:'"Georgia",serif' }}>
                {passage.content_en}
              </p>
            )}
            {isHE && passage.content_he && (
              <p style={{ fontSize:`${FS?.passage || 14}px`, lineHeight:1.9, color:T.text, margin:0, fontFamily:'"Times New Roman",serif', direction:'rtl', textAlign:'right' }}>
                {passage.content_he}
              </p>
            )}
            {!isHE && langMode === 'bilingual' && passage.content_he && (
              <div style={{ marginTop:'16px', padding:'14px', background:T.panel2, border:`1px solid ${T.border}`, borderRadius:T.radius }}>
                <div style={{ fontSize:'10px', fontWeight:800, color:T.text2, marginBottom:'8px' }}>🇮🇱 Hebrew</div>
                <p style={{ fontSize:'13px', lineHeight:1.9, color:T.text2, margin:0, fontFamily:'"Times New Roman",serif', direction:'rtl', textAlign:'right' }}>
                  {passage.content_he}
                </p>
              </div>
            )}
          </div>
        </div>
        {questions.length > 0 && (
          <button onClick={() => setPhase('questions')}
            style={{ padding:'14px', background:`linear-gradient(135deg,${subjColor},${T.xp})`, border:'none', borderRadius:T.radius, color:'white', fontFamily:T.fontHead, fontSize:'9px', cursor:'pointer', boxShadow:T.btnShadow }}>
            {isHE ? '← עבור לשאלות הבנה' : 'ANSWER COMPREHENSION QUESTIONS →'}
          </button>
        )}
      </div>
    )
  }

  // Questions phase
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
        <span style={{ fontFamily:T.fontHead, fontSize:'7px', color:T.text2 }}>
          {isHE ? `שאלה ${qIndex+1} מתוך ${questions.length}` : `Question ${qIndex+1} of ${questions.length}`}
        </span>
        <div style={{ flex:1, height:'8px', background:T.panel2, border:`1px solid ${T.border}`, borderRadius:T.radius, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${((qIndex+1)/questions.length)*100}%`, background:subjColor, transition:'width 0.3s' }}/>
        </div>
        <span style={{ fontFamily:T.fontHead, fontSize:'7px', color:T.accent2 }}>{score}/{questions.length}</span>
      </div>

      <div style={{ background:T.panel2, border:`2px solid ${T.border}`, borderRadius:T.radius, padding:'16px', boxShadow:T.shadow }}>
        <div style={{ fontFamily:T.fontHead, fontSize:'6px', color:T.accent4, marginBottom:'10px' }}>❓ {UI.practice}</div>

        {currentQ?.prompt_en && !isHE && (
          <p style={{ fontSize:`${FS?.question || 14}px`, fontWeight:700, color:T.text, margin:'0 0 8px', lineHeight:1.5 }}>{currentQ.prompt_en}</p>
        )}
        {currentQ?.prompt_he && (isHE || langMode === 'bilingual') && (
          <p style={{ fontSize:`${FS?.question || 13}px`, color:subjColor, direction:'rtl', textAlign:'right', fontFamily:'"Times New Roman",serif', margin:'0 0 10px', lineHeight:1.6 }}>{currentQ.prompt_he}</p>
        )}

        {currentQ?.options && (
          <div style={{ display:'flex', flexDirection:'column', gap:'8px', marginBottom:'12px' }}>
            {currentQ.options.map((opt: any) => {
              const isCorrect  = opt.isCorrect && answered
              const isWrong    = selected === opt.label && !opt.isCorrect && answered
              const displayVal = isHE ? (opt.value_he || opt.value_en || '') : (opt.value_en || '')
              return (
                <button key={opt.label} onClick={() => checkAnswer(opt)} disabled={answered}
                  style={{ background:isCorrect?'rgba(0,200,83,0.15)':isWrong?'rgba(224,48,48,0.15)':T.panel, border:`2px solid ${isCorrect?T.accent3:isWrong?'#E03030':T.border}`, borderRadius:T.radius, padding:'10px 14px', cursor:answered?'default':'pointer', fontSize:'13px', fontWeight:700, display:'flex', alignItems:'center', gap:'10px', color:T.text, textAlign:isRTL?'right':'left', direction:isRTL?'rtl':'ltr', fontFamily:isRTL?'"Times New Roman",serif':'"Nunito",sans-serif' }}>
                  <span style={{ width:'22px', height:'22px', background:T.panel2, border:`1px solid ${T.border}`, borderRadius:T.radius, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'"Noto Serif Hebrew","Times New Roman",serif', fontSize:'11px', flexShrink:0 }}>{opt.label}</span>
                  {displayVal}
                </button>
              )
            })}
          </div>
        )}

        {currentQ?.hint_he && isHE && !answered && (
          <div style={{ fontSize:'12px', color:T.accent2, padding:'6px 10px', background:`${T.accent2}15`, borderRadius:T.radius, marginBottom:'8px', direction:'rtl', textAlign:'right' }}>
            💡 {currentQ.hint_he}
          </div>
        )}
        {currentQ?.hint_en && !isHE && !answered && (
          <div style={{ fontSize:'12px', color:T.accent2, padding:'6px 10px', background:`${T.accent2}15`, borderRadius:T.radius, marginBottom:'8px' }}>
            💡 {currentQ.hint_en}
          </div>
        )}

        {feedback && (
          <div style={{ border:`2px solid ${feedback.correct?T.accent3:'#E03030'}`, background:feedback.correct?'rgba(0,200,83,0.1)':'rgba(224,48,48,0.1)', borderRadius:T.radius, padding:'10px 14px', marginBottom:'10px', fontSize:'13px', color:T.text2 }}>
            {feedback.explanation}
            {currentQ?.explanation_en && (
              <div style={{ marginTop:'6px', fontSize:'12px' }}>{currentQ.explanation_en}</div>
            )}
          </div>
        )}

        <div style={{ display:'flex', gap:'8px' }}>
          <button onClick={() => setPhase('reading')} style={{ padding:'8px 12px', fontFamily:T.fontHead, fontSize:'6px', background:T.panel, border:`2px solid ${T.border}`, color:T.text2, borderRadius:T.radius, cursor:'pointer' }}>
            📖 {isHE ? 'חזור לקטע' : 'RE-READ'}
          </button>
          {answered && (
            <button onClick={next} style={{ flex:1, padding:'9px 16px', fontFamily:T.fontHead, fontSize:'7px', background:subjColor, border:'none', color:'white', borderRadius:T.radius, cursor:'pointer', boxShadow:T.btnShadow }}>
              {qIndex + 1 >= questions.length ? (isHE ? 'סיים ✓' : 'FINISH ✓') : (isHE ? 'הבא ▶' : 'NEXT ▶')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── MAIN LESSON CLIENT ────────────────────────────────────────
export default function LessonClient({ child, topic, questions, passage, passageQuestions, isReadingTopic, allTopics, subjects, progress, difficulty }: any) {
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  const theme     = (urlParams?.get('theme') || child?.theme || 'plain') as string
  const token     = urlParams?.get('token') || ''
  const langMode  = (urlParams?.get('lang') || child?.lang_screen || 'bilingual') as string

  const T   = THEMES[theme] || THEMES.plain
  const TD  = MASCOTS[theme] || MASCOTS.plain
  const subjSlug  = topic?.subject?.slug || 'math'
  const subjColor = SUBJECT_COLORS[subjSlug] || T.accent1
  const isHE      = langMode === 'he_only'

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
  const [fontSize, setFontSize]   = useState<'small'|'medium'|'large'|'xl'>(
    (urlParams?.get('fs') || child?.font_size || 'medium') as 'small'|'medium'|'large'|'xl'
  )

  const FS = {
    small:  { base: 11, question: 12, passage: 12 },
    medium: { base: 13, question: 14, passage: 14 },
    large:  { base: 15, question: 17, passage: 16 },
    xl:     { base: 18, question: 20, passage: 19 },
  }[fontSize]

  const currentQ   = questions[qIndex]
  const progressPct = Math.round((currentStep / totalSteps) * 100)

  const UI = {
    learnThis:   isHE ? 'למד זאת'                     : 'LEARN THIS',
    practice:    isHE ? 'שאלת תרגול'                   : 'PRACTICE QUESTION',
    hint:        isHE ? 'רמז'                          : 'HINT',
    correct:     isHE ? '!כל הכבוד'                   : 'CORRECT!',
    notQuite:    isHE ? 'לא בדיוק!'                    : 'NOT QUITE!',
    next:        isHE ? 'הבא ▶'                        : 'NEXT ▶',
    back:        isHE ? '◀ חזור'                       : '◀ BACK',
    noQuestions: isHE ? 'אין שאלות עדיין'              : 'NO QUESTIONS YET',
    comingSoon:  isHE ? 'שאלות לנושא זה יתווספו בקרוב!' : 'Questions coming soon!',
    pipSays:     isHE ? 'פיפ אומר:'                   : 'PIP SAYS:',
    topics:      isHE ? 'נושאים'                       : 'TOPICS',
    subjects:    isHE ? 'מקצועות'                      : 'SUBJECTS',
    step:        isHE ? 'שלב'                          : 'STEP',
    home:        isHE ? 'בית'                          : 'HOME',
    again:       isHE ? 'שוב'                          : 'AGAIN',
    complete:    isHE ? '!השיעור הושלם'                : 'LESSON COMPLETE! 🎉',
    mastered:    isHE ? 'שלטת ב'                       : 'You mastered',
    xpEarned:   isHE ? '!צברת 100 XP'                 : '+100 XP earned!',
    inProgress:  isHE ? 'בתהליך'                       : 'In progress',
  }

  function navigateToTopic(topicId: string) {
    window.location.href = `/lesson?topicId=${topicId}&childId=${child?.id}&theme=${theme}${token?`&token=${token}`:''}&lang=${langMode}`
  }

  function goBack() {
    if (currentStep > 0) {
      fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId: child?.id, topicId: topic?.id, stepNumber: currentStep, totalSteps }),
      }).catch(() => {})
    }
    if (token) window.location.href = `/play/${token}`
    else window.location.href = '/dashboard'
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

  async function changeFontSize(newSize: 'small'|'medium'|'large'|'xl') {
    setFontSize(newSize)
    try {
      await fetch('/api/children', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId: child?.id, font_size: newSize }),
      })
    } catch {}
  }

  async function checkAnswer(opt: any) {
    if (answered) return
    setAnswered(true)
    setSelected(opt.label)
    const correct = opt.isCorrect
    setFeedback({ correct, explanation: correct ? (currentQ.explanation_en || 'Correct! Well done!') : (currentQ.hint_en || 'Not quite — try the hint!') })
    setPip(correct ? '🎉 Excellent! You nailed it!' : "💡 Don't give up!")
    if (correct) {
      setXp((b: number) => b + 25)
      showXP('+25 XP ⬆')
      try {
        await fetch('/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ childId: child?.id, questionId: currentQ.id, topicId: topic?.id, answerGiven: opt.label, correct, hintUsed: hintVisible, stepNumber: currentStep, totalSteps }),
        })
      } catch {}
    }
  }

  function nextStep() {
    if (!answered) { setPip('⚠️ Answer the question first!'); return }
    const next = currentStep + 1
    if (next >= totalSteps) {
      fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId: child?.id, topicId: topic?.id, stepNumber: totalSteps, totalSteps }),
      }).catch(() => {})
      // Trigger relief if configured
      const reliefTrigger = child?.relief_trigger || 'topic'
      if (reliefTrigger === 'lesson' || reliefTrigger === 'both') {
        setTimeout(() => {
          window.location.href = `/relief?childId=${child?.id}&grade=${child?.grade||0}&token=${token}&returnTo=${token?`/play/${token}`:'/dashboard'}`
        }, 1500)
      }
      setCompleted(true)
      return
    }
    setCurrentStep(next)
    setQIndex(i => Math.min(i + 1, questions.length - 1))
    setAnswered(false); setSelected(null); setFeedback(null); setHint(false)
    setPip(TD.pip)
  }

  return (
    <div style={{ minHeight:'100vh', background:T.bg, color:T.text, fontFamily:'"Nunito",sans-serif', overflowX:'hidden' }} dir={isHE ? 'rtl' : 'ltr'}>
      <style>{lessonStyles}</style>

      {xpNotif && (
        <div style={{ position:'fixed', top:'70px', right:'20px', zIndex:9999, background:T.panel, border:`3px solid ${T.xp}`, borderRadius:T.radius, padding:'10px 18px', fontFamily:T.fontHead, fontSize:'11px', color:T.xp, boxShadow:T.shadow, pointerEvents:'none' }}>
          {xpNotif}
        </div>
      )}

      {completed && (
        <div style={{ position:'fixed', inset:0, zIndex:9998, background:'rgba(0,0,0,0.85)', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
          <div style={{ background:T.panel, border:`4px solid ${T.accent2}`, borderRadius:T.radius, padding:'36px', textAlign:'center', maxWidth:'380px', width:'100%', boxShadow:T.shadow }}>
            <h2 style={{ fontFamily:T.fontHead, fontSize:'13px', color:T.accent2, marginBottom:'10px' }}>{UI.complete}</h2>
            <div style={{ fontSize:'44px', letterSpacing:'6px', margin:'12px 0' }}>⭐⭐⭐</div>
            <p style={{ fontSize:'13px', color:T.text2, marginBottom:'20px' }}>{UI.mastered} <strong style={{ color:T.accent2 }}>{isHE ? topic?.title_he || topic?.title_en : topic?.title_en}</strong>!<br/>{UI.xpEarned}</p>
            <div style={{ display:'flex', gap:'10px' }}>
              <button onClick={() => {
                const reliefTrigger = child?.relief_trigger || 'topic'
                if (reliefTrigger === 'lesson' || reliefTrigger === 'both') {
                  window.location.href = `/relief?childId=${child?.id}&grade=${child?.grade||0}&token=${token}&returnTo=${token?`/play/${token}`:'/dashboard'}`
                } else {
                  goBack()
                }
              }} style={{ flex:1, padding:'12px', background:T.accent1, border:'none', borderRadius:T.radius, color:'white', fontFamily:T.fontHead, fontSize:'8px', cursor:'pointer' }}>{UI.home}</button>
              <button onClick={() => { setCompleted(false); setCurrentStep(0); setQIndex(0); setAnswered(false); setSelected(null); setFeedback(null) }} style={{ flex:1, padding:'12px', background:T.accent3, border:'none', borderRadius:T.radius, color:'#000', fontFamily:T.fontHead, fontSize:'8px', cursor:'pointer' }}>{UI.again}</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="lesson-header" style={{ background:theme==='minecraft'?'rgba(0,0,0,0.75)':T.panel, borderBottom:`${theme==='minecraft'?4:1}px solid ${T.border}`, padding:'0 16px', height:'52px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:100, gap:'8px' }}>
        <div style={{ fontFamily:T.fontHead, fontSize:'11px', color:T.accent1, flexShrink:0 }}>Edu<span style={{ color:T.accent2 }}>Play</span></div>
        <div className="lesson-header-controls" style={{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'nowrap', overflowX:'auto' }}>
          <div style={{ display:'flex', gap:'2px' }}>{[...Array(5)].map((_,i) => <span key={i} style={{ fontSize:'12px', opacity:i<3?1:0.3 }}>❤️</span>)}</div>
          <span style={{ fontFamily:T.fontHead, fontSize:'7px', color:T.xp, flexShrink:0 }}>{xpBalance.toLocaleString()} XP</span>

          {/* Font size controls */}
          <div className="font-size-controls" style={{ display:'flex', gap:'2px', alignItems:'center' }}>
            {(['small','medium','large','xl'] as const).map(size => (
              <button key={size} onClick={() => changeFontSize(size)}
                style={{ padding:'3px 6px', borderRadius:T.radius, border:`2px solid ${fontSize===size?T.accent2:T.border}`, background:fontSize===size?`${T.accent2}20`:T.panel, color:fontSize===size?T.accent2:T.text2, fontFamily:'sans-serif', fontSize:size==='small'?'9px':size==='medium'?'11px':size==='large'?'13px':'15px', fontWeight:800, cursor:'pointer', lineHeight:1 }}>
                {size==='small'?'A-':size==='medium'?'A':size==='large'?'A+':'A++'}
              </button>
            ))}
          </div>

          {/* Language switcher */}
          <div style={{ display:'flex', gap:'3px' }}>
            {['en_only','bilingual','he_only'].map(l => (
              <button key={l}
                onClick={() => window.location.href=`/lesson?topicId=${topic?.id}&childId=${child?.id}&theme=${theme}&lang=${l}${token?`&token=${token}`:''}`}
                style={{ padding:'3px 7px', borderRadius:T.radius, border:`2px solid ${langMode===l?T.accent2:T.border}`, background:langMode===l?`${T.accent2}20`:T.panel, color:langMode===l?T.accent2:T.text2, fontFamily:T.fontHead, fontSize:'6px', cursor:'pointer' }}>
                {l==='en_only'?'🇺🇸':l==='bilingual'?'🌐':'🇮🇱'}
              </button>
            ))}
          </div>

          <button onClick={() => window.location.href=`/theme?childId=${child?.id}&name=${child?.display_name}&current=${theme}${token?`&returnTo=/play/${token}`:''}`}
            style={{ background:T.panel, border:`2px solid ${T.border}`, borderRadius:T.radius, padding:'5px 9px', cursor:'pointer', color:T.text, boxShadow:T.btnShadow, fontFamily:T.fontHead, fontSize:'7px', flexShrink:0 }}>
            🎨
          </button>
        </div>
      </header>

      {/* Main grid — sidebar hidden on mobile */}
      <div className="lesson-grid" style={{ display:'grid', gridTemplateColumns:'1fr 260px', gap:'14px', padding:'16px', maxWidth:'1200px', margin:'0 auto' }}>

        {/* Left — main content */}
        <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>

          {/* Progress + back */}
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <button onClick={goBack} style={{ fontFamily:T.fontHead, fontSize:'7px', background:T.panel, border:`2px solid ${T.border}`, color:T.text, padding:'7px 10px', borderRadius:T.radius, cursor:'pointer', boxShadow:T.btnShadow, whiteSpace:'nowrap' }}>{UI.back}</button>
            <div style={{ flex:1, height:'10px', background:T.panel2, border:`2px solid ${T.border}`, borderRadius:T.radius, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${progressPct}%`, background:`linear-gradient(90deg,${subjColor},${T.xp})`, transition:'width 0.5s ease' }}/>
            </div>
            <span style={{ fontFamily:T.fontHead, fontSize:'7px', color:T.accent2, whiteSpace:'nowrap' }}>{UI.step} {currentStep+1}/{totalSteps}</span>
          </div>

          {/* Subject + topic label */}
          <div style={{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap' }}>
            <span style={{ fontSize:'11px', fontWeight:800, background:`${subjColor}20`, color:subjColor, padding:'3px 10px', borderRadius:'50px' }}>
              {SUBJECT_ICONS[subjSlug]} {isHE ? topic?.subject?.label_he || topic?.subject?.label_en : topic?.subject?.label_en}
            </span>
            <span style={{ fontFamily:T.fontHead, fontSize:'8px', color:T.accent2 }}>
              {isHE ? topic?.title_he || topic?.title_en : topic?.title_en}
            </span>
          </div>

          {/* Content area */}
          {isReadingTopic && passage ? (
            <PassageReader
              passage={passage}
              questions={passageQuestions}
              T={T} langMode={langMode} isHE={isHE} UI={UI}
              child={child} topic={topic} subjColor={subjColor}
              token={token} theme={theme} FS={FS}
            />
          ) : isReadingTopic && !passage ? (
            <div style={{ background:T.panel, border:`2px solid ${T.border}`, borderRadius:T.radius, padding:'32px', textAlign:'center', color:T.text2 }}>
              <div style={{ fontSize:'40px', marginBottom:'12px' }}>📖</div>
              <div style={{ fontFamily:T.fontHead, fontSize:'9px', color:T.accent2, marginBottom:'8px' }}>READING PASSAGES COMING SOON</div>
              <p style={{ fontSize:'13px' }}>Reading passages for this topic are being prepared. Check back soon!</p>
            </div>
          ) : (
            <>
              {/* Learn panel */}
              <div style={{ background:T.panel, border:`${theme==='minecraft'?3:1}px solid ${T.border}`, borderRadius:T.radius, padding:'18px', boxShadow:T.shadow }}>
                <div style={{ background:T.panel2, border:`2px solid ${T.border}`, borderLeft:`5px solid ${subjColor}`, padding:'14px', marginBottom:'12px' }}>
                  <div style={{ fontFamily:T.fontHead, fontSize:'6px', color:subjColor, marginBottom:'8px' }}>📘 {UI.learnThis}</div>
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
                  <div style={{ fontFamily:T.fontHead, fontSize:'6px', color:T.accent4, marginBottom:'10px' }}>⚔️ {UI.practice}</div>
                  <div style={{ marginBottom:'10px' }}>
                    {langMode !== 'he_only' && !isHE && subjSlug !== 'hebrew' && (
                      <p style={{ fontSize:`${FS?.question || 14}px`, fontWeight:700, color:T.text, margin:'0 0 6px' }}>{currentQ.prompt_en}</p>
                    )}
                    {(langMode !== 'en_only' || subjSlug === 'hebrew') && currentQ.prompt_he && (
                      <p style={{ fontSize:`${FS?.question || 13}px`, color:subjColor, direction:'rtl', textAlign:'right', fontFamily:'"Times New Roman",serif', margin:'0 0 6px' }}>{currentQ.prompt_he}</p>
                    )}
                    {subjSlug !== 'hebrew' && langMode !== 'he_only' && !currentQ.prompt_he && (
                      <p style={{ fontSize:`${FS?.question || 14}px`, fontWeight:700, color:T.text, margin:'0 0 6px' }}>{currentQ.prompt_en}</p>
                    )}
                  </div>

                  {currentQ.visual_data && (
  <div style={{ display:'flex', justifyContent:'center', padding:'12px', background:T.panel, border:`2px dashed ${T.border}`, borderRadius:T.radius, marginBottom:'12px' }}>
    <MathVisual
      data={currentQ.visual_data}
      size={200}
      color={subjColor}
      dark={theme === 'minecraft'}
    />
  </div>
)}

                  {currentQ.options && (
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'12px' }}>
                      {currentQ.options.map((opt: any) => {
                        const isCorrect    = opt.isCorrect && answered
                        const isWrong      = selected === opt.label && !opt.isCorrect && answered
                        const isHebSubject = subjSlug === 'hebrew'
                        const displayVal   = isHE
                          ? (opt.value_he || opt.value_en || '')
                          : (opt.value_en || '')
                        const isRTLAnswer  = isHE && isHebSubject
                        return (
                          <button key={opt.label} onClick={() => checkAnswer(opt)} disabled={answered}
                            style={{ background:isCorrect?'rgba(0,200,83,0.15)':isWrong?'rgba(224,48,48,0.15)':T.panel, border:`2px solid ${isCorrect?T.accent3:isWrong?'#E03030':T.border}`, borderRadius:T.radius, padding:'11px 12px', cursor:answered?'default':'pointer', fontFamily:isRTLAnswer?'"Times New Roman",serif':'Georgia,serif', fontSize:`${FS?.question || 14}px`, fontWeight:800, boxShadow:T.btnShadow, display:'flex', alignItems:'center', gap:'8px', color:T.text, direction:isRTLAnswer?'rtl':'ltr', textAlign:isRTLAnswer?'right':'left' }}>
                            <span style={{ width:'20px', height:'20px', background:T.panel2, border:`1px solid ${T.border}`, borderRadius:T.radius, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:T.fontHead, fontSize:'7px', flexShrink:0 }}>{opt.label}</span>
                            {displayVal}
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {hintVisible && currentQ.hint_en && (
                    <div style={{ background:'rgba(255,215,0,0.07)', border:`2px solid ${T.accent2}`, borderRadius:T.radius, padding:'10px 12px', marginBottom:'10px' }}>
                      <div style={{ fontFamily:T.fontHead, fontSize:'6px', color:T.accent2, marginBottom:'4px' }}>💡 {UI.hint}</div>
                      <p style={{ fontSize:'13px', color:T.text2, margin:0 }}>{currentQ.hint_en}</p>
                    </div>
                  )}

                  {feedback && (
                    <div style={{ border:`2px solid ${feedback.correct?T.accent3:'#E03030'}`, background:feedback.correct?'rgba(0,200,83,0.1)':'rgba(224,48,48,0.1)', borderRadius:T.radius, padding:'12px 14px', display:'flex', alignItems:'flex-start', gap:'10px', marginBottom:'10px' }}>
                      <span style={{ fontSize:'24px' }}>{feedback.correct?'🎉':'💔'}</span>
                      <div>
                        <div style={{ fontFamily:T.fontHead, fontSize:'8px', color:feedback.correct?T.accent3:'#E03030', marginBottom:'3px' }}>{feedback.correct?UI.correct:UI.notQuite}</div>
                        <div style={{ fontSize:'12px', color:T.text2, lineHeight:1.6 }}>{feedback.explanation}</div>
                      </div>
                    </div>
                  )}

                  <div style={{ display:'flex', gap:'8px' }}>
                    <button onClick={() => setHint(v=>!v)} style={{ padding:'9px 14px', fontFamily:T.fontHead, fontSize:'7px', background:T.panel, border:`2px solid ${T.accent2}`, color:T.accent2, borderRadius:T.radius, cursor:'pointer', boxShadow:T.btnShadow }}>💡</button>
                    <button onClick={() => { setQIndex(i=>(i+1)%Math.max(questions.length,1)); setAnswered(false); setSelected(null); setFeedback(null); setHint(false) }} style={{ padding:'9px 14px', fontFamily:T.fontHead, fontSize:'7px', background:T.panel, border:`2px solid ${T.accent3}`, color:T.accent3, borderRadius:T.radius, cursor:'pointer', boxShadow:T.btnShadow }}>🔄</button>
                    <button onClick={nextStep} style={{ padding:'9px 16px', fontFamily:T.fontHead, fontSize:'7px', background:T.accent1, border:'none', color:'white', borderRadius:T.radius, cursor:'pointer', boxShadow:T.btnShadow, flex:1 }}>{UI.next}</button>
                  </div>
                </div>
              ) : (
                <div style={{ background:T.panel, border:`2px solid ${T.border}`, borderRadius:T.radius, padding:'24px', textAlign:'center', color:T.text2 }}>
                  <div style={{ fontSize:'32px', marginBottom:'12px' }}>📚</div>
                  <div style={{ fontFamily:T.fontHead, fontSize:'9px', color:T.accent2, marginBottom:'8px' }}>{UI.noQuestions}</div>
                  <p style={{ fontSize:'13px' }}>{UI.comingSoon}</p>
                  <button onClick={goBack} style={{ marginTop:'12px', padding:'8px 20px', background:T.accent1, border:'none', borderRadius:T.radius, color:'white', fontFamily:T.fontHead, fontSize:'7px', cursor:'pointer' }}>{UI.back}</button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right sidebar — hidden on mobile */}
        <div className="lesson-sidebar" style={{ display:'flex', flexDirection:'column', gap:'10px' }}>

          {/* Mascot */}
          <div style={{ background:T.panel, border:`${theme==='minecraft'?3:2}px solid ${T.accent2}`, borderRadius:T.radius, padding:'14px', textAlign:'center', boxShadow:T.shadow }}>
            <span style={{ fontSize:'56px', display:'block' }}>{TD.mascot}</span>
            <div style={{ fontFamily:T.fontHead, fontSize:'7px', color:T.accent2, margin:'6px 0 3px' }}>{UI.pipSays}</div>
            <div style={{ background:T.panel2, border:`1px solid ${T.border}`, borderRadius:T.radius, padding:'8px', fontSize:'11px', color:T.text2, lineHeight:1.5, textAlign:'left' }}>{pipText}</div>
          </div>

          {/* Subject switcher */}
          <div style={{ background:T.panel, border:`2px solid ${T.border}`, borderRadius:T.radius, padding:'10px', boxShadow:T.shadow }}>
            <div style={{ fontFamily:T.fontHead, fontSize:'6px', color:T.accent2, marginBottom:'8px' }}>📚 {UI.subjects}</div>
            <div style={{ display:'flex', gap:'6px' }}>
              {['math','english','hebrew'].map(s => (
                <button key={s} onClick={() => {
                  const subjectTopics = allTopics
                    .filter((t: any) => t.subject?.slug === s)
                    .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
                  const first = subjectTopics[0]
                  if (first) navigateToTopic(first.id)
                }}
                  style={{ flex:1, padding:'6px 4px', background:subjSlug===s?`${SUBJECT_COLORS[s]}20`:T.panel2, border:`2px solid ${subjSlug===s?SUBJECT_COLORS[s]:T.border}`, borderRadius:T.radius, cursor:'pointer', fontSize:'16px', display:'flex', flexDirection:'column', alignItems:'center', gap:'2px' }}>
                  <span>{SUBJECT_ICONS[s]}</span>
                  <span style={{ fontFamily:T.fontHead, fontSize:'5px', color:subjSlug===s?SUBJECT_COLORS[s]:T.text2 }}>{s.toUpperCase().slice(0,4)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Topics list */}
          <div style={{ background:T.panel, border:`${theme==='minecraft'?3:2}px solid ${T.border}`, borderRadius:T.radius, overflow:'hidden', boxShadow:T.shadow }}>
            <div style={{ background:T.panel2, borderBottom:`2px solid ${T.border}`, padding:'8px 12px', fontFamily:T.fontHead, fontSize:'6px', color:subjColor }}>
              📋 {isHE ? topic?.subject?.label_he || UI.topics : topic?.subject?.label_en?.toUpperCase() || UI.topics}
            </div>
            <div style={{ maxHeight:'320px', overflowY:'auto' }}>
              {allTopics.filter((t: any) => t.subject?.slug === subjSlug).slice(0,15).map((t: any, i: number) => {
                const isActive  = t.id === topic?.id
                const tp        = progressMap[t.id]
                const isDone    = tp?.status === 'completed'
                const isInProg  = tp?.status === 'in_progress'
                return (
                  <div key={t.id} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'8px 10px', borderBottom:`1px solid rgba(128,128,128,0.1)`, background:isActive?`${subjColor}22`:'transparent', cursor:'pointer' }}
                    onClick={() => navigateToTopic(t.id)}>
                    <div style={{ width:'20px', height:'20px', borderRadius:T.radius, background:isActive?subjColor:isDone?'#27AE60':T.panel2, border:`2px solid ${isActive?subjColor:isDone?'#27AE60':T.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:T.fontHead, fontSize:'6px', color:isActive||isDone?'white':T.text2, flexShrink:0 }}>
                      {isDone?'✓':i+1}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:'11px', fontWeight:700, color:T.text, lineHeight:1.3 }}>{isHE ? t.title_he || t.title_en : t.title_en}</div>
                      {isInProg && <div style={{ fontSize:'9px', color:subjColor, marginTop:'1px' }}>{UI.inProgress}</div>}
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