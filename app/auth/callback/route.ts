import { NextResponse } from 'next/server';

// Redirect to a client-side page that will handle the PKCE code exchange.
// Supabase PKCE stores the code_verifier in a browser cookie that's only
// accessible client-side. Server-side exchangeCodeForSession on Cloudflare
// Workers can't reliably read it, causing Worker crashes.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error_description') || url.searchParams.get('error');

  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error)}`, url.origin)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/login?error=No%20authorization%20code%20received', url.origin)
    );
  }

  // Forward the code to the client-side callback page
  return NextResponse.redirect(
    new URL(`/auth/confirm?code=${encodeURIComponent(code)}`, url.origin)
  );
}
