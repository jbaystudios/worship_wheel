# Phase 1 Data Model: Worship Wheel Admin Dashboard

**Feature**: `005-admin-dashboard` | **Date**: 2026-05-19 | **Plan**: [plan.md](./plan.md)

This feature adds one new table (`assessment_events`), one column to an existing table, new RLS policies, and a set of read-only RPC functions. Dashboard accounts live in Supabase Auth (`auth.users`).

---

## 1. assessment_events *(new table)*

The first-party funnel event log. Anonymous — **contains no PII**. One row per tracked interaction in the assessment flow.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, default `gen_random_uuid()` | Unique event id |
| created_at | TIMESTAMPTZ | NOT NULL, default `now()` | Server receipt time (authoritative for reporting) |
| client_ts | TIMESTAMPTZ | | Client-reported event time (for time-on-question math; never trusted for range filtering) |
| anon_session_id | UUID | NOT NULL | Ephemeral per-browser-session id (see research R3) |
| event_type | TEXT | NOT NULL, CHECK in enum below | Funnel event type |
| question_id | TEXT | | Question id (e.g. `fb_01`) — for `question_viewed` / `question_answered` |
| question_position | SMALLINT | CHECK (1–24) | 1-based question order — for question events |
| utm_source | TEXT | | First-event-only acquisition context |
| utm_medium | TEXT | | First-event-only acquisition context |
| utm_campaign | TEXT | | First-event-only acquisition context |
| utm_term | TEXT | | First-event-only acquisition context |
| utm_content | TEXT | | First-event-only acquisition context |
| referrer_domain | TEXT | | Parsed host of `document.referrer` (host only, not full URL) |
| landing_path | TEXT | | Path of the session's entry page |
| device_type | TEXT | CHECK in (`mobile`,`tablet`,`desktop`,`unknown`) | Derived from User-Agent at ingestion |
| is_bot | BOOLEAN | NOT NULL, default `false` | Set true at ingestion when UA matches a known-bot pattern |
| result_id | UUID | FK → `assessment_sessions(id)`, nullable | Set on `assessment_submitted` once the session row exists |

**event_type enum**: `page_view`, `assessment_started`, `question_viewed`, `question_answered`, `assessment_submitted`.

**Indexes**:
- `idx_events_created_at` on `(created_at)` — date-range filtering
- `idx_events_session` on `(anon_session_id)` — per-session path reconstruction
- `idx_events_type_position` on `(event_type, question_position)` — drop-off aggregation
- `idx_events_result` on `(result_id)` WHERE `result_id IS NOT NULL` — funnel ↔ session join

**RLS policies**:
- `INSERT`: allowed for `anon` and `authenticated` (public ingestion endpoint). Insert is validated by the endpoint's Zod schema before reaching the table.
- `SELECT` / `UPDATE` / `DELETE`: **denied for all client roles.** All reads occur through `SECURITY DEFINER` RPC functions.

**Validation rules** (enforced in the `/api/events` Zod schema, see contracts/events-api.md):
- `event_type` must be one of the enum values.
- `question_id` and `question_position` are required when `event_type` is `question_viewed` or `question_answered`, and forbidden otherwise.
- UTM/referrer/landing fields are accepted on any event but expected only on the first event of a session.
- `anon_session_id` must be a valid UUID.

**Retention**: anonymous, non-PII operational data; no fixed retention requirement in this scope. A pruning policy (e.g. drop raw events older than 24 months once rolled into `aggregate_stats`) may be added later.

---

## 2. assessment_sessions *(existing table — modified)*

One new column links a completed assessment back to its anonymous funnel path.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| anon_session_id | UUID | nullable | **NEW** — the `anon_session_id` of the browser session that produced this completion. Populated by `/api/submit` from the request body. |

**Index**: `idx_sessions_anon_session` on `(anon_session_id)` WHERE `anon_session_id IS NOT NULL` — funnel join.

**RLS policy change**: add a policy granting the `authenticated` role `SELECT` on all rows (for the Leads and Outcomes views). Existing policies retained: public `INSERT`, public `SELECT` by `id`. No client `UPDATE`/`DELETE`.

