-- ============================================================================
-- Worship Wheel — spec 009 Product CTA Cards migrations bundle
-- Paste into Supabase Studio SQL editor (project evclpfphooozslshuohf) and run.
-- Order: products table -> session product_codes -> CTA events -> engagement RPC.
-- Idempotent; safe to re-run. Excludes the unrelated started-beacon fix (already live).
-- ============================================================================

-- >>> migrations/20260622100000_products_table.sql
-- Product CTA Cards (spec 009, US1/US3) — products catalogue.
--
-- A product is a campaign-driven offer rendered on the results page when its
-- short `code` is passed in the traffic-source URL (?pr=<code>) and persisted
-- on the session. Rows are authored/edited self-serve in the admin dashboard;
-- the public results page reads active rows via the service-role client.
--
-- RLS posture (mirrors aggregate_stats / the 2026-05-19 sessions RLS fix):
--   - RLS enabled.
--   - `authenticated` (admin dashboard) may SELECT / INSERT / UPDATE.
--   - `anon` has NO policy => denied. The results page never queries this table
--     as anon; it reads through the service-role client (which bypasses RLS).
--   - No DELETE policy in v1 — deactivate via status='draft' to preserve the
--     analytics history of past campaigns.

create table if not exists public.products (
  id                uuid primary key default gen_random_uuid(),
  code              text not null,
  name              text not null,
  status            text not null default 'draft'
                      check (status in ('draft', 'active')),
  headline          text not null,
  sub_headline      text,
  video_url         text,
  eyebrow           text not null,
  cta_headline      text not null,
  cta_copy          text not null,
  cta_button_label  text not null,
  cta_button_url    text not null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- The code is the public handle dropped into ?pr= — must be unique.
create unique index if not exists products_code_key on public.products (code);

-- The results page resolves active products by code; index the hot path.
create index if not exists products_active_idx
  on public.products (code)
  where status = 'active';

alter table public.products enable row level security;

create policy "products_select_authenticated"
  on public.products for select to authenticated using (true);

create policy "products_insert_authenticated"
  on public.products for insert to authenticated with check (true);

create policy "products_update_authenticated"
  on public.products for update to authenticated using (true) with check (true);

-- >>> migrations/20260622100100_session_product_codes.sql
-- Product CTA Cards (spec 009, US2) — persist campaign product codes per session.
--
-- The `?pr=<code>` value(s) are captured at first page load and written here on
-- assessment submit, so the results page renders the right product(s) even
-- though the canonical /results/[id] URL carries no query string. Ordered,
-- de-duplicated, capped at 3 (research R2). Mirrors the existing
-- weakest_elements / strongest_elements text[] columns.
--
-- Purely additive: NULL on existing rows => no product card (current behaviour).

alter table public.assessment_sessions
  add column if not exists product_codes text[];

-- >>> migrations/20260622100200_product_cta_events.sql
-- Product CTA Cards (spec 009, US5) — per-product engagement events.
--
-- Adds two funnel event types and a product_code column so the results page can
-- record impressions/clicks per product, surfaced in the admin Products list.
-- Drop-and-recreate is the only way to extend a CHECK constraint's allowed set;
-- additive (no existing rows become invalid).

alter table public.assessment_events
  drop constraint if exists assessment_events_event_type_check;

alter table public.assessment_events
  add constraint assessment_events_event_type_check
  check (event_type in (
    'page_view',
    'assessment_started',
    'question_viewed',
    'question_answered',
    'assessment_submitted',
    'pdf_downloaded',
    'product_cta_shown',
    'product_cta_clicked'
  ));

-- Set only on the two product events; NULL for all other event types.
alter table public.assessment_events
  add column if not exists product_code text;

create index if not exists assessment_events_product_code_idx
  on public.assessment_events (product_code)
  where product_code is not null;

-- >>> migrations/20260622100300_product_engagement_rpc.sql
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

