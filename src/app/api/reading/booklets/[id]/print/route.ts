import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { createServiceRoleClient } from '@/lib/supabase'
import { brandBits, brandFooter, brandHeader, BRAND_CSS } from '@/lib/printBrand'
import { pictureSVG, dotsSVG } from '@/lib/readingPictures'
import type { BookletPage } from '@/lib/readingBooklet'

const esc = (t: any) => String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// a stable shuffle so the matching column is mixed but the same on every print
function mix<T>(a: T[], seed: number): T[] {
  const r = [...a]; let x = seed || 7
  for (let i = r.length - 1; i > 0; i--) { x = (x * 9301 + 49297) % 233280; const j = Math.floor((x / 233280) * (i + 1)); [r[i], r[j]] = [r[j], r[i]] }
  if (r.length > 1 && r.every((v, i) => v === a[i])) r.push(r.shift()!)
  return r
}

function pageHTML(p: BookletPage, n: number): string {
  const head = `<div class="ph"><span class="pn">${n}</span><div><div class="pt">${esc(p.title)}</div>${p.instructions ? `<div class="pi">${esc(p.instructions)}</div>` : ''}</div></div>`
  switch (p.type) {
    case 'syllables':
      return head + `<div class="syl">${p.rows.map(r => `<div class="row">${r.map(x => `<span>${esc(x)}</span>`).join('')}</div>`).join('')}</div>`
    case 'words':
      return head + `<div class="words">${p.words.map(w => `<div class="w">${w.picture ? pictureSVG(w.picture, 74) : '<div style="height:74px"></div>'}<div class="he">${esc(w.he)}</div></div>`).join('')}</div>`
    case 'match': {
      const pics = mix(p.pairs.map(x => x.picture), p.pairs.length * 31 + n)
      return head + `<div class="match">${p.pairs.map((w, i) => `<div class="mrow"><div class="mw">${esc(w.he)} <span class="dot"></span></div><div class="gap"></div><div class="mp"><span class="dot"></span> ${pictureSVG(pics[i], 78)}</div></div>`).join('')}</div>`
    }
    case 'circle':
      return head + `<div class="circle">${p.items.map(it => `<div class="crow">${pictureSVG(it.picture, 80)}<div class="opts">${it.options.map(o => `<span>${esc(o)}</span>`).join('')}</div></div>`).join('')}</div>`
    case 'sentences':
      return head + `<ol class="sent">${p.sentences.map(x => `<li>${esc(x)}</li>`).join('')}</ol>`
    case 'story':
      return head + `<div class="story"><h2>${esc(p.story_title)}</h2>${p.picture ? `<div class="spic">${pictureSVG(p.picture, 120)}</div>` : ''}${p.paragraphs.map(x => `<p>${esc(x)}</p>`).join('')}</div>`
    case 'questions':
      return head + `<div class="qs">${p.items.map((it, i) => `<div class="q"><div class="qq">${i + 1}. ${esc(it.q)}</div><div class="qo">${it.options.map(o => `<span><i></i>${esc(o)}</span>`).join('')}</div></div>`).join('')}</div>`
    case 'dots':
      return head + `<div class="cap">${esc(p.caption)}</div><div class="center">${dotsSVG(p.shape, 430)}</div>`
    case 'draw':
      return head + `<div class="cap">${esc(p.sentence)}</div><div class="frame"></div>`
    case 'color':
      return head + `<div class="cap">${esc(p.sentence)}</div><div class="center">${pictureSVG(p.picture, 330, 'outline')}</div>`
  }
}

function answersHTML(pages: BookletPage[]): string {
  const lines: string[] = []
  pages.forEach((p, i) => {
    if (p.type === 'circle') lines.push(`<b>עמוד ${i + 1}:</b> ${p.items.map(it => esc(it.answer)).join(' · ')}`)
    if (p.type === 'questions') lines.push(`<b>עמוד ${i + 1}:</b> ${p.items.map((it, k) => `${k + 1}. ${esc(it.answer)}`).join(' · ')}`)
  })
  return lines.length ? `<div class="answers"><div class="pt">להורים: תשובות</div>${lines.map(l => `<div>${l}</div>`).join('')}</div>` : ''
}

