-- Product CTA Cards (spec 009, US5) — per-product engagement aggregation.
--
-- get_product_engagement — impressions (shown), clicks, and CTR per product
-- code over a calendar-date range in the reporting timezone. Mirrors the
-- get_acquisition_breakdown pattern: SECURITY DEFINER, EXECUTE granted to the
-- authenticated role only. Bots excluded to match the other admin reports.

create or replace function public.get_product_engagement(
  p_from date,
  p_to date,
  p_tz text default 'UTC'
)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with ev as (
    select
      product_code as code,
      event_type
    from public.assessment_events
    where product_code is not null
      and event_type in ('product_cta_shown', 'product_cta_clicked')
      and not is_bot
      and (created_at at time zone p_tz)::date between p_from and p_to
  ),
  by_code as (
    select
      code,
      count(*) filter (where event_type = 'product_cta_shown') as shown,
      count(*) filter (where event_type = 'product_cta_clicked') as clicked
    from ev
    group by code
  )
  select coalesce((
    select jsonb_agg(jsonb_build_object(
      'code', code,
      'shown', shown,
      'clicked', clicked,
      'ctr', case when shown > 0 then round(clicked::numeric / shown, 4) else 0 end
    ) order by shown desc)
    from by_code
  ), '[]'::jsonb);
$$;

revoke execute on function public.get_product_engagement(date, date, text) from public;
grant execute on function public.get_product_engagement(date, date, text) to authenticated;
