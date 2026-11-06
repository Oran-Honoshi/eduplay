// Worksheet / exam HTML (moved from the builder route so the public free
// library can render the same branded printable).
import { renderMathVisualSVG } from '@/lib/mathVisual'
import { fractionsToHTML } from '@/lib/fractionText'
import { brandBits, brandHeader, brandFooter, BRAND_CSS, type Brand } from '@/lib/printBrand'
import { isDistinctHe, translateDifficulty, translateOptionLabel, extractBareEquation, segmentHebrewMath } from '@/lib/text'

function inferVisualData(prompt: string): any | null {
  if (!prompt) return null
  const p = prompt.toLowerCase()

  // Helper to extract first number after a keyword.
  // Returns null (not a placeholder) when the regex can't confidently find
  // the value — callers must bail rather than render a guessed/placeholder
  // dimension, since a wrong or blank visual is worse than no visual.
  function num(keyword: string): string | null {
    const m = prompt.match(new RegExp(keyword + '\\s*(?:of|=|is|:)?\\s*(\\d+)', 'i'))
    return m ? m[1] + ' cm' : null
  }
  // Extract dimensions from "X by Y" / "X × Y"
  function byDims(): [string, string] | null {
    const m = prompt.match(/\b(\d+)\s*(?:cm|m|mm)?\s*(?:by|×|x)\s*(\d+)\s*(?:cm|m|mm)?\b/i)
    return m ? [m[1] + ' cm', m[2] + ' cm'] : null
  }
  // First number in prompt
  function firstNum(): string | null {
    const m = prompt.match(/\b(\d+)\b/)
    return m ? m[1] + ' cm' : null
  }

  // ── 2D shapes ────────────────────────────────────────────────
  if (/\brectangle\b/i.test(p) && /\b(area|perimeter|length|width)\b/i.test(p)) {
    const dims = byDims()
    const w = dims?.[0] || num('length')
    const h = dims?.[1] || num('width')
    if (!w || !h) return null
    return { type: 'rectangle', w, h }
  }
  if (/\bsquare\b/i.test(p) && /\b(area|perimeter|side)\b/i.test(p)) {
    const s = num('side') || firstNum()
    if (!s) return null
    return { type: 'square', w: s, h: s }
  }
  if (/\btriangle\b/i.test(p)) {
    const kind = /right[\s-]angle|right triangle/i.test(p) ? 'right'
      : /isosceles/i.test(p) ? 'isosceles'
      : /equilateral/i.test(p) ? 'equilateral'
      : 'scalene'
    const base = num('base'), height = num('height')
    if (!base || !height) return null
    // Third side stays a literal '?' — that's the deliberately-unknown
    // quantity being solved for, not a failed extraction of a stated value.
    return { type: 'triangle', kind, sides: [base, height, '?'] }
  }
  if (/\bcircle\b/i.test(p) && /\b(area|circumference|radius|diameter)\b/i.test(p)) {
    if (/radius/i.test(p)) {
      const r = num('radius')
      return r ? { type: 'circle', r } : null
    }
    if (/diameter/i.test(p)) {
      const d = num('diameter')
      return d ? { type: 'circle', d } : null
    }
    const r = firstNum()
    return r ? { type: 'circle', r } : null
  }
  if (/\bparallelogram\b/i.test(p)) {
    const base = num('base'), h = num('height')
    if (!base || !h) return null
    return { type: 'parallelogram', base, h }
  }
  if (/\btrapezoid\b|\btrapezium\b/i.test(p)) {
    const a = num('top'), b = num('base'), h = num('height')
    if (!a || !b || !h) return null
    return { type: 'trapezoid', a, b, h }
  }
  if (/\bangle\b|\bdegree\b|acute|obtuse|reflex/i.test(p) && !/triangle|rectangle/i.test(p)) {
    const degM = prompt.match(/(\d+)\s*°/i) || prompt.match(/angle\s*(?:of|=|is)?\s*(\d+)/i)
    // Only render when an explicit degree is stated — guessing 45/90/120
    // from "acute"/"obtuse" adjectives shows a specific value that may not
    // be the real one.
    if (!degM) return null
    return { type: 'angle', degrees: parseInt(degM[1]) }
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
    if (!dims) return null
    return { type: 'grid', cols: parseInt(dims[0]), rows: parseInt(dims[1]) }
  }

  // ── 3D shapes ────────────────────────────────────────────────
  if (/\bcylinder\b/i.test(p)) {
    const r = num('radius'), h = num('height')
    if (!r || !h) return null
    return { type: 'cylinder', r, h }
  }
  if (/\bcone\b/i.test(p)) {
    const r = num('radius'), h = num('height')
    if (!r || !h) return null
    return { type: 'cone', r, h }
  }
  if (/\bsphere\b/i.test(p)) {
    const r = num('radius')
    if (!r) return null
    return { type: 'sphere', r }
  }
  if (/\bpyramid\b/i.test(p)) {
    const base = num('base'), h = num('height')
    if (!base || !h) return null
    return { type: 'pyramid', base, h }
  }
  if (/\bcuboid\b|rectangular\s*prism|rectangular\s*box/i.test(p)) {
    const l = num('length'), w = num('width'), h = num('height')
    if (!l || !w || !h) return null
    return { type: 'cuboid', l, w, h }
  }
  if (/\bcube\b/i.test(p) && /\b(volume|surface|side|edge)\b/i.test(p)) {
    const side = num('side') || num('edge')
    if (!side) return null
    return { type: 'cube', side }
  }

  // ── Fractions ────────────────────────────────────────────────
  const fracMatches = [...prompt.matchAll(/(\d+)\s*\/\s*(\d+)/g)]
  const compareCue = /\b(bigger|smaller|greater|less|more|compare|closest|between|order)\b/i.test(p)

  // Two fractions + comparison language → the new side-by-side comparison
  // visual. This catches prompts like "Which is bigger, 3/4 or 2/3?" even
  // without the word "fraction" appearing.
  if (fracMatches.length >= 2 && compareCue) {
    if (fracMatches.length === 2) {
      return {
        type: 'fraction_compare',
        a: { n: parseInt(fracMatches[0][1]), d: parseInt(fracMatches[0][2]) },
        b: { n: parseInt(fracMatches[1][1]), d: parseInt(fracMatches[1][2]) },
      }
    }
    // 3+ fractions (ordering) needs its own row-of-N layout — not built yet.
    return null
  }

  if (/fraction|shaded|equal\s*parts|slice|cut\s*into|divided\s*into/i.test(p)) {
    if (fracMatches.length >= 1) {
      return { type: 'fraction', n: parseInt(fracMatches[0][1]), d: parseInt(fracMatches[0][2]) }
    }
    // Couldn't confidently extract a fraction — no visual beats a wrong guess.
    return null
  }

  return null
}

