'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { ArrowLeft, Star, Search, ChevronDown, ShoppingCart, Check, Package, Sparkles, Trees, User, Filter, Lock, Users, Zap } from 'lucide-react'
import { useStore, AvatarOutfit, PlacedParkItem } from '@/components/store/useStore'
import {
  AVATAR_ITEMS, AVATAR_CATEGORIES, PARK_ITEMS, PARK_CATEGORIES,
  RARITY_CONFIG, getRarityStyle, canAfford,
  type AvatarItem, type ParkItem, type AvatarCategory, type ParkCategory, type Rarity
} from '@/components/store/StoreCatalog'

// ─── CONSTANTS ────────────────────────────────────────────────
const GRID_COLS = 10
const GRID_ROWS = 7

const SKIN_COLORS: Record<string, string> = {
  skin_light:  '#FDDBB4',
  skin_medium: '#D4956A',
  skin_tan:    '#C27A47',
  skin_dark:   '#8B5A2B',
  skin_deep:   '#4A2C0A',
}

// ─── RARITY BADGE ────────────────────────────────────────────
function RarityBadge({ rarity }: { rarity: Rarity }) {
  const cfg = RARITY_CONFIG[rarity]
  return (
    <span style={{
      fontSize: '9px', fontWeight: 800, letterSpacing: '0.06em',
      textTransform: 'uppercase', padding: '2px 7px', borderRadius: '20px',
      color: cfg.color, background: `${cfg.color}18`,
      border: `1px solid ${cfg.color}40`,
    }}>
      {cfg.label}
    </span>
  )
}

