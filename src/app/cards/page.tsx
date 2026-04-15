'use client'
import { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, Star, Lock, Check, ChevronRight, X } from 'lucide-react'

// ─── TYPES ───────────────────────────────────────────────────
interface Phase {
  id: string; slug: string; name_en: string; name_he: string
  description_en: string; sort_order: number; cards_needed: number
  map_region: string; color: string; emoji: string
}
interface Card {
  id: string; phase_id: string; slug: string
  name_en: string; name_he: string; location_en: string; location_he: string
  rarity: 'common'|'rare'|'epic'|'legendary'
  xp_cost: number; unsplash_id: string
  fact_en: string; fact_he: string
  facts_en: string[]; facts_he: string[]
  habitat_en: string; habitat_he: string
  speed: string; lifespan: string; diet_en: string; diet_he: string
  fun_fact_en: string; fun_fact_he: string
  sort_order: number
}

// ─── CONSTANTS ───────────────────────────────────────────────
const RARITY: Record<string, { label: string; color: string; bg: string; text: string }> = {
  common:    { label:'Common',    color:'#888780', bg:'#F1EFE8', text:'#2C2C2A' },
  rare:      { label:'Rare',      color:'#378ADD', bg:'#E6F1FB', text:'#042C53' },
  epic:      { label:'Epic',      color:'#7F77DD', bg:'#EEEDFE', text:'#26215C' },
  legendary: { label:'Legendary', color:'#BA7517', bg:'#FAEEDA', text:'#412402' },
}

function imgUrl(unsplashId: string, w=400, h=280) {
  return `https://images.unsplash.com/photo-${unsplashId}?w=${w}&h=${h}&fit=crop&auto=format&q=80`
}

// ─── WORLD MAP SVG ───────────────────────────────────────────
const REGION_COLORS: Record<string, string> = {
  africa:        '#E67E22',
  asia:          '#E74C3C',
  north_america: '#3498DB',
  south_america: '#27AE60',
  europe:        '#8E44AD',
  oceania:       '#16A085',
  antarctica:    '#2980B9',
  ocean:         '#1ABC9C',
  birds:         '#F39C12',
  dinosaurs:     '#7F8C8D',
}

