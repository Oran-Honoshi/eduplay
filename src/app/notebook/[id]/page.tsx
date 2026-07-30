'use client'
import { useState, useEffect, useCallback } from 'react'
import { createBrowserClient } from '@/lib/supabase'

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

// ── Primary discovery card ──────────────────────────────────────
function CurriculumDiscoveryCard({ section }: { section: SectionDetail }) {
  if (!section.topic_id || section.curriculum_question_count === null) return null
  return (
    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center justify-between gap-4">
      <div className="text-sm text-emerald-800">
        <strong>{section.curriculum_question_count}</strong> approved question{section.curriculum_question_count === 1 ? '' : 's'} already
        exist{section.curriculum_question_count === 1 ? 's' : ''} in the curriculum bank for <strong>{section.topic?.title_en}</strong>.
      </div>
      <button onClick={() => window.location.href = '/questions'}
        className="shrink-0 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg px-3 py-1.5">
        Browse Library →
      </button>
    </div>
  )
}

export default function NotebookSectionPage({ params }: { params: { id: string } }) {
  const [section, setSection] = useState<SectionDetail | null>(null)
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

  const load = useCallback(() => {
    setLoading(true)
    fetch(`/api/notebook/sections/${params.id}`)
      .then(async r => {
        if (r.status === 404 || r.status === 403) { setNotFound(true); return null }
        return r.json()
      })
      .then(data => {
        if (!data) return
        if (data.error) { setError(data.error); return }
        const s: SectionDetail = data.section
        setSection(s)
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
    if (!res.ok) { setSaveError(data.error || 'Failed to save'); return }
    load()
  }

  const remove = async () => {
    if (!confirm('Delete this section? This cannot be undone.')) return
    setDeleting(true)
    const res = await fetch(`/api/notebook/sections/${params.id}`, { method: 'DELETE' })
    if (res.ok) { window.location.href = '/notebook'; return }
    setDeleting(false)
    const data = await res.json()
    setSaveError(data.error || 'Failed to delete')
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center font-[Nunito]">
        <div className="text-sm text-gray-400">Section not found.</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 font-[Nunito]">
      <div className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <h1 className="text-xl font-black text-gray-900">🗂️ Notebook Section</h1>
          <button onClick={() => window.location.href = '/notebook'}
            className="text-xs font-semibold text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50">
            ← Notebook
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6 flex flex-col gap-4">
        {loading && <div className="text-sm text-gray-400">Loading…</div>}
        {error && <div className="text-sm text-red-500 font-semibold">{error}</div>}

        {section && (
          <>
            {section.topic_id && <CurriculumDiscoveryCard section={section} />}

            <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col gap-3">
              <label className="text-xs font-semibold text-gray-400">Title</label>
              <input value={title} onChange={e => setTitle(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />

              <div className="flex gap-2">
                <div className="flex-1 flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-400">Chapter</label>
                  <input value={chapterName} onChange={e => setChapterName(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-400">Subcategory</label>
                  <input value={subcategoryName} onChange={e => setSubcategoryName(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>

              <label className="text-xs font-semibold text-gray-400">Tags (comma separated)</label>
              <input value={tagsInput} onChange={e => setTagsInput(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />

              <label className="text-xs font-semibold text-gray-400">Notes</label>
              <textarea value={bodyText} onChange={e => setBodyText(e.target.value)} rows={8}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />

              <label className="text-xs font-semibold text-gray-400">Link to curriculum topic (optional — powers the discovery card above)</label>
              <div className="flex gap-2">
                <select value={subjectSlug} onChange={e => { setSubjectSlug(e.target.value); setTopicId('') }}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm">
                  <option value="">— no subject —</option>
                  {subjects.map(s => <option key={s.slug} value={s.slug}>{s.label_en}</option>)}
                </select>
                <select value={grade} onChange={e => { setGrade(parseInt(e.target.value)); setTopicId('') }}
                  disabled={!subjectSlug}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
                  {gradeOptions.map(g => <option key={g} value={g}>{g === 0 ? 'K' : `Grade ${g}`}</option>)}
                </select>
                <select value={topicId} onChange={e => setTopicId(e.target.value)}
                  disabled={!subjectSlug}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm">
                  <option value="">— no topic —</option>
                  {topics.map(t => <option key={t.id} value={t.id}>{t.title_en}</option>)}
                </select>
              </div>

              {saveError && <div className="text-xs text-red-500 font-semibold">{saveError}</div>}

              <div className="flex gap-2">
                <button onClick={save} disabled={saving}
                  className="text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 rounded-xl px-4 py-2">
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button onClick={remove} disabled={deleting}
                  className="text-sm font-bold text-red-500 hover:bg-red-50 disabled:opacity-50 rounded-xl px-4 py-2">
                  {deleting ? 'Deleting…' : 'Delete Section'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
