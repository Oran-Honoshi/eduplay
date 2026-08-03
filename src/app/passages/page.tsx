'use client'
import { useState, useEffect, useMemo } from 'react'
import { createBrowserClient } from '@/lib/supabase'

// ── Types ──────────────────────────────────────────────────────
interface ReadingLevel {
  id: string
  track: 'niqqud' | 'phonics'
  level_number: number
  label_en: string
  label_he: string | null
}

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
  level_id?: string | null
  level?: ReadingLevel | null
}

// ── Constants ──────────────────────────────────────────────────
const supabase = createBrowserClient()

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

const TRACK_EMOJI: Record<string, string> = { niqqud: '🔤', phonics: '🔡' }
function levelBadgeLabel(level: ReadingLevel) {
  return `${TRACK_EMOJI[level.track] ?? '📗'} ${level.track === 'niqqud' ? 'Niqqud' : 'Phonics'} L${level.level_number}`
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
          {p.level && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
              {levelBadgeLabel(p.level)}
            </span>
          )}
        </div>
        <span className="text-lg shrink-0">{TYPE_EMOJI[p.passage_type] ?? '📄'}</span>
      </div>

      {/* Title */}
      <h3 className="text-sm font-bold text-gray-900 leading-snug mb-1 text-start" dir={isHe ? 'rtl' : 'ltr'}>
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
      <div class="meta">${p.grade === 0 ? 'Kindergarten' : `Grade ${p.grade}`} · ${p.passage_type} · ${p.difficulty} · ~${words ?? '?'} words · EduPlay</div>
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
                {p.grade === 0 ? 'Kindergarten' : `Grade ${p.grade}`}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize"
                style={{ background: diff.bg, color: diff.text }}>
                {p.difficulty}
              </span>
              <span className="text-xs text-gray-400 capitalize">{TYPE_EMOJI[p.passage_type]} {p.passage_type}</span>
              {p.level && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                  {levelBadgeLabel(p.level)}
                </span>
              )}
            </div>
            <h2 className="text-base font-black text-gray-900 text-start" dir={lang === 'he' ? 'rtl' : 'ltr'}>
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
              style={{ fontFamily: lang === 'he' ? 'Arial, sans-serif' : 'Georgia, serif', lineHeight: 1.85, fontSize: '15px', textAlign: 'start' }}
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

