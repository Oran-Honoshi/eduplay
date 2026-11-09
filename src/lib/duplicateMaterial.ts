import { assignSectionWords, hasSections, usedWords } from '@/lib/workbook'

// "More like this": same plan, method, question types, topics and material, but
// a fresh draft whose questions are all newly written (bank reuse off, so the
// child gets different ones). A workbook puts already-practised words last.
export function nextPlan(m: any) {
  let plan = { ...m.plan, topics: (m.plan?.topics || []).map((t: any) => ({ ...t, reuse: 0 })) }
  if (hasSections(plan)) {
    const used = usedWords(m.plan)
    const allUsed = (plan.words || []).every((w: any) => used.includes(w.en))
    plan = assignSectionWords({ ...plan, used_before: allUsed ? usedWords({ sections: m.plan.sections }) : used })
  }
  return plan
}

export async function insertDuplicate(db: any, m: any, status: string) {
  return db.from('materials').insert({
    family_id: m.family_id, child_id: m.child_id, kind: m.kind, title: `${m.title.replace(/( · עוד)+$/, '')} · עוד`,
    subject_slug: m.subject_slug, grade: m.grade, language: m.language, request_text: m.request_text,
    upload_ids: m.upload_ids, plan: nextPlan(m), time_minutes: m.time_minutes, parent_material_id: m.id, status,
  }).select('*').single()
}
