'use client'
// Shared parent-portal modal shell. Extracted from the bulk-approve review
// modal (src/app/questions/page.tsx) so destructive/informational confirms
// stop reaching for the unstylable native confirm() — see
// docs/design-handoff for why modals were left out of the original redesign
// pass and needed their own token decision.
import { ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { PARENT_COLORS } from '@/lib/parentTheme'

export type ParentModalVariant = 'info' | 'danger' | 'review'

const VARIANT_TOKENS: Record<ParentModalVariant, { eyebrowColor: string; confirmBg: string; confirmHoverBg: string }> = {
  info:   { eyebrowColor: PARENT_COLORS.primary, confirmBg: PARENT_COLORS.primary, confirmHoverBg: PARENT_COLORS.primaryHover },
  danger: { eyebrowColor: PARENT_COLORS.danger,  confirmBg: PARENT_COLORS.danger,  confirmHoverBg: '#A32D15' },
  review: { eyebrowColor: PARENT_COLORS.accent,  confirmBg: PARENT_COLORS.primary, confirmHoverBg: PARENT_COLORS.primaryHover },
}

export function ParentModal({
  variant, eyebrowText, badge, title, description, onCancel, children,
}: {
  variant: ParentModalVariant
  eyebrowText: string
  badge?: ReactNode
  title: string
  description?: string
  onCancel: () => void
  children: ReactNode
}) {
  const tokens = VARIANT_TOKENS[variant]
  return (
    <div dir="rtl" className="fixed inset-0 z-[999] bg-[rgba(22,33,62,0.45)] flex items-end sm:items-center justify-center sm:p-5" onClick={onCancel}>
      <div className="bg-white rounded-t-[28px] sm:rounded-[28px] shadow-[0_24px_60px_rgba(22,33,62,0.25)] w-full sm:max-w-[460px] max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="px-6 pt-6 pb-3.5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[13px] font-bold" style={{ color: tokens.eyebrowColor }}>
              {eyebrowText}
            </span>
            {badge}
          </div>
          <h3 className="font-extrabold text-[22px] text-[#16213E] m-0 mb-1">{title}</h3>
          {description && <p className="text-[15px] text-[#4A5672] m-0">{description}</p>}
        </div>
        {children}
      </div>
    </div>
  )
}

// Standard footer: primary/danger confirm + neutral cancel, both full-width.
// Used directly by the info/danger confirms; the review variant (bulk
// approve) builds its own scroll-gated footer inline since its disabled
// condition doesn't fit this shape.
export function ParentModalFooter({
  variant, confirmLabel, confirmingLabel, onConfirm, onCancel, confirming, disabled,
}: {
  variant: ParentModalVariant
  confirmLabel: string
  confirmingLabel?: string
  onConfirm: () => void
  onCancel: () => void
  confirming?: boolean
  disabled?: boolean
}) {
  const tokens = VARIANT_TOKENS[variant]
  return (
    <div className="px-6 pt-3 pb-6 flex gap-2.5">
      <button onClick={onConfirm} disabled={confirming || disabled}
        style={{ background: tokens.confirmBg }}
        className="flex-1 flex items-center justify-center gap-1.5 min-h-[52px] rounded-[14px] disabled:opacity-40 text-white font-bold text-[16px] transition-opacity">
        {confirming && <Loader2 size={14} className="animate-spin" />}
        {confirming ? (confirmingLabel || confirmLabel) : confirmLabel}
      </button>
      <button onClick={onCancel} disabled={confirming}
        className="min-h-[52px] px-5 rounded-[14px] border-[1.5px] border-[#D9D2C4] text-[#16213E] font-bold text-[16px] disabled:opacity-40">
        ביטול
      </button>
    </div>
  )
}
