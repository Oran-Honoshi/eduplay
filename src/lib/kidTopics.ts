// Topics a child sees for their grade. K–6 topics are curated per grade.
// Grade 7+ topics live in the shared on-request bank (one topic across grades,
// grade is a tag), and only appear once they have at least one approved question,
// so a child never opens an empty topic. Until a 7th+ grader has at least
// MIN_READY such topics, the 6th-grade curriculum is shown too, as review,
// so the app is never empty.
const MIN_READY = 3

export async function kidTopicsForGrade(supabase: any, grade: number) {
  const { data: topics } = await supabase
    .from('topics').select('*, subject:subjects(*)')
    .contains('grades', [grade])
    .order('sort_order')
  const list: any[] = topics || []
  const onReq = list.filter(t => t.origin === 'on_request').map(t => t.id)
  let ready = list
  if (onReq.length) {
    const { data: withQs } = await supabase
      .from('questions').select('topic_id').in('topic_id', onReq).eq('approved', true)
    const ok = new Set((withQs || []).map((r: any) => r.topic_id))
    ready = list.filter(t => t.origin !== 'on_request' || ok.has(t.id))
  }
  if (grade >= 7 && ready.length < MIN_READY) {
    const { data: review } = await supabase
      .from('topics').select('*, subject:subjects(*)')
      .eq('grade', 6).eq('origin', 'curated').order('sort_order')
    ready = [...ready, ...(review || []).map((t: any) => ({ ...t, is_review: true }))]
  }
  return ready
}
