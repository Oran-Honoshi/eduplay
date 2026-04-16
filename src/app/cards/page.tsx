'use client'
import { useState, useEffect, useCallback } from 'react'
import {
  ArrowLeft, Star, Lock, Check, ChevronRight,
  X, Sun, Moon, Globe, Zap, Trophy, Loader2,
  BookOpen,
} from 'lucide-react'
import WorldMap from '@/components/WorldMap'

// ─── Types ───────────────────────────────────────────────────
interface Phase {
  id: string; slug: string; name_en: string; name_he: string
  description_en: string; sort_order: number; cards_needed: number
  map_region: string; color: string; emoji: string
}
interface Card {
  id: string; phase_id: string; slug: string
  name_en: string; name_he: string; location_en: string; location_he: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  xp_cost: number; unsplash_id: string
  fact_en: string; facts_en: string[]
  habitat_en: string; speed: string; lifespan: string
  diet_en: string; fun_fact_en: string; sort_order: number
}

// ─── Design tokens ────────────────────────────────────────────
const L = { bg: '#F9FAFB', card: '#FFFFFF', border: '#E5E7EB', text: '#111827', textSec: '#6B7280', textMuted: '#9CA3AF', inputBg: '#F3F4F6', shadow: 'rgba(0,0,0,0.04)' }
const D = { bg: '#0F1117', card: '#1E2130', border: '#2A2D3E', text: '#F1F5F9', textSec: '#94A3B8', textMuted: '#64748B', inputBg: '#252836', shadow: 'rgba(0,0,0,0.25)' }

const RARITY: Record<string, { label: string; color: string; bg: string; darkBg: string }> = {
  common:    { label: 'Common',    color: '#78716C', bg: '#F5F5F4', darkBg: '#2A2825' },
  rare:      { label: 'Rare',      color: '#3B82F6', bg: '#EFF6FF', darkBg: '#1E3A5F' },
  epic:      { label: 'Epic',      color: '#7C3AED', bg: '#F5F3FF', darkBg: '#2D1B69' },
  legendary: { label: 'Legendary', color: '#D97706', bg: '#FEF3C7', darkBg: '#451A03' },
}

function imgUrl(id: string, w = 400, h = 280) {
  return `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&auto=format&q=80`
}

// ─── Card tile ────────────────────────────────────────────────
function AnimalCard({ card, owned, onOpen, dark }: {
  card: Card; owned: boolean; onOpen: () => void; dark: boolean
}) {
  const T   = dark ? D : L
  const r   = RARITY[card.rarity]
  const [imgErr, setImgErr] = useState(false)

  return (
    <div onClick={owned ? onOpen : undefined} style={{
      background: T.card, borderRadius: 16, overflow: 'hidden',
      border: `1.5px solid ${owned ? r.color + '60' : T.border}`,
      cursor: owned ? 'pointer' : 'default',
      transition: 'transform 0.15s, box-shadow 0.15s',
      boxShadow: owned ? `0 4px 16px ${r.color}20` : `0 1px 6px ${T.shadow}`,
    }}
      onMouseEnter={e => { if (owned) (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}
    >
      {/* Image */}
      <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', overflow: 'hidden', background: dark ? '#1A1D2E' : '#F0F4F8' }}>
        {!imgErr ? (
          <img src={imgUrl(card.unsplash_id)} alt={card.name_en}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={() => setImgErr(true)} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, opacity: 0.3 }}>🌍</div>
        )}
        {/* Lock overlay */}
        {!owned && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Lock size={16} color="white" />
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: 700, background: 'rgba(0,0,0,0.4)', borderRadius: 10, padding: '2px 10px' }}>
              Complete a topic to unlock
            </div>
          </div>
        )}
        {/* Rarity strip */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: r.color }} />
        {/* Owned badge */}
        {owned && (
          <div style={{ position: 'absolute', top: 7, right: 7, width: 22, height: 22, borderRadius: '50%', background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Check size={12} color="white" strokeWidth={3} />
          </div>
        )}
      </div>

      <div style={{ padding: '10px 12px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ fontWeight: 800, fontSize: 13, color: T.text, lineHeight: 1.2 }}>{card.name_en}</div>
          <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 10, background: dark ? r.darkBg : r.bg, color: r.color, marginLeft: 4, flexShrink: 0, border: `0.5px solid ${r.color}40` }}>
            {r.label}
          </span>
        </div>
        <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 6 }}>
          📍 {owned ? card.location_en : '???'}
        </div>
        <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.5, minHeight: 36 }}>
          {owned ? card.fact_en : 'Complete a lesson to discover this animal'}
        </div>
      </div>
    </div>
  )
}

