import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

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
    const { data: history } = await supabase
      .from('child_passage_history').select('passage_id, completed').eq('child_id', childId)
    const seenMap = new Map((history || []).map((h: any) => [h.passage_id, h.completed]))
    result = result.map((p: any) => ({ ...p, seen: seenMap.has(p.id), completed: seenMap.get(p.id) ?? false }))
  }

  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { grade, subject, type, difficulty, topic, language } = body

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
Grade: ${gradeContext[grade] ?? gradeContext[4]}
OUTPUT: JSON only, no markdown:
{"title_en":"English title","title_he":"Hebrew title","content":"Full text with \\n\\n between paragraphs","word_count":NUMBER,"tags":["tag1","tag2"]}`

  const userPrompt = topic
    ? `Write a ${difficulty} ${type} passage for grade ${grade} about: ${topic}`
    : `Write a ${difficulty} ${type} passage for grade ${grade}. Choose an engaging, curriculum-appropriate topic.`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })

    const data = await response.json()
    const text = data.content?.[0]?.text ?? ''
    let parsed: any
    try { parsed = JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim()) }
    catch { return NextResponse.json({ error: 'Parse failed', raw: text }, { status: 500 }) }

    const supabase = createServerClient()
    const { data: subj } = await supabase.from('subjects').select('id').eq('slug', subject).single()

    const insertData: any = {
      subject_id: subj?.id, grade, passage_type: type, difficulty,
      title_en: parsed.title_en, title_he: parsed.title_he,
      source: 'ai_generated', paragraph_count: parsed.content.split('\n\n').length,
      approved: false, tags: parsed.tags ?? [],
    }
    if (isHebrew) { insertData.content_he = parsed.content; insertData.word_count_he = parsed.word_count }
    else { insertData.content_en = parsed.content; insertData.word_count_en = parsed.word_count }

    const { data: saved, error: saveError } = await supabase.from('reading_passages').insert(insertData).select().single()
    if (saveError) return NextResponse.json({ error: saveError.message }, { status: 500 })

    return NextResponse.json({ success: true, passage: saved })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
