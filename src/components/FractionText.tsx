'use client'
import React from 'react'
import { tokenizeFractionText, type FractionToken } from '@/lib/fractionText'

// ─────────────────────────────────────────────────────────────
//  FractionText — thin client wrapper around the shared tokenizer
//  in src/lib/fractionText.ts (also used by the worksheet builder
//  route). Renders inline "3/4" / "2 3/4" patterns in running text
//  as a numerator/line/denominator glyph instead of a raw slash.
// ─────────────────────────────────────────────────────────────

interface FractionTextProps {
  text?: string | null
}

function FractionGlyph({ whole, n, d }: FractionToken) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center' }}>
      {whole && <span style={{ marginInlineEnd: '2px' }}>{whole}</span>}
      <span style={{ display: 'inline-table', verticalAlign: 'middle', textAlign: 'center', fontFamily: '"Times New Roman",serif', margin: '0 2px' }}>
        <span style={{ display: 'table-row' }}>
          <span style={{ display: 'table-cell', paddingBottom: '1px', fontWeight: 700, fontSize: '0.85em', borderBottom: '1.5px solid currentColor' }}>{n}</span>
        </span>
        <span style={{ display: 'table-row' }}>
          <span style={{ display: 'table-cell', paddingTop: '1px', fontWeight: 700, fontSize: '0.85em' }}>{d}</span>
        </span>
      </span>
    </span>
  )
}

export default function FractionText({ text }: FractionTextProps) {
  if (!text) return null
  const segments = tokenizeFractionText(text)
  return (
    <>
      {segments.map((seg, i) =>
        typeof seg === 'string' ? <React.Fragment key={i}>{seg}</React.Fragment> : <FractionGlyph key={i} {...seg} />
      )}
    </>
  )
}
