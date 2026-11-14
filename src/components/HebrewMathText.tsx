'use client'
import React from 'react'
import FractionText from './FractionText'
import { segmentHebrewMath } from '@/lib/text'

// ─────────────────────────────────────────────────────────────
//  HebrewMathText — renders a Hebrew prompt/question string that may
//  contain embedded math, keeping numbers/operators LTR without
//  scrambling the surrounding Hebrew narrative's RTL flow. Shared across
//  every JSX surface that renders prompt_he as running text (lesson,
//  assignment, questions review) — the worksheet builder's print HTML
//  applies the same underlying lib/text.ts functions directly, since it
//  builds a plain HTML string rather than JSX.
//
//  Two cases, both driven by lib/text.ts's segmentHebrewMath:
//   1. Pure narrative, no isolatable expression -> one ordinary paragraph,
//      exactly what rendering used to look like before this component
//      existed.
//   2. An equation somewhere in the string — either the WHOLE string (e.g.
//      "3.5 + 2.4 = ___", same fix as commit 81caa25's worksheet-only
//      version, now shared) or embedded inside Hebrew narrative (e.g.
//      "פתרו: 3.5 + 2.4 = ___") — comes back from segmentHebrewMath as one
//      or more segments and renders as alternating text (inherits the
//      caller's RTL style) / math (forced LTR) paragraphs. A whole-string
//      equation naturally comes back as a single math-only segment, so it
//      needs no separate branch here. This sidesteps inline bidi isolation
//      entirely by putting the two directions on structurally separate
//      lines rather than trying to isolate a substring inside one
//      continuous run.
//
//  `style` is the caller's existing RTL paragraph style (direction, color,
//  font, margin, etc.) — reused as-is for narrative lines; math lines
//  override only direction/textAlign so the rest of the visual styling
//  (color, size, spacing) stays consistent with the surrounding question.
// ─────────────────────────────────────────────────────────────

interface HebrewMathTextProps {
  text: string | null | undefined
  style?: React.CSSProperties
  className?: string
  as?: 'p' | 'div'
}

export default function HebrewMathText({ text, style, className, as: Tag = 'p' }: HebrewMathTextProps) {
  if (!text) return null

  const segments = segmentHebrewMath(text)
  if (segments.length === 0) {
    // inline definitions like "M=(3,2)" and bare coordinate pairs "(3,9)" stay in the sentence,
    // each isolated left to right so the brackets and the equals sign keep their order
    const parts = text.split(/([A-Za-z]{1,3}\s*=\s*\(?-?[\d.,\s-]+\)?|\(\s*-?\d[\d.]*\s*,\s*-?\d[\d.]*\s*\))/g)
    return (
      <Tag className={className} style={style}>
        {parts.map((p, i) => i % 2
          ? <bdi key={i} dir="ltr"><FractionText text={p.trim()} /></bdi>
          : <FractionText key={i} text={p} />)}
      </Tag>
    )
  }

  return (
    <>
      {segments.map((seg, i) => (
        <Tag
          key={i}
          className={className}
          style={
            seg.type === 'math'
              ? { ...style, direction: 'ltr', textAlign: 'left' }
              : style
          }
        >
          <FractionText text={seg.content} />
        </Tag>
      ))}
    </>
  )
}
