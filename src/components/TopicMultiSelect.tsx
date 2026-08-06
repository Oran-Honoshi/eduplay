'use client'
import { useEffect, useRef, useState } from 'react'
import { Search, X, Check, ChevronDown } from 'lucide-react'

export interface SelectableTopic {
  id: string
  title_en: string
  title_he?: string | null
  grade: number
}

interface Theme {
  card: string
  border: string
  text: string
  textMuted: string
  inputBg: string
}

// Searchable, cross-grade multi-select for worksheet-builder topic picking.
// Replaces the old grade-scoped checkbox checklist: `topics` here is the
// FULL list for a subject across every grade (the caller no longer filters
// by the selected child's grade before passing topics in), grouped by grade
// only for browsing/display — selection itself is grade-agnostic. Keeps the
// same `string[]` of topic ids as its selection shape so nothing downstream
// (generate payload, summary panel, backend) needs to change.
export default function TopicMultiSelect({
  topics, selectedIds, onChange, accentColor, theme,
}: {
  topics: SelectableTopic[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
  accentColor: string
  theme: Theme
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  function toggle(id: string) {
    onChange(selectedIds.includes(id) ? selectedIds.filter(x => x !== id) : [...selectedIds, id])
  }

  const q = query.trim().toLowerCase()
  const filtered = q
    ? topics.filter(t => t.title_en.toLowerCase().includes(q) || (t.title_he || '').includes(query.trim()))
    : topics

  const byGrade = new Map<number, SelectableTopic[]>()
  for (const t of filtered) {
    if (!byGrade.has(t.grade)) byGrade.set(t.grade, [])
    byGrade.get(t.grade)!.push(t)
  }
  const grades = Array.from(byGrade.keys()).sort((a, b) => a - b)

  const selectedTopics = selectedIds
    .map(id => topics.find(t => t.id === id))
    .filter((t): t is SelectableTopic => !!t)

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      {/* Selected topics as removable tiles */}
      {selectedTopics.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
          {selectedTopics.map(t => (
            <div key={t.id} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '5px 6px 5px 10px', borderRadius: 50,
              background: `${accentColor}14`, border: `1px solid ${accentColor}40`,
              fontSize: 12, fontWeight: 700, color: theme.text,
            }}>
              <span>{t.title_en}</span>
              <span style={{ fontSize: 10, fontWeight: 800, color: theme.textMuted }}>
                G{t.grade === 0 ? 'K' : t.grade}
              </span>
              <button type="button" onClick={() => toggle(t.id)} aria-label={`Remove ${t.title_en}`}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 16, height: 16, borderRadius: '50%', border: 'none',
                  background: `${accentColor}25`, color: accentColor, cursor: 'pointer', padding: 0,
                }}>
                <X size={10} strokeWidth={3} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search box */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        border: `1.5px solid ${open ? accentColor : theme.border}`,
        borderRadius: 12, padding: '10px 12px', background: theme.inputBg,
      }}>
        <Search size={14} color={theme.textMuted} />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Search topics, or click to browse by grade…"
          style={{
            flex: 1, border: 'none', outline: 'none', background: 'transparent',
            fontSize: 13, fontFamily: 'inherit', color: theme.text,
          }}
        />
        <ChevronDown size={14} color={theme.textMuted} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
      </div>

      {/* Dropdown: matches (or full list) grouped by grade */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 20,
          background: theme.card, border: `1px solid ${theme.border}`, borderRadius: 14,
          boxShadow: '0 12px 32px rgba(0,0,0,0.16)', maxHeight: 320, overflowY: 'auto', padding: 8,
        }}>
          {grades.length === 0 && (
            <div style={{ padding: 14, textAlign: 'center', fontSize: 12, color: theme.textMuted }}>
              No topics match &ldquo;{query}&rdquo;
            </div>
          )}
          {grades.map(g => (
            <div key={g} style={{ marginBottom: 4 }}>
              <div style={{
                padding: '6px 8px', fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
                letterSpacing: '0.06em', color: theme.textMuted,
              }}>
                Grade {g === 0 ? 'K' : g}
              </div>
              {byGrade.get(g)!.map(t => {
                const on = selectedIds.includes(t.id)
                return (
                  <div key={t.id} onClick={() => toggle(t.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 10px', borderRadius: 10, cursor: 'pointer',
                      background: on ? `${accentColor}12` : 'transparent',
                    }}
                  >
                    <div style={{
                      width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                      border: `2px solid ${on ? accentColor : theme.border}`,
                      background: on ? accentColor : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {on && <Check size={10} color="white" strokeWidth={3} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: theme.text }}>{t.title_en}</div>
                      {t.title_he && (
                        <div style={{ fontSize: 11, color: theme.textMuted, direction: 'rtl', textAlign: 'right' }}>{t.title_he}</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
