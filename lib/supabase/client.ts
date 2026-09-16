import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = typeof process !== 'undefined' && process.env.VITE_SUPABASE_URL 
    ? process.env.VITE_SUPABASE_URL 
    : import.meta.env.VITE_SUPABASE_URL;

  const supabaseAnonKey = typeof process !== 'undefined' && process.env.VITE_SUPABASE_ANON_KEY 
    ? process.env.VITE_SUPABASE_ANON_KEY 
    : import.meta.env.VITE_SUPABASE_ANON_KEY;

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
