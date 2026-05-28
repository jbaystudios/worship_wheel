# Feature Specification: Admin Dashboard UI Refinements

**Feature Branch**: `007-admin-dashboard-ui-refinements`
**Created**: 2026-05-28
**Status**: Draft
**Target window**: Post-v1-launch (after 2026-06-12). Sequenced behind the parked admin-dashboard polish in spec 005.
**Input**: Audit the four admin pages built in spec 005 (Funnel, Acquisition, Outcomes, Leads) and refine them to enterprise-grade quality. Apply progressive-disclosure / drill-down patterns so the user is guided through data instead of confronted with everything at once. Align the visual language with Vercel's dashboard aesthetic while staying inside the existing Brand Guide token system.

## Context

Spec 005 shipped a working but visually flat admin dashboard. All four sections — Funnel, Acquisition, Outcomes, Leads — currently render as single, long pages with stat cards, full tables, and full charts stacked vertically inside a `max-w-6xl` container. There is no overview-to-detail flow: a stakeholder opening Acquisition sees every UTM source, every referrer, and every direct visit at once; opening Leads sees the entire lead table; opening Funnel sees the full per-question drop-off list inline beneath the headline funnel.

This works as an MVP, but at lead volumes beyond a few hundred sessions it will feel like a data dump rather than an executive surface. The intent of this spec is to:

1. **Restructure each page into an overview-first, drill-down-on-demand IA**, so the dashboard answers the headline question on screen one and lets the user navigate into the supporting detail when (and only when) they want it.
2. **Lift the visual language to an enterprise standard** modelled on the Vercel dashboard — calm, monochrome with a single accent, generous whitespace, dense-but-restrained typography, small-multiple chart treatments, and clear state transitions.
3. **Preserve all existing data, routes, and APIs.** No new analytics, no schema changes, no new Keap integration work. This spec is pure UI/UX/IA.

### Decisions captured from stakeholder clarification (2026-05-28)

- **Timing**: post-v1-launch (after 2026-06-12). Not a launch blocker.
- **Design flow**: code-first using the `frontend-design` and `ui-ux-pro-max` skills. No Figma redesign artifact required. Existing Brand Guide tokens (Theme, Sizes, Typography) remain the source of truth — do not introduce hard-coded values.
- **Drill-down depth**: single-level. Each section gets an overview surface and one dedicated detail view per drill-down target. No multi-level (overview → segment → individual) and no inline-only expansion.
- **Visual reference**: Vercel dashboard. Calm monochrome neutrals with a single accent, restrained density, strong typographic hierarchy, generous whitespace.

### Out of scope

- Editing assessment questions, recommendations, or CTA URLs.
- New analytics signals, new event types, new Supabase tables, new RPCs.
- Anomaly alerts, scheduled email digests, or any push delivery — this remains a pull-only dashboard.
- Auth, role, or allowlist changes.
- Mobile-app native shell. Dashboard remains responsive web; "world-class on desktop, usable on tablet, readable on phone" is the bar.
- Any change to the Keap sync architecture or the underlying RPCs.

## Current State Audit (informative)

The following observations are the basis for the refinement work. They are not requirements; they are the baseline the new design must improve on.

- **Shell** (`src/app/admin/(dashboard)/layout.tsx`): top-bar layout with a horizontal nav, capped at `max-w-6xl`. No sidebar, no breadcrumb, no page-level secondary nav.
- **Funnel** (`/admin`): four `StatCard` tiles, one `FunnelChart`, and one inline `DropoffTable` listing every question. Per-question detail (timing, sticking-point analysis, distribution of answers) lives in the same table — there is no dedicated question view.
- **Acquisition** (`/admin/acquisition`): a single page that groups UTM, referrer, and direct traffic into stacked tables. No source-detail view.
- **Outcomes** (`/admin/outcomes`): archetype distribution and average-score-per-element rendered as bar/list visualisations. No archetype-detail view.
- **Leads** (`/admin/leads`): full searchable lead table with CSV export. No individual lead profile, no Keap sync-health drill-in.
- **Visual treatment**: borders, stat cards, and tables all use Theme tokens correctly, but the page rhythm is uniform — every section sits at the same visual weight, with no hierarchy between "headline answer" and "supporting detail". Charts and tables share the same card chrome with no differentiation.

## User Scenarios & Testing

### User Story 1 — Overview-First Funnel with Per-Question Drill-Down (Priority: P1)

