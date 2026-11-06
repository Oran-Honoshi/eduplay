import { createServiceRoleClient } from '@/lib/supabase'
import { KIND_HE, SUBJECT_HE, gradeHe } from '@/lib/publicLabels'

export const dynamic = 'force-dynamic'
export const metadata = {
  title: 'דפי עבודה חינם · EduPlay',
  description: 'דפי תרגול, מבחנים לתרגול ודפי הסבר בחשבון, עברית ואנגלית — חינם להורדה ולהדפסה, בלי הרשמה.',
}

// The free sample library: approved materials anyone can download without an
// account. Best rated first (Bayesian average, so 1 rating of 5★ doesn't beat
// 30 ratings of 4.8★), then most downloaded.
export default async function FreeLibraryPage({ searchParams }: { searchParams: { subject?: string; grade?: string } }) {
  const db = createServiceRoleClient()
  let q = db.from('materials').select('id, kind, title, subject_slug, grade, question_ids, explanation, time_minutes, share_slug, download_count, created_at')
    .eq('library_status', 'listed').eq('status', 'ready').not('share_slug', 'is', null)
  if (searchParams.subject && SUBJECT_HE[searchParams.subject]) q = q.eq('subject_slug', searchParams.subject)
  const g = Number(searchParams.grade)
  if (searchParams.grade && Number.isInteger(g)) q = q.eq('grade', g)
  const { data: items } = await q.limit(200)
  const ids = (items || []).map(i => i.id)
  const { data: rs } = ids.length ? await db.from('material_ratings').select('material_id, stars').in('material_id', ids) : { data: [] as any[] }
  const agg: Record<string, { s: number; n: number }> = {}
  for (const r of rs || []) { agg[r.material_id] ||= { s: 0, n: 0 }; agg[r.material_id].s += r.stars; agg[r.material_id].n++ }
  const PRIOR_N = 3, PRIOR = 4
  const score = (id: string) => { const a = agg[id]; return ((a?.s || 0) + PRIOR * PRIOR_N) / ((a?.n || 0) + PRIOR_N) }
  const sorted = [...(items || [])].sort((a, b) => score(b.id) - score(a.id) || (b.download_count || 0) - (a.download_count || 0))

  const chip = (href: string, label: string, on: boolean) => (
    <a key={href} href={href} className={`text-sm font-bold px-3.5 min-h-[40px] inline-flex items-center rounded-full border ${on ? 'bg-[#0F766E] text-white border-[#0F766E]' : 'bg-white text-[#3d4f4b] border-[#e3ebe9]'}`}>{label}</a>
  )
  const qs = (o: any) => { const p = new URLSearchParams({ ...(searchParams.subject ? { subject: searchParams.subject } : {}), ...(searchParams.grade ? { grade: searchParams.grade } : {}), ...o }); for (const [k, v] of [...p]) if (!v) p.delete(k); const s = p.toString(); return `/free${s ? `?${s}` : ''}` }

  return (
    <main dir="rtl" lang="he" className="min-h-screen bg-[#F7F5F0]" style={{ fontFamily: "'Assistant','Nunito',system-ui,sans-serif" }}>
      <header className="bg-white border-b border-[#e3ebe9]">
        <div className="max-w-[1000px] mx-auto px-4 h-14 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 font-black text-[#0F3D3A] text-lg no-underline"><img src="/icons/icon-192.png" alt="" width={32} height={32} className="rounded-lg" /> EduPlay</a>
          <a href="/?utm_source=free" className="text-sm font-semibold text-[#0F766E]">ליצור דף מותאם ←</a>
        </div>
      </header>
      <div className="max-w-[1000px] mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <img src="/pip/plain/celebrate.webp" alt="" width={88} height={88} />
          <div>
            <h1 className="text-3xl font-black text-[#1f2a28] m-0">דפים חינם להורדה</h1>
            <p className="text-[#5b6b68] mt-1 mb-0">תרגול, מבחנים לתרגול ודפי הסבר שהורים יצרו ובדקו. בלי הרשמה — מורידים ומדפיסים.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          {chip(qs({ subject: '' }), 'כל המקצועות', !searchParams.subject)}
          {Object.entries(SUBJECT_HE).map(([s, l]) => chip(qs({ subject: s }), l, searchParams.subject === s))}
        </div>
        <div className="flex flex-wrap gap-2 mb-6">
          {chip(qs({ grade: '' }), 'כל הכיתות', !searchParams.grade)}
          {Array.from({ length: 13 }, (_, i) => chip(qs({ grade: String(i) }), gradeHe(i), searchParams.grade === String(i)))}
        </div>
        {sorted.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#e3ebe9] p-8 text-center text-[#5b6b68]">עוד אין כאן דפים בבחירה הזו. בקרוב יהיו!</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {sorted.map(m => {
              const a = agg[m.id]
              const n = m.kind === 'explanation' ? Object.keys(m.explanation || {}).length : (m.question_ids?.length || 0)
              return (
                <a key={m.id} href={`/s/${m.share_slug}`} className="bg-white rounded-2xl border border-[#e3ebe9] p-4 hover:border-[#0F766E] hover:shadow-md transition no-underline">
                  <div className="text-xs font-bold text-[#0F766E]">{KIND_HE[m.kind]} · {gradeHe(m.grade)}</div>
                  <div className="font-black text-[#1f2a28] mt-1 leading-snug">{m.title}</div>
                  <div className="text-xs text-[#5b6b68] mt-2">{SUBJECT_HE[m.subject_slug]} · {m.kind === 'explanation' ? `${n} דפים` : `${n} שאלות`}{a ? <> · <span dir="ltr">★ {(a.s / a.n).toFixed(1)}</span></> : ''}</div>
                </a>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
