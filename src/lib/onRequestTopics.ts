import 'server-only'
import { createHash } from 'crypto'
import { createServiceRoleClient } from '@/lib/supabase'

// Grade 7 and up has no pre-made bank: topics are created the first time a
// parent asks for them and then shared by everyone. A topic comes first and
// grade is only a tag — "positive and negative numbers" is one topic whether a
// school teaches it in 7th or 8th grade — so the same row collects every grade
// it has been requested for in `grades`.

export const ON_REQUEST_FROM_GRADE = 7

export function topicSlug(title: string): string {
  const base = title.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)
  if (base.replace(/[0-9-]/g, '').length >= 3) return `oq-${base}`
  // Hebrew-only (or symbol-only) names: stable hash of the normalized text
  const norm = title.replace(/[\u0591-\u05C7]/g, '').replace(/\s+/g, ' ').trim()
  return `oq-h${createHash('sha1').update(norm).digest('hex').slice(0, 12)}`
}

export type OnRequestTopic = { id: string; slug: string; title_en: string; title_he: string | null; grades: number[] }

export async function findOrCreateOnRequestTopic(opts: {
  subjectId: string; grade: number; titleEn: string; titleHe?: string | null; familyId: string
}): Promise<OnRequestTopic> {
  const db = createServiceRoleClient()
  const slug = topicSlug(opts.titleEn)
  const { data: existing } = await db.from('topics')
    .select('id, slug, title_en, title_he, grades')
    .eq('subject_id', opts.subjectId).eq('origin', 'on_request').eq('slug', slug).maybeSingle()
  if (existing) return addGrade(existing as OnRequestTopic, opts.grade)

  const { data: created, error } = await db.from('topics').insert({
    subject_id: opts.subjectId, grade: opts.grade, grades: [opts.grade], slug,
    title_en: opts.titleEn.trim().slice(0, 120), title_he: opts.titleHe?.trim().slice(0, 120) || null,
    origin: 'on_request', created_by_family: opts.familyId, is_active: true, sort_order: 0,
  }).select('id, slug, title_en, title_he, grades').single()
  if (error || !created) {
    // lost a race with another parent creating the same topic — use theirs
    const { data: again } = await db.from('topics').select('id, slug, title_en, title_he, grades')
      .eq('subject_id', opts.subjectId).eq('origin', 'on_request').eq('slug', slug).maybeSingle()
    if (again) return addGrade(again as OnRequestTopic, opts.grade)
    throw new Error(error?.message || 'Could not create topic')
  }
  return created as OnRequestTopic
}

export async function addGrade(t: OnRequestTopic, grade: number): Promise<OnRequestTopic> {
  if ((t.grades || []).includes(grade)) return t
  const grades = [...(t.grades || []), grade].sort((a, b) => a - b)
  await createServiceRoleClient().from('topics').update({ grades }).eq('id', t.id)
  return { ...t, grades }
}
