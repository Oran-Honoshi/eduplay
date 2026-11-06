import 'server-only'
import { renderMathVisualSVG } from '@/lib/mathVisual'
import { fractionsToHTML } from '@/lib/fractionText'
import { mathRunsToHTML, normalizeFractions } from '@/lib/bidiMath'
import { brandHeader, brandFooter, BRAND_CSS, type Brand } from '@/lib/printBrand'

// Branded, printable explanation pages (one page per topic) for a material.
// Used by the parent's print view and by public share / free-library links.
const esc = (v: any) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
// Latin/number runs inside Hebrew keep left-to-right order (−3, 3/4, A(2,3))
const txt = (v: any, he: boolean) => (he ? mathRunsToHTML(String(v ?? ''), x => fractionsToHTML(esc(x))) : fractionsToHTML(esc(normalizeFractions(String(v ?? '')))))

export function renderExplanationHTML(m: any, b: Brand): string {
  const he = m.language !== 'en_only'
  const L = (o: any, k: string) => (he ? (o?.[`${k}_he`] ?? o?.[`${k}_en`]) : (o?.[`${k}_en`] ?? o?.[`${k}_he`]))
  let n = 0
  const vis = (d: any) => {
    if (!d?.type) return ''
    try { return `<div class="vis">${renderMathVisualSVG(d, { width: 200, height: 200, color: '#0F766E', instanceId: `e${n++}` })}</div>` } catch { return '' }
  }

  const pages = (m.plan?.topics || []).map((t: any) => ({ t, p: m.explanation?.[t.key] })).filter((x: any) => x.p).map(({ t, p }: any, i: number) => `
  <section class="page">
    ${brandHeader(b, he, 'read')}
    <h1>${txt(L(p, 'title') || t.title_he || t.title_en, he)}</h1>
    <p class="intro">${txt(L(p, 'intro'), he)}</p>
    ${(L(p, 'key_points') || []).length ? `<div class="box key"><h2>${he ? 'מה חשוב לזכור' : 'Key points'}</h2><ul>${L(p, 'key_points').map((x: string) => `<li>${txt(x, he)}</li>`).join('')}</ul></div>` : ''}
    ${(p.examples || []).map((ex: any, j: number) => `
      <div class="box ex"><h2>${he ? `דוגמה ${j + 1}` : `Example ${j + 1}`}</h2>
        <p class="q">${txt(L(ex, 'question'), he)}</p>${vis(ex.visual_data)}
        <ol>${(L(ex, 'steps') || []).map((s: string) => `<li>${txt(s, he)}</li>`).join('')}</ol>
        <p class="ans">${he ? 'תשובה' : 'Answer'}: ${txt(L(ex, 'answer'), he)}</p></div>`).join('')}
    ${(L(p, 'mistakes') || []).length ? `<div class="box warn"><h2>${he ? 'טעויות נפוצות' : 'Common mistakes'}</h2><ul>${L(p, 'mistakes').map((x: string) => `<li>${txt(x, he)}</li>`).join('')}</ul></div>` : ''}
    ${(p.check || []).length ? `<div class="box chk"><h2>${he ? 'בדקו את עצמכם' : 'Check yourself'}</h2><ol>${p.check.map((c: any) => `<li>${txt(L(c, 'q'), he)}<div class="line"></div></li>`).join('')}</ol>
      <p class="answers">${he ? 'תשובות' : 'Answers'}: ${p.check.map((c: any, k: number) => `${k + 1}) ${txt(L(c, 'a'), he)}`).join(' · ')}</p></div>` : ''}
    ${brandFooter(b, he)}
  </section>`).join('')

  const html = `<!DOCTYPE html><html dir="${he ? 'rtl' : 'ltr'}" lang="${he ? 'he' : 'en'}"><head><meta charset="utf-8"/>
<title>EduPlay — ${esc(m.title)}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Assistant:wght@400;600;800&family=Nunito:wght@700;900&display=swap');
*{box-sizing:border-box} body{font-family:'Assistant','Nunito',sans-serif;color:#1f2a28;max-width:820px;margin:0 auto;padding:24px 32px;font-size:15px;line-height:1.7}
${BRAND_CSS}
.no-print{display:flex;gap:8px;justify-content:flex-end;margin-bottom:12px}
.no-print button{padding:9px 20px;border-radius:999px;border:none;font-weight:800;cursor:pointer;font-family:inherit}
.p{background:#0F766E;color:#fff}.c{background:#F1F5F9;color:#334155}
h1{font-size:26px;color:#0F3D3A;margin:6px 0 4px} h2{font-size:15px;margin:0 0 6px;color:#0F766E}
.intro{font-size:16px;margin:0 0 10px}
.box{border-radius:12px;padding:12px 16px;margin:10px 0;page-break-inside:avoid}
.key{background:#E4F3F1}.ex{border:1.5px solid #D6E7E4}.warn{background:#FFF7ED}.warn h2{color:#B45309}.chk{border:1.5px dashed #0F766E}
.q{font-weight:800;margin:0 0 4px}.ans{font-weight:800;color:#15803D;margin:4px 0 0}
.vis{display:flex;justify-content:center;margin:6px 0}.vis svg{max-width:200px;height:auto}
.line{border-bottom:1.5px solid #A7B8B5;height:26px;margin-bottom:6px}
.answers{font-size:11px;color:#64748B;margin-top:8px;transform:rotate(180deg);text-align:center}
.page{page-break-after:always}.page:last-child{page-break-after:auto}
@media print{.no-print{display:none}body{padding:10px}}
</style></head><body>
<div class="no-print"><button class="p" onclick="window.print()">🖨️ ${he ? 'הדפסה / שמירה כ-PDF' : 'Print / Save as PDF'}</button><button class="c" onclick="window.close()">✕</button></div>
${pages || `<p>${he ? 'אין עדיין דפים.' : 'No pages yet.'}</p>`}
</body></html>`
  return html
}
