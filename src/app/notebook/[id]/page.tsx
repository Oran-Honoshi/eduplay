'use client'
import { useState, useEffect, useCallback } from 'react'
import { createBrowserClient } from '@/lib/supabase'
import { ArrowLeft, Plus, FileText, Trash2, Unlink, Save, BookOpen, Notebook as NotebookIcon } from 'lucide-react'
import ParentHeaderBar from '@/components/ParentHeaderBar'
import { PARENT_COLORS } from '@/lib/parentTheme'
import { ParentModal, ParentModalFooter } from '@/components/ParentModal'
import { apiErrorText } from '@/lib/apiError'
import ApiErrorText from '@/components/ApiErrorText'

const supabase = createBrowserClient()

interface Subject { id: string; slug: string; label_en: string; min_grade: number; max_grade: number }
interface Topic { id: string; slug: string; title_en: string; grade: number }

interface SectionDetail {
  id: string
  title: string
  chapter_name: string | null
  subcategory_name: string | null
  tags: string[]
  body_text: string | null
  topic_id: string | null
  topic: { id: string; title_en: string; grade: number; subject: { label_en: string; slug: string } | null } | null
  curriculum_question_count: number | null
}

interface FileEntry {
  id: string
  media_type: string
  original_filename: string
  size_bytes: number
  created_at: string
  signed_url: string | null
}

interface LinkedQuestion {
  id: string
  added_via: 'manual' | 'generated'
  created_at: string
  question: {
    id: string
    prompt_en: string
    difficulty: string
    q_type: string
    topic: { title_en: string; grade: number; subject: { label_en: string; slug: string } | null } | null
  } | null
}

// Mirrors the bucket's allowed_mime_types/file_size_limit (checkpoint 1) and
// the server-side copy in api/notebook/sections/[id]/files/route.ts.
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf']
const MAX_FILE_BYTES = 10 * 1024 * 1024

// ── Primary discovery card ──────────────────────────────────────
function CurriculumDiscoveryCard({ section }: { section: SectionDetail }) {
  if (!section.topic_id || section.curriculum_question_count === null) return null
  return (
    <div className="bg-[#E4F3F1] border border-[#0F766E33] rounded-2xl p-4 flex items-center justify-between gap-4">
      <div className="text-sm text-[#0B5C56]">
        <strong>{section.curriculum_question_count}</strong> approved question{section.curriculum_question_count === 1 ? '' : 's'} already
        exist{section.curriculum_question_count === 1 ? 's' : ''} in the curriculum bank for <strong>{section.topic?.title_en}</strong>.
      </div>
      <button onClick={() => window.location.href = '/questions'}
        className="shrink-0 flex items-center gap-1.5 text-xs font-bold text-white bg-[#0F766E] hover:bg-[#0B5C56] rounded-lg px-3 py-1.5">
        Browse Library <BookOpen size={12} />
      </button>
    </div>
  )
}

// ── Secondary discovery card ─────────────────────────────────────
// Count-only cross-family signal (checkpoint 7): renders nothing at all
// below the API's own suppression threshold — no "0 matches" state, since
// that would still leak "you're below the threshold" information the
// endpoint is designed to hide.
function SecondaryDiscoveryCard({ section }: { section: SectionDetail }) {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    const hasSignal = !!(section.chapter_name || section.subcategory_name || (section.tags && section.tags.length > 0))
    if (!hasSignal) { setCount(null); return }

    const params = new URLSearchParams()
    if (section.chapter_name) params.set('chapterName', section.chapter_name)
    if (section.subcategory_name) params.set('subcategoryName', section.subcategory_name)
    if (section.tags && section.tags.length > 0) params.set('tags', section.tags.join(','))

    let cancelled = false
    fetch(`/api/notebook/discovery?${params.toString()}`)
      .then(r => r.json())
      .then(data => { if (!cancelled) setCount(typeof data.count === 'number' ? data.count : null) })
    return () => { cancelled = true }
  }, [section.chapter_name, section.subcategory_name, section.tags])

  if (!count || count <= 0) return null

  return (
    <div className="bg-[#FFF3D6] border border-[#E0A92733] rounded-2xl p-4 text-sm text-[#B7862F]">
      <strong>{count}</strong> other families have similar notebook content for this chapter, subcategory, and tags.
    </div>
  )
}

