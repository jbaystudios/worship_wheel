# Tasks: Product CTA Cards

**Input**: Design documents from `/specs/009-product-cta-cards/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓

**Tests**: INCLUDED — plan.md's Testing section explicitly requests Vitest unit + Playwright e2e coverage for the new logic.

**Organization**: Tasks grouped by user story (US1–US5 from spec.md) for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: US1–US5 (story-phase tasks only)
- Exact file paths included

## Path Conventions

Single Next.js App Router project: code under `src/`, unit tests under `src/__tests__/`, e2e under `tests/e2e/`, migrations under `supabase/migrations/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the new domain/route folders this feature lives in.

- [X] T001 Create new folders: `src/lib/products/`, `src/components/admin/products/`, `src/app/api/admin/products/`, and `src/app/admin/(dashboard)/products/` (empty, to be populated by later tasks)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: DB schema + shared domain logic that ALL user stories depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

### Database migrations (per data-model.md)

- [X] T002 [P] Migration — create `products` table (columns per data-model §1, `code` unique index, partial index `where status='active'`, RLS: service_role ALL / authenticated SELECT·INSERT·UPDATE / anon none) in `supabase/migrations/20260622xxxxxx_products_table.sql`
- [X] T003 [P] Migration — add `product_codes text[]` (nullable) to `assessment_sessions` in `supabase/migrations/20260622xxxxxx_session_product_codes.sql`
- [X] T004 [P] Migration — add `'product_cta_shown'`/`'product_cta_clicked'` to the `assessment_events.event_type` check constraint and add nullable `product_code text` column (+ partial index) in `supabase/migrations/20260622xxxxxx_product_cta_events.sql`
- [X] T005 [P] Migration — create `get_product_engagement(p_from, p_to, p_tz)` RPC (SECURITY DEFINER, returns code/shown/clicked/ctr) in `supabase/migrations/20260622xxxxxx_product_engagement_rpc.sql`

### Shared domain logic (per data-model.md + contracts/)

- [X] T006 [P] Define `Product`, `ProductStatus`, `ProductCopyTokens` types in `src/lib/products/types.ts`
- [X] T007 [P] Define `productSchema`, `prCodesSchema`, `PRODUCT_CODE_RE`, `MAX_PR_CODES` (Zod) in `src/lib/products/schema.ts`
- [X] T008 [P] Implement `generateProductCode()` (4-char safe alphabet, no ambiguous glyphs) and `normalizeCodes()` (trim/lowercase/validate/dedupe/cap) in `src/lib/products/code.ts`
- [X] T009 [P] Implement `renderCopy(template, tokens)` (token replace, empty-substitute + whitespace collapse, strip unknown tokens on live render) in `src/lib/products/tokens.ts`
- [X] T010 [P] Unit tests for `code.ts` (alphabet/length, dedupe, cap-to-3, invalid filtered) in `src/__tests__/products-code.test.ts`
- [X] T011 [P] Unit tests for `tokens.ts` (all four tokens, missing-value collapse, unknown-token strip) in `src/__tests__/products-tokens.test.ts`

**Checkpoint**: Schema migrated; types/validation/code-gen/interpolation available. User stories can begin.

---

## Phase 3: User Story 1 — Campaign visitor sees the right product offer on results (Priority: P1) 🎯 MVP

**Goal**: Render the Product Card(s) below the archetype section on results, resolved from the session's persisted codes, with token-interpolated copy and a Vimeo facade; nothing renders when there are no/unknown/draft codes; never in the PDF.

**Independent Test**: Seed one `active` product and set a session row's `product_codes` directly; load `/results/[resultId]` → card renders with interpolated copy and a working CTA. Unknown/draft/no code → no card. PDF → no card.

### Implementation

