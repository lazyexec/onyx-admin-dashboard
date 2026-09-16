import { createClient } from '../../../lib/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

function isSupabaseAuthCookie(name: string) {
  return (
    name.startsWith('sb-') &&
    (name.includes('-auth-token') || name.includes('-code-verifier'))
  );
}

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL('/login', request.url), { status: 302 });

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout signOut error:', error.message);
    }
  } catch (err) {
    console.error('Logout server error:', err);
  }

  const cookieStore = await cookies();
  for (const cookie of cookieStore.getAll()) {
    if (isSupabaseAuthCookie(cookie.name)) {
      response.cookies.delete(cookie.name);
    }
  }

  return response;
}
