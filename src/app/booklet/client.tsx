'use client'
import { useState, useMemo, useRef, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase'

// ── Types (inlined to avoid module resolution issues) ──────────
type Subject = 'math' | 'hebrew' | 'english'
interface TopicMeta { topic_slug: string; subject: Subject; grade: number; title_en: string; title_he: string }
interface Visual { type: string; description: string; steps?: string[] }
interface Example {
  problem_en: string; problem_he: string; visual?: Visual
  solution_steps_en: string[]; solution_steps_he: string[]
  answer_en: string; answer_he: string
}
interface TopicExplanation extends TopicMeta {
  summary_en: string; summary_he: string
  key_points_en: string[]; key_points_he: string[]
  main_visual: Visual; examples: Example[]
}

// ── Visual Renderer (inlined) ──────────────────────────────────
const C = {
  blue:   { fill: '#E6F1FB', stroke: '#378ADD', text: '#0C447C' },
  green:  { fill: '#EAF3DE', stroke: '#639922', text: '#27500A' },
  orange: { fill: '#FAEEDA', stroke: '#BA7517', text: '#633806' },
  teal:   { fill: '#E1F5EE', stroke: '#1D9E75', text: '#085041' },
  red:    { fill: '#FCEBEB', stroke: '#E24B4A', text: '#A32D2D' },
  purple: { fill: '#EEEDFE', stroke: '#7F77DD', text: '#3C3489' },
  gray:   { fill: '#F1EFE8', stroke: '#888780', text: '#5F5E5A' },
}

function FractionPizza({ description, problem }: { description: string; problem?: string }) {
  const src = problem || description
  const fracs = [...src.matchAll(/(\d+)\/(\d+)/g)].map(m => ({ n: parseInt(m[1]), d: parseInt(m[2]) }))
  const f = fracs[0] ?? { n: 2, d: 4 }
  const total = f.d, shaded = f.n
  const cx = 90, cy = 85, r = 65
  const slices = Array.from({ length: total }, (_, i) => {
    const a1 = (i / total) * 2 * Math.PI - Math.PI / 2
    const a2 = ((i + 1) / total) * 2 * Math.PI - Math.PI / 2
    const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1)
    const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2)
    return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${total === 1 ? 1 : 0} 1 ${x2} ${y2} Z`
  })
  return (
    <svg viewBox="0 0 200 175" className="w-full max-w-[180px] mx-auto block">
      {slices.map((d, i) => <path key={i} d={d} fill={i < shaded ? C.teal.fill : '#f0f0f0'} stroke={C.teal.stroke} strokeWidth="1.5" />)}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={C.teal.stroke} strokeWidth="2" />
      {/* Proper stacked fraction */}
      <text x={cx} y={155} textAnchor="middle" fontSize="16" fontWeight="800" fill={C.teal.text}>{shaded}</text>
      <line x1={cx - 12} y1={162} x2={cx + 12} y2={162} stroke={C.teal.stroke} strokeWidth="1.5" />
      <text x={cx} y={174} textAnchor="middle" fontSize="16" fontWeight="800" fill={C.teal.text}>{total}</text>
    </svg>
  )
}

function LongMultViz({ description }: { description: string }) {
  const nums = description.match(/\d{2,}/g) || ['23', '12']
  const n1 = parseInt(nums[0] || '23'), n2 = parseInt(nums[1] || '12')
  const row1 = n1 * (n2 % 10), row2 = n1 * Math.floor(n2 / 10)
  return (
    <svg viewBox="0 0 200 155" className="w-full max-w-[200px] mx-auto block">
      <text x="140" y="28" textAnchor="end" fontSize="20" fontFamily="monospace" fontWeight="700" fill={C.gray.text}>{n1}</text>
      <text x="30" y="50" fontSize="14" fill={C.gray.text}>×</text>
      <text x="140" y="50" textAnchor="end" fontSize="20" fontFamily="monospace" fontWeight="700" fill={C.gray.text}>{n2}</text>
      <line x1="20" y1="58" x2="150" y2="58" stroke="#ccc" strokeWidth="1.5" />
      <text x="140" y="78" textAnchor="end" fontSize="18" fontFamily="monospace" fontWeight="600" fill={C.blue.text}>{row1}</text>
      <text x="155" y="78" fontSize="9" fill={C.blue.stroke}>ones</text>
      <text x="132" y="100" textAnchor="end" fontSize="18" fontFamily="monospace" fontWeight="600" fill={C.orange.text}>{row2}</text>
      <text x="133" y="100" fontSize="13" fill={C.gray.stroke}>0</text>
      <text x="155" y="100" fontSize="9" fill={C.orange.stroke}>tens</text>
      <line x1="20" y1="108" x2="150" y2="108" stroke="#ccc" strokeWidth="1.5" />
      <text x="140" y="130" textAnchor="end" fontSize="20" fontFamily="monospace" fontWeight="800" fill={C.teal.text}>{n1 * n2}</text>
    </svg>
  )
}

function PlaceValueViz({ description }: { description: string }) {
  const m = description.match(/\b(\d{3,4})\b/)
  const num = m ? parseInt(m[1]) : 345
  const cols: [string, typeof C.red][] = [['Hundreds', C.red], ['Tens', C.blue], ['Ones', C.green]]
  const vals = [Math.floor(num / 100), Math.floor((num % 100) / 10), num % 10]
  return (
    <svg viewBox="0 0 240 140" className="w-full max-w-[260px] mx-auto block">
      {cols.map(([label, color], i) => (
        <g key={i}>
          <rect x={10 + i * 75} y={10} width={70} height={26} rx="5" fill={color.fill} stroke={color.stroke} strokeWidth="1" />
          <text x={45 + i * 75} y={27} textAnchor="middle" fontSize="11" fontWeight="600" fill={color.text}>{label}</text>
          <rect x={10 + i * 75} y={44} width={70} height={80} rx="5" fill="white" stroke={color.stroke} strokeWidth="1" strokeDasharray="3,2" />
          <text x={45 + i * 75} y={94} textAnchor="middle" fontSize="32" fontWeight="800" fill={color.text}>{vals[i]}</text>
        </g>
      ))}
    </svg>
  )
}

function NumberLineViz({ description, problem }: { description: string; problem?: string }) {
  const src = problem || description
  const fracs: { n: number; d: number; color: string }[] = []
  const cl = [C.blue.stroke, C.orange.stroke, C.teal.stroke]
  let ci = 0
  for (const m of src.matchAll(/(\d+)\/(\d+)/g)) fracs.push({ n: parseInt(m[1]), d: parseInt(m[2]), color: cl[ci++ % 3] })
  if (!fracs.length) fracs.push({ n: 1, d: 4, color: C.blue.stroke }, { n: 1, d: 2, color: C.orange.stroke })
  return (
    <svg viewBox="0 0 280 90" className="w-full max-w-[300px] mx-auto block">
      <line x1="20" y1="52" x2="260" y2="52" stroke="#999" strokeWidth="1.5" />
      <text x="12" y="56" fontSize="10" fill="#888" textAnchor="middle">0</text>
      <text x="268" y="56" fontSize="10" fill="#888" textAnchor="middle">1</text>
      {fracs.map(({ n, d, color }, i) => {
        const x = 20 + (n / d) * 240
        return (
          <g key={i}>
            <line x1={x} y1="44" x2={x} y2="60" stroke={color} strokeWidth="2" />
            <circle cx={x} cy="52" r="4" fill={color} />
            {/* Stacked fraction label */}
            <text x={x} y="30" textAnchor="middle" fontSize="10" fontWeight="700" fill={color}>{n}</text>
            <line x1={x - 7} y1="33" x2={x + 7} y2="33" stroke={color} strokeWidth="1" />
            <text x={x} y="43" textAnchor="middle" fontSize="10" fontWeight="700" fill={color}>{d}</text>
          </g>
        )
      })}
    </svg>
  )
}

function BarModelViz({ description }: { description: string }) {
  const tm = description.match(/(\d+)\s+(?:dots|total)/i), gm = description.match(/(\d+)\s+groups?/i)
  const total = tm ? parseInt(tm[1]) : 12, groups = gm ? parseInt(gm[1]) : 3
  const w = 200
  return (
    <svg viewBox={`0 0 ${w + 40} ${30 + groups * 40}`} className="w-full max-w-[260px] mx-auto block">
      <rect x="20" y="5" width={w} height={26} rx="6" fill={C.blue.fill} stroke={C.blue.stroke} strokeWidth="1.5" />
      <text x={20 + w / 2} y={22} textAnchor="middle" fontSize="13" fontWeight="700" fill={C.blue.text}>{total}</text>
      {Array.from({ length: groups }, (_, i) => (
        <g key={i}><rect x={20} y={36 + i * 36} width={w / groups - 4} rx="5" height={26} fill={C.teal.fill} stroke={C.teal.stroke} strokeWidth="1.5" /><text x={20 + (w / groups - 4) / 2} y={53 + i * 36} textAnchor="middle" fontSize="12" fontWeight="700" fill={C.teal.text}>{Math.round(total / groups)}</text></g>
      ))}
    </svg>
  )
}

function ShapeViz({ description, problem }: { description: string; problem?: string }) {
  const src = problem || description
  const isSquare = /square/i.test(src)
  const isSym = /symmetr/i.test(src)
  // Parse dimensions from problem — look for numbers with cm or just plain numbers
  const nums = [...src.matchAll(/(\d+)\s*(?:cm|m)?/g)].map(m => parseInt(m[1])).filter(n => n > 0 && n <= 50)
  const L = nums[0] ?? (isSquare ? 6 : 5)
  const W = isSquare ? L : (nums[1] ?? 3)
  const sc = Math.min(140 / Math.max(L, W), 28)
  const rw = L * sc, rh = W * sc
  const ox = (200 - rw) / 2, oy = (150 - rh) / 2

  return (
    <svg viewBox="0 0 200 160" className="w-full max-w-[220px] mx-auto block">
      {/* Grid squares for area (only when not symmetry) */}
      {!isSym && Array.from({ length: W }, (_, row) => Array.from({ length: L }, (_, col) => (
        <rect key={`${row}-${col}`} x={ox + col * sc} y={oy + row * sc} width={sc - 1} height={sc - 1}
          fill={C.orange.fill} stroke={C.orange.stroke} strokeWidth="0.5" />
      )))}
      {/* Shape outline */}
      <rect x={ox} y={oy} width={rw} height={rh} fill={isSym ? C.teal.fill : 'none'}
        stroke={C.blue.stroke} strokeWidth="2.5" fillOpacity={isSym ? 0.3 : 1} />
      {/* Symmetry lines */}
      {isSym && (
        <>
          <line x1={ox + rw/2} y1={oy - 5} x2={ox + rw/2} y2={oy + rh + 5} stroke={C.red.stroke} strokeWidth="1.5" strokeDasharray="4,3" />
          <line x1={ox - 5} y1={oy + rh/2} x2={ox + rw + 5} y2={oy + rh/2} stroke={C.blue.stroke} strokeWidth="1.5" strokeDasharray="4,3" />
          {isSquare && <>
            <line x1={ox} y1={oy} x2={ox + rw} y2={oy + rh} stroke={C.teal.stroke} strokeWidth="1.5" strokeDasharray="4,3" />
            <line x1={ox + rw} y1={oy} x2={ox} y2={oy + rh} stroke={C.purple.stroke} strokeWidth="1.5" strokeDasharray="4,3" />
          </>}
        </>
      )}
      {/* Dimension labels */}
      <text x={ox + rw/2} y={oy - 6} textAnchor="middle" fontSize="11" fontWeight="600" fill={C.blue.text}>{L} cm</text>
      <text x={ox - 6} y={oy + rh/2} textAnchor="middle" fontSize="11" fontWeight="600" fill={C.blue.text}
        transform={`rotate(-90,${ox - 6},${oy + rh/2})`}>{W} cm</text>
      {/* Area formula */}
      {!isSym && <text x="100" y="152" textAnchor="middle" fontSize="10" fill={C.orange.text}>A = {L}×{W} = {L*W} cm²</text>}
    </svg>
  )
}

function GrammarTableViz({ description }: { description: string }) {
  const isToBe = /am.*is.*are/i.test(description)
  const rows = isToBe
    ? [['I', 'am', 'was'], ['You', 'are', 'were'], ['He/She', 'is', 'was'], ['We/They', 'are', 'were']]
    : [['I', 'play', "don't play"], ['You', 'play', "don't play"], ['He/She', 'plays', "doesn't"], ['We/They', 'play', "don't play"]]
  const headers = isToBe ? ['Subject', 'Present', 'Past'] : ['Subject', 'Affirm.', 'Negative']
  return (
    <svg viewBox="0 0 300 155" className="w-full max-w-[320px] mx-auto block">
      {headers.map((h, i) => (<g key={i}><rect x={10 + i * 95} y={8} width={90} height={22} rx="4" fill={C.teal.fill} stroke={C.teal.stroke} strokeWidth="1" /><text x={55 + i * 95} y={23} textAnchor="middle" fontSize="11" fontWeight="600" fill={C.teal.text}>{h}</text></g>))}
      {rows.map((row, ri) => row.map((cell, ci) => (
        <g key={`${ri}-${ci}`}><rect x={10 + ci * 95} y={34 + ri * 27} width={90} height={25} rx="3" fill={ci === 0 ? C.gray.fill : '#fafafa'} stroke="#e5e5e5" strokeWidth="0.5" /><text x={55 + ci * 95} y={50 + ri * 27} textAnchor="middle" fontSize="11" fontWeight={cell.match(/plays|am|is|are|was|were/) ? '700' : '400'} fill={C.gray.text}>{cell}</text></g>
      )))}
    </svg>
  )
}

function VerbTableViz() {
  const rows: [string, string, string, string][] = [
    ['אני', 'אכתוב', 'א', C.red.stroke], ['אתה/את', 'תכתוב', 'ת', C.blue.stroke],
    ['הוא/היא', 'יכתוב', 'י', C.green.stroke], ['אנחנו', 'נכתוב', 'נ', C.orange.stroke],
    ['אתם/הם', 'תכתבו', 'ת', C.blue.stroke], ['הן', 'תכתובנה', 'ת', C.blue.stroke],
  ]
  return (
    <svg viewBox="0 0 300 195" className="w-full max-w-[320px] mx-auto block">
      <rect x="100" y="2" width="100" height="22" rx="5" fill={C.red.fill} stroke={C.red.stroke} strokeWidth="1.5" />
      <text x="150" y="17" textAnchor="middle" fontSize="13" fontWeight="700" fill={C.red.text}>כ-ת-ב</text>
      {rows.map(([person, form, prefix, color], i) => (
        <g key={i}>
          <rect x="5" y={28 + i * 27} width="80" height="23" rx="4" fill={C.gray.fill} stroke="#ddd" strokeWidth="0.5" />
          <text x="45" y={43 + i * 27} textAnchor="middle" fontSize="11" fill={C.gray.text}>{person}</text>
          <rect x="90" y={28 + i * 27} width="120" height="23" rx="4" fill="#fafcff" stroke="#ddd" strokeWidth="0.5" />
          <rect x="188" y={30 + i * 27} width="16" height="19" rx="3" fill={`${color}33`} stroke={color} strokeWidth="1" />
          <text x="196" y={43 + i * 27} textAnchor="middle" fontSize="13" fontWeight="800" fill={color}>{prefix}</text>
          <text x="140" y={43 + i * 27} textAnchor="middle" fontSize="12" fontWeight="600" fill={C.blue.text}>{form}</text>
        </g>
      ))}
    </svg>
  )
}

function HighlightedTextViz({ description }: { description: string }) {
  const m = description.match(/"([^"]+)"/)
  const sentence = (m?.[1] || 'הילד הקטן רץ מהר לבית הספר').split(' ')
  return (
    <div dir="rtl" className="p-3 bg-gray-50 rounded-xl border border-gray-100">
      <div className="flex flex-wrap gap-1 justify-end mb-3">
        {sentence.map((word, i) => {
          const isNoun = /ילד|בית|ספר|חתול|מורה|מכתב/.test(word)
          const isVerb = /רץ|ישן|כתבה|אוכל|קוראת|שיחקו/.test(word)
          const isAdj = /קטן|גדול|קטנה|גדולה/.test(word)
          const bg = isNoun ? '#DBEAFE' : isVerb ? '#FEF3C7' : isAdj ? '#DCFCE7' : 'transparent'
          const col = isNoun ? '#1E40AF' : isVerb ? '#92400E' : isAdj ? '#166534' : '#9CA3AF'
          return <span key={i} className="px-1.5 py-0.5 rounded text-sm font-semibold" style={{ background: bg, color: col }}>{word}</span>
        })}
      </div>
      <div className="flex gap-3 justify-center text-xs">
        {([['שם עצם', '#DBEAFE', '#1E40AF'], ['פועל', '#FEF3C7', '#92400E'], ['תואר', '#DCFCE7', '#166534']] as [string, string, string][]).map(([l, bg, col]) => (
          <div key={l} className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm border" style={{ background: bg, borderColor: col }} /><span style={{ color: col }}>{l}</span></div>
        ))}
      </div>
    </div>
  )
}

function SentenceBuilderViz() {
  const blocks = [{ t: 'הילד', l: 'נושא', bg: '#FEF9C3', b: '#EAB308', c: '#713F12' }, { t: 'אוכל', l: 'פועל', bg: '#FED7AA', b: '#F97316', c: '#7C2D12' }, { t: 'תפוח', l: 'מושא', bg: '#BFDBFE', b: '#3B82F6', c: '#1E3A8A' }]
  return (
    <div className="p-3 flex gap-2 justify-center" dir="rtl">
      {blocks.map(w => (
        <div key={w.t} className="text-center">
          <div className="px-3 py-2 rounded-lg text-sm font-bold border-2 mb-1" style={{ background: w.bg, borderColor: w.b, color: w.c }}>{w.t}</div>
          <div className="text-xs font-medium" style={{ color: w.c }}>{w.l}</div>
        </div>
      ))}
    </div>
  )
}

function WordFamilyViz() {
  const words = ['כותב', 'כתיבה', 'מכתב', 'כתבן', 'כתוב', 'התכתב']
  const colors = [C.blue, C.green, C.orange, C.purple, C.teal, C.red]
  const angles = [-120, -72, -24, 24, 72, 120]
  return (
    <svg viewBox="0 0 280 240" className="w-full max-w-[300px] mx-auto block">
      <rect x="110" y="8" width="60" height="26" rx="8" fill={C.red.fill} stroke={C.red.stroke} strokeWidth="2" />
      <text x="140" y="25" textAnchor="middle" fontSize="13" fontWeight="800" fill={C.red.text}>כ-ת-ב</text>
      {words.map((word, i) => {
        const a = (angles[i] * Math.PI) / 180, bx = 140 + 100 * Math.sin(a), by = 120 + 90 * -Math.cos(a), c = colors[i]
        return <g key={word}><line x1="140" y1="34" x2={bx} y2={by - 12} stroke={c.stroke} strokeWidth="1" strokeDasharray="3,2" /><rect x={bx - 28} y={by - 14} width="56" height="26" rx="12" fill={c.fill} stroke={c.stroke} strokeWidth="1.5" /><text x={bx} y={by + 3} textAnchor="middle" fontSize="12" fontWeight="700" fill={c.text}>{word}</text></g>
      })}
    </svg>
  )
}

function WordComparisonViz() {
  const cells = [{ l: 'זכר יחיד', e: 'ילד גדול', c: C.blue }, { l: 'נקבה יחידה', e: 'ילדה גדולה', c: C.teal }, { l: 'זכר רבים', e: 'ילדים גדולים', c: C.orange }, { l: 'נקבה רבות', e: 'ילדות גדולות', c: C.purple }]
  return (
    <svg viewBox="0 0 280 158" className="w-full max-w-[300px] mx-auto block">
      {cells.map(({ l, e, c }, i) => {
        const x = 8 + (i % 2) * 136, y = 8 + Math.floor(i / 2) * 72
        return <g key={i}><rect x={x} y={y} width="128" height="62" rx="8" fill={c.fill} stroke={c.stroke} strokeWidth="1.5" /><text x={x + 64} y={y + 18} textAnchor="middle" fontSize="10" fontWeight="600" fill={c.text}>{l}</text><text x={x + 64} y={y + 40} textAnchor="middle" fontSize="13" fontWeight="700" fill={c.text}>{e}</text></g>
      })}
    </svg>
  )
}

function AreaModelViz({ description, problem }: { description: string; problem?: string }) {
  const src = problem || description
  const fracs = [...src.matchAll(/(\d+)\/(\d+)/g)].map(m => ({ n: parseInt(m[1]), d: parseInt(m[2]) }))
  // Handle "fraction × whole number" like "1/2 × 3"
  const wholeMatch = src.match(/×\s*(\d+)$/) || src.match(/(\d+)\s*×/)
  const f1 = fracs[0] ?? { n: 1, d: 2 }
  const f2 = fracs[1] ?? (wholeMatch ? { n: parseInt(wholeMatch[1]), d: 1 } : { n: 3, d: 4 })
  const rows = f1.n, totalRows = f1.d
  const cols = f2.n, totalCols = Math.max(f2.d, 1)
  const product = totalCols === 1
    ? `${rows * cols}/${totalRows}`  // fraction × whole
    : `${rows * cols}/${totalRows * totalCols}`
  const cw = 160 / Math.max(totalCols, cols), ch = 100 / Math.max(totalRows, rows)

  const Frac = ({ n, d, x, y, color }: { n: number; d: number; x: number; y: number; color: string }) => (
    <g>
      <text x={x} y={y - 4} textAnchor="middle" fontSize="10" fontWeight="700" fill={color}>{n}</text>
      <line x1={x - 6} y1={y} x2={x + 6} y2={y} stroke={color} strokeWidth="1" />
      <text x={x} y={y + 11} textAnchor="middle" fontSize="10" fontWeight="700" fill={color}>{d === 1 ? '1' : d}</text>
    </g>
  )

  return (
    <svg viewBox="0 0 240 180" className="w-full max-w-[260px] mx-auto block">
      <Frac n={f1.n} d={f1.d} x={210} y={20 + (rows * ch) / 2} color={C.blue.text} />
      {f2.d > 1 && <Frac n={f2.n} d={f2.d} x={30 + (cols * cw) / 2} y={165} color={C.orange.text} />}
      {totalCols === 1
        // Fraction × whole: show f2.n rectangles, top f1.n rows shaded
        ? Array.from({ length: cols }, (_, c) =>
            Array.from({ length: Math.max(totalRows, 4) }, (_, r) => (
              <rect key={`${r}-${c}`} x={30 + c * 50} y={10 + r * 28} width={44} height={26} rx="4"
                fill={r < rows ? C.teal.fill : '#f0f0f0'} stroke={r < rows ? C.teal.stroke : '#ddd'} strokeWidth="1" />
            ))
          )
        // Fraction × fraction: grid overlap
        : Array.from({ length: totalRows }, (_, r) => Array.from({ length: totalCols }, (_, c) => {
            const ov = r < rows && c < cols
            return <rect key={`${r}-${c}`} x={30 + c * cw} y={10 + r * ch} width={cw - 1} height={ch - 1} rx="2"
              fill={ov ? '#9FE1CB' : r < rows ? C.blue.fill : c < cols ? C.orange.fill : '#f8f8f8'}
              stroke={ov ? C.teal.stroke : '#ddd'} strokeWidth="1" />
          }))
      }
      <text x="30" y="178" fontSize="11" fontWeight="700" fill={C.teal.text}>= {product}</text>
    </svg>
  )
}

function PassageViz() {
  return (
    <div className="p-3 text-sm space-y-2" dir="rtl">
      <div className="p-2 rounded-lg border-2 border-blue-200 bg-blue-50 text-blue-900 font-medium text-xs">
        <span className="bg-blue-200 text-blue-800 px-2 py-0.5 rounded ml-1 text-xs">רעיון מרכזי</span>
        הדבורים חשובות מאוד לטבע.
      </div>
      {['הן מעבירות אבקה מפרח לפרח.', 'הדבורים מייצרות דבש בכוורת.', 'בלי דבורים, פירות לא יצמחו.'].map((s, i) => (
        <div key={i} className="flex items-start gap-2">
          <span className="bg-green-100 text-green-800 text-xs font-bold px-1.5 py-0.5 rounded shrink-0">{i + 1}</span>
          <div className="border-b-2 border-green-400 pb-0.5 text-gray-700 text-xs">{s}</div>
        </div>
      ))}
    </div>
  )
}

function DialogueViz({ description }: { description: string }) {
  const lines = description.match(/"([^"]+)"/g)?.slice(0, 4) || ['"Hello! What\'s your name?"', '"My name is Maya!"']
  return (
    <div className="p-3 space-y-2">
      {lines.map((line, i) => (
        <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
          <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-xs font-medium ${i % 2 === 0 ? 'bg-blue-100 text-blue-900' : 'bg-green-100 text-green-900'}`}>{line.replace(/"/g, '')}</div>
        </div>
      ))}
    </div>
  )
}

