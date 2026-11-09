'use client'
import React from 'react'
import FractionText from './FractionText'

// Hebrew running text with small math inside ("מתחילים ב-(−4)", "6−2=4",
// "(2,5)"): each math run is isolated left-to-right inside the RTL sentence,
// so brackets and signs never jump around. For one-line explanations, hints
// and steps (HebrewMathText splits math onto its own line, which suits prompts).
// a number: optional bracket, a sign only when not glued to a word (ל-0 is "to 0"),
// digits with inner . , / (no trailing full stop), optional closing bracket
const NUM = String.raw`\(?(?:(?<![א-תA-Za-z])[−\-+])?\d+(?:[.,/]\d+)*\)?`
const MATH = new RegExp(`(${NUM}(?:\\s*[+\\-−–×÷=<>]\\s*${NUM})*)`, 'g')

export default function InlineMath({ text }: { text: string | null | undefined }) {
  const s = String(text ?? '')
  const parts = s.split(MATH)
  return (
    <>
      {parts.map((p, i) => i % 2
        ? <span key={i} dir="ltr" style={{ unicodeBidi: 'isolate', whiteSpace: 'nowrap' }}><FractionText text={p} /></span>
        : <React.Fragment key={i}>{p}</React.Fragment>)}
    </>
  )
}