- [X] T012 [P] [US1] Implement `loadActiveProductsByCodes(codes)` (service-role, `status='active'`, re-sort to `codes` order) in `src/lib/products/resolve.ts`
- [X] T013 [US1] Extend `loadResultView` to read `product_codes` and attach `products: Product[]` to the result view in `src/lib/results/data.ts` (depends on T012, T006)
- [X] T014 [P] [US1] Build `ProductCard` (renders product fields, `renderCopy` for tokens, Vimeo click-to-load iframe facade, CTA button) in `src/components/results/ProductCard.tsx` (depends on T006, T009)
- [X] T015 [US1] Render the `<ProductCard>` list in `src/components/results/ResultsView.tsx`, inserted after `<ArchetypeCard>` and before `{FEATURES.showCta && <CtaBanner>}` (depends on T013, T014)
- [X] T016 [P] [US1] Add a deliberate "Product Card excluded from v1 PDF (FR-006)" comment at the page-list in `src/components/results/pdf/ReportDocument.tsx` (no render change)
- [X] T017 [P] [US1] Unit test `resolve.ts` (active-only filtering, URL-order preservation, unknown skipped) in `src/__tests__/products-resolve.test.ts`
- [X] T018 [US1] Playwright e2e — seed active product + session `product_codes`: card renders with interpolated copy; unknown/draft/no code → no card; PDF contains no card — in `tests/e2e/product-card-display.spec.ts`

**Checkpoint**: With a product + codes seeded directly in the DB, the results page shows the right card(s). MVP rendering proven.

---

## Phase 4: User Story 2 — Code captured at entry and survives to results (Priority: P1)

**Goal**: Capture `?pr=` on first load, persist through the assessment, write to `assessment_sessions.product_codes` at submit — so US1 renders reliably without the param on the results URL, including shared reopens.

**Independent Test**: Land with `?pr=ab3`, complete the assessment; confirm the row's `product_codes` = `{ab3}`; reopen `/results/[resultId]` (no query string) → card still renders.

### Implementation

- [X] T019 [P] [US2] Implement `capturePrCodes()` / `getPrCodes()` (sessionStorage `ww_pr_codes`, repeated `pr` params, normalize/dedupe/cap via `normalizeCodes`, idempotent, non-silent truncation log) in `src/lib/products/capture.ts` (depends on T008)
- [X] T020 [P] [US2] Build `<PromoCapture/>` client component that calls `capturePrCodes()` on mount in `src/components/PromoCapture.tsx` (depends on T019)
- [X] T021 [US2] Mount `<PromoCapture/>` in the root layout `src/app/layout.tsx` (depends on T020)
- [X] T022 [US2] Extend `submitSchema` with `prCodes` and write `product_codes` on insert in `src/app/api/submit/route.ts` (depends on T007)
- [X] T023 [US2] Add `prCodes: getPrCodes()` to the submit POST body in `src/app/assessment/page.tsx` (depends on T019)
- [X] T024 [P] [US2] Unit test `capture.ts` (dedupe, cap to 3, invalid filtered, param-less no-op, merge idempotence) in `src/__tests__/products-capture.test.ts`
- [X] T025 [US2] Playwright e2e — enter with `?pr=`, landing→assessment hop, submit → `product_codes` persisted; reopen canonical results → card renders — in `tests/e2e/product-capture.spec.ts` (validates with US1 render)

**Checkpoint**: Full email-link → results flow works end-to-end via DB-seeded products.

---

## Phase 5: User Story 3 — Anyone creates and previews a product without a developer (Priority: P1)

**Goal**: Self-serve create/edit of a product in the admin with a live WYSIWYG preview, auto-generated unique code (override allowed), `draft` default, validation at the boundary.

**Independent Test**: In admin, create a product, watch the preview update live, save (unique code generated), set `active`; confirm it then renders on results when its code is used; bad input blocks save.

### Implementation

