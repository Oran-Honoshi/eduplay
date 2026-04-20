'use client'
import { useState, useEffect, useMemo } from 'react'

// ── Types ──────────────────────────────────────────────────────
interface Passage {
  id: string
  grade: number
  subject: string
  passage_type: string
  difficulty: string
  title_en: string
  title_he: string | null
  content_en: string | null
  content_he: string | null
  word_count_en: number | null
  word_count_he: number | null
  paragraph_count: number | null
  approved: boolean
  question_count?: number
}

// ── Constants ──────────────────────────────────────────────────
const SUPABASE_URL = 'https://jbbkwomcyvuzdtagogut.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiYmt3b21jeXZ1emR0YWdvZ3V0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0OTUyMzYsImV4cCI6MjA5MTA3MTIzNn0.lKzQTIugcbmI4kua6Y4PSaLXyqCYKxxmfQpArX3vvG4'

const GRADE_LABELS: Record<number, string> = {
  0: 'KG', 1: 'G1', 2: 'G2', 3: 'G3', 4: 'G4', 5: 'G5', 6: 'G6'
}

const TYPE_EMOJI: Record<string, string> = {
  story: '📖', informational: '📰', argumentative: '💬', poem: '🎵'
}

const DIFF_COLOR: Record<string, { bg: string; text: string; label: string }> = {
  easy:   { bg: '#D1FAE5', text: '#065F46', label: 'Easy' },
  medium: { bg: '#FEF3C7', text: '#92400E', label: 'Medium' },
  hard:   { bg: '#FEE2E2', text: '#991B1B', label: 'Hard' },
}

const SUBJ_COLOR: Record<string, { bg: string; text: string }> = {
  english: { bg: '#DBEAFE', text: '#1E40AF' },
  hebrew:  { bg: '#D1FAE5', text: '#065F46' },
}

// ── Passage Card ───────────────────────────────────────────────
function PassageCard({ p, onOpen }: { p: Passage; onOpen: () => void }) {
  const diff = DIFF_COLOR[p.difficulty] ?? DIFF_COLOR.medium
  const subj = SUBJ_COLOR[p.subject] ?? SUBJ_COLOR.english
  const words = p.word_count_en ?? p.word_count_he ?? 0
  const isHe = !p.content_en && !!p.content_he

  return (
    <div
      onClick={onOpen}
      className="bg-white rounded-2xl border border-gray-100 p-4 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-150"
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: subj.bg, color: subj.text }}>
            {p.subject === 'english' ? 'EN' : 'עב'}
          </span>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
            {GRADE_LABELS[p.grade]}
          </span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: diff.bg, color: diff.text }}>
            {diff.label}
          </span>
        </div>
        <span className="text-lg shrink-0">{TYPE_EMOJI[p.passage_type] ?? '📄'}</span>
      </div>

      {/* Title */}
      <h3 className="text-sm font-bold text-gray-900 leading-snug mb-1">
        {isHe ? (p.title_he ?? p.title_en) : p.title_en}
      </h3>
      {p.title_he && !isHe && (
        <p className="text-xs text-gray-400 mb-2" dir="rtl">{p.title_he}</p>
      )}

      {/* Stats */}
      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-50">
        <span className="text-xs text-gray-400">
          {words > 0 ? `~${words} words` : 'No content'}
        </span>
        <span className="text-xs text-gray-300">·</span>
        <span className="text-xs text-gray-400 capitalize">{p.passage_type}</span>
        {(p.question_count ?? 0) > 0 && (
          <>
            <span className="text-xs text-gray-300">·</span>
            <span className="text-xs text-emerald-600 font-semibold">{p.question_count}Q</span>
          </>
        )}
      </div>
    </div>
  )
}

