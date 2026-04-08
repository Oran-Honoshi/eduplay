'use client'
import { useState, useEffect } from 'react'

const ANIMALS = [
  { id: 'fox',    emoji: '🦊', name: 'Fox',    nameHe: 'שועל' },
  { id: 'cat',    emoji: '🐱', name: 'Cat',    nameHe: 'חתול' },
  { id: 'bear',   emoji: '🐻', name: 'Bear',   nameHe: 'דוב' },
  { id: 'owl',    emoji: '🦉', name: 'Owl',    nameHe: 'ינשוף' },
  { id: 'rabbit', emoji: '🐰', name: 'Rabbit', nameHe: 'ארנב' },
  { id: 'lion',   emoji: '🦁', name: 'Lion',   nameHe: 'אריה' },
]

const SET_OVERLAYS: any = {
  sports:    { badge:'🏆', accessories:['⚽','👟','⛑️'], bg:'#E63946' },
  medieval:  { badge:'👑', accessories:['⚔️','🛡️','🗡️'], bg:'#6B6B6B' },
  hiphop:    { badge:'🎵', accessories:['🎤','🎧','👒'], bg:'#1A1A2E' },
  wizard:    { badge:'✨', accessories:['🪄','📖','🎩'], bg:'#7B2FBE' },
  astronaut: { badge:'⭐', accessories:['🚀','🪐','🔭'], bg:'#4A7FD4' },
}

const GRID_COLS = 8
const GRID_ROWS = 6

