'use client'
import { Pip } from '@/components/Pip'
import { useState, useEffect, useCallback } from 'react'
import { Check, X, ChevronRight, Target, BookOpen, Globe, MapPin, Zap, Lock, Gift, CreditCard } from 'lucide-react'
import { KidNavBar, THEME_CONFIG } from '@/components/theme'
import { readKidLang, announceTokensChanged, type KidLang } from '@/lib/kidPrefs'

interface Phase {
  id: string; slug: string; name_en: string; name_he: string
  description_en: string; description_he?: string; sort_order: number
  color: string; emoji: string
}
interface Card {
  id: string; phase_id: string; slug: string
  name_en: string; name_he: string; location_en: string; location_he: string
  rarity: 'common'|'rare'|'epic'|'legendary'
  unsplash_id: string; image_url: string; emoji: string
  fact_en: string; fact_he: string
  facts_en: string[]; facts_he: string[]
  habitat_en: string; habitat_he: string; speed: string; lifespan: string
  diet_en: string; diet_he: string; fun_fact_en: string; fun_fact_he: string
  sort_order: number
}
interface Child {
  id: string; display_name: string
  xp_total: number
  card_tokens: number
  theme: string
}
interface InProgressTopic {
  steps_completed: number; steps_total: number
  topic: { title_en: string; title_he: string; slug: string; subject: { slug: string; label_en: string } }
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

function getCardImg(card: Card, w=400) {
  if (card.image_url) return card.image_url
  return `https://images.unsplash.com/photo-${card.unsplash_id}?w=${w}&fit=crop&auto=format&q=80`
}



// ── In-progress topic step bar ───────────────────────────────
function InProgressBar({ topic, he }: { topic: InProgressTopic | null; he: boolean }) {
  if (!topic) {
    return (
      <div style={{background:'white',borderRadius:14,padding:'16px',border:'1px solid rgba(15,118,110,.14)',display:'flex',alignItems:'center',gap:12}}>
        <div style={{width:36,height:36,borderRadius:10,background:'#F7F5F0',display:'flex',alignItems:'center',justifyContent:'center'}}><Target size={18} color="#9aa6a3"/></div>
        <div>
          <div style={{fontWeight:800,fontSize:14,color:'#111827',fontFamily:'"Baloo 2",sans-serif'}}>{he ? 'אין שיעור פתוח כרגע' : 'No lesson in progress'}</div>
          <div style={{fontSize:11,color:'#9CA3AF'}}>{he ? 'התחילו שיעור כדי לראות כאן את ההתקדמות!' : 'Start a lesson to see your step progress here!'}</div>
        </div>
      </div>
    )
  }
  const pct = Math.min(100, Math.round((topic.steps_completed / (topic.steps_total || 5)) * 100))
  return (
    <div style={{background:'white',borderRadius:14,padding:'12px 16px',border:'1px solid rgba(15,118,110,.14)'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:36,height:36,borderRadius:10,background:'linear-gradient(135deg,#E0A927,#B7862F)',display:'flex',alignItems:'center',justifyContent:'center'}}><BookOpen size={18} color="white"/></div>
          <div>
            <div style={{fontWeight:800,fontSize:15,color:'#111827',fontFamily:'"Baloo 2",sans-serif'}}>{he ? (topic.topic?.title_he || topic.topic?.title_en) : topic.topic?.title_en}</div>
            <div style={{fontSize:11,color:'#9CA3AF'}}>{topic.steps_completed}/{topic.steps_total || 5} {he ? 'שלבים' : 'steps done'}</div>
          </div>
        </div>
        <div style={{fontSize:13,fontWeight:800,color:'#B7862F'}}>{pct}%</div>
      </div>
      <div style={{height:10,background:'#F3F4F6',borderRadius:99,overflow:'hidden'}}>
        <div style={{height:'100%',width:`${pct}%`,background:'linear-gradient(90deg,#E0A927,#F3C55A)',borderRadius:99,transition:'width 0.6s ease'}}/>
      </div>
    </div>
  )
}

// ── Animal Card ───────────────────────────────────────────────
function AnimalCard({ card, owned, canCollect, onCollect, onOpen, he }: {
  card: Card; owned: boolean; canCollect: boolean; he: boolean
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
      <div style={{position:'relative',width:'100%',aspectRatio:'4/3',overflow:'hidden',
        background:`linear-gradient(135deg, ${r.color}40, ${r.color}15)`}}>
        {/* Always show emoji as base layer */}
        <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',
          justifyContent:'center',fontSize:64,
          filter:owned?'none':'grayscale(100%) brightness(0.4)'}}>
          {card.emoji||'🐾'}
        </div>
        {/* Try to load image on top */}
        {card.image_url && !imgErr && (
          <img src={card.image_url} alt={card.name_en} crossOrigin="anonymous"
            style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',
              filter:owned?'none':'grayscale(100%) brightness(0.5)'}}
            onError={()=>setImgErr(true)}/>
        )}
        {/* Dim overlay for uncollected */}
        {!owned && (
          <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.35)',
            display:'flex',alignItems:'center',justifyContent:'center'}}>
            <div style={{width:36,height:36,borderRadius:'50%',background:'rgba(255,255,255,0.2)',
              display:'flex',alignItems:'center',justifyContent:'center',
              fontSize:18,color:'white',fontWeight:900}}>?</div>
          </div>
        )}
        {owned&&<div style={{position:'absolute',top:7,right:7,width:22,height:22,borderRadius:'50%',background:'#10B981',display:'flex',alignItems:'center',justifyContent:'center'}}><Check size={12} color="white" strokeWidth={3}/></div>}
        <div style={{position:'absolute',bottom:0,left:0,right:0,height:3,background:r.color}}/>
      </div>
      <div style={{padding:'10px 11px 11px'}}>
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:4}}>
          <div style={{fontWeight:700,fontSize:13,color:'#111827',lineHeight:1.2,fontFamily:'"Baloo 2",sans-serif'}}>{he ? (card.name_he || card.name_en) : card.name_en}</div>
          <span style={{fontSize:9,fontWeight:700,padding:'2px 6px',borderRadius:10,background:r.bg,color:r.text,border:`0.5px solid ${r.color}40`,marginLeft:4,flexShrink:0}}>{r.label}</span>
        </div>
        <div style={{fontSize:11,color:'#6B7280',marginBottom:7,display:'flex',alignItems:'center',gap:3}}><MapPin size={10}/> {owned?(he?(card.location_he||card.location_en):card.location_en):'???'}</div>
        <div style={{fontSize:12,color:'#374151',lineHeight:1.5,marginBottom:9,minHeight:36}}>
          {owned?(he?(card.fact_he||card.fact_en):card.fact_en):(he?'אספו את הכרטיס כדי לגלות את החיה!':'Collect this card to discover this animal!')}
        </div>
        {!owned&&canCollect&&(
          <button onClick={e=>{e.stopPropagation();onCollect()}}
            style={{width:'100%',padding:8,borderRadius:8,border:'none',cursor:'pointer',
              background:'linear-gradient(135deg,#E0A927,#B7862F)',color:'white',fontWeight:700,fontSize:12,
              display:'flex',alignItems:'center',justifyContent:'center',gap:5}}>
            <Gift size={12}/> {he ? 'אספו כרטיס' : 'Collect Card'} (<CreditCard size={11}/> 1)
          </button>
        )}
        {!owned&&!canCollect&&(
          <div style={{width:'100%',padding:7,borderRadius:8,background:'#F9FAFB',color:'#9CA3AF',fontWeight:600,fontSize:11,textAlign:'center',display:'flex',alignItems:'center',justifyContent:'center',gap:4}}>
            {he ? 'סיימו שיעורים כדי להרוויח' : 'Complete lessons to earn'} <CreditCard size={12}/>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Card Detail Modal ─────────────────────────────────────────
function CardModal({ card, onClose, initialHe = false }: { card: Card; onClose: ()=>void; initialHe?: boolean }) {
  const r = RARITY[card.rarity]??RARITY.common
  const [imgErr,setImgErr] = useState(false)
  const [lang,setLang] = useState<'en'|'he'>(initialHe ? 'he' : 'en')
  const he = lang === 'he'
  const name     = he ? (card.name_he     || card.name_en)     : card.name_en
  const location = he ? (card.location_he || card.location_en) : card.location_en
  const habitat  = he ? (card.habitat_he  || card.habitat_en)  : card.habitat_en
  const diet     = he ? (card.diet_he     || card.diet_en)     : card.diet_en
  const funFact  = he ? (card.fun_fact_he || card.fun_fact_en) : card.fun_fact_en
  const facts    = he ? (card.facts_he?.length ? card.facts_he : card.facts_en) : (card.facts_en?.length ? card.facts_en : [card.fact_en])
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:16}} onClick={onClose}>
      <div style={{background:'white',borderRadius:20,maxWidth:520,width:'100%',overflow:'hidden',maxHeight:'92vh',overflowY:'auto',boxShadow:'0 24px 60px rgba(0,0,0,0.3)'}} onClick={e=>e.stopPropagation()}>
        <div style={{position:'relative',width:'100%',height:300,background:`linear-gradient(135deg,${r.color}40,${r.color}15)`,overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center',fontSize:120}}>
          {card.emoji||'🐾'}
          {card.image_url&&!imgErr&&<img src={card.image_url} alt={card.name_en} crossOrigin="anonymous" style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'contain'}} onError={()=>setImgErr(true)}/>}
          <div style={{position:'absolute',inset:0,background:'linear-gradient(to top,rgba(0,0,0,0.65) 0%,transparent 55%)'}}/>
          <div style={{position:'absolute',bottom:14,left:16,right:60,textAlign:'start'}} dir={he?'rtl':'ltr'}>
            <div style={{fontSize:24,fontWeight:800,color:'white',marginBottom:3,fontFamily:'"Baloo 2",sans-serif'}}>{name}</div>
            <div style={{fontSize:12,color:'rgba(255,255,255,0.85)',display:'flex',alignItems:'center',gap:4}}><MapPin size={12}/> {location}</div>
          </div>
          <div style={{position:'absolute',top:10,left:10,display:'flex',borderRadius:8,overflow:'hidden',border:'1px solid rgba(255,255,255,0.3)'}}>
            {(['en','he'] as const).map(l=>(
              <button key={l} onClick={e=>{e.stopPropagation();setLang(l)}}
                style={{padding:'4px 10px',fontSize:11,fontWeight:700,border:'none',cursor:'pointer',
                  background:lang===l?'rgba(255,255,255,0.9)':'rgba(0,0,0,0.3)',
                  color:lang===l?'#111':'white'}}>
                {l==='en'?'EN':'עב'}
              </button>
            ))}
          </div>
          <button onClick={onClose} style={{position:'absolute',top:10,right:10,width:30,height:30,borderRadius:'50%',background:'rgba(0,0,0,0.45)',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}><X size={15} color="white"/></button>
          <div style={{position:'absolute',bottom:0,left:0,right:0,height:3,background:r.color}}/>
        </div>
        <div style={{padding:'16px 20px 20px',textAlign:'start'}} dir={he?'rtl':'ltr'}>
          <span style={{fontSize:11,fontWeight:700,padding:'3px 9px',borderRadius:10,background:r.bg,color:r.text,border:`0.5px solid ${r.color}40`}}>{r.label}</span>
          <div style={{display:'flex',flexDirection:'column',gap:10,margin:'14px 0 16px'}}>
            {facts.map((f: string,i: number)=>(
              <div key={i} style={{display:'flex',gap:10,alignItems:'flex-start'}}>
                <div style={{width:20,height:20,borderRadius:'50%',background:r.bg,color:r.text,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,flexShrink:0,marginTop:1}}>{i+1}</div>
                <div style={{fontSize:13,color:'#374151',lineHeight:1.6}}>{f}</div>
              </div>
            ))}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:14}}>
            {[[he?'בית גידול':'Habitat',habitat],[he?'מהירות':'Top Speed',card.speed],[he?'תוחלת חיים':'Lifespan',card.lifespan],[he?'תזונה':'Diet',diet]].map(([l,v])=>(
              <div key={l} style={{background:'#F9FAFB',borderRadius:10,padding:'9px 11px'}}>
                <div style={{fontSize:11,color:'#9CA3AF',marginBottom:2}}>{l}</div>
                <div style={{fontSize:13,fontWeight:600,color:'#111827'}}>{v}</div>
              </div>
            ))}
          </div>
          {funFact&&<div style={{background:`${r.color}12`,border:`0.5px solid ${r.color}30`,borderRadius:10,padding:'11px 13px',marginBottom:16}}>
            <div style={{fontSize:11,fontWeight:700,color:r.color,marginBottom:4,display:'flex',alignItems:'center',gap:4}}><Zap size={12}/> {he?'ידעת?':'Did you know?'}</div>
            <div style={{fontSize:12,color:'#374151',lineHeight:1.6}}>{funFact}</div>
          </div>}
          <button onClick={onClose} style={{width:'100%',padding:10,borderRadius:10,border:'0.5px solid rgba(15,118,110,.14)',background:'white',cursor:'pointer',fontSize:14,color:'#374151'}}>{he?'סגור':'Close'}</button>
        </div>
      </div>
    </div>
  )
}
// ── Main ──────────────────────────────────────────────────────
// ── Card reveal celebration ───────────────────────────────────
// Collecting a card used to show only a small toast. Now the card appears
// face-down, flips over with confetti, and — if it was the last animal in its
// region — a second "region complete" moment follows.
const RARITY_HE: Record<string, string> = { common:'רגיל', rare:'נדיר', epic:'נדיר מאוד', legendary:'אגדי' }
const CONFETTI_COLORS = ['#F4A340','#0F766E','#E05BA0','#4A7FD4','#F4D35E','#9BE23D']

