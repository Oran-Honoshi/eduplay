'use client'
import React, { useEffect, useRef } from 'react'
import { Delete } from 'lucide-react'

// Expected answers that are plain numbers (optionally negative, decimal or a
// fraction) get the big on-screen number pad instead of the phone keyboard.
export function isNumericAnswer(ans: unknown): boolean {
  if (ans === null || ans === undefined) return false
  return /^\s*[-−]?\s*\d+(?:[.,]\d+)?(?:\s*\/\s*\d+)?\s*$/.test(String(ans))
}

const KID_FONT = '"Rubik","Assistant",sans-serif'

export default function AnswerPad({
  value, onChange, onSubmit, disabled, numeric, expected, T, isHE, error, checkLabel,
}: {
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  disabled?: boolean
  numeric: boolean
  expected?: unknown
  T: any
  isHE: boolean
  error?: boolean
  checkLabel?: string
}) {
  const box = useRef<HTMLDivElement>(null)
  const exp = String(expected ?? '')
  const extra: string[] = []
  if (/[.,]/.test(exp)) extra.push('.')
  if (/\//.test(exp)) extra.push('/')
  const radius = T.radius === '0px' ? 4 : 18

  function press(k: string) {
    if (disabled) return
    if (k === '⌫') return onChange(value.slice(0, -1))
    if (k === '-') return onChange(value.startsWith('-') ? value.slice(1) : '-' + value)
    if (value.length >= 10) return
    onChange(value + k)
  }

  // Desktop: typing digits on a real keyboard still works.
  useEffect(() => {
    if (!numeric || disabled) return
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (/^[0-9]$/.test(e.key)) press(e.key)
      else if (e.key === 'Backspace') press('⌫')
      else if (e.key === '-') press('-')
      else if ((e.key === '.' || e.key === ',') && extra.includes('.')) press('.')
      else if (e.key === '/' && extra.includes('/')) press('/')
      else if (e.key === 'Enter' && value.trim()) onSubmit()
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const checkBtn = (
    <button type="button" onClick={() => value.trim() && onSubmit()} disabled={disabled || !value.trim()}
      style={{ width: '100%', minHeight: 64, border: 'none', borderRadius: radius, background: T.accent1, color: '#fff',
        fontFamily: KID_FONT, fontSize: 22, fontWeight: 800, cursor: disabled || !value.trim() ? 'default' : 'pointer',
        opacity: disabled || !value.trim() ? 0.5 : 1 }}>
      {checkLabel || (isHE ? 'בודקים' : 'Check')}
    </button>
  )

  if (!numeric) {
    return (
      <form onSubmit={e => { e.preventDefault(); if (value.trim()) onSubmit() }} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input value={value} disabled={disabled} onChange={e => onChange(e.target.value)} dir="auto" autoComplete="off"
          placeholder={isHE ? 'כתבו כאן את התשובה' : 'Type your answer'} aria-label={isHE ? 'התשובה שלך' : 'Your answer'}
          style={{ width: '100%', boxSizing: 'border-box', minHeight: 64, padding: '10px 16px', fontSize: 22, fontWeight: 700,
            borderRadius: radius, border: `2px solid ${error ? '#E85D3F' : T.border}`, background: T.panel, color: T.text, fontFamily: KID_FONT,
            unicodeBidi: 'plaintext' }}/>
        {checkBtn}
      </form>
    )
  }

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '-', '0', '⌫']
  const keyStyle: React.CSSProperties = {
    minHeight: 60, border: 'none', borderRadius: radius, background: T.panel, color: T.text,
    fontFamily: KID_FONT, fontSize: 28, fontWeight: 800, cursor: disabled ? 'default' : 'pointer',
    boxShadow: `0 2px 0 ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
    WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation',
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div ref={box} dir="ltr" role="textbox" aria-label={isHE ? 'התשובה שלך' : 'Your answer'} aria-readonly="true"
        style={{ minHeight: 64, borderRadius: radius, border: `3px solid ${error ? '#E85D3F' : value ? T.accent1 : T.border}`,
          background: T.panel, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: KID_FONT, fontSize: 34, fontWeight: 800, color: T.text, letterSpacing: 1 }}>
        {value ? value.replace(/^-/, '−') : <span style={{ opacity: 0.35, fontSize: 22 }}>{isHE ? 'הקישו תשובה' : 'Tap your answer'}</span>}
      </div>
      <div dir="ltr" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
        {keys.map(k => (
          <button key={k} type="button" onClick={() => press(k)} disabled={disabled}
            aria-label={k === '⌫' ? (isHE ? 'מחיקה' : 'Delete') : k === '-' ? (isHE ? 'מינוס' : 'Minus') : k}
            style={keyStyle}>
            {k === '⌫' ? <Delete size={26}/> : k === '-' ? '−' : k}
          </button>
        ))}
        {extra.map(k => (
          <button key={k} type="button" onClick={() => press(k)} disabled={disabled} style={keyStyle}>{k}</button>
        ))}
      </div>
      {checkBtn}
    </div>
  )
}
