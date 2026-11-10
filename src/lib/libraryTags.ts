// Tags for a library workbook: subject, grade, type and its topics, so it can
// be found by any of them in the library search.
const SUBJ: Record<string, string> = { math: 'חשבון', hebrew: 'עברית', english: 'אנגלית' }
const GR = ['גן', 'כיתה א׳', 'כיתה ב׳', 'כיתה ג׳', 'כיתה ד׳', 'כיתה ה׳', 'כיתה ו׳', 'כיתה ז׳', 'כיתה ח׳', 'כיתה ט׳', 'כיתה י׳', 'כיתה י״א', 'כיתה י״ב']
const KIND: Record<string, string> = { practice: 'תרגול', exam: 'מבחן', explanation: 'דף הסבר' }
export function libraryTags(m: any): string[] {
  const t = [SUBJ[m.subject_slug], GR[m.grade], KIND[m.kind], ...((m.plan?.topics || []).map((x: any) => x.title_he || x.title_en)), ...((m.plan?.tags || []) as string[])]
  return [...new Set(t.filter(Boolean).map((x: string) => String(x).trim()).filter(Boolean))]
}
