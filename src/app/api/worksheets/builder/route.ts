import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const supabase = createServerClient()
  const { searchParams } = new URL(req.url)

  const childId       = searchParams.get('childId')
  const topicIds      = searchParams.get('topicIds')?.split(',').filter(Boolean) || []
  const questionIds   = searchParams.get('questionIds')?.split(',').filter(Boolean) || []
  const difficulty    = searchParams.get('difficulty') || 'mixed'
  const questionCount = parseInt(searchParams.get('questionCount') || '20')
  const langMode      = searchParams.get('lang') || 'bilingual'
  const includeKey    = searchParams.get('answerKey') === 'true'
  const wsType        = searchParams.get('wsType') || 'practice'
  const includeHints  = searchParams.get('includeHints') === 'true'
  const solutionSteps = searchParams.get('solutionSteps') === 'true'
  const preview       = searchParams.get('preview') === 'true'

  if (!childId || topicIds.length === 0) {
    return NextResponse.json({ error: 'childId and topicIds required' }, { status: 400 })
  }

  try {
    const { data: child } = await supabase
      .from('children').select('*').eq('id', childId).single()

    const { data: topics } = await supabase
      .from('topics')
      .select('*, subject:subjects(*)')
      .in('id', topicIds)
      .order('sort_order')

    if (!child || !topics || topics.length === 0) {
      return NextResponse.json({ error: 'Child or topics not found' }, { status: 404 })
    }

    let finalQuestions: any[] = []

    if (questionIds.length > 0) {
      const { data: selectedQs } = await supabase
        .from('questions').select('*').in('id', questionIds)
      finalQuestions = (selectedQs || []).map(q => {
        const topic = topics.find(t => t.id === q.topic_id)
        return { ...q, topicTitle: topic?.title_en || '', topicTitleHe: topic?.title_he || '' }
      })
    } else {
      const qPerTopic = Math.max(2, Math.ceil(questionCount / topics.length))
      for (const topic of topics) {
        const difficulties = difficulty === 'mixed' ? ['easy', 'medium', 'hard'] : [difficulty]
        for (const diff of difficulties) {
          const limit = difficulty === 'mixed' ? Math.max(1, Math.ceil(qPerTopic / 3)) : qPerTopic
          const { data: qs } = await supabase
            .from('questions').select('*')
            .eq('topic_id', topic.id)
            .eq('difficulty', diff)
            .eq('approved', true)
            .limit(limit)
          if (qs) finalQuestions.push(...qs.map(q => ({
            ...q, topicTitle: topic.title_en, topicTitleHe: topic.title_he,
          })))
        }
      }
      finalQuestions = finalQuestions.sort(() => Math.random() - 0.5).slice(0, questionCount)
    }

    if (preview) {
      return NextResponse.json({
        questions: finalQuestions.map(q => ({
          id: q.id, topic_id: q.topic_id, topicTitle: q.topicTitle,
          difficulty: q.difficulty, q_type: q.q_type,
          prompt_en: q.prompt_en, prompt_he: q.prompt_he,
          correct_answer: q.correct_answer, has_visual: !!q.visual_data,
        })),
        child, topics,
      })
    }

    if (finalQuestions.length === 0) {
      return new NextResponse(noQuestionsHTML(child), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      })
    }

    const subject = topics[0]?.subject
    const html = generateHTML({
      child, topics, questions: finalQuestions,
      difficulty, langMode, includeKey,
      wsType, includeHints, solutionSteps,
      date: new Date().toLocaleDateString('en-GB'),
      subject,
    })

    // ── Auto-save questions back to DB (fire-and-forget) ─────────
    try {
      const toSave = finalQuestions
        .filter((q: any) => q.prompt_en && q.topic_id)
        .map((q: any) => {
          const topic = topics.find((t: any) => t.id === q.topic_id)
          return {
            topic_slug: topic?.slug, difficulty: q.difficulty || difficulty,
            q_type: q.q_type || 'multiple_choice', prompt_en: q.prompt_en,
            prompt_he: q.prompt_he || null, options: q.options || null,
            correct_answer: q.correct_answer, hint_en: q.hint_en || null,
            hint_he: q.hint_he || null, explanation_en: q.explanation_en || null,
            visual_data: q.visual_data || null, approved: true,
          }
        })
        .filter((q: any) => q.topic_slug)

      if (toSave.length > 0) {
        void (async () => {
          try {
            await supabase.from('questions').upsert(
              toSave.map((q: any) => {
                const topic = topics.find((t: any) => t.slug === q.topic_slug)
                return { ...q, topic_id: topic?.id, source: 'worksheet_builder' }
              }).filter((q: any) => q.topic_id),
              { onConflict: 'topic_id,prompt_en', ignoreDuplicates: true }
            )
          } catch {}
        })()
      }
    } catch {}

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// ── Value renderer (fractions, mixed numbers) ─────────────────
function renderValue(value: string): string {
  if (!value) return ''
  const mixedMatch = value.match(/^(\d+)\s+and\s+(\d+)[/](\d+)$/)
  if (mixedMatch) {
    return `${mixedMatch[1]}&thinsp;<span style="display:inline-table;vertical-align:middle;text-align:center;font-family:'Times New Roman',serif;margin:0 3px;"><span style="display:table-row;"><span style="display:table-cell;padding-bottom:1px;font-weight:700;font-size:13px;border-bottom:1.5px solid #1a1a2e;">${mixedMatch[2]}</span></span><span style="display:table-row;"><span style="display:table-cell;padding-top:1px;font-weight:700;font-size:13px;">${mixedMatch[3]}</span></span></span>`
  }
  const fracMatch = value.match(/^(\d+)[/](\d+)$/)
  if (fracMatch) {
    return `<span style="display:inline-table;vertical-align:middle;text-align:center;font-family:'Times New Roman',serif;margin:0 3px;"><span style="display:table-row;"><span style="display:table-cell;padding-bottom:1px;font-weight:700;font-size:13px;border-bottom:1.5px solid #1a1a2e;">${fracMatch[1]}</span></span><span style="display:table-row;"><span style="display:table-cell;padding-top:1px;font-weight:700;font-size:13px;">${fracMatch[2]}</span></span></span>`
  }
  if (value.includes(',') && value.includes('/')) {
    return value.split(',').map(v => renderValue(v.trim())).join(', ')
  }
  return value
}

