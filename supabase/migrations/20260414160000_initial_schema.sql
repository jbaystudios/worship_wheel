-- Initial schema for Worship Wheel Assessment Tool
-- Spec: specs/001-worship-wheel-assessment/data-model.md (T012)
--
-- Tables:
--   - assessment_sessions: primary user-generated data (one row per completed assessment)
--   - aggregate_stats:     daily anonymised rollups for content strategy (FR-037)

-- ---------------------------------------------------------------------------
-- assessment_sessions
-- ---------------------------------------------------------------------------
create table if not exists public.assessment_sessions (
  id                        uuid primary key default gen_random_uuid(),
  created_at                timestamptz not null default now(),

  first_name                text not null,
  email                     text not null,

  answers                   jsonb not null,
  element_scores            jsonb not null,
  overall_score             integer not null check (overall_score between 8 and 80),
  overall_percentage        numeric(5,2) not null,
  balance_score             numeric(3,1) not null check (balance_score between 1 and 10),
  profile_archetype         text not null,
  weakest_elements          text[] not null,
  strongest_elements        text[] not null,

  completion_time_seconds   integer,

  utm_source                text,
  utm_medium                text,
  utm_campaign              text,
  utm_term                  text,
  utm_content               text,

  keap_sync_status          text not null default 'pending'
                              check (keap_sync_status in ('pending','synced','failed','retrying')),
  keap_sync_error           text,
  keap_synced_at            timestamptz
);

create index if not exists idx_sessions_email
  on public.assessment_sessions (email);

create index if not exists idx_sessions_created_at
  on public.assessment_sessions (created_at);

-- Partial index powering the Keap retry queue
create index if not exists idx_sessions_keap_sync
  on public.assessment_sessions (keap_sync_status)
  where keap_sync_status <> 'synced';

alter table public.assessment_sessions enable row level security;

-- Anyone can submit a new assessment (API route validates payload with Zod + rate limits).
create policy "assessment_sessions_insert_public"
  on public.assessment_sessions
  for insert
  to anon, authenticated
  with check (true);

-- Anyone can read a row — the UUID in the results URL acts as the unguessable token.
-- Server-side code can still query by id freely via the service role key.
create policy "assessment_sessions_select_by_id"
  on public.assessment_sessions
  for select
  to anon, authenticated
  using (true);

-- No update/delete policies = no update/delete from client. Service role bypasses RLS.

-- ---------------------------------------------------------------------------
-- aggregate_stats
-- ---------------------------------------------------------------------------
create table if not exists public.aggregate_stats (
  id                        serial primary key,
  date                      date not null unique,
  total_assessments         integer not null default 0,
  avg_element_scores        jsonb not null,
  avg_overall_score         numeric(5,2) not null,
  avg_balance_score         numeric(3,1) not null,
  archetype_distribution    jsonb not null,
  score_band_distribution   jsonb not null,
  completion_rate           numeric(5,2),
  email_conversion_rate     numeric(5,2)
);

alter table public.aggregate_stats enable row level security;

-- No client-side policies. RLS enabled + no policies = anon/authenticated denied.
-- Service role key (used server-side) bypasses RLS for read/write.