// ─── Card detail modal ────────────────────────────────────────
function CardModal({ card, onClose, dark }: { card: Card; onClose: () => void; dark: boolean }) {
  const T = dark ? D : L
  const r = RARITY[card.rarity]
  const [imgErr, setImgErr] = useState(false)

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <div style={{ background: T.card, borderRadius: 20, maxWidth: 400, width: '100%', overflow: 'hidden', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.35)' }}
        onClick={e => e.stopPropagation()}>

        <div style={{ position: 'relative', aspectRatio: '16/9', background: dark ? '#1A1D2E' : '#f0f4f8', overflow: 'hidden' }}>
          {!imgErr ? (
            <img src={imgUrl(card.unsplash_id, 760, 427)} alt={card.name_en}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={() => setImgErr(true)} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64, background: dark ? r.darkBg : r.bg }}>🌍</div>
          )}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 50%)' }} />
          <div style={{ position: 'absolute', bottom: 14, left: 16 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'white', marginBottom: 3 }}>{card.name_en}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>📍 {card.location_en}</div>
          </div>
          <button onClick={onClose} style={{ position: 'absolute', top: 10, right: 10, width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.45)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={14} color="white" />
          </button>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: r.color }} />
        </div>

        <div style={{ padding: '16px 18px 22px' }}>
          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 10, background: dark ? r.darkBg : r.bg, color: r.color, border: `0.5px solid ${r.color}40` }}>
            {r.label}
          </span>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: '14px 0' }}>
            {(card.facts_en || [card.fact_en]).filter(Boolean).map((fact, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: dark ? r.darkBg : r.bg, color: r.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>
                  {i + 1}
                </div>
                <div style={{ fontSize: 13, color: T.textSec, lineHeight: 1.6 }}>{fact}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
            {[['Habitat', card.habitat_en], ['Top Speed', card.speed], ['Lifespan', card.lifespan], ['Diet', card.diet_en]].map(([label, value]) => (
              <div key={label} style={{ background: T.inputBg, borderRadius: 10, padding: '9px 11px', border: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 2, fontWeight: 600 }}>{label}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{value || '—'}</div>
              </div>
            ))}
          </div>

          {card.fun_fact_en && (
            <div style={{ background: dark ? r.darkBg : `${r.color}12`, border: `0.5px solid ${r.color}30`, borderRadius: 10, padding: '11px 13px', marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: r.color, marginBottom: 4 }}>⚡ Did you know?</div>
              <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.6 }}>{card.fun_fact_en}</div>
            </div>
          )}

          <button onClick={onClose} style={{ width: '100%', padding: 11, borderRadius: 12, border: `1px solid ${T.border}`, background: T.card, cursor: 'pointer', fontSize: 14, color: T.textSec, fontFamily: 'inherit', fontWeight: 700 }}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────
export default function CardsPage() {
  const [phases, setPhases]         = useState<Phase[]>([])
  const [cards, setCards]           = useState<Card[]>([])
  const [ownedIds, setOwnedIds]     = useState<Set<string>>(new Set())
  const [xp, setXp]                 = useState(0)
  const [loading, setLoading]       = useState(true)
  const [activePhase, setActive]    = useState<string | null>(null)
  const [openCard, setOpenCard]     = useState<Card | null>(null)
  const [toast, setToast]           = useState<string | null>(null)
  const [dark, setDark]             = useState(false)

  const T = dark ? D : L

  const params  = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  const childId = params?.get('childId') || ''
  const token   = params?.get('token') || ''

  const showToast = useCallback((msg: string) => {
    setToast(msg); setTimeout(() => setToast(null), 3200)
  }, [])

  useEffect(() => {
    async function load() {
      try {
        const [cardsRes, progressRes] = await Promise.all([
          fetch(`/api/cards?childId=${childId}`),
          fetch(`/api/progress?childId=${childId}`),
        ])
        const cardsData    = await cardsRes.json()
        const progressData = await progressRes.json()
        setPhases(cardsData.phases || [])
        setCards(cardsData.cards || [])
        setOwnedIds(new Set(cardsData.ownedIds || []))
        setXp(progressData.xp || 0)
        const first = (cardsData.phases || [])[0]
        if (first) setActive(first.slug)
      } catch {}
      setLoading(false)
    }
    if (childId) load()
    else setLoading(false)
  }, [childId])

  function phaseComplete(phase: Phase) {
    const pc = cards.filter(c => c.phase_id === phase.id)
    return pc.length > 0 && pc.every(c => ownedIds.has(c.id))
  }

  const completedSlugs  = phases.filter(phaseComplete).map(p => p.slug)
  const currentPhase    = phases.find(p => p.slug === activePhase)
  const phaseCards      = cards.filter(c => c.phase_id === currentPhase?.id)
  const totalOwned      = ownedIds.size
  const totalCards      = cards.length
  const overallPct      = totalCards > 0 ? Math.round((totalOwned / totalCards) * 100) : 0

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.bg, fontFamily: '"Nunito", system-ui, sans-serif' }}>
      <div style={{ textAlign: 'center', color: T.textMuted }}>
        <Globe size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', fontWeight: 700 }}>
          <Loader2 size={16} style={{ animation: 'spin 0.7s linear infinite' }} /> Loading collection…
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: '"Nunito", system-ui, sans-serif', color: T.text, transition: 'background 0.2s' }}>
      <style>{`
        * { box-sizing: border-box; }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes slideIn { from{opacity:0;transform:translateX(40px)} to{opacity:1;transform:translateX(0)} }
        @keyframes slideUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .card-hover { transition: transform 0.15s ease, box-shadow 0.15s ease !important; }
        .card-hover:hover { transform: translateY(-3px) !important; }
        .phase-btn { transition: all 0.15s ease !important; }
        @media(max-width:640px) {
          .cards-grid { grid-template-columns: repeat(2,1fr) !important; }
          .stat-row { grid-template-columns: repeat(2,1fr) !important; }
        }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 22, right: 22, zIndex: 999, padding: '12px 18px', borderRadius: 14, background: '#F0FDF4', border: '1px solid #86EFAC', color: '#166534', fontWeight: 700, fontSize: 13, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', animation: 'slideIn 0.25s ease' }}>
          {toast}
        </div>
      )}

      {openCard && <CardModal card={openCard} onClose={() => setOpenCard(null)} dark={dark} />}

      {/* Header */}
      <header style={{
        background: T.card, borderBottom: `1px solid ${T.border}`,
        padding: '0 20px', height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: `0 2px 12px ${T.shadow}`, gap: 14,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => window.location.href = token ? `/play/${token}` : '/dashboard'} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '7px 13px', borderRadius: 10,
            border: `1px solid ${T.border}`, background: T.card,
            color: T.textSec, fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            <ArrowLeft size={13} /> Back
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <img src="/icons/icon-512.png" alt="EduPlay" style={{ width: 30, height: 30, borderRadius: 8, boxShadow: '0 2px 6px rgba(74,127,212,0.2)' }} />
            <div>
              <div style={{ fontWeight: 900, fontSize: 15, color: T.text, letterSpacing: '-0.01em' }}>
                Animal Collection
              </div>
              <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 600 }}>
                {totalOwned} / {totalCards} collected
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* XP */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 50, background: dark ? 'rgba(245,158,11,0.15)' : '#FEF3C7', border: '1px solid #F59E0B30' }}>
            <Zap size={14} fill="#F59E0B" color="#F59E0B" />
            <span style={{ fontWeight: 900, fontSize: 15, color: '#B45309' }}>{xp.toLocaleString()}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#92400E' }}>XP</span>
          </div>
          {/* Dark mode */}
          <button onClick={() => setDark(v => !v)} style={{ width: 34, height: 34, borderRadius: '50%', border: `1px solid ${T.border}`, background: T.inputBg, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textSec }}>
            {dark ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </header>

      <div style={{ padding: '16px 20px', maxWidth: 920, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* Overall progress banner */}
        <div style={{ background: 'linear-gradient(135deg,#4A7FD4,#2EC4B6)', borderRadius: 18, padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 8px 24px rgba(74,127,212,0.3)', animation: 'slideUp 0.25s ease' }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Trophy size={26} color="white" fill="rgba(255,255,255,0.8)" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'white', marginBottom: 6 }}>
              {totalOwned === totalCards && totalCards > 0
                ? '🏆 Collection complete! Amazing!'
                : `${totalOwned} of ${totalCards} animals discovered`}
            </div>
            <div style={{ height: 8, background: 'rgba(255,255,255,0.2)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${overallPct}%`, background: 'white', borderRadius: 99, transition: 'width 0.6s ease' }} />
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 4, fontWeight: 700 }}>
              {overallPct}% complete · Complete lessons to earn more cards
            </div>
          </div>
        </div>

        {/* How to earn hint */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderRadius: 12, background: T.card, border: `1px solid ${T.border}`, fontSize: 13, color: T.textSec }}>
          <BookOpen size={16} color="#4A7FD4" style={{ flexShrink: 0 }} />
          <span><strong style={{ color: T.text }}>How to earn cards:</strong> Complete any lesson topic and a random animal card unlocks automatically — no XP spending needed!</span>
        </div>

        {/* World map */}
        <WorldMap activePhase={activePhase} completedPhases={completedSlugs} onSelect={setActive} />

        {/* Phase tabs */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {phases.map((phase, idx) => {
            const phaseOwned = cards.filter(c => c.phase_id === phase.id && ownedIds.has(c.id)).length
            const phaseTotal = cards.filter(c => c.phase_id === phase.id).length
            const done       = phaseOwned === phaseTotal && phaseTotal > 0
            const prevPhase  = phases[idx - 1]
            const unlocked   = idx === 0 || (prevPhase && phaseComplete(prevPhase))
            const isActive   = activePhase === phase.slug

            return (
              <button key={phase.id} className="phase-btn" onClick={() => setActive(phase.slug)} style={{
                display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
                padding: '8px 14px', borderRadius: 50,
                border: `1.5px solid ${isActive ? phase.color : T.border}`,
                background: isActive ? `${phase.color}18` : T.card,
                color: isActive ? phase.color : unlocked ? T.text : T.textMuted,
                fontWeight: 700, fontSize: 12, cursor: 'pointer', flexShrink: 0,
                opacity: unlocked ? 1 : 0.55, fontFamily: 'inherit',
                boxShadow: isActive ? `0 2px 12px ${phase.color}25` : 'none',
              }}>
                <span style={{ fontSize: 15 }}>{phase.emoji}</span>
                {phase.name_en}
                <span style={{ fontSize: 11, fontWeight: 600, color: done ? '#10B981' : isActive ? phase.color : T.textMuted }}>
                  {done ? '✓' : `${phaseOwned}/${phaseTotal}`}
                </span>
                {!unlocked && <Lock size={11} />}
              </button>
            )
          })}
        </div>

        {/* Current phase header */}
        {currentPhase && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: dark ? `${currentPhase.color}15` : `${currentPhase.color}10`, borderRadius: 14, padding: '14px 18px', border: `1px solid ${currentPhase.color}25` }}>
            <div style={{ fontSize: 36, lineHeight: 1 }}>{currentPhase.emoji}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 900, fontSize: 17, color: T.text, marginBottom: 2 }}>{currentPhase.name_en}</div>
              <div style={{ fontSize: 13, color: T.textSec }}>{currentPhase.description_en}</div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontWeight: 900, fontSize: 20, color: currentPhase.color }}>
                {cards.filter(c => c.phase_id === currentPhase.id && ownedIds.has(c.id)).length}
                <span style={{ fontSize: 13, color: T.textMuted }}>/{cards.filter(c => c.phase_id === currentPhase.id).length}</span>
              </div>
              <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 600 }}>collected</div>
            </div>
          </div>
        )}

        {/* Cards grid */}
        <div className="cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))', gap: 14 }}>
          {phaseCards.map(card => (
            <AnimalCard key={card.id} card={card} owned={ownedIds.has(card.id)}
              onOpen={() => setOpenCard(card)} dark={dark} />
          ))}
        </div>

        {/* Phase complete banner */}
        {currentPhase && phaseComplete(currentPhase) && (
          <div style={{ textAlign: 'center', padding: '22px 20px', background: dark ? 'rgba(16,185,129,0.12)' : '#ECFDF5', borderRadius: 18, border: dark ? '1px solid rgba(16,185,129,0.25)' : '1px solid #6EE7B7', animation: 'slideUp 0.25s ease' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
            <div style={{ fontWeight: 900, fontSize: 17, color: '#065F46', marginBottom: 4 }}>
              {currentPhase.name_en} complete!
            </div>
            <div style={{ fontSize: 13, color: '#047857', marginBottom: 14 }}>
              You collected all {phaseCards.length} animals. Keep completing lessons for the next phase!
            </div>
            {phases.find(p => p.sort_order === currentPhase.sort_order + 1) && (
              <button onClick={() => {
                const next = phases.find(p => p.sort_order === currentPhase.sort_order + 1)
                if (next) setActive(next.slug)
              }} style={{ padding: '9px 20px', borderRadius: 50, background: '#10B981', border: 'none', color: 'white', fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(16,185,129,0.35)' }}>
                Next region <ChevronRight size={14} />
              </button>
            )}
          </div>
        )}

        {phaseCards.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, background: T.card, borderRadius: 16, border: `1px solid ${T.border}` }}>
            <Globe size={36} style={{ opacity: 0.2, marginBottom: 12 }} />
            <div style={{ fontWeight: 800, fontSize: 16, color: T.text, marginBottom: 6 }}>No animals yet</div>
            <div style={{ fontSize: 13, color: T.textMuted }}>Select a region on the map to explore</div>
          </div>
        )}
      </div>
    </div>
  )
}