A stakeholder opens `/admin` and immediately sees the **headline answer**: visitors → started → completed → leads, the four KPIs with period-over-period deltas, the funnel chart, and a compact "biggest drop-off" callout naming the worst-performing question. The full per-question table is reachable from a clearly labelled "View per-question drop-off" affordance, which navigates to a dedicated `/admin/funnel/questions` view. From that view, selecting any question opens a per-question detail surface showing time-on-question distribution, abandonment rate, answer distribution, and the sticking-point flag in context.

**Why this priority**: The Funnel page is the dashboard's front door. The biggest UX lift in the whole spec is replacing the inline drop-off table with a curated summary plus a dedicated detail surface — it sets the IA pattern every other section will follow.

**Independent Test**: Open `/admin` and confirm only the headline funnel + KPI cards + the single biggest-drop-off callout are visible above the fold. Confirm the per-question table no longer renders inline. Click "View per-question drop-off" → land on `/admin/funnel/questions` and see the full table. Click any row → land on `/admin/funnel/questions/[id]` and see that question's detail surface. Browser back returns to the overview without losing the active date range.

**Acceptance Scenarios**:

1. **Given** the stakeholder loads `/admin`, **When** the page renders with data present, **Then** they see only: page header, date range control, four KPI tiles with period-over-period deltas, the funnel chart, and one "biggest drop-off" callout. The full per-question drop-off table is **not** rendered on this page.
2. **Given** the overview funnel has data, **When** it renders, **Then** the callout names the question with the worst step-over-step completion rate and links to that question's detail view directly.
3. **Given** the stakeholder activates the "View per-question drop-off" affordance, **When** the link is followed, **Then** they arrive on `/admin/funnel/questions` showing the complete ordered table that previously rendered on `/admin`.
4. **Given** the per-question list view, **When** the stakeholder selects any question row, **Then** they navigate to a dedicated detail view for that question.
5. **Given** any drill-down navigation, **When** the user activates browser back, **Then** the date range, internal-traffic toggle, and any active filters from the parent view are preserved.
6. **Given** the overview has no data for the selected period, **When** it renders, **Then** the empty state is shown at the overview level and no drill-down affordance is displayed.

---

### User Story 2 — Acquisition Overview with Per-Source Drill-Down (Priority: P1)

A stakeholder opens `/admin/acquisition` and sees an at-a-glance summary: total visits in period, top three sources by visit volume, top three sources by lead-capture rate (with a guardrail for low-volume noise), and a compact source-mix chart. The flat triple-table from the current implementation is moved behind a "View all sources" affordance that opens `/admin/acquisition/sources`. From that view, selecting a source opens `/admin/acquisition/sources/[id]` showing that source's funnel curve, completion rate, lead-capture rate, and the leads it generated in the active period.

**Why this priority**: Acquisition is the most data-dense current page. Drill-down here delivers the biggest reduction in cognitive load.

**Independent Test**: Load `/admin/acquisition` and confirm only the overview surfaces (KPIs, top-3 lists, source-mix visual) are visible. Confirm the full UTM/referrer/direct tables no longer render inline. Drill into "View all sources", confirm the consolidated table renders, drill into a source row, confirm the per-source detail surface renders with that source's funnel and lead list.

**Acceptance Scenarios**:

1. **Given** the stakeholder loads `/admin/acquisition`, **When** it renders, **Then** they see the page header, date range control, the totals KPI tile, the top-3-by-volume list, the top-3-by-conversion-rate list (with a clearly displayed minimum-volume threshold to suppress noise), and a source-mix visual. The full tri-tabbed/tri-table breakdown is **not** rendered on this page.
2. **Given** the overview, **When** the "View all sources" affordance is activated, **Then** the user lands on `/admin/acquisition/sources` showing a single unified, sortable table that subsumes UTM, referrer, and direct traffic into one ranked list.
3. **Given** the source list view, **When** any source row is selected, **Then** the user lands on `/admin/acquisition/sources/[id]` showing that source's per-step funnel, its completion rate, its lead-capture rate, and the captured leads attributable to it in the active period.
4. **Given** the per-source view, **When** the leads attributable to that source are listed, **Then** each row links into the corresponding lead detail (US4) — drill-downs compose.
5. **Given** zero data in the period, **When** the overview renders, **Then** an empty state replaces the entire body and no drill-down affordances are shown.

---

### User Story 3 — Outcomes Overview with Per-Archetype Drill-Down (Priority: P2)

A stakeholder opens `/admin/outcomes` and sees the headline archetype mix (which archetypes are dominant in the cohort) and average score per element, alongside a single callout naming the lowest-scoring element across all completers. The detailed archetype list and the per-element score breakdown move behind "View archetypes" → `/admin/outcomes/archetypes` and "View element scores" → `/admin/outcomes/elements`. Selecting an archetype opens `/admin/outcomes/archetypes/[id]` showing that archetype's sample size, its average per-element profile (as a radar small-multiple matching the consumer results page), and the leads currently classified into it.

