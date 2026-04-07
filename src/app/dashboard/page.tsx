export const revalidate = 0
import { createServerClient } from '@/lib/supabase'
import DashboardClient from './client'

export default async function DashboardPage() {
  const supabase = createServerClient()
  const familyId = '11111111-1111-1111-1111-111111111111'

  const [
    { data: children },
    { data: family },
    { data: subjects },
  ] = await Promise.all([
    supabase.from('children').select('*').eq('family_id', familyId).order('created_at'),
    supabase.from('families').select('*').eq('id', familyId).single(),
    supabase.from('subjects').select('*').order('sort_order'),
  ])

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
        parentName:      'Hila',
        isDemo:          false,
      }}
    />
  )
}
