# Contract: Promo-code Capture & Submit Extension

How a `?pr=` code travels from the email link to the `assessment_sessions` row.

## 1. Client capture (first load)

`<PromoCapture/>` (client) mounted in `src/app/layout.tsx`. On mount:

```ts
// src/lib/products/capture.ts
const PR_KEY = 'ww_pr_codes';          // sessionStorage, sibling of ww_evt_sid
const PR_RE = /^[a-z0-9]{3,6}$/;

export function capturePrCodes(): void {
  if (typeof window === 'undefined') return;
  const fromUrl = new URLSearchParams(window.location.search)
    .getAll('pr')                       // repeated params: ?pr=ab3&pr=cd7
    .map((c) => c.trim().toLowerCase())
    .filter((c) => PR_RE.test(c));
  if (fromUrl.length === 0) return;     // never clobber existing on a param-less page
  const existing = getPrCodes();
  const merged = dedupe([...existing, ...fromUrl]).slice(0, MAX_PR_CODES);
  if (merged.length < existing.length + fromUrl.length) logTruncated();
  window.sessionStorage.setItem(PR_KEY, JSON.stringify(merged));
}

export function getPrCodes(): string[] { /* parse PR_KEY, [] on miss/parse error */ }
```

- Order preserved (URL order, first-seen wins on dedupe). Cap = `MAX_PR_CODES` (3); truncation is logged, not silent (R2).
- Invalid codes are dropped silently at capture (they can't match a product anyway).
- Idempotent: re-running on later navigations only adds new codes; a param-less page is a no-op.

## 2. Submit body extension

`/assessment` submit handler adds `prCodes` to the existing POST body:

```ts
body: JSON.stringify({
  answers, firstName, email,
  anonSessionId: getAnonSessionId(),
  completionTimeSeconds: ...,
  utmParams: captureUtmParams(),
  prCodes: getPrCodes(),              // NEW — [] when none
}),
```

## 3. Submit route extension

`src/app/api/submit/route.ts`:

```ts
const submitSchema = z.object({
  // ...existing fields...
  prCodes: prCodesSchema.optional(),  // from products/schema.ts
});

// in the insert:
product_codes: parsed.data.prCodes?.length ? parsed.data.prCodes : null,
```

- Validation: `prCodesSchema` (≤3, each `^[a-z0-9]{3,6}$`). Extra/invalid entries already filtered client-side; server re-validates and additionally truncates to 3 defensively.
- No existence check at submit (codes may predate products); resolution happens at render.

## 4. Resolution at render (results)

`src/lib/results/data.ts` → `loadResultView`:
1. read `product_codes` from the session row;
2. `loadActiveProductsByCodes(codes)` (`src/lib/products/resolve.ts`) → service-role `select * from products where code = any($codes) and status = 'active'`;
3. re-sort to match `codes` order; attach as `products: Product[]`.

`ResultsView` renders one `<ProductCard product={p} tokens={...}/>` per resolved product, between `<ArchetypeCard>` and `{FEATURES.showCta && <CtaBanner/>}`. Empty ⇒ nothing rendered (FR-005).

## Guarantees

- **FR-009/FR-010**: codes persist on the session and resolve from storage, not the live URL → render on canonical `/results/[resultId]` and on shared reopens.
- **FR-011**: only `active`, existing codes render; misses/drafts skipped.
- **Edge**: duplicate codes de-duped (capture + render); no-code sessions store `NULL` and render today's page.
