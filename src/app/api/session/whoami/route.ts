import { NextResponse } from 'next/server'
import { requireParentSession, requireChildSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

// GET /api/session/whoami — lets kid screens know whether a parent is also
// signed in on this device, so they can offer "back to the parent account".
export async function GET() {
  const [parent, child] = await Promise.all([requireParentSession(), requireChildSession()])
  return NextResponse.json({ parent: !!parent, childId: child?.childId || null })
}
