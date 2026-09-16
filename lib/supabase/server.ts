import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  const supabaseUrl = typeof process !== 'undefined' && process.env.VITE_SUPABASE_URL 
    ? process.env.VITE_SUPABASE_URL 
    : import.meta.env.VITE_SUPABASE_URL;

  const supabaseAnonKey = typeof process !== 'undefined' && process.env.VITE_SUPABASE_ANON_KEY 
    ? process.env.VITE_SUPABASE_ANON_KEY 
    : import.meta.env.VITE_SUPABASE_ANON_KEY;

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch (error) {
          // The `set` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: '', ...options })
        } catch (error) {
          // The `delete` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  })
}
