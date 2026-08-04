import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createServiceRoleClient } from '@/lib/supabase'
import { requireParentOnlySession } from '@/lib/session'
import { insertQuestions, QuestionInput } from '@/lib/insertQuestions'

// ─── POST /api/questions/generate ──────────────────────────────
// AI-generates a batch of questions for a topic and saves them via
// insertQuestions (approved:false, same as the manual POST /api/questions
// path), logging the request + outcome to question_generations.
//
// Body: {
//   subject_slug, grade, topic_slug,
//   q_types: ('multiple_choice'|'word_problem')[],
//   difficulty: 'easy'|'medium'|'hard',
//   count, progressive, custom_prompt?,
//   notebook_section_id?
// }
//
// notebook_section_id (checkpoint 6): folds the section's body_text + recipe
// prompt_text into the system prompt (additive to family-level
// question_gen_style), attaches up to MAX_NOTEBOOK_FILES of its most-recently
// uploaded files as extra multimodal blocks, locks subject/grade/topic to the
// section's linked topic when one is set, and auto-links the resulting
// question_ids back into notebook_section_questions with added_via:'generated'.

const VALID_DIFFICULTIES = ['easy', 'medium', 'hard']
const VALID_Q_TYPES = ['multiple_choice', 'word_problem']
const VALID_LANGUAGES = ['en_only', 'he_only', 'bilingual']
const MAX_COUNT = 20

// reference_file: optional photo/PDF of a worksheet used as a style/content model
// for generation. Capped at 3MB raw — Vercel serverless functions cap the request
// body at ~4.5MB total, and base64 inflates raw bytes by ~33%, so this leaves
// headroom for the rest of the JSON payload (well under Anthropic's own 32MB limit).
const ALLOWED_REFERENCE_TYPES = ['image/jpeg', 'image/png', 'application/pdf']
const MAX_REFERENCE_FILE_BYTES = 3 * 1024 * 1024

const NOTEBOOK_FILES_BUCKET = 'notebook-files'
const MAX_NOTEBOOK_FILES = 5

// Shared block-construction logic for any base64 file (the one-shot
// reference_file, or a downloaded notebook_files row) attached to the
// Anthropic message.
function fileContentBlock(mediaType: string, base64Data: string) {
  return mediaType === 'application/pdf'
    ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64Data } }
    : { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64Data } }
}

// ─── GET /api/questions/generate ───────────────────────────────
// Recent generation-history rows for the caller's own family, used
// to power the "make more like this" prefill on the /questions page.
export async function GET() {
  const auth = await requireParentOnlySession()
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.status === 401 ? 'Unauthorized' : 'Forbidden' },
      { status: auth.status }
    )
  }

  const { data, error } = await createServiceRoleClient()
    .from('question_generations')
    .select('*')
    .eq('family_id', auth.parent.familyId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ generations: data || [] })
}

