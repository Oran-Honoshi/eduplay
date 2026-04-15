'use client'
import { useState, useEffect, useCallback } from 'react'
import {
  ArrowLeft, Star, Lock, Check, ChevronRight, X,
  Zap, MapPin, Clock, Utensils, Gauge, Globe,
  Trophy, Sparkles,
} from 'lucide-react'
import WorldMap from '@/components/WorldMap'

// ─── Types ────────────────────────────────────────────────────
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
  fact_en: string; fact_he: string
  facts_en: string[]; facts_he: string[]
  habitat_en: string; habitat_he: string
  speed: string; lifespan: string; diet_en: string; diet_he: string
  fun_fact_en: string; fun_fact_he: string
  sort_order: number
}

// ─── Constants ────────────────────────────────────────────────
const RARITY: Record<string, { label: string; color: string; bg: string; text: string; glow: string }> = {
  common:    { label: 'Common',    color: '#6B7280', bg: '#F9FAFB',  text: '#374151', glow: '#6B728020' },
  rare:      { label: 'Rare',      color: '#3B82F6', bg: '#EFF6FF',  text: '#1E40AF', glow: '#3B82F620' },
  epic:      { label: 'Epic',      color: '#8B5CF6', bg: '#F5F3FF',  text: '#4C1D95', glow: '#8B5CF620' },
  legendary: { label: 'Legendary', color: '#F59E0B', bg: '#FFFBEB',  text: '#78350F', glow: '#F59E0B25' },
}

function imgUrl(id: string, w = 400, h = 280) {
  return `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&auto=format&q=80`
}

// ─── Toast ────────────────────────────────────────────────────
function Toast({ message, type = 'success' }: { message: string; type?: 'success' | 'error' | 'info' }) {
  const cfg = {
    success: { bg: '#F0FDF4', border: '#86EFAC', text: '#166534', icon: '✓' },
    error:   { bg: '#FEF2F2', border: '#FCA5A5', text: '#991B1B', icon: '✕' },
    info:    { bg: '#EFF6FF', border: '#93C5FD', text: '#1E40AF', icon: 'i' },
  }[type]

  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 20, zIndex: 400,
      padding: '12px 18px', borderRadius: 14,
      background: cfg.bg, border: `1px solid ${cfg.border}`,
      color: cfg.text, fontWeight: 700, fontSize: 13,
      boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
      animation: 'slideInRight 0.25s ease',
      display: 'flex', alignItems: 'center', gap: 8,
      fontFamily: '"Nunito", sans-serif',
    }}>
      <div style={{
        width: 20, height: 20, borderRadius: '50%',
        background: cfg.border, color: cfg.text,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 900,
      }}>
        {cfg.icon}
      </div>
      {message}
    </div>
  )
}

