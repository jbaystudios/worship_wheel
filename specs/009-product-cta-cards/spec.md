# Feature Specification: Product CTA Cards

**Feature Branch**: `009-product-cta-cards`
**Created**: 2026-06-22
**Status**: Draft
**Input**: Add a reusable, campaign-driven "Product Card" to the assessment results page that promotes a Worship Guitar Skills product (headline, sub-headline, hosted video, and an offer/CTA box). Which product(s) appear is controlled by short codes passed in the traffic source URL (e.g. an email link), captured at session start and persisted so they render reliably on the results page. Products are created and managed self-serve through the existing admin dashboard — no developer or deploy required — with a live preview. Multiple products can be stacked on a single results page.

## Context

The results page (specs 003, 006) is the payoff of the assessment and the moment of highest intent. Today it presents the user's archetype, scores, and narrative, but carries **no product promotion** — the `CtaBanner` scaffolding exists but is gated off (`FEATURES.showCta = false`). Charl wants to run targeted campaigns (e.g. "Sunday Ready Challenge", "90-Day Challenge") where an email links into the assessment and, on completion, the user sees the specific offer that campaign is promoting.

This spec introduces a **Product Card**: a new, additive component that renders **below** the existing archetype name/description on the results page. It does **not** modify any existing results content — it stacks underneath. The visual design is the Figma frame currently named "Archetype Card" (`node-id=99-165`, being renamed to **Product Card**); its placeholder copy ("The Uneven Intermediate") is illustrative — the live headline is a *product* field, not the archetype name.

Two design decisions shape the architecture and are recorded in the *Approach* section:

1. **Campaign-driven selection, not score-driven.** Which product shows is decided by short codes in the URL (`?pr=ab3`), captured at session start and persisted to the session — **not** derived from the user's score. This lets a campaign show the same offer to everyone it targets, regardless of their result. When no code is present (organic, direct, returning, shared links — the majority of traffic), **no product card renders** — results look exactly as they do today.

2. **Self-serve, database-backed config — not config-as-code.** Products live in a Supabase `products` table, created and edited at runtime through the **existing admin dashboard** (extended with a `Stats | Products` root nav), with a live WYSIWYG preview. This removes the developer/deploy bottleneck so anyone can create a product. The results page already reads from Supabase live (`force-dynamic`), so a newly activated product appears immediately.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Campaign visitor sees the right product offer on results (Priority: P1)

A user clicks an email link for a specific campaign. The link carries one or more short product codes (`?pr=ab3`). The user completes the assessment, and on the results page — below their archetype name and description — they see the **Product Card** for that campaign: a headline, sub-headline, a hosted Vimeo video, and an offer box (eyebrow, CTA headline, personalised CTA copy, and a button linking to the offer). When multiple codes are passed (`?pr=ab3&pr=cd7`), one card renders per code, stacked in URL order. When no code is present, no card renders.

**Why this priority**: This is the entire user-facing payoff and the reason the feature exists — converting high-intent results traffic into product sign-ups. Without it there is no promotion surface.

**Independent Test**: Seed one `active` product in the `products` table. Start an assessment via a URL carrying its code, complete it, and confirm the Product Card renders below the archetype section on results with the product's content and a working CTA link. Repeat with two codes and confirm both cards render in order. Repeat with no code and confirm no card renders.

**Acceptance Scenarios**:

1. **Given** a user enters the funnel via a URL containing `?pr=ab3` where `ab3` is an `active` product, **When** they reach the results page, **Then** the Product Card for `ab3` renders below the archetype name/description with its headline, sub-headline, video, and offer box.
2. **Given** the CTA copy contains tokens (e.g. "Based on your score of {overallScore}/80…"), **When** the card renders, **Then** the tokens are replaced with the user's real values (`{overallScore}`, `{archetypeName}`, `{firstName}`, `{weakestElement}`).
3. **Given** a URL contains `?pr=ab3&pr=cd7` (both active), **When** results render, **Then** two cards appear stacked in URL order (`ab3` above `cd7`).
4. **Given** the user clicks the CTA button, **When** the link resolves, **Then** they navigate to the product's configured offer URL.
5. **Given** a URL contains a code that matches no product, or matches a `draft` product, **When** results render, **Then** that code is silently skipped (no broken/empty card).
6. **Given** a URL contains no `pr` code, **When** results render, **Then** no Product Card renders and the page is identical to today's results.
7. **Given** a product has no video URL configured, **When** the card renders, **Then** the card displays correctly without a video region (no broken player).

---

### User Story 2 — Code is captured at entry and survives to results (Priority: P1)

