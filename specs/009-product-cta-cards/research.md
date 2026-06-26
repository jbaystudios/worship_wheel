# Phase 0 Research: Product CTA Cards

Resolves the open items (`NEEDS CLARIFICATION` / TBDs) flagged in the spec, plus the key technical choices. Each entry: **Decision · Rationale · Alternatives considered**.

---

## R1 — Persistence shape for stacked product codes

**Decision**: Add a single `product_codes text[]` column to `assessment_sessions`, storing the ordered, de-duplicated list of resolved codes for the session.

**Rationale**: Acquisition data on `assessment_sessions` is stored as discrete typed columns, and the table already has the precedent `weakest_elements text[]` / `strongest_elements text[]` for ordered string lists. A `text[]` preserves stack order (FR-004) and is trivially queryable. It mirrors the existing UTM pipeline: captured client-side → POSTed in the submit body → written to a column.

**Alternatives considered**: (a) JSONB blob — rejected; the table favours discrete columns and a JSONB wrapper adds nothing for a flat ordered string list. (b) A join table `session_products` — rejected as over-engineered for an at-most-N append-only list with no per-row attributes; a join table is reserved for the future targeting work if needed.

---

## R2 — Maximum stacked products per session

**Decision**: Cap at **3** product codes per session. Codes beyond the cap (after de-dupe) are dropped at capture time; the drop is recorded (a `product_codes_truncated` console/analytics breadcrumb) so it is never silent.

**Rationale**: The results page is a single vertical scroll; 3 stacked offers is the realistic ceiling for a focused campaign without burying the payoff. A hard cap bounds layout, the `code IN (...)` query, and abuse from URL stuffing. 3 is generous for v1 and can be raised later by changing one constant.

**Alternatives considered**: Unbounded — rejected (layout + abuse risk, silent over-stuffing). Cap of 1 — rejected; the spec explicitly requires stacking from day one.

---

## R3 — Short opaque code format & generation

**Decision**: Codes are **4 characters** from the alphabet `abcdefghijkmnpqrstuvwxyz23456789` (lowercase, ambiguous chars `l/1/o/0` removed). Schema accepts **3–6 chars** from `[a-z0-9]` for manual overrides. Auto-generation: pick 4 random chars from the safe alphabet; on unique-constraint violation, regenerate (bounded retry). Uniqueness enforced by a DB unique index on `products.code`.

**Rationale**: 4 chars from a 31-symbol alphabet ≈ 923k combinations — collisions are vanishingly rare and cheap to retry, while staying short enough to be unobtrusive in a URL (the deliberate opacity goal). Excluding ambiguous glyphs avoids "is that an l or a 1" support tickets. Accepting 3–6 on override gives Charl room for a memorable code without loosening the auto path. No new dependency — a tiny generator over `crypto.getRandomValues`.

**Alternatives considered**: `nanoid` — rejected (new dependency for ~6 lines). UUID/long slugs — rejected (defeats the "not obviously a promo code" intent). Sequential ids — rejected (enumerable, leaks product count).

---

## R4 — Token interpolation & missing-value fallback

**Decision**: CTA copy (and optionally headline/sub) supports tokens `{overallScore}`, `{archetypeName}`, `{firstName}`, `{weakestElement}`. `renderCopy(template, tokens)` replaces known tokens; for a token whose value is unavailable it substitutes an empty string and collapses resulting double-spaces/orphaned punctuation. `{weakestElement}` resolves to the human-readable element name of `weakestElements[0]`; if there is none, it renders empty. An **unknown** `{token}` is left untouched only in the admin preview (to help authors spot typos) but stripped on the live page so a visitor never sees raw braces.

**Rationale**: Keeps personalization in config (FR-003) while guaranteeing FR-003's "never show a raw `{token}`" on the live page. Whitespace collapsing keeps a sentence grammatical when a token drops out.

**Alternatives considered**: Throw on unknown token — rejected (a typo would break a live campaign). Leave raw braces live — rejected (violates FR-003).

---

## R5 — First-load capture coverage (landing vs assessment entry)

**Decision**: Capture `?pr=` in a small client component `<PromoCapture/>` mounted in the **root layout**, so any entry page (landing `/`, `/assessment`, or a deep link) captures on first load. It merges URL codes into `sessionStorage` under `ww_pr_codes` (normalized + de-duped + capped). `getPrCodes()` reads it for the submit body. This is more robust than the existing UTM approach (which reads `window.location.search` only at submit time and is lost on a landing→assessment hop).

**Rationale**: US2 demands 100% carry-through regardless of which page the email link hits. Root-layout mounting guarantees coverage without touching each page. `sessionStorage` (not `localStorage`) scopes the code to the browsing session, matching the existing `anon_session_id` storage (`ww_evt_sid`) so a stale code from a prior unrelated visit can't leak.

**Alternatives considered**: Capture only on `/assessment` — rejected (misses landing-page entries). Cookie — rejected (sent on every request, no need server-side until submit). `localStorage` — rejected (persists across sessions; could resurface an old campaign).

---

## R6 — Resolving & rendering products on results

