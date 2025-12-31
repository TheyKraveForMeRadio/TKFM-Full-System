// js/supabaseClient.js
// Central Supabase client for TKFM v2

import { createClient } from '@supabase/supabase-js'

// Make sure these are set in your Vite env (e.g. .env.local):
// VITE_SUPABASE_URL=...
// VITE_SUPABASE_ANON_KEY=...

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in env.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
