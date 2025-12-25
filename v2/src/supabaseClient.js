import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON;

if (!supabaseUrl || !supabaseAnon) {
  console.warn("Supabase ENV missing: VITE_SUPABASE_URL / VITE_SUPABASE_ANON");
}

export const supabase = createClient(supabaseUrl, supabaseAnon);
