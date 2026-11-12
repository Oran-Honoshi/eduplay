'use client'
import type { PlaceValueProblem, PVPlace } from './placeValue'
import s from './lesson.module.css'

// The place-value board: a small table with the place names above the digits,
// and underneath, what each digit is worth in blocks. A ten is one row of 10
// squares, so "3 עשרות" is three rows ("3 פעמים 10"); a hundred is a 10×10
// square; ones are single squares. Blocks appear step by step.
export default function PlaceValueBoard({ p, step }: { p: PlaceValueProblem; step: number }) {
  const cur = p.steps[step - 1]
  const show = new Set<PVPlace>(cur?.show || [])
  const hi = cur?.highlight
  const d = (place: PVPlace) => p.digits.find(x => x.place === place)?.d || 0
  return (
    <div className={s.board} role="img" aria-label={`המספר ${p.n}: ${p.digits.map(x => `${x.d} ${x.label}`).join(', ')}`}>
      {/* the table: place names above the digits, left to right like the number */}
      <div className={s.pvTable} dir="ltr">
        {p.digits.map(x => (
          <div key={x.place} className={`${s.pvCol} ${hi === x.place ? s.pvColOn : ''}`}>
            <span className={`${s.pvHead} ${s[`pv_${x.place}`]}`} dir="rtl">{x.label}</span>
            <span className={s.pvDigit}>{x.d}</span>
          </div>
        ))}
      </div>

      {/* what each digit is worth */}
      <div className={s.pvBlocks} dir="ltr" aria-hidden="true">
        {d('hundreds') > 0 && (
          <div className={`${s.pvGroup} ${show.has('hundreds') ? s.pvShow : ''} ${hi === 'hundreds' ? s.pvGroupOn : ''}`}>
            <div className={s.pvRowWrap}>
              {Array.from({ length: d('hundreds') }, (_, i) => (
                <span key={i} className={s.pvHundred}>{Array.from({ length: 100 }, (_, j) => <i key={j} />)}</span>
              ))}
            </div>
            <span className={s.pvCaption} dir="rtl">{d('hundreds')} פעמים 100 · <bdi dir="ltr">{d('hundreds')} × 100 = {d('hundreds') * 100}</bdi></span>
          </div>
        )}
        <div className={`${s.pvGroup} ${show.has('tens') ? s.pvShow : ''} ${hi === 'tens' ? s.pvGroupOn : ''}`}>
          <div className={s.pvTens}>
            {Array.from({ length: d('tens') }, (_, i) => (
              <div key={i} className={s.pvTenRow}>
                {i > 0 && <b className={s.pvPlus}>+</b>}
                <span className={s.pvTen}>{Array.from({ length: 10 }, (_, j) => <i key={j} />)}</span>
                <span className={s.pvTenLabel}>10</span>
              </div>
            ))}
          </div>
          <span className={s.pvCaption} dir="rtl">{d('tens') ? <>{d('tens')} פעמים 10 · <bdi dir="ltr">{d('tens')} × 10 = {d('tens') * 10}</bdi></> : 'אין עשרות'}</span>
        </div>
        <div className={`${s.pvGroup} ${show.has('ones') ? s.pvShow : ''} ${hi === 'ones' ? s.pvGroupOn : ''}`}>
          <span className={s.pvOnes}>{Array.from({ length: d('ones') }, (_, j) => <i key={j} />)}</span>
          <span className={s.pvCaption} dir="rtl">{d('ones') ? <>{d('ones')} יחידות · <bdi dir="ltr">{d('ones')}</bdi></> : 'אין יחידות'}</span>
        </div>
      </div>
    </div>
  )
}
