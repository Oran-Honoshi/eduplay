'use client'
import InlineMath from '@/components/InlineMath'
import s from './lesson.module.css'

// A "חשוב לזכור" key point as a taped sticky note. A key point from the data
// is either a plain sentence (shown as the body, no title) or an object with
// a title, a body and an optional visual.
export type KeyPointVisual = { type: 'grid100'; filled_cols: number; eq_left: string; eq_right: string; label_he?: string }
export type KeyPoint = string | { title_he?: string; title_en?: string; text_he?: string; text_en?: string; visual?: KeyPointVisual }

const COLORS = ['yellow', 'pink', 'mint'] as const
const TILT = [-1.5, 1.2, -0.8]

export function keyPointParts(p: KeyPoint, he: boolean) {
  if (typeof p === 'string') return { title: '', body: p, visual: undefined }
  return { title: (he ? p.title_he || p.title_en : p.title_en || p.title_he) || '', body: (he ? p.text_he || p.text_en : p.text_en || p.text_he) || '', visual: p.visual }
}

export default function StickyNote({ index, title, body, visual }: { index: number; title?: string; body: string; visual?: KeyPointVisual }) {
  const color = COLORS[index % 3]
  return (
    <div className={`${s.sticky} ${s[color]}`} style={{ transform: `rotate(${TILT[index % 3]}deg)` }}>
      <div className={s.stickyRow}>
        <span className={s.num}>{index + 1}</span>
        <div>
          {title && <h3 className={s.stickyTitle}><InlineMath text={title} /></h3>}
          <p className={`${s.stickyBody} ${title ? '' : s.stickyBodyOnly}`}><InlineMath text={body} /></p>
        </div>
      </div>
      {visual?.type === 'grid100' && <Grid100 v={visual} />}
    </div>
  )
}

// 10×10 grid: the first N columns filled (in LTR order), next to "a = b" with
// the last digit of b on a yellow chip.
function Grid100({ v }: { v: KeyPointVisual }) {
  const n = Math.max(0, Math.min(10, v.filled_cols))
  const right = v.eq_right || ''
  return (
    <div className={s.pvVisual}>
      <div className={s.grid100} role="img" aria-label={v.label_he || `${n} עשיריות שוות ל-${n * 10} מאיות`}>
        {Array.from({ length: 100 }, (_, i) => <span key={i} className={i % 10 < n ? s.on : ''} />)}
      </div>
      <p className={s.pvEq}>{v.eq_left}<br />= {right.slice(0, -1)}<b>{right.slice(-1)}</b></p>
    </div>
  )
}
