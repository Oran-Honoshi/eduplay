import { createServerClient } from '@/lib/supabase'
import LessonClient from './client'
import { redirect } from 'next/navigation'

interface Props {
  searchParams: { topicId?: string; childId?: string; difficulty?: string; theme?: string; lang?: string }
}

export default async function LessonPage({ searchParams }: Props) {
  const supabase = createServerClient()
  const childId    = searchParams.childId || '22222222-2222-2222-2222-222222222002'
  const difficulty = searchParams.difficulty || 'easy'

  const { data: child } = await supabase
    .from('children').select('*').eq('id', childId).single()

  if (!child) redirect('/dashboard')

  if (searchParams.theme) child.theme = searchParams.theme
  if (searchParams.lang)  child.lang_screen = searchParams.lang

  // Fetch topic
  let topic: any = null
  if (searchParams.topicId) {
    const { data: t } = await supabase
      .from('topics')
      .select('*, subject:subjects(*)')
      .eq('id', searchParams.topicId)
      .single()
    topic = t
  }

  if (!topic) {
    const { data: t } = await supabase
      .from('topics')
      .select('*, subject:subjects(*)')
      .eq('grade', child.grade)
      .order('sort_order')
      .limit(1)
      .single()
    topic = t
  }

  // Check if this is a reading topic — fetch passage instead of questions
  const isReadingTopic = topic?.slug?.includes('reading') ||
    topic?.slug?.includes('comprehension') ||
    topic?.slug?.includes('kriya') ||
    topic?.slug?.includes('advanced_reading') ||
    topic?.slug?.includes('literature') ||
    topic?.slug?.includes('sfrut') ||
    topic?.slug?.includes('poetry')

  let questions: any[] = []
  let passage: any = null
  let passageQuestions: any[] = []

  if (isReadingTopic && topic?.subject_id) {
    // Fetch a reading passage for this topic's subject + grade
    const { data: passages } = await supabase
      .from('reading_passages')
      .select('*')
      .eq('grade', child.grade)
      .eq('subject_id', topic.subject_id)
      .eq('approved', true)
      .limit(1)

    if (passages && passages.length > 0) {
      passage = passages[0]
      const { data: pqs } = await supabase
        .from('passage_questions')
        .select('*')
        .eq('passage_id', passage.id)
        .eq('approved', true)
        .order('sort_order')
      passageQuestions = pqs || []
    }
  } else {
    // Fetch ALL approved questions for this topic (ignore difficulty filter — mix them)
    const { data: allQs } = topic ? await supabase
      .from('questions')
      .select('*')
      .eq('topic_id', topic.id)
      .eq('approved', true) : { data: [] }

    const pool = allQs || []

    if (pool.length > 0) {
      // Get recently answered question IDs for this child + topic (last 50)
      const { data: recentAnswers } = await supabase
        .from('child_progress')
        .select('question_id')
        .eq('child_id', child.id)
        .eq('topic_id', topic.id)
        .order('created_at', { ascending: false })
        .limit(50)

      const seenIds = new Set((recentAnswers || []).map((r: any) => r.question_id).filter(Boolean))

      const unseen = pool.filter((q: any) => !seenIds.has(q.id))
      const seen   = pool.filter((q: any) =>  seenIds.has(q.id))
      const shuffle = (arr: any[]) => arr.sort(() => Math.random() - 0.5)

      questions = shuffle([...shuffle(unseen), ...shuffle(seen)]).slice(0, 10)
    }

    // Also fetch a supplementary passage for this grade+subject (for the slide-in panel)
    if (topic?.subject_id) {
      const { data: suppPassages } = await supabase
        .from('reading_passages')
        .select('id, title_en, title_he, content_en, content_he, difficulty, passage_type')
        .eq('grade', child.grade)
        .eq('subject_id', topic.subject_id)
        .eq('approved', true)
        .limit(5)

      if (suppPassages && suppPassages.length > 0) {
        // Pick a random one
        passage = suppPassages[Math.floor(Math.random() * suppPassages.length)]
      }
    }
  }

  // Fetch ALL topics for this child's grade (all subjects) for sidebar
  const { data: allTopics } = await supabase
    .from('topics')
    .select('*, subject:subjects(*)')
    .eq('grade', child.grade)
    .order('sort_order')

  const { data: subjects } = await supabase
    .from('subjects')
    .select('*')
    .order('sort_order')

  const { data: progress } = await supabase
    .from('child_topic_progress')
    .select('*')
    .eq('child_id', child.id)

  return (
    <LessonClient
      child={child}
      topic={topic}
      questions={questions}
      passage={passage}
      passageQuestions={passageQuestions}
      isReadingTopic={isReadingTopic}
      allTopics={allTopics || []}
      subjects={subjects || []}
      progress={progress || []}
      difficulty={difficulty as 'easy' | 'medium' | 'hard'}
    />
  )
}