import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { createServiceRoleClient } from '@/lib/supabase'
import { getSession, requireFamilyMatch, authorizeChildAccess, requireParentOnlySession } from '@/lib/session'

// pin_code and grade are parent-only regardless of whose row it is; everything
// else in `allowed` below is self-service subject to the ownership check.
const PARENT_ONLY_FIELDS = ['pin_code', 'grade']

export async function GET(req: NextRequest) {
  const supabase = createServiceRoleClient()
  const childId = req.nextUrl.searchParams.get('childId')
  if (!childId) return NextResponse.json({ error: 'childId required' }, { status: 400 })

  const auth = await authorizeChildAccess(childId)
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.status === 401 ? 'Unauthorized' : 'Forbidden' },
      { status: auth.status }
    )
  }

  const { data: child, error } = await supabase
    .from('children')
    .select('id, display_name, xp_total, xp_balance, card_tokens, card_collect_mode, grade, theme, font_size, lang_screen, pin_code, relief_trigger')
    .eq('id', childId)
    .single()

  if (error || !child) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ child })
}

export async function PATCH(req: NextRequest) {
  const supabase = createServiceRoleClient()
  const body = await req.json()
  const { childId } = body
  if (!childId) return NextResponse.json({ error: 'childId required' }, { status: 400 })

  const { child, parent } = await getSession()
  if (!child && !parent) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (child) {
    if (child.childId !== childId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  } else if (parent) {
    const matches = await requireFamilyMatch(childId, parent.familyId)
    if (!matches) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (child) {
    const rejected = PARENT_ONLY_FIELDS.filter(f => body[f] !== undefined)
    if (rejected.length > 0) {
      return NextResponse.json({ error: `Parent session required for: ${rejected.join(', ')}` }, { status: 403 })
    }
  }

  const allowed = ['grade','theme','font_size','lang_screen','pin_code','relief_trigger','card_collect_mode','card_tokens']
  const update: Record<string, any> = {}
  for (const field of allowed) {
    if (body[field] !== undefined) update[field] = body[field]
  }

  if (update.card_collect_mode && !['choice','region_random','full_random'].includes(update.card_collect_mode))
    return NextResponse.json({ error: 'Invalid card_collect_mode' }, { status: 400 })
  if (update.theme && !['plain','minecraft','princesses','adventure','space','sports'].includes(update.theme))
    return NextResponse.json({ error: 'Invalid theme' }, { status: 400 })
  if (update.font_size && !['small','medium','large','xl'].includes(update.font_size))
    return NextResponse.json({ error: 'Invalid font_size' }, { status: 400 })
  if (update.grade !== undefined && (update.grade < 0 || update.grade > 6))
    return NextResponse.json({ error: 'Invalid grade' }, { status: 400 })
  if (Object.keys(update).length === 0)
    return NextResponse.json({ error: 'No valid fields' }, { status: 400 })

  const { error } = await supabase.from('children').update(update).eq('id', childId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, updated: Object.keys(update) })
}
// POST /api/children — a parent adds a child to their own family (onboarding
// and the "add a child" button). Up to MAX_CHILDREN per family.
const MAX_CHILDREN = 5
const THEMES = ['plain', 'minecraft', 'princesses', 'sports']

export async function POST(req: NextRequest) {
  const auth = await requireParentOnlySession()
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status })
  const familyId = auth.parent.familyId
  const b = await req.json().catch(() => ({}))
  const display_name = String(b.display_name || '').trim().slice(0, 40)
  const grade = Number(b.grade)
  const theme = THEMES.includes(b.theme) ? b.theme : 'plain'
  const pin = b.pin_code == null || b.pin_code === '' ? null : String(b.pin_code)
  if (!display_name) return NextResponse.json({ error: 'נא למלא שם' }, { status: 400 })
  if (!Number.isInteger(grade) || grade < 0 || grade > 6) return NextResponse.json({ error: 'נא לבחור כיתה' }, { status: 400 })
  if (pin !== null && !/^\d{4}$/.test(pin)) return NextResponse.json({ error: 'הקוד צריך להיות 4 ספרות' }, { status: 400 })

  const supabase = createServiceRoleClient()
  const { count } = await supabase.from('children').select('id', { count: 'exact', head: true }).eq('family_id', familyId)
  if ((count ?? 0) >= MAX_CHILDREN) return NextResponse.json({ error: `אפשר עד ${MAX_CHILDREN} ילדים במנוי` }, { status: 400 })

  const { data, error } = await supabase.from('children').insert({
    family_id: familyId, display_name, grade, theme, pin_code: pin,
    access_token: randomBytes(12).toString('hex'),
    lang_screen: 'bilingual', lang_worksheets: 'bilingual', hebrew_enabled: true, journey_mode: 'story',
  }).select('id, display_name, grade, theme, access_token, pin_code').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ child: data })
}
