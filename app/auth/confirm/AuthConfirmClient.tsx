'use client';

import { useEffect, useState } from 'react';
import { createClient } from '../../../lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AuthConfirmClient() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');

    let cancelled = false;

    (async () => {
      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (cancelled) return;

          if (error) {
            const { data } = await supabase.auth.getUser();
            if (data?.user) {
              router.replace('/dashboard');
              return;
            }
            setError(error.message);
            return;
          }
        }

        const { data, error: userError } = await supabase.auth.getUser();
        if (cancelled) return;

        if (data?.user) {
          router.replace('/dashboard');
          return;
        }

        setError(userError?.message || 'No signed-in user found. Please try again.');
      } catch (err: any) {
        if (cancelled) return;
        setError(err?.message || 'Sign-in failed. Please try again.');
      }
    })();

    return () => { cancelled = true; };
  }, [searchParams, supabase, router]);

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[color:var(--background)] p-4">
        <div className="w-full max-w-md bg-[color:var(--background)] border border-[color:var(--secondary)] shadow-sm p-8 flex flex-col gap-6 text-center">
          <h1 className="text-2xl font-bold text-[color:var(--text)]">Sign-in failed</h1>
          <p className="text-sm text-[color:var(--primary)]">{error}</p>
          <a href="/login" className="btn-primary inline-block px-6 py-2">
            Back to sign in
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[color:var(--background)] p-4">
      <p className="text-sm text-[color:var(--primary)]">Signing you in…</p>
    </main>
  );
}