function FillInViz({ description }: { description: string }) {
  const m = description.match(/"([^"]+)"/)
  const sentence = m?.[1] || 'He ___ soccer every Sunday.'
  const choices = ['play', 'plays', 'playing']
  return (
    <div className="p-3 space-y-2">
      <div className="text-sm font-medium text-gray-800 bg-gray-50 rounded-lg p-2">
        {sentence.split('___').map((part, i, arr) => (
          <span key={i}>{part}{i < arr.length - 1 && <span className="mx-1 px-2 bg-yellow-100 border-b-2 border-yellow-400 text-yellow-800 rounded font-bold">___</span>}</span>
        ))}
      </div>
      <div className="flex gap-2">
        {choices.map((c, i) => <div key={c} className={`px-3 py-1 rounded-lg text-xs font-medium border ${i === 1 ? 'bg-green-100 border-green-400 text-green-800' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>{i === 1 ? '✓ ' : ''}{c}</div>)}
      </div>
    </div>
  )
}

function ErrorCorrectionViz({ description }: { description: string }) {
  const wm = description.match(/wrong.*?:\s*"([^"]+)"/i)
  const cm = description.match(/correct.*?:\s*"([^"]+)"/i)
  const wrong = wm?.[1] || 'She doesnt plays tennis.'
  const correct = cm?.[1] || 'She doesnt play tennis.'
  return (
    <div className="p-3 space-y-2">
      <div className="p-2 bg-red-50 border border-red-200 rounded-lg text-xs flex items-center gap-2"><span className="bg-red-200 text-red-800 px-1.5 py-0.5 rounded font-bold shrink-0">✗</span><span className="line-through text-red-700">{wrong}</span></div>
      <div className="p-2 bg-green-50 border border-green-200 rounded-lg text-xs flex items-center gap-2"><span className="bg-green-200 text-green-800 px-1.5 py-0.5 rounded font-bold shrink-0">✓</span><span className="text-green-800 font-semibold">{correct}</span></div>
    </div>
  )
}

function ComparisonViz({ description }: { description: string }) {
  if (/prime|composite/i.test(description)) {
    return (
      <svg viewBox="0 0 280 125" className="w-full max-w-[300px] mx-auto block">
        <rect x="8" y="8" width="118" height="22" rx="5" fill={C.green.fill} stroke={C.green.stroke} strokeWidth="1.5" />
        <text x="67" y="23" textAnchor="middle" fontSize="11" fontWeight="700" fill={C.green.text}>Prime</text>
        {[7, 11, 13].map((n, i) => (<g key={n}><rect x="18" y={34 + i * 27} width="98" height="23" rx="4" fill={C.green.fill} stroke={C.green.stroke} strokeWidth="1" /><text x="67" y={49 + i * 27} textAnchor="middle" fontSize="11" fontWeight="700" fill={C.green.text}>{n} = 1×{n}</text></g>))}
        <rect x="150" y="8" width="122" height="22" rx="5" fill={C.orange.fill} stroke={C.orange.stroke} strokeWidth="1.5" />
        <text x="211" y="23" textAnchor="middle" fontSize="11" fontWeight="700" fill={C.orange.text}>Composite</text>
        {([[4, '2×2'], [6, '2×3'], [12, '3×4']] as [number, string][]).map(([n, f], i) => (<g key={n}><rect x="160" y={34 + i * 27} width="104" height="23" rx="4" fill={C.orange.fill} stroke={C.orange.stroke} strokeWidth="1" /><text x="212" y={49 + i * 27} textAnchor="middle" fontSize="11" fontWeight="700" fill={C.orange.text}>{n} = {f}</text></g>))}
      </svg>
    )
  }
  const nums = description.match(/\d+/g)?.map(Number).filter((n): n is number => n > 0 && n < 1000).slice(0, 2) || [150, 100]
  const mx = Math.max(...nums)
  return (
    <svg viewBox="0 0 260 100" className="w-full max-w-[280px] mx-auto block">
      {nums.map((n, i) => { const w = (n / mx) * 190, c = i === 0 ? C.blue : C.orange; return <g key={i}><rect x="40" y={18 + i * 40} width={w} height="30" rx="6" fill={c.fill} stroke={c.stroke} strokeWidth="2" /><text x="30" y={37 + i * 40} textAnchor="end" fontSize="12" fontWeight="600" fill={c.text}>{n}</text></g> })}
    </svg>
  )
}

function VisualBlock({ visual, problem }: { visual: Visual; problem?: string }) {
  const render = () => {
    switch (visual.type) {
      case 'fraction_pizza':         return <FractionPizza description={visual.description} problem={problem} />
      case 'long_multiplication':    return <LongMultViz description={visual.description} />
      case 'place_value_table':      return <PlaceValueViz description={visual.description} />
      case 'number_line':            return <NumberLineViz description={visual.description} />
      case 'bar_model':              return <BarModelViz description={visual.description} />
      case 'shape':                  return <ShapeViz description={visual.description} problem={problem} />
      case 'grammar_table':          return <GrammarTableViz description={visual.description} />
      case 'verb_conjugation_table': return <VerbTableViz />
      case 'highlighted_text':       return <HighlightedTextViz description={visual.description} />
      case 'sentence_builder':       return <SentenceBuilderViz />
      case 'word_family_tree':       return <WordFamilyViz />
      case 'word_comparison':        return <WordComparisonViz />
      case 'area_model':             return <AreaModelViz description={visual.description} problem={problem} />
      case 'passage_annotation':     return <PassageViz />
      case 'dialogue_builder':       return <DialogueViz description={visual.description} />
      case 'fill_in_frame':          return <FillInViz description={visual.description} />
      case 'error_correction':       return <ErrorCorrectionViz description={visual.description} />
      case 'comparison':             return <ComparisonViz description={visual.description} />
      default: return <div className="text-xs text-gray-400 italic p-2">{visual.description}</div>
    }
  }
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100">
        <span className="text-xs text-gray-400">{visual.type.replace(/_/g, ' ')}</span>
      </div>
      <div className="p-3">
        {render()}
        {(visual.steps ?? []).length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
            {(visual.steps ?? []).map((step: string, i: number) => (
              <div key={i} className="flex gap-2 text-xs text-gray-500"><span className="text-emerald-600 font-semibold shrink-0">{i + 1}</span><span>{step}</span></div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Topic Card (inlined) ───────────────────────────────────────
const SUBJ: Record<string, { bg: string; text: string; label: string }> = {
  math:    { bg: 'bg-blue-100',   text: 'text-blue-800',   label: 'Math' },
  hebrew:  { bg: 'bg-green-100',  text: 'text-green-800',  label: 'עברית' },
  english: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'English' },
}

function TopicCard({ topic, index, lang }: { topic: TopicExplanation; index: number; lang: 'en' | 'he' | 'both' }) {
  const subj = SUBJ[topic.subject] ?? SUBJ.math
  const en = lang === 'en' || lang === 'both'
  const he = lang === 'he' || lang === 'both'
  const heOnly = lang === 'he'
  const dir = heOnly ? 'rtl' : 'ltr'
  const kpLabel = heOnly ? 'נקודות מפתח' : 'Key points'
  const visualLabel = heOnly ? 'הסבר ויזואלי' : 'Visual explanation'
  const exLabel = heOnly ? 'דוגמאות פתורות' : 'Worked examples'
  const exWord = heOnly ? 'דוגמה' : 'Example'
  const answerLabel = heOnly ? 'תשובה' : 'Answer'

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm" style={{ pageBreakInside: 'avoid' }} dir={dir}>
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
        <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-sm shrink-0">{index}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-bold text-gray-900">{heOnly ? topic.title_he : topic.title_en}</h2>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${subj.bg} ${subj.text}`}>{subj.label}</span>
            <span className="text-xs text-gray-400">כיתה {topic.grade}</span>
          </div>
          {!heOnly && topic.title_he && <div className="text-xs text-gray-500 mt-0.5" dir="rtl">{topic.title_he}</div>}
        </div>
      </div>
      <div className="px-6 py-5 space-y-4">
        <div className="bg-gray-50 rounded-xl p-4 space-y-2">
          {en && <p className="text-sm text-gray-700 leading-relaxed" dir="ltr">{topic.summary_en}</p>}
          {en && he && topic.summary_he && <hr className="border-gray-200" />}
          {he && topic.summary_he && <p className="text-sm text-gray-600 leading-relaxed" dir="rtl">{topic.summary_he}</p>}
        </div>
        {topic.key_points_en?.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{kpLabel}</p>
            <div className="space-y-1.5">
              {topic.key_points_en.map((kp: string, i: number) => (
                <div key={i} className="flex gap-2 items-start">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <div className="flex-1">
                    {en && <div className="text-sm text-gray-700" dir="ltr">{kp}</div>}
                    {he && topic.key_points_he?.[i] && <div className={`${heOnly ? 'text-sm text-gray-700' : 'text-xs text-gray-500'}`} dir="rtl">{topic.key_points_he[i]}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {topic.main_visual && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{visualLabel}</p>
            <VisualBlock visual={topic.main_visual} />
          </div>
        )}
        {topic.examples?.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{exLabel}</p>
            <div className="space-y-3">
              {topic.examples.map((ex: Example, i: number) => (
                <div key={i} className="border border-gray-100 rounded-xl overflow-hidden">
                  <div className={`flex items-center gap-2 px-4 py-2 bg-gray-50 border-b border-gray-100 ${heOnly ? 'flex-row-reverse' : ''}`}>
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0">{exWord} {i + 1}</span>
                    <span className="text-sm font-semibold text-gray-800" dir={heOnly ? 'rtl' : 'ltr'}>{heOnly ? ex.problem_he : ex.problem_en}</span>
                  </div>
                  <div className="px-4 py-3 space-y-3">
                    {he && ex.problem_he && en && <div className="text-xs text-gray-500" dir="rtl">{ex.problem_he}</div>}
                    {ex.visual && <VisualBlock visual={ex.visual} problem={ex.problem_en} />}
                    {/* EN steps */}
                    {en && (
                      <div className="space-y-1" dir="ltr">
                        {ex.solution_steps_en.map((step: string, j: number) => (
                          <div key={j} className="flex gap-2 text-sm text-gray-600"><span className="text-emerald-600 font-semibold shrink-0">{j + 1}</span><span>{step}</span></div>
                        ))}
                      </div>
                    )}
                    {/* HE steps */}
                    {he && ex.solution_steps_he?.length > 0 && (
                      <div className="space-y-1" dir="rtl">
                        {ex.solution_steps_he.map((step: string, j: number) => (
                          <div key={j} className={`flex gap-2 ${heOnly ? 'text-sm text-gray-600' : 'text-xs text-gray-500'}`}>
                            <span className="text-emerald-500 font-semibold shrink-0">{j + 1}</span><span>{step}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className={`flex items-center ${heOnly ? 'flex-row-reverse' : ''} justify-between bg-emerald-50 rounded-lg px-3 py-2`}>
                      <span className="text-sm font-bold text-emerald-800" dir={heOnly ? 'rtl' : 'ltr'}>{answerLabel}: {heOnly ? ex.answer_he : ex.answer_en}</span>
                      {en && he && ex.answer_he && ex.answer_he !== ex.answer_en && <span className="text-xs text-emerald-600" dir="rtl">{ex.answer_he}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Sidebar colours ────────────────────────────────────────────
const SC = {
  math:    { dot: 'bg-blue-400',   label: 'Math' },
  hebrew:  { dot: 'bg-green-400',  label: 'עברית' },
  english: { dot: 'bg-orange-400', label: 'English' },
}

// ── Fun facts for page footers ─────────────────────────────────
const FUN_FACTS = [
  { en: "A group of flamingos is called a 'flamboyance'.", he: "להקת פלמינגו נקראת 'flamboyance'." },
  { en: "Honey never spoils — archaeologists found 3,000-year-old honey in Egyptian tombs.", he: "דבש לעולם לא מתקלקל — מצאו דבש בן 3,000 שנה בקברות מצרים." },
  { en: "Octopuses have three hearts. Two pump blood to the gills, one to the body.", he: "לתמנון שלושה לבבות. שניים מזרימים דם לזימות, אחד לגוף." },
  { en: "A day on Venus is longer than a year on Venus.", he: "יום אחד בנוגה ארוך יותר משנה שלמה בנוגה." },
  { en: "Cows have best friends and get stressed when separated from them.", he: "לפרות יש חברים הכי טובים, והן מתוחות כשמפרידים ביניהן." },
  { en: "The shortest war in history lasted only 38 minutes.", he: "המלחמה הקצרה ביותר בהיסטוריה נמשכה רק 38 דקות." },
  { en: "Bananas are berries, but strawberries are not.", he: "בננות הן פירות יער, אבל תותים — לא." },
  { en: "A bolt of lightning is five times hotter than the surface of the sun.", he: "ברק חם פי חמישה מפני השמש." },
  { en: "Wombats produce cube-shaped droppings — the only animals that do.", he: "ווומבטים מייצרים גללים בצורת קוביות — היחידים בעולם." },
  { en: "There are more possible chess games than atoms in the observable universe.", he: "יש יותר משחקי שחמט אפשריים מאטומים ביקום הנצפה." },
  { en: "Otters hold hands while sleeping so they don't drift apart.", he: "לוטרות אוחזות ידיים בזמן שינה כדי לא להתפרד." },
  { en: "The Eiffel Tower grows 15 cm taller in summer due to heat expansion.", he: "מגדל אייפל גדל ב-15 ס\"מ בקיץ בגלל התפשטות חום." },
  { en: "Sharks are older than trees — they've existed for over 450 million years.", he: "כרישים עתיקים מעצים — הם קיימים מעל 450 מיליון שנה." },
  { en: "A snail can sleep for up to 3 years.", he: "חילזון יכול לישון עד 3 שנים." },
  { en: "The average person walks the equivalent of 5 times around the Earth in a lifetime.", he: "אדם ממוצע הולך שווה ערך ל-5 סיבובים סביב כדור הארץ בחייו." },
]

function getFactsForBooklet(count: number): typeof FUN_FACTS {
  const key = 'eduplay_facts_index'
  let idx = 0
  try { idx = parseInt(localStorage.getItem(key) || '0') || 0 } catch {}
  const result = Array.from({ length: count }, (_, i) => FUN_FACTS[(idx + i) % FUN_FACTS.length])
  try { localStorage.setItem(key, String((idx + count) % FUN_FACTS.length)) } catch {}
  return result
}


export default function BookletClient({ topics: initialTopics }: { topics: TopicMeta[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [filterSubj, setFilterSubj] = useState('')
  const [filterGrade, setFilterGrade] = useState('')
  const [lang, setLang] = useState<'en' | 'he' | 'both'>('both')
  const [loaded, setLoaded] = useState<TopicExplanation[]>([])
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState<'select' | 'preview'>('select')
  const [topics, setTopics] = useState<TopicMeta[]>(initialTopics)

  useEffect(() => {
    fetch('/api/explanations')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setTopics(data as TopicMeta[]) })
  }, [])

  const supabase = createBrowserClient()

  const filtered = useMemo(() =>
    topics.filter(t => (!filterSubj || t.subject === filterSubj) && (!filterGrade || String(t.grade) === filterGrade)),
    [topics, filterSubj, filterGrade]
  )

  const grouped = useMemo(() => {
    const g: Record<string, TopicMeta[]> = {}
    filtered.forEach(t => { if (!g[t.subject]) g[t.subject] = []; g[t.subject].push(t) })
    return g
  }, [filtered])

  const toggle = (slug: string) => setSelected(prev => { const n = new Set(prev); n.has(slug) ? n.delete(slug) : n.add(slug); return n })
  const selectAll = () => setSelected(new Set(filtered.map(t => t.topic_slug)))

  const [facts, setFacts] = useState<typeof FUN_FACTS>([])

  const build = async () => {
    if (!selected.size) return
    setLoading(true)
    const { data } = await supabase.from('topic_explanations').select('*').in('topic_slug', Array.from(selected)).order('subject').order('grade').order('title_en')
    const result = (data as TopicExplanation[]) || []
    setLoaded(result)
    setFacts(getFactsForBooklet(result.length))
    setLoading(false)
    setView('preview')
  }

  return (
    <div className="flex h-screen bg-gray-50 font-[Nunito]">
      {/* Sidebar */}
      <div className="w-72 shrink-0 bg-white border-r border-gray-100 flex flex-col overflow-hidden print:hidden">
        <div className="px-5 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-white font-black text-sm">E</div>
            <div><div className="text-sm font-bold text-gray-800">EduPlay</div><div className="text-xs text-gray-400">Booklet Builder</div></div>
          </div>
          <div className="space-y-2">
            <select value={filterSubj} onChange={e => setFilterSubj(e.target.value)} className="w-full text-xs px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-300">
              <option value="">All subjects</option>
              <option value="math">Math</option>
              <option value="hebrew">Hebrew עברית</option>
              <option value="english">English</option>
            </select>
            <select value={filterGrade} onChange={e => setFilterGrade(e.target.value)} className="w-full text-xs px-3 py-2 rounded-lg border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-300">
              <option value="">All grades</option>
              {[1,2,3,4,5,6].map(g => <option key={g} value={g}>Grade {g}</option>)}
            </select>
            <div className="flex gap-2">
              <button onClick={selectAll} className="flex-1 text-xs py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 font-semibold">Select all</button>
              <button onClick={() => setSelected(new Set())} className="flex-1 text-xs py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 font-semibold">Clear</button>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {filtered.length === 0
            ? <div className="text-xs text-gray-400 text-center py-8">No topics match</div>
            : Object.entries(grouped).map(([subj, ts]) => {
                const sc = SC[subj as keyof typeof SC]
                return (
                  <div key={subj} className="mb-2">
                    <div className="flex items-center gap-2 px-4 py-1.5">
                      <span className={`w-2 h-2 rounded-full ${sc?.dot}`} />
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{sc?.label}</span>
                    </div>
                    {ts.map(t => (
                      <button key={t.topic_slug} onClick={() => toggle(t.topic_slug)} className={`w-full flex items-center gap-2.5 px-4 py-2 text-left hover:bg-gray-50 ${selected.has(t.topic_slug) ? 'bg-emerald-50' : ''}`}>
                        <span className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${selected.has(t.topic_slug) ? 'bg-emerald-500 border-emerald-500 text-white text-xs' : 'border-gray-300'}`}>{selected.has(t.topic_slug) ? '✓' : ''}</span>
                        <div className="flex-1 min-w-0"><div className="text-xs font-semibold text-gray-700 truncate">{t.title_en}</div><div className="text-xs text-gray-400">Grade {t.grade}</div></div>
                      </button>
                    ))}
                  </div>
                )
              })
          }
        </div>
        <div className="px-4 py-4 border-t border-gray-100 space-y-2">
          <button onClick={build} disabled={selected.size === 0 || loading} className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold text-sm rounded-xl transition-colors">
            {loading ? 'Loading…' : `Generate booklet${selected.size > 0 ? ` (${selected.size})` : ''}`}
          </button>
          <p className="text-xs text-gray-400 text-center">{selected.size === 0 ? 'Select topics to continue' : `${selected.size} topic${selected.size > 1 ? 's' : ''} selected`}</p>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 overflow-y-auto">
        {view === 'select'
          ? <div className="flex items-center justify-center h-full"><div className="text-center space-y-3 max-w-sm px-6"><div className="text-5xl">📖</div><h2 className="text-xl font-bold text-gray-800">Build your study booklet</h2><p className="text-sm text-gray-500 leading-relaxed">Filter by subject and grade, select the topics you want, then click Generate booklet. Download as PDF for printing.</p></div></div>
          : (
            <div className="max-w-3xl mx-auto px-6 py-6">
              {/* Toolbar — hidden on print */}
              <div className="print:hidden space-y-3 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-xl font-black text-gray-900">Study Booklet</h1>
                    <p className="text-sm text-gray-500">{loaded.length} topic{loaded.length !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Language toggle */}
                    <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                      {(['en', 'he', 'both'] as const).map(l => (
                        <button key={l} onClick={() => setLang(l)} className={`px-3 py-1.5 text-xs font-semibold ${lang === l ? 'bg-emerald-500 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>{l === 'en' ? 'EN' : l === 'he' ? 'עב' : 'Both'}</button>
                      ))}
                    </div>
                    <button onClick={() => setView('select')} className="px-3 py-1.5 text-xs font-semibold text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50">← Edit topics</button>
                    <button onClick={() => window.print()} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-sm font-semibold text-white shadow-sm transition-colors">⬇ Download PDF</button>
                  </div>
                </div>

                {/* Selected topics chips */}
                <div className="bg-white border border-gray-100 rounded-xl p-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Topics in booklet</p>
                  <div className="flex flex-wrap gap-2">
                    {loaded.map(t => (
                      <div key={t.topic_slug} className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-full px-3 py-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${SC[t.subject as keyof typeof SC]?.dot ?? 'bg-gray-400'}`} />
                        <span className="text-xs font-medium text-gray-700">{t.title_en}</span>
                        <button
                          onClick={() => {
                            setLoaded(prev => prev.filter(x => x.topic_slug !== t.topic_slug))
                            setSelected(prev => { const n = new Set(prev); n.delete(t.topic_slug); return n })
                          }}
                          className="text-gray-400 hover:text-red-500 font-bold text-xs leading-none ml-0.5"
                        >×</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── COVER PAGE (print only) ── */}
              <div className="hidden print:flex flex-col items-center justify-center text-center" style={{ height: '100vh', pageBreakAfter: 'always' }}>
                {/* Big logo */}
                <div className="w-28 h-28 rounded-3xl bg-emerald-500 flex items-center justify-center mb-6 shadow-lg">
                  <span className="text-white font-black" style={{ fontSize: 64 }}>E</span>
                </div>
                <div className="text-6xl font-black text-gray-900 mb-2">EduPlay</div>
                <div className="text-xl text-gray-500 mb-12">Study Booklet</div>

                {/* Topic list */}
                <div className="border-t-2 border-emerald-400 pt-8 w-80">
                  <div className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Topics included</div>
                  <div className="space-y-2">
                    {loaded.map((t, i) => (
                      <div key={t.topic_slug} className="flex items-center gap-3 text-left">
                        <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                        <span className="text-sm text-gray-700 font-medium">{t.title_en}</span>
                        {t.title_he && <span className="text-xs text-gray-400 mr-auto" dir="rtl">{t.title_he}</span>}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-16 text-xs text-gray-300">eduplay.co.il</div>
              </div>

              {/* Topic cards — each on its own page */}
              <div>
                {loaded.map((t, i) => {
                  const fact = facts[i] ?? FUN_FACTS[i % FUN_FACTS.length]
                  return (
                    <div key={t.topic_slug} style={{ pageBreakBefore: 'always' }}>
                      <TopicCard topic={t} index={i + 1} lang={lang} />

                      {/* Footer: fact on left, page number on right */}
                      <div className="hidden print:flex items-start justify-between mt-6 pt-3" style={{ borderTop: '1px solid #d1fae5' }}>
                        <div className="flex-1 pr-4">
                          <p className="text-xs text-gray-500 italic leading-relaxed">{fact.en}</p>
                          {fact.he && <p className="text-xs text-gray-400 italic mt-0.5" dir="rtl">{fact.he}</p>}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-xs font-black text-emerald-600">E</span>
                          <span className="text-xs text-gray-400">{i + 1} / {loaded.length}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        }
      </div>
    </div>
  )
}