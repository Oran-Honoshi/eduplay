import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase'
import { getSession } from '@/lib/session'
import { requireAdmin } from '@/lib/admin'
import { lineHtml, pagePictures, pictureBig, type StoryBooklet } from '@/lib/storyBooklet'

export const dynamic = 'force-dynamic'
const esc = (s: string) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' } as any)[c])

// GET /api/stories/[id]/print[?brief=1][&noprint=1] — the booklet on A5 pages:
// a cover, then one page per reading page (illustration above, big pointed
// text below). brief=1 adds the illustration brief under each page (for the
// illustrator). Pages without an illustration get a "draw here" frame.
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { parent, child } = await getSession()
  if (!parent && !child) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = createServiceRoleClient()
  const { data } = await db.from('story_booklets').select('*').eq('id', params.id).maybeSingle()
  const b = data as StoryBooklet | null
  if (!b) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (b.status !== 'approved' && !(await requireAdmin()).ok) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const brief = req.nextUrl.searchParams.get('brief') === '1'
  const noPrint = req.nextUrl.searchParams.get('noprint') === '1'

  const art = (url: string | null | undefined, pics: string[], cover = false) => url
    ? `<img class="art" src="${esc(url)}" alt="">`
    : `<div class="art empty">${pics.length ? `<div class="pics">${pics.map(k => pictureBig(k, cover ? 150 : 120)).join('')}</div>` : ''}<span>${cover ? 'ציירו כאן את הכריכה' : 'ציירו כאן את מה שקראתם'}</span></div>`

  const cover = `
<section class="page cover">
  <div class="series">${esc(b.series)} · ספרון ${b.number}</div>
  <h1>${lineHtml(b.title_he)}</h1>
  ${art(b.cover?.image_url, [], true)}
  <div class="reader">שֵׁם הַקּוֹרֵא / הַקּוֹרֵאת: <span></span></div>
  ${brief && b.cover?.scene ? `<div class="brief"><b>איור הכריכה:</b> ${esc(b.cover.scene)}</div>` : ''}
</section>`
  const pages = b.pages.map((p, i) => `
<section class="page">
  ${art(p.image_url, pagePictures(p))}
  <div class="text">${p.lines.map(l => `<p>${lineHtml(l)}</p>`).join('')}</div>
  ${brief && p.scene ? `<div class="brief"><b>איור עמוד ${i + 1}:</b> ${esc(p.scene)}</div>` : ''}
  <div class="num">${i + 1}</div>
</section>`).join('')
  const end = `
<section class="page end">
  <div class="star">★</div>
  <h2>קָרָאתִי סֵפֶר שָׁלֵם!</h2>
  <div class="reader">תַּאֲרִיךְ: <span></span></div>
</section>`

  const html = `<!DOCTYPE html><html lang="he" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(b.title_he.replace(/[֑-ׇ]/g, ''))} — EduPlay</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Hebrew:wght@400;600;700;800&display=swap');
@page { size: A5 portrait; margin: 0; }
* { box-sizing: border-box; }
body { margin: 0; font-family: 'Noto Sans Hebrew', sans-serif; color: #16213E; background: #EEE9DF; }
.page { width: 148mm; height: 210mm; margin: 10mm auto; background: #fff; padding: 12mm 12mm 10mm; display: flex; flex-direction: column; gap: 7mm; position: relative; overflow: hidden; page-break-after: always; break-after: page; box-shadow: 0 2px 12px rgba(0,0,0,.08); }
.art { width: 100%; height: 100mm; object-fit: cover; border-radius: 6mm; flex-shrink: 0; }
.art.empty { border: 2px dashed #D9D2C4; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4mm; color: #A39A8A; font-size: 11pt; }
.art.empty .pics { display: flex; gap: 6mm; }
.text { flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 2.5mm; }
.text p { margin: 0; font-size: 25pt; font-weight: 600; line-height: 1.75; letter-spacing: .02em; }
.text svg { width: 1.5em !important; height: 1.5em !important; vertical-align: -0.42em !important; }
.num { position: absolute; bottom: 6mm; left: 0; right: 0; text-align: center; font-size: 10pt; color: #A39A8A; }
.cover { background: #FFF7E6; align-items: center; text-align: center; }
.cover .series { font-size: 11pt; color: #7A6A4F; font-weight: 700; }
.cover h1 { margin: 0; font-size: 34pt; line-height: 1.5; color: #C2337F; }
.cover h1 svg { width: 1.3em !important; height: 1.3em !important; }
.cover .art { height: 110mm; }
.reader { font-size: 14pt; font-weight: 600; margin-top: auto; }
.reader span { display: inline-block; width: 52mm; border-bottom: 1.5px solid #16213E; }
.end { align-items: center; justify-content: center; text-align: center; background: #F2FBF7; }
.end .star { font-size: 70pt; color: #FFC940; line-height: 1; }
.end h2 { font-size: 30pt; margin: 0; }
.end .reader { margin-top: 10mm; }
.brief { font-size: 9.5pt; color: #6B5E46; background: #FFF4D6; border-radius: 3mm; padding: 2mm 3mm; }
.no-print { position: sticky; top: 0; z-index: 5; display: flex; gap: 8px; justify-content: center; padding: 10px; background: #EEE9DF; }
.no-print button { padding: 9px 22px; border: 0; border-radius: 50px; font-weight: 800; cursor: pointer; font-family: inherit; font-size: 15px; }
@media print { body { background: #fff; } .page { margin: 0; box-shadow: none; } .no-print { display: none; } }
</style></head><body>
<div class="no-print"><button style="background:#2F5BE3;color:#fff" onclick="window.print()">הדפסה / שמירה כ-PDF</button><button style="background:#fff" onclick="window.close()">סגירה</button></div>
${cover}${pages}${end}
${noPrint ? '' : '<script>setTimeout(() => window.print(), 900)</script>'}
</body></html>`
  return new NextResponse(html, { headers: { 'content-type': 'text/html; charset=utf-8' } })
}
