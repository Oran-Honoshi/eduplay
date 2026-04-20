'use client'
import { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, Check, X, ChevronRight, Gift } from 'lucide-react'

interface Phase {
  id: string; slug: string; name_en: string; name_he: string
  description_en: string; sort_order: number; cards_needed: number
  color: string; emoji: string
}
interface Card {
  id: string; phase_id: string; slug: string
  name_en: string; name_he: string; location_en: string
  rarity: 'common'|'rare'|'epic'|'legendary'
  xp_cost: number; unsplash_id: string
  fact_en: string; facts_en: string[]; facts_he: string[]
  habitat_en: string; speed: string; lifespan: string
  diet_en: string; fun_fact_en: string; sort_order: number
}
interface Child {
  id: string; display_name: string
  xp_total: number; xp_toward_next_token: number; xp_per_token: number
  card_tokens: number; card_collect_mode: string
}

const RARITY: Record<string, { label: string; color: string; bg: string; text: string }> = {
  common:    { label:'Common',    color:'#888780', bg:'#F1EFE8', text:'#2C2C2A' },
  rare:      { label:'Rare',      color:'#378ADD', bg:'#E6F1FB', text:'#042C53' },
  epic:      { label:'Epic',      color:'#7F77DD', bg:'#EEEDFE', text:'#26215C' },
  legendary: { label:'Legendary', color:'#BA7517', bg:'#FAEEDA', text:'#412402' },
}

const REGION_COLORS: Record<string, string> = {
  africa:'#E67E22', asia:'#E74C3C', north_america:'#3498DB',
  south_america:'#27AE60', europe:'#8E44AD', oceania:'#16A085',
  antarctica:'#2980B9', ocean:'#1ABC9C', birds:'#F39C12', dinosaurs:'#7F8C8D',
}

function imgUrl(id: string, w=400, h=280) {
  return `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&auto=format&q=80`
}

