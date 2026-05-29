-- ============================================================================
-- Worship Wheel — all migrations bundled for paste into Supabase Studio SQL editor
-- Project: evclpfphooozslshuohf
-- Order matches supabase/migrations/ filenames; safe to run on a fresh DB.
-- ============================================================================


-- ============================================================================
-- 20260414160000_initial_schema.sql
-- ============================================================================

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
drop policy if exists "assessment_sessions_insert_public" on public.assessment_sessions;
create policy "assessment_sessions_insert_public"
  on public.assessment_sessions
  for insert
  to anon, authenticated
  with check (true);

-- Anyone can read a row — the UUID in the results URL acts as the unguessable token.
-- Server-side code can still query by id freely via the service role key.
drop policy if exists "assessment_sessions_select_by_id" on public.assessment_sessions;
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


-- ============================================================================
-- 20260519120000_admin_dashboard_schema.sql
-- ============================================================================

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
drop policy if exists "assessment_events_insert_public" on public.assessment_events;
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

-- ---------------------------------------------------------------------------
-- aggregate_stats: allow the authenticated (dashboard) role to read daily rollups
-- ---------------------------------------------------------------------------
drop policy if exists "aggregate_stats_select_authenticated" on public.aggregate_stats;
create policy "aggregate_stats_select_authenticated"
  on public.aggregate_stats
  for select
  to authenticated
  using (true);


-- ============================================================================
-- 20260519121000_fix_assessment_sessions_rls.sql
-- ============================================================================

-- Security fix: tighten assessment_sessions SELECT policy (spec 005 hand-off)
-- Removes the over-permissive anon read of all leads; keeps authenticated read.

drop policy if exists "assessment_sessions_select_by_id"
  on public.assessment_sessions;

drop policy if exists "assessment_sessions_select_authenticated" on public.assessment_sessions;
create policy "assessment_sessions_select_authenticated"
  on public.assessment_sessions
  for select
  to authenticated
  using (true);


-- ============================================================================
-- 20260519130000_admin_funnel_rpc.sql
-- ============================================================================

-- Admin dashboard funnel RPC functions (spec 005, US2 / task T030)
-- get_funnel_summary + get_question_dropoff. SECURITY DEFINER; authenticated only.

create or replace function public.get_funnel_summary(
  p_from date,
  p_to date,
  p_tz text default 'UTC',
  p_include_internal boolean default false,
  p_internal_marker text default 'internal'
)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with prev as (
    select
      (p_from - ((p_to - p_from) + 1))::date as pf,
      (p_from - 1)::date as pt
  ),
  sess as (
    select
      anon_session_id,
      min((created_at at time zone p_tz)::date) as cohort_date,
      bool_or(is_bot) as is_bot,
      max(utm_source) filter (where utm_source is not null) as utm_source,
      bool_or(event_type = 'assessment_started') as started,
      bool_or(event_type = 'question_viewed' and question_position = 24) as completed,
      bool_or(event_type = 'assessment_submitted') as submitted
    from public.assessment_events
    group by anon_session_id
  ),
  filtered as (
    select *
    from sess
    where not is_bot
      and (p_include_internal or utm_source is distinct from p_internal_marker)
  ),
  cur as (
    select
      count(*) as visitors,
      count(*) filter (where started) as started,
      count(*) filter (where completed) as completed,
      count(*) filter (where submitted) as lead_captured
    from filtered
    where cohort_date between p_from and p_to
  ),
  prv as (
    select
      count(*) as visitors,
      count(*) filter (where started) as started,
      count(*) filter (where completed) as completed,
      count(*) filter (where submitted) as lead_captured
    from filtered, prev
    where cohort_date between prev.pf and prev.pt
  )
  select jsonb_build_object(
    'current', (
      select jsonb_build_object(
        'visitors', visitors, 'started', started,
        'completed', completed, 'leadCaptured', lead_captured
      ) from cur
    ),
    'previous', (
      select jsonb_build_object(
        'visitors', visitors, 'started', started,
        'completed', completed, 'leadCaptured', lead_captured
      ) from prv
    )
  );
$$;

