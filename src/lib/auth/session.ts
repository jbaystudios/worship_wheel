// Admin-dashboard session helpers (spec 005, US1).
// See specs/005-admin-dashboard/contracts/auth.md.
import { NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

/** Returns the signed-in dashboard user, or null. Revalidates the token. */
export async function getAdminUser(): Promise<User | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Guard for `/api/admin/*` Route Handlers — defence in depth behind the
 * middleware redirect (FR-002). Returns `{ user }` when authenticated, or
 * `{ response }` (a 401 with no data) to return immediately.
 *
 *   const auth = await requireAdminUser();
 *   if ('response' in auth) return auth.response;
 *   // ...use auth.user
 */
export async function requireAdminUser(): Promise<
  { user: User } | { response: NextResponse }
> {
  const user = await getAdminUser();
  if (!user) {
    return {
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }
  return { user };
}