The `pr` code(s) appear on the **first page** the email link hits (landing or assessment), but the assessment takes several minutes and the canonical results URL is `/results/[resultId]`, which does not carry the original query string. The system captures the code(s) at first load, holds them through the assessment, and persists them onto the session so the correct product(s) render on results with 100% reliability — including when the result is later reopened via its shareable link.

**Why this priority**: Without reliable persistence, the product would intermittently fail to show (the param is lost mid-funnel), breaking every campaign. This is the mechanism that makes US1 trustworthy.

**Independent Test**: Land on the entry page with `?pr=ab3`, complete the assessment, and confirm the resolved codes are stored on the `assessment_sessions` row. Reopen `/results/[resultId]` directly (no query string) and confirm the card still renders.

**Acceptance Scenarios**:

1. **Given** a user lands on any entry page with `?pr=ab3`, **When** the page loads, **Then** the code is captured client-side immediately (before the user proceeds).
2. **Given** the user submits the assessment, **When** the session is written, **Then** the resolved, ordered list of codes is persisted on the `assessment_sessions` row alongside existing acquisition metadata.
3. **Given** the canonical results page `/results/[resultId]` is opened with no query string, **When** it renders, **Then** the product card(s) appear based on the persisted codes.
4. **Given** a result link is shared and reopened by a third party, **When** results render, **Then** the same product card(s) appear (product selection is a property of the session, consistently reproduced).
5. **Given** an entry URL carries no `pr` code, **When** the session is written, **Then** no product codes are persisted and results render with no card.

---

### User Story 3 — Anyone creates and previews a product without a developer (Priority: P1)

A non-technical user (Charl) opens the admin dashboard, goes to **Products**, and creates a new product by filling in its fields. As they type, a **live preview** of the real Product Card updates beside the form so they see exactly what visitors will see. On save, the system assigns a unique short code automatically (with an option to override). The product starts as a **draft** and only appears on results once set to **active**.

**Why this priority**: Self-serve creation is the core scalability goal — it removes the developer/deploy bottleneck the config-sheet approach would have created. Without it, every campaign waits on engineering.

**Independent Test**: In the admin, create a product, watch the preview update live, save it, confirm a unique code is generated, set it to active, and confirm it then renders on results when its code is used.

**Acceptance Scenarios**:

1. **Given** an authenticated admin opens Products → New, **When** they fill in the fields, **Then** a live preview renders the actual Product Card component with the draft data (true WYSIWYG, not a mock).
2. **Given** the admin saves a product without specifying a code, **When** it is created, **Then** the system generates a unique short opaque code (3–6 chars) and stores it.
3. **Given** the admin chooses to override the code, **When** they enter a value, **Then** it is validated for format and uniqueness before saving (collision or invalid format is rejected with a clear message).
4. **Given** a newly created product, **When** it is saved, **Then** its status defaults to `draft` and it does **not** render on results until set to `active`.
5. **Given** required fields are missing or malformed (e.g. invalid offer URL), **When** the admin attempts to save, **Then** the save is blocked with field-level validation messages.
6. **Given** an admin edits an `active` product and saves, **When** a visitor next loads results with that code, **Then** the updated content appears (no deploy required).

---

### User Story 4 — Admin manages the product catalogue (Priority: P2)

The admin dashboard gains a root-level navigation between **Stats** and **Products**, reusing the existing admin auth and layout. The Products view lists every product with its code, name, status (draft/active), and quick actions (edit, activate/deactivate). This gives Charl a single place to see which codes exist to drop into campaign URLs.

**Why this priority**: Needed for day-to-day operation and to look up codes when building campaigns, but the feature can ship and be demonstrated with create + display (US1–US3) before the full catalogue management is polished.

**Independent Test**: Create several products, open the Products list, and confirm each appears with its code and status; toggle one between draft and active and confirm the change reflects on results.

**Acceptance Scenarios**:

1. **Given** an authenticated admin, **When** they open the admin dashboard, **Then** a root-level nav offers `Stats` and `Products` without duplicating the existing dashboard shell or auth.
2. **Given** products exist, **When** the admin opens Products, **Then** a list shows each product's code, name, and status with edit and activate/deactivate actions.
3. **Given** the admin deactivates a product, **When** a visitor loads results with that code, **Then** no card renders for it.
4. **Given** the admin needs a code for a campaign, **When** they view the list, **Then** each product's short code is clearly visible to copy into a URL.

---

### User Story 5 — Per-product engagement is measurable (Priority: P2)

