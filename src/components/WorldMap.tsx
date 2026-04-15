'use client'
import { useEffect, useRef, useState, useCallback } from 'react'

export const CONTINENT_CONFIG: Record<string, {
  color: string; activeColor: string; label: string; emoji: string
}> = {
  africa:        { color:'#A04010', activeColor:'#E67E22', label:'Africa',        emoji:'🌍' },
  asia:          { color:'#922B21', activeColor:'#E74C3C', label:'Asia',          emoji:'🌏' },
  north_america: { color:'#1560A8', activeColor:'#2E86C1', label:'N. America',    emoji:'🌎' },
  south_america: { color:'#1A6E37', activeColor:'#27AE60', label:'S. America',    emoji:'🌎' },
  europe:        { color:'#5B2C6F', activeColor:'#8E44AD', label:'Europe',        emoji:'🌍' },
  oceania:       { color:'#0B5345', activeColor:'#16A085', label:'Oceania',       emoji:'🌏' },
  antarctica:    { color:'#1A5276', activeColor:'#2980B9', label:'Antarctica',    emoji:'🧊' },
}

const NUM_TO_CONTINENT: Record<number, string> = {
  // Africa
  12:'africa', 24:'africa', 204:'africa', 72:'africa', 854:'africa',
  108:'africa', 120:'africa', 132:'africa', 140:'africa', 148:'africa',
  174:'africa', 180:'africa', 178:'africa', 384:'africa', 262:'africa',
  818:'africa', 226:'africa', 232:'africa', 231:'africa', 266:'africa',
  270:'africa', 288:'africa', 324:'africa', 624:'africa', 404:'africa',
  426:'africa', 430:'africa', 434:'africa', 450:'africa', 454:'africa',
  466:'africa', 478:'africa', 480:'africa', 504:'africa', 508:'africa',
  516:'africa', 562:'africa', 566:'africa', 646:'africa', 678:'africa',
  686:'africa', 690:'africa', 694:'africa', 706:'africa', 710:'africa',
  728:'africa', 729:'africa', 748:'africa', 834:'africa', 768:'africa',
  788:'africa', 800:'africa', 894:'africa', 716:'africa',
  // Asia
  4:'asia', 51:'asia', 31:'asia', 48:'asia', 50:'asia', 64:'asia',
  96:'asia', 116:'asia', 156:'asia', 196:'asia', 268:'asia', 356:'asia',
  360:'asia', 364:'asia', 368:'asia', 376:'asia', 392:'asia', 400:'asia',
  398:'asia', 414:'asia', 417:'asia', 418:'asia', 422:'asia', 458:'asia',
  462:'asia', 496:'asia', 104:'asia', 524:'asia', 408:'asia', 512:'asia',
  586:'asia', 608:'asia', 634:'asia', 682:'asia', 702:'asia', 410:'asia',
  144:'asia', 760:'asia', 158:'asia', 762:'asia', 764:'asia', 626:'asia',
  792:'asia', 795:'asia', 784:'asia', 860:'asia', 704:'asia', 887:'asia',
  275:'asia',
  // Europe
  8:'europe', 20:'europe', 40:'europe', 112:'europe', 56:'europe',
  70:'europe', 100:'europe', 191:'europe', 203:'europe', 208:'europe',
  233:'europe', 246:'europe', 250:'europe', 276:'europe', 300:'europe',
  348:'europe', 352:'europe', 372:'europe', 380:'europe', 428:'europe',
  438:'europe', 440:'europe', 442:'europe', 470:'europe', 498:'europe',
  492:'europe', 499:'europe', 528:'europe', 807:'europe', 578:'europe',
  616:'europe', 620:'europe', 642:'europe', 643:'europe', 674:'europe',
  688:'europe', 703:'europe', 705:'europe', 724:'europe', 752:'europe',
  756:'europe', 804:'europe', 826:'europe', 336:'europe',
  // North America
  28:'north_america', 44:'north_america', 52:'north_america', 84:'north_america',
  124:'north_america', 188:'north_america', 192:'north_america', 212:'north_america',
  214:'north_america', 222:'north_america', 308:'north_america', 320:'north_america',
  332:'north_america', 340:'north_america', 484:'north_america', 558:'north_america',
  591:'north_america', 659:'north_america', 662:'north_america', 670:'north_america',
  780:'north_america', 840:'north_america', 304:'north_america',
  // South America
  32:'south_america', 68:'south_america', 76:'south_america', 152:'south_america',
  170:'south_america', 218:'south_america', 328:'south_america', 600:'south_america',
  604:'south_america', 740:'south_america', 858:'south_america', 862:'south_america',
  // Oceania
  36:'oceania', 242:'oceania', 296:'oceania', 584:'oceania', 583:'oceania',
  520:'oceania', 554:'oceania', 585:'oceania', 598:'oceania', 882:'oceania',
  90:'oceania', 776:'oceania', 798:'oceania', 548:'oceania', 540:'oceania',
  258:'oceania',
  // Antarctica
  10:'antarctica',
}

