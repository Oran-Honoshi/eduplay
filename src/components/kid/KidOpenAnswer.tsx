'use client'
import React, { useEffect, useState } from 'react'
import AnswerPad, { isNumericAnswer } from '@/components/kid/AnswerPad'
import GridAnswer, { parsePoint } from '@/components/kid/GridAnswer'
import PlotPoints from '@/components/kid/PlotPoints'
import NumberLineAnswer from '@/components/kid/NumberLineAnswer'
import FractionShade from '@/components/kid/FractionShade'
import { interactiveKind, plotTask, shadeTask } from '@/lib/interactive'

const toNum = (s: string) => Number(String(s).replace(/[−–]/g, '-').replace(/[()+\s]/g, ''))

/**
 * The answer area of an open question in the kids' app. Picks the best way to
 * answer from the question itself:
 *   mark points first ("סמנו את הנקודות…"), then
 *   tap a point on the grid · tap the number line · shade a fraction ·
 *   or the number pad / text box.
 * tries = earlier wrong answers; resolved = the question is finished
 * (answered right, or the answer was revealed).
 */
export default function KidOpenAnswer({ q, T, isHE, canAnswer, submitting, tries, resolved, rightAnswer, onSubmit }: {
  q: any
  T: any
  isHE: boolean
  canAnswer: boolean
  submitting?: boolean
  tries: string[]
  resolved: boolean
  rightAnswer?: string | null   // the child's own right answer, when resolved by answering right
  onSubmit: (label: string) => void
}) {
  const kind = interactiveKind(q)
  const plot = plotTask(q)
  const [plotted, setPlotted] = useState(false)
  const [typed, setTyped] = useState('')
  const [point, setPoint] = useState<[number, number] | null>(null)
  const [num, setNum] = useState<number | null>(null)
  const shade = shadeTask(q)
  const [parts, setParts] = useState<boolean[]>([])
  useEffect(() => { setPlotted(false); setTyped(''); setPoint(null); setNum(null); setParts(shade ? Array(shade.d).fill(false) : []) }, [q?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // step 1: mark the given points (skipped once the child has already answered)
  if (plot && !plotted && !resolved && tries.length === 0) {
    return <PlotPoints data={q.visual_data} points={plot.points} join={plot.join} T={T} isHE={isHE} onDone={() => setPlotted(true)} />
  }

  const disabled = !canAnswer || !!submitting
  const prompt = q.prompt_he || q.prompt_en

  if (kind === 'grid') {
    const ans = parsePoint(q.correct_answer)
    return (
      <GridAnswer data={q.visual_data} value={point} onChange={setPoint} disabled={disabled || resolved}
        onSubmit={() => { if (point) { onSubmit(`(${point[0]},${point[1]})`); setPoint(null) } }}
        T={T} isHE={isHE} answer={ans} given={prompt}
        mine={[...tries.map(t => parsePoint(t)).filter(Boolean).map(p => ({ p: p as [number, number], ok: false })),
          ...(rightAnswer && parsePoint(rightAnswer) ? [{ p: parsePoint(rightAnswer) as [number, number], ok: true }] : [])]}
        correct={resolved ? ans : null} />
    )
  }

  if (kind === 'numberline') {
    const ans = toNum(q.correct_answer)
    return (
      <NumberLineAnswer data={q.visual_data} value={num} onChange={setNum} disabled={disabled || resolved}
        onSubmit={() => { if (num !== null) { onSubmit(String(num)); setNum(null) } }} T={T} isHE={isHE}
        mine={tries.map(t => ({ v: toNum(t), ok: false })).filter(m => Number.isFinite(m.v))}
        correct={resolved ? ans : null} />
    )
  }

  if (kind === 'shade' && shade) {
    const m = String(q.correct_answer).match(/(\d+)\s*\/\s*(\d+)/)
    const need = m ? (Number(m[1]) * shade.d) / Number(m[2]) : null
    const lastWrong = tries.length > 0 && !resolved
    return (
      <FractionShade d={shade.d} pie={shade.pie} value={parts} onChange={setParts} disabled={disabled || resolved}
        onSubmit={() => onSubmit(`${parts.filter(Boolean).length}/${shade.d}`)} T={T} isHE={isHE}
        result={resolved && rightAnswer ? 'right' : lastWrong ? 'wrong' : null}
        showCount={resolved && !rightAnswer ? need : null} />
    )
  }

  return (
    <>
      {tries.length > 0 && !resolved && (
        <div style={{ fontSize: 17, color: '#B4432A', fontWeight: 700 }}>
          {isHE ? 'ניסית:' : 'You tried:'} {tries.map((w, i) => <bdi key={i} style={{ marginInlineStart: 6 }}>{w}</bdi>)}
        </div>
      )}
      {canAnswer && !resolved && (
        <AnswerPad value={typed} onChange={setTyped} numeric={isNumericAnswer(q.correct_answer)} expected={q.correct_answer}
          onSubmit={() => { const v = typed.trim(); if (v) { onSubmit(v); setTyped('') } }}
          T={T} isHE={isHE} disabled={!!submitting} />
      )}
    </>
  )
}
