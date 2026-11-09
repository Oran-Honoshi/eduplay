'use client'
import React, { useState } from 'react'

const F = '"Rubik","Assistant",sans-serif'
const fmt = (v: number) => (v < 0 ? `−${Math.abs(v)}` : String(v))

/**
 * The child taps the place on the number line (it snaps to the nearest whole
 * number). Given numbers and jumps from the question's picture stay drawn.
 * After checking: wrong tries red, the right spot green.
 */
export default function NumberLineAnswer({ data, value, onChange, onSubmit, disabled, T, isHE, mine, correct }: {
  data: any
  value: number | null
  onChange: (v: number) => void
  onSubmit: () => void
  disabled?: boolean
  T: any
  isHE: boolean
  mine?: { v: number; ok: boolean }[]
  correct?: number | null
}) {
  const min = Math.round(Number(data.min ?? 0)), max = Math.round(Number(data.max ?? 10))
  const range = Math.max(1, max - min)
  const W = 360, pad = 22, y = 70, H = 110
  const step = (W - pad * 2) / range
  const xOf = (v: number) => pad + (v - min) * step
  const every = range <= 12 ? 1 : range <= 20 ? 2 : 5
  const marked: number[] = (data.marked ?? (data.mark != null ? [data.mark] : [])).map(Number)
    .filter((v: number) => v !== correct)
  const jumps = Array.isArray(data.jumps) ? data.jumps : []
  const [hover, setHover] = useState<number | null>(null)
  const accent = T.accent1 === '#FFD700' ? '#2F5BE3' : T.accent1
  const radius = T.radius === '0px' ? 4 : 18

  function pick(e: React.PointerEvent<SVGSVGElement>) {
    if (disabled) return null
    const r = e.currentTarget.getBoundingClientRect()
    const px = ((e.clientX - r.left) / r.width) * W
    const v = Math.round((px - pad) / step) + min
    return v < min || v > max ? null : v
  }
  const dot = (v: number, fill: string, key: string) => (
    <g key={key}>
      <circle cx={xOf(v)} cy={y} r={11} fill={fill} stroke="#fff" strokeWidth={3} />
      <text x={xOf(v)} y={y - 18} textAnchor="middle" fontSize={16} fontWeight={800} fontFamily={F} fill={fill}>{fmt(v)}</text>
    </g>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
      <div style={{ fontSize: 17, fontWeight: 700, color: T.text2 }}>{isHE ? 'הקישו על המקום בציר המספרים' : 'Tap the spot on the number line'}</div>
      <div dir="ltr" style={{ width: '100%', maxWidth: 520, background: '#fff', borderRadius: radius, border: `2px solid ${T.border}`, padding: '6px 4px', boxSizing: 'border-box', touchAction: 'manipulation' }}>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', cursor: disabled ? 'default' : 'pointer' }}
          role="application" aria-label={isHE ? 'ציר מספרים — הקישו על מספר' : 'Number line — tap a number'}
          onPointerMove={e => setHover(pick(e))} onPointerLeave={() => setHover(null)}
          onPointerDown={e => { const v = pick(e); if (v !== null) onChange(v) }}>
          <defs><marker id="nlaArrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill={accent} /></marker></defs>
          <line x1={pad - 10} y1={y} x2={W - pad + 10} y2={y} stroke="#1E2D4E" strokeWidth={2} />
          <polygon points={`${W - pad + 14},${y} ${W - pad + 5},${y - 5} ${W - pad + 5},${y + 5}`} fill="#1E2D4E" />
          {Array.from({ length: range + 1 }, (_, i) => {
            const v = min + i, x = xOf(v)
            return (
              <g key={v}>
                <line x1={x} y1={y - (v === 0 ? 10 : 7)} x2={x} y2={y + (v === 0 ? 10 : 7)} stroke="#1E2D4E" strokeWidth={v === 0 ? 2.5 : 1.5} />
                {(v % every === 0 || v === 0 || v === min || v === max) && <text x={x} y={y + 28} textAnchor="middle" fontSize={14} fontFamily={F} fontWeight={v === 0 ? 800 : 500} fill="#33415F">{fmt(v)}</text>}
              </g>
            )
          })}
          {jumps.map((j: any, i: number) => {
            const x1 = xOf(Number(j.from)), x2 = xOf(Number(j.to)), mid = (x1 + x2) / 2, h = Math.min(26, Math.abs(x2 - x1) / 3 + 8)
            return <path key={i} d={`M${x1},${y - 9} Q${mid},${y - 9 - h * 2} ${x2},${y - 9}`} fill="none" stroke={accent} strokeWidth={2} markerEnd="url(#nlaArrow)" />
          })}
          {marked.map(v => <circle key={`m${v}`} cx={xOf(v)} cy={y} r={6} fill={accent} fillOpacity={0.45} />)}
          {hover !== null && !disabled && hover !== value && <circle cx={xOf(hover)} cy={y} r={9} fill={accent} fillOpacity={0.25} />}
          {(mine || []).map((m, i) => dot(m.v, m.ok ? '#12937A' : '#E85D3F', `t${i}`))}
          {correct != null && dot(correct, '#12937A', 'c')}
          {value !== null && !disabled && dot(value, accent, 'v')}
        </svg>
      </div>
      {!disabled && (
        <button type="button" onClick={() => value !== null && onSubmit()} disabled={value === null}
          style={{ width: '100%', minHeight: 64, border: 'none', borderRadius: radius, background: T.accent1, color: '#fff', fontFamily: F, fontSize: 22, fontWeight: 800, cursor: value !== null ? 'pointer' : 'default', opacity: value !== null ? 1 : 0.5 }}>
          {isHE ? 'בודקים' : 'Check'}
        </button>
      )}
    </div>
  )
}
