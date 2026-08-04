import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createServiceRoleClient } from '@/lib/supabase'
import { authorizeChildAccess, requireParentOnlySession } from '@/lib/session'
import { checkNiqqudDecodability, checkWordListDecodability } from '@/lib/readingDecodability'

const DECODABILITY_THRESHOLD = 64
const COMPREHENSION_QUESTION_COUNT = 4

// The model is asked for \n\n paragraph breaks inside a JSON string, but
// sometimes emits an actual literal newline character instead of the 2-char
// \n escape sequence — valid-looking text that JSON.parse still rejects
// ("bad control character in string literal"), caught live during
// checkpoint 6's UI test (niqqud level 3 + story + reference file combo).
// Distinct failure mode from the earlier "reasons in prose before JSON"
// bug — that one added preamble outside the JSON; this one breaks a raw
// control character inside a string value. Fixed by walking the text and
// escaping control characters ONLY while inside a quoted string — a blind
// global replace would also corrupt legitimate whitespace between JSON
// tokens (e.g. between `{` and `"key"`), which is syntactically different
// from a \n escape and would break parsing worse than it started.
function escapeControlCharsInJsonStrings(text: string): string {
  let result = ''
  let inString = false
  let escaped = false
  for (const ch of text) {
    if (inString) {
      if (escaped) { result += ch; escaped = false }
      else if (ch === '\\') { result += ch; escaped = true }
      else if (ch === '"') { result += ch; inString = false }
      else if (ch === '\n') result += '\\n'
      else if (ch === '\r') result += '\\r'
      else if (ch === '\t') result += '\\t'
      else result += ch
    } else {
      if (ch === '"') inString = true
      result += ch
    }
  }
  return result
}

// reference_file: optional photo/PDF of a worksheet/booklet page used as a style/structure
// model for passage generation — same mechanism and same limits as /api/questions/generate's
// reference_file (ported, not reinvented): capped at 3MB raw because Vercel serverless
// functions cap the request body at ~4.5MB total and base64 inflates raw bytes by ~33%,
// leaving headroom for the rest of the JSON payload (well under Anthropic's own 32MB limit).
const ALLOWED_REFERENCE_TYPES = ['image/jpeg', 'image/png', 'application/pdf']
const MAX_REFERENCE_FILE_BYTES = 3 * 1024 * 1024

function fileContentBlock(mediaType: string, base64Data: string) {
  return mediaType === 'application/pdf'
    ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64Data } }
    : { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64Data } }
}