// ─── AVATAR PREVIEW ───────────────────────────────────────────
function AvatarPreview({ outfit, size = 260 }: { outfit: AvatarOutfit; size?: number }) {
  const skinColor = SKIN_COLORS[outfit.skin] || '#D4956A'
  const hairItem  = AVATAR_ITEMS.find(i => i.id === outfit.hair)
  const topItem   = AVATAR_ITEMS.find(i => i.id === outfit.top)
  const bottomItem= AVATAR_ITEMS.find(i => i.id === outfit.bottom)
  const shoeItem  = AVATAR_ITEMS.find(i => i.id === outfit.shoes)
  const hatItem   = outfit.hat     ? AVATAR_ITEMS.find(i => i.id === outfit.hat)     : null
  const glassItem = outfit.glasses ? AVATAR_ITEMS.find(i => i.id === outfit.glasses) : null
  const bagItem   = outfit.backpack? AVATAR_ITEMS.find(i => i.id === outfit.backpack) : null
  const handItem  = outfit.handheld? AVATAR_ITEMS.find(i => i.id === outfit.handheld) : null

  const s = size
  const cx = s / 2

  return (
    <svg viewBox={`0 0 ${s} ${s * 1.5}`} width={s} height={s * 1.5} style={{ display: 'block' }}>
      {/* Shadow */}
      <ellipse cx={cx} cy={s * 1.44} rx={s * 0.22} ry={s * 0.04} fill="rgba(0,0,0,0.12)"/>

      {/* ── SHOES ── */}
      <rect x={cx - s*0.18} y={s*1.28} width={s*0.14} height={s*0.07} rx={s*0.03}
        fill={shoeItem?.color || '#111827'}/>
      <rect x={cx + s*0.04} y={s*1.28} width={s*0.14} height={s*0.07} rx={s*0.03}
        fill={shoeItem?.color || '#111827'}/>

      {/* ── LEGS / BOTTOM ── */}
      <rect x={cx - s*0.16} y={s*0.95} width={s*0.13} height={s*0.35} rx={s*0.03}
        fill={bottomItem?.color || '#1D4ED8'}/>
      <rect x={cx + s*0.03} y={s*0.95} width={s*0.13} height={s*0.35} rx={s*0.03}
        fill={bottomItem?.color || '#1D4ED8'}/>

      {/* ── BODY / TOP ── */}
      <rect x={cx - s*0.2} y={s*0.58} width={s*0.4} height={s*0.42} rx={s*0.04}
        fill={topItem?.color || '#3B82F6'}/>

      {/* ── ARMS ── */}
      {/* Left arm */}
      <rect x={cx - s*0.32} y={s*0.6} width={s*0.13} height={s*0.32} rx={s*0.04}
        fill={topItem?.color || '#3B82F6'}/>
      <rect x={cx - s*0.3} y={s*0.9} width={s*0.1} height={s*0.12} rx={s*0.03}
        fill={skinColor}/>
      {/* Right arm */}
      <rect x={cx + s*0.19} y={s*0.6} width={s*0.13} height={s*0.32} rx={s*0.04}
        fill={topItem?.color || '#3B82F6'}/>
      <rect x={cx + s*0.2} y={s*0.9} width={s*0.1} height={s*0.12} rx={s*0.03}
        fill={skinColor}/>

      {/* ── NECK ── */}
      <rect x={cx - s*0.05} y={s*0.49} width={s*0.1} height={s*0.12} rx={s*0.02}
        fill={skinColor}/>

      {/* ── HEAD ── */}
      <ellipse cx={cx} cy={s*0.35} rx={s*0.18} ry={s*0.2} fill={skinColor}/>

      {/* ── FACE FEATURES ── */}
      {/* Eyes */}
      <ellipse cx={cx - s*0.07} cy={s*0.33} rx={s*0.025} ry={s*0.028} fill="#1F2937"/>
      <ellipse cx={cx + s*0.07} cy={s*0.33} rx={s*0.025} ry={s*0.028} fill="#1F2937"/>
      {/* Eye shine */}
      <circle cx={cx - s*0.062} cy={s*0.322} r={s*0.007} fill="white"/>
      <circle cx={cx + s*0.078} cy={s*0.322} r={s*0.007} fill="white"/>
      {/* Eyebrows */}
      <path d={`M${cx-s*0.1},${s*0.28} Q${cx-s*0.07},${s*0.265} ${cx-s*0.04},${s*0.275}`}
        fill="none" stroke={hairItem?.color || '#1A1A1A'} strokeWidth={s*0.018} strokeLinecap="round"/>
      <path d={`M${cx+s*0.04},${s*0.275} Q${cx+s*0.07},${s*0.265} ${cx+s*0.1},${s*0.28}`}
        fill="none" stroke={hairItem?.color || '#1A1A1A'} strokeWidth={s*0.018} strokeLinecap="round"/>
      {/* Nose */}
      <circle cx={cx} cy={s*0.37} r={s*0.012} fill={`${skinColor}80`} stroke={`${skinColor}cc`} strokeWidth={1}/>
      {/* Smile */}
      <path d={`M${cx-s*0.07},${s*0.41} Q${cx},${s*0.45} ${cx+s*0.07},${s*0.41}`}
        fill="none" stroke="#92400E" strokeWidth={s*0.018} strokeLinecap="round"/>
      {/* Cheeks */}
      <ellipse cx={cx - s*0.12} cy={s*0.395} rx={s*0.04} ry={s*0.025} fill="rgba(255,100,100,0.2)"/>
      <ellipse cx={cx + s*0.12} cy={s*0.395} rx={s*0.04} ry={s*0.025} fill="rgba(255,100,100,0.2)"/>

      {/* ── HAIR ── */}
      {hairItem && (() => {
        const hc = hairItem.color
        switch (outfit.hair) {
          case 'hair_afro':
            return <ellipse cx={cx} cy={s*0.22} rx={s*0.24} ry={s*0.22} fill={hc}/>
          case 'hair_curly_black':
            return <>
              <ellipse cx={cx} cy={s*0.18} rx={s*0.19} ry={s*0.1} fill={hc}/>
              {[-1,0,1].map(o => <circle key={o} cx={cx+o*s*0.1} cy={s*0.16} r={s*0.07} fill={hc}/>)}
            </>
          case 'hair_long_brown':
          case 'hair_long_blonde':
          case 'hair_braids':
            return <>
              <ellipse cx={cx} cy={s*0.19} rx={s*0.19} ry={s*0.1} fill={hc}/>
              <rect x={cx - s*0.19} y={s*0.28} width={s*0.1} height={s*0.35} rx={s*0.04} fill={hc}/>
              <rect x={cx + s*0.09} y={s*0.28} width={s*0.1} height={s*0.35} rx={s*0.04} fill={hc}/>
            </>
          case 'hair_pink':
          case 'hair_rainbow':
            return <>
              <ellipse cx={cx} cy={s*0.19} rx={s*0.19} ry={s*0.1} fill={hc}/>
              {outfit.hair === 'hair_rainbow' && <>
                <ellipse cx={cx} cy={s*0.19} rx={s*0.19} ry={s*0.1}
                  fill="url(#rainbowGrad)" opacity={0.8}/>
                <defs>
                  <linearGradient id="rainbowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%"   stopColor="#FF0080"/>
                    <stop offset="25%"  stopColor="#FF8000"/>
                    <stop offset="50%"  stopColor="#FFD700"/>
                    <stop offset="75%"  stopColor="#00C8FF"/>
                    <stop offset="100%" stopColor="#8000FF"/>
                  </linearGradient>
                </defs>
              </>}
            </>
          default: // short hair
            return <ellipse cx={cx} cy={s*0.19} rx={s*0.19} ry={s*0.1} fill={hc}/>
        }
      })()}

      {/* ── GLASSES ── */}
      {glassItem && (
        <g>
          <rect x={cx - s*0.12} y={s*0.305} width={s*0.09} height={s*0.06} rx={s*0.02}
            fill="none" stroke={glassItem.color} strokeWidth={s*0.015} opacity={0.85}/>
          <rect x={cx + s*0.03} y={s*0.305} width={s*0.09} height={s*0.06} rx={s*0.02}
            fill="none" stroke={glassItem.color} strokeWidth={s*0.015} opacity={0.85}/>
          <line x1={cx - s*0.03} y1={s*0.335} x2={cx + s*0.03} y2={s*0.335}
            stroke={glassItem.color} strokeWidth={s*0.012}/>
        </g>
      )}

      {/* ── HAT ── */}
      {hatItem && (() => {
        const hc = hatItem.color
        switch (outfit.hat) {
          case 'hat_wizard':
            return <>
              <ellipse cx={cx} cy={s*0.2} rx={s*0.22} ry={s*0.06} fill={hc}/>
              <polygon points={`${cx},${s*-0.05} ${cx-s*0.14},${s*0.2} ${cx+s*0.14},${s*0.2}`} fill={hc}/>
              <circle cx={cx} cy={s*-0.05} r={s*0.03} fill="#FFD700"/>
            </>
          case 'hat_crown':
            return <>
              <rect x={cx - s*0.14} y={s*0.1} width={s*0.28} height={s*0.1} rx={s*0.02} fill={hc}/>
              {[-s*0.1, 0, s*0.1].map((o,i) => (
                <polygon key={i} points={`${cx+o},${s*0.02} ${cx+o-s*0.04},${s*0.11} ${cx+o+s*0.04},${s*0.11}`} fill={hc}/>
              ))}
              {[-s*0.07, 0, s*0.07].map((o,i) => (
                <circle key={i} cx={cx+o} cy={s*0.05} r={s*0.025} fill="#EF4444"/>
              ))}
            </>
          case 'hat_astronaut':
          case 'hat_knight_helm':
            return <>
              <ellipse cx={cx} cy={s*0.22} rx={s*0.22} ry={s*0.06} fill={hc}/>
              <ellipse cx={cx} cy={s*0.16} rx={s*0.2} ry={s*0.15} fill={hc}/>
              <ellipse cx={cx} cy={s*0.19} rx={s*0.12} ry={s*0.09} fill="#60A5FA" opacity={0.6}/>
            </>
          default: // cap, beanie
            return <>
              <ellipse cx={cx} cy={s*0.2} rx={s*0.21} ry={s*0.07} fill={hc}/>
              <ellipse cx={cx} cy={s*0.15} rx={s*0.18} ry={s*0.1} fill={hc}/>
            </>
        }
      })()}

      {/* ── BACKPACK / JETPACK ── */}
      {bagItem && (
        <rect x={cx + s*0.2} y={s*0.6} width={s*0.13} height={s*0.26} rx={s*0.03}
          fill={bagItem.color} opacity={0.9}/>
      )}

      {/* ── HANDHELD ITEM ── */}
      {handItem && (
        <g transform={`translate(${cx - s*0.42},${s*0.88})`}>
          <rect width={s*0.1} height={s*0.06} rx={s*0.02} fill={handItem.color}/>
          {outfit.handheld === 'hand_sword' && (
            <rect x={s*0.04} y={-s*0.25} width={s*0.02} height={s*0.28} rx={s*0.005} fill={handItem.color}/>
          )}
          {outfit.handheld === 'hand_wand' && (
            <>
              <rect x={s*0.04} y={-s*0.2} width={s*0.015} height={s*0.22} rx={s*0.005} fill={handItem.color}/>
              <circle cx={s*0.048} cy={-s*0.21} r={s*0.02} fill="#FFD700"/>
            </>
          )}
        </g>
      )}
    </svg>
  )
}

