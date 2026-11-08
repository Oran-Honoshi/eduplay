import { NextResponse } from 'next/server'
import { requireParentSession, requireChildSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

// GET /api/session/whoami — lets kid screens know whether a parent is also
// signed in on this device, so they can offer "back to the parent account".
export async function GET() {
  const [parent, child] = await Promise.all([requireParentSession(), requireChildSession()])
  // Only a parent of this same family counts — a parent signed in to another
  // family on a shared computer shouldn't get a "back to parent" button here.
  const sameFamily = !!parent && (!child || child.familyId === parent.familyId)
  return NextResponse.json({ parent: sameFamily, childId: child?.childId || null })
}
