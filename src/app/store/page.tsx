'use client'
import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { Globe, Loader2 } from 'lucide-react'

function StoreRedirect() {
  const searchParams = useSearchParams()
  const childId = searchParams.get('childId') || ''
  const token   = searchParams.get('token') || ''

  useEffect(() => {
    // Redirect to the Animal Collection page
    const url = childId
      ? `/cards?childId=${childId}${token ? `&token=${token}` : ''}`
      : token
        ? `/cards?token=${token}`
        : '/cards'
    window.location.replace(url)
  }, [childId, token])

  return (
    <div style={{
      minHeight: '100vh', background: '#F9FAFB',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 16, fontFamily: '"Nunito", system-ui, sans-serif',
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: 18,
        background: 'linear-gradient(135deg,#4A7FD4,#2EC4B6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 8px 24px rgba(74,127,212,0.3)',
      }}>
        <Globe size={30} color="white" />
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontWeight: 900, fontSize: 18, color: '#111827', marginBottom: 4 }}>
          Opening Animal Collection…
        </div>
        <div style={{ fontSize: 13, color: '#9CA3AF' }}>
          The XP Store has moved to your Collection
        </div>
      </div>
      <Loader2 size={20} color="#4A7FD4" style={{ animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default function StorePage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={24} color="#4A7FD4" style={{ animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <StoreRedirect />
    </Suspense>
  )
}
