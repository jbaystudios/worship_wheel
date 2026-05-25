// Service-role Supabase client — bypasses RLS for trusted server-side writes.
// Used by the Keap sync orchestrator to update keap_sync_status on
// assessment_sessions (the anon role has no UPDATE policy on that table).
//
// NEVER expose this client to the browser. Server-only.
import { createClient } from '@supabase/supabase-js';

export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      'Service-role Supabase client requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY',
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