- [X] T026 [P] [US3] Admin CRUD data helpers `createProduct`/`updateProduct`/`getProduct` (authenticated SSR client; `generateProductCode` on create with retry-on-collision) in `src/lib/products/data.ts` (depends on T007, T008)
- [X] T027 [US3] `POST /api/admin/products` — `requireAdminUser`, validate `productSchema`, auto-code, `draft` default, 201/422/409 in `src/app/api/admin/products/route.ts` (depends on T026)
- [X] T028 [US3] `PATCH /api/admin/products/[id]` — update + status toggle, re-validate code uniqueness, bump `updated_at`, 200/404/422/409 in `src/app/api/admin/products/[id]/route.ts` (depends on T026)
- [X] T029 [P] [US3] `ProductPreview` wrapping `<ProductCard>` with sample tokens (`overallScore:35`, `archetypeName:'The Uneven Intermediate'`, `firstName:'Alex'`, `weakestElement:'Rhythm'`) in `src/components/admin/products/ProductPreview.tsx` (depends on T014)
- [X] T030 [US3] `ProductForm` client (draft state, all fields, optional code override, live `<ProductPreview>`, submit to create/update API) in `src/components/admin/products/ProductForm.tsx` (depends on T029, T027, T028)
- [X] T031 [P] [US3] Create page rendering `<ProductForm>` in `src/app/admin/(dashboard)/products/new/page.tsx` (depends on T030)
- [X] T032 [P] [US3] Edit page (load product, render `<ProductForm>`) in `src/app/admin/(dashboard)/products/[id]/page.tsx` (depends on T030)
- [X] T033 [US3] Playwright e2e — create with auto-code → preview matches rendered card → activate → renders on results; missing/invalid field blocks save — in `tests/e2e/product-admin-create.spec.ts`

**Checkpoint**: Charl can ship a product end-to-end with no developer/deploy.

---

## Phase 6: User Story 4 — Admin manages the product catalogue (Priority: P2)

**Goal**: Root-level `Stats | Products` nav and a Products list (code, name, status, actions) reusing the admin shell/auth.

**Independent Test**: Create several products; open Products list → each shows code + status; toggle activate/deactivate → reflects on results.

### Implementation

- [X] T034 [US4] Add root-level `Stats | Products` navigation (new `Products` item + matcher; group existing Funnel/Acquisition/Outcomes/Leads under `Stats`) in `src/components/admin/shell/AdminNav.tsx`
- [X] T035 [US4] `GET /api/admin/products` list handler (all products + engagement join for the range) in `src/app/api/admin/products/route.ts` (depends on T026; same file as T027 — sequential)
- [X] T036 [US4] Products list page (code, name, status, edit + activate/deactivate actions) in `src/app/admin/(dashboard)/products/page.tsx` (depends on T035)
- [X] T037 [US4] Playwright e2e — list shows products with code/status; deactivate hides card on results, activate shows it — in `tests/e2e/product-admin-list.spec.ts`

**Checkpoint**: Full admin catalogue management available.

---

## Phase 7: User Story 5 — Per-product engagement is measurable (Priority: P2)

**Goal**: Record `product_cta_shown`/`product_cta_clicked` with the product code; surface impressions/clicks/CTR per product in the admin.

**Independent Test**: Render results with an active product, click the CTA → both events recorded with the code + session id; counts appear on the Products list.

### Implementation

- [X] T038 [P] [US5] Add `'product_cta_shown'`/`'product_cta_clicked'` to `EVENT_TYPES` and add optional `productCode` to `eventPayloadSchema` in `src/lib/events/schema.ts`
- [X] T039 [US5] Persist `product_code` on insert in `src/app/api/events/route.ts` (depends on T038, T004)
- [X] T040 [US5] Add `productCode` to `TrackOptions` and `trackProductCtaShown`/`trackProductCtaClicked` wrappers in `src/lib/events/tracker.ts` (depends on T038)
- [X] T041 [US5] Fire `product_cta_shown` once on mount (ref-guarded) and `product_cta_clicked` on CTA click (fire-and-forget before navigation) in `src/components/results/ProductCard.tsx` (depends on T040, T014)
- [X] T042 [P] [US5] `getProductEngagement(range)` RPC wrapper in `src/lib/admin/product-engagement.ts` (depends on T005)
- [X] T043 [US5] Surface shown/clicked/CTR columns on the Products list in `src/app/admin/(dashboard)/products/page.tsx` (depends on T036, T042)
- [X] T044 [US5] Playwright e2e — render → `product_cta_shown`; click → `product_cta_clicked`; admin list shows counts — in `tests/e2e/product-analytics.spec.ts`

