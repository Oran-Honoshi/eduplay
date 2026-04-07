import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const supabase = createServerClient()
  const { searchParams } = new URL(req.url)

  const childId       = searchParams.get('childId')
  const topicIds      = searchParams.get('topicIds')?.split(',') || []
  const difficulty    = searchParams.get('difficulty') || 'mixed'
  const questionCount = parseInt(searchParams.get('questionCount') || '20')
  const langMode      = searchParams.get('lang') || 'bilingual'
  const includeKey    = searchParams.get('answerKey') === 'true'
  const wsType        = searchParams.get('wsType') || 'practice'

  if (!childId || topicIds.length === 0) {
    return NextResponse.json({ error: 'childId and topicIds required' }, { status: 400 })
  }

  try {
    // Fetch child
    const { data: child } = await supabase
      .from('children').select('*').eq('id', childId).single()

    // Fetch topics
    const { data: topics } = await supabase
      .from('topics')
      .select('*, subject:subjects(*)')
      .in('id', topicIds)
      .order('sort_order')

    if (!child || !topics || topics.length === 0) {
      return NextResponse.json({ error: 'Child or topics not found' }, { status: 404 })
    }

    // Calculate questions per topic
    const qPerTopic = Math.max(1, Math.ceil(questionCount / topics.length))

    // Fetch questions for each topic
    const allQuestions: any[] = []

    for (const topic of topics) {
      const difficulties = difficulty === 'mixed'
        ? ['easy', 'medium', 'hard']
        : [difficulty]

      for (const diff of difficulties) {
        const limit = difficulty === 'mixed'
          ? Math.ceil(qPerTopic / 3)
          : qPerTopic

        const { data: qs } = await supabase
          .from('questions')
          .select('*')
          .eq('topic_id', topic.id)
          .eq('difficulty', diff)
          .eq('approved', true)
          .limit(limit)

        if (qs) {
          allQuestions.push(...qs.map(q => ({ ...q, topicTitle: topic.title_en, topicTitleHe: topic.title_he })))
        }
      }
    }

    // Shuffle and limit to requested count
    const shuffled = allQuestions
      .sort(() => Math.random() - 0.5)
      .slice(0, questionCount)

    if (shuffled.length === 0) {
      return new NextResponse(noQuestionsHTML(child, wsType), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      })
    }

    const subject = topics[0]?.subject
    const html = generateBuilderHTML({
      child, topics, questions: shuffled,
      difficulty, langMode, includeKey,
      wsType, questionCount,
      date: new Date().toLocaleDateString('en-GB'),
      subject,
    })

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

function renderFraction(value: string): string {
  if (!value || !value.includes('/')) return value || ''
  const [n, d] = value.split('/')
  return `<span class="fraction"><span class="frac-num">${n}</span><span class="frac-bar"></span><span class="frac-den">${d}</span></span>`
}

function noQuestionsHTML(child: any, wsType: string) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>EduPlay</title></head>
  <body style="font-family:Nunito,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#F8F9FB;">
    <div style="text-align:center;padding:40px;">
      <div style="font-size:48px;margin-bottom:16px;">📚</div>
      <h2 style="color:#1E2D4E;font-size:20px;">No questions found yet</h2>
      <p style="color:#6B7A8D;font-size:14px;">The question bank for these topics is still being built.<br/>Check back soon!</p>
      <button onclick="window.close()" style="margin-top:20px;padding:10px 24px;background:#4A7FD4;color:white;border:none;border-radius:50px;font-size:14px;font-weight:800;cursor:pointer;">Close</button>
    </div>
  </body></html>`
}

function generateBuilderHTML({ child, topics, questions, difficulty, langMode, includeKey, wsType, questionCount, date, subject }: any) {
  const isHebrew   = langMode === 'he_only'
  const isBilingual = langMode === 'bilingual'
  const subjectLabel = subject?.label_en || 'Worksheet'
  const topicLabels  = topics.map((t: any) => t.title_en).join(' · ')
  const diffLabel    = difficulty.charAt(0).toUpperCase() + difficulty.slice(1)
  const typeLabel    = wsType === 'practice' ? '📝 Practice' : wsType === 'quiz' ? '✅ Quiz' : '🎓 Exam'
  const showHints    = wsType === 'practice'

  const questionsHTML = questions.map((q: any, i: number) => {
    const promptEn = q.prompt_en
    const promptHe = q.prompt_he

    // Visual illustration
    let visualHTML = ''
    if (q.visual_data?.type === 'fraction') {
      const { n, d } = q.visual_data
      const boxes = Array.from({ length: d }, (_: any, idx: number) =>
        `<div class="vis-box ${idx < n ? 'filled' : ''}"></div>`
      ).join('')
      visualHTML = `<div class="visual-row">${boxes}<span class="visual-eql">= ${renderFraction(`${n}/${d}`)}</span></div>`
    }

    // Options or answer line
    let answerHTML = ''
    if (q.options) {
      // Never show which is correct in the question — only in answer key
      answerHTML = `<div class="options-grid">${q.options.map((opt: any) =>
        `<div class="option">
          <span class="opt-label">${opt.label}.</span>
          <span class="opt-value">${renderFraction(opt.value_en)}</span>
        </div>`
      ).join('')}</div>`
    } else {
      answerHTML = `<div class="answer-line"><span class="ans-label">Answer:</span><span class="line"></span></div>`
    }

    // Hint (practice only)
    const hintHTML = showHints && q.hint_en
      ? `<div class="hint">💡 <em>${q.hint_en}</em></div>`
      : ''

    // Topic badge
    const topicBadge = topics.length > 1
      ? `<span class="topic-badge">${q.topicTitle}</span>`
      : ''

    return `
      <div class="question">
        <div class="q-header">
          <div class="q-number">Q${i + 1}</div>
          ${topicBadge}
          <span class="diff-badge diff-${q.difficulty}">${q.difficulty}</span>
        </div>
        <div class="q-body">
          ${!isHebrew ? `<div class="q-text-en">${promptEn}</div>` : ''}
          ${(isBilingual || isHebrew) && promptHe ? `<div class="q-text-he">${promptHe}</div>` : ''}
          ${visualHTML}
          ${answerHTML}
          ${hintHTML}
        </div>
      </div>`
  }).join('')

  // Answer key
  const answerKeyHTML = includeKey ? `
    <div class="answer-key-section">
      <div class="answer-key-title">✅ Answer Key — ${typeLabel}</div>
      <div class="key-grid">
        ${questions.map((q: any, i: number) => `
          <div class="key-item">
            <div class="key-q">Q${i + 1}</div>
            <div class="key-a">${renderFraction(q.correct_answer)}</div>
          </div>
        `).join('')}
      </div>
    </div>` : ''

  return `<!DOCTYPE html>
