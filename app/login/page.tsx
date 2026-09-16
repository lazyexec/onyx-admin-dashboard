import LoginForm from './LoginForm';
import { createClient } from '../../lib/supabase/server';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Login - Onyx Admin Dashboard',
};

export default async function LoginPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    redirect('/dashboard');
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[color:var(--background)] p-4">
      <div className="w-full max-w-md bg-[color:var(--background)] border border-[color:var(--secondary)] shadow-sm p-8 flex flex-col gap-8">
        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-3xl font-bold text-[color:var(--text)]">Onyx Admin</h1>
          <p className="text-[color:var(--primary)] text-sm">Sign in to access the dashboard</p>
        </div>
        
        <LoginForm />
      </div>
    </main>
  );
}
