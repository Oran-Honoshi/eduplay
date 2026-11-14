import 'server-only'
import { createServiceRoleClient } from '@/lib/supabase'
import { generateHTML } from '@/lib/worksheetHtml'
import { renderExplanationHTML } from '@/lib/explanationHtml'
import type { Brand } from '@/lib/printBrand'

// Public view of a material opened from a share link or the free library.
// Shows only the material itself — never the child's name or anything about
// the family — and only questions a parent approved.
export async function loadPublicMaterial(slug: string) {
  if (!/^[a-z0-9]{6,24}$/.test(slug)) return null
  const db = createServiceRoleClient()
  const { data: m } = await db.from('materials')
    .select('id, kind, title, subject_slug, grade, language, plan, question_ids, topic_ids, explanation, time_minutes, share_slug, library_status, download_count, status, created_at')
    .eq('share_slug', slug).maybeSingle()
  if (!m || m.status !== 'ready') return null
  let questions: any[] = []
  if (m.kind !== 'explanation' && m.question_ids?.length) {
    const { data } = await db.from('questions').select('*').in('id', m.question_ids).eq('approved', true)
    const order = new Map<string, number>(m.question_ids.map((id: string, i: number) => [id, i]))
    questions = (data || []).sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
  }
  const { data: ratings } = await db.from('material_ratings').select('stars').eq('material_id', m.id)
  const n = ratings?.length || 0
  const avg = n ? (ratings!.reduce((s, r) => s + r.stars, 0) / n) : null
  return { m, questions, rating: { avg, n } }
}

export async function renderPublicHTML(p: NonNullable<Awaited<ReturnType<typeof loadPublicMaterial>>>, brand: Brand, withKey: boolean) {
  const { m, questions } = p
  if (m.kind === 'explanation') return renderExplanationHTML(m, brand)
  const db = createServiceRoleClient()
  const { data: topics } = await db.from('topics').select('*, subject:subjects(*)').in('id', m.topic_ids?.length ? m.topic_ids : ['00000000-0000-0000-0000-000000000000'])
  const { data: subject } = await db.from('subjects').select('*').eq('slug', m.subject_slug).maybeSingle()
  const withTitles = questions.map(q => {
    const t = (topics || []).find((x: any) => x.id === q.topic_id)
    return { ...q, topicTitle: t?.title_en || '', topicTitleHe: t?.title_he || '' }
  })
  return generateHTML({
    child: { display_name: '', grade: m.grade }, topics: topics || [], questions: withTitles,
    difficulty: 'mixed', langMode: m.language, includeKey: withKey,
    wsType: m.kind === 'exam' ? 'exam' : 'practice', includeHints: m.kind !== 'exam', solutionSteps: withKey,
    date: '', subject, brand, customTitle: m.title, timeMinutes: m.time_minutes, answerFormat: m.plan?.answer_format,
  })
}
