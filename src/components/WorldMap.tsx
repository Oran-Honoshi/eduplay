'use client'
import { useState } from 'react'

export const CONTINENT_CONFIG: Record<string, {
  color: string; activeColor: string; label: string; emoji: string
}> = {
  africa:        { color: '#B45309', activeColor: '#F59E0B', label: 'Africa',      emoji: '🌍' },
  asia:          { color: '#B91C1C', activeColor: '#EF4444', label: 'Asia',        emoji: '🌏' },
  north_america: { color: '#1D4ED8', activeColor: '#3B82F6', label: 'N. America',  emoji: '🌎' },
  south_america: { color: '#15803D', activeColor: '#22C55E', label: 'S. America',  emoji: '🌎' },
  europe:        { color: '#6D28D9', activeColor: '#8B5CF6', label: 'Europe',      emoji: '🌍' },
  oceania:       { color: '#0E7490', activeColor: '#06B6D4', label: 'Oceania',     emoji: '🌏' },
  antarctica:    { color: '#1E40AF', activeColor: '#60A5FA', label: 'Antarctica',  emoji: '🧊' },
  ocean:         { color: '#0F766E', activeColor: '#14B8A6', label: 'Ocean',       emoji: '🌊' },
  birds:         { color: '#92400E', activeColor: '#F59E0B', label: 'Birds',       emoji: '🦅' },
  dinosaurs:     { color: '#374151', activeColor: '#6B7280', label: 'Dinosaurs',   emoji: '🦕' },
}

// Each region: realistic-ish continent silhouettes as SVG paths
// ViewBox: 580 × 390
const REGIONS = [
  {
    slug: 'north_america',
    label: 'N. America',
    // Chunky North America shape
    d: 'M 78 110 L 95 100 L 125 98 L 155 103 L 175 115 L 185 128 L 188 145 L 180 162 L 170 178 L 155 192 L 148 210 L 145 230 L 140 238 L 130 232 L 118 218 L 108 198 L 98 180 L 85 165 L 75 148 L 72 130 Z',
    cx: 130, cy: 168,
  },
  {
    slug: 'south_america',
    label: 'S. America',
    d: 'M 128 248 L 148 238 L 165 242 L 178 258 L 182 278 L 180 300 L 172 320 L 158 338 L 142 345 L 128 340 L 118 325 L 112 305 L 112 282 L 116 264 Z',
    cx: 148, cy: 292,
  },
  {
    slug: 'europe',
    label: 'Europe',
    d: 'M 252 108 L 270 100 L 292 98 L 308 105 L 316 118 L 312 132 L 300 142 L 285 148 L 268 148 L 255 140 L 248 128 L 248 116 Z',
    cx: 282, cy: 125,
  },
  {
    slug: 'africa',
    label: 'Africa',
    d: 'M 268 162 L 292 155 L 316 158 L 332 172 L 338 192 L 338 215 L 332 238 L 322 258 L 308 272 L 290 278 L 272 272 L 260 255 L 255 232 L 255 208 L 258 185 Z',
    cx: 296, cy: 218,
  },
  {
    slug: 'asia',
    label: 'Asia',
    d: 'M 322 95 L 365 88 L 408 85 L 445 92 L 468 108 L 472 128 L 462 150 L 445 165 L 422 175 L 395 180 L 368 178 L 345 170 L 328 155 L 318 138 L 318 115 Z',
    cx: 395, cy: 135,
  },
  {
    slug: 'oceania',
    label: 'Oceania',
    d: 'M 398 255 L 428 248 L 455 252 L 468 268 L 465 285 L 450 298 L 428 302 L 408 296 L 396 280 L 394 265 Z',
    cx: 432, cy: 275,
  },
  {
    slug: 'antarctica',
    label: 'Antarctica',
    d: 'M 120 355 L 175 348 L 235 345 L 295 346 L 355 348 L 405 355 L 408 368 L 360 378 L 295 382 L 230 380 L 165 376 L 118 368 Z',
    cx: 263, cy: 365,
  },
  {
    slug: 'ocean',
    label: 'Ocean',
    d: 'M 470 175 L 495 170 L 510 180 L 512 198 L 498 210 L 475 208 L 463 195 Z',
    cx: 490, cy: 190,
  },
  {
    slug: 'birds',
    label: 'Birds',
    d: 'M 38 190 L 62 185 L 72 198 L 68 212 L 50 218 L 35 208 Z',
    cx: 54, cy: 202,
  },
  {
    slug: 'dinosaurs',
    label: 'Dinosaurs',
    d: 'M 500 238 L 530 232 L 545 245 L 542 262 L 525 270 L 505 266 L 496 252 Z',
    cx: 521, cy: 251,
  },
]

interface WorldMapProps {
  activePhase: string | null
  completedPhases: string[]
  onSelect: (slug: string) => void
}

