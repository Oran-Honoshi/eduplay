// ─────────────────────────────────────────────────────────────
//  Kid-friendly visuals for step-by-step solutions (K–3 first).
//  Called from renderMathVisualSVG's default branch, so every
//  existing caller (lesson MathVisual, worksheet builder) picks
//  these up with no other changes.
//
//  { type:'objects',  icon:'apple', count:5, crossed:2, circled:3 }
//  { type:'groups',   groups:5, each:2, icon:'star' }
//  { type:'share',    total:12, groups:3, icon:'candy' }
//  { type:'array',    rows:3, cols:4 }
//  { type:'base_ten', hundreds:0, tens:8, ones:7 }
//  { type:'bar_model', parts:[5,3], labels?:['',''], total:'?' }
//  { type:'clock',    h:3, m:30 }
//  { type:'highlight_text', text:'The baby is sleeping now.', highlight:['is sleeping','now'] }
//  { type:'word_parts', parts:['sun','shine'] }
// ─────────────────────────────────────────────────────────────

export interface KidVisualCtx {
  W: number; H: number
  stroke: string; hl: string; lbl: string; fill: string; dark: boolean
}

const esc = (v: any) => String(v ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const n = (v: any, d = 0) => { const x = Number(v); return Number.isFinite(x) ? x : d }

// Simple flat icons drawn from primitives (no emoji, so they print the same everywhere).
function icon(kind: string, cx: number, cy: number, r: number): string {
  switch (kind) {
    case 'star': {
      const pts = Array.from({ length: 10 }, (_, i) => {
        const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r
        return `${cx + rr * Math.cos(a)},${cy + rr * Math.sin(a)}`
      }).join(' ')
      return `<polygon points="${pts}" fill="#F4C430" stroke="#B7862F" stroke-width="1"/>`
    }
    case 'candy':
      return `<polygon points="${cx - r * 1.3},${cy - r * 0.5} ${cx - r * 0.7},${cy} ${cx - r * 1.3},${cy + r * 0.5}" fill="#E05BA0"/><polygon points="${cx + r * 1.3},${cy - r * 0.5} ${cx + r * 0.7},${cy} ${cx + r * 1.3},${cy + r * 0.5}" fill="#E05BA0"/><circle cx="${cx}" cy="${cy}" r="${r * 0.75}" fill="#F48FB1" stroke="#C2185B" stroke-width="1"/>`
    case 'ball':
      return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#4A7FD4" stroke="#1E3A8A" stroke-width="1"/><path d="M${cx - r} ${cy} Q${cx} ${cy - r * 0.6} ${cx + r} ${cy}" fill="none" stroke="#fff" stroke-width="1.5"/>`
    case 'flower':
      return [0, 72, 144, 216, 288].map(a => {
        const t = a * Math.PI / 180
        return `<circle cx="${cx + r * 0.55 * Math.cos(t)}" cy="${cy + r * 0.55 * Math.sin(t)}" r="${r * 0.42}" fill="#F48FB1"/>`
      }).join('') + `<circle cx="${cx}" cy="${cy}" r="${r * 0.35}" fill="#F4C430"/>`
    case 'coin':
      return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#F4C430" stroke="#B7862F" stroke-width="1.5"/><circle cx="${cx}" cy="${cy}" r="${r * 0.65}" fill="none" stroke="#B7862F" stroke-width="1"/>`
    case 'cookie':
      return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#D9A066" stroke="#8B5A2B" stroke-width="1"/>` +
        [[-0.35, -0.3], [0.3, -0.2], [0, 0.35], [-0.3, 0.3], [0.35, 0.3]].map(([dx, dy]) => `<circle cx="${cx + dx * r}" cy="${cy + dy * r}" r="${r * 0.12}" fill="#5C3A1E"/>`).join('')
    case 'fish':
      return `<ellipse cx="${cx - r * 0.15}" cy="${cy}" rx="${r * 0.8}" ry="${r * 0.5}" fill="#2EC4B6"/><polygon points="${cx + r * 0.6},${cy} ${cx + r * 1.1},${cy - r * 0.45} ${cx + r * 1.1},${cy + r * 0.45}" fill="#2EC4B6"/><circle cx="${cx - r * 0.55}" cy="${cy - r * 0.1}" r="${r * 0.1}" fill="#1E2D4E"/>`
    case 'car':
      return `<rect x="${cx - r}" y="${cy - r * 0.3}" width="${r * 2}" height="${r * 0.7}" rx="${r * 0.2}" fill="#E8724C"/><rect x="${cx - r * 0.55}" y="${cy - r * 0.75}" width="${r * 1.1}" height="${r * 0.5}" rx="${r * 0.15}" fill="#E8724C"/><circle cx="${cx - r * 0.55}" cy="${cy + r * 0.45}" r="${r * 0.25}" fill="#1E2D4E"/><circle cx="${cx + r * 0.55}" cy="${cy + r * 0.45}" r="${r * 0.25}" fill="#1E2D4E"/>`
    case 'pencil':
      return `<rect x="${cx - r}" y="${cy - r * 0.25}" width="${r * 1.5}" height="${r * 0.5}" fill="#F4C430"/><polygon points="${cx + r * 0.5},${cy - r * 0.25} ${cx + r},${cy} ${cx + r * 0.5},${cy + r * 0.25}" fill="#D9A066"/>`
    case 'apple':
    default:
      return `<circle cx="${cx}" cy="${cy + r * 0.08}" r="${r}" fill="#E53935" stroke="#B71C1C" stroke-width="1"/><line x1="${cx}" y1="${cy - r * 0.85}" x2="${cx + r * 0.15}" y2="${cy - r * 1.25}" stroke="#5C3A1E" stroke-width="2"/><ellipse cx="${cx + r * 0.45}" cy="${cy - r * 1.05}" rx="${r * 0.32}" ry="${r * 0.16}" fill="#43A047"/>`
  }
}

function cross(cx: number, cy: number, r: number) {
  const d = r * 1.1
  return `<line x1="${cx - d}" y1="${cy - d}" x2="${cx + d}" y2="${cy + d}" stroke="#DC2626" stroke-width="3" stroke-linecap="round"/><line x1="${cx + d}" y1="${cy - d}" x2="${cx - d}" y2="${cy + d}" stroke="#DC2626" stroke-width="3" stroke-linecap="round"/>`
}

export function renderKidVisual(data: any, c: KidVisualCtx): string {
  const { W, H, stroke, hl, lbl, dark } = c
  const svg = (inner: string, w = W, h = H) =>
    `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`
  const text = (x: number, y: number, t: any, size = 13, weight = 'bold', col = lbl) =>
    `<text x="${x}" y="${y}" text-anchor="middle" font-size="${size}" font-weight="${weight}" font-family="Nunito,Arial,sans-serif" fill="${col}">${esc(t)}</text>`

  switch (data.type) {
    // Count / add / subtract: the last `crossed` items get a red X; the rest
    // (or `circled` of them) are ringed together as "what's left".
    case 'objects': {
      const count = Math.max(0, Math.min(30, n(data.count, 0)))
      const crossed = Math.max(0, Math.min(count, n(data.crossed, 0)))
      const circled = data.circled != null ? Math.max(0, Math.min(count - crossed, n(data.circled))) : 0
      const perRow = count <= 5 ? count : count <= 10 ? 5 : Math.ceil(count / Math.ceil(count / 6))
      const rows = Math.max(1, Math.ceil(count / Math.max(1, perRow)))
      const cell = Math.min((W - 20) / Math.max(1, perRow), (H - 20) / rows, 44)
      const r = cell * 0.32
      const ox = (W - cell * perRow) / 2, oy = (H - cell * rows) / 2
      let out = ''
      const pos = (i: number) => [ox + (i % perRow) * cell + cell / 2, oy + Math.floor(i / perRow) * cell + cell / 2]
      if (circled > 0) {
        // ring each kept item (simple and readable even when it wraps rows)
        for (let i = 0; i < circled; i++) {
          const [x, y] = pos(i)
          out += `<circle cx="${x}" cy="${y}" r="${r * 1.55}" fill="none" stroke="${hl}" stroke-width="2.5" stroke-dasharray="4,3"/>`
        }
      }
      for (let i = 0; i < count; i++) {
        const [x, y] = pos(i)
        const isCrossed = i >= count - crossed
        out += `<g opacity="${isCrossed ? 0.45 : 1}">${icon(data.icon, x, y, r)}</g>`
        if (isCrossed) out += cross(x, y, r)
      }
      return svg(out)
    }

    // Multiplication as equal groups: `groups` boxes with `each` items.
    case 'groups': {
      const g = Math.max(1, Math.min(10, n(data.groups, 1)))
      const each = Math.max(1, Math.min(12, n(data.each, 1)))
      const perRow = g <= 5 ? g : Math.ceil(g / 2)
      const rows = Math.ceil(g / perRow)
      const bw = (W - 10) / perRow, bh = Math.min((H - 30) / rows, bw * 1.2)
      const inner = Math.ceil(Math.sqrt(each))
      const r = Math.min(bw, bh) / (inner * 2.8)
      let out = ''
      for (let k = 0; k < g; k++) {
        const bx = 5 + (k % perRow) * bw, by = (H - 24 - bh * rows) / 2 + Math.floor(k / perRow) * bh
        out += `<rect x="${bx + 3}" y="${by + 3}" width="${bw - 6}" height="${bh - 6}" rx="10" fill="${hl}" fill-opacity="0.1" stroke="${stroke}" stroke-width="1.5"/>`
        for (let i = 0; i < each; i++) {
          const cx = bx + bw / 2 + ((i % inner) - (inner - 1) / 2) * r * 2.6
          const cy = by + bh / 2 + (Math.floor(i / inner) - (Math.ceil(each / inner) - 1) / 2) * r * 2.6
          out += icon(data.icon || 'star', cx, cy, r)
        }
      }
      out += text(W / 2, Math.min(H - 6, (H - 24 - bh * rows) / 2 + bh * rows + 20), `${g} × ${each} = ${g * each}`, 14)
      return svg(out)
    }

    // Division as fair sharing: `total` items dealt onto `groups` plates.
    case 'share': {
      const g = Math.max(1, Math.min(8, n(data.groups, 1)))
      const total = Math.max(0, Math.min(48, n(data.total, 0)))
      const each = Math.floor(total / g), rest = total - each * g
      const pw = (W - 10) / g, pr = Math.min(pw * 0.45, (H - 40) / 2.2)
      const cy = H / 2 - 8
      const inner = Math.max(1, Math.ceil(Math.sqrt(each)))
      const r = Math.max(4, pr / (inner * 1.6))
      let out = ''
      for (let k = 0; k < g; k++) {
        const cx = 5 + k * pw + pw / 2
        out += `<ellipse cx="${cx}" cy="${cy}" rx="${pr}" ry="${pr * 0.85}" fill="${dark ? '#333' : '#fff'}" stroke="${stroke}" stroke-width="1.5"/>`
        for (let i = 0; i < each; i++) {
          const x = cx + ((i % inner) - (inner - 1) / 2) * r * 2.3
          const y = cy + (Math.floor(i / inner) - (Math.ceil(each / inner) - 1) / 2) * r * 2.3
          out += icon(data.icon || 'candy', x, y, r)
        }
      }
      out += text(W / 2, H - 8, rest ? `${total} ÷ ${g} = ${each} (${rest})` : `${total} ÷ ${g} = ${each}`, 14)
      return svg(out)
    }

    case 'array': {
      const rows = Math.max(1, Math.min(12, n(data.rows, 1)))
      const cols = Math.max(1, Math.min(12, n(data.cols, 1)))
      const cell = Math.min((W - 20) / cols, (H - 36) / rows)
      const ox = (W - cell * cols) / 2, oy = 8
      let out = ''
      for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++)
        out += `<circle cx="${ox + j * cell + cell / 2}" cy="${oy + i * cell + cell / 2}" r="${cell * 0.32}" fill="${hl}"/>`
      out += text(W / 2, H - 8, `${rows} × ${cols} = ${rows * cols}`, 14)
      return svg(out)
    }

    // Place value blocks: hundreds = 10×10 flats, tens = rods, ones = cubes.
    case 'base_ten': {
      const hu = Math.max(0, Math.min(5, n(data.hundreds))), te = Math.max(0, Math.min(9, n(data.tens))), on = Math.max(0, Math.min(9, n(data.ones)))
      const u = Math.min(W / 60, 6)
      let x = 8, out = ''
      const top = 12
      for (let i = 0; i < hu; i++) {
        out += `<rect x="${x}" y="${top}" width="${u * 10}" height="${u * 10}" fill="#4A7FD4" stroke="#1E3A8A"/>`
        for (let k = 1; k < 10; k++) out += `<line x1="${x + k * u}" y1="${top}" x2="${x + k * u}" y2="${top + u * 10}" stroke="#1E3A8A" stroke-width=".5"/><line x1="${x}" y1="${top + k * u}" x2="${x + u * 10}" y2="${top + k * u}" stroke="#1E3A8A" stroke-width=".5"/>`
        x += u * 10 + 6
      }
      const rodX = x
      for (let i = 0; i < te; i++) {
        out += `<rect x="${x}" y="${top}" width="${u}" height="${u * 10}" fill="#2EC4B6" stroke="#0F766E"/>`
        for (let k = 1; k < 10; k++) out += `<line x1="${x}" y1="${top + k * u}" x2="${x + u}" y2="${top + k * u}" stroke="#0F766E" stroke-width=".5"/>`
        x += u + 4
      }
      const onesX = x + 6
      for (let i = 0; i < on; i++)
        out += `<rect x="${onesX + (i % 3) * (u + 3)}" y="${top + u * 10 - u - Math.floor(i / 3) * (u + 3)}" width="${u}" height="${u}" fill="#F4A340" stroke="#B7862F"/>`
      const value = hu * 100 + te * 10 + on
      const labelY = top + u * 10 + 22
      // Expanded form reads the same in Hebrew and English: 100 + 80 + 7
      const parts = [hu ? hu * 100 : 0, te ? te * 10 : 0, on].filter(Boolean).join(' + ')
      out += text(W / 2, labelY, value, 16)
      out += text(W / 2, labelY + 18, parts, 12, 'normal')
      void rodX
      return svg(out, Math.max(W, x + 40), labelY + 26)
    }

    // Bar model: parts side by side, total bracket on top.
    case 'bar_model': {
      const parts: number[] = (Array.isArray(data.parts) ? data.parts : []).map((p: any) => Math.max(0, n(p))).filter((p: number) => p > 0)
      if (!parts.length) return ''
      const sum = parts.reduce((a, b) => a + b, 0)
      const bw = W - 20, y = H / 2 - 4, bh = 34
      let x = 10, out = ''
      const colors = [hl, '#F4A340', '#2EC4B6', '#E05BA0']
      parts.forEach((p, i) => {
        const w = bw * p / sum
        out += `<rect x="${x}" y="${y}" width="${w}" height="${bh}" fill="${colors[i % colors.length]}" fill-opacity="0.2" stroke="${stroke}" stroke-width="1.5"/>`
        out += text(x + w / 2, y + bh / 2 + 5, data.labels?.[i] || p, 14)
        x += w
      })
      out += `<path d="M10 ${y - 8} L10 ${y - 16} L${10 + bw} ${y - 16} L${10 + bw} ${y - 8}" fill="none" stroke="${stroke}" stroke-width="1.5"/>`
      out += text(W / 2, y - 22, data.total ?? sum, 15)
      return svg(out)
    }

    case 'clock': {
      const h = n(data.h, 12) % 12, m = Math.max(0, Math.min(59, n(data.m, 0)))
      const cx = W / 2, cy = H / 2, R = Math.min(W, H) / 2 - 10
      let out = `<circle cx="${cx}" cy="${cy}" r="${R}" fill="${dark ? '#222' : '#fff'}" stroke="${stroke}" stroke-width="3"/>`
      for (let i = 1; i <= 12; i++) {
        const a = (i / 12) * 2 * Math.PI - Math.PI / 2
        out += text(cx + Math.cos(a) * R * 0.78, cy + Math.sin(a) * R * 0.78 + 5, i, 14)
      }
      const ma = (m / 60) * 2 * Math.PI - Math.PI / 2
      const ha = ((h + m / 60) / 12) * 2 * Math.PI - Math.PI / 2
      out += `<line x1="${cx}" y1="${cy}" x2="${cx + Math.cos(ha) * R * 0.5}" y2="${cy + Math.sin(ha) * R * 0.5}" stroke="${stroke}" stroke-width="5" stroke-linecap="round"/>`
      out += `<line x1="${cx}" y1="${cy}" x2="${cx + Math.cos(ma) * R * 0.75}" y2="${cy + Math.sin(ma) * R * 0.75}" stroke="${hl}" stroke-width="3" stroke-linecap="round"/>`
      out += `<circle cx="${cx}" cy="${cy}" r="4" fill="${stroke}"/>`
      return svg(out)
    }

    // Language: highlight key words. Rendered as HTML inside the SVG so text
    // wraps and right-to-left Hebrew lays out correctly.
    case 'highlight_text': {
      const raw = String(data.text ?? '')
      const marks: string[] = Array.isArray(data.highlight) ? data.highlight.filter(Boolean) : []
      let html = esc(raw)
      marks.sort((a, b) => b.length - a.length).forEach(m => {
        const e = esc(m)
        html = html.split(e).join(`<mark style="background:rgba(244,163,64,.28);color:inherit;border-bottom:3px solid ${hl};padding:0 2px;border-radius:3px">${e}</mark>`)
      })
      const rtl = /[֐-׿]/.test(raw)
      const w = Math.max(W, 280), h = 110
      return svg(`<foreignObject x="0" y="0" width="${w}" height="${h}"><div xmlns="http://www.w3.org/1999/xhtml" dir="${rtl ? 'rtl' : 'ltr'}" style="font-family:Nunito,Arial,sans-serif;font-size:20px;line-height:1.6;color:${lbl};padding:10px;text-align:center">${html}</div></foreignObject>`, w, h)
    }

    case 'word_parts': {
      const parts: string[] = (Array.isArray(data.parts) ? data.parts : []).map(String).slice(0, 4)
      if (!parts.length) return ''
      const rtl = parts.some(p => /[֐-׿]/.test(p))
      const boxW = 70, gap = 26, total = parts.length * boxW + (parts.length - 1) * gap
      const w = Math.max(W, total + 20), y = 20
      let x = (w - total) / 2, out = ''
      const seq = rtl ? [...parts].reverse() : parts
      seq.forEach((p, i) => {
        out += `<rect x="${x}" y="${y}" width="${boxW}" height="40"  rx="8" fill="${hl}" fill-opacity="0.13" stroke="${hl}" stroke-width="2"/>` + text(x + boxW / 2, y + 26, p, 16)
        if (i < seq.length - 1) out += text(x + boxW + gap / 2, y + 27, '+', 18)
        x += boxW + gap
      })
      out += text(w / 2, y + 80, '= ' + parts.join(''), 18)
      return svg(out, w, 120)
    }

    default:
      return ''
  }
}
