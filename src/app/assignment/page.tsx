import { createServiceRoleClient } from '@/lib/supabase'
import { authorizeChildAccess } from '@/lib/session'
import AssignmentClient from './client'
import { redirect } from 'next/navigation'

interface Props {
  searchParams: { id?: string; childId?: string; theme?: string; lang?: string; token?: string }
}

export default async function AssignmentPage({ searchParams }: Props) {
  const supabase = createServiceRoleClient()
  const { id, childId, theme, lang, token } = searchParams

  if (!id || !childId) redirect('/dashboard')

  const auth = await authorizeChildAccess(childId)
  if (!auth.ok) redirect(auth.status === 401 ? '/login' : '/dashboard?error=lesson_access_denied')

  const { data: child } = await supabase.from('children').select('*').eq('id', childId).single()
  if (!child) redirect('/dashboard')
  if (theme) child.theme = theme
  if (lang) child.lang_screen = lang

  const { data: assignment } = await supabase
    .from('assignments')
    .select('id, title, child_id, topic_id, topic:topics(title_en, title_he)')
    .eq('id', id)
    .maybeSingle()

  // Guards against a stale/foreign assignment id reaching a valid, authorized child
  // session — access to *this* child was already confirmed above, but not that this
  // specific assignment actually belongs to them.
  if (!assignment || assignment.child_id !== childId) {
    redirect(token ? `/play/${token}` : '/dashboard')
  }

  const { data: items } = await supabase
    .from('assignment_items')
    .select(`
      id, sort_order, status, attempt_1_answer, attempt_1_correct, attempt_2_answer, attempt_2_correct,
      question:questions ( id, prompt_en, prompt_he, options, hint_en, hint_he, explanation_en, visual_data, difficulty )
    `)
    .eq('assignment_id', id)
    .order('sort_order')

  return (
    <AssignmentClient
      child={child}
      assignment={assignment}
      items={items || []}
      token={token || ''}
    />
  )
}
