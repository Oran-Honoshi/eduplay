import { NextResponse } from 'next/server'
import { requireParentOnlySession } from '@/lib/session'
import { getTrialInfo } from '@/lib/trial'

// The signed-in family's plan / trial state, for the header chip.
export async function GET() {
  const auth = await requireParentOnlySession()
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status })
  return NextResponse.json(await getTrialInfo(auth.parent.familyId))
}