// ─── ISOMETRIC PARK TILE ──────────────────────────────────────
function IsoParkTile({
  item, col, row, tileW, tileH, isSelected, isPreview, onRemove
}: {
  item: ParkItem; col: number; row: number
  tileW: number; tileH: number
  isSelected?: boolean; isPreview?: boolean
  onRemove?: () => void
}) {
  const isoX = (col - row) * (tileW / 2)
  const isoY = (col + row) * (tileH / 2)
  const w    = item.w * tileW
  const h    = item.h * tileH
  const bh   = Math.max(20, item.h * 18) // building height in px

  // Isometric face points
  const topFace = [
    [isoX,         isoY],
    [isoX + w/2,   isoY - h/2],
    [isoX + w,     isoY],
    [isoX + w/2,   isoY + h/2],
  ]
  const leftFace = [
    [isoX,         isoY],
    [isoX + w/2,   isoY + h/2],
    [isoX + w/2,   isoY + h/2 + bh],
    [isoX,         isoY + bh],
  ]
  const rightFace = [
    [isoX + w/2,   isoY + h/2],
    [isoX + w,     isoY],
    [isoX + w,     isoY + bh],
    [isoX + w/2,   isoY + h/2 + bh],
  ]

  const toPoints = (pts: number[][]) => pts.map(p => p.join(',')).join(' ')

  return (
    <g style={{ cursor: onRemove ? 'pointer' : 'default' }} opacity={isPreview ? 0.6 : 1}>
      {/* Right face (darker) */}
      <polygon points={toPoints(rightFace)}
        fill={`${item.color}99`} stroke={isSelected ? '#F59E0B' : 'rgba(0,0,0,0.2)'}
        strokeWidth={isSelected ? 2 : 1}/>
      {/* Left face (medium) */}
      <polygon points={toPoints(leftFace)}
        fill={`${item.color}cc`} stroke={isSelected ? '#F59E0B' : 'rgba(0,0,0,0.15)'}
        strokeWidth={isSelected ? 2 : 1}/>
      {/* Top face (brightest) */}
      <polygon points={toPoints(topFace)}
        fill={item.roofColor} stroke={isSelected ? '#F59E0B' : 'rgba(0,0,0,0.1)'}
        strokeWidth={isSelected ? 2 : 1}/>
      {/* Emoji label on top face */}
      <text
        x={isoX + w/2} y={isoY + 8}
        textAnchor="middle" fontSize={Math.min(16, tileW * item.w * 0.5)}
        style={{ userSelect: 'none', pointerEvents: 'none' }}>
        {item.emoji}
      </text>
      {/* Remove button */}
      {onRemove && (
        <g onClick={e => { e.stopPropagation(); onRemove() }}>
          <circle cx={isoX + w - 4} cy={isoY - 4} r={8} fill="#EF4444"/>
          <text x={isoX + w - 4} y={isoY - 1} textAnchor="middle" fontSize={10}
            fill="white" fontWeight="bold" style={{ userSelect: 'none' }}>×</text>
        </g>
      )}
    </g>
  )
}

