import { notFound } from 'next/navigation'
import { createServiceRoleClient } from '@/lib/supabase'
import { designAllowed } from '@/lib/designAccess'
import DesignSandbox from '../questions/sandbox'
import brief from './brief.json'

// Every question named in the visual-aids brief for the designer, in the real
// question screen, with what the brief asks for. No sign-in, saves nothing.
export const dynamic = 'force-dynamic'
export const metadata = { robots: { index: false, follow: false } }

type Item = { group: string; lesson: string; id: string; wanted: string }

export default async function DesignBriefPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  if (!designAllowed(searchParams)) notFound()
  const items = brief as Item[]
  const found = new Map<string, any>()
  try {
    const db = createServiceRoleClient()
    const { data: subjects } = await db.from('subjects').select('id, slug')
    const { data: topics } = await db.from('topics').select('id, slug, title_he, grades, subject_id').overlaps('grades', [0, 1, 2, 3])
    const tIds = (topics || []).map(t => t.id)
    // the brief names questions by the first 8 characters of their id
    const want = new Set(items.map(i => i.id))
    const full: string[] = []
    for (let from = 0; ; from += 1000) {
      const { data } = await db.from('questions').select('id').in('topic_id', tIds).range(from, from + 999)
      for (const r of data || []) if (want.has(r.id.slice(0, 8))) full.push(r.id)
      if (!data || data.length < 1000) break
    }
    const { data: qs } = await db.from('questions')
      .select('id, topic_id, prompt_he, prompt_en, options, correct_answer, hint_he, hint_en, explanation_he, explanation_en, visual_data, design, q_type')
      .in('id', full)
    for (const q of qs || []) {
      const t = topics!.find(x => x.id === q.topic_id)
      const sub = (subjects || []).find(s => s.id === t?.subject_id)
      found.set(q.id.slice(0, 8), { ...q, ref: t?.title_he || '', grade: t?.grades?.[0] ?? 1, subject_slug: sub?.slug || 'math', topic_slug: t?.slug || '' })
    }
  } catch { /* no database here */ }

  const groups: { title: string; qs: any[] }[] = []
  for (const it of items) {
    const q = found.get(it.id)
    if (!q) continue
    let g = groups.find(x => x.title === it.group)
    if (!g) groups.push(g = { title: it.group, qs: [] })
    g.qs.push({ ...q, id: `brief-${q.id}`, short: it.id, wanted: it.wanted.replace(/`/g, '') })
  }
  return <DesignSandbox fixtures={[]} real={[]} groups={groups} />
}
