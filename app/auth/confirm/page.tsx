import { Suspense } from 'react';
import AuthConfirmClient from './AuthConfirmClient';

export const metadata = {
  title: 'Signing in… - Onyx Admin Dashboard',
};

export default function AuthConfirmPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center bg-[color:var(--background)] p-4">
        <p className="text-sm text-[color:var(--primary)]">Signing you in…</p>
      </main>
    }>
      <AuthConfirmClient />
    </Suspense>
  );
}
