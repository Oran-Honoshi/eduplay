// Next's App Router Data Cache caches any fetch() by default, including the ones
// supabase-js makes internally — without this, the assignments query below (and every
// other query on this page) can serve a stale response. Same fix already applied to
// dashboard/page.tsx for the same reason; this page never needed it before because its
// other server-fetched data (topics/progress/lastTopic) is only ever used as initial
// state and gets superseded by a client-side refetch — the assignments banner is the
// first thing here that depends on the server render itself being fresh.
export const revalidate = 0
import { kidTopicsForGrade } from '@/lib/kidTopics'
import { createServiceRoleClient } from '@/lib/supabase'
import ChildPortalClient from './client'
import { redirect } from 'next/navigation'

export default async function ChildPortalPage({ params }: { params: { token: string } }) {
  const supabase = createServiceRoleClient()

  // Find child by token
  const { data: child } = await supabase
    .from('children')
    .select('*')
    .eq('access_token', params.token)
    .single()

  if (!child) redirect('/')

  // TODO(product): fires on every portal load with no gate on actual engagement — a
  // child (or anyone) opening this link bumps last_active_at even if they never pick
  // a lesson or answer a question. Compare against api/progress/route.ts, which only
  // touches last_active_at alongside a real child_topic_progress write. Any "last
  // active" display sourced from this column currently reads as "portal opened", not
  // "child engaged" — confirmed via child "Tom" (2026-07-26): last_active_at recent,
  // zero rows in every per-child activity table. Needs a product call on whether to
  // split into last_opened_at vs. last_engaged_at, or gate this update on some
  // minimum interaction before shipping either way.
  await supabase
    .from('children')
    .update({ last_active_at: new Date().toISOString() })
    .eq('id', child.id)

  // Get all topics for this child's grade
  const { data: subjects } = await supabase
    .from('subjects')
    .select('*')
    .order('sort_order')

  const allTopics = await kidTopicsForGrade(supabase, child.grade)

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

  // Get this child's still-open assignments (at least one item not yet resolved),
  // oldest first, for the "assignments waiting" banner.
  const { data: assignmentRows } = await supabase
    .from('assignments')
    .select('id, title, created_at, assignment_items(status)')
    .eq('child_id', child.id)
    .order('created_at')

  const pendingAssignments = (assignmentRows || [])
    .map((a: any) => {
      const items = a.assignment_items || []
      const completedItems = items.filter(
        (it: any) => it.status !== 'not_started' && it.status !== 'attempt_1_wrong'
      ).length
      return { id: a.id, title: a.title, totalItems: items.length, completedItems }
    })
    .filter((a: any) => a.totalItems > 0 && a.completedItems < a.totalItems)

  return (
    <ChildPortalClient
      child={child}
      subjects={subjects || []}
      allTopics={allTopics || []}
      progress={progress || []}
      lastTopic={lastTopic}
      pendingAssignments={pendingAssignments}
      token={params.token}
    />
  )
}
