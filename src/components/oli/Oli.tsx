// Oli (אוֹלִי), the EduPlay mascot. Renders the designer's approved SVG files
// from /public/oli unchanged (Oli handover, 2026-11). Never redraw or recolor.
// Full body 72–320px wide, height = width × 480/460. Heads 28–56px.

export type OliState = 'hello' | 'happy' | 'party' | 'proud' | 'wink' | 'surprised' | 'think' | 'help' | 'calm' | 'soso' | 'sad' | 'love' | 'sleep' | 'star' | 'marker' | 'pencil' | 'read' | 'notebook' | 'laptop' | 'teach' | 'grad' | 'trophy' | 'guide' | 'announce' | 'check' | 'remind'

const ALT: Record<OliState, string> = {
  hello: 'אוֹלִי: שלום!', happy: 'אוֹלִי: שמח', party: 'אוֹלִי: חוגג הצלחה', proud: 'אוֹלִי: מרוצה',
  wink: 'אוֹלִי: קורץ', surprised: 'אוֹלִי: מופתע', think: 'אוֹלִי: חושב', help: 'אוֹלִי: צריך עזרה?',
  calm: 'אוֹלִי: רגוע ומסביר', soso: 'אוֹלִי: ככה ככה', sad: 'אוֹלִי: מעודד אחרי טעות', love: 'אוֹלִי: אוהב / מעודד',
  sleep: 'אוֹלִי: ישן', star: 'אוֹלִי: עידוד וחיזוק', marker: 'אוֹלִי: עם טוש', pencil: 'אוֹלִי: כותב ופותר',
  read: 'אוֹלִי: קורא', notebook: 'אוֹלִי: עם מחברת', laptop: 'אוֹלִי: עובד ויוצר', teach: 'אוֹלִי: מסביר ומלמד',
  grad: 'אוֹלִי: למידה והתקדמות', trophy: 'אוֹלִי: הישג / פרס', guide: 'אוֹלִי: מדריך', announce: 'אוֹלִי: מודיע / מזמין',
  check: 'אוֹלִי: בודק', remind: 'אוֹלִי: מזכיר',
}

export function Oli({ state, size = 160, decorative = false, className, style }: {
  state: OliState; size?: number; decorative?: boolean; className?: string; style?: React.CSSProperties
}) {
  const w = Math.min(320, Math.max(72, size))
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={`/oli/oli-${state}.svg`} width={w} height={Math.round((w * 480) / 460)}
      alt={decorative ? '' : ALT[state]} aria-hidden={decorative || undefined}
      className={className} style={{ flex: 'none', ...style }} draggable={false} />
  )
}

/** Head only: avatars, bubbles, small spots (28–56px). */
export function OliHead({ size = 40, onBlue = false }: { size?: number; onBlue?: boolean }) {
  const s = Math.min(56, Math.max(28, size))
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={onBlue ? '/oli/oli-head-white.svg' : '/oli/oli-head.svg'} width={s} height={s} alt="" aria-hidden draggable={false} />
}

/** The official peek logo (logo/eduplay-logo.html.txt), as delivered. */
export function OliLogo({ href }: { href?: string }) {
  const inner = (
    <>
      <span style={{ height: 26, overflow: 'hidden', marginLeft: 6, display: 'block' }}>
        <svg aria-hidden="true" width="36" height="36" viewBox="62 24 276 276"><path d="M200 72 C234 72 264 62 290 30 C300 58 304 80 306 98 C340 140 346 228 328 290 C308 344 260 372 200 372 C140 372 92 344 72 290 C54 228 60 140 94 98 C96 80 100 58 110 30 C136 62 166 72 200 72 Z" fill="#2F5BE3"></path><path d="M118 50 C126 66 138 78 152 84 C136 88 120 92 106 96 C108 80 112 64 118 50 Z" fill="#2347C9"></path><path d="M 282 50 C 274 66 262 78 248 84 C 264 88 280 92 294 96 C 292 80 288 64 282 50 Z" fill="#2347C9"></path><path d="M200 214 C252 214 278 262 278 308 C278 346 246 364 200 364 C154 364 122 346 122 308 C122 262 148 214 200 214 Z" fill="#8FA9FF"></path><circle cx="152" cy="160" r="50" fill="#FFFFFF"></circle><circle cx="248" cy="160" r="50" fill="#FFFFFF"></circle><circle cx="159" cy="167" r="23" fill="#16213E"></circle><circle cx="168" cy="157" r="8.0" fill="#FFFFFF"></circle><circle cx="153" cy="178" r="3.5" fill="#FFFFFF"></circle><circle cx="255" cy="167" r="23" fill="#16213E"></circle><circle cx="264" cy="157" r="8.0" fill="#FFFFFF"></circle><circle cx="249" cy="178" r="3.5" fill="#FFFFFF"></circle><path d="M124 98 C140 88 164 88 180 98" fill="none" stroke="#16213E" strokeWidth="8" strokeLinecap="round"></path><path d="M 276 98 C 260 88 236 88 220 98" fill="none" stroke="#16213E" strokeWidth="8" strokeLinecap="round"></path><circle cx="108" cy="212" r="13" fill="#FF9AA8" opacity="0.75"></circle><circle cx="292" cy="212" r="13" fill="#FF9AA8" opacity="0.75"></circle><path d="M184 204 Q200 198 216 204 Q212 222 200 234 Q188 222 184 204 Z" fill="#FFC940"></path><path d="M188 208 Q200 204 212 208" fill="none" stroke="#E0A800" strokeWidth="3" strokeLinecap="round"></path></svg>
      </span>
      <span style={{ fontFamily: "'Rubik', sans-serif", fontWeight: 900, fontSize: 30, letterSpacing: -1, lineHeight: 1, marginTop: -2 }}>
        Edu<span style={{ background: 'linear-gradient(transparent 58%, #FFC940 58%, #FFC940 90%, transparent 90%)', padding: '0 2px' }}>Play</span>
      </span>
    </>
  )
  const style: React.CSSProperties = { display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', textDecoration: 'none', color: '#16213E', direction: 'ltr', flex: 'none' }
  return href
    ? <a href={href} aria-label="EduPlay · דף הבית" style={style}>{inner}</a>
    : <span aria-label="EduPlay" role="img" style={style}>{inner}</span>
}
