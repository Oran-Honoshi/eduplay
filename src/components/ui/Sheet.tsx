'use client'

// ─── One pop-up pattern for the whole parent area ──────────────
// Icon + title at the top, close in the corner, content, then a wide main
// action at the bottom. On a phone it slides up from the bottom; on larger
// screens it sits in the middle. Escape and the backdrop close it.

import { ReactNode, useEffect } from 'react'
import { X } from 'lucide-react'

export function Sheet({ title, subtitle, icon, onClose, children, footer, wide = false, tone = 'blue' }: {
  title: ReactNode; subtitle?: ReactNode; icon?: ReactNode; onClose: () => void
  children?: ReactNode; footer?: ReactNode; wide?: boolean; tone?: 'blue' | 'red' | 'yellow'
}) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onClose])
  const tint = { blue: 'bg-[#EAF0FF] text-[#2148C0]', red: 'bg-[#FDECE7] text-[#B4432A]', yellow: 'bg-[#FFF4D1] text-[#7A5600]' }[tone]
  return (
    <div role="dialog" aria-modal="true" dir="rtl" className="fixed inset-0 z-[800] bg-[rgba(22,33,62,0.45)] flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
      <div className={`bg-white w-full ${wide ? 'sm:max-w-[560px]' : 'sm:max-w-[460px]'} rounded-t-[28px] sm:rounded-[28px] shadow-[0_24px_60px_rgba(22,33,62,0.25)] max-h-[92vh] flex flex-col animate-[epSheet_.18s_ease-out]`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3.5 px-6 pt-6 pb-3">
          {icon && <span className={`w-12 h-12 rounded-2xl ${tint} flex items-center justify-center shrink-0`}>{icon}</span>}
          <div className="flex-1 min-w-0">
            <h2 className="m-0 text-[22px] font-extrabold text-[#16213E] leading-tight">{title}</h2>
            {subtitle && <div className="text-[15px] text-[#4A5672] mt-0.5">{subtitle}</div>}
          </div>
          <button type="button" aria-label="סגירה" onClick={onClose} className="w-11 h-11 rounded-full bg-[#F4F1EA] text-[#16213E] flex items-center justify-center shrink-0 hover:bg-[#ECE7DC]"><X size={18} /></button>
        </div>
        {children && <div className="px-6 pb-2 overflow-y-auto">{children}</div>}
        {footer && <div className="px-6 pt-3 pb-6 flex flex-wrap gap-2.5">{footer}</div>}
      </div>
    </div>
  )
}

export const sheetPrimary = 'flex-1 min-h-[52px] px-6 rounded-[14px] bg-[#2F5BE3] text-white font-bold text-[16px] hover:bg-[#2148C0] disabled:opacity-50 inline-flex items-center justify-center gap-2'
export const sheetDanger = 'flex-1 min-h-[52px] px-6 rounded-[14px] bg-[#C2361B] text-white font-bold text-[16px] hover:bg-[#A32D15] disabled:opacity-50 inline-flex items-center justify-center gap-2'
export const sheetSecondary = 'min-h-[52px] px-5 rounded-[14px] border-[1.5px] border-[#D9D2C4] bg-white text-[#16213E] font-bold text-[16px] hover:bg-[#F7F4EE] disabled:opacity-50 inline-flex items-center justify-center gap-2'
