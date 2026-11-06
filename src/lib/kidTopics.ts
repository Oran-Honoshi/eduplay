// Topics a child sees for their grade. K–6 topics are curated per grade.
// Grade 7+ topics live in the shared on-request bank (one topic across grades,
// grade is a tag), and only appear once they have at least one approved question,
// so a child never opens an empty topic.
export async function kidTopicsForGrade(supabase: any, grade: number) {
  const { data: topics } = await supabase
    .from('topics').select('*, subject:subjects(*)')
    .contains('grades', [grade])
    .order('sort_order')
  const list: any[] = topics || []
  const onReq = list.filter(t => t.origin === 'on_request').map(t => t.id)
  if (onReq.length === 0) return list
  const { data: withQs } = await supabase
    .from('questions').select('topic_id').in('topic_id', onReq).eq('approved', true)
  const ready = new Set((withQs || []).map((r: any) => r.topic_id))
  return list.filter(t => t.origin !== 'on_request' || ready.has(t.id))
}
