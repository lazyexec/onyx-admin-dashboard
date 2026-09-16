import { createClient } from "../../lib/supabase/server";
import { getCurrentAdminUser } from "../../lib/auth/admin";
import DashboardTabs from "./DashboardTabs";
import { getDashboardStats } from "../actions/stats";
import { Button } from "../../components/ui/Button";

function LoginRedirect() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[color:var(--background)] p-4">
      <script dangerouslySetInnerHTML={{ __html: "window.location.replace('/login');" }} />
      <a href="/login" className="text-sm font-semibold text-[color:var(--accent)]">
        Continue to login
      </a>
    </main>
  );
}

function AccessDenied() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-[color:var(--background)] p-4">
      <div className="w-full max-w-md border border-[color:var(--secondary)] bg-[color:var(--background)] p-8 text-center">
        <h1 className="text-2xl font-bold text-[color:var(--text)]">Admin access required</h1>
        <p className="mt-3 text-sm text-[color:var(--primary)]">
          Your account is signed in, but it does not have the admin role.
        </p>
        <form action="/auth/signout" method="post" className="mt-6">
          <Button type="submit" variant="secondary" className="w-full">
            Logout
          </Button>
        </form>
      </div>
    </main>
  );
}

export default async function DashboardPage() {
  let hasSession = false;
  let user = null;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.error("Dashboard getUser error:", error.message);
    }
    hasSession = Boolean(data?.user);
    if (hasSession) {
      user = await getCurrentAdminUser();
    }
  } catch (err: any) {
    console.error("Dashboard server error:", err);
  }

  if (!hasSession) {
    return <LoginRedirect />;
  }

  if (!user) {
    return <AccessDenied />;
  }

  return (
    <main className="min-h-screen bg-[color:var(--background)] p-8">
      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        <DashboardTabs user={user} stats={await getDashboardStats()} />
      </div>
    </main>
  );
}
