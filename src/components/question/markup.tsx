'use client'
import React from 'react'
import s from './question.module.css'

// Question text markup (designer's question-screen model, 2026-11):
//   [[text]]    the key concept: one highlighter stroke per question
//   <<n:text>>  data piece n, lit up by "mark the data"
//   numbers and whole expressions ("8", "6 × 7", "25%", "1/2", "80 ₪") become
//   yellow number chips automatically, isolated left-to-right.

const NUM = String.raw`\(?(?:(?<![א-ת\u0591-\u05C7A-Za-z])[−\-+])?\d+(?:[.,/:]\d+)*\)?%?(?:\s?°[CFcf]?)?`
const OPERAND = String.raw`(?:${NUM}|_{2,}|\?)`
const MATH = new RegExp(`(${NUM}(?:\\s*[+\\-−–×x·÷=<>]\\s*${OPERAND})*)`, 'g')
const TOKENS = /(\[\[[\s\S]+?\]\]|<<\d+:[\s\S]+?>>)/g

export type Marking = { active: number[] | null }   // data indexes lit for the current step, or null = off

/** strips the markup (for read-aloud, alt text, the old screens) */
export function plainText(t: string | null | undefined): string {
  return String(t ?? '').replace(/\[\[([\s\S]+?)\]\]/g, '$1').replace(/<<\d+:([\s\S]+?)>>/g, '$1')
}

export function hasMarkup(t: string | null | undefined): boolean {
  return /\[\[[\s\S]+?\]\]|<<\d+:/.test(String(t ?? ''))
}

/** "8 תפוחים" → text and chips */
export function Chips({ text, chips = true, inPassage = false }: { text: string; chips?: boolean; inPassage?: boolean }) {
  if (!chips) return <>{text}</>
  const parts = text.split(MATH)
  return (
    <>
      {parts.map((p, i) => (i % 2
        ? <bdi key={i} dir="ltr" className={inPassage ? `${s.chip} ${s.chipFlat}` : s.chip}>{p.replace(/\s*\*\s*/g, ' × ')}</bdi>
        : <React.Fragment key={i}>{p}</React.Fragment>))}
    </>
  )
}

/** the question / helper line with key concept, data and chips */
export function MarkedText({ text, marking, chips = true }: { text: string | null | undefined; marking?: Marking; chips?: boolean }) {
  const t = String(text ?? '')
  const on = !!marking?.active
  const parts = t.split(TOKENS).filter(p => p !== '')
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith('[[')) {
          return <span key={i} className={s.key}>{p.slice(2, -2)}</span>
        }
        const m = p.match(/^<<(\d+):([\s\S]+)>>$/)
        if (m) {
          const idx = Number(m[1])
          const lit = on && marking!.active!.includes(idx)
          return (
            <span key={i} className={lit ? s.dataOn : on ? s.dataOff : undefined} data-d={idx}>
              <Chips text={m[2]} chips={chips} />
            </span>
          )
        }
        return <span key={i} className={on ? s.faded : undefined}><Chips text={p} chips={chips} /></span>
      })}
    </>
  )
}

const LATIN = /([A-Za-z][A-Za-z'’\- ]*[A-Za-z]|[A-Za-z])/g

/** feedback lines: every math run and every English phrase isolated LTR, no chips */
export function FeedbackText({ text }: { text: string | null | undefined }) {
  const parts = plainText(text).split(MATH)
  return (
    <>
      {parts.map((p, i) => (i % 2
        ? <bdi key={i} dir="ltr" style={{ whiteSpace: 'nowrap' }}>{p}</bdi>
        : <React.Fragment key={i}>{p.split(LATIN).map((w, j) => (j % 2 ? <bdi key={j} dir="ltr">{w}</bdi> : w))}</React.Fragment>))}
    </>
  )
}

/** direction for an answer tile: Hebrew or ₪ amounts read right-to-left, numbers and English left-to-right */
export function tileDir(text: string): 'rtl' | 'ltr' {
  return /[א-ת]/.test(text) || /₪/.test(text) ? 'rtl' : 'ltr'
}
