import { Sparkles, Printer, Smartphone, BookOpen, CheckCircle2, Upload, ClipboardCheck, Send } from 'lucide-react'
import EduPlayLogo from '@/components/EduPlayLogo'
import { Pip } from '@/components/Pip'
import { PARENT_COLORS as C, PARENT_FONTS as F, SUBJECT_COLORS } from '@/lib/parentTheme'

// Public landing page (Hebrew first).
export default function LandingPage() {
  const wrap: React.CSSProperties = { maxWidth: 1080, margin: '0 auto', padding: '0 20px' }
  const btn = (primary: boolean): React.CSSProperties => ({ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 52, padding: '0 26px', borderRadius: 999, fontWeight: 800, fontSize: 17, textDecoration: 'none', background: primary ? C.primary : '#fff', color: primary ? '#fff' : C.text, border: primary ? 'none' : `1.5px solid ${C.border}` })
  const card: React.CSSProperties = { background: '#fff', border: `1px solid ${C.border}`, borderRadius: 20, padding: 22 }

  const pillars = [
    { Icon: Sparkles, tint: SUBJECT_COLORS.math, title: 'יצירה בדקות', text: 'מספרים מה הילד צריך, או מעלים דף מהחוברת, ומקבלים תרגול, מבחן או דף הסבר בסגנון של בית הספר. אתם בודקים ומאשרים לפני שהילד רואה.' },
    { Icon: Smartphone, tint: SUBJECT_COLORS.english, title: 'אפליקציה לילדים', text: 'המשימות שלכם מגיעות למסך הבית של הילד, עם רמז והסבר שלב אחר שלב, תשובות בלחיצה ואלבום מדבקות.' },
    { Icon: BookOpen, tint: SUBJECT_COLORS.reading, title: 'קריאה ראשונה', text: 'חוברות וספרונים לפי סדר לימוד הניקוד, מקמץ ופתח והלאה. להדפסה, או לקריאה משותפת באפליקציה.' },
  ]
  const steps = [
    { Icon: Upload, title: 'מספרים או מעלים', text: 'נושא, כיתה, ומה חשוב לכם. אפשר לצרף תמונה של דף.' },
    { Icon: ClipboardCheck, title: 'בודקים ומאשרים', text: 'רואים כל שאלה, מתקנים, מסירים או מוסיפים.' },
    { Icon: Send, title: 'מדפיסים או שולחים', text: 'דף מוכן להדפסה, או משימה באפליקציה של הילד.' },
  ]
  const plan = ['תרגול, מבחנים ודפי הסבר ללא הגבלה', 'חשבון, עברית ואנגלית, מגן ועד י״ב', 'עד 5 ילדים', 'אפליקציית ילדים עם משימות ומדבקות', 'חוברות קריאה וספרונים', 'מעקב התקדמות להורים']

  return (
    <div dir="rtl" lang="he" style={{ minHeight: '100vh', background: C.pageBg, color: C.text, fontFamily: F.body }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(250,247,242,.92)', backdropFilter: 'blur(8px)', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ ...wrap, height: 64, display: 'flex', alignItems: 'center', gap: 12 }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: C.text }}>
            <EduPlayLogo showName={false} size={34} iconRadius={9} iconShadow="none" />
            <span style={{ fontFamily: F.heading, fontWeight: 800, fontSize: 19 }}><bdi>Edu<span style={{ color: C.primary }}>Play</span></bdi></span>
          </a>
          <span style={{ flex: 1 }} />
          <a href="/free" style={{ color: C.text, fontWeight: 700, textDecoration: 'none', fontSize: 15 }}>ספרייה חינמית</a>
          <a href="/login" style={{ ...btn(true), minHeight: 42, fontSize: 15, padding: '0 18px' }}>כניסה</a>
        </div>
      </header>

      <section style={{ ...wrap, padding: '56px 20px 40px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 28, alignItems: 'center' }}>
        <div>
          <span style={{ display: 'inline-block', background: C.amberLight, color: C.amberText, fontWeight: 800, fontSize: 14, padding: '6px 14px', borderRadius: 999 }}>להורים לילדים מגן ועד י״ב</span>
          <h1 style={{ fontFamily: F.heading, fontWeight: 800, fontSize: 'clamp(32px,5vw,50px)', lineHeight: 1.15, margin: '16px 0 14px' }}>
            חומר לימוד מותאם לילד שלכם, <span style={{ color: C.primary }}>בדקות</span>
          </h1>
          <p style={{ fontSize: 19, lineHeight: 1.7, color: C.textSecondary, margin: '0 0 24px', maxWidth: 520 }}>
            תרגול, מבחנים, דפי הסבר וחוברות קריאה בחשבון, עברית ואנגלית. מדפיסים, או שולחים לאפליקציה של הילד. ושום דבר לא מגיע לילד לפני שאישרתם.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <a href="/signup" style={btn(true)}>להתחיל חודש חינם</a>
            <a href="/free" style={btn(false)}><Printer size={18} /> דפים חינם להורדה</a>
          </div>
        </div>
        <div style={{ ...card, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: 28 }}>
          <Pip theme="plain" pose="wave" size={150} he />
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[['משימת היום', 'שברים: חלקים שווים', C.primary], ['ספרון חדש', 'אַבָּא, חַלָּה!', C.mint], ['מדבקה חדשה', 'לאלבום של תמר', C.amberText]].map(([a, b, col]) => (
              <div key={a} style={{ display: 'flex', alignItems: 'center', gap: 10, border: `1px solid ${C.border}`, borderRadius: 14, padding: '10px 14px' }}>
                <span style={{ width: 10, height: 10, borderRadius: 99, background: col }} />
                <span style={{ fontWeight: 800 }}>{a}</span><span style={{ color: C.textSecondary }}>{b}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ ...wrap, padding: '24px 20px 48px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 14 }}>
          {pillars.map(({ Icon, tint, title, text }) => (
            <div key={title} style={card}>
              <span style={{ width: 48, height: 48, borderRadius: 14, background: tint.bg, color: tint.fg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={24} /></span>
              <h2 style={{ fontFamily: F.heading, fontSize: 21, margin: '14px 0 6px' }}>{title}</h2>
              <p style={{ margin: 0, color: C.textSecondary, lineHeight: 1.7, fontSize: 16 }}>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ background: '#fff', borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ ...wrap, padding: '48px 20px' }}>
          <h2 style={{ fontFamily: F.heading, fontSize: 30, textAlign: 'center', margin: '0 0 24px' }}>איך זה עובד</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 14 }}>
            {steps.map(({ Icon, title, text }, i) => (
              <div key={title} style={{ ...card, background: C.pageBg }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 34, height: 34, borderRadius: 99, background: C.primary, color: '#fff', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
                  <Icon size={22} color={C.primary} />
                </div>
                <h3 style={{ fontFamily: F.heading, fontSize: 19, margin: '12px 0 4px' }}>{title}</h3>
                <p style={{ margin: 0, color: C.textSecondary, lineHeight: 1.7 }}>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ ...wrap, padding: '48px 20px' }}>
        <div style={{ ...card, maxWidth: 520, margin: '0 auto', border: `2px solid ${C.primary}`, padding: 28 }}>
          <h2 style={{ fontFamily: F.heading, fontSize: 26, margin: 0 }}>מנוי משפחתי</h2>
          <div style={{ fontFamily: F.heading, fontSize: 40, fontWeight: 800, margin: '8px 0 4px' }}><bdi>$20</bdi> <span style={{ fontSize: 17, color: C.textMuted, fontWeight: 600 }}>לחודש</span></div>
          <div style={{ color: C.textSecondary, marginBottom: 16 }}>חודש ניסיון חינם. בלי כרטיס אשראי ובלי התחייבות.</div>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {plan.map(x => <li key={x} style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 16 }}><CheckCircle2 size={20} color={C.mint} /> {x}</li>)}
          </ul>
          <a href="/signup" style={{ ...btn(true), width: '100%', boxSizing: 'border-box' }}>להתחיל ניסיון חינם</a>
        </div>
      </section>

      <footer style={{ borderTop: `1px solid ${C.border}`, padding: '24px 20px', textAlign: 'center', color: C.textMuted, fontSize: 14 }}>
        <bdi>EduPlay</bdi> · <a href="/free" style={{ color: C.textSecondary }}>ספרייה חינמית</a> · <a href="/login" style={{ color: C.textSecondary }}>כניסה</a>
      </footer>
    </div>
  )
}
