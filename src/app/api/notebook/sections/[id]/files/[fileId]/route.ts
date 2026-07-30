import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase'
import { requireParentOnlySession } from '@/lib/session'

const BUCKET = 'notebook-files'

// ─── DELETE /api/notebook/sections/[id]/files/[fileId] ─────────
// Parent-only, family-scoped. Deletes the DB row first, then the Storage
// object — an orphaned Storage blob with no reference (if the second step
// ever fails) is an invisible, harmless leak; a DB row pointing at a deleted
// object would surface as a broken thumbnail/link, which is worse.
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; fileId: string } }
) {
  const auth = await requireParentOnlySession()
  if (!auth.ok) {
    return NextResponse.json(
      { error: auth.status === 401 ? 'Unauthorized' : 'Forbidden' },
      { status: auth.status }
    )
  }

  const supabase = createServiceRoleClient()

  const { data: file } = await supabase
    .from('notebook_files')
    .select('id, storage_path, section:notebook_sections(id, family_id)')
    .eq('id', params.fileId)
    .eq('section_id', params.id)
    .maybeSingle()

  if (!file) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const section = Array.isArray(file.section) ? file.section[0] : file.section
  if (!section || section.family_id !== auth.parent.familyId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error: deleteError } = await supabase.from('notebook_files').delete().eq('id', params.fileId)
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })

  const { error: storageError } = await supabase.storage.from(BUCKET).remove([file.storage_path])
  if (storageError) {
    // DB row is already gone (the source of truth for the gallery) — a Storage
    // object left behind here is an invisible orphan, not a user-facing bug.
    console.error(`notebook_files ${params.fileId} deleted but Storage removal failed:`, storageError.message)
  }

  return NextResponse.json({ success: true })
}
