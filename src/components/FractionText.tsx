'use client'
import React from 'react'
import { tokenizeFractionText, type FractionToken } from '@/lib/fractionText'
import { splitMathRuns, normalizeFractions } from '@/lib/bidiMath'

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

// Text with no Hebrew letters (numbers, equations, "3/4 > 3/8", "-3, -1, 0, 1",
// a lone ">") must always read left-to-right. Inside a Hebrew (RTL) layout the
// browser would otherwise reorder it — swapping fractions, mirroring < and >,
// and moving the minus sign to the end ("3-"). That can make a child pick the
// wrong answer, so such text is isolated as LTR. Mixed Hebrew + math text keeps
// its paragraph direction (HebrewMathText handles prompts with equations).
const HEBREW = /[\u0590-\u05FF]/

export default function FractionText({ text }: FractionTextProps) {
  if (!text) return null
  const glyphs = (t: string, key: string) => tokenizeFractionText(t).map((seg, i) =>
    typeof seg === 'string' ? <React.Fragment key={`${key}-${i}`}>{seg}</React.Fragment> : <FractionGlyph key={`${key}-${i}`} {...seg} />)
  if (!HEBREW.test(text)) return <bdi dir="ltr" style={{ unicodeBidi: 'isolate' }}>{glyphs(normalizeFractions(text), 'a')}</bdi>
  // Hebrew with math inside: each math run is isolated left-to-right (see lib/bidiMath)
  return <>{splitMathRuns(text).map((p, i) => p.ltr
    ? <bdi key={i} dir="ltr" style={{ unicodeBidi: 'isolate' }}>{glyphs(p.text, String(i))}</bdi>
    : <React.Fragment key={i}>{glyphs(p.text, String(i))}</React.Fragment>)}</>
}
