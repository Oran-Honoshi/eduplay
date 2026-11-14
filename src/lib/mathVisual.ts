import { renderVisual as renderEduVisual, VISUAL_TYPES as EDU_TYPES } from '@/lib/eduVisuals/visuals'
import { renderKidVisual } from './kidVisuals'
// @ts-ignore: plain JS module shipped by the designer
import { sanitizeCustomSvg } from '@/lib/eduVisuals/validate.js'
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

// The designer's "Notebook + Oli" library (src/lib/eduVisuals) draws the types this renderer has no case for
// (objects, ten_frame, groups, array, share, base_ten, money, clock, ruler, pictograph…: the K–3 pictures).
// For types both libraries know (fraction, number_line, graph, the geometry shapes…) this renderer stays in charge,
// because it carries the labels and options the higher grades use; a question opts into the new look with lib:'eduplay'.
// coordinate and angle exist only here.
const OWN_TYPES = new Set(['angle', 'circle', 'cone', 'coordinate', 'cube', 'cuboid', 'cylinder', 'fraction', 'fraction_compare', 'fraction_pie', 'graph', 'grid', 'net_cube', 'number_line', 'parallelogram', 'pyramid', 'rectangle', 'rectangular_prism', 'sphere', 'square', 'trapezoid', 'triangle'])

