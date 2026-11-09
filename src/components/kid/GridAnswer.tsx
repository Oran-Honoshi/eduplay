'use client'
import React, { useState } from 'react'
import { renderMathVisualSVG } from '@/lib/mathVisual'

const KID_FONT = '"Rubik","Assistant",sans-serif'
const POINT_RE = /^\s*\(?\s*(-?\d+(?:\.\d+)?)\s*[,;]\s*(-?\d+(?:\.\d+)?)\s*\)?\s*$/

/** "(6,1)" → [6, 1]; anything else → null */
export function parsePoint(s: unknown): [number, number] | null {
  const m = String(s ?? '').replace(/[−–]/g, '-').match(POINT_RE)
  return m ? [Number(m[1]), Number(m[2])] : null
}

/** labelled points the question gives, e.g. "A(2,1), B(9,1)" → [[2,1,'A'],[9,1,'B']] */
export function givenPoints(text: unknown): [number, number, string][] {
  const out: [number, number, string][] = []
  const re = /([A-Z])\s*\(\s*(-?\d+)\s*,\s*(-?\d+)\s*\)/g
  let m: RegExpExecArray | null
  const s = String(text ?? '')
  while ((m = re.exec(s))) if (!out.some(p => p[2] === m![1])) out.push([Number(m[2]), Number(m[3]), m[1]])
  return out
}

/** a question the child answers by tapping a spot on the coordinate grid */
export function isGridQuestion(q: any): boolean {
  if (!q || (Array.isArray(q.options) && q.options.length)) return false
  if (q.visual_data?.type !== 'coordinate') return false
  const p = parsePoint(q.correct_answer)
  if (!p || !Number.isInteger(p[0]) || !Number.isInteger(p[1])) return false
  const steps = q.visual_data.steps || q.visual_data.range || 5
  const q1 = q.visual_data.quadrant === 1 || q.visual_data.quadrant === '1'
  return q1 ? p[0] >= 0 && p[1] >= 0 && p[0] <= steps && p[1] <= steps : Math.abs(p[0]) <= steps && Math.abs(p[1]) <= steps
}

// Same geometry as the coordinate renderer in lib/mathVisual.ts (pad 28, square).
export function geometry(data: any, size: number) {
  const steps = data.steps || data.range || 5
  const q1 = data.quadrant === 1 || data.quadrant === '1'
  const pad = 28
  const inner = size - pad * 2
  const step = q1 ? inner / steps : inner / (steps * 2)
  const cx = q1 ? pad : size / 2, cy = q1 ? size - pad : size / 2
  const min = q1 ? 0 : -steps
  return { steps, q1, step, cx, cy, min, max: steps }
}

/**
 * The child taps where the point goes; it snaps to the nearest grid crossing.
 * After checking: their point turns green (right) or red, and once the answer
 * is revealed the right spot is shown in green.
 */
