'use client'
import s from './lesson.module.css'
import type { ColumnProblem } from './columnMath'

// The column board: place-value header chips, the two rows, a rule and the
// result row, always laid out left-to-right. `step` (1-based) decides what is
// highlighted and revealed; hidden cells keep their space so nothing jumps.
export default function ColumnBoard({ p, step }: { p: ColumnProblem; step: number }) {
  const cur = p.steps[step - 1]
  const hi = cur?.highlight
  const padded = p.padStep > 0 && step >= p.padStep
  const width = (k: string) => (k === 'op' ? 'var(--w-op)' : k === 'point' ? 'var(--w-pt)' : 'var(--w-d)')
  const template = p.cols.map(c => width(c.kind)).join(' ')
  const last = p.cols.length - 1

  const cellClass = (i: number, row: 'A' | 'B' | 'R') => {
    const col = p.cols[i]
    const cls = [s.c]
    if (col.kind === 'op') cls.push(s.op)
    if (col.kind === 'digit' && col.place === hi) cls.push(s[`hi_${col.place}`])
    if (col.kind === 'point' && cur?.points && row !== 'R') cls.push(s.pointHi)
    if (row === 'A' && col.kind === 'digit') cls.push(s.top)
    if (row === 'R' && col.kind === 'digit') cls.push(s.bottom)
    const cell = row === 'A' ? p.rowA[i] : row === 'B' ? p.rowB[i] : null
    if (cell?.padded && padded && step === p.padStep) cls.push(s.hiZero)
    return cls.join(' ')
  }

  const rowCells = (row: 'A' | 'B') => (row === 'A' ? p.rowA : p.rowB).map((cell, i) => {
    // the rightmost padded cell carries the badge (and, on row A, the arrow)
    const isBadge = cell.padded && i === last
    return (
      <div key={`${row}${i}`} className={cellClass(i, row)}>
        {cell.padded
          ? padded
            ? <>
                <span className={`${s.zero} ${s.pop}`}>0</span>
                {isBadge && <span className={`${s.plusBadge} ${s.pop}`} aria-hidden="true">+</span>}
                {isBadge && row === 'A' && (
                  <svg className={`${s.arrow} ${s.pop}`} width="120" height="130" viewBox="0 0 120 130" aria-hidden="true">
                    <path d="M108 124 C 112 70, 70 26, 16 18" fill="none" stroke="#E85D3F" strokeWidth="5" strokeLinecap="round" />
                    <path d="M16 18 L34 8 M16 18 L30 32" fill="none" stroke="#E85D3F" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </>
            : <span className={s.slot} />
          : cell.text}
      </div>
    )
  })

  return (
    <div className={s.board}>
      <div className={s.cols} dir="ltr" style={{ gridTemplateColumns: template }}>
        {p.cols.map((c, i) => c.kind === 'digit'
          ? <span key={`h${i}`} className={`${s.pvChip} ${s[`pv_${c.place}`]}`}>{c.label}</span>
          : <div key={`h${i}`} />)}
        {rowCells('A')}
        {rowCells('B')}
        <div className={s.rule} style={{ gridColumn: `1 / span ${p.cols.length}` }} />
        {p.result.map((r, i) => {
          const at = p.revealAt[i]
          const show = at > 0 && step >= at
          return (
            <div key={`r${i}`} className={cellClass(i, 'R')}>
              {r.text && <span className={`${s.res} ${show ? s.show : ''} ${show ? s.pop : ''}`}>{r.text}</span>}
            </div>
          )
        })}
      </div>
      {padded && (
        <div className={s.note}>
          <b>{p.padCount === 1 ? 'הוספנו 0!' : 'הוספנו אפסים!'}</b>
          <span><span className={s.ltr}>{p.padFrom} = {p.padTo}</span><br />הערך לא השתנה</span>
        </div>
      )}
    </div>
  )
}