When a Product Card is shown and when its CTA is clicked, an event is recorded so the admin can see per-product impressions and click-through. This proves which offers convert and informs future campaigns.

**Why this priority**: Charl needs a signal on whether a given product is working, but the feature delivers value (showing offers) before analytics are wired.

**Independent Test**: Render a results page with an active product, click the CTA, then confirm `product_cta_shown` and `product_cta_clicked` events are recorded for that product code and surface in the admin.

**Acceptance Scenarios**:

1. **Given** a Product Card renders on results, **When** it is shown, **Then** a `product_cta_shown` event is recorded with the product code and the session's `anon_session_id`.
2. **Given** a user clicks a Product Card CTA, **When** the click fires, **Then** a `product_cta_clicked` event is recorded with the product code and session id.
3. **Given** shown/clicked events exist, **When** the admin views product analytics, **Then** impressions, clicks, and click-through rate per product are visible.

---

### Edge Cases

- **Unknown / inactive / deleted code in URL**: silently skipped — the rest of the codes still render; never a broken or empty card.
- **Duplicate codes in one URL** (`?pr=ab3&pr=ab3`): de-duplicated; the product renders once.
- **Many codes stacked**: render all matching active products in order; consider a sane upper bound for layout (see Assumptions) — excess codes beyond the bound are ignored and the drop is not silent in analytics.
- **Token with no value** (e.g. `{weakestElement}` when scores are tied / unavailable): render a sensible fallback or omit the token gracefully — never show a raw `{token}` to the user.
- **Code captured but session never submitted**: nothing persists; no card — expected.
- **Product set to `draft` after a campaign URL is already in the wild**: the code is treated as no-match → skipped. (Deactivating mid-campaign is the documented "pull the offer" lever.)
- **Video host is not Vimeo** (a future product uses another host): the video field stores a URL; the player is built to swap hosts without a schema change (Vimeo is the v1 target).
- **PDF generation**: the Product Card is **excluded from the v1 PDF** — the PDF (spec 006) renders without it, regardless of persisted codes.
- **Code format collision on auto-generate**: regenerate until unique; guaranteed by a uniqueness constraint.
- **Malformed offer URL entered in admin**: rejected at save with validation; cannot reach the results page.

## Requirements *(mandatory)*

### Functional Requirements

**Product Card (display)**
- **FR-001**: System MUST render a Product Card on the results page **below** the existing archetype name/description, without altering any existing results content.
- **FR-002**: The Product Card MUST render these product-owned fields: headline, sub-headline, hosted video (optional), eyebrow, CTA headline, CTA copy, CTA button label, and CTA button link.
- **FR-003**: System MUST interpolate result-derived tokens in the CTA copy: `{overallScore}`, `{archetypeName}`, `{firstName}`, `{weakestElement}`, replacing each with the viewing user's real values; an unresolved token MUST NOT be shown verbatim.
- **FR-004**: System MUST render one card per matching active code, stacked in the order the codes appear in the URL.
- **FR-005**: When no code is present or no code matches an active product, the system MUST render no Product Card (results identical to current behaviour).
- **FR-006**: The Product Card MUST be excluded from the v1 results PDF.

**Selection, capture & persistence**
- **FR-007**: System MUST read `pr` code(s) from the URL on the first page load of the funnel (landing or assessment) and capture them client-side immediately.
- **FR-008**: System MUST support multiple stacked codes via repeated `pr` params (`?pr=ab3&pr=cd7`), preserving order and de-duplicating.
- **FR-009**: System MUST persist the resolved, ordered code list onto the `assessment_sessions` row at submission, alongside existing acquisition metadata.
- **FR-010**: The results page (including the canonical `/results/[resultId]` opened with no query string, and shared reopens) MUST resolve products from the persisted codes, not the live URL.
- **FR-011**: System MUST validate each code against the `products` table at render time and skip any code that is missing or not `active`.

**Admin product management**
- **FR-012**: Authenticated admins MUST be able to create, edit, activate/deactivate, and list products through the existing admin dashboard.
- **FR-013**: The admin create/edit form MUST show a live preview rendering the real Product Card component with the in-progress data.
- **FR-014**: System MUST auto-generate a unique short opaque code (3–6 chars) on create, with an option for the admin to override it; overrides MUST be validated for format and uniqueness.
- **FR-015**: A product MUST default to `draft` on creation and MUST only render on results when `active`.
- **FR-016**: System MUST validate product fields at the API boundary (required fields present, offer/video URLs well-formed) and reject invalid saves with clear messages.
- **FR-017**: The admin dashboard MUST present a root-level navigation between `Stats` and `Products`, reusing the existing auth and layout (no duplicate admin app).
- **FR-018**: The Products list MUST display each product's code, name, and status, and make the code easy to copy into a campaign URL.

