import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase'
import { authorizeChildAccess } from '@/lib/session'
import { brandBits } from '@/lib/printBrand'
import { generateHTML, noQuestionsHTML } from '@/lib/worksheetHtml'

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
  const timeMinutes   = parseInt(searchParams.get('timeMinutes') || '0') || null
  const materialId    = searchParams.get('materialId')
  const noPrint       = searchParams.get('noprint') === '1'

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
      }).sort((a: any, b: any) => questionIds.indexOf(a.id) - questionIds.indexOf(b.id))
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
    // A Create material supplies its own title (same family only)
    let customTitle: string | null = null
    if (materialId) {
      const { data: mat } = await supabase.from('materials').select('title, family_id').eq('id', materialId).maybeSingle()
      if (mat && mat.family_id === child.family_id) customTitle = mat.title
    }
    const brand = await brandBits(new URL(req.url).origin)
    const html = generateHTML({
      child, topics, questions: finalQuestions,
      difficulty, langMode, includeKey,
      wsType, includeHints, solutionSteps,
      date: new Date().toLocaleDateString('en-GB'),
      subject, brand, customTitle, timeMinutes,
    })

    // ── Log this generation to worksheet_generations (history/regenerate) ──
    // Records the resolved question set for both the questionIds path (Library
    // "create worksheet from selected") and the topicIds random-pull path — so
    // even a random-pull worksheet becomes exactly reproducible via regenerate.
    // Skipped when isRegenerate: reprinting an existing history row is not a new
    // generation event, and logging it again would make History inflate every
    // time someone re-prints instead of reflecting distinct worksheets created.
    // Wrapped in try/catch: a logging failure must never break the print view.
    if (!isRegenerate && !noPrint) {
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

    // REMOVED (2026-08-03): this used to attempt an auto-save of `finalQuestions` back
    // into `questions` with `approved: true, source: 'worksheet_builder'`. It was flagged
    // in review as "a second creation path that bypasses Pending Review" — but traced end
    // to end, `finalQuestions` is always read directly from `questions` in the first place
    // (either by hand-picked ID, or by topic+difficulty+`approved=true`), so this route
    // never generates new content at all; there was nothing to save that didn't already
    // exist. Worse, the write itself had been silently failing on every single call since
    // it was written: `questions` has no `source` column, so every upsert threw
    // `PGRST204` and the surrounding `catch {}` swallowed it. Confirmed live — a real
    // worksheet generation left the topic's question count unchanged before/after. No
    // replacement needed: the real, working audit trail for "what did I print, and when"
    // is `worksheet_generations` (see the block above, and `/api/worksheets/history`),
    // which is unrelated to this dead code and was never affected by its removal.

    return new NextResponse(noPrint ? html.replace('<script>setTimeout(() => window.print(), 800)</script>', '') : html, {
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
