# Quickstart: Product CTA Cards

How the pieces fit, for a developer picking up implementation and for Charl shipping a product.

## For Charl — ship a product (no developer, no deploy)

1. **Admin → Products → New.** Fill in: name (internal), headline, sub-headline (optional), Vimeo URL (optional), eyebrow, CTA headline, CTA copy, button label, button link.
   - Use tokens in the copy for personalization: `{overallScore}`, `{archetypeName}`, `{firstName}`, `{weakestElement}`.
   - The **live preview** on the right shows exactly what a visitor sees.
2. **Save.** A unique short **code** is generated (e.g. `k7r2`) — or type your own (3–6 letters/numbers). The product starts as **Draft**.
3. **Set to Active** when ready. It now renders the moment its code is used — no deploy.
4. **Build the campaign URL**: append `?pr=k7r2` to the link in your email (e.g. `https://worshipwheel.com/?pr=k7r2`). Stack offers with `?pr=k7r2&pr=m3x9` (max 3, shown in that order).
5. **Watch performance** on the Products list: impressions, clicks, CTR per product.

A visitor with no `pr` code sees the normal results page — no product card.

## For developers — end-to-end flow

```
Email link (?pr=k7r2)
      │
      ▼
<PromoCapture/> in root layout  →  sessionStorage ww_pr_codes = ["k7r2"]   (lib/products/capture.ts)
      │  (survives landing → assessment, the multi-minute quiz)
      ▼
/assessment submit  →  POST /api/submit { ..., prCodes: ["k7r2"] }
      │
      ▼
assessment_sessions.product_codes = {k7r2}                                 (submit/route.ts)
      │
      ▼
/results/[resultId]  →  loadResultView()  →  loadActiveProductsByCodes()   (lib/products/resolve.ts)
      │                    (service-role; status='active'; URL order)
      ▼
ResultsView  →  <ProductCard/> per product, below <ArchetypeCard>          (components/results)
      │            token-interpolated copy; Vimeo click-to-load facade
      ▼
product_cta_shown / product_cta_clicked  →  /api/events                    (lib/events/tracker.ts)
      │
      ▼
Admin Products list  ←  get_product_engagement RPC (shown/clicked/CTR)
```

## Build order (suggested)

1. **DB**: migrations — `products` (+RLS, indexes), `assessment_sessions.product_codes`, event additions, `get_product_engagement`.
2. **Domain lib**: `products/{types,schema,code,tokens}.ts` + unit tests (Vitest).
3. **Capture path**: `capture.ts` + `<PromoCapture/>` in layout; extend submit schema/route. e2e: `?pr=` → row has `product_codes`.
4. **Render path**: `resolve.ts`, extend `results/data.ts`, build `<ProductCard/>`, wire into `ResultsView`. e2e: active code → card renders, with interpolated copy; no/unknown/draft code → no card.
5. **Analytics**: extend event schema/tracker/route; fire from `<ProductCard/>`.
6. **Admin**: API handlers (`api/admin/products`), `ProductForm`+`ProductPreview` (live preview), list page with engagement columns, `Stats | Products` nav. e2e: create → preview → activate → renders.

## Manual QA checklist (against live stack — log to `project-management/v1-launch/qa-log.md`)

- [ ] `?pr=<active>` → correct card below archetype; tokens resolved; CTA opens offer URL.
- [ ] `?pr=a&pr=b` → both cards, in URL order.
- [ ] No `pr` → results identical to today; PDF has no product card.
- [ ] Unknown / draft code → silently skipped, no empty box.
- [ ] Shared `/results/[resultId]` reopen → same card(s).
- [ ] Admin: create with auto-code, live preview matches rendered card, draft hidden, activate shows it, deactivate hides it.
- [ ] Admin list shows code + impressions/clicks/CTR for the range.

## Things deliberately NOT in v1 (see spec → Out of Scope)

Archetype/score targeting · product card in PDF · non-Vimeo players · A/B rotation within one code · hard-delete of products.
