import 'server-only'
import { createServiceRoleClient } from '@/lib/supabase'
import { UPLOAD_BUCKET, IMAGE_TYPES, MAX_UPLOADS_PER_GENERATION } from '@/lib/uploads'
import { askClaudeText } from '@/lib/claude'

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


// ─── Reading one uploaded file into text (once) ───────────────
// Each page is read on its own, right after upload and in parallel with the
// others, so by the time the parent asks for a plan the material is usually
// already understood. The text is stored on the upload row and reused.

const READ_PROMPT = `You read one page (or file) of an Israeli child's school material: a workbook or textbook page, a worksheet, or an exam material list.
Describe it in Hebrew for a question writer who cannot see it:
- the topic and sub-skills on the page,
- the exact terms and notation used (how points, angles, numbers, units are written),
- the kinds of exercises, with 2–3 representative examples including their numbers,
- any scope limits (for example "first quadrant only", "whole numbers up to 20"),
- the level of difficulty.
If it is a list of exam topics, list every topic and sub-topic in order.
At most 250 words. Write only the description, no preamble.`

export async function readUpload(familyId: string, id: string): Promise<{ name: string; digest: string } | null> {
  const db = createServiceRoleClient()
  const { data: r } = await db.from('generation_uploads').select('id, original_filename, digest').eq('id', id).eq('family_id', familyId).maybeSingle()
  if (!r) return null
  if (r.digest) return { name: r.original_filename, digest: r.digest }
  const { blocks } = await loadUploadBlocks(familyId, [id])
  if (!blocks.length) return null
  const text = await askClaudeText({ system: READ_PROMPT, content: [...blocks, { type: 'text', text: 'Describe this page.' }], maxTokens: 900 })
  if (!text) return null
  const digest = text.slice(0, 4000)
  await db.from('generation_uploads').update({ digest, digest_at: new Date().toISOString() }).eq('id', id)
  return { name: r.original_filename, digest }
}

// All files of a request as one text (reads any not read yet, in parallel).
export async function uploadsAsText(familyId: string, ids: unknown): Promise<{ text: string; read: number; failed: string[] }> {
  const list = Array.isArray(ids) ? ids.filter((x): x is string => typeof x === 'string').slice(0, MAX_UPLOADS_PER_GENERATION) : []
  const results = await Promise.all(list.map(id => readUpload(familyId, id).catch(() => null)))
  const parts: string[] = []
  const failed: string[] = []
  results.forEach((r, i) => { if (r) parts.push(`--- דף ${i + 1} (${r.name}) ---\n${r.digest}`); else failed.push(list[i]) })
  return { text: parts.join('\n\n'), read: parts.length, failed }
}