export default function GridAnswer({
  data, value, onChange, onSubmit, disabled, T, isHE, mine, correct, answer, given, checkLabel, size = 300,
}: {
  data: any
  value: [number, number] | null
  onChange: (p: [number, number]) => void
  onSubmit: () => void
  disabled?: boolean
  T: any
  isHE: boolean
  mine?: { p: [number, number]; ok: boolean }[]   // earlier tries, coloured
  correct?: [number, number] | null               // shown after the answer is revealed
  answer?: [number, number] | null                // never drawn in the picture before that
  given?: string                                  // question text: its labelled points are drawn
  checkLabel?: string
  size?: number
}) {
  const g = geometry(data, size)
  const [hover, setHover] = useState<[number, number] | null>(null)
  // never draw the answer itself in the background picture
  const answerKey = answer ? `${answer[0]},${answer[1]}` : null
  const fromText = givenPoints(given).filter(p => `${p[0]},${p[1]}` !== answerKey
    && (g.q1 ? p[0] >= 0 && p[1] >= 0 : true) && Math.abs(p[0]) <= g.steps && Math.abs(p[1]) <= g.steps)
  const pts = [...(data.points || []), ...fromText].filter((p: any) => `${p[0]},${p[1]}` !== answerKey)
  const bg = renderMathVisualSVG({ ...data, points: pts }, {
    width: size, height: size, color: T.accent1 === '#FFD700' ? '#2F5BE3' : T.accent1, dark: T.radius === '0px', instanceId: 'grid-answer',
  })
  const toPx = ([x, y]: [number, number]) => [g.cx + x * g.step, g.cy - y * g.step]
  function pick(e: React.PointerEvent<SVGSVGElement>) {
    if (disabled) return null
    const r = e.currentTarget.getBoundingClientRect()
    const px = ((e.clientX - r.left) / r.width) * size, py = ((e.clientY - r.top) / r.height) * size
    const x = Math.round((px - g.cx) / g.step), y = Math.round((g.cy - py) / g.step)
    if (x < g.min || x > g.max || y < g.min || y > g.max) return null
    return [x, y] as [number, number]
  }
  const radius = T.radius === '0px' ? 4 : 18
  const dot = (p: [number, number], fill: string, ring: string, label?: boolean) => {
    const [x, y] = toPx(p)
    return (
      <g key={`${fill}${p[0]},${p[1]}`}>
        <circle cx={x} cy={y} r={11} fill={fill} stroke={ring} strokeWidth={3} />
        {label && <text x={x + 14} y={y - 12} fontSize={15} fontWeight={800} fontFamily={KID_FONT} fill={fill} stroke="#fff" strokeWidth={3} paintOrder="stroke">({p[0]},{p[1]})</text>}
      </g>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
      <div style={{ fontSize: 17, fontWeight: 700, color: T.text2 }}>{isHE ? 'הקישו על המקום של הנקודה' : 'Tap where the point goes'}</div>
      <div dir="ltr" style={{ position: 'relative', width: '100%', maxWidth: size, aspectRatio: '1', background: '#fff', borderRadius: radius, border: `2px solid ${T.border}`, overflow: 'hidden', touchAction: 'manipulation' }}>
        <div aria-hidden style={{ position: 'absolute', inset: 0 }} dangerouslySetInnerHTML={{ __html: (bg || '').replace(`width="${size}" height="${size}"`, 'width="100%" height="100%"') }} />
        <svg viewBox={`0 0 ${size} ${size}`} width="100%" height="100%" style={{ position: 'absolute', inset: 0, cursor: disabled ? 'default' : 'pointer' }}
          role="application" aria-label={isHE ? 'מערכת צירים — הקישו לסימון נקודה' : 'Coordinate grid — tap to place a point'}
          onPointerMove={e => setHover(pick(e))} onPointerLeave={() => setHover(null)}
          onPointerDown={e => { const p = pick(e); if (p) onChange(p) }}>
          {hover && !disabled && (!value || hover[0] !== value[0] || hover[1] !== value[1]) && (() => { const [x, y] = toPx(hover); return <circle cx={x} cy={y} r={9} fill={T.accent1} fillOpacity={0.25} /> })()}
          {(mine || []).map(m => dot(m.p, m.ok ? '#12937A' : '#E85D3F', '#fff', true))}
          {correct && dot(correct, '#12937A', '#0B6B58', true)}
          {value && !disabled && dot(value, T.accent1 === '#FFD700' ? '#2F5BE3' : T.accent1, '#fff')}
        </svg>
      </div>
      <div dir="ltr" style={{ fontFamily: KID_FONT, fontSize: 26, fontWeight: 800, minHeight: 34, color: T.text }}>
        {value && !disabled ? `(${value[0]},${value[1]})` : ''}
      </div>
      {!disabled && (
        <button type="button" onClick={() => value && onSubmit()} disabled={!value}
          style={{ width: '100%', minHeight: 64, border: 'none', borderRadius: radius, background: T.accent1, color: '#fff', fontFamily: KID_FONT, fontSize: 22, fontWeight: 800, cursor: value ? 'pointer' : 'default', opacity: value ? 1 : 0.5 }}>
          {checkLabel || (isHE ? 'בודקים' : 'Check')}
        </button>
      )}
    </div>
  )
}
