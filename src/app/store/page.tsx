'use client'
import { useState, useEffect } from 'react'
import { ShoppingCart, Star, Check, Package, Sparkles, Trees, ArrowLeft, Users, Zap } from 'lucide-react'

// ── ANIMAL FIGURES (full body SVG style using emoji layers) ──
const ANIMALS: any = {
  fox:    { head:'🦊', body:'🟠', name:'Fox',    color:'#FF6B35' },
  cat:    { head:'🐱', body:'🟣', name:'Cat',    color:'#9B59B6' },
  bear:   { head:'🐻', body:'🟤', name:'Bear',   color:'#8B4513' },
  owl:    { head:'🦉', body:'🟡', name:'Owl',    color:'#F0A500' },
  rabbit: { head:'🐰', body:'⚪', name:'Rabbit', color:'#E8D5C4' },
  lion:   { head:'🦁', body:'🟡', name:'Lion',   color:'#E6AC00' },
}

// ── OUTFIT SETS ──
const OUTFITS: any = {
  sports:    { hat:'⛑️',  top:'👕', bottom:'🩳', shoes:'👟', accessory:'⚽', colors:['#E63946','#457B9D'], badge:'🏆' },
  medieval:  { hat:'👑',  top:'🛡️', bottom:'⚔️', shoes:'🥾', accessory:'🗡️', colors:['#6B6B6B','#FFD700'], badge:'👑' },
  hiphop:    { hat:'🧢',  top:'🎤', bottom:'👖', shoes:'👟', accessory:'🎧', colors:['#FF6B6B','#1A1A2E'], badge:'🎵' },
  wizard:    { hat:'🎩',  top:'🌟', bottom:'🪄', shoes:'✨', accessory:'📖', colors:['#7B2FBE','#FFD700'], badge:'✨' },
  astronaut: { hat:'🪖',  top:'🚀', bottom:'🌙', shoes:'🥾', accessory:'🔭', colors:['#E0E0E0','#4A7FD4'], badge:'⭐' },
}

const GRID_COLS = 8
const GRID_ROWS = 6

