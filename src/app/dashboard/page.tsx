export const revalidate = 0
import { createServiceRoleClient } from '@/lib/supabase'
import { requireParentOnlySession, getSession } from '@/lib/session'
import DashboardClient from './client'
import { redirect } from 'next/navigation'

interface Props {
  searchParams: { error?: string }
}

export default async function DashboardPage({ searchParams }: Props) {
  const supabase = createServiceRoleClient()

  const auth = await requireParentOnlySession()
  if (!auth.ok) {
    // A child session belongs on their own portal, not the parent dashboard —
    // this page is also the back-button target for cards/worksheets/passages/curriculum.
    if (auth.status === 403) {
      const { child } = await getSession()
      const { data: childRow } = child
        ? await supabase.from('children').select('access_token').eq('id', child.childId).single()
        : { data: null }
      redirect(childRow?.access_token ? `/play/${childRow.access_token}` : '/login')
    }
    redirect('/login')
  }

  const familyId = auth.parent.familyId

  const [
    { data: children },
    { data: family },
    { data: subjects },
  ] = await Promise.all([
    supabase.from('children').select('*').eq('family_id', familyId).order('created_at'),
    supabase.from('families').select('*').eq('id', familyId).single(),
    supabase.from('subjects').select('*').order('sort_order'),
  ])
  // the signed-in parent's name (else the family's first parent)
  const { data: parentRows } = await supabase.from('family_parents').select('id, name').eq('family_id', familyId).order('created_at')
  const parentRow = (parentRows || []).find(p => p.id === auth.parent.parentId) || (parentRows || [])[0]

  const childIds = children?.map(c => c.id) || []

  const [
    { data: allProgress },
    { data: allRecommendations },
  ] = await Promise.all([
    childIds.length
  ? supabase.from('child_topic_progress')
      .select('*, topic:topics(title_en, title_he, slug, subject:subjects(slug, label_en))')
      .in('child_id', childIds)
  : { data: [] },
    childIds.length
      ? supabase.from('focus_recommendations')
          .select('*, topic:topics(title_en, description_en, slug)')
          .in('child_id', childIds)
          .order('priority')
      : { data: [] },
  ])

  return (
    <DashboardClient
      data={{
        family:          family || null,
        children:        children || [],
        subjects:        subjects || [],
        progress:        allProgress || [],
        recommendations: allRecommendations || [],
        parentName:      parentRow?.name || '',
        isDemo:          false,
      }}
      error={searchParams.error}
    />
  )
}
