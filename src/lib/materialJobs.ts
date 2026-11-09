// The build plan for a material, split into parts the build route fills
// (≤5 questions per part, a whole word bank in one go). Used by the server
// when a spare "more like this" is prepared in the background; the Create
// page builds the same jobs in the browser.
import { hasSections, questionSections } from '@/lib/workbook'

export type BuildJob = { key: string; label: string; reuse: number; generate: number; part: number; parts: number; section?: boolean }

export function buildJobs(m: any, made: { topic_id?: string | null }[] = [], sectionQ: Record<string, string[]> = {}): BuildJob[] {
  const jobs: BuildJob[] = []
  if (hasSections(m.plan)) {
    for (const sc of questionSections(m.plan)) {
      const fresh = Math.max(0, sc.count - (sectionQ[sc.key] || []).length)
      if (!fresh) continue
      const size = sc.kind === 'word_bank' || sc.kind === 'translate_words' ? fresh : 5
      const parts = Math.ceil(fresh / size)
      for (let k = 0; k < parts; k++) jobs.push({ key: sc.key, label: sc.title_he, reuse: 0, generate: Math.min(size, fresh - k * size), part: k, parts, section: true })
    }
    return jobs
  }
  const hasMaterial = (m.upload_ids || []).length > 0 || !!m.plan?.digest
  for (const t of m.plan?.topics || []) {
    const already = made.filter(q => t.topic_id && q.topic_id === t.topic_id).length
    const reuse = hasMaterial || already ? 0 : Math.min(t.bank_count || 0, Math.floor(t.count / 2), t.reuse ?? Infinity)
    const fresh = Math.max(0, t.count - reuse - already)
    const parts = Math.max(1, Math.ceil(fresh / 5))
    for (let k = 0; k < parts; k++) {
      const size = Math.min(5, fresh - k * 5)
      if (size > 0) jobs.push({ key: t.key, label: t.title_he || t.title_en, reuse: k === 0 ? reuse : 0, generate: size, part: k, parts })
    }
    if (fresh === 0 && reuse > 0) jobs.push({ key: t.key, label: t.title_he || t.title_en, reuse, generate: 0, part: 0, parts: 1 })
  }
  return jobs
}

/** run async tasks with at most `n` at a time */
export async function pool<T>(items: T[], n: number, fn: (x: T) => Promise<void>) {
  let i = 0
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => { while (i < items.length) await fn(items[i++]) }))
}
