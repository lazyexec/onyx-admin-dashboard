import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-[color:var(--background)] flex flex-col">
      <header className="p-6 flex justify-between items-center border-b border-[color:var(--secondary)]">
        <div className="text-xl font-bold text-[color:var(--text)]">Onyx</div>
        <nav>
          <Link href="/login" className="btn-primary inline-block">
            Dashboard
          </Link>
        </nav>
      </header>

      <section className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-5xl md:text-6xl font-bold max-w-4xl tracking-tight text-[color:var(--text)] mb-6">
          Administer your platform with Onyx
        </h1>
        <p className="text-lg md:text-xl max-w-2xl text-[color:var(--primary)] mb-10">
          A sleek, modern dashboard for managing users, monitoring activity, and sending out real-time promotional notifications.
        </p>

        <div className="flex gap-4">
          <Link href="/login" className="btn-primary text-lg px-8 py-3">
            Go to Dashboard
          </Link>
        </div>
      </section>

      <footer className="p-6 text-center text-sm text-[color:var(--primary)] border-t border-[color:var(--secondary)]">
        &copy; {new Date().getFullYear()} Onyx Admin. All rights reserved.
      </footer>
    </main>
  );
}