// reference_file: same 3MB raw cap /api/passages enforces server-side — checked
// client-side too so a too-large file fails fast instead of after a wasted round trip.
const MAX_REFERENCE_FILE_BYTES = 3 * 1024 * 1024
const ALLOWED_REFERENCE_TYPES = ['image/jpeg', 'image/png', 'application/pdf']

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
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
  const [decodabilityResult, setDecodabilityResult] = useState<any>(null)
  const [questionsResult, setQuestionsResult] = useState<{ count: number; warnings?: string[] } | null>(null)

  // Reading-acquisition level (checkpoint 6) — optional; selecting one locks
  // the subject to whatever language the level's track requires, matching
  // /api/passages' own track/subject validation instead of letting the user
  // hit that 400 by picking an incompatible combination.
  const [levels, setLevels] = useState<ReadingLevel[]>([])
  const [levelId, setLevelId] = useState('')

  const [generateQuestions, setGenerateQuestions] = useState(false)

  const [referenceFile, setReferenceFile] = useState<{ name: string; media_type: string; data: string } | null>(null)
  const [referenceFileError, setReferenceFileError] = useState<string | null>(null)

  useEffect(() => {
    supabase.from('reading_levels').select('id,track,level_number,label_en,label_he')
      .eq('is_active', true).order('track').order('level_number')
      .then(({ data }) => setLevels(data || []))
  }, [])

  const selectedLevel = levels.find(l => l.id === levelId) ?? null

  const handleLevelChange = (id: string) => {
    setLevelId(id)
    const level = levels.find(l => l.id === id)
    if (level) setSubject(level.track === 'niqqud' ? 'hebrew' : 'english')
  }

  const handleReferenceFile = async (file: File | null) => {
    setReferenceFileError(null)
    if (!file) { setReferenceFile(null); return }
    if (!ALLOWED_REFERENCE_TYPES.includes(file.type)) {
      setReferenceFileError('Must be a JPEG/PNG image or a PDF.')
      return
    }
    if (file.size > MAX_REFERENCE_FILE_BYTES) {
      setReferenceFileError(`File is ${(file.size / 1024 / 1024).toFixed(1)}MB — max is ${MAX_REFERENCE_FILE_BYTES / 1024 / 1024}MB.`)
      return
    }
    const data = await fileToBase64(file)
    setReferenceFile({ name: file.name, media_type: file.type, data })
  }

  const generate = async () => {
    setGenerating(true)
    setResult(null)
    setDecodabilityResult(null)
    setQuestionsResult(null)
    try {
      const res = await fetch('/api/passages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grade: parseInt(grade), subject, type, difficulty, topic: topic || undefined,
          level_id: levelId || undefined,
          generate_questions: generateQuestions || undefined,
          reference_file: referenceFile ? { media_type: referenceFile.media_type, data: referenceFile.data } : undefined,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setResult('✅ Passage generated and saved for review!')
        if (data.decodability) setDecodabilityResult(data.decodability)
        if (data.questions) {
          setQuestionsResult({ count: data.questions.length, warnings: data.question_warnings })
          if (data.question_warnings?.length) console.warn('[passages] comprehension question warnings:', data.question_warnings)
        }
        onGenerated({ ...data.passage, level: selectedLevel, question_count: data.questions?.length ?? 0 })
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
            {[0,1,2,3,4,5,6].map(g => <option key={g} value={g}>{g === 0 ? 'KG' : `Grade ${g}`}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-400 font-semibold block mb-1">
            Subject {selectedLevel && <span className="text-purple-400 font-normal">(locked by level)</span>}
          </label>
          <select value={subject} onChange={e => setSubject(e.target.value)} disabled={!!selectedLevel}
            className="px-3 py-2 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300 disabled:bg-gray-50 disabled:text-gray-400">
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
        <div>
          <label className="text-xs text-gray-400 font-semibold block mb-1">Reading level (optional)</label>
          <select value={levelId} onChange={e => handleLevelChange(e.target.value)}
            className="px-3 py-2 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300">
            <option value="">— None (regular passage) —</option>
            <optgroup label="Niqqud (Hebrew)">
              {levels.filter(l => l.track === 'niqqud').map(l => (
                <option key={l.id} value={l.id}>L{l.level_number} — {l.label_en}{l.label_he ? ` (${l.label_he})` : ''}</option>
              ))}
            </optgroup>
            <optgroup label="Phonics (English)">
              {levels.filter(l => l.track === 'phonics').map(l => (
                <option key={l.id} value={l.id}>L{l.level_number} — {l.label_en}</option>
              ))}
            </optgroup>
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

      {/* Row 2 — comprehension questions + reference file */}
      <div className="flex flex-wrap gap-4 items-center mt-4 pt-4 border-t border-gray-50">
        <label className="flex items-center gap-2 text-xs font-semibold text-gray-600 cursor-pointer">
          <input type="checkbox" checked={generateQuestions} onChange={e => setGenerateQuestions(e.target.checked)}
            className="w-4 h-4 rounded accent-emerald-500" />
          Add comprehension questions
        </label>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-gray-600 px-3 py-1.5 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
            📎 Reference file
            <input type="file" accept="image/jpeg,image/png,application/pdf" className="hidden"
              onChange={e => handleReferenceFile(e.target.files?.[0] ?? null)} />
          </label>
          {referenceFile && (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              {referenceFile.name}
              <button onClick={() => handleReferenceFile(null)} className="text-gray-400 hover:text-red-500 font-bold px-1">×</button>
            </span>
          )}
        </div>
        {referenceFileError && <span className="text-xs text-red-600 font-semibold">{referenceFileError}</span>}
      </div>

      {result && (
        <div className="mt-3 space-y-1">
          <p className="text-xs font-semibold" style={{ color: result.startsWith('✅') ? '#065F46' : '#991B1B' }}>
            {result}
            {result.startsWith('✅') && ' (Marked for review — approve in Supabase to publish)'}
          </p>
          {decodabilityResult && (
            <p className="text-xs font-semibold" style={{ color: decodabilityResult.passed ? '#065F46' : '#B45309' }}>
              {decodabilityResult.passed ? '✅' : '⚠️'} {decodabilityResult.pct}% decodable at this level
              {decodabilityResult.regenerated ? ' (after 1 retry)' : ''}
              {!decodabilityResult.passed && ' — this topic may be too advanced for the selected level'}
            </p>
          )}
          {questionsResult && (
            <p className="text-xs font-semibold text-emerald-700">
              ✅ {questionsResult.count} comprehension question{questionsResult.count !== 1 ? 's' : ''} added
              {questionsResult.warnings?.length ? ` (${questionsResult.warnings.length} skipped — see console)` : ''}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ── Pending Review ────────────────────────────────────────────
// Per-item approve/reject only — deliberately no bulk-approve action here.
// See the 2026-08-01 bulk-approve incident on the questions queue: a bulk
// action against a shared/unscoped review queue silently affected real
// pending content. Until bulk approval gets the same real-review-before-
// confirm treatment questions' BulkApproveModal has, passages ship without it.
interface PendingPassageQuestion {
  id: string
  prompt_en: string | null
  prompt_he: string | null
  options: { label: string; isCorrect: boolean; value_en?: string; value_he?: string }[]
  correct_answer: string
  explanation_en: string | null
  approved: boolean
}

interface PendingPassage {
  id: string
  grade: number
  subjects: { slug: string } | null
  passage_type: string
  difficulty: string
  title_en: string
  title_he: string | null
  content_en: string | null
  content_he: string | null
  approved: boolean
  passage_questions: PendingPassageQuestion[]
}

// A passage is done needing review once it's approved AND every one of its
// comprehension questions is too — passage_questions carries its own
// independent `approved` column (gated separately in lesson/page.tsx), so
// approving the passage alone doesn't resolve its questions.
const isResolved = (p: PendingPassage) => p.approved && p.passage_questions.every(q => q.approved)

function PendingPassageQuestionRow({ passageId, q, busy, onAct }: {
  passageId: string
  q: PendingPassageQuestion
  busy: boolean
  onAct: (passageId: string, questionId: string, action: 'approve' | 'reject') => void
}) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 mt-2">
      <p className="text-xs font-semibold text-gray-800 mb-1">{q.prompt_en ?? q.prompt_he}</p>
      {q.prompt_he && q.prompt_en && <p className="text-xs text-gray-400 mb-1" dir="rtl">{q.prompt_he}</p>}
      <ul className="text-xs text-gray-600 mb-2 flex flex-col gap-0.5">
        {q.options.map((opt, i) => (
          <li key={i} className={opt.isCorrect ? 'font-bold text-emerald-700' : ''}>
            {opt.label}. {opt.value_en ?? opt.value_he}{opt.isCorrect ? ' ✓' : ''}
          </li>
        ))}
      </ul>
      {q.explanation_en && <p className="text-xs text-gray-400 mb-2">Explanation: {q.explanation_en}</p>}
      {q.approved ? (
        <span className="text-xs font-semibold text-emerald-600">✓ Approved</span>
      ) : (
        <div className="flex gap-2">
          <button onClick={() => onAct(passageId, q.id, 'approve')} disabled={busy}
            className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-colors">
            Approve
          </button>
          <button onClick={() => onAct(passageId, q.id, 'reject')} disabled={busy}
            className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 disabled:opacity-50 font-bold text-xs rounded-lg transition-colors">
            Reject
          </button>
        </div>
      )}
    </div>
  )
}

function PendingReviewList({ active }: { active: boolean }) {
  const [passages, setPassages] = useState<PendingPassage[]>([])
  const [loading, setLoading] = useState(true)
  const [busyPassageId, setBusyPassageId] = useState<string | null>(null)
  const [busyQuestionId, setBusyQuestionId] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    fetch('/api/passages/pending')
      .then(r => r.json())
      .then(data => setPassages(data.passages || []))
      .finally(() => setLoading(false))
  }

  // Refetch each time this tab becomes active, matching questions/page.tsx's
  // PendingReviewList — the tab stays mounted across switches.
  useEffect(() => { if (active) load() }, [active])

  const actPassage = async (id: string, action: 'approve' | 'reject') => {
    setBusyPassageId(id)
    const res = await fetch(`/api/passages/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    if (res.ok) {
      setPassages(prev => {
        if (action === 'reject') return prev.filter(p => p.id !== id)
        return prev.map(p => p.id === id ? { ...p, approved: true } : p).filter(p => !isResolved(p))
      })
    }
    setBusyPassageId(null)
  }

  const actQuestion = async (passageId: string, questionId: string, action: 'approve' | 'reject') => {
    setBusyQuestionId(questionId)
    const res = await fetch(`/api/passages/questions/${questionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    if (res.ok) {
      setPassages(prev => prev.map(p => {
        if (p.id !== passageId) return p
        const passage_questions = action === 'reject'
          ? p.passage_questions.filter(q => q.id !== questionId)
          : p.passage_questions.map(q => q.id === questionId ? { ...q, approved: true } : q)
        return { ...p, passage_questions }
      }).filter(p => !isResolved(p)))
    }
    setBusyQuestionId(null)
  }

  if (loading) return <p className="text-sm text-gray-400">Loading…</p>
  if (passages.length === 0) {
    return <p className="text-sm text-gray-400">No pending passages — everything's been reviewed.</p>
  }

  return (
    <div className="flex flex-col gap-4">
      {passages.map(p => {
        const diff = DIFF_COLOR[p.difficulty] ?? DIFF_COLOR.medium
        const content = p.content_en ?? p.content_he
        const isHe = !p.content_en && !!p.content_he
        return (
          <div key={p.id} className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                  {GRADE_LABELS[p.grade] ?? `G${p.grade}`}
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: SUBJ_COLOR[p.subjects?.slug ?? 'english']?.bg, color: SUBJ_COLOR[p.subjects?.slug ?? 'english']?.text }}>
                  {p.subjects?.slug === 'hebrew' ? 'עב' : 'EN'}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize" style={{ background: diff.bg, color: diff.text }}>
                  {p.difficulty}
                </span>
                <span className="text-xs text-gray-400 capitalize">{TYPE_EMOJI[p.passage_type] ?? '📄'} {p.passage_type}</span>
              </div>
            </div>

            <h3 className="text-sm font-bold text-gray-900 mb-1">{p.title_en}</h3>
            {p.title_he && <p className="text-xs text-gray-400 mb-2" dir="rtl">{p.title_he}</p>}

            <div
              className="text-sm text-gray-700 mb-3 max-h-56 overflow-y-auto bg-gray-50 rounded-xl p-3"
              dir={isHe ? 'rtl' : 'ltr'}
            >
              {(content ?? '').split('\n\n').map((para, i) => <p key={i} className="mb-2">{para}</p>)}
            </div>

            {p.approved ? (
              <span className="text-xs font-semibold text-emerald-600">✓ Passage approved</span>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => actPassage(p.id, 'approve')} disabled={busyPassageId === p.id}
                  className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-colors">
                  Approve
                </button>
                <button onClick={() => actPassage(p.id, 'reject')} disabled={busyPassageId === p.id}
                  className="px-4 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 disabled:opacity-50 font-bold text-xs rounded-lg transition-colors">
                  Reject
                </button>
              </div>
            )}

            {p.passage_questions.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-50">
                <p className="text-xs font-semibold text-gray-500 mb-1">
                  Comprehension questions ({p.passage_questions.filter(q => !q.approved).length} pending)
                </p>
                {p.passage_questions.map(q => (
                  <PendingPassageQuestionRow key={q.id} passageId={p.id} q={q} busy={busyQuestionId === q.id} onAct={actQuestion} />
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────
export default function PassagesPage() {
  const [tab, setTab] = useState<'library' | 'generate' | 'pending'>('library')
  const [passages, setPassages] = useState<Passage[]>([])
  const [loading, setLoading] = useState(true)
  const [openPassage, setOpenPassage] = useState<Passage | null>(null)

  // Filters
  const [filterGrade, setFilterGrade] = useState<string>('')
  const [filterSubject, setFilterSubject] = useState<string>('')
  const [filterType, setFilterType] = useState<string>('')
  const [filterDiff, setFilterDiff] = useState<string>('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    supabase
      .from('reading_passages')
      .select('*,passage_questions(id)')
      .order('grade').order('passage_type').order('difficulty')
      .then(({ data }) => {
        // Join with subject info + reading levels
        Promise.all([
          supabase.from('subjects').select('id,slug'),
          supabase.from('reading_levels').select('id,track,level_number,label_en,label_he'),
        ]).then(([{ data: subjects }, { data: levels }]) => {
          const subjectMap: Record<string, string> = {}
          ;(subjects || []).forEach((s: any) => { subjectMap[s.id] = s.slug })
          const levelMap: Record<string, ReadingLevel> = {}
          ;(levels || []).forEach((l: any) => { levelMap[l.id] = l })
          const enriched = (data || []).map((p: any) => ({
            ...p,
            subject: subjectMap[p.subject_id] ?? 'unknown',
            question_count: p.passage_questions?.length ?? 0,
            level: p.level_id ? levelMap[p.level_id] ?? null : null,
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
            <button onClick={() => setTab('library')}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${tab === 'library' ? 'bg-emerald-500 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
              Library
            </button>
            <button onClick={() => setTab('generate')}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${tab === 'generate' ? 'bg-emerald-500 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
              ✨ Generate new
            </button>
            <button onClick={() => setTab('pending')}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${tab === 'pending' ? 'bg-emerald-500 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
              Pending Review
            </button>
            <button onClick={() => window.location.href = '/dashboard'}
              className="text-xs font-semibold text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50">
              ← Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Generator tab — kept mounted-on-demand (unlike library/pending) since
            it has no data to refetch on tab switch, just in-progress form state. */}
        <div className={tab === 'generate' ? 'mb-6' : 'hidden'}>
          <GeneratorPanel onGenerated={p => {
            // Derived from which content field the passage actually has, not the
            // active filter — caught live in checkpoint 6 testing: generating a
            // Hebrew passage with no subject filter active showed an "EN" badge
            // until the next page refresh, because this previously fell back to
            // filterSubject || 'english' regardless of the passage's real language.
            setPassages(prev => [{ ...p, subject: p.content_he ? 'hebrew' : 'english', question_count: p.question_count ?? 0 } as Passage, ...prev])
          }} />
        </div>

        <div className={tab === 'pending' ? '' : 'hidden'}>
          <PendingReviewList active={tab === 'pending'} />
        </div>

        <div className={tab === 'library' ? '' : 'hidden'}>
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
      </div>

      {/* Modal */}
      {openPassage && <PassageModal p={openPassage} onClose={() => setOpenPassage(null)} />}
    </div>
  )
}