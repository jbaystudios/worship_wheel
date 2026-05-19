# Implementation Plan: Worship Wheel Admin Dashboard

**Branch**: `005-admin-dashboard` | **Date**: 2026-05-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-admin-dashboard/spec.md`

## Summary

Build an authenticated, analytics-only admin dashboard for the stakeholders managing the Worship Wheel funnel. The work has two halves:

1. **Event instrumentation** — a new first-party `assessment_events` table plus a public, best-effort ingestion endpoint (`POST /api/events`). The existing public assessment flow is modified to emit anonymous funnel events (page view, started, question viewed/answered, submitted). This is consent-independent and closes the GA4 cookie-consent blind spot. It is a hard prerequisite for the funnel, drop-off, and acquisition views.
2. **The dashboard** — a Supabase-Auth-protected `/admin` area in the existing Next.js app: a sign-in screen, a funnel + per-question drop-off home, an acquisition view, an audience/outcomes view, and a leads table with CSV export plus a Keap sync-health panel.

Aggregations are computed in PostgreSQL via `SECURITY DEFINER` RPC functions over `assessment_events` and `assessment_sessions`; dashboard pages are Next.js Server Components with Route Handlers for filtered/paginated/export requests. No new runtime dependencies beyond `@supabase/ssr`; charting reuses the existing Chart.js stack.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 20+
**Primary Dependencies**: Next.js 14 (App Router), `@supabase/supabase-js`, `@supabase/ssr` (new — App Router auth), Chart.js 4.4 + react-chartjs-2 (existing), Zod (existing), Tailwind CSS 3.4 (existing)
**Storage**: Supabase (PostgreSQL) — new `assessment_events` table; existing `assessment_sessions` (one new column) and `aggregate_stats` (new RLS policy); Supabase Auth (`auth.users`) for dashboard accounts
**Testing**: Vitest (unit — attribution parsing, bot filtering, funnel math, Zod schemas), Playwright (e2e — auth gate, dashboard flows, event emission)
**Target Platform**: Vercel (Fluid Compute) — server-rendered web app, modern desktop and mobile browsers
**Project Type**: Web application (single Next.js project — admin area added to existing app)
**Performance Goals**: Dashboard view p95 < 2s for the default 30-day window; event ingestion endpoint p95 < 150ms; CSV export of a 1-month range < 10s
**Constraints**: Event tracking MUST be best-effort and non-blocking — a tracking outage cannot affect the public assessment; no PII in `assessment_events`; all dashboard routes and data endpoints deny unauthenticated access; secrets stay server-side
**Scale/Scope**: Hundreds to low-thousands of sessions/month; ~16 stakeholder accounts max; ~5 dashboard screens, 1 ingestion endpoint, 5 dashboard Route Handlers, ~4 RPC functions

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The project constitution (`.specify/memory/constitution.md`) is an unpopulated template — it contains no ratified principles to gate against. In its absence, this plan is gated against the de-facto project standards documented in `CLAUDE.md`:

| Standard (from CLAUDE.md) | Compliance |
|---|---|
| Spec-driven workflow (Spec Kit) | PASS — this plan follows `/speckit.plan`; spec 005 precedes it |
| Stack: Next.js 14 App Router, Supabase, Zod, Tailwind, Vitest, Playwright | PASS — no stack deviation; one additive dependency (`@supabase/ssr`, official Supabase package) |
| Config data as static JSON in `src/data/` | PASS — dashboard is analytics-only; no question/recommendation config is added or changed |
| Supabase RLS enforced on all tables | PASS — new `assessment_events` table ships with RLS; new policies added for `authenticated` reads |
| UI/UX Pro Max workflow mandatory for all UI work | PASS — gated in Phase 1; design-system generation precedes any dashboard UI implementation |
| Figma variable-bound design tokens | PASS — dashboard screens to be designed in the Brand Guide file per CLAUDE.md before build |
| No secrets committed; `.env.local` only | PASS — Supabase service role and Keap keys remain server-side env vars |

**Initial gate result: PASS** (no violations; Complexity Tracking not required).
**Post-design re-check (after Phase 1): PASS** — see end of Phase 1; no new violations introduced.

## Project Structure

### Documentation (this feature)

```text
specs/005-admin-dashboard/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── events-api.md    # POST /api/events ingestion contract
│   ├── dashboard-api.md # GET /api/admin/* dashboard data + export contracts
│   └── auth.md          # Supabase Auth sign-in / middleware / session contract
└── tasks.md             # Phase 2 output (/speckit.tasks — NOT created here)
```

### Source Code (repository root)

The admin dashboard is added to the existing single Next.js project. New paths:

```text
src/
├── middleware.ts                       # NEW — protects /admin/*, refreshes Supabase session
├── app/
│   ├── admin/
│   │   ├── layout.tsx                  # NEW — authed shell: nav, date-range control, sign-out
│   │   ├── login/page.tsx              # NEW — email + password sign-in (US1)
│   │   ├── page.tsx                    # NEW — funnel + per-question drop-off home (US2)
│   │   ├── acquisition/page.tsx        # NEW — traffic sources + per-source conversion (US3)
│   │   ├── outcomes/page.tsx           # NEW — archetypes, score bands, element averages (US4)
│   │   └── leads/page.tsx              # NEW — leads table + Keap sync-health panel (US5)
│   └── api/
│       ├── events/route.ts             # NEW — public, best-effort event ingestion
│       └── admin/
│           ├── funnel/route.ts         # NEW — filtered funnel + drop-off data
│           ├── acquisition/route.ts    # NEW — filtered acquisition data
│           ├── outcomes/route.ts       # NEW — filtered outcomes data
│           ├── leads/route.ts          # NEW — paginated/searchable leads
│           └── leads/export/route.ts   # NEW — CSV export of filtered leads
├── components/admin/                   # NEW — FunnelChart, DropoffTable, SourceTable,
│                                       #       OutcomeCharts, LeadsTable, SyncHealthPanel,
│                                       #       DateRangePicker, StatCard, EmptyState
├── lib/
│   ├── supabase/
│   │   ├── server.ts                   # NEW — server-side client (cookies-based session)
│   │   ├── browser.ts                  # NEW — browser client for the login form
│   │   └── middleware.ts               # NEW — session refresh helper for middleware.ts
│   ├── events/
│   │   ├── tracker.ts                  # NEW — client emitter (sendBeacon, ephemeral session id)
│   │   └── schema.ts                   # NEW — Zod schema for the event payload
│   └── analytics/
│       ├── attribution.ts              # NEW — UTM / referrer / direct classification
│       ├── bot-filter.ts               # NEW — bot UA + implausible-speed heuristics
│       ├── funnel.ts                   # NEW — funnel/drop-off shaping + sticking-point flag
│       └── date-range.ts               # NEW — range parsing + prior-period comparison
└── types/admin.ts                      # NEW — dashboard + event DTO types