// ── World Map ─────────────────────────────────────────────────
function WorldMap({ phases, ownedIds, cards, onSelect, activePhase }: {
  phases: Phase[]; ownedIds: Set<string>; cards: Card[]
  onSelect: (s: string) => void; activePhase: string|null
}) {
  const regions = [
    { slug:'africa',        label:'Africa',      d:'M 290 220 L 310 210 L 340 215 L 350 240 L 345 270 L 330 300 L 310 310 L 290 300 L 280 270 L 275 245 Z' },
    { slug:'europe',        label:'Europe',      d:'M 265 155 L 290 148 L 310 155 L 308 175 L 290 185 L 268 178 Z' },
    { slug:'asia',          label:'Asia',        d:'M 315 140 L 420 135 L 450 155 L 445 185 L 420 200 L 390 205 L 360 200 L 330 195 L 315 175 Z' },
    { slug:'north_america', label:'N.America',   d:'M 100 140 L 170 130 L 200 155 L 195 195 L 175 215 L 145 220 L 115 200 L 95 175 Z' },
    { slug:'south_america', label:'S.America',   d:'M 145 235 L 185 225 L 200 250 L 195 300 L 175 325 L 150 320 L 135 295 L 130 265 Z' },
    { slug:'oceania',       label:'Oceania',     d:'M 400 265 L 450 258 L 465 275 L 460 300 L 435 308 L 405 300 L 395 280 Z' },
    { slug:'antarctica',    label:'Antarctica',  d:'M 150 355 L 250 348 L 350 350 L 400 358 L 390 375 L 300 382 L 200 380 L 140 372 Z' },
    { slug:'ocean',         label:'Ocean',       d:'M 470 180 L 500 175 L 510 195 L 500 215 L 470 210 Z' },
    { slug:'birds',         label:'Birds',       d:'M 50 200 L 75 195 L 82 210 L 75 225 L 50 220 Z' },
    { slug:'dinosaurs',     label:'Dinos',       d:'M 500 240 L 535 235 L 545 255 L 535 275 L 500 270 Z' },
  ]

  const getProgress = (slug: string) => {
    const phase = phases.find(p => p.slug === slug)
    if (!phase) return { owned: 0, total: 0, complete: false }
    const pc = cards.filter(c => c.phase_id === phase.id)
    const owned = pc.filter(c => ownedIds.has(c.id)).length
    return { owned, total: pc.length, complete: pc.length > 0 && owned === pc.length }
  }

  return (
    <div style={{ position:'relative', background:'#0A1628', borderRadius:16, overflow:'hidden' }}>
      <svg viewBox="0 0 580 400" width="100%" style={{ display:'block' }}>
        <rect x="0" y="0" width="580" height="400" fill="#0D2137"/>
        {[1,2,3,4,5].map(i=><line key={`h${i}`} x1="0" y1={i*66} x2="580" y2={i*66} stroke="#142A45" strokeWidth="1"/>)}
        {[1,2,3,4,5,6,7,8].map(i=><line key={`v${i}`} x1={i*72} y1="0" x2={i*72} y2="400" stroke="#142A45" strokeWidth="1"/>)}
        {regions.map(r => {
          const { owned, total, complete } = getProgress(r.slug)
          const active = activePhase === r.slug
          const color = REGION_COLORS[r.slug] || '#666'
          const fillOpacity = complete ? 1 : total > 0 ? 0.3 + (owned/total)*0.55 : 0.3
          const pts = r.d.match(/[\d.]+/g)?.map(Number)||[]
          const xs = pts.filter((_,i)=>i%2===0), ys = pts.filter((_,i)=>i%2===1)
          const cx = xs.reduce((a,b)=>a+b,0)/xs.length, cy = ys.reduce((a,b)=>a+b,0)/ys.length
          return (
            <g key={r.slug} onClick={()=>onSelect(r.slug)} style={{cursor:'pointer'}}>
              {active && <path d={r.d} fill={color} opacity={0.25} transform="scale(1.08) translate(-23,-17)" style={{filter:'blur(8px)'}}/>}
              <path d={r.d} fill={color} opacity={fillOpacity}
                stroke={complete ? '#FFD700' : active ? 'white' : '#1D3A5C'}
                strokeWidth={complete ? 2.5 : active ? 2 : 1}/>
              {complete
                ? <text x={cx} y={cy+4} textAnchor="middle" fontSize="11" fill="#FFD700">✓</text>
                : total>0 && <text x={cx} y={cy+4} textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.8)" style={{pointerEvents:'none'}}>{owned}/{total}</text>
              }
            </g>
          )
        })}
      </svg>
      <div style={{position:'absolute',bottom:8,right:10,display:'flex',gap:10,alignItems:'center'}}>
        <div style={{display:'flex',alignItems:'center',gap:4}}>
          <div style={{width:10,height:10,background:'#555',border:'1px solid #888',borderRadius:2}}/>
          <span style={{fontSize:9,color:'#9CA3AF'}}>In progress</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:4}}>
          <div style={{width:10,height:10,background:'#E67E22',border:'2px solid #FFD700',borderRadius:2}}/>
          <span style={{fontSize:9,color:'#FFD700'}}>Complete!</span>
        </div>
      </div>
    </div>
  )
}

