import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { createServiceRoleClient } from '@/lib/supabase'
// @ts-ignore: plain JS module shipped by the designer
import { validateVisual } from '@/lib/eduVisuals/validate.js'

// Admin approval step for the visual generator (scripts/visual-generator).
// POST { items: [...generate.mjs output...], apply?: boolean }
//   apply=false (default): a dry run — says what would be saved and what is rejected.
//   apply=true: saves ONLY library-mode visuals that pass the validator again on the server, and only on questions that have no
//   picture yet. Custom SVGs, warnings and question_fixes are returned for a person to look at; they are never written.
export const maxDuration = 60

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.status === 401 ? 'Unauthorized' : 'Forbidden' }, { status: auth.status })
  const body = await req.json().catch(() => null)
  const items: any[] = Array.isArray(body?.items) ? body.items : []
  const apply = body?.apply === true
  if (!items.length || items.length > 300) return NextResponse.json({ error: 'items: 1–300 generator results' }, { status: 400 })

  const sb = createServiceRoleClient()
  const report: any[] = []
  for (const it of items) {
    const id = String(it?.id || '')
    const { data: q } = await sb.from('questions').select('id, prompt_he, prompt_en, correct_answer, options, visual_data, topic:topics(grade, subject:subjects(slug))').eq('id', id).maybeSingle()
    if (!q) { report.push({ id, status: 'not_found' }); continue }
    const opts: any[] = Array.isArray(q.options) ? q.options : []
    const right = opts.find(o => o.isCorrect)
    const question = { text: q.prompt_he || q.prompt_en || '', answer: right ? (right.value_he || right.value_en) : q.correct_answer, subject: 'math' }
    if (it.mode === 'none') { report.push({ id, status: 'no_picture_needed' }); continue }
    if (it.mode !== 'library') { report.push({ id, status: 'needs_person', reason: 'custom drawing' }); continue }
    const check = validateVisual(question, { mode: 'library', visual_data: it.visual_data })
    if (!check.ok) { report.push({ id, status: 'rejected', errors: check.errors }); continue }
    if (q.visual_data) { report.push({ id, status: 'skipped_has_picture' }); continue }
    const extra = { warnings: check.warnings, question_fixes: it.question_fixes }
    if (!apply) { report.push({ id, status: 'would_save', ...extra }); continue }
    // lib:'eduplay' makes the renderer use the designer's library even for types the older renderer also knows
    const { error } = await sb.from('questions').update({ visual_data: { ...it.visual_data, lib: 'eduplay' } }).eq('id', id).is('visual_data', null)
    report.push({ id, status: error ? 'error' : 'saved', ...(error ? { error: error.message } : extra) })
  }
  const count = (s: string) => report.filter(r => r.status === s).length
  return NextResponse.json({ apply, saved: count('saved'), would_save: count('would_save'), rejected: count('rejected'), needs_person: count('needs_person'), report })
}
