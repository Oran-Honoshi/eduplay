'use client'
import React from 'react'

// ─────────────────────────────────────────────────────────────
//  MathVisual — renders inline SVG diagrams for math questions
//  Supports 2D shapes, 3D bodies, number lines, grids, etc.
// ─────────────────────────────────────────────────────────────

interface MathVisualProps {
  data: any          // visual_data JSON from questions table
  size?: number      // base size in px (default 220)
  color?: string     // primary accent color
  dark?: boolean     // dark mode (for Minecraft theme)
}

const DEFAULT_SIZE = 220

export default function MathVisual({ data, size = DEFAULT_SIZE, color = '#4A7FD4', dark = false }: MathVisualProps) {
  if (!data?.type) return null

  const stroke    = dark ? '#F5F5DC' : '#1E2D4E'
  const fill      = dark ? 'rgba(93,158,47,0.18)' : `${color}18`
  const highlight = dark ? '#FFD700' : color
  const label     = dark ? '#FFD700' : '#1E2D4E'
  const bg        = 'none'
  const W         = size
  const H         = size

  switch (data.type) {

    // ── FRACTION BAR ─────────────────────────────────────────
    case 'fraction': {
      const total  = data.d || 4
      const filled = data.n || 1
      const bw     = Math.min(40, (W - 40) / total)
      const bh     = 36
      const startX = (W - total * bw) / 2
      const y      = H / 2 - bh / 2
      return (
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
          {Array.from({ length: total }).map((_, i) => (
            <rect key={i}
              x={startX + i * bw} y={y}
              width={bw - 2} height={bh}
              fill={i < filled ? highlight : (dark ? '#333' : '#F0F4FF')}
              stroke={stroke} strokeWidth={1.5} rx={3}/>
          ))}
          <text x={W/2} y={y + bh + 22} textAnchor="middle" fontSize={14} fill={label} fontFamily="Georgia,serif" fontWeight="bold">
            {filled}/{total}
          </text>
        </svg>
      )
    }

    // ── FRACTION PIE ─────────────────────────────────────────
    case 'fraction_pie': {
      const total  = data.d || 4
      const filled = data.n || 1
      const cx = W / 2, cy = H / 2 - 10, r = Math.min(W, H) * 0.33
      const slices = Array.from({ length: total }).map((_, i) => {
        const startAngle = (i / total) * 2 * Math.PI - Math.PI / 2
        const endAngle   = ((i + 1) / total) * 2 * Math.PI - Math.PI / 2
        const x1 = cx + r * Math.cos(startAngle)
        const y1 = cy + r * Math.sin(startAngle)
        const x2 = cx + r * Math.cos(endAngle)
        const y2 = cy + r * Math.sin(endAngle)
        const large = (endAngle - startAngle) > Math.PI ? 1 : 0
        return { path:`M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2} Z`, filled: i < filled }
      })
      return (
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
          {slices.map((s, i) => (
            <path key={i} d={s.path} fill={s.filled ? highlight : (dark ? '#333' : '#F0F4FF')} stroke={stroke} strokeWidth={1.5}/>
          ))}
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={stroke} strokeWidth={2}/>
          <text x={W/2} y={cy + r + 24} textAnchor="middle" fontSize={14} fill={label} fontFamily="Georgia,serif" fontWeight="bold">
            {filled}/{total}
          </text>
        </svg>
      )
    }

    // ── TRIANGLE ─────────────────────────────────────────────
    case 'triangle': {
      const pad = 30
      // Points: bottom-left, bottom-right, top
      const kind = data.kind || 'scalene' // scalene | right | isosceles | equilateral
      let pts: [number,number][]
      if (kind === 'right') {
        pts = [[pad, H - pad], [W - pad, H - pad], [pad, pad + 20]]
      } else if (kind === 'isosceles' || kind === 'equilateral') {
        pts = [[pad, H - pad], [W - pad, H - pad], [W / 2, pad + 10]]
      } else {
        pts = [[pad + 10, H - pad], [W - pad, H - pad], [pad + W * 0.3, pad + 20]]
      }
      const [A, B, C] = pts
      const poly = pts.map(p => p.join(',')).join(' ')

      // Side labels
      const sides: string[] = data.sides || []
      const midAB = [(A[0]+B[0])/2, (A[1]+B[1])/2]
      const midBC = [(B[0]+C[0])/2, (B[1]+C[1])/2]
      const midCA = [(C[0]+A[0])/2, (C[1]+A[1])/2]

      // Angle arcs
      const showAngles: number[] = data.angles || []

      // Highlight
      const hl = data.highlight || ''

      return (
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
          {/* Right angle mark */}
          {kind === 'right' && (
            <path d={`M${A[0]+14},${A[1]} L${A[0]+14},${A[1]-14} L${A[0]},${A[1]-14}`}
              fill="none" stroke={stroke} strokeWidth={1.5}/>
          )}
          {/* Triangle fill */}
          <polygon points={poly}
            fill={hl === 'area' ? `${highlight}30` : fill}
            stroke={stroke} strokeWidth={2.5}/>
          {/* Highlight specific side */}
          {hl === 'base' && <line x1={A[0]} y1={A[1]} x2={B[0]} y2={B[1]} stroke={highlight} strokeWidth={4}/>}
          {hl === 'height' && (
            <line x1={W/2} y1={C[1]} x2={W/2} y2={A[1]} stroke={highlight} strokeWidth={2} strokeDasharray="5,4"/>
          )}
          {hl === 'hypotenuse' && <line x1={B[0]} y1={B[1]} x2={C[0]} y2={C[1]} stroke={highlight} strokeWidth={4}/>}

          {/* Side labels */}
          {sides[0] && <text x={midAB[0]} y={midAB[1]+16} textAnchor="middle" fontSize={13} fill={label} fontWeight="bold" fontFamily="Georgia,serif">{sides[0]}</text>}
          {sides[1] && <text x={midBC[0]+14} y={midBC[1]} textAnchor="middle" fontSize={13} fill={label} fontWeight="bold" fontFamily="Georgia,serif">{sides[1]}</text>}
          {sides[2] && <text x={midCA[0]-14} y={midCA[1]} textAnchor="middle" fontSize={13} fill={label} fontWeight="bold" fontFamily="Georgia,serif">{sides[2]}</text>}

          {/* Angle labels */}
          {showAngles[0] && <text x={A[0]+10} y={A[1]-8} fontSize={11} fill={highlight} fontFamily="Georgia,serif">{showAngles[0]}°</text>}
          {showAngles[1] && <text x={B[0]-28} y={B[1]-8} fontSize={11} fill={highlight} fontFamily="Georgia,serif">{showAngles[1]}°</text>}
          {showAngles[2] && <text x={C[0]-10} y={C[1]+16} fontSize={11} fill={highlight} fontFamily="Georgia,serif">{showAngles[2]}°</text>}

          {/* Height label */}
          {data.height && (
            <>
              <line x1={W/2} y1={C[1]} x2={W/2} y2={A[1]} stroke={highlight} strokeWidth={1.5} strokeDasharray="5,4"/>
              <text x={W/2+8} y={(C[1]+A[1])/2} fontSize={12} fill={highlight} fontFamily="Georgia,serif">{data.height}</text>
            </>
          )}
        </svg>
      )
    }

    // ── RECTANGLE / SQUARE ───────────────────────────────────
    case 'rectangle':
    case 'square': {
      const isSquare = data.type === 'square' || data.w === data.h
      const pad = 30
      const rw  = W - pad * 2
      const rh  = isSquare ? rw * 0.65 : H - pad * 2 - 10
      const rx  = pad
      const ry  = (H - rh) / 2

      return (
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
          <rect x={rx} y={ry} width={rw} height={rh}
            fill={data.highlight === 'area' ? `${highlight}30` : fill}
            stroke={stroke} strokeWidth={2.5} rx={2}/>
          {/* Equal marks for square */}
          {isSquare && (
            <>
              <line x1={rx+rw/2-5} y1={ry+8} x2={rx+rw/2+5} y2={ry+8} stroke={highlight} strokeWidth={2}/>
              <line x1={rx+rw/2-5} y1={ry+rh-8} x2={rx+rw/2+5} y2={ry+rh-8} stroke={highlight} strokeWidth={2}/>
              <line x1={rx+8} y1={ry+rh/2-5} x2={rx+8} y2={ry+rh/2+5} stroke={highlight} strokeWidth={2}/>
              <line x1={rx+rw-8} y1={ry+rh/2-5} x2={rx+rw-8} y2={ry+rh/2+5} stroke={highlight} strokeWidth={2}/>
            </>
          )}
          {/* Width label */}
          {data.w && (
            <>
              <line x1={rx} y1={ry+rh+12} x2={rx+rw} y2={ry+rh+12} stroke={stroke} strokeWidth={1} markerEnd="url(#arr)"/>
              <text x={rx+rw/2} y={ry+rh+26} textAnchor="middle" fontSize={13} fill={label} fontWeight="bold" fontFamily="Georgia,serif">{data.w}</text>
            </>
          )}
          {/* Height label */}
          {data.h && (
            <>
              <text x={rx+rw+12} y={ry+rh/2+5} fontSize={13} fill={label} fontWeight="bold" fontFamily="Georgia,serif">{data.h}</text>
            </>
          )}
        </svg>
      )
    }

    // ── CIRCLE ───────────────────────────────────────────────
    case 'circle': {
      const cx = W / 2, cy = H / 2 - 8
      const r  = Math.min(W, H) * 0.32

      return (
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
          <circle cx={cx} cy={cy} r={r}
            fill={data.highlight === 'area' ? `${highlight}30` : fill}
            stroke={stroke} strokeWidth={2.5}/>
          {/* Radius */}
          {data.radius && (
            <>
              <line x1={cx} y1={cy} x2={cx+r} y2={cy} stroke={highlight} strokeWidth={2}/>
              <circle cx={cx} cy={cy} r={3} fill={highlight}/>
              <text x={cx+r/2} y={cy-8} textAnchor="middle" fontSize={13} fill={highlight} fontWeight="bold" fontFamily="Georgia,serif">r = {data.radius}</text>
            </>
          )}
          {/* Diameter */}
          {data.diameter && !data.radius && (
            <>
              <line x1={cx-r} y1={cy} x2={cx+r} y2={cy} stroke={highlight} strokeWidth={2}/>
              <text x={cx} y={cy-10} textAnchor="middle" fontSize={13} fill={highlight} fontWeight="bold" fontFamily="Georgia,serif">d = {data.diameter}</text>
            </>
          )}
          {/* Center point */}
          <circle cx={cx} cy={cy} r={3} fill={stroke}/>
        </svg>
      )
    }

    // ── ANGLE ────────────────────────────────────────────────
    case 'angle': {
      const deg  = data.degrees || 90
      const cx   = W * 0.25
      const cy   = H * 0.75
      const len  = Math.min(W, H) * 0.45
      const rad  = (deg * Math.PI) / 180
      const x2   = cx + len
      const y2   = cy
      const x3   = cx + len * Math.cos(Math.PI - rad)
      const y3   = cy - len * Math.sin(Math.PI - rad)
      const arcR = len * 0.28
      const isRight = deg === 90

      return (
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
          {/* Base ray */}
          <line x1={cx} y1={cy} x2={x2} y2={y2} stroke={stroke} strokeWidth={2.5}/>
          {/* Angle ray */}
          <line x1={cx} y1={cy} x2={x3} y2={y3} stroke={stroke} strokeWidth={2.5}/>
          {/* Right angle box */}
          {isRight ? (
            <path d={`M${cx+arcR},${cy} L${cx+arcR},${cy-arcR} L${cx},${cy-arcR}`}
              fill="none" stroke={highlight} strokeWidth={2}/>
          ) : (
            <path d={`M${cx+arcR},${cy} A${arcR},${arcR} 0 0 1 ${cx+arcR*Math.cos(Math.PI-rad)},${cy-arcR*Math.sin(Math.PI-rad)}`}
              fill={`${highlight}20`} stroke={highlight} strokeWidth={2}/>
          )}
          {/* Degree label */}
          <text
            x={cx + (isRight ? arcR + 14 : arcR * 1.5 * Math.cos((Math.PI - rad) / 2) + 6)}
            y={cy - (isRight ? arcR : arcR * 1.5 * Math.sin((Math.PI - rad) / 2)) + 4}
            fontSize={14} fill={highlight} fontWeight="bold" fontFamily="Georgia,serif">
            {deg}°
          </text>
          {/* Vertex dot */}
          <circle cx={cx} cy={cy} r={3} fill={stroke}/>
        </svg>
      )
    }

    // ── NUMBER LINE ──────────────────────────────────────────
    case 'number_line': {
      const min  = data.min ?? 0
      const max  = data.max ?? 10
      const mark = data.mark ?? null
      const pad  = 28
      const y    = H / 2
      const range = max - min
      const scale = (W - pad * 2) / range

      return (
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
          {/* Line */}
          <line x1={pad} y1={y} x2={W-pad} y2={y} stroke={stroke} strokeWidth={2}/>
          {/* Arrows */}
          <polygon points={`${W-pad},${y} ${W-pad-8},${y-4} ${W-pad-8},${y+4}`} fill={stroke}/>
          {/* Ticks + labels */}
          {Array.from({ length: range + 1 }).map((_, i) => {
            const x   = pad + i * scale
            const val = min + i
            const isM = val === mark
            return (
              <g key={i}>
                <line x1={x} y1={y-8} x2={x} y2={y+8} stroke={isM ? highlight : stroke} strokeWidth={isM ? 3 : 1.5}/>
                {isM && <circle cx={x} cy={y} r={6} fill={highlight} opacity={0.3}/>}
                <text x={x} y={y+22} textAnchor="middle" fontSize={12} fill={isM ? highlight : label} fontWeight={isM?'bold':'normal'} fontFamily="Georgia,serif">{val}</text>
              </g>
            )
          })}
          {/* Highlighted segment */}
          {data.segment && (
            <line
              x1={pad + (data.segment[0] - min) * scale}
              y1={y}
              x2={pad + (data.segment[1] - min) * scale}
              y2={y}
              stroke={highlight} strokeWidth={5} opacity={0.5}/>
          )}
        </svg>
      )
    }

    // ── COORDINATE GRID ──────────────────────────────────────
    case 'grid':
    case 'coordinate': {
      const steps = data.steps || 5
      const pad   = 28
      const inner = Math.min(W, H) - pad * 2
      const step  = inner / (steps * 2)
      const cx    = W / 2
      const cy    = H / 2
      const points: [number,number][] = data.points || []

      return (
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
          {/* Grid lines */}
          {Array.from({ length: steps * 2 + 1 }).map((_, i) => {
            const pos = pad + i * step
            return (
              <g key={i}>
                <line x1={pos} y1={pad} x2={pos} y2={H-pad} stroke={dark?'#444':'#E5E7EB'} strokeWidth={1}/>
                <line x1={pad} y1={pos} x2={W-pad} y2={pos} stroke={dark?'#444':'#E5E7EB'} strokeWidth={1}/>
              </g>
            )
          })}
          {/* Axes */}
          <line x1={cx} y1={pad-4} x2={cx} y2={H-pad+4} stroke={stroke} strokeWidth={2}/>
          <line x1={pad-4} y1={cy} x2={W-pad+4} y2={cy} stroke={stroke} strokeWidth={2}/>
          {/* Axis arrows */}
          <polygon points={`${cx},${pad-4} ${cx-4},${pad+6} ${cx+4},${pad+6}`} fill={stroke}/>
          <polygon points={`${W-pad+4},${cy} ${W-pad-6},${cy-4} ${W-pad-6},${cy+4}`} fill={stroke}/>
          {/* Axis labels */}
          <text x={cx+6} y={pad+12} fontSize={11} fill={label} fontFamily="Georgia,serif">y</text>
          <text x={W-pad+6} y={cy+4} fontSize={11} fill={label} fontFamily="Georgia,serif">x</text>
          {/* Tick labels */}
          {Array.from({ length: steps * 2 + 1 }).map((_, i) => {
            const val = i - steps
            const x   = cx + val * step
            const y2  = cy + val * step
            if (val === 0) return null
            return (
              <g key={i}>
                <text x={x} y={cy+14} textAnchor="middle" fontSize={9} fill={dark?'#aaa':'#6B7280'} fontFamily="Georgia,serif">{val}</text>
                <text x={cx-12} y={cy-val*step+4} textAnchor="middle" fontSize={9} fill={dark?'#aaa':'#6B7280'} fontFamily="Georgia,serif">{val}</text>
              </g>
            )
          })}
          {/* Plotted points */}
          {points.map(([px, py], i) => {
            const svgX = cx + px * step
            const svgY = cy - py * step
            return (
              <g key={i}>
                <circle cx={svgX} cy={svgY} r={5} fill={highlight} stroke={stroke} strokeWidth={1.5}/>
                <text x={svgX+8} y={svgY-6} fontSize={11} fill={highlight} fontWeight="bold" fontFamily="Georgia,serif">({px},{py})</text>
              </g>
            )
          })}
          {/* Line between points */}
          {points.length === 2 && (
            <line
              x1={cx+points[0][0]*step} y1={cy-points[0][1]*step}
              x2={cx+points[1][0]*step} y2={cy-points[1][1]*step}
              stroke={highlight} strokeWidth={2} strokeDasharray={data.dashed?'5,4':undefined}/>
          )}
        </svg>
      )
    }

    // ── 3D CUBE ───────────────────────────────────────────────
    case 'cube': {
      const side   = data.side || null
      const s      = Math.min(W, H) * 0.38
      const offset = s * 0.38
      const x0     = (W - s - offset) / 2
      const y0     = (H - s - offset) / 2 + offset * 0.3

      // 8 corners
      const front = [[x0,y0+s],[x0+s,y0+s],[x0+s,y0],[x0,y0]] // front face
      const back  = front.map(([x,y]) => [x+offset, y-offset])  // back face (shifted)

      const frontPoly = front.map(p=>p.join(',')).join(' ')
      const topPoly   = [front[2], front[3], back[3], back[2]].map(p=>p.join(',')).join(' ')
      const rightPoly = [front[1], front[2], back[2], back[1]].map(p=>p.join(',')).join(' ')

      return (
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
          {/* Right face */}
          <polygon points={rightPoly} fill={dark?'#2a2a2a':'#E8F0FF'} stroke={stroke} strokeWidth={2}/>
          {/* Top face */}
          <polygon points={topPoly} fill={dark?'#353535':'#F0F4FF'} stroke={stroke} strokeWidth={2}/>
          {/* Front face */}
          <polygon points={frontPoly} fill={fill} stroke={stroke} strokeWidth={2}/>
          {/* Hidden edges (dashed) */}
          <line x1={back[0][0]} y1={back[0][1]} x2={back[1][0]} y2={back[1][1]} stroke={dark?'#666':stroke} strokeWidth={1} strokeDasharray="4,3" opacity={0.5}/>
          <line x1={back[0][0]} y1={back[0][1]} x2={back[3][0]} y2={back[3][1]} stroke={dark?'#666':stroke} strokeWidth={1} strokeDasharray="4,3" opacity={0.5}/>
          <line x1={back[0][0]} y1={back[0][1]} x2={front[0][0]} y2={front[0][1]} stroke={dark?'#666':stroke} strokeWidth={1} strokeDasharray="4,3" opacity={0.5}/>
          {/* Side label */}
          {side && (
            <>
              <text x={front[0][0]-14} y={(front[0][1]+front[3][1])/2+4} fontSize={12} fill={highlight} fontWeight="bold" fontFamily="Georgia,serif" textAnchor="middle">{side}</text>
              <text x={(front[0][0]+front[1][0])/2} y={front[0][1]+18} fontSize={12} fill={highlight} fontWeight="bold" fontFamily="Georgia,serif" textAnchor="middle">{side}</text>
            </>
          )}
        </svg>
      )
    }

    // ── 3D RECTANGULAR PRISM ─────────────────────────────────
    case 'cuboid':
    case 'rectangular_prism': {
      const l = data.l || null
      const w = data.w || null
      const h = data.h || null

      const rw     = Math.min(W,H) * 0.44
      const rh     = Math.min(W,H) * 0.28
      const offset = Math.min(W,H) * 0.22
      const x0     = (W - rw - offset) / 2
      const y0     = (H - rh - offset) / 2 + offset * 0.4

      const front = [[x0,y0+rh],[x0+rw,y0+rh],[x0+rw,y0],[x0,y0]]
      const back  = front.map(([x,y]: any) => [x+offset, y-offset])
      const frontPoly = front.map((p: any) => p.join(',')).join(' ')
      const topPoly   = [front[2], front[3], back[3], back[2]].map((p: any) => p.join(',')).join(' ')
      const rightPoly = [front[1], front[2], back[2], back[1]].map((p: any) => p.join(',')).join(' ')

      return (
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
          <polygon points={rightPoly} fill={dark?'#2a2a2a':'#E8F0FF'} stroke={stroke} strokeWidth={2}/>
          <polygon points={topPoly} fill={dark?'#353535':'#F0F4FF'} stroke={stroke} strokeWidth={2}/>
          <polygon points={frontPoly} fill={fill} stroke={stroke} strokeWidth={2}/>
          <line x1={back[0][0]} y1={back[0][1]} x2={back[1][0]} y2={back[1][1]} stroke={stroke} strokeWidth={1} strokeDasharray="4,3" opacity={0.4}/>
          <line x1={back[0][0]} y1={back[0][1]} x2={back[3][0]} y2={back[3][1]} stroke={stroke} strokeWidth={1} strokeDasharray="4,3" opacity={0.4}/>
          <line x1={back[0][0]} y1={back[0][1]} x2={front[0][0]} y2={front[0][1]} stroke={stroke} strokeWidth={1} strokeDasharray="4,3" opacity={0.4}/>
          {/* Labels */}
          {l && <text x={(front[0][0]+front[1][0])/2} y={front[1][1]+18} textAnchor="middle" fontSize={12} fill={highlight} fontWeight="bold" fontFamily="Georgia,serif">{l}</text>}
          {w && <text x={(back[1][0]+front[1][0])/2+10} y={(back[1][1]+front[1][1])/2+4} textAnchor="middle" fontSize={12} fill={highlight} fontWeight="bold" fontFamily="Georgia,serif">{w}</text>}
          {h && <text x={front[0][0]-16} y={(front[0][1]+front[3][1])/2+4} textAnchor="middle" fontSize={12} fill={highlight} fontWeight="bold" fontFamily="Georgia,serif">{h}</text>}
        </svg>
      )
    }

    // ── 3D CYLINDER ──────────────────────────────────────────
    case 'cylinder': {
      const cx   = W / 2
      const ch   = Math.min(W,H) * 0.44
      const cr   = Math.min(W,H) * 0.28
      const ry   = cr * 0.28  // ellipse y-radius for top/bottom
      const topY = (H - ch) / 2
      const botY = topY + ch

      return (
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
          {/* Bottom ellipse */}
          <ellipse cx={cx} cy={botY} rx={cr} ry={ry} fill={dark?'#2a2a2a':'#E8F0FF'} stroke={stroke} strokeWidth={2}/>
          {/* Body */}
          <rect x={cx-cr} y={topY} width={cr*2} height={ch} fill={fill} stroke="none"/>
          <line x1={cx-cr} y1={topY} x2={cx-cr} y2={botY} stroke={stroke} strokeWidth={2}/>
          <line x1={cx+cr} y1={topY} x2={cx+cr} y2={botY} stroke={stroke} strokeWidth={2}/>
          {/* Top ellipse */}
          <ellipse cx={cx} cy={topY} rx={cr} ry={ry} fill={fill} stroke={stroke} strokeWidth={2}/>
          {/* Radius line */}
          {data.radius && (
            <>
              <line x1={cx} y1={topY} x2={cx+cr} y2={topY} stroke={highlight} strokeWidth={2}/>
              <text x={cx+cr/2} y={topY-8} textAnchor="middle" fontSize={12} fill={highlight} fontWeight="bold" fontFamily="Georgia,serif">r={data.radius}</text>
            </>
          )}
          {/* Height label */}
          {data.height && (
            <text x={cx+cr+14} y={(topY+botY)/2+4} fontSize={12} fill={highlight} fontWeight="bold" fontFamily="Georgia,serif">h={data.height}</text>
          )}
        </svg>
      )
    }

    // ── 3D CONE ──────────────────────────────────────────────
    case 'cone': {
      const cx   = W / 2
      const cr   = Math.min(W,H) * 0.28
      const ry   = cr * 0.28
      const topY = (H - Math.min(W,H)*0.5) / 2
      const botY = topY + Math.min(W,H) * 0.5

      return (
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
          {/* Bottom ellipse */}
          <ellipse cx={cx} cy={botY} rx={cr} ry={ry} fill={dark?'#2a2a2a':'#E8F0FF'} stroke={stroke} strokeWidth={2}/>
          {/* Cone body */}
          <polygon points={`${cx},${topY} ${cx-cr},${botY} ${cx+cr},${botY}`} fill={fill} stroke={stroke} strokeWidth={2}/>
          {/* Hidden back edge */}
          <line x1={cx-cr} y1={botY} x2={cx+cr} y2={botY} stroke={stroke} strokeWidth={1} strokeDasharray="4,3" opacity={0.4}/>
          {/* Radius */}
          {data.radius && (
            <text x={cx+cr/2+4} y={botY+18} textAnchor="middle" fontSize={12} fill={highlight} fontWeight="bold" fontFamily="Georgia,serif">r={data.radius}</text>
          )}
          {/* Height */}
          {data.height && (
            <>
              <line x1={cx} y1={topY} x2={cx} y2={botY} stroke={highlight} strokeWidth={1.5} strokeDasharray="4,3"/>
              <text x={cx+8} y={(topY+botY)/2+4} fontSize={12} fill={highlight} fontWeight="bold" fontFamily="Georgia,serif">h={data.height}</text>
            </>
          )}
        </svg>
      )
    }

    // ── 3D SPHERE ────────────────────────────────────────────
    case 'sphere': {
      const cx = W / 2, cy = H / 2
      const r  = Math.min(W,H) * 0.32

      return (
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
          <defs>
            <radialGradient id="sphereGrad" cx="35%" cy="35%">
              <stop offset="0%" stopColor={dark?'#5D9E2F':'#E0ECFF'}/>
              <stop offset="100%" stopColor={dark?'#1E2D0E':`${color}30`}/>
            </radialGradient>
          </defs>
          <circle cx={cx} cy={cy} r={r} fill="url(#sphereGrad)" stroke={stroke} strokeWidth={2}/>
          {/* Equator ellipse */}
          <ellipse cx={cx} cy={cy} rx={r} ry={r*0.22} fill="none" stroke={stroke} strokeWidth={1} strokeDasharray="5,4" opacity={0.5}/>
          {/* Radius label */}
          {data.radius && (
            <>
              <line x1={cx} y1={cy} x2={cx+r} y2={cy} stroke={highlight} strokeWidth={2}/>
              <circle cx={cx} cy={cy} r={3} fill={highlight}/>
              <text x={cx+r/2} y={cy-10} textAnchor="middle" fontSize={12} fill={highlight} fontWeight="bold" fontFamily="Georgia,serif">r={data.radius}</text>
            </>
          )}
        </svg>
      )
    }

    // ── 3D PYRAMID ───────────────────────────────────────────
    case 'pyramid': {
      const cx   = W / 2
      const base = Math.min(W,H) * 0.42
      const poff = base * 0.35
      const botY = H * 0.72
      const topY = H * 0.18

      // Base parallelogram (isometric)
      const bl = [cx - base/2, botY]
      const br = [cx + base/2, botY]
      const br2= [cx + base/2 + poff, botY - poff * 0.5]
      const bl2= [cx - base/2 + poff, botY - poff * 0.5]
      const apex = [cx + poff/2, topY]

      return (
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
          {/* Back hidden edges */}
          <line x1={bl2[0]} y1={bl2[1]} x2={apex[0]} y2={apex[1]} stroke={stroke} strokeWidth={1} strokeDasharray="4,3" opacity={0.4}/>
          <line x1={bl2[0]} y1={bl2[1]} x2={bl[0]} y2={bl[1]} stroke={stroke} strokeWidth={1} strokeDasharray="4,3" opacity={0.4}/>
          <line x1={bl2[0]} y1={bl2[1]} x2={br2[0]} y2={br2[1]} stroke={stroke} strokeWidth={1} strokeDasharray="4,3" opacity={0.4}/>
          {/* Right face */}
          <polygon points={`${br[0]},${br[1]} ${br2[0]},${br2[1]} ${apex[0]},${apex[1]}`}
            fill={dark?'#2a2a2a':'#E8F0FF'} stroke={stroke} strokeWidth={2}/>
          {/* Left face */}
          <polygon points={`${bl[0]},${bl[1]} ${br[0]},${br[1]} ${apex[0]},${apex[1]}`}
            fill={fill} stroke={stroke} strokeWidth={2}/>
          {/* Base */}
          <polygon points={`${bl[0]},${bl[1]} ${br[0]},${br[1]} ${br2[0]},${br2[1]} ${bl2[0]},${bl2[1]}`}
            fill={dark?'#353535':'#F0F4FF'} stroke={stroke} strokeWidth={2}/>
          {/* Labels */}
          {data.base && <text x={cx} y={botY+20} textAnchor="middle" fontSize={12} fill={highlight} fontWeight="bold" fontFamily="Georgia,serif">{data.base}</text>}
          {data.height && (
            <>
              <line x1={apex[0]} y1={apex[1]} x2={apex[0]} y2={botY} stroke={highlight} strokeWidth={1.5} strokeDasharray="4,3"/>
              <text x={apex[0]+14} y={(apex[1]+botY)/2} fontSize={12} fill={highlight} fontWeight="bold" fontFamily="Georgia,serif">{data.height}</text>
            </>
          )}
        </svg>
      )
    }

    // ── NET DIAGRAM (unfolded cube) ───────────────────────────
    case 'net_cube': {
      const s   = Math.min(W, H) * 0.22
      const pad = (W - s * 3) / 2
      // Cross shape
      const faces = [
        { x: pad + s,     y: (H-s*4)/2,      label:'top' },
        { x: pad,         y: (H-s*4)/2 + s,  label:'left' },
        { x: pad + s,     y: (H-s*4)/2 + s,  label:'front' },
        { x: pad + s * 2, y: (H-s*4)/2 + s,  label:'right' },
        { x: pad + s,     y: (H-s*4)/2 + s*2,label:'bottom' },
        { x: pad + s,     y: (H-s*4)/2 + s*3,label:'back' },
      ]
      return (
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
          {faces.map((f, i) => (
            <g key={i}>
              <rect x={f.x} y={f.y} width={s} height={s}
                fill={i === 2 ? `${highlight}30` : fill}
                stroke={stroke} strokeWidth={2}/>
              {data.side && <text x={f.x+s/2} y={f.y+s/2+5} textAnchor="middle" fontSize={11} fill={label} fontFamily="Georgia,serif">{data.side}</text>}
            </g>
          ))}
        </svg>
      )
    }

    // ── PARALLELOGRAM ────────────────────────────────────────
    case 'parallelogram': {
      const pad   = 30
      const ph    = (H - pad * 2) * 0.55
      const slant = 28
      const y0    = (H - ph) / 2
      const points = [
        [pad + slant, y0 + ph],
        [W - pad, y0 + ph],
        [W - pad - slant, y0],
        [pad, y0],
      ]
      return (
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
          <polygon points={points.map(p=>p.join(',')).join(' ')}
            fill={data.highlight==='area'?`${highlight}30`:fill}
            stroke={stroke} strokeWidth={2.5}/>
          {data.base && <text x={W/2} y={y0+ph+18} textAnchor="middle" fontSize={13} fill={highlight} fontWeight="bold" fontFamily="Georgia,serif">{data.base}</text>}
          {data.height && (
            <>
              <line x1={pad+slant} y1={y0} x2={pad+slant} y2={y0+ph} stroke={highlight} strokeWidth={1.5} strokeDasharray="4,3"/>
              <text x={pad+slant-18} y={(y0+y0+ph)/2+4} fontSize={12} fill={highlight} fontWeight="bold" fontFamily="Georgia,serif">{data.height}</text>
            </>
          )}
        </svg>
      )
    }

    // ── TRAPEZOID ────────────────────────────────────────────
    case 'trapezoid': {
      const pad  = 28
      const th   = (H - pad * 2) * 0.5
      const y0   = (H - th) / 2
      const top  = (W - pad * 2) * 0.5
      const bot  = W - pad * 2
      const offT = (W - top) / 2
      const points = [
        [offT, y0],
        [offT + top, y0],
        [pad + bot, y0 + th],
        [pad, y0 + th],
      ]
      return (
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
          <polygon points={points.map(p=>p.join(',')).join(' ')}
            fill={data.highlight==='area'?`${highlight}30`:fill}
            stroke={stroke} strokeWidth={2.5}/>
          {data.top && <text x={W/2} y={y0-6} textAnchor="middle" fontSize={12} fill={highlight} fontWeight="bold" fontFamily="Georgia,serif">{data.top}</text>}
          {data.base && <text x={W/2} y={y0+th+18} textAnchor="middle" fontSize={12} fill={highlight} fontWeight="bold" fontFamily="Georgia,serif">{data.base}</text>}
          {data.height && (
            <>
              <line x1={W/2} y1={y0} x2={W/2} y2={y0+th} stroke={highlight} strokeWidth={1.5} strokeDasharray="4,3"/>
              <text x={W/2+10} y={(y0+y0+th)/2+4} fontSize={12} fill={highlight} fontWeight="bold" fontFamily="Georgia,serif">{data.height}</text>
            </>
          )}
        </svg>
      )
    }

    // ── DEFAULT / UNKNOWN ────────────────────────────────────
    default:
      return null
  }
}