**Why this priority**: Outcomes is the lowest-stakes section operationally but the highest-leverage one for product insight. Drill-down materially improves its usefulness once cohort size grows.

**Independent Test**: Load `/admin/outcomes` and confirm only the headline mix + element-average summary + lowest-element callout are visible. Drill into archetypes, confirm the archetype list renders. Drill into an archetype, confirm its sample size, average-element profile, and contributing leads render.

**Acceptance Scenarios**:

1. **Given** the stakeholder loads `/admin/outcomes`, **When** it renders, **Then** they see the archetype-mix visual, the eight-element average bar/dot summary, and one "weakest element overall" callout. Full archetype list and full per-element breakdown are not rendered inline.
2. **Given** the archetype list view, **When** an archetype is selected, **Then** the detail view renders: sample size, per-element radar small-multiple (consistent with the consumer `/results` chart styling), and the contributing leads for the active period.
3. **Given** the contributing-leads list in archetype detail, **When** any lead row is selected, **Then** the lead detail view (US4) opens, preserving the date range.
4. **Given** zero data in the period, **When** the overview renders, **Then** an empty state replaces the body.

---

### User Story 4 — Leads Overview with Per-Lead Drill-Down and Sync-Health Drill-In (Priority: P1)

A stakeholder opens `/admin/leads` and sees the headline numbers: total leads in period, breakdown by Keap sync state (synced / pending / failed) as a single tile cluster, and the **ten most recent leads** as a preview list. The full searchable lead table moves behind "View all leads" → `/admin/leads/all`. Selecting any lead opens `/admin/leads/[id]` showing that lead's profile (name, email, source, completion timestamp, archetype, element scores) and its Keap sync state with retry affordance. A separate "Sync failures" tile on the overview links to `/admin/leads/sync-failures` showing only failing rows with retry actions.

**Why this priority**: Leads is the page where PII density is highest. Showing the full table inline by default is the worst-case for both signal-to-noise and accidental exposure. Drill-down resolves both at once. Also the only operational drill-down (sync retries) — practical impact on Charl's daily work.

**Independent Test**: Load `/admin/leads`, confirm the lead count, sync-state tiles, and a recent-10 preview render — and that the full table does not. Drill into "View all leads", confirm the existing searchable table with CSV export renders unchanged. Drill into a lead row, confirm the lead detail view renders. From overview, drill into "Sync failures", confirm only failed rows render with retry actions exposed.

**Acceptance Scenarios**:

1. **Given** the stakeholder loads `/admin/leads`, **When** it renders, **Then** they see KPI tiles for total leads and sync-state counts, a recent-10 preview list, and clear affordances to "View all leads" and "Sync failures". The full searchable table is not rendered inline.
2. **Given** "View all leads" is activated, **When** `/admin/leads/all` renders, **Then** the searchable, exportable, paginated table from spec 005 renders unchanged in capability (no regression in search, CSV export, or filters).
3. **Given** any lead row is selected from either preview or the all-leads view, **When** the row is activated, **Then** the user lands on `/admin/leads/[id]` showing the lead profile, its source attribution, its archetype + element scores (linked back into US3 archetype detail), and its Keap sync state with timestamp and last error message if any.
4. **Given** a lead with a failed Keap sync, **When** the detail view renders, **Then** a "Retry sync" action is available and uses the existing sync mechanism without exposing any new API.
5. **Given** "Sync failures" is activated, **When** `/admin/leads/sync-failures` renders, **Then** only rows in the failed state are listed, each with retry exposed inline.
6. **Given** any deep link to `/admin/leads/[id]` or `/admin/leads/sync-failures`, **When** the user is unauthenticated, **Then** the existing auth gate from spec 005 applies and they are redirected to sign-in.

---

### User Story 5 — Enterprise Visual Language Pass (Priority: P1)

A stakeholder opens any dashboard page and the experience reads as enterprise software, not as a prototype. Hierarchy is unambiguous (one primary visual on each page), density is calm rather than crowded, charts share a single restrained visual style, the accent colour appears sparingly and only on the primary action / headline metric per page, and all states (loading, empty, error) feel intentional and consistent.

**Why this priority**: The drill-down IA from US1–US4 is only half the work. Without a coherent visual pass, more pages just means more flat surfaces. This story is the connective tissue.

**Independent Test**: A reviewer who has never seen the dashboard can name the headline metric of each page within three seconds. Loading, empty, and error states are visually consistent across all four sections. Every page passes the UI/UX Pro Max pre-delivery checklist for the `nextjs` stack.

