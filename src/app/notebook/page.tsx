'use client'
import { useState, useEffect, useCallback } from 'react'

interface Section {
  id: string
  title: string
  chapter_name: string | null
  subcategory_name: string | null
  tags: string[]
  topic_id: string | null
  created_at: string
  updated_at: string
}

// ── New section form ────────────────────────────────────────────
function NewSectionForm({ onCreated }: { onCreated: (id: string) => void }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [chapterName, setChapterName] = useState('')
  const [subcategoryName, setSubcategoryName] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [bodyText, setBodyText] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reset = () => {
    setTitle(''); setChapterName(''); setSubcategoryName(''); setTagsInput(''); setBodyText(''); setError(null)
  }

  const submit = async () => {
    if (!title.trim()) { setError('Title is required'); return }
    setSaving(true)
    setError(null)
    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean)
    const res = await fetch('/api/notebook/sections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        chapterName: chapterName || undefined,
        subcategoryName: subcategoryName || undefined,
        tags,
        bodyText: bodyText || undefined,
      }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(data.error || 'Failed to create section'); return }
    reset()
    setOpen(false)
    onCreated(data.section.id)
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="self-start text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl px-4 py-2">
        + New Section
      </button>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col gap-3">
      <h3 className="text-sm font-black text-gray-900">New Section</h3>
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title"
        className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
      <div className="flex gap-2">
        <input value={chapterName} onChange={e => setChapterName(e.target.value)} placeholder="Chapter (e.g. Fractions)"
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
        <input value={subcategoryName} onChange={e => setSubcategoryName(e.target.value)} placeholder="Subcategory (e.g. Adding and Subtracting)"
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
      </div>
      <input value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="Tags, comma separated"
        className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
      <textarea value={bodyText} onChange={e => setBodyText(e.target.value)} placeholder="Notes..." rows={4}
        className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
      {error && <div className="text-xs text-red-500 font-semibold">{error}</div>}
      <div className="flex gap-2">
        <button onClick={submit} disabled={saving}
          className="text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 rounded-xl px-4 py-2">
          {saving ? 'Creating…' : 'Create'}
        </button>
        <button onClick={() => { reset(); setOpen(false) }}
          className="text-sm font-bold text-gray-500 rounded-xl px-4 py-2 hover:bg-gray-50">
          Cancel
        </button>
      </div>
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────
export default function NotebookPage() {
  const [sections, setSections] = useState<Section[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    fetch('/api/notebook/sections')
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); setSections([]) }
        else { setError(null); setSections(data.sections || []) }
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <div className="min-h-screen bg-gray-50 font-[Nunito]">
      <div className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <h1 className="text-xl font-black text-gray-900">🗂️ Notebook</h1>
          <button onClick={() => window.location.href = '/dashboard'}
            className="text-xs font-semibold text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50">
            ← Dashboard
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6 flex flex-col gap-4">
        <NewSectionForm onCreated={id => { window.location.href = `/notebook/${id}` }} />

        {error && <div className="text-sm text-red-500 font-semibold">{error}</div>}
        {loading && <div className="text-sm text-gray-400">Loading…</div>}
        {!loading && !error && sections.length === 0 && (
          <div className="text-sm text-gray-400">No sections yet — create your first one above.</div>
        )}

        <div className="flex flex-col gap-2">
          {sections.map(s => (
            <div key={s.id} onClick={() => window.location.href = `/notebook/${s.id}`}
              className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col gap-2 cursor-pointer hover:border-emerald-200">
              <div className="font-bold text-gray-900">{s.title}</div>
              <div className="flex gap-2 flex-wrap">
                {s.chapter_name && (
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-full px-2 py-0.5">{s.chapter_name}</span>
                )}
                {s.subcategory_name && (
                  <span className="text-xs font-semibold text-sky-700 bg-sky-50 rounded-full px-2 py-0.5">{s.subcategory_name}</span>
                )}
                {(s.tags || []).map(tag => (
                  <span key={tag} className="text-xs font-semibold text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">#{tag}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
