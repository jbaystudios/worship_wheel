-- Admin dashboard funnel RPC functions (spec 005, US2 / task T030)
-- Spec: specs/005-admin-dashboard/data-model.md (RPC functions)
--
-- get_funnel_summary   — Visitors -> Started -> Completed -> Lead counts,
--                        for the requested range and the preceding equal-length period.
-- get_question_dropoff — per-question reach + time-on-question (positions 1-24).
--
-- Both are SECURITY DEFINER (read assessment_events, which has no client SELECT
-- policy) and EXECUTE is granted to the `authenticated` role only.
--
-- A session is attributed to the calendar date of its first event ("cohort
-- date") in the reporting timezone, so a session that crosses midnight is
-- counted whole on one day. Bots and (optionally) internal traffic are excluded.

-- ---------------------------------------------------------------------------
-- get_funnel_summary
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- get_question_dropoff
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- Grants — SECURITY DEFINER functions default to EXECUTE for PUBLIC; restrict
-- to the authenticated (dashboard) role only.
-- ---------------------------------------------------------------------------
revoke execute on function public.get_funnel_summary(date, date, text, boolean, text) from public;
revoke execute on function public.get_question_dropoff(date, date, text, boolean, text) from public;
grant execute on function public.get_funnel_summary(date, date, text, boolean, text) to authenticated;
grant execute on function public.get_question_dropoff(date, date, text, boolean, text) to authenticated;
