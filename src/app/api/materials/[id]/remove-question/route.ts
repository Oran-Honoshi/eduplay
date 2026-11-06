import { NextRequest, NextResponse } from 'next/server'
import { requireParentOnlySession } from '@/lib/session'
import { createServiceRoleClient } from '@/lib/supabase'

// POST /api/materials/[id]/remove-question { question_id, reasons?: string[], note?: string }
// Removes a question from this material. When the parent says why, the reason
// is kept on the question and added to the material's plan (avoid_he) so the
// next questions written for it avoid the same problem.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireParentOnlySession()
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status })
  const db = createServiceRoleClient()
  const { data: m } = await db.from('materials').select('id, family_id, question_ids, plan, section_q').eq('id', params.id).maybeSingle()
  if (!m || m.family_id !== auth.parent.familyId) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const b = await req.json().catch(() => ({}))
  const qid = String(b.question_id || '')
  if (!(m.question_ids || []).includes(qid)) return NextResponse.json({ error: 'Not in this material' }, { status: 400 })
  const reasons: string[] = Array.isArray(b.reasons) ? b.reasons.filter((x: any) => typeof x === 'string').slice(0, 6) : []
  const note = typeof b.note === 'string' ? b.note.trim().slice(0, 400) : ''
  const why = [...reasons, note].filter(Boolean).join(' — ')

  const { data: q } = await db.from('questions').select('id, approved, created_by_family, prompt_he, prompt_en').eq('id', qid).maybeSingle()
  // a question this family's AI run created (not yet shared) is soft-rejected; a shared bank question is only removed from the set
  if (q && (!q.approved || q.created_by_family === m.family_id)) {
    await db.from('questions').update({ approved: false, rejected_at: new Date().toISOString(), rejected_reason: why || null }).eq('id', qid)
  }
  const plan = { ...(m.plan || {}) }
  if (why) plan.avoid_he = [...(plan.avoid_he || []), `${why} (בשאלה: "${String(q?.prompt_he || q?.prompt_en || '').slice(0, 80)}")`].slice(-20)
  const section_q = Object.fromEntries(Object.entries(m.section_q || {}).map(([k, v]: any) => [k, (v || []).filter((x: string) => x !== qid)]))
  await db.from('materials').update({ question_ids: m.question_ids.filter((x: string) => x !== qid), section_q, plan, updated_at: new Date().toISOString() }).eq('id', m.id)
  return NextResponse.json({ ok: true })
}