export function renderMathVisualSVG(data: any, opts: MathVisualOptions = {}): string {
  if (!data?.type) return ''
  // a picture the generator drew itself because no library type fit: drawn only if it still passes the brand/safety check
  if (data.type === 'custom_svg') {
    const svg = String(data.svg || '')
    if (!svg || sanitizeCustomSvg(svg).length) return ''
    return svg.replace(/^\s*<svg/, '<svg style="max-width:100%;height:auto;display:block;margin:0 auto" direction="ltr"')
  }
  if (EDU_TYPES.includes(data.type) && (!OWN_TYPES.has(data.type) || data.lib === 'eduplay')) {
    try { return renderEduVisual(data, { subject: 'math' }) } catch { return '' }
  }

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
  const gridLn   = dark ? '#666' : '#B8C0CC'
  const axisTick = dark ? '#ddd' : '#1E2D4E'

  function svg(inner: string): string {
    return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg" direction="ltr" style="direction:ltr">${inner}</svg>`
  }

  function label(x: number, y: number, text: any, size: number, weight: string, col: string): string {
    return `<text x="${x}" y="${y}" text-anchor="middle" font-size="${size}" font-weight="${weight}" font-family="Georgia,serif" fill="${col}">${escapeText(text)}</text>`
  }

  switch (data.type) {

    // ── FRACTION BAR ─────────────────────────────────────────
    case 'fraction': {
      // the question writer uses numerator/denominator; older data uses n/d.
      // n: 0 is a shape to shade — no label then (it would read "0/4").
      const total = Number(data.d ?? data.denominator) || 4
      const filled = Number(data.n ?? data.numerator ?? 1)
      const bw = Math.min(40, (W - 40) / total)
      const bh = 36
      const startX = (W - total * bw) / 2
      const y = H / 2 - bh / 2
      const boxes = Array.from({ length: total }, (_, i) =>
        `<rect x="${startX + i * bw}" y="${y}" width="${bw - 2}" height="${bh}" fill="${i < filled ? hl : emptyBox}" stroke="${stroke}" stroke-width="1.5" rx="3"/>`
      ).join('')
      return svg(`${boxes}${filled ? label(W / 2, y + bh + 22, `${filled}/${total}`, 14, 'bold', lbl) : ''}`)
    }

    // ── FRACTION PIE ─────────────────────────────────────────
    case 'fraction_pie': {
      const total = Number(data.d ?? data.denominator) || 4
      const filled = Number(data.n ?? data.numerator ?? 1)
      const cx = W / 2, cy = H / 2 - 10, r = Math.min(W, H) * 0.33
      const slices = Array.from({ length: total }, (_, i) => {
        const startAngle = (i / total) * 2 * Math.PI - Math.PI / 2
        const endAngle = ((i + 1) / total) * 2 * Math.PI - Math.PI / 2
        const x1 = cx + r * Math.cos(startAngle), y1 = cy + r * Math.sin(startAngle)
        const x2 = cx + r * Math.cos(endAngle), y2 = cy + r * Math.sin(endAngle)
        const large = (endAngle - startAngle) > Math.PI ? 1 : 0
        return `<path d="M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2} Z" fill="${i < filled ? hl : emptyBox}" stroke="${stroke}" stroke-width="1.5"/>`
      }).join('')
      return svg(`${slices}<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${stroke}" stroke-width="2"/>${filled ? label(W / 2, cy + r + 24, `${filled}/${total}`, 14, 'bold', lbl) : ''}`)
    }

    // ── FRACTION COMPARE ─────────────────────────────────────
    // Two fractions side by side, each partitioned by its own denominator.
    // Deliberately fully unfilled — no cell shaded on either side — so the
    // visual shows partition granularity as a reasoning aid without giving
    // away which fraction is larger.
    case 'fraction_compare': {
      const a = data.a, b = data.b
      if (!a?.d || !b?.d) return ''
      const halfW = W / 2
      function bar(offsetX: number, width: number, total: number, fracLabel: string): string {
        const bw = Math.min(28, (width - 30) / total)
        const bh = 32
        const startX = offsetX + (width - total * bw) / 2
        const y = H / 2 - bh / 2
        const boxes = Array.from({ length: total }, (_, i) =>
          `<rect x="${startX + i * bw}" y="${y}" width="${bw - 2}" height="${bh}" fill="${emptyBox}" stroke="${stroke}" stroke-width="1.5" rx="3"/>`
        ).join('')
        return `${boxes}${label(offsetX + width / 2, y + bh + 22, fracLabel, 14, 'bold', lbl)}`
      }
      const divider = `<line x1="${halfW}" y1="20" x2="${halfW}" y2="${H - 20}" stroke="${stroke}" stroke-width="1" stroke-dasharray="4,3" opacity="0.4"/>`
      return svg(`${bar(0, halfW, a.d, `${a.n}/${a.d}`)}${divider}${bar(halfW, halfW, b.d, `${b.n}/${b.d}`)}`)
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
      // Several rays from one vertex (e.g. "three rays OD, OE, OF"):
      // { type:'angle', vertex:'O', rays:[{deg:0,letter:'D'},{deg:60,letter:'E'},{deg:115,letter:'F'}], arcs:[[0,1,'?']] }
      // deg = direction of the ray, 0 = to the right, counter-clockwise. No arcs unless asked (they would give the answer away).
      if (Array.isArray(data.rays) && data.rays.length >= 2) {
        const rays = (data.rays as any[]).slice(0, 5).map(r => ({ deg: Math.max(0, Math.min(180, Number(r?.deg) || 0)), letter: String(r?.letter ?? '') }))
        const maxD = Math.max(...rays.map(r => r.deg))
        const cx = maxD > 100 ? W * 0.38 : W * 0.22, cy = H * 0.78
        // keep every ray and its letter inside the picture
        const len = Math.max(40, Math.min(Math.min(W, H) * (maxD > 100 ? 0.45 : 0.6), W - cx - 30, cy - 24))
        const pt = (d: number, r: number): [number, number] => [cx + r * Math.cos((d * Math.PI) / 180), cy - r * Math.sin((d * Math.PI) / 180)]
        const rayEls = rays.map(r => {
          const [x, y] = pt(r.deg, len), [tx, ty] = pt(r.deg, len + 14)
          return `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="${stroke}" stroke-width="2.5"/>${r.letter ? `<text x="${tx}" y="${ty + 5}" text-anchor="middle" font-size="15" font-weight="bold" font-family="Georgia,serif" fill="${lbl}">${escapeText(r.letter)}</text>` : ''}`
        }).join('')
        const arcEls = (Array.isArray(data.arcs) ? data.arcs : []).slice(0, 4).map((a: any, k: number) => {
          const ra = rays[Number(a?.[0])], rb = rays[Number(a?.[1])]
          if (!ra || !rb) return ''
          const lo = Math.min(ra.deg, rb.deg), hi = Math.max(ra.deg, rb.deg), r = len * (0.22 + 0.08 * k)
          const [x1, y1] = pt(lo, r), [x2, y2] = pt(hi, r), [lx, ly] = pt((lo + hi) / 2, r + 16)
          return `<path d="M${x1},${y1} A${r},${r} 0 0 0 ${x2},${y2}" fill="none" stroke="${hl}" stroke-width="2"/>${a?.[2] ? `<text x="${lx}" y="${ly + 5}" text-anchor="middle" font-size="14" font-weight="bold" font-family="Georgia,serif" fill="${hl}">${escapeText(String(a[2]))}</text>` : ''}`
        }).join('')
        const vert = data.vertex ? `<text x="${cx - 12}" y="${cy + 17}" text-anchor="middle" font-size="15" font-weight="bold" font-family="Georgia,serif" fill="${lbl}">${escapeText(String(data.vertex))}</text>` : ''
        return svg(`${rayEls}${arcEls}<circle cx="${cx}" cy="${cy}" r="3" fill="${stroke}"/>${vert}`)
      }
      const deg = Math.max(1, Math.min(180, Number(data.degrees) || 90))
      const rad = (deg * Math.PI) / 180
      // vertex placement keeps both rays inside the box for any angle up to 180°
      const cx = deg > 100 ? W * 0.5 : W * 0.22, cy = H * 0.72
      const len = Math.min(W, H) * (deg > 100 ? 0.4 : 0.55)
      const x2 = cx + len, y2 = cy
      const x3 = cx + len * Math.cos(rad)
      const y3 = cy - len * Math.sin(rad)
      const arcR = len * 0.28
      const isRight = deg === 90
      const arcOrBox = isRight
        ? `<path d="M${cx + arcR * 0.55},${cy} L${cx + arcR * 0.55},${cy - arcR * 0.55} L${cx},${cy - arcR * 0.55}" fill="none" stroke="${hl}" stroke-width="2"/>`
        : `<path d="M${cx},${cy} L${cx + arcR},${cy} A${arcR},${arcR} 0 0 0 ${cx + arcR * Math.cos(rad)},${cy - arcR * Math.sin(rad)} Z" fill="${hl}" fill-opacity="0.15" stroke="none"/><path d="M${cx + arcR},${cy} A${arcR},${arcR} 0 0 0 ${cx + arcR * Math.cos(rad)},${cy - arcR * Math.sin(rad)}" fill="none" stroke="${hl}" stroke-width="2"/>`
      const lx = cx + arcR * 1.55 * Math.cos(rad / 2)
      const ly = cy - arcR * 1.55 * Math.sin(rad / 2) + 5
      // Optional: letters: [end of ray 1, vertex, end of ray 2] e.g. ['A','B','C']
      // (three-letter naming, vertex in the middle); label: shown instead of the
      // degrees (e.g. 'α' or '?'); hide_degrees: no label at all.
      const letters: string[] = Array.isArray(data.letters) ? data.letters.map(String) : []
      const angLabel = data.hide_degrees ? '' : (data.label != null ? String(data.label) : `${deg}°`)
      const letterSvg = letters.length === 3
        ? [[x2 + 10, y2 + 5, letters[0]], [cx - 12, cy + 16, letters[1]], [x3 + (x3 < cx ? -12 : 6), y3 - 8, letters[2]]]
            .map(([x, y, t]) => `<text x="${x}" y="${y}" text-anchor="middle" font-size="15" font-weight="bold" font-family="Georgia,serif" fill="${lbl}">${escapeText(t)}</text>`).join('')
        : ''
      return svg(`<line x1="${cx}" y1="${cy}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="2.5"/><line x1="${cx}" y1="${cy}" x2="${x3}" y2="${y3}" stroke="${stroke}" stroke-width="2.5"/>${arcOrBox}${angLabel ? `<text x="${lx}" y="${ly}" text-anchor="middle" font-size="14" font-weight="bold" font-family="Georgia,serif" fill="${hl}">${escapeText(angLabel)}</text>` : ''}<circle cx="${cx}" cy="${cy}" r="3" fill="${stroke}"/>${letterSvg}`)
    }

    // ── NUMBER LINE ──────────────────────────────────────────
    case 'number_line': {
      const min = Math.round(Number(data.min ?? 0))
      const max = Math.round(Number(data.max ?? 10))
      // Accept either the singular `mark` (live app data) or the plural
      // `marked` array (worksheet-builder data) — union, not either/or.
      const marks: number[] = (data.marked ?? (data.mark != null ? [data.mark] : [])).map(Number)
      const range = Math.max(1, max - min)
      // at least ~22px between ticks; a long line gets its own wider canvas
      const pad = 24
      const w = Math.max(W, Math.min(720, range * 22 + pad * 2))
      const h = 64, y = 26
      const scale = (w - pad * 2) / range
      const every = range <= 12 ? 1 : range <= 24 ? 2 : Math.ceil(range / 12)
      const ticks = Array.from({ length: range + 1 }, (_, i) => {
        const x = pad + i * scale
        const val = min + i
        const isM = marks.includes(val)
        const showLabel = isM || val === 0 || val % every === 0
        return `<g><line x1="${x}" y1="${y - (val === 0 ? 9 : 7)}" x2="${x}" y2="${y + (val === 0 ? 9 : 7)}" stroke="${isM ? hl : stroke}" stroke-width="${isM ? 3 : val === 0 ? 2 : 1.5}"/>${isM ? `<circle cx="${x}" cy="${y}" r="6" fill="${hl}" fill-opacity="0.3"/>` : ''}${showLabel ? `<text x="${x}" y="${y + 24}" text-anchor="middle" font-size="13" font-family="Georgia,serif" fill="${isM ? hl : lbl}" font-weight="${isM || val === 0 ? 'bold' : 'normal'}">${val < 0 ? '−' + Math.abs(val) : val}</text>` : ''}</g>`
      }).join('')
      const arrow = `<polygon points="${w - pad + 10},${y} ${w - pad + 2},${y - 4} ${w - pad + 2},${y + 4}" fill="${stroke}"/>`
      const segment = data.segment
        ? `<line x1="${pad + (data.segment[0] - min) * scale}" y1="${y}" x2="${pad + (data.segment[1] - min) * scale}" y2="${y}" stroke="${hl}" stroke-width="5" opacity="0.5"/>`
        : ''
      // jumps: [{ from: -7, to: 0 }] drawn as arcs above the line (for addition on the number line)
      const jumps = (Array.isArray(data.jumps) ? data.jumps : []).map((j: any) => {
        const x1 = pad + (Number(j.from) - min) * scale, x2 = pad + (Number(j.to) - min) * scale
        const mid = (x1 + x2) / 2, hgt = Math.min(20, Math.abs(x2 - x1) / 3 + 6)
        return `<path d="M${x1},${y - 8} Q${mid},${y - 8 - hgt * 2} ${x2},${y - 8}" fill="none" stroke="${hl}" stroke-width="2" marker-end="url(#nlArrow)"/>`
      }).join('')
      const defs = jumps ? `<defs><marker id="nlArrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="${hl}"/></marker></defs>` : ''
      return `<svg viewBox="0 ${jumps ? -26 : 0} ${w} ${h + (jumps ? 26 : 0)}" width="${w}" height="${h + (jumps ? 26 : 0)}" style="max-width:100%;height:auto;direction:ltr" direction="ltr" xmlns="http://www.w3.org/2000/svg">${defs}<line x1="${pad - 6}" y1="${y}" x2="${w - pad + 4}" y2="${y}" stroke="${stroke}" stroke-width="2"/>${arrow}${segment}${jumps}${ticks}</svg>`
    }

    // ── COORDINATE GRID (Cartesian plane) ─────────────────────
    // ── DATA GRAPH (point graph of real data, first quadrant) ─
    // { type:'graph', xmax:5, ymax:40, ystep:5, xlabels:['א׳','ב׳',…], xlabel:'יום', ylabel:'תלמידים',
    //   series:[{ points:[[1,30],[2,18]], hollow:false, name:'כדורסל' }, …] }
    // Separate x / y scales, a labelled tick every ystep, category names on x,
    // filled vs hollow points for two series and a small legend.
    case 'graph': {
      const series: any[] = Array.isArray(data.series) ? data.series.slice(0, 3) : (Array.isArray(data.points) ? [{ points: data.points }] : [])
      const allPts = series.flatMap(sr => (Array.isArray(sr.points) ? sr.points : []))
      const xlabels: string[] = Array.isArray(data.xlabels) ? data.xlabels.map(String) : []
      const xmax = Math.max(1, Number(data.xmax) || xlabels.length || Math.max(1, ...allPts.map((p: any) => +p[0] || 0)))
      const ymaxRaw = Math.max(1, Number(data.ymax) || Math.max(1, ...allPts.map((p: any) => +p[1] || 0)))
      const ystep = Number(data.ystep) > 0 ? Number(data.ystep) : [1, 2, 5, 10, 20, 25, 50, 100, 200, 500, 1000].find(st => ymaxRaw / st <= 8) || Math.ceil(ymaxRaw / 8)
      const ymax = Math.ceil(ymaxRaw / ystep) * ystep
      const named = series.filter(sr => sr.name)
      const padL = 34, padB = 30, padT = named.length > 1 ? 32 : 16, padR = 12
      const gw = W - padL - padR, gh = H - padT - padB
      const X = (v: number) => padL + (v / (xmax + 0.5)) * gw
      const Y = (v: number) => padT + gh - (v / ymax) * gh
      let g = ''
      for (let v = 0; v <= ymax + 1e-9; v += ystep) {
        g += `<line x1="${padL}" y1="${Y(v)}" x2="${W - padR}" y2="${Y(v)}" stroke="${gridLn}" stroke-width="1"/>`
        g += `<text x="${padL - 6}" y="${Y(v) + 4}" text-anchor="end" font-size="12" font-weight="bold" font-family="Georgia,serif" fill="${axisTick}">${+v.toFixed(2)}</text>`
      }
      for (let i = 1; i <= xmax; i++) {
        g += `<line x1="${X(i)}" y1="${padT}" x2="${X(i)}" y2="${padT + gh}" stroke="${gridLn}" stroke-width="1"/>`
        g += `<text x="${X(i)}" y="${padT + gh + 14}" text-anchor="middle" font-size="12" font-weight="bold" font-family="Arial,sans-serif" fill="${axisTick}">${escapeText(xlabels[i - 1] ?? String(i))}</text>`
      }
      g += `<line x1="${padL}" y1="${padT + gh}" x2="${W - padR + 2}" y2="${padT + gh}" stroke="${stroke}" stroke-width="3.5"/><line x1="${padL}" y1="${padT - 4}" x2="${padL}" y2="${padT + gh}" stroke="${stroke}" stroke-width="3.5"/>`
      if (data.xlabel) g += `<text x="${W - padR}" y="${H - 2}" text-anchor="end" font-size="10" font-family="Arial,sans-serif" fill="${lbl}">${escapeText(data.xlabel)}</text>`
      if (data.ylabel) g += `<text x="${padL + 4}" y="${padT - 4}" font-size="10" font-family="Arial,sans-serif" fill="${lbl}">${escapeText(data.ylabel)}</text>`
      series.forEach((sr, k) => {
        const hollow = sr.hollow ?? k === 1
        for (const p of (Array.isArray(sr.points) ? sr.points : [])) {
          const px = +p[0], py = +p[1]
          if (!Number.isFinite(px) || !Number.isFinite(py)) continue
          g += `<circle cx="${X(px)}" cy="${Y(py)}" r="5" fill="${hollow ? '#fff' : hl}" stroke="${hollow ? hl : stroke}" stroke-width="2"/>`
          if (p[2]) g += `<text x="${X(px) + 7}" y="${Y(py) - 6}" font-size="11" font-weight="bold" font-family="Georgia,serif" fill="${hl}">${escapeText(p[2])}</text>`
        }
      })
      if (named.length > 1) {
        named.forEach((sr, k) => {
          const hollow = sr.hollow ?? series.indexOf(sr) === 1
          const lx = W - padR - 150 + k * 80, ly = 8
          g += `<circle cx="${lx}" cy="${ly}" r="4" fill="${hollow ? '#fff' : hl}" stroke="${hollow ? hl : stroke}" stroke-width="2"/><text x="${lx + 8}" y="${ly + 4}" font-size="10" font-family="Arial,sans-serif" fill="${lbl}">${escapeText(sr.name)}</text>`
        })
      }
      return svg(g)
    }

    case 'coordinate': {
      const steps = data.steps || data.range || 5
      // quadrant:1 → first quadrant only (0..steps on both axes), as taught in 7th grade
      const q1 = data.quadrant === 1 || data.quadrant === '1'
      const pad = 28
      const inner = Math.min(W, H) - pad * 2
      const step = q1 ? inner / steps : inner / (steps * 2)
      const cx = q1 ? pad : W / 2, cy = q1 ? H - pad : H / 2
      // Points may be [x,y] or [x,y,label] — an explicit label overrides
      // the default "(x,y)" annotation.
      const points: [number, number, string?][] = data.points || []

      const nLines = q1 ? steps + 1 : steps * 2 + 1
      let gridLines = ''
      for (let i = 0; i < nLines; i++) {
        const pos = pad + i * step
        gridLines += `<line x1="${pos}" y1="${pad}" x2="${pos}" y2="${H - pad}" stroke="${gridLn}" stroke-width="1.5"/><line x1="${pad}" y1="${pos}" x2="${W - pad}" y2="${pos}" stroke="${gridLn}" stroke-width="1.5"/>`
      }

      let tickLabels = ''
      const every = Math.max(1, Math.ceil((q1 ? steps : steps * 2) / 10))
      for (let i = 0; i < nLines; i++) {
        const val = q1 ? i : i - steps
        if (val !== 0 && val % every !== 0) continue
        if (val === 0) { if (q1) tickLabels += `<text x="${cx - 10}" y="${cy + 14}" text-anchor="middle" font-size="13" font-weight="bold" font-family="Georgia,serif" fill="${axisTick}">0</text>`; continue }
        const x = cx + val * step
        tickLabels += `<text x="${x}" y="${cy + 14}" text-anchor="middle" font-size="13" font-weight="bold" font-family="Georgia,serif" fill="${axisTick}">${val}</text><text x="${cx - 13}" y="${cy - val * step + 5}" text-anchor="middle" font-size="13" font-weight="bold" font-family="Georgia,serif" fill="${axisTick}">${val}</text>`
      }

      const plotted = (points as any[]).map(([px, py, ptLabel, style]) => {
        const svgX = cx + px * step, svgY = cy - py * step
        const text = ptLabel ?? `(${px},${py})`
        const hollow = style === 'hollow'
        return `<circle cx="${svgX}" cy="${svgY}" r="5" fill="${hollow ? '#fff' : hl}" stroke="${hollow ? hl : stroke}" stroke-width="${hollow ? 2 : 1.5}"/><text x="${svgX + 8}" y="${svgY - 6}" font-size="11" font-weight="bold" font-family="Georgia,serif" fill="${hl}">${escapeText(text)}</text>`
      }).join('')

      const connector = points.length === 2
        ? `<line x1="${cx + points[0][0] * step}" y1="${cy - points[0][1] * step}" x2="${cx + points[1][0] * step}" y2="${cy - points[1][1] * step}" stroke="${hl}" stroke-width="2"${data.dashed ? ' stroke-dasharray="5,4"' : ''}/>`
        : ''

      const axes = `<line x1="${cx}" y1="${pad - 4}" x2="${cx}" y2="${H - pad + 4}" stroke="${stroke}" stroke-width="3.5"/><line x1="${pad - 4}" y1="${cy}" x2="${W - pad + 4}" y2="${cy}" stroke="${stroke}" stroke-width="3.5"/><polygon points="${cx},${pad - 4} ${cx - 4},${pad + 6} ${cx + 4},${pad + 6}" fill="${stroke}"/><polygon points="${W - pad + 4},${cy} ${W - pad - 6},${cy - 4} ${W - pad - 6},${cy + 4}" fill="${stroke}"/><text x="${cx + 6}" y="${pad + 12}" font-size="14" font-weight="bold" font-family="Georgia,serif" fill="${lbl}">y</text><text x="${W - pad + 6}" y="${cy + 4}" font-size="14" font-weight="bold" font-family="Georgia,serif" fill="${lbl}">x</text>`

      // Optional extras (grade 7): vlines:[x] → the line x=a, hlines:[y] → y=b,
      // polygon:[[x,y],…] → a shape such as a rectangle, segments:[[[x1,y1],[x2,y2]],…].
      const inRange = (v: number) => (q1 ? v >= 0 : Math.abs(v) <= steps) && Math.abs(v) <= steps
      const vlines = (Array.isArray(data.vlines) ? data.vlines : []).filter((v: any) => Number.isFinite(+v) && inRange(+v))
        .map((v: any) => `<line x1="${cx + +v * step}" y1="${pad}" x2="${cx + +v * step}" y2="${H - pad}" stroke="${hl}" stroke-width="2" stroke-dasharray="6,4"/><text x="${cx + +v * step + 4}" y="${pad + 10}" font-size="10" font-family="Georgia,serif" fill="${hl}">x=${+v}</text>`).join('')
      const hlines = (Array.isArray(data.hlines) ? data.hlines : []).filter((v: any) => Number.isFinite(+v) && inRange(+v))
        .map((v: any) => `<line x1="${pad}" y1="${cy - +v * step}" x2="${W - pad}" y2="${cy - +v * step}" stroke="${hl}" stroke-width="2" stroke-dasharray="6,4"/><text x="${pad + 2}" y="${cy - +v * step - 4}" font-size="10" font-family="Georgia,serif" fill="${hl}">y=${+v}</text>`).join('')
      const poly = Array.isArray(data.polygon) && data.polygon.length >= 3
        ? `<polygon points="${data.polygon.map(([px, py]: number[]) => `${cx + px * step},${cy - py * step}`).join(' ')}" fill="${hl}" fill-opacity="0.13" stroke="${hl}" stroke-width="2"/>`
        : ''
      const segs = (Array.isArray(data.segments) ? data.segments : []).map((sg: any) =>
        Array.isArray(sg) && sg.length === 2
          ? `<line x1="${cx + sg[0][0] * step}" y1="${cy - sg[0][1] * step}" x2="${cx + sg[1][0] * step}" y2="${cy - sg[1][1] * step}" stroke="${hl}" stroke-width="3"/>`
          : '').join('')
      return svg(`${gridLines}${axes}${tickLabels}${vlines}${hlines}${poly}${segs}${plotted}${connector}`)
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
      // Kid-friendly step visuals (objects, groups, share, base_ten, clock, …)
      return renderKidVisual(data, { W, H, stroke, hl, lbl, fill, dark })
  }
}

// ─────────────────────────────────────────────────────────────
//  Visual data type definitions (for seeding questions)
// ─────────────────────────────────────────────────────────────
//
// FRACTION BAR:    { type:'fraction',         n:3, d:4 }
// FRACTION PIE:    { type:'fraction_pie',     n:1, d:8 }
// FRACTION COMPARE:{ type:'fraction_compare', a:{n:3,d:4}, b:{n:2,d:3} }  // both bars fully unfilled, partition-only
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