// ── XP Progress Bar toward next token ────────────────────────
function TokenProgressBar({ child }: { child: Child }) {
  const pct = Math.min(100, Math.round((child.xp_toward_next_token / child.xp_per_token) * 100))
  const needed = child.xp_per_token - child.xp_toward_next_token
  return (
    <div style={{background:'white',borderRadius:14,padding:'12px 16px',border:'1px solid #F3F4F6'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:36,height:36,borderRadius:10,background:'linear-gradient(135deg,#F59E0B,#D97706)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>🎴</div>
          <div>
            <div style={{fontWeight:800,fontSize:15,color:'#111827'}}>{child.card_tokens} card{child.card_tokens!==1?'s':''} to collect</div>
            <div style={{fontSize:11,color:'#9CA3AF'}}>{needed>0?`${needed} XP until next card`:'Complete a lesson to earn more!'}</div>
          </div>
        </div>
        <div style={{fontSize:13,fontWeight:800,color:'#F59E0B'}}>{pct}%</div>
      </div>
      <div style={{height:10,background:'#F3F4F6',borderRadius:99,overflow:'hidden'}}>
        <div style={{height:'100%',width:`${pct}%`,background:'linear-gradient(90deg,#F59E0B,#FBBF24)',borderRadius:99,transition:'width 0.6s ease'}}/>
      </div>
      <div style={{display:'flex',justifyContent:'space-between',marginTop:4}}>
        <span style={{fontSize:10,color:'#D1D5DB'}}>0</span>
        <span style={{fontSize:10,color:'#D1D5DB'}}>{child.xp_per_token} XP = 🎴 1 card</span>
      </div>
    </div>
  )
}

// ── Animal Card ───────────────────────────────────────────────
function AnimalCard({ card, owned, canCollect, onCollect, onOpen }: {
  card: Card; owned: boolean; canCollect: boolean
  onCollect: ()=>void; onOpen: ()=>void
}) {
  const r = RARITY[card.rarity]??RARITY.common
  const [imgErr,setImgErr] = useState(false)
  return (
    <div onClick={owned?onOpen:undefined}
      style={{background:'white',borderRadius:14,overflow:'hidden',border:`1.5px solid ${owned?r.color+'60':'#F3F4F6'}`,
        cursor:owned?'pointer':'default',transition:'transform 0.15s,box-shadow 0.15s',
        boxShadow:owned?`0 4px 16px ${r.color}20`:'0 1px 6px rgba(0,0,0,0.06)'}}
      onMouseEnter={e=>{if(owned)(e.currentTarget as HTMLElement).style.transform='translateY(-3px)'}}
      onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform='translateY(0)'}}>
      <div style={{position:'relative',width:'100%',aspectRatio:'4/3',overflow:'hidden',background:imgErr?`${r.color}18`:'#f0f4f8'}}>
        {!imgErr
          ?<img src={imgUrl(card.unsplash_id)} alt={card.name_en} style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}} onError={()=>setImgErr(true)}/>
          :<div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:40,opacity:0.4}}>🌍</div>
        }
        {owned&&<div style={{position:'absolute',top:7,right:7,width:22,height:22,borderRadius:'50%',background:'#10B981',display:'flex',alignItems:'center',justifyContent:'center'}}><Check size={12} color="white" strokeWidth={3}/></div>}
        <div style={{position:'absolute',bottom:0,left:0,right:0,height:3,background:r.color}}/>
      </div>
      <div style={{padding:'10px 11px 11px'}}>
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:4}}>
          <div style={{fontWeight:700,fontSize:13,color:'#111827',lineHeight:1.2}}>{card.name_en}</div>
          <span style={{fontSize:9,fontWeight:700,padding:'2px 6px',borderRadius:10,background:r.bg,color:r.text,border:`0.5px solid ${r.color}40`,marginLeft:4,flexShrink:0}}>{r.label}</span>
        </div>
        <div style={{fontSize:11,color:'#6B7280',marginBottom:7}}>📍 {owned?card.location_en:'???'}</div>
        <div style={{fontSize:12,color:'#374151',lineHeight:1.5,marginBottom:9,minHeight:36}}>
          {owned?card.fact_en:'Collect this card to discover this animal!'}
        </div>
        {!owned&&canCollect&&(
          <button onClick={e=>{e.stopPropagation();onCollect()}}
            style={{width:'100%',padding:8,borderRadius:8,border:'none',cursor:'pointer',
              background:'linear-gradient(135deg,#F59E0B,#D97706)',color:'white',fontWeight:700,fontSize:12,
              display:'flex',alignItems:'center',justifyContent:'center',gap:5}}>
            <Gift size={12}/> Collect Card (1 🎴)
          </button>
        )}
        {!owned&&!canCollect&&(
          <div style={{width:'100%',padding:7,borderRadius:8,background:'#F9FAFB',color:'#9CA3AF',fontWeight:600,fontSize:11,textAlign:'center'}}>
            Complete lessons to earn 🎴
          </div>
        )}
      </div>
    </div>
  )
}