function FullBodyAvatar({ animal, outfit, size = 180 }: { animal: string, outfit: string | null, size?: number }) {
  const a = ANIMALS[animal] || ANIMALS.fox
  const o = outfit ? OUTFITS[outfit] : null
  const scale = size / 180

  return (
    <div style={{ position:'relative', width:size, height:size * 1.4, margin:'0 auto', userSelect:'none' }}>
      {/* Background glow */}
      <div style={{ position:'absolute', inset:0, borderRadius:'50%', background:`radial-gradient(circle at 50% 60%, ${a.color}20, transparent 70%)` }}/>

      {/* Full body figure */}
      <div style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', textAlign:'center' }}>

        {/* Hat / headwear */}
        {o && (
          <div style={{ fontSize:size * 0.22, lineHeight:1, marginBottom:'-4px' }}>{o.hat}</div>
        )}

        {/* Head */}
        <div style={{ fontSize:size * 0.32, lineHeight:1.1 }}>{a.head}</div>

        {/* Neck / collar indicator */}
        <div style={{ width:size * 0.08, height:size * 0.05, background:o ? o.colors[0] : a.color, margin:'0 auto', borderRadius:'4px', opacity:0.7 }}/>

        {/* Body / torso */}
        <div style={{ fontSize:size * 0.28, lineHeight:1.1 }}>
          {o ? o.top : '🫁'}
        </div>

        {/* Waist + legs */}
        <div style={{ fontSize:size * 0.22, lineHeight:1 }}>
          {o ? o.bottom : '🩲'}
        </div>

        {/* Shoes */}
        <div style={{ fontSize:size * 0.16, lineHeight:1, marginTop:'2px' }}>
          {o ? o.shoes : '🩴'}
        </div>

        {/* Accessory floating */}
        {o && (
          <div style={{
            position:'absolute',
            right:size * -0.15,
            top:size * 0.25,
            fontSize:size * 0.2,
            filter:'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
            animation:'float 3s ease-in-out infinite',
          }}>
            {o.accessory}
          </div>
        )}
      </div>

      {/* Outfit badge */}
      {o && (
        <div style={{ position:'absolute', bottom:size * 0.1, right:0, width:size * 0.22, height:size * 0.22, borderRadius:'50%', background:`linear-gradient(135deg,${o.colors[0]},${o.colors[1]})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:size * 0.12, boxShadow:'0 2px 8px rgba(0,0,0,0.2)' }}>
          {o.badge}
        </div>
      )}

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  )
}

function ParkGrid({ placedItems, selectedItem, onCellClick, onRemove }: any) {
  const cellSize = Math.min(52, Math.floor((window.innerWidth - 48) / GRID_COLS))

  return (
    <div style={{ position:'relative', borderRadius:'20px', overflow:'hidden', boxShadow:'0 8px 32px rgba(0,0,0,0.12)' }}>
      {/* Sky */}
      <div style={{ height:'60px', background:'linear-gradient(180deg,#87CEEB,#B0E0FF)', position:'relative', display:'flex', alignItems:'center', padding:'0 16px', gap:'8px' }}>
        <span style={{ fontSize:'20px' }}>☀️</span>
        <span style={{ fontSize:'14px' }}>⛅</span>
        <span style={{ fontSize:'10px' }}>☁️</span>
        <span style={{ position:'absolute', right:'16px', fontSize:'16px' }}>🌈</span>
      </div>

      {/* Path / ground */}
      <div style={{ height:'12px', background:'linear-gradient(180deg,#DEB887,#C8A96E)' }}/>

      {/* Grass grid */}
      <div style={{ background:'linear-gradient(180deg,#4CAF50,#388E3C)', padding:'8px', position:'relative' }}>
        {/* Decorative trees on sides */}
        <div style={{ position:'absolute', left:'4px', top:'8px', fontSize:'24px', opacity:0.4 }}>🌳</div>
        <div style={{ position:'absolute', right:'4px', top:'8px', fontSize:'24px', opacity:0.4 }}>🌲</div>

        <div style={{ display:'grid', gridTemplateColumns:`repeat(${GRID_COLS},${cellSize}px)`, gridTemplateRows:`repeat(${GRID_ROWS},${cellSize}px)`, gap:'2px', position:'relative', zIndex:1 }}>
          {Array.from({ length: GRID_ROWS }).map((_, row) =>
            Array.from({ length: GRID_COLS }).map((_, col) => {
              const placedHere = placedItems.find((p: any) => {
                const pd = p.item_data || {}
                return col >= p.col && col < p.col + (pd.w||1) &&
                       row >= p.row && row < p.row + (pd.h||1)
              })
              const isOrigin = placedHere && placedHere.col === col && placedHere.row === row

              return (
                <div key={`${col}-${row}`}
                  onClick={() => !placedHere && onCellClick(col, row)}
                  style={{
                    width:cellSize, height:cellSize,
                    borderRadius:'6px',
                    background:placedHere
                      ? `${placedHere.item_data?.color || '#4A7FD4'}60`
                      : selectedItem
                        ? 'rgba(255,255,255,0.15)'
                        : 'rgba(255,255,255,0.08)',
                    border:placedHere
                      ? `2px solid ${placedHere.item_data?.color || '#4A7FD4'}80`
                      : '1px solid rgba(255,255,255,0.1)',
                    cursor:selectedItem && !placedHere ? 'crosshair' : 'default',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:cellSize * 0.5,
                    position:'relative',
                    transition:'all 0.15s',
                  }}
                  onMouseEnter={e => { if(selectedItem && !placedHere) (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.3)' }}
                  onMouseLeave={e => { if(selectedItem && !placedHere) (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.15)' }}
                >
                  {isOrigin && (
                    <>
                      <span>{placedHere.icon_emoji || placedHere.icon}</span>
                      <button
                        onClick={e => { e.stopPropagation(); onRemove(placedHere.placedId) }}
                        style={{ position:'absolute', top:'-6px', right:'-6px', width:'18px', height:'18px', borderRadius:'50%', border:'none', background:'#EF4444', color:'white', fontSize:'11px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, lineHeight:1, zIndex:10 }}>
                        ×
                      </button>
                    </>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Ground / path strip */}
      <div style={{ height:'16px', background:'linear-gradient(180deg,#C8A96E,#A0835A)', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}>
        <span style={{ fontSize:'10px', opacity:0.5 }}>• • • • • • • •</span>
      </div>
    </div>
  )
}

export default function StorePage() {
  const [tab, setTab]             = useState<'avatar'|'park'>('avatar')
  const [items, setItems]         = useState<any[]>([])
  const [purchases, setPurchases] = useState<string[]>([])
  const [xp, setXp]               = useState(0)
  const [animal, setAnimal]       = useState('fox')
  const [equippedSet, setEquipped]= useState<string|null>(null)
  const [placedItems, setPlaced]  = useState<any[]>([])
  const [selectedItem, setSelected] = useState<any>(null)
  const [parkName, setParkName]   = useState('My Amazing Park')
  const [loading, setLoading]     = useState(true)
  const [toast, setToast]         = useState<{msg:string,type:string}|null>(null)

  const childId = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('childId') || '22222222-2222-2222-2222-222222222002' : '22222222-2222-2222-2222-222222222002'
  const token = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('token') || '' : ''

  useEffect(() => { loadData() }, [])

  async function loadData() {
    try {
      const [storeRes, progressRes] = await Promise.all([
        fetch(`/api/store?childId=${childId}`),
        fetch(`/api/progress?childId=${childId}`),
      ])
      const storeData    = await storeRes.json()
      const progressData = await progressRes.json()

      setItems(storeData.items || [])
      setPurchases(storeData.purchases || [])
      setXp(progressData.xp || 0)
      if (storeData.park?.placed_items) setPlaced(storeData.park.placed_items)
      if (storeData.park?.park_name)    setParkName(storeData.park.park_name)
    } catch {}
    setLoading(false)
  }

  function showToast(msg: string, type: 'success'|'error'|'info' = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function purchase(item: any) {
    const cost = item.xp_cost || item.xp_price || 0
    if (xp < cost)               { showToast('Not enough XP!', 'error'); return }
    if (purchases.includes(item.id)) { showToast('Already owned!', 'info'); return }

    const res  = await fetch('/api/store', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ childId, itemId: item.id }),
    })
    const data = await res.json()
    if (data.success) {
      setPurchases(p => [...p, item.id])
      setXp(data.newXP)
      showToast(`${item.name_en} purchased! 🎉`)
    } else {
      showToast(data.error || 'Error', 'error')
    }
  }

  function handleCellClick(col: number, row: number) {
    if (!selectedItem) return
    const pd = selectedItem.item_data || {}
    const w = pd.w || 1
    const h = pd.h || 1

    if (col + w > GRID_COLS || row + h > GRID_ROWS) {
      showToast("Doesn't fit here!", 'error'); return
    }

    const occupied = new Set(placedItems.flatMap((p: any) => {
      const ppd = p.item_data || {}
      const cells = []
      for (let r = p.row; r < p.row + (ppd.h||1); r++)
        for (let c = p.col; c < p.col + (ppd.w||1); c++)
          cells.push(`${c},${r}`)
      return cells
    }))

    for (let r = row; r < row + h; r++)
      for (let c = col; c < col + w; c++)
        if (occupied.has(`${c},${r}`)) { showToast('Space taken!', 'error'); return }

    const newPlaced = [...placedItems, { ...selectedItem, col, row, placedId: Date.now() }]
    setPlaced(newPlaced)
    savePark(newPlaced)
    setSelected(null)
    showToast(`${selectedItem.name_en} placed! ✅`)
  }

  function removePlaced(placedId: number) {
    const next = placedItems.filter((p: any) => p.placedId !== placedId)
    setPlaced(next)
    savePark(next)
  }

  async function savePark(placed: any[]) {
    await fetch('/api/store', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ childId, action:'update_park', parkData:{ placed_items:placed, park_name:parkName } }),
    })
  }

  const avatarSets  = items.filter(i => i.category === 'avatar_set')
  const parkItems   = items.filter(i => i.category === 'park_item')
  const totalVisitors = placedItems.reduce((s: number, p: any) => s + (p.item_data?.visitors || 0), 0)

  const toastColors: any = {
    success: { bg:'#F0FDF4', border:'#86EFAC', text:'#166534' },
    error:   { bg:'#FEF2F2', border:'#FCA5A5', text:'#991B1B' },
    info:    { bg:'#EFF6FF', border:'#93C5FD', text:'#1E40AF' },
  }

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#F9FAFB', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'"Nunito",sans-serif' }}>
      <div style={{ textAlign:'center', color:'#6B7280' }}>
        <Sparkles size={40} color="#F0A500" style={{ margin:'0 auto 12px' }}/>
        <div style={{ fontWeight:700 }}>Loading XP Store...</div>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'#F9FAFB', fontFamily:'"Nunito",sans-serif' }}>

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', bottom:'20px', right:'20px', zIndex:9999, padding:'12px 16px', borderRadius:'14px', border:`1px solid ${toastColors[toast.type].border}`, background:toastColors[toast.type].bg, color:toastColors[toast.type].text, fontWeight:700, fontSize:'14px', boxShadow:'0 8px 24px rgba(0,0,0,0.12)', display:'flex', alignItems:'center', gap:'8px', animation:'slideIn 0.2s ease' }}>
          {toast.type === 'success' ? <Check size={16}/> : toast.type === 'error' ? '❌' : <Zap size={16}/>}
          {toast.msg}
        </div>
      )}

      <style>{`@keyframes slideIn { from { transform: translateX(20px); opacity:0; } to { transform:translateX(0); opacity:1; } }`}</style>

      {/* Header */}
      <header style={{ background:'white', borderBottom:'1px solid #F3F4F6', padding:'0 24px', height:'64px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:100, boxShadow:'0 2px 12px rgba(0,0,0,0.04)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          <button onClick={() => token ? window.location.href=`/play/${token}` : window.location.href='/dashboard'}
            style={{ display:'flex', alignItems:'center', gap:'6px', padding:'8px 14px', borderRadius:'10px', border:'1.5px solid #E5E7EB', background:'white', color:'#374151', fontWeight:700, fontSize:'13px', cursor:'pointer' }}>
            <ArrowLeft size={14}/> Back
          </button>
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:'linear-gradient(135deg,#4A7FD4,#F0A500)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Sparkles size={18} color="white"/>
            </div>
            <div>
              <div style={{ fontWeight:900, fontSize:'18px', color:'#111827', letterSpacing:'-0.02em' }}>XP Store</div>
              <div style={{ fontSize:'11px', color:'#9CA3AF', fontWeight:600 }}>Spend your earned XP</div>
            </div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'8px 16px', borderRadius:'50px', background:'#FFFBEB', border:'1.5px solid #F59E0B40' }}>
          <Star size={16} color="#F59E0B" fill="#F59E0B"/>
          <span style={{ fontWeight:900, fontSize:'16px', color:'#B45309' }}>{xp.toLocaleString()}</span>
          <span style={{ fontSize:'12px', fontWeight:700, color:'#92400E' }}>XP</span>
        </div>
      </header>

      {/* Tabs */}
      <div style={{ padding:'20px 24px 0', maxWidth:'1100px', margin:'0 auto' }}>
        <div style={{ display:'inline-flex', background:'#F3F4F6', borderRadius:'14px', padding:'4px', gap:'4px' }}>
          {[
            { id:'avatar', label:'Avatar Builder', icon:Sparkles },
            { id:'park',   label:'Park Builder',   icon:Trees },
          ].map(t => {
            const Icon = t.icon
            return (
              <button key={t.id} onClick={() => setTab(t.id as any)}
                style={{ display:'flex', alignItems:'center', gap:'8px', padding:'10px 20px', borderRadius:'10px', border:'none', background:tab===t.id?'white':'transparent', color:tab===t.id?'#111827':'#6B7280', fontWeight:800, fontSize:'14px', cursor:'pointer', boxShadow:tab===t.id?'0 2px 8px rgba(0,0,0,0.06)':'none', transition:'all 0.2s' }}>
                <Icon size={16}/>
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ maxWidth:'1100px', margin:'0 auto', padding:'20px 24px 40px' }}>

        {/* ── AVATAR BUILDER ── */}
        {tab === 'avatar' && (
          <div style={{ display:'grid', gridTemplateColumns:'320px 1fr', gap:'24px' }}>

            {/* Preview panel */}
            <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
              <div style={{ background:'white', borderRadius:'20px', padding:'28px 20px', textAlign:'center', border:'1px solid #F3F4F6', boxShadow:'0 2px 12px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize:'11px', fontWeight:700, color:'#9CA3AF', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:'20px' }}>YOUR AVATAR</div>

                <FullBodyAvatar animal={animal} outfit={equippedSet} size={160}/>

                {equippedSet && (
                  <div style={{ display:'inline-flex', alignItems:'center', gap:'6px', marginTop:'16px', padding:'4px 12px', borderRadius:'20px', background:'#FFFBEB', border:'1px solid #F59E0B30' }}>
                    <Check size={12} color="#F59E0B"/>
                    <span style={{ fontSize:'12px', fontWeight:700, color:'#B45309' }}>
                      {equippedSet.toUpperCase()} EQUIPPED
                    </span>
                  </div>
                )}
                {!equippedSet && (
                  <div style={{ fontSize:'12px', color:'#9CA3AF', marginTop:'12px' }}>No outfit equipped</div>
                )}
              </div>

              {/* Animal selector */}
              <div style={{ background:'white', borderRadius:'16px', padding:'16px', border:'1px solid #F3F4F6', boxShadow:'0 2px 12px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize:'11px', fontWeight:700, color:'#9CA3AF', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:'12px' }}>BASE ANIMAL</div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px' }}>
                  {Object.entries(ANIMALS).map(([id, a]: any) => (
                    <button key={id} onClick={() => setAnimal(id)}
                      style={{ padding:'10px 6px', borderRadius:'12px', border:`1.5px solid ${animal===id?'#4A7FD4':'#E5E7EB'}`, background:animal===id?'#EFF6FF':'white', cursor:'pointer', textAlign:'center', transition:'all 0.15s' }}>
                      <div style={{ fontSize:'24px', marginBottom:'4px' }}>{a.head}</div>
                      <div style={{ fontSize:'10px', fontWeight:700, color:animal===id?'#4A7FD4':'#6B7280' }}>{a.name}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Shop */}
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'16px' }}>
                <div style={{ width:'4px', height:'20px', borderRadius:'2px', background:'#4A7FD4' }}/>
                <span style={{ fontSize:'13px', fontWeight:800, color:'#374151', letterSpacing:'0.04em', textTransform:'uppercase' }}>Costume Sets</span>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(210px,1fr))', gap:'14px' }}>
                {avatarSets.map(item => {
                  const cost    = item.xp_cost || item.xp_price || 0
                  const owned   = purchases.includes(item.id)
                  const equipped= equippedSet === item.set_name
                  const canAfford = xp >= cost
                  const outfit  = OUTFITS[item.set_name] || {}

                  return (
                    <div key={item.id} style={{ background:'white', border:`1.5px solid ${equipped?'#4A7FD4':'#F3F4F6'}`, borderRadius:'20px', padding:'20px', boxShadow:equipped?'0 8px 28px rgba(74,127,212,0.15)':'0 2px 12px rgba(0,0,0,0.04)', transition:'all 0.2s', position:'relative' }}>

                      {/* Status badge */}
                      <div style={{ position:'absolute', top:'12px', right:'12px' }}>
                        {equipped && (
                          <div style={{ display:'flex', alignItems:'center', gap:'4px', padding:'3px 8px', borderRadius:'20px', background:'#EFF6FF', border:'1px solid #BFDBFE' }}>
                            <Check size={10} color="#3B82F6"/>
                            <span style={{ fontSize:'10px', fontWeight:700, color:'#1D4ED8' }}>Equipped</span>
                          </div>
                        )}
                        {owned && !equipped && (
                          <div style={{ display:'flex', alignItems:'center', gap:'4px', padding:'3px 8px', borderRadius:'20px', background:'#F0FDF4', border:'1px solid #86EFAC' }}>
                            <Package size={10} color="#16A34A"/>
                            <span style={{ fontSize:'10px', fontWeight:700, color:'#15803D' }}>In Storage</span>
                          </div>
                        )}
                      </div>

                      {/* Outfit preview */}
                      <div style={{ fontSize:'32px', marginBottom:'8px' }}>
                        {item.icon_emoji || item.icon}
                      </div>

                      <div style={{ fontWeight:800, fontSize:'15px', color:'#111827', marginBottom:'4px' }}>{item.name_en}</div>
                      <div style={{ fontSize:'12px', color:'#6B7280', marginBottom:'12px', lineHeight:1.5 }}>{item.description_en}</div>

                      {/* Outfit accessories preview */}
                      {outfit && (
                        <div style={{ display:'flex', gap:'6px', marginBottom:'14px', padding:'8px', background:'#F9FAFB', borderRadius:'10px' }}>
                          {[outfit.hat, outfit.top, outfit.bottom, outfit.shoes, outfit.accessory].filter(Boolean).map((item: string, i: number) => (
                            <span key={i} style={{ fontSize:'18px' }}>{item}</span>
                          ))}
                        </div>
                      )}

                      {/* Action button */}
                      {owned ? (
                        <button
                          onClick={() => setEquipped(equipped ? null : item.set_name)}
                          style={{ width:'100%', padding:'10px', borderRadius:'50px', border:`1.5px solid ${equipped?'#E5E7EB':'#4A7FD4'}`, background:equipped?'#F9FAFB':'#4A7FD4', color:equipped?'#6B7280':'white', fontWeight:800, fontSize:'13px', cursor:'pointer', transition:'all 0.15s', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' }}>
                          {equipped ? <><X size={13}/> Unequip</> : <><Sparkles size={13}/> Equip Now</>}
                        </button>
                      ) : (
                        <button
                          onClick={() => purchase(item)}
                          disabled={!canAfford}
                          style={{ width:'100%', padding:'10px', borderRadius:'50px', border:'none', background:canAfford?'linear-gradient(135deg,#F0A500,#E63946)':'#F3F4F6', color:canAfford?'white':'#9CA3AF', fontWeight:800, fontSize:'13px', cursor:canAfford?'pointer':'not-allowed', transition:'all 0.15s', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' }}>
                          <Star size={13} fill={canAfford?'white':'#9CA3AF'} color={canAfford?'white':'#9CA3AF'}/>
                          {canAfford ? `Buy — ${cost} XP` : `Need ${cost - xp} more XP`}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── PARK BUILDER ── */}
        {tab === 'park' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 280px', gap:'24px' }}>

            {/* Park */}
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'16px', flexWrap:'wrap' }}>
                <input value={parkName} onChange={e => setParkName(e.target.value)} onBlur={() => savePark(placedItems)}
                  style={{ fontWeight:900, fontSize:'20px', color:'#111827', background:'transparent', border:'none', outline:'none', borderBottom:'2px solid #E5E7EB', padding:'4px 0', letterSpacing:'-0.02em' }}/>
                <div style={{ marginLeft:'auto', display:'flex', gap:'10px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'6px', padding:'6px 12px', borderRadius:'10px', background:'white', border:'1px solid #F3F4F6', fontSize:'13px', fontWeight:700, color:'#374151' }}>
                    <Users size={14} color="#4A7FD4"/>{totalVisitors.toLocaleString()} visitors
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:'6px', padding:'6px 12px', borderRadius:'10px', background:'white', border:'1px solid #F3F4F6', fontSize:'13px', fontWeight:700, color:'#374151' }}>
                    🎡 {placedItems.length} rides
                  </div>
                </div>
              </div>

              {selectedItem && (
                <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 14px', borderRadius:'12px', background:'#EFF6FF', border:'1px solid #BFDBFE', marginBottom:'12px' }}>
                  <span style={{ fontSize:'20px' }}>{selectedItem.icon_emoji}</span>
                  <span style={{ fontWeight:700, fontSize:'13px', color:'#1D4ED8' }}>Click on the park to place: {selectedItem.name_en}</span>
                  <button onClick={() => setSelected(null)} style={{ marginLeft:'auto', background:'none', border:'none', cursor:'pointer', color:'#6B7280' }}><X size={14}/></button>
                </div>
              )}

              <ParkGrid
                placedItems={placedItems}
                selectedItem={selectedItem}
                onCellClick={handleCellClick}
                onRemove={removePlaced}
              />
              <div style={{ fontSize:'11px', color:'#9CA3AF', marginTop:'8px', textAlign:'center', fontWeight:600 }}>
                Click × to remove · Select an item from the right panel to place it
              </div>
            </div>

            {/* Item sidebar */}
            <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                <div style={{ width:'4px', height:'20px', borderRadius:'2px', background:'#2EC4B6' }}/>
                <span style={{ fontSize:'13px', fontWeight:800, color:'#374151', letterSpacing:'0.04em', textTransform:'uppercase' }}>Attractions</span>
              </div>

              <div style={{ maxHeight:'580px', overflowY:'auto', display:'flex', flexDirection:'column', gap:'8px', paddingRight:'4px' }}>
                {parkItems.map(item => {
                  const owned     = purchases.includes(item.id)
                  const cost      = item.xp_cost || item.xp_price || 0
                  const canAfford = xp >= cost
                  const isSelected= selectedItem?.id === item.id
                  const pd        = item.item_data || {}

                  return (
                    <div key={item.id}
                      onClick={() => owned ? setSelected(isSelected ? null : item) : null}
                      style={{ background:isSelected?'#EFF6FF':owned?'white':'#FAFAFA', border:`1.5px solid ${isSelected?'#4A7FD4':owned?'#E5E7EB':'#F3F4F6'}`, borderRadius:'14px', padding:'12px', cursor:owned?'pointer':'default', transition:'all 0.15s', boxShadow:isSelected?'0 4px 14px rgba(74,127,212,0.15)':'0 1px 4px rgba(0,0,0,0.04)' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                        <span style={{ fontSize:'24px', flexShrink:0 }}>{item.icon_emoji || item.icon}</span>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontWeight:800, fontSize:'13px', color:owned?'#111827':'#9CA3AF', marginBottom:'2px' }}>{item.name_en}</div>
                          <div style={{ fontSize:'11px', color:'#9CA3AF', fontWeight:600 }}>
                            {pd.w||1}×{pd.h||1} tiles · 👥 {pd.visitors||0}/day
                          </div>
                        </div>
                        <div style={{ flexShrink:0 }}>
                          {owned ? (
                            <div style={{ display:'flex', alignItems:'center', gap:'4px', padding:'3px 8px', borderRadius:'20px', background:isSelected?'#DBEAFE':'#F0FDF4', border:`1px solid ${isSelected?'#93C5FD':'#86EFAC'}` }}>
                              {isSelected ? <Zap size={10} color="#3B82F6"/> : <Check size={10} color="#16A34A"/>}
                              <span style={{ fontSize:'10px', fontWeight:700, color:isSelected?'#1D4ED8':'#15803D' }}>
                                {isSelected ? 'Placing...' : 'Owned'}
                              </span>
                            </div>
                          ) : (
                            <button onClick={() => purchase(item)} disabled={!canAfford}
                              style={{ display:'flex', alignItems:'center', gap:'4px', padding:'4px 10px', borderRadius:'20px', border:'none', background:canAfford?'linear-gradient(135deg,#F0A500,#E63946)':'#F3F4F6', color:canAfford?'white':'#9CA3AF', fontWeight:800, fontSize:'11px', cursor:canAfford?'pointer':'not-allowed' }}>
                              <Star size={10} fill={canAfford?'white':'#9CA3AF'} color={canAfford?'white':'#9CA3AF'}/>
                              {cost}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}