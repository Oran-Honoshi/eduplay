'use client'
import React from 'react'
import { renderMathVisualSVG } from '@/lib/mathVisual'

// ─────────────────────────────────────────────────────────────
//  MathVisual — thin client wrapper around the shared SVG-string
//  renderer in src/lib/mathVisual.ts (also used by the worksheet
//  builder route). No independent rendering logic lives here.
// ─────────────────────────────────────────────────────────────

interface MathVisualProps {
  data: any          // visual_data JSON from questions table
  size?: number      // base size in px (default 220)
  color?: string     // primary accent color
  dark?: boolean     // dark mode (for Minecraft theme)
}

const DEFAULT_SIZE = 220

export default function MathVisual({ data, size = DEFAULT_SIZE, color = '#4A7FD4', dark = false }: MathVisualProps) {
  const instanceId = React.useId()

  if (!data?.type) return null

  const svg = renderMathVisualSVG(data, { width: size, height: size, color, dark, instanceId })
  if (!svg) return null

  return <div dangerouslySetInnerHTML={{ __html: svg }} />
}
