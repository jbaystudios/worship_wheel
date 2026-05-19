// Browser-side Supabase client (spec 005). Used only by the /admin/login form
// for `signInWithPassword`; dashboard data is fetched server-side.
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
