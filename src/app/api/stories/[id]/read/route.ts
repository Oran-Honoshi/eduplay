import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase'
import { requireChildSession } from '@/lib/session'

// POST — the child finished reading a booklet. The first time earns a sticker.
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const child = await requireChildSession()
  if (!child) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = createServiceRoleClient()
  const { data: b } = await db.from('story_booklets').select('id, status').eq('id', params.id).maybeSingle()
  if (!b || b.status !== 'approved') return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const { count } = await db.from('story_reads').select('id', { count: 'exact', head: true }).eq('child_id', child.childId).eq('booklet_id', b.id)
  await db.from('story_reads').insert({ child_id: child.childId, booklet_id: b.id })
  let stickerEarned = false
  if (!count) {
    const { data: kid } = await db.from('children').select('card_tokens').eq('id', child.childId).single()
    if (kid) { await db.from('children').update({ card_tokens: (kid.card_tokens || 0) + 1 }).eq('id', child.childId); stickerEarned = true }
  }
  return NextResponse.json({ success: true, stickerEarned, firstTime: !count })
}