// ── File gallery ──────────────────────────────────────────────
function FileGallery({ sectionId, files, onChanged }: { sectionId: string; files: FileEntry[]; onChanged: () => void }) {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploadError(null)

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setUploadError('Only JPG, PNG, or PDF files are supported.')
      return
    }
    if (file.size > MAX_FILE_BYTES) {
      setUploadError(`File is too large — max ${MAX_FILE_BYTES / 1024 / 1024}MB.`)
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch(`/api/notebook/sections/${sectionId}/files`, { method: 'POST', body: formData })
    const data = await res.json()
    setUploading(false)
    if (!res.ok) { setUploadError(apiErrorText(res.status, data.error, 'Upload failed')); return }
    onChanged()
  }

  const remove = async (fileId: string) => {
    setDeletingId(fileId)
    const res = await fetch(`/api/notebook/sections/${sectionId}/files/${fileId}`, { method: 'DELETE' })
    setDeletingId(null)
    if (!res.ok) {
      const data = await res.json()
      setUploadError(apiErrorText(res.status, data.error, 'Failed to delete file'))
      return
    }
    onChanged()
  }

  return (
    <div className="bg-white rounded-2xl border border-[rgba(15,118,110,.14)] p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-[#1f2a28]">Files</h3>
        <label className="flex items-center gap-1.5 text-xs font-bold text-white bg-[#0F766E] hover:bg-[#0B5C56] rounded-lg px-3 py-1.5 cursor-pointer">
          <Plus size={12} /> {uploading ? 'Uploading…' : 'Upload File'}
          <input type="file" accept={ALLOWED_FILE_TYPES.join(',')} onChange={handleFileChange} disabled={uploading} className="hidden" />
        </label>
      </div>
      {uploadError && <div className="text-xs text-[#DC2626] font-semibold"><ApiErrorText text={uploadError} /></div>}
      {files.length === 0 && <div className="text-xs text-[#9aa6a3]">No files uploaded yet.</div>}
      <div className="grid grid-cols-3 gap-3">
        {files.map(f => (
          <div key={f.id} className="border border-[rgba(15,118,110,.14)] rounded-xl p-2 flex flex-col gap-1">
            {f.media_type.startsWith('image/') && f.signed_url ? (
              <a href={f.signed_url} target="_blank" rel="noreferrer">
                <img src={f.signed_url} alt={f.original_filename} className="w-full h-24 object-cover rounded-lg" />
              </a>
            ) : (
              <a href={f.signed_url || '#'} target="_blank" rel="noreferrer"
                className="w-full h-24 flex items-center justify-center bg-[#F7F5F0] rounded-lg">
                <FileText size={28} color={PARENT_COLORS.textMuted} />
              </a>
            )}
            <div className="text-xs text-[#7a8f8b] truncate" title={f.original_filename}>{f.original_filename}</div>
            <div className="text-[10px] text-[#9aa6a3]">{(f.size_bytes / 1024).toFixed(0)} KB</div>
            <button onClick={() => remove(f.id)} disabled={deletingId === f.id}
              className="flex items-center justify-center gap-1 text-xs font-bold text-[#DC2626] hover:bg-[#FFF5F5] disabled:opacity-50 rounded-lg py-1">
              <Trash2 size={11} /> {deletingId === f.id ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Recipe editor ────────────────────────────────────────────────
// Single textarea, manual edit only — no AI-assist seeding (v1 decision).
// Feeds the generator prompt in a later checkpoint.
function RecipeEditor({ sectionId }: { sectionId: string }) {
  const [promptText, setPromptText] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/notebook/sections/${sectionId}/recipe`)
      .then(r => r.json())
      .then(data => {
        setPromptText(data.recipe?.prompt_text || '')
        setSavedAt(data.recipe?.updated_at || null)
      })
      .finally(() => setLoading(false))
  }, [sectionId])

  const save = async () => {
    setSaving(true)
    setError(null)
    const res = await fetch(`/api/notebook/sections/${sectionId}/recipe`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ promptText }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(apiErrorText(res.status, data.error, 'Failed to save recipe')); return }
    setPromptText(data.recipe?.prompt_text || '')
    setSavedAt(data.recipe?.updated_at || null)
  }

  return (
    <div className="bg-white rounded-2xl border border-[rgba(15,118,110,.14)] p-4 flex flex-col gap-3">
      <h3 className="text-sm font-black text-[#1f2a28]">Recipe</h3>
      <p className="text-xs text-[#9aa6a3]">
        Free-text instructions for the question generator (e.g. style, focus, constraints). Edited manually — nothing here is auto-filled.
      </p>
      {loading ? (
        <div className="text-xs text-[#9aa6a3]">Loading…</div>
      ) : (
        <textarea value={promptText} onChange={e => setPromptText(e.target.value)} rows={6}
          placeholder="e.g. Focus on two-digit subtraction with borrowing. Use word problems about snacks and toys."
          className="border border-[rgba(15,118,110,.14)] rounded-lg px-3 py-2 text-sm" />
      )}
      {error && <div className="text-xs text-[#DC2626] font-semibold"><ApiErrorText text={error} /></div>}
      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving || loading}
          className="flex items-center gap-1.5 text-xs font-bold text-white bg-[#0F766E] hover:bg-[#0B5C56] disabled:opacity-50 rounded-lg px-3 py-1.5">
          <Save size={12} /> {saving ? 'Saving…' : 'Save Recipe'}
        </button>
        {savedAt && !saving && <span className="text-[10px] text-[#9aa6a3]">Last saved {new Date(savedAt).toLocaleString()}</span>}
      </div>
    </div>
  )
}

// ── Linked questions list ────────────────────────────────────────
function LinkedQuestionsList({ sectionId, links, onChanged }: { sectionId: string; links: LinkedQuestion[]; onChanged: () => void }) {
  const [unlinkingId, setUnlinkingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const unlink = async (linkId: string) => {
    setUnlinkingId(linkId)
    const res = await fetch(`/api/notebook/sections/${sectionId}/questions/${linkId}`, { method: 'DELETE' })
    setUnlinkingId(null)
    if (!res.ok) {
      const data = await res.json()
      setError(apiErrorText(res.status, data.error, 'Failed to unlink question'))
      return
    }
    onChanged()
  }

  return (
    <div className="bg-white rounded-2xl border border-[rgba(15,118,110,.14)] p-4 flex flex-col gap-3">
      <h3 className="text-sm font-black text-[#1f2a28]">Linked Questions</h3>
      <p className="text-xs text-[#9aa6a3]">Add questions from the Library tab's "Add to Notebook Section" action.</p>
      {error && <div className="text-xs text-[#DC2626] font-semibold"><ApiErrorText text={error} /></div>}
      {links.length === 0 && <div className="text-xs text-[#9aa6a3]">No questions linked yet.</div>}
      <div className="flex flex-col gap-2">
        {links.map(link => (
          <div key={link.id} className="border border-[rgba(15,118,110,.14)] rounded-xl p-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[10px] font-semibold text-[#9aa6a3] mb-1">
                {link.question?.topic?.subject?.label_en || '—'} · {link.question?.topic?.title_en || '—'} · {link.question?.difficulty} · {link.added_via === 'generated' ? '✨ generated' : 'manual'}
              </div>
              <div className="text-sm text-[#1f2a28] truncate">{link.question?.prompt_en || '(question no longer available)'}</div>
            </div>
            <button onClick={() => unlink(link.id)} disabled={unlinkingId === link.id}
              className="shrink-0 flex items-center gap-1 text-xs font-bold text-[#DC2626] hover:bg-[#FFF5F5] disabled:opacity-50 rounded-lg px-2 py-1">
              <Unlink size={11} /> {unlinkingId === link.id ? 'Removing…' : 'Unlink'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function NotebookSectionPage({ params }: { params: { id: string } }) {
  const [section, setSection] = useState<SectionDetail | null>(null)
  const [files, setFiles] = useState<FileEntry[]>([])
  const [linkedQuestions, setLinkedQuestions] = useState<LinkedQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)

  const [title, setTitle] = useState('')
  const [chapterName, setChapterName] = useState('')
  const [subcategoryName, setSubcategoryName] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [bodyText, setBodyText] = useState('')

  const [subjects, setSubjects] = useState<Subject[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [subjectSlug, setSubjectSlug] = useState('')
  const [grade, setGrade] = useState(0)
  const [topicId, setTopicId] = useState('')

  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    fetch(`/api/notebook/sections/${params.id}`)
      .then(async r => {
        // A true 404 (section doesn't exist) and a cross-family-ownership 403
        // (section belongs to a different family) are both folded into
        // "not found" — the API returns the identical body/status for an
        // ownership mismatch as for a session-expiry 403, so they can't be
        // told apart here; "not found" is the safer default (never confirms
        // a section exists to someone who doesn't own it). A 401 is
        // unambiguous, though, so that gets the real session-expired message.
        if (r.status === 404 || r.status === 403) { setNotFound(true); return null }
        if (r.status === 401) {
          const data = await r.json()
          setError(apiErrorText(r.status, data.error, data.error))
          return null
        }
        return r.json()
      })
      .then(data => {
        if (!data) return
        if (data.error) { setError(data.error); return }
        const s: SectionDetail = data.section
        setSection(s)
        setFiles(data.files || [])
        setLinkedQuestions(data.linked_questions || [])
        setTitle(s.title)
        setChapterName(s.chapter_name || '')
        setSubcategoryName(s.subcategory_name || '')
        setTagsInput((s.tags || []).join(', '))
        setBodyText(s.body_text || '')
        setTopicId(s.topic_id || '')
        if (s.topic) {
          setSubjectSlug(s.topic.subject?.slug || '')
          setGrade(s.topic.grade)
        }
      })
      .finally(() => setLoading(false))
  }, [params.id])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    supabase.from('subjects').select('*').order('sort_order').then(({ data }) => setSubjects(data || []))
  }, [])

  useEffect(() => {
    if (!subjectSlug) { setTopics([]); return }
    fetch(`/api/topics?subject=${subjectSlug}&grade=${grade}`)
      .then(r => r.json())
      .then(data => setTopics(data.topics || []))
  }, [subjectSlug, grade])

  const selectedSubject = subjects.find(s => s.slug === subjectSlug)
  const gradeOptions = selectedSubject
    ? Array.from({ length: selectedSubject.max_grade - selectedSubject.min_grade + 1 }, (_, i) => selectedSubject.min_grade + i)
    : [0, 1, 2, 3, 4, 5, 6]

  const save = async () => {
    if (!title.trim()) { setSaveError('Title is required'); return }
    setSaving(true)
    setSaveError(null)
    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean)
    const res = await fetch(`/api/notebook/sections/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        chapterName: chapterName || null,
        subcategoryName: subcategoryName || null,
        tags,
        bodyText: bodyText || null,
        topicId: topicId || null,
      }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setSaveError(apiErrorText(res.status, data.error, 'Failed to save')); return }
    load()
  }

  const remove = async () => {
    setDeleting(true)
    const res = await fetch(`/api/notebook/sections/${params.id}`, { method: 'DELETE' })
    if (res.ok) { window.location.href = '/notebook'; return }
    setDeleting(false)
    setConfirmingDelete(false)
    const data = await res.json()
    setSaveError(apiErrorText(res.status, data.error, 'Failed to delete'))
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#F7F5F0] flex items-center justify-center font-[Manrope]">
        <div className="text-sm text-[#9aa6a3]">Section not found.</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F7F5F0] font-[Manrope]">
      <ParentHeaderBar
        center={<span className="text-sm font-semibold text-[#9aa6a3]">/ Notebook Section</span>}
        right={
          <button onClick={() => window.location.href = '/notebook'}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#7a8f8b] border border-[rgba(15,118,110,.14)] rounded-lg px-3 py-1.5 hover:bg-[#F7F5F0]">
            <ArrowLeft size={12} /> Notebook
          </button>
        }
      />

      <div className="max-w-4xl mx-auto px-6 py-6 flex flex-col gap-4">
        <h1 className="flex items-center gap-2 text-xl font-extrabold text-[#1f2a28]">
          <NotebookIcon size={18} color={PARENT_COLORS.primary} /> Notebook Section
        </h1>
        {loading && <div className="text-sm text-[#9aa6a3]">Loading…</div>}
        {error && <div className="text-sm text-[#DC2626] font-semibold"><ApiErrorText text={error} /></div>}

        {section && (
          <>
            {section.topic_id && <CurriculumDiscoveryCard section={section} />}

            <SecondaryDiscoveryCard section={section} />

            <FileGallery sectionId={params.id} files={files} onChanged={load} />

            <LinkedQuestionsList sectionId={params.id} links={linkedQuestions} onChanged={load} />

            <RecipeEditor sectionId={params.id} />

            <div className="bg-white rounded-2xl border border-[rgba(15,118,110,.14)] p-4 flex flex-col gap-3">
              <label className="text-xs font-semibold text-[#9aa6a3]">Title</label>
              <input value={title} onChange={e => setTitle(e.target.value)}
                className="border border-[rgba(15,118,110,.14)] rounded-lg px-3 py-2 text-sm" />

              <div className="flex gap-2">
                <div className="flex-1 flex flex-col gap-1">
                  <label className="text-xs font-semibold text-[#9aa6a3]">Chapter</label>
                  <input value={chapterName} onChange={e => setChapterName(e.target.value)}
                    className="border border-[rgba(15,118,110,.14)] rounded-lg px-3 py-2 text-sm" />
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <label className="text-xs font-semibold text-[#9aa6a3]">Subcategory</label>
                  <input value={subcategoryName} onChange={e => setSubcategoryName(e.target.value)}
                    className="border border-[rgba(15,118,110,.14)] rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>

              <label className="text-xs font-semibold text-[#9aa6a3]">Tags (comma separated)</label>
              <input value={tagsInput} onChange={e => setTagsInput(e.target.value)}
                className="border border-[rgba(15,118,110,.14)] rounded-lg px-3 py-2 text-sm" />

              <label className="text-xs font-semibold text-[#9aa6a3]">Notes</label>
              <textarea value={bodyText} onChange={e => setBodyText(e.target.value)} rows={8}
                className="border border-[rgba(15,118,110,.14)] rounded-lg px-3 py-2 text-sm" />

              <label className="text-xs font-semibold text-[#9aa6a3]">Link to curriculum topic (optional — powers the discovery card above)</label>
              <div className="flex gap-2">
                <select value={subjectSlug} onChange={e => { setSubjectSlug(e.target.value); setTopicId('') }}
                  className="flex-1 border border-[rgba(15,118,110,.14)] rounded-lg px-3 py-2 text-sm">
                  <option value="">— no subject —</option>
                  {subjects.map(s => <option key={s.slug} value={s.slug}>{s.label_en}</option>)}
                </select>
                <select value={grade} onChange={e => { setGrade(parseInt(e.target.value)); setTopicId('') }}
                  disabled={!subjectSlug}
                  className="border border-[rgba(15,118,110,.14)] rounded-lg px-3 py-2 text-sm">
                  {gradeOptions.map(g => <option key={g} value={g}>{g === 0 ? 'K' : `Grade ${g}`}</option>)}
                </select>
                <select value={topicId} onChange={e => setTopicId(e.target.value)}
                  disabled={!subjectSlug}
                  className="flex-1 border border-[rgba(15,118,110,.14)] rounded-lg px-3 py-2 text-sm">
                  <option value="">— no topic —</option>
                  {topics.map(t => <option key={t.id} value={t.id}>{t.title_en}</option>)}
                </select>
              </div>

              {saveError && <div className="text-xs text-[#DC2626] font-semibold"><ApiErrorText text={saveError} /></div>}

              <div className="flex gap-2">
                <button onClick={save} disabled={saving}
                  className="flex items-center gap-1.5 text-sm font-bold text-white bg-[#0F766E] hover:bg-[#0B5C56] disabled:opacity-50 rounded-xl px-4 py-2">
                  <Save size={13} /> {saving ? 'Saving…' : 'Save'}
                </button>
                <button onClick={() => setConfirmingDelete(true)} disabled={deleting}
                  className="flex items-center gap-1.5 text-sm font-bold text-[#DC2626] hover:bg-[#FFF5F5] disabled:opacity-50 rounded-xl px-4 py-2">
                  <Trash2 size={13} /> {deleting ? 'Deleting…' : 'Delete Section'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      {confirmingDelete && (
        <ParentModal
          variant="danger"
          eyebrowText="Delete section"
          title={`Delete "${section?.title}"?`}
          description="This removes the section, its files, and its linked questions. This cannot be undone."
          onCancel={() => setConfirmingDelete(false)}
        >
          <ParentModalFooter
            variant="danger"
            confirmLabel="Delete"
            confirmingLabel="Deleting…"
            confirming={deleting}
            onConfirm={remove}
            onCancel={() => setConfirmingDelete(false)}
          />
        </ParentModal>
      )}
    </div>
  )
}
