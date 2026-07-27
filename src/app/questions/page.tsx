'use client'
import { useState, useEffect, useCallback } from 'react'
import { createBrowserClient } from '@/lib/supabase'

// ── Types ──────────────────────────────────────────────────────
interface Subject {
  id: string
  slug: string
  label_en: string
  min_grade: number
  max_grade: number
}

interface Topic {
  id: string
  slug: string
  title_en: string
  grade: number
}

interface GenerationRow {
  id: string
  subject_slug: string
  grade: number
  topic_slug: string
  q_types: string[]
  difficulty: string
  count: number
  progressive: boolean
  custom_prompt: string | null
  question_ids: string[]
  error: string | null
  created_at: string
}

interface Prefill {
  subjectSlug: string
  grade: number
  topicSlug: string
  qTypes: string[]
  difficulty: string
  count: number
  progressive: boolean
  customPrompt: string
}

// ── Constants ──────────────────────────────────────────────────
const supabase = createBrowserClient()
const MAX_COUNT = 20
const Q_TYPE_OPTIONS = [
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'word_problem', label: 'Word Problem' },
]

// ── Preferred-style control ──────────────────────────────────────
function StyleControl() {
  const [style, setStyle] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/family/settings')
      .then(r => r.json())
      .then(data => {
        setStyle(data.question_gen_style || '')
        setLoaded(true)
      })
  }, [])

  const save = async () => {
    setSaving(true)
    setSaved(false)
    await fetch('/api/family/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question_gen_style: style || null }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (!loaded) return null

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-2">
      <label className="text-xs text-gray-400 font-semibold shrink-0">Preferred style</label>
      <input
        type="text"
        value={style}
        onChange={e => setStyle(e.target.value)}
        placeholder="e.g. use real-world sports examples, keep wording short..."
        className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300"
      />
      <button onClick={save} disabled={saving}
        className="shrink-0 px-3 py-1.5 text-xs font-semibold text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 whitespace-nowrap">
        {saving ? 'Saving…' : saved ? '✅ Saved' : 'Save style'}
      </button>
    </div>
  )
}

