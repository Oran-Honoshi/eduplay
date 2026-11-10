'use client'
import { useState } from 'react'
import { Lightbulb, ListOrdered, Users, AlertTriangle, CheckCircle2 } from 'lucide-react'
import MathVisual from '@/components/MathVisual'
import InlineMath from '@/components/InlineMath'

// One explanation page (from Create's "explanation pages"), shown on screen.
// mode 'review': everything open (the parent checking it).
// mode 'learn' : the child's reader — steps of each example open one by one,
//                "your turn" hides the hint and the solution until asked,
//                check answers stay hidden until tapped.
const F = '"Rubik","Assistant",sans-serif'

export default function ExplanationPage({ page, he, mode = 'review', accent = '#2F5BE3' }: { page: any; he: boolean; mode?: 'review' | 'learn'; accent?: string }) {
  const L = (o: any, k: string) => (he ? (o?.[`${k}_he`] ?? o?.[`${k}_en`]) : (o?.[`${k}_en`] ?? o?.[`${k}_he`]))
  const learn = mode === 'learn'
  const big = learn ? 19 : 16
  const box = (bg: string, border = 'transparent'): React.CSSProperties => ({ background: bg, border: `1.5px solid ${border}`, borderRadius: 18, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 })
  const h2: React.CSSProperties = { fontFamily: F, fontWeight: 800, fontSize: learn ? 20 : 17, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }
  const guide: string[] = L(page, 'parent_guide') || []
  const points: string[] = L(page, 'key_points') || []
  const mistakes: string[] = L(page, 'mistakes') || []

  return (
    <div dir={he ? 'rtl' : 'ltr'} style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: big, lineHeight: 1.65, color: '#16213E' }}>
      <h1 style={{ fontFamily: F, fontWeight: 800, fontSize: learn ? 28 : 22, margin: 0, color: accent }}><InlineMath text={L(page, 'title') || ''} /></h1>
      {L(page, 'intro') && <p style={{ margin: 0 }}><InlineMath text={L(page, 'intro')} /></p>}
      {page.main_visual?.type && <div style={{ display: 'flex', justifyContent: 'center' }}><MathVisual data={page.main_visual} size={learn ? 230 : 190} color={accent} /></div>}

      {guide.length > 0 && (
        <div style={box('#FFF4D1')}>
          <div style={{ ...h2, color: '#7A5600' }}><Users size={20} /> {he ? 'להורה: איך לעבור על הדף יחד' : 'For the parent: going through it together'}</div>
          <ol style={{ margin: 0, paddingInlineStart: 22 }}>{guide.map((x, i) => <li key={i}><InlineMath text={x} /></li>)}</ol>
        </div>
      )}

      {points.length > 0 && (
        <div style={box('#EAF0FF')}>
          <div style={{ ...h2, color: accent }}><Lightbulb size={20} /> {he ? 'מה חשוב לזכור' : 'Key points'}</div>
          <ul style={{ margin: 0, paddingInlineStart: 22 }}>{points.map((x, i) => <li key={i}><InlineMath text={x} /></li>)}</ul>
        </div>
      )}

      {(page.examples || []).map((ex: any, i: number) => <Example key={i} ex={ex} i={i} he={he} learn={learn} accent={accent} />)}

      {page.try_it && <TryIt t={page.try_it} he={he} learn={learn} accent={accent} />}

      {mistakes.length > 0 && (
        <div style={box('#FFF7ED')}>
          <div style={{ ...h2, color: '#B45309' }}><AlertTriangle size={20} /> {he ? 'טעויות נפוצות' : 'Common mistakes'}</div>
          <ul style={{ margin: 0, paddingInlineStart: 22 }}>{mistakes.map((x, i) => <li key={i}><InlineMath text={x} /></li>)}</ul>
        </div>
      )}

      {(page.check || []).length > 0 && (
        <div style={box('#fff', accent)}>
          <div style={{ ...h2, color: accent }}><CheckCircle2 size={20} /> {he ? 'בדקו את עצמכם' : 'Check yourself'}</div>
          <ol style={{ margin: 0, paddingInlineStart: 22, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {page.check.map((c: any, i: number) => <Check key={i} c={c} he={he} learn={learn} />)}
          </ol>
        </div>
      )}
    </div>
  )
}

