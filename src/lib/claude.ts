import 'server-only'

// Small shared helper for one-shot JSON answers from Claude.
export const CLAUDE_MODEL = 'claude-sonnet-5'

export async function askClaudeJSON<T = any>(opts: {
  system: string
  content: any[] | string
  maxTokens?: number
}): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY!, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: CLAUDE_MODEL, max_tokens: opts.maxTokens ?? 4000, system: opts.system,
      messages: [{ role: 'user', content: opts.content }],
    }),
  })
  if (!res.ok) return { ok: false, error: `AI request failed (${res.status})` }
  const body = await res.json()
  const text: string = (body.content || []).filter((b: any) => b.type === 'text').map((b: any) => b.text).join('')
  const start = text.search(/[[{]/)
  const end = Math.max(text.lastIndexOf('}'), text.lastIndexOf(']'))
  if (start < 0 || end < start) return { ok: false, error: 'AI returned no JSON' }
  const raw = text.slice(start, end + 1)
  // a plain " between Hebrew letters (מיצ"ב) is an abbreviation mark — make it ״ and try again
  for (const candidate of [raw, raw.replace(/([\u0590-\u05FF])"([\u0590-\u05FF])/g, '$1״$2')]) {
    try { return { ok: true, data: JSON.parse(candidate) } } catch {}
  }
  return { ok: false, error: 'AI returned invalid JSON' }
}

// Plain-text answer (no JSON), for free text such as a page description,
// where quotes inside Hebrew abbreviations (מיצ"ב, ת"א) would break JSON.
export async function askClaudeText(opts: { system: string; content: any[] | string; maxTokens?: number }): Promise<string | null> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY!, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: CLAUDE_MODEL, max_tokens: opts.maxTokens ?? 1500, system: opts.system, messages: [{ role: 'user', content: opts.content }] }),
  })
  if (!res.ok) return null
  const body = await res.json()
  const text: string = (body.content || []).filter((b: any) => b.type === 'text').map((b: any) => b.text).join('').trim()
  return text || null
}
