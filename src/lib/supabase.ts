import { createClient } from '@supabase/supabase-js'

// TODO(security): 4 tables still have Row Level Security disabled (Supabase security advisor,
// checked 2026-07-24, reconfirmed 2026-07-26): subjects, topics, questions, topic_explanations.
// (questions_options_backup_20260725 was a 5th — dropped 2026-07-26, no longer applies.) Anyone
// holding the anon key — i.e. every client made via createServerClient/createBrowserClient below
// — can read AND write every row in these tables directly against PostgREST, completely bypassing
// app-route session checks. All four are shared/global content (curriculum catalog, question
// bank, booklet explanations) — no per-child or per-family data in any of them. Anon READ is
// already the intended behavior. Anon WRITE is a content-integrity risk — e.g. rewriting
// `questions.options[].isCorrect` to cheat (confirmed 2026-07-26: that flag, not
// `correct_answer`, is the only thing the actual lesson grading path in src/app/lesson/client.tsx
// checks) — but not a privacy leak. Lower priority than the two tables below were; needs its own
// pass with policies scoped appropriately (or just read-only anon policies + service-role writes)
// before enabling.
//
// FIXED (2026-07-26): child_passage_history and child_bonus_exercises — these held real
// per-child data (passage completion + score; bonus-exercise score + tokens_earned) with no
// DB-level ownership check, so anyone with the anon key could read/tamper with ANY child's rows
// directly, independent of app-route session logic. Confirmed live via unauthenticated PostgREST
// insert before the fix. RLS is now enabled on both with no anon/authenticated policies (default
// deny; service_role still bypasses as always). child_passage_history's one read path
// (api/passages/route.ts) was repointed to createServiceRoleClient(), keeping the existing
// authorizeChildAccess() ownership check as the actual gate — the app uses its own JWT cookie
// sessions rather than Supabase Auth, so there's no auth.uid() to write a real RLS policy
// against. child_bonus_exercises isn't wired into any app route, so no code change was needed
// there, just closing the direct DB exposure.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export function createServerClient() {
  return createClient(supabaseUrl, supabaseKey)
}

export function createBrowserClient() {
  return createClient(supabaseUrl, supabaseKey)
}

export function createServiceRoleClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