interface WorldMapProps {
  activePhase: string | null
  completedPhases: string[]
  onSelect: (slug: string) => void
}

export default function WorldMap({ activePhase, completedPhases, onSelect }: WorldMapProps) {
  const svgRef              = useRef<SVGSVGElement>(null)
  const [ready, setReady]   = useState(false)
  const [hovered, setHov]   = useState<string | null>(null)
  const [error, setError]   = useState(false)

  const getFill = useCallback((continent: string | null): string => {
    if (!continent || !CONTINENT_CONFIG[continent]) return '#1C3650'
    const c = CONTINENT_CONFIG[continent]
    if (continent === activePhase) return c.activeColor
    if (completedPhases.includes(continent)) return c.color
    return '#1C3650'
  }, [activePhase, completedPhases])

  useEffect(() => {
    let dead = false

    async function render() {
      try {
        const d3    = await import('d3')
        const world = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json').then(r => r.json())
        const topo  = await import('topojson-client')

        if (dead || !svgRef.current) return

        const W = 680, H = 380
        const svg  = d3.select(svgRef.current)
        svg.selectAll('*').remove()

        const proj = d3.geoNaturalEarth1().scale(107).translate([W / 2, H / 2 + 12])
        const path = d3.geoPath().projection(proj)

        // Ocean background
        svg.append('path')
          .datum({ type: 'Sphere' } as any)
          .attr('d', path as any)
          .attr('fill', '#071829')

        // Graticule grid lines
        svg.append('path')
          .datum(d3.geoGraticule()())
          .attr('d', path as any)
          .attr('fill', 'none')
          .attr('stroke', '#0D2540')
          .attr('stroke-width', 0.4)

        // Countries
        const countries = (topo as any).feature(world, world.objects.countries)

        svg.selectAll<SVGPathElement, any>('.c')
          .data((countries as any).features)
          .join('path')
          .attr('class', 'c')
          .attr('d', path as any)
          .attr('fill', (d: any) => getFill(NUM_TO_CONTINENT[d.id as number] ?? null))
          .attr('stroke', '#071829')
          .attr('stroke-width', 0.4)
          .style('cursor', (d: any) => {
            const cont = NUM_TO_CONTINENT[d.id as number]
            return cont && CONTINENT_CONFIG[cont] ? 'pointer' : 'default'
          })
          .on('mouseenter', function (this: SVGPathElement, _: any, d: any) {
            if (dead) return
            const cont = NUM_TO_CONTINENT[(d as any).id as number]
            if (!cont || !CONTINENT_CONFIG[cont]) return
            d3.select(this).attr('fill', CONTINENT_CONFIG[cont].activeColor)
            setHov(cont)
          })
          .on('mouseleave', function (this: SVGPathElement, _: any, d: any) {
            if (dead) return
            const cont = NUM_TO_CONTINENT[(d as any).id as number]
            d3.select(this).attr('fill', getFill(cont ?? null))
            setHov(null)
          })
          .on('click', function (this: SVGPathElement, _: any, d: any) {
            const cont = NUM_TO_CONTINENT[(d as any).id as number]
            if (cont && CONTINENT_CONFIG[cont]) onSelect(cont)
          })

        // Continent labels
        const LABELS: [string, number, number][] = [
          ['africa',        20,   0 ],
          ['asia',          95,  38 ],
          ['north_america',-97,  52 ],
          ['south_america', -58,-14 ],
          ['europe',        15,  53 ],
          ['oceania',      134, -25 ],
          ['antarctica',     0, -80 ],
        ]

        LABELS.forEach(([slug, lon, lat]) => {
          const cfg = CONTINENT_CONFIG[slug]
          const pt  = proj([lon, lat])
          if (!pt || !cfg) return
          const active = slug === activePhase
          svg.append('text')
            .attr('x', pt[0]).attr('y', pt[1])
            .attr('text-anchor', 'middle')
            .attr('font-family', '"Nunito", sans-serif')
            .attr('font-size', active ? 11 : 9)
            .attr('font-weight', active ? '700' : '500')
            .attr('fill', active ? '#FFFFFF' : 'rgba(255,255,255,0.5)')
            .attr('pointer-events', 'none')
            .attr('style', 'user-select:none')
            .text(`${cfg.emoji} ${cfg.label}`)
        })

        if (!dead) setReady(true)
      } catch (e) {
        console.error('WorldMap error:', e)
        if (!dead) { setReady(true); setError(true) }
      }
    }

    render()
    return () => { dead = true }
  }, [activePhase, completedPhases, getFill, onSelect])

  if (error) {
    return (
      <div style={{ background:'#0D2137', borderRadius:'16px', padding:'20px',
        display:'flex', flexWrap:'wrap', gap:'8px', justifyContent:'center' }}>
        {Object.entries(CONTINENT_CONFIG).map(([slug, cfg]) => (
          <button key={slug} onClick={() => onSelect(slug)}
            style={{ padding:'9px 16px', borderRadius:'50px', border:'2px solid',
              borderColor: slug === activePhase ? cfg.activeColor : cfg.color,
              background: slug === activePhase ? cfg.activeColor : `${cfg.color}30`,
              color:'white', fontWeight:700, fontSize:'13px', cursor:'pointer' }}>
            {cfg.emoji} {cfg.label}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div style={{ position:'relative', background:'#071829', borderRadius:'16px',
      overflow:'hidden', border:'1px solid #1A3A5C' }}>

      {!ready && (
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center',
          justifyContent:'center', background:'#071829', zIndex:2,
          flexDirection:'column', gap:'12px' }}>
          <div style={{ fontSize:'36px' }}>🌍</div>
          <div style={{ fontSize:'13px', color:'rgba(255,255,255,0.4)', fontWeight:600 }}>
            Loading world map…
          </div>
        </div>
      )}

      {hovered && CONTINENT_CONFIG[hovered] && (
        <div style={{ position:'absolute', top:'12px', left:'50%', transform:'translateX(-50%)',
          background:'rgba(0,0,0,0.8)', borderRadius:'20px', padding:'4px 14px', zIndex:3,
          fontSize:'12px', fontWeight:700, color:'white', pointerEvents:'none', whiteSpace:'nowrap',
          border:`1px solid ${CONTINENT_CONFIG[hovered].activeColor}60` }}>
          {CONTINENT_CONFIG[hovered].emoji} {CONTINENT_CONFIG[hovered].label}
        </div>
      )}

      {activePhase && CONTINENT_CONFIG[activePhase] && (
        <div style={{ position:'absolute', bottom:'10px', left:'50%', transform:'translateX(-50%)',
          background:`${CONTINENT_CONFIG[activePhase].activeColor}E0`,
          borderRadius:'20px', padding:'4px 16px', zIndex:3,
          fontSize:'12px', fontWeight:700, color:'white', pointerEvents:'none', whiteSpace:'nowrap' }}>
          {CONTINENT_CONFIG[activePhase].emoji} {CONTINENT_CONFIG[activePhase].label}
        </div>
      )}

      <svg ref={svgRef} viewBox="0 0 680 380" width="100%" style={{ display:'block' }}/>
    </div>
  )
}
