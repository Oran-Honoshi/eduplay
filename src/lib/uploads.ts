// Shared limits for parent material uploads (workbook photos, PDFs, documents).
// Used by the browser uploader, POST /api/uploads and the generators.

export const UPLOAD_BUCKET = 'generation-uploads'

export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
export const DOC_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'text/plain',
]
export const UPLOAD_TYPES = [...IMAGE_TYPES, ...DOC_TYPES]
export const UPLOAD_ACCEPT = 'image/*,.heic,.heif,application/pdf,.pdf,.docx,.txt'

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024
export const MAX_UPLOADS_PER_REQUEST = 10
// What the AI reads per generation (pages of a workbook, a material list, etc.)
export const MAX_UPLOADS_PER_GENERATION = 10
