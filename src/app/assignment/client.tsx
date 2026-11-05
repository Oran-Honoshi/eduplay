'use client'
import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import MathVisual from '@/components/MathVisual'
import FractionText from '@/components/FractionText'
import HebrewMathText from '@/components/HebrewMathText'
import { ThemeDecorations, CelebrationModal, AnimatedBtn, Sparkles, ThemePanel, THEME_CONFIG, CollectionButton } from '@/components/theme'
import { getFontSize } from '@/lib/fontSize'
import { isDistinctHe, translateOptionLabel } from '@/lib/text'

interface AssignmentItem {
  id: string
  sort_order: number
  status: 'not_started' | 'attempt_1_wrong' | 'correct_first_try' | 'correct_after_hint' | 'revealed_answer'
  attempt_1_answer: string | null
  attempt_2_answer: string | null
  question: {
    id: string
    prompt_en: string
    prompt_he: string | null
    options: { label: string; value_en: string; value_he?: string | null; isCorrect: boolean }[] | null
    hint_en: string | null
    hint_he: string | null
    explanation_en: string | null
    explanation_he?: string | null
    visual_data: any
  }
}

function isResolved(status: string) {
  return status === 'correct_first_try' || status === 'correct_after_hint' || status === 'revealed_answer'
}
function isOpen(status: string) {
  return status === 'not_started' || status === 'attempt_1_wrong'
}

