import { createServerClient } from '@/lib/supabase'
import ChildPortalClient from './client'
import { redirect } from 'next/navigation'

export default async function ChildPortalPage({ params }: { params: { token: string } }) {
  const supabase = createServerClient()

  // Find child by token
  const { data: child } = await supabase
    .from('children')
    .select('*')
    .eq('access_token', params.token)
    .single()

  if (!child) redirect('/')

  // Update last active
  await supabase
    .from('children')
    .update({ last_active_at: new Date().toISOString() })
    .eq('id', child.id)

  // Get all topics for this child's grade
  const { data: subjects } = await supabase
    .from('subjects')
    .select('*')
    .order('sort_order')

  const { data: allTopics } = await supabase
    .from('topics')
    .select('*, subject:subjects(*)')
    .eq('grade', child.grade)
    .order('sort_order')

  // Get child's progress
  const { data: progress } = await supabase
    .from('child_topic_progress')
    .select('*, topic:topics(title_en, title_he, slug)')
    .eq('child_id', child.id)

  // Get last topic if resuming
  let lastTopic = null
  if (child.last_topic_id) {
    const { data: lt } = await supabase
      .from('topics')
      .select('*, subject:subjects(*)')
      .eq('id', child.last_topic_id)
      .single()
    lastTopic = lt
  }

  return (
    <ChildPortalClient
      child={child}
      subjects={subjects || []}
      allTopics={allTopics || []}
      progress={progress || []}
      lastTopic={lastTopic}
      token={params.token}
    />
  )
}