// ── Card Detail Modal ─────────────────────────────────────────
function CardModal({ card, onClose }: { card: Card; onClose: ()=>void }) {
  const r = RARITY[card.rarity]??RARITY.common
  const [imgErr,setImgErr] = useState(false)
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.65)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:16}} onClick={onClose}>
      <div style={{background:'white',borderRadius:18,maxWidth:380,width:'100%',overflow:'hidden',maxHeight:'90vh',overflowY:'auto'}} onClick={e=>e.stopPropagation()}>
        <div style={{position:'relative',aspectRatio:'16/9',background:'#f0f4f8',overflow:'hidden'}}>
          {!imgErr?<img src={imgUrl(card.unsplash_id,760,427)} alt={card.name_en} style={{width:'100%',height:'100%',objectFit:'cover'}} onError={()=>setImgErr(true)}/>
            :<div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:64,background:`${r.color}18`}}>🌍</div>}
          <div style={{position:'absolute',inset:0,background:'linear-gradient(to top,rgba(0,0,0,0.7) 0%,transparent 50%)'}}/>
          <div style={{position:'absolute',bottom:14,left:16}}>
            <div style={{fontSize:22,fontWeight:700,color:'white',marginBottom:4}}>{card.name_en}</div>
            <div style={{fontSize:12,color:'rgba(255,255,255,0.8)'}}>📍 {card.location_en}</div>
          </div>
          <button onClick={onClose} style={{position:'absolute',top:10,right:10,width:28,height:28,borderRadius:'50%',background:'rgba(0,0,0,0.45)',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}><X size={14} color="white"/></button>
          <div style={{position:'absolute',bottom:0,left:0,right:0,height:3,background:r.color}}/>
        </div>
        <div style={{padding:'16px 18px 20px'}}>
          <span style={{fontSize:11,fontWeight:700,padding:'3px 9px',borderRadius:10,background:r.bg,color:r.text,border:`0.5px solid ${r.color}40`}}>{r.label}</span>
          <div style={{display:'flex',flexDirection:'column',gap:10,margin:'14px 0 16px'}}>
            {(card.facts_en?.length?card.facts_en:[card.fact_en]).map((f,i)=>(
              <div key={i} style={{display:'flex',gap:10,alignItems:'flex-start'}}>
                <div style={{width:20,height:20,borderRadius:'50%',background:r.bg,color:r.text,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,flexShrink:0,marginTop:1}}>{i+1}</div>
                <div style={{fontSize:13,color:'#374151',lineHeight:1.6}}>{f}</div>
              </div>
            ))}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:14}}>
            {[['Habitat',card.habitat_en],['Top Speed',card.speed],['Lifespan',card.lifespan],['Diet',card.diet_en]].map(([l,v])=>(
              <div key={l} style={{background:'#F9FAFB',borderRadius:10,padding:'9px 11px'}}>
                <div style={{fontSize:11,color:'#9CA3AF',marginBottom:2}}>{l}</div>
                <div style={{fontSize:13,fontWeight:600,color:'#111827'}}>{v}</div>
              </div>
            ))}
          </div>
          {card.fun_fact_en&&<div style={{background:`${r.color}12`,border:`0.5px solid ${r.color}30`,borderRadius:10,padding:'11px 13px',marginBottom:16}}>
            <div style={{fontSize:11,fontWeight:700,color:r.color,marginBottom:4}}>⚡ Did you know?</div>
            <div style={{fontSize:12,color:'#374151',lineHeight:1.6}}>{card.fun_fact_en}</div>
          </div>}
          <button onClick={onClose} style={{width:'100%',padding:10,borderRadius:10,border:'0.5px solid #E5E7EB',background:'white',cursor:'pointer',fontSize:14,color:'#374151'}}>Close</button>
        </div>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────
