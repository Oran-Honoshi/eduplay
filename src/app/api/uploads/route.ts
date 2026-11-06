import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { createServiceRoleClient } from '@/lib/supabase'
import { requireParentOnlySession } from '@/lib/session'
import { UPLOAD_BUCKET, UPLOAD_TYPES, MAX_UPLOAD_BYTES, MAX_UPLOADS_PER_REQUEST } from '@/lib/uploads'

// ─── POST /api/uploads ─────────────────────────────────────────
// Reserves storage for parent material (workbook photos, PDFs, documents)
// and returns one signed upload URL per file. The browser uploads straight
// to storage, so files never pass through this function and Vercel's ~4.5MB
// request-body cap no longer limits what a parent can attach.
//
// Body: { files: [{ name, type, size }] }   (1..MAX_UPLOADS_PER_REQUEST)
// Returns: { uploads: [{ id, path, token, name, type }] }
export async function POST(req: NextRequest) {
  const auth = await requireParentOnlySession()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.status === 401 ? 'Unauthorized' : 'Forbidden' }, { status: auth.status })
  }
  const familyId = auth.parent.familyId

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const files = Array.isArray(body?.files) ? body.files : []
  if (files.length === 0 || files.length > MAX_UPLOADS_PER_REQUEST) {
    return NextResponse.json({ error: `Send between 1 and ${MAX_UPLOADS_PER_REQUEST} files.` }, { status: 400 })
  }
  for (const f of files) {
    if (typeof f?.name !== 'string' || typeof f?.type !== 'string' || typeof f?.size !== 'number') {
      return NextResponse.json({ error: 'Each file needs name, type and size.' }, { status: 400 })
    }
    if (!UPLOAD_TYPES.includes(f.type)) {
      return NextResponse.json({ error: `"${f.name}" is not a supported file type.` }, { status: 400 })
    }
    if (f.size <= 0 || f.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: `"${f.name}" is larger than ${MAX_UPLOAD_BYTES / 1024 / 1024}MB.` }, { status: 400 })
    }
  }

  const supabase = createServiceRoleClient()
  const out: any[] = []
  for (const f of files) {
    const safe = f.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80) || 'file'
    const path = `${familyId}/${randomUUID()}-${safe}`
    const { data: signed, error: signErr } = await supabase.storage.from(UPLOAD_BUCKET).createSignedUploadUrl(path)
    if (signErr || !signed) {
      return NextResponse.json({ error: signErr?.message || 'Could not prepare upload' }, { status: 500 })
    }
    const { data: row, error: rowErr } = await supabase
      .from('generation_uploads')
      .insert({ family_id: familyId, storage_path: path, media_type: f.type, original_filename: f.name.slice(0, 200), size_bytes: Math.round(f.size) })
      .select('id')
      .single()
    if (rowErr || !row) return NextResponse.json({ error: rowErr?.message || 'Could not save upload' }, { status: 500 })
    out.push({ id: row.id, path, token: signed.token, name: f.name, type: f.type })
  }
  return NextResponse.json({ uploads: out })
}