// ─── Animal Card ──────────────────────────────────────────────
function AnimalCard({ card, owned, xp, onBuy, onOpen }: {
  card: Card; owned: boolean; xp: number
  onBuy: () => void; onOpen: () => void
}) {
  const r = RARITY[card.rarity] || RARITY.common
  const [imgErr, setImgErr] = useState(false)
  const [buying, setBuying] = useState(false)

  const canAfford = xp >= card.xp_cost

  async function handleBuy(e: React.MouseEvent) {
    e.stopPropagation()
    if (buying) return
    setBuying(true)
    await onBuy()
    setBuying(false)
  }

  return (
    <div
      onClick={owned ? onOpen : undefined}
      style={{
        background: 'white',
        borderRadius: 16,
        overflow: 'hidden',
        border: `1.5px solid ${owned ? r.color + '40' : '#F3F4F6'}`,
        cursor: owned ? 'pointer' : 'default',
        transition: 'transform 0.18s ease, box-shadow 0.18s ease',
        boxShadow: owned ? `0 4px 18px ${r.glow}` : '0 2px 8px rgba(0,0,0,0.04)',
        position: 'relative',
      }}
      onMouseEnter={e => {
        if (owned) {
          (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'
          ;(e.currentTarget as HTMLElement).style.boxShadow = `0 12px 32px ${r.glow}`
        }
      }}
      onMouseLeave={e => {
        ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
        ;(e.currentTarget as HTMLElement).style.boxShadow = owned ? `0 4px 18px ${r.glow}` : '0 2px 8px rgba(0,0,0,0.04)'
      }}
    >
      {/* Image */}
      <div style={{
        position: 'relative', width: '100%', aspectRatio: '4/3',
        overflow: 'hidden', background: imgErr ? `${r.color}12` : '#F1F5F9',
      }}>
        {!imgErr ? (
          <img
            src={imgUrl(card.unsplash_id)}
            alt={card.name_en}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={() => setImgErr(true)}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 36, opacity: 0.4,
          }}>
            🌍
          </div>
        )}

        {/* Lock overlay */}
        {!owned && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.6) 100%)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(4px)',
            }}>
              <Lock size={16} color="white" />
            </div>
            <div style={{
              fontSize: 11, color: '#FEF3C7', fontWeight: 800,
              background: 'rgba(0,0,0,0.35)', borderRadius: 20, padding: '3px 10px',
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <Star size={10} fill="#F59E0B" color="#F59E0B" />
              {card.xp_cost} XP
            </div>
          </div>
        )}

        {/* Owned check */}
        {owned && (
          <div style={{
            position: 'absolute', top: 7, right: 7,
            width: 22, height: 22, borderRadius: '50%',
            background: '#10B981',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(16,185,129,0.4)',
          }}>
            <Check size={11} color="white" strokeWidth={3} />
          </div>
        )}

        {/* Rarity accent */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: 3, background: r.color, opacity: owned ? 1 : 0.5,
        }} />
      </div>

      {/* Content */}
      <div style={{ padding: '10px 12px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6, marginBottom: 4 }}>
          <div style={{ fontWeight: 800, fontSize: 13, color: '#111827', lineHeight: 1.25 }}>
            {card.name_en}
          </div>
          <span style={{
            fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 20,
            background: r.bg, color: r.text, border: `1px solid ${r.color}30`,
            flexShrink: 0, whiteSpace: 'nowrap',
          }}>
            {r.label}
          </span>
        </div>

        <div style={{
          fontSize: 11, color: '#9CA3AF', marginBottom: 6,
          display: 'flex', alignItems: 'center', gap: 3,
        }}>
          <MapPin size={9} />
          {owned ? card.location_en : '???'}
        </div>

        <div style={{
          fontSize: 12, color: '#6B7280', lineHeight: 1.55,
          marginBottom: 10, minHeight: 36,
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {owned ? card.fact_en : 'Unlock to discover this animal'}
        </div>

        {!owned && (
          <button
            onClick={handleBuy}
            disabled={!canAfford || buying}
            style={{
              width: '100%', padding: '8px', borderRadius: 10, border: 'none',
              cursor: canAfford && !buying ? 'pointer' : 'not-allowed',
              background: canAfford
                ? 'linear-gradient(135deg, #F59E0B, #D97706)'
                : '#F3F4F6',
              color: canAfford ? 'white' : '#9CA3AF',
              fontWeight: 800, fontSize: 12, fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              transition: 'all 0.18s ease',
              opacity: buying ? 0.7 : 1,
            }}
          >
            {buying ? (
              <>
                <div style={{ width: 10, height: 10, borderRadius: '50%', border: '2px solid #fff', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
                Unlocking...
              </>
            ) : (
              <>
                <Star size={10} fill="currentColor" color="currentColor" />
                {card.xp_cost} XP — Unlock
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Card Detail Modal ─────────────────────────────────────────
function CardModal({ card, onClose }: { card: Card; onClose: () => void }) {
  const r = RARITY[card.rarity] || RARITY.common
  const [imgErr, setImgErr] = useState(false)

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16, animation: 'fadeIn 0.15s ease',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white', borderRadius: 24, maxWidth: 400, width: '100%',
          overflow: 'hidden', maxHeight: '90vh', overflowY: 'auto',
          boxShadow: '0 24px 80px rgba(0,0,0,0.22)',
          animation: 'slideUp 0.2s ease',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Hero image */}
        <div style={{ position: 'relative', aspectRatio: '16/9', background: '#f0f4f8', overflow: 'hidden' }}>
          {!imgErr ? (
            <img
              src={imgUrl(card.unsplash_id, 760, 427)}
              alt={card.name_en}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={() => setImgErr(true)}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 64, background: `${r.color}12`,
            }}>
              🌍
            </div>
          )}
          {/* Gradient overlay */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 55%)',
          }} />
          <div style={{ position: 'absolute', bottom: 14, left: 18 }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: 'white', letterSpacing: '-0.02em', marginBottom: 3 }}>
              {card.name_en}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <MapPin size={11} />
              {card.location_en}
            </div>
          </div>
          {/* Rarity bar */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: r.color }} />
          {/* Close */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 10, right: 10,
              width: 30, height: 30, borderRadius: '50%',
              background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.7)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.4)')}
          >
            <X size={14} color="white" />
          </button>
        </div>

        <div style={{ padding: '18px 20px 24px' }}>
          {/* Rarity badge */}
          <div style={{ marginBottom: 16 }}>
            <span style={{
              fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 20,
              background: r.bg, color: r.text, border: `1px solid ${r.color}30`,
            }}>
              {r.label}
            </span>
          </div>

          {/* Facts */}
          {card.facts_en?.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
              <div className="ep-section-label">Facts</div>
              {card.facts_en.map((fact, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                    background: r.bg, color: r.text,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 800, marginTop: 1,
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>{fact}</div>
                </div>
              ))}
            </div>
          )}

          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
            {[
              { icon: Globe, label: 'Habitat',   value: card.habitat_en },
              { icon: Gauge, label: 'Top Speed',  value: card.speed },
              { icon: Clock, label: 'Lifespan',   value: card.lifespan },
              { icon: Utensils, label: 'Diet',    value: card.diet_en },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} style={{
                background: '#F9FAFB', borderRadius: 12, padding: '10px 12px',
                border: '1px solid #F3F4F6',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                  <Icon size={11} color="#9CA3AF" />
                  <div style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {label}
                  </div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{value || '—'}</div>
              </div>
            ))}
          </div>

          {/* Fun fact */}
          {card.fun_fact_en && (
            <div style={{
              background: `${r.color}0E`,
              border: `1px solid ${r.color}25`,
              borderRadius: 12, padding: '12px 14px', marginBottom: 18,
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 5,
                fontSize: 11, fontWeight: 800, color: r.color,
                marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>
                <Zap size={11} fill={r.color} color={r.color} />
                Did you know?
              </div>
              <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>
                {card.fun_fact_en}
              </div>
            </div>
          )}

          <button
            onClick={onClose}
            style={{
              width: '100%', padding: '11px', borderRadius: 12,
              border: '1.5px solid #E5E7EB', background: 'white',
              cursor: 'pointer', fontSize: 14, fontWeight: 700,
              color: '#374151', fontFamily: 'inherit',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              (e.currentTarget.style.background = '#F9FAFB')
              ;(e.currentTarget.style.borderColor = '#D1D5DB')
            }}
            onMouseLeave={e => {
              (e.currentTarget.style.background = 'white')
              ;(e.currentTarget.style.borderColor = '#E5E7EB')
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Skeleton loader ──────────────────────────────────────────
function CardSkeleton() {
  return (
    <div style={{
      background: 'white', borderRadius: 16, overflow: 'hidden',
      border: '1px solid #F3F4F6', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    }}>
      <div className="ep-skeleton" style={{ aspectRatio: '4/3', width: '100%' }} />
      <div style={{ padding: '10px 12px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div className="ep-skeleton" style={{ height: 14, width: '70%', borderRadius: 6 }} />
        <div className="ep-skeleton" style={{ height: 11, width: '45%', borderRadius: 6 }} />
        <div className="ep-skeleton" style={{ height: 30, width: '100%', borderRadius: 6 }} />
        <div className="ep-skeleton" style={{ height: 34, width: '100%', borderRadius: 10 }} />
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────
export default function CardsPage() {
  const [phases, setPhases]     = useState<Phase[]>([])
  const [cards, setCards]       = useState<Card[]>([])
  const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set())
  const [xp, setXp]             = useState(0)
  const [loading, setLoading]   = useState(true)
  const [activePhase, setActive] = useState<string | null>(null)
  const [openCard, setOpenCard]  = useState<Card | null>(null)
  const [toast, setToast]        = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null)

  const childId = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('childId') || ''
    : ''
  const token = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('token') || ''
    : ''

  const showToast = useCallback((msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3200)
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

        const firstPhase = (cardsData.phases || [])[0]
        if (firstPhase) setActive(firstPhase.slug)
      } catch {
        showToast('Failed to load collection', 'error')
      } finally {
        setLoading(false)
      }
    }
    if (childId) load()
    else setLoading(false)
  }, [childId, showToast])

  async function buyCard(card: Card) {
    if (xp < card.xp_cost) { showToast('Not enough XP!', 'error'); return }
    const res  = await fetch('/api/cards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ childId, cardId: card.id }),
    })
    const data = await res.json()
    if (data.success) {
      setOwnedIds(prev => new Set([...prev, card.id]))
      setXp(data.newXP)
      showToast(`${card.name_en} added to your collection!`)
    } else {
      showToast(data.error || 'Purchase failed', 'error')
    }
  }

  const phaseComplete = (phase: Phase) => {
    const pc = cards.filter(c => c.phase_id === phase.id)
    return pc.length > 0 && pc.every(c => ownedIds.has(c.id))
  }
  const completedSlugs = phases.filter(phaseComplete).map(p => p.slug)

  const currentPhase = phases.find(p => p.slug === activePhase)
  const phaseCards   = cards.filter(c => c.phase_id === currentPhase?.id)
  const phaseOwned   = phaseCards.filter(c => ownedIds.has(c.id)).length
  const totalOwned   = ownedIds.size
  const totalCards   = cards.length

  // Overall progress %
  const overallPct = totalCards > 0 ? Math.round((totalOwned / totalCards) * 100) : 0

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', fontFamily: '"Nunito", sans-serif' }}>
      {/* ── Inject keyframes ── */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideInRight { from { opacity:0; transform:translateX(80px); } to { opacity:1; transform:translateX(0); } }
        @keyframes fadeIn { from { opacity:0; transform:scale(0.97); } to { opacity:1; transform:scale(1); } }
        @keyframes slideUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        .ep-skeleton { background: linear-gradient(90deg,#F3F4F6 25%,#E9EAEC 50%,#F3F4F6 75%); background-size:200% 100%; animation:shimmer 1.5s infinite; }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        .ep-section-label { display:flex;align-items:center;gap:8px;font-size:11px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;color:#6B7280;margin-bottom:12px; }
        .ep-section-label::before { content:'';display:inline-block;width:2px;height:14px;background:#4A7FD4;border-radius:2px; }
      `}</style>

      {/* Toast */}
      {toast && <Toast message={toast.msg} type={toast.type} />}

      {/* Card modal */}
      {openCard && <CardModal card={openCard} onClose={() => setOpenCard(null)} />}

      {/* ── Header ── */}
      <header style={{
        background: 'white', borderBottom: '1px solid #F3F4F6',
        padding: '0 20px', height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => window.location.href = token ? `/play/${token}` : '/dashboard'}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '7px 14px', borderRadius: 50,
              border: '1.5px solid #E5E7EB', background: 'white',
              color: '#374151', fontWeight: 700, fontSize: 12,
              cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit',
            }}
            onMouseEnter={e => {
              (e.currentTarget.style.borderColor = '#4A7FD4')
              ;(e.currentTarget.style.color = '#4A7FD4')
            }}
            onMouseLeave={e => {
              (e.currentTarget.style.borderColor = '#E5E7EB')
              ;(e.currentTarget.style.color = '#374151')
            }}
          >
            <ArrowLeft size={13} /> Back
          </button>

          {/* Title area */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 12,
              background: 'linear-gradient(135deg, #4A7FD4, #2EC4B6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(74,127,212,0.3)',
            }}>
              <Globe size={18} color="white" />
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: 16, color: '#111827', letterSpacing: '-0.02em' }}>
                Animal Collection
              </div>
              <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600 }}>
                {totalOwned} / {totalCards} cards
              </div>
            </div>
          </div>
        </div>

        {/* XP pill */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '7px 16px', borderRadius: 50,
          background: '#FFFBEB', border: '1.5px solid #F59E0B50',
        }}>
          <Star size={15} color="#F59E0B" fill="#F59E0B" />
          <span style={{ fontWeight: 900, fontSize: 16, color: '#B45309' }}>
            {xp.toLocaleString()}
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#92400E' }}>XP</span>
        </div>
      </header>

      {/* ── Body ── */}
      <div style={{ padding: '20px', maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Overall progress banner */}
        {!loading && (
          <div style={{
            background: 'linear-gradient(135deg, #4A7FD4, #2EC4B6)',
            borderRadius: 20, padding: '18px 22px',
            boxShadow: '0 8px 28px rgba(74,127,212,0.3)',
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Decorative circles */}
            <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
            <div style={{ position: 'absolute', bottom: -30, right: 60, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, position: 'relative' }}>
              <div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: 700, marginBottom: 4 }}>
                  Collection Progress
                </div>
                <div style={{ fontSize: 28, fontWeight: 900, color: 'white', letterSpacing: '-0.02em', lineHeight: 1 }}>
                  {totalOwned}
                  <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)' }}>/{totalCards}</span>
                  <span style={{ fontSize: 14, color: '#FFD700', marginLeft: 8, fontWeight: 800 }}>
                    {overallPct}%
                  </span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 6, fontWeight: 700 }}>
                  {completedSlugs.length} / {phases.length} regions
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Trophy size={14} color="#FFD700" fill="#FFD700" />
                  <span style={{ fontSize: 13, color: '#FFD700', fontWeight: 800 }}>
                    {completedSlugs.length > 0 ? 'Explorer' : 'Beginner'}
                  </span>
                </div>
              </div>
            </div>
            {/* Progress bar */}
            <div style={{ marginTop: 14, background: 'rgba(255,255,255,0.2)', borderRadius: 99, height: 8, overflow: 'hidden' }}>
              <div style={{
                height: '100%', background: 'white',
                borderRadius: 99, width: `${overallPct}%`,
                transition: 'width 0.6s ease',
              }} />
            </div>
          </div>
        )}

        {/* World Map */}
        <WorldMap
          activePhase={activePhase}
          completedPhases={completedSlugs}
          onSelect={slug => setActive(slug)}
        />

        {/* Phase tabs */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="ep-skeleton" style={{ height: 36, width: 100, borderRadius: 50, flexShrink: 0 }} />
              ))
            : phases.map((phase, idx) => {
                const po       = cards.filter(c => c.phase_id === phase.id && ownedIds.has(c.id)).length
                const pt       = cards.filter(c => c.phase_id === phase.id).length
                const done     = po === pt && pt > 0
                const prevPhase = phases[idx - 1]
                const unlocked  = idx === 0 || (prevPhase && phaseComplete(prevPhase))
                const isActive  = activePhase === phase.slug

                return (
                  <button
                    key={phase.id}
                    onClick={() => setActive(phase.slug)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      whiteSpace: 'nowrap', padding: '7px 14px',
                      borderRadius: 50, border: '1.5px solid',
                      borderColor: isActive ? (phase.color || '#4A7FD4') : '#E5E7EB',
                      background: isActive ? `${phase.color || '#4A7FD4'}15` : 'white',
                      color: isActive ? (phase.color || '#4A7FD4') : unlocked ? '#374151' : '#9CA3AF',
                      fontWeight: 700, fontSize: 12, cursor: 'pointer',
                      flexShrink: 0, opacity: unlocked ? 1 : 0.55,
                      transition: 'all 0.18s ease', fontFamily: 'inherit',
                    }}
                  >
                    <span style={{ fontSize: 14 }}>{phase.emoji}</span>
                    {phase.name_en}
                    <span style={{
                      fontSize: 10, fontWeight: 800,
                      color: done ? '#10B981' : isActive ? (phase.color || '#4A7FD4') : '#9CA3AF',
                    }}>
                      {done ? '✓' : `${po}/${pt}`}
                    </span>
                    {!unlocked && <Lock size={10} />}
                  </button>
                )
              })}
        </div>

        {/* Phase header */}
        {!loading && currentPhase && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 14,
            background: `${currentPhase.color || '#4A7FD4'}0C`,
            borderRadius: 16, padding: '14px 18px',
            border: `1px solid ${currentPhase.color || '#4A7FD4'}20`,
          }}>
            <div style={{ fontSize: 34, flexShrink: 0 }}>{currentPhase.emoji}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 900, fontSize: 17, color: '#111827', marginBottom: 2, letterSpacing: '-0.02em' }}>
                {currentPhase.name_en}
              </div>
              <div style={{ fontSize: 12, color: '#6B7280' }}>{currentPhase.description_en}</div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontWeight: 900, fontSize: 22, color: currentPhase.color || '#4A7FD4', lineHeight: 1 }}>
                {phaseOwned}
                <span style={{ fontSize: 14, color: '#9CA3AF', fontWeight: 700 }}>/{phaseCards.length}</span>
              </div>
              {/* Mini progress */}
              <div style={{ marginTop: 5, background: `${currentPhase.color}20`, borderRadius: 99, height: 5, width: 80, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', background: currentPhase.color || '#4A7FD4',
                  borderRadius: 99,
                  width: phaseCards.length > 0 ? `${(phaseOwned / phaseCards.length) * 100}%` : '0%',
                  transition: 'width 0.5s ease',
                }} />
              </div>
            </div>
          </div>
        )}

        {/* Cards grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(168px, 1fr))',
          gap: 14,
        }}>
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)
            : phaseCards.map(card => (
                <AnimalCard
                  key={card.id}
                  card={card}
                  owned={ownedIds.has(card.id)}
                  xp={xp}
                  onBuy={() => buyCard(card)}
                  onOpen={() => setOpenCard(card)}
                />
              ))}
        </div>

        {/* Phase complete banner */}
        {!loading && currentPhase && phaseComplete(currentPhase) && (
          <div style={{
            textAlign: 'center', padding: '24px 20px',
            background: 'linear-gradient(135deg, #ECFDF5, #D1FAE5)',
            borderRadius: 20, border: '1px solid #6EE7B7',
            animation: 'slideUp 0.25s ease',
          }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
            <div style={{ fontWeight: 900, fontSize: 17, color: '#065F46', marginBottom: 4, letterSpacing: '-0.02em' }}>
              {currentPhase.name_en} complete!
            </div>
            <div style={{ fontSize: 13, color: '#047857', marginBottom: 14 }}>
              You collected all {phaseCards.length} animals. Ready for the next region!
            </div>
            {phases.find(p => p.sort_order === currentPhase.sort_order + 1) && (
              <button
                onClick={() => {
                  const next = phases.find(p => p.sort_order === currentPhase.sort_order + 1)
                  if (next) setActive(next.slug)
                }}
                style={{
                  padding: '10px 22px', borderRadius: 50, border: 'none',
                  background: '#10B981', color: 'white',
                  fontWeight: 800, fontSize: 13, cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  boxShadow: '0 4px 14px rgba(16,185,129,0.35)',
                  transition: 'all 0.18s ease', fontFamily: 'inherit',
                }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-1px)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
              >
                <Sparkles size={14} />
                Next region <ChevronRight size={14} />
              </button>
            )}
          </div>
        )}

        {/* Empty state */}
        {!loading && phaseCards.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '48px 20px',
            color: '#9CA3AF',
          }}>
            <Globe size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
            <div style={{ fontWeight: 700, fontSize: 15, color: '#374151', marginBottom: 4 }}>
              No cards in this region yet
            </div>
            <div style={{ fontSize: 13 }}>Check back soon!</div>
          </div>
        )}
      </div>
    </div>
  )
}
