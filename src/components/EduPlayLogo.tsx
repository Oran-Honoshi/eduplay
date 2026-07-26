import React from 'react'

interface EduPlayLogoProps {
  /** Size of the icon square in px. Default 36 */
  size?: number
  /** Show the "EduPlay" wordmark next to the icon. Default true */
  showName?: boolean
  /** Text size for the wordmark. Default auto-calculated */
  textSize?: number
  /** Light mode: name in dark. Dark mode: name in white */
  darkText?: boolean
  /** Gap between icon and wordmark, in px. Default auto-calculated */
  gap?: number
  /** Icon corner radius, in px. Default auto-calculated */
  iconRadius?: number
  /** Icon box-shadow. Pass 'none' to remove. Default a soft blue shadow */
  iconShadow?: string
  /** Wordmark letter-spacing. Default '-0.02em' */
  letterSpacing?: string
  /** Exact wordmark color, overrides darkText's true/white default */
  textColor?: string
  /** Extra style merged onto the outer wrapper (e.g. centering margins) */
  style?: React.CSSProperties
}

/**
 * EduPlay logo — icon + wordmark.
 * Uses /icons/icon-512.png (your uploaded logo).
 *
 * Usage:
 *   <EduPlayLogo />                    // 36px icon + wordmark
 *   <EduPlayLogo size={48} />          // bigger
 *   <EduPlayLogo showName={false} />   // icon only
 *   <EduPlayLogo darkText={false} />   // white wordmark (for dark/gradient backgrounds)
 */
export default function EduPlayLogo({
  size = 36,
  showName = true,
  textSize,
  darkText = true,
  gap,
  iconRadius,
  iconShadow,
  letterSpacing,
  textColor,
  style,
}: EduPlayLogoProps) {
  const fontSize = textSize ?? Math.round(size * 0.52)
  const radius   = iconRadius ?? Math.round(size * 0.25)

  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      gap: gap ?? Math.round(size * 0.28),
      textDecoration: 'none',
      ...style,
    }}>
      {/* Icon */}
      <img
        src="/icons/icon-512.png"
        alt="EduPlay logo"
        width={size}
        height={size}
        style={{
          borderRadius: radius,
          display: 'block',
          flexShrink: 0,
          boxShadow: iconShadow ?? '0 2px 8px rgba(74,127,212,0.25)',
        }}
      />

      {/* Wordmark */}
      {showName && (
        <span style={{
          fontFamily: '"Nunito", system-ui, sans-serif',
          fontWeight: 900,
          fontSize: fontSize,
          letterSpacing: letterSpacing ?? '-0.02em',
          color: textColor ?? (darkText ? '#111827' : 'white'),
          whiteSpace: 'nowrap',
          lineHeight: 1,
        }}>
          Edu
          <span style={{
            background: 'linear-gradient(135deg, #4A7FD4, #2EC4B6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Play
          </span>
        </span>
      )}
    </div>
  )
}
