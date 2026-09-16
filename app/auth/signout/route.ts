import { createClient } from '../../../lib/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { env } from 'cloudflare:workers';

function isSupabaseAuthCookie(name: string) {
  return (
    name.startsWith('sb-') &&
    (name.includes('-auth-token') || name.includes('-code-verifier'))
  );
}

function getSupabaseProjectRef() {
  const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  return url ? new URL(url).hostname.split('.')[0] : null;
}

function clearCookie(response: NextResponse, name: string) {
  response.cookies.set(name, '', {
    path: '/',
    maxAge: 0,
    sameSite: 'lax',
    secure: true,
  });
}

function browserRedirect(location: string, response: NextResponse) {
  response.headers.set('content-type', 'text/html; charset=utf-8');
  response.headers.set('cache-control', 'no-store');
  response.headers.set('refresh', `0;url=${location}`);
  return response;
}

async function signOut() {
  const response = new NextResponse(
    `<!doctype html>
<meta http-equiv="refresh" content="0;url=/login">
<script>
try {
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith('sb-') || key.includes('supabase')) localStorage.removeItem(key);
  }
  for (const key of Object.keys(sessionStorage)) {
    if (key.startsWith('sb-') || key.includes('supabase')) sessionStorage.removeItem(key);
  }
} catch {}
window.location.replace('/login');
</script>
<a href="/login">Continue to login</a>`,
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
      clearCookie(response, cookie.name);
    }
  }
  const projectRef = getSupabaseProjectRef();
  if (projectRef) {
    const authCookieBase = `sb-${projectRef}-auth-token`;
    clearCookie(response, authCookieBase);
    clearCookie(response, `${authCookieBase}.0`);
    clearCookie(response, `${authCookieBase}.1`);
    clearCookie(response, `${authCookieBase}-code-verifier`);
  }

  return browserRedirect('/login', response);
}

export async function GET() {
  return signOut();
}

export async function POST() {
  return signOut();
}
