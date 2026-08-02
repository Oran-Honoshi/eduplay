import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createServiceRoleClient } from '@/lib/supabase'
import { authorizeChildAccess, requireParentOnlySession } from '@/lib/session'
import { checkNiqqudDecodability, checkWordListDecodability } from '@/lib/readingDecodability'

const DECODABILITY_THRESHOLD = 64

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
  const { grade, subject, type, difficulty, topic, language, reading_track, level_id } = body

  if (!grade || !subject || !type || !difficulty) {
    return NextResponse.json({ error: 'grade, subject, type, difficulty required' }, { status: 400 })
  }

  const wordTargets: Record<number, { en: number; he: number }> = {
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
      ? `\nReading level: ${level.label_he} (${level.label_en}). This is a beginning Hebrew reader's booklet. Use ONLY the niqqud marks introduced by this level and every level before it: ${cumulative}. Do not use any niqqud mark outside that set anywhere in the text.${wordListGuidance} At least ${DECODABILITY_THRESHOLD}% of words must be fully decodable using only those marks; a small number of very common, unavoidable sight words may deviate if a natural sentence truly requires them.`
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
    1: 'Ages 6-7: animals, family, simple daily life.',
    2: 'Ages 7-8: nature, friendships, school, simple science.',
    3: 'Ages 8-9: adventure, animals, simple history, community.',
    4: 'Ages 9-10: science, history, social themes, realistic fiction.',
    5: 'Ages 10-11: science, world cultures, biography, complex narratives.',
    6: 'Ages 11-12: current events, history, complex social themes.',
  }

  const langInstructions = isHebrew
    ? 'Write ENTIRELY in Modern Hebrew (עברית מודרנית). Use standard Israeli spelling. Do NOT include English.'
    : 'Write ENTIRELY in clear English. Do NOT include Hebrew.'

  const systemPrompt = `You are an expert educational content writer for Israeli K-6 students.
${langInstructions}
Target: ${wordTarget} words (±15%), ${Math.max(3, Math.min(6, Math.round(wordTarget / 60)))} paragraphs, 4-6 sentences each.
Type: ${type} — ${typeGuidance[type] ?? typeGuidance.informational}
Difficulty: ${difficulty} — ${diffGuidance[difficulty] ?? diffGuidance.medium}
Grade: ${gradeContext[grade] ?? gradeContext[4]}${readingLevelGuidance}
OUTPUT: JSON only, no markdown. Even if the constraints above are difficult to satisfy, still output ONLY the JSON object — never explain your reasoning, never add commentary or caveats before or after it. Do your best within the constraints and let the content itself reflect any necessary trade-offs.
{"title_en":"English title","title_he":"Hebrew title","content":"Full text with \\n\\n between paragraphs","word_count":NUMBER,"tags":["tag1","tag2"]}`

  const baseUserPrompt = topic
    ? `Write a ${difficulty} ${type} passage for grade ${grade} about: ${topic}`
    : `Write a ${difficulty} ${type} passage for grade ${grade}. Choose an engaging, curriculum-appropriate topic.`

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
        messages: [{ role: 'user', content: userPrompt }],
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
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : stripped)
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
    }
    if (isHebrew) { insertData.content_he = parsed.content; insertData.word_count_he = parsed.word_count }
    else { insertData.content_en = parsed.content; insertData.word_count_en = parsed.word_count }

    const { data: saved, error: saveError } = await supabase.from('reading_passages').insert(insertData).select().single()
    if (saveError) return NextResponse.json({ error: saveError.message }, { status: 500 })

    return NextResponse.json({
      success: true,
      passage: saved,
      ...(decodability ? { decodability: { ...decodability, regenerated, passed: decodability.pct >= DECODABILITY_THRESHOLD } } : {}),
    })
  } catch (err: any) {
    if (err instanceof Response) {
      const body = await err.json()
      return NextResponse.json(body, { status: err.status })
    }
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
