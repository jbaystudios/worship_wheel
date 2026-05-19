// Non-cookie Supabase client (anon key) for public API routes — event
// ingestion (/api/events) and assessment submission (/api/submit).
// Access is governed by RLS; no session is persisted. (spec 005, research R6)
import { createClient } from '@supabase/supabase-js';

export function createPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
