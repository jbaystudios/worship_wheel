# Phase 1 Data Model: Product CTA Cards

All changes are Supabase Postgres migrations under `supabase/migrations/` (naming: `YYYYMMDDHHMMSS_*.sql`). Field names follow the existing snake_case convention; the app maps to camelCase at the boundary (as `assessment_sessions` already does).

---

## 1. New table: `products`

One row per promotable offer. Created/edited via the admin; read by the results page (service-role).

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `code` | `text` | **unique**, not null | Short opaque code (3–6 chars `[a-z0-9]`). The value placed in `?pr=`. |
| `name` | `text` | not null | Internal label for the admin list (not shown to visitors). |
| `status` | `text` | not null, default `'draft'`, check `in ('draft','active')` | Only `active` renders on results. |
| `headline` | `text` | not null | Card headline (product-owned; not the archetype name). |
| `sub_headline` | `text` | nullable | Optional supporting line. |
| `video_url` | `text` | nullable | Full Vimeo URL; embed id derived at render. |
| `eyebrow` | `text` | not null | Small uppercase label above the CTA headline. |
| `cta_headline` | `text` | not null | e.g. "Start the 90-Day Challenge". |
| `cta_copy` | `text` | not null | Body copy; may contain tokens (see §4). |
| `cta_button_label` | `text` | not null | e.g. "Start the Challenge". |
| `cta_button_url` | `text` | not null | Offer/checkout URL (validated http(s)). |
| `created_at` | `timestamptz` | not null, default `now()` | |
| `updated_at` | `timestamptz` | not null, default `now()` | Bumped on update (trigger or in handler). |

**Indexes**: unique index on `code`; partial index `where status = 'active'` to speed the results lookup.

**RLS** (per R10): enable; `service_role` ALL; `authenticated` SELECT/INSERT/UPDATE; `anon` none. (DELETE intentionally omitted in v1 — deactivate via `status`, preserving analytics history; hard-delete can be added later.)

**Validation rules** (enforced in `productSchema`, mirrored by DB where practical):
- `code`: `^[a-z0-9]{3,6}$`, unique.
- All `not null` text fields: non-empty after trim; sensible max lengths (e.g. `headline` ≤ 120, `eyebrow` ≤ 60, `cta_headline` ≤ 120, `cta_copy` ≤ 600, `cta_button_label` ≤ 40).
- `cta_button_url` / `video_url`: valid `http(s)` URL.
- `status`: enum.

**State transitions**: `draft` → `active` (publish) and `active` → `draft` (pull). No other states in v1.

---

## 2. Altered table: `assessment_sessions`

Add one column to carry the resolved campaign codes for the session.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `product_codes` | `text[]` | nullable, default `NULL` | Ordered, de-duplicated list of `pr` codes captured for this session (≤ 3 per R2). `NULL`/empty ⇒ no product card. |

- Mirrors `weakest_elements text[]` precedent (ordered string list).
- Written by `/api/submit` from the submit body (§ contracts/capture-and-submit.md). No backfill needed (existing rows render no card — current behaviour).
- Not a foreign key to `products.code` (codes may be authored after a link is in the wild; resolution validates at render and skips misses — Edge Cases).

---

## 3. Altered table: `assessment_events`

Support per-product engagement tracking.

| Change | Detail |
|---|---|
| `event_type` check constraint | Add `'product_cta_shown'` and `'product_cta_clicked'` to the allowed set (currently `page_view, assessment_started, question_viewed, question_answered, assessment_submitted, pdf_downloaded`). |
| New column `product_code` | `text`, nullable. Set on the two new event types; `NULL` for all others. |

- Index `product_code` (partial, `where product_code is not null`) for the engagement RPC.
- No FK to `products.code` (events are immutable facts; a later deactivation/rename must not orphan history).

---

## 4. Tokens (application-level, not stored)

Recognized in `cta_copy` (and optionally `headline`/`sub_headline`), resolved per-viewer by `renderCopy`:

| Token | Source on result view | Missing-value behaviour |
|---|---|---|
| `{overallScore}` | `result.overallScore` (8–80) | always present |
| `{archetypeName}` | `result.archetype.name` | always present |
| `{firstName}` | `result.firstName` | empty-substitute if blank |
| `{weakestElement}` | human name of `result.weakestElements[0]` | empty-substitute if none |

Unknown tokens: stripped on the live page, left visible in admin preview (R4). Whitespace/orphan punctuation collapsed after substitution.

---

## 5. New RPC: `get_product_engagement`

```
get_product_engagement(p_from timestamptz, p_to timestamptz, p_tz text)
  → table(code text, shown bigint, clicked bigint, ctr numeric)
```

Aggregates `assessment_events` where `event_type in ('product_cta_shown','product_cta_clicked')` and `created_at` in range, grouped by `product_code`. `ctr = clicked / nullif(shown,0)`. Follows the SECURITY DEFINER + timezone pattern of the existing admin RPCs.

---

## 6. Derived/transport types (TypeScript)

```ts
// src/lib/products/types.ts
export type ProductStatus = 'draft' | 'active';

export interface Product {
  id: string;
  code: string;
  name: string;
  status: ProductStatus;
  headline: string;
  subHeadline: string | null;
  videoUrl: string | null;
  eyebrow: string;
  ctaHeadline: string;
  ctaCopy: string;
  ctaButtonLabel: string;
  ctaButtonUrl: string;
  createdAt: string;
  updatedAt: string;
}

// Tokens passed to renderCopy on the results page
export interface ProductCopyTokens {
  overallScore: number;
  archetypeName: string;
  firstName: string;
  weakestElement: string | null;
}
```

`StoredResult` (in `src/lib/results/data.ts`) gains:
```ts
products: Product[];   // resolved, active, in URL order; [] when none
```

---

## Entity relationships

```
products (code) ─ ─ ─ (loose, render-time match, not FK) ─ ─ ─ assessment_sessions.product_codes[]
                                                                      │ (1:1 row)
assessment_events.product_code ─ ─ ─ (loose, analytics) ─ ─ ─ products (code)
```

Both links are **intentionally non-FK**: codes can be authored after a campaign URL exists, and event history must survive product changes. Resolution and analytics tolerate misses by design.
