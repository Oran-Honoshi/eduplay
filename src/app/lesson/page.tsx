import { createServerClient } from '@/lib/supabase'
import LessonClient from './client'

interface Props {
  searchParams: { topicId?: string; childId?: string; difficulty?: string }
}

export default async function LessonPage({ searchParams }: Props) {
  const supabase = createServerClient()
  const childId    = searchParams.childId   || '22222222-2222-2222-2222-222222222002'
  const difficulty = searchParams.difficulty || 'easy'

  const { data: child } = await supabase
    .from('children').select('*').eq('id', childId).single()

  let topicQuery = supabase.from('topics').select('*, subject:subjects(*)')
  if (searchParams.topicId) {
    topicQuery = topicQuery.eq('id', searchParams.topicId)
  } else {
    topicQuery = topicQuery.eq('slug', 'fractions_equal').eq('grade', 4)
  }
  const { data: topic } = await topicQuery.single()

  const { data: questions } = topic ? await supabase
    .from('questions')
    .select('*')
    .eq('topic_id', topic.id)
    .eq('difficulty', difficulty)
    .eq('approved', true)
    .limit(10) : { data: [] }

  const { data: allTopics } = topic ? await supabase
    .from('topics')
    .select('*')
    .eq('subject_id', topic.subject_id)
    .eq('grade', topic.grade)
    .order('sort_order') : { data: [] }

  return (
    <LessonClient
      child={child}
      topic={topic}
      questions={questions || []}
      progress={null}
      allTopics={allTopics || []}
      difficulty={difficulty as 'easy' | 'medium' | 'hard'}
    />
  )
}
