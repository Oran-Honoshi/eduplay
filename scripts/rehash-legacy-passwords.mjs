// One-off migration tool, not part of any regular process. Kept around as cheap
// insurance in case a plaintext row ever gets reintroduced (e.g. a future seed script).
// Hashes any remaining plaintext passwords in `families.parent_password` and
// `family_parents.password`. Safe to re-run — rows already in bcrypt format are skipped.
//
// Usage:
//   set -a && source .env.local && set +a && node scripts/rehash-legacy-passwords.mjs

import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import { isBcryptHash } from '../src/lib/passwordHash.mjs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function rehashTable(table, passwordColumn) {
  const { data, error } = await supabase.from(table).select(`id, ${passwordColumn}`)
  if (error) throw error

  for (const row of data) {
    const stored = row[passwordColumn]
    if (!stored || isBcryptHash(stored)) continue

    const hash = await bcrypt.hash(stored, 10)
    const { error: updateError } = await supabase
      .from(table)
      .update({ [passwordColumn]: hash })
      .eq('id', row.id)

    if (updateError) throw updateError
    console.log(`${table} ${row.id}: rehashed`)
  }
}

await rehashTable('families', 'parent_password')
await rehashTable('family_parents', 'password')

console.log('Done.')