// ── SVG Math Visual renderer ──────────────────────────────────
// Converts visual_data JSON → inline SVG string for PDF output
function renderMathVisualSVG(data: any, color = '#4A7FD4'): string {
  if (!data?.type) return ''

  const W = 200, H = 160
  const stroke = '#1E2D4E'
  const fill   = `${color}1A`
  const hl     = color
  const lbl    = '#1E2D4E'

  function label(x: number, y: number, text: string, size = 11, weight = 'bold', col = lbl): string {
    return `<text x="${x}" y="${y}" text-anchor="middle" font-size="${size}" font-weight="${weight}" font-family="Georgia,serif" fill="${col}">${text}</text>`
  }

  function dimLine(x1: number, y1: number, x2: number, y2: number, text: string): string {
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2
    const offset = y1 === y2 ? -12 : 12
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${hl}" stroke-width="1" stroke-dasharray="3,2"/>
    ${label(mx, my + (y1 === y2 ? -8 : 4), text, 10, 'bold', hl)}`
  }

  switch (data.type) {

    // ── FRACTION BAR ────────────────────────────────────────
    case 'fraction': {
      const total = data.d || 4, filled = data.n || 1
      const bw = Math.min(38, (W - 40) / total), bh = 34
      const sx = (W - total * bw) / 2, y = H / 2 - bh / 2
      const boxes = Array.from({ length: total }, (_, i) =>
        `<rect x="${sx + i * bw}" y="${y}" width="${bw - 2}" height="${bh}"
          fill="${i < filled ? hl : '#F0F4FF'}" stroke="${stroke}" stroke-width="1.5" rx="2"/>`
      ).join('')
      return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
        ${boxes}
        ${label(W / 2, y + bh + 20, `${filled}/${total}`, 13)}
      </svg>`
    }

    // ── FRACTION PIE ────────────────────────────────────────
    case 'fraction_pie': {
      const total = data.d || 4, filled = data.n || 1
      const cx = W / 2, cy = H / 2 - 8, r = Math.min(W, H) * 0.32
      const slices = Array.from({ length: total }, (_, i) => {
        const a1 = (i / total) * 2 * Math.PI - Math.PI / 2
        const a2 = ((i + 1) / total) * 2 * Math.PI - Math.PI / 2
        const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1)
        const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2)
        const lg = (a2 - a1) > Math.PI ? 1 : 0
        return `<path d="M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${lg} 1 ${x2},${y2} Z"
          fill="${i < filled ? hl : '#F0F4FF'}" stroke="${stroke}" stroke-width="1.5"/>`
      }).join('')
      return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
        ${slices}
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${stroke}" stroke-width="2"/>
        ${label(W / 2, cy + r + 22, `${filled}/${total}`, 13)}
      </svg>`
    }

    // ── TRIANGLE ────────────────────────────────────────────
    case 'triangle': {
      const pad = 28
      const kind = data.kind || 'scalene'
      let pts: [number, number][]
      if (kind === 'right')                            pts = [[pad, H - pad], [W - pad, H - pad], [pad, pad + 10]]
      else if (kind === 'isosceles' || kind === 'equilateral') pts = [[pad, H - pad], [W - pad, H - pad], [W / 2, pad + 5]]
      else                                              pts = [[pad + 10, H - pad], [W - pad, H - pad], [pad + W * 0.28, pad + 14]]

      const [A, B, C] = pts
      const poly = pts.map(p => p.join(',')).join(' ')
      const sides: string[] = data.sides || []
      const angles: string[] = data.angles || []

      // Side label positions
      const sideLbls = [
        sides[0] ? dimLine(A[0], A[1], B[0], B[1], sides[0]) : '',
        sides[1] ? dimLine(B[0], B[1], C[0], C[1], sides[1]) : '',
        sides[2] ? dimLine(A[0], A[1], C[0], C[1], sides[2]) : '',
      ].join('')

      // Right angle box
      const rightAngle = kind === 'right'
        ? `<rect x="${A[0]}" y="${A[1] - 14}" width="14" height="14" fill="none" stroke="${stroke}" stroke-width="1.5"/>` : ''

      return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
        <polygon points="${poly}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
        ${rightAngle}
        ${sideLbls}
        ${angles[0] ? label(A[0] + 18, A[1] - 6, angles[0], 10, 'bold', hl) : ''}
        ${angles[1] ? label(B[0] - 18, B[1] - 6, angles[1], 10, 'bold', hl) : ''}
        ${angles[2] ? label(C[0], C[1] + 16, angles[2], 10, 'bold', hl) : ''}
      </svg>`
    }

    // ── RECTANGLE / SQUARE ──────────────────────────────────
    case 'rectangle':
    case 'square': {
      const pad = 30
      const rw = W - pad * 2, rh = H - pad * 2
      const w = data.w || (data.type === 'square' ? '5' : '8')
      const h = data.h || (data.type === 'square' ? '5' : '4')
      return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
        <rect x="${pad}" y="${pad}" width="${rw}" height="${rh}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
        ${label(W / 2, pad - 8, w, 11, 'bold', hl)}
        ${label(pad - 12, H / 2, h, 11, 'bold', hl)}
        ${data.area ? label(W / 2, H / 2 + 5, `A = ${data.area}`, 11, 'bold', lbl) : ''}
      </svg>`
    }

    // ── CIRCLE ──────────────────────────────────────────────
    case 'circle': {
      const cx = W / 2, cy = H / 2 - 5
      const r = Math.min(W, H) * 0.33
      const radius = data.r || data.radius || ''
      const diameter = data.d || data.diameter || ''
      return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
        ${radius ? `<line x1="${cx}" y1="${cy}" x2="${cx + r}" y2="${cy}" stroke="${hl}" stroke-width="1.5"/>
          ${label(cx + r / 2, cy - 8, `r = ${radius}`, 10, 'bold', hl)}` : ''}
        ${diameter ? `<line x1="${cx - r}" y1="${cy}" x2="${cx + r}" y2="${cy}" stroke="${hl}" stroke-width="1.5" stroke-dasharray="4,2"/>
          ${label(cx, cy - 10, `d = ${diameter}`, 10, 'bold', hl)}` : ''}
        ${data.area ? label(cx, cy + 6, `A = ${data.area}`, 11, 'bold', lbl) : ''}
      </svg>`
    }

    // ── PARALLELOGRAM ───────────────────────────────────────
    case 'parallelogram': {
      const offset = 28, pad = 22
      const pts = `${pad + offset},${pad} ${W - pad},${pad} ${W - pad - offset},${H - pad} ${pad},${H - pad}`
      const base = data.base || data.b || ''
      const height = data.h || data.height || ''
      return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
        <polygon points="${pts}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
        ${base ? label(W / 2, H - pad + 16, `b = ${base}`, 10, 'bold', hl) : ''}
        ${height ? `<line x1="${pad + offset}" y1="${pad}" x2="${pad + offset}" y2="${H - pad}" stroke="${hl}" stroke-width="1" stroke-dasharray="3,2"/>
          ${label(pad + offset - 18, H / 2, `h = ${height}`, 10, 'bold', hl)}` : ''}
      </svg>`
    }

    // ── TRAPEZOID ───────────────────────────────────────────
    case 'trapezoid': {
      const pad = 22, inset = 36
      const pts = `${pad + inset},${pad} ${W - pad - inset},${pad} ${W - pad},${H - pad} ${pad},${H - pad}`
      const a = data.a || data.top || ''
      const b = data.b || data.base || ''
      const h = data.h || data.height || ''
      return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
        <polygon points="${pts}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
        ${a ? label(W / 2, pad - 8, `a = ${a}`, 10, 'bold', hl) : ''}
        ${b ? label(W / 2, H - pad + 16, `b = ${b}`, 10, 'bold', hl) : ''}
        ${h ? `<line x1="${W / 2}" y1="${pad}" x2="${W / 2}" y2="${H - pad}" stroke="${hl}" stroke-width="1" stroke-dasharray="3,2"/>
          ${label(W / 2 + 20, H / 2, `h = ${h}`, 10, 'bold', hl)}` : ''}
      </svg>`
    }

    // ── ANGLE ───────────────────────────────────────────────
    case 'angle': {
      const deg = data.degrees || 90
      const cx = W / 2 + 10, cy = H - 30, armLen = 70
      const rad = (deg * Math.PI) / 180
      const x2 = cx + armLen, y2 = cy
      const x3 = cx + armLen * Math.cos(-rad), y3 = cy + armLen * Math.sin(-rad)
      const arcR = 28
      const largeArc = deg > 180 ? 1 : 0
      const ax = cx + arcR * Math.cos(-rad / 2), ay = cy + arcR * Math.sin(-rad / 2)

      return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
        <line x1="${cx}" y1="${cy}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="2" stroke-linecap="round"/>
        <line x1="${cx}" y1="${cy}" x2="${x3.toFixed(1)}" y2="${y3.toFixed(1)}" stroke="${stroke}" stroke-width="2" stroke-linecap="round"/>
        <path d="M${cx + arcR},${cy} A${arcR},${arcR} 0 ${largeArc} 0 ${(cx + arcR * Math.cos(-rad)).toFixed(1)},${(cy + arcR * Math.sin(-rad)).toFixed(1)}"
          fill="none" stroke="${hl}" stroke-width="1.5"/>
        ${label(ax.toFixed(1) as any, ay.toFixed(1) as any, `${deg}°`, 12, 'bold', hl)}
      </svg>`
    }

    // ── NUMBER LINE ─────────────────────────────────────────
    case 'number_line': {
      const min = data.min ?? 0, max = data.max ?? 10
      const marked: number[] = data.marked || []
      const pad = 28, y = H / 2
      const step = (W - pad * 2) / (max - min)

      const ticks = Array.from({ length: max - min + 1 }, (_, i) => {
        const x = pad + i * step
        const val = min + i
        const isMark = marked.includes(val)
        return `<line x1="${x}" y1="${y - 6}" x2="${x}" y2="${y + 6}" stroke="${isMark ? hl : stroke}" stroke-width="${isMark ? 2.5 : 1.5}"/>
          <text x="${x}" y="${y + 20}" text-anchor="middle" font-size="10" font-family="Georgia,serif" fill="${isMark ? hl : lbl}" font-weight="${isMark ? 'bold' : 'normal'}">${val}</text>
          ${isMark ? `<circle cx="${x}" cy="${y}" r="5" fill="${hl}" opacity="0.8"/>` : ''}`
      }).join('')

      return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
        <line x1="${pad - 10}" y1="${y}" x2="${W - pad + 10}" y2="${y}" stroke="${stroke}" stroke-width="2"/>
        <polygon points="${W - pad + 10},${y} ${W - pad + 4},${y - 4} ${W - pad + 4},${y + 4}" fill="${stroke}"/>
        ${ticks}
      </svg>`
    }

    // ── GRID (multiplication / area) ────────────────────────
    case 'grid': {
      const cols = Math.min(data.cols || 4, 10), rows = Math.min(data.rows || 4, 8)
      const pad = 20
      const cw = (W - pad * 2) / cols, rh = (H - pad * 2) / rows
      const filled: number = data.filled ?? cols * rows
      let cells = '', count = 0
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const f = count < filled
          cells += `<rect x="${pad + c * cw}" y="${pad + r * rh}" width="${cw - 1}" height="${rh - 1}"
            fill="${f ? hl : '#F0F4FF'}" stroke="${stroke}" stroke-width="1" opacity="${f ? 0.7 : 0.4}"/>`
          count++
        }
      }
      return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
        ${cells}
        ${label(W / 2, H - 4, `${cols} × ${rows} = ${cols * rows}`, 10, 'bold', lbl)}
      </svg>`
    }

    // ── COORDINATE GRID ─────────────────────────────────────
    case 'coordinate': {
      const pad = 24, tickSize = 5
      const range = data.range || 5
      const step = (Math.min(W, H) - pad * 2) / (range * 2)
      const cx = W / 2, cy = H / 2
      const points: [number, number, string][] = data.points || []

      let grid = ''
      for (let i = -range; i <= range; i++) {
        const x = cx + i * step, y = cy + i * step
        grid += `<line x1="${x}" y1="${pad}" x2="${x}" y2="${H - pad}" stroke="#E5E7EB" stroke-width="0.8"/>
          <line x1="${pad}" y1="${y}" x2="${W - pad}" y2="${y}" stroke="#E5E7EB" stroke-width="0.8"/>
          ${i !== 0 ? `<text x="${x}" y="${cy + 14}" text-anchor="middle" font-size="8" fill="${lbl}" font-family="Georgia,serif">${i}</text>` : ''}
          ${i !== 0 ? `<text x="${cx - 10}" y="${y + 3}" text-anchor="middle" font-size="8" fill="${lbl}" font-family="Georgia,serif">${-i}</text>` : ''}`
      }

      const plotted = points.map(([px, py, lbText]) => {
        const svgX = cx + px * step, svgY = cy - py * step
        return `<circle cx="${svgX}" cy="${svgY}" r="4" fill="${hl}" stroke="white" stroke-width="1.5"/>
          ${lbText ? `<text x="${svgX + 6}" y="${svgY - 5}" font-size="9" font-weight="bold" fill="${hl}" font-family="Georgia,serif">${lbText}</text>` : ''}`
      }).join('')

      return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
        ${grid}
        <line x1="${pad}" y1="${cy}" x2="${W - pad}" y2="${cy}" stroke="${stroke}" stroke-width="1.8"/>
        <line x1="${cx}" y1="${pad}" x2="${cx}" y2="${H - pad}" stroke="${stroke}" stroke-width="1.8"/>
        <polygon points="${W - pad},${cy} ${W - pad - 5},${cy - 3} ${W - pad - 5},${cy + 3}" fill="${stroke}"/>
        <polygon points="${cx},${pad} ${cx - 3},${pad + 5} ${cx + 3},${pad + 5}" fill="${stroke}"/>
        <text x="${W - pad - 2}" y="${cy - 6}" font-size="10" font-weight="bold" fill="${lbl}" font-family="Georgia,serif">x</text>
        <text x="${cx + 6}" y="${pad + 10}" font-size="10" font-weight="bold" fill="${lbl}" font-family="Georgia,serif">y</text>
        ${plotted}
      </svg>`
    }

    // ── CUBE ────────────────────────────────────────────────
    case 'cube': {
      const s = 60, ox = 70, oy = 55
      const side = data.side || ''
      return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
        <polygon points="${ox},${oy + s} ${ox + s},${oy + s} ${ox + s},${oy} ${ox},${oy}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
        <polygon points="${ox + s},${oy + s} ${ox + s + 30},${oy + s - 20} ${ox + s + 30},${oy - 20} ${ox + s},${oy}" fill="${fill}" stroke="${stroke}" stroke-width="2" opacity="0.85"/>
        <polygon points="${ox},${oy} ${ox + 30},${oy - 20} ${ox + s + 30},${oy - 20} ${ox + s},${oy}" fill="${fill}" stroke="${stroke}" stroke-width="2" opacity="0.7"/>
        ${side ? label(ox + s / 2, oy + s + 16, `s = ${side}`, 10, 'bold', hl) : ''}
        ${data.volume ? label(ox + s / 2, H - 12, `V = ${data.volume}`, 11, 'bold', lbl) : ''}
      </svg>`
    }

    // ── CUBOID / RECTANGULAR PRISM ──────────────────────────
    case 'cuboid':
    case 'rectangular_prism': {
      const sw = 80, sh = 50, depth = 28
      const ox = 50, oy = 60
      const l = data.l || data.length || '', w = data.w || data.width || '', h = data.h || data.height || ''
      return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
        <polygon points="${ox},${oy + sh} ${ox + sw},${oy + sh} ${ox + sw},${oy} ${ox},${oy}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
        <polygon points="${ox + sw},${oy + sh} ${ox + sw + depth},${oy + sh - depth * 0.6} ${ox + sw + depth},${oy - depth * 0.6} ${ox + sw},${oy}" fill="${fill}" stroke="${stroke}" stroke-width="2" opacity="0.85"/>
        <polygon points="${ox},${oy} ${ox + depth},${oy - depth * 0.6} ${ox + sw + depth},${oy - depth * 0.6} ${ox + sw},${oy}" fill="${fill}" stroke="${stroke}" stroke-width="2" opacity="0.7"/>
        ${l ? label(ox + sw / 2, oy + sh + 16, `l = ${l}`, 10, 'bold', hl) : ''}
        ${w ? `<text x="${ox - 14}" y="${oy + sh / 2 + 4}" text-anchor="middle" font-size="10" font-weight="bold" font-family="Georgia,serif" fill="${hl}">w=${w}</text>` : ''}
        ${h ? `<text x="${ox + sw + depth + 16}" y="${oy + sh / 2}" text-anchor="middle" font-size="10" font-weight="bold" font-family="Georgia,serif" fill="${hl}">h=${h}</text>` : ''}
        ${data.volume ? label(W / 2, H - 10, `V = ${data.volume}`, 11, 'bold', lbl) : ''}
      </svg>`
    }

    // ── CYLINDER ────────────────────────────────────────────
    case 'cylinder': {
      const cx = W / 2, rx = 55, ry = 16, top = 35, bot = H - 35
      const r = data.r || data.radius || '', h = data.h || data.height || ''
      return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="${cx}" cy="${bot}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
        <rect x="${cx - rx}" y="${top}" width="${rx * 2}" height="${bot - top}" fill="${fill}" stroke="none"/>
        <line x1="${cx - rx}" y1="${top}" x2="${cx - rx}" y2="${bot}" stroke="${stroke}" stroke-width="2"/>
        <line x1="${cx + rx}" y1="${top}" x2="${cx + rx}" y2="${bot}" stroke="${stroke}" stroke-width="2"/>
        <ellipse cx="${cx}" cy="${top}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
        ${r ? `<line x1="${cx}" y1="${top}" x2="${cx + rx}" y2="${top}" stroke="${hl}" stroke-width="1.5"/>
          ${label(cx + rx / 2, top - 8, `r = ${r}`, 10, 'bold', hl)}` : ''}
        ${h ? `<line x1="${cx + rx + 12}" y1="${top}" x2="${cx + rx + 12}" y2="${bot}" stroke="${hl}" stroke-width="1" stroke-dasharray="3,2"/>
          ${label(cx + rx + 26, (top + bot) / 2, `h = ${h}`, 10, 'bold', hl)}` : ''}
      </svg>`
    }

    // ── CONE ────────────────────────────────────────────────
    case 'cone': {
      const cx = W / 2, rx = 52, ry = 14, top = 28, bot = H - 30
      const r = data.r || data.radius || '', h = data.h || data.height || ''
      return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="${cx}" cy="${bot}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
        <line x1="${cx - rx}" y1="${bot}" x2="${cx}" y2="${top}" stroke="${stroke}" stroke-width="2"/>
        <line x1="${cx + rx}" y1="${bot}" x2="${cx}" y2="${top}" stroke="${stroke}" stroke-width="2"/>
        <line x1="${cx - rx}" y1="${bot}" x2="${cx + rx}" y2="${bot}" stroke="${stroke}" stroke-width="0.5" stroke-dasharray="3,2"/>
        ${r ? label(cx + rx / 2 + 6, bot + 20, `r = ${r}`, 10, 'bold', hl) : ''}
        ${h ? `<line x1="${cx + rx + 12}" y1="${top}" x2="${cx + rx + 12}" y2="${bot}" stroke="${hl}" stroke-width="1" stroke-dasharray="3,2"/>
          ${label(cx + rx + 26, (top + bot) / 2, `h = ${h}`, 10, 'bold', hl)}` : ''}
      </svg>`
    }

    // ── SPHERE ──────────────────────────────────────────────
    case 'sphere': {
      const cx = W / 2, cy = H / 2 - 5, r = Math.min(W, H) * 0.34
      const radius = data.r || data.radius || ''
      return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
        <ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${r * 0.28}" fill="none" stroke="${stroke}" stroke-width="1.2" stroke-dasharray="5,3"/>
        ${radius ? `<line x1="${cx}" y1="${cy}" x2="${cx + r}" y2="${cy}" stroke="${hl}" stroke-width="1.5"/>
          ${label(cx + r / 2, cy - 8, `r = ${radius}`, 10, 'bold', hl)}` : ''}
      </svg>`
    }

    // ── PYRAMID ────────────────────────────────────────────
    case 'pyramid': {
      const cx = W / 2, bot = H - 25, rx = 55, ry = 16, top = 28
      const base = data.base || '', h = data.h || data.height || ''
      return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="${cx}" cy="${bot}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${stroke}" stroke-width="1.5" stroke-dasharray="5,3"/>
        <line x1="${cx - rx}" y1="${bot}" x2="${cx}" y2="${top}" stroke="${stroke}" stroke-width="2"/>
        <line x1="${cx + rx}" y1="${bot}" x2="${cx}" y2="${top}" stroke="${stroke}" stroke-width="2"/>
        <line x1="${cx - rx}" y1="${bot}" x2="${cx + rx}" y2="${bot}" stroke="${stroke}" stroke-width="1.5"/>
        ${base ? label(cx, bot + 18, `base = ${base}`, 10, 'bold', hl) : ''}
        ${h ? `<line x1="${cx}" y1="${top}" x2="${cx}" y2="${bot}" stroke="${hl}" stroke-width="1" stroke-dasharray="3,2"/>
          ${label(cx + 18, (top + bot) / 2, `h = ${h}`, 10, 'bold', hl)}` : ''}
      </svg>`
    }

    default:
      return ''
  }
}