**Acceptance Scenarios**:

1. **Given** any overview page, **When** it renders, **Then** exactly one element is treated as the page's primary metric (largest typographic weight, optional accent treatment) and all other elements step down in visual weight.
2. **Given** any chart on any page, **When** it renders, **Then** it shares a single chart visual style across the dashboard: same grid treatment, same axis treatment, same colour ramp, same hover/focus state.
3. **Given** any page in a loading state, **When** the user is waiting on data, **Then** a skeleton in the shape of the final layout is shown. No spinners, no layout shift on data arrival.
4. **Given** any page in an empty state, **When** zero data exists for the period, **Then** the empty state is contextual to that page (mentions the page subject) and offers the one most-useful action (widen date range, or clear filters).
5. **Given** any page in an error state, **When** a data load fails, **Then** the error surface uses the existing error token treatment, names the failed resource, and exposes a retry without losing the active date range.
6. **Given** any page, **When** inspected for token usage, **Then** every colour, spacing, radius, border, and font-size value resolves through a Brand Guide variable. No hard-coded hex, px, or rem values.
7. **Given** any page on tablet (768–1024px) and mobile (375–767px), **When** it renders, **Then** the IA degrades gracefully — primary metric and primary chart remain visible, secondary content collapses behind disclosure affordances. No horizontal scroll except inside opt-in scroll regions (e.g. wide tables in `/admin/leads/all`).
8. **Given** any page, **When** the user navigates by keyboard, **Then** all interactive elements have a visible focus state and the tab order matches the visual order.
9. **Given** any animated transition, **When** the user has `prefers-reduced-motion: reduce`, **Then** the animation is suppressed or replaced with an instant state change.

## Drill-Down IA Summary (informative)

A single-level drill-down IA, applied uniformly to all four sections. Detail routes are siblings of their overview, not nested deeper. Date range, internal-traffic toggle, and any active filters propagate through the URL so back-navigation always restores the prior view.

| Overview | Drill-down route(s) | Detail route(s) |
|---|---|---|
| `/admin` (Funnel) | `/admin/funnel/questions` | `/admin/funnel/questions/[id]` |
| `/admin/acquisition` | `/admin/acquisition/sources` | `/admin/acquisition/sources/[id]` |
| `/admin/outcomes` | `/admin/outcomes/archetypes`, `/admin/outcomes/elements` | `/admin/outcomes/archetypes/[id]` |
| `/admin/leads` | `/admin/leads/all`, `/admin/leads/sync-failures` | `/admin/leads/[id]` |

## Design System & Stack Hooks

The implementing engineer must:

1. **Run the UI/UX Pro Max design-system generator first** before writing any UI code, with a query scoped to "enterprise admin dashboard analytics" and persisted under the `Worship Wheel` project key (per the workflow in `CLAUDE.md`).
2. **Pull the `nextjs` stack guidelines** from the same skill.
3. **Apply the `frontend-design` skill** as the implementation companion for component-by-component refinement.
4. **Bind every value through Brand Guide tokens**: Theme for colour, Sizes for spacing/radius/font-size, Typography for font family/weight. Document any unavoidable exception inline in the PR description, not silently in code.
5. **Run the pre-delivery checklist** from the UI/UX Pro Max skill before opening the PR.

## Constraints & Non-Goals

- No new Supabase tables, columns, RPCs, or migrations. All detail views must be powered by the existing data layer from spec 005 — or by trivially derivable selections (e.g. filtering an existing list by one field).
- No new third-party UI dependencies. Continue using the in-repo component primitives and Tailwind.
- No regression to the existing search, filter, CSV export, or Keap sync-retry capabilities — they must be reachable from the new IA, not removed by it.
- No change to the consumer assessment, `/results`, or PDF download surfaces. This spec is admin-only.

## Dependencies

- Spec 005 (`005-admin-dashboard`) must remain code-complete and merged. This spec presumes its data layer, auth gate, and event tracking are in place.
- Brand Guide Figma file remains the design-token source of truth even though no Figma redesign artifact is produced — the implementer reads variable values via the existing token bridge.

## Success Criteria

1. Every section has a clearly identifiable "front door" overview that answers the headline question on screen one and defers detail behind exactly one navigation hop.
2. Visual language reads as enterprise-grade on first impression — verifiable by a reviewer naming the headline metric of each page within three seconds.
3. Loading, empty, and error states are visually consistent and intentional across all sections.
4. Every value resolves through a Brand Guide variable.
5. Keyboard navigation, focus states, and reduced-motion handling pass the UI/UX Pro Max pre-delivery checklist.
6. No regression in any spec 005 capability (auth, search, CSV export, sync retry, event tracking).
