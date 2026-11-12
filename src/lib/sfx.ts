'use client'
// Small sound effects for the kids' question screens, made in the browser
// (Web Audio), so there are no files to load and no licences to track.
//   win()      a short, bright rising chime for a right answer
//   tryAgain() a soft, friendly two-note "hm-hm?" for a wrong answer, never a buzzer
// Sound can be muted from the question screen; the choice is remembered on the device.

const KEY = 'ep_sound'
let ctx: AudioContext | null = null

export function soundOn(): boolean {
  try { return localStorage.getItem(KEY) !== 'off' } catch { return true }
}
export function setSoundOn(on: boolean) {
  try { localStorage.setItem(KEY, on ? 'on' : 'off') } catch { /* private mode */ }
}

function ac(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    const AC = window.AudioContext || (window as any).webkitAudioContext
    if (!AC) return null
    ctx = ctx || new AC()
    if (ctx.state === 'suspended') ctx.resume().catch(() => {})
    return ctx
  } catch { return null }
}

function tone(c: AudioContext, freq: number, start: number, dur: number, vol: number, type: OscillatorType = 'sine', glideTo?: number) {
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = type
  o.frequency.setValueAtTime(freq, start)
  if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, start + dur * 0.8)
  g.gain.setValueAtTime(0.0001, start)
  g.gain.exponentialRampToValueAtTime(vol, start + 0.02)
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur)
  o.connect(g).connect(c.destination)
  o.start(start)
  o.stop(start + dur + 0.05)
}

export function win() {
  if (!soundOn()) return
  const c = ac(); if (!c) return
  const t = c.currentTime + 0.02
  // C major arpeggio up, with a soft sparkle on top
  ;[523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
    tone(c, f, t + i * 0.085, 0.32, 0.16, 'triangle')
    tone(c, f * 2, t + i * 0.085, 0.18, 0.03, 'sine')
  })
  tone(c, 1567.98, t + 0.36, 0.5, 0.05, 'sine')
  tone(c, 2093, t + 0.42, 0.45, 0.035, 'sine')
}

export function tryAgain() {
  if (!soundOn()) return
  const c = ac(); if (!c) return
  const t = c.currentTime + 0.02
  // two gentle low notes, the second rising, like a curious "hm-hm?"
  tone(c, 392, t, 0.22, 0.11, 'sine')
  tone(c, 440, t + 0.2, 0.32, 0.11, 'sine', 523.25)
}
