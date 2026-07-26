import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { createServiceRoleClient } from '@/lib/supabase'

const CHILD_COOKIE = 'ep_child_session'
const PARENT_COOKIE = 'ep_parent_session'

const CHILD_SESSION_TTL = '90d'
const PARENT_SESSION_TTL = '7d'

function getSecretKey() {
  return new TextEncoder().encode(process.env.SESSION_SECRET!)
}

interface ChildSessionPayload {
  role: 'child'
  childId: string
  familyId: string
}

interface ParentSessionPayload {
  role: 'parent'
  parentId: string | null
  familyId: string
}

async function sign(payload: ChildSessionPayload | ParentSessionPayload, ttl: string) {
  return new SignJWT(payload as any)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ttl)
    .sign(getSecretKey())
}

async function verify<T>(token: string): Promise<T | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey())
    return payload as T
  } catch {
    return null
  }
}

export async function createChildSession(childId: string, familyId: string) {
  const token = await sign({ role: 'child', childId, familyId }, CHILD_SESSION_TTL)
  cookies().set(CHILD_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 90,
  })
}

export async function createParentSession(parentId: string | null, familyId: string) {
  const token = await sign({ role: 'parent', parentId, familyId }, PARENT_SESSION_TTL)
  cookies().set(PARENT_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
}

export function clearChildSession() {
  cookies().set(CHILD_COOKIE, '', { path: '/', maxAge: 0 })
}

export function clearParentSession() {
  cookies().set(PARENT_COOKIE, '', { path: '/', maxAge: 0 })
}

// Raw read of whichever session cookies are present, verified but not enforced.
// Routes that need "either a parent or a child" logic read both and decide themselves.
export async function getSession(): Promise<{
  child: ChildSessionPayload | null
  parent: ParentSessionPayload | null
}> {
  const childToken = cookies().get(CHILD_COOKIE)?.value
  const parentToken = cookies().get(PARENT_COOKIE)?.value
  const [child, parent] = await Promise.all([
    childToken ? verify<ChildSessionPayload>(childToken) : Promise.resolve(null),
    parentToken ? verify<ParentSessionPayload>(parentToken) : Promise.resolve(null),
  ])
  return { child, parent }
}

// Returns the verified child session, or null if absent/invalid/expired.
// Callers respond 401 themselves — this never throws.
export async function requireChildSession(): Promise<ChildSessionPayload | null> {
  const { child } = await getSession()
  return child
}

// Returns the verified parent session, or null if absent/invalid/expired.
// Callers respond 401 themselves — this never throws.
export async function requireParentSession(): Promise<ParentSessionPayload | null> {
  const { parent } = await getSession()
  return parent
}

// Confirms a given childId actually belongs to familyId — used by parent-scoped
// routes that receive a childId in the request body/query and need to verify
// the acting parent's family actually owns that child before reading/writing.
export async function requireFamilyMatch(childId: string, familyId: string): Promise<boolean> {
  const supabase = createServiceRoleClient()
  const { data } = await supabase
    .from('children')
    .select('id')
    .eq('id', childId)
    .eq('family_id', familyId)
    .maybeSingle()
  return !!data
}

// Child-only gate for routes a parent must never be able to drive (e.g. token/XP
// grants meant to be earned by the child's own gameplay). No session at all is
// 401; a parent session or a child session for a different child is 403 — both
// are valid credentials, just not ones this route accepts.
export async function requireOwnChildSession(
  childId: string
): Promise<{ ok: true } | { ok: false; status: 401 | 403 }> {
  const { child, parent } = await getSession()
  if (!child && !parent) return { ok: false, status: 401 }
  if (child && child.childId === childId) return { ok: true }
  return { ok: false, status: 403 }
}

// Parent-only gate for routes a child must never be able to drive (e.g. managing other
// parents' accounts in the family). No session at all is 401; a child session is 403 — a
// child session is a valid credential, just not one this route accepts. Matches by
// familyId only (never parentId), so the fallback family-password session (parentId: null,
// created when logging in with the shared family password instead of an individual
// parent's) is accepted here too — that session still carries a real familyId and is meant
// to act as "any parent in this family".
export async function requireParentOnlySession(): Promise<
  { ok: true; parent: ParentSessionPayload } | { ok: false; status: 401 | 403 }
> {
  const { child, parent } = await getSession()
  if (parent) return { ok: true, parent }
  if (child) return { ok: false, status: 403 }
  return { ok: false, status: 401 }
}

// Shared "either session, ownership-checked" gate for routes scoped to a single
// childId: a child session must be that exact child; a parent session must have
// that child in their family (via requireFamilyMatch). No session at all is 401;
// a session that doesn't own this child is 403.
export async function authorizeChildAccess(
  childId: string
): Promise<{ ok: true } | { ok: false; status: 401 | 403 }> {
  const { child, parent } = await getSession()

  if (child) {
    return child.childId === childId ? { ok: true } : { ok: false, status: 403 }
  }

  if (parent) {
    const matches = await requireFamilyMatch(childId, parent.familyId)
    return matches ? { ok: true } : { ok: false, status: 403 }
  }

  return { ok: false, status: 401 }
}
