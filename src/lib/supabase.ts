import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jbbkwomcyvuzdtagogut.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpiYmt3b21jeXZ1emR0YWdvZ3V0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0OTUyMzYsImV4cCI6MjA5MTA3MTIzNn0.lKzQTIugcbmI4kua6Y4PSaLXyqCYKxxmfQpArX3vvG4'

export function createServerClient() {
  return createClient(supabaseUrl, supabaseKey)
}

export function createBrowserClient() {
  return createClient(supabaseUrl, supabaseKey)
}
