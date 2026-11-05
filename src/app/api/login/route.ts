import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createServiceRoleClient } from '@/lib/supabase'
import { isBcryptHash } from '@/lib/passwordHash.mjs'
import { createChildSession, createParentSession, clearChildSession } from '@/lib/session'

const FAMILY_ID = '11111111-1111-1111-1111-111111111111'

async function checkPassword(
  candidate: string,
  stored: string,
  rehash: (newHash: string) => Promise<void>
): Promise<boolean> {
  if (isBcryptHash(stored)) {
    return bcrypt.compare(candidate, stored)
  }
  const matches = candidate === stored
  if (matches) {
    await rehash(await bcrypt.hash(candidate, 10))
  }
  return matches
}

// ── Guessing protection ───────────────────────────────────────
// A 4-digit PIN is only 10,000 options, so failed attempts are counted per
// client IP in a sliding window and further tries are refused for a while.
// Generous enough that a child mistyping a few times (or siblings sharing a
// home connection) isn't locked out; far too slow to brute-force.
const WINDOW_MIN = 15
const LIMITS = { pin: 8, pw: 10 } as const

function clientKey(req: NextRequest, kind: 'pin' | 'pw') {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown'
  return `${kind}:${ip}`
}
async function tooManyAttempts(supabase: any, key: string, limit: number) {
  const since = new Date(Date.now() - WINDOW_MIN * 60_000).toISOString()
  const { count } = await supabase.from('login_attempts').select('id', { count: 'exact', head: true }).eq('key', key).gte('created_at', since)
  return (count ?? 0) >= limit
}
async function recordFailure(supabase: any, key: string) {
  await supabase.from('login_attempts').insert({ key })
}
async function clearFailures(supabase: any, key: string) {
  await supabase.from('login_attempts').delete().eq('key', key)
}
const tooMany = () => NextResponse.json(
  { error: 'Too many tries — please wait a few minutes and try again. · יותר מדי ניסיונות — נסו שוב בעוד כמה דקות.' },
  { status: 429 }
)

export async function POST(req: NextRequest) {
  const supabase = createServiceRoleClient()
  const body = await req.json()
  const { pin, password } = body

  // Security note: failed PIN/password attempts are now throttled per IP
  // (see LIMITS above, 2026-11-05). pin_code is still compared in plaintext —
  // lower risk now that guessing is throttled; hashing it is a separate change.
  // Child PIN login
  if (pin) {
    const key = clientKey(req, 'pin')
    if (await tooManyAttempts(supabase, key, LIMITS.pin)) return tooMany()
    const { data: children } = await supabase
      .from('children')
      .select('id, display_name, access_token, pin_code, grade, theme')
      .eq('family_id', FAMILY_ID)

    const child = (children || []).find((c: any) => c.pin_code === pin)

    if (!child) {
      await recordFailure(supabase, key)
      return NextResponse.json({ error: 'Wrong PIN — try again! 🔢' }, { status: 401 })
    }
    await clearFailures(supabase, key)

    await createChildSession(child.id, FAMILY_ID)

    return NextResponse.json({
      success: true,
      type: 'child',
      child: {
        id: child.id,
        name: child.display_name,
        token: child.access_token,
        grade: child.grade,
        theme: child.theme,
      }
    })
  }

  // Parent password login
if (password) {
  const pwKey = clientKey(req, 'pw')
  if (await tooManyAttempts(supabase, pwKey, LIMITS.pw)) return tooMany()
  // Check individual parent passwords first
  const { data: allParents } = await supabase
    .from('family_parents')
    .select('id, name, password, role, avatar_emoji')
    .eq('family_id', FAMILY_ID)

  for (const parent of allParents || []) {
    const ok = await checkPassword(password, parent.password, async (newHash) => {
      await supabase.from('family_parents').update({ password: newHash }).eq('id', parent.id)
    })
    if (ok) {
      // Clears any stale child-session cookie from a prior PIN login on this
      // browser (shared-device families alternate child PIN / parent password
      // logins) — otherwise it can outlive this new parent login by up to 90
      // days and shadow it in authorizeChildAccess for any child that isn't
      // the one the stale cookie belongs to. See the fix note on
      // authorizeChildAccess itself (2026-08-08) for the matching precedence
      // bug this closes half of; the other half (already-logged-in parent
      // previewing a child link mid-session) has no login call to hook here,
      // which is what that precedence fix covers.
      clearChildSession()
      await clearFailures(supabase, pwKey)
      await createParentSession(parent.id, FAMILY_ID)
      return NextResponse.json({
        success: true,
        type: 'parent',
        familyId: FAMILY_ID,
        parentId: parent.id,
        parentName: parent.name,
      })
    }
  }

  // Fallback to family password
  const { data: family } = await supabase
    .from('families')
    .select('id, parent_password')
    .eq('id', FAMILY_ID)
    .maybeSingle()

  if (family?.parent_password) {
    const ok = await checkPassword(password, family.parent_password, async (newHash) => {
      await supabase.from('families').update({ parent_password: newHash }).eq('id', FAMILY_ID)
    })
    if (ok) {
      // See the individual-parent-password branch above for why this is here.
      clearChildSession()
      await clearFailures(supabase, pwKey)
      await createParentSession(null, FAMILY_ID)
      return NextResponse.json({
        success: true,
        type: 'parent',
        familyId: FAMILY_ID,
      })
    }
  }

  await recordFailure(supabase, pwKey)
  return NextResponse.json({ error: 'Wrong password — try again! 🔑' }, { status: 401 })
}

  return NextResponse.json({ error: 'PIN or password required' }, { status: 400 })
}
