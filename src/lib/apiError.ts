// Shared handling for the one error shape every requireParentOnlySession()-gated
// route returns on auth failure: { error: 'Unauthorized' | 'Forbidden' }, status
// 401 or 403. A bare 403 most commonly means a still-valid child-session cookie
// with no valid parent-session cookie (session.ts's requireParentOnlySession) —
// from a parent's point of view that's an expired/missing login, not a real
// permissions failure, so both statuses get the same friendly copy rather than
// echoing "Forbidden" verbatim.
export const SESSION_EXPIRED_MESSAGE = 'החיבור פג — צריך להתחבר שוב.'

export function isSessionExpiredStatus(status: number): boolean {
  return status === 401 || status === 403
}

// Call with the fetch Response and the parsed body's error string (or a
// fallback) to get the text a call site should actually display.
export function apiErrorText(status: number, rawError: string | undefined, fallback: string): string {
  return isSessionExpiredStatus(status) ? SESSION_EXPIRED_MESSAGE : (rawError || fallback)
}