// Extracts a bare equation to print in the work column — deliberately NOT a
// prose-to-equation converter. A word_problem prompt like "Sarah has 3/4 of
// a pizza and eats 1/6 more" would need real interpretation (which
// operation? which number is subtracted from which?) to turn into an
// equation, and a wrong derived equation placed in front of a student is
// strictly worse than the blank lines it would replace — same "suppress
// instead of guess" principle as inferVisualData above. This only fires
// when the prompt is ALREADY a bare equation (after trimming a small fixed
// set of boilerplate instruction prefixes): nothing is being synthesized,
// so it can't misrepresent the problem or leak anything not already shown.
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

export function noQuestionsHTML(child: any) {
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

// Renders a real prompt_he string as one or more .q-text-he lines, isolating
// any embedded math onto its own forced-LTR line (see segmentHebrewMath in
// lib/text.ts for the detection logic, including why a whole-string bare
// equation like "3.5 + 2.4 = ___" doesn't need separate handling here — it
// naturally comes back as a single math-only segment). Pure narrative with
// no isolatable expression renders as the single plain .q-text-he block
// this replaced, unchanged.

// Inside Hebrew text, numbers and Latin runs must keep left-to-right order on
// paper too ("-5", "A(2,3)", "x=-4", "3/4"); otherwise the minus sign jumps to
// the wrong side. A hyphen glued to a Hebrew letter (ל-3, ב-5) is Hebrew
// punctuation, not a minus, so it stays outside the isolated run.
function isolateLtrRuns(text: string): string {
  if (!text || !/[֐-׿]/.test(text)) return text
  return text.replace(/(?<![\u0590-\u05FF])[-−]?[∢∠△A-Za-z0-9|(][A-Za-z0-9.,:+\-−×÷=*/%()|'_ °∢∠]*[A-Za-z0-9)|°]|(?<![\u0590-\u05FF])[-−]?[0-9]/g,
    m => `<bdi dir="ltr">${m}</bdi>`)
}
const heHTML = (t: any) => {
  const v = String(t ?? '')
  return /[\u0590-\u05FF]/.test(v) ? fractionsToHTML(isolateLtrRuns(v)) : (v ? `<bdi dir="ltr">${fractionsToHTML(v)}</bdi>` : '')
}

function renderHeTextLines(promptHe: string): string {
  const segments = segmentHebrewMath(promptHe)
  if (segments.length === 0) {
    return `<div class="q-text-he">${heHTML(promptHe)}</div>`
  }
  return segments.map(seg =>
    seg.type === 'math'
      ? `<div class="q-text-he" style="direction:ltr;text-align:left">${fractionsToHTML(seg.content)}</div>`
      : `<div class="q-text-he">${heHTML(seg.content)}</div>`
  ).join('')
}

export function generateHTML({ child, topics, questions, difficulty, langMode, includeKey, wsType, includeHints, solutionSteps, date, subject, brand, customTitle, timeMinutes }: any) {
  const b: Brand = brand
  const isHebrew    = langMode === 'he_only'
  const isBilingual = langMode === 'bilingual'
  const isEnglish   = langMode === 'en_only'
  const subjectLabel   = subject?.label_en || 'Worksheet'
  const subjectLabelHe = subject?.label_he || ''
  const topicLabels    = topics.map((t: any) => (langMode === 'he_only' && t.title_he) ? t.title_he : t.title_en).join(' · ')
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
        const displayLabel = isHebrew ? translateOptionLabel(opt.label) : opt.label
        return `<div class="option">
          <span class="opt-label">${displayLabel}.</span>
          <span class="opt-value">${/[\u0590-\u05FF]/.test(String(displayVal ?? '')) ? heHTML(displayVal) : `<bdi dir="ltr">${fractionsToHTML(displayVal)}</bdi>`}</span>
        </div>`
      }).join('')}</div>`
    } else {
      const ansLabel = isHebrew ? 'תשובה:' : isBilingual ? 'Answer / תשובה:' : 'Answer:'
      answerHTML = `<div class="answer-line"><span class="ans-label">${ansLabel}</span><span class="line"></span></div>`
    }

    const hintText = isHebrew && q.hint_he ? q.hint_he : q.hint_en
    const hintHTML = showHints && hintText ? `<div class="hint">💡 <em>${heHTML(hintText)}</em></div>` : ''
    const topicBadge = topics.length > 1
      ? `<span class="topic-badge">${isHebrew && q.topicTitleHe ? q.topicTitleHe : q.topicTitle}</span>` : ''
    const enText = !isHebrew && q.prompt_en ? `<div class="q-text-en">${fractionsToHTML(q.prompt_en)}</div>` : ''
    // .q-text-he sets direction:rtl for real Hebrew narrative text — correct
    // there, but a prompt_he that's ENTIRELY a bare equation (no Hebrew
    // characters at all, e.g. "3.5 + 2.4 = ___") has no strong-directional
    // character for the bidi algorithm to anchor on, so it falls back to
    // the block's RTL base direction and the whole sequence of number/
    // operator groups gets reordered right-to-left as a unit — reads as
    // "___ = 2.4 + 3.5". Confirmed live. An inline style (max CSS
    // specificity, beats the class's direction:rtl) flips just this case
    // to direction:ltr — same mechanism already proven for .ws-equation
    // above, which has no competing class-level direction to override.
    //
    // A prompt_he MIXING narrative Hebrew with an embedded equation (e.g.
    // "פתרו: 3.5 + 2.4 = ___") has the identical problem on just the
    // embedded substring, not the whole line — confirmed occurring in real
    // content 2026-08-05 (e.g. "5 x 3/10 = ___ בצורה פשוטה ביותר"), not
    // just theoretical. segmentHebrewMath splits it into alternating text/
    // math runs, rendered as separate lines below rather than one line —
    // sidesteps inline bidi isolation entirely (no character-level
    // tokenizer needed) since block-level lines don't bidi-interact.
    const heText = !isEnglish && q.prompt_he && (!isBilingual || isDistinctHe(q.prompt_he, q.prompt_en))
      ? renderHeTextLines(q.prompt_he) : ''

    // 55 known rows (confirmed live) have prompt_en set but prompt_he null —
    // in he_only mode that used to render neither enText (gated on
    // !isHebrew) nor heText (gated on q.prompt_he), so the question printed
    // with only its badge/options/hint and no prompt text at all. Fall back
    // to the other language's prompt rather than nothing — same
    // "honest partial info beats silence" principle the answer-key section
    // below already applies (`isHebrew && q.prompt_he ? q.prompt_he :
    // q.prompt_en`); this closes an inconsistency against that existing
    // convention rather than introducing a new one. A prompt_en fallback
    // needs the same bare-equation LTR override as heText above: the page
    // is dir="rtl" in he_only mode, so a bare equation with no strong-
    // directional character would suffer the identical UAX#9 reversal bug
    // already fixed for prompt_he, just via a different field. The en_only
    // side is symmetric future-proofing — 0 rows need it today (confirmed
    // live: 0 rows have prompt_en null with prompt_he present).
    const enPromptIsBareEquation = !!extractBareEquation(q.prompt_en)
    const fallbackText = isHebrew && !q.prompt_he && q.prompt_en
      ? `<div class="q-text-en"${enPromptIsBareEquation ? ' style="direction:ltr;text-align:left"' : ''}>${fractionsToHTML(q.prompt_en)}</div>`
      : isEnglish && !q.prompt_en && q.prompt_he
      ? `<div class="q-text-he">${heHTML(q.prompt_he)}</div>`
      : ''

    // Same field the student actually sees drives the work-column equation
    // too — prompt_en is often just an internal gloss in he_only mode (see
    // languageInstruction in questions/generate/route.ts), not real content.
    const workEquation = extractBareEquation(isHebrew ? q.prompt_he : q.prompt_en)
    const workEquationHTML = workEquation
      ? `<div class="ws-equation" dir="ltr">${fractionsToHTML(workEquation)}</div>` : ''
    const workLineCount = workEquation ? 4 : 6

    return `
      <div class="question">
        <div class="q-left">
          <div class="q-header">
            <div class="q-number">${isHebrew ? "" : "Q"}${i + 1}</div>
            ${topicBadge}
            <span class="diff-badge diff-${q.difficulty}">${isHebrew ? translateDifficulty(q.difficulty) : q.difficulty}</span>
          </div>
          <div class="q-body">
            ${enText}${heText}${fallbackText}${visualHTML}${answerHTML}${hintHTML}
          </div>
        </div>
        <div class="q-workspace">
          <div class="workspace-label">${isHebrew ? 'עבודה' : 'Working'}</div>
          ${workEquationHTML}
          <div class="workspace-lines">
            ${Array.from({ length: workLineCount }, () => '<div class="ws-line"></div>').join('')}
          </div>
        </div>
      </div>`
  }).join('')

  const answerKeyHTML = includeKey ? `
    <div class="answer-key-section">
      <div class="answer-key-title">✅ ${isHebrew ? 'תשובות' : 'Answer Key'} — ${typeEmoji} ${isHebrew ? (wsType === 'practice' ? 'תרגול' : wsType === 'quiz' ? 'חידון' : 'מבחן') : typeLabel}</div>
      <div class="key-grid">
        ${questions.map((q: any, i: number) => {
          const co = Array.isArray(q.options) ? q.options.find((o: any) => o.isCorrect) : null
          const keyText = co
            ? `${isHebrew ? translateOptionLabel(co.label) : co.label}. ${isHebrew ? heHTML(co.value_he || co.value_en) : `<bdi dir="ltr">${fractionsToHTML(co.value_en)}</bdi>`}`
            : (isHebrew ? heHTML(q.correct_answer) : fractionsToHTML(q.correct_answer))
          return `<div class="key-item"><div class="key-q">${isHebrew ? "" : "Q"}${i + 1}</div><div class="key-a">${keyText}</div></div>`
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
          const explain = isHebrew ? (q.explanation_he || null) : q.explanation_en
          const co      = Array.isArray(q.options) ? q.options.find((o: any) => o.isCorrect) : null
          const ans     = co ? `${isHebrew ? translateOptionLabel(co.label) : co.label}. ${isHebrew ? (co.value_he || co.value_en) : co.value_en}` : q.correct_answer
          return `<div style="padding:12px 16px;border:1px solid #EEF1F6;border-radius:10px;page-break-inside:avoid;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
              <div style="font-size:12px;font-weight:900;color:white;background:#27AE60;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${isHebrew ? '' : 'Q'}${i + 1}</div>
              <div style="font-size:13px;font-weight:700;color:#1A2E4A;${isHebrew ? 'direction:rtl;text-align:right;' : ''}">${isHebrew ? heHTML(prompt) : fractionsToHTML(prompt)}</div>
            </div>
            ${hint ? `<div style="font-size:12px;color:#F5A623;margin-bottom:6px;padding:5px 10px;background:#FFFBF0;border-left:3px solid #F5A623;border-radius:0 6px 6px 0;">💡 ${isHebrew ? heHTML(hint) : fractionsToHTML(hint)}</div>` : ''}
            <div style="font-size:13px;color:#27AE60;font-weight:800;">✅ ${isHebrew ? 'תשובה' : 'Answer'}: ${isHebrew ? heHTML(ans) : fractionsToHTML(ans)}</div>
            ${explain ? `<div style="font-size:12px;color:#5A6A7E;margin-top:5px;line-height:1.6;white-space:pre-line;">📝 ${isHebrew ? heHTML(explain) : fractionsToHTML(explain)}</div>` : ''}
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
    .ws-equation { font-size: 13px; font-weight: 700; color: #4A5568; margin-bottom: 8px; }
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

    ${BRAND_CSS}
    .exam-bar { display:flex; gap:16px; align-items:center; padding:8px 14px; margin-bottom:14px; border:2px solid #0F766E; border-radius:10px; font-weight:800; color:#0F3D3A; }
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
    <button class="btn-print" onclick="window.print()">🖨️ ${isHebrew ? 'הדפסה / שמירה כ-PDF' : 'Print / Save as PDF'}</button>
    <button class="btn-close" onclick="window.close()">✕ ${isHebrew ? 'סגירה' : 'Close'}</button>
  </div>

  ${brandHeader(b, isHebrew, wsType === 'exam' ? 'think' : 'wave')}
  <div class="header">
    <div>
      <div class="ws-title">${customTitle ? customTitle : ''}</div>
    </div>
    <div class="header-meta">
      ${child.display_name ? `<div><strong>${isHebrew ? 'תלמיד' : 'Student'}:</strong> ${child.display_name}</div>` : ''}
      <div><strong>${isHebrew ? 'כיתה' : 'Grade'}:</strong> ${isHebrew ? 'כיתה' : 'Grade'} ${child.grade === 0 ? 'K' : child.grade}</div>
      <div><strong>${isHebrew ? 'תאריך' : 'Date'}:</strong> ${date}</div>
    </div>
  </div>

  ${wsType === 'exam' && timeMinutes ? `<div class="exam-bar">⏱ ${isHebrew ? `משך המבחן: ${timeMinutes} דקות` : `Time: ${timeMinutes} minutes`}<span style="margin-inline-start:auto;font-weight:600">${isHebrew ? 'בהצלחה!' : 'Good luck!'}</span></div>` : ''}
  <div class="ws-title">${isHebrew ? subjectLabelHe : subjectLabel} — ${typeEmoji} ${isHebrew ? (wsType === 'practice' ? 'תרגול' : wsType === 'quiz' ? 'חידון' : 'מבחן') : typeLabel}</div>
  <div class="ws-topics">${topicLabels}</div>

  <div class="badges">
    <span class="badge badge-blue">${isHebrew ? subjectLabelHe : subjectLabel}</span>
    <span class="badge badge-blue">${isHebrew ? 'כיתה' : 'Grade'} ${child.grade === 0 ? 'K' : child.grade}</span>
    <span class="badge badge-${difficulty === 'easy' ? 'green' : difficulty === 'hard' ? 'red' : difficulty === 'mixed' ? 'purple' : 'orange'}">${isHebrew ? translateDifficulty(difficulty) : diffLabel}</span>
    <span class="badge badge-purple">${questions.length} ${isHebrew ? 'שאלות' : 'Questions'}</span>
    ${includeKey ? `<span class="badge badge-green">${isHebrew ? 'כולל תשובות' : 'Answer Key Included'}</span>` : ''}
  </div>

  <div class="student-row">
    <div class="student-field"><span class="student-label">${isHebrew ? 'שם:' : 'Name:'}</span><span class="student-line"></span></div>
    <div class="student-field"><span class="student-label">${isHebrew ? 'ציון:' : 'Score:'}</span><span class="student-line"></span></div>
    <div class="student-field"><span class="student-label">${isHebrew ? 'תאריך:' : 'Date:'}</span><span class="student-line"></span></div>
  </div>

  ${questionsHTML}

  ${brandFooter(b, isHebrew)}

  ${answerKeyHTML}
  ${stepsHTML}
  ${answerKeyHTML || stepsHTML ? brandFooter(b, isHebrew) : ''}

  <script>setTimeout(() => window.print(), 800)</script>
</body>
</html>`
}
