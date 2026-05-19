-- Admin Dashboard schema (spec 005)
-- Spec: specs/005-admin-dashboard/data-model.md
--
-- Adds:
--   - assessment_events:   first-party, anonymous funnel event log (no PII)
--   - assessment_sessions: new anon_session_id column linking a completion to its funnel path
--   - aggregate_stats:     authenticated-role SELECT policy for the dashboard Outcomes view
--
-- RPC functions (get_funnel_summary, get_question_dropoff, get_acquisition_breakdown,
-- get_outcomes_summary) ship in separate per-story migrations (tasks T030, T037, T042).

-- ---------------------------------------------------------------------------
-- assessment_events
-- ---------------------------------------------------------------------------
-- One row per tracked interaction in the assessment flow. Anonymous: no name,
-- no email, no IP, no persistent identifier. anon_session_id is ephemeral
-- (sessionStorage, cleared on tab close) and cannot track a person across visits.
create table if not exists public.assessment_events (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz not null default now(),
  client_ts           timestamptz,

  anon_session_id     uuid not null,

  event_type          text not null
                        check (event_type in (
                          'page_view',
                          'assessment_started',
                          'question_viewed',
                          'question_answered',
                          'assessment_submitted'
                        )),

  question_id         text,
  question_position   smallint check (question_position between 1 and 24),

  utm_source          text,
  utm_medium          text,
  utm_campaign        text,
  utm_term            text,
  utm_content         text,
  referrer_domain     text,
  landing_path        text,

  device_type         text not null default 'unknown'
                        check (device_type in ('mobile','tablet','desktop','unknown')),
  is_bot              boolean not null default false,

  result_id           uuid references public.assessment_sessions (id)
);

-- Date-range filtering for every dashboard view
create index if not exists idx_events_created_at
  on public.assessment_events (created_at);

-- Per-session funnel-path reconstruction
create index if not exists idx_events_session
  on public.assessment_events (anon_session_id);

-- Per-question drop-off aggregation
create index if not exists idx_events_type_position
  on public.assessment_events (event_type, question_position);

-- Funnel <-> completed-session join
create index if not exists idx_events_result
  on public.assessment_events (result_id)
  where result_id is not null;

alter table public.assessment_events enable row level security;

-- Public ingestion: the /api/events route Zod-validates every payload before insert.
create policy "assessment_events_insert_public"
  on public.assessment_events
  for insert
  to anon, authenticated
  with check (true);

-- No SELECT / UPDATE / DELETE policies = denied for anon and authenticated.
-- All reads happen through SECURITY DEFINER RPC functions; the result_id backfill
-- on submission is performed server-side via the service role key (bypasses RLS).

-- ---------------------------------------------------------------------------
-- assessment_sessions: link a completed assessment to its anonymous funnel path
-- ---------------------------------------------------------------------------
alter table public.assessment_sessions
  add column if not exists anon_session_id uuid;

create index if not exists idx_sessions_anon_session
  on public.assessment_sessions (anon_session_id)
  where anon_session_id is not null;

-- NOTE: the existing "assessment_sessions_select_by_id" policy is
--   for select to anon, authenticated using (true)
-- which already grants the authenticated (dashboard) role full SELECT, so no
-- additional SELECT policy is needed here for the Leads/Outcomes views.
-- SECURITY REVIEW FLAG: that same policy also grants the anon role full SELECT
-- of all rows (including first_name / email PII) — the policy name implies an
-- id-scoped lookup but `using (true)` does not enforce one. This predates spec
-- 005 and should be tightened in a dedicated migration (see spec 005 hand-off
-- notes); it is intentionally left unchanged here to avoid altering the public
-- results-page behaviour outside this feature's scope.

-- ---------------------------------------------------------------------------
-- aggregate_stats: allow the authenticated (dashboard) role to read daily rollups
-- ---------------------------------------------------------------------------
create policy "aggregate_stats_select_authenticated"
  on public.aggregate_stats
  for select
  to authenticated
  using (true);
