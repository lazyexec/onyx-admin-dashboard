import { createClient } from '../../../lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  // Sanitize redirect target to prevent open redirect attacks
  const safeNext = (next.startsWith('/') && !next.startsWith('//')) ? next : '/dashboard';

  try {
    if (code) {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(`${origin}${safeNext}`);
      }
      console.error("Auth code exchange failed:", error.message);
    }
    return NextResponse.redirect(`${origin}/login?error=Authentication%20failed`);
  } catch (error: any) {
    console.error("Auth callback error:", error);
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error?.message || "Internal Server Error")}`);
  }
}