create or replace function public.get_question_dropoff(
  p_from date,
  p_to date,
  p_tz text default 'UTC',
  p_include_internal boolean default false,
  p_internal_marker text default 'internal'
)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with sess as (
    select
      anon_session_id,
      min((created_at at time zone p_tz)::date) as cohort_date,
      bool_or(is_bot) as is_bot,
      max(utm_source) filter (where utm_source is not null) as utm_source
    from public.assessment_events
    group by anon_session_id
  ),
  in_range as (
    select anon_session_id
    from sess
    where not is_bot
      and cohort_date between p_from and p_to
      and (p_include_internal or utm_source is distinct from p_internal_marker)
  ),
  q_viewed as (
    select e.anon_session_id, e.question_position,
           min(coalesce(e.client_ts, e.created_at)) as viewed_at
    from public.assessment_events e
    join in_range r on r.anon_session_id = e.anon_session_id
    where e.event_type = 'question_viewed' and e.question_position is not null
    group by e.anon_session_id, e.question_position
  ),
  q_answered as (
    select e.anon_session_id, e.question_position,
           min(coalesce(e.client_ts, e.created_at)) as answered_at
    from public.assessment_events e
    join in_range r on r.anon_session_id = e.anon_session_id
    where e.event_type = 'question_answered' and e.question_position is not null
    group by e.anon_session_id, e.question_position
  ),
  reached as (
    select question_position as position, count(*) as reached
    from q_viewed
    group by question_position
  ),
  dwell as (
    select v.question_position as position,
           extract(epoch from (a.answered_at - v.viewed_at)) as seconds
    from q_viewed v
    join q_answered a
      on a.anon_session_id = v.anon_session_id
     and a.question_position = v.question_position
    where a.answered_at >= v.viewed_at
  ),
  dwell_stats as (
    select position,
           percentile_cont(0.5) within group (order by seconds) as median_s,
           avg(seconds) as avg_s
    from dwell
    group by position
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'position', gs.position,
        'reached', coalesce(r.reached, 0),
        'medianTimeSeconds', coalesce(round(ds.median_s::numeric, 1), 0),
        'avgTimeSeconds', coalesce(round(ds.avg_s::numeric, 1), 0)
      )
      order by gs.position
    ),
    '[]'::jsonb
  )
  from generate_series(1, 24) as gs(position)
  left join reached r on r.position = gs.position
  left join dwell_stats ds on ds.position = gs.position;
$$;

revoke execute on function public.get_funnel_summary(date, date, text, boolean, text) from public;
revoke execute on function public.get_question_dropoff(date, date, text, boolean, text) from public;
grant execute on function public.get_funnel_summary(date, date, text, boolean, text) to authenticated;
grant execute on function public.get_question_dropoff(date, date, text, boolean, text) to authenticated;


-- ============================================================================
-- 20260519140000_admin_acquisition_rpc.sql
-- ============================================================================

create or replace function public.get_acquisition_breakdown(
  p_from date,
  p_to date,
  p_tz text default 'UTC',
  p_include_internal boolean default false,
  p_internal_marker text default 'internal',
  p_self_host text default ''
)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with sess as (
    select
      anon_session_id,
      min((created_at at time zone p_tz)::date) as cohort_date,
      bool_or(is_bot) as is_bot,
      max(utm_source) filter (where utm_source is not null) as utm_source,
      max(utm_medium) filter (where utm_medium is not null) as utm_medium,
      max(utm_campaign) filter (where utm_campaign is not null) as utm_campaign,
      max(referrer_domain) filter (where referrer_domain is not null) as referrer_domain,
      max(landing_path) filter (where landing_path is not null) as landing_path,
      bool_or(event_type = 'assessment_started') as started,
      bool_or(event_type = 'question_viewed' and question_position = 24) as completed,
      bool_or(event_type = 'assessment_submitted') as submitted
    from public.assessment_events
    group by anon_session_id
  ),
  filtered as (
    select
      *,
      case
        when utm_source is not null then 'utm'
        when referrer_domain is not null
          and (p_self_host = '' or referrer_domain <> p_self_host) then 'referrer'
        else 'direct'
      end as source_kind,
      case
        when utm_source is not null then
          utm_source
          || case when utm_medium is not null then ' / ' || utm_medium else '' end
        when referrer_domain is not null
          and (p_self_host = '' or referrer_domain <> p_self_host) then referrer_domain
        else 'Direct'
      end as source_label
    from sess
    where not is_bot
      and cohort_date between p_from and p_to
      and (p_include_internal or utm_source is distinct from p_internal_marker)
  ),
  by_source as (
    select
      source_label,
      source_kind,
      max(utm_campaign) as campaign,
      count(*) as visits,
      count(*) filter (where started) as started,
      count(*) filter (where completed) as completed,
      count(*) filter (where submitted) as leads
    from filtered
    group by source_label, source_kind
  ),
  by_landing as (
    select coalesce(landing_path, '(unknown)') as path, count(*) as visits
    from filtered
    group by coalesce(landing_path, '(unknown)')
    order by visits desc
    limit 10
  )
  select jsonb_build_object(
    'sources', coalesce((
      select jsonb_agg(jsonb_build_object(
        'source', source_label,
        'kind', source_kind,
        'campaign', campaign,
        'visits', visits,
        'started', started,
        'completed', completed,
        'leads', leads
      ) order by visits desc)
      from by_source
    ), '[]'::jsonb),
    'landingPaths', coalesce((
      select jsonb_agg(jsonb_build_object('path', path, 'visits', visits)
        order by visits desc)
      from by_landing
    ), '[]'::jsonb)
  );
