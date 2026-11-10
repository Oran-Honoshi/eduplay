import { createServiceRoleClient } from '@/lib/supabase'
import LibrarySearch from '@/components/LibrarySearch'

export const dynamic = 'force-dynamic'
export const metadata = {
  title: 'דפי עבודה חינם · EduPlay',
  description: 'דפי תרגול, מבחנים לתרגול ודפי הסבר בחשבון, עברית ואנגלית — חינם להורדה ולהדפסה, בלי הרשמה.',
}

// The free sample library: approved materials anyone can download without an
// account. Best rated first (Bayesian average, so 1 rating of 5★ doesn't beat
// 30 ratings of 4.8★), then most downloaded.
export default async function FreeLibraryPage({ searchParams }: { searchParams: { subject?: string } }) {
  const db = createServiceRoleClient()
  const { data: booklets } = await db.from('reading_booklets').select('id, title_he, theme_he, level_number, pages')
    .eq('status', 'approved').eq('is_free', true).order('level_number')
  const { data: levelRows } = await db.from('reading_levels').select('level_number, label_he').eq('track', 'niqqud')
  const levelHe = (n: number) => levelRows?.find(l => l.level_number === n)?.label_he || ''

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
            <p className="text-[#4A5672] mt-1 mb-0">חוברות תרגול לכל נושא מגן ועד ו׳, ודפים שהורים יצרו ובדקו. בלי הרשמה — מחפשים, מורידים ומדפיסים.</p>
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
        <h2 className="text-xl font-black text-[#16213E] mb-3">חוברות תרגול מוכנות</h2>
        <LibrarySearch mode="public" />
      </div>
    </main>
  )
}
