// Authenticated dashboard shell (spec 005, US1 / task T017).
// The `(dashboard)` route group keeps this layout off the /admin/login page
// while leaving URLs unchanged (/admin, /admin/acquisition, ...).
import { redirect } from 'next/navigation';
import { getAdminUser } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { AdminNav } from '@/components/admin/AdminNav';

async function signOut() {
  'use server';
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect('/admin/login');
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Middleware already gates /admin/*; this is defence in depth.
  const user = await getAdminUser();
  if (!user) redirect('/admin/login');

  return (
    <div className="min-h-screen bg-theme-bg text-theme-text">
      <header className="flex flex-wrap items-center justify-between gap-space-3 border-b border-theme-border px-space-5 py-space-3 max-md:px-space-4">
        <div className="flex flex-wrap items-center gap-space-5">
          <span className="text-h6 font-bold text-accent-500">Worship Wheel</span>
          <AdminNav />
        </div>
        <div className="flex items-center gap-space-3">
          <span className="text-text-sm text-theme-text-muted max-md:hidden">
            {user.email}
          </span>
          <form action={signOut}>
            <button
              type="submit"
              className="cursor-pointer rounded-sm border border-theme-border px-space-3 py-space-2 text-text-sm font-medium text-theme-text-muted transition-colors hover:text-theme-text"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-space-5 py-space-5 max-md:px-space-4">
        {children}
      </main>
    </div>
  );
}
