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
