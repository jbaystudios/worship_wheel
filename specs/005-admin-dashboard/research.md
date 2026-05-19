# Phase 0 Research: Worship Wheel Admin Dashboard

**Feature**: `005-admin-dashboard` | **Date**: 2026-05-19 | **Plan**: [plan.md](./plan.md)

This document resolves the open questions and technology choices behind the implementation plan. Each item follows Decision / Rationale / Alternatives considered.

---

## R1 — Supabase Auth integration for Next.js App Router

**Decision**: Use the official `@supabase/ssr` package. Create three helpers: a browser client (`lib/supabase/browser.ts`) used only by the login form, a server client (`lib/supabase/server.ts`) used by Server Components and Route Handlers, and a middleware helper (`lib/supabase/middleware.ts`) that refreshes the auth cookie on every request. `src/middleware.ts` matches `/admin/:path*` (excluding `/admin/login`), refreshes the session, and redirects unauthenticated requests to `/admin/login`. Session cookies are http-only, `Secure`, `SameSite=Lax`.

**Rationale**: `@supabase/ssr` is the current, supported way to do cookie-based Supabase Auth in the App Router; it handles token refresh in middleware so Server Components always see a valid session. Middleware enforcement gives a single choke point for FR-001. It is an additive, first-party dependency consistent with the existing Supabase stack.

**Alternatives considered**: The older `@supabase/auth-helpers-nextjs` — deprecated in favour of `@supabase/ssr`. A custom JWT scheme — reinvents session refresh and CSRF handling for no gain. Client-only auth checks — rejected: would let unauthenticated requests reach Server Components and Route Handlers.

---

## R2 — Admin allowlist and disabling public sign-up

**Decision**: Disable public sign-up in the Supabase project's Auth settings. Dashboard accounts are provisioned manually by an administrator (Supabase dashboard or a documented one-off provisioning script using the service role key). The set of rows in `auth.users` **is** the allowlist — there is no self-registration path and no separate allowlist table. The login screen exposes only sign-in (and, optionally, password reset for already-provisioned users). A password-strength policy is configured in Supabase Auth settings.

**Rationale**: The stakeholder group is tiny (single digits, ≤16). Manual provisioning is the simplest design that fully satisfies FR-003/FR-004 with zero custom code and no extra table to keep in sync. Disabling sign-up removes the attack surface entirely rather than filtering it.

**Alternatives considered**: A separate `admin_allowlist` table checked by an `auth.users` insert trigger — defense-in-depth, but redundant once sign-up is disabled; deferred as optional hardening. Magic-link auth — the stakeholder explicitly chose email + password. OAuth/SSO — out of scope, no identity provider in play.

---

## R3 — Anonymous session identification and cookie consent

**Decision**: The assessment flow generates a v4 UUID per browser session, stored in `sessionStorage` under a key such as `ww_evt_sid`. It is sent with every event as `anonSessionId`. It is **ephemeral** — `sessionStorage` is cleared when the tab closes — so it cannot track a person across visits or sites. Events store no IP address, no name, no email, and no persistent identifier. The endpoint may read the request IP transiently for rate-limiting but never persists it. Because the identifier is first-party, ephemeral, single-purpose, and carries no PII, event tracking is treated as strictly-necessary/functional analytics that operates regardless of the CookieBot consent choice. **A short privacy review with the client confirms this classification before launch** (carried as a spec assumption).

**Rationale**: An ephemeral, non-persistent, PII-free identifier is the narrowest design that still lets us reconstruct one visitor's path through the funnel (needed for drop-off). Keeping it out of `localStorage` and cookies is what justifies operating outside consent gating and removes the GA4 blind spot the spec exists to fix.

**Alternatives considered**: A persistent `localStorage`/cookie id — would enable cross-visit dedup but pulls tracking under consent gating, defeating the purpose. Server-set first-party cookie — same consent problem. No identifier at all — impossible to attribute drop-off to a coherent session.

---

## R4 — Event ingestion transport

**Decision**: `POST /api/events` accepts a single event or a small array of events as JSON. The client emitter (`lib/events/tracker.ts`) uses `navigator.sendBeacon` when available (guarantees delivery during page unload — critical for capturing the *last* `question_viewed` before an abandon), falling back to `fetch` with `keepalive: true`. All emission is wrapped so any failure is swallowed — tracking never throws into the assessment UI. The endpoint validates with Zod, applies a generous per-IP rate limit, classifies the event (bot flag, device type, attribution) and inserts. Acquisition fields (UTM, referrer, landing path) are sent only on the session's first event.