// ── Old fraction visual (backwards compat) ────────────────────
// ── Infer visual_data from prompt text ───────────────────────────
// Called when a question has no visual_data in the DB.
// Pattern-matches prompt_en to auto-generate the right shape.
function inferVisualData(prompt: string): any | null {
  if (!prompt) return null
  const p = prompt.toLowerCase()

  // Helper to extract first number after a keyword
  function num(keyword: string): string {
    const m = prompt.match(new RegExp(keyword + '\\s*(?:of|=|is|:)?\\s*(\\d+)', 'i'))
    return m ? m[1] + ' cm' : '?'
  }
  // Extract dimensions from "X by Y" / "X × Y"
  function byDims(): [string, string] | null {
    const m = prompt.match(/\b(\d+)\s*(?:cm|m|mm)?\s*(?:by|×|x)\s*(\d+)\s*(?:cm|m|mm)?\b/i)
    return m ? [m[1] + ' cm', m[2] + ' cm'] : null
  }
  // First number in prompt
  function firstNum(): string {
    const m = prompt.match(/\b(\d+)\b/)
    return m ? m[1] + ' cm' : '?'
  }

  // ── 2D shapes ────────────────────────────────────────────────
  if (/\brectangle\b/i.test(p) && /\b(area|perimeter|length|width)\b/i.test(p)) {
    const dims = byDims()
    return { type: 'rectangle', w: dims?.[0] || num('length'), h: dims?.[1] || num('width') }
  }
  if (/\bsquare\b/i.test(p) && /\b(area|perimeter|side)\b/i.test(p)) {
    const s = num('side') !== '?' ? num('side') : firstNum()
    return { type: 'square', w: s, h: s }
  }
  if (/\btriangle\b/i.test(p)) {
    const kind = /right[\s-]angle|right triangle/i.test(p) ? 'right'
      : /isosceles/i.test(p) ? 'isosceles'
      : /equilateral/i.test(p) ? 'equilateral'
      : 'scalene'
    return { type: 'triangle', kind, sides: [num('base'), num('height'), '?'] }
  }
  if (/\bcircle\b/i.test(p) && /\b(area|circumference|radius|diameter)\b/i.test(p)) {
    if (/radius/i.test(p)) return { type: 'circle', r: num('radius') }
    if (/diameter/i.test(p)) return { type: 'circle', d: num('diameter') }
    return { type: 'circle', r: firstNum() }
  }
  if (/\bparallelogram\b/i.test(p)) {
    return { type: 'parallelogram', base: num('base'), h: num('height') }
  }
  if (/\btrapezoid\b|\btrapezium\b/i.test(p)) {
    return { type: 'trapezoid', a: num('top'), b: num('base'), h: num('height') }
  }
  if (/\bangle\b|\bdegree\b|acute|obtuse|reflex/i.test(p) && !/triangle|rectangle/i.test(p)) {
    const degM = prompt.match(/(\d+)\s*°/i) || prompt.match(/angle\s*(?:of|=|is)?\s*(\d+)/i)
    const deg  = degM ? parseInt(degM[1]) : /acute/i.test(p) ? 45 : /obtuse/i.test(p) ? 120 : 90
    return { type: 'angle', degrees: deg }
  }
  if (/\bnumber[\s-]?line\b/i.test(p)) {
    const maxM = prompt.match(/to\s*(\d+)/i)
    return { type: 'number_line', min: 0, max: maxM ? parseInt(maxM[1]) : 10, marked: [] }
  }
  if (/\bcoordinate\b|\bplot\s*the\s*point\b|x-axis|y-axis/i.test(p)) {
    return { type: 'coordinate', range: 5, points: [] }
  }
  if (/area\s*model|grid\s*model|\barray\b/i.test(p)) {
    const dims = byDims()
    return { type: 'grid', cols: dims ? parseInt(dims[0]) : 4, rows: dims ? parseInt(dims[1]) : 4 }
  }

  // ── 3D shapes ────────────────────────────────────────────────
  if (/\bcylinder\b/i.test(p)) {
    return { type: 'cylinder', r: num('radius'), h: num('height') }
  }
  if (/\bcone\b/i.test(p)) {
    return { type: 'cone', r: num('radius'), h: num('height') }
  }
  if (/\bsphere\b/i.test(p)) {
    return { type: 'sphere', r: num('radius') }
  }
  if (/\bpyramid\b/i.test(p)) {
    return { type: 'pyramid', base: num('base'), h: num('height') }
  }
  if (/\bcuboid\b|rectangular\s*prism|rectangular\s*box/i.test(p)) {
    return { type: 'cuboid', l: num('length'), w: num('width'), h: num('height') }
  }
  if (/\bcube\b/i.test(p) && /\b(volume|surface|side|edge)\b/i.test(p)) {
    return { type: 'cube', side: num('side') !== '?' ? num('side') : num('edge') }
  }

  // ── Fractions ────────────────────────────────────────────────
  if (/fraction|shaded|equal\s*parts|slice|cut\s*into|divided\s*into/i.test(p)) {
    const fracM = prompt.match(/(\d+)\s*\/\s*(\d+)/)
    if (fracM) return { type: 'fraction', n: parseInt(fracM[1]), d: parseInt(fracM[2]) }
    return { type: 'fraction_pie', n: 1, d: 4 }
  }

  return null
}

