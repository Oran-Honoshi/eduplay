import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase'
import { requireParentOnlySession } from '@/lib/session'

// ─── GET /api/notebook/sections/[id]/recipe ────────────────────
// Parent-only, family-scoped: reads the section's generator recipe
// (prompt_text), if one has been saved yet.
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireParentOnlySession()
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.status === 401 ? 'Unauthorized' : 'Forbidden' },
      { status: auth.status }
    )
  }

  const supabase = createServiceRoleClient()

  const { data: section } = await supabase
    .from('notebook_sections')
    .select('id, family_id')
    .eq('id', params.id)
    .maybeSingle()

  if (!section) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (section.family_id !== auth.parent.familyId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: recipe } = await supabase
    .from('notebook_recipes')
    .select('id, prompt_text, updated_at')
    .eq('section_id', section.id)
    .maybeSingle()

  return NextResponse.json({ recipe: recipe || null })
}

// ─── PUT /api/notebook/sections/[id]/recipe ────────────────────
// Parent-only, family-scoped: upserts the section's recipe (manual edit
// only — no AI-assist seeding per the v1 decision). Body: { promptText }
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireParentOnlySession()
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.status === 401 ? 'Unauthorized' : 'Forbidden' },
      { status: auth.status }
    )
  }

  const supabase = createServiceRoleClient()

  const { data: section } = await supabase
    .from('notebook_sections')
    .select('id, family_id')
    .eq('id', params.id)
    .maybeSingle()

  if (!section) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (section.family_id !== auth.parent.familyId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { promptText } = body

  if (promptText !== undefined && promptText !== null && typeof promptText !== 'string') {
    return NextResponse.json({ error: 'promptText must be a string' }, { status: 400 })
  }

  const { data: recipe, error } = await supabase
    .from('notebook_recipes')
    .upsert(
      {
        section_id: section.id,
        prompt_text: (promptText || '').trim() || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'section_id' }
    )
    .select('id, prompt_text, updated_at')
    .single()

  if (error || !recipe) {
    return NextResponse.json({ error: error?.message || 'Failed to save recipe' }, { status: 500 })
  }

  return NextResponse.json({ recipe })
}
