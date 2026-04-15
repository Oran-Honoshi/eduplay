'use client'
import { useState } from 'react'

// @ts-ignore
import { ComposableMap, Geographies, Geography, Sphere, Graticule } from 'react-simple-maps'

export const CONTINENT_CONFIG: Record<string, {
  color: string; activeColor: string; label: string; emoji: string
}> = {
  africa:        { color:'#B45309', activeColor:'#F59E0B', label:'Africa',        emoji:'🌍' },
  asia:          { color:'#B91C1C', activeColor:'#EF4444', label:'Asia',          emoji:'🌏' },
  north_america: { color:'#1D4ED8', activeColor:'#3B82F6', label:'N. America',    emoji:'🌎' },
  south_america: { color:'#15803D', activeColor:'#22C55E', label:'S. America',    emoji:'🌎' },
  europe:        { color:'#6D28D9', activeColor:'#8B5CF6', label:'Europe',        emoji:'🌍' },
  oceania:       { color:'#0E7490', activeColor:'#06B6D4', label:'Oceania',       emoji:'🌏' },
  antarctica:    { color:'#1E40AF', activeColor:'#60A5FA', label:'Antarctica',    emoji:'🧊' },
}

const ISO_TO_CONTINENT: Record<string, string> = {
  DZA:'africa',AGO:'africa',BEN:'africa',BWA:'africa',BFA:'africa',BDI:'africa',CMR:'africa',
  CPV:'africa',CAF:'africa',TCD:'africa',COM:'africa',COD:'africa',COG:'africa',CIV:'africa',
  DJI:'africa',EGY:'africa',GNQ:'africa',ERI:'africa',ETH:'africa',GAB:'africa',GMB:'africa',
  GHA:'africa',GIN:'africa',GNB:'africa',KEN:'africa',LSO:'africa',LBR:'africa',LBY:'africa',
  MDG:'africa',MWI:'africa',MLI:'africa',MRT:'africa',MUS:'africa',MAR:'africa',MOZ:'africa',
  NAM:'africa',NER:'africa',NGA:'africa',RWA:'africa',STP:'africa',SEN:'africa',SLE:'africa',
  SOM:'africa',ZAF:'africa',SSD:'africa',SDN:'africa',SWZ:'africa',TZA:'africa',TGO:'africa',
  TUN:'africa',UGA:'africa',ZMB:'africa',ZWE:'africa',ESH:'africa',
  AFG:'asia',ARM:'asia',AZE:'asia',BHR:'asia',BGD:'asia',BTN:'asia',BRN:'asia',KHM:'asia',
  CHN:'asia',CYP:'asia',GEO:'asia',IND:'asia',IDN:'asia',IRN:'asia',IRQ:'asia',ISR:'asia',
  JPN:'asia',JOR:'asia',KAZ:'asia',KWT:'asia',KGZ:'asia',LAO:'asia',LBN:'asia',MYS:'asia',
  MDV:'asia',MNG:'asia',MMR:'asia',NPL:'asia',PRK:'asia',OMN:'asia',PAK:'asia',PHL:'asia',
  QAT:'asia',SAU:'asia',SGP:'asia',KOR:'asia',LKA:'asia',SYR:'asia',TWN:'asia',TJK:'asia',
  THA:'asia',TLS:'asia',TUR:'asia',TKM:'asia',ARE:'asia',UZB:'asia',VNM:'asia',YEM:'asia',PSE:'asia',
  ALB:'europe',AND:'europe',AUT:'europe',BLR:'europe',BEL:'europe',BIH:'europe',BGR:'europe',
  HRV:'europe',CZE:'europe',DNK:'europe',EST:'europe',FIN:'europe',FRA:'europe',DEU:'europe',
  GRC:'europe',HUN:'europe',ISL:'europe',IRL:'europe',ITA:'europe',LVA:'europe',LIE:'europe',
  LTU:'europe',LUX:'europe',MLT:'europe',MDA:'europe',MCO:'europe',MNE:'europe',NLD:'europe',
  MKD:'europe',NOR:'europe',POL:'europe',PRT:'europe',ROU:'europe',RUS:'europe',SMR:'europe',
  SRB:'europe',SVK:'europe',SVN:'europe',ESP:'europe',SWE:'europe',CHE:'europe',UKR:'europe',
  GBR:'europe',VAT:'europe',
  ATG:'north_america',BHS:'north_america',BRB:'north_america',BLZ:'north_america',CAN:'north_america',
  CRI:'north_america',CUB:'north_america',DMA:'north_america',DOM:'north_america',SLV:'north_america',
  GRD:'north_america',GTM:'north_america',HTI:'north_america',HND:'north_america',JAM:'north_america',
  MEX:'north_america',NIC:'north_america',PAN:'north_america',KNA:'north_america',LCA:'north_america',
  VCT:'north_america',TTO:'north_america',USA:'north_america',GRL:'north_america',
  ARG:'south_america',BOL:'south_america',BRA:'south_america',CHL:'south_america',COL:'south_america',
  ECU:'south_america',GUY:'south_america',PRY:'south_america',PER:'south_america',SUR:'south_america',
  URY:'south_america',VEN:'south_america',
  AUS:'oceania',FJI:'oceania',KIR:'oceania',MHL:'oceania',FSM:'oceania',NRU:'oceania',NZL:'oceania',
  PLW:'oceania',PNG:'oceania',WSM:'oceania',SLB:'oceania',TON:'oceania',TUV:'oceania',VUT:'oceania',
  NCL:'oceania',PYF:'oceania',
  ATA:'antarctica',
}