function renderLegacyVisual(q: any): string {
  if (!q.visual_data) return ''
  const needsVis = ['fill_blank'].includes(q.q_type) ||
    /slice|equal part|cut into|divided into|shaded/i.test(q.prompt_en || '')
  if (!needsVis) return ''
  const { n, d } = q.visual_data
  if (!n || !d) return ''
  const boxes = Array.from({ length: d }, (_: any, i: number) =>
    `<div class="vis-box${i < n ? ' filled' : ''}"></div>`
  ).join('')
  return `<div class="visual-row">${boxes}</div>`
}

function renderVisual(q: any, color = '#4A7FD4'): string {
  // 1. Use stored visual_data.type if present
  if (q.visual_data?.type) {
    const svg = renderMathVisualSVG(q.visual_data, color)
    if (svg) return `<div class="math-visual">${svg}</div>`
  }

  // 2. No visual_data or no type — try to infer from prompt text
  const inferred = inferVisualData(q.prompt_en || '')
  if (inferred) {
    const svg = renderMathVisualSVG(inferred, color)
    if (svg) return `<div class="math-visual">${svg}</div>`
  }

  // 3. Legacy fraction boxes fallback
  return renderLegacyVisual(q)
}

function noQuestionsHTML(child: any) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
  <body style="font-family:Nunito,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#F8F9FB;">
    <div style="text-align:center;padding:40px;">
      <div style="font-size:48px;margin-bottom:16px;">📚</div>
      <h2 style="color:#1E2D4E;">No questions found for these topics yet.</h2>
      <p style="color:#6B7A8D;font-size:14px;">Try selecting different topics or difficulty levels.</p>
      <button onclick="window.close()" style="margin-top:20px;padding:10px 24px;background:#4A7FD4;color:white;border:none;border-radius:50px;font-size:14px;font-weight:800;cursor:pointer;">Close</button>
    </div>
  </body></html>`
}

function generateHTML({ child, topics, questions, difficulty, langMode, includeKey, wsType, includeHints, solutionSteps, date, subject }: any) {
  const isHebrew    = langMode === 'he_only'
  const isBilingual = langMode === 'bilingual'
  const isEnglish   = langMode === 'en_only'
  const subjectLabel   = subject?.label_en || 'Worksheet'
  const subjectLabelHe = subject?.label_he || ''
  const topicLabels    = topics.map((t: any) => t.title_en).join(' · ')
  const diffLabel      = difficulty.charAt(0).toUpperCase() + difficulty.slice(1)
  const typeEmoji      = wsType === 'practice' ? '📝' : wsType === 'quiz' ? '✅' : '🎓'
  const typeLabel      = wsType === 'practice' ? 'Practice' : wsType === 'quiz' ? 'Quiz' : 'Exam'
  const showHints      = includeHints && wsType !== 'quiz' && wsType !== 'exam'
  const subjectColor   = subject?.slug === 'math' ? '#4A7FD4' : subject?.slug === 'english' ? '#2EC4B6' : '#EF4444'

  const questionsHTML = questions.map((q: any, i: number) => {
    const visualHTML = renderVisual(q, subjectColor)

    let answerHTML = ''
    if (q.options) {
      answerHTML = `<div class="options-grid">${q.options.map((opt: any) => {
        const displayVal = isHebrew && opt.value_he ? opt.value_he : opt.value_en
        return `<div class="option">
          <span class="opt-label">${opt.label}.</span>
          <span class="opt-value">${renderValue(displayVal)}</span>
        </div>`
      }).join('')}</div>`
    } else {
      const ansLabel = isHebrew ? 'תשובה:' : isBilingual ? 'Answer / תשובה:' : 'Answer:'
      answerHTML = `<div class="answer-line"><span class="ans-label">${ansLabel}</span><span class="line"></span></div>`
    }

    const hintText = isHebrew && q.hint_he ? q.hint_he : q.hint_en
    const hintHTML = showHints && hintText ? `<div class="hint">💡 <em>${hintText}</em></div>` : ''
    const topicBadge = topics.length > 1
      ? `<span class="topic-badge">${isHebrew && q.topicTitleHe ? q.topicTitleHe : q.topicTitle}</span>` : ''
    const enText = !isHebrew && q.prompt_en ? `<div class="q-text-en">${q.prompt_en}</div>` : ''
    const heText = !isEnglish && q.prompt_he ? `<div class="q-text-he">${q.prompt_he}</div>` : ''

    return `
      <div class="question">
        <div class="q-left">
          <div class="q-header">
            <div class="q-number">Q${i + 1}</div>
            ${topicBadge}
            <span class="diff-badge diff-${q.difficulty}">${q.difficulty}</span>
          </div>
          <div class="q-body">
            ${enText}${heText}${visualHTML}${answerHTML}${hintHTML}
          </div>
        </div>
        <div class="q-workspace">
          <div class="workspace-label">${isHebrew ? 'עבודה' : 'Working'}</div>
          <div class="workspace-lines">
            ${Array.from({ length: 6 }, () => '<div class="ws-line"></div>').join('')}
          </div>
        </div>
      </div>`
  }).join('')

  const answerKeyHTML = includeKey ? `
    <div class="answer-key-section">
      <div class="answer-key-title">✅ ${isHebrew ? 'תשובות' : 'Answer Key'} — ${typeEmoji} ${typeLabel}</div>
      <div class="key-grid">
        ${questions.map((q: any, i: number) => {
          const ans = isHebrew && q.correct_answer_he ? q.correct_answer_he : q.correct_answer
          return `<div class="key-item"><div class="key-q">Q${i + 1}</div><div class="key-a">${renderValue(ans)}</div></div>`
        }).join('')}
      </div>
    </div>` : ''

  const stepsHTML = solutionSteps ? `
    <div class="answer-key-section">
      <div class="answer-key-title">📖 ${isHebrew ? 'פתרון מלא' : 'Full Solution Steps'}</div>
      <div style="display:flex;flex-direction:column;gap:14px;">
        ${questions.map((q: any, i: number) => {
          const prompt  = isHebrew && q.prompt_he  ? q.prompt_he  : q.prompt_en
          const hint    = isHebrew && q.hint_he    ? q.hint_he    : q.hint_en
          const explain = q.explanation_en
          const ans     = isHebrew && q.correct_answer_he ? q.correct_answer_he : q.correct_answer
          return `<div style="padding:12px 16px;border:1px solid #EEF1F6;border-radius:10px;page-break-inside:avoid;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
              <div style="font-size:12px;font-weight:900;color:white;background:#27AE60;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">Q${i + 1}</div>
              <div style="font-size:13px;font-weight:700;color:#1A2E4A;${isHebrew ? 'direction:rtl;text-align:right;' : ''}">${prompt}</div>
            </div>
            ${hint ? `<div style="font-size:12px;color:#F5A623;margin-bottom:6px;padding:5px 10px;background:#FFFBF0;border-left:3px solid #F5A623;border-radius:0 6px 6px 0;">💡 ${hint}</div>` : ''}
            <div style="font-size:13px;color:#27AE60;font-weight:800;">✅ ${isHebrew ? 'תשובה' : 'Answer'}: ${renderValue(ans)}</div>
            ${explain ? `<div style="font-size:12px;color:#5A6A7E;margin-top:5px;line-height:1.6;">📝 ${explain}</div>` : ''}
          </div>`
        }).join('')}
      </div>
    </div>` : ''

  return `<!DOCTYPE html>
