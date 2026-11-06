import 'server-only'
import { createServiceRoleClient } from '@/lib/supabase'
import { requireParentOnlySession } from '@/lib/session'

// Admin = a parent whose family has families.is_admin (approves the free library, reads feedback).
export async function requireAdmin(): Promise<{ ok: true; familyId: string } | { ok: false; status: 401 | 403 }> {
  const auth = await requireParentOnlySession()
  if (!auth.ok) return auth
  const { data } = await createServiceRoleClient().from('families').select('is_admin').eq('id', auth.parent.familyId).maybeSingle()
  return data?.is_admin ? { ok: true, familyId: auth.parent.familyId } : { ok: false, status: 403 }
}
