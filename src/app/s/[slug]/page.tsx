import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { loadPublicMaterial } from '@/lib/publicMaterial'
import { PublicActions } from '@/components/public/PublicBits'
import { KIND_HE, SUBJECT_HE, gradeHe } from '@/lib/publicLabels'

export const dynamic = 'force-dynamic'

function origin() {
  const h = headers()
  return (process.env.NEXT_PUBLIC_SITE_URL || `https://${h.get('host')}`).replace(/\/$/, '')
}

// Link preview for WhatsApp etc.: title, what it is, Pip.
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const p = await loadPublicMaterial(params.slug)
  if (!p) return { title: 'EduPlay' }
  const o = origin()
  const desc = `${KIND_HE[p.m.kind]} · ${SUBJECT_HE[p.m.subject_slug] || ''} · ${gradeHe(p.m.grade)} — חינם להורדה ולהדפסה מ-EduPlay`
  return {
    title: `${p.m.title} · EduPlay`, description: desc,
    openGraph: { title: p.m.title, description: desc, images: [`${o}/icons/icon-512.png`], url: `${o}/s/${params.slug}`, siteName: 'EduPlay', locale: 'he_IL' },
  }
}

export default async function SharedMaterialPage({ params }: { params: { slug: string } }) {
  const p = await loadPublicMaterial(params.slug)
  if (!p) notFound()
  const { m, questions, rating } = p
  const o = origin()
  const topics = (m.plan?.topics || []).map((t: any) => t.title_he || t.title_en).filter(Boolean)
  const count = m.kind === 'explanation' ? Object.keys(m.explanation || {}).length : questions.length
  return (
    <main dir="rtl" lang="he" className="min-h-screen bg-[#F7F5F0]" style={{ fontFamily: "'Assistant','Nunito',system-ui,sans-serif" }}>
      <header className="bg-white border-b border-[#e3ebe9]">
        <div className="max-w-[760px] mx-auto px-4 h-14 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 font-black text-[#0F3D3A] text-lg no-underline"><img src="/icons/icon-192.png" alt="" width={32} height={32} className="rounded-lg" /> EduPlay</a>
          <a href="/free" className="text-sm font-semibold text-[#0F766E]">עוד דפים בחינם ←</a>
        </div>
      </header>
      <div className="max-w-[760px] mx-auto px-4 py-8">
        <div className="bg-white rounded-3xl border border-[#e3ebe9] p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start">
          <img src="/pip/plain/read.webp" alt="פיפ הינשוף" width={140} height={140} className="self-center" />
          <div className="flex-1 flex flex-col gap-4">
            <div>
              <div className="text-sm font-bold text-[#0F766E]">{KIND_HE[m.kind]} · {SUBJECT_HE[m.subject_slug]} · {gradeHe(m.grade)}</div>
              <h1 className="text-2xl md:text-3xl font-black text-[#1f2a28] mt-1 mb-2">{m.title}</h1>
              <div className="text-sm text-[#5b6b68]">
                {m.kind === 'explanation' ? `${count} דפי הסבר` : `${count} שאלות`}{m.kind === 'exam' && m.time_minutes ? ` · ${m.time_minutes} דקות` : ''}
                {rating.n > 0 && <> · <span dir="ltr">★ {rating.avg!.toFixed(1)}</span> ({rating.n})</>}
                {m.download_count > 0 && <> · הורד {m.download_count} פעמים</>}
              </div>
              {topics.length > 0 && <div className="flex flex-wrap gap-1.5 mt-3">{topics.map((t: string, i: number) => <span key={i} className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#E4F3F1] text-[#0F766E]">{t}</span>)}</div>}
            </div>
            <PublicActions slug={params.slug} title={m.title} url={`${o}/s/${params.slug}`} kind={KIND_HE[m.kind]} />
          </div>
        </div>
        <div className="mt-6 rounded-3xl bg-gradient-to-l from-[#E4F3F1] to-[#F1ECFA] p-6 flex flex-col md:flex-row items-center gap-4">
          <img src="/pip/plain/wave.webp" alt="" width={84} height={84} />
          <div className="flex-1 text-center md:text-start">
            <div className="font-black text-lg text-[#0F3D3A]">רוצים דף כזה מותאם בדיוק לילד/ה שלכם?</div>
            <div className="text-sm text-[#3d4f4b]">מעלים צילום מהחוברת או רשימת חומר למבחן, ו-EduPlay מכין תרגול, מבחן או דפי הסבר — להדפסה ולאפליקציה.</div>
          </div>
          <a href="/?utm_source=share" className="inline-flex items-center min-h-[48px] px-6 rounded-xl bg-[#0F766E] text-white font-bold">לנסות את EduPlay</a>
        </div>
      </div>
    </main>
  )
}
