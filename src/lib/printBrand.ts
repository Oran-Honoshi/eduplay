import 'server-only'
import QRCode from 'qrcode'

// Shared branding for every printable (worksheets, exams, explanation pages):
// EduPlay logo + Pip in the header, and a footer with the website link and a
// QR code, so a page passed around a class tells people where it came from.

export function siteUrl(origin: string) {
  return (process.env.NEXT_PUBLIC_SITE_URL || origin).replace(/\/$/, '')
}

export async function brandBits(origin: string) {
  const site = siteUrl(origin)
  const link = `${site}/?utm_source=printable`
  const qrSvg = await QRCode.toString(link, { type: 'svg', margin: 0, width: 84, color: { dark: '#16213E', light: '#FFFFFF' } })
  return {
    site, link, qrSvg,
    host: site.replace(/^https?:\/\//, ''),
    icon: `${site}/icons/icon-192.png`,
    pip: (pose: 'wave' | 'thumbs' | 'celebrate' | 'think' | 'read' = 'wave') => `${site}/pip/plain/${pose}.webp`,
  }
}
export type Brand = Awaited<ReturnType<typeof brandBits>>

export const BRAND_CSS = `
  .brand-head { display:flex; align-items:center; justify-content:space-between; gap:14px; padding:10px 14px; border-radius:14px;
    background:linear-gradient(135deg,#EAF0FF,#FFF4D1); margin-bottom:14px; }
  .brand-left { display:flex; align-items:center; gap:10px; }
  .brand-icon { width:40px; height:40px; border-radius:10px; }
  .brand-word { font-family:'Nunito',sans-serif; font-weight:900; font-size:20px; color:#16213E; letter-spacing:-.01em; }
  .brand-word span { color:#2F5BE3; }
  .brand-tag { font-size:10px; color:#4A5672; margin-top:1px; }
  .brand-pip { width:62px; height:62px; object-fit:contain; }
  .brand-foot { display:flex; align-items:center; gap:14px; margin-top:22px; padding:10px 14px; border:1.5px solid #E8E2D6; border-radius:14px; page-break-inside:avoid; }
  .brand-foot .qr svg { width:72px; height:72px; display:block; }
  .brand-foot .txt { flex:1; font-size:11px; color:#3d4f4b; line-height:1.6; }
  .brand-foot .txt b { color:#16213E; font-size:12px; }
  .brand-foot .url { font-weight:800; color:#2F5BE3; direction:ltr; unicode-bidi:isolate; }
  .brand-foot .pip-s { width:46px; height:46px; object-fit:contain; }
  @media print { .brand-head { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
`

export function brandHeader(b: Brand, he: boolean, pose: 'wave' | 'read' | 'think' = 'wave') {
  return `<div class="brand-head">
    <div class="brand-left">
      <img class="brand-icon" src="${b.icon}" alt="EduPlay"/>
      <div><div class="brand-word">Edu<span>Play</span></div>
      <div class="brand-tag">${he ? 'לומדים, מתרגלים, נהנים' : 'Learn · Practice · Play'}</div></div>
    </div>
    <img class="brand-pip" src="${b.pip(pose)}" alt="${he ? 'פיפ הינשוף' : 'Pip the owl'}"/>
  </div>`
}

export function brandFooter(b: Brand, he: boolean) {
  return `<div class="brand-foot">
    <div class="qr" aria-hidden="true">${b.qrSvg}</div>
    <div class="txt">
      <b>${he ? 'נוצר ב-EduPlay' : 'Made with EduPlay'}</b><br/>
      ${he ? 'תרגול, מבחנים ודפי הסבר מותאמים לילד/ה שלכם — להדפסה ולאפליקציה. סרקו לעוד דפים כאלה:' : 'Practice, exams and explanation pages made for your child — printable and in the app. Scan for more:'}
      <span class="url">${b.host}</span>
    </div>
    <img class="pip-s" src="${b.pip('thumbs')}" alt=""/>
  </div>`
}