export default function StorePage() {
  const [tab, setTab]               = useState<'avatar'|'park'>('avatar')
  const [items, setItems]           = useState<any[]>([])
  const [purchases, setPurchases]   = useState<string[]>([])
  const [park, setPark]             = useState<any>(null)
  const [child, setChild]           = useState<any>(null)
  const [xp, setXp]                 = useState(0)
  const [selectedAnimal, setAnimal] = useState('fox')
  const [activeSet, setActiveSet]   = useState<string|null>(null)
  const [placedItems, setPlaced]    = useState<any[]>([])
  const [selectedItem, setSelected] = useState<any>(null)
  const [loading, setLoading]       = useState(true)
  const [toast, setToast]           = useState<string|null>(null)
  const [parkName, setParkName]     = useState('My Amazing Park')

  // Get childId from URL
  const childId = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('childId') || '22222222-2222-2222-2222-222222222002'
    : '22222222-2222-2222-2222-222222222002'

  const token = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('token') || ''
    : ''

  useEffect(() => { loadData() }, [])

  async function loadData() {
    try {
      const [storeRes, childRes] = await Promise.all([
        fetch(`/api/store?childId=${childId}`),
        fetch(`/api/progress?childId=${childId}`),
      ])
      const storeData = await storeRes.json()
      const childData = await childRes.json()

      setItems(storeData.items || [])
      setPurchases(storeData.purchases || [])
      setPark(storeData.park)
      setXp(childData.xp || 0)
      if (storeData.park?.placed_items) setPlaced(storeData.park.placed_items)
      if (storeData.park?.park_name) setParkName(storeData.park.park_name)
    } catch {}
    setLoading(false)
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  async function purchaseItem(item: any) {
    const cost = item.xp_cost || item.xp_price || 0
    if (xp < cost) { showToast('❌ Not enough XP!'); return }
    if (purchases.includes(item.id)) { showToast('✅ Already owned!'); return }

    const res = await fetch('/api/store', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ childId, itemId: item.id }),
    })
    const data = await res.json()
    if (data.success) {
      setPurchases(p => [...p, item.id])
      setXp(data.newXP)
      showToast(`🎉 ${item.name_en} purchased!`)
      if (item.category === 'avatar_set') setActiveSet(item.set_name)
    } else {
      showToast(`❌ ${data.error}`)
    }
  }

  function equipSet(setName: string) {
    setActiveSet(activeSet === setName ? null : setName)
  }

  function handleGridClick(col: number, row: number) {
    if (!selectedItem) return
    const itemData = selectedItem.item_data || {}
    const w = itemData.w || 1
    const h = itemData.h || 1

    // Check bounds
    if (col + w > GRID_COLS || row + h > GRID_ROWS) {
      showToast('⚠️ Does not fit here!')
      return
    }

    // Check overlap
    const occupied = new Set(placedItems.flatMap((p: any) => {
      const pd = p.item_data || {}
      const pw = pd.w || 1
      const ph = pd.h || 1
      const cells = []
      for (let r = p.row; r < p.row + ph; r++)
        for (let c = p.col; c < p.col + pw; c++)
          cells.push(`${c},${r}`)
      return cells
    }))

    for (let r = row; r < row + h; r++) {
      for (let c = col; c < col + w; c++) {
        if (occupied.has(`${c},${r}`)) {
          showToast('⚠️ Space already taken!')
          return
        }
      }
    }

    const newItem = { ...selectedItem, col, row, placedId: Date.now() }
    const newPlaced = [...placedItems, newItem]
    setPlaced(newPlaced)
    savePark(newPlaced)
    setSelected(null)
    showToast(`✅ ${selectedItem.name_en} placed!`)
  }

  function removePlaced(placedId: number) {
    const newPlaced = placedItems.filter((p: any) => p.placedId !== placedId)
    setPlaced(newPlaced)
    savePark(newPlaced)
  }

  async function savePark(placed: any[]) {
    await fetch('/api/store', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        childId,
        action: 'update_park',
        parkData: { placed_items: placed, park_name: parkName },
      }),
    })
  }

  function goBack() {
    if (token) window.location.href = `/play/${token}`
    else window.location.href = '/dashboard'
  }

  const avatarSets = items.filter(i => i.category === 'avatar_set')
  const parkItems  = items.filter(i => i.category === 'park_item')
  const ownedParkItems = parkItems.filter(i => purchases.includes(i.id))

  const currentAnimalEmoji = ANIMALS.find(a => a.id === selectedAnimal)?.emoji || '🦊'
  const currentSetOverlay  = activeSet ? SET_OVERLAYS[activeSet] : null

  // Calculate park visitors
  const totalVisitors = placedItems.reduce((sum: number, p: any) => {
    return sum + (p.item_data?.visitors || 0)
  }, 0)

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#1E2D4E,#4A7FD4)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontFamily:'"Nunito",sans-serif', fontSize:'18px' }}>
      Loading XP Store... ⭐
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#0F1729,#1E2D4E)', fontFamily:'"Nunito",sans-serif', color:'white' }}>

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', top:'80px', right:'20px', zIndex:9999, background:'white', color:'#1E2D4E', borderRadius:'12px', padding:'12px 20px', fontWeight:800, fontSize:'14px', boxShadow:'0 8px 32px rgba(0,0,0,0.3)', zIndex:9999 }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <header style={{ background:'rgba(255,255,255,0.05)', backdropFilter:'blur(10px)', borderBottom:'1px solid rgba(255,255,255,0.1)', padding:'0 24px', height:'64px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          <button onClick={goBack} style={{ background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:'10px', padding:'6px 14px', color:'white', fontWeight:700, fontSize:'13px', cursor:'pointer' }}>
            ← Back
          </button>
          <div style={{ fontFamily:'"Nunito",sans-serif', fontWeight:900, fontSize:'20px' }}>
            ⭐ XP Store
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'16px' }}>
          <div style={{ background:'rgba(240,165,0,0.2)', border:'2px solid #F0A500', borderRadius:'50px', padding:'6px 16px', fontWeight:900, fontSize:'16px', color:'#F0A500' }}>
            ⭐ {xp.toLocaleString()} XP
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div style={{ display:'flex', gap:'4px', padding:'20px 24px 0', maxWidth:'1100px', margin:'0 auto' }}>
        {[
          { id:'avatar', label:'🐾 Avatar Builder', labelHe:'בונה אווטאר' },
          { id:'park',   label:'🎡 Park Builder',   labelHe:'בונה פארק' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            style={{ padding:'12px 24px', borderRadius:'12px 12px 0 0', border:'none', background:tab===t.id?'rgba(255,255,255,0.12)':'rgba(255,255,255,0.04)', color:tab===t.id?'white':'rgba(255,255,255,0.5)', fontWeight:800, fontSize:'14px', cursor:'pointer', borderBottom:tab===t.id?'2px solid #F0A500':'2px solid transparent' }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ maxWidth:'1100px', margin:'0 auto', padding:'0 24px 32px', background:'rgba(255,255,255,0.04)', borderRadius:'0 12px 12px 12px', minHeight:'600px' }}>

        {/* ── AVATAR BUILDER ── */}
        {tab === 'avatar' && (
          <div style={{ display:'grid', gridTemplateColumns:'300px 1fr', gap:'24px', padding:'24px 0' }}>

            {/* Avatar preview */}
            <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
              <div style={{ background:'rgba(255,255,255,0.06)', borderRadius:'20px', padding:'24px', textAlign:'center', border:'1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ fontSize:'14px', fontWeight:700, color:'rgba(255,255,255,0.6)', marginBottom:'16px' }}>YOUR AVATAR</div>
                <div style={{ position:'relative', display:'inline-block', marginBottom:'16px' }}>
                  {/* Base animal */}
                  <div style={{ fontSize:'80px', lineHeight:1 }}>{currentAnimalEmoji}</div>
                  {/* Set overlay badge */}
                  {currentSetOverlay && (
                    <>
                      <div style={{ position:'absolute', top:'-8px', right:'-8px', fontSize:'24px' }}>{currentSetOverlay.badge}</div>
                      <div style={{ position:'absolute', bottom:'-8px', left:'50%', transform:'translateX(-50%)', display:'flex', gap:'2px' }}>
                        {currentSetOverlay.accessories.map((a: string, i: number) => (
                          <span key={i} style={{ fontSize:'16px' }}>{a}</span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                {activeSet && (
                  <div style={{ fontSize:'12px', fontWeight:700, color:'#F0A500', marginTop:'8px' }}>
                    {SET_OVERLAYS[activeSet]?.badge} {activeSet.toUpperCase()} SET EQUIPPED
                  </div>
                )}
              </div>

              {/* Animal selector */}
              <div style={{ background:'rgba(255,255,255,0.06)', borderRadius:'16px', padding:'16px', border:'1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ fontSize:'12px', fontWeight:700, color:'rgba(255,255,255,0.6)', marginBottom:'12px' }}>CHOOSE YOUR ANIMAL</div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px' }}>
                  {ANIMALS.map(animal => (
                    <button key={animal.id} onClick={() => setAnimal(animal.id)}
                      style={{ padding:'10px 6px', borderRadius:'10px', border:`2px solid ${selectedAnimal===animal.id?'#F0A500':'rgba(255,255,255,0.1)'}`, background:selectedAnimal===animal.id?'rgba(240,165,0,0.15)':'rgba(255,255,255,0.04)', cursor:'pointer', textAlign:'center' }}>
                      <div style={{ fontSize:'24px' }}>{animal.emoji}</div>
                      <div style={{ fontSize:'10px', fontWeight:700, color:selectedAnimal===animal.id?'#F0A500':'rgba(255,255,255,0.6)', marginTop:'4px' }}>{animal.name}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Set shop */}
            <div>
              <div style={{ fontSize:'16px', fontWeight:900, marginBottom:'16px', padding:'16px 0 0' }}>
                🎨 Costume Sets
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:'14px' }}>
                {avatarSets.map(item => {
                  const owned = purchases.includes(item.id)
                  const cost  = item.xp_cost || item.xp_price || 0
                  const canAfford = xp >= cost
                  const overlay = SET_OVERLAYS[item.set_name] || {}
                  const equipped = activeSet === item.set_name
                  return (
                    <div key={item.id} style={{ background:equipped?`${overlay.bg}30`:'rgba(255,255,255,0.06)', border:`2px solid ${equipped?overlay.bg||'#F0A500':'rgba(255,255,255,0.1)'}`, borderRadius:'16px', padding:'18px', position:'relative', overflow:'hidden' }}>
                      {equipped && <div style={{ position:'absolute', top:'8px', right:'8px', fontSize:'10px', fontWeight:800, background:'#F0A500', color:'#000', padding:'2px 8px', borderRadius:'50px' }}>EQUIPPED</div>}
                      <div style={{ fontSize:'40px', marginBottom:'8px' }}>{item.icon_emoji || item.icon}</div>
                      <div style={{ fontWeight:800, fontSize:'15px', marginBottom:'4px' }}>{item.name_en}</div>
                      <div style={{ fontSize:'12px', color:'rgba(255,255,255,0.6)', marginBottom:'12px' }}>{item.description_en}</div>
                      <div style={{ display:'flex', gap:'6px', marginBottom:'12px' }}>
                        {(overlay.accessories || []).map((a: string, i: number) => (
                          <span key={i} style={{ fontSize:'18px' }}>{a}</span>
                        ))}
                      </div>
                      <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
                        <span style={{ fontWeight:800, color:'#F0A500', fontSize:'14px' }}>⭐ {cost} XP</span>
                        {owned ? (
                          <button onClick={() => equipSet(item.set_name)}
                            style={{ flex:1, padding:'8px', borderRadius:'8px', border:'none', background:equipped?'rgba(255,255,255,0.2)':'#F0A500', color:equipped?'white':'#000', fontWeight:800, fontSize:'12px', cursor:'pointer' }}>
                            {equipped ? '✓ Equipped' : 'Equip'}
                          </button>
                        ) : (
                          <button onClick={() => purchaseItem(item)} disabled={!canAfford}
                            style={{ flex:1, padding:'8px', borderRadius:'8px', border:'none', background:canAfford?'linear-gradient(135deg,#F0A500,#E63946)':'rgba(255,255,255,0.1)', color:'white', fontWeight:800, fontSize:'12px', cursor:canAfford?'pointer':'not-allowed', opacity:canAfford?1:0.5 }}>
                            {canAfford ? '🛒 Buy' : '🔒 Need more XP'}
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── PARK BUILDER ── */}
        {tab === 'park' && (
          <div style={{ padding:'24px 0' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'16px', marginBottom:'20px', flexWrap:'wrap' }}>
              <div>
                <input value={parkName} onChange={e => setParkName(e.target.value)} onBlur={() => savePark(placedItems)}
                  style={{ background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:'10px', padding:'8px 14px', color:'white', fontWeight:800, fontSize:'18px', width:'280px', outline:'none' }}/>
              </div>
              <div style={{ display:'flex', gap:'12px', marginLeft:'auto' }}>
                <div style={{ background:'rgba(255,255,255,0.08)', borderRadius:'10px', padding:'8px 14px', fontSize:'13px', fontWeight:700, color:'rgba(255,255,255,0.8)' }}>
                  👥 {totalVisitors.toLocaleString()} visitors
                </div>
                <div style={{ background:'rgba(255,255,255,0.08)', borderRadius:'10px', padding:'8px 14px', fontSize:'13px', fontWeight:700, color:'rgba(255,255,255,0.8)' }}>
                  🎡 {placedItems.length} attractions
                </div>
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 260px', gap:'20px' }}>

              {/* Park grid */}
              <div>
                <div style={{ fontSize:'12px', fontWeight:700, color:'rgba(255,255,255,0.5)', marginBottom:'8px' }}>
                  {selectedItem ? `📍 Click to place: ${selectedItem.name_en}` : '👆 Select an item from the right to place it'}
                </div>
                <div style={{ display:'grid', gridTemplateColumns:`repeat(${GRID_COLS},1fr)`, gap:'3px', background:'rgba(255,255,255,0.04)', border:'2px solid rgba(255,255,255,0.1)', borderRadius:'16px', padding:'12px', position:'relative' }}>
                  {Array.from({ length: GRID_ROWS }).map((_, row) =>
                    Array.from({ length: GRID_COLS }).map((_, col) => {
                      // Find if a placed item occupies this cell
                      const placedHere = placedItems.find((p: any) => {
                        const pd = p.item_data || {}
                        return col >= p.col && col < p.col + (pd.w||1) &&
                               row >= p.row && row < p.row + (pd.h||1)
                      })
                      const isOrigin = placedHere && placedHere.col === col && placedHere.row === row

                      return (
                        <div key={`${col}-${row}`}
                          onClick={() => placedHere ? null : handleGridClick(col, row)}
                          style={{
                            aspectRatio:'1',
                            borderRadius:'6px',
                            border:`1px solid ${placedHere?'transparent':'rgba(255,255,255,0.06)'}`,
                            background:placedHere?(placedHere.item_data?.color||'#4A7FD4')+'40':'rgba(255,255,255,0.03)',
                            cursor:selectedItem && !placedHere?'crosshair':'default',
                            display:'flex', alignItems:'center', justifyContent:'center',
                            fontSize:'20px',
                            position:'relative',
                            transition:'background 0.1s',
                          }}
                          onMouseEnter={e => { if(selectedItem && !placedHere) (e.currentTarget as HTMLElement).style.background='rgba(240,165,0,0.2)' }}
                          onMouseLeave={e => { if(selectedItem && !placedHere) (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.03)' }}
                        >
                          {isOrigin && (
                            <>
                              <span style={{ fontSize:'20px' }}>{placedHere.icon_emoji || placedHere.icon}</span>
                              <button
                                onClick={e => { e.stopPropagation(); removePlaced(placedHere.placedId) }}
                                style={{ position:'absolute', top:'-4px', right:'-4px', width:'16px', height:'16px', borderRadius:'50%', border:'none', background:'#E63946', color:'white', fontSize:'10px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, lineHeight:1 }}>
                                ×
                              </button>
                            </>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
                <div style={{ fontSize:'11px', color:'rgba(255,255,255,0.3)', marginTop:'8px', textAlign:'center' }}>
                  Click × to remove an item • Click empty cells to place selected item
                </div>
              </div>

              {/* Item shop sidebar */}
              <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                <div style={{ fontSize:'13px', fontWeight:800, color:'rgba(255,255,255,0.7)' }}>🛒 Buy & Place Items</div>

                <div style={{ maxHeight:'500px', overflowY:'auto', display:'flex', flexDirection:'column', gap:'8px' }}>
                  {parkItems.map(item => {
                    const owned = purchases.includes(item.id)
                    const cost  = item.xp_cost || item.xp_price || 0
                    const canAfford = xp >= cost
                    const isSelected = selectedItem?.id === item.id
                    const itemData = item.item_data || {}
                    return (
                      <div key={item.id}
                        onClick={() => owned ? setSelected(isSelected ? null : item) : null}
                        style={{ background:isSelected?'rgba(240,165,0,0.2)':owned?'rgba(255,255,255,0.08)':'rgba(255,255,255,0.04)', border:`2px solid ${isSelected?'#F0A500':owned?'rgba(255,255,255,0.15)':'rgba(255,255,255,0.06)'}`, borderRadius:'12px', padding:'10px 12px', cursor:owned?'pointer':'default', display:'flex', alignItems:'center', gap:'10px' }}>
                        <span style={{ fontSize:'24px', flexShrink:0 }}>{item.icon_emoji || item.icon}</span>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontWeight:800, fontSize:'12px', color:owned?'white':'rgba(255,255,255,0.4)' }}>{item.name_en}</div>
                          <div style={{ fontSize:'10px', color:'rgba(255,255,255,0.4)' }}>
                            {itemData.w||1}×{itemData.h||1} · 👥{itemData.visitors||0}
                          </div>
                        </div>
                        {owned ? (
                          <span style={{ fontSize:'10px', fontWeight:800, color:isSelected?'#F0A500':'#27AE60' }}>
                            {isSelected ? '📍' : '✓'}
                          </span>
                        ) : (
                          <button onClick={() => purchaseItem(item)} disabled={!canAfford}
                            style={{ padding:'4px 8px', borderRadius:'6px', border:'none', background:canAfford?'#F0A500':'rgba(255,255,255,0.1)', color:canAfford?'#000':'rgba(255,255,255,0.3)', fontWeight:800, fontSize:'10px', cursor:canAfford?'pointer':'not-allowed' }}>
                            ⭐{cost}
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>

                {selectedItem && (
                  <button onClick={() => setSelected(null)}
                    style={{ padding:'10px', borderRadius:'10px', border:'2px solid rgba(255,255,255,0.2)', background:'rgba(255,255,255,0.08)', color:'white', fontWeight:700, fontSize:'13px', cursor:'pointer' }}>
                    ✕ Cancel placement
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
