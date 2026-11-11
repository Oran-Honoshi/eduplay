import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createServiceRoleClient } from '@/lib/supabase'
import { createParentSession, clearChildSession } from '@/lib/session'
import { TRIAL_DAYS } from '@/lib/trial'

// POST /api/signup — a new family on a free trial: no card, no payment.
// Creates the family + its first parent and signs the parent in.
const WINDOW_MIN = 60
const LIMIT = 5 // new families per IP per hour

export async function POST(req: NextRequest) {
  const db = createServiceRoleClient()
  const b = await req.json().catch(() => ({}))
  const name = String(b.name || '').trim().slice(0, 60)
  const email = String(b.email || '').trim().toLowerCase().slice(0, 200)
  const password = String(b.password || '')
  const familyName = String(b.familyName || '').trim().slice(0, 60) || null

  if (!name) return NextResponse.json({ error: 'נא למלא שם', field: 'name' }, { status: 400 })
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return NextResponse.json({ error: 'כתובת האימייל לא נראית תקינה', field: 'email' }, { status: 400 })
  if (password.length < 8) return NextResponse.json({ error: 'הסיסמה צריכה להיות באורך 8 תווים לפחות', field: 'password' }, { status: 400 })

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown'
  const key = `signup:${ip}`
  const since = new Date(Date.now() - WINDOW_MIN * 60_000).toISOString()
  const { count } = await db.from('login_attempts').select('id', { count: 'exact', head: true }).eq('key', key).gte('created_at', since)
  if ((count ?? 0) >= LIMIT) return NextResponse.json({ error: 'יותר מדי הרשמות מהרשת הזאת. נסו שוב מאוחר יותר.' }, { status: 429 })

  const esc = email.replace(/[%_\\]/g, '\\$&')
  const [{ data: p }, { data: f }] = await Promise.all([
    db.from('family_parents').select('id').ilike('email', esc).limit(1),
    db.from('families').select('id').ilike('parent_email', esc).limit(1),
  ])
  if ((p || []).length || (f || []).length) {
    return NextResponse.json({ error: 'כבר יש חשבון עם האימייל הזה. אפשר להתחבר.', field: 'email', exists: true }, { status: 409 })
  }

  const { data: fam, error: fe } = await db.from('families').insert({
    plan: 'trial', trial_ends_at: new Date(Date.now() + TRIAL_DAYS * 86400000).toISOString(),
    monthly_gen_limit: 50, monthly_gen_used: 0, is_admin: false, parent_email: email, family_name: familyName,
  }).select('id').single()
  if (fe || !fam) return NextResponse.json({ error: 'לא הצלחנו ליצור את החשבון. נסו שוב.' }, { status: 500 })

  const { data: parent, error: pe } = await db.from('family_parents').insert({
    family_id: fam.id, name, email, password: await bcrypt.hash(password, 10), role: 'admin', avatar_emoji: '👤', sort_order: 1,
  }).select('id').single()
  if (pe || !parent) {
    await db.from('families').delete().eq('id', fam.id)
    return NextResponse.json({ error: pe?.code === '23505' ? 'כבר יש חשבון עם האימייל הזה.' : 'לא הצלחנו ליצור את החשבון. נסו שוב.' }, { status: pe?.code === '23505' ? 409 : 500 })
  }

  await db.from('login_attempts').insert({ key })
  clearChildSession()
  await createParentSession(parent.id, fam.id)
  return NextResponse.json({ success: true, familyId: fam.id, parentId: parent.id })
}
