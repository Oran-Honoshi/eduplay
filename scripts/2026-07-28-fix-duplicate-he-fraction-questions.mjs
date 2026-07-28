// One-off data fix, already run against the dev DB on 2026-07-28 — kept as a
// record since this repo has no migrations directory (see lib/supabase.ts).
//
// Root cause: api/questions/generate/route.ts's bilingual/he mode required
// every *_he field to be filled, but a purely symbolic prompt/option (e.g.
// "2/3 + 2/3 = ?") has nothing to translate, so the model echoed the English
// text back verbatim instead of leaving it null. Fixed at the generation
// layer in a separate commit; this script cleans up the 10 rows that batch
// already wrote to the live/approved question pool before that fix existed.
//
// Scoped to the exact affected generation batch (created_at 2026-07-28
// 05:12:17–05:12:23 UTC) rather than the whole table — an earlier, much
// older set of rows (~90, e.g. "9 + 8 = ___") also has prompt_he === prompt_en,
// but that's legitimate (arithmetic reads identically in both languages,
// nothing was mistranslated) and is deliberately left alone here.
//
// Per-field, not per-row: within the batch, 3 rows have a genuine, distinct
// prompt_he (their prompt has a parenthetical "(Hint: ...)"/"whole" — real
// words to translate) and must be preserved; only prompt_he/value_he fields
// that are byte-identical to their _en counterpart get nulled. hint_he is
// never touched — every hint in this batch was a real, distinct translation.
//
// Idempotent: safe to re-run — only nulls a field if it's still a verbatim
// duplicate of its _en counterpart.
//
// Usage: set -a && source .env.local && set +a && node scripts/2026-07-28-fix-duplicate-he-fraction-questions.mjs

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const BATCH_START = '2026-07-28T05:12:17.000000+00:00'
const BATCH_END = '2026-07-28T05:12:23.000000+00:00'

const { data, error } = await supabase
  .from('questions')
  .select('id, prompt_en, prompt_he, options')
  .gte('created_at', BATCH_START)
  .lte('created_at', BATCH_END)

if (error) throw error

let updated = 0
for (const q of data) {
  const newPromptHe = q.prompt_he === q.prompt_en ? null : q.prompt_he
  const newOptions = Array.isArray(q.options)
    ? q.options.map(o => ({ ...o, value_he: o.value_he === o.value_en ? null : o.value_he }))
    : q.options

  const promptChanged = newPromptHe !== q.prompt_he
  const optionsChanged = JSON.stringify(newOptions) !== JSON.stringify(q.options)
  if (!promptChanged && !optionsChanged) continue

  const { error: updateErr } = await supabase
    .from('questions')
    .update({ prompt_he: newPromptHe, options: newOptions })
    .eq('id', q.id)
  if (updateErr) throw updateErr
  updated++
  console.log(`fixed ${q.id}${promptChanged ? ' (prompt_he nulled)' : ''}${optionsChanged ? ' (option value_he nulled)' : ''}`)
}

console.log(`\nScanned ${data.length} rows in batch window, updated ${updated}.`)
