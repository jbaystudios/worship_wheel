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
