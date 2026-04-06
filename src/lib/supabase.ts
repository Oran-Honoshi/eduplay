import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export function createServerClient() {
  return createClient(supabaseUrl, supabaseKey)
}

export function createBrowserClient() {
  return createClient(supabaseUrl, supabaseKey)
}
