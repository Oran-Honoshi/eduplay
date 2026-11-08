'use client'
import { useEffect, useState } from 'react'
import { Pip, type PipPose } from '@/components/Pip'

// Playful rotating lines while something takes time (uploading, planning,
// building questions), so a wait feels like part of the fun, not a hang.
export const FUN_LINES = {
  upload: [
    'פיפ אוסף את הדפים שלכם…',
    'מיישרים את הצילומים ומנגבים את האבק מהעדשה…',
    'עוד רגע, הדפים כבר בדרך…',
    'סופרים דפים. אחד, שניים, הרבה!',
  ],
  plan: [
    'פיפ מרכיב משקפיים וקורא את החומר…',
    'מסמנים בטוש זוהר את מה שחשוב…',
    'מחפשים מה המורה הכי רוצה שיידעו…',
    'מסדרים את הנושאים מהקל לקשה…',
    'עוד כמה עמודים ונגמר הסיכום…',
  ],
  build: [
    'מבשלים לכם שאלות טעימות…',
    'מוסיפים קורט של אתגר, לא יותר מדי…',
    'פיפ בודק שכל תשובה באמת נכונה…',
    'מציירים צירים, זוויות ומספרים…',
    'כותבים רמזים שלא מגלים את התשובה…',
    'מתבלים בדוגמאות מהחיים…',
    'מסדרים את השאלות מהקל לקשה…',
    'עוד רגע… האיכות שווה את זה!',
  ],
  explain: [
    'פיפ מכין לוח וגיר…',
    'כותבים הסבר שאפשר להבין לבד…',
    'מוסיפים דוגמה פתורה צעד אחר צעד…',
    'מזהירים מהטעויות הנפוצות…',
  ],
}

export function FunLoader({ kind, pose = 'read', size = 96, sub }: { kind: keyof typeof FUN_LINES; pose?: PipPose; size?: number; sub?: React.ReactNode }) {
  const lines = FUN_LINES[kind]
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setI(x => (x + 1) % lines.length), 2800)
    return () => clearInterval(t)
  }, [lines.length])
  return (
    <div className="flex flex-col items-center text-center gap-2" dir="rtl" aria-live="polite">
      <div className="animate-bounce" style={{ animationDuration: '1.8s' }}><Pip pose={pose} size={size} he /></div>
      <div key={i} className="text-base font-bold text-[#16213E] transition-opacity" style={{ animation: 'funIn .4s ease-out' }}>{lines[i]}</div>
      {sub && <div className="text-sm text-[#4A5672]">{sub}</div>}
      <style>{`@keyframes funIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}`}</style>
    </div>
  )
}

// Small inline version (one line, no Pip) for buttons and narrow places.
export function FunLine({ kind }: { kind: keyof typeof FUN_LINES }) {
  const lines = FUN_LINES[kind]
  const [i, setI] = useState(0)
  useEffect(() => { const t = setInterval(() => setI(x => (x + 1) % lines.length), 2800); return () => clearInterval(t) }, [lines.length])
  return <span>{lines[i]}</span>
}
