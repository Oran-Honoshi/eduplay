'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { createBrowserClient } from '@/lib/supabase'
import FractionText from '@/components/FractionText'
import { isDistinctHe } from '@/lib/text'
import {
  Sparkles, BookOpen, Eye, EyeOff, Paperclip, X, Check, UserPlus, FileText,
  Notebook as NotebookIcon, AlertTriangle, ArrowLeft, Loader2,
} from 'lucide-react'
import ParentHeaderBar from '@/components/ParentHeaderBar'
import { PARENT_COLORS } from '@/lib/parentTheme'

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
  language: 'en_only' | 'he_only' | 'bilingual'
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
  language: 'en_only' | 'he_only' | 'bilingual'
  customPrompt: string
}

interface PendingQuestion {
  id: string
  topic_id: string
  difficulty: string
  q_type: string
  prompt_en: string
  prompt_he: string | null
  options: { label: string; value_en: string; value_he: string | null; isCorrect: boolean }[] | null
  correct_answer: string
  hint_en: string | null
  hint_he: string | null
  explanation_en: string | null
  created_at: string
  topics: { title_en: string; grade: number; subjects: { label_en: string; slug: string } | null } | null
}

interface FamilyChild {
  id: string
  display_name: string
  grade: number
}

// ── Constants ──────────────────────────────────────────────────
const supabase = createBrowserClient()
const MAX_COUNT = 20
const Q_TYPE_OPTIONS = [
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'word_problem', label: 'Word Problem' },
]
// Mirrors the caps enforced server-side in api/questions/generate/route.ts —
// 3MB raw keeps base64+JSON under Vercel's ~4.5MB serverless request-body limit.
const ALLOWED_REFERENCE_TYPES = ['image/jpeg', 'image/png', 'application/pdf']
const MAX_REFERENCE_FILE_BYTES = 3 * 1024 * 1024

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
    <div className="bg-white rounded-2xl border border-[rgba(15,118,110,.14)] p-4 flex items-center gap-2">
      <label className="text-xs text-[#9aa6a3] font-semibold shrink-0">Preferred style</label>
      <input
        type="text"
        value={style}
        onChange={e => setStyle(e.target.value)}
        placeholder="e.g. use real-world sports examples, keep wording short..."
        className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-[rgba(15,118,110,.14)] bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E33]"
      />
      <button onClick={save} disabled={saving}
        className="shrink-0 px-3 py-1.5 text-xs font-semibold text-[#7a8f8b] border border-[rgba(15,118,110,.14)] rounded-lg hover:bg-[#F7F5F0] disabled:opacity-50 whitespace-nowrap">
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
  const [language, setLanguage] = useState<'en_only' | 'he_only' | 'bilingual'>('en_only')
  const languageTouched = useRef(false)
  const [customPrompt, setCustomPrompt] = useState('')
  const [referenceFile, setReferenceFile] = useState<{ media_type: string; data: string; name: string; size: number } | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
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

  // Default output language to Hebrew for the Hebrew subject, English otherwise —
  // unless the user (or a prefill) has already made an explicit choice.
  useEffect(() => {
    if (languageTouched.current) return
    setLanguage(subjectSlug === 'hebrew' ? 'he_only' : 'en_only')
  }, [subjectSlug])

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
    languageTouched.current = true
    setLanguage(prefill.language)
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // clear so re-selecting the same file still fires onChange
    if (!file) return
    setFileError(null)

    if (!ALLOWED_REFERENCE_TYPES.includes(file.type)) {
      setFileError('Only JPG, PNG, or PDF files are supported.')
      return
    }
    if (file.size > MAX_REFERENCE_FILE_BYTES) {
      setFileError(`File is too large — max ${MAX_REFERENCE_FILE_BYTES / 1024 / 1024}MB.`)
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1] || ''
      setReferenceFile({ media_type: file.type, data: base64, name: file.name, size: file.size })
    }
    reader.onerror = () => setFileError('Could not read that file — try again.')
    reader.readAsDataURL(file)
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
          language,
          custom_prompt: customPrompt || undefined,
          reference_file: referenceFile ? { media_type: referenceFile.media_type, data: referenceFile.data } : undefined,
        }),
      })
      const data = await res.json()
      if (data.success) {
        const n = data.inserted.length
        let skipNote = ''
        if (data.warnings?.length > 0) {
          const dupCount = data.warnings.filter((w: string) => w.includes('duplicate of an existing question')).length
          const otherCount = data.warnings.length - dupCount
          const parts = []
          if (dupCount > 0) parts.push(`${dupCount} skipped as duplicate${dupCount !== 1 ? 's' : ''} of existing questions`)
          if (otherCount > 0) parts.push(`${otherCount} skipped due to other errors — see history`)
          skipNote = ` (${parts.join('; ')})`
        }
        setResult(`✅ Generated ${n} question${n !== 1 ? 's' : ''}${skipNote} — saved for review.`)
        setReferenceFile(null)
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
    <div className="bg-white rounded-2xl border border-[#0F766E33] p-5">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={16} color={PARENT_COLORS.primary} />
        <h2 className="text-sm font-black text-[#1f2a28]">Generate New Questions</h2>
        <span className="text-xs bg-[#E4F3F1] text-[#0F766E] px-2 py-0.5 rounded-full font-semibold">AI</span>
      </div>

      <div className="flex flex-wrap gap-3 items-end mb-4">
        <div>
          <label className="text-xs text-[#9aa6a3] font-semibold block mb-1">Subject</label>
          <select value={subjectSlug} onChange={e => {
            const newSlug = e.target.value
            const s = subjects.find(x => x.slug === newSlug)
            setSubjectSlug(newSlug)
            setTopicSlug('')
            if (s && (grade < s.min_grade || grade > s.max_grade)) setGrade(s.min_grade)
          }}
            className="px-3 py-2 text-sm rounded-xl border border-[rgba(15,118,110,.14)] bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E33]">
            {subjects.map(s => <option key={s.slug} value={s.slug}>{s.label_en}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-[#9aa6a3] font-semibold block mb-1">Grade</label>
          <select value={grade} onChange={e => { setGrade(parseInt(e.target.value)); setTopicSlug('') }}
            className="px-3 py-2 text-sm rounded-xl border border-[rgba(15,118,110,.14)] bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E33]">
            {gradeOptions.map(g => <option key={g} value={g}>{g === 0 ? 'KG' : `Grade ${g}`}</option>)}
          </select>
        </div>
        <div className="min-w-48">
          <label className="text-xs text-[#9aa6a3] font-semibold block mb-1">Topic</label>
          <select value={topicSlug} onChange={e => setTopicSlug(e.target.value)} disabled={topics.length === 0}
            className="w-full px-3 py-2 text-sm rounded-xl border border-[rgba(15,118,110,.14)] bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E33] disabled:bg-[#F7F5F0] disabled:text-[#9aa6a3]">
            <option value="">{topics.length === 0 ? 'No topics for this grade' : 'Select a topic...'}</option>
            {topics.map(t => <option key={t.slug} value={t.slug}>{t.title_en}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-[#9aa6a3] font-semibold block mb-1">Difficulty</label>
          <select value={difficulty} onChange={e => setDifficulty(e.target.value)}
            className="px-3 py-2 text-sm rounded-xl border border-[rgba(15,118,110,.14)] bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E33]">
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-[#9aa6a3] font-semibold block mb-1">Count</label>
          <input type="number" min={1} max={MAX_COUNT} value={count}
            onChange={e => setCount(Math.max(1, Math.min(MAX_COUNT, parseInt(e.target.value) || 1)))}
            className="w-20 px-3 py-2 text-sm rounded-xl border border-[rgba(15,118,110,.14)] bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E33]"
          />
        </div>
        <div>
          <label className="text-xs text-[#9aa6a3] font-semibold block mb-1">Language</label>
          <select value={language} onChange={e => { languageTouched.current = true; setLanguage(e.target.value as 'en_only' | 'he_only' | 'bilingual') }}
            className="px-3 py-2 text-sm rounded-xl border border-[rgba(15,118,110,.14)] bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E33]">
            <option value="en_only">English</option>
            <option value="he_only">Hebrew</option>
            <option value="bilingual">Both</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 items-center mb-4">
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#9aa6a3] font-semibold">Question types</span>
          {Q_TYPE_OPTIONS.map(opt => (
            <label key={opt.value} className="flex items-center gap-1.5 text-sm text-[#1f2a28] cursor-pointer">
              <input type="checkbox" checked={qTypes.includes(opt.value)} onChange={() => toggleQType(opt.value)} />
              {opt.label}
            </label>
          ))}
        </div>
        <label className="flex items-center gap-1.5 text-sm text-[#1f2a28] cursor-pointer">
          <input type="checkbox" checked={progressive} onChange={e => setProgressive(e.target.checked)} />
          Progressive difficulty
        </label>
      </div>

      <div className="mb-4">
        <label className="text-xs text-[#9aa6a3] font-semibold block mb-1">Custom instructions (optional)</label>
        <textarea value={customPrompt} onChange={e => setCustomPrompt(e.target.value)}
          rows={2} placeholder="e.g. focus on word problems involving money..." dir="auto"
          className="w-full px-3 py-2 text-sm rounded-xl border border-[rgba(15,118,110,.14)] bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E33]"
        />
      </div>

      <div className="mb-4">
        <label className="text-xs text-[#9aa6a3] font-semibold block mb-1">Reference file (optional)</label>
        <p className="text-xs text-[#9aa6a3] mb-1.5">Upload a photo or PDF of a worksheet or textbook page — new questions will be modeled after its style, content, and difficulty.</p>
        {referenceFile ? (
          <div className="flex items-center gap-2 text-sm text-[#1f2a28] bg-[#F7F5F0] border border-[rgba(15,118,110,.14)] rounded-lg px-3 py-2 w-fit">
            <Paperclip size={13} color={PARENT_COLORS.textMuted} />
            <span>{referenceFile.name} ({(referenceFile.size / 1024).toFixed(0)}KB)</span>
            <button onClick={() => setReferenceFile(null)} className="text-[#9aa6a3] hover:text-[#7a8f8b]" aria-label="Remove file"><X size={13} /></button>
          </div>
        ) : (
          <input type="file" accept="image/jpeg,image/png,application/pdf" onChange={handleFileChange}
            className="text-sm text-[#7a8f8b] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-[#E4F3F1] file:text-[#0F766E] file:text-xs file:font-semibold file:cursor-pointer hover:file:bg-[#0F766E22] cursor-pointer"
          />
        )}
        {fileError && <p className="text-xs text-[#DC2626] mt-1">{fileError}</p>}
      </div>

      <button onClick={generate} disabled={generating || !topicSlug || qTypes.length === 0}
        className={`px-5 py-2 text-white font-bold text-sm rounded-xl transition-colors inline-flex items-center gap-2 ${
          generating ? 'bg-[#0F766E] cursor-wait' : 'bg-[#0F766E] hover:bg-[#0B5C56] disabled:bg-[#f0efe9] disabled:text-[#9aa6a3]'
        }`}>
        {generating
          ? <><Loader2 size={14} className="animate-spin" /> Generating…</>
          : <><Sparkles size={14} /> Generate</>
        }
      </button>

      {result && (
        <p className="mt-3 text-xs font-semibold" style={{ color: result.startsWith('✅') ? PARENT_COLORS.primary : PARENT_COLORS.danger }}>
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
    <div className="bg-white rounded-2xl border border-[rgba(15,118,110,.14)] p-5">
      <h2 className="text-sm font-black text-[#1f2a28] mb-3">Recent Generations</h2>
      <div className="flex flex-col divide-y divide-[#f0efe9]">
        {rows.map(row => (
          <div key={row.id} className="flex items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#374151] truncate">
                {row.topic_slug} · Grade {row.grade} · {row.difficulty} · {row.q_types.join(', ')}
              </p>
              <p className="text-xs text-[#9aa6a3] mt-0.5">
                {new Date(row.created_at).toLocaleString()} · {row.question_ids.length}/{row.count} saved
                {row.error && <span className="text-[#B7862F]"> · {row.error}</span>}
              </p>
            </div>
            <button onClick={() => onReuse(row)}
              className="shrink-0 text-xs font-semibold text-[#0F766E] border border-[#0F766E33] rounded-lg px-3 py-1.5 hover:bg-[#E4F3F1]">
              Make more like this
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Bulk-approve review modal ───────────────────────────────────
// Replaces a bare confirm(count) — the 2026-08-01 incident happened because
// the old dialog carried a number, not the content behind it, so a bulk
// approve could fire with zero human judgment applied to any individual
// question. This shows every question's real content and only enables the
// confirm button once the full list has actually been scrolled through.
function BulkApproveModal({
  questions, onCancel, onConfirmed,
}: {
  questions: PendingQuestion[]
  onCancel: () => void
  onConfirmed: (approvedIds: string[]) => void
}) {
  const [scrolledToEnd, setScrolledToEnd] = useState(false)
  const [approving, setApproving] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  // A short list that never needs scrolling shouldn't be gated on a scroll
  // event that can't fire — check on mount whether it already fits.
  useEffect(() => {
    const el = listRef.current
    if (el && el.scrollHeight <= el.clientHeight + 8) setScrolledToEnd(true)
  }, [])

  const checkScroll = () => {
    if (scrolledToEnd) return
    const el = listRef.current
    if (el && el.scrollTop + el.clientHeight >= el.scrollHeight - 8) setScrolledToEnd(true)
  }

  const confirm = async () => {
    setApproving(true)
    const results = await Promise.all(questions.map(async q => {
      const res = await fetch(`/api/questions/${q.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      })
      return { id: q.id, ok: res.ok }
    }))
    setApproving(false)
    onConfirmed(results.filter(r => r.ok).map(r => r.id))
  }

  return (
    <div className="fixed inset-0 z-[999] bg-black/55 flex items-center justify-center p-5" onClick={onCancel}>
      <div className="bg-white rounded-[20px] shadow-[0_24px_60px_rgba(15,30,26,0.22)] w-full max-w-[460px] max-h-[520px] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="px-6 pt-[22px] pb-3.5 border-b border-[#e9e6dd]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10.5px] font-bold uppercase tracking-wide text-[#7C6BAE]">Bulk approve</span>
            <span className="font-mono text-[11px] font-bold text-[#8a6414] bg-[#FFF3D6] px-2.5 py-0.5 rounded-full">
              {questions.length} question{questions.length === 1 ? '' : 's'}
            </span>
          </div>
          <h3 className="font-extrabold text-[16px] text-[#1f2a28] m-0 mb-1">Approve everything in this queue?</h3>
          <p className="text-[12.5px] text-[#9aa6a3] m-0">Scroll to review each one before approving</p>
        </div>

        <div ref={listRef} onScroll={checkScroll} className="overflow-y-auto px-6 py-1.5 flex-1">
          {questions.map(q => (
            <div key={q.id} className="py-3 border-b border-[#e9e6dd] last:border-b-0">
              <div className="text-[10.5px] text-[#9aa6a3] font-bold uppercase tracking-wide mb-1">
                {q.topics?.subjects?.label_en || '—'} · {q.topics?.title_en || '—'} · Grade {q.topics?.grade ?? '—'} · {q.difficulty}
              </div>
              <div className="text-[13px] text-[#1f2a28] leading-snug"><FractionText text={q.prompt_en} /></div>
            </div>
          ))}
          <div className="text-center text-[11px] text-[#9aa6a3] italic py-2.5">— end of queue —</div>
        </div>

        <div className="px-6 pt-4 pb-[22px] border-t border-[#e9e6dd]">
          {!scrolledToEnd && (
            <div className="flex items-center gap-1.5 text-[11.5px] text-[#8a6414] bg-[#FFF3D6] rounded-lg px-2.5 py-2 mb-3">
              <AlertTriangle size={13} /> Scroll to review all {questions.length} before approving
            </div>
          )}
          <div className="flex gap-2.5">
            <button onClick={confirm} disabled={!scrolledToEnd || approving}
              className="flex-1 flex items-center justify-center gap-1.5 py-[11px] rounded-full bg-[#0F766E] disabled:opacity-40 text-white font-extrabold text-[13px] transition-opacity">
              {approving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {approving ? 'Approving…' : `Approve All (${questions.length})`}
            </button>
            <button onClick={onCancel} disabled={approving}
              className="flex-1 py-[11px] rounded-full border border-[rgba(15,118,110,.14)] text-[#7a8f8b] font-extrabold text-[13px] disabled:opacity-40">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Undo toast ───────────────────────────────────────────────
function UndoToast({ text, onUndo }: { text: string; onUndo: () => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-[9999] bg-[#1f2a28] text-white rounded-xl px-4 py-3.5 text-[13px] font-bold shadow-[0_24px_60px_rgba(15,30,26,0.22)] flex items-center gap-3 max-w-[340px]">
      <span className="text-lg">✅</span>
      <span className="flex-1">{text}</span>
      <button onClick={onUndo} className="text-[#3FCDBB] font-extrabold text-[12.5px] underline whitespace-nowrap">Undo</button>
    </div>
  )
}

// ── Pending Review ────────────────────────────────────────────
function PendingReviewList({ active }: { active: boolean }) {
  const [questions, setQuestions] = useState<PendingQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [revealed, setRevealed] = useState<Set<string>>(new Set())
  const [reviewOpen, setReviewOpen] = useState(false)
  const [undo, setUndo] = useState<{ ids: string[] } | null>(null)
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (undoTimer.current) clearTimeout(undoTimer.current) }, [])

  const toggleReveal = (id: string) => {
    setRevealed(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const load = useCallback(() => {
    setLoading(true)
    fetch('/api/questions/pending')
      .then(r => r.json())
      .then(data => setQuestions(data.questions || []))
      .finally(() => setLoading(false))
  }, [])

  // Refetch each time this tab becomes active (rather than on mount) now that
  // the component stays mounted across tab switches instead of being torn down.
  useEffect(() => { if (active) load() }, [active, load])

  const act = async (id: string, action: 'approve' | 'reject') => {
    setBusyId(id)
    const res = await fetch(`/api/questions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    if (res.ok) setQuestions(prev => prev.filter(q => q.id !== id))
    setBusyId(null)
  }

  // Undo re-PATCHes the same IDs back to approved:false via the API's new
  // 'unapprove' action, then reloads from the server (rather than splicing
  // state back in) so the queue reflects whatever else may have changed
  // during the 10s window, not just what this tab remembers.
  const handleUndo = async () => {
    if (!undo) return
    if (undoTimer.current) clearTimeout(undoTimer.current)
    const ids = undo.ids
    setUndo(null)
    await Promise.all(ids.map(id => fetch(`/api/questions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'unapprove' }),
    })))
    load()
  }

  const handleConfirmed = (approvedIds: string[]) => {
    setReviewOpen(false)
    setQuestions(prev => prev.filter(q => !approvedIds.includes(q.id)))
    if (approvedIds.length === 0) return
    setUndo({ ids: approvedIds })
    if (undoTimer.current) clearTimeout(undoTimer.current)
    undoTimer.current = setTimeout(() => setUndo(null), 10000)
  }

  if (loading) return <p className="text-sm text-[#9aa6a3]">Loading…</p>
  if (questions.length === 0) {
    return <p className="text-sm text-[#9aa6a3]">No pending questions — everything's been reviewed.</p>
  }

  return (
    <div className="flex flex-col gap-4">
      {reviewOpen && (
        <BulkApproveModal
          questions={questions}
          onCancel={() => setReviewOpen(false)}
          onConfirmed={handleConfirmed}
        />
      )}
      {undo && (
        <UndoToast
          text={`Approved ${undo.ids.length} question${undo.ids.length === 1 ? '' : 's'}`}
          onUndo={handleUndo}
        />
      )}
      <div className="flex justify-end">
        <button onClick={() => setReviewOpen(true)} disabled={busyId !== null}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-[#0F766E] hover:bg-[#0B5C56] disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-colors">
          <Check size={12} /> {`Approve All (${questions.length})`}
        </button>
      </div>
      {questions.map(q => (
        <div key={q.id} className="bg-white rounded-2xl border border-[rgba(15,118,110,.14)] p-5">
          <div className="flex items-center justify-between gap-3 mb-2">
            <p className="text-xs text-[#9aa6a3] font-semibold">
              {q.topics?.subjects?.label_en || '—'} · {q.topics?.title_en || '—'} · Grade {q.topics?.grade ?? '—'} · {q.difficulty} · {q.q_type}
            </p>
            <p className="text-xs text-[#9aa6a3] shrink-0">{new Date(q.created_at).toLocaleString()}</p>
          </div>

          <p className="text-sm font-semibold text-[#1f2a28] mb-1"><FractionText text={q.prompt_en} /></p>
          {isDistinctHe(q.prompt_he, q.prompt_en) && <p className="text-sm text-[#7a8f8b] mb-2 text-start" dir="rtl"><FractionText text={q.prompt_he} /></p>}

          {(() => {
            const isRevealed = revealed.has(q.id)
            return (
              <>
                {q.options ? (
                  <ul className="text-sm text-[#374151] mb-2 flex flex-col gap-0.5">
                    {q.options.map((opt, i) => (
                      <li key={i} className={isRevealed && opt.isCorrect ? 'font-bold text-[#0F766E]' : ''}>
                        {opt.label}. <FractionText text={opt.value_en} />
                        {isDistinctHe(opt.value_he, opt.value_en) && <span className="text-[#9aa6a3]" dir="rtl"> · <FractionText text={opt.value_he} /></span>}
                        {isRevealed && opt.isCorrect ? ' ✓' : ''}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-[#374151] mb-2">
                    <span className="text-[#9aa6a3]">Answer:</span>{' '}
                    {isRevealed ? <FractionText text={q.correct_answer} /> : <span className="text-[#c9cfc9] italic">hidden</span>}
                  </p>
                )}

                {isRevealed && (q.hint_en || q.hint_he) && (
                  <p className="text-xs text-[#9aa6a3] mb-1">
                    Hint:{' '}
                    {q.hint_en && <FractionText text={q.hint_en} />}
                    {(q.hint_en ? isDistinctHe(q.hint_he, q.hint_en) : !!q.hint_he) && (
                      <span dir="rtl">{q.hint_en ? ' · ' : ''}<FractionText text={q.hint_he} /></span>
                    )}
                  </p>
                )}
                {isRevealed && q.explanation_en && (
                  <p className="text-xs text-[#9aa6a3] mb-3">Explanation: <FractionText text={q.explanation_en} /></p>
                )}

                <button onClick={() => toggleReveal(q.id)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-[#7C6BAE] hover:text-[#5f5388] mb-3">
                  {isRevealed ? <><EyeOff size={12} /> Hide answer & hints</> : <><Eye size={12} /> Reveal answer & hints</>}
                </button>
              </>
            )
          })()}

          <div className="flex gap-2">
            <button onClick={() => act(q.id, 'approve')} disabled={busyId === q.id || reviewOpen}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-[#0F766E] hover:bg-[#0B5C56] disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-colors">
              <Check size={12} /> Approve
            </button>
            <button onClick={() => act(q.id, 'reject')} disabled={busyId === q.id || reviewOpen}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-[#FFF5F5] hover:bg-[#FFE5E5] text-[#DC2626] disabled:opacity-50 font-bold text-xs rounded-lg transition-colors">
              <X size={12} /> Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Library Panel ─────────────────────────────────────────────
// Browse approved questions by subject/grade/topic, select specific ones,
// and build a worksheet from exactly that selection via the builder's
// existing (previously unused) questionIds param.
function LibraryPanel({ active }: { active: boolean }) {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [subjectSlug, setSubjectSlug] = useState('')
  const [grade, setGrade] = useState(1)
  const [topics, setTopics] = useState<Topic[]>([])
  const [topicSlug, setTopicSlug] = useState('') // '' = all topics for this subject+grade
  const [difficulty, setDifficulty] = useState('') // '' = all/mixed
  const [questions, setQuestions] = useState<PendingQuestion[]>([])
  const [loading, setLoading] = useState(false)
  const [revealed, setRevealed] = useState<Set<string>>(new Set())
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const [children, setChildren] = useState<FamilyChild[]>([])
  const [childId, setChildId] = useState('')
  const [wsType, setWsType] = useState<'practice' | 'quiz' | 'exam'>('practice')
  const [langMode, setLangMode] = useState<'en_only' | 'bilingual' | 'he_only'>('bilingual')
  const [answerKey, setAnswerKey] = useState(true)
  const [includeHints, setIncludeHints] = useState(false)
  const [solutionSteps, setSolutionSteps] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [assignResult, setAssignResult] = useState<{ ok: boolean; message: string } | null>(null)
  const assignResultTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [notebookSections, setNotebookSections] = useState<{ id: string; title: string }[]>([])
  const [showNotebookPicker, setShowNotebookPicker] = useState(false)
  const [notebookSectionId, setNotebookSectionId] = useState('')
  const [newSectionTitle, setNewSectionTitle] = useState('')
  const [addingToNotebook, setAddingToNotebook] = useState(false)

  // Replaces raw setAssignResult everywhere: cancels any pending auto-dismiss
  // timer before applying the new value (so an old timer can't clear a result
  // that replaced it), then — for a non-null result — schedules the banner to
  // clear itself after a few seconds rather than sitting on screen forever.
  const showAssignResult = (result: { ok: boolean; message: string } | null) => {
    if (assignResultTimer.current) clearTimeout(assignResultTimer.current)
    assignResultTimer.current = null
    setAssignResult(result)
    if (result) {
      assignResultTimer.current = setTimeout(() => setAssignResult(null), 4500)
    }
  }

  useEffect(() => () => { if (assignResultTimer.current) clearTimeout(assignResultTimer.current) }, [])

  const toggleReveal = (id: string) => {
    setRevealed(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleSelect = (id: string) => {
    showAssignResult(null)
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // Load subjects once, default to the first one
  useEffect(() => {
    supabase.from('subjects').select('*').order('sort_order').then(({ data }) => {
      setSubjects(data || [])
      setSubjectSlug(prev => prev || data?.[0]?.slug || '')
    })
  }, [])

  // Refetch this family's children each time the tab becomes active
  useEffect(() => {
    if (!active) return
    fetch('/api/family/children')
      .then(r => r.json())
      .then(data => {
        setChildren(data.children || [])
        setChildId(prev => prev || data.children?.[0]?.id || '')
      })
  }, [active])

  useEffect(() => {
    if (!active) return
    fetch('/api/notebook/sections')
      .then(r => r.json())
      .then(data => setNotebookSections(data.sections || []))
  }, [active])

  // Fetch topics whenever subject/grade changes
  useEffect(() => {
    if (!subjectSlug) { setTopics([]); return }
    fetch(`/api/topics?subject=${subjectSlug}&grade=${grade}`)
      .then(r => r.json())
      .then(data => {
        setTopics(data.topics || [])
        setTopicSlug('')
      })
  }, [subjectSlug, grade])

  // Fetch approved questions whenever the filters resolve to a topic id set.
  // Selection is reset here (rather than persisted across filter changes) so
  // "N selected" always refers to questions actually visible on screen.
  useEffect(() => {
    const topicIds = topicSlug
      ? topics.filter(t => t.slug === topicSlug).map(t => t.id)
      : topics.map(t => t.id)

    setRevealed(new Set())
    setSelected(new Set())

    if (topicIds.length === 0) { setQuestions([]); return }

    setLoading(true)
    const params = new URLSearchParams({ topicIds: topicIds.join(',') })
    if (difficulty) params.set('difficulty', difficulty)
    fetch(`/api/questions/library?${params}`)
      .then(r => r.json())
      .then(data => setQuestions(data.questions || []))
      .finally(() => setLoading(false))
  }, [topics, topicSlug, difficulty])

  const selectedSubject = subjects.find(s => s.slug === subjectSlug)
  const gradeOptions = selectedSubject
    ? Array.from({ length: selectedSubject.max_grade - selectedSubject.min_grade + 1 }, (_, i) => selectedSubject.min_grade + i)
    : [0, 1, 2, 3, 4, 5, 6]

  const selectedQuestions = questions.filter(q => selected.has(q.id))
  const selectedChild = children.find(c => c.id === childId)
  const gradeMismatch = selectedChild && selectedChild.grade !== grade

  const createWorksheet = () => {
    if (selectedQuestions.length === 0 || !childId) return
    const topicIds = Array.from(new Set(selectedQuestions.map(q => q.topic_id)))
    const params = new URLSearchParams({
      childId,
      topicIds: topicIds.join(','),
      questionIds: Array.from(selected).join(','),
      difficulty: difficulty || 'mixed',
      lang: langMode,
      answerKey: String(answerKey),
      includeHints: String(includeHints),
      solutionSteps: String(solutionSteps),
      wsType,
    })
    window.open(`/api/worksheets/builder?${params}`, '_blank')
  }

  const assignToChild = async () => {
    if (selectedQuestions.length === 0 || !childId) return
    setAssigning(true)
    showAssignResult(null)
    try {
      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId, questionIds: Array.from(selected) }),
      })
      const data = await res.json()
      if (res.ok) {
        const child = children.find(c => c.id === childId)
        showAssignResult({
          ok: true,
          message: `✅ Assigned ${selectedQuestions.length} question${selectedQuestions.length === 1 ? '' : 's'} to ${child?.display_name || 'child'}!`,
        })
        setSelected(new Set())
      } else {
        showAssignResult({ ok: false, message: data.error || 'Could not create assignment' })
      }
    } catch {
      showAssignResult({ ok: false, message: 'Could not reach the server' })
    }
    setAssigning(false)
  }

  const addToNotebookSection = async () => {
    if (selectedQuestions.length === 0) return
    if (!notebookSectionId && !newSectionTitle.trim()) return
    setAddingToNotebook(true)
    showAssignResult(null)
    try {
      let sectionId = notebookSectionId
      if (!sectionId) {
        const createRes = await fetch('/api/notebook/sections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: newSectionTitle.trim() }),
        })
        const createData = await createRes.json()
        if (!createRes.ok) {
          showAssignResult({ ok: false, message: createData.error || 'Could not create section' })
          setAddingToNotebook(false)
          return
        }
        sectionId = createData.section.id
        setNotebookSections(prev => [{ id: sectionId, title: createData.section.title }, ...prev])
      }

      const res = await fetch(`/api/notebook/sections/${sectionId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionIds: Array.from(selected) }),
      })
      const data = await res.json()
      if (res.ok) {
        const section = notebookSections.find(s => s.id === sectionId)
        showAssignResult({
          ok: true,
          message: `✅ Added ${selectedQuestions.length} question${selectedQuestions.length === 1 ? '' : 's'} to "${section?.title || newSectionTitle || 'section'}"!`,
        })
        setSelected(new Set())
        setShowNotebookPicker(false)
        setNewSectionTitle('')
      } else {
        showAssignResult({ ok: false, message: data.error || 'Could not add to notebook section' })
      }
    } catch {
      showAssignResult({ ok: false, message: 'Could not reach the server' })
    }
    setAddingToNotebook(false)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white rounded-2xl border border-[rgba(15,118,110,.14)] p-5">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-xs text-[#9aa6a3] font-semibold block mb-1">Subject</label>
            <select value={subjectSlug} onChange={e => {
              const newSlug = e.target.value
              const s = subjects.find(x => x.slug === newSlug)
              setSubjectSlug(newSlug)
              if (s && (grade < s.min_grade || grade > s.max_grade)) setGrade(s.min_grade)
            }}
              className="px-3 py-2 text-sm rounded-xl border border-[rgba(15,118,110,.14)] bg-white focus:outline-none focus:ring-2 focus:ring-[#7C6BAE33]">
              {subjects.map(s => <option key={s.slug} value={s.slug}>{s.label_en}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-[#9aa6a3] font-semibold block mb-1">Grade</label>
            <select value={grade} onChange={e => setGrade(parseInt(e.target.value))}
              className="px-3 py-2 text-sm rounded-xl border border-[rgba(15,118,110,.14)] bg-white focus:outline-none focus:ring-2 focus:ring-[#7C6BAE33]">
              {gradeOptions.map(g => <option key={g} value={g}>{g === 0 ? 'KG' : `Grade ${g}`}</option>)}
            </select>
          </div>
          <div className="min-w-48">
            <label className="text-xs text-[#9aa6a3] font-semibold block mb-1">Topic</label>
            <select value={topicSlug} onChange={e => setTopicSlug(e.target.value)} disabled={topics.length === 0}
              className="w-full px-3 py-2 text-sm rounded-xl border border-[rgba(15,118,110,.14)] bg-white focus:outline-none focus:ring-2 focus:ring-[#7C6BAE33] disabled:bg-[#F7F5F0] disabled:text-[#9aa6a3]">
              <option value="">All topics</option>
              {topics.map(t => <option key={t.slug} value={t.slug}>{t.title_en}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-[#9aa6a3] font-semibold block mb-1">Difficulty</label>
            <select value={difficulty} onChange={e => setDifficulty(e.target.value)}
              className="px-3 py-2 text-sm rounded-xl border border-[rgba(15,118,110,.14)] bg-white focus:outline-none focus:ring-2 focus:ring-[#7C6BAE33]">
              <option value="">All</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-[#9aa6a3]">Loading…</p>
      ) : questions.length === 0 ? (
        <p className="text-sm text-[#9aa6a3]">No approved questions match these filters yet.</p>
      ) : (
        <>
          <div className="flex justify-between items-center">
            <span className="text-xs text-[#9aa6a3] font-semibold">{questions.length} question{questions.length === 1 ? '' : 's'}</span>
            <div className="flex gap-2">
              <button onClick={() => { showAssignResult(null); setSelected(new Set(questions.map(q => q.id))) }}
                className="text-xs font-semibold text-[#7C6BAE] border border-[#7C6BAE33] rounded-lg px-3 py-1.5 hover:bg-[#EFE9FA]">
                Select all shown
              </button>
              <button onClick={() => { showAssignResult(null); setSelected(new Set()) }} disabled={selected.size === 0}
                className="text-xs font-semibold text-[#7a8f8b] border border-[rgba(15,118,110,.14)] rounded-lg px-3 py-1.5 hover:bg-[#F7F5F0] disabled:opacity-50">
                Clear selection
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {questions.map(q => {
              const isRevealed = revealed.has(q.id)
              const isSelected = selected.has(q.id)
              return (
                <div key={q.id} className={`bg-white rounded-2xl border p-5 ${isSelected ? 'border-[#7C6BAE99] ring-1 ring-[#7C6BAE33]' : 'border-[rgba(15,118,110,.14)]'}`}>
                  <div className="flex items-start gap-3">
                    <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(q.id)}
                      className="mt-1 w-4 h-4 accent-[#7C6BAE] cursor-pointer shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[#9aa6a3] font-semibold mb-2">
                        {q.topics?.subjects?.label_en || '—'} · {q.topics?.title_en || '—'} · Grade {q.topics?.grade ?? '—'} · {q.difficulty} · {q.q_type}
                      </p>

                      <p className="text-sm font-semibold text-[#1f2a28] mb-1"><FractionText text={q.prompt_en} /></p>
                      {isDistinctHe(q.prompt_he, q.prompt_en) && <p className="text-sm text-[#7a8f8b] mb-2 text-start" dir="rtl"><FractionText text={q.prompt_he} /></p>}

                      {q.options ? (
                        <ul className="text-sm text-[#374151] mb-2 flex flex-col gap-0.5">
                          {q.options.map((opt, i) => (
                            <li key={i} className={isRevealed && opt.isCorrect ? 'font-bold text-[#0F766E]' : ''}>
                              {opt.label}. <FractionText text={opt.value_en} />
                              {isDistinctHe(opt.value_he, opt.value_en) && <span className="text-[#9aa6a3]" dir="rtl"> · <FractionText text={opt.value_he} /></span>}
                              {isRevealed && opt.isCorrect ? ' ✓' : ''}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-[#374151] mb-2">
                          <span className="text-[#9aa6a3]">Answer:</span>{' '}
                          {isRevealed ? <FractionText text={q.correct_answer} /> : <span className="text-[#c9cfc9] italic">hidden</span>}
                        </p>
                      )}

                      {isRevealed && (q.hint_en || q.hint_he) && (
                        <p className="text-xs text-[#9aa6a3] mb-1">
                          Hint:{' '}
                          {q.hint_en && <FractionText text={q.hint_en} />}
                          {(q.hint_en ? isDistinctHe(q.hint_he, q.hint_en) : !!q.hint_he) && (
                            <span dir="rtl">{q.hint_en ? ' · ' : ''}<FractionText text={q.hint_he} /></span>
                          )}
                        </p>
                      )}
                      {isRevealed && q.explanation_en && (
                        <p className="text-xs text-[#9aa6a3] mb-1">Explanation: <FractionText text={q.explanation_en} /></p>
                      )}

                      <button onClick={() => toggleReveal(q.id)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-[#7C6BAE] hover:text-[#5f5388]">
                        {isRevealed ? <><EyeOff size={12} /> Hide answer & hints</> : <><Eye size={12} /> Reveal answer & hints</>}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {selected.size > 0 && (
        <div className="sticky bottom-4 bg-white rounded-2xl border border-[#7C6BAE4d] shadow-lg p-4 flex flex-wrap items-center gap-3">
          <span className="text-sm font-black text-[#1f2a28] shrink-0">{selected.size} selected</span>

          <select value={childId} onChange={e => setChildId(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-[rgba(15,118,110,.14)] bg-white focus:outline-none focus:ring-2 focus:ring-[#7C6BAE33]">
            {children.map(c => <option key={c.id} value={c.id}>{c.display_name} (Grade {c.grade === 0 ? 'K' : c.grade})</option>)}
          </select>

          <select value={wsType} onChange={e => setWsType(e.target.value as any)}
            className="px-3 py-1.5 text-xs rounded-lg border border-[rgba(15,118,110,.14)] bg-white focus:outline-none focus:ring-2 focus:ring-[#7C6BAE33]">
            <option value="practice">Practice</option>
            <option value="quiz">Quiz</option>
            <option value="exam">Exam</option>
          </select>

          <select value={langMode} onChange={e => setLangMode(e.target.value as any)}
            className="px-3 py-1.5 text-xs rounded-lg border border-[rgba(15,118,110,.14)] bg-white focus:outline-none focus:ring-2 focus:ring-[#7C6BAE33]">
            <option value="en_only">English</option>
            <option value="bilingual">Both</option>
            <option value="he_only">Hebrew</option>
          </select>

          <label className="flex items-center gap-1.5 text-xs text-[#374151] cursor-pointer">
            <input type="checkbox" checked={answerKey} onChange={e => setAnswerKey(e.target.checked)} /> Answer key
          </label>
          <label className="flex items-center gap-1.5 text-xs text-[#374151] cursor-pointer">
            <input type="checkbox" checked={includeHints} onChange={e => setIncludeHints(e.target.checked)} /> Hints
          </label>
          <label className="flex items-center gap-1.5 text-xs text-[#374151] cursor-pointer">
            <input type="checkbox" checked={solutionSteps} onChange={e => setSolutionSteps(e.target.checked)} /> Steps
          </label>

          {gradeMismatch && (
            <div className="basis-full flex items-center gap-1.5 text-xs font-semibold text-[#B7862F] bg-[#FFF3D6] border border-[#E0A92733] rounded-lg px-3 py-1.5">
              <AlertTriangle size={12} /> {selectedChild!.display_name} is Grade {selectedChild!.grade === 0 ? 'K' : selectedChild!.grade} — you're assigning Grade {grade === 0 ? 'K' : grade} content.
            </div>
          )}

          <div className="ml-auto flex gap-2 shrink-0">
            <button onClick={assignToChild} disabled={!childId || assigning}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-[#0F766E] hover:bg-[#0B5C56] disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-colors">
              <UserPlus size={12} /> {assigning ? 'Assigning…' : `Assign to Child`}
            </button>
            <button onClick={createWorksheet} disabled={!childId}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-[#7C6BAE] hover:bg-[#5f5388] disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-colors">
              <FileText size={12} /> Create Worksheet from {selected.size} Selected
            </button>
            <button onClick={() => setShowNotebookPicker(v => !v)}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-[#0F766E] hover:bg-[#0B5C56] text-white font-bold text-xs rounded-lg transition-colors">
              <NotebookIcon size={12} /> Add to Notebook Section
            </button>
          </div>

          {showNotebookPicker && (
            <div className="basis-full flex flex-wrap items-center gap-2 bg-[#E4F3F1] border border-[#0F766E33] rounded-lg p-3">
              <select value={notebookSectionId} onChange={e => { setNotebookSectionId(e.target.value); setNewSectionTitle('') }}
                className="px-3 py-1.5 text-xs rounded-lg border border-[rgba(15,118,110,.14)] bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E33]">
                <option value="">— choose a section —</option>
                {notebookSections.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
              </select>
              <span className="text-xs text-[#9aa6a3]">or</span>
              <input value={newSectionTitle} onChange={e => { setNewSectionTitle(e.target.value); setNotebookSectionId('') }}
                placeholder="New section title"
                className="px-3 py-1.5 text-xs rounded-lg border border-[rgba(15,118,110,.14)] bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E33]" />
              <button onClick={addToNotebookSection} disabled={addingToNotebook || (!notebookSectionId && !newSectionTitle.trim())}
                className="px-4 py-1.5 bg-[#0F766E] hover:bg-[#0B5C56] disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-colors">
                {addingToNotebook ? 'Adding…' : `Add ${selected.size} Question${selected.size === 1 ? '' : 's'}`}
              </button>
            </div>
          )}
        </div>
      )}

      {assignResult && (
        <div className={`sticky bottom-4 rounded-xl border p-3 text-xs font-semibold ${assignResult.ok ? 'bg-[#E4F3F1] border-[#0F766E33] text-[#0F766E]' : 'bg-[#FFF5F5] border-[#FEE2E2] text-[#DC2626]'}`}>
          {assignResult.message}
        </div>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────
export default function QuestionsPage() {
  const [tab, setTab] = useState<'generate' | 'pending' | 'library'>('generate')
  const [history, setHistory] = useState<GenerationRow[]>([])
  const [prefill, setPrefill] = useState<Prefill | null>(null)

  const loadHistory = useCallback(() => {
    fetch('/api/questions/generate')
      .then(r => r.json())
      .then(data => setHistory(data.generations || []))
  }, [])

  useEffect(() => { loadHistory() }, [loadHistory])

  return (
    <div className="min-h-screen bg-[#F7F5F0] font-[Manrope]">
      <ParentHeaderBar
        center={<span className="text-sm font-semibold text-[#9aa6a3]">/ AI Questions</span>}
        right={
          <button onClick={() => window.location.href = '/dashboard'}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#7a8f8b] border border-[rgba(15,118,110,.14)] rounded-lg px-3 py-1.5 hover:bg-[#F7F5F0]">
            <ArrowLeft size={12} /> Dashboard
          </button>
        }
      />
      <div className="bg-white border-b border-[rgba(15,118,110,.14)] px-6 py-4 sticky top-16 z-10">
        <div className="max-w-4xl mx-auto flex items-center gap-2">
          <h1 className="flex items-center gap-2 text-xl font-extrabold text-[#1f2a28] mr-2">
            <Sparkles size={18} color={PARENT_COLORS.primary} /> AI Questions
          </h1>
          <button onClick={() => setTab('generate')}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${tab === 'generate' ? 'bg-[#0F766E] text-white' : 'text-[#7a8f8b] hover:bg-[#F7F5F0]'}`}>
            Generate
          </button>
          <button onClick={() => setTab('pending')}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${tab === 'pending' ? 'bg-[#0F766E] text-white' : 'text-[#7a8f8b] hover:bg-[#F7F5F0]'}`}>
            Pending Review
          </button>
          <button onClick={() => setTab('library')}
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${tab === 'library' ? 'bg-[#0F766E] text-white' : 'text-[#7a8f8b] hover:bg-[#F7F5F0]'}`}>
            <BookOpen size={12} /> Library
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6 flex flex-col gap-6">
        {/* All tabs stay mounted so switching tabs doesn't wipe GeneratorPanel's
            in-progress form state — only the inactive ones are visually hidden. */}
        <div className={`flex flex-col gap-6 ${tab === 'generate' ? '' : 'hidden'}`}>
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
              language: row.language || 'en_only',
              customPrompt: row.custom_prompt || '',
            })}
          />
        </div>
        <div className={tab === 'pending' ? '' : 'hidden'}>
          <PendingReviewList active={tab === 'pending'} />
        </div>
        <div className={tab === 'library' ? '' : 'hidden'}>
          <LibraryPanel active={tab === 'library'} />
        </div>
      </div>
    </div>
  )
}