src/__tests__/
├── analytics/attribution.test.ts       # NEW — unit
├── analytics/bot-filter.test.ts        # NEW — unit
├── analytics/funnel.test.ts            # NEW — unit
└── events/schema.test.ts               # NEW — unit

tests/e2e/                              # (Playwright)
├── admin-auth.spec.ts                  # NEW — auth gate (US1)
├── admin-dashboard.spec.ts             # NEW — funnel/acquisition/outcomes/leads (US2-5)
└── event-tracking.spec.ts              # NEW — assessment emits events, non-blocking

supabase/migrations/
└── 20260519xxxxxx_admin_dashboard.sql  # NEW — assessment_events table + indexes + RLS,
                                        #       anon_session_id column on assessment_sessions,
                                        #       authenticated RLS policies, RPC functions

src/app/(assessment flow)               # MODIFIED — emit events at page view, start,
                                        #            question view/answer, submission
```

**Structure Decision**: Single web-application project. The dashboard is an `/admin` route group inside the existing Next.js app rather than a separate project — it shares the Supabase project, deployment, design system, and type definitions, and the assessment flow itself must be modified for instrumentation, so a split would add friction with no benefit. Server Components render initial views; Route Handlers under `/api/admin/*` serve client-driven date-range, pagination, search, and export requests. Heavy aggregation lives in PostgreSQL RPC functions, keeping the Node layer thin.

## Complexity Tracking

No constitution violations. Section intentionally empty.