**Rationale**: `sendBeacon` is the standard mechanism for reliable unload-time analytics; without it, abandon events at the exact drop-off point would be lost. `keepalive` fetch is the documented fallback. Swallowing errors satisfies FR-021 (best-effort, non-blocking). Accepting small batches reduces request count when several events queue.

**Alternatives considered**: Synchronous `fetch` without `keepalive` — loses unload events. A third-party analytics SDK — reintroduces consent gating and an external dependency. WebSocket streaming — vastly over-engineered for this volume.

---

## R5 — Funnel and aggregation strategy

**Decision**: Compute aggregations in PostgreSQL via `SECURITY DEFINER` RPC functions, one per dashboard view: `get_funnel_summary`, `get_question_dropoff`, `get_acquisition_breakdown`, `get_outcomes_summary`. Each takes a date range (and reporting timezone) and returns shaped JSON. Functions are owned by a privileged role, granted `EXECUTE` to the `authenticated` role only. `assessment_events` carries indexes on `(created_at)`, `(anon_session_id)`, and `(event_type, question_position)` to keep these queries fast at the expected volume. The Outcomes view may read the precomputed `aggregate_stats` table for daily rollups where it already has the needed figure.

**Rationale**: At hundreds-to-thousands of sessions/month, direct SQL aggregation is fast and needs no warehouse or pre-aggregation pipeline. RPC functions keep heavy multi-step SQL out of the Node layer, are individually testable, and let access be granted precisely to `authenticated`. `SECURITY DEFINER` lets one function read across `assessment_events` and `assessment_sessions` under controlled, audited logic instead of broad table grants.

**Alternatives considered**: Materialised views — add refresh scheduling complexity for a dataset small enough to query live. Aggregating in TypeScript by pulling raw rows — moves large row sets over the wire and duplicates SQL the database does better. A separate analytics DB — unjustified at this scale.

---

## R6 — Row-level security and dashboard data access

**Decision**:
- `assessment_events`: RLS enabled. `anon` and `authenticated` roles may `INSERT` (validated payloads from the public endpoint). **No** role may `SELECT` directly. All reads happen through the RPC functions in R5.
- `assessment_sessions`: keep the existing public-insert and public-select-by-id policies; **add** a policy granting the `authenticated` role `SELECT` (for the Leads and Outcomes views). No update/delete from clients.
- `aggregate_stats`: **add** a policy granting the `authenticated` role `SELECT` (currently server-side only).
- Dashboard Route Handlers and Server Components use the cookie-scoped server client, so every dashboard query runs as the signed-in `authenticated` user and is subject to these policies. The service role key is used only by the one-off admin-provisioning script, never in request handlers.

**Rationale**: Reads via RPC keep raw per-event rows unreadable even to authenticated users, minimising the blast radius if a dashboard query is ever mis-scoped. Running dashboard queries as the actual user (not service role) means RLS is a real second line of defence behind the middleware gate. This matches the existing project posture ("RLS Policy: No public access. Server-side only").

**Alternatives considered**: Service-role client for all dashboard reads — works, but discards RLS as a safety net and risks key exposure if a handler is mis-wired. Granting `authenticated` broad `SELECT` on `assessment_events` — exposes raw event rows unnecessarily.

---

## R7 — Bot, spam, and internal-traffic exclusion

**Decision**: Three layers, all reflected in reported metrics (FR-023):
1. **Bots** — at ingestion, the endpoint sets `is_bot = true` when the User-Agent matches a known-bot pattern list (`lib/analytics/bot-filter.ts`). RPC functions exclude `is_bot` rows by default.
2. **Spam** — honeypot-failing submissions are already discarded by `/api/submit`; additionally, sessions whose completion is implausibly fast (below a configurable floor, e.g. < 20s for 24 questions) are flagged and excluded from completion/conversion metrics.
3. **Internal traffic** — excludable via a configurable list of internal markers (e.g. a reserved `utm_source` value such as `internal`, or known internal email domains for the Leads/Outcomes side). The default dashboard view excludes them; the date-range control offers an "include internal" toggle.

`is_bot` and a derived `device_type` are stored on each event row at ingestion so filtering is a cheap indexed predicate, not a per-query UA reparse.

**Rationale**: Inflated denominators destroy the credibility of every conversion rate, so exclusion must be the default, not opt-in. Deciding bot/device at write time keeps read queries simple and fast. A configurable internal marker avoids hard-coding the team's own traffic signature.

