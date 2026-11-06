import 'server-only'
import { createServiceRoleClient } from '@/lib/supabase'
import { UPLOAD_BUCKET, IMAGE_TYPES, MAX_UPLOADS_PER_GENERATION } from '@/lib/uploads'

// Turns a family's uploaded files into Anthropic message content blocks:
// images → image blocks, PDFs → document blocks, .docx/.txt → extracted text.
// Only rows owned by `familyId` are ever read, so an id from another family
// is silently ignored rather than leaked.
const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // API limit per image (browser downsizes photos first)
const MAX_TEXT_CHARS = 40_000

export async function loadUploadBlocks(familyId: string, ids: unknown): Promise<{ blocks: any[]; names: string[]; skipped: string[] }> {
  const list = Array.isArray(ids) ? ids.filter((x): x is string => typeof x === 'string').slice(0, MAX_UPLOADS_PER_GENERATION) : []
  if (list.length === 0) return { blocks: [], names: [], skipped: [] }

  const supabase = createServiceRoleClient()
  const { data: rows } = await supabase
    .from('generation_uploads')
    .select('id, storage_path, media_type, original_filename')
    .eq('family_id', familyId)
    .in('id', list)

  // keep the order the parent attached them in (workbook pages are often sequential)
  const byId = new Map((rows || []).map(r => [r.id, r]))
  const blocks: any[] = []
  const names: string[] = []
  const skipped: string[] = []

  for (const id of list) {
    const r = byId.get(id)
    if (!r) continue
    const { data: blob, error } = await supabase.storage.from(UPLOAD_BUCKET).download(r.storage_path)
    if (error || !blob) { skipped.push(r.original_filename); continue }
    const buf = Buffer.from(await blob.arrayBuffer())

    if (IMAGE_TYPES.includes(r.media_type)) {
      if (buf.byteLength > MAX_IMAGE_BYTES) { skipped.push(r.original_filename); continue }
      blocks.push({ type: 'image', source: { type: 'base64', media_type: r.media_type, data: buf.toString('base64') } })
    } else if (r.media_type === 'application/pdf') {
      blocks.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: buf.toString('base64') } })
    } else {
      let text = ''
      try {
        if (r.media_type === 'text/plain') text = buf.toString('utf8')
        else {
          const mammoth = await import('mammoth')
          text = (await mammoth.extractRawText({ buffer: buf })).value
        }
      } catch { skipped.push(r.original_filename); continue }
      text = text.trim().slice(0, MAX_TEXT_CHARS)
      if (!text) { skipped.push(r.original_filename); continue }
      blocks.push({ type: 'text', text: `Content of the parent's uploaded file "${r.original_filename}":\n\n${text}` })
    }
    names.push(r.original_filename)
  }
  return { blocks, names, skipped }
}
