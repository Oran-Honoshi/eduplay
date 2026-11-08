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

  const { data: booklets } = await db.from('reading_booklets').select('id, title_he, theme_he, level_number, pages')
    .eq('status', 'approved').eq('is_free', true).order('level_number')
  const { data: levelRows } = await db.from('reading_levels').select('level_number, label_he').eq('track', 'niqqud')
  const levelHe = (n: number) => levelRows?.find(l => l.level_number === n)?.label_he || ''

  const chip = (href: string, label: string, on: boolean) => (
    <a key={href} href={href} className={`text-sm font-bold px-3.5 min-h-[40px] inline-flex items-center rounded-full border ${on ? 'bg-[#2F5BE3] text-white border-[#2F5BE3]' : 'bg-white text-[#33415F] border-[#E8E2D6]'}`}>{label}</a>
  )
  const qs = (o: any) => { const p = new URLSearchParams({ ...(searchParams.subject ? { subject: searchParams.subject } : {}), ...(searchParams.grade ? { grade: searchParams.grade } : {}), ...o }); for (const [k, v] of [...p]) if (!v) p.delete(k); const s = p.toString(); return `/free${s ? `?${s}` : ''}` }

  return (
    <main dir="rtl" lang="he" className="ep-parent min-h-screen bg-[#FAF7F2]" style={{ fontFamily: "'Assistant','Nunito',system-ui,sans-serif" }}>
      <header className="bg-white border-b border-[#E8E2D6]">
        <div className="max-w-[1000px] mx-auto px-4 h-14 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 font-black text-[#16213E] text-lg no-underline"><img src="/icons/icon-192.png" alt="" width={32} height={32} className="rounded-lg" /> EduPlay</a>
          <a href="/?utm_source=free" className="text-sm font-semibold text-[#2F5BE3]">ליצור דף מותאם ←</a>
        </div>
      </header>
      <div className="max-w-[1000px] mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <img src="/pip/plain/celebrate.webp" alt="" width={88} height={88} />
          <div>
            <h1 className="text-3xl font-black text-[#16213E] m-0">דפים חינם להורדה</h1>
            <p className="text-[#4A5672] mt-1 mb-0">תרגול, מבחנים לתרגול ודפי הסבר שהורים יצרו ובדקו. בלי הרשמה — מורידים ומדפיסים.</p>
          </div>
        </div>
        {(booklets || []).length > 0 && !searchParams.subject && (
          <section className="mb-8">
            <h2 className="text-xl font-black text-[#16213E] mb-1">חוברות קריאה לגן ולכיתה א׳</h2>
            <p className="text-sm text-[#4A5672] mt-0 mb-3">חוברת לכל סימן ניקוד — הברות, מילים, משפטים וסיפור קצר, עם חיבור נקודות וציור.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {(booklets || []).map(b => (
                <a key={b.id} href={`/api/reading/booklets/${b.id}/print`} target="_blank" rel="noopener noreferrer" className="bg-white rounded-2xl border border-[#E8E2D6] p-4 hover:border-[#2F5BE3] hover:shadow-md transition no-underline">
                  <div className="text-xs font-bold text-[#8a5a00]">חוברת קריאה · {levelHe(b.level_number)}</div>
                  <div className="font-black text-[#16213E] mt-1 leading-snug text-lg">{b.title_he}</div>
                  <div className="text-xs text-[#4A5672] mt-2">{b.theme_he ? `${b.theme_he} · ` : ''}{(b.pages || []).length} עמודים · להדפסה חינם</div>
                </a>
              ))}
            </div>
          </section>
        )}
        <div className="flex flex-wrap gap-2 mb-3">
          {chip(qs({ subject: '' }), 'כל המקצועות', !searchParams.subject)}
          {Object.entries(SUBJECT_HE).map(([s, l]) => chip(qs({ subject: s }), l, searchParams.subject === s))}
        </div>
        <div className="flex flex-wrap gap-2 mb-6">
          {chip(qs({ grade: '' }), 'כל הכיתות', !searchParams.grade)}
          {Array.from({ length: 13 }, (_, i) => chip(qs({ grade: String(i) }), gradeHe(i), searchParams.grade === String(i)))}
        </div>
        {sorted.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E8E2D6] p-8 text-center text-[#4A5672]">עוד אין כאן דפים בבחירה הזו. בקרוב יהיו!</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {sorted.map(m => {
              const a = agg[m.id]
              const n = m.kind === 'explanation' ? Object.keys(m.explanation || {}).length : (m.question_ids?.length || 0)
              return (
                <a key={m.id} href={`/s/${m.share_slug}`} className="bg-white rounded-2xl border border-[#E8E2D6] p-4 hover:border-[#2F5BE3] hover:shadow-md transition no-underline">
                  <div className="text-xs font-bold text-[#2F5BE3]">{KIND_HE[m.kind]} · {gradeHe(m.grade)}</div>
                  <div className="font-black text-[#16213E] mt-1 leading-snug">{m.title}</div>
                  <div className="text-xs text-[#4A5672] mt-2">{SUBJECT_HE[m.subject_slug]} · {m.kind === 'explanation' ? `${n} דפים` : `${n} שאלות`}{a ? <> · <span dir="ltr">★ {(a.s / a.n).toFixed(1)}</span></> : ''}</div>
                </a>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
