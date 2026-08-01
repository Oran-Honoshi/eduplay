import { createServiceRoleClient } from '@/lib/supabase'
import { authorizeChildAccess } from '@/lib/session'
import AssignmentsClient from './client'
import { redirect } from 'next/navigation'

interface Props {
  searchParams: { childId?: string; token?: string; theme?: string; lang?: string }
}

export default async function AssignmentsPage({ searchParams }: Props) {
  const supabase = createServiceRoleClient()
  const { childId, token, theme, lang } = searchParams

  if (!childId) redirect('/dashboard')

  const auth = await authorizeChildAccess(childId)
  if (!auth.ok) redirect(auth.status === 401 ? '/login' : '/dashboard?error=assignments_access_denied')

  const { data: child } = await supabase.from('children').select('*').eq('id', childId).single()
  if (!child) redirect('/dashboard')
  if (theme) child.theme = theme
  if (lang) child.lang_screen = lang

  return <AssignmentsClient child={child} token={token || ''} />
}
