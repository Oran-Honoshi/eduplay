'use client'
import { useState, useEffect } from 'react'
// @ts-ignore
import { ComposableMap, Geographies, Geography } from 'react-simple-maps'

// ── continents-110m.json gives ONE shape per continent ──────────────────────
const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/continents-110m.json'

// GeoJSON continent name → your app's phase slug
const NAME_TO_SLUG: Record<string, string> = {
  'Africa':        'africa',
  'Asia':          'asia',
  'North America': 'north_america',
  'South America': 'south_america',
  'Europe':        'europe',
  'Oceania':       'oceania',
  'Antarctica':    'antarctica',
}

// Extra non-geographic regions shown as bottom pill buttons
const EXTRA_REGIONS = [
  { slug: 'ocean',     emoji: '🌊', label: 'Ocean',     color: '#0F766E', active: '#14B8A6' },
  { slug: 'birds',     emoji: '🦅', label: 'Birds',     color: '#92400E', active: '#F59E0B' },
  { slug: 'dinosaurs', emoji: '🦕', label: 'Dinosaurs', color: '#374151', active: '#6B7280' },
]

export const CONTINENT_CONFIG: Record<string, {
  color: string; activeColor: string; label: string; emoji: string
}> = {
  africa:        { color: '#B45309', activeColor: '#F59E0B', label: 'Africa',     emoji: '🌍' },
  asia:          { color: '#B91C1C', activeColor: '#EF4444', label: 'Asia',       emoji: '🌏' },
  north_america: { color: '#1D4ED8', activeColor: '#3B82F6', label: 'N. America', emoji: '🌎' },
  south_america: { color: '#15803D', activeColor: '#22C55E', label: 'S. America', emoji: '🌎' },
  europe:        { color: '#6D28D9', activeColor: '#8B5CF6', label: 'Europe',     emoji: '🌍' },
  oceania:       { color: '#0E7490', activeColor: '#06B6D4', label: 'Oceania',    emoji: '🌏' },
  antarctica:    { color: '#1E40AF', activeColor: '#60A5FA', label: 'Antarctica', emoji: '🧊' },
  ocean:         { color: '#0F766E', activeColor: '#14B8A6', label: 'Ocean',      emoji: '🌊' },
  birds:         { color: '#92400E', activeColor: '#F59E0B', label: 'Birds',      emoji: '🦅' },
  dinosaurs:     { color: '#374151', activeColor: '#6B7280', label: 'Dinosaurs',  emoji: '🦕' },
}

interface WorldMapProps {
  activePhase: string | null
  completedPhases: string[]
  onSelect: (slug: string) => void
}