$$;

revoke execute on function
  public.get_acquisition_breakdown(date, date, text, boolean, text, text) from public;
grant execute on function
  public.get_acquisition_breakdown(date, date, text, boolean, text, text) to authenticated;


-- ============================================================================
-- 20260519150000_admin_outcomes_rpc.sql
-- ============================================================================

create or replace function public.get_outcomes_summary(
  p_from date,
  p_to date,
  p_tz text default 'UTC',
  p_include_internal boolean default false,
  p_internal_marker text default 'internal',
  p_min_completion_seconds integer default 20
)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with sessions as (
    select *
    from public.assessment_sessions
    where (created_at at time zone p_tz)::date between p_from and p_to
      and (p_include_internal or utm_source is distinct from p_internal_marker)
      and (completion_time_seconds is null
           or completion_time_seconds >= p_min_completion_seconds)
  ),
  archetypes as (
    select profile_archetype as archetype, count(*) as count
    from sessions
    group by profile_archetype
  ),
  bands as (
    select
      case
        when overall_score between 8 and 25 then '8-25'
        when overall_score between 26 and 40 then '26-40'
        when overall_score between 41 and 55 then '41-55'
        else '56-80'
      end as band,
      count(*) as count
    from sessions
    group by 1
  ),
  elements as (
    select e.code, avg((s.element_scores ->> e.code)::numeric) as avg_score
    from sessions s
    cross join (values ('FB'), ('HM'), ('ML'), ('RH'),
                       ('TO'), ('TH'), ('TE'), ('AU')) as e(code)
    group by e.code
  ),
  ev_sess as (
    select
      anon_session_id,
      min((created_at at time zone p_tz)::date) as cohort_date,
      bool_or(is_bot) as is_bot,
      max(utm_source) filter (where utm_source is not null) as utm_source,
      max(device_type) as device_type,
      bool_or(event_type = 'assessment_submitted') as submitted
    from public.assessment_events
    group by anon_session_id
  ),
  devices as (
    select
      device_type as device,
      count(*) as visitors,
      count(*) filter (where submitted) as completers
    from ev_sess
    where not is_bot
      and cohort_date between p_from and p_to
      and (p_include_internal or utm_source is distinct from p_internal_marker)
    group by device_type
  ),
  ctime as (
    select
      coalesce(round(avg(completion_time_seconds))::int, 0) as avg_s,
      coalesce(
        round(percentile_cont(0.5) within group (order by completion_time_seconds))::int,
        0
      ) as median_s
    from sessions
    where completion_time_seconds is not null
  )
  select jsonb_build_object(
    'completers', (select count(*) from sessions),
    'archetypeDistribution', coalesce((
      select jsonb_agg(jsonb_build_object('archetype', archetype, 'count', count)
        order by count desc)
      from archetypes
    ), '[]'::jsonb),
    'scoreBandDistribution', coalesce((
      select jsonb_agg(jsonb_build_object('band', band, 'count', count))
      from bands
    ), '[]'::jsonb),
    'elementAverages', coalesce((
      select jsonb_agg(jsonb_build_object(
        'code', code, 'avgScore', round(coalesce(avg_score, 0), 1)))
      from elements
    ), '[]'::jsonb),
    'deviceSplit', coalesce((
      select jsonb_agg(jsonb_build_object(
        'device', device, 'visitors', visitors, 'completers', completers))
      from devices
    ), '[]'::jsonb),
    'completionTime', (
      select jsonb_build_object('avgSeconds', avg_s, 'medianSeconds', median_s)
      from ctime
    )
  );
$$;

revoke execute on function
  public.get_outcomes_summary(date, date, text, boolean, text, integer) from public;
grant execute on function
  public.get_outcomes_summary(date, date, text, boolean, text, integer) to authenticated;
