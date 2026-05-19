// Cookie-based Supabase client for Server Components and Route Handlers (spec 005).
// See specs/005-admin-dashboard/contracts/auth.md and research R1.
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Creates a Supabase client bound to the current request's cookies.
 * Runs queries as the signed-in `authenticated` user, so RLS applies.
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // `setAll` was called from a Server Component, where cookies are
            // read-only. Session refresh is handled by middleware.ts instead,
            // so this can be safely ignored.
          }
        },
      },
    },
  );
}