export default function WorldMap({ activePhase, completedPhases, onSelect }: WorldMapProps) {
  const [hovered, setHovered]   = useState<string | null>(null)
  const [mounted, setMounted]   = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const display = hovered || activePhase

  function getSlug(geo: any): string | null {
    // continents-110m properties may use different keys depending on version
    const name = geo.properties?.continent
      || geo.properties?.CONTINENT
      || geo.properties?.name
      || geo.properties?.NAME
      || ''
    return NAME_TO_SLUG[name] ?? null
  }

  function getFill(slug: string | null, isHighlit: boolean): string {
    if (!slug) return '#162D45'
    const cfg = CONTINENT_CONFIG[slug]
    if (!cfg) return '#162D45'
    if (isHighlit) return cfg.activeColor
    if (completedPhases.includes(slug)) return cfg.color
    return '#1C3A54'
  }

  function getStroke(slug: string | null, isHighlit: boolean): string {
    if (!slug) return '#0D2137'
    if (isHighlit) return CONTINENT_CONFIG[slug]?.activeColor ?? '#fff'
    if (completedPhases.includes(slug)) return `${CONTINENT_CONFIG[slug]?.color}90`
    return '#0D2137'
  }

  // Loading skeleton
  if (!mounted) {
    return (
      <div style={{
        width: '100%', aspectRatio: '2 / 1',
        background: 'linear-gradient(180deg, #061A2E, #0D2A44)',
        borderRadius: 20, border: '1px solid #1A3A5C',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13, fontWeight: 700, fontFamily: '"Nunito",sans-serif' }}>
          Loading map…
        </span>
      </div>
    )
  }

  return (
    <div style={{
      position: 'relative',
      background: 'linear-gradient(180deg, #061A2E 0%, #0D2137 100%)',
      borderRadius: 20, overflow: 'hidden',
      border: '1px solid #1A3A5C',
      boxShadow: '0 8px 32px rgba(0,0,0,0.28)',
    }}>

      {/* Dot-grid atmosphere */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
        opacity: 0.06,
        backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
        backgroundSize: '26px 26px',
      }} />

      {/* Hover label badge */}
      {display && CONTINENT_CONFIG[display] && (
        <div style={{
          position: 'absolute', top: 12, left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 30, pointerEvents: 'none',
        }}>
          <div style={{
            background: `${CONTINENT_CONFIG[display].activeColor}F0`,
            borderRadius: 99, padding: '5px 18px',
            fontSize: 13, fontWeight: 800, color: 'white',
            whiteSpace: 'nowrap', fontFamily: '"Nunito", sans-serif',
            boxShadow: `0 4px 18px ${CONTINENT_CONFIG[display].activeColor}60`,
            backdropFilter: 'blur(4px)',
          }}>
            {CONTINENT_CONFIG[display].emoji} {CONTINENT_CONFIG[display].label}
          </div>
        </div>
      )}

      {/* Map */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        <ComposableMap
          projectionConfig={{ scale: 158, center: [10, 8] }}
          style={{ width: '100%', height: 'auto', display: 'block' }}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }: { geographies: any[] }) =>
              geographies.map((geo: any) => {
                const slug      = getSlug(geo)
                const isHov     = hovered === slug && slug !== null
                const isAct     = activePhase === slug
                const isHighlit = isHov || isAct
                const isComp    = slug ? completedPhases.includes(slug) : false

                const fill      = getFill(slug, isHighlit)
                const stroke    = getStroke(slug, isHighlit)
                const opacity   = isHighlit ? 1 : isComp ? 0.9 : 0.48

                return (
                  <g key={geo.rsmKey}>
                    {/* Glow layer — blurred duplicate rendered underneath */}
                    {isHighlit && (
                      <Geography
                        geography={geo}
                        fill={fill}
                        stroke="none"
                        tabIndex={-1}
                        style={{
                          default: {
                            outline: 'none',
                            filter: 'blur(12px)',
                            opacity: 0.55,
                            pointerEvents: 'none',
                          },
                          hover:   { outline: 'none' },
                          pressed: { outline: 'none' },
                        }}
                      />
                    )}

                    {/* Main continent */}
                    <Geography
                      geography={geo}
                      fill={fill}
                      stroke={stroke}
                      strokeWidth={isHighlit ? 1.8 : isComp ? 0.7 : 0.4}
                      onMouseEnter={() => { if (slug) setHovered(slug) }}
                      onMouseLeave={() => setHovered(null)}
                      onClick={() => { if (slug) onSelect(slug) }}
                      style={{
                        default: {
                          outline: 'none',
                          opacity,
                          transition: 'fill 0.2s ease, opacity 0.2s ease, stroke-width 0.2s ease',
                          cursor: slug ? 'pointer' : 'default',
                        },
                        hover:   { outline: 'none' },
                        pressed: { outline: 'none' },
                      }}
                    />
                  </g>
                )
              })
            }
          </Geographies>
        </ComposableMap>
      </div>

      {/* Extra regions — Ocean / Birds / Dinosaurs */}
      <div style={{
        position: 'absolute', bottom: 10, left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex', gap: 6, zIndex: 20,
      }}>
        {EXTRA_REGIONS.map(r => {
          const isA = activePhase === r.slug
          const isC = completedPhases.includes(r.slug)
          return (
            <button
              key={r.slug}
              onClick={() => onSelect(r.slug)}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}
              style={{
                padding: '5px 14px', borderRadius: 99,
                border: `1.5px solid ${isA ? r.active : r.color}70`,
                background: isA ? `${r.active}28` : `${r.color}18`,
                color: isA ? r.active : 'rgba(255,255,255,0.6)',
                fontSize: 12, fontWeight: 800,
                fontFamily: '"Nunito", sans-serif',
                display: 'flex', alignItems: 'center', gap: 5,
                cursor: 'pointer',
                transition: 'all 0.18s ease',
                backdropFilter: 'blur(6px)',
              }}
            >
              <span>{r.emoji}</span>
              <span>{r.label}</span>
              {isC && <span style={{ fontSize: 9, color: '#10B981', fontWeight: 900 }}>✓</span>}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div style={{
        position: 'absolute', bottom: 10, right: 14,
        display: 'flex', flexDirection: 'column', gap: 5,
        zIndex: 20, pointerEvents: 'none',
      }}>
        {[
          { bg: '#10B981', label: 'Completed' },
          { bg: '#1C3A54', border: '#2A4A6C', label: 'Locked' },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{
              width: 10, height: 10, borderRadius: 3,
              background: item.bg,
              border: (item as any).border ? `1px solid ${(item as any).border}` : undefined,
            }} />
            <span style={{
              fontSize: 9, fontWeight: 700,
              color: 'rgba(255,255,255,0.4)',
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