<html dir="${isHebrew ? 'rtl' : 'ltr'}">
<head>
  <meta charset="UTF-8"/>
  <title>EduPlay — ${subjectLabel} Worksheet</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+Hebrew:wght@400;700&family=Nunito:wght@400;700;800;900&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Nunito', sans-serif; background: white; color: #1a1a2e; padding: 32px 40px; max-width: 820px; margin: 0 auto; }

    .no-print { margin-bottom: 16px; display: flex; gap: 8px; justify-content: flex-end; }
    .btn-print { padding: 10px 24px; background: #4A7FD4; color: white; border: none; border-radius: 50px; font-size: 14px; font-weight: 800; cursor: pointer; font-family: Nunito,sans-serif; }
    .btn-close { padding: 10px 24px; background: #F3F4F6; color: #4B5563; border: none; border-radius: 50px; font-size: 14px; font-weight: 800; cursor: pointer; font-family: Nunito,sans-serif; }

    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #4A7FD4; padding-bottom: 14px; margin-bottom: 16px; }
    .logo { font-size: 22px; font-weight: 900; color: #1A2E4A; }
    .logo span { color: #4A7FD4; }
    .header-meta { font-size: 12px; color: #6B7A8D; text-align: right; line-height: 1.9; }
    .ws-title { font-size: 20px; font-weight: 900; color: #1A2E4A; margin-bottom: 3px; }
    .ws-topics { font-size: 12px; color: #9AA5B8; margin-bottom: 10px; }

    .badges { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
    .badge { padding: 3px 12px; border-radius: 50px; font-size: 11px; font-weight: 800; }
    .badge-blue { background: #EBF2FF; color: #4A7FD4; }
    .badge-green { background: #EAFAF1; color: #27AE60; }
    .badge-orange { background: #FFF8EC; color: #F5A623; }
    .badge-purple { background: #F5F0FF; color: #8B5CF6; }

    .student-row { display: flex; gap: 24px; margin-bottom: 20px; padding: 10px 14px; background: #F8F9FB; border-radius: 8px; font-size: 13px; }
    .student-field { display: flex; align-items: center; gap: 8px; }
    .student-label { font-weight: 800; color: #6B7A8D; }
    .student-line { border-bottom: 1.5px solid #9AA5B8; width: 120px; display: inline-block; }

    .question { margin-bottom: 20px; padding: 14px 16px; border: 1px solid #EEF1F6; border-radius: 10px; page-break-inside: avoid; }
    .q-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    .q-number { font-size: 13px; font-weight: 900; color: white; background: #4A7FD4; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .topic-badge { font-size: 10px; font-weight: 800; background: #EBF2FF; color: #4A7FD4; padding: 2px 9px; border-radius: 50px; }
    .diff-badge { font-size: 10px; font-weight: 800; padding: 2px 9px; border-radius: 50px; margin-left: auto; }
    .diff-easy { background: #EAFAF1; color: #27AE60; }
    .diff-medium { background: #FFF8EC; color: #F5A623; }
    .diff-hard { background: #FEECEC; color: #FF6B6B; }

    .q-text-en { font-size: 14px; font-weight: 600; color: #1A2E4A; margin-bottom: 6px; line-height: 1.6; }
    .q-text-he { font-size: 13px; color: #4A7FD4; font-family: 'Noto Serif Hebrew',serif; direction: rtl; text-align: right; margin-bottom: 8px; line-height: 1.7; }

    .fraction { display: inline-flex; flex-direction: column; align-items: center; vertical-align: middle; margin: 0 3px; font-family: Georgia,serif; }
    .frac-num { font-size: 13px; font-weight: 700; line-height: 1; padding-bottom: 1px; }
    .frac-bar { width: 100%; min-width: 14px; height: 1.5px; background: currentColor; margin: 2px 0; display: block; }
    .frac-den { font-size: 13px; font-weight: 700; line-height: 1; padding-top: 1px; }

    .visual-row { display: flex; align-items: center; gap: 5px; margin: 8px 0; flex-wrap: wrap; }
    .vis-box { width: 26px; height: 26px; border: 1.5px solid #4A7FD4; border-radius: 3px; }
    .vis-box.filled { background: #4A7FD4; }
    .visual-eql { font-size: 14px; color: #1A2E4A; margin-left: 8px; }

    .options-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 10px; }
    .option { display: flex; align-items: center; gap: 8px; padding: 8px 10px; border: 1px solid #DEE2E6; border-radius: 6px; font-size: 13px; }
    .opt-label { font-weight: 800; color: #4A7FD4; min-width: 16px; }
    .opt-value { font-family: Georgia,serif; font-weight: 600; }

    .answer-line { display: flex; align-items: center; gap: 10px; margin-top: 10px; font-size: 13px; font-weight: 700; color: #6B7A8D; }
    .ans-label { white-space: nowrap; }
    .line { flex: 1; border-bottom: 1.5px solid #9AA5B8; }

    .hint { margin-top: 8px; font-size: 12px; color: #9AA5B8; padding: 6px 10px; background: #FFFBF0; border-left: 3px solid #F5A623; border-radius: 0 6px 6px 0; }

    .footer { margin-top: 28px; padding-top: 12px; border-top: 1px solid #EEF1F6; font-size: 10px; color: #9AA5B8; line-height: 1.7; }

    .answer-key-section { page-break-before: always; padding-top: 24px; }
    .answer-key-title { font-size: 18px; font-weight: 900; color: #27AE60; margin-bottom: 16px; }
    .key-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; }
    .key-item { padding: 10px; border: 1.5px solid #EAFAF1; border-radius: 8px; text-align: center; }
    .key-q { font-size: 12px; font-weight: 800; color: #6B7A8D; margin-bottom: 4px; }
    .key-a { font-size: 14px; font-weight: 900; color: #27AE60; font-family: Georgia,serif; }

    @media print {
      .no-print { display: none; }
      body { padding: 16px; }
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
      <div style="font-size:11px;color:#9AA5B8;margin-top:2px;">eduplay-tau.vercel.app</div>
    </div>
    <div class="header-meta">
      <div><strong>Student:</strong> ${child.display_name}</div>
      <div><strong>Grade:</strong> Grade ${child.grade}</div>
      <div><strong>Date:</strong> ${date}</div>
    </div>
  </div>

  <div class="ws-title">${subjectLabel} — ${typeLabel}</div>
  <div class="ws-topics">${topicLabels}</div>

  <div class="badges">
    <span class="badge badge-blue">${subjectLabel}</span>
    <span class="badge badge-blue">Grade ${child.grade}</span>
    <span class="badge badge-${difficulty === 'easy' ? 'green' : difficulty === 'hard' ? 'orange' : difficulty === 'mixed' ? 'purple' : 'orange'}">${diffLabel}</span>
    <span class="badge badge-purple">${questions.length} Questions</span>
    ${includeKey ? '<span class="badge badge-green">Answer Key Included</span>' : ''}
  </div>

  <div class="student-row">
    <div class="student-field"><span class="student-label">Name:</span><span class="student-line"></span></div>
    <div class="student-field"><span class="student-label">Score:</span><span class="student-line"></span></div>
    <div class="student-field"><span class="student-label">Date:</span><span class="student-line"></span></div>
  </div>

  ${questionsHTML}

  <div class="footer">
    EduPlay worksheets are curriculum-aligned and designed by educational content specialists. Parents are encouraged to review all materials before use. EduPlay does not replace professional educational assessment.<br/>
    Generated by EduPlay · eduplay-tau.vercel.app
  </div>

  ${answerKeyHTML}

  <script>setTimeout(() => window.print(), 800)</script>
</body>
</html>`
}
