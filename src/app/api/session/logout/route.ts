import { NextRequest, NextResponse } from 'next/server'
import { clearChildSession, clearParentSession } from '@/lib/session'

// POST /api/session/logout — clears one session cookie. Child and parent
// sessions are scoped independently so logging one out on a shared device
// doesn't affect the other.
export async function POST(req: NextRequest) {
  const { scope } = await req.json()

  if (scope === 'child') {
    clearChildSession()
  } else if (scope === 'parent') {
    clearParentSession()
  } else {
    return NextResponse.json({ error: "scope must be 'child' or 'parent'" }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
