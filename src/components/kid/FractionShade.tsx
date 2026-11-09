'use client'
import React from 'react'

const F = '"Rubik","Assistant",sans-serif'

/**
 * The child taps parts of a bar or a circle to colour them in; the answer sent
 * is "shaded/parts" (6/8 is accepted for 3/4). After checking the shape shows
 * green (right) or, once revealed, the right amount in green.
 */
export default function FractionShade({ d, pie, value, onChange, onSubmit, disabled, T, isHE, result, showCount }: {
  d: number
  pie: boolean
  value: boolean[]
  onChange: (v: boolean[]) => void
  onSubmit: () => void
  disabled?: boolean
  T: any
  isHE: boolean
  result?: 'right' | 'wrong' | null
  showCount?: number | null   // after the reveal: how many parts the answer is
}) {
  const accent = T.accent1 === '#FFD700' ? '#2F5BE3' : T.accent1
  const radius = T.radius === '0px' ? 4 : 18
  const shaded = value.filter(Boolean).length
  const fillOf = (i: number) => {
    if (showCount != null) return i < showCount ? '#12937A' : '#F3F4F6'
    if (!value[i]) return '#F3F4F6'
    return result === 'right' ? '#12937A' : result === 'wrong' ? '#E85D3F' : accent
  }
  const toggle = (i: number) => { if (disabled) return; const v = [...value]; v[i] = !v[i]; onChange(v) }

  let shape: React.ReactNode
  if (pie) {
    const S = 240, cx = S / 2, cy = S / 2, r = 100
    shape = (
      <svg viewBox={`0 0 ${S} ${S}`} width="100%" style={{ maxWidth: 260, display: 'block', margin: '0 auto' }}>
        {Array.from({ length: d }, (_, i) => {
          const a1 = (i / d) * 2 * Math.PI - Math.PI / 2, a2 = ((i + 1) / d) * 2 * Math.PI - Math.PI / 2
          const large = a2 - a1 > Math.PI ? 1 : 0
          const p = d === 1
            ? `M${cx - r},${cy} a${r},${r} 0 1,0 ${2 * r},0 a${r},${r} 0 1,0 ${-2 * r},0`
            : `M${cx},${cy} L${cx + r * Math.cos(a1)},${cy + r * Math.sin(a1)} A${r},${r} 0 ${large} 1 ${cx + r * Math.cos(a2)},${cy + r * Math.sin(a2)} Z`
          return <path key={i} d={p} fill={fillOf(i)} stroke="#1E2D4E" strokeWidth={2} onPointerDown={() => toggle(i)}
            role="checkbox" aria-checked={!!value[i]} aria-label={`${isHE ? 'חלק' : 'part'} ${i + 1}`} style={{ cursor: disabled ? 'default' : 'pointer' }} />
        })}
      </svg>
    )
  } else {
    const W = 360, H = 90, pad = 10, cw = (W - pad * 2) / d
    shape = (
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
        {Array.from({ length: d }, (_, i) => (
          <rect key={i} x={pad + i * cw} y={15} width={cw} height={60} fill={fillOf(i)} stroke="#1E2D4E" strokeWidth={2}
            onPointerDown={() => toggle(i)} role="checkbox" aria-checked={!!value[i]} aria-label={`${isHE ? 'חלק' : 'part'} ${i + 1}`}
            style={{ cursor: disabled ? 'default' : 'pointer' }} />
        ))}
      </svg>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
      <div style={{ fontSize: 17, fontWeight: 700, color: T.text2 }}>{isHE ? 'הקישו על החלקים כדי לצבוע אותם' : 'Tap the parts to colour them'}</div>
      <div dir="ltr" style={{ width: '100%', maxWidth: 520, background: '#fff', borderRadius: radius, border: `2px solid ${T.border}`, padding: 10, boxSizing: 'border-box', touchAction: 'manipulation' }}>
        {shape}
      </div>
      <div dir="ltr" style={{ fontFamily: F, fontSize: 24, fontWeight: 800, color: T.text }}>{shaded}/{d}</div>
      {!disabled && (
        <button type="button" onClick={() => shaded > 0 && onSubmit()} disabled={shaded === 0}
          style={{ width: '100%', minHeight: 64, border: 'none', borderRadius: radius, background: T.accent1, color: '#fff', fontFamily: F, fontSize: 22, fontWeight: 800, cursor: shaded ? 'pointer' : 'default', opacity: shaded ? 1 : 0.5 }}>
          {isHE ? 'בודקים' : 'Check'}
        </button>
      )}
    </div>
  )
}
