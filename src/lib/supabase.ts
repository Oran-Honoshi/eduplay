import { createClient } from '@supabase/supabase-js'

// TODO(infra): schema changes are never tracked in git — there is no
// supabase/migrations directory in this repo and never has been (confirmed
// 2026-07-27: checked git history and the full remote migration list, which goes
// back to 20260407174743_create_reading_passages_tables — ~20 migrations total,
// including every fix referenced below plus today's
// create_question_generations_and_style_pref — none exist as files here). families
// and worksheet_generations even predate the remote migration history itself,
// created directly in the SQL editor before migrations were adopted at all. Not a
// security bug, but a real reproducibility gap: no reviewable diff/history for
// schema changes the way there is for code, and no way to rebuild the dev database
// from git alone. Worth its own pass eventually (e.g. `supabase db pull`/`db diff`
// to backfill a migrations directory from the current remote state, then commit new
// migrations as files going forward) — not urgent, but should not be forgotten.

// FIXED (2026-07-27): subjects, topics, questions, topic_explanations all now have RLS enabled.
// Every anon-reachable read path in the app (browser clients and createServerClient routes) was
// traced first — all four were 100% read-only from anon contexts except one: the `questions`
// upsert in api/questions/route.ts, which has moved to createServiceRoleClient() (matching the
// pattern worksheets/builder/route.ts already used for its own `questions` upsert). Policies:
// public unconditional SELECT on subjects/topics/topic_explanations (no approved-style gating
// field exists on any of them); `questions` SELECT is scoped to `approved = true` rather than
// unconditional — deliberately stricter than the reading_passages precedent, since this table is
// specifically the one about to receive unreviewed AI-generated content and no anon-reachable
// call site ever requests approved=false. No anon write policy on any of the four — service_role
// bypasses RLS as always; app-route session checks remain the actual write gate.
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
