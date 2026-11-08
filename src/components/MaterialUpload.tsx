'use client'

// Parent material uploader — workbook photos, PDFs, Word/text files, several
// at once, for any grade. Photos are downsized in the browser (sharper text
// for the AI, faster on mobile data), then every file goes straight to
// private storage through a signed URL from POST /api/uploads.
// The parent only ever sees friendly names and thumbnails; the caller gets
// back the upload ids to pass to a generator.

import { useRef, useState } from 'react'
import { Camera, FileText, Loader2, Paperclip, X } from 'lucide-react'
import { createBrowserClient } from '@/lib/supabase'
import { FunLine } from '@/components/FunLoader'
import { UPLOAD_ACCEPT, UPLOAD_BUCKET, MAX_UPLOADS_PER_GENERATION, MAX_UPLOAD_BYTES, IMAGE_TYPES } from '@/lib/uploads'

export interface UploadedMaterial { id: string; name: string; type: string; preview?: string }

const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
const MAX_SIDE = 2000

function guessType(f: File): string {
  if (f.type) return f.type
  const n = f.name.toLowerCase()
  if (n.endsWith('.pdf')) return 'application/pdf'
  if (n.endsWith('.docx')) return DOCX
  if (n.endsWith('.txt')) return 'text/plain'
  if (n.endsWith('.heic') || n.endsWith('.heif')) return 'image/heic'
  return ''
}

// Re-encode any photo the browser can open as a JPEG, longest side ≤ MAX_SIDE.
async function prepareImage(f: File): Promise<File> {
  const url = URL.createObjectURL(f)
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url
    })
    const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight))
    const w = Math.round(img.naturalWidth * scale), h = Math.round(img.naturalHeight * scale)
    const c = document.createElement('canvas'); c.width = w; c.height = h
    const ctx = c.getContext('2d')!
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h)
    ctx.drawImage(img, 0, 0, w, h)
    const blob: Blob = await new Promise((res, rej) => c.toBlob(b => (b ? res(b) : rej(new Error('encode'))), 'image/jpeg', 0.86))
    return new File([blob], f.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' })
  } finally {
    URL.revokeObjectURL(url)
  }
}