function WorldMap({ activePhase, completedPhases, onSelect }: {
  activePhase: string|null
  completedPhases: string[]
  onSelect: (slug: string) => void
}) {
  const regions = [
    { slug:'africa',        label:'Africa',        d:'M 290 220 L 310 210 L 340 215 L 350 240 L 345 270 L 330 300 L 310 310 L 290 300 L 280 270 L 275 245 Z' },
    { slug:'europe',        label:'Europe',        d:'M 265 155 L 290 148 L 310 155 L 308 175 L 290 185 L 268 178 Z' },
    { slug:'asia',          label:'Asia',          d:'M 315 140 L 420 135 L 450 155 L 445 185 L 420 200 L 390 205 L 360 200 L 330 195 L 315 175 Z' },
    { slug:'north_america', label:'N. America',    d:'M 100 140 L 170 130 L 200 155 L 195 195 L 175 215 L 145 220 L 115 200 L 95 175 Z' },
    { slug:'south_america', label:'S. America',    d:'M 145 235 L 185 225 L 200 250 L 195 300 L 175 325 L 150 320 L 135 295 L 130 265 Z' },
    { slug:'oceania',       label:'Oceania',       d:'M 400 265 L 450 258 L 465 275 L 460 300 L 435 308 L 405 300 L 395 280 Z' },
    { slug:'antarctica',    label:'Antarctica',    d:'M 150 355 L 250 348 L 350 350 L 400 358 L 390 375 L 300 382 L 200 380 L 140 372 Z' },
    { slug:'ocean',         label:'Ocean',         d:'M 470 180 L 500 175 L 510 195 L 500 215 L 470 210 Z' },
    { slug:'birds',         label:'Birds',         d:'M 50 200 L 75 195 L 82 210 L 75 225 L 50 220 Z' },
    { slug:'dinosaurs',     label:'Dinosaurs',     d:'M 500 240 L 535 235 L 545 255 L 535 275 L 500 270 Z' },
  ]

  return (
    <div style={{ position:'relative', width:'100%', background:'#0A1628', borderRadius:'16px', overflow:'hidden', padding:'8px 0' }}>
      <svg viewBox="0 0 580 400" width="100%" style={{ display:'block' }}>
        {/* Ocean background */}
        <rect x="0" y="0" width="580" height="400" fill="#0D2137"/>
        {/* Grid lines */}
        {[1,2,3,4,5].map(i => (
          <line key={`h${i}`} x1="0" y1={i*66} x2="580" y2={i*66} stroke="#142A45" strokeWidth="1"/>
        ))}
        {[1,2,3,4,5,6,7,8].map(i => (
          <line key={`v${i}`} x1={i*72} y1="0" x2={i*72} y2="400" stroke="#142A45" strokeWidth="1"/>
        ))}

        {regions.map(r => {
          const isActive    = activePhase === r.slug
          const isCompleted = completedPhases.includes(r.slug)
          const color       = REGION_COLORS[r.slug] || '#666'
          const opacity     = isActive ? 1 : isCompleted ? 0.85 : 0.45

          return (
            <g key={r.slug} onClick={() => onSelect(r.slug)} style={{ cursor:'pointer' }}>
              {/* Glow effect for active */}
              {isActive && (
                <path d={r.d} fill={color} opacity={0.25}
                  transform="scale(1.08) translate(-23, -17)" style={{ filter:'blur(8px)' }}/>
              )}
              <path d={r.d} fill={color} opacity={opacity}
                stroke={isActive ? 'white' : isCompleted ? color : '#1D3A5C'}
                strokeWidth={isActive ? 2.5 : 1}/>
              {/* Completion checkmark */}
              {isCompleted && (
                <g>
                  {/* get centroid roughly */}
                  <circle cx={0} cy={0} r={8} fill="#10B981" opacity={0}/>
                </g>
              )}
              {/* Label */}
              <text
                x={(() => {
                  const pts = r.d.match(/[\d.]+/g)?.map(Number) || []
                  const xs = pts.filter((_,i)=>i%2===0); return xs.reduce((a,b)=>a+b,0)/xs.length
                })()}
                y={(() => {
                  const pts = r.d.match(/[\d.]+/g)?.map(Number) || []
                  const ys = pts.filter((_,i)=>i%2===1); return ys.reduce((a,b)=>a+b,0)/ys.length + 5
                })()}
                textAnchor="middle" fontSize="9" fontWeight="600"
                fill={isActive ? 'white' : 'rgba(255,255,255,0.7)'}
                style={{ pointerEvents:'none', userSelect:'none' }}>
                {r.label}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// ─── CARD COMPONENT ──────────────────────────────────────────
function AnimalCard({ card, owned, xp, onBuy, onOpen }: {
  card: Card; owned: boolean; xp: number
  onBuy: () => void; onOpen: () => void
}) {
  const r = RARITY[card.rarity]
  const [imgErr, setImgErr] = useState(false)

  return (
    <div onClick={owned ? onOpen : undefined}
      style={{
        background:'white', borderRadius:'14px', overflow:'hidden',
        border:`1.5px solid ${owned ? r.color+'60' : '#F3F4F6'}`,
        cursor: owned ? 'pointer' : 'default',
        transition:'transform 0.15s, box-shadow 0.15s',
        boxShadow: owned ? `0 4px 16px ${r.color}20` : '0 1px 6px rgba(0,0,0,0.06)',
      }}
      onMouseEnter={e => { if(owned)(e.currentTarget as HTMLElement).style.transform='translateY(-3px)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform='translateY(0)' }}>

      {/* Image */}
      <div style={{ position:'relative', width:'100%', aspectRatio:'4/3', overflow:'hidden',
        background: imgErr ? `${r.color}18` : '#f0f4f8' }}>
        {!imgErr ? (
          <img src={imgUrl(card.unsplash_id)} alt={card.name_en}
            style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}
            onError={() => setImgErr(true)}/>
        ) : (
          <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center',
            justifyContent:'center', fontSize:'40px', opacity:0.4 }}>🌍</div>
        )}
        {/* Lock overlay */}
        {!owned && (
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.5)',
            display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'6px' }}>
            <div style={{ width:'36px', height:'36px', borderRadius:'50%', background:'rgba(255,255,255,0.15)',
              display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Lock size={16} color="white"/>
            </div>
            <div style={{ fontSize:'12px', color:'#FAEEDA', fontWeight:600,
              background:'rgba(0,0,0,0.4)', borderRadius:'10px', padding:'2px 10px' }}>
              ⭐ {card.xp_cost} XP
            </div>
          </div>
        )}
        {/* Rarity strip */}
        <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'3px', background:r.color }}/>
        {/* Owned indicator */}
        {owned && (
          <div style={{ position:'absolute', top:'7px', right:'7px', width:'22px', height:'22px',
            borderRadius:'50%', background:'#10B981', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Check size={12} color="white" strokeWidth={3}/>
          </div>
        )}
      </div>

      <div style={{ padding:'10px 11px 11px' }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'4px' }}>
          <div style={{ fontWeight:700, fontSize:'13px', color:'#111827', lineHeight:1.2 }}>{card.name_en}</div>
          <span style={{ fontSize:'9px', fontWeight:700, padding:'2px 6px', borderRadius:'10px',
            background:r.bg, color:r.text, border:`0.5px solid ${r.color}40`, marginLeft:'4px', flexShrink:0 }}>
            {r.label}
          </span>
        </div>
        <div style={{ fontSize:'11px', color:'#6B7280', marginBottom:'7px' }}>
          📍 {owned ? card.location_en : '???'}
        </div>
        <div style={{ fontSize:'12px', color:'#374151', lineHeight:1.5, marginBottom:'9px', minHeight:'36px' }}>
          {owned ? card.fact_en : 'Unlock to discover this animal'}
        </div>

        {!owned && (
          <button onClick={e => { e.stopPropagation(); onBuy() }}
            disabled={xp < card.xp_cost}
            style={{
              width:'100%', padding:'7px', borderRadius:'8px', border:'none', cursor: xp >= card.xp_cost ? 'pointer' : 'not-allowed',
              background: xp >= card.xp_cost ? 'linear-gradient(135deg,#F59E0B,#D97706)' : '#F3F4F6',
              color: xp >= card.xp_cost ? 'white' : '#9CA3AF',
              fontWeight:700, fontSize:'12px', display:'flex', alignItems:'center', justifyContent:'center', gap:'5px',
            }}>
            <Star size={11} fill="currentColor" color="currentColor"/>
            {card.xp_cost} XP — Unlock
          </button>
        )}
      </div>
    </div>
  )
}

// ─── CARD DETAIL MODAL ───────────────────────────────────────
function CardModal({ card, onClose }: { card: Card; onClose: () => void }) {
  const r = RARITY[card.rarity]
  const [imgErr, setImgErr] = useState(false)

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', zIndex:200,
      display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' }}
      onClick={onClose}>
      <div style={{ background:'white', borderRadius:'18px', maxWidth:'380px', width:'100%',
        overflow:'hidden', maxHeight:'90vh', overflowY:'auto' }}
        onClick={e => e.stopPropagation()}>

        {/* Photo */}
        <div style={{ position:'relative', aspectRatio:'16/9', background:'#f0f4f8', overflow:'hidden' }}>
          {!imgErr ? (
            <img src={imgUrl(card.unsplash_id, 760, 427)} alt={card.name_en}
              style={{ width:'100%', height:'100%', objectFit:'cover' }}
              onError={() => setImgErr(true)}/>
          ) : (
            <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center',
              justifyContent:'center', fontSize:'64px', background:`${r.color}18` }}>🌍</div>
          )}
          {/* Gradient overlay */}
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)' }}/>
          <div style={{ position:'absolute', bottom:'14px', left:'16px' }}>
            <div style={{ fontSize:'22px', fontWeight:700, color:'white', marginBottom:'4px' }}>{card.name_en}</div>
            <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.8)' }}>📍 {card.location_en}</div>
          </div>
          <button onClick={onClose} style={{ position:'absolute', top:'10px', right:'10px',
            width:'28px', height:'28px', borderRadius:'50%', background:'rgba(0,0,0,0.45)',
            border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <X size={14} color="white"/>
          </button>
          <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'3px', background:r.color }}/>
        </div>

        <div style={{ padding:'16px 18px 20px' }}>
          {/* Badge */}
          <div style={{ marginBottom:'14px' }}>
            <span style={{ fontSize:'11px', fontWeight:700, padding:'3px 9px', borderRadius:'10px',
              background:r.bg, color:r.text, border:`0.5px solid ${r.color}40` }}>{r.label}</span>
          </div>

          {/* Facts */}
          <div style={{ display:'flex', flexDirection:'column', gap:'10px', marginBottom:'16px' }}>
            {card.facts_en.map((fact, i) => (
              <div key={i} style={{ display:'flex', gap:'10px', alignItems:'flex-start' }}>
                <div style={{ width:'20px', height:'20px', borderRadius:'50%',
                  background:r.bg, color:r.text, display:'flex', alignItems:'center',
                  justifyContent:'center', fontSize:'11px', fontWeight:700, flexShrink:0, marginTop:'1px' }}>
                  {i+1}
                </div>
                <div style={{ fontSize:'13px', color:'#374151', lineHeight:1.6 }}>{fact}</div>
              </div>
            ))}
          </div>

          {/* Stats grid */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'14px' }}>
            {[['Habitat',card.habitat_en],['Top Speed',card.speed],['Lifespan',card.lifespan],['Diet',card.diet_en]].map(([l,v]) => (
              <div key={l} style={{ background:'#F9FAFB', borderRadius:'10px', padding:'9px 11px' }}>
                <div style={{ fontSize:'11px', color:'#9CA3AF', marginBottom:'2px' }}>{l}</div>
                <div style={{ fontSize:'13px', fontWeight:600, color:'#111827' }}>{v}</div>
              </div>
            ))}
          </div>

          {/* Fun fact */}
          {card.fun_fact_en && (
            <div style={{ background:`${r.color}12`, border:`0.5px solid ${r.color}30`,
              borderRadius:'10px', padding:'11px 13px', marginBottom:'16px' }}>
              <div style={{ fontSize:'11px', fontWeight:700, color:r.color, marginBottom:'4px' }}>
                ⚡ Did you know?
              </div>
              <div style={{ fontSize:'12px', color:'#374151', lineHeight:1.6 }}>{card.fun_fact_en}</div>
            </div>
          )}

          <button onClick={onClose} style={{ width:'100%', padding:'10px', borderRadius:'10px',
            border:'0.5px solid #E5E7EB', background:'white', cursor:'pointer', fontSize:'14px', color:'#374151' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── MAIN PAGE ───────────────────────────────────────────────
export default function CardsPage() {
  const [phases, setPhases]       = useState<Phase[]>([])
  const [cards, setCards]         = useState<Card[]>([])
  const [ownedIds, setOwnedIds]   = useState<Set<string>>(new Set())
  const [xp, setXp]               = useState(0)
  const [loading, setLoading]     = useState(true)
  const [activePhase, setActive]  = useState<string|null>(null)
  const [openCard, setOpenCard]   = useState<Card|null>(null)
  const [toast, setToast]         = useState<string|null>(null)

  const childId = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('childId') || ''
    : ''
  const token = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('token') || ''
    : ''

  const showToast = useCallback((msg: string) => {
    setToast(msg); setTimeout(() => setToast(null), 3000)
  }, [])

  useEffect(() => {
    async function load() {
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

      // Default active phase = first incomplete
      const firstPhase = (cardsData.phases || [])[0]
      if (firstPhase) setActive(firstPhase.slug)

      setLoading(false)
    }
    if (childId) load()
    else setLoading(false)
  }, [childId])

  async function buyCard(card: Card) {
    if (xp < card.xp_cost) { showToast('Not enough XP!'); return }
    const res  = await fetch('/api/cards', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ childId, cardId: card.id }),
    })
    const data = await res.json()
    if (data.success) {
      setOwnedIds(prev => new Set([...prev, card.id]))
      setXp(data.newXP)
      showToast(`🎉 ${card.name_en} added to your collection!`)
    } else {
      showToast(data.error || 'Purchase failed')
    }
  }

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      fontFamily:'"Nunito",sans-serif', background:'#F8F9FB' }}>
      <div style={{ textAlign:'center', color:'#6B7280' }}>
        <div style={{ fontSize:'40px', marginBottom:'12px' }}>🌍</div>
        <div style={{ fontWeight:700 }}>Loading collection...</div>
      </div>
    </div>
  )

  const currentPhase = phases.find(p => p.slug === activePhase)
  const phaseCards   = cards.filter(c => c.phase_id === currentPhase?.id)

  // Phase completion status
  const phaseComplete = (phase: Phase) => {
    const pc = cards.filter(c => c.phase_id === phase.id)
    return pc.length > 0 && pc.every(c => ownedIds.has(c.id))
  }
  const completedSlugs = phases.filter(phaseComplete).map(p => p.slug)

  const totalOwned = ownedIds.size
  const totalCards = cards.length

  return (
    <div style={{ minHeight:'100vh', background:'#F8F9FB', fontFamily:'"Nunito",sans-serif' }}>

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', bottom:'20px', right:'20px', zIndex:300,
          padding:'12px 18px', borderRadius:'14px', background:'#F0FDF4', border:'1px solid #86EFAC',
          color:'#166534', fontWeight:700, fontSize:'13px', boxShadow:'0 8px 24px rgba(0,0,0,0.1)' }}>
          {toast}
        </div>
      )}

      {/* Card modal */}
      {openCard && <CardModal card={openCard} onClose={() => setOpenCard(null)}/>}

      {/* Header */}
      <header style={{ background:'white', borderBottom:'1px solid #F3F4F6',
        padding:'0 20px', height:'58px', display:'flex', alignItems:'center',
        justifyContent:'space-between', position:'sticky', top:0, zIndex:100,
        boxShadow:'0 2px 12px rgba(0,0,0,0.04)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          <button onClick={() => window.location.href = token ? `/play/${token}` : '/dashboard'}
            style={{ display:'flex', alignItems:'center', gap:'5px', padding:'7px 13px',
              borderRadius:'10px', border:'1.5px solid #E5E7EB', background:'white',
              color:'#374151', fontWeight:700, fontSize:'13px', cursor:'pointer' }}>
            <ArrowLeft size={13}/> Back
          </button>
          <div>
            <div style={{ fontWeight:800, fontSize:'17px', color:'#111827', letterSpacing:'-0.02em' }}>
              Animal Collection
            </div>
            <div style={{ fontSize:'11px', color:'#9CA3AF', fontWeight:600 }}>
              {totalOwned} / {totalCards} cards collected
            </div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'8px',
          padding:'6px 16px', borderRadius:'50px', background:'#FFFBEB', border:'1.5px solid #F59E0B40' }}>
          <Star size={15} color="#F59E0B" fill="#F59E0B"/>
          <span style={{ fontWeight:800, fontSize:'17px', color:'#B45309' }}>{xp.toLocaleString()}</span>
          <span style={{ fontSize:'11px', fontWeight:700, color:'#92400E' }}>XP</span>
        </div>
      </header>

      <div style={{ padding:'16px 20px', maxWidth:'900px', margin:'0 auto', display:'flex', flexDirection:'column', gap:'18px' }}>

        {/* World map */}
        <WorldMap
          activePhase={activePhase}
          completedPhases={completedSlugs}
          onSelect={slug => setActive(slug)}/>

        {/* Phase selector tabs */}
        <div style={{ display:'flex', gap:'8px', overflowX:'auto', paddingBottom:'4px' }}>
          {phases.map((phase, idx) => {
            const phaseOwned = cards.filter(c => c.phase_id === phase.id && ownedIds.has(c.id)).length
            const phaseTotal = cards.filter(c => c.phase_id === phase.id).length
            const done = phaseOwned === phaseTotal && phaseTotal > 0

            // Is this phase unlocked? First phase always unlocked, others need previous completed
            const prevPhase = phases[idx - 1]
            const unlocked  = idx === 0 || (prevPhase && phaseComplete(prevPhase))

            return (
              <button key={phase.id}
                onClick={() => setActive(phase.slug)}
                style={{
                  display:'flex', alignItems:'center', gap:'7px', whiteSpace:'nowrap',
                  padding:'8px 14px', borderRadius:'50px', border:'1.5px solid',
                  borderColor: activePhase === phase.slug ? phase.color : '#E5E7EB',
                  background: activePhase === phase.slug ? `${phase.color}15` : 'white',
                  color: activePhase === phase.slug ? phase.color : unlocked ? '#374151' : '#9CA3AF',
                  fontWeight:700, fontSize:'12px', cursor:'pointer', flexShrink:0,
                  opacity: unlocked ? 1 : 0.6,
                }}>
                <span style={{ fontSize:'15px' }}>{phase.emoji}</span>
                {phase.name_en}
                <span style={{ fontSize:'11px', fontWeight:600,
                  color: done ? '#10B981' : activePhase === phase.slug ? phase.color : '#9CA3AF' }}>
                  {done ? '✓' : `${phaseOwned}/${phaseTotal}`}
                </span>
                {!unlocked && <Lock size={11}/>}
              </button>
            )
          })}
        </div>

        {/* Current phase header */}
        {currentPhase && (
          <div style={{ display:'flex', alignItems:'center', gap:'14px',
            background:`${currentPhase.color}10`, borderRadius:'14px',
            padding:'14px 18px', border:`1px solid ${currentPhase.color}25` }}>
            <div style={{ fontSize:'36px' }}>{currentPhase.emoji}</div>
            <div>
              <div style={{ fontWeight:800, fontSize:'18px', color:'#111827', marginBottom:'2px' }}>
                {currentPhase.name_en}
              </div>
              <div style={{ fontSize:'13px', color:'#6B7280' }}>{currentPhase.description_en}</div>
            </div>
            <div style={{ marginLeft:'auto', textAlign:'right', flexShrink:0 }}>
              <div style={{ fontWeight:800, fontSize:'20px', color:currentPhase.color }}>
                {cards.filter(c => c.phase_id === currentPhase.id && ownedIds.has(c.id)).length}
                <span style={{ fontSize:'14px', color:'#9CA3AF' }}>
                  /{cards.filter(c => c.phase_id === currentPhase.id).length}
                </span>
              </div>
              <div style={{ fontSize:'11px', color:'#9CA3AF', fontWeight:600 }}>collected</div>
            </div>
          </div>
        )}

        {/* Cards grid */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(175px, 1fr))', gap:'14px' }}>
          {phaseCards.map(card => (
            <AnimalCard key={card.id}
              card={card}
              owned={ownedIds.has(card.id)}
              xp={xp}
              onBuy={() => buyCard(card)}
              onOpen={() => setOpenCard(card)}/>
          ))}
        </div>

        {/* Phase completion banner */}
        {currentPhase && phaseComplete(currentPhase) && (
          <div style={{ textAlign:'center', padding:'20px', background:'linear-gradient(135deg,#ECFDF5,#D1FAE5)',
            borderRadius:'16px', border:'1px solid #6EE7B7' }}>
            <div style={{ fontSize:'28px', marginBottom:'6px' }}>🎉</div>
            <div style={{ fontWeight:800, fontSize:'16px', color:'#065F46', marginBottom:'4px' }}>
              {currentPhase.name_en} complete!
            </div>
            <div style={{ fontSize:'13px', color:'#047857' }}>
              You collected all {phaseCards.length} animals. Move to the next phase!
            </div>
            {phases.find(p => p.sort_order === currentPhase.sort_order + 1) && (
              <button
                onClick={() => {
                  const next = phases.find(p => p.sort_order === currentPhase.sort_order + 1)
                  if (next) setActive(next.slug)
                }}
                style={{ marginTop:'12px', padding:'9px 20px', borderRadius:'50px',
                  background:'#10B981', border:'none', color:'white', fontWeight:700,
                  fontSize:'13px', cursor:'pointer', display:'inline-flex', alignItems:'center', gap:'6px' }}>
                Next phase <ChevronRight size={14}/>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