export default function CardsPage() {
  const [phases,setPhases]     = useState<Phase[]>([])
  const [cards,setCards]       = useState<Card[]>([])
  const [ownedIds,setOwnedIds] = useState<Set<string>>(new Set())
  const [child,setChild]       = useState<Child|null>(null)
  const [loading,setLoading]   = useState(true)
  const [activePhase,setActive]= useState<string|null>(null)
  const [openCard,setOpenCard] = useState<Card|null>(null)
  const [toast,setToast]       = useState<string|null>(null)
  const [collecting,setCollecting] = useState(false)

  const childId = typeof window!=='undefined'?new URLSearchParams(window.location.search).get('childId')||'':''
  const token   = typeof window!=='undefined'?new URLSearchParams(window.location.search).get('token')||'':''

  const showToast = useCallback((msg:string)=>{ setToast(msg); setTimeout(()=>setToast(null),3500) },[])

  useEffect(()=>{
    if(!childId){setLoading(false);return}
    Promise.all([
      fetch(`/api/cards?childId=${childId}`).then(r=>r.json()),
      fetch(`/api/children?childId=${childId}`).then(r=>r.json()),
    ]).then(([cardsData,childData])=>{
      setPhases(cardsData.phases||[])
      setCards(cardsData.cards||[])
      setOwnedIds(new Set(cardsData.ownedIds||[]))
      setChild(childData.child||null)
      if(cardsData.phases?.[0]) setActive(cardsData.phases[0].slug)
      setLoading(false)
    })
  },[childId])

  async function collectCard(card: Card) {
    if(!child||child.card_tokens<1||collecting) return
    setCollecting(true)
    const res  = await fetch('/api/cards',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({childId,cardId:card.id,useToken:true})})
    const data = await res.json()
    if(data.success){
      setOwnedIds(prev=>new Set([...prev,card.id]))
      setChild(prev=>prev?{...prev,card_tokens:data.newTokens}:prev)
      showToast(`🎉 ${card.name_en} added to your collection!`)
    } else { showToast(data.error||'Could not collect card') }
    setCollecting(false)
  }

  if(loading) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'"Nunito",sans-serif',background:'#F8F9FB'}}>
      <div style={{textAlign:'center',color:'#6B7280'}}><div style={{fontSize:40,marginBottom:12}}>🌍</div><div style={{fontWeight:700}}>Loading collection...</div></div>
    </div>
  )

  const currentPhase = phases.find(p=>p.slug===activePhase)
  const phaseCards   = cards.filter(c=>c.phase_id===currentPhase?.id)
  const phaseOwned   = phaseCards.filter(c=>ownedIds.has(c.id)).length
  const phaseComplete= phaseCards.length>0&&phaseCards.every(c=>ownedIds.has(c.id))
  const canCollect   = (child?.card_tokens??0)>0
  const completedRegions = phases.filter(p=>{const pc=cards.filter(c=>c.phase_id===p.id);return pc.length>0&&pc.every(c=>ownedIds.has(c.id))}).length

  return (
    <div style={{minHeight:'100vh',background:'#F8F9FB',fontFamily:'"Nunito",sans-serif'}}>
      {toast&&<div style={{position:'fixed',bottom:20,right:20,zIndex:300,padding:'12px 18px',borderRadius:14,background:'#F0FDF4',border:'1px solid #86EFAC',color:'#166534',fontWeight:700,fontSize:13,boxShadow:'0 8px 24px rgba(0,0,0,0.1)'}}>{toast}</div>}
      {openCard&&<CardModal card={openCard} onClose={()=>setOpenCard(null)}/>}

      {/* Header */}
      <header style={{background:'white',borderBottom:'1px solid #F3F4F6',padding:'0 20px',height:58,display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,zIndex:100,boxShadow:'0 2px 12px rgba(0,0,0,0.04)'}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <button onClick={()=>window.location.href=token?`/play/${token}`:'/dashboard'}
            style={{display:'flex',alignItems:'center',gap:5,padding:'7px 13px',borderRadius:10,border:'1.5px solid #E5E7EB',background:'white',color:'#374151',fontWeight:700,fontSize:13,cursor:'pointer'}}>
            <ArrowLeft size={13}/> Back
          </button>
          <div>
            <div style={{fontWeight:800,fontSize:17,color:'#111827',letterSpacing:'-0.02em'}}>Animal Collection</div>
            <div style={{fontSize:11,color:'#9CA3AF',fontWeight:600}}>{ownedIds.size}/{cards.length} cards · {completedRegions} region{completedRegions!==1?'s':''} complete</div>
          </div>
        </div>
        {/* Token bank pill */}
        <div style={{display:'flex',alignItems:'center',gap:6,padding:'6px 16px',borderRadius:50,background:'#FFFBEB',border:'1.5px solid #F59E0B50'}}>
          <span style={{fontSize:20}}>🎴</span>
          <span style={{fontWeight:900,fontSize:20,color:'#B45309'}}>{child?.card_tokens??0}</span>
          <span style={{fontSize:11,fontWeight:700,color:'#92400E'}}>cards</span>
        </div>
      </header>

      <div style={{padding:'16px 20px',maxWidth:900,margin:'0 auto',display:'flex',flexDirection:'column',gap:16}}>
        {/* XP progress toward next token */}
        {child&&<TokenProgressBar child={child}/>}

        {/* World map */}
        <WorldMap phases={phases} ownedIds={ownedIds} cards={cards} onSelect={setActive} activePhase={activePhase}/>

        {/* Region tabs */}
        <div style={{display:'flex',gap:8,overflowX:'auto',paddingBottom:4}}>
          {phases.map(phase=>{
            const pc=cards.filter(c=>c.phase_id===phase.id)
            const po=pc.filter(c=>ownedIds.has(c.id)).length
            const done=po===pc.length&&pc.length>0
            return (
              <button key={phase.id} onClick={()=>setActive(phase.slug)}
                style={{display:'flex',alignItems:'center',gap:7,whiteSpace:'nowrap',padding:'8px 14px',borderRadius:50,border:'1.5px solid',
                  borderColor:activePhase===phase.slug?phase.color:'#E5E7EB',
                  background:activePhase===phase.slug?`${phase.color}15`:'white',
                  color:activePhase===phase.slug?phase.color:'#374151',fontWeight:700,fontSize:12,cursor:'pointer',flexShrink:0}}>
                <span style={{fontSize:15}}>{phase.emoji}</span>
                {phase.name_en}
                <span style={{fontSize:11,fontWeight:600,color:done?'#10B981':activePhase===phase.slug?phase.color:'#9CA3AF'}}>
                  {done?'✓':`${po}/${pc.length}`}
                </span>
              </button>
            )
          })}
        </div>

        {/* Region header */}
        {currentPhase&&(
          <div style={{display:'flex',alignItems:'center',gap:14,background:`${currentPhase.color}10`,borderRadius:14,padding:'14px 18px',border:`1px solid ${currentPhase.color}25`}}>
            <div style={{fontSize:36}}>{currentPhase.emoji}</div>
            <div>
              <div style={{fontWeight:800,fontSize:18,color:'#111827',marginBottom:2}}>{currentPhase.name_en}</div>
              <div style={{fontSize:13,color:'#6B7280'}}>{currentPhase.description_en}</div>
            </div>
            <div style={{marginLeft:'auto',textAlign:'right',flexShrink:0}}>
              <div style={{fontWeight:800,fontSize:20,color:currentPhase.color}}>
                {phaseOwned}<span style={{fontSize:14,color:'#9CA3AF'}}>/{phaseCards.length}</span>
              </div>
              <div style={{fontSize:11,color:'#9CA3AF',fontWeight:600}}>collected</div>
            </div>
          </div>
        )}

        {/* Cards grid */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(175px,1fr))',gap:14}}>
          {phaseCards.map(card=>(
            <AnimalCard key={card.id} card={card}
              owned={ownedIds.has(card.id)}
              canCollect={canCollect&&!ownedIds.has(card.id)}
              onCollect={()=>collectCard(card)}
              onOpen={()=>setOpenCard(card)}/>
          ))}
        </div>

        {/* Region complete banner */}
        {currentPhase&&phaseComplete&&(
          <div style={{textAlign:'center',padding:20,background:'linear-gradient(135deg,#ECFDF5,#D1FAE5)',borderRadius:16,border:'1px solid #6EE7B7'}}>
            <div style={{fontSize:32,marginBottom:6}}>🌟</div>
            <div style={{fontWeight:800,fontSize:16,color:'#065F46',marginBottom:4}}>{currentPhase.name_en} complete!</div>
            <div style={{fontSize:13,color:'#047857',marginBottom:12}}>All {phaseCards.length} animals collected — this region stays lit on the map forever!</div>
            {phases.find(p=>p.sort_order===currentPhase.sort_order+1)&&(
              <button onClick={()=>{const next=phases.find(p=>p.sort_order===currentPhase.sort_order+1);if(next)setActive(next.slug)}}
                style={{padding:'9px 20px',borderRadius:50,background:'#10B981',border:'none',color:'white',fontWeight:700,fontSize:13,cursor:'pointer',display:'inline-flex',alignItems:'center',gap:6}}>
                Next region <ChevronRight size={14}/>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
