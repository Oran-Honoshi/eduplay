import { createServiceRoleClient } from '@/lib/supabase'
import { authorizeChildAccess } from '@/lib/session'
import { redirect } from 'next/navigation'
import PracticeClient from './client'

export const revalidate = 0

interface Props {
  searchParams: { childId?: string; token?: string; theme?: string; lang?: string; grade?: string }
}

// Kid "Practice" tab: every topic of a grade, with a way to keep practicing a
// topic after the lesson is done. Grade defaults to the child's own grade but
// can be switched (grade is a starting point, not a wall).
export default async function PracticePage({ searchParams }: Props) {
  const { childId, token, theme, lang } = searchParams
  if (!childId) redirect('/dashboard')

  const auth = await authorizeChildAccess(childId)
  if (!auth.ok) redirect(auth.status === 401 ? '/login' : '/dashboard')

  const supabase = createServiceRoleClient()
  const { data: child } = await supabase
    .from('children')
    .select('id, display_name, grade, theme, lang_screen')
    .eq('id', childId).single()
  if (!child) redirect('/dashboard')

  const parsed = parseInt(searchParams.grade ?? '', 10)
  const grade = Number.isFinite(parsed) && parsed >= 0 && parsed <= 12 ? parsed : (child.grade ?? 0)

  const [{ data: subjects }, { data: topics }, { data: progress }] = await Promise.all([
    supabase.from('subjects').select('id, slug, label_en, label_he, sort_order').order('sort_order'),
    supabase.from('topics').select('id, title_en, title_he, sort_order, grade, subject:subjects(slug, label_en, label_he)')
      // grade 7+ topics are shared across grades: match on the grade tag
      .match(grade >= 7 ? { origin: 'on_request' } : { grade }).filter('grades', 'cs', `{${grade}}`).order('sort_order'),
    supabase.from('child_topic_progress').select('topic_id, status, steps_completed, steps_total').eq('child_id', childId),
  ])

  // Approved-question count per topic for this grade (a grade is at most a few
  // hundred rows, well under the API row cap).
  const topicIds = (topics || []).map((t: any) => t.id)
  const { data: qRows } = topicIds.length
    ? await supabase.from('questions').select('topic_id').eq('approved', true).in('topic_id', topicIds).range(0, 4999)
    : { data: [] as any[] }
  const counts: Record<string, number> = {}
  for (const r of qRows || []) counts[r.topic_id] = (counts[r.topic_id] || 0) + 1

  return (
    <PracticeClient
      child={{ ...child, theme: theme || child.theme || 'plain', lang_screen: lang || child.lang_screen }}
      token={token || ''}
      grade={grade}
      subjects={subjects || []}
      topics={topics || []}
      progress={progress || []}
      counts={counts}
    />
  )
}
