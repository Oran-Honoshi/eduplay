import { notFound } from 'next/navigation'
import { createServiceRoleClient } from '@/lib/supabase'
import fixtures from './fixtures.json'
import DesignSandbox from './sandbox'

// Design QA page for the question screens: the designer's 24 reference
// questions plus real questions from the bank, for every subject and grade.
// Opens without signing in, saves nothing, and exists on preview links only.
export const dynamic = 'force-dynamic'

export default async function DesignQuestionsPage() {
  if (process.env.VERCEL_ENV === 'production') notFound()

  const real: any[] = []
  try { await loadReal(real) } catch { /* no database here: show the designer's questions only */ }
  return <DesignSandbox fixtures={fixtures as any[]} real={real} />
}

async function loadReal(real: any[]) {
  const supabase = createServiceRoleClient()
  const { data: subjects } = await supabase.from('subjects').select('id, slug')
  for (const sub of subjects || []) {
    for (let grade = 1; grade <= 6; grade++) {
      const { data: topics } = await supabase.from('topics').select('id, slug, title_he').eq('subject_id', sub.id).contains('grades', [grade]).limit(40)
      const ids = (topics || []).map(t => t.id)
      if (!ids.length) continue
      const { data: qs } = await supabase.from('questions')
        .select('id, topic_id, prompt_he, prompt_en, options, correct_answer, hint_he, hint_en, explanation_he, explanation_en, visual_data, design, q_type')
        .in('topic_id', ids).eq('approved', true).is('rejected_at', null).limit(60)
      const pool = (qs || []).sort(() => Math.random() - 0.5)
      // one choice question, one with a picture and one typed answer when there are
      const picks = [pool.find(q => Array.isArray(q.options) && q.options.length === 4 && !q.visual_data),
        pool.find(q => q.visual_data), pool.find(q => !(Array.isArray(q.options) && q.options.length))].filter(Boolean)
      for (const q of picks) {
        const t = topics!.find(x => x.id === q!.topic_id)
        real.push({ ...q, id: `bank-${q!.id}`, ref: t?.title_he || '', grade, subject_slug: sub.slug, topic_slug: t?.slug || '' })
      }
    }
  }
  // a reading lesson with its story
  const { data: passages } = await supabase.from('reading_passages').select('id, grade, title_he, title_en, content_he, content_en, subject_id').eq('approved', true).limit(30)
  for (const p of (passages || []).sort(() => Math.random() - 0.5).slice(0, 4)) {
    const { data: pq } = await supabase.from('passage_questions').select('id, prompt_he, prompt_en, options, correct_answer, hint_he, hint_en, explanation_en, design').eq('passage_id', p.id).eq('approved', true).limit(1)
    const sub = (subjects || []).find(s => s.id === p.subject_id)
    if (pq?.[0]) real.push({ ...pq[0], id: `story-${pq[0].id}`, ref: p.title_he || p.title_en || '', grade: p.grade, subject_slug: sub?.slug || 'hebrew', topic_slug: 'reading', passage: p })
  }

}
