import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createServiceRoleClient } from '@/lib/supabase'
import { requireParentOnlySession } from '@/lib/session'

export async function GET(req: NextRequest) {
  const auth = await requireParentOnlySession()
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.status === 401 ? 'Unauthorized' : 'Forbidden' },
      { status: auth.status }
    )
  }

  const supabase = createServiceRoleClient()
  const { data: parents } = await supabase
    .from('family_parents')
    .select('id, name, email, avatar_emoji, role, sort_order')
    .eq('family_id', auth.parent.familyId)
    .order('sort_order')

  return NextResponse.json({ parents: parents || [] })
}

export async function POST(req: NextRequest) {
  const auth = await requireParentOnlySession()
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.status === 401 ? 'Unauthorized' : 'Forbidden' },
      { status: auth.status }
    )
  }

  const supabase = createServiceRoleClient()
  const body = await req.json()
  const { name, password, avatar_emoji, role } = body
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const familyId = auth.parent.familyId
  // parents sign in with their email, so every parent needs one
  if (!String(name || '').trim()) return NextResponse.json({ error: 'נא למלא שם' }, { status: 400 })
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return NextResponse.json({ error: 'נא למלא אימייל תקין — איתו ההורה נכנס' }, { status: 400 })
  if (!password || String(password).length < 8) return NextResponse.json({ error: 'הסיסמה צריכה להיות באורך 8 תווים לפחות' }, { status: 400 })

  // Max 3 parents check
  const { data: existing } = await supabase
    .from('family_parents')
    .select('id')
    .eq('family_id', familyId)

  if ((existing?.length || 0) >= 3) {
    return NextResponse.json({ error: 'Maximum 3 parents per family' }, { status: 400 })
  }

  const hashedPassword = password ? await bcrypt.hash(password, 10) : password

  const { data, error } = await supabase
    .from('family_parents')
    .insert({
      family_id: familyId,
      name,
      email,
      password: hashedPassword,
      avatar_emoji: avatar_emoji || '👤',
      role: role === 'admin' ? 'admin' : 'parent',
      sort_order: (existing?.length || 0) + 1,
    })
    .select('id, name, email, avatar_emoji, role, sort_order')
    .single()

  if (error?.code === '23505') return NextResponse.json({ error: 'כבר יש חשבון עם האימייל הזה' }, { status: 409 })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, parent: data })
}

export async function PATCH(req: NextRequest) {
  const supabase = createServiceRoleClient()
  const body = await req.json()
  const { parentId, name, email, password, avatar_emoji } = body
  if (!parentId) return NextResponse.json({ error: 'parentId required' }, { status: 400 })

  const auth = await requireParentOnlySession()
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.status === 401 ? 'Unauthorized' : 'Forbidden' },
      { status: auth.status }
    )
  }

  const { data: target } = await supabase
    .from('family_parents')
    .select('id, family_id')
    .eq('id', parentId)
    .maybeSingle()

  if (!target) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (target.family_id !== auth.parent.familyId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // NOTE(product): any parent session in a family can update any OTHER parent's row in
  // that same family via this route, including resetting their password — there's no
  // check that the acting parent IS the target parent. This matches the shipped
  // multi-parent UI (a family's parents manage each other's accounts from one shared
  // dashboard, no per-parent re-auth step) and is a deliberate tradeoff, not an oversight.
  // Not filed as TODO(security): the family-match check above is the actual security
  // boundary (a parent from a different family can't touch this row at all), and within
  // one family this is intended shared access, same trust model as the rest of the
  // parent dashboard. Worth a future UX conversation though — e.g. requiring the target
  // parent's own re-confirmation for a password change, or at minimum a "your password
  // was changed by <name>" notification.
  const updates: any = {}
  if (name) updates.name = name
  if (email) updates.email = String(email).trim().toLowerCase()
  if (password) updates.password = await bcrypt.hash(password, 10)
  if (avatar_emoji) updates.avatar_emoji = avatar_emoji

  await supabase.from('family_parents').update(updates).eq('id', parentId)
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const supabase = createServiceRoleClient()
  const parentId = new URL(req.url).searchParams.get('parentId')
  if (!parentId) return NextResponse.json({ error: 'Missing parentId' }, { status: 400 })

  const auth = await requireParentOnlySession()
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.status === 401 ? 'Unauthorized' : 'Forbidden' },
      { status: auth.status }
    )
  }

  const { data: target } = await supabase
    .from('family_parents')
    .select('id, family_id')
    .eq('id', parentId)
    .maybeSingle()

  if (!target) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (target.family_id !== auth.parent.familyId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { count } = await supabase
    .from('family_parents')
    .select('id', { count: 'exact', head: true })
    .eq('family_id', target.family_id)

  if ((count ?? 0) <= 1) {
    return NextResponse.json({ error: 'Cannot delete the last parent in a family' }, { status: 400 })
  }

  await supabase.from('family_parents').delete().eq('id', parentId)
  return NextResponse.json({ success: true })
}