**Analytics**
- **FR-019**: System MUST record a `product_cta_shown` event (with product code + `anon_session_id`) when a Product Card is shown, and a `product_cta_clicked` event when its CTA is clicked, via the existing event sink.
- **FR-020**: The admin MUST be able to view per-product impressions, clicks, and click-through rate.

### Key Entities *(include if feature involves data)*

- **Product**: A promotable offer. Attributes: unique short code, name (internal), status (`draft` | `active`), headline, sub-headline, video URL (optional), eyebrow, CTA headline, CTA copy (may contain tokens), CTA button label, CTA button link, timestamps. Created/edited via the admin; read by the results page.
- **Session product selection**: The ordered list of product codes resolved for a session, persisted on the existing `assessment_sessions` row (extends current acquisition metadata). Drives which products render on that session's results.
- **Product engagement event**: A `product_cta_shown` / `product_cta_clicked` record tied to a product code and the session's anonymous id, written to the existing `assessment_events` stream.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A campaign visitor entering via a `pr` code sees the correct Product Card on results in **100%** of completed sessions (no intermittent loss through the funnel), including on shared-link reopens.
- **SC-002**: A non-technical user can create a new product and have it live on results **without any developer involvement or deploy**, in under 5 minutes.
- **SC-003**: Organic/direct/returning traffic (no `pr` code) sees a results page **identical to today** — zero product promotion, no regressions.
- **SC-004**: Stacking multiple codes renders the corresponding cards in URL order with no layout breakage at the supported maximum.
- **SC-005**: Every product impression and CTA click is attributable to a specific product code in the admin, enabling per-product click-through measurement.
- **SC-006**: The v1 results PDF never contains a Product Card.

## Approach

**Selection model — campaign-driven, persisted to session.** Codes are captured at first touch, held client-side, and written to `assessment_sessions` at submission (reusing the acquisition-metadata mechanism already in the event schema). The results page resolves products from the persisted codes, decoupling display from the fragile live query string and making product selection a stable property of the session (and thus of shared result links).

*Alternatives considered*: (a) carry the `pr` param through every URL to the results page — rejected as fragile (param lost across the multi-minute assessment and absent from the canonical `/results/[resultId]`); (b) derive the product from the user's score band — rejected because campaigns must show a chosen offer regardless of result.

**Config model — database-backed, self-serve.** Products live in a Supabase `products` table edited at runtime via the admin, not in a version-controlled `src/data/*.ts` file.

*Alternatives considered*: config-as-code (a sheet Charl fills → developer translates to a TS config → deploy) — rejected because it puts a developer/deploy in the path of every product and bottlenecks campaigns. The DB approach fits the stack with no friction: the results page is already `force-dynamic` reading Supabase, so activations are immediate, and the existing admin (Supabase Auth + dashboard shell from specs 005/007) is extended rather than duplicated.

**Codes — short and opaque.** 3–6 char codes, auto-generated with optional override, deliberately non-descriptive so the promotion mechanism is not self-evident in a shared URL. Validated for format and uniqueness.

## Out of Scope (v1) / Future

- **Archetype- or score-targeted product display.** v1 shows a product to anyone carrying its code, regardless of result. Targeting rules ("show product X only to archetype Y" or score bands) are a **planned future enhancement** — noted here and to be logged in the project roadmap.
- **Product Card in the PDF.** Excluded in v1; may be revisited.
- **Non-Vimeo video hosts.** v1 targets Vimeo; the URL field and player are built to allow other hosts later without a schema change.
- **A/B testing or rotation of products** within a single code.

## Assumptions

- The Product Card is **purely additive**; no existing results-page content is changed or removed. The personalised archetype reveal remains in its current sections.
- Email/campaign links may land on either the landing page or the assessment page; capture-on-first-load covers both.
- Video hosting is **Vimeo** (or similar) for v1; the schema stores a URL, not a provider-specific id.
- The existing admin authentication (Supabase Auth, specs 005/007) governs who can manage products; no new auth model is introduced.
- The results page's existing `force-dynamic` Supabase read path is reused, so activated products appear without cache invalidation work.
- A sensible upper bound on simultaneously stacked products will be set for layout sanity (proposed default: a small number, exact value TBD in planning).
- This is a **post-launch** enhancement (after the 2026-06-15 controlled-cohort launch), so its scope is not constrained by the v1 launch timeline.