const NUM_TO_ALPHA3: Record<string, string> = {
  '004':'AFG','008':'ALB','012':'DZA','024':'AGO','032':'ARG','036':'AUS','040':'AUT',
  '050':'BGD','056':'BEL','064':'BTN','068':'BOL','070':'BIH','072':'BWA','076':'BRA',
  '100':'BGR','116':'KHM','120':'CMR','124':'CAN','140':'CAF','144':'LKA','152':'CHL',
  '156':'CHN','170':'COL','178':'COG','180':'COD','188':'CRI','191':'HRV','192':'CUB',
  '196':'CYP','203':'CZE','208':'DNK','214':'DOM','218':'ECU','818':'EGY','222':'SLV',
  '231':'ETH','232':'ERI','246':'FIN','250':'FRA','266':'GAB','276':'DEU','288':'GHA',
  '300':'GRC','304':'GRL','320':'GTM','324':'GIN','332':'HTI','340':'HND','348':'HUN',
  '352':'ISL','356':'IND','360':'IDN','364':'IRN','368':'IRQ','372':'IRL','376':'ISR',
  '380':'ITA','392':'JPN','400':'JOR','398':'KAZ','404':'KEN','408':'PRK','410':'KOR',
  '414':'KWT','418':'LAO','422':'LBN','430':'LBR','434':'LBY','426':'LSO','440':'LTU',
  '442':'LUX','450':'MDG','458':'MYS','484':'MEX','496':'MNG','504':'MAR','508':'MOZ',
  '516':'NAM','524':'NPL','528':'NLD','540':'NCL','554':'NZL','558':'NIC','566':'NGA',
  '578':'NOR','586':'PAK','591':'PAN','598':'PNG','604':'PER','608':'PHL','616':'POL',
  '620':'PRT','634':'QAT','642':'ROU','643':'RUS','646':'RWA','682':'SAU','686':'SEN',
  '694':'SLE','706':'SOM','710':'ZAF','724':'ESP','729':'SDN','752':'SWE','756':'CHE',
  '760':'SYR','764':'THA','768':'TGO','780':'TTO','788':'TUN','800':'UGA','804':'UKR',
  '784':'ARE','826':'GBR','840':'USA','858':'URY','860':'UZB','862':'VEN','704':'VNM',
  '887':'YEM','894':'ZMB','716':'ZWE','010':'ATA','242':'FJI','104':'MMR','792':'TUR',
  '051':'ARM','031':'AZE','268':'GEO',
}

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

