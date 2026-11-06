export const KIND_HE: Record<string, string> = { practice: 'דף תרגול', exam: 'מבחן לתרגול', explanation: 'דפי הסבר' }
export const SUBJECT_HE: Record<string, string> = { math: 'חשבון ומתמטיקה', hebrew: 'עברית', english: 'אנגלית' }
export const gradeHe = (g: number) => (g === 0 ? 'גן' : `כיתה ${['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י', 'י״א', 'י״ב'][g - 1]}${g <= 10 ? '׳' : ''}`)
