-- Make the funnel/acquisition "Started" metric resilient to a dropped
-- assessment_started beacon (ops finding 2026-06-23).
--
-- PROBLEM: "Started" was defined as `bool_or(event_type='assessment_started')`.
-- That event fires exactly ONCE per session (client-side, best-effort
-- navigator.sendBeacon, no retry — see src/app/assessment/page.tsx). When that
-- single beacon is dropped, a session that demonstrably progressed (answered
-- questions, completed, became a lead) shows Started=0 — producing an impossible
-- funnel (e.g. Completed=1 > Started=0, observed for a real lead).
--
-- FIX: a session that ANSWERED ANY QUESTION has self-evidently started. Define
-- started as having `assessment_started` OR any `question_answered` event. This
-- removes the dependence on one fragile beacon and retroactively corrects past
-- ranges. Pure create-or-replace; no schema/data change. Existing EXECUTE grants
-- are preserved by create-or-replace (re-stated below to match the originals).

-- ---------------------------------------------------------------------------
-- get_funnel_summary  (only the `started` definition changes)
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
      bool_or(event_type in ('assessment_started', 'question_answered')) as started,
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
-- get_acquisition_breakdown  (same `started` resilience, per-source)
-- ---------------------------------------------------------------------------
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
      bool_or(event_type in ('assessment_started', 'question_answered')) as started,
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

-- Re-state grants (create-or-replace preserves them; explicit for clarity).
revoke execute on function public.get_funnel_summary(date, date, text, boolean, text) from public;
grant execute on function public.get_funnel_summary(date, date, text, boolean, text) to authenticated;
revoke execute on function
  public.get_acquisition_breakdown(date, date, text, boolean, text, text) from public;
grant execute on function
  public.get_acquisition_breakdown(date, date, text, boolean, text, text) to authenticated;
