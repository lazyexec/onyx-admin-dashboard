import { createClient } from '../../lib/supabase/server';
import { redirect } from 'next/navigation';
import DashboardTabs from './DashboardTabs';
import { Button } from '../../components/ui/Button';

export default async function DashboardPage() {
  let user = null;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.error("Dashboard getUser error:", error.message);
    }
    user = data?.user ?? null;
  } catch (err: any) {
    console.error("Dashboard server error:", err);
  }

  if (!user) {
    redirect('/login');
  }

  return (
    <main className="min-h-screen bg-[color:var(--background)] p-8">
      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        <header className="flex justify-between items-center pb-4 border-b border-[color:var(--secondary)]">
          <h1 className="text-2xl font-bold text-[color:var(--text)]">Onyx Admin</h1>
          <form action="/auth/signout" method="post">
            <Button type="submit" variant="secondary" className="text-sm">
              Logout
            </Button>
          </form>
        </header>

        <DashboardTabs user={user} />
      </div>
    </main>
  );
}
