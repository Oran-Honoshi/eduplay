import { redirect } from 'next/navigation'
import { createServiceRoleClient } from '@/lib/supabase'
import { requireParentSession } from '@/lib/session'
import WhoIsLearning from '@/components/kid/WhoIsLearning'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'מי לומד עכשיו? · EduPlay' }

// On the parent's device: pick a child and open their screen, no code needed.
export default async function KidsPickerPage() {
  const parent = await requireParentSession()
  if (!parent) redirect('/login')
  const supabase = createServiceRoleClient()
  const { data } = await supabase.from('children').select('id, display_name, grade').eq('family_id', parent.familyId).order('created_at')
  const kids = (data || []).map((c: any) => ({ id: c.id, name: c.display_name, grade: c.grade }))
  return <WhoIsLearning kids={kids} mode="parent" />
}