// ── Generator Panel ───────────────────────────────────────────
function GeneratorPanel({ prefill, onGenerated }: { prefill: Prefill | null; onGenerated: () => void }) {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [subjectSlug, setSubjectSlug] = useState('')
  const [grade, setGrade] = useState(1)
  const [topicSlug, setTopicSlug] = useState('')
  const [qTypes, setQTypes] = useState<string[]>(['multiple_choice'])
  const [difficulty, setDifficulty] = useState('easy')
  const [count, setCount] = useState(5)
  const [progressive, setProgressive] = useState(false)
  const [customPrompt, setCustomPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  // Load subjects once, default to the first one
  useEffect(() => {
    supabase.from('subjects').select('*').order('sort_order').then(({ data }) => {
      setSubjects(data || [])
      setSubjectSlug(prev => prev || data?.[0]?.slug || '')
    })
  }, [])

  // Fetch topics whenever subject/grade changes (from either user input or a prefill)
  useEffect(() => {
    if (!subjectSlug) { setTopics([]); return }
    fetch(`/api/topics?subject=${subjectSlug}&grade=${grade}`)
      .then(r => r.json())
      .then(data => setTopics(data.topics || []))
  }, [subjectSlug, grade])

  // Apply a "make more like this" prefill — state only, never auto-submits.
  // The user still has to review the fields and click Generate themselves.
  useEffect(() => {
    if (!prefill) return
    setSubjectSlug(prefill.subjectSlug)
    setGrade(prefill.grade)
    setTopicSlug(prefill.topicSlug)
    setQTypes(prefill.qTypes)
    setDifficulty(prefill.difficulty)
    setCount(prefill.count)
    setProgressive(prefill.progressive)
    setCustomPrompt(prefill.customPrompt)
    setResult(null)
  }, [prefill])

  const selectedSubject = subjects.find(s => s.slug === subjectSlug)
  const gradeOptions = selectedSubject
    ? Array.from({ length: selectedSubject.max_grade - selectedSubject.min_grade + 1 }, (_, i) => selectedSubject.min_grade + i)
    : [0, 1, 2, 3, 4, 5, 6]

  const toggleQType = (v: string) => {
    setQTypes(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v])
  }

  const generate = async () => {
    setGenerating(true)
    setResult(null)
    try {
      const res = await fetch('/api/questions/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject_slug: subjectSlug,
          grade,
          topic_slug: topicSlug,
          q_types: qTypes,
          difficulty,
          count,
          progressive,
          custom_prompt: customPrompt || undefined,
        }),
      })
      const data = await res.json()
      if (data.success) {
        const n = data.inserted.length
        setResult(`✅ Generated ${n} question${n !== 1 ? 's' : ''}${data.warnings ? ` (${data.warnings.length} skipped — see history)` : ''} — saved for review.`)
        onGenerated()
      } else {
        setResult(`❌ Error: ${data.error}`)
      }
    } catch (e: any) {
      setResult(`❌ ${e.message}`)
    }
    setGenerating(false)
  }

  return (
    <div className="bg-white rounded-2xl border border-emerald-100 p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">✨</span>
        <h2 className="text-sm font-black text-gray-900">Generate New Questions</h2>
        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">AI</span>
      </div>

      <div className="flex flex-wrap gap-3 items-end mb-4">
        <div>
          <label className="text-xs text-gray-400 font-semibold block mb-1">Subject</label>
          <select value={subjectSlug} onChange={e => {
            const newSlug = e.target.value
            const s = subjects.find(x => x.slug === newSlug)
            setSubjectSlug(newSlug)
            setTopicSlug('')
            if (s && (grade < s.min_grade || grade > s.max_grade)) setGrade(s.min_grade)
          }}
            className="px-3 py-2 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300">
            {subjects.map(s => <option key={s.slug} value={s.slug}>{s.label_en}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-400 font-semibold block mb-1">Grade</label>
          <select value={grade} onChange={e => { setGrade(parseInt(e.target.value)); setTopicSlug('') }}
            className="px-3 py-2 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300">
            {gradeOptions.map(g => <option key={g} value={g}>{g === 0 ? 'KG' : `Grade ${g}`}</option>)}
          </select>
        </div>
        <div className="min-w-48">
          <label className="text-xs text-gray-400 font-semibold block mb-1">Topic</label>
          <select value={topicSlug} onChange={e => setTopicSlug(e.target.value)} disabled={topics.length === 0}
            className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300 disabled:bg-gray-50 disabled:text-gray-400">
            <option value="">{topics.length === 0 ? 'No topics for this grade' : 'Select a topic...'}</option>
            {topics.map(t => <option key={t.slug} value={t.slug}>{t.title_en}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-400 font-semibold block mb-1">Difficulty</label>
          <select value={difficulty} onChange={e => setDifficulty(e.target.value)}
            className="px-3 py-2 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300">
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-400 font-semibold block mb-1">Count</label>
          <input type="number" min={1} max={MAX_COUNT} value={count}
            onChange={e => setCount(Math.max(1, Math.min(MAX_COUNT, parseInt(e.target.value) || 1)))}
            className="w-20 px-3 py-2 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-4 items-center mb-4">
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 font-semibold">Question types</span>
          {Q_TYPE_OPTIONS.map(opt => (
            <label key={opt.value} className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={qTypes.includes(opt.value)} onChange={() => toggleQType(opt.value)} />
              {opt.label}
            </label>
          ))}
        </div>
        <label className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
          <input type="checkbox" checked={progressive} onChange={e => setProgressive(e.target.checked)} />
          Progressive difficulty
        </label>
      </div>

      <div className="mb-4">
        <label className="text-xs text-gray-400 font-semibold block mb-1">Custom instructions (optional)</label>
        <textarea value={customPrompt} onChange={e => setCustomPrompt(e.target.value)}
          rows={2} placeholder="e.g. focus on word problems involving money..."
          className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300"
        />
      </div>

      <button onClick={generate} disabled={generating || !topicSlug || qTypes.length === 0}
        className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold text-sm rounded-xl transition-colors">
        {generating ? '⏳ Generating...' : '✨ Generate'}
      </button>

      {result && (
        <p className="mt-3 text-xs font-semibold" style={{ color: result.startsWith('✅') ? '#065F46' : '#991B1B' }}>
          {result}
        </p>
      )}
    </div>
  )
}

// ── History List ──────────────────────────────────────────────
function HistoryList({ rows, onReuse }: { rows: GenerationRow[]; onReuse: (row: GenerationRow) => void }) {
  if (rows.length === 0) return null

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <h2 className="text-sm font-black text-gray-900 mb-3">Recent Generations</h2>
      <div className="flex flex-col divide-y divide-gray-50">
        {rows.map(row => (
          <div key={row.id} className="flex items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">
                {row.topic_slug} · Grade {row.grade} · {row.difficulty} · {row.q_types.join(', ')}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {new Date(row.created_at).toLocaleString()} · {row.question_ids.length}/{row.count} saved
                {row.error && <span className="text-amber-600"> · {row.error}</span>}
              </p>
            </div>
            <button onClick={() => onReuse(row)}
              className="shrink-0 text-xs font-semibold text-emerald-600 border border-emerald-200 rounded-lg px-3 py-1.5 hover:bg-emerald-50">
              Make more like this
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────
export default function QuestionsPage() {
  const [history, setHistory] = useState<GenerationRow[]>([])
  const [prefill, setPrefill] = useState<Prefill | null>(null)

  const loadHistory = useCallback(() => {
    fetch('/api/questions/generate')
      .then(r => r.json())
      .then(data => setHistory(data.generations || []))
  }, [])

  useEffect(() => { loadHistory() }, [loadHistory])

  return (
    <div className="min-h-screen bg-gray-50 font-[Nunito]">
      <div className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <h1 className="text-xl font-black text-gray-900">❓ Question Generator</h1>
          <button onClick={() => window.location.href = '/dashboard'}
            className="text-xs font-semibold text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50">
            ← Dashboard
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6 flex flex-col gap-6">
        <StyleControl />
        <GeneratorPanel prefill={prefill} onGenerated={loadHistory} />
        <HistoryList
          rows={history}
          onReuse={row => setPrefill({
            subjectSlug: row.subject_slug,
            grade: row.grade,
            topicSlug: row.topic_slug,
            qTypes: row.q_types,
            difficulty: row.difficulty,
            count: row.count,
            progressive: row.progressive,
            customPrompt: row.custom_prompt || '',
          })}
        />
      </div>
    </div>
  )
}
