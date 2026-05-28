# Phase 0 — Research: Admin Dashboard UI Refinements

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md) · **Date**: 2026-05-28

This document captures the decisions, rationale, and considered alternatives behind the implementation plan. No NEEDS CLARIFICATION items remain after Phase 0.

---

## Decision 1 — Overview-first information architecture with single-level drill-down

**Decision**: Each of the four admin sections is split into (a) an overview surface answering its headline question on screen one, and (b) one or two dedicated detail routes one navigation hop away. No nested drill-downs deeper than one level. Cross-section drill-down composes by linking (e.g. an acquisition source's leads link into the lead detail), not by nesting.

**Rationale**:

- Matches the stakeholder's explicit decision in the spec clarification (single-level, code-first).
- Each section already has a clean "headline answer" candidate: Funnel → KPIs + funnel chart; Acquisition → top sources; Outcomes → archetype mix; Leads → counts + sync state.
- Keeps URLs short, predictable, and bookmarkable. Stakeholders can deep-link to "the per-question breakdown for last 30 days" without composing nested state.
- Composes laterally rather than depth-first — a lead reached from acquisition uses the same `/admin/leads/[id]` route as a lead reached from outcomes, with no per-context variation.

**Alternatives considered**:

- *Multi-level drill-down (overview → segment → record)*: Rejected. Adds breadcrumb state surface, deeper routing, and increases the chance of inconsistent context between segments. Cohort size doesn't justify the complexity.
- *Progressive disclosure in-place (expanding rows / side panels)*: Rejected. Keeps everything on one route, which is appealing for back-button behaviour, but stacks visual weight and forces a "long-scroll" page that fights the enterprise visual goal. Deep links also become harder — you can't share an "expanded row" URL without bespoke state encoding.

---

## Decision 2 — URL is the only state surface for drill-down propagation

**Decision**: All drill-down state — active date range, internal-traffic toggle, filters, sort, pagination — lives in `searchParams`. Each `DrilldownLink` propagates the parent's URL state explicitly. Server Components read `searchParams` and render accordingly. No Context, no Zustand, no Redux.

**Rationale**:

- Server Components in Next.js 14 already re-render on `searchParams` change; this is the framework-native pattern.
- Back-button "just works" because navigation is real navigation.
- Deep links carry full state, which the stakeholder explicitly needs for shareable cohort views.
- Zero new runtime dependencies (constraint from CLAUDE.md and the spec).
- Matches the precedent already in spec 005's `DateRangePicker`, which updates the URL.

**Alternatives considered**:

- *Client-side state (Context / Zustand)*: Rejected. Breaks deep linking, requires synchronisation between page loads, adds a new dependency or new home-grown abstraction.
- *Server-side session state*: Rejected. Adds storage, breaks deep linking, no upside.

---

## Decision 3 — Visual language modelled on the Vercel dashboard

**Decision**: Adopt a calm, monochrome-with-single-accent visual style: high-neutral palette anchored on `theme/background`, `theme/background-2`, `theme/border`, `theme/text`, and `theme/text-muted` from the existing Theme variable collection; accent colour (existing `accent/500`) used sparingly — at most one accent treatment per page, on the primary metric or the primary action. Generous whitespace (`space/4` between sections by default, `space/5` between page-rhythm bands). Typography hierarchy uses the existing styles (Display / H1–H6 / Text Large / Text Main / Text Small) without introducing new sizes.

**Rationale**:

- Direct match to the stakeholder's stated reference (Vercel dashboard).
- All values already exist in the Brand Guide variable collections — no new tokens needed.
- Restrained accent usage reinforces hierarchy: when the eye lands on accent, it's the primary metric or the primary action, never decoration.
- Whitespace + monochrome reads as "enterprise" rather than "consumer" without requiring a new aesthetic vocabulary.

**Alternatives considered**:

- *Linear-style (slightly higher density, cooler greys)*: Viable, similar in spirit. Rejected because the existing Brand Guide neutral ramp already biases warmer; matching Linear would push the team toward token drift.
- *Stripe-style (data-table-first, denser tables)*: Rejected as the primary mode. Stripe's density is correct for transactional dashboards with thousands of rows per session; Worship Wheel's cohort sizes (hundreds–thousands of leads per quarter) don't warrant the same density.
- *Plausible/PostHog-style (analytics-friendly, more colourful)*: Rejected. Adds chromatic noise that fights the "one accent" principle.

---

## Decision 4 — Single shared Chart.js theme module

**Decision**: A `src/components/admin/charts/chartTheme.ts` module exports a `chartDefaults(options?)` helper that returns merged Chart.js options for: axes (no x-axis ticks on funnel; horizontal grid lines only on dense charts), grid colour (`theme/border`), tick label colour (`theme/text-muted`), tick label font (Montserrat via the Typography variable), tooltip styling (`theme/background-2` background, `theme/border` border, `theme/text` text), hover state (slightly lighter than rest state), and a single colour ramp keyed to the accent. Every chart component (`FunnelChart`, `OutcomeCharts`, the new `ArchetypeRadar`) consumes this helper. No chart ever reads colours from Tailwind classnames or hard-coded values.

**Rationale**:

- US5 acceptance scenario 2 mandates a single chart visual style across the dashboard.
- Chart.js options merge cleanly via a helper, so per-chart overrides remain possible without duplication.
- Centralisation makes the inevitable future theme tweak (e.g. dark-mode polish) a one-file edit.

**Alternatives considered**:

- *Per-component inline options*: Rejected. Causes drift (the current state).
- *Switch to a different charting library (Recharts, Visx, Tremor)*: Rejected. Out of scope and would replace working code for no functional gain.

---

## Decision 5 — Skeleton-first loading, contextual empty states, unified error state

**Decision**:

- **Loading**: Each route exports a `loading.tsx` co-located with `page.tsx` that renders a `Skeleton` component shaped like the final layout (KPI tile rectangles, chart block rectangle, list-row rectangles). No spinners anywhere. No layout shift on data arrival.
- **Empty**: A single `EmptyState` component with contextual props (`title`, `message`, `primaryAction`). Each page passes a context-specific copy: "No visitors in this range. Try widening the date range." vs "No sources captured. Confirm UTM tagging on inbound links." etc.
- **Error**: A new `ErrorState` component with `title`, `message`, `retry` action. Uses the existing `error/*` token treatment from spec 005 but standardised across all routes (the current implementation has the error treatment inlined only on the funnel page).

**Rationale**:

- Skeletons keep the page rhythm intact during load → no jolting reflow.
- Centralising the three state primitives prevents the drift problem (today: only the funnel page has a styled error state; the others would throw).
- Matches the Vercel reference, which uses skeletons universally.

**Alternatives considered**:

- *Spinners over skeletons*: Rejected. Spinners signal "indefinite" and don't communicate the shape of what's coming. They also force a layout shift when content arrives.
- *Suspense boundaries with no fallback*: Rejected. Would render blank during data fetch, harming perceived performance.

---

## Decision 6 — Page-rhythm primitives (PageHeader, SectionRhythm)

**Decision**: Introduce two layout primitives:

1. **`PageHeader`** — uniform header with title (H5), description (Text Small, muted), optional breadcrumb (back to parent overview), and a right-slot for the date range picker / internal-traffic toggle. Every page (overview and detail) uses it.
2. **`SectionRhythm`** — a layout primitive that arranges children in a fixed rhythm: `primary` slot (largest visual weight, full-width or 2/3-width on desktop), `secondary` slot (1/3-width on desktop, stacked below on tablet/mobile), `tertiary` slot (collapses on tablet/mobile into a disclosure or below the fold). Replaces the current ad-hoc `<div className="flex flex-col gap-space-5">` rhythms inside each page.

**Rationale**:

- Today every page hand-rolls its layout — there's no enforced page rhythm and pages drift visually. The two primitives encode the rule.
- US5 acceptance scenario 1 requires exactly one primary metric per page — the `SectionRhythm` `primary` slot makes this structural rather than a convention engineers must remember.

**Alternatives considered**:

- *CSS Grid template areas*: Rejected. Powerful but encodes the rhythm in each page's CSS rather than in a reusable shape; primitives are easier to QA.
- *Tailwind utility-only*: Rejected. That's the current state and it has drifted.

---

## Decision 7 — Existing components migrate into the new folder taxonomy

**Decision**: As part of the visual pass, the flat `src/components/admin/` directory is reorganised into:

```
src/components/admin/
├── shell/        # PageHeader, Breadcrumb, SectionRhythm, AdminNav
├── states/       # Skeleton, EmptyState, ErrorState
├── charts/       # chartTheme, FunnelChart, OutcomeCharts, ArchetypeRadar
├── kpi/          # MetricTile (replaces StatCard)
├── lists/        # TopList, RecentList, DataTable, LeadsTable, DropoffTable, SourceTable
└── drilldown/    # DrilldownLink, ParentState
```

Existing components move in-place — imports update via a single codemod-style pass. `StatCard` is renamed to `MetricTile` to reflect its new primary/secondary variants.

**Rationale**:

- The flat directory works at four components but breaks down at the fifteen-plus this spec introduces.
- A subfolder-by-role taxonomy gives every new contributor an obvious answer to "where does this go?".
- Renames are mechanical and a one-time cost.

**Alternatives considered**:

- *Leave the flat directory alone*: Rejected. The new component count would make it unreadable.
- *Co-locate components inside `src/app/admin/(dashboard)/`*: Rejected. Several components (Skeleton, EmptyState, DrilldownLink, MetricTile, charts) are shared across all four sections — colocation would force lots of `../../../` imports.

---

## Decision 8 — UI/UX Pro Max + frontend-design skill orchestration

**Decision**: The implementing engineer's first action (T001 in the upcoming tasks.md) is to run the UI/UX Pro Max design-system generator with a query scoped to "enterprise admin dashboard analytics" and persist the result under the `Worship Wheel` project key:

```bash
python3 .claude/skills/ui-ux-pro-max/scripts/search.py \
  "enterprise admin dashboard analytics drill-down" \
  --design-system --persist -p "Worship Wheel"

python3 .claude/skills/ui-ux-pro-max/scripts/search.py \
  "drill-down detail view" --stack nextjs
```

The generated design system informs the `MetricTile`, `TopList`, `RecentList`, `DataTable`, and `chartTheme.ts` choices. The `frontend-design` skill is then engaged component-by-component to refine each surface, with screenshot-driven iteration where appropriate.

**Rationale**:

- CLAUDE.md mandates the UI/UX Pro Max workflow before any UI code is written. The plan honours this as a gate, not a suggestion.
- Persisting the design system under the project key means a future session can recall the same vocabulary.
- The `frontend-design` skill handles the per-component polish that the design system informs but doesn't dictate (micro-spacing, hover micro-interactions, focus rings).

**Alternatives considered**:

- *Skip UI/UX Pro Max and go straight to `frontend-design`*: Rejected. Violates CLAUDE.md and risks the visual pass drifting from a coherent system.
- *Use Figma to design first*: Rejected per the spec clarification (code-first chosen).

---

## Decision 9 — No new Supabase work; existing data layer extended only at the edges

**Decision**: All new routes consume the existing data-fetch helpers in `src/lib/admin/{funnel-data,acquisition-data,outcomes-data,leads-data}.ts`. Where a detail view needs a subset (e.g. "leads attributable to source X"), the helper grows an optional filter argument; it does not call a new RPC. If a filter cannot be expressed against the existing RPCs, the route filters in memory after fetching the full list — acceptable at current scale (hundreds of leads / sources per period).

**Rationale**:

- Hard constraint from the spec: no schema changes, no new RPCs, no API changes.
- Existing RPCs already accept the parameters the detail views need (date range, internal-traffic flag).
- In-memory filtering at this cohort size is trivially fast and avoids a Supabase migration cycle.

**Alternatives considered**:

- *Add new RPCs (e.g. `funnel_for_question(id, range)`)*: Rejected. Out of scope; existing aggregates already include per-question data.
- *Client-side fetch with `useSWR` for detail views*: Rejected. Server Components compose more cleanly with the URL-state model and avoid hydration thrash.

---

## Decision 10 — Test strategy: unit for state, e2e for IA, visual checks for the language pass

**Decision**:

- **Unit (Vitest)** — `url-state.test.ts` (encode/decode of search params, round-trips preserve all fields), `drilldown-link.test.ts` (parent state propagation), `chart-theme.test.ts` (helper returns expected merged options shape).
- **e2e (Playwright)** — one `drilldown-*.spec.ts` per section: navigate overview → detail → back, assert date range and filters preserved at every step; deep-link to a detail route while signed out, assert auth gate; on the lead detail, exercise the sync retry; `visual-language.spec.ts` covers loading skeleton appearance, empty state appearance per page, error state appearance, keyboard tab order, and reduced-motion behaviour.
- **Visual checks (manual)** — the UI/UX Pro Max pre-delivery checklist, run before opening the PR. No automated visual regression in this spec.

**Rationale**:

- The IA correctness is the highest-risk surface — e2e covers it end-to-end.
- URL-state composition is the highest-frequency bug area — unit tests give fast feedback.
- Automated visual regression (Percy / Chromatic) is overkill for the cohort size and would be the first new dependency this spec introduces; deferred.

**Alternatives considered**:

- *Snapshot tests of rendered HTML*: Rejected. Brittle against the visual pass — every Tailwind tweak would diff a snapshot.
- *Lighthouse-CI on the new routes*: Worth considering as a follow-up but not gated to this spec.

---

## Appendix — Implementation-time substitutions (recorded 2026-05-28)

### UI/UX Pro Max skill not installed locally

`CLAUDE.md` mandates `.claude/skills/ui-ux-pro-max/scripts/search.py` as the design-system gate (T001/T002 in `tasks.md`). On the implementing machine the skill directory does not exist — only the `frontend-design` skill is installed. Implementation substitution:

- **Design-system source**: Decisions 3 (Vercel-style monochrome with single accent), 5 (skeleton-first loading / contextual empty / unified error), and 6 (PageHeader + SectionRhythm page-rhythm primitives) in this document serve as the design system. Brand Guide token bindings (Theme / Sizes / Typography) remain the source of truth for concrete values.
- **Per-component polish**: the available `frontend-design` skill is the implementation companion, invoked during US1–US3 phases on overview surfaces and detail views.
- **Token discipline gate**: T067 token audit (grep for hex / px / rem literals in new code) remains the enforcement mechanism. No regression in token discipline is acceptable.

This substitution is recorded so a future reviewer can see why T001 was not literally executed.