export default function WorldMap({ activePhase, completedPhases, onSelect }: WorldMapProps) {
  const [hovered, setHovered] = useState<string | null>(null)

  const display = hovered || activePhase

  return (
    <div
      style={{
        background: 'linear-gradient(180deg, #061A2E 0%, #0D2A44 100%)',
        borderRadius: 20,
        overflow: 'hidden',
        border: '1px solid #1A3A5C',
        position: 'relative',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      }}
    >
      {/* Tooltip */}
      {display && CONTINENT_CONFIG[display] && (
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              background: `${CONTINENT_CONFIG[display].activeColor}EE`,
              borderRadius: 20,
              padding: '5px 18px',
              fontSize: 13,
              fontWeight: 800,
              color: 'white',
              whiteSpace: 'nowrap',
              fontFamily: '"Nunito", sans-serif',
              boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
            }}
          >
            {CONTINENT_CONFIG[display].emoji} {CONTINENT_CONFIG[display].label}
          </div>
        </div>
      )}

      <svg
        viewBox="0 0 580 390"
        width="100%"
        style={{ display: 'block' }}
        aria-label="World map — click a region to explore animals"
      >
        {/* Ocean background */}
        <rect x="0" y="0" width="580" height="390" fill="#0D2137" />

        {/* Subtle grid */}
        {[1, 2, 3, 4, 5].map(i => (
          <line key={`h${i}`} x1="0" y1={i * 65} x2="580" y2={i * 65}
            stroke="#142A45" strokeWidth="0.8" />
        ))}
        {[1, 2, 3, 4, 5, 6, 7].map(i => (
          <line key={`v${i}`} x1={i * 83} y1="0" x2={i * 83} y2="390"
            stroke="#142A45" strokeWidth="0.8" />
        ))}

        {/* Equator hint */}
        <line x1="0" y1="195" x2="580" y2="195" stroke="#1D3D5C" strokeWidth="1.2" strokeDasharray="6 4" />

        {REGIONS.map(region => {
          const cfg = CONTINENT_CONFIG[region.slug]
          if (!cfg) return null

          const isActive    = activePhase === region.slug
          const isHovered   = hovered === region.slug
          const isCompleted = completedPhases.includes(region.slug)
          const isHighlit   = isActive || isHovered

          const fill    = isHighlit ? cfg.activeColor : isCompleted ? cfg.color : '#1C3A54'
          const opacity = isHighlit ? 1 : isCompleted ? 0.9 : 0.55
          const stroke  = isHighlit ? 'rgba(255,255,255,0.7)' : isCompleted ? `${cfg.color}80` : '#1D3A5C'
          const sw      = isHighlit ? 1.8 : 0.8

          return (
            <g
              key={region.slug}
              onClick={() => onSelect(region.slug)}
              onMouseEnter={() => setHovered(region.slug)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: 'pointer' }}
            >
              {/* Glow behind for active */}
              {isHighlit && (
                <path
                  d={region.d}
                  fill={cfg.activeColor}
                  opacity={0.18}
                  style={{ filter: 'blur(6px)' }}
                />
              )}

              <path
                d={region.d}
                fill={fill}
                opacity={opacity}
                stroke={stroke}
                strokeWidth={sw}
                style={{ transition: 'fill 0.18s, opacity 0.18s' }}
              />

              {/* Completion checkmark */}
              {isCompleted && !isHighlit && (
                <g transform={`translate(${region.cx - 7}, ${region.cy - 7})`}>
                  <circle cx="7" cy="7" r="7" fill="#10B981" opacity={0.95} />
                  <polyline
                    points="3.5,7 6,9.5 10.5,4.5"
                    fill="none" stroke="white"
                    strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                  />
                </g>
              )}

              {/* Label */}
              <text
                x={region.cx}
                y={isCompleted && !isHighlit ? region.cy + 14 : region.cy + 5}
                textAnchor="middle"
                fontSize={isHighlit ? '9.5' : '8.5'}
                fontWeight={isHighlit ? '800' : '600'}
                fontFamily='"Nunito", sans-serif'
                fill={isHighlit ? 'white' : isCompleted ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.55)'}
                style={{ pointerEvents: 'none', userSelect: 'none', transition: 'font-size 0.15s' }}
              >
                {region.label}
              </text>
            </g>
          )
        })}
      </svg>

      {/* Legend */}
      <div style={{
        position: 'absolute',
        bottom: 10,
        right: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        zIndex: 10,
        pointerEvents: 'none',
      }}>
        {[
          { color: '#10B981', label: 'Completed' },
          { color: '#1C3A54', label: 'Locked', border: '#1D3A5C' },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{
              width: 10, height: 10, borderRadius: 3,
              background: item.color,
              border: item.border ? `1px solid ${item.border}` : undefined,
            }} />
            <span style={{
              fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.5)',
              fontFamily: '"Nunito", sans-serif',
            }}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
