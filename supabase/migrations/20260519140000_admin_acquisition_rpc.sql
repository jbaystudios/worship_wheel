-- Admin dashboard acquisition RPC (spec 005, US3 / task T037)
-- Spec: specs/005-admin-dashboard/data-model.md
--
-- get_acquisition_breakdown — per-source visit + conversion counts and top
-- landing paths. Source attribution waterfall: UTM tags -> referrer domain
-- (excluding the site's own host) -> "Direct". SECURITY DEFINER; EXECUTE
-- granted to the authenticated role only.

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
