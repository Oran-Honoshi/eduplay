'use client'
import { SESSION_EXPIRED_MESSAGE } from '@/lib/apiError'

// Drop-in replacement for rendering a plain error string — every call site
// already has one (setResult/setError/etc). Call sites prefix the shared
// session-expired sentinel with their own icon/wrapper text (e.g. "❌ ..."),
// so this matches by substring rather than exact equality — when found,
// renders an actual clickable /login link instead of leaving the parent to
// notice the words and navigate there themselves.
export default function ApiErrorText({ text, className }: { text: string; className?: string }) {
  if (text.includes(SESSION_EXPIRED_MESSAGE)) {
    const prefix = text.slice(0, text.indexOf(SESSION_EXPIRED_MESSAGE))
    return (
      <span className={className}>
        {prefix}{SESSION_EXPIRED_MESSAGE}{' '}
        <a href="/login" className="underline font-bold">להתחברות</a>
      </span>
    )
  }
  return <span className={className}>{text}</span>
}
