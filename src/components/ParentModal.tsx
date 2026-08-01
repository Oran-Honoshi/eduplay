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
  danger: { eyebrowColor: PARENT_COLORS.danger,  confirmBg: PARENT_COLORS.danger,  confirmHoverBg: '#B91C1C' },
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
    <div className="fixed inset-0 z-[999] bg-black/55 flex items-center justify-center p-5" onClick={onCancel}>
      <div className="bg-white rounded-[20px] shadow-[0_24px_60px_rgba(15,30,26,0.22)] w-full max-w-[460px] max-h-[520px] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="px-6 pt-[22px] pb-3.5 border-b border-[#e9e6dd]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10.5px] font-bold uppercase tracking-wide" style={{ color: tokens.eyebrowColor }}>
              {eyebrowText}
            </span>
            {badge}
          </div>
          <h3 className="font-extrabold text-[16px] text-[#1f2a28] m-0 mb-1">{title}</h3>
          {description && <p className="text-[12.5px] text-[#9aa6a3] m-0">{description}</p>}
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
    <div className="px-6 pt-4 pb-[22px] border-t border-[#e9e6dd] flex gap-2.5">
      <button onClick={onConfirm} disabled={confirming || disabled}
        style={{ background: tokens.confirmBg }}
        className="flex-1 flex items-center justify-center gap-1.5 py-[11px] rounded-full disabled:opacity-40 text-white font-extrabold text-[13px] transition-opacity">
        {confirming && <Loader2 size={14} className="animate-spin" />}
        {confirming ? (confirmingLabel || confirmLabel) : confirmLabel}
      </button>
      <button onClick={onCancel} disabled={confirming}
        className="flex-1 py-[11px] rounded-full border border-[rgba(15,118,110,.14)] text-[#7a8f8b] font-extrabold text-[13px] disabled:opacity-40">
        Cancel
      </button>
    </div>
  )
}
