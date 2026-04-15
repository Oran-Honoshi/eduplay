'use client'
import { useState, useEffect } from 'react'
// @ts-ignore
import { ComposableMap, Geographies, Geography, Sphere, Graticule } from 'react-simple-maps'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

// Complete ISO numeric → continent slug mapping (no duplicates, no holes)
const ID_TO_CONTINENT: Record<string, string> = {
  // ── Africa ────────────────────────────────────────────────────
  '012':'africa', '024':'africa', '072':'africa', '108':'africa', '120':'africa',
  '132':'africa', '140':'africa', '148':'africa', '174':'africa', '175':'africa',
  '178':'africa', '180':'africa', '204':'africa', '226':'africa', '231':'africa',
  '232':'africa', '262':'africa', '266':'africa', '270':'africa', '288':'africa',
  '324':'africa', '384':'africa', '404':'africa', '426':'africa', '430':'africa',
  '434':'africa', '450':'africa', '454':'africa', '466':'africa', '478':'africa',
  '480':'africa', '504':'africa', '508':'africa', '516':'africa', '562':'africa',
  '566':'africa', '624':'africa', '638':'africa', '646':'africa', '678':'africa',
  '686':'africa', '694':'africa', '706':'africa', '710':'africa', '716':'africa',
  '728':'africa', '729':'africa', '732':'africa', '768':'africa', '788':'africa',
  '800':'africa', '818':'africa', '834':'africa', '894':'africa',
  // ── Asia ──────────────────────────────────────────────────────
  '004':'asia', '031':'asia', '048':'asia', '050':'asia', '051':'asia',
  '064':'asia', '096':'asia', '104':'asia', '116':'asia', '144':'asia',
  '156':'asia', '158':'asia', '196':'asia', '268':'asia', '275':'asia',
  '356':'asia', '360':'asia', '364':'asia', '368':'asia', '376':'asia',
  '392':'asia', '398':'asia', '400':'asia', '408':'asia', '410':'asia',
  '414':'asia', '418':'asia', '422':'asia', '458':'asia', '462':'asia',
  '496':'asia', '512':'asia', '524':'asia', '586':'asia', '608':'asia',
  '634':'asia', '682':'asia', '702':'asia', '704':'asia', '760':'asia',
  '762':'asia', '764':'asia', '784':'asia', '792':'asia', '860':'asia',
  '887':'asia',
  // ── Europe ────────────────────────────────────────────────────
  '008':'europe', '020':'europe', '040':'europe', '056':'europe', '070':'europe',
  '100':'europe', '112':'europe', '191':'europe', '203':'europe', '208':'europe',
  '233':'europe', '246':'europe', '250':'europe', '276':'europe', '292':'europe',
  '300':'europe', '336':'europe', '348':'europe', '352':'europe', '372':'europe',
  '380':'europe', '428':'europe', '438':'europe', '440':'europe', '442':'europe',
  '470':'europe', '492':'europe', '498':'europe', '499':'europe', '528':'europe',
  '578':'europe', '616':'europe', '620':'europe', '642':'europe', '643':'europe',
  '674':'europe', '688':'europe', '703':'europe', '705':'europe', '724':'europe',
  '752':'europe', '756':'europe', '804':'europe', '807':'europe', '826':'europe',
  '831':'europe', '832':'europe', '833':'europe',
  // ── North America ─────────────────────────────────────────────
  '028':'north_america', '044':'north_america', '052':'north_america',
  '060':'north_america', '084':'north_america', '124':'north_america',
  '136':'north_america', '188':'north_america', '192':'north_america',
  '212':'north_america', '214':'north_america', '222':'north_america',
  '304':'north_america', '308':'north_america', '320':'north_america',
  '332':'north_america', '340':'north_america', '388':'north_america',
  '474':'north_america', '484':'north_america', '500':'north_america',
  '531':'north_america', '533':'north_america', '534':'north_america',
  '535':'north_america', '558':'north_america', '591':'north_america',
  '630':'north_america', '659':'north_america', '660':'north_america',
  '662':'north_america', '663':'north_america', '670':'north_america',
  '796':'north_america', '840':'north_america', '850':'north_america',
  // ── South America ─────────────────────────────────────────────
  '032':'south_america', '068':'south_america', '076':'south_america',
  '152':'south_america', '170':'south_america', '218':'south_america',
  '238':'south_america', '254':'south_america', '328':'south_america',
  '600':'south_america', '604':'south_america', '740':'south_america',
  '858':'south_america', '862':'south_america',
  // ── Oceania ───────────────────────────────────────────────────
  '036':'oceania', '090':'oceania', '184':'oceania', '242':'oceania',
  '296':'oceania', '316':'oceania', '520':'oceania', '540':'oceania',
  '548':'oceania', '554':'oceania', '570':'oceania', '574':'oceania',
  '580':'oceania', '581':'oceania', '583':'oceania', '584':'oceania',
  '585':'oceania', '612':'oceania', '772':'oceania', '776':'oceania',
  '780':'oceania', '798':'oceania', '876':'oceania',
  // ── Antarctica ────────────────────────────────────────────────
  '010':'antarctica',
}

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
  const [hovered, setHovered] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const display = hovered || activePhase

  function getSlug(geo: any): string | null {
    const id = String(geo.id ?? '').padStart(3, '0')
    return ID_TO_CONTINENT[id] ?? null
  }

  // Completed continents use their activeColor at full brightness (same as hover)
  // Active/hovered also use activeColor
  // Locked = dark navy
  function getFill(slug: string | null, isHighlit: boolean, isComp: boolean): string {
    if (!slug) return '#162D45'
    const cfg = CONTINENT_CONFIG[slug]
    if (!cfg) return '#162D45'
    if (isHighlit || isComp) return cfg.activeColor
    return '#1C3A54'
  }

  function getOpacity(isHighlit: boolean, isComp: boolean): number {
    if (isHighlit) return 1
    if (isComp)   return 0.92  // fully visible, just not hovered
    return 0.48                 // locked/undiscovered
  }

  if (!mounted) {
    return (
      <div style={{
        width: '100%', aspectRatio: '2 / 1',
        background: 'linear-gradient(180deg, #061A2E, #0D2137)',
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

      {/* Hover/active label badge */}
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
          }}>
            {CONTINENT_CONFIG[display].emoji} {CONTINENT_CONFIG[display].label}
            {completedPhases.includes(display) && (
              <span style={{ marginLeft: 6, fontSize: 11 }}>✓</span>
            )}
          </div>
        </div>
      )}

      {/* Map */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        <ComposableMap
          projectionConfig={{ scale: 155, center: [10, 8] }}
          style={{ width: '100%', height: 'auto', display: 'block' }}
        >
          <Sphere id="rsm-sphere" fill="#061624" stroke="#1A3A5C" strokeWidth={0.5} />
          <Graticule stroke="#0D2540" strokeWidth={0.3} />

          <Geographies geography={GEO_URL}>
            {({ geographies }: { geographies: any[] }) =>
              geographies.map((geo: any) => {
                const slug      = getSlug(geo)
                const isHov     = hovered === slug && slug !== null
                const isAct     = activePhase === slug
                const isHighlit = isHov || isAct
                const isComp    = slug ? completedPhases.includes(slug) : false

                const fill    = getFill(slug, isHighlit, isComp)
                const opacity = getOpacity(isHighlit, isComp)

                // Stroke: bright on hover/active, colored on completed, invisible on locked
                const stroke = isHighlit
                  ? CONTINENT_CONFIG[slug!]?.activeColor ?? '#fff'
                  : isComp
                    ? `${CONTINENT_CONFIG[slug!]?.color}60`
                    : '#061624'
                const sw = isHighlit ? 1.5 : isComp ? 0.5 : 0.3

                // Show glow for: hovered, active, OR completed
                const showGlow = isHighlit || isComp

                return (
                  <g key={geo.rsmKey}>
                    {/* Permanent glow for completed + hover/active glow */}
                    {showGlow && (
                      <Geography
                        geography={geo}
                        fill={fill}
                        stroke="none"
                        tabIndex={-1}
                        style={{
                          default: {
                            outline: 'none',
                            filter: 'blur(10px)',
                            // Completed glow is softer than hover glow
                            opacity: isHighlit ? 0.55 : 0.28,
                            pointerEvents: 'none',
                          },
                          hover:   { outline: 'none' },
                          pressed: { outline: 'none' },
                        }}
                      />
                    )}

                    {/* Main country shape */}
                    <Geography
                      geography={geo}
                      fill={fill}
                      stroke={stroke}
                      strokeWidth={sw}
                      onMouseEnter={() => { if (slug) setHovered(slug) }}
                      onMouseLeave={() => setHovered(null)}
                      onClick={() => { if (slug) onSelect(slug) }}
                      style={{
                        default: {
                          outline: 'none',
                          opacity,
                          transition: 'fill 0.2s ease, opacity 0.2s ease',
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

      {/* Extra regions pill buttons */}
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
                border: `1.5px solid ${isA || isC ? r.active : r.color}70`,
                background: isA || isC ? `${r.active}28` : `${r.color}18`,
                color: isA || isC ? r.active : 'rgba(255,255,255,0.65)',
                fontSize: 12, fontWeight: 800,
                fontFamily: '"Nunito", sans-serif',
                display: 'flex', alignItems: 'center', gap: 5,
                cursor: 'pointer',
                transition: 'all 0.18s ease',
                backdropFilter: 'blur(6px)',
                boxShadow: isC ? `0 0 12px ${r.active}40` : 'none',
              }}
            >
              <span>{r.emoji}</span>
              <span>{r.label}</span>
              {isC && <span style={{ fontSize: 10, color: '#10B981', fontWeight: 900 }}>✓</span>}
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
          { bg: '#F59E0B', label: 'Completed', glow: true },
          { bg: '#1C3A54', border: '#2A4A6C', label: 'Locked' },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{
              width: 10, height: 10, borderRadius: 3,
              background: item.bg,
              border: (item as any).border ? `1px solid ${(item as any).border}` : undefined,
              boxShadow: (item as any).glow ? `0 0 6px ${item.bg}80` : undefined,
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
