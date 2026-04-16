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
}: EduPlayLogoProps) {
  const fontSize = textSize ?? Math.round(size * 0.52)
  const radius   = Math.round(size * 0.25)

  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      gap: Math.round(size * 0.28),
      textDecoration: 'none',
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
          boxShadow: '0 2px 8px rgba(74,127,212,0.25)',
        }}
      />

      {/* Wordmark */}
      {showName && (
        <span style={{
          fontFamily: '"Nunito", system-ui, sans-serif',
          fontWeight: 900,
          fontSize: fontSize,
          letterSpacing: '-0.02em',
          color: darkText ? '#111827' : 'white',
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