// ─── ITEM CARD ────────────────────────────────────────────────
function ItemCard({
  item, owned, equipped, onBuy, onEquip, xp, type
}: {
  item: AvatarItem | ParkItem
  owned: boolean; equipped: boolean
  onBuy: () => void; onEquip: () => void
  xp: number; type: 'avatar' | 'park'
}) {
  const cfg       = RARITY_CONFIG[item.rarity]
  const affordable = canAfford(xp, item.xpCost)
  const free      = item.xpCost === 0

  return (
    <div style={{
      background: 'white',
      border: `1.5px solid ${equipped ? cfg.color : '#F3F4F6'}`,
      borderRadius: '16px',
      overflow: 'hidden',
      boxShadow: equipped
        ? `0 0 0 3px ${cfg.glow}, 0 4px 20px rgba(0,0,0,0.08)`
        : '0 2px 12px rgba(0,0,0,0.05)',
      transition: 'all 0.2s',
      position: 'relative',
      cursor: owned ? 'pointer' : 'default',
    }}
      onClick={owned ? onEquip : undefined}
      onMouseEnter={e => {
        if (!equipped) (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
      }}>

      {/* Rarity glow strip */}
      <div style={{ height: '3px', background: `linear-gradient(90deg, ${cfg.color}, ${cfg.color}66)` }}/>

      {/* Color preview */}
      <div style={{
        height: '64px',
        background: `linear-gradient(135deg, ${item.color}22, ${item.color}44)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '28px', position: 'relative',
      }}>
        <span style={{ filter: owned ? 'none' : 'grayscale(100%) opacity(0.5)' }}>
          {item.emoji}
        </span>
        {/* Color swatch */}
        <div style={{
          position: 'absolute', bottom: '6px', right: '6px',
          width: '14px', height: '14px', borderRadius: '50%',
          background: item.color, border: '2px solid white',
          boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
        }}/>
        {equipped && (
          <div style={{
            position: 'absolute', top: '6px', left: '6px',
            width: '18px', height: '18px', borderRadius: '50%',
            background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Check size={11} color="white" strokeWidth={3}/>
          </div>
        )}
        {!owned && !free && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Lock size={18} color="#6B7280"/>
          </div>
        )}
      </div>

      <div style={{ padding: '10px 12px' }}>
        {/* Name + rarity */}
        <div style={{ marginBottom: '6px' }}>
          <div style={{ fontWeight: 800, fontSize: '12px', color: '#111827', marginBottom: '3px', lineHeight: 1.2 }}>
            {item.name}
          </div>
          <RarityBadge rarity={item.rarity}/>
        </div>

        {/* Stats for park items */}
        {type === 'park' && 'visitors' in item && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <div style={{ fontSize: '10px', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Users size={9}/> {(item as ParkItem).visitors}
            </div>
            <div style={{ fontSize: '10px', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Zap size={9}/> {(item as ParkItem).funScore}
            </div>
            <div style={{ fontSize: '10px', color: '#6B7280' }}>
              {(item as ParkItem).w}×{(item as ParkItem).h}
            </div>
          </div>
        )}

        {/* Action button */}
        {free || owned ? (
          <button onClick={e => { e.stopPropagation(); onEquip() }}
            style={{
              width: '100%', padding: '7px', borderRadius: '8px', border: 'none',
              background: equipped ? '#F3F4F6' : `linear-gradient(135deg, ${cfg.color}, ${cfg.color}bb)`,
              color: equipped ? '#6B7280' : 'white',
              fontWeight: 800, fontSize: '11px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
            }}>
            {equipped
              ? <><Check size={11}/> Equipped</>
              : type === 'park'
                ? <><Sparkles size={11}/> Place</>
                : <><Sparkles size={11}/> Equip</>
            }
          </button>
        ) : (
          <button onClick={e => { e.stopPropagation(); onBuy() }}
            disabled={!affordable}
            style={{
              width: '100%', padding: '7px', borderRadius: '8px', border: 'none',
              background: affordable
                ? 'linear-gradient(135deg, #F59E0B, #EF4444)'
                : '#F3F4F6',
              color: affordable ? 'white' : '#9CA3AF',
              fontWeight: 800, fontSize: '11px',
              cursor: affordable ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
            }}>
            <Star size={10} fill={affordable ? 'white' : '#9CA3AF'} color={affordable ? 'white' : '#9CA3AF'}/>
            {item.xpCost.toLocaleString()} XP
          </button>
        )}
      </div>
    </div>
  )
}

// ─── AVATAR BUILDER ───────────────────────────────────────────
function AvatarBuilder({ store, childId }: { store: ReturnType<typeof useStore>; childId: string }) {
  const [activeCategory, setCategory] = useState<AvatarCategory>('skin')
  const [search, setSearch]           = useState('')
  const [rarityFilter, setRarity]     = useState<Rarity | 'all'>('all')

  const categoryItems = AVATAR_ITEMS.filter(i => {
    if (i.category !== activeCategory) return false
    if (search && !i.name.toLowerCase().includes(search.toLowerCase())) return false
    if (rarityFilter !== 'all' && i.rarity !== rarityFilter) return false
    return true
  })

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '20px', height: '100%' }}>

      {/* ── Avatar preview panel ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{
          background: 'linear-gradient(160deg, #1E2D4E 0%, #2D4A8A 60%, #4A7FD4 100%)',
          borderRadius: '20px', padding: '24px 16px',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          position: 'relative', overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(30,45,78,0.25)',
        }}>
          {/* Decorative circles */}
          <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '140px', height: '140px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }}/>
          <div style={{ position: 'absolute', bottom: '-20px', left: '-20px', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }}/>

          <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px' }}>
            Your Avatar
          </div>
          <AvatarPreview outfit={store.outfit} size={180}/>
        </div>

        {/* Equipped summary */}
        <div style={{ background: 'white', borderRadius: '14px', padding: '14px', border: '1px solid #F3F4F6' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
            Equipped
          </div>
          {Object.entries(store.outfit).map(([cat, itemId]) => {
            if (!itemId) return null
            const item = AVATAR_ITEMS.find(i => i.id === itemId)
            if (!item) return null
            return (
              <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: item.color, flexShrink: 0 }}/>
                <div style={{ fontSize: '11px', color: '#374151', fontWeight: 600 }}>{item.name}</div>
                <button onClick={() => store.equipAvatar(cat as AvatarCategory, null)}
                  style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: '14px', lineHeight: 1 }}>
                  ×
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Shop panel ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', minWidth: 0 }}>

        {/* Category tabs */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {AVATAR_CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => setCategory(cat.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '7px 14px', borderRadius: '50px', border: 'none',
                background: activeCategory === cat.id ? '#1E2D4E' : '#F3F4F6',
                color: activeCategory === cat.id ? 'white' : '#6B7280',
                fontWeight: 700, fontSize: '12px', cursor: 'pointer',
                transition: 'all 0.15s',
              }}>
              <span style={{ fontSize: '14px' }}>{cat.emoji}</span>
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search + filter */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={14} color="#9CA3AF" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}/>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search items..."
              style={{ width: '100%', padding: '9px 12px 9px 34px', borderRadius: '10px', border: '1.5px solid #E5E7EB', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}/>
          </div>
          <select value={rarityFilter} onChange={e => setRarity(e.target.value as any)}
            style={{ padding: '9px 12px', borderRadius: '10px', border: '1.5px solid #E5E7EB', fontSize: '13px', fontWeight: 600, cursor: 'pointer', background: 'white' }}>
            <option value="all">All Rarities</option>
            {Object.entries(RARITY_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>

        {/* Item grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px', overflowY: 'auto', maxHeight: 'calc(100vh - 340px)', paddingRight: '4px' }}>
          {categoryItems.map(item => (
            <ItemCard key={item.id}
              item={item}
              owned={store.isOwned(item.id)}
              equipped={store.isEquipped(item.category as AvatarCategory, item.id)}
              xp={store.xp}
              type="avatar"
              onBuy={() => store.purchase(item.id, item.xpCost, item.name)}
              onEquip={() => store.equipAvatar(item.category as AvatarCategory, item.id)}
            />
          ))}
          {categoryItems.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#9CA3AF' }}>
              <Search size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }}/>
              <div style={{ fontWeight: 700 }}>No items found</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── PARK BUILDER ────────────────────────────────────────────
function ParkBuilder({ store, childId }: { store: ReturnType<typeof useStore>; childId: string }) {
  const [activeCategory, setCategory] = useState<ParkCategory | 'all'>('all')
  const [selectedItem, setSelected]   = useState<ParkItem | null>(null)
  const [hoverCell, setHoverCell]     = useState<{ col: number; row: number } | null>(null)
  const [search, setSearch]           = useState('')

  const TILE_W = 56
  const TILE_H = 28

  // Isometric grid origin (center-top)
  const ORIGIN_X = 320
  const ORIGIN_Y = 60

  function isoToScreen(col: number, row: number) {
    return {
      x: ORIGIN_X + (col - row) * (TILE_W / 2),
      y: ORIGIN_Y + (col + row) * (TILE_H / 2),
    }
  }

  function isOccupied(col: number, row: number): boolean {
    return store.placedItems.some(p => {
      const item = PARK_ITEMS.find(i => i.id === p.itemId)
      if (!item) return false
      return col >= p.col && col < p.col + item.w &&
             row >= p.row && row < p.row + item.h
    })
  }

  function placementValid(col: number, row: number, item: ParkItem): boolean {
    if (col + item.w > GRID_COLS || row + item.h > GRID_ROWS) return false
    for (let c = col; c < col + item.w; c++) {
      for (let r = row; r < row + item.h; r++) {
        if (isOccupied(c, r)) return false
      }
    }
    return true
  }

  function handleCellClick(col: number, row: number) {
    if (!selectedItem) return
    if (!placementValid(col, row, selectedItem)) {
      store.showToast('Cannot place here!', 'error')
      return
    }
    const newPlaced: PlacedParkItem[] = [
      ...store.placedItems,
      { placedId: Date.now(), itemId: selectedItem.id, col, row },
    ]
    store.savePark(newPlaced)
    store.showToast(`${selectedItem.name} placed! ✅`)
    setSelected(null)
  }

  function removeItem(placedId: number) {
    const newPlaced = store.placedItems.filter(p => p.placedId !== placedId)
    store.savePark(newPlaced)
  }

  const filteredShopItems = PARK_ITEMS.filter(i => {
    if (activeCategory !== 'all' && i.category !== activeCategory) return false
    if (search && !i.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  // Build grid cells
  const gridCells: { col: number; row: number }[] = []
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      gridCells.push({ col, row })
    }
  }

  // SVG canvas size
  const canvasW = ORIGIN_X * 2 + TILE_W
  const canvasH = ORIGIN_Y + (GRID_COLS + GRID_ROWS) * (TILE_H / 2) + 80

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: '20px', height: '100%' }}>

      {/* ── Park canvas ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

        {/* Park header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <input value={store.parkName}
            onChange={e => store.setParkName(e.target.value)}
            onBlur={() => store.savePark(store.placedItems)}
            style={{ fontWeight: 900, fontSize: '18px', color: '#111827', background: 'transparent', border: 'none', outline: 'none', borderBottom: '2px solid #E5E7EB', padding: '2px 0' }}/>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '10px', background: 'white', border: '1px solid #F3F4F6', fontSize: '12px', fontWeight: 700, color: '#374151' }}>
              <Users size={13} color="#4A7FD4"/> {store.totalVisitors.toLocaleString()} visitors
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '10px', background: 'white', border: '1px solid #F3F4F6', fontSize: '12px', fontWeight: 700, color: '#374151' }}>
              <Zap size={13} color="#F59E0B"/> {store.funScore} fun
            </div>
          </div>
        </div>

        {selectedItem && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '12px', background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
            <span style={{ fontSize: '20px' }}>{selectedItem.emoji}</span>
            <span style={{ fontWeight: 700, fontSize: '13px', color: '#1D4ED8' }}>
              Click on the park to place: <strong>{selectedItem.name}</strong>
            </span>
            <button onClick={() => setSelected(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', fontSize: '18px', lineHeight: 1 }}>×</button>
          </div>
        )}

        {/* Isometric park canvas */}
        <div style={{
          background: 'linear-gradient(180deg, #87CEEB 0%, #B0E0FF 30%, #4ADE80 60%, #22C55E 100%)',
          borderRadius: '20px', overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          position: 'relative',
        }}>
          {/* Sky + clouds */}
          <div style={{ position: 'absolute', top: '8px', left: '20px', fontSize: '20px', opacity: 0.7 }}>☁️</div>
          <div style={{ position: 'absolute', top: '12px', right: '40px', fontSize: '14px', opacity: 0.5 }}>☁️</div>
          <div style={{ position: 'absolute', top: '6px', left: '40%', fontSize: '18px', opacity: 0.6 }}>⛅</div>

          <svg
            width="100%" viewBox={`0 0 ${canvasW} ${canvasH}`}
            style={{ display: 'block', cursor: selectedItem ? 'crosshair' : 'default' }}>

            {/* Ground cells */}
            {gridCells.map(({ col, row }) => {
              const { x, y } = isoToScreen(col, row)
              const occupied = isOccupied(col, row)
              const isHover  = hoverCell?.col === col && hoverCell?.row === row
              const valid    = selectedItem ? placementValid(col, row, selectedItem) : true

              const pts = [
                [x,           y],
                [x + TILE_W/2, y - TILE_H/2],
                [x + TILE_W,  y],
                [x + TILE_W/2, y + TILE_H/2],
              ].map(p => p.join(',')).join(' ')

              return (
                <polygon key={`${col}-${row}`}
                  points={pts}
                  fill={
                    isHover && selectedItem
                      ? valid ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'
                      : occupied ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.1)'
                  }
                  stroke={isHover ? (valid ? '#10B981' : '#EF4444') : 'rgba(0,0,0,0.08)'}
                  strokeWidth={isHover ? 2 : 1}
                  onClick={() => handleCellClick(col, row)}
                  onMouseEnter={() => setHoverCell({ col, row })}
                  onMouseLeave={() => setHoverCell(null)}
                  style={{ cursor: selectedItem ? (valid ? 'crosshair' : 'not-allowed') : 'default' }}
                />
              )
            })}

            {/* Placed items — render back to front */}
            {[...store.placedItems]
              .sort((a, b) => (a.col + a.row) - (b.col + b.row))
              .map(placed => {
                const item = PARK_ITEMS.find(i => i.id === placed.itemId)
                if (!item) return null
                const { x, y } = isoToScreen(placed.col, placed.row)
                return (
                  <IsoParkTile key={placed.placedId}
                    item={item} col={placed.col} row={placed.row}
                    tileW={TILE_W} tileH={TILE_H}
                    onRemove={() => removeItem(placed.placedId)}
                  />
                )
              })
            }

            {/* Placement preview */}
            {selectedItem && hoverCell && placementValid(hoverCell.col, hoverCell.row, selectedItem) && (
              <IsoParkTile
                item={selectedItem}
                col={hoverCell.col} row={hoverCell.row}
                tileW={TILE_W} tileH={TILE_H}
                isPreview={true}
              />
            )}
          </svg>
        </div>

        <div style={{ fontSize: '11px', color: '#9CA3AF', textAlign: 'center', fontWeight: 600 }}>
          Click × on an item to remove it · Select from the panel to place
        </div>
      </div>

      {/* ── Shop sidebar ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

        {/* Category filter */}
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          <button onClick={() => setCategory('all')}
            style={{ padding: '5px 10px', borderRadius: '50px', border: 'none', background: activeCategory === 'all' ? '#1E2D4E' : '#F3F4F6', color: activeCategory === 'all' ? 'white' : '#6B7280', fontWeight: 700, fontSize: '11px', cursor: 'pointer' }}>
            All
          </button>
          {PARK_CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => setCategory(cat.id)}
              style={{ padding: '5px 10px', borderRadius: '50px', border: 'none', background: activeCategory === cat.id ? '#1E2D4E' : '#F3F4F6', color: activeCategory === cat.id ? 'white' : '#6B7280', fontWeight: 700, fontSize: '11px', cursor: 'pointer' }}>
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search size={13} color="#9CA3AF" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}/>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search..."
            style={{ width: '100%', padding: '8px 10px 8px 30px', borderRadius: '10px', border: '1.5px solid #E5E7EB', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}/>
        </div>

        {/* Item list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: 'calc(100vh - 360px)' }}>
          {filteredShopItems.map(item => {
            const owned   = store.isOwned(item.id)
            const isSelected = selectedItem?.id === item.id
            return (
              <div key={item.id}
                onClick={() => owned ? setSelected(isSelected ? null : item) : store.purchase(item.id, item.xpCost, item.name)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 12px', borderRadius: '12px',
                  border: `1.5px solid ${isSelected ? '#4A7FD4' : '#F3F4F6'}`,
                  background: isSelected ? '#EFF6FF' : 'white',
                  cursor: 'pointer', transition: 'all 0.15s',
                  boxShadow: isSelected ? '0 4px 14px rgba(74,127,212,0.15)' : '0 1px 4px rgba(0,0,0,0.04)',
                }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${item.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
                  {item.emoji}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: '12px', color: owned ? '#111827' : '#9CA3AF', marginBottom: '2px' }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: '10px', color: '#9CA3AF', fontWeight: 600 }}>
                    {item.w}×{item.h} · 👥{item.visitors} · ⚡{item.funScore}
                  </div>
                </div>
                <div style={{ flexShrink: 0 }}>
                  {owned ? (
                    <div style={{
                      padding: '3px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: 800,
                      background: isSelected ? '#DBEAFE' : '#F0FDF4',
                      color: isSelected ? '#1D4ED8' : '#15803D',
                    }}>
                      {isSelected ? '📍 Placing' : '✓ Owned'}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', fontWeight: 800, color: canAfford(store.xp, item.xpCost) ? '#F59E0B' : '#9CA3AF' }}>
                      <Star size={10} fill="currentColor" color="currentColor"/>
                      {item.xpCost}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── MAIN STORE PAGE ──────────────────────────────────────────
export default function StorePage() {
  const [tab, setTab] = useState<'avatar' | 'park'>('avatar')

  const childId = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('childId') || '22222222-2222-2222-2222-222222222002'
    : '22222222-2222-2222-2222-222222222002'
  const token = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('token') || ''
    : ''

  const store = useStore(childId)

  const toastColors: Record<string, { bg: string; border: string; text: string }> = {
    success: { bg: '#F0FDF4', border: '#86EFAC', text: '#166534' },
    error:   { bg: '#FEF2F2', border: '#FCA5A5', text: '#991B1B' },
    info:    { bg: '#EFF6FF', border: '#93C5FD', text: '#1E40AF' },
  }

  if (store.loading) return (
    <div style={{ minHeight: '100vh', background: '#F8F9FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"Nunito",sans-serif' }}>
      <div style={{ textAlign: 'center', color: '#6B7280' }}>
        <Sparkles size={40} color="#F59E0B" style={{ margin: '0 auto 12px', display: 'block' }}/>
        <div style={{ fontWeight: 800, fontSize: '16px' }}>Loading XP Store...</div>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#F8F9FB', fontFamily: '"Nunito",sans-serif', display: 'flex', flexDirection: 'column' }}>

      {/* Toast */}
      {store.toast && (() => {
        const t = toastColors[store.toast.type]
        return (
          <div style={{
            position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999,
            padding: '12px 18px', borderRadius: '14px',
            border: `1px solid ${t.border}`, background: t.bg, color: t.text,
            fontWeight: 700, fontSize: '13px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
            display: 'flex', alignItems: 'center', gap: '8px',
            animation: 'slideIn 0.2s ease',
          }}>
            <Check size={15}/> {store.toast.msg}
          </div>
        )
      })()}

      <style>{`
        @keyframes slideIn { from { transform:translateX(20px);opacity:0 } to { transform:translateX(0);opacity:1 } }
      `}</style>

      {/* Header */}
      <header style={{
        background: 'white', borderBottom: '1px solid #F3F4F6',
        padding: '0 24px', height: '60px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => token ? window.location.href = `/play/${token}` : window.location.href = '/dashboard'}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '10px', border: '1.5px solid #E5E7EB', background: 'white', color: '#374151', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
            <ArrowLeft size={14}/> Back
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg,#1E2D4E,#4A7FD4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={18} color="#F59E0B"/>
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: '18px', color: '#111827', letterSpacing: '-0.02em' }}>XP Store</div>
              <div style={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 600 }}>Spend your earned XP</div>
            </div>
          </div>
        </div>

        {/* XP balance */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 18px', borderRadius: '50px', background: '#FFFBEB', border: '1.5px solid #F59E0B40' }}>
          <Star size={16} color="#F59E0B" fill="#F59E0B"/>
          <span style={{ fontWeight: 900, fontSize: '18px', color: '#B45309' }}>{store.xp.toLocaleString()}</span>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#92400E' }}>XP</span>
        </div>
      </header>

      {/* Tabs */}
      <div style={{ padding: '16px 24px 0', borderBottom: '1px solid #F3F4F6', background: 'white' }}>
        <div style={{ display: 'inline-flex', background: '#F3F4F6', borderRadius: '12px', padding: '4px', gap: '4px' }}>
          {[
            { id: 'avatar', label: 'Avatar Builder', icon: User },
            { id: 'park',   label: 'Park Builder',   icon: Trees },
          ].map(t => {
            const Icon = t.icon
            return (
              <button key={t.id} onClick={() => setTab(t.id as any)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '10px 22px', borderRadius: '8px', border: 'none',
                  background: tab === t.id ? 'white' : 'transparent',
                  color: tab === t.id ? '#111827' : '#6B7280',
                  fontWeight: 800, fontSize: '14px', cursor: 'pointer',
                  boxShadow: tab === t.id ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.2s',
                }}>
                <Icon size={16}/>
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '20px 24px', overflow: 'hidden' }}>
        {tab === 'avatar' && <AvatarBuilder store={store} childId={childId}/>}
        {tab === 'park'   && <ParkBuilder   store={store} childId={childId}/>}
      </div>
    </div>
  )
}