export default function AssignmentClient({ child, assignment, items: initialItems, token }: any) {
  const theme = child.theme || 'plain'
  const T = THEME_CONFIG[theme] || THEME_CONFIG.plain
  const langMode = child.lang_screen || 'bilingual'
  const isHE = langMode === 'he_only'
  const FS = getFontSize(child.font_size)

  const [items, setItems] = useState<AssignmentItem[]>(initialItems)
  const [currentIndex, setCurrentIndex] = useState(() => {
    const idx = (initialItems as AssignmentItem[]).findIndex(it => isOpen(it.status))
    return idx === -1 ? initialItems.length : idx
  })
  const [submitting, setSubmitting] = useState(false)
  const [sparkleActive, setSparkleActive] = useState(false)
  const [celebration, setCelebration] = useState<{ message: string; emoji: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const totalItems = items.length
  const done = currentIndex >= totalItems
  const currentItem = !done ? items[currentIndex] : null
  const currentQ = currentItem?.question

  function goHome() {
    window.location.href = token ? `/play/${token}` : '/dashboard'
  }

  async function submitAnswer(label: string) {
    if (!currentItem || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/assignments/${assignment.id}/items/${currentItem.id}/attempt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answerGiven: label }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Couldn't submit that answer — try again.")
        return
      }

      const wasFirstAttempt = currentItem.status === 'not_started'
      setItems(prev => prev.map(it => it.id !== currentItem.id ? it : {
        ...it,
        status: data.status,
        attempt_1_answer: wasFirstAttempt ? label : it.attempt_1_answer,
        attempt_2_answer: wasFirstAttempt ? it.attempt_2_answer : label,
      }))

      if (data.correct) {
        setSparkleActive(true)
        setTimeout(() => setSparkleActive(false), 1200)
      }
    } catch {
      setError("Couldn't reach the server — check your connection and try again.")
    } finally {
      setSubmitting(false)
    }
  }

  function goNext() {
    const nextIndex = currentIndex + 1
    if (nextIndex >= totalItems) {
      const correctCount = items.filter(it => it.status === 'correct_first_try' || it.status === 'correct_after_hint').length
      setCelebration({
        message: isHE
          ? `סיימת את המטלה! ${correctCount} מתוך ${totalItems} נכון! 🎉`
          : `Assignment complete! ${correctCount} of ${totalItems} correct 🎉`,
        emoji: T.celebrationEmoji || '🎉',
      })
      setTimeout(() => setCelebration(null), 2500)
    }
    setCurrentIndex(nextIndex)
  }

  // ── Completion screen ──────────────────────────────────────────
  if (done) {
    const correctFirstTry  = items.filter(it => it.status === 'correct_first_try').length
    const correctAfterHint = items.filter(it => it.status === 'correct_after_hint').length
    const revealed         = items.filter(it => it.status === 'revealed_answer').length

    return (
      <div style={{ minHeight:'100vh', background:T.bg, fontFamily:'"Nunito",sans-serif', position:'relative', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }} dir={isHE ? 'rtl' : 'ltr'}>
        <ThemeDecorations theme={theme}/>
        <CelebrationModal celebration={celebration} T={T} theme={theme}/>
        <ThemePanel theme={theme} T={T} style={{ padding:'36px', textAlign:'center', maxWidth:'420px', width:'100%', position:'relative', zIndex:1 }}>
          <div style={{ fontSize:'44px', marginBottom:'12px' }}>🎓</div>
          <h2 style={{ fontFamily:T.fontHead, fontSize:theme==='minecraft'?'14px':'20px', color:T.accent1, marginBottom:'14px' }}>
            {isHE ? 'המטלה הושלמה!' : 'Assignment complete!'}
          </h2>
          <div style={{ display:'flex', flexDirection:'column', gap:'8px', marginBottom:'20px', textAlign:isHE?'right':'left' }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:'13px', color:T.text }}>
              <span>✅ {isHE ? 'נכון בפעם הראשונה' : 'Correct first try'}</span><strong>{correctFirstTry}</strong>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:'13px', color:T.text }}>
              <span>💡 {isHE ? 'נכון עם רמז' : 'Correct with hint'}</span><strong>{correctAfterHint}</strong>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:'13px', color:T.text }}>
              <span>👀 {isHE ? 'התשובה נחשפה' : 'Answer revealed'}</span><strong>{revealed}</strong>
            </div>
          </div>
          <button onClick={goHome} style={{ width:'100%', padding:'12px', background:T.accent1, border:'none', borderRadius:T.radius, color:'white', fontFamily:T.fontHead, fontSize:'14px', fontWeight:800, cursor:'pointer' }}>
            {isHE ? 'חזרה הביתה' : 'Back to Home'}
          </button>
        </ThemePanel>
      </div>
    )
  }

  const status = currentItem!.status
  const wrongLabels = [currentItem!.attempt_1_answer, currentItem!.attempt_2_answer].filter(Boolean) as string[]
  const options = currentQ?.options || []
  const correctOption = options.find(o => o.isCorrect)
  const showHint            = status === 'attempt_1_wrong'
  const showReveal          = status === 'revealed_answer'
  const showCorrectFeedback = status === 'correct_first_try' || status === 'correct_after_hint'
  const itemResolved        = isResolved(status)
  const canAnswer           = isOpen(status) && !submitting

  return (
    <div style={{ minHeight:'100vh', background:T.bg, color:T.text, fontFamily:'"Nunito",sans-serif', position:'relative' }} dir={isHE ? 'rtl' : 'ltr'}>
      <ThemeDecorations theme={theme}/>
      <Sparkles active={sparkleActive} theme={theme}/>
      <CelebrationModal celebration={celebration} T={T} theme={theme}/>

      {/* Header */}
      <CollectionButton childId={child.id} token={token} theme={theme} lang={langMode as any} aboveNav={false}/>
      <header style={{ background:T.panel, borderBottom:`2px solid ${T.border}`, padding:'0 16px', height:'56px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:100 }}>
        <button onClick={goHome} style={{ display:'flex', alignItems:'center', gap:'6px', background:'none', border:'none', color:T.text2, fontWeight:700, fontSize:'13px', cursor:'pointer', padding:'8px' }}>
          <ArrowLeft size={16} style={isHE ? { transform:'scaleX(-1)' } : undefined}/> {isHE ? 'חזרה' : 'Back'}
        </button>
        <div style={{ fontFamily:T.fontHead, fontSize:theme==='minecraft'?'11px':'14px', color:T.accent1, fontWeight:800 }}>
          📋 {assignment.title || (isHE ? 'מטלה' : 'Assignment')}
        </div>
        <div style={{ fontSize:'12px', fontWeight:800, color:T.text2 }}>
          {currentIndex + 1} / {totalItems}
        </div>
      </header>

      {/* Progress bar */}
      <div style={{ height:'6px', background:T.panel2 }}>
        <div style={{ height:'100%', width:`${(currentIndex / totalItems) * 100}%`, background:T.accent1, transition:'width 0.3s ease' }}/>
      </div>

      {/* Topic review link — only present when every question in this assignment came
          from a single topic (see api/assignments/route.ts); a mixed-topic assignment has
          no single topic to link to, so assignment.topic is null and this is just absent. */}
      {assignment.topic && (
        <div style={{ maxWidth:'640px', margin:'10px auto 0', padding:'0 16px' }}>
          <a href={`/lesson?topicId=${assignment.topic_id}&childId=${child.id}${token ? `&token=${token}` : ''}`}
            style={{ display:'inline-flex', alignItems:'center', gap:'6px', fontSize:'12px', fontWeight:700, color:T.accent1, textDecoration:'none' }}>
            📘 {isHE
              ? `סקור את ${assignment.topic.title_he || assignment.topic.title_en} קודם`
              : `Review ${assignment.topic.title_en} first`}
          </a>
        </div>
      )}

      <div style={{ maxWidth:'640px', margin:'0 auto', padding:'20px 16px' }}>
        <ThemePanel theme={theme} T={T} style={{ padding:'20px' }}>
          {isHE && currentQ?.prompt_he ? (
            <HebrewMathText text={currentQ.prompt_he}
              style={{ fontSize:`${FS?.question || 16}px`, fontWeight:700, color:T.text, margin:'0 0 8px', lineHeight:1.5, direction:'rtl', textAlign:'right' }} />
          ) : (
            <p style={{ fontSize:`${FS?.question || 16}px`, fontWeight:700, color:T.text, margin:'0 0 8px', lineHeight:1.5, direction:'ltr', textAlign:'left' }}>
              <FractionText text={currentQ?.prompt_en} />
            </p>
          )}
          {langMode === 'bilingual' && !isHE && isDistinctHe(currentQ?.prompt_he, currentQ?.prompt_en) && (
            <p style={{ fontSize:`${FS?.question || 13}px`, color:T.accent1, direction:'rtl', textAlign:'right', fontFamily:'"Times New Roman",serif', margin:'0 0 12px', lineHeight:1.6 }}>
              <FractionText text={currentQ?.prompt_he} />
            </p>
          )}

          {currentQ?.visual_data && (
            <div style={{ display:'flex', justifyContent:'center', padding:'12px', background:T.panel2, border:`2px dashed ${T.border}`, borderRadius:T.radius, marginBottom:'14px' }}>
              <MathVisual data={currentQ.visual_data} size={200} color={T.accent1} dark={theme === 'minecraft'}/>
            </div>
          )}

          <div style={{ display:'flex', flexDirection:'column', gap:'8px', marginBottom:'14px' }}>
            {options.map(opt => {
              const isTriedWrong = wrongLabels.includes(opt.label) && !(itemResolved && opt.isCorrect)
              const isRevealedCorrect = itemResolved && opt.isCorrect
              const displayVal = isHE ? (opt.value_he || opt.value_en || '') : (opt.value_en || '')
              return (
                <AnimatedBtn
                  key={opt.label}
                  theme={theme}
                  T={T}
                  correct={isRevealedCorrect}
                  wrong={isTriedWrong}
                  disabled={!canAnswer || wrongLabels.includes(opt.label)}
                  onClick={() => submitAnswer(opt.label)}
                  style={{
                    background: isRevealedCorrect ? 'rgba(0,200,83,0.15)' : isTriedWrong ? 'rgba(224,48,48,0.15)' : T.panel2,
                    border: `2px solid ${isRevealedCorrect ? T.accent3 : isTriedWrong ? '#E03030' : T.border}`,
                    borderRadius: T.radius,
                    padding: '12px 14px',
                    fontSize: '15px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    color: T.text,
                    textAlign: isHE ? 'right' : 'left',
                    direction: isHE ? 'rtl' : 'ltr',
                    width: '100%',
                  }}
                >
                  <span style={{ width:'22px', height:'22px', background:T.panel, border:`1px solid ${T.border}`, borderRadius:T.radius, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', flexShrink:0 }}>{isHE ? translateOptionLabel(opt.label) : opt.label}</span>
                  <FractionText text={displayVal} />
                </AnimatedBtn>
              )
            })}
          </div>

          {showHint && (currentQ?.hint_en || currentQ?.hint_he || isHE) && (
            <div style={{ background:`${T.accent2}15`, border:`2px solid ${T.accent2}`, borderRadius:T.radius, padding:'10px 12px', marginBottom:'12px', direction:isHE?'rtl':'ltr' }}>
              <div style={{ fontFamily:T.fontHead, fontSize:'12px', color:T.accent2, marginBottom:'4px' }}>💡 {isHE ? 'רמז' : 'Hint'}</div>
              <p style={{ fontSize:'14px', color:T.text2, margin:0 }}>
                <FractionText text={isHE ? (currentQ?.hint_he || 'קראו את השאלה שוב לאט, ובדקו כל תשובה אחת-אחת.') : currentQ?.hint_en} />
              </p>
              <p style={{ fontSize:'12px', color:T.text2, margin:'6px 0 0', fontStyle:'italic' }}>
                {isHE ? 'נסה שוב!' : 'Give it another try!'}
              </p>
            </div>
          )}

          {showCorrectFeedback && (
            <div style={{ border:`2px solid ${T.accent3}`, background:'rgba(0,200,83,0.1)', borderRadius:T.radius, padding:'12px 14px', display:'flex', alignItems:'flex-start', gap:'10px', marginBottom:'14px' }}>
              <span style={{ fontSize:'22px' }}>🎉</span>
              <div>
                <div style={{ fontFamily:T.fontHead, fontSize:'14px', color:T.accent3, marginBottom:'3px' }}>
                  {status === 'correct_first_try'
                    ? (isHE ? 'נכון בפעם הראשונה!' : 'Correct — first try!')
                    : (isHE ? 'נכון!' : 'Correct!')}
                </div>
                {(isHE ? currentQ?.explanation_he : currentQ?.explanation_en) && (
                  <div style={{ fontSize:'13px', color:T.text2, lineHeight:1.6 }}><FractionText text={(isHE ? currentQ?.explanation_he : currentQ?.explanation_en) || ''} /></div>
                )}
              </div>
            </div>
          )}

          {showReveal && (
            <div style={{ border:'2px solid #E03030', background:'rgba(224,48,48,0.08)', borderRadius:T.radius, padding:'12px 14px', display:'flex', alignItems:'flex-start', gap:'10px', marginBottom:'14px' }}>
              <span style={{ fontSize:'22px' }}>👀</span>
              <div>
                <div style={{ fontFamily:T.fontHead, fontSize:'14px', color:'#E03030', marginBottom:'3px' }}>
                  {isHE ? 'התשובה הנכונה' : 'The correct answer'}: {correctOption?.label}. {isHE ? (correctOption?.value_he || correctOption?.value_en) : correctOption?.value_en}
                </div>
                {(isHE ? currentQ?.explanation_he : currentQ?.explanation_en) && (
                  <div style={{ fontSize:'13px', color:T.text2, lineHeight:1.6 }}><FractionText text={(isHE ? currentQ?.explanation_he : currentQ?.explanation_en) || ''} /></div>
                )}
              </div>
            </div>
          )}

          {error && (
            <div style={{ color:'#E03030', fontSize:'13px', fontWeight:700, marginBottom:'12px' }}>⚠️ {error}</div>
          )}

          {itemResolved && (
            <button onClick={goNext} style={{ width:'100%', padding:'12px 20px', fontFamily:T.fontHead, fontSize:'15px', background:T.accent1, border:'none', color:'white', borderRadius:T.radius, cursor:'pointer', fontWeight:800 }}>
              {currentIndex + 1 >= totalItems ? (isHE ? 'סיום' : 'Finish') : (isHE ? 'הבא' : 'Next')}
            </button>
          )}
        </ThemePanel>
      </div>
    </div>
  )
}