function CardReveal({ card, region, he, theme, onClose }: {
  card: Card; region: { name: string; emoji: string } | null; he: boolean; theme: string; onClose: ()=>void
}) {
  const r = RARITY[card.rarity] ?? RARITY.common
  const [flipped, setFlipped] = useState(false)
  const [stage, setStage] = useState<'card'|'region'>('card')
  const [imgErr, setImgErr] = useState(false)
  useEffect(() => { const t = setTimeout(() => setFlipped(true), 500); return () => clearTimeout(t) }, [])
  const name = he ? (card.name_he || card.name_en) : card.name_en
  const location = he ? (card.location_he || card.location_en) : card.location_en
  const fact = he ? (card.fact_he || card.fact_en) : card.fact_en

  function next() {
    if (stage === 'card' && region) setStage('region')
    else onClose()
  }

  return (
    <div role="dialog" aria-modal="true" dir={he ? 'rtl' : 'ltr'}
      style={{ position:'fixed', inset:0, zIndex:500, background:'rgba(10,15,30,0.82)', display:'flex', alignItems:'center', justifyContent:'center', padding:20, overflow:'hidden', fontFamily:'"Nunito",sans-serif' }}>
      <style>{`
        @keyframes cr-fall { 0%{transform:translateY(-10vh) rotate(0)} 100%{transform:translateY(110vh) rotate(720deg)} }
        @keyframes cr-pop { 0%{transform:scale(.6);opacity:0} 70%{transform:scale(1.06);opacity:1} 100%{transform:scale(1)} }
        @keyframes cr-glow { 0%,100%{box-shadow:0 0 0 0 ${r.color}66} 50%{box-shadow:0 0 40px 10px ${r.color}88} }
        @media (prefers-reduced-motion: reduce) { .cr-anim { animation:none !important; transition:none !important } }
      `}</style>
      {flipped && Array.from({ length: 36 }).map((_, i) => (
        <span key={i} className="cr-anim" aria-hidden style={{
          position:'absolute', top:0, left:`${(i * 97) % 100}%`, width:8, height:14, borderRadius:2,
          background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
          animation:`cr-fall ${2.2 + (i % 5) * 0.35}s linear ${(i % 7) * 0.12}s both`,
        }}/>
      ))}

      {stage === 'card' ? (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:18, maxWidth:340, width:'100%' }}>
          <div style={{ color:'#fff', fontWeight:900, fontSize:22, textAlign:'center', minHeight:30 }}>
            {flipped ? (he ? 'מדבקה חדשה באלבום!' : 'A new sticker for your album!') : (he ? 'מה יש במדבקה?…' : "What's on the sticker?…")}
          </div>
          <div style={{ perspective:1000, width:260, height:340 }}>
            <div className="cr-anim" style={{ position:'relative', width:'100%', height:'100%', transformStyle:'preserve-3d', transition:'transform .8s cubic-bezier(.3,1.4,.5,1)', transform: flipped ? 'rotateY(180deg)' : 'none' }}>
              {/* back */}
              <div style={{ position:'absolute', inset:0, backfaceVisibility:'hidden', borderRadius:20, background:'linear-gradient(135deg,#0F766E,#7C6BAE)', border:'4px solid #F4D35E', display:'flex', alignItems:'center', justifyContent:'center', fontSize:96, color:'#F4D35E', fontWeight:900 }}>?</div>
              {/* front */}
              <div className="cr-anim" style={{ position:'absolute', inset:0, backfaceVisibility:'hidden', transform:'rotateY(180deg)', borderRadius:20, background:'#fff', border:`4px solid ${r.color}`, overflow:'hidden', display:'flex', flexDirection:'column', animation: flipped ? 'cr-glow 2s ease-in-out 1s infinite' : 'none' }}>
                <div style={{ position:'relative', height:190, background:`linear-gradient(135deg, ${r.color}40, ${r.color}15)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:90 }}>
                  {card.emoji || '🐾'}
                  {card.image_url && !imgErr && <img src={card.image_url} alt={name} onError={() => setImgErr(true)} style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }}/>}
                </div>
                <div style={{ padding:'12px 14px', display:'flex', flexDirection:'column', gap:6 }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
                    <div style={{ fontWeight:900, fontSize:20, color:'#111827', fontFamily:'"Baloo 2",sans-serif' }}>{name}</div>
                    <span style={{ fontSize:11, fontWeight:800, padding:'3px 8px', borderRadius:10, background:r.bg, color:r.text }}>{he ? RARITY_HE[card.rarity] || r.label : r.label}</span>
                  </div>
                  <div style={{ fontSize:12, color:'#6B7280', display:'flex', alignItems:'center', gap:4 }}><MapPin size={12}/> {location}</div>
                  <div style={{ fontSize:13, color:'#374151', lineHeight:1.5 }}>{fact}</div>
                </div>
              </div>
            </div>
          </div>
          <button onClick={next} disabled={!flipped}
            style={{ minHeight:52, minWidth:200, padding:'12px 28px', borderRadius:999, border:'none', background:'#F4D35E', color:'#3b2a00', fontWeight:900, fontSize:18, cursor:'pointer', opacity: flipped ? 1 : 0, transition:'opacity .4s .6s' }}>
            {he ? 'יש!' : 'Yay!'}
          </button>
        </div>
      ) : (
        <div className="cr-anim" style={{ background:'#fff', borderRadius:24, padding:'30px 26px', maxWidth:360, width:'100%', textAlign:'center', animation:'cr-pop .5s ease both' }}>
          <div style={{ display:'flex', justifyContent:'center', alignItems:'flex-end', gap:4 }}>
            <Pip theme={theme} pose="celebrate" size={130} he={he} bounce />
            <span style={{ fontSize:44 }} aria-hidden>{region?.emoji || '🌍'}</span>
          </div>
          <div style={{ fontWeight:900, fontSize:22, color:'#065F46', fontFamily:'"Baloo 2",sans-serif' }}>
            {he ? `העמוד "${region?.name}" מלא!` : `"${region?.name}" page full!`}
          </div>
          <div style={{ fontSize:14, color:'#374151', margin:'8px 0 18px', lineHeight:1.5 }}>
            {he ? 'מילאת עמוד שלם באלבום — העמוד הבא נפתח!' : 'You filled a whole album page — the next page is open!'}
          </div>
          <button onClick={onClose} style={{ minHeight:52, padding:'12px 30px', borderRadius:999, border:'none', background:'#10B981', color:'#fff', fontWeight:900, fontSize:17, cursor:'pointer' }}>
            {he ? 'יופי!' : 'Great!'}
          </button>
        </div>
      )}
    </div>
  )
}


export default function CardsPage() {
  const [phases,setPhases]     = useState<Phase[]>([])
  const [cards,setCards]       = useState<Card[]>([])
  const [ownedIds,setOwnedIds] = useState<Set<string>>(new Set())
  const [child,setChild]       = useState<Child|null>(null)
  const [inProgress,setInProgress] = useState<InProgressTopic|null>(null)
  const [loading,setLoading]   = useState(true)
  const [activePhase,setActive]= useState<string|null>(null)
  const [openCard,setOpenCard] = useState<Card|null>(null)
  const [toast,setToast]       = useState<string|null>(null)
  const [collecting,setCollecting] = useState(false)
  const [reveal,setReveal] = useState<{ card: Card; region: { name: string; emoji: string } | null }|null>(null)

  const childId = typeof window!=='undefined'?new URLSearchParams(window.location.search).get('childId')||'':''
  const token   = typeof window!=='undefined'?new URLSearchParams(window.location.search).get('token')||'':''
  const urlTheme = typeof window!=='undefined'?new URLSearchParams(window.location.search).get('theme')||'':''
  // Language + theme follow the child from Home (they used to reset to
  // English and a fixed light look here).
  const [lang,setLang] = useState<KidLang>('bilingual')
  useEffect(()=>{ setLang(readKidLang(childId)) },[childId])
  const he = lang === 'he_only'

  const showToast = useCallback((msg:string)=>{ setToast(msg); setTimeout(()=>setToast(null),3500) },[])

  useEffect(()=>{
    if(!childId){setLoading(false);return}
    Promise.all([
      fetch(`/api/cards?childId=${childId}`).then(r=>r.json()),
      fetch(`/api/children?childId=${childId}`).then(r=>r.json()),
      fetch(`/api/progress?childId=${childId}`).then(r=>r.json()),
    ]).then(([cardsData,childData,progressData])=>{
      setPhases(cardsData.phases||[])
      setCards(cardsData.cards||[])
      setOwnedIds(new Set(cardsData.ownedIds||[]))
      setChild(childData.child||null)
      const inProgressTopics = (progressData.progress||[])
        .filter((p: any) => p.status === 'in_progress')
        .sort((a: any, b: any) => new Date(b.last_attempted_at).getTime() - new Date(a.last_attempted_at).getTime())
      setInProgress(inProgressTopics[0] || null)
      if(cardsData.phases?.[0]) setActive(cardsData.phases[0].slug)
      // Design/QA preview: ?preview=reveal (or reveal-region) replays the unlock
      // celebration on a card the child already owns. Nothing is spent or saved.
      const pv = new URLSearchParams(window.location.search).get('preview')
      if (pv === 'reveal' || pv === 'reveal-region') {
        const owned = (cardsData.cards||[]).find((c: Card) => (cardsData.ownedIds||[]).includes(c.id))
        const ph = owned && (cardsData.phases||[]).find((p: Phase) => p.id === owned.phase_id)
        if (owned) setReveal({ card: owned, region: pv === 'reveal-region' && ph ? { name: readKidLang(childId) === 'he_only' ? (ph.name_he||ph.name_en) : ph.name_en, emoji: ph.emoji } : null })
      }
      setLoading(false)
    })
  },[childId])

  async function collectCard(card: Card) {
    if(!child||child.card_tokens<1||collecting) return
    setCollecting(true)
    const res  = await fetch('/api/cards',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({childId,cardId:card.id,useToken:true})})
    const data = await res.json()
    if(data.success){
      const nowOwned = new Set([...ownedIds, card.id])
      setOwnedIds(nowOwned)
      setChild(prev=>prev?{...prev,card_tokens:data.newTokens}:prev)
      announceTokensChanged()
      // Was this the last animal in its region? Then the reveal ends with a region-complete moment.
      const phase = phases.find(p=>p.id===card.phase_id)
      const regionCards = cards.filter(c=>c.phase_id===card.phase_id)
      const regionDone = !!phase && regionCards.length>0 && regionCards.every(c=>nowOwned.has(c.id))
      setReveal({ card, region: regionDone && phase ? { name: he ? (phase.name_he||phase.name_en) : phase.name_en, emoji: phase.emoji } : null })
    } else { showToast(he ? 'לא הצלחנו להדביק — נסו שוב' : 'Could not place the sticker — try again') }
    setCollecting(false)
  }

  if(loading) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'"Nunito",sans-serif',background:'#F7F5F0'}}>
      <div style={{textAlign:'center',color:'#6B7280'}}><div style={{marginBottom:12,display:'flex',justifyContent:'center'}}><Globe size={40}/></div><div style={{fontWeight:700,fontFamily:'"Baloo 2",sans-serif'}}>{he ? 'פותחים את האלבום...' : 'Opening your album...'}</div></div>
    </div>
  )

  const currentPhase = phases.find(p=>p.slug===activePhase)
  const phaseCards   = cards.filter(c=>c.phase_id===currentPhase?.id)
  const phaseOwned   = phaseCards.filter(c=>ownedIds.has(c.id)).length
  const phaseComplete= phaseCards.length>0&&phaseCards.every(c=>ownedIds.has(c.id))
  const canCollect   = (child?.card_tokens??0)>0
  const themeKey = urlTheme || child?.theme || 'plain'
  const T = THEME_CONFIG[themeKey] || THEME_CONFIG.plain
  const completedRegions = phases.filter(p=>{const pc=cards.filter(c=>c.phase_id===p.id);return pc.length>0&&pc.every(c=>ownedIds.has(c.id))}).length

  // ── Sticker album ──────────────────────────────────────────
  // Each region is a page of the album. A page opens when the page before it
  // is full (or the child already has a sticker on it, so nothing they own is
  // ever hidden). Every finished lesson or task gives one sticker to place.
  const F = '"Rubik","Assistant",sans-serif'
  const dark = themeKey === 'minecraft'
  const L = (h: string, e: string) => (he ? h : e)
  const pageInfo = phases.map(p => {
    const pc = cards.filter(c => c.phase_id === p.id)
    const owned = pc.filter(c => ownedIds.has(c.id)).length
    return { phase: p, cards: pc, owned, full: pc.length > 0 && owned === pc.length }
  })
  const isOpenPage = (i: number) => i === 0 || !!pageInfo[i - 1]?.full || pageInfo[i].owned > 0
  const activeIdx = Math.max(0, pageInfo.findIndex(x => x.phase.slug === activePhase))
  const page = pageInfo[activeIdx]
  const pageOpen = page ? isOpenPage(activeIdx) : false
  const tokens = child?.card_tokens ?? 0
  const nextPage = pageInfo[activeIdx + 1]
  const tilt = (i: number) => [-6, 4, -2, 7, -4, 3, -7, 5][i % 8]
  const prevPage = pageInfo[activeIdx - 1]
  const leftOnPrev = prevPage ? prevPage.cards.length - prevPage.owned : 0

  function tapSlot(card: Card) {
    if (ownedIds.has(card.id)) { setOpenCard(card); return }
    if (!pageOpen) return
    if (tokens < 1) { showToast(L('סיימו שיעור או משימה כדי לקבל מדבקה', 'Finish a lesson or task to earn a sticker')); return }
    collectCard(card)
  }

  return (
    <div dir={he?'rtl':'ltr'} style={{minHeight:'100vh',background:T.bg,color:T.text,fontFamily:'"Assistant",sans-serif'}}>
      <style>{`@keyframes st-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}@media (prefers-reduced-motion: reduce){.st-pulse{animation:none!important}}`}</style>
      {toast&&<div role="status" style={{position:'fixed',bottom:96,left:'50%',transform:'translateX(-50%)',zIndex:300,padding:'12px 18px',borderRadius:16,background:'#16213E',color:'#fff',fontWeight:700,fontSize:16,maxWidth:'90vw',textAlign:'center'}}>{toast}</div>}
      {reveal&&<CardReveal card={reveal.card} region={reveal.region} he={he} theme={themeKey} onClose={()=>setReveal(null)}/>}
      {openCard&&<CardModal card={openCard} onClose={()=>setOpenCard(null)} initialHe={he}/>}

      <div style={{maxWidth:720,margin:'0 auto',padding:'20px 18px 110px',display:'flex',flexDirection:'column',gap:16}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <Pip theme={themeKey} pose="wave" size={64} he={he}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontFamily:F,fontSize:26,fontWeight:800}}>{L('המדבקות שלי','My stickers')}</div>
            <div style={{fontSize:16,color:T.text2}}>{L(`${ownedIds.size} מתוך ${cards.length} באלבום`,`${ownedIds.size} of ${cards.length} in the album`)}</div>
          </div>
        </div>

        {/* Stickers waiting to be placed */}
        <div style={{display:'flex',alignItems:'center',gap:12,padding:'14px 16px',borderRadius:dark?4:20,background:tokens>0?(dark?'#3A3A1E':'#FFF4D6'):T.panel,border:`2px solid ${tokens>0?'#FFC940':T.border}`}}>
          <span className={tokens>0?'st-pulse':''} style={{width:52,height:52,flexShrink:0,borderRadius:'50%',background:'radial-gradient(circle at 35% 30%, #FFE08A, #FFC940 60%, #E0A800)',border:'4px solid #fff',boxShadow:'0 4px 10px rgba(224,168,0,.3)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:F,fontSize:20,fontWeight:800,color:'#7A5600',animation:tokens>0?'st-pulse 1.8s ease-in-out infinite':'none'}}>{tokens}</span>
          <div style={{fontSize:17,fontWeight:700,lineHeight:1.4}}>
            {tokens>0
              ? L(`יש לך ${tokens === 1 ? 'מדבקה אחת' : `${tokens} מדבקות`} להדביק! בחרו מקום ריק בעמוד.`,`You have ${tokens} sticker${tokens===1?'':'s'} to place! Tap an empty spot.`)
              : L('כל שיעור או משימה שמסיימים = מדבקה חדשה','Every lesson or task you finish = a new sticker')}
          </div>
        </div>

        {/* Album pages */}
        <div role="tablist" style={{display:'flex',gap:8,overflowX:'auto',paddingBottom:4}}>
          {pageInfo.map((x,i)=>{
            const on = i===activeIdx, open = isOpenPage(i)
            return (
              <button key={x.phase.id} role="tab" aria-selected={on} onClick={()=>setActive(x.phase.slug)}
                style={{display:'flex',alignItems:'center',gap:6,whiteSpace:'nowrap',minHeight:48,padding:'0 16px',borderRadius:999,flexShrink:0,cursor:'pointer',
                  border:`2px solid ${on?T.accent1:T.border}`,background:on?T.accent1:T.panel,color:on?'#fff':T.text,fontFamily:F,fontWeight:700,fontSize:16,opacity:open?1:.6}}>
                {open ? null : <Lock size={14}/>}
                {he ? (x.phase.name_he||x.phase.name_en) : x.phase.name_en}
                {x.full ? <Check size={16}/> : open ? <span style={{fontSize:13,opacity:.8}} dir="ltr">{x.owned}/{x.cards.length}</span> : null}
              </button>
            )
          })}
        </div>

        {/* The page */}
        {page && (
          <div style={{background:dark?T.panel:'#FFFFFF',border:`1.5px solid ${T.border}`,borderRadius:dark?4:28,padding:'18px 16px 22px',position:'relative'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
              <div style={{fontFamily:F,fontSize:22,fontWeight:800}}>{he ? (page.phase.name_he||page.phase.name_en) : page.phase.name_en}</div>
              <div style={{fontFamily:F,fontWeight:800,color:T.text2}} dir="ltr">{page.owned}/{page.cards.length}</div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3, minmax(0, 1fr))',gap:14,filter:pageOpen?'none':'grayscale(1)',opacity:pageOpen?1:.45}}>
              {page.cards.map((card,i)=>{
                const owned = ownedIds.has(card.id)
                const name = he ? (card.name_he||card.name_en) : card.name_en
                const canPlace = pageOpen && !owned && tokens>0
                return (
                  <button key={card.id} onClick={()=>tapSlot(card)} disabled={collecting || (!pageOpen && !owned)}
                    aria-label={owned ? name : L('מקום ריק למדבקה','Empty sticker spot')}
                    style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6,background:'none',border:'none',padding:0,cursor:owned||canPlace?'pointer':'default',fontFamily:'inherit',color:T.text}}>
                    {owned ? (
                      <span style={{width:'100%',aspectRatio:'1',borderRadius:'50%',overflow:'hidden',border:'5px solid #fff',boxShadow:'0 4px 12px rgba(0,0,0,.18)',transform:`rotate(${tilt(i)}deg)`,background:'#EEE',display:'block',position:'relative'}}>
                        {card.image_url
                          ? <img src={card.image_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>
                          : <span style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:40}}>{card.emoji}</span>}
                      </span>
                    ) : (
                      <span className={canPlace?'st-pulse':''} style={{width:'100%',aspectRatio:'1',borderRadius:'50%',border:`3px dashed ${canPlace?'#E0A800':T.border}`,background:canPlace?(dark?'#3A3A1E':'#FFF9E8'):'transparent',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:F,fontSize:30,fontWeight:800,color:canPlace?'#B7862F':T.text2,animation:canPlace?'st-pulse 2s ease-in-out infinite':'none',boxSizing:'border-box'}}>
                        {canPlace ? '+' : '?'}
                      </span>
                    )}
                    <span style={{fontSize:15,fontWeight:700,minHeight:20,textAlign:'center'}}>{owned ? name : ''}</span>
                  </button>
                )
              })}
            </div>
            {!pageOpen && (
              <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
                <div style={{background:T.panel,border:`1.5px solid ${T.border}`,borderRadius:20,padding:'16px 18px',textAlign:'center',maxWidth:280,boxShadow:'0 8px 24px rgba(0,0,0,.12)'}}>
                  <Lock size={28} color={T.accent1}/>
                  <div style={{fontFamily:F,fontSize:18,fontWeight:800,marginTop:6}}>{L('העמוד הזה עוד נעול','This page is locked')}</div>
                  <div style={{fontSize:16,color:T.text2,marginTop:4}}>
                    {L(`עוד ${leftOnPrev} מדבקות בעמוד "${prevPage?.phase.name_he||prevPage?.phase.name_en}" והוא נפתח`, `${leftOnPrev} more sticker${leftOnPrev===1?'':'s'} on "${prevPage?.phase.name_en}" to open it`)}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {page && page.full && nextPage && (
          <button onClick={()=>setActive(nextPage.phase.slug)}
            style={{minHeight:64,border:'none',borderRadius:dark?4:18,background:'#12937A',color:'#fff',fontFamily:F,fontSize:20,fontWeight:800,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
            {L(`העמוד מלא! לעמוד הבא: ${nextPage.phase.name_he||nextPage.phase.name_en}`, `Page full! Next: ${nextPage.phase.name_en}`)}
            <ChevronRight size={20} style={he?{transform:'scaleX(-1)'}:undefined}/>
          </button>
        )}
      </div>

      <KidNavBar theme={themeKey} active="rewards" childId={childId} token={token} lang={lang}/>
    </div>
  )
}
