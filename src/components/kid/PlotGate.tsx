'use client'
import React, { useEffect, useState } from 'react'
import PlotPoints from '@/components/kid/PlotPoints'
import { interactiveKind, plotTask } from '@/lib/interactive'

/**
 * "Mark the points …, then answer": the child first places the points; only
 * then the answer area (choices, number pad, grid…) appears below the finished
 * drawing. fresh = the question hasn't been tried yet (otherwise the drawing
 * is shown already finished).
 */
export default function PlotGate({ q, T, isHE, fresh, children }: { q: any; T: any; isHE: boolean; fresh: boolean; children: React.ReactNode }) {
  const task = plotTask(q)
  const [done, setDone] = useState(!fresh)
  useEffect(() => { setDone(!fresh) }, [q?.id]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!task) return <>{children}</>
  // when the answer itself is a point, the answer grid shows the marked points
  const keepDrawing = interactiveKind(q) !== 'grid'
  return (
    <>
      {(!done || keepDrawing) && (
        <PlotPoints key={`${q?.id}-${done}`} data={q.visual_data} points={task.points} join={task.join} T={T} isHE={isHE}
          startDone={done} onDone={() => setDone(true)} />
      )}
      {done && children}
    </>
  )
}
