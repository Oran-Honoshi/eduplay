'use client'
import React, { useState } from 'react'
import { renderMathVisualSVG } from '@/lib/mathVisual'
import { geometry } from '@/components/kid/GridAnswer'

const F = '"Rubik","Assistant",sans-serif'

/**
 * Step 1 of "mark the points … then answer": the child places each given point
 * in order (A, then B…). Every tap is checked right away — a wrong spot says
 * which point it was and reminds "x first, then y"; after two misses the right
 * spot glows. Placed points join into the segment or shape, then onDone().
 */
export default function PlotPoints({ data, points, join, T, isHE, onDone, startDone = false, size = 300 }: {
  data: any
  points: [number, number, string][]
  join: 'segment' | 'polygon' | null
  T: any
  isHE: boolean
  onDone: () => void
  startDone?: boolean   // already marked earlier: show the finished picture
  size?: number
}) {
  const g = geometry(data, size)
  const [placed, setPlaced] = useState(startDone ? points.length : 0)
  const [miss, setMiss] = useState<{ p: [number, number]; n: number } | null>(null)
  const done = placed >= points.length
  const accent = T.accent1 === '#FFD700' ? '#2F5BE3' : T.accent1
  const bg = renderMathVisualSVG({ ...data, points: [], segments: [], polygon: undefined }, {
    width: size, height: size, color: accent, dark: false, instanceId: 'plot-points',
  })
  const toPx = (x: number, y: number) => [g.cx + x * g.step, g.cy - y * g.step]
  const target = points[placed]

  function tap(e: React.PointerEvent<SVGSVGElement>) {
    if (done) return
    const r = e.currentTarget.getBoundingClientRect()
    const px = ((e.clientX - r.left) / r.width) * size, py = ((e.clientY - r.top) / r.height) * size
    const x = Math.round((px - g.cx) / g.step), y = Math.round((g.cy - py) / g.step)
    if (x < g.min || x > g.max || y < g.min || y > g.max) return
    if (x === target[0] && y === target[1]) {
      setMiss(null)
      const next = placed + 1
      setPlaced(next)
      if (next >= points.length) setTimeout(onDone, 700)
    } else setMiss(m => ({ p: [x, y], n: (m?.n || 0) + 1 }))
  }

  const shown = points.slice(0, placed)
  const line = shown.length >= 2 && join
    ? (join === 'polygon' && done
        ? <polygon points={shown.map(([x, y]) => toPx(x, y).join(',')).join(' ')} fill={accent} fillOpacity={0.12} stroke={accent} strokeWidth={3} />
        : <polyline points={shown.map(([x, y]) => toPx(x, y).join(',')).join(' ')} fill="none" stroke={accent} strokeWidth={3} />)
    : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
      <div role="status" style={{ fontFamily: F, fontSize: 19, fontWeight: 800, color: T.text, textAlign: 'center', minHeight: 28 }}>
        {done
          ? (isHE ? 'מעולה! סימנת את כל הנקודות' : 'Great — all points are marked!')
          : <>{isHE ? 'סמנו את הנקודה ' : 'Mark point '}<bdi dir="ltr">{target[2]}({target[0]},{target[1]})</bdi></>}
      </div>
      <div dir="ltr" style={{ position: 'relative', width: '100%', maxWidth: size, aspectRatio: '1', background: '#fff', borderRadius: 18, border: `2px solid ${T.border}`, overflow: 'hidden', touchAction: 'manipulation' }}>
        <div aria-hidden style={{ position: 'absolute', inset: 0 }} dangerouslySetInnerHTML={{ __html: (bg || '').replace(`width="${size}" height="${size}"`, 'width="100%" height="100%"') }} />
        <svg viewBox={`0 0 ${size} ${size}`} width="100%" height="100%" style={{ position: 'absolute', inset: 0, cursor: done ? 'default' : 'pointer' }}
          role="application" aria-label={isHE ? 'מערכת צירים — הקישו לסימון נקודה' : 'Coordinate grid — tap to mark a point'} onPointerDown={tap}>
          {line}
          {miss && miss.n >= 2 && !done && (() => { const [x, y] = toPx(target[0], target[1]); return <circle cx={x} cy={y} r={14} fill="none" stroke="#12937A" strokeWidth={3} strokeDasharray="4 3"><animate attributeName="r" values="10;16;10" dur="1.2s" repeatCount="indefinite" /></circle> })()}
          {miss && !done && (() => { const [x, y] = toPx(miss.p[0], miss.p[1]); return <circle cx={x} cy={y} r={9} fill="#E85D3F" opacity={0.75} /> })()}
          {shown.map(([px, py, l]) => { const [x, y] = toPx(px, py); return (
            <g key={l}>
              <circle cx={x} cy={y} r={9} fill="#12937A" stroke="#fff" strokeWidth={3} />
              <text x={x + 12} y={y - 10} fontSize={16} fontWeight={800} fontFamily={F} fill="#0B6B58" stroke="#fff" strokeWidth={3} paintOrder="stroke">{l}</text>
            </g>
          ) })}
        </svg>
      </div>
      {miss && !done && (
        <div style={{ fontSize: 17, fontWeight: 700, color: '#B4432A', textAlign: 'center' }}>
          {isHE ? <>זו הנקודה <bdi dir="ltr">({miss.p[0]},{miss.p[1]})</bdi>. קודם זזים ימינה לפי x, ואז למעלה לפי y.</>
                : <>That's ({miss.p[0]},{miss.p[1]}). Go right by x first, then up by y.</>}
        </div>
      )}
      <div style={{ display: 'flex', gap: 6 }} aria-hidden>
        {points.map((p, i) => <span key={p[2]} style={{ width: 10, height: 10, borderRadius: '50%', background: i < placed ? '#12937A' : T.border }} />)}
      </div>
    </div>
  )
}
