import { NextRequest, NextResponse } from 'next/server'
import { waitUntil } from '@vercel/functions'
import { requireParentOnlySession } from '@/lib/session'
import { createServiceRoleClient } from '@/lib/supabase'
import { insertDuplicate } from '@/lib/duplicateMaterial'
import { buildJobs, pool } from '@/lib/materialJobs'

export const maxDuration = 300

// POST /api/materials/[id]/prepare-next — called when a sheet is finished.
// Quietly writes the next "more like this" set in the background, so when the
// parent asks for it, it is ready at once. Hidden from the history until claimed
// (status preparing → prepared → draft). One spare per material at a time.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireParentOnlySession()
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status })
  const db = createServiceRoleClient()
  const { data: m } = await db.from('materials').select('*').eq('id', params.id).maybeSingle()
  if (!m || m.family_id !== auth.parent.familyId) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (m.kind === 'explanation' || m.status !== 'ready') return NextResponse.json({ skipped: 'not a finished question sheet' })

  const { data: existing } = await db.from('materials').select('id, status, created_at')
    .eq('parent_material_id', m.id).in('status', ['preparing', 'prepared'])
  // a "preparing" row older than 10 minutes died half way — let it be replaced
  const stale = (existing || []).filter(x => x.status === 'preparing' && Date.now() - new Date(x.created_at).getTime() > 10 * 60_000)
  if (stale.length) await db.from('materials').delete().in('id', stale.map(x => x.id))
  if ((existing || []).length > stale.length) return NextResponse.json({ skipped: 'already prepared' })

  const { data: next, error } = await insertDuplicate(db, m, 'preparing')
  if (error || !next) return NextResponse.json({ error: error?.message || 'insert failed' }, { status: 500 })

  const origin = req.nextUrl.origin, cookie = req.headers.get('cookie') || ''
  waitUntil((async () => {
    let ok = 0
    // all parts at once: each part has its own sub-skills, and the build route drops repeats
    await pool(buildJobs(next), 6, async j => {
      const r = await fetch(`${origin}/api/materials/${next.id}/build`, {
        method: 'POST', headers: { 'content-type': 'application/json', cookie },
        body: JSON.stringify({ [j.section ? 'section_key' : 'topic_key']: j.key, generate: j.generate, reuse: j.reuse, part: j.part, parts: j.parts }),
      }).catch(() => null)
      if (r?.ok) ok++
    })
    if (ok) await db.from('materials').update({ status: 'prepared' }).eq('id', next.id).eq('status', 'preparing')
    else await db.from('materials').delete().eq('id', next.id)
  })())
  return NextResponse.json({ started: next.id })
}