**Decision**: `loadResultView(resultId)` already reads the session via the service-role client; extend it to also read `product_codes`, then `loadActiveProductsByCodes(codes)` fetches matching `status='active'` products and returns them **in the order of `codes`** (DB returns unordered; we re-sort in JS by the codes array). The resolved `products: Product[]` is attached to the result-view object and rendered by `ResultsView` as a `<ProductCard>` per item, inserted **between `<ArchetypeCard>` and the existing `{FEATURES.showCta && <CtaBanner>}`**. Empty list ⇒ nothing renders.

**Rationale**: Reuses the existing single server read path (no extra client round-trip), keeps ordering authoritative (FR-004), and places the card exactly where the design sits (below archetype). Service-role read bypasses RLS cleanly, consistent with `loadPdfData`.

**Alternatives considered**: Client-side fetch of products on the results page — rejected (extra round-trip, flash, and the codes already live server-side). Resolving in the page component instead of the data layer — rejected (keeps data assembly in `src/lib/results/data.ts` per convention).

---

## R7 — Video embed (Vimeo) without a new dependency

**Decision**: Render a **click-to-load facade**: a poster/thumbnail with a play button; on click, swap in the Vimeo `<iframe>` (`player.vimeo.com/video/{id}?autoplay=1` with privacy params) parsed from the stored `video_url`. Store the full URL in config; derive the embed id at render. No `@vimeo/player` package.

**Rationale**: Zero added bundle/runtime cost until the user actually plays (performance goal), avoids third-party JS on initial results render, and keeps the schema host-agnostic (a URL field) so a future host swap needs no migration. Matches the existing `showVsl` placeholder intent.

**Alternatives considered**: `@vimeo/player` SDK — rejected (new dependency; only needed if we want play-progress events, which are out of v1 scope — we track CTA click, not video progress). Eager iframe — rejected (loads Vimeo on every results view even if never played).

---

## R8 — Admin analytics surface for per-product engagement

**Decision**: A Postgres RPC `get_product_engagement(p_from, p_to, p_tz)` aggregates `product_cta_shown` / `product_cta_clicked` counts by `product_code` from `assessment_events`, returning `{ code, shown, clicked, ctr }`. Surfaced as a column set on the **Products list** (impressions / clicks / CTR per row) for the selected range — no separate analytics page in v1.

**Rationale**: Reuses the established admin RPC pattern (`get_acquisition_breakdown`, etc.) and the date-range plumbing. Putting the numbers on the existing list row is the lowest-friction way to answer "is this product working" (SC-005) without a new screen.

**Alternatives considered**: A dedicated product-analytics dashboard — deferred (more than v1 needs). Computing in JS over raw events — rejected (RPC matches convention and scales).

---

## R9 — Admin write path (CRUD)

**Decision**: Implement product create/update/activate as **Next.js Route Handlers** under `src/app/api/admin/products/`, each guarded by `requireAdminUser()` and validated by `productSchema`. The Products list and forms are server components / client form that call these handlers. Writes use the authenticated SSR client (RLS: authenticated role may write); the results page reads via service-role.

**Rationale**: The admin currently exposes reads via RPC and has **no** Server Actions yet; route handlers match the existing `api/` convention and the `requireAdminUser` guard already in `src/lib/auth/session.ts`. Keeps validation centralized at the boundary.

**Alternatives considered**: Server Actions — viable and more modern, but the repo has no precedent yet; introducing them here would be an inconsistent one-off. Direct client→Supabase writes — rejected (bypasses centralized Zod validation and leaks write surface to the browser).

---

## R10 — RLS for the `products` table

**Decision**: Enable RLS. Policies: `service_role` full access (results read + any server task); `authenticated` may `select/insert/update` (admin UI); `anon` denied. No public/anon read — the results page reads via service-role, so anon never queries `products` directly. Follow the policy style established in `20260519121000_fix_assessment_sessions_rls.sql`.

**Rationale**: Products contain unreleased/draft campaign copy that shouldn't be world-readable; routing all public reads through the service-role results path keeps the table private while still rendering active products to visitors.

**Alternatives considered**: Public `select` on `status='active'` — rejected (unnecessary exposure; the service-role path already covers rendering and lets us hide draft copy entirely).

---

## R11 — PDF exclusion

**Decision**: Do nothing in the PDF pipeline. `ReportDocument.tsx` builds its own page list and does not reuse `ResultsView`, so the Product Card is **absent by construction**. Add a one-line comment in `ReportDocument.tsx` noting the deliberate v1 exclusion to prevent a future contributor "completing" it by accident.

**Rationale**: FR-006 / SC-006 require exclusion; the cleanest way to guarantee it is to not add it to the PDF component tree at all.

**Alternatives considered**: A `FEATURES.showProductCardInPdf=false` flag — rejected as premature; the future-PDF decision is explicitly out of scope, and an unused flag invites accidental flips.

---

## Summary of resolved unknowns

| Spec TBD | Resolution |
|---|---|
| Persistence shape | `product_codes text[]` on `assessment_sessions` (R1) |
| Max stacked products | 3, non-silent truncation (R2) |
| Code format / generation | 4-char safe alphabet, 3–6 on override, DB-unique (R3) |
| Token fallback | empty-substitute + whitespace collapse; never raw braces live (R4) |
| Capture coverage | root-layout `<PromoCapture/>` → `sessionStorage` (R5) |
| Admin analytics shape | `get_product_engagement` RPC → counts on Products list (R8) |
| Video host/player | Vimeo via click-to-load iframe facade, no new dep (R7) |
