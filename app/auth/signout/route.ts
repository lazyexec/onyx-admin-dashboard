import { createClient } from '../../../lib/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

function isSupabaseAuthCookie(name: string) {
  return (
    name.startsWith('sb-') &&
    (name.includes('-auth-token') || name.includes('-code-verifier'))
  );
}

function browserRedirect(location: string, response: NextResponse) {
  response.headers.set('content-type', 'text/html; charset=utf-8');
  response.headers.set('cache-control', 'no-store');
  response.headers.set('refresh', `0;url=${location}`);
  return response;
}

export async function POST() {
  let response = new NextResponse(
    '<!doctype html><meta http-equiv="refresh" content="0;url=/login"><script>window.location.replace("/login")</script><a href="/login">Continue to login</a>',
    { status: 200 },
  );

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

  return browserRedirect('/login', response);
}
