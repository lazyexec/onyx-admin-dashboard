'use client';

import { useState, useEffect } from 'react';
import { createClient } from '../../lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Label } from '../../components/ui/Label';

export default function LoginForm() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get('error')) {
      setError(searchParams.get('error'));
    }
  }, [searchParams]);
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.refresh();
      router.push('/dashboard');
    }
  };

  const handleOAuth = async (provider: 'google' | 'apple') => {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      }
    });

    if (error) {
      setError(error.message);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Button type="button" variant="secondary" onClick={() => handleOAuth('google')}>
          Sign in with Google
        </Button>
        <Button type="button" variant="secondary" onClick={() => handleOAuth('apple')}>
          Sign in with Apple
        </Button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-[color:var(--secondary)]"></span>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-[color:var(--background)] px-2 text-[color:var(--primary)] font-semibold">
            Or continue with email
          </span>
        </div>
      </div>

      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && (
          <div className="p-3 bg-[color:var(--secondary)] text-[color:var(--text)] text-sm border border-[color:var(--primary)]">
            {error}
          </div>
        )}

        <Button type="submit" disabled={loading} className="mt-2">
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>
    </div>
  );
}
