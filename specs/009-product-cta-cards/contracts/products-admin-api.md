# Contract: Admin Products API

Route handlers under `src/app/api/admin/products/`. Every handler calls `requireAdminUser()` first (401 JSON if unauthenticated, matching `src/lib/auth/session.ts`). All bodies validated with `productSchema` (`src/lib/products/schema.ts`). Writes use the authenticated SSR client; on Zod failure return `422` with field errors.

## Zod schema (authoring)

```ts
// src/lib/products/schema.ts
export const PRODUCT_CODE_RE = /^[a-z0-9]{3,6}$/;
export const MAX_PR_CODES = 3;

export const productSchema = z.object({
  name: z.string().trim().min(1).max(120),
  status: z.enum(['draft', 'active']).default('draft'),
  code: z.string().regex(PRODUCT_CODE_RE).optional(), // auto-generated if omitted
  headline: z.string().trim().min(1).max(120),
  subHeadline: z.string().trim().max(240).nullish(),
  videoUrl: z.string().url().nullish(),
  eyebrow: z.string().trim().min(1).max(60),
  ctaHeadline: z.string().trim().min(1).max(120),
  ctaCopy: z.string().trim().min(1).max(600),
  ctaButtonLabel: z.string().trim().min(1).max(40),
  ctaButtonUrl: z.string().url(),
});

// Submit-body codes (see capture-and-submit.md)
export const prCodesSchema = z.array(z.string().regex(PRODUCT_CODE_RE)).max(MAX_PR_CODES);
```

## Endpoints

### `GET /api/admin/products`
- **Auth**: admin. **Query**: optional `from`,`to` (range for engagement counts, reusing the admin range parser).
- **200**: `{ products: Array<Product & { shown: number; clicked: number; ctr: number }> }` — all products (draft + active) with engagement for the range (from `get_product_engagement`, joined by `code`; zero when no events).
- Used by the Products list page.

### `POST /api/admin/products`
- **Auth**: admin. **Body**: `productSchema`.
- Behaviour: if `code` omitted → `generateProductCode()` (retry on unique violation, R3). New rows default `status='draft'`.
- **201**: `{ product: Product }`.
- **422**: `{ error: 'validation', fields: {...} }`. **409**: `{ error: 'code_taken' }` (manual override collision).

### `PATCH /api/admin/products/:id`
- **Auth**: admin. **Body**: partial `productSchema` (any subset; `code` re-validated for uniqueness if present).
- Used for edits and for the activate/deactivate toggle (`{ status: 'active' | 'draft' }`).
- **200**: `{ product: Product }`. **404** if id unknown. **422/409** as above.
- Side effect: `updated_at = now()`.

> **No `DELETE` in v1** — deactivate via `status='draft'` to preserve analytics history (data-model §1).

## Live preview contract

The create/edit form (`ProductForm.tsx`, client) holds draft state and renders `<ProductPreview>` → the **real** `<ProductCard>` with that draft and **sample tokens** (`{overallScore: 35, archetypeName: 'The Uneven Intermediate', firstName: 'Alex', weakestElement: 'Rhythm'}`). Preview updates on every keystroke; no network call. This guarantees WYSIWYG parity (FR-013) because the same component renders preview and production.
