import { redirect } from 'next/navigation'
import { CheckCircle2, BookOpen, Sparkles } from 'lucide-react'
import EduPlayLogo from '@/components/EduPlayLogo'
import { requireParentOnlySession } from '@/lib/session'
import { getTrialInfo } from '@/lib/trial'
import { PARENT_COLORS as C, PARENT_FONTS as F } from '@/lib/parentTheme'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'מנוי משפחתי · EduPlay', robots: { index: false, follow: false } }

const PLAN = ['יצירה ללא הגבלה: דפי תרגול, מבחנים ודפי הסבר', 'עד 5 ילדים', 'חשבון, אנגלית ועברית', 'אפליקציה לילדים, עם מדבקות ופרסים', 'הדפסה ושליחה לאפליקציה']

// What a family sees when the free month ends (and from the trial chip).
// No payment yet — this is the plan screen only.
export default async function UpgradePage() {
  const auth = await requireParentOnlySession()
  if (!auth.ok) redirect('/login')
  const t = await getTrialInfo(auth.parent.familyId)
  if (!t.isTrial) redirect('/dashboard')

  return (
    <div dir="rtl" lang="he" style={{ minHeight: '100vh', background: C.pageBg, fontFamily: F.body, color: C.text, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 520 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}><EduPlayLogo showName={false} size={52} iconRadius={14} iconShadow="none" /></div>
        <div style={{ background: '#fff', border: `2px solid ${C.primary}`, borderRadius: 24, padding: 28 }}>
          <h1 style={{ fontFamily: F.heading, fontSize: 26, margin: 0 }}>{t.ended ? 'חודש הניסיון הסתיים' : `נשארו ${t.daysLeft} ימים לניסיון`}</h1>
          <p style={{ color: C.textSecondary, margin: '6px 0 18px', lineHeight: 1.7 }}>
            {t.ended ? 'תודה שניסיתם את EduPlay! כל מה שיצרתם נשמר ומחכה לכם. כדי להמשיך ליצור וללמוד, עוברים למנוי המשפחתי.' : `בינתיים יש לכם ${Math.max(0, t.limit - t.used)} יצירות נוספות החודש. כך ייראה המנוי המלא:`}
          </p>
          <div style={{ fontFamily: F.heading, fontSize: 40, fontWeight: 800 }}><bdi>$20</bdi> <span style={{ fontSize: 17, color: C.textMuted, fontWeight: 600 }}>לחודש, לכל המשפחה</span></div>
          <ul style={{ listStyle: 'none', padding: 0, margin: '16px 0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {PLAN.map(x => <li key={x} style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 16 }}><CheckCircle2 size={20} color={C.mint} /> {x}</li>)}
          </ul>
          <div style={{ background: C.amberLight, color: C.amberText, borderRadius: 14, padding: '12px 14px', fontWeight: 700, lineHeight: 1.6 }}>
            ההצטרפות למנוי תיפתח בקרוב.
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
            {!t.ended && <a href="/dashboard" style={{ flex: '1 1 160px', minHeight: 48, borderRadius: 999, background: C.primary, color: '#fff', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, textDecoration: 'none' }}><Sparkles size={18} /> חזרה לאפליקציה</a>}
            <a href="/free" style={{ flex: '1 1 160px', minHeight: 48, borderRadius: 999, border: `1.5px solid ${C.border}`, color: C.text, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, textDecoration: 'none' }}><BookOpen size={18} /> לספרייה החינמית</a>
          </div>
        </div>
      </div>
    </div>
  )
}
