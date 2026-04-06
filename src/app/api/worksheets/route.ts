import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const supabase = createServerClient()
  const { searchParams } = new URL(req.url)

  const topicId    = searchParams.get('topicId')
  const childId    = searchParams.get('childId')
  const difficulty = searchParams.get('difficulty') || 'easy'
  const langMode   = searchParams.get('lang') || 'bilingual'
  const includeKey = searchParams.get('answerKey') === 'true'

  if (!topicId || !childId) {
    return NextResponse.json({ error: 'topicId and childId required' }, { status: 400 })
  }

  try {
    // Fetch topic
    const { data: topic } = await supabase
      .from('topics')
      .select('*, subject:subjects(*)')
      .eq('id', topicId)
      .single()

    // Fetch child
    const { data: child } = await supabase
      .from('children')
      .select('*')
      .eq('id', childId)
      .single()

    // Fetch questions
    const { data: questions } = await supabase
      .from('questions')
      .select('*')
      .eq('topic_id', topicId)
      .eq('difficulty', difficulty)
      .eq('approved', true)
      .limit(12)

    if (!topic || !child || !questions || questions.length === 0) {
      return NextResponse.json({ error: 'Not enough data to generate worksheet' }, { status: 404 })
    }

    // Generate HTML worksheet
    const html = generateWorksheetHTML({
      topic,
      child,
      questions,
      difficulty,
      langMode,
      includeKey,
      date: new Date().toLocaleDateString('en-GB'),
    })

    // Return HTML that triggers print dialog
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

function renderFraction(value: string): string {
  if (!value.includes('/')) return value
  const [n, d] = value.split('/')
  return `<span class="fraction"><span class="frac-num">${n}</span><span class="frac-bar"></span><span class="frac-den">${d}</span></span>`
}

function generateWorksheetHTML({ topic, child, questions, difficulty, langMode, includeKey, date }: any) {
  const subjectLabel = topic.subject?.label_en || 'Mathematics'
  const gradeLabel   = `Grade ${child.grade}`
  const diffLabel    = difficulty.charAt(0).toUpperCase() + difficulty.slice(1)
  const isHebrew     = langMode === 'he_only'
  const isBilingual  = langMode === 'bilingual'

  const questionsHTML = questions.map((q: any, i: number) => {
    const promptEn = q.prompt_en
    const promptHe = q.prompt_he

    let visualHTML = ''
    if (q.visual_data?.type === 'fraction') {
      const { n, d } = q.visual_data
      const boxes = Array.from({ length: d }, (_: any, idx: number) =>
        `<div class="vis-box ${idx < n ? 'filled' : ''}"></div>`
      ).join('')
      visualHTML = `<div class="visual-row">${boxes}<span class="visual-label">= ${renderFraction(`${n}/${d}`)}</span></div>`
    }

    let optionsHTML = ''
    if (q.options) {
      optionsHTML = `<div class="options-grid">${q.options.map((opt: any) =>
        `<div class="option">
          <span class="opt-label">${opt.label}.</span>
          <span class="opt-value">${renderFraction(opt.value_en)}</span>
          ${includeKey && opt.isCorrect ? '<span class="answer-mark">✓</span>' : ''}
        </div>`
      ).join('')}</div>`
    } else {
      optionsHTML = `<div class="answer-line"><span>Answer: </span><span class="line"></span>${includeKey ? `<span class="answer-key">${renderFraction(q.correct_answer)}</span>` : ''}</div>`
    }

    return `
      <div class="question">
        <div class="q-number">Q${i + 1}</div>
        <div class="q-body">
          ${!isHebrew ? `<div class="q-text-en">${promptEn}</div>` : ''}
          ${(isBilingual || isHebrew) && promptHe ? `<div class="q-text-he">${promptHe}</div>` : ''}
          ${visualHTML}
          ${optionsHTML}
        </div>
      </div>`
  }).join('')

  return `<!DOCTYPE html>
<html dir="${isHebrew ? 'rtl' : 'ltr'}">
<head>
  <meta charset="UTF-8"/>
  <title>EduPlay Worksheet — ${topic.title_en}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+Hebrew:wght@400;700&family=Nunito:wght@400;700;800;900&display=swap');

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Nunito', sans-serif;
      background: white;
      color: #1a1a2e;
      padding: 32px 40px;
      max-width: 800px;
      margin: 0 auto;
    }

    /* HEADER */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 3px solid #4A7FD4;
      padding-bottom: 14px;
      margin-bottom: 20px;
    }
    .logo { font-size: 22px; font-weight: 900; color: #1A2E4A; }
    .logo span { color: #4A7FD4; }
    .header-meta { font-size: 12px; color: #6B7A8D; text-align: right; line-height: 1.8; }
    .topic-title { font-size: 18px; font-weight: 800; color: #1A2E4A; margin-bottom: 4px; }
    .topic-title-he { font-size: 16px; font-weight: 700; color: #4A7FD4; font-family: 'Noto Serif Hebrew', serif; direction: rtl; margin-bottom: 12px; }
    .badges { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
    .badge { padding: 3px 12px; border-radius: 50px; font-size: 11px; font-weight: 800; }
    .badge-blue { background: #EBF2FF; color: #4A7FD4; }
    .badge-green { background: #EAFAF1; color: #27AE60; }
    .badge-orange { background: #FFF8EC; color: #F5A623; }

    /* STUDENT INFO */
    .student-row {
      display: flex;
      gap: 24px;
      margin-bottom: 24px;
      padding: 12px 16px;
      background: #F8F9FB;
      border-radius: 8px;
      font-size: 13px;
    }
    .student-field { display: flex; align-items: center; gap: 8px; }
    .student-label { font-weight: 800; color: #6B7A8D; }
    .student-line { border-bottom: 1.5px solid #9AA5B8; width: 120px; display: inline-block; }

    /* QUESTIONS */
    .question {
      display: flex;
      gap: 14px;
      margin-bottom: 24px;
      padding: 14px 16px;
      border: 1px solid #EEF1F6;
      border-radius: 10px;
      page-break-inside: avoid;
    }
    .q-number {
      font-size: 13px;
      font-weight: 900;
      color: white;
      background: #4A7FD4;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .q-body { flex: 1; }
    .q-text-en { font-size: 14px; font-weight: 600; color: #1A2E4A; margin-bottom: 6px; line-height: 1.6; }
    .q-text-he { font-size: 13px; color: #4A7FD4; font-family: 'Noto Serif Hebrew', serif; direction: rtl; text-align: right; margin-bottom: 8px; line-height: 1.7; }

    /* FRACTION */
    .fraction { display: inline-flex; flex-direction: column; align-items: center; vertical-align: middle; margin: 0 3px; font-family: Georgia, serif; }
    .frac-num { font-size: 13px; font-weight: 700; line-height: 1; padding-bottom: 1px; }
    .frac-bar { width: 100%; min-width: 14px; height: 1.5px; background: currentColor; margin: 2px 0; display: block; }
    .frac-den { font-size: 13px; font-weight: 700; line-height: 1; padding-top: 1px; }

    /* VISUAL */
    .visual-row { display: flex; align-items: center; gap: 5px; margin: 8px 0; flex-wrap: wrap; }
    .vis-box { width: 24px; height: 24px; border: 1.5px solid #4A7FD4; border-radius: 3px; }
    .vis-box.filled { background: #4A7FD4; }
    .visual-label { font-size: 14px; color: #1A2E4A; margin-left: 8px; }

    /* OPTIONS */
    .options-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 10px; }
    .option { display: flex; align-items: center; gap: 8px; padding: 7px 10px; border: 1px solid #DEE2E6; border-radius: 6px; font-size: 13px; }
    .opt-label { font-weight: 800; color: #4A7FD4; }
    .opt-value { font-family: Georgia, serif; font-weight: 600; }
    .answer-mark { margin-left: auto; color: #27AE60; font-weight: 900; font-size: 16px; }

    /* ANSWER LINE */
    .answer-line { display: flex; align-items: center; gap: 10px; margin-top: 10px; font-size: 13px; font-weight: 700; color: #6B7A8D; }
    .line { flex: 1; border-bottom: 1.5px solid #9AA5B8; }
    .answer-key { color: #27AE60; font-weight: 900; font-family: Georgia, serif; }

    /* FOOTER */
    .footer {
      margin-top: 32px;
      padding-top: 14px;
      border-top: 1px solid #EEF1F6;
      font-size: 10px;
      color: #9AA5B8;
      line-height: 1.7;
    }

    /* ANSWER KEY PAGE */
    .answer-key-section { page-break-before: always; padding-top: 24px; }
    .answer-key-title { font-size: 18px; font-weight: 900; color: #27AE60; margin-bottom: 16px; }
    .key-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    .key-item { padding: 10px; border: 1.5px solid #EAFAF1; border-radius: 8px; text-align: center; }
    .key-q { font-size: 12px; font-weight: 800; color: #6B7A8D; margin-bottom: 4px; }
    .key-a { font-size: 15px; font-weight: 900; color: #27AE60; font-family: Georgia, serif; }

    @media print {
      body { padding: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>

  <!-- Print button (hidden when printing) -->
  <div class="no-print" style="text-align:right; margin-bottom: 16px;">
    <button onclick="window.print()" style="padding: 10px 24px; background: #4A7FD4; color: white; border: none; border-radius: 50px; font-size: 14px; font-weight: 800; cursor: pointer; font-family: Nunito, sans-serif;">
      🖨️ Print / Save as PDF
    </button>
    <button onclick="window.close()" style="padding: 10px 24px; background: #F3F4F6; color: #4B5563; border: none; border-radius: 50px; font-size: 14px; font-weight: 800; cursor: pointer; font-family: Nunito, sans-serif; margin-left: 8px;">
      ✕ Close
    </button>
  </div>

  <!-- Header -->
  <div class="header">
    <div>
      <div class="logo">Edu<span>Play</span></div>
      <div style="font-size: 11px; color: #9AA5B8; margin-top: 2px;">eduplay-tau.vercel.app</div>
    </div>
    <div class="header-meta">
      <div><strong>Student:</strong> ${child.display_name}</div>
      <div><strong>Grade:</strong> ${gradeLabel}</div>
      <div><strong>Date:</strong> ${date}</div>
    </div>
  </div>

  <!-- Topic -->
  <div class="topic-title">${topic.title_en}</div>
  ${topic.title_he ? `<div class="topic-title-he">${topic.title_he}</div>` : ''}

  <div class="badges">
    <span class="badge badge-blue">${subjectLabel}</span>
    <span class="badge badge-blue">${gradeLabel}</span>
    <span class="badge badge-green">${diffLabel}</span>
    ${includeKey ? '<span class="badge badge-orange">Answer Key Included</span>' : ''}
  </div>

  <!-- Student info -->
  <div class="student-row">
    <div class="student-field"><span class="student-label">Name:</span><span class="student-line"></span></div>
    <div class="student-field"><span class="student-label">Score:</span><span class="student-line"></span></div>
    <div class="student-field"><span class="student-label">Date:</span><span class="student-line"></span></div>
  </div>

  <!-- Questions -->
  ${questionsHTML}

  <!-- Footer disclaimer -->
  <div class="footer">
    EduPlay worksheets are curriculum-aligned and designed by educational content specialists. Parents are encouraged to review all materials before use. EduPlay does not replace professional educational assessment.<br/>
    Generated by EduPlay · eduplay-tau.vercel.app
  </div>

  ${includeKey ? `
  <div class="answer-key-section">
    <div class="answer-key-title">✅ Answer Key</div>
    <div class="key-grid">
      ${questions.map((q: any, i: number) => `
        <div class="key-item">
          <div class="key-q">Q${i + 1}</div>
          <div class="key-a">${renderFraction(q.correct_answer)}</div>
        </div>
      `).join('')}
    </div>
  </div>` : ''}

  <script>
    // Auto-open print dialog after a short delay
    setTimeout(() => window.print(), 800)
  </script>

</body>
</html>`
}