function Example({ ex, i, he, learn, accent }: any) {
  const L = (o: any, k: string) => (he ? (o?.[`${k}_he`] ?? o?.[`${k}_en`]) : (o?.[`${k}_en`] ?? o?.[`${k}_he`]))
  const steps: string[] = L(ex, 'steps') || []
  const [n, setN] = useState(learn ? 1 : steps.length)
  const all = n >= steps.length
  return (
    <div style={{ border: '1.5px solid #E8E2D6', borderRadius: 18, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8, background: '#fff' }}>
      <div style={{ fontFamily: F, fontWeight: 800, fontSize: 15, color: '#5E6B85' }}>{he ? `דוגמה ${i + 1}` : `Example ${i + 1}`}</div>
      <div style={{ fontWeight: 800 }}><InlineMath text={L(ex, 'question') || ''} /></div>
      {ex.visual_data?.type && <div style={{ display: 'flex', justifyContent: 'center' }}><MathVisual data={ex.visual_data} size={200} color={accent} /></div>}
      <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {steps.slice(0, n).map((s, j) => (
          <li key={j} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: '#F7F4EE', borderRadius: 12, padding: '8px 10px' }}>
            <span style={{ width: 26, height: 26, flexShrink: 0, borderRadius: 99, background: accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14 }}>{j + 1}</span>
            <span><InlineMath text={s} /></span>
          </li>
        ))}
      </ol>
      {!all
        ? <button onClick={() => setN(n + 1)} style={{ alignSelf: 'flex-start', minHeight: 48, padding: '0 18px', borderRadius: 14, border: `2px solid ${accent}`, background: 'transparent', color: accent, fontFamily: F, fontWeight: 800, fontSize: 17, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><ListOrdered size={18} /> {he ? 'הצעד הבא' : 'Next step'}</button>
        : L(ex, 'answer') && <div style={{ fontWeight: 800, color: '#0B6B58' }}>{he ? 'תשובה: ' : 'Answer: '}<bdi><InlineMath text={L(ex, 'answer')} /></bdi></div>}
    </div>
  )
}

function TryIt({ t, he, learn, accent }: any) {
  const L = (o: any, k: string) => (he ? (o?.[`${k}_he`] ?? o?.[`${k}_en`]) : (o?.[`${k}_en`] ?? o?.[`${k}_he`]))
  const [hint, setHint] = useState(!learn)
  const [sol, setSol] = useState(!learn)
  const btn: React.CSSProperties = { minHeight: 48, padding: '0 16px', borderRadius: 14, border: '2px solid #12937A', background: '#fff', color: '#0B6B58', fontFamily: F, fontWeight: 800, fontSize: 16, cursor: 'pointer' }
  return (
    <div style={{ border: '2px solid #12937A', borderRadius: 18, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8, background: '#F2FBF7' }}>
      <div style={{ fontFamily: F, fontWeight: 800, fontSize: learn ? 20 : 17, color: '#0B6B58' }}>{he ? 'עכשיו תורכם' : 'Your turn'}</div>
      <div style={{ fontWeight: 800 }}><InlineMath text={L(t, 'q') || ''} /></div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {!hint && <button onClick={() => setHint(true)} style={btn}>{he ? 'רמז' : 'Hint'}</button>}
        {!sol && <button onClick={() => setSol(true)} style={btn}>{he ? 'ניסיתי — לבדוק' : 'I tried — check'}</button>}
      </div>
      {hint && L(t, 'hint') && <div style={{ fontSize: '0.92em' }}><b>{he ? 'רמז: ' : 'Hint: '}</b><InlineMath text={L(t, 'hint')} /></div>}
      {sol && <>
        <ol style={{ margin: 0, paddingInlineStart: 22 }}>{(L(t, 'steps') || []).map((s: string, i: number) => <li key={i}><InlineMath text={s} /></li>)}</ol>
        <div style={{ fontWeight: 800, color: '#0B6B58' }}>{he ? 'תשובה: ' : 'Answer: '}<bdi><InlineMath text={L(t, 'a') || ''} /></bdi></div>
      </>}
    </div>
  )
}

function Check({ c, he, learn }: any) {
  const L = (o: any, k: string) => (he ? (o?.[`${k}_he`] ?? o?.[`${k}_en`]) : (o?.[`${k}_en`] ?? o?.[`${k}_he`]))
  const [show, setShow] = useState(!learn)
  return (
    <li>
      <InlineMath text={L(c, 'q') || ''} />{' '}
      {show
        ? <span style={{ color: '#0B6B58', fontWeight: 800 }}>— <bdi><InlineMath text={L(c, 'a') || ''} /></bdi></span>
        : <button onClick={() => setShow(true)} style={{ marginInlineStart: 6, border: 'none', background: '#EAF0FF', color: '#2148C0', borderRadius: 99, padding: '4px 12px', fontWeight: 800, cursor: 'pointer', fontSize: 14 }}>{he ? 'לראות תשובה' : 'Show answer'}</button>}
    </li>
  )
}