export async function GET(req: NextRequest) {
  const supabase = createServerClient()
  const { searchParams } = new URL(req.url)

  let query = supabase
    .from('reading_passages')
    .select('*, subjects(slug), passage_questions(id)')
    .eq('approved', true)
    .order('grade').order('passage_type').order('difficulty')

  const grade = searchParams.get('grade')
  const subject = searchParams.get('subject')
  const type = searchParams.get('type')
  const diff = searchParams.get('difficulty')
  const childId = searchParams.get('childId')

  if (grade) query = query.eq('grade', parseInt(grade))
  if (type) query = query.eq('passage_type', type)
  if (diff) query = query.eq('difficulty', diff)

  const { data: passages, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let result = passages || []
  if (subject) {
    const { data: subj } = await supabase.from('subjects').select('id').eq('slug', subject).single()
    if (subj) result = result.filter((p: any) => p.subject_id === subj.id)
  }

  if (childId) {
    const childAuth = await authorizeChildAccess(childId)
    if (!childAuth.ok) {
      return NextResponse.json(
        { error: childAuth.status === 401 ? 'Unauthorized' : 'Forbidden' },
        { status: childAuth.status }
      )
    }

    // child_passage_history has RLS enabled with no anon policy — read via the
    // service-role client, relying on the authorizeChildAccess check above for
    // ownership instead of a DB-level policy (the app uses its own JWT cookie
    // sessions, not Supabase Auth, so there's no auth.uid() to write a policy against).
    const { data: history } = await createServiceRoleClient()
      .from('child_passage_history').select('passage_id, completed').eq('child_id', childId)
    const seenMap = new Map((history || []).map((h: any) => [h.passage_id, h.completed]))
    result = result.map((p: any) => ({ ...p, seen: seenMap.has(p.id), completed: seenMap.get(p.id) ?? false }))
  }

  return NextResponse.json(result)
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
  const { grade, subject, type, difficulty, topic, language, reading_track, level_id, generate_questions } = body

  if (!Number.isInteger(grade) || grade < 0 || !subject || !type || !difficulty) {
    return NextResponse.json({ error: 'grade (integer >= 0), subject, type, difficulty required' }, { status: 400 })
  }

  // Free-form instructions, additive to topic (not exclusive) — same
  // non-exclusive relationship as /api/questions/generate's custom_prompt.
  const custom_prompt: string | undefined = typeof body.custom_prompt === 'string' && body.custom_prompt.trim()
    ? body.custom_prompt.trim()
    : undefined

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

  const wordTargets: Record<number, { en: number; he: number }> = {
    0: { en: 40, he: 35 },
    1: { en: 60, he: 55 }, 2: { en: 110, he: 100 }, 3: { en: 160, he: 145 },
    4: { en: 240, he: 200 }, 5: { en: 280, he: 230 }, 6: { en: 350, he: 290 },
  }
  const target = wordTargets[grade] ?? { en: 200, he: 170 }
  const isHebrew = subject === 'hebrew' || language === 'he'
  const wordTarget = isHebrew ? target.he : target.en

  const supabase = createServiceRoleClient()

  // Reading-acquisition level guidance is entirely additive: when level_id is
  // omitted, readingLevelGuidance stays '' and levelForValidation stays null,
  // so the prompt and response are byte-for-byte the same as before this
  // feature existed.
  let readingLevelGuidance = ''
  let levelForValidation: { track: string; level_number: number; word_list: string[] } | null = null
  if (level_id) {
    const { data: level, error: levelError } = await supabase
      .from('reading_levels').select('*').eq('id', level_id).single()
    if (levelError || !level) {
      return NextResponse.json({ error: 'level_id not found' }, { status: 400 })
    }
    if (reading_track && reading_track !== level.track) {
      return NextResponse.json({ error: `level_id belongs to track '${level.track}', not '${reading_track}'` }, { status: 400 })
    }
    if (level.track === 'niqqud' && !isHebrew) {
      return NextResponse.json({ error: 'niqqud reading levels require Hebrew (subject=hebrew or language=he)' }, { status: 400 })
    }
    if (level.track === 'phonics' && isHebrew) {
      return NextResponse.json({ error: 'phonics reading levels require English' }, { status: 400 })
    }
    levelForValidation = { track: level.track, level_number: level.level_number, word_list: level.word_list ?? [] }

    const { data: priorLevels } = await supabase
      .from('reading_levels').select('label_en, label_he')
      .eq('track', level.track).lte('level_number', level.level_number)
      .order('level_number')
    const cumulative = level.track === 'niqqud'
      ? (priorLevels ?? []).map((l: any) => l.label_he).join(', ')
      : (priorLevels ?? []).map((l: any) => l.label_en).join(', ')

    const wordListGuidance = (level.word_list ?? []).length > 0
      ? ` Compose primarily using words from this approved list: ${level.word_list.join(', ')}. A small number of other simple, everyday words may be used only if truly unavoidable for a natural sentence.`
      : ''

    readingLevelGuidance = level.track === 'niqqud'
      ? `\nReading level: ${level.label_he} (${level.label_en}). This is a beginning Hebrew reader's booklet. Every word must be fully vocalized with niqqud (vowel points) — this is not standard unpointed Hebrew, it is a beginner reader's pointed text (טקסט מנוקד). Use ONLY the niqqud marks introduced by this level and every level before it: ${cumulative}. Do not use any niqqud mark outside that set anywhere in the text. Every word must always be spelled correctly and in full — if a word's only correct spelling requires a niqqud mark outside this level's allowed set, choose a genuinely different real word instead; never truncate, drop letters from, or otherwise alter a word's spelling to force it to comply with the allowed mark set.${wordListGuidance} At least ${DECODABILITY_THRESHOLD}% of words must be fully decodable using only those marks; a small number of very common, unavoidable sight words may deviate if a natural sentence truly requires them.`
      : `\nReading level: ${level.label_en}. This is a beginning English reader's booklet. Use ONLY the phonics patterns introduced by this level and every level before it: ${cumulative}. Do not use any phonics pattern outside that set (e.g. no long vowels or blends before they've been introduced).${wordListGuidance} At least ${DECODABILITY_THRESHOLD}% of words must be fully decodable using only those patterns; a small number of very common, unavoidable sight words may deviate if a natural sentence truly requires them.`
  }

  const diffGuidance: Record<string, string> = {
    easy:   'Simple vocabulary, short sentences (8-12 words), one idea per paragraph.',
    medium: 'Grade-appropriate vocabulary, moderate sentence complexity, some new vocabulary in context.',
    hard:   'Rich vocabulary, complex sentences, multiple ideas per paragraph, challenging for advanced readers.',
  }
  const typeGuidance: Record<string, string> = {
    story:         'Narrative with characters, setting, problem and resolution. Include dialogue.',
    informational: 'Factual text with clear topic, supporting facts, and conclusion.',
    argumentative: 'Presents and defends a position with evidence.',
    poem:          'Short poem with rhythm and imagery.',
  }
  const gradeContext: Record<number, string> = {
    0: 'Ages 5-6: colors, family, pets, simple everyday objects and routines. Very short, simple sentences.',
    1: 'Ages 6-7: animals, family, simple daily life.',
    2: 'Ages 7-8: nature, friendships, school, simple science.',
    3: 'Ages 8-9: adventure, animals, simple history, community.',
    4: 'Ages 9-10: science, history, social themes, realistic fiction.',
    5: 'Ages 10-11: science, world cultures, biography, complex narratives.',
    6: 'Ages 11-12: current events, history, complex social themes.',
  }

  const langInstructions = isHebrew
    ? 'Write ENTIRELY in Modern Hebrew (עברית מודרנית). Use standard Israeli niqqud conventions. Every word must be fully vocalized with niqqud (vowel points) — this is not standard unpointed Hebrew, it is a beginner reader\'s pointed text (טקסט מנוקד). Do NOT include English.'
    : 'Write ENTIRELY in clear English. Do NOT include Hebrew.'

  // When no explicit topic was given, a reference file is itself a topic signal —
  // the parent uploaded a specific booklet/worksheet, which is a more concrete
  // intent than "surprise me." Said once here rather than duplicated into
  // baseUserPrompt below, so there's a single place describing how the
  // reference may/may not be used.
  const referenceTopicNote = referenceFile && !topic
    ? ' It is also the source for your topic and subject matter — write about what it covers, or something in the same spirit.'
    : ''

  const referenceInstruction = referenceFile
    ? `\nA reference file (a photo or PDF of a worksheet, booklet page, or textbook excerpt) is attached.${referenceTopicNote} Reuse ONLY its tone, structure, and presentational format (e.g. paragraph rhythm, how ideas are framed, overall organization) — never its exact wording. Do not reuse any specific word, invented term, name, or phrase that appears in the reference file itself; write entirely new sentences of your own, even when directly inspired by its topic, tone, or structure.`
    : ''

  const systemPrompt = `You are an expert educational content writer for Israeli K-6 students.
${langInstructions}
Target: ${wordTarget} words (±15%), ${Math.max(3, Math.min(6, Math.round(wordTarget / 60)))} paragraphs, 4-6 sentences each.
Type: ${type} — ${typeGuidance[type] ?? typeGuidance.informational}
Difficulty: ${difficulty} — ${diffGuidance[difficulty] ?? diffGuidance.medium}
Grade: ${gradeContext[grade] ?? gradeContext[4]}${readingLevelGuidance}${referenceInstruction}
OUTPUT: JSON only, no markdown. Even if the constraints above are difficult to satisfy, still output ONLY the JSON object — never explain your reasoning, never add commentary or caveats before or after it. Do your best within the constraints and let the content itself reflect any necessary trade-offs.
{"title_en":"English title","title_he":"Hebrew title","content":"Full text with \\n\\n between paragraphs","word_count":NUMBER,"tags":["tag1","tag2"]}`

  // Only informational passages get the rubric, and only when neither an explicit
  // topic NOR a reference file was given — both of those are a deliberate parent
  // signal for what to write about, and take priority over auto-invention:
  // explicit topic string > reference file > rubric-driven auto-invented topic.
  // A reference file is arguably the stronger real-world signal of the two (a
  // parent uploading an actual booklet page is saying "make something like
  // THIS"), which is exactly why it needs to outrank the rubric instead of
  // competing alongside it — two co-equal directives fighting for the model's
  // attention is what caused checkpoint 5's informational-type reference file
  // to have no observable effect on generation.
  const INTERESTING_TOPIC_RUBRIC = `Choose the topic yourself. It must have a "wait, really?" quality — a fact or story a kid would go tell a friend right after reading it. It should be verifiably true, genuinely surprising, and specific (a particular animal, place, invention, record, or event — not a broad subject area). Examples of the right spirit: a fruit that's naturally blue, a plant that looks like it's growing spaghetti, an artist who paints on river stones. Never generic curriculum filler like "the water cycle," "healthy eating habits," or "how plants grow" — if the topic could headline a hundred other worksheets, pick something else. This description is guidance for YOUR topic choice, not phrasing to put in the passage — do not write "wait, really?" or similar meta-commentary about the fact being surprising into the passage text itself; just tell the passage's content, in its own natural voice, and let the facts create the surprise.`

  const baseUserPrompt = (
    topic
      ? `Write a ${difficulty} ${type} passage for grade ${grade} about: ${topic}`
      : referenceFile
        ? `Write a ${difficulty} ${type} passage for grade ${grade}. A reference file is attached — see the system instructions for how to use it.`
        : type === 'informational'
          ? `Write a ${difficulty} informational passage for grade ${grade}. ${INTERESTING_TOPIC_RUBRIC}`
          : `Write a ${difficulty} ${type} passage for grade ${grade}. Choose an engaging, curriculum-appropriate topic.`
  ) + (custom_prompt ? `\nAdditional instructions: ${custom_prompt}` : '')

  // With a reference file attached, content is a multimodal array (image/document
  // block + text) — same shape /api/questions/generate sends; otherwise keep the
  // plain string the API already accepted.
  const messageContent = (userPrompt: string) =>
    referenceFile ? [fileContentBlock(referenceFile.media_type, referenceFile.data), { type: 'text', text: userPrompt }] : userPrompt

  async function callAnthropic(userPrompt: string) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 1500,
        thinking: { type: 'disabled' },
        system: systemPrompt,
        messages: [{ role: 'user', content: messageContent(userPrompt) }],
      }),
    })
    const data = await response.json()
    if (!response.ok) throw new Response(JSON.stringify({ error: data.error?.message || 'Anthropic API request failed' }), { status: 502 })
    const text = data.content?.[0]?.text ?? ''
    let parsed: any
    try {
      const stripped = text.replace(/```json\n?|\n?```/g, '').trim()
      // The model sometimes reasons in prose before the JSON object when a
      // constraint is hard to satisfy (observed live under a deliberately
      // hard reading-level + topic combination) — extract the {...} block
      // instead of assuming the whole response is JSON. Falls back to the
      // full trimmed text if no braces are found, so already-clean
      // responses parse exactly as before.
      const jsonMatch = stripped.match(/\{[\s\S]*\}/)
      parsed = JSON.parse(escapeControlCharsInJsonStrings(jsonMatch ? jsonMatch[0] : stripped))
    }
    catch { throw new Response(JSON.stringify({ error: 'Parse failed', raw: text }), { status: 500 }) }
    return parsed
  }

  function validate(content: string) {
    if (!levelForValidation) return null
    return levelForValidation.track === 'niqqud'
      ? checkNiqqudDecodability(content, levelForValidation.level_number)
      : checkWordListDecodability(content, levelForValidation.word_list)
  }

  // Comprehension questions are generated from the FINAL passage text (after
  // any decodability regeneration above), in a separate call with its own
  // system prompt — reusing the passage-shaped systemPrompt/callAnthropic
  // would require overloading one JSON contract with two incompatible
  // shapes. "Unseen passage" framing (per the reading-acquisition project's
  // pedagogical brief): questions must be answerable from the text itself,
  // not from outside knowledge, so a student who skipped reading can't guess
  // right from the options alone.
  async function generateComprehensionQuestions(title: string, content: string): Promise<any[]> {
    const langWord = isHebrew ? 'Hebrew' : 'English'
    const questionSystemPrompt = `You are an expert reading-comprehension question writer for Israeli K-6 students.
You will be given a passage a student has just finished reading. Write exactly ${COMPREHENSION_QUESTION_COUNT} multiple-choice comprehension questions that test genuine understanding of THIS specific passage — the "unseen passage" pedagogical framing: a student who actually read the passage should be able to answer using only what's stated or implied in the text, and a student who has NOT read it should not be able to guess correctly from general knowledge or the answer choices alone.
Mix question types across the set: some literal (directly stated in the text), some inferential (requires connecting two parts of the text or reading between the lines). Spread questions across different parts of the passage rather than clustering on one paragraph.
Write entirely in ${langWord} — the same language as the passage.
OUTPUT: JSON only, no markdown — an array of exactly ${COMPREHENSION_QUESTION_COUNT} objects, each shaped:
{"difficulty":"easy"|"medium"|"hard","prompt":"the question text","options":[{"label":"A","value":"..."},{"label":"B","value":"..."},{"label":"C","value":"..."},{"label":"D","value":"..."}],"correct_label":"A"|"B"|"C"|"D","explanation_en":"one sentence, in English, on why the correct answer is right — for a parent reviewing this question, not shown as a translation"}`

    const questionUserPrompt = `Passage title: ${title}\n\nPassage text:\n${content}\n\nGenerate the comprehension questions now.`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 2000,
        thinking: { type: 'disabled' },
        system: questionSystemPrompt,
        messages: [{ role: 'user', content: questionUserPrompt }],
      }),
    })
    const data = await response.json()
    if (!response.ok) throw new Response(JSON.stringify({ error: data.error?.message || 'Anthropic API request failed (questions)' }), { status: 502 })
    const text = data.content?.[0]?.text ?? ''
    const stripped = text.replace(/```json\n?|\n?```/g, '').trim()
    const arrayMatch = stripped.match(/\[[\s\S]*\]/)
    try {
      const parsed = JSON.parse(escapeControlCharsInJsonStrings(arrayMatch ? arrayMatch[0] : stripped))
      if (!Array.isArray(parsed)) throw new Error('not an array')
      return parsed
    } catch {
      // A failed question batch shouldn't fail the whole request — the passage
      // itself already saved successfully by the time this runs.
      return []
    }
  }

  const VALID_QUESTION_DIFFICULTIES = ['easy', 'medium', 'hard']

  // Defensive per-question shape check, same spirit as insertQuestions.ts'
  // validateOptionsShape — reject rather than coerce, so a malformed question
  // is skipped instead of silently saved wrong.
  function buildPassageQuestionRow(q: any, passageId: string, sortOrder: number): { row: any } | { error: string } {
    if (typeof q?.prompt !== 'string' || !q.prompt.trim()) return { error: 'missing prompt' }
    if (!Array.isArray(q.options) || q.options.length !== 4) return { error: `options must be an array of exactly 4 (got ${Array.isArray(q.options) ? q.options.length : typeof q.options})` }
    for (const opt of q.options) {
      if (typeof opt?.label !== 'string' || !opt.label) return { error: 'each option needs a non-empty label' }
      if (typeof opt?.value !== 'string' || !opt.value.trim()) return { error: 'each option needs a non-empty value' }
    }
    const labels = q.options.map((o: any) => o.label)
    if (new Set(labels).size !== labels.length) return { error: `duplicate option labels: ${labels.join(', ')}` }
    const correctOption = q.options.find((o: any) => o.label === q.correct_label)
    if (!correctOption) return { error: `correct_label "${q.correct_label}" does not match any option label` }

    const options = q.options.map((o: any) => ({
      label: o.label,
      isCorrect: o.label === q.correct_label,
      ...(isHebrew ? { value_he: o.value } : { value_en: o.value }),
    }))

    return {
      row: {
        passage_id: passageId,
        difficulty: VALID_QUESTION_DIFFICULTIES.includes(q.difficulty) ? q.difficulty : difficulty,
        prompt_en: isHebrew ? null : q.prompt,
        prompt_he: isHebrew ? q.prompt : null,
        options,
        correct_answer: correctOption.value,
        explanation_en: typeof q.explanation_en === 'string' && q.explanation_en ? q.explanation_en : null,
        sort_order: sortOrder,
        // AI-generated, pending parent review — same "nothing auto-approves"
        // convention as reading_passages/questions, overriding this column's
        // approved-by-default table default.
        approved: false,
      },
    }
  }

  try {
    // Reading-acquisition passages (level_id set) get one deterministic
    // validation + regeneration pass — prompt-only compliance already proved
    // unreliable (checkpoint 2), so this doesn't trust the model's first
    // attempt, it verifies it. Passages without a level skip validation
    // entirely (levelForValidation is null), unchanged from pre-feature behavior.
    let parsed = await callAnthropic(baseUserPrompt)
    let decodability = validate(parsed.content)
    let regenerated = false

    if (decodability && decodability.pct < DECODABILITY_THRESHOLD) {
      regenerated = true
      const feedback = `\n\nYour previous attempt was only ${decodability.pct}% decodable at this level (need at least ${DECODABILITY_THRESHOLD}%). These words violated the level's allowed set: ${decodability.violatingWords.slice(0, 15).join(', ')}. Rewrite the passage, replacing every violating word with one from the approved list or another word that only uses the allowed set.`
      parsed = await callAnthropic(baseUserPrompt + feedback)
      decodability = validate(parsed.content)
    }

    const { data: subj } = await supabase.from('subjects').select('id').eq('slug', subject).single()

    const insertData: any = {
      subject_id: subj?.id, grade, passage_type: type, difficulty,
      title_en: parsed.title_en, title_he: parsed.title_he,
      source: 'ai_generated', paragraph_count: parsed.content.split('\n\n').length,
      approved: false, tags: parsed.tags ?? [],
      level_id: level_id ?? null,
      custom_prompt: custom_prompt ?? null,
    }
    if (isHebrew) { insertData.content_he = parsed.content; insertData.word_count_he = parsed.word_count }
    else { insertData.content_en = parsed.content; insertData.word_count_en = parsed.word_count }

    const { data: saved, error: saveError } = await supabase.from('reading_passages').insert(insertData).select().single()
    if (saveError) return NextResponse.json({ error: saveError.message }, { status: 500 })

    // ─── comprehension questions (checkpoint 4) — genuinely new write path,
    // no existing code has ever inserted into passage_questions. Insert one
    // at a time so a single malformed question doesn't drop the rest of the
    // batch, same defensive pattern as insertQuestions.ts / questions/generate ───
    let insertedQuestions: any[] = []
    const questionFailures: string[] = []
    if (generate_questions) {
      const rawQuestions = await generateComprehensionQuestions(parsed.title_en, parsed.content)
      for (let i = 0; i < rawQuestions.length; i++) {
        const built = buildPassageQuestionRow(rawQuestions[i], saved.id, i + 1)
        if ('error' in built) {
          questionFailures.push(`question ${i + 1}: ${built.error}`)
          continue
        }
        const { data: insertedQ, error: qError } = await supabase
          .from('passage_questions').insert(built.row).select().single()
        if (qError) questionFailures.push(`question ${i + 1}: ${qError.message}`)
        else insertedQuestions.push(insertedQ)
      }
    }

    return NextResponse.json({
      success: true,
      passage: saved,
      ...(decodability ? { decodability: { ...decodability, regenerated, passed: decodability.pct >= DECODABILITY_THRESHOLD } } : {}),
      ...(generate_questions ? { questions: insertedQuestions, ...(questionFailures.length > 0 ? { question_warnings: questionFailures } : {}) } : {}),
    })
  } catch (err: any) {
    if (err instanceof Response) {
      const body = await err.json()
      return NextResponse.json(body, { status: err.status })
    }
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
