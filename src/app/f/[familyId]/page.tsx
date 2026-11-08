import { notFound } from 'next/navigation'
import { createServiceRoleClient } from '@/lib/supabase'
import WhoIsLearning from '@/components/kid/WhoIsLearning'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'כניסה · EduPlay', robots: { index: false, follow: false } }

// The family sign-in link for older kids: pick your picture, type your code.
export default async function FamilyLinkPage({ params }: { params: { familyId: string } }) {
  if (!/^[0-9a-f-]{36}$/i.test(params.familyId)) notFound()
  const supabase = createServiceRoleClient()
  const { data: fam } = await supabase.from('families').select('id').eq('id', params.familyId).maybeSingle()
  if (!fam) notFound()
  const { data } = await supabase.from('children').select('id, display_name, grade, pin_code').eq('family_id', params.familyId).order('created_at')
  const kids = (data || []).map((c: any) => ({ id: c.id, name: c.display_name, grade: c.grade, hasPin: !!c.pin_code }))
  return <WhoIsLearning kids={kids} mode="family" familyId={params.familyId} />
}
