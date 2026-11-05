'use client'

// Pip the owl — EduPlay's guide character.
// Images live in /public/pip/<theme>/<pose>.webp (384px, transparent).
// Every theme has wave / thumbs / celebrate; the calmer poses
// (think / read / sleep) exist only in the plain outfit and are used for all themes.

export type PipPose = 'wave' | 'thumbs' | 'celebrate' | 'think' | 'read' | 'sleep'

const THEMED: Record<string, PipPose[]> = {
  plain: ['wave', 'thumbs', 'celebrate', 'think', 'read', 'sleep'],
  minecraft: ['wave', 'thumbs', 'celebrate'],
  princesses: ['wave', 'thumbs', 'celebrate'],
  sports: ['wave', 'thumbs', 'celebrate'],
}

export function pipSrc(theme: string | undefined, pose: PipPose): string {
  const t = theme && THEMED[theme]?.includes(pose) ? theme : 'plain'
  return `/pip/${t}/${pose}.webp`
}

const ALT: Record<PipPose, [string, string]> = {
  wave: ['Pip the owl waving', 'פיפ הינשוף מנופף לשלום'],
  thumbs: ['Pip the owl giving a thumbs up', 'פיפ הינשוף מראה אגודל'],
  celebrate: ['Pip the owl celebrating', 'פיפ הינשוף חוגג'],
  think: ['Pip the owl thinking', 'פיפ הינשוף חושב'],
  read: ['Pip the owl reading aloud', 'פיפ הינשוף מקריא'],
  sleep: ['Pip the owl resting', 'פיפ הינשוף נח'],
}

export function Pip({
  theme, pose = 'wave', size = 96, he = false, className, style, bounce = false,
}: {
  theme?: string
  pose?: PipPose
  size?: number
  he?: boolean
  className?: string
  style?: React.CSSProperties
  bounce?: boolean
}) {
  return (
    <>
      {bounce && <style>{`@keyframes pipPop{0%{transform:scale(.6) translateY(12px);opacity:0}60%{transform:scale(1.06)}100%{transform:scale(1);opacity:1}}`}</style>}
      <img
        key={pose}
        src={pipSrc(theme, pose)}
        alt={ALT[pose][he ? 1 : 0]}
        width={size}
        height={size}
        draggable={false}
        className={className}
        style={{
          width: size, height: size, objectFit: 'contain', userSelect: 'none', display: 'block',
          ...(bounce ? { animation: 'pipPop .45s ease-out' } : null),
          ...style,
        }}
      />
    </>
  )
}
