'use client'
import { useEffect } from 'react'

// Registers the minimal offline-page service worker (public/sw.js).
// Production only, so local dev never serves a stale worker.
export default function RegisterSW() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
    navigator.serviceWorker.register('/sw.js').catch(() => { /* non-fatal */ })
  }, [])
  return null
}