// ─────────────────────────────────────────────────────────────
//  Visual data type definitions (for seeding questions)
// ─────────────────────────────────────────────────────────────
//
// FRACTION BAR:    { type:'fraction',         n:3, d:4 }
// FRACTION PIE:    { type:'fraction_pie',     n:1, d:8 }
// TRIANGLE:        { type:'triangle',         kind:'right'|'isosceles'|'equilateral'|'scalene',
//                    sides:['5cm','7cm','9cm'], angles:[45,60,75],
//                    highlight:'base'|'hypotenuse'|'height'|'area',
//                    height:'4cm' }
// RECTANGLE:       { type:'rectangle',        w:'8cm', h:'5cm', highlight:'area' }
// SQUARE:          { type:'square',           w:'6cm' }
// CIRCLE:          { type:'circle',           radius:'7cm' }
// CIRCLE DIAM:     { type:'circle',           diameter:'14cm' }
// ANGLE:           { type:'angle',            degrees:45 }
// NUMBER LINE:     { type:'number_line',      min:0, max:10, mark:7, segment:[3,7] }
// COORDINATE:      { type:'coordinate',       steps:4, points:[[2,3],[-1,4]] }
// CUBE:            { type:'cube',             side:'5cm' }
// CUBOID:          { type:'cuboid',           l:'8cm', w:'4cm', h:'3cm' }
// CYLINDER:        { type:'cylinder',         radius:'3cm', height:'8cm' }
// CONE:            { type:'cone',             radius:'4cm', height:'9cm' }
// SPHERE:          { type:'sphere',           radius:'5cm' }
// PYRAMID:         { type:'pyramid',          base:'6cm', height:'8cm' }
// NET CUBE:        { type:'net_cube',         side:'3cm' }
// PARALLELOGRAM:   { type:'parallelogram',    base:'10cm', height:'6cm' }
// TRAPEZOID:       { type:'trapezoid',        top:'4cm', base:'8cm', height:'5cm' }