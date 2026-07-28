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
//   count, progressive, custom_prompt?
// }

const VALID_DIFFICULTIES = ['easy', 'medium', 'hard']
const VALID_Q_TYPES = ['multiple_choice', 'word_problem']
const VALID_LANGUAGES = ['en', 'he', 'bilingual']
const MAX_COUNT = 20

// reference_file: optional photo/PDF of a worksheet used as a style/content model
// for generation. Capped at 3MB raw — Vercel serverless functions cap the request
// body at ~4.5MB total, and base64 inflates raw bytes by ~33%, so this leaves
// headroom for the rest of the JSON payload (well under Anthropic's own 32MB limit).
const ALLOWED_REFERENCE_TYPES = ['image/jpeg', 'image/png', 'application/pdf']
const MAX_REFERENCE_FILE_BYTES = 3 * 1024 * 1024

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
  const { subject_slug, grade, topic_slug, difficulty, progressive } = body
  const q_types: string[] = Array.isArray(body.q_types) ? [...new Set(body.q_types as string[])] : []
  const count = body.count
  const language: string = typeof body.language === 'string' && body.language ? body.language : 'en'
  const custom_prompt: string | undefined = typeof body.custom_prompt === 'string' && body.custom_prompt.trim()
    ? body.custom_prompt.trim()
    : undefined

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

  const supabase = createServerClient()

  const { data: subjectRow } = await supabase.from('subjects').select('id').eq('slug', subject_slug).single()
  if (!subjectRow) {
    return NextResponse.json({ error: `Unknown subject_slug: ${subject_slug}` }, { status: 400 })
  }

  const { data: topicRow } = await supabase
    .from('topics')
    .select('id, title_en')
    .eq('subject_id', subjectRow.id)
    .eq('grade', grade)
    .eq('slug', topic_slug)
    .maybeSingle()
  if (!topicRow) {
    return NextResponse.json(
      { error: `Topic not found for subject "${subject_slug}", grade ${grade}, slug "${topic_slug}"` },
      { status: 400 }
    )
  }

  const familyId = auth.parent.familyId
  const serviceClient = createServiceRoleClient()

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

  // language controls whether/how the *_he fields get populated. prompt_en, correct_answer,
  // and each option's value_en are NOT NULL/required regardless of mode, so 'he' still needs
  // an English version — it's just derived from Hebrew-primary content rather than the reverse.
  const languageInstruction = {
    en: `Write every field in English only. Leave prompt_he, hint_he, and each option's "value_he" as null — do not translate anything into Hebrew.`,
    he: `Write the primary version in Hebrew first, then add an English translation — every question should end up with both languages filled:
- prompt_en AND prompt_he: both required, prompt_he written first as the primary version.
- Each option's value_en AND value_he: both required for every option.
- If you write a hint at all: hint_en AND hint_he are BOTH required together — never write hint_en alone and leave hint_he null. If you'd rather skip the Hebrew hint, omit hint_en too and leave the question with no hint.
- explanation_en only — there is no Hebrew explanation field, leave it in English.
- Exception: if a prompt/option/hint is purely symbolic or numeric with no natural-language words to translate (e.g. "2/3 + 2/3 = ?"), there is nothing to write in Hebrew that differs from the English — leave that field's _he counterpart null rather than repeating the same text.`,
    bilingual: `Every question must read naturally as equally-primary content in both languages, not a translation of one into the other:
- prompt_en AND prompt_he: both required.
- Each option's value_en AND value_he: both required for every option.
- If you write a hint at all: hint_en AND hint_he are BOTH required together — never write hint_en alone and leave hint_he null. If you'd rather skip the Hebrew hint, omit hint_en too and leave the question with no hint.
- explanation_en only — there is no Hebrew explanation field, leave it in English.
- Exception: if a prompt/option/hint is purely symbolic or numeric with no natural-language words to translate (e.g. "2/3 + 2/3 = ?"), there is nothing to write in Hebrew that differs from the English — leave that field's _he counterpart null rather than repeating the same text.`,
  }[language]

  const systemPrompt = `You are an expert educational content writer for Israeli K-6 students, generating practice questions for the topic "${topicRow.title_en}" (grade ${grade}, subject ${subject_slug}).
Generate exactly ${count} questions.
Allowed question types: ${q_types.join(', ')} — use a mix if more than one is allowed.
${progressiveInstruction}${styleGuidance}${referenceInstruction}
${languageInstruction}
For multiple_choice questions: "options" must be an array of exactly 4 objects, each {"label":"A"|"B"|"C"|"D","value_en":"...","value_he":"..."|null,"isCorrect":true|false}, with exactly one isCorrect:true.
For word_problem questions: omit "options" (or set it to null); "correct_answer" holds the final answer as a plain string.
OUTPUT: JSON only, no markdown — an array of exactly ${count} question objects, each shaped:
{"q_type":"multiple_choice"|"word_problem","difficulty":"easy"|"medium"|"hard","prompt_en":"...","prompt_he":"..."|null,"options":[...]|null,"correct_answer":"...","hint_en":"...","hint_he":"..."|null,"explanation_en":"..."}`

  const userPrompt = custom_prompt
    ? `Generate the questions now. Additional instructions: ${custom_prompt}`
    : `Generate the questions now.`

  // With a reference file attached, content is a multimodal array (image/document
  // block + text); otherwise keep the plain string the API already accepted.
  const messageContent = referenceFile
    ? [
        referenceFile.media_type === 'application/pdf'
          ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: referenceFile.data } }
          : { type: 'image', source: { type: 'base64', media_type: referenceFile.media_type, data: referenceFile.data } },
        { type: 'text', text: userPrompt },
      ]
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
    const qType = VALID_Q_TYPES.includes(q.q_type) ? q.q_type : q_types[0]
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

  return NextResponse.json({
    success: true,
    inserted: insertedRows,
    generation_id: genRow.id,
    ...(failures.length > 0 ? { warnings: failures } : {}),
  })
}
