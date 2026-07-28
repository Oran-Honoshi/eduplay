// Dev-only helper: mints a parent or child session JWT matching src/lib/session.ts's
// sign() exactly, for curl/Playwright-driven manual verification against a running
// `next dev` server without going through the login UI.
//
// Usage:
//   set -a && source .env.local && set +a && node scripts/dev-mint-session.mjs
//   node scripts/dev-mint-session.mjs --role child --family <familyId> --child <childId>
//
// Prints the raw JWT to stdout — set it as the ep_parent_session (or ep_child_session)
// cookie value.

import { SignJWT } from 'jose'

const DEFAULT_FAMILY_ID = '11111111-1111-1111-1111-111111111111'

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`)
  return i !== -1 ? process.argv[i + 1] : fallback
}

const secret = process.env.SESSION_SECRET
if (!secret) {
  console.error('Missing SESSION_SECRET in env (source .env.local first)')
  process.exit(1)
}

const role = arg('role', 'parent')
const familyId = arg('family', DEFAULT_FAMILY_ID)
const key = new TextEncoder().encode(secret)

const payload = role === 'child'
  ? { role: 'child', childId: arg('child'), familyId }
  : { role: 'parent', parentId: null, familyId }

if (role === 'child' && !payload.childId) {
  console.error('--child <childId> is required for --role child')
  process.exit(1)
}

const ttl = role === 'child' ? '90d' : '7d'
const token = await new SignJWT(payload)
  .setProtectedHeader({ alg: 'HS256' })
  .setIssuedAt()
  .setExpirationTime(ttl)
  .sign(key)

console.log(token)