export function MaterialUpload({
  value, onChange, he = false, max = MAX_UPLOADS_PER_GENERATION, compact = false, autoRead = false,
}: {
  value: UploadedMaterial[]
  onChange: (next: UploadedMaterial[]) => void
  he?: boolean
  max?: number
  compact?: boolean
  // read each page right after upload (Create), so planning later is fast
  autoRead?: boolean
}) {
  const [readState, setReadState] = useState<Record<string, 'reading' | 'ready' | 'failed'>>({})
  const fileRef = useRef<HTMLInputElement>(null)
  const camRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [drag, setDrag] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const L = (en: string, hebrew: string) => (he ? hebrew : en)

  async function addFiles(list: FileList | File[] | null) {
    const files = Array.from(list || [])
    if (!files.length) return
    setError(null)
    const room = max - value.length
    if (room <= 0) { setError(L(`Up to ${max} files at a time.`, `אפשר עד ${max} קבצים בכל פעם.`)); return }
    const chosen = files.slice(0, room)
    setBusy(true)
    try {
      const prepared: { file: File; type: string; preview?: string }[] = []
      for (const f of chosen) {
        let type = guessType(f)
        let file = f
        if (type.startsWith('image/')) {
          try { file = await prepareImage(f); type = 'image/jpeg' } catch {
            if (!IMAGE_TYPES.includes(type)) {
              setError(L(`Couldn't open "${f.name}". Please send photos as JPG or PNG (on iPhone: Settings → Camera → Formats → Most Compatible).`,
                `לא הצלחנו לפתוח את "${f.name}". שלחו תמונות כ-JPG או PNG (באייפון: הגדרות ← מצלמה ← פורמטים ← "הכי תואם").`))
              continue
            }
          }
        } else if (!['application/pdf', DOCX, 'text/plain'].includes(type)) {
          setError(L(`"${f.name}" isn't supported. Use photos, PDF, Word (.docx) or text files.`, `"${f.name}" לא נתמך. אפשר תמונות, PDF, וורד (‎.docx‎) או קובץ טקסט.`))
          continue
        }
        if (file.size > MAX_UPLOAD_BYTES) {
          setError(L(`"${f.name}" is over ${MAX_UPLOAD_BYTES / 1024 / 1024}MB.`, `"${f.name}" גדול מ-${MAX_UPLOAD_BYTES / 1024 / 1024}MB.`))
          continue
        }
        prepared.push({ file, type, preview: type.startsWith('image/') ? URL.createObjectURL(file) : undefined })
      }
      if (!prepared.length) return

      const res = await fetch('/api/uploads', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: prepared.map(p => ({ name: p.file.name, type: p.type, size: p.file.size })) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'upload failed')

      // 4 uploads at a time, in the parent's order
      const supabase = createBrowserClient()
      const done: (UploadedMaterial | null)[] = new Array(prepared.length).fill(null)
      let next = 0, finished = 0
      setProgress({ done: 0, total: prepared.length })
      async function worker() {
        while (next < prepared.length) {
          const i = next++
          const u = data.uploads[i]
          const { error: upErr } = await supabase.storage.from(UPLOAD_BUCKET)
            .uploadToSignedUrl(u.path, u.token, prepared[i].file, { contentType: prepared[i].type })
          if (upErr) setError(L(`Upload failed for "${u.name}". Try again.`, `ההעלאה של "${u.name}" נכשלה. נסו שוב.`))
          else done[i] = { id: u.id, name: u.name, type: prepared[i].type, preview: prepared[i].preview }
          setProgress({ done: ++finished, total: prepared.length })
        }
      }
      await Promise.all(Array.from({ length: Math.min(4, prepared.length) }, worker))
      const added = done.filter((x): x is UploadedMaterial => !!x)
      onChange([...value, ...added])
      if (autoRead) {
        // fire and forget, 4 at a time; the plan step reads anything still missing
        setReadState(st => ({ ...st, ...Object.fromEntries(added.map(a => [a.id, 'reading' as const])) }))
        let k = 0
        const readWorker = async () => {
          while (k < added.length) {
            const a = added[k++]
            const r = await fetch(`/api/uploads/${a.id}/read`, { method: 'POST' }).catch(() => null)
            setReadState(st => ({ ...st, [a.id]: r && r.ok ? 'ready' : 'failed' }))
          }
        }
        for (let w = 0; w < Math.min(4, added.length); w++) readWorker()
      }
    } catch (e: any) {
      setError(L('Upload failed. Check the connection and try again.', 'ההעלאה נכשלה. בדקו את החיבור ונסו שוב.'))
    } finally {
      setBusy(false); setProgress(null)
      if (fileRef.current) fileRef.current.value = ''
      if (camRef.current) camRef.current.value = ''
    }
  }

  const btn = 'inline-flex items-center gap-2 min-h-[44px] px-4 rounded-xl border border-[#2F5BE333] bg-white text-[#2F5BE3] text-sm font-semibold hover:bg-[#EAF0FF] disabled:opacity-50'

  return (
    <div dir={he ? 'rtl' : 'ltr'}>
      <div
        onDragOver={e => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={e => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files) }}
        className={`rounded-2xl border-2 border-dashed ${drag ? 'border-[#2F5BE3] bg-[#EAF0FF]' : 'border-[#2F5BE333] bg-[#F7F4EE]'} ${compact ? 'p-3' : 'p-4'}`}
      >
        {!compact && (
          <p className="text-sm text-[#33415F] mb-3 leading-relaxed">
            {L('Add the child\'s own material: workbook or textbook pages, a worksheet, an exam material list. Photos, PDF, Word or text, up to ' + max + ' files.',
               'הוסיפו חומר של הילד/ה: עמודים מחוברת העבודה או מהספר, דף עבודה, רשימת חומר למבחן. תמונות, PDF, וורד או טקסט, עד ' + max + ' קבצים.')}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <button type="button" className={btn} disabled={busy || value.length >= max} onClick={() => fileRef.current?.click()}>
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Paperclip size={16} />} {L('Choose files', 'בחירת קבצים')}
          </button>
          <button type="button" className={`${btn} md:hidden`} disabled={busy || value.length >= max} onClick={() => camRef.current?.click()}>
            <Camera size={16} /> {L('Take a photo', 'צילום')}
          </button>
          <span className="hidden md:inline-flex items-center text-xs text-[#5E6B85]">{L('or drag files here', 'או גררו קבצים לכאן')}</span>
        </div>
        {busy && (
          <div className="mt-3 rounded-xl bg-white border border-[#E8E2D6] px-3 py-2 text-sm text-[#2F5BE3] font-semibold flex items-center gap-2">
            <Loader2 size={16} className="animate-spin" />
            {he ? <FunLine kind="upload" /> : 'Uploading…'}
            {progress && <span className="ms-auto text-xs text-[#4A5672]" dir="ltr">{progress.done}/{progress.total}</span>}
          </div>
        )}
        <input ref={fileRef} type="file" multiple accept={UPLOAD_ACCEPT} className="hidden" onChange={e => addFiles(e.target.files)} />
        <input ref={camRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => addFiles(e.target.files)} />

        {value.length > 0 && (
          <ul className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {value.map((m, i) => (
              <li key={m.id} className="relative rounded-xl border border-[#E8E2D6] bg-white overflow-hidden">
                {m.preview
                  ? <img src={m.preview} alt={m.name} className="w-full h-24 object-cover" />
                  : <div className="h-24 flex items-center justify-center text-[#2F5BE3]"><FileText size={30} /></div>}
                <div className="px-2 py-1 text-[11px] text-[#33415F] truncate" title={m.name}>{i + 1}. {m.name}</div>
                {autoRead && readState[m.id] && (
                  <div className={`px-2 pb-1 text-[10px] font-bold ${readState[m.id] === 'ready' ? 'text-[#16A34A]' : readState[m.id] === 'failed' ? 'text-[#B45309]' : 'text-[#2F5BE3]'}`}>
                    {readState[m.id] === 'ready' ? (he ? 'נקרא ✓' : 'Read ✓') : readState[m.id] === 'failed' ? (he ? 'ננסה שוב בתכנון' : 'Will retry') : (he ? 'פיפ קורא…' : 'Reading…')}
                  </div>
                )}
                <button type="button" aria-label={L('Remove', 'הסרה')} onClick={() => onChange(value.filter(x => x.id !== m.id))}
                  className="absolute top-1 end-1 w-7 h-7 rounded-full bg-white/90 border border-[#E8E2D6] flex items-center justify-center text-[#5E6B85] hover:text-[#DC2626]">
                  <X size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {error && <p className="text-xs text-[#DC2626] mt-2">{error}</p>}
    </div>
  )
}