<html dir="${isHebrew ? 'rtl' : 'ltr'}">
<head>
  <meta charset="UTF-8"/>
  <title>EduPlay — ${subjectLabel} ${typeLabel}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+Hebrew:wght@400;700&family=Nunito:wght@400;700;800;900&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Nunito', sans-serif; background: white; color: #1a1a2e; padding: 28px 36px; max-width: 860px; margin: 0 auto; font-size: 13px; }

    .no-print { margin-bottom: 14px; display: flex; gap: 8px; justify-content: flex-end; }
    .btn-print { padding: 9px 22px; background: ${subjectColor}; color: white; border: none; border-radius: 50px; font-size: 13px; font-weight: 800; cursor: pointer; font-family: Nunito,sans-serif; }
    .btn-close { padding: 9px 22px; background: #F3F4F6; color: #4B5563; border: none; border-radius: 50px; font-size: 13px; font-weight: 800; cursor: pointer; font-family: Nunito,sans-serif; }

    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid ${subjectColor}; padding-bottom: 12px; margin-bottom: 14px; }
    .logo { font-size: 20px; font-weight: 900; color: #1A2E4A; }
    .logo span { color: ${subjectColor}; }
    .header-meta { font-size: 12px; color: #6B7A8D; text-align: right; line-height: 1.9; }
    .ws-title { font-size: 19px; font-weight: 900; color: #1A2E4A; margin-bottom: 3px; }
    .ws-topics { font-size: 11px; color: #9AA5B8; margin-bottom: 8px; }

    .badges { display: flex; gap: 7px; margin-bottom: 14px; flex-wrap: wrap; }
    .badge { padding: 2px 11px; border-radius: 50px; font-size: 11px; font-weight: 800; }
    .badge-blue   { background: #EBF2FF; color: #4A7FD4; }
    .badge-green  { background: #EAFAF1; color: #27AE60; }
    .badge-orange { background: #FFF8EC; color: #F5A623; }
    .badge-purple { background: #F5F0FF; color: #8B5CF6; }
    .badge-red    { background: #FEF2F2; color: #EF4444; }

    .student-row { display: flex; gap: 20px; margin-bottom: 16px; padding: 9px 14px; background: #F8F9FB; border-radius: 8px; }
    .student-field { display: flex; align-items: center; gap: 8px; font-size: 12px; }
    .student-label { font-weight: 800; color: #6B7A8D; white-space: nowrap; }
    .student-line { border-bottom: 1.5px solid #9AA5B8; width: 110px; display: inline-block; }

    .question { display: table; width: 100%; margin-bottom: 16px; border: 1px solid #EEF1F6; border-radius: 10px; overflow: hidden; page-break-inside: avoid; min-height: 100px; }
    .q-left { display: table-cell; width: auto; padding: 12px 14px; vertical-align: top; border-right: 1px dashed #DEE2E6; }
    .q-workspace { display: table-cell; width: 180px; padding: 8px 10px; background: #FAFBFF; vertical-align: top; }
    .workspace-label { font-size: 9px; font-weight: 800; color: #C0C8D8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
    .ws-line { height: 22px; border-bottom: 1px solid #E8ECF4; }

    .q-header { display: flex; align-items: center; gap: 7px; margin-bottom: 7px; }
    .q-number { font-size: 12px; font-weight: 900; color: white; background: ${subjectColor}; width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .topic-badge { font-size: 10px; font-weight: 800; background: #EBF2FF; color: ${subjectColor}; padding: 2px 8px; border-radius: 50px; }
    .diff-badge { font-size: 9px; font-weight: 800; padding: 2px 8px; border-radius: 50px; margin-left: auto; }
    .diff-easy   { background: #EAFAF1; color: #27AE60; }
    .diff-medium { background: #FFF8EC; color: #F5A623; }
    .diff-hard   { background: #FEECEC; color: #FF6B6B; }

    .q-text-en { font-size: 13px; font-weight: 700; color: #1A2E4A; margin-bottom: 5px; line-height: 1.5; }
    .q-text-he { font-size: 13px; color: ${subjectColor}; font-family: 'Noto Serif Hebrew',serif; direction: rtl; text-align: right; margin-bottom: 7px; line-height: 1.6; }

    /* Math visual SVG */
    .math-visual { display: flex; justify-content: center; padding: 10px 0 8px; }
    .math-visual svg { max-width: 200px; height: auto; }

    /* Legacy fraction boxes */
    .visual-row { display: flex; gap: 3px; margin: 8px 0; }
    .vis-box { width: 28px; height: 28px; border: 1.5px solid ${subjectColor}; border-radius: 3px; background: #F0F4FF; }
    .vis-box.filled { background: ${subjectColor}; opacity: 0.75; }

    .options-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 8px; }
    .option { display: flex; align-items: center; gap: 7px; padding: 6px 10px; border: 1px solid #DEE2E6; border-radius: 6px; font-size: 13px; min-height: 34px; }
    .opt-label { font-weight: 800; color: ${subjectColor}; min-width: 14px; flex-shrink: 0; }
    .opt-value { font-family: 'Times New Roman', Georgia, serif; }

    .answer-line { display: flex; align-items: center; gap: 10px; margin-top: 8px; font-size: 12px; font-weight: 700; color: #6B7A8D; }
    .ans-label { white-space: nowrap; font-family: 'Noto Serif Hebrew', Nunito, sans-serif; }
    .line { flex: 1; border-bottom: 1.5px solid #9AA5B8; }
    .hint { margin-top: 6px; font-size: 11px; color: #9AA5B8; padding: 5px 9px; background: #FFFBF0; border-left: 3px solid #F5A623; border-radius: 0 5px 5px 0; }

    .footer { margin-top: 24px; padding-top: 10px; border-top: 1px solid #EEF1F6; font-size: 10px; color: #9AA5B8; line-height: 1.7; }
    .answer-key-section { page-break-before: always; padding-top: 20px; }
    .answer-key-title { font-size: 17px; font-weight: 900; color: #27AE60; margin-bottom: 14px; }
    .key-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 9px; }
    .key-item { padding: 9px; border: 1.5px solid #EAFAF1; border-radius: 8px; text-align: center; }
    .key-q { font-size: 11px; font-weight: 800; color: #6B7A8D; margin-bottom: 4px; }
    .key-a { font-size: 13px; font-weight: 900; color: #27AE60; font-family: 'Times New Roman', Georgia, serif; }

    @media print {
      .no-print { display: none; }
      body { padding: 14px; }
      .question { page-break-inside: avoid; }
      .math-visual svg { max-width: 160px; }
    }
  </style>
</head>
<body>
  <div class="no-print">
    <button class="btn-print" onclick="window.print()">🖨️ Print / Save as PDF</button>
    <button class="btn-close" onclick="window.close()">✕ Close</button>
  </div>

  <div class="header">
    <div>
      <div class="logo">Edu<span>Play</span></div>
      <div style="font-size:10px;color:#9AA5B8;margin-top:1px;">eduplay-tau.vercel.app</div>
    </div>
    <div class="header-meta">
      <div><strong>${isHebrew ? 'תלמיד' : 'Student'}:</strong> ${child.display_name}</div>
      <div><strong>${isHebrew ? 'כיתה' : 'Grade'}:</strong> ${isHebrew ? 'כיתה' : 'Grade'} ${child.grade === 0 ? 'K' : child.grade}</div>
      <div><strong>${isHebrew ? 'תאריך' : 'Date'}:</strong> ${date}</div>
    </div>
  </div>

  <div class="ws-title">${isHebrew ? subjectLabelHe : subjectLabel} — ${typeEmoji} ${isHebrew ? (wsType === 'practice' ? 'תרגול' : wsType === 'quiz' ? 'חידון' : 'מבחן') : typeLabel}</div>
  <div class="ws-topics">${topicLabels}</div>

  <div class="badges">
    <span class="badge badge-blue">${isHebrew ? subjectLabelHe : subjectLabel}</span>
    <span class="badge badge-blue">${isHebrew ? 'כיתה' : 'Grade'} ${child.grade === 0 ? 'K' : child.grade}</span>
    <span class="badge badge-${difficulty === 'easy' ? 'green' : difficulty === 'hard' ? 'red' : difficulty === 'mixed' ? 'purple' : 'orange'}">${isHebrew ? (difficulty === 'easy' ? 'קל' : difficulty === 'medium' ? 'בינוני' : difficulty === 'hard' ? 'קשה' : 'מעורב') : diffLabel}</span>
    <span class="badge badge-purple">${questions.length} ${isHebrew ? 'שאלות' : 'Questions'}</span>
    ${includeKey ? `<span class="badge badge-green">${isHebrew ? 'כולל תשובות' : 'Answer Key Included'}</span>` : ''}
  </div>

  <div class="student-row">
    <div class="student-field"><span class="student-label">${isHebrew ? 'שם:' : 'Name:'}</span><span class="student-line"></span></div>
    <div class="student-field"><span class="student-label">${isHebrew ? 'ציון:' : 'Score:'}</span><span class="student-line"></span></div>
    <div class="student-field"><span class="student-label">${isHebrew ? 'תאריך:' : 'Date:'}</span><span class="student-line"></span></div>
  </div>

  ${questionsHTML}

  <div class="footer">
    ${isHebrew
      ? 'דפי העבודה של EduPlay מותאמים לתכנית הלימודים ומעוצבים על ידי מומחי תוכן חינוכי.'
      : 'EduPlay worksheets are curriculum-aligned and designed by educational content specialists. Parents are encouraged to review all materials before use.'
    }<br/>
    Generated by EduPlay · eduplay-tau.vercel.app
  </div>

  ${answerKeyHTML}
  ${stepsHTML}

  <script>setTimeout(() => window.print(), 800)</script>
</body>
</html>`
}