**Checkpoint**: Per-product conversion visible in admin.

---

## Phase 8: Polish & Cross-Cutting Concerns

- [X] T045 [P] Responsive + a11y pass on `ProductCard` per the UI/UX Pro Max checklist (375/768/1024/1440px, `cursor-pointer` on CTA, text contrast ≥4.5:1, `prefers-reduced-motion` on the video facade) in `src/components/results/ProductCard.tsx`
- [ ] T046 [P] Run the `quickstart.md` manual-QA checklist against the live stack and append an entry to `project-management/v1-launch/qa-log.md` — **PENDING: requires applying the 4 migrations to the live Supabase + a running deploy**
- [X] T047 [P] Update `project-management/STATUS.md` with feature 009 status
- [X] T048 Final gate — `npm run lint`, `npm test`, `npm run test:e2e` all green

---

## Dependencies & Execution Order

### Phase dependencies

- **Setup (P1)** → no deps.
- **Foundational (P2)** → after Setup. **BLOCKS all user stories.**
- **US1 (P3)** → after Foundational. The MVP rendering slice.
- **US2 (P4)** → after Foundational; its e2e (T025) validates against US1's render path.
- **US3 (P5)** → after Foundational; reuses `ProductCard` (T014) for preview.
- **US4 (P6)** → after US3 (list/nav build on the create path + API file).
- **US5 (P7)** → after Foundational; T041 touches `ProductCard` (T014); T043 touches the US4 list page (T036).
- **Polish (P8)** → after the desired stories.

### Critical cross-story file touches (avoid clobbering)

- `src/components/results/ProductCard.tsx`: created T014 (US1), extended T041 (US5), polished T045 — sequence US1 → US5 → Polish.
- `src/app/api/admin/products/route.ts`: POST T027 (US3) then GET T035 (US4) — same file, sequential.
- `src/app/admin/(dashboard)/products/page.tsx`: created T036 (US4) then extended T043 (US5) — sequential.
- `src/lib/products/data.ts`: T026 (US3 CRUD). Engagement wrapper deliberately separated into `src/lib/admin/product-engagement.ts` (T042) to keep US5 `[P]`-able.

### Within each story

Models/types → services (resolve/data) → UI components → wiring → e2e.

---

## Parallel Opportunities

**Foundational (after T001)** — all parallel (distinct files):
```
T002 products migration · T003 session column · T004 event changes · T005 RPC
T006 types · T007 schema · T008 code · T009 tokens · T010 code tests · T011 token tests
```

**US1** — `T012 resolve` ∥ `T014 ProductCard` ∥ `T016 PDF comment` ∥ `T017 resolve test` (then T013 → T015 → T018).

**US2** — `T019 capture` ∥ `T024 capture test` (then T020 → T021; T022 ∥ T023 → T025).

**Once Foundational is done**, US1 / US2 / US3 / US5-events can be staffed in parallel by different developers (mind the cross-story file touches above).

---

## Implementation Strategy

### MVP (smallest demonstrable slice)
Setup → Foundational → **US1** (seed a product + session codes directly in the DB) proves the card renders correctly. Good for a design/stakeholder demo.

### First genuinely shippable increment (recommended)
**US1 + US2 + US3** = a campaign visitor sees the right offer *and* Charl can create products self-serve. This is the real "ship it" line. Add **US4** (catalogue/nav) and **US5** (analytics) as fast-follows.

### Incremental delivery
US1 (render) → US2 (capture) → US3 (self-serve create) → US4 (catalogue) → US5 (analytics) → Polish. Each phase is independently testable and adds value without breaking the prior.

---

## Notes

- Tests included per plan.md; verify e2e specs fail before implementing each story.
- Commit after each task or logical group; the `git` extension offers auto-commit hooks.
- No new runtime dependencies (Vimeo facade is plain `<iframe>`).
- Hard constraints to keep green throughout: no-code traffic unchanged (SC-003), Product Card never in the PDF (SC-006), unknown/draft codes silently skipped.
