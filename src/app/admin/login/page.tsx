'use client';

// Admin dashboard sign-in (spec 005, US1 / task T016). Email + password via
// Supabase Auth. No public sign-up — accounts are provisioned manually.
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      // Generic message — never reveal whether the email exists (US1 scenario 4).
      setError('Invalid email or password.');
      setLoading(false);
      return;
    }

    const next = searchParams.get('next');
    const destination = next && next.startsWith('/admin') ? next : '/admin';
    router.replace(destination);
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-theme-bg px-space-4">
      <div className="w-full max-w-sm rounded-md border border-theme-border bg-theme-bg-2 p-space-6">
        <h1 className="text-h5 font-bold text-theme-text">Worship Wheel</h1>
        <p className="mt-space-1 text-text-sm text-theme-text-muted">
          Admin dashboard — sign in to continue.
        </p>

        <form onSubmit={handleSubmit} className="mt-space-5 flex flex-col gap-space-4">
          <label className="flex flex-col gap-space-2">
            <span className="text-text-sm font-medium text-theme-text">Email</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-sm border border-theme-border bg-theme-bg px-space-3 py-space-2 text-text-base text-theme-text outline-none focus:border-accent-500"
            />
          </label>

          <label className="flex flex-col gap-space-2">
            <span className="text-text-sm font-medium text-theme-text">Password</span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-sm border border-theme-border bg-theme-bg px-space-3 py-space-2 text-text-base text-theme-text outline-none focus:border-accent-500"
            />
          </label>

          {error && (
            <p role="alert" className="text-text-sm text-error-500">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="cursor-pointer rounded-sm bg-accent-500 px-space-4 py-space-3 text-text-base font-bold text-neutral-950 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function AdminLoginPage() {
  // useSearchParams requires a Suspense boundary in the App Router.
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
