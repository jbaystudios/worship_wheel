// Route protection for the admin dashboard (spec 005, US1 / task T015).
// Refreshes the Supabase session on every /admin request and redirects
// unauthenticated visitors to /admin/login. See contracts/auth.md.
import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);
  const { pathname } = request.nextUrl;
  const isLoginRoute = pathname === '/admin/login';

  // Unauthenticated: send to login, preserving the intended destination.
  if (!user && !isLoginRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin/login';
    url.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  // Already authenticated and visiting login: skip straight to the dashboard.
  if (user && isLoginRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

// Only /admin/* pages are matched here. `/api/admin/*` handlers self-guard via
// requireAdminUser() (returning 401, not an HTML redirect); `/api/events` is public.
export const config = {
  matcher: ['/admin/:path*'],
};
