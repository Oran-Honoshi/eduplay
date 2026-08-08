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

export async function POST(req: NextRequest) {
  const supabase = createServiceRoleClient()
  const body = await req.json()
  const { pin, password } = body

  // TODO(security): child PIN login has no rate limiting or lockout.
  // - pin_code is compared in plaintext (still true as of 2026-07-23 recheck) — flagged in original
  //   audit as lower priority than the missing rate limit, since PINs are only a 4-digit space anyway.
  // - PIN space is 10,000 combinations (0000-9999) and this endpoint is unauthenticated, so it's
  //   brute-forceable in a trivially small number of requests without throttling.
  // - Needs attempt-based lockout per child per time window (e.g. N failed attempts -> temporary
  //   lockout for that child id) before this is safe to leave as-is. Do not fix as a drive-by change
  //   inside unrelated work (e.g. the IDOR pass) — track and fix as its own change.
  // Child PIN login
  if (pin) {
    const { data: children } = await supabase
      .from('children')
      .select('id, display_name, access_token, pin_code, grade, theme')
      .eq('family_id', FAMILY_ID)

    const child = (children || []).find((c: any) => c.pin_code === pin)

    if (!child) {
      return NextResponse.json({ error: 'Wrong PIN — try again! 🔢' }, { status: 401 })
    }

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
      await createParentSession(null, FAMILY_ID)
      return NextResponse.json({
        success: true,
        type: 'parent',
        familyId: FAMILY_ID,
      })
    }
  }

  return NextResponse.json({ error: 'Wrong password — try again! 🔑' }, { status: 401 })
}

  return NextResponse.json({ error: 'PIN or password required' }, { status: 400 })
}
