# Contract: Dashboard Authentication

**Feature**: `005-admin-dashboard` | **Date**: 2026-05-19
**Related**: research [R1](../research.md), [R2](../research.md) · [data-model.md](../data-model.md) · `auth.users`

Supabase Auth (email + password) protects every `/admin` route and every `/api/admin/*` endpoint. Single shared admin role; no public sign-up.

---

## Provider configuration

- **Provider**: Supabase Auth, email + password.
- **Sign-up**: **disabled** at the project level. No public registration path exists.
- **Allowlist**: the set of rows in `auth.users` *is* the allowlist. Accounts are provisioned manually by an administrator (Supabase dashboard, or a documented one-off script using the service role key — see [quickstart.md](../quickstart.md)).
- **Password policy**: minimum-strength policy enabled in Supabase Auth settings.
- **Email confirmation**: provisioned accounts are created confirmed.
- **Session**: cookie-based, `http-only`, `Secure`, `SameSite=Lax`. Access token refreshed in middleware on each request. Absolute + inactivity lifetime configured so a stale session forces re-authentication (FR-006).

---

## Sign-in flow

```
GET  /admin/login        → renders the sign-in form (email + password)
POST (form action)       → supabase.auth.signInWithPassword({ email, password })
   success               → set session cookie, redirect to /admin
   failure               → re-render /admin/login with a generic error
GET  /admin/*  (no session) → 302 redirect to /admin/login?next=<path>
```

**Sign-in rules**:
- Wrong password, or an email with no `auth.users` row, fails with a **generic** "Invalid email or password" message — the response MUST NOT reveal whether the email exists (US1 scenario 4).
- Failed attempts are rate-limited per email/IP; exceeding the threshold temporarily blocks further attempts (FR-007). Supabase Auth's built-in rate limiting is relied upon, supplemented by an app-level check if needed.
- On success the user lands on `/admin` (or the `next` path if safe and internal).

---

## Route protection — `src/middleware.ts`

```
matcher: ['/admin/:path*']        // excludes /admin/login from the redirect
on each matched request:
  1. refresh the Supabase session (lib/supabase/middleware.ts)
  2. if no valid session AND path !== /admin/login → 302 /admin/login?next=<path>
  3. otherwise continue
```

`/api/admin/*` Route Handlers additionally re-check the session server-side using the server client and return `401` (no data) if absent — defence in depth, so a routing misconfiguration cannot expose data (FR-001, FR-002, R6).

---

## Sign-out

A "Sign out" action in the `/admin` layout calls `supabase.auth.signOut()`, clears the session cookie, and redirects to `/admin/login`. After sign-out, protected routes redirect to login (US1 scenario 6).

---

## Authorization model

- All authenticated users share one role with identical access (FR-004). No role claim, no per-user permissions, no MFA in this scope.
- Dashboard data queries run as the signed-in `authenticated` user and are subject to RLS (R6): `authenticated` may `SELECT` `assessment_sessions` and `aggregate_stats`, and may `EXECUTE` the dashboard RPC functions. No client role may `SELECT` `assessment_events` directly.
- The service role key is used **only** by the offline admin-provisioning script — never in request handlers or client code (FR-010).

---

## Audit trail

Dashboard sign-in events (user id, timestamp, outcome) SHOULD be recorded for the security audit trail (FR-012). Supabase Auth's own audit log satisfies this for the MVP; if a richer in-dashboard view is wanted later, it becomes a separate, small spec.

---

## Acceptance mapping

| US1 scenario | Covered by |
|---|---|
| 1 — unauth `/admin` route denied | middleware matcher → redirect to login |
| 2 — unauth data API denied | Route Handler server-side session re-check → `401` |
| 3 — allowlisted user signs in | `signInWithPassword` success path |
| 4 — non-allowlisted / no signup | sign-up disabled; generic failure message |
| 5 — session expiry | configured session lifetime + middleware refresh |
| 6 — sign-out | `signOut()` + cookie clear + redirect |
| 7 — brute-force throttled | Supabase Auth rate limiting (+ app-level check) |
