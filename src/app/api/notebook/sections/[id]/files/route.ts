import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { createServiceRoleClient } from '@/lib/supabase'
import { requireParentOnlySession } from '@/lib/session'

const BUCKET = 'notebook-files'
// Mirrors the bucket's own allowed_mime_types/file_size_limit (checkpoint 1) —
// duplicated here rather than shared, matching how questions/page.tsx and
// api/questions/generate/route.ts each keep their own copies of the equivalent
// one-shot reference_file constants.
const ALLOWED_MEDIA_TYPES = ['image/jpeg', 'image/png', 'application/pdf']
const MAX_FILE_BYTES = 10 * 1024 * 1024

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-100)
}

// ─── POST /api/notebook/sections/[id]/files ────────────────────
// Parent-only, family-scoped: uploads one file (multipart/form-data, field
// "file") to the private notebook-files bucket and records it in
// notebook_files. Persistent, unlike the one-shot base64 reference_file on
// /api/questions/generate.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
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

  const formData = await req.formData()
  const file = formData.get('file')

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'file is required (multipart/form-data field "file")' }, { status: 400 })
  }
  if (!ALLOWED_MEDIA_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Only JPG, PNG, or PDF files are supported.' }, { status: 400 })
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: `File is too large — max ${MAX_FILE_BYTES / 1024 / 1024}MB.` }, { status: 400 })
  }

  const storagePath = `${section.family_id}/${section.id}/${randomUUID()}-${sanitizeFilename(file.name)}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, { contentType: file.type, upsert: false })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data: fileRow, error: insertError } = await supabase
    .from('notebook_files')
    .insert({
      section_id: section.id,
      storage_path: storagePath,
      media_type: file.type,
      original_filename: file.name,
      size_bytes: file.size,
      uploaded_by_parent_id: auth.parent.parentId,
    })
    .select()
    .single()

  if (insertError || !fileRow) {
    // Roll back the now-orphaned Storage object rather than leaving an unreferenced upload behind
    await supabase.storage.from(BUCKET).remove([storagePath])
    return NextResponse.json({ error: insertError?.message || 'Failed to record upload' }, { status: 500 })
  }

  return NextResponse.json({ file: fileRow }, { status: 201 })
}
