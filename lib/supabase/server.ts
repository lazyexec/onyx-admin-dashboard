import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

export async function createAdminClient() {
  const serviceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing');
  }

  // We don't pass user cookies here because the service role key bypasses RLS entirely
  // and acts as the supreme admin. It should be used for admin tasks, not user impersonation.
  return createServerClient(
    import.meta.env.VITE_SUPABASE_URL,
    serviceKey,
    {
      cookies: {
        getAll() { return []; },
        setAll() {},
      },
    }
  );
}
