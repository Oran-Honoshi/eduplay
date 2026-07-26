// ─────────────────────────────────────────────────────────────
//  mathVisual — converts visual_data JSON into an inline SVG string
//  Shared by MathVisual.tsx (client, wraps the string in JSX) and
//  the worksheet builder route (server, embeds the string in HTML
//  destined for print/PDF). Framework-agnostic: no DOM, no React,
//  no Node built-ins — pure string building, so it runs unchanged
//  in the browser and in a Route Handler.
// ─────────────────────────────────────────────────────────────

export interface MathVisualOptions {
  width?: number
  height?: number
  color?: string
  dark?: boolean
  // Suffixes gradient ids (e.g. the sphere's radial gradient) so multiple
  // instances inlined into one document (a worksheet with several
  // questions) don't collide on the same SVG element id.
  instanceId?: string | number
}

function escapeText(value: any): string {
  if (value === null || value === undefined) return ''
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function renderMathVisualSVG(data: any, opts: MathVisualOptions = {}): string {
  if (!data?.type) return ''

  const W = opts.width ?? 220
  const H = opts.height ?? 220
  const color = opts.color ?? '#4A7FD4'
  const dark = opts.dark ?? false
  const instanceId = opts.instanceId ?? ''

  const stroke   = dark ? '#F5F5DC' : '#1E2D4E'
  const fill     = dark ? 'rgba(93,158,47,0.18)' : `${color}18`
  const hl       = dark ? '#FFD700' : color
  const lbl      = dark ? '#FFD700' : '#1E2D4E'
  const faceR    = dark ? '#2a2a2a' : '#E8F0FF'  // right/side 3D face
  const faceT    = dark ? '#353535' : '#F0F4FF'  // top 3D face
  const emptyBox = dark ? '#333' : '#F0F4FF'      // unfilled fraction/grid cell
  const gridLn   = dark ? '#444' : '#E5E7EB'
  const axisTick = dark ? '#aaa' : '#6B7280'

  function svg(inner: string): string {
    return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`
  }

  function label(x: number, y: number, text: any, size: number, weight: string, col: string): string {
    return `<text x="${x}" y="${y}" text-anchor="middle" font-size="${size}" font-weight="${weight}" font-family="Georgia,serif" fill="${col}">${escapeText(text)}</text>`
  }

  switch (data.type) {

    // ── FRACTION BAR ─────────────────────────────────────────
    case 'fraction': {
      const total = data.d || 4
      const filled = data.n || 1
      const bw = Math.min(40, (W - 40) / total)
      const bh = 36
      const startX = (W - total * bw) / 2
      const y = H / 2 - bh / 2
      const boxes = Array.from({ length: total }, (_, i) =>
        `<rect x="${startX + i * bw}" y="${y}" width="${bw - 2}" height="${bh}" fill="${i < filled ? hl : emptyBox}" stroke="${stroke}" stroke-width="1.5" rx="3"/>`
      ).join('')
      return svg(`${boxes}${label(W / 2, y + bh + 22, `${filled}/${total}`, 14, 'bold', lbl)}`)
    }

    // ── FRACTION PIE ─────────────────────────────────────────
    case 'fraction_pie': {
      const total = data.d || 4
      const filled = data.n || 1
      const cx = W / 2, cy = H / 2 - 10, r = Math.min(W, H) * 0.33
      const slices = Array.from({ length: total }, (_, i) => {
        const startAngle = (i / total) * 2 * Math.PI - Math.PI / 2
        const endAngle = ((i + 1) / total) * 2 * Math.PI - Math.PI / 2
        const x1 = cx + r * Math.cos(startAngle), y1 = cy + r * Math.sin(startAngle)
        const x2 = cx + r * Math.cos(endAngle), y2 = cy + r * Math.sin(endAngle)
        const large = (endAngle - startAngle) > Math.PI ? 1 : 0
        return `<path d="M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2} Z" fill="${i < filled ? hl : emptyBox}" stroke="${stroke}" stroke-width="1.5"/>`
      }).join('')
      return svg(`${slices}<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${stroke}" stroke-width="2"/>${label(W / 2, cy + r + 24, `${filled}/${total}`, 14, 'bold', lbl)}`)
    }

    // ── TRIANGLE ─────────────────────────────────────────────
    case 'triangle': {
      const pad = 30
      const kind = data.kind || 'scalene'
      let pts: [number, number][]
      if (kind === 'right') {
        pts = [[pad, H - pad], [W - pad, H - pad], [pad, pad + 20]]
      } else if (kind === 'isosceles' || kind === 'equilateral') {
        pts = [[pad, H - pad], [W - pad, H - pad], [W / 2, pad + 10]]
      } else {
        pts = [[pad + 10, H - pad], [W - pad, H - pad], [pad + W * 0.3, pad + 20]]
      }
      const [A, B, C] = pts
      const poly = pts.map(p => p.join(',')).join(' ')
      const sides: string[] = data.sides || []
      const midAB = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2]
      const midBC = [(B[0] + C[0]) / 2, (B[1] + C[1]) / 2]
      const midCA = [(C[0] + A[0]) / 2, (C[1] + A[1]) / 2]
      const showAngles: any[] = data.angles || []
      const highlightMode = data.highlight || ''

      const rightMark = kind === 'right'
        ? `<path d="M${A[0] + 14},${A[1]} L${A[0] + 14},${A[1] - 14} L${A[0]},${A[1] - 14}" fill="none" stroke="${stroke}" stroke-width="1.5"/>` : ''
      const triFill = highlightMode === 'area' ? `${hl}30` : fill
      const baseHl = highlightMode === 'base' ? `<line x1="${A[0]}" y1="${A[1]}" x2="${B[0]}" y2="${B[1]}" stroke="${hl}" stroke-width="4"/>` : ''
      const heightHl = highlightMode === 'height' ? `<line x1="${W / 2}" y1="${C[1]}" x2="${W / 2}" y2="${A[1]}" stroke="${hl}" stroke-width="2" stroke-dasharray="5,4"/>` : ''
      const hypHl = highlightMode === 'hypotenuse' ? `<line x1="${B[0]}" y1="${B[1]}" x2="${C[0]}" y2="${C[1]}" stroke="${hl}" stroke-width="4"/>` : ''

      const sideLbls = [
        sides[0] ? label(midAB[0], midAB[1] + 16, sides[0], 13, 'bold', lbl) : '',
        sides[1] ? `<text x="${midBC[0] + 14}" y="${midBC[1]}" text-anchor="middle" font-size="13" font-weight="bold" font-family="Georgia,serif" fill="${lbl}">${escapeText(sides[1])}</text>` : '',
        sides[2] ? `<text x="${midCA[0] - 14}" y="${midCA[1]}" text-anchor="middle" font-size="13" font-weight="bold" font-family="Georgia,serif" fill="${lbl}">${escapeText(sides[2])}</text>` : '',
      ].join('')

      const angleLbls = [
        showAngles[0] ? `<text x="${A[0] + 10}" y="${A[1] - 8}" font-size="11" font-family="Georgia,serif" fill="${hl}">${escapeText(showAngles[0])}°</text>` : '',
        showAngles[1] ? `<text x="${B[0] - 28}" y="${B[1] - 8}" font-size="11" font-family="Georgia,serif" fill="${hl}">${escapeText(showAngles[1])}°</text>` : '',
        showAngles[2] ? `<text x="${C[0] - 10}" y="${C[1] + 16}" font-size="11" font-family="Georgia,serif" fill="${hl}">${escapeText(showAngles[2])}°</text>` : '',
      ].join('')

      const heightLine = data.height
        ? `<line x1="${W / 2}" y1="${C[1]}" x2="${W / 2}" y2="${A[1]}" stroke="${hl}" stroke-width="1.5" stroke-dasharray="5,4"/><text x="${W / 2 + 8}" y="${(C[1] + A[1]) / 2}" font-size="12" font-family="Georgia,serif" fill="${hl}">${escapeText(data.height)}</text>`
        : ''

      return svg(`${rightMark}<polygon points="${poly}" fill="${triFill}" stroke="${stroke}" stroke-width="2.5"/>${baseHl}${heightHl}${hypHl}${sideLbls}${angleLbls}${heightLine}`)
    }

    // ── RECTANGLE / SQUARE ───────────────────────────────────
    case 'rectangle':
    case 'square': {
      const isSquare = data.type === 'square' || data.w === data.h
      const pad = 30
      const rw = W - pad * 2
      const rh = isSquare ? rw * 0.65 : H - pad * 2 - 10
      const rx = pad
      const ry = (H - rh) / 2
      const marks = isSquare
        ? `<line x1="${rx + rw / 2 - 5}" y1="${ry + 8}" x2="${rx + rw / 2 + 5}" y2="${ry + 8}" stroke="${hl}" stroke-width="2"/>` +
          `<line x1="${rx + rw / 2 - 5}" y1="${ry + rh - 8}" x2="${rx + rw / 2 + 5}" y2="${ry + rh - 8}" stroke="${hl}" stroke-width="2"/>` +
          `<line x1="${rx + 8}" y1="${ry + rh / 2 - 5}" x2="${rx + 8}" y2="${ry + rh / 2 + 5}" stroke="${hl}" stroke-width="2"/>` +
          `<line x1="${rx + rw - 8}" y1="${ry + rh / 2 - 5}" x2="${rx + rw - 8}" y2="${ry + rh / 2 + 5}" stroke="${hl}" stroke-width="2"/>`
        : ''
      const wLabel = data.w
        ? `<line x1="${rx}" y1="${ry + rh + 12}" x2="${rx + rw}" y2="${ry + rh + 12}" stroke="${stroke}" stroke-width="1"/>${label(rx + rw / 2, ry + rh + 26, data.w, 13, 'bold', lbl)}`
        : ''
      const hLabel = data.h
        ? label((rx + rw + W) / 2, ry + rh / 2 + 5, data.h, 13, 'bold', lbl)
        : ''
      const areaLabel = data.area ? label(rx + rw / 2, ry + rh / 2 + 5, `A = ${data.area}`, 12, 'bold', lbl) : ''
      return svg(`<rect x="${rx}" y="${ry}" width="${rw}" height="${rh}" fill="${data.highlight === 'area' ? `${hl}30` : fill}" stroke="${stroke}" stroke-width="2.5" rx="2"/>${marks}${wLabel}${hLabel}${areaLabel}`)
    }

    // ── CIRCLE ───────────────────────────────────────────────
    case 'circle': {
      const cx = W / 2, cy = H / 2 - 8
      const r = Math.min(W, H) * 0.32
      const radius = data.radius ?? data.r
      const diameter = data.diameter ?? data.d
      const radiusEls = radius
        ? `<line x1="${cx}" y1="${cy}" x2="${cx + r}" y2="${cy}" stroke="${hl}" stroke-width="2"/><circle cx="${cx}" cy="${cy}" r="3" fill="${hl}"/>${label(cx + r / 2, cy - 8, `r = ${radius}`, 13, 'bold', hl)}`
        : ''
      const diameterEls = (diameter && !radius)
        ? `<line x1="${cx - r}" y1="${cy}" x2="${cx + r}" y2="${cy}" stroke="${hl}" stroke-width="2"/>${label(cx, cy - 10, `d = ${diameter}`, 13, 'bold', hl)}`
        : ''
      const areaLabel = data.area ? label(cx, cy + r + 22, `A = ${data.area}`, 12, 'bold', lbl) : ''
      return svg(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${data.highlight === 'area' ? `${hl}30` : fill}" stroke="${stroke}" stroke-width="2.5"/>${radiusEls}${diameterEls}<circle cx="${cx}" cy="${cy}" r="3" fill="${stroke}"/>${areaLabel}`)
    }

    // ── ANGLE ────────────────────────────────────────────────
    case 'angle': {
      const deg = data.degrees || 90
      const cx = W * 0.25, cy = H * 0.75
      const len = Math.min(W, H) * 0.45
      const rad = (deg * Math.PI) / 180
      const x2 = cx + len, y2 = cy
      const x3 = cx + len * Math.cos(Math.PI - rad)
      const y3 = cy - len * Math.sin(Math.PI - rad)
      const arcR = len * 0.28
      const isRight = deg === 90
      const arcOrBox = isRight
        ? `<path d="M${cx + arcR},${cy} L${cx + arcR},${cy - arcR} L${cx},${cy - arcR}" fill="none" stroke="${hl}" stroke-width="2"/>`
        : `<path d="M${cx + arcR},${cy} A${arcR},${arcR} 0 0 1 ${cx + arcR * Math.cos(Math.PI - rad)},${cy - arcR * Math.sin(Math.PI - rad)}" fill="${hl}20" stroke="${hl}" stroke-width="2"/>`
      const lx = cx + (isRight ? arcR + 14 : arcR * 1.5 * Math.cos((Math.PI - rad) / 2) + 6)
      const ly = cy - (isRight ? arcR : arcR * 1.5 * Math.sin((Math.PI - rad) / 2)) + 4
      return svg(`<line x1="${cx}" y1="${cy}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="2.5"/><line x1="${cx}" y1="${cy}" x2="${x3}" y2="${y3}" stroke="${stroke}" stroke-width="2.5"/>${arcOrBox}<text x="${lx}" y="${ly}" font-size="14" font-weight="bold" font-family="Georgia,serif" fill="${hl}">${deg}°</text><circle cx="${cx}" cy="${cy}" r="3" fill="${stroke}"/>`)
    }

    // ── NUMBER LINE ──────────────────────────────────────────
    case 'number_line': {
      const min = data.min ?? 0
      const max = data.max ?? 10
      // Accept either the singular `mark` (live app data) or the plural
      // `marked` array (worksheet-builder data) — union, not either/or.
      const marks: number[] = data.marked ?? (data.mark != null ? [data.mark] : [])
      const pad = 28, y = H / 2
      const range = max - min
      const scale = (W - pad * 2) / range
      const ticks = Array.from({ length: range + 1 }, (_, i) => {
        const x = pad + i * scale
        const val = min + i
        const isM = marks.includes(val)
        return `<g><line x1="${x}" y1="${y - 8}" x2="${x}" y2="${y + 8}" stroke="${isM ? hl : stroke}" stroke-width="${isM ? 3 : 1.5}"/>${isM ? `<circle cx="${x}" cy="${y}" r="6" fill="${hl}" opacity="0.3"/>` : ''}<text x="${x}" y="${y + 22}" text-anchor="middle" font-size="12" font-family="Georgia,serif" fill="${isM ? hl : lbl}" font-weight="${isM ? 'bold' : 'normal'}">${val}</text></g>`
      }).join('')
      const arrow = `<polygon points="${W - pad},${y} ${W - pad - 8},${y - 4} ${W - pad - 8},${y + 4}" fill="${stroke}"/>`
      const segment = data.segment
        ? `<line x1="${pad + (data.segment[0] - min) * scale}" y1="${y}" x2="${pad + (data.segment[1] - min) * scale}" y2="${y}" stroke="${hl}" stroke-width="5" opacity="0.5"/>`
        : ''
      return svg(`<line x1="${pad}" y1="${y}" x2="${W - pad}" y2="${y}" stroke="${stroke}" stroke-width="2"/>${arrow}${ticks}${segment}`)
    }

    // ── COORDINATE GRID (Cartesian plane) ─────────────────────
    case 'coordinate': {
      const steps = data.steps || data.range || 5
      const pad = 28
      const inner = Math.min(W, H) - pad * 2
      const step = inner / (steps * 2)
      const cx = W / 2, cy = H / 2
      // Points may be [x,y] or [x,y,label] — an explicit label overrides
      // the default "(x,y)" annotation.
      const points: [number, number, string?][] = data.points || []

      let gridLines = ''
      for (let i = 0; i < steps * 2 + 1; i++) {
        const pos = pad + i * step
        gridLines += `<line x1="${pos}" y1="${pad}" x2="${pos}" y2="${H - pad}" stroke="${gridLn}" stroke-width="1"/><line x1="${pad}" y1="${pos}" x2="${W - pad}" y2="${pos}" stroke="${gridLn}" stroke-width="1"/>`
      }

      let tickLabels = ''
      for (let i = 0; i < steps * 2 + 1; i++) {
        const val = i - steps
        if (val === 0) continue
        const x = cx + val * step
        tickLabels += `<text x="${x}" y="${cy + 14}" text-anchor="middle" font-size="9" font-family="Georgia,serif" fill="${axisTick}">${val}</text><text x="${cx - 12}" y="${cy - val * step + 4}" text-anchor="middle" font-size="9" font-family="Georgia,serif" fill="${axisTick}">${val}</text>`
      }

      const plotted = points.map(([px, py, ptLabel]) => {
        const svgX = cx + px * step, svgY = cy - py * step
        const text = ptLabel ?? `(${px},${py})`
        return `<circle cx="${svgX}" cy="${svgY}" r="5" fill="${hl}" stroke="${stroke}" stroke-width="1.5"/><text x="${svgX + 8}" y="${svgY - 6}" font-size="11" font-weight="bold" font-family="Georgia,serif" fill="${hl}">${escapeText(text)}</text>`
      }).join('')

      const connector = points.length === 2
        ? `<line x1="${cx + points[0][0] * step}" y1="${cy - points[0][1] * step}" x2="${cx + points[1][0] * step}" y2="${cy - points[1][1] * step}" stroke="${hl}" stroke-width="2"${data.dashed ? ' stroke-dasharray="5,4"' : ''}/>`
        : ''

      const axes = `<line x1="${cx}" y1="${pad - 4}" x2="${cx}" y2="${H - pad + 4}" stroke="${stroke}" stroke-width="2"/><line x1="${pad - 4}" y1="${cy}" x2="${W - pad + 4}" y2="${cy}" stroke="${stroke}" stroke-width="2"/><polygon points="${cx},${pad - 4} ${cx - 4},${pad + 6} ${cx + 4},${pad + 6}" fill="${stroke}"/><polygon points="${W - pad + 4},${cy} ${W - pad - 6},${cy - 4} ${W - pad - 6},${cy + 4}" fill="${stroke}"/><text x="${cx + 6}" y="${pad + 12}" font-size="11" font-family="Georgia,serif" fill="${lbl}">y</text><text x="${W - pad + 6}" y="${cy + 4}" font-size="11" font-family="Georgia,serif" fill="${lbl}">x</text>`

      return svg(`${gridLines}${axes}${tickLabels}${plotted}${connector}`)
    }

    // ── GRID (multiplication / area array model) ──────────────
    case 'grid': {
      const cols = Math.min(data.cols || 4, 10)
      const rows = Math.min(data.rows || 4, 8)
      const pad = 20
      const cw = (W - pad * 2) / cols, rh = (H - pad * 2) / rows
      const filled: number = data.filled ?? cols * rows
      let cells = '', count = 0
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const f = count < filled
          cells += `<rect x="${pad + c * cw}" y="${pad + r * rh}" width="${cw - 1}" height="${rh - 1}" fill="${f ? hl : emptyBox}" stroke="${stroke}" stroke-width="1" opacity="${f ? 0.7 : 0.4}"/>`
          count++
        }
      }
      return svg(`${cells}${label(W / 2, H - 8, `${cols} × ${rows} = ${cols * rows}`, 11, 'bold', lbl)}`)
    }

    // ── 3D CUBE ───────────────────────────────────────────────
    case 'cube': {
      const side = data.side || null
      const s = Math.min(W, H) * 0.38
      const offset = s * 0.38
      const x0 = (W - s - offset) / 2
      const y0 = (H - s - offset) / 2 + offset * 0.3
      const front: [number, number][] = [[x0, y0 + s], [x0 + s, y0 + s], [x0 + s, y0], [x0, y0]]
      const back = front.map(([x, y]) => [x + offset, y - offset])
      const frontPoly = front.map(p => p.join(',')).join(' ')
      const topPoly = [front[2], front[3], back[3], back[2]].map(p => p.join(',')).join(' ')
      const rightPoly = [front[1], front[2], back[2], back[1]].map(p => p.join(',')).join(' ')
      const hiddenStroke = dark ? '#666' : stroke
      const sideLabel = side
        ? `<text x="${front[0][0] - 14}" y="${(front[0][1] + front[3][1]) / 2 + 4}" text-anchor="middle" font-size="12" font-weight="bold" font-family="Georgia,serif" fill="${hl}">${escapeText(side)}</text><text x="${(front[0][0] + front[1][0]) / 2}" y="${front[0][1] + 18}" text-anchor="middle" font-size="12" font-weight="bold" font-family="Georgia,serif" fill="${hl}">${escapeText(side)}</text>`
        : ''
      return svg(`<polygon points="${rightPoly}" fill="${faceR}" stroke="${stroke}" stroke-width="2"/><polygon points="${topPoly}" fill="${faceT}" stroke="${stroke}" stroke-width="2"/><polygon points="${frontPoly}" fill="${fill}" stroke="${stroke}" stroke-width="2"/><line x1="${back[0][0]}" y1="${back[0][1]}" x2="${back[1][0]}" y2="${back[1][1]}" stroke="${hiddenStroke}" stroke-width="1" stroke-dasharray="4,3" opacity="0.5"/><line x1="${back[0][0]}" y1="${back[0][1]}" x2="${back[3][0]}" y2="${back[3][1]}" stroke="${hiddenStroke}" stroke-width="1" stroke-dasharray="4,3" opacity="0.5"/><line x1="${back[0][0]}" y1="${back[0][1]}" x2="${front[0][0]}" y2="${front[0][1]}" stroke="${hiddenStroke}" stroke-width="1" stroke-dasharray="4,3" opacity="0.5"/>${sideLabel}`)
    }

    // ── 3D RECTANGULAR PRISM ─────────────────────────────────
    case 'cuboid':
    case 'rectangular_prism': {
      const l = data.l ?? data.length
      const w = data.w ?? data.width
      const h = data.h ?? data.height
      const rw = Math.min(W, H) * 0.44
      const rh = Math.min(W, H) * 0.28
      const offset = Math.min(W, H) * 0.22
      const x0 = (W - rw - offset) / 2
      const y0 = (H - rh - offset) / 2 + offset * 0.4
      const front: [number, number][] = [[x0, y0 + rh], [x0 + rw, y0 + rh], [x0 + rw, y0], [x0, y0]]
      const back = front.map(([x, y]) => [x + offset, y - offset])
      const frontPoly = front.map(p => p.join(',')).join(' ')
      const topPoly = [front[2], front[3], back[3], back[2]].map(p => p.join(',')).join(' ')
      const rightPoly = [front[1], front[2], back[2], back[1]].map(p => p.join(',')).join(' ')
      const lLabel = l ? label((front[0][0] + front[1][0]) / 2, front[1][1] + 18, l, 12, 'bold', hl) : ''
      // TODO(cosmetic): wLabel sits on top of the front/right edge line at some aspect ratios —
      // not clipped, just visually overlapping. Not worth a positioning pass on its own.
      const wLabel = w ? label((back[1][0] + front[1][0]) / 2 + 10, (back[1][1] + front[1][1]) / 2 + 4, w, 12, 'bold', hl) : ''
      const hLabel = h ? label(front[0][0] - 16, (front[0][1] + front[3][1]) / 2 + 4, h, 12, 'bold', hl) : ''
      return svg(`<polygon points="${rightPoly}" fill="${faceR}" stroke="${stroke}" stroke-width="2"/><polygon points="${topPoly}" fill="${faceT}" stroke="${stroke}" stroke-width="2"/><polygon points="${frontPoly}" fill="${fill}" stroke="${stroke}" stroke-width="2"/><line x1="${back[0][0]}" y1="${back[0][1]}" x2="${back[1][0]}" y2="${back[1][1]}" stroke="${stroke}" stroke-width="1" stroke-dasharray="4,3" opacity="0.4"/><line x1="${back[0][0]}" y1="${back[0][1]}" x2="${back[3][0]}" y2="${back[3][1]}" stroke="${stroke}" stroke-width="1" stroke-dasharray="4,3" opacity="0.4"/><line x1="${back[0][0]}" y1="${back[0][1]}" x2="${front[0][0]}" y2="${front[0][1]}" stroke="${stroke}" stroke-width="1" stroke-dasharray="4,3" opacity="0.4"/>${lLabel}${wLabel}${hLabel}`)
    }

    // ── 3D CYLINDER ──────────────────────────────────────────
    case 'cylinder': {
      const cx = W / 2
      const ch = Math.min(W, H) * 0.44
      const cr = Math.min(W, H) * 0.28
      const ry = cr * 0.28
      const topY = (H - ch) / 2
      const botY = topY + ch
      const radius = data.radius ?? data.r
      const height = data.height ?? data.h
      const radiusEls = radius
        ? `<line x1="${cx}" y1="${topY}" x2="${cx + cr}" y2="${topY}" stroke="${hl}" stroke-width="2"/>${label(cx + cr / 2, topY - 8, `r=${radius}`, 12, 'bold', hl)}`
        : ''
      const heightLabel = height
        ? label((cx + cr + W) / 2, (topY + botY) / 2 + 4, `h=${height}`, 12, 'bold', hl)
        : ''
      return svg(`<ellipse cx="${cx}" cy="${botY}" rx="${cr}" ry="${ry}" fill="${faceR}" stroke="${stroke}" stroke-width="2"/><rect x="${cx - cr}" y="${topY}" width="${cr * 2}" height="${ch}" fill="${fill}" stroke="none"/><line x1="${cx - cr}" y1="${topY}" x2="${cx - cr}" y2="${botY}" stroke="${stroke}" stroke-width="2"/><line x1="${cx + cr}" y1="${topY}" x2="${cx + cr}" y2="${botY}" stroke="${stroke}" stroke-width="2"/><ellipse cx="${cx}" cy="${topY}" rx="${cr}" ry="${ry}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>${radiusEls}${heightLabel}`)
    }

    // ── 3D CONE ──────────────────────────────────────────────
    case 'cone': {
      const cx = W / 2
      const cr = Math.min(W, H) * 0.28
      const ry = cr * 0.28
      const topY = (H - Math.min(W, H) * 0.5) / 2
      const botY = topY + Math.min(W, H) * 0.5
      const radius = data.radius ?? data.r
      const height = data.height ?? data.h
      const radiusLabel = radius ? label(cx + cr / 2 + 4, botY + 18, `r=${radius}`, 12, 'bold', hl) : ''
      const heightLine = height
        ? `<line x1="${cx}" y1="${topY}" x2="${cx}" y2="${botY}" stroke="${hl}" stroke-width="1.5" stroke-dasharray="4,3"/>${label(cx + 22, (topY + botY) / 2 + 4, `h=${height}`, 12, 'bold', hl)}`
        : ''
      return svg(`<ellipse cx="${cx}" cy="${botY}" rx="${cr}" ry="${ry}" fill="${faceR}" stroke="${stroke}" stroke-width="2"/><polygon points="${cx},${topY} ${cx - cr},${botY} ${cx + cr},${botY}" fill="${fill}" stroke="${stroke}" stroke-width="2"/><line x1="${cx - cr}" y1="${botY}" x2="${cx + cr}" y2="${botY}" stroke="${stroke}" stroke-width="1" stroke-dasharray="4,3" opacity="0.4"/>${radiusLabel}${heightLine}`)
    }

    // ── 3D SPHERE ────────────────────────────────────────────
    case 'sphere': {
      const cx = W / 2, cy = H / 2
      const r = Math.min(W, H) * 0.32
      const radius = data.radius ?? data.r
      const gradId = `sphereGrad${instanceId !== '' ? '-' + instanceId : ''}`
      const radiusEls = radius
        ? `<line x1="${cx}" y1="${cy}" x2="${cx + r}" y2="${cy}" stroke="${hl}" stroke-width="2"/><circle cx="${cx}" cy="${cy}" r="3" fill="${hl}"/>${label(cx + r / 2, cy - 10, `r=${radius}`, 12, 'bold', hl)}`
        : ''
      return svg(`<defs><radialGradient id="${gradId}" cx="35%" cy="35%"><stop offset="0%" stop-color="${dark ? '#5D9E2F' : '#E0ECFF'}"/><stop offset="100%" stop-color="${dark ? '#1E2D0E' : `${color}30`}"/></radialGradient></defs><circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${gradId})" stroke="${stroke}" stroke-width="2"/><ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${r * 0.22}" fill="none" stroke="${stroke}" stroke-width="1" stroke-dasharray="5,4" opacity="0.5"/>${radiusEls}`)
    }

    // ── 3D PYRAMID ───────────────────────────────────────────
    case 'pyramid': {
      const cx = W / 2
      const base = Math.min(W, H) * 0.42
      const poff = base * 0.35
      const botY = H * 0.72
      const topY = H * 0.18
      const bl: [number, number] = [cx - base / 2, botY]
      const br: [number, number] = [cx + base / 2, botY]
      const br2: [number, number] = [cx + base / 2 + poff, botY - poff * 0.5]
      const bl2: [number, number] = [cx - base / 2 + poff, botY - poff * 0.5]
      const apex: [number, number] = [cx + poff / 2, topY]
      const height = data.height ?? data.h
      const baseLabel = data.base ? label(cx, botY + 20, data.base, 12, 'bold', hl) : ''
      const heightLine = height
        ? `<line x1="${apex[0]}" y1="${apex[1]}" x2="${apex[0]}" y2="${botY}" stroke="${hl}" stroke-width="1.5" stroke-dasharray="4,3"/><text x="${apex[0] + 14}" y="${(apex[1] + botY) / 2}" font-size="12" font-weight="bold" font-family="Georgia,serif" fill="${hl}">${escapeText(height)}</text>`
        : ''
      return svg(`<line x1="${bl2[0]}" y1="${bl2[1]}" x2="${apex[0]}" y2="${apex[1]}" stroke="${stroke}" stroke-width="1" stroke-dasharray="4,3" opacity="0.4"/><line x1="${bl2[0]}" y1="${bl2[1]}" x2="${bl[0]}" y2="${bl[1]}" stroke="${stroke}" stroke-width="1" stroke-dasharray="4,3" opacity="0.4"/><line x1="${bl2[0]}" y1="${bl2[1]}" x2="${br2[0]}" y2="${br2[1]}" stroke="${stroke}" stroke-width="1" stroke-dasharray="4,3" opacity="0.4"/><polygon points="${br[0]},${br[1]} ${br2[0]},${br2[1]} ${apex[0]},${apex[1]}" fill="${faceR}" stroke="${stroke}" stroke-width="2"/><polygon points="${bl[0]},${bl[1]} ${br[0]},${br[1]} ${apex[0]},${apex[1]}" fill="${fill}" stroke="${stroke}" stroke-width="2"/><polygon points="${bl[0]},${bl[1]} ${br[0]},${br[1]} ${br2[0]},${br2[1]} ${bl2[0]},${bl2[1]}" fill="${faceT}" stroke="${stroke}" stroke-width="2"/>${baseLabel}${heightLine}`)
    }

    // ── NET DIAGRAM (unfolded cube) ───────────────────────────
    case 'net_cube': {
      const s = Math.min(W, H) * 0.22
      const pad = (W - s * 3) / 2
      const faces = [
        { x: pad + s, y: (H - s * 4) / 2 },
        { x: pad, y: (H - s * 4) / 2 + s },
        { x: pad + s, y: (H - s * 4) / 2 + s, front: true },
        { x: pad + s * 2, y: (H - s * 4) / 2 + s },
        { x: pad + s, y: (H - s * 4) / 2 + s * 2 },
        { x: pad + s, y: (H - s * 4) / 2 + s * 3 },
      ]
      const rects = faces.map(f => {
        const faceFill = f.front ? `${hl}30` : fill
        const sideText = data.side ? `<text x="${f.x + s / 2}" y="${f.y + s / 2 + 5}" text-anchor="middle" font-size="11" font-family="Georgia,serif" fill="${lbl}">${escapeText(data.side)}</text>` : ''
        return `<rect x="${f.x}" y="${f.y}" width="${s}" height="${s}" fill="${faceFill}" stroke="${stroke}" stroke-width="2"/>${sideText}`
      }).join('')
      return svg(rects)
    }

    // ── PARALLELOGRAM ────────────────────────────────────────
    case 'parallelogram': {
      const pad = 30
      const ph = (H - pad * 2) * 0.55
      const slant = 28
      const y0 = (H - ph) / 2
      const points: [number, number][] = [[pad + slant, y0 + ph], [W - pad, y0 + ph], [W - pad - slant, y0], [pad, y0]]
      const base = data.base ?? data.b
      const height = data.height ?? data.h
      const baseLabel = base ? label(W / 2, y0 + ph + 18, base, 13, 'bold', hl) : ''
      const heightLine = height
        ? `<line x1="${pad + slant}" y1="${y0}" x2="${pad + slant}" y2="${y0 + ph}" stroke="${hl}" stroke-width="1.5" stroke-dasharray="4,3"/><text x="${pad + slant - 18}" y="${(y0 + y0 + ph) / 2 + 4}" font-size="12" font-weight="bold" font-family="Georgia,serif" fill="${hl}">${escapeText(height)}</text>`
        : ''
      return svg(`<polygon points="${points.map(p => p.join(',')).join(' ')}" fill="${data.highlight === 'area' ? `${hl}30` : fill}" stroke="${stroke}" stroke-width="2.5"/>${baseLabel}${heightLine}`)
    }

    // ── TRAPEZOID ────────────────────────────────────────────
    case 'trapezoid': {
      const pad = 28
      const th = (H - pad * 2) * 0.5
      const y0 = (H - th) / 2
      const top = (W - pad * 2) * 0.5
      const bot = W - pad * 2
      const offT = (W - top) / 2
      const points: [number, number][] = [[offT, y0], [offT + top, y0], [pad + bot, y0 + th], [pad, y0 + th]]
      const topVal = data.top ?? data.a
      const baseVal = data.base ?? data.b
      const height = data.height ?? data.h
      const topLabel = topVal ? label(W / 2, y0 - 6, topVal, 12, 'bold', hl) : ''
      const baseLabel = baseVal ? label(W / 2, y0 + th + 18, baseVal, 12, 'bold', hl) : ''
      const heightLine = height
        ? `<line x1="${W / 2}" y1="${y0}" x2="${W / 2}" y2="${y0 + th}" stroke="${hl}" stroke-width="1.5" stroke-dasharray="4,3"/><text x="${W / 2 + 10}" y="${(y0 + y0 + th) / 2 + 4}" font-size="12" font-weight="bold" font-family="Georgia,serif" fill="${hl}">${escapeText(height)}</text>`
        : ''
      return svg(`<polygon points="${points.map(p => p.join(',')).join(' ')}" fill="${data.highlight === 'area' ? `${hl}30` : fill}" stroke="${stroke}" stroke-width="2.5"/>${topLabel}${baseLabel}${heightLine}`)
    }

    default:
      return ''
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
// RECTANGLE:       { type:'rectangle',        w:'8cm', h:'5cm', highlight:'area', area:'40cm²' }
// SQUARE:          { type:'square',           w:'6cm' }
// CIRCLE:          { type:'circle',           radius:'7cm' }  // or r:'7cm'
// CIRCLE DIAM:     { type:'circle',           diameter:'14cm' }  // or d:'14cm'
// ANGLE:           { type:'angle',            degrees:45 }
// NUMBER LINE:     { type:'number_line',      min:0, max:10, mark:7, segment:[3,7] }  // or marked:[7]
// COORDINATE:      { type:'coordinate',       steps:4, points:[[2,3],[-1,4]] }  // points may add a 3rd label element
// GRID (array):    { type:'grid',             cols:4, rows:3, filled:8 }
// CUBE:            { type:'cube',             side:'5cm' }
// CUBOID:          { type:'cuboid',           l:'8cm', w:'4cm', h:'3cm' }
// CYLINDER:        { type:'cylinder',         radius:'3cm', height:'8cm' }  // or r/h
// CONE:            { type:'cone',             radius:'4cm', height:'9cm' }  // or r/h
// SPHERE:          { type:'sphere',           radius:'5cm' }  // or r
// PYRAMID:         { type:'pyramid',          base:'6cm', height:'8cm' }
// NET CUBE:        { type:'net_cube',         side:'3cm' }
// PARALLELOGRAM:   { type:'parallelogram',    base:'10cm', height:'6cm' }
// TRAPEZOID:       { type:'trapezoid',        top:'4cm', base:'8cm', height:'5cm' }
//
// 'grid' and 'coordinate' are distinct, unambiguous types — 'grid' is
// always the multiplication/array model, 'coordinate' is always the
// Cartesian plane. (Previously MathVisual.tsx aliased 'grid' to
// 'coordinate' while the worksheet builder used 'grid' for the array
// model — that collision is resolved here, not carried forward.)
