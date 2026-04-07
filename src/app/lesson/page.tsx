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

  // Fetch requested topic
  let topic: any = null
  if (searchParams.topicId) {
    const { data: t } = await supabase
      .from('topics')
      .select('*, subject:subjects(*)')
      .eq('id', searchParams.topicId)
      .single()
    topic = t
  }

  // Default to first topic for child's grade
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

  // Fetch questions for this topic
  const { data: questions } = topic ? await supabase
    .from('questions')
    .select('*')
    .eq('topic_id', topic.id)
    .eq('difficulty', difficulty)
    .eq('approved', true)
    .limit(10) : { data: [] }

  // Fetch ALL topics for this child's grade (all subjects) for sidebar
  const { data: allTopics } = await supabase
    .from('topics')
    .select('*, subject:subjects(*)')
    .eq('grade', child.grade)
    .order('sort_order')

  // Fetch all subjects
  const { data: subjects } = await supabase
    .from('subjects')
    .select('*')
    .order('sort_order')

  // Fetch progress
  const { data: progress } = await supabase
    .from('child_topic_progress')
    .select('*')
    .eq('child_id', child.id)

  return (
    <LessonClient
      child={child}
      topic={topic}
      questions={questions || []}
      allTopics={allTopics || []}
      subjects={subjects || []}
      progress={progress || []}
      difficulty={difficulty as 'easy' | 'medium' | 'hard'}
    />
  )
}
