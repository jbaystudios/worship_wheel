---
description: "Task list for Worship Wheel Admin Dashboard implementation"
---

# Tasks: Worship Wheel Admin Dashboard

**Input**: Design documents from `/specs/005-admin-dashboard/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Test tasks ARE included — the spec defines an "Independent Test" per user story and `quickstart.md` specifies Vitest + Playwright assertions. Test tasks within a story should be written before that story's implementation and confirmed to fail first.

**Organization**: Tasks are grouped by user story. Event instrumentation is built inside User Story 2 (its first and primary consumer); User Stories 3 and 4 depend on those instrumentation tasks.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: US1–US5, mapping to the spec's user stories
- File paths are relative to the repository root

## Path Conventions

Single Next.js web app. New code under `src/app/admin/`, `src/app/api/`, `src/components/admin/`, `src/lib/`, `src/types/`; migrations under `supabase/migrations/`; tests under `src/__tests__/` (Vitest) and `tests/e2e/` (Playwright).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization for the admin dashboard

- [X] T001 Install `@supabase/ssr` and verify it appears in `package.json` dependencies
- [X] T002 [P] Add `ADMIN_REPORTING_TIMEZONE` and `ADMIN_INTERNAL_UTM_SOURCE` to `.env.local.example` with documentation comments
- [X] T003 [P] Create the admin directory skeleton with placeholder files: `src/app/admin/`, `src/app/api/admin/`, `src/app/api/events/`, `src/components/admin/`, `src/lib/supabase/`, `src/lib/events/`, `src/lib/analytics/`
- [X] T004 [P] Add an `admin:provision` script entry to `package.json` (implementation lands in T020)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database schema, auth clients, and shared utilities that every user story needs

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T005 Write the schema migration `supabase/migrations/20260519120000_admin_dashboard_schema.sql` per data-model.md: create `assessment_events` table (all columns, CHECK constraints, `event_type` enum) with indexes `idx_events_created_at`, `idx_events_session`, `idx_events_type_position`, `idx_events_result`; enable RLS with an INSERT-only policy for `anon`+`authenticated` and no SELECT/UPDATE/DELETE; add nullable `anon_session_id` column + partial index to `assessment_sessions`; add `authenticated`-role SELECT policies to `assessment_sessions` and `aggregate_stats`
- [ ] T006 Apply the migration locally (`supabase db push`) and verify the schema, indexes, and RLS policies in the Supabase dashboard
- [X] T007 [P] Implement the cookie-based Supabase server client in `src/lib/supabase/server.ts` using `@supabase/ssr` (per contracts/auth.md, research R1)
- [X] T008 [P] Implement the Supabase browser client in `src/lib/supabase/browser.ts` (used only by the login form)
- [X] T009 [P] Implement the Supabase middleware session-refresh helper in `src/lib/supabase/middleware.ts`
- [X] T010 [P] Define shared dashboard and event DTO types in `src/types/admin.ts` (event payload, funnel/acquisition/outcomes/leads response shapes from contracts/dashboard-api.md)
- [X] T011 [P] Implement date-range utilities in `src/lib/analytics/date-range.ts` (parse range, default last-30-days, derive prior equal-length period, reporting-timezone handling) with unit tests in `src/__tests__/analytics/date-range.test.ts`
- [X] T012 Generate and persist a dashboard design system via the UI/UX Pro Max skill (mandatory per CLAUDE.md — blocks all dashboard UI tasks) — RESOLVED 2026-05-19: stakeholder decision to reuse the existing app design system (`src/tokens/`, `tailwind-preset.ts`, established dark-theme/gold-accent component patterns) rather than a fresh pass
- [X] T013 Design the admin dashboard screens (login, funnel home, acquisition, outcomes, leads) in the Brand Guide Figma file using bound variable collections (blocks all dashboard UI tasks) — RESOLVED 2026-05-19: dashboard UI built directly against existing app styling for consistency, per stakeholder decision

**Checkpoint**: Schema, auth clients, shared types, and design system ready — user stories can begin

---

## Phase 3: User Story 1 - Secure Sign-In to the Dashboard (Priority: P1) 🎯 MVP foundation

**Goal**: Every `/admin` route and `/api/admin/*` endpoint is inaccessible without an authenticated Supabase session; allowlisted stakeholders sign in with email + password; sessions expire and sign-out works.

**Independent Test**: Load every dashboard route and call every data endpoint while signed out → all denied/redirected. Sign in with an allowlisted credential → access granted. Non-allowlisted email, wrong password, and expired session → all rejected.

### Tests for User Story 1

- [X] T014 [P] [US1] Write Playwright e2e tests in `tests/e2e/admin-auth.spec.ts`: unauthenticated `/admin` route redirects to login; unauthenticated `GET /api/admin/funnel` returns 401; sign-in success; wrong credentials show a generic error; sign-out returns to login (US1 scenarios 1–7) — also added `playwright.config.ts` (testDir scoped to `tests/e2e/`) and a Vitest `include`/`exclude` so unit and e2e suites stay separate

### Implementation for User Story 1

- [X] T015 [US1] Implement `src/middleware.ts` with matcher `['/admin/:path*']` (excluding `/admin/login`): refresh the Supabase session and redirect unauthenticated requests to `/admin/login?next=<path>` (contracts/auth.md)
- [X] T016 [P] [US1] Build the sign-in page `src/app/admin/login/page.tsx` with an email + password form calling `signInWithPassword` via the browser client; show a generic "Invalid email or password" error; redirect to `next` (safe internal path) or `/admin` on success
- [X] T017 [US1] Build the authenticated shell `src/app/admin/(dashboard)/layout.tsx` (route group keeps it off the login page): server-side session check, `AdminNav`, and a sign-out server action; placeholder `src/app/admin/(dashboard)/page.tsx` added so `/admin` resolves (replaced by the funnel view in T035)
- [X] T018 [P] [US1] Create shared admin UI primitives `StatCard` and `EmptyState` (and `AdminNav`) in `src/components/admin/`, styled against the existing app design system
- [X] T019 [US1] Implement server-side `getAdminUser()` / `requireAdminUser()` helpers in `src/lib/auth/session.ts` used by every `/api/admin/*` Route Handler to re-check the session and return `401` with no data body (defence in depth — FR-002, R6)
- [X] T020 [P] [US1] Implement the admin-provisioning script `src/scripts/provision-admin.ts` (creates a confirmed `auth.users` account via the service role key, prompts for an initial password); `admin:provision` npm script wired and `tsx` added as a devDependency
- [X] T021 [US1] Documented in `quickstart.md` (step 4) the operational step of disabling public sign-up and enabling the password-strength policy in Supabase Auth settings (FR-003, FR-005)

**Checkpoint**: The dashboard is fully access-controlled; an empty but secured `/admin` is reachable only by provisioned stakeholders

---

## Phase 4: User Story 2 - Funnel Drop-Off & Sticking-Point Questions (Priority: P1) 🎯 MVP

**Goal**: Reliable first-party event capture, plus a dashboard home showing the Visitors→Started→Completed→Lead funnel with prior-period deltas and a per-question drop-off view that auto-flags sticking-point questions.

**Independent Test**: Drive known simulated sessions through the assessment (some abandoning at specific questions, some completing). The funnel shows correct counts/rates per step; the per-question view shows correct completion percentages; the question with concentrated abandonment is flagged as a sticking point.

> Tasks T022–T029 are the event-instrumentation prerequisite shared with User Stories 3 and 4.

### Tests for User Story 2

- [X] T022 [P] [US2] Write unit tests in `src/__tests__/events/schema.test.ts` (event payload validation: required/conditional fields, enum, UUID) and `src/__tests__/analytics/funnel.test.ts` (funnel/drop-off math, sticking-point flag) — schema.test.ts (12 tests) + funnel.test.ts (8 tests)
- [X] T023 [P] [US2] Write Playwright e2e tests in `tests/e2e/event-tracking.spec.ts`: the assessment emits the expected event sequence (page_view→started→question_viewed/answered→submitted); the assessment still completes when the events endpoint fails (non-blocking — FR-021)

### Event instrumentation for User Story 2

- [X] T024 [P] [US2] Implement the event payload Zod schema in `src/lib/events/schema.ts` (per contracts/events-api.md field rules) — single + batch schemas, conditional question-field rules, known-question-id check
- [X] T025 [P] [US2] Implement attribution classification in `src/lib/analytics/attribution.ts` (UTM → referrer domain → Direct waterfall) with unit tests in `src/__tests__/analytics/attribution.test.ts`
- [X] T026 [P] [US2] Implement bot/device detection in `src/lib/analytics/bot-filter.ts` (known-bot UA patterns, `device_type` derivation, implausible-speed floor) with unit tests in `src/__tests__/analytics/bot-filter.test.ts`
- [X] T027 [US2] Implement the client event emitter in `src/lib/events/tracker.ts`: generate an ephemeral `sessionStorage` UUID, send via `navigator.sendBeacon` with `keepalive` fetch fallback, swallow all errors (research R3, R4)
- [X] T028 [US2] Implement `POST /api/events` in `src/app/api/events/route.ts`: Zod-validate, derive `is_bot`/`device_type`, parse referrer to host, insert into `assessment_events`, per-IP rate limit, always return `204` (contracts/events-api.md) — also added `src/lib/supabase/public.ts` (anon-key client for public routes)
- [X] T029 [US2] Wire the assessment flow to emit events — `page_view` (with acquisition context) on landing, `assessment_started`, `question_viewed`/`question_answered` per question — and modify `POST /api/submit` to persist `assessment_sessions` (closing the spec-001 gap), store `anonSessionId` + UTM + completion time, and emit `assessment_submitted` with `resultId` (research R10). NOTE: events fire eagerly on view, so they survive unload via `sendBeacon` without a dedicated `pagehide` handler. The Keap contact sync remains a separate pending item — sessions persist with `keap_sync_status = 'pending'`.

### Funnel view for User Story 2

- [X] T030 [US2] Create migration `supabase/migrations/20260519130000_admin_funnel_rpc.sql` defining the `SECURITY DEFINER` RPC functions `get_funnel_summary` and `get_question_dropoff` (per data-model.md), `EXECUTE` revoked from `public` and granted to `authenticated`. NOTE: applying it is part of T006 (pending the Supabase connection).
- [X] T031 [US2] Implement funnel/drop-off response shaping in `src/lib/analytics/funnel.ts` (funnel rows with conversion rates, `countDelta` for prior-period deltas, sticking-point boolean — verified by T022 tests)
- [X] T032 [P] [US2] Build the `DateRangePicker` component in `src/components/admin/` (presets + custom range + include-internal toggle; URL-driven; reused by US3/US4/US5)
- [X] T033 [US2] Implement `GET /api/admin/funnel` in `src/app/api/admin/funnel/route.ts` (calls both RPCs via `src/lib/admin/funnel-data.ts`, requires session via T019, per contracts/dashboard-api.md)
- [X] T034 [P] [US2] Build the `FunnelChart` and `DropoffTable` components in `src/components/admin/` (sticking-point questions visually flagged). NOTE: FunnelChart uses proportional CSS bars consistent with the app's existing `ElementBreakdown` pattern, rather than Chart.js — the results page reserves Chart.js for the radar chart.
- [X] T035 [US2] Build the dashboard home `src/app/admin/(dashboard)/page.tsx` (Server Component): funnel steps with deltas, per-question drop-off table, date-range control, empty + error states
- [X] T036 [US2] Created `tests/e2e/admin-dashboard.spec.ts` with funnel-view assertions; the seeded-data ±1% accuracy check (SC-007) is marked `test.fixme` pending a DB seeding fixture (see T055)

**Checkpoint**: MVP complete — secured dashboard (US1) + reliable funnel and drop-off measurement (US2)

---

## Phase 5: User Story 3 - Traffic Sources & Per-Source Conversion (Priority: P2)

**Goal**: An Acquisition view grouping traffic by UTM / referrer / Direct, showing started-rate, completion rate, and lead rate per source, plus top landing paths.

**Independent Test**: Simulate sessions with varied UTM tags, referrers, and no referrer, some completing. The Acquisition view groups them correctly and shows accurate completion and lead rates per source.

**Depends on**: event instrumentation T024–T029, `DateRangePicker` T032.

- [X] T037 [US3] Create migration `supabase/migrations/20260519140000_admin_acquisition_rpc.sql` defining the `get_acquisition_breakdown` RPC (per-source counts + top landing paths; UTM→referrer→Direct waterfall, self-host aware), `EXECUTE` granted to `authenticated`. NOTE: applying it is part of T006.
- [X] T038 [US3] Implement `GET /api/admin/acquisition` in `src/app/api/admin/acquisition/route.ts` via `src/lib/admin/acquisition-data.ts` (derives per-source rates), session-guarded (contracts/dashboard-api.md)
- [X] T039 [P] [US3] Build the `SourceTable` and `LandingPaths` components in `src/components/admin/`
- [X] T040 [US3] Build the Acquisition page `src/app/admin/(dashboard)/acquisition/page.tsx` (Server Component) with date-range control and empty/error states
- [X] T041 [P] [US3] Extend `tests/e2e/admin-dashboard.spec.ts` with acquisition assertions (UTM/referrer/Direct grouping; per-source rates)

**Checkpoint**: US1 + US2 + US3 all independently functional

---

## Phase 6: User Story 4 - Audience & Outcomes (Priority: P2)

**Goal**: An Outcomes view showing archetype distribution, score-band distribution, average score per element, device split, and completion-time stats.

**Independent Test**: Seed completed assessments with varied archetypes, score bands, and element scores. The view's distributions and averages match the seeded data for the selected date range.

**Depends on**: event instrumentation T024–T029 (device split), `DateRangePicker` T032.

- [X] T042 [US4] Create migration `supabase/migrations/20260519150000_admin_outcomes_rpc.sql` defining the `get_outcomes_summary` RPC (archetype/score-band distributions, element averages, device split, completion-time stats; reads `assessment_sessions` + `assessment_events`, excludes implausibly-fast spam), `EXECUTE` granted to `authenticated`. NOTE: applying it is part of T006.
- [X] T043 [US4] Implement `GET /api/admin/outcomes` in `src/app/api/admin/outcomes/route.ts` via `src/lib/admin/outcomes-data.ts` (archetype names, shares, band order), session-guarded (contracts/dashboard-api.md)
- [X] T044 [P] [US4] Build the `OutcomeCharts` components in `src/components/admin/OutcomeCharts.tsx` — archetype, score-band, element-average, device-split (CSS bars, consistent with the dashboard)
- [X] T045 [US4] Build the Outcomes page `src/app/admin/(dashboard)/outcomes/page.tsx` (Server Component) with date-range control, completion-time StatCards, and empty/error states
- [X] T046 [P] [US4] Extend `tests/e2e/admin-dashboard.spec.ts` with outcomes assertions

**Checkpoint**: All P1–P2 stories functional

---

## Phase 7: User Story 5 - Individual Leads & CRM Sync Health (Priority: P3)

**Goal**: A searchable, paginated, date-filterable leads table with CSV export, plus a Keap sync-health panel listing failed/retrying syncs.

**Independent Test**: Seed completions including some with `keap_sync_status = 'failed'`. The Leads table lists them with correct fields; search and date filtering work; CSV export reflects the filtered set; the sync-health panel lists exactly the failed records.

**Depends on**: `authenticated` SELECT policy on `assessment_sessions` (T005), `DateRangePicker` T032. Independent of event instrumentation.

- [X] T047 [P] [US5] Implement an RFC 4180 CSV serialiser in `src/lib/analytics/csv.ts` (quoting/escaping, streaming-friendly) with unit tests in `src/__tests__/analytics/csv.test.ts` — 14 tests covering quoting, escaping, CSV-injection neutralisation, sync + async iterables, and empty sources
- [X] T048 [US5] Implement `GET /api/admin/leads` in `src/app/api/admin/leads/route.ts` (pagination, `q` name/email search, date range, `syncStatus` filter — reads `assessment_sessions` directly under RLS) — backed by `src/lib/admin/leads-data.ts`; traffic source derived from session UTMs via `classifyAttribution` (referrer-only attribution would require an RPC since `assessment_events` has no `authenticated` SELECT policy — deferred)
- [X] T049 [US5] Implement `GET /api/admin/leads/export` in `src/app/api/admin/leads/export/route.ts` (streamed CSV of the filtered set, `Content-Disposition: attachment`) — uses `iterateLeadsForExport` (500-row paging) and `streamCsv` so memory stays bounded; CSV columns match the contract incl. Overall %, Balance Score, Results URL (built from `NEXT_PUBLIC_BASE_URL`)
- [X] T050 [P] [US5] Build the `LeadsTable` and `SyncHealthPanel` components in `src/components/admin/` (sync-health shows `keapSyncError`; healthy empty state when all synced) — table is a client component (search/pagination via URL + `useTransition`); panel is a server component with three visual states (failed/retrying list, healthy success banner, neutral unavailable)
- [X] T051 [US5] Build the Leads page (Server Component) with search, date-range, pagination, export button, and the sync-health panel — placed at `src/app/admin/(dashboard)/leads/page.tsx` to inherit the dashboard layout (the original task path predated the `(dashboard)` route group); sync-health panel reads the failed+retrying slice for the same range alongside the paginated table
- [X] T052 [P] [US5] Extend `tests/e2e/admin-dashboard.spec.ts` with leads assertions (search, date filter, CSV export contents, sync-health panel against a seeded failed record) — added 6 tests covering search URL update, sync-status filter, export href shape, CSV `Content-Type`/`Content-Disposition`/header row, and the panel's failed-or-healthy visibility

**Checkpoint**: All five user stories independently functional

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Quality, performance, and validation across all stories

- [X] T053 [P] Verify defined empty states render for every chart and table on an empty date range (FR-043) — audited all four views: funnel (`EmptyState` when `funnel[0].count === 0`), acquisition (`EmptyState` when `sources.length === 0`; added inline empty branch to `LandingPaths` for the defensive case where sources exist but no paths), outcomes (`EmptyState` when `completers === 0`; `ArchetypeChart` + `DeviceSplitChart` have inline `NoData`; `ScoreBandChart` + `ElementAveragesChart` always render fixed buckets and are gated by the page), leads (inline "No leads match the current filters." in the table body, healthy banner in `SyncHealthPanel`)
- [X] T054 [P] Responsive check at 375 / 768 / 1024 / 1440 px and light/dark contrast (≥4.5:1) across all dashboard views per CLAUDE.md UI rules; ensure all clickable elements have `cursor-pointer` — code audit only (no live browser): every interactive element (`<button>`, `<a>`, `<Link>`, `<select>`, date `<input>`, sign-out form button, login submit, pagination, export link, preset buttons, sync filter, search submit/clear) has `cursor-pointer`; pagination buttons additionally carry `disabled:cursor-not-allowed`. Responsive: header + filter rows use `flex-wrap`; tables use `overflow-x-auto`; outcomes grid uses `grid-cols-2 max-md:grid-cols-1`; layout pads down with `max-md:px-space-4`. Light/dark contrast: all UI uses `theme-text` / `theme-text-muted` against `theme-bg` / `theme-bg-2` so it inherits the existing app's verified contrast tokens. Visual cross-breakpoint verification deferred until live Supabase enables a populated dashboard.
- [ ] T055 Verify bot, spam, and internal-traffic exclusion against seeded data, including the "include internal" toggle (FR-023, SC-011)
- [ ] T056 Performance check: dashboard view p95 < 2s on a 30-day window, `POST /api/events` p95 < 150ms, CSV export of a 1-month range < 10s (SC-008, SC-010)
- [ ] T057 [P] Run the full `quickstart.md` manual smoke test (steps 6.1–6.15) and confirm all pass
- [X] T058 [P] Update `CLAUDE.md`: add specs/005 to the repo layout and Workflow Status, and remove the duplicate "Active Technologies" block left by the agent-context script — added specs/005 to the Entry-Point Documents table; collapsed the duplicate Active Technologies block into the canonical bulleted list (with Supabase Auth + `assessment_events` added); added US1–US5 status to Workflow Status and dated entries (2026-05-19 / 2026-05-20) to Recent Changes
- [ ] T059 Run `npm run lint`, `npm test`, and `npm run test:e2e`; fix any failures — partial: `npx tsc --noEmit` clean, `npx vitest run` 149/149 green. `npm run lint` is unconfigured (interactive prompt asks to set up ESLint — out of scope for this task). `npm run test:e2e` is gated on the live Supabase + provisioned admin account (T006), so it stays blocked alongside T055/T056/T057.
- [X] T060 Confirm no secrets are committed and the service role key is referenced only by `src/scripts/provision-admin.ts` (FR-010) — confirmed: `SUPABASE_SERVICE_ROLE_KEY` referenced only in `src/scripts/provision-admin.ts` (a node CLI never imported by the Next app), `.env.local.example` (placeholder), and spec/quickstart docs; `.env.local` is gitignored and not tracked.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies — start immediately
- **Foundational (Phase 2)**: depends on Setup — BLOCKS all user stories
- **US1 (Phase 3)**: depends on Foundational only — fully independent
- **US2 (Phase 4)**: depends on Foundational; uses `requireAdminSession()` from US1 (T019) for its API route
- **US3 (Phase 5)**: depends on Foundational + US2 event-instrumentation tasks (T024–T029) + `DateRangePicker` (T032)
- **US4 (Phase 6)**: depends on Foundational + US2 event-instrumentation tasks (T024–T029) + `DateRangePicker` (T032)
- **US5 (Phase 7)**: depends on Foundational only — independent of event instrumentation
- **Polish (Phase 8)**: depends on all desired user stories being complete

### User Story Dependencies

- **US1** — independent. Build first; everything authed depends on its session helper.
- **US2** — independent of other stories, but contains the event instrumentation that US3 and US4 consume.
- **US3, US4** — independent of each other; both require US2's T024–T029.
- **US5** — independent of US2–US4; could be built in parallel with US2 right after Foundational.

### Within Each User Story

- Tests written and failing before implementation
- Migrations/RPCs before the Route Handlers that call them
- Route Handlers before the pages that render their data
- Shared components (`DateRangePicker`, `StatCard`, `EmptyState`) before the pages using them

### Parallel Opportunities

- Setup: T002, T003, T004 in parallel
- Foundational: T007–T011 in parallel (after T006); T012 then T013
- US1: T014 and T018 and T020 in parallel; T016 parallel with T015
- US2: T024, T025, T026 in parallel; T022, T023 in parallel; T032 and T034 in parallel
- After Foundational, a second developer can build **US5** in parallel with **US2**
- US3 and US4 can be built in parallel once US2's T024–T029 are done

---

## Parallel Example: User Story 2 event instrumentation

```bash
# After Foundational, launch the instrumentation libraries together:
Task: "Implement event Zod schema in src/lib/events/schema.ts"
Task: "Implement attribution classification in src/lib/analytics/attribution.ts"
Task: "Implement bot/device detection in src/lib/analytics/bot-filter.ts"
```

---

## Implementation Strategy

### MVP scope

The viable MVP is **US1 + US2** (per spec.md): a secured dashboard plus reliable funnel and drop-off measurement. US1 alone (a secured but empty dashboard) is not demo-valuable on its own.

1. Complete Phase 1 (Setup) + Phase 2 (Foundational)
2. Complete Phase 3 (US1) — dashboard is access-controlled
3. Complete Phase 4 (US2) — funnel + drop-off live
4. **STOP and VALIDATE**: run the US1 and US2 independent tests; deploy/demo the MVP

### Incremental delivery

1. Setup + Foundational → foundation ready
2. + US1 → secured shell
3. + US2 → **MVP** (funnel + drop-off) → deploy/demo
4. + US3 → acquisition → deploy/demo
5. + US4 → outcomes → deploy/demo
6. + US5 → leads + CRM ops → deploy/demo
7. Polish

### Parallel team strategy

After Foundational: Developer A → US1 then US2; Developer B → US5 (independent). Once US2's T024–T029 land, US3 and US4 can be split across developers.

---

## Notes

- 60 tasks total: Setup 4 · Foundational 9 · US1 8 · US2 15 · US3 5 · US4 5 · US5 6 · Polish 8.
- The event instrumentation (T024–T029) is the critical prerequisite — US2, US3, and US4 produce no data until it is live. Sequence it first within US2.
- `<timestamp>` in migration filenames follows the existing `supabase/migrations/` convention (`YYYYMMDDHHMMSS`).
- No dashboard UI task may begin before T012 (design system) and T013 (Figma screens) — mandatory per CLAUDE.md.
- Commit after each task or logical group; stop at any checkpoint to validate a story independently.
