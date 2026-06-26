# Implementation Plan: Product CTA Cards

**Branch**: `009-product-cta-cards` | **Date**: 2026-06-22 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/009-product-cta-cards/spec.md`

## Summary

Add a campaign-driven **Product Card** to the assessment results page that promotes a Worship Guitar Skills offer (headline, sub-headline, hosted Vimeo video, and a CTA box). Which product(s) render is controlled by short opaque codes passed in the traffic-source URL (`?pr=ab3`), captured at first page load, persisted onto the session, and resolved on the results page — so they render reliably even though the canonical results URL carries no query string. Products are stored in a Supabase `products` table and created/edited self-serve through the existing admin dashboard (extended with a `Stats | Products` root nav) with a live WYSIWYG preview; auto-generated short codes; `draft`/`active` status. Per-product impressions and clicks are tracked via the existing event sink. The card is purely additive (renders below the existing archetype section) and excluded from the v1 PDF.

**Technical approach**: Extend, don't duplicate. Reuse the existing UTM-capture → submit-body → session-column pipeline (codes become a `product_codes text[]` column), the `trackEvent` sink (two new event types + a `product_code` column), the admin shell/auth (`@supabase/ssr` + `requireAdminUser`), and the service-role results read (`loadResultView`). Zero new runtime dependencies — the Vimeo video uses a click-to-load iframe facade.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 20+
**Primary Dependencies**: Next.js 14 (App Router), `@supabase/supabase-js` + `@supabase/ssr` (existing), Zod (existing), Tailwind CSS 3.4 (existing). **No new runtime dependencies** — Vimeo embed via a click-to-load `<iframe>` facade (no `@vimeo/player`).
**Storage**: Supabase Postgres. New `products` table; new `product_codes text[]` column on `assessment_sessions`; new `product_code text` column + two new `event_type` values on `assessment_events`. One RPC for per-product engagement aggregation.
**Testing**: Vitest (unit: code generation/validation, token interpolation, code normalization/dedupe, product resolution); Playwright (e2e: `?pr=` → results render; admin create → preview → activate → render; no-code → no card).
**Target Platform**: Vercel (web). Results page is `force-dynamic` (live Supabase read). Admin is cookie-authenticated SSR.
**Project Type**: Web application (Next.js App Router — single project, `src/`).
**Performance Goals**: No measurable regression to results-page TTFB; video deferred via facade (no Vimeo network cost until click); products read is a single indexed `code IN (...)` query.
**Constraints**: Product Card excluded from the v1 PDF; no targeting by archetype/score in v1; codes are short (3–6 chars) and opaque; unknown/draft codes silently skipped (never a broken card); organic/no-code traffic sees today's results unchanged.
**Scale/Scope**: One results-page component, one client capture util, one DB table + 1 session column + 2 event-table changes, an admin Products section (list + create/edit form with live preview + activate/deactivate), 2 new event types, 1 RPC. Max stacked products per session bounded (default 3 — see research.md).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The project constitution (`.specify/memory/constitution.md`) is an **unratified template** with placeholder principles — no project-specific gates are formally defined. In its absence, the established repository conventions are applied as de facto gates:

| De facto gate (repo convention) | Compliance |
|---|---|
| Validate all external input with Zod at the boundary | ✅ `productSchema`, extended submit schema, extended event schema |
| Schema changes via timestamped Supabase migrations (`YYYYMMDDHHMMSS_*.sql`) | ✅ new migrations for `products`, `product_codes`, event additions, RPC, RLS |
| Reuse existing infra over new (Supabase clients, event sink, admin shell, auth) | ✅ extends `trackEvent`, `assessment_sessions`, admin nav/auth, `loadResultView` |
| Feature-gated rollout where user-facing | ✅ no separate flag needed — visibility is data-driven (no active code ⇒ no card); existing `FEATURES` untouched |
| Unit (Vitest) + e2e (Playwright) coverage for new logic | ✅ planned in Testing |
| No secrets client-side; service-role server-only | ✅ admin writes via authenticated/service client; codes are non-secret |

**Result: PASS** — no violations, Complexity Tracking not required.

*Re-check after Phase 1 design: still PASS — the design adds no new dependencies, keeps all writes server-side, and validates every boundary with Zod (see data-model.md and contracts/).*

## Project Structure

### Documentation (this feature)

```text
specs/009-product-cta-cards/
├── plan.md              # This file
├── research.md          # Phase 0 output — resolves the spec's TBDs
├── data-model.md        # Phase 1 output — products table, session column, event changes
├── quickstart.md        # Phase 1 output — how to create + ship a product end-to-end
├── contracts/           # Phase 1 output
│   ├── products-admin-api.md     # Admin CRUD endpoints + Zod schema
│   ├── capture-and-submit.md     # pr capture + submit-body extension
│   └── analytics-events.md       # new event types + product_code
└── tasks.md             # Phase 2 (/speckit.tasks — NOT created here)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── api/
│   │   ├── submit/route.ts                  # EXTEND: accept prCodes → product_codes column
│   │   ├── events/route.ts                  # EXTEND: persist product_code + new event types
│   │   └── admin/products/
│   │       ├── route.ts                     # NEW: GET list, POST create (requireAdminUser)
│   │       └── [id]/route.ts                # NEW: PATCH update / status toggle
│   ├── admin/(dashboard)/
│   │   └── products/
│   │       ├── page.tsx                     # NEW: products list (codes, status, actions)
│   │       ├── new/page.tsx                 # NEW: create form + live preview
│   │       └── [id]/page.tsx                # NEW: edit form + live preview
│   ├── layout.tsx                           # EXTEND: mount <PromoCapture/>
│   └── results/[resultId]/page.tsx          # unchanged (uses ResultsView)
├── components/
│   ├── PromoCapture.tsx                     # NEW: client first-load pr capture (root layout)
│   ├── results/
│   │   ├── ResultsView.tsx                  # EXTEND: render <ProductCard> list after <ArchetypeCard>
│   │   └── ProductCard.tsx                  # NEW: one product card (token-interpolated, Vimeo facade)
│   └── admin/products/
│       ├── ProductForm.tsx                  # NEW: create/edit form (client) with live preview
│       └── ProductPreview.tsx               # NEW: wraps <ProductCard> with sample tokens
├── lib/
│   ├── products/
│   │   ├── types.ts                         # NEW: Product type
│   │   ├── schema.ts                        # NEW: Zod productSchema + prCodes schema + code rules
│   │   ├── code.ts                          # NEW: generateProductCode(), normalizeCodes()
│   │   ├── tokens.ts                        # NEW: renderCopy(template, tokens)
│   │   ├── capture.ts                       # NEW: capturePrCodes()/getPrCodes() (client)
│   │   ├── resolve.ts                       # NEW: loadActiveProductsByCodes() (server)
│   │   └── data.ts                          # NEW: admin CRUD data helpers (server)
│   ├── events/
│   │   ├── schema.ts                        # EXTEND: EVENT_TYPES + productCode field
│   │   └── tracker.ts                       # EXTEND: trackProductCtaShown/Clicked
│   └── results/data.ts                      # EXTEND: attach resolved products to the result view
├── __tests__/                               # NEW unit tests (code, tokens, normalize, resolve)
└── ...

supabase/migrations/
├── 20260622xxxxxx_products_table.sql        # NEW: products + RLS + indexes
├── 20260622xxxxxx_session_product_codes.sql # NEW: assessment_sessions.product_codes text[]
├── 20260622xxxxxx_product_cta_events.sql     # NEW: event_type check + product_code column
└── 20260622xxxxxx_product_engagement_rpc.sql # NEW: get_product_engagement(...)

tests/e2e/                                   # NEW Playwright specs
```

**Structure Decision**: Single Next.js App Router project (the repo is one `src/` tree, not split frontend/backend). New code is organized under a `src/lib/products/` domain folder mirroring the existing `src/lib/events/` and `src/lib/admin/` conventions; UI under `src/components/results/` (public) and `src/components/admin/products/` (admin); routes under the existing `api/` and `admin/(dashboard)/` trees.

## Complexity Tracking

> No constitution violations — section intentionally empty.