// ── Passage Modal ──────────────────────────────────────────────
function PassageModal({ p, onClose }: { p: Passage; onClose: () => void }) {
  const [lang, setLang] = useState<'en' | 'he'>(p.content_en ? 'en' : 'he')
  const diff = DIFF_COLOR[p.difficulty] ?? DIFF_COLOR.medium
  const content = lang === 'en' ? p.content_en : p.content_he
  const words = lang === 'en' ? p.word_count_en : p.word_count_he

  const handlePrint = () => {
    const w = window.open('', '_blank')!
    w.document.write(`
      <html><head><title>${p.title_en}</title>
      <style>
        body { font-family: ${lang === 'he' ? 'Arial' : 'Georgia'}, serif; padding: 40px; max-width: 700px; margin: 0 auto; direction: ${lang === 'he' ? 'rtl' : 'ltr'}; }
        h1 { font-size: 22px; margin-bottom: 4px; }
        .meta { font-size: 12px; color: #888; margin-bottom: 24px; }
        p { font-size: 15px; line-height: 1.8; margin-bottom: 14px; }
        @media print { body { padding: 20px; } }
      </style></head><body>
      <h1>${lang === 'he' && p.title_he ? p.title_he : p.title_en}</h1>
      <div class="meta">Grade ${p.grade} · ${p.passage_type} · ${p.difficulty} · ~${words ?? '?'} words · EduPlay</div>
      ${(content ?? '').split('\n\n').map((para: string) => `<p>${para}</p>`).join('')}
      </body></html>
    `)
    w.document.close()
    w.print()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-start justify-between gap-3 px-6 py-4 border-b border-gray-100">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: SUBJ_COLOR[p.subject]?.bg, color: SUBJ_COLOR[p.subject]?.text }}>
                {p.subject === 'english' ? 'English' : 'עברית'}
              </span>
              <span className="text-xs bg-gray-100 text-gray-600 font-bold px-2 py-0.5 rounded-full">
                Grade {p.grade}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize"
                style={{ background: diff.bg, color: diff.text }}>
                {p.difficulty}
              </span>
              <span className="text-xs text-gray-400 capitalize">{TYPE_EMOJI[p.passage_type]} {p.passage_type}</span>
            </div>
            <h2 className="text-base font-black text-gray-900">
              {lang === 'he' && p.title_he ? p.title_he : p.title_en}
            </h2>
            {p.title_he && lang === 'en' && (
              <p className="text-xs text-gray-400 mt-0.5" dir="rtl">{p.title_he}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Language toggle */}
            {p.content_en && p.content_he && (
              <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                <button onClick={() => setLang('en')}
                  className={`px-2.5 py-1 text-xs font-semibold ${lang === 'en' ? 'bg-emerald-500 text-white' : 'text-gray-500'}`}>EN</button>
                <button onClick={() => setLang('he')}
                  className={`px-2.5 py-1 text-xs font-semibold ${lang === 'he' ? 'bg-emerald-500 text-white' : 'text-gray-500'}`}>עב</button>
              </div>
            )}
            <button onClick={handlePrint}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-semibold transition-colors">
              🖨 Print
            </button>
            <button onClick={onClose}
              className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 text-sm font-bold transition-colors">
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {content ? (
            <div
              className="prose prose-sm max-w-none"
              dir={lang === 'he' ? 'rtl' : 'ltr'}
              style={{ fontFamily: lang === 'he' ? 'Arial, sans-serif' : 'Georgia, serif', lineHeight: 1.85, fontSize: '15px' }}
            >
              {content.split('\n\n').map((para: string, i: number) => (
                <p key={i} className="mb-4 text-gray-800">{para}</p>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <div className="text-3xl mb-2">📄</div>
              <p className="text-sm">Content not available in this language</p>
            </div>
          )}
        </div>

        {/* Footer stats */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center gap-4 text-xs text-gray-400">
            {words && <span>~{words} words</span>}
            {p.paragraph_count && <span>{p.paragraph_count} paragraphs</span>}
            {(p.question_count ?? 0) > 0 && <span className="text-emerald-600 font-semibold">{p.question_count} comprehension questions</span>}
          </div>
          <span className="text-xs text-gray-300">EduPlay Passage Library</span>
        </div>
      </div>
    </div>
  )
}

// ── Passage Generator Panel ────────────────────────────────────
function GeneratorPanel({ onGenerated }: { onGenerated: (p: Passage) => void }) {
  const [grade, setGrade] = useState('4')
  const [subject, setSubject] = useState('english')
  const [type, setType] = useState('story')
  const [difficulty, setDifficulty] = useState('medium')
  const [topic, setTopic] = useState('')
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const generate = async () => {
    setGenerating(true)
    setResult(null)
    try {
      const res = await fetch('/api/passages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grade: parseInt(grade), subject, type, difficulty, topic: topic || undefined }),
      })
      const data = await res.json()
      if (data.success) {
        setResult('✅ Passage generated and saved for review!')
        onGenerated(data.passage)
        setTopic('')
      } else {
        setResult(`❌ Error: ${data.error}`)
      }
    } catch (e: any) {
      setResult(`❌ ${e.message}`)
    }
    setGenerating(false)
  }

  return (
    <div className="bg-white rounded-2xl border border-emerald-100 p-5 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">✨</span>
        <h2 className="text-sm font-black text-gray-900">Generate New Passage</h2>
        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">AI</span>
      </div>
      <div className="flex flex-wrap gap-2 items-end">
        <div>
          <label className="text-xs text-gray-400 font-semibold block mb-1">Grade</label>
          <select value={grade} onChange={e => setGrade(e.target.value)}
            className="px-3 py-2 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300">
            {[1,2,3,4,5,6].map(g => <option key={g} value={g}>Grade {g}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-400 font-semibold block mb-1">Subject</label>
          <select value={subject} onChange={e => setSubject(e.target.value)}
            className="px-3 py-2 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300">
            <option value="english">English</option>
            <option value="hebrew">Hebrew עברית</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-400 font-semibold block mb-1">Type</label>
          <select value={type} onChange={e => setType(e.target.value)}
            className="px-3 py-2 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300">
            <option value="story">📖 Story</option>
            <option value="informational">📰 Informational</option>
            <option value="argumentative">💬 Argumentative</option>
            <option value="poem">🎵 Poem</option>
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
        <div className="flex-1 min-w-40">
          <label className="text-xs text-gray-400 font-semibold block mb-1">Topic (optional)</label>
          <input type="text" value={topic} onChange={e => setTopic(e.target.value)}
            placeholder="e.g. bees, the moon, friendship..."
            className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300"
          />
        </div>
        <button onClick={generate} disabled={generating}
          className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold text-sm rounded-xl transition-colors whitespace-nowrap">
          {generating ? '⏳ Generating...' : '✨ Generate'}
        </button>
      </div>
      {result && (
        <p className="mt-3 text-xs font-semibold" style={{ color: result.startsWith('✅') ? '#065F46' : '#991B1B' }}>
          {result}
          {result.startsWith('✅') && ' (Marked for review — approve in Supabase to publish)'}
        </p>
      )}
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────
export default function PassagesPage() {
  const [passages, setPassages] = useState<Passage[]>([])
  const [loading, setLoading] = useState(true)
  const [openPassage, setOpenPassage] = useState<Passage | null>(null)
  const [showGenerator, setShowGenerator] = useState(false)

  // Filters
  const [filterGrade, setFilterGrade] = useState<string>('')
  const [filterSubject, setFilterSubject] = useState<string>('')
  const [filterType, setFilterType] = useState<string>('')
  const [filterDiff, setFilterDiff] = useState<string>('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch(`${SUPABASE_URL}/rest/v1/reading_passages?select=*,passage_questions(id)&order=grade,passage_type,difficulty`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    })
      .then(r => r.json())
      .then(data => {
        // Join with subject info
        fetch(`${SUPABASE_URL}/rest/v1/subjects?select=id,slug`, {
          headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
        })
          .then(r => r.json())
          .then(subjects => {
            const subjectMap: Record<string, string> = {}
            subjects.forEach((s: any) => { subjectMap[s.id] = s.slug })
            const enriched = (data || []).map((p: any) => ({
              ...p,
              subject: subjectMap[p.subject_id] ?? 'unknown',
              question_count: p.passage_questions?.length ?? 0,
            }))
            setPassages(enriched)
            setLoading(false)
          })
      })
  }, [])

  const filtered = useMemo(() => passages.filter(p => {
    if (filterGrade && String(p.grade) !== filterGrade) return false
    if (filterSubject && p.subject !== filterSubject) return false
    if (filterType && p.passage_type !== filterType) return false
    if (filterDiff && p.difficulty !== filterDiff) return false
    if (search) {
      const q = search.toLowerCase()
      if (!p.title_en?.toLowerCase().includes(q) && !p.title_he?.includes(q)) return false
    }
    return true
  }), [passages, filterGrade, filterSubject, filterType, filterDiff, search])

  // Stats
  const stats = useMemo(() => ({
    total: passages.length,
    withQuestions: passages.filter(p => (p.question_count ?? 0) > 0).length,
    grades: [...new Set(passages.map(p => p.grade))].sort(),
  }), [passages])

  return (
    <div className="min-h-screen bg-gray-50 font-[Nunito]">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-gray-900">📖 Passage Library</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {stats.total} passages · {stats.withQuestions} with comprehension questions · Grades {stats.grades.map(g => GRADE_LABELS[g]).join(', ')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowGenerator(s => !s)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${showGenerator ? 'bg-emerald-500 text-white border-emerald-500' : 'text-gray-500 border-gray-200 hover:bg-gray-50'}`}>
              ✨ Generate new
            </button>
            <button onClick={() => window.location.href = '/dashboard'}
              className="text-xs font-semibold text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50">
              ← Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Generator panel */}
        {showGenerator && (
          <GeneratorPanel onGenerated={p => {
            setPassages(prev => [{ ...p, subject: filterSubject || 'english', question_count: 0 } as Passage, ...prev])
            setShowGenerator(false)
          }} />
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          <input
            type="text"
            placeholder="Search passages..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="px-3 py-2 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300 w-48"
          />
          <select value={filterGrade} onChange={e => setFilterGrade(e.target.value)}
            className="px-3 py-2 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300">
            <option value="">All grades</option>
            {[0,1,2,3,4,5,6].map(g => <option key={g} value={g}>Grade {g}</option>)}
          </select>
          <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)}
            className="px-3 py-2 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300">
            <option value="">All subjects</option>
            <option value="english">English</option>
            <option value="hebrew">Hebrew עברית</option>
          </select>
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            className="px-3 py-2 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300">
            <option value="">All types</option>
            <option value="story">📖 Story</option>
            <option value="informational">📰 Informational</option>
            <option value="argumentative">💬 Argumentative</option>
            <option value="poem">🎵 Poem</option>
          </select>
          <select value={filterDiff} onChange={e => setFilterDiff(e.target.value)}
            className="px-3 py-2 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300">
            <option value="">All difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          {(filterGrade || filterSubject || filterType || filterDiff || search) && (
            <button
              onClick={() => { setFilterGrade(''); setFilterSubject(''); setFilterType(''); setFilterDiff(''); setSearch('') }}
              className="px-3 py-2 text-sm text-gray-500 hover:text-red-500 font-semibold"
            >
              Clear filters
            </button>
          )}
          <span className="ml-auto text-sm text-gray-400 self-center">
            {filtered.length} passage{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-40 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-4xl mb-3">🔍</div>
            <p className="font-semibold">No passages match your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map(p => (
              <PassageCard key={p.id} p={p} onOpen={() => setOpenPassage(p)} />
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {openPassage && <PassageModal p={openPassage} onClose={() => setOpenPassage(null)} />}
    </div>
  )
}