All other columns are unchanged from spec 001's data model (PII, scores, archetype, UTM, `completion_time_seconds`, `keap_sync_status`, `keap_sync_error`, `keap_synced_at`).

---

## 3. aggregate_stats *(existing table — RLS change only)*

No schema change. **RLS policy change**: add a policy granting the `authenticated` role `SELECT`. The Outcomes view may read daily rollups from here instead of recomputing from `assessment_sessions` where a needed figure already exists.

---

## 4. auth.users *(Supabase Auth — managed)*

Dashboard accounts. Managed by Supabase Auth, not defined by this feature's migration.

- Public sign-up is **disabled** at the project level.
- Each row is a stakeholder provisioned manually by an administrator. The set of rows **is** the access allowlist (research R2).
- All accounts are functionally equivalent — a single shared admin role; no custom `role` claim or `app_metadata` tiering in this scope.

---

## 5. RPC functions *(new — read-only aggregation)*

All are `SECURITY DEFINER`, owned by a privileged role, with `EXECUTE` granted only to `authenticated`. Each accepts a date range and the reporting timezone, excludes `is_bot` rows and implausibly-fast sessions by default, and accepts an `include_internal` flag.

| Function | Inputs | Returns (shape) |
|---|---|---|
| `get_funnel_summary(range_start, range_end, tz, include_internal)` | date range | Counts + conversion rates for Visitors → Started → Completed → Lead, plus the same for the preceding equal-length period for delta calculation |
| `get_question_dropoff(range_start, range_end, tz, include_internal)` | date range | Per question (position 1–24): sessions reached, drop-off to next, median & average time-on-question; a `sticking_point` boolean (above-average abandonment AND above-average dwell) |
| `get_acquisition_breakdown(range_start, range_end, tz, include_internal)` | date range | Per source (UTM source/medium/campaign, else referrer domain, else `Direct`): visits, started-rate, completion rate, lead-capture rate; plus top landing paths |
| `get_outcomes_summary(range_start, range_end, tz, include_internal)` | date range | Archetype distribution, score-band distribution, average score per element (8), device split, average & median completion time |

The Leads table and Keap sync-health panel do **not** use RPCs — they `SELECT` directly from `assessment_sessions` under the new `authenticated` RLS policy (paginated/searched/filtered in the Route Handler).

---

## Entity Relationships

```text
auth.users (Supabase Auth)
  └── authenticates → dashboard access (single role, manual provisioning)

assessment_events  (anonymous, no PII)
  ├── grouped by anon_session_id            → one visitor's funnel path
  ├── question_id / question_position       → references questions config (src/data/questions.json)
  └── result_id ─┐
                 ▼
assessment_sessions (PII + scores)          ← also linked by shared anon_session_id
  └── feeds → aggregate_stats (existing daily rollup trigger)

RPC functions  read  assessment_events (+ join assessment_sessions)  → dashboard views
Leads / Sync-health  read  assessment_sessions directly             → dashboard views
```

## Funnel Step Definitions *(authoritative — used by `get_funnel_summary`)*

| Step | Definition (distinct `anon_session_id`, non-bot, in range) |
|---|---|
| Visitors | sessions with at least one `page_view` event for the assessment flow |
| Started | sessions with an `assessment_started` event |
| Completed | sessions reaching a `question_viewed` for the final question **and** not abandoned (i.e. reached question 24) — distinct from email submission |
| Lead Captured | sessions with an `assessment_submitted` event that reconciles to an `assessment_sessions` row with a non-bot, plausible completion time |

"Submitted email" and "completed all questions" are reported as separate steps so an email-gate drop-off is distinguishable from in-question drop-off (FR-028).

## State / Lifecycle Notes

- `assessment_events` rows are **append-only** — never updated or deleted by application code (the lone exception is the `result_id` backfill on submission, performed server-side by `/api/submit` or the events endpoint, not by clients).
- An abandoned session simply stops emitting events; its furthest `question_viewed` defines its drop-off point. No terminal "abandoned" event is required.
- `anon_session_id` does not persist across browser sessions; a retake or a return after tab close is, by definition, a new funnel session (spec Assumption: funnel counts unique sessions, not unique people).