// GET /api/reading/booklets/[id]/print — the printable booklet. Approved
// booklets: any signed-in parent (free samples: anyone). Drafts: admin or the
// family that asked for it. ?noprint=1 skips the print dialog (preview).
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const db = createServiceRoleClient()
  const { data: bk } = await db.from('reading_booklets').select('*').eq('id', params.id).maybeSingle()
  if (!bk || bk.status === 'rejected') return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const { parent } = await getSession()
  let ok = bk.status === 'approved' && (bk.is_free || !!parent)
  if (!ok && parent) {
    const { data: fam } = await db.from('families').select('is_admin').eq('id', parent.familyId).maybeSingle()
    ok = !!fam?.is_admin || bk.created_by_family === parent.familyId
  }
  if (!ok) return NextResponse.json({ error: parent ? 'Forbidden' : 'Unauthorized' }, { status: parent ? 403 : 401 })
  const noPrint = req.nextUrl.searchParams.get('noprint') === '1'
  if (bk.is_free && !parent && !noPrint) await db.from('reading_booklets').update({ download_count: (bk.download_count || 0) + 1 }).eq('id', bk.id)

  const { data: level } = await db.from('reading_levels').select('label_he').eq('id', bk.level_id).maybeSingle()
  const brand = await brandBits(new URL(req.url).origin)
  const pages: BookletPage[] = bk.pages || []
  const html = `<!DOCTYPE html><html dir="rtl" lang="he"><head><meta charset="utf-8"/><title>${esc(bk.title_he)} — EduPlay</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Hebrew:wght@400;600;700;800&family=Nunito:wght@700;900&display=swap');
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Noto Sans Hebrew', sans-serif; color: #1E2D4E; background: #fff; max-width: 820px; margin: 0 auto; padding: 24px 32px; }
${BRAND_CSS}
.no-print { display:flex; gap:8px; justify-content:flex-start; margin-bottom: 12px; }
.no-print button { padding: 9px 22px; border: 0; border-radius: 50px; font-weight: 800; cursor: pointer; font-family: inherit; }
.page { min-height: 980px; page-break-after: always; padding-top: 6px; }
.page:last-of-type { page-break-after: auto; }
.cover { text-align: center; display:flex; flex-direction:column; align-items:center; justify-content:center; gap: 22px; }
.cover h1 { font-size: 54px; font-weight: 800; line-height: 1.5; }
.cover .lvl { font-size: 20px; font-weight: 800; background: #FFF4D6; color: #8a5a00; padding: 6px 18px; border-radius: 99px; }
.cover .theme { font-size: 18px; color: #4A5568; }
.cover .pip { width: 190px; height: 190px; object-fit: contain; }
.cover .name { font-size: 22px; margin-top: 20px; }
.cover .name span { display:inline-block; width: 260px; border-bottom: 2px solid #9AA5B8; }
.ph { display:flex; gap: 12px; align-items:center; border-bottom: 3px solid #2EC4B6; padding-bottom: 10px; margin-bottom: 22px; }
.pn { width: 40px; height: 40px; border-radius: 50%; background: #2EC4B6; color: #fff; font: 900 18px Nunito, sans-serif; display:flex; align-items:center; justify-content:center; flex-shrink: 0; }
.pt { font-size: 22px; font-weight: 800; }
.pi { font-size: 15px; color: #4A5568; margin-top: 2px; }
.syl .row { display:flex; flex-wrap:wrap; gap: 14px; justify-content:flex-start; margin-bottom: 18px; }
.syl span { font-size: 46px; font-weight: 700; min-width: 86px; text-align:center; padding: 6px 12px; border: 2.5px solid #CFE3F5; border-radius: 18px; }
.words { display:grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
.w { border: 2px solid #E3EBE9; border-radius: 18px; padding: 12px; text-align: center; }
.w .he { font-size: 40px; font-weight: 700; margin-top: 4px; }
.match .mrow { display:flex; align-items:center; margin-bottom: 18px; }
.mw { font-size: 40px; font-weight: 700; min-width: 210px; display:flex; align-items:center; gap: 12px; }
.mp { display:flex; align-items:center; gap: 12px; }
.gap { flex: 1; }
.dot { width: 14px; height: 14px; border-radius: 50%; background: #1E2D4E; display:inline-block; }
.crow { display:flex; align-items:center; gap: 26px; margin-bottom: 22px; border-bottom: 1.5px dashed #E3EBE9; padding-bottom: 14px; }
.opts { display:flex; gap: 30px; }
.opts span { font-size: 38px; font-weight: 700; }
.sent { list-style: none; counter-reset: s; }
.sent li { font-size: 36px; font-weight: 600; line-height: 1.9; border-bottom: 1.5px solid #EEF1F6; counter-increment: s; }
.sent li::before { content: counter(s) "."; color: #2EC4B6; font: 900 22px Nunito, sans-serif; margin-inline-end: 12px; }
.story h2 { font-size: 40px; text-align: center; margin-bottom: 14px; }
.story p { font-size: 32px; line-height: 2; margin-bottom: 10px; }
.spic { text-align: center; margin-bottom: 8px; }
.q { margin-bottom: 26px; }
.qq { font-size: 32px; font-weight: 700; margin-bottom: 10px; }
.qo { display:flex; flex-wrap: wrap; gap: 30px; padding-inline-start: 30px; }
.qo span { font-size: 30px; display:flex; align-items:center; gap: 10px; }
.qo i { width: 26px; height: 26px; border: 2.5px solid #1E2D4E; border-radius: 50%; display:inline-block; }
.cap { font-size: 36px; font-weight: 700; text-align: center; margin: 6px 0 18px; line-height: 1.7; }
.center { display:flex; justify-content:center; }
.frame { height: 640px; border: 3px solid #CBD5E0; border-radius: 24px; }
.answers { font-size: 14px; color: #4A5568; line-height: 1.9; border: 1.5px dashed #CBD5E0; border-radius: 14px; padding: 12px 16px; margin-top: 24px; }
.answers .pt { font-size: 15px; }
@media print { .no-print { display:none } body { padding: 10px 14px; } .page { min-height: 0; } }
</style></head><body>
<div class="no-print"><button style="background:#2EC4B6;color:#fff" onclick="window.print()">🖨️ הדפסה / שמירה כ-PDF</button><button style="background:#F3F4F6" onclick="window.close()">סגירה</button></div>
<section class="page cover">
  ${brandHeader(brand, true, 'read')}
  <div class="lvl">חוברת קריאה · ${esc(level?.label_he || '')}</div>
  <h1>${esc(bk.title_he)}</h1>
  ${bk.theme_he ? `<div class="theme">${esc(bk.theme_he)}</div>` : ''}
  <img class="pip" src="${brand.pip('read')}" alt="פיפ הינשוף"/>
  <div class="name">שם: <span></span></div>
</section>
${pages.map((p, i) => `<section class="page">${pageHTML(p, i + 1)}${i === pages.length - 1 ? answersHTML(pages) + brandFooter(brand, true) : ''}</section>`).join('')}
${noPrint ? '' : '<script>setTimeout(() => window.print(), 900)</script>'}
</body></html>`
  return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}
