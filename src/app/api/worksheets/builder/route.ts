import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase'
import { authorizeChildAccess } from '@/lib/session'
import { renderMathVisualSVG } from '@/lib/mathVisual'
import { fractionsToHTML } from '@/lib/fractionText'
import { isDistinctHe } from '@/lib/text'

export async function GET(req: NextRequest) {
  const supabase = createServiceRoleClient()
  const { searchParams } = new URL(req.url)

  const childId       = searchParams.get('childId')
  const topicIds      = searchParams.get('topicIds')?.split(',').filter(Boolean) || []
  // TODO(product): questionIds already lets a caller hand-pick specific question IDs
  // for this one child's worksheet, but no UI ever sends it — /worksheets always
  // generates via topicIds (random from the shared approved pool). This is the
  // closest thing in the codebase to per-child question assignment; worth reusing
  // when we design that feature instead of building targeting from scratch.
  const questionIds   = searchParams.get('questionIds')?.split(',').filter(Boolean) || []
  const difficulty    = searchParams.get('difficulty') || 'mixed'
  const questionCount = parseInt(searchParams.get('questionCount') || '20')
  const langMode      = searchParams.get('lang') || 'bilingual'
  const includeKey    = searchParams.get('answerKey') === 'true'
  const wsType        = searchParams.get('wsType') || 'practice'
  const includeHints  = searchParams.get('includeHints') === 'true'
  const solutionSteps = searchParams.get('solutionSteps') === 'true'
  const preview       = searchParams.get('preview') === 'true'
  const isRegenerate  = searchParams.get('regenerate') === 'true'

  if (!childId || topicIds.length === 0) {
    return NextResponse.json({ error: 'childId and topicIds required' }, { status: 400 })
  }

  const auth = await authorizeChildAccess(childId)
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.status === 401 ? 'Unauthorized' : 'Forbidden' },
      { status: auth.status }
    )
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

    // ── Log this generation to worksheet_generations (history/regenerate) ──
    // Records the resolved question set for both the questionIds path (Library
    // "create worksheet from selected") and the topicIds random-pull path — so
    // even a random-pull worksheet becomes exactly reproducible via regenerate.
    // Skipped when isRegenerate: reprinting an existing history row is not a new
    // generation event, and logging it again would make History inflate every
    // time someone re-prints instead of reflecting distinct worksheets created.
    // Wrapped in try/catch: a logging failure must never break the print view.
    if (!isRegenerate) {
      try {
        await supabase.from('worksheet_generations').insert({
          family_id: child.family_id,
          child_id: childId,
          topic_ids: topics.map((t: any) => t.id),
          ws_type: wsType,
          difficulty,
          question_count: finalQuestions.length,
          lang_mode: langMode,
          include_answer_key: includeKey,
          include_hints: includeHints,
          solution_steps: solutionSteps,
          question_ids: finalQuestions.map((q: any) => q.id),
        })
      } catch {}
    }

    // TODO(product): this auto-save writes straight to `questions` with
    // approved: true, source: 'worksheet_builder' — a second creation path that
    // completely bypasses Pending Review. A worksheet-generated question never
    // enters the approval queue and is immediately eligible to be served to any
    // child on that topic, with zero human review. Same shared-pool risk as the
    // AI generator path, minus the review step we just built. Needs a decision:
    // route this through approved:false + Pending Review too, or explicitly
    // accept the gap and document why.
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

function renderVisual(q: any, color = '#4A7FD4', instanceId: number | string = ''): string {
  // 1. Use stored visual_data.type if present
  if (q.visual_data?.type) {
    const svg = renderMathVisualSVG(q.visual_data, { color, instanceId })
    if (svg) return `<div class="math-visual">${svg}</div>`
  }

  // 2. No visual_data or no type — try to infer from prompt text
  const inferred = inferVisualData(q.prompt_en || '')
  if (inferred) {
    const svg = renderMathVisualSVG(inferred, { color, instanceId })
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
    const visualHTML = renderVisual(q, subjectColor, i)

    let answerHTML = ''
    if (q.options) {
      answerHTML = `<div class="options-grid">${q.options.map((opt: any) => {
        const displayVal = isHebrew && opt.value_he ? opt.value_he : opt.value_en
        return `<div class="option">
          <span class="opt-label">${opt.label}.</span>
          <span class="opt-value">${fractionsToHTML(displayVal)}</span>
        </div>`
      }).join('')}</div>`
    } else {
      const ansLabel = isHebrew ? 'תשובה:' : isBilingual ? 'Answer / תשובה:' : 'Answer:'
      answerHTML = `<div class="answer-line"><span class="ans-label">${ansLabel}</span><span class="line"></span></div>`
    }

    const hintText = isHebrew && q.hint_he ? q.hint_he : q.hint_en
    const hintHTML = showHints && hintText ? `<div class="hint">💡 <em>${fractionsToHTML(hintText)}</em></div>` : ''
    const topicBadge = topics.length > 1
      ? `<span class="topic-badge">${isHebrew && q.topicTitleHe ? q.topicTitleHe : q.topicTitle}</span>` : ''
    const enText = !isHebrew && q.prompt_en ? `<div class="q-text-en">${fractionsToHTML(q.prompt_en)}</div>` : ''
    const heText = !isEnglish && q.prompt_he && (!isBilingual || isDistinctHe(q.prompt_he, q.prompt_en))
      ? `<div class="q-text-he">${fractionsToHTML(q.prompt_he)}</div>` : ''

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
          return `<div class="key-item"><div class="key-q">Q${i + 1}</div><div class="key-a">${fractionsToHTML(q.correct_answer)}</div></div>`
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
          const ans     = q.correct_answer
          return `<div style="padding:12px 16px;border:1px solid #EEF1F6;border-radius:10px;page-break-inside:avoid;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
              <div style="font-size:12px;font-weight:900;color:white;background:#27AE60;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">Q${i + 1}</div>
              <div style="font-size:13px;font-weight:700;color:#1A2E4A;${isHebrew ? 'direction:rtl;text-align:right;' : ''}">${fractionsToHTML(prompt)}</div>
            </div>
            ${hint ? `<div style="font-size:12px;color:#F5A623;margin-bottom:6px;padding:5px 10px;background:#FFFBF0;border-left:3px solid #F5A623;border-radius:0 6px 6px 0;">💡 ${fractionsToHTML(hint)}</div>` : ''}
            <div style="font-size:13px;color:#27AE60;font-weight:800;">✅ ${isHebrew ? 'תשובה' : 'Answer'}: ${fractionsToHTML(ans)}</div>
            ${explain ? `<div style="font-size:12px;color:#5A6A7E;margin-top:5px;line-height:1.6;">📝 ${fractionsToHTML(explain)}</div>` : ''}
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
    .q-left { display: table-cell; width: auto; padding: 12px 14px; vertical-align: top; border-inline-end: 1px dashed #DEE2E6; }
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
