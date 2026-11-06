import { NextRequest, NextResponse } from 'next/server'
import { requireParentOnlySession } from '@/lib/session'
import { readUpload } from '@/lib/uploadBlocks'

export const maxDuration = 120

// POST /api/uploads/[id]/read — read one uploaded file now (called right after
// upload, in parallel), so planning later works from text and is fast.
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireParentOnlySession()
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status })
  const r = await readUpload(auth.parent.familyId, params.id)
  if (!r) return NextResponse.json({ error: 'Could not read this file' }, { status: 422 })
  return NextResponse.json({ ok: true })
}
