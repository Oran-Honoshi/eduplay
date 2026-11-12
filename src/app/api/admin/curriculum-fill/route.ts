import { NextRequest, NextResponse } from 'next/server'
import { waitUntil } from '@vercel/functions'
import { createServiceRoleClient } from '@/lib/supabase'
import { requireAdmin } from '@/lib/admin'
import { refillTopic } from '@/lib/refill'
import { draftLearnCard, BANK_BATCH } from '@/lib/bankUpgrade'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

// Admin job: write the lessons the curriculum asks for and the bank lacks
// (project doc "curriculum-rules-by-grade", 2026-11-12). Each lesson gets
// TARGET questions (saved NOT approved, reviewed in /admin/bank) and a learn
// card draft. The lessons stay hidden from kids (grades = {}) until approved.
//   GET → progress · POST {action:'start'} · POST {action:'publish', slug} → show to kids
const FILL_LESSONS = [
  'en_oral_colors_g1', 'en_oral_numbers_g1', 'en_oral_animals_g1', 'en_oral_greetings_g1',
  'en_oral_family_g2', 'en_oral_food_g2', 'en_oral_clothes_body_g2', 'en_oral_questions_g2',
  'counting_money_g2', 'sequences_patterns_g2', 'data_graphs_g5',
  'punctuation_g2', 'fact_opinion_g4', 'claim_reason_g5',
]
const TARGET = 16
const PER_CALL = 8

function internal(req: NextRequest) {
  const k = req.headers.get('x-job-key')
  return !!k && k === process.env.SUPABASE_SERVICE_ROLE_KEY
}

async function counts(db: any) {
  const { data: topics } = await db.from('topics').select('id, slug, grade, grades, title_he, title_en, subject:subjects(slug)').in('slug', FILL_LESSONS)
  const out: any[] = []
  for (const t of topics || []) {
    const { count } = await db.from('questions').select('id', { count: 'exact', head: true }).eq('topic_id', t.id).is('rejected_at', null)
    const { data: card } = await db.from('topic_explanations').select('id, status').eq('topic_slug', t.slug).maybeSingle()
    out.push({ ...t, questions: count || 0, card: card?.status || null })
  }
  return out
}

export async function GET() {
  const a = await requireAdmin()
  if (!a.ok) return NextResponse.json({ error: 'Forbidden' }, { status: a.status })
  return NextResponse.json({ lessons: await counts(createServiceRoleClient()) })
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const isInternal = internal(req)
  if (!isInternal) {
    const a = await requireAdmin()
    if (!a.ok) return NextResponse.json({ error: 'Forbidden' }, { status: a.status })
  }
  const db = createServiceRoleClient()
  const kick = () => fetch(`${req.nextUrl.origin}/api/admin/curriculum-fill`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-job-key': process.env.SUPABASE_SERVICE_ROLE_KEY! }, body: JSON.stringify({ action: 'step' }) }).catch(() => {})

  if (body.action === 'publish' && body.slug) {
    const { data: t } = await db.from('topics').select('id, grade').eq('slug', body.slug).maybeSingle()
    if (!t) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    await db.from('topics').update({ grades: [t.grade] }).eq('id', t.id)
    return NextResponse.json({ ok: true })
  }
  if (body.action === 'start') { waitUntil(kick()); return NextResponse.json({ ok: true }) }
  if (body.action !== 'step' || !isInternal) return NextResponse.json({ error: 'Bad action' }, { status: 400 })

  const list = await counts(db)
  const t = list.find(x => x.questions < TARGET)
  if (!t) return NextResponse.json({ ok: true, done: true })
  const r = await refillTopic(db, t.id, Math.min(PER_CALL, TARGET - t.questions))
  // a learn card once the lesson has questions
  if (!t.card && t.questions + ((r as any).added || 0) >= TARGET) {
    const { data: qs } = await db.from('questions').select('prompt_he, prompt_en').eq('topic_id', t.id).is('rejected_at', null).limit(8)
    const c = await draftLearnCard(t, qs || [])
    if (c.ok) {
      const x = c.data
      await db.from('topic_explanations').insert({
        topic_slug: t.slug, subject: t.subject?.slug, grade: t.grade, status: 'draft', batch: BANK_BATCH,
        title_he: x.title_he || t.title_he, title_en: t.title_en, summary_he: x.summary_he || '', summary_en: '', key_points_he: x.key_points_he || [],
        main_visual: x.example?.visual || {},
        examples: x.example ? [{ problem_he: x.example.problem_he, solution_steps_he: x.example.steps_he || [], answer_he: x.example.answer_he, visual: x.example.visual || null }] : [],
      })
    }
  }
  if (r.ok) waitUntil(kick())
  return NextResponse.json({ ok: r.ok, lesson: t.slug, added: (r as any).added || 0, error: (r as any).error })
}