interface WorldMapProps {
  activePhase: string | null
  completedPhases: string[]
  onSelect: (slug: string) => void
}

export default function WorldMap({ activePhase, completedPhases, onSelect }: WorldMapProps) {
  const [hovered, setHovered] = useState<string | null>(null)

  function getContinent(geo: { id: number | string }): string | null {
    const id     = String(geo.id).padStart(3, '0')
    const alpha3 = NUM_TO_ALPHA3[id]
    return alpha3 ? (ISO_TO_CONTINENT[alpha3] || null) : null
  }

  function getFill(continent: string | null, isHov: boolean): string {
    if (!continent || !CONTINENT_CONFIG[continent]) return '#1C3A54'
    const cfg = CONTINENT_CONFIG[continent]
    if (isHov || continent === activePhase) return cfg.activeColor
    if (completedPhases.includes(continent)) return cfg.color
    return '#1C3A54'
  }

  const display = hovered || activePhase

  return (
    <div style={{
      background: '#061624', borderRadius: '18px', overflow: 'hidden',
      border: '1px solid #1A3A5C', position: 'relative',
    }}>
      {display && CONTINENT_CONFIG[display] && (
        <div style={{
          position: 'absolute', top: '12px', left: '50%',
          transform: 'translateX(-50%)', zIndex: 10, pointerEvents: 'none',
        }}>
          <div style={{
            background: `${CONTINENT_CONFIG[display].activeColor}DD`,
            borderRadius: '20px', padding: '5px 18px',
            fontSize: '13px', fontWeight: 700, color: 'white',
            whiteSpace: 'nowrap', fontFamily: '"Nunito", sans-serif',
          }}>
            {CONTINENT_CONFIG[display].emoji} {CONTINENT_CONFIG[display].label}
          </div>
        </div>
      )}

      <ComposableMap
        projectionConfig={{ scale: 147, center: [0, 10] }}
        style={{ width: '100%', height: 'auto' }}
      >
        <Sphere id="ocean-sphere" fill="#061624" stroke="#1A3A5C" strokeWidth={0.5} />
        <Graticule stroke="#0D2540" strokeWidth={0.4} />
        <Geographies geography={GEO_URL}>
          {({ geographies }: { geographies: Array<{ id: number; rsmKey: string }> }) =>
            geographies.map((geo: { id: number; rsmKey: string }) => {
              const continent   = getContinent(geo)
              const isHov       = hovered === continent && continent !== null
              const isClickable = continent && CONTINENT_CONFIG[continent]
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={getFill(continent, isHov)}
                  stroke="#061624"
                  strokeWidth={0.4}
                  style={{
                    default: { outline: 'none' },
                    hover:   { outline: 'none', cursor: isClickable ? 'pointer' : 'default' },
                    pressed: { outline: 'none' },
                  }}
                  onMouseEnter={() => {
                    if (continent && CONTINENT_CONFIG[continent]) setHovered(continent)
                  }}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => {
                    if (continent && CONTINENT_CONFIG[continent]) onSelect(continent)
                  }}
                />
              )
            })
          }
        </Geographies>
      </ComposableMap>

      <div style={{
        position: 'absolute', bottom: '10px', left: '50%',
        transform: 'translateX(-50%)', display: 'flex', gap: '6px', zIndex: 10,
      }}>
        {[
          { slug:'birds',     emoji:'🦅', label:'Birds',     color:'#B45309', active:'#F59E0B' },
          { slug:'dinosaurs', emoji:'🦕', label:'Dinosaurs', color:'#374151', active:'#9CA3AF' },
        ].map(({ slug, emoji, label, color, active }) => (
          <button key={slug} onClick={() => onSelect(slug)}
            style={{
              padding: '4px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer',
              background: activePhase === slug ? active : `${color}90`,
              color: 'white', fontSize: '12px', fontWeight: 700,
              fontFamily: '"Nunito", sans-serif',
            }}>
            {emoji} {label}
          </button>
        ))}
      </div>
    </div>
  )
}