export async function POST(req: NextRequest) {
  const auth = await requireParentOnlySession()
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.status === 401 ? 'Unauthorized' : 'Forbidden' },
      { status: auth.status }
    )
  }

  const body = await req.json()
  const { subject_slug: bodySubjectSlug, grade: bodyGrade, topic_slug: bodyTopicSlug, difficulty, progressive } = body
  const q_types: string[] = Array.isArray(body.q_types) ? [...new Set(body.q_types as string[])] : []
  const count = body.count
  const language: string = typeof body.language === 'string' && body.language ? body.language : 'en_only'
  const custom_prompt: string | undefined = typeof body.custom_prompt === 'string' && body.custom_prompt.trim()
    ? body.custom_prompt.trim()
    : undefined
  const notebook_section_id: string | undefined =
    typeof body.notebook_section_id === 'string' && body.notebook_section_id ? body.notebook_section_id : undefined

  const familyId = auth.parent.familyId
  const serviceClient = createServiceRoleClient()

  // ─── notebook_section_id (checkpoint 6): family-scoped lookup up front —
  // a linked topic on the section locks subject/grade/topic_slug below,
  // overriding whatever the client sent for those three fields ───
  let notebookSection: {
    id: string; title: string; body_text: string | null; topic_id: string | null
    topic: { id: string; slug: string; grade: number; title_en: string; subject: { slug: string } | null } | null
  } | null = null

  if (notebook_section_id) {
    const { data: section } = await serviceClient
      .from('notebook_sections')
      .select('id, family_id, title, body_text, topic_id, topic:topics(id, slug, grade, title_en, subject:subjects(slug))')
      .eq('id', notebook_section_id)
      .maybeSingle()

    if (!section) {
      return NextResponse.json({ error: 'notebook_section_id not found' }, { status: 400 })
    }
    if (section.family_id !== familyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    notebookSection = section as any
  }

  const topicLocked = !!(notebookSection?.topic_id && notebookSection.topic)
  const subject_slug: string = topicLocked ? notebookSection!.topic!.subject!.slug : bodySubjectSlug
  const grade: number = topicLocked ? notebookSection!.topic!.grade : bodyGrade
  const topic_slug: string = topicLocked ? notebookSection!.topic!.slug : bodyTopicSlug

  // ─── server-side validation — every field, before any Anthropic call ───
  if (typeof subject_slug !== 'string' || !subject_slug) {
    return NextResponse.json({ error: 'subject_slug is required' }, { status: 400 })
  }
  if (!Number.isInteger(grade) || grade < 0 || grade > 12) {
    return NextResponse.json({ error: 'grade must be an integer between 0 and 12' }, { status: 400 })
  }
  if (typeof topic_slug !== 'string' || !topic_slug) {
    return NextResponse.json({ error: 'topic_slug is required' }, { status: 400 })
  }
  if (q_types.length === 0 || q_types.some(t => !VALID_Q_TYPES.includes(t))) {
    return NextResponse.json(
      { error: `q_types must be a non-empty subset of ${VALID_Q_TYPES.join(', ')}` },
      { status: 400 }
    )
  }
  if (!VALID_DIFFICULTIES.includes(difficulty)) {
    return NextResponse.json(
      { error: `difficulty must be one of ${VALID_DIFFICULTIES.join(', ')}` },
      { status: 400 }
    )
  }
  if (!Number.isInteger(count) || count < 1 || count > MAX_COUNT) {
    return NextResponse.json({ error: `count must be an integer between 1 and ${MAX_COUNT}` }, { status: 400 })
  }
  if (typeof progressive !== 'boolean') {
    return NextResponse.json({ error: 'progressive must be a boolean' }, { status: 400 })
  }
  if (!VALID_LANGUAGES.includes(language)) {
    return NextResponse.json(
      { error: `language must be one of ${VALID_LANGUAGES.join(', ')}` },
      { status: 400 }
    )
  }

  let referenceFile: { media_type: string; data: string } | undefined
  if (body.reference_file !== undefined && body.reference_file !== null) {
    const rf = body.reference_file
    if (
      typeof rf !== 'object' ||
      typeof rf.media_type !== 'string' || !ALLOWED_REFERENCE_TYPES.includes(rf.media_type) ||
      typeof rf.data !== 'string' || !rf.data
    ) {
      return NextResponse.json(
        { error: `reference_file must be { media_type: one of ${ALLOWED_REFERENCE_TYPES.join(', ')}, data: base64 string }` },
        { status: 400 }
      )
    }
    if (Buffer.byteLength(rf.data, 'base64') > MAX_REFERENCE_FILE_BYTES) {
      return NextResponse.json(
        { error: `reference_file exceeds the ${MAX_REFERENCE_FILE_BYTES / 1024 / 1024}MB limit` },
        { status: 400 }
      )
    }
    referenceFile = { media_type: rf.media_type, data: rf.data }
  }

  // When the section locks the topic, we already have its id/title_en from
  // the join above — no need for a second round-trip through subjects/topics.
  let topicRow: { id: string; title_en: string } | null = null
  if (topicLocked) {
    topicRow = { id: notebookSection!.topic_id!, title_en: notebookSection!.topic!.title_en }
  } else {
    const supabase = createServerClient()
    const { data: subjectRow } = await supabase.from('subjects').select('id').eq('slug', subject_slug).single()
    if (!subjectRow) {
      return NextResponse.json({ error: `Unknown subject_slug: ${subject_slug}` }, { status: 400 })
    }

    const { data: fetchedTopicRow } = await supabase
      .from('topics')
      .select('id, title_en')
      .eq('subject_id', subjectRow.id)
      .eq('grade', grade)
      .eq('slug', topic_slug)
      .maybeSingle()
    if (!fetchedTopicRow) {
      return NextResponse.json(
        { error: `Topic not found for subject "${subject_slug}", grade ${grade}, slug "${topic_slug}"` },
        { status: 400 }
      )
    }
    topicRow = fetchedTopicRow
  }

  // ─── notebook recipe + files (checkpoint 6) — fetched once the section is
  // confirmed to belong to this family ───
  let recipePromptText: string | null = null
  const notebookFileBlocks: any[] = []
  const skippedNotebookFiles: string[] = []

  if (notebookSection) {
    const { data: recipe } = await serviceClient
      .from('notebook_recipes')
      .select('prompt_text')
      .eq('section_id', notebookSection.id)
      .maybeSingle()
    recipePromptText = recipe?.prompt_text || null

    const { data: files } = await serviceClient
      .from('notebook_files')
      .select('id, storage_path, media_type, original_filename')
      .eq('section_id', notebookSection.id)
      .order('created_at', { ascending: false })

    const allFiles = files || []
    const filesToAttach = allFiles.slice(0, MAX_NOTEBOOK_FILES)
    const filesSkipped = allFiles.slice(MAX_NOTEBOOK_FILES)

    if (filesSkipped.length > 0) {
      skippedNotebookFiles.push(...filesSkipped.map(f => f.original_filename))
      console.warn(
        `[questions/generate] notebook_section_id=${notebookSection.id}: ${allFiles.length} files linked, only the ` +
        `${MAX_NOTEBOOK_FILES} most recently uploaded are attached. Skipped: ${skippedNotebookFiles.join(', ')}`
      )
    }

    for (const f of filesToAttach) {
      const { data: blob, error: dlErr } = await serviceClient.storage
        .from(NOTEBOOK_FILES_BUCKET)
        .download(f.storage_path)
      if (dlErr || !blob) {
        console.warn(`[questions/generate] failed to download notebook file ${f.id} (${f.original_filename}): ${dlErr?.message}`)
        continue
      }
      const base64 = Buffer.from(await blob.arrayBuffer()).toString('base64')
      notebookFileBlocks.push(fileContentBlock(f.media_type, base64))
    }
  }

  // families has RLS with no anon read policy — service-role client needed;
  // requireParentOnlySession() above is the actual gate.
  const { data: familyRow } = await serviceClient
    .from('families')
    .select('question_gen_style')
    .eq('id', familyId)
    .single()

  async function writeGenerationRow(questionIds: string[], error: string | null) {
    const { data, error: genErr } = await serviceClient
      .from('question_generations')
      .insert({
        family_id: familyId,
        subject_slug, grade, topic_slug, q_types, difficulty, count, progressive, language,
        custom_prompt: custom_prompt ?? null,
        question_ids: questionIds,
        error,
      })
      .select()
      .single()
    if (genErr) throw genErr
    return data
  }

  // ─── build prompt — style is family-level/persistent so it goes in the
  // system prompt; topic/custom instructions are per-request, in the user prompt ───
  const styleGuidance = familyRow?.question_gen_style
    ? `\nHouse style for this family: ${familyRow.question_gen_style}`
    : ''

  const progressiveInstruction = progressive
    ? `Order the ${count} questions from easiest to hardest — ramp difficulty across the array rather than keeping it flat at "${difficulty}". Set each question's own "difficulty" field to match its position in the ramp.`
    : `All ${count} questions should be at "${difficulty}" difficulty. Set each question's "difficulty" field to "${difficulty}".`

  const referenceInstruction = referenceFile
    ? `\nA reference file (a photo or PDF of a worksheet or textbook excerpt) is attached. Model the new questions after its style, content, and difficulty — write new, original questions inspired by it, not copies of what's in it.`
    : ''

  // notebook section context is additive to the family-level styleGuidance
  // above, not a replacement for it — both can apply to the same request.
  const notebookGuidance = notebookSection
    ? `\nContext from the family's notebook section "${notebookSection.title}"${notebookSection.body_text ? `:\n${notebookSection.body_text}` : ''}`
    : ''
  const recipeGuidance = recipePromptText
    ? `\nRecipe instructions for this notebook section: ${recipePromptText}`
    : ''
  const notebookFilesInstruction = notebookFileBlocks.length > 0
    ? `\n${notebookFileBlocks.length} additional reference file(s) from this notebook section are attached — use them the same way as a reference file: as style/content inspiration, not to copy verbatim.`
    : ''

  // language controls whether/how the *_he fields get populated. prompt_en and
  // correct_answer are NOT NULL at the DB level regardless of mode (each option's
  // value_en is not DB-constrained, but is kept required in he_only too for
  // internal consistency with prompt_en) — 'he_only' still needs *something* in
  // those fields, but it must be a minimal internal stub, never real parallel
  // English content: this mode means Hebrew-only for the user, not bilingual.
  const languageInstruction = {
    en_only: `Write every field in English only. Leave prompt_he, hint_he, and each option's "value_he" as null — do not translate anything into Hebrew.`,
    he_only: `This question is Hebrew-only for the user — do not write real English content anywhere:
- prompt_he: the full, natural, primary content. This is what the user reads.
- prompt_en: required to be a non-empty string (technical constraint only, never shown to the user) — write a short internal gloss, a few words, NOT a full sentence or a real translation. This still has to distinguish the question from the other ${count} in this batch (it's used as a dedup key internally) — don't reuse the same generic gloss like "Which is bigger?" across multiple questions; keep each gloss specific to that question's actual content.
- Each option's value_he: full, natural Hebrew content.
- Each option's value_en: required non-empty per option, same rule as prompt_en — a short internal gloss only, never a real translation. Exception: if the option value is purely symbolic or numeric (e.g. "3/4" or "12"), value_en and value_he are identical anyway, so just repeat the same value in both rather than inventing a fake gloss.
- correct_answer: write this in Hebrew — it is only ever used for answer-key/display purposes, matching whichever content is the correct one.
- hint_he only: write a Hebrew hint if you'd write one at all. Leave hint_en null always in this mode.
- explanation_en: leave this null in this mode — there is no Hebrew explanation field, and writing a real English explanation would contradict Hebrew-only.`,
    bilingual: `Every question must read naturally as equally-primary content in both languages, not a translation of one into the other:
- prompt_en AND prompt_he: both required.
- Each option's value_en AND value_he: both required for every option.
- If you write a hint at all: hint_en AND hint_he are BOTH required together — never write hint_en alone and leave hint_he null. If you'd rather skip the Hebrew hint, omit hint_en too and leave the question with no hint.
- explanation_en only — there is no Hebrew explanation field, leave it in English.
- Exception: if a prompt/option/hint is purely symbolic or numeric with no natural-language words to translate (e.g. "2/3 + 2/3 = ?"), there is nothing to write in Hebrew that differs from the English — leave that field's _he counterpart null rather than repeating the same text.`,
  }[language]

  const systemPrompt = `You are an expert educational content writer for Israeli K-6 students, generating practice questions for the topic "${topicRow.title_en}" (grade ${grade}, subject ${subject_slug}).
Generate exactly ${count} questions.
Allowed question types: ${q_types.join(', ')} — use a mix if more than one is allowed. Every question's "q_type" must be one of these — never emit any other type.
${progressiveInstruction}
The selected difficulty always takes priority over anything in the user's custom instructions that implies a different difficulty (e.g. "make it harder," "she's advanced," a request for content usually taught at a later grade). Treat custom instructions as guidance for scenario, theme, and framing only — never let them override the actual difficulty level or complexity of the underlying content. If a custom instruction and the selected difficulty genuinely conflict, honor the selected difficulty.
${styleGuidance}${notebookGuidance}${recipeGuidance}${referenceInstruction}${notebookFilesInstruction}
${languageInstruction}
For multiple_choice questions: "options" must be an array of exactly 4 objects, each {"label":"A"|"B"|"C"|"D","value_en":"...","value_he":"..."|null,"isCorrect":true|false}, with exactly one isCorrect:true. If two options would be mathematically equivalent (e.g. an improper fraction and its mixed-number form, or an unreduced and a reduced fraction), pick exactly ONE canonical representation for the correct answer and never include another option equal to it — every distractor must be a genuinely different value, not just a different way of writing the same one.
For word_problem questions: omit "options" (or set it to null); "correct_answer" holds the final answer as a plain string.
OUTPUT: JSON only, no markdown — an array of exactly ${count} question objects, each shaped:
{"q_type":"multiple_choice"|"word_problem","difficulty":"easy"|"medium"|"hard","prompt_en":"...","prompt_he":"..."|null,"options":[...]|null,"correct_answer":"...","hint_en":"..."|null,"hint_he":"..."|null,"explanation_en":"..."|null}`

  const userPrompt = custom_prompt
    ? `Generate the questions now. Additional instructions: ${custom_prompt}`
    : `Generate the questions now.`

  // With any files attached (the one-shot reference_file and/or the section's
  // notebook_files), content is a multimodal array (image/document blocks +
  // text); otherwise keep the plain string the API already accepted.
  const fileBlocks = [
    ...(referenceFile ? [fileContentBlock(referenceFile.media_type, referenceFile.data)] : []),
    ...notebookFileBlocks,
  ]
  const messageContent = fileBlocks.length > 0
    ? [...fileBlocks, { type: 'text', text: userPrompt }]
    : userPrompt

  let anthropicText: string
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: Math.min(8192, 400 * count + 800),
        thinking: { type: 'disabled' },
        system: systemPrompt,
        messages: [{ role: 'user', content: messageContent }],
      }),
    })

    const data = await response.json()
    if (!response.ok) {
      const message = data.error?.message || 'Anthropic API request failed'
      const genRow = await writeGenerationRow([], message)
      return NextResponse.json({ error: message, generation_id: genRow.id }, { status: 502 })
    }
    anthropicText = data.content?.[0]?.text ?? ''
  } catch (err: any) {
    const genRow = await writeGenerationRow([], err.message)
    return NextResponse.json({ error: err.message, generation_id: genRow.id }, { status: 502 })
  }

  let parsedQuestions: any[]
  try {
    parsedQuestions = JSON.parse(anthropicText.replace(/```json\n?|\n?```/g, '').trim())
    if (!Array.isArray(parsedQuestions)) throw new Error('not an array')
  } catch {
    const genRow = await writeGenerationRow([], 'Failed to parse AI response as a JSON array')
    return NextResponse.json(
      { error: 'Failed to parse AI response', raw: anthropicText, generation_id: genRow.id },
      { status: 500 }
    )
  }

  // ─── insert one question at a time so a single malformed question
  // doesn't drop the rest of the batch (see insertQuestions.ts) ───
  const insertedRows: { id: string; topic_id: string; difficulty: string; prompt_en: string }[] = []
  const failures: string[] = []

  // For 'he'/'bilingual' mode, the system prompt requires every *_he field to
  // be filled — but a purely symbolic prompt/option (e.g. "2/3 + 2/3 = ?") has
  // nothing to translate, so the model can end up just echoing the English
  // string back verbatim instead of leaving it null. Don't trust the model to
  // self-judge that case correctly (that's the same instruction that produced
  // the bug): a byte-identical *_he is never a real translation, so drop it
  // regardless of what the prompt asked for.
  const dedupeHe = (he: unknown, en: unknown): string | undefined =>
    typeof he === 'string' && he !== '' && he !== en ? he : undefined

  for (let i = 0; i < parsedQuestions.length; i++) {
    const q = parsedQuestions[i]

    // Deterministic gate, not just a prompt instruction: the system prompt asks
    // for only the requested q_types, but the model can and does ignore that
    // (confirmed live — a multiple_choice-only request still returned
    // word_problem rows). Coercing an unrequested type into q_types[0] would
    // silently mislabel a question (e.g. a word_problem's shape forced into
    // multiple_choice), so an unrequested type is discarded outright instead.
    if (!q_types.includes(q.q_type)) {
      failures.push(`question ${i + 1}: q_type "${q.q_type}" was not in the requested types (${q_types.join(', ')}) — discarded`)
      continue
    }
    const qType = q.q_type
    const qDifficulty = VALID_DIFFICULTIES.includes(q.difficulty) ? q.difficulty : difficulty

    const options = Array.isArray(q.options)
      ? q.options.map((o: any) => ({ ...o, value_he: dedupeHe(o.value_he, o.value_en) ?? null }))
      : q.options

    // TODO: the system prompt above never asks for or forwards a visual_data
    // field, so AI-generated questions can never carry a diagram (fraction bar,
    // shape, number line, etc.) — only the manual POST /api/questions path does.
    const input: QuestionInput = {
      topic_slug,
      difficulty: qDifficulty,
      q_type: qType,
      prompt_en: q.prompt_en,
      prompt_he: dedupeHe(q.prompt_he, q.prompt_en),
      options: options ?? undefined,
      correct_answer: q.correct_answer,
      hint_en: q.hint_en || undefined,
      hint_he: dedupeHe(q.hint_he, q.hint_en),
      explanation_en: q.explanation_en || undefined,
      approved: false,
    }

    const result = await insertQuestions([input])
    if (result.ok && result.inserted.length > 0) {
      insertedRows.push(result.inserted[0])
    } else if (result.ok) {
      failures.push(`question ${i + 1}: duplicate of an existing question (skipped)`)
    } else {
      failures.push(`question ${i + 1}: ${result.error}`)
    }
  }

  const genRow = await writeGenerationRow(
    insertedRows.map(r => r.id),
    failures.length > 0 ? failures.join('; ') : null
  )

  if (insertedRows.length === 0) {
    return NextResponse.json(
      { error: failures.join('; ') || 'No questions were generated', generation_id: genRow.id },
      { status: 502 }
    )
  }

  // ─── notebook auto-link (checkpoint 6) — every newly-inserted question gets
  // linked back to the section it was generated from, same upsert/dedupe
  // pattern as the manual link endpoint (api/notebook/sections/[id]/questions) ───
  if (notebookSection) {
    const linkRows = insertedRows.map(r => ({
      section_id: notebookSection!.id,
      question_id: r.id,
      added_via: 'generated',
    }))
    const { error: linkError } = await serviceClient
      .from('notebook_section_questions')
      .upsert(linkRows, { onConflict: 'section_id,question_id', ignoreDuplicates: true })
    if (linkError) {
      failures.push(`Generated questions were saved but failed to auto-link to the notebook section: ${linkError.message}`)
    }
  }

  return NextResponse.json({
    success: true,
    inserted: insertedRows,
    generation_id: genRow.id,
    ...(notebookSection ? { notebook_section_id: notebookSection.id } : {}),
    ...(skippedNotebookFiles.length > 0 ? { skipped_notebook_files: skippedNotebookFiles } : {}),
    ...(failures.length > 0 ? { warnings: failures } : {}),
  })
}
