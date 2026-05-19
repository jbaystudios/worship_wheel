-- Admin dashboard outcomes RPC (spec 005, US4 / task T042)
-- Spec: specs/005-admin-dashboard/data-model.md
--
-- get_outcomes_summary — archetype + score-band distributions, average score
-- per element, device split, and completion-time stats. Reads completed
-- assessments from assessment_sessions and device data from assessment_events.
-- SECURITY DEFINER; EXECUTE granted to the authenticated role only.

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
      -- exclude implausibly fast (spam) completions
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
