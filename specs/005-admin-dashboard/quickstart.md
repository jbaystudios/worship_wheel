# Quickstart: Worship Wheel Admin Dashboard

**Feature**: `005-admin-dashboard` | **Date**: 2026-05-19

How to set up, run, and verify the admin dashboard and event tracking locally. Assumes the base project from specs 001–004 already runs (`npm run dev`).

---

## 1. Install the one new dependency

```bash
npm install @supabase/ssr
```

No other runtime dependencies are added — charting reuses Chart.js, CSV is hand-rolled, validation uses the existing Zod.

## 2. Environment variables

Add to `.env.local` (and Vercel project settings). Most already exist from specs 001–004:

```bash
# Existing — Supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...        # used ONLY by the admin-provisioning script

# New — admin dashboard
ADMIN_REPORTING_TIMEZONE=Africa/Johannesburg   # single fixed reporting timezone (research R9)
ADMIN_INTERNAL_UTM_SOURCE=internal             # marker used to exclude internal/self traffic
```

## 3. Apply the database migration

The migration `supabase/migrations/20260519xxxxxx_admin_dashboard.sql` does all of:

- creates the `assessment_events` table + indexes + RLS (insert-only for clients)
- adds `anon_session_id` to `assessment_sessions` + index
- adds `authenticated`-role `SELECT` policies on `assessment_sessions` and `aggregate_stats`
- creates the four `SECURITY DEFINER` RPC functions and grants `EXECUTE` to `authenticated`

```bash
supabase db push          # or: supabase migration up
```

## 4. Disable public sign-up & provision admin accounts

1. In the Supabase dashboard → **Authentication → Providers → Email**: turn **off** "Allow new users to sign up". Enable a password-strength policy.
2. Provision each stakeholder account (no self-registration exists). Either create users in the Supabase dashboard, or run the documented one-off script:

```bash
npm run admin:provision -- --email charl@worshipguitarskills.com
# prompts for an initial password; account is created confirmed
```

The set of `auth.users` rows is the access allowlist (research R2).

## 5. Run

```bash
npm run dev
```

- Public assessment: `http://localhost:3000/assessment` — now emits funnel events.
- Dashboard: `http://localhost:3000/admin` — redirects to `/admin/login` until signed in.

---

## 6. Verify — manual smoke test

**Event tracking**
1. Open `http://localhost:3000/assessment`. In Supabase, confirm a `page_view` row appeared in `assessment_events` with UTM/referrer/landing context and an `anon_session_id`.
2. Answer a few questions, then close the tab mid-assessment. Confirm `question_viewed`/`question_answered` rows exist up to the last question seen — including the final one before closing (delivered via `sendBeacon`).
3. Complete an assessment fully. Confirm an `assessment_submitted` event exists and that the matching `assessment_sessions` row has `anon_session_id` populated.
4. With the events endpoint stopped/blocked, confirm the assessment still works end to end (best-effort, non-blocking — FR-021).

**Auth gate**
5. Visit `/admin` signed out → redirected to `/admin/login`.
6. `curl` a data endpoint signed out, e.g. `GET /api/admin/funnel` → `401`, no data body.
7. Sign in with a provisioned account → reach the dashboard. Sign in with an unknown email → generic failure, no account created.
8. Sign out → `/admin` redirects to login again.

**Dashboard views**
9. Funnel home shows Visitors → Started → Completed → Lead with conversion rates and a prior-period delta.
10. Per-question view lists 24 questions with reach %, drop-off, and time-on-question; a deliberately slow/abandoned question is flagged as a sticking point.
11. Acquisition view groups traffic by UTM / referrer / Direct and shows completion + lead rate per source.
12. Outcomes view shows archetype + score-band distributions, element averages, device split.
13. Leads table searches by name/email, filters by date, paginates; CSV export downloads the filtered set.
14. Keap sync-health panel lists any `failed`/`retrying` sessions (seed one to verify); shows a healthy empty state otherwise.
15. Pick a date range with no data → every chart/table shows a defined empty state.

---

## 7. Automated tests

```bash
npm test            # Vitest — attribution, bot-filter, funnel math, event Zod schema
npm run test:e2e    # Playwright — admin-auth, admin-dashboard, event-tracking specs
```

Key assertions:
- Unit: UTM/referrer/Direct attribution waterfall; bot UA detection; funnel/drop-off math and sticking-point flag; event payload validation.
- E2e: every `/admin` route and `/api/admin/*` endpoint denies unauthenticated access; sign-in/sign-out; the assessment emits the expected event sequence and remains functional when ingestion fails.
- Seeded data: funnel counts match seeded sessions within ±1% (SC-007); bot/honeypot rows are excluded (SC-011).

## 8. Design prerequisite

Before building any dashboard UI, follow the mandatory UI/UX Pro Max workflow (CLAUDE.md): generate and persist a design system, then design the dashboard screens in the Brand Guide Figma file using bound variable collections. No dashboard UI code before the design system exists.