**Alternatives considered**: A managed bot-detection service (e.g. Vercel BotID) — heavier than needed for analytics hygiene and adds a dependency; the UA list is sufficient for excluding obvious crawlers. Filtering bots only at query time by reparsing UA strings — slower and duplicates logic.

---

## R8 — Charting and CSV export

**Decision**: Reuse the existing Chart.js 4.4 + react-chartjs-2 stack for the funnel bar/step chart, the per-question drop-off chart, and the outcome distribution charts — rendered in small client components, fed by Server Component data or Route Handler responses. CSV export (`/api/admin/leads/export`) is generated server-side by streaming rows into RFC 4180 CSV text with a hand-rolled serialiser (proper quoting/escaping; no new dependency) and returned with `Content-Disposition: attachment`.

**Rationale**: Chart.js is already a project dependency and is used on the results page — no new charting library. A hand-rolled CSV serialiser avoids a dependency for a trivially small format and gives full control over quoting. Streaming keeps memory flat for wide date ranges (FR-039, SC-010).

**Alternatives considered**: Recharts/Visx — would add a second charting library. A CSV library (`papaparse`, `csv-stringify`) — unnecessary for write-only, well-understood output. Client-side CSV generation — would require shipping the full dataset to the browser.

---

## R9 — Date ranges and reporting timezone

**Decision**: A single fixed reporting timezone, agreed with the client and stored as a config constant (assumed the client's primary operating timezone; confirmed during clarification). All RPC functions accept an explicit range and compute day boundaries in that timezone. The dashboard date-range control offers presets (Last 7 / 30 / 90 days, This month, Last month, Custom) and defaults to Last 30 days. Headline funnel metrics also receive the immediately preceding equal-length range so the RPC can return current-vs-prior deltas (FR-042).

**Rationale**: A fixed timezone makes "today" and prior-period comparisons deterministic regardless of where a stakeholder is. Presets cover the overwhelming majority of executive questions; custom covers the rest. Computing the prior period in SQL alongside the current period avoids a second round trip.

**Alternatives considered**: Per-user timezone — adds preference storage and makes shared interpretation of numbers ambiguous. UTC-only — off-by-hours day boundaries that confuse non-technical stakeholders. Client-side date math — risks mismatch with server-side range filtering.

---

## R10 — Reconciling the submitted event with its assessment session

**Decision**: Add a nullable `anon_session_id` column to `assessment_sessions`. The assessment client passes its `anonSessionId` in the `POST /api/submit` body; the submit handler stores it on the inserted row. The client also emits an `assessment_submitted` event carrying the same id (and, once known, the resulting `result_id`). The funnel RPC therefore joins the event stream to completed sessions on `anon_session_id`, giving an end-to-end path: traffic source → questions reached → completion → lead, including the source of people who completed.

**Rationale**: A shared `anon_session_id` is the minimal change that links the anonymous funnel to the identified lead without putting PII in `assessment_events`. Storing it on `assessment_sessions` (rather than only on the event) makes the join indexable and survives even if the final event is lost on unload.

**Alternatives considered**: Matching on email + timestamp — fragile and pulls PII into the join. A server-issued session token at assessment start — would require a DB write on start (the spec explicitly avoids a DB record on start) and a cookie. Not linking at all — loses per-source completion rates (FR-030).

---

## Summary of resolved unknowns

| # | Question | Resolution |
|---|---|---|
| R1 | App Router Supabase Auth | `@supabase/ssr`, middleware-enforced |
| R2 | Allowlist mechanism | Disable sign-up; manual provisioning; `auth.users` *is* the allowlist |
| R3 | Anonymous id & consent | Ephemeral `sessionStorage` UUID, no PII; consent-independent (pending privacy review) |
| R4 | Event transport | `sendBeacon` + `keepalive` fetch fallback; errors swallowed |
| R5 | Aggregation | `SECURITY DEFINER` RPC functions over indexed tables |
| R6 | RLS / data access | Events insert-only; reads via RPC; `authenticated` SELECT on sessions/stats |
| R7 | Bot/spam/internal | Ingestion-time `is_bot`/`device_type`; speed floor; configurable internal marker |
| R8 | Charts & CSV | Reuse Chart.js; hand-rolled streamed CSV |
| R9 | Dates & timezone | Fixed reporting TZ; presets; default 30 days; SQL-computed prior period |
| R10 | Event ↔ session link | Shared `anon_session_id` column on `assessment_sessions` |

No `NEEDS CLARIFICATION` markers remain. Proceed to Phase 1.
