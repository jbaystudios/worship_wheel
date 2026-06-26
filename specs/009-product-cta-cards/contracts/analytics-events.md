# Contract: Product CTA Analytics Events

Extends the existing event pipeline (`src/lib/events/*`, `/api/events`, `assessment_events`) — no new transport.

## 1. New event types

Add to `EVENT_TYPES` in `src/lib/events/schema.ts`:

```ts
export const EVENT_TYPES = [
  'page_view', 'assessment_started', 'question_viewed', 'question_answered',
  'assessment_submitted', 'pdf_downloaded',
  'product_cta_shown',     // NEW
  'product_cta_clicked',   // NEW
] as const;
```

And add an optional field to `eventPayloadSchema`:

```ts
productCode: z.string().regex(/^[a-z0-9]{3,6}$/).optional(),
```

DB: new migration adds the two values to the `assessment_events.event_type` check constraint and a nullable `product_code text` column (data-model §3). `/api/events` maps `productCode` → `product_code` on insert (alongside existing fields).

## 2. Tracker wrappers

`src/lib/events/tracker.ts` — extend `TrackOptions` with `productCode?: string`, include it in the payload when present, and add convenience wrappers:

```ts
export const trackProductCtaShown = (productCode: string) =>
  trackEvent('product_cta_shown', { productCode });

export const trackProductCtaClicked = (productCode: string) =>
  trackEvent('product_cta_clicked', { productCode });
```

GA4 mirroring: `sendToGa4` already fires per event; both new types flow through with `productCode` as an event param (no consent gating in v1, consistent with current GA4 setup).

## 3. Firing points (`ProductCard.tsx`, client)

- **shown**: once on mount (guard against double-fire in React strict/dev with a ref), `trackProductCtaShown(product.code)`.
- **clicked**: on CTA button click, `trackProductCtaClicked(product.code)` then navigate to `ctaButtonUrl`. Click tracking must not block or delay navigation (fire-and-forget `post`, consistent with existing tracker).

## 4. Reporting

RPC `get_product_engagement(p_from, p_to, p_tz)` → `{ code, shown, clicked, ctr }` per `product_code` (data-model §5). Surfaced as columns on the admin Products list for the selected date range (R8). One impression = one `product_cta_shown` row (per session view); CTR = clicked / shown.

## Acceptance mapping

| Requirement | Covered by |
|---|---|
| FR-019 (shown/clicked recorded with code + session) | §2, §3 + `anon_session_id` already on every event |
| FR-020 (admin sees impressions/clicks/CTR per product) | §4 RPC + Products list columns |
| US5 scenarios 1–3 | §3 firing points + §4 reporting |
