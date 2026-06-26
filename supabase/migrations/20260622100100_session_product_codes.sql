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
