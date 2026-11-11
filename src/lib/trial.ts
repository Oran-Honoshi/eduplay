import 'server-only'
import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase'

export const TRIAL_DAYS = 30

export type TrialInfo = { plan: string; isTrial: boolean; daysLeft: number; ended: boolean; used: number; limit: number }

export function trialInfoFrom(f: any): TrialInfo {
  const isTrial = f?.plan === 'trial'
  const ends = f?.trial_ends_at ? new Date(f.trial_ends_at).getTime() : 0
  const daysLeft = isTrial && ends ? Math.max(0, Math.ceil((ends - Date.now()) / 86400000)) : 0
  const month = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jerusalem', year: 'numeric', month: '2-digit' }).format(new Date()).slice(0, 7)
  const used = f?.gen_month === month ? (f?.monthly_gen_used || 0) : 0
  return { plan: f?.plan || 'trial', isTrial, daysLeft, ended: isTrial && !!ends && ends < Date.now(), used, limit: f?.monthly_gen_limit ?? 50 }
}

export async function getTrialInfo(familyId: string): Promise<TrialInfo> {
  const { data } = await createServiceRoleClient().from('families')
    .select('plan, trial_ends_at, monthly_gen_used, monthly_gen_limit, gen_month').eq('id', familyId).maybeSingle()
  return trialInfoFrom(data)
}

// Counts one AI creation. Returns a ready 402 response when a trial family
// has used its monthly creations or its trial has ended; null when allowed.
export async function consumeCreation(familyId: string): Promise<NextResponse | null> {
  const { data, error } = await createServiceRoleClient().rpc('consume_family_creation', { fid: familyId })
  if (error) { console.error('[consumeCreation]', error.message); return null }
  if (data?.ok) return null
  if (data?.reason === 'trial_ended') {
    return NextResponse.json({ error: 'תקופת הניסיון הסתיימה. כדי להמשיך ליצור, עוברים למנוי.', code: 'TRIAL_ENDED', upgrade: '/upgrade' }, { status: 402 })
  }
  return NextResponse.json({ error: `הגעתם ל-${data?.limit ?? 50} יצירות החודש בתקופת הניסיון. אפשר עדיין להשתמש בספרייה המוכנה, או לעבור למנוי.`, code: 'TRIAL_LIMIT', upgrade: '/upgrade' }, { status: 402 })
}

// Check without counting — for steps that belong to a creation already counted
// (building the questions of a planned material).
export async function checkCreationAllowed(familyId: string): Promise<NextResponse | null> {
  const t = await getTrialInfo(familyId)
  if (!t.isTrial) return null
  if (t.ended) return NextResponse.json({ error: 'תקופת הניסיון הסתיימה. כדי להמשיך ליצור, עוברים למנוי.', code: 'TRIAL_ENDED', upgrade: '/upgrade' }, { status: 402 })
  if (t.used > t.limit) return NextResponse.json({ error: `הגעתם ל-${t.limit} יצירות החודש בתקופת הניסיון.`, code: 'TRIAL_LIMIT', upgrade: '/upgrade' }, { status: 402 })
  return null
}
