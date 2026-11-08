'use client'
import { useState, useEffect } from 'react'
import { X, Lightbulb, ChevronRight } from 'lucide-react'
import AnswerPad, { isNumericAnswer } from '@/components/kid/AnswerPad'
import MathVisual from '@/components/MathVisual'
import FractionText from '@/components/FractionText'
import HebrewMathText from '@/components/HebrewMathText'
import { AnimatedBtn, Sparkles, THEME_CONFIG } from '@/components/theme'
import { getFontSize } from '@/lib/fontSize'
import { announceTokensChanged } from '@/lib/kidPrefs'
import { Pip } from '@/components/Pip'
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
    correct_answer?: string | null
    q_type?: string | null
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
  const [stickerEarned, setStickerEarned] = useState(false)

  const totalItems = items.length
  const done = currentIndex >= totalItems
  const currentItem = !done ? items[currentIndex] : null
  const currentQ = currentItem?.question

  function goHome() {
    window.location.href = token ? `/play/${token}` : '/dashboard'
  }

  const [typed, setTyped] = useState('')
  useEffect(() => { setTyped('') }, [currentIndex])

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
        setError(data.error || (isHE ? 'לא הצלחנו לשלוח את התשובה — נסו שוב' : "Couldn't submit that answer — try again."))
        return
      }

      const wasFirstAttempt = currentItem.status === 'not_started'
      setItems(prev => prev.map(it => it.id !== currentItem.id ? it : {
        ...it,
        status: data.status,
        attempt_1_answer: wasFirstAttempt ? label : it.attempt_1_answer,
        attempt_2_answer: wasFirstAttempt ? it.attempt_2_answer : label,
      }))

      if (data.stickerEarned) { setStickerEarned(true); announceTokensChanged() }
      if (data.correct) {
        setSparkleActive(true)
        setTimeout(() => setSparkleActive(false), 1200)
      }
    } catch {
      setError(isHE ? 'אין חיבור — בדקו את האינטרנט ונסו שוב' : "Couldn't reach the server — check your connection and try again.")
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
    }
    setCurrentIndex(nextIndex)
  }

  const F = '"Rubik","Assistant",sans-serif'
  const R = theme === 'minecraft' ? 4 : 24
  const dark = theme === 'minecraft'
  const L = (he: string, en: string) => (isHE ? he : en)

  // ── Completion screen: the celebration ─────────────────────────
  if (done) {
    const correctFirstTry  = items.filter(it => it.status === 'correct_first_try').length
    const correctAfterHint = items.filter(it => it.status === 'correct_after_hint').length
    const revealed         = items.filter(it => it.status === 'revealed_answer').length
    const correct = correctFirstTry + correctAfterHint
    const great = correct >= Math.ceil(totalItems * 0.7)
    return (
      <div style={{ minHeight:'100vh', background:T.bg, color:T.text, fontFamily:'"Assistant",sans-serif', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }} dir={isHE ? 'rtl' : 'ltr'}>
        <Sparkles active={great} theme={theme}/>
        <div style={{ background:T.panel, border:`1.5px solid ${T.border}`, borderRadius:R + 8, padding:'28px 22px', maxWidth:420, width:'100%', display:'flex', flexDirection:'column', alignItems:'center', gap:14, textAlign:'center' }}>
          <Pip theme={theme} pose={great ? 'celebrate' : 'thumbs'} size={150} he={isHE} bounce />
          <div style={{ fontFamily:F, fontSize:32, fontWeight:800 }}>{great ? L('כל הכבוד!', 'Amazing!') : L('סיימת!', 'You finished!')}</div>
          <div style={{ fontSize:19, color:T.text2 }}>
            {L(`ענית נכון על ${correct} מתוך ${totalItems}`, `${correct} of ${totalItems} correct`)}
          </div>
          <div style={{ width:116, height:116, borderRadius:'50%', background:'radial-gradient(circle at 35% 30%, #FFE08A, #FFC940 60%, #E0A800)', border:'6px solid #FFFFFF', boxShadow:'0 8px 20px rgba(224,168,0,0.35)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:F, fontSize:34, fontWeight:800, color:'#7A5600' }} dir="ltr">
            {correct}/{totalItems}
          </div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', justifyContent:'center', fontSize:16 }}>
            <span style={{ padding:'6px 12px', borderRadius:999, background:dark ? T.panel2 : '#E3F4EF', color:dark ? T.text : '#0B6B58', fontWeight:700 }}>{L(`${correctFirstTry} בפעם הראשונה`, `${correctFirstTry} first try`)}</span>
            {correctAfterHint > 0 && <span style={{ padding:'6px 12px', borderRadius:999, background:dark ? T.panel2 : '#FFF4D6', color:dark ? T.text : '#7A5600', fontWeight:700 }}>{L(`${correctAfterHint} עם רמז`, `${correctAfterHint} with a hint`)}</span>}
            {revealed > 0 && <span style={{ padding:'6px 12px', borderRadius:999, background:dark ? T.panel2 : '#F3EFE7', color:T.text2, fontWeight:700 }}>{L(`${revealed} לחזור עליהן`, `${revealed} to practice again`)}</span>}
          </div>
          {stickerEarned && (
            <div style={{ fontSize:19, fontWeight:800, color:dark ? '#FFE08A' : '#7A5600', background:dark ? T.panel2 : '#FFF4D6', borderRadius:16, padding:'10px 14px', width:'100%', boxSizing:'border-box' }}>
              {L('קיבלת מדבקה חדשה לאלבום!', 'You earned a new sticker for your album!')}
            </div>
          )}
          {stickerEarned && (
            <button onClick={() => { window.location.href = `/cards?childId=${child.id}${token ? `&token=${token}` : ''}&theme=${theme}&lang=${langMode}` }}
              style={{ width:'100%', minHeight:64, background:T.accent1, border:'none', borderRadius:R - 4, color:'#fff', fontFamily:F, fontSize:22, fontWeight:800, cursor:'pointer' }}>
              {L('להדביק באלבום', 'Place it in my album')}
            </button>
          )}
          <button onClick={goHome} style={{ width:'100%', minHeight: stickerEarned ? 52 : 64, background: stickerEarned ? 'transparent' : T.accent1, border:'none', borderRadius:R - 4, color: stickerEarned ? T.accent1 : '#fff', fontFamily:F, fontSize: stickerEarned ? 19 : 22, fontWeight:800, cursor:'pointer' }}>
            {L('חזרה הביתה', 'Back home')}
          </button>
        </div>
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
  const optText = (o: any) => isHE ? (o.value_he || o.value_en || '') : (o.value_en || '')
  const twoCols = options.length === 4 && options.every(o => optText(o).length <= 14)
  const numeric = options.length === 0 && isNumericAnswer(currentQ?.correct_answer)
  const qSize = Math.max(22, FS?.question || 0)
  const explanation = (isHE ? currentQ?.explanation_he : currentQ?.explanation_en) || ''

  return (
    <div style={{ minHeight:'100vh', background:T.bg, color:T.text, fontFamily:'"Assistant",sans-serif', position:'relative' }} dir={isHE ? 'rtl' : 'ltr'}>
      <Sparkles active={sparkleActive} theme={theme}/>

      {/* Top: exit, progress, count */}
      <header style={{ position:'sticky', top:0, zIndex:100, background:T.bg, padding:'12px 16px', display:'flex', alignItems:'center', gap:12, maxWidth:640, margin:'0 auto' }}>
        <button onClick={goHome} aria-label={L('יציאה', 'Exit')}
          style={{ width:48, height:48, flexShrink:0, borderRadius:14, background:T.panel, border:`1.5px solid ${T.border}`, display:'flex', alignItems:'center', justifyContent:'center', color:T.text, cursor:'pointer' }}>
          <X size={24}/>
        </button>
        <div style={{ flex:1, height:14, borderRadius:99, background:T.border, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${Math.max(4, (currentIndex / totalItems) * 100)}%`, background:T.accent2 === '#FFD700' ? T.accent1 : T.accent2, borderRadius:99, transition:'width .3s ease' }}/>
        </div>
        <span style={{ fontFamily:F, fontWeight:800, fontSize:18 }} dir="ltr">{currentIndex + 1}/{totalItems}</span>
      </header>

      <div style={{ maxWidth:640, margin:'0 auto', padding:'4px 16px 32px', display:'flex', flexDirection:'column', gap:14 }}>
        {assignment.topic && currentIndex === 0 && isOpen(status) && (
          <a href={`/lesson?topicId=${assignment.topic_id}&childId=${child.id}${token ? `&token=${token}` : ''}`}
            style={{ alignSelf:'flex-start', fontSize:16, fontWeight:700, color:T.accent1, textDecoration:'none' }}>
            {L(`לחזור קודם על ${assignment.topic.title_he || assignment.topic.title_en}`, `Review ${assignment.topic.title_en} first`)}
          </a>
        )}

        {/* The question */}
        <div style={{ background:T.panel, border:`1.5px solid ${T.border}`, borderRadius:R + 4, padding:'22px 18px', display:'flex', flexDirection:'column', gap:12 }}>
          {isHE && currentQ?.prompt_he ? (
            <HebrewMathText text={currentQ.prompt_he}
              style={{ fontSize:`${qSize}px`, fontWeight:700, color:T.text, margin:0, lineHeight:1.55, direction:'rtl', textAlign:'right' }} />
          ) : (
            <p style={{ fontSize:`${qSize}px`, fontWeight:700, color:T.text, margin:0, lineHeight:1.55, direction:'ltr', textAlign:'left' }}>
              <FractionText text={currentQ?.prompt_en} />
            </p>
          )}
          {langMode === 'bilingual' && !isHE && isDistinctHe(currentQ?.prompt_he, currentQ?.prompt_en) && (
            <HebrewMathText text={currentQ?.prompt_he || ''}
              style={{ fontSize:18, color:T.text2, direction:'rtl', textAlign:'right', margin:0, lineHeight:1.6 }} />
          )}
          {currentQ?.visual_data && (
            <div style={{ display:'flex', justifyContent:'center', padding:12, background:T.panel2, borderRadius:R - 6 }}>
              <MathVisual data={currentQ.visual_data} size={220} color={T.accent1} dark={dark}/>
            </div>
          )}
        </div>

        {/* Answers */}
        {options.length > 0 && (
          <div style={{ display:'grid', gridTemplateColumns: twoCols ? 'repeat(2, minmax(0, 1fr))' : '1fr', gap:10 }}>
            {options.map(opt => {
              const isTriedWrong = wrongLabels.includes(opt.label) && !(itemResolved && opt.isCorrect)
              const isRevealedCorrect = itemResolved && opt.isCorrect
              return (
                <AnimatedBtn key={opt.label} theme={theme} T={T}
                  correct={isRevealedCorrect} wrong={isTriedWrong}
                  disabled={!canAnswer || wrongLabels.includes(opt.label)}
                  onClick={() => submitAnswer(opt.label)}
                  style={{
                    background: isRevealedCorrect ? (dark ? '#1F4D2E' : '#E3F4EF') : isTriedWrong ? (dark ? '#4D1F1F' : '#FDECE7') : T.panel,
                    border: `2.5px solid ${isRevealedCorrect ? '#12937A' : isTriedWrong ? '#E85D3F' : T.border}`,
                    borderRadius: R - 6, minHeight: twoCols ? 84 : 64, padding: '12px 16px',
                    fontSize: 22, fontWeight: 700, fontFamily: F, color: T.text,
                    display: 'flex', alignItems: 'center', justifyContent: twoCols ? 'center' : 'flex-start', gap: 12,
                    textAlign: twoCols ? 'center' : 'start', width: '100%', boxShadow: 'none',
                    opacity: isTriedWrong ? 0.75 : 1,
                  }}>
                  {!twoCols && (
                    <span style={{ width:34, height:34, borderRadius:10, background:T.panel2, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0, color:T.text2 }}>
                      {isHE ? translateOptionLabel(opt.label) : opt.label}
                    </span>
                  )}
                  <span style={{ unicodeBidi:'plaintext' }}><FractionText text={optText(opt)} /></span>
                </AnimatedBtn>
              )
            })}
          </div>
        )}

        {options.length === 0 && (
          <>
            {wrongLabels.length > 0 && !itemResolved && (
              <div style={{ fontSize:17, color:'#B4432A', fontWeight:700 }}>
                {L('ניסית:', 'You tried:')} {wrongLabels.map((w, i) => <bdi key={i} style={{ marginInlineStart:6 }}>{w}</bdi>)}
              </div>
            )}
            {canAnswer && (
              <AnswerPad value={typed} onChange={setTyped} numeric={numeric} expected={currentQ?.correct_answer}
                onSubmit={() => { const v = typed.trim(); if (v) { submitAnswer(v); setTyped('') } }}
                T={T} isHE={isHE} disabled={submitting} />
            )}
          </>
        )}

        {/* Feedback */}
        {showHint && (
          <div style={{ display:'flex', gap:12, alignItems:'flex-start', background:dark ? T.panel : '#FFF4D6', border:`2px solid ${T.accent2}`, borderRadius:R - 4, padding:14 }}>
            <Pip theme={theme} pose="think" size={56} he={isHE} style={{ flexShrink:0 }} />
            <div>
              <div style={{ fontFamily:F, fontSize:19, fontWeight:800, display:'flex', alignItems:'center', gap:6 }}><Lightbulb size={20}/> {L('כמעט! הנה רמז', 'Almost! Here is a hint')}</div>
              <div style={{ fontSize:18, lineHeight:1.55, marginTop:4 }}>
                <FractionText text={isHE ? (currentQ?.hint_he || 'קראו את השאלה שוב לאט, ובדקו כל תשובה אחת-אחת.') : (currentQ?.hint_en || 'Read the question again slowly.')} />
              </div>
            </div>
          </div>
        )}

        {showCorrectFeedback && (
          <div style={{ display:'flex', gap:12, alignItems:'flex-start', background:dark ? '#1F4D2E' : '#E3F4EF', border:'2px solid #12937A', borderRadius:R - 4, padding:14 }}>
            <Pip theme={theme} pose="thumbs" size={60} he={isHE} bounce style={{ flexShrink:0 }} />
            <div>
              <div style={{ fontFamily:F, fontSize:21, fontWeight:800, color:dark ? '#9BE3C9' : '#0B6B58' }}>
                {status === 'correct_first_try' ? L('נכון! בפעם הראשונה', 'Correct — first try!') : L('נכון!', 'Correct!')}
              </div>
              {explanation && <div style={{ fontSize:17, lineHeight:1.6, marginTop:4 }}><FractionText text={explanation} /></div>}
            </div>
          </div>
        )}

        {showReveal && (
          <div style={{ display:'flex', gap:12, alignItems:'flex-start', background:dark ? T.panel : '#FDF3EF', border:`2px solid ${dark ? T.border : '#F2C3B5'}`, borderRadius:R - 4, padding:14 }}>
            <Pip theme={theme} pose="read" size={56} he={isHE} style={{ flexShrink:0 }} />
            <div>
              <div style={{ fontFamily:F, fontSize:19, fontWeight:800 }}>
                {L('התשובה היא', 'The answer is')}{' '}
                {correctOption
                  ? <bdi><FractionText text={optText(correctOption)} /></bdi>
                  : <bdi><FractionText text={currentQ?.correct_answer || ''} /></bdi>}
              </div>
              {explanation && <div style={{ fontSize:17, lineHeight:1.6, marginTop:4 }}><FractionText text={explanation} /></div>}
              <div style={{ fontSize:16, color:T.text2, marginTop:6 }}>{L('זה בסדר — ככה לומדים.', "That's okay — that's how we learn.")}</div>
            </div>
          </div>
        )}

        {error && <div style={{ color:'#B4432A', fontSize:17, fontWeight:700 }}>{error}</div>}

        {itemResolved && (
          <button onClick={goNext} style={{ width:'100%', minHeight:64, fontFamily:F, fontSize:22, background:T.accent1, border:'none', color:'#fff', borderRadius:R - 6, cursor:'pointer', fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
            {currentIndex + 1 >= totalItems ? L('סיום', 'Finish') : L('הבא', 'Next')}
            <ChevronRight size={22} style={isHE ? { transform:'scaleX(-1)' } : undefined}/>
          </button>
        )}
      </div>
    </div>
  )
}
