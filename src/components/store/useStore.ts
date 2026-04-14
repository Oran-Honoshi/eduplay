import { useState, useEffect, useCallback } from 'react'
import { AVATAR_ITEMS, PARK_ITEMS, AvatarCategory } from './StoreCatalog'

export interface AvatarOutfit {
  skin:     string
  hair:     string
  top:      string
  bottom:   string
  shoes:    string
  hat:      string | null
  glasses:  string | null
  backpack: string | null
  handheld: string | null
  jacket:   string | null
  dress:    string | null
}

export interface PlacedParkItem {
  placedId: number
  itemId:   string
  col:      number
  row:      number
}

const DEFAULT_OUTFIT: AvatarOutfit = {
  skin:     'skin_medium',
  hair:     'hair_short_black',
  top:      'top_white_tee',
  bottom:   'bottom_jeans',
  shoes:    'shoes_white_sneakers',
  hat:      null,
  glasses:  null,
  backpack: null,
  handheld: null,
  jacket:   null,
  dress:    null,
}

export function useStore(childId: string) {
  const [xp, setXp]                   = useState(0)
  const [owned, setOwned]             = useState<string[]>([])
  const [outfit, setOutfit]           = useState<AvatarOutfit>(DEFAULT_OUTFIT)
  const [placedItems, setPlaced]      = useState<PlacedParkItem[]>([])
  const [parkName, setParkName]       = useState('My Amazing Park')
  const [loading, setLoading]         = useState(true)
  const [toast, setToast]             = useState<{ msg: string; type: 'success'|'error'|'info' } | null>(null)

  useEffect(() => { loadData() }, [childId])

  async function loadData() {
    try {
      const [storeRes, progressRes] = await Promise.all([
        fetch(`/api/store?childId=${childId}`),
        fetch(`/api/progress?childId=${childId}`),
      ])
      const storeData    = await storeRes.json()
      const progressData = await progressRes.json()

      setXp(progressData.xp || 0)
      setOwned(storeData.purchases || [])
      if (storeData.park?.placed_items) setPlaced(storeData.park.placed_items)
      if (storeData.park?.park_name)    setParkName(storeData.park.park_name)

      // Load saved outfit from localStorage
      try {
        const saved = localStorage.getItem(`outfit_${childId}`)
        if (saved) setOutfit({ ...DEFAULT_OUTFIT, ...JSON.parse(saved) })
      } catch {}
    } catch {}
    setLoading(false)
  }

  function showToast(msg: string, type: 'success'|'error'|'info' = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function purchase(itemId: string, cost: number, itemName: string) {
    if (xp < cost)       { showToast('Not enough XP!', 'error'); return false }
    if (owned.includes(itemId)) { showToast('Already owned!', 'info'); return false }

    const res  = await fetch('/api/store', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ childId, itemId }),
    })
    const data = await res.json()
    if (data.success) {
      setOwned(p => [...p, itemId])
      setXp(data.newXP)
      showToast(`${itemName} unlocked! 🎉`)
      return true
    } else {
      showToast(data.error || 'Error', 'error')
      return false
    }
  }

  function equipAvatar(category: AvatarCategory, itemId: string | null) {
    const next = { ...outfit, [category]: itemId }
    setOutfit(next)
    try { localStorage.setItem(`outfit_${childId}`, JSON.stringify(next)) } catch {}
  }

  function isOwned(itemId: string) {
    // Free items (xpCost === 0) are always owned
    const allItems = [...AVATAR_ITEMS, ...PARK_ITEMS]
    const item     = allItems.find(i => i.id === itemId)
    return item?.xpCost === 0 || owned.includes(itemId)
  }

  function isEquipped(category: AvatarCategory, itemId: string) {
    return outfit[category] === itemId
  }

  async function savePark(placed: PlacedParkItem[], name?: string) {
    const pName = name || parkName
    setParkName(pName)
    setPlaced(placed)
    await fetch('/api/store', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        childId,
        action: 'update_park',
        parkData: { placed_items: placed, park_name: pName },
      }),
    })
  }

  const totalVisitors = placedItems.reduce((sum, p) => {
    const item = PARK_ITEMS.find(i => i.id === p.itemId)
    return sum + (item?.visitors || 0)
  }, 0)

  const funScore = placedItems.reduce((sum, p) => {
    const item = PARK_ITEMS.find(i => i.id === p.itemId)
    return sum + (item?.funScore || 0)
  }, 0)

  return {
    xp, owned, outfit, placedItems, parkName, loading, toast,
    purchase, equipAvatar, isOwned, isEquipped, savePark,
    setParkName, showToast, totalVisitors, funScore,
  }
}