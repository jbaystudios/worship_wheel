# Quickstart: Admin Dashboard UI Refinements

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md)

A runbook for the engineer implementing this spec. Follow it top-to-bottom. Each phase has a clear exit condition; do not advance until it is met.

## Pre-flight

- Branch is `007-admin-dashboard-ui-refinements`. Confirm with `git branch --show-current`.
- Spec 005 is merged and `/admin` works end-to-end on `main`. If not, stop — this spec depends on it.
- Dev server runs cleanly (`npm run dev`), tests pass (`npm test`, `npm run test:e2e`).
- Local Supabase has at least one full week of seeded sessions, events, and leads — drill-down detail views are visually unverifiable on empty data.

## Phase A — Design system (MANDATORY before any UI code)

Per `CLAUDE.md`, no UI implementation begins before the design system is generated.

1. Run UI/UX Pro Max:
   ```bash
   python3 .claude/skills/ui-ux-pro-max/scripts/search.py \
     "enterprise admin dashboard analytics drill-down" \
     --design-system --persist -p "Worship Wheel"
   ```
2. Pull stack guidelines:
   ```bash
   python3 .claude/skills/ui-ux-pro-max/scripts/search.py \
     "drill-down detail view" --stack nextjs
   ```
3. Supplement as needed:
   ```bash
   python3 .claude/skills/ui-ux-pro-max/scripts/search.py "chart consistency" --stack nextjs
   python3 .claude/skills/ui-ux-pro-max/scripts/search.py "data table sort pagination" --stack nextjs
   ```
4. Review the generated system. Reconcile against the Brand Guide tokens — every colour, spacing, radius, and font-size mentioned must already exist as a variable (Theme / Sizes / Typography). Note any exceptions.

**Exit condition**: A persisted design system under the `Worship Wheel` key, with no token gaps that require new Brand Guide variables.

## Phase B — IA scaffolding (routes + URL state, no styling yet)

1. Create `src/lib/admin/url-state.ts` with `decode(searchParams)`, `encode(state)`, `canonical(searchParams)`. Cover with `src/__tests__/admin/url-state.test.ts` (round-trip; default elision; unknown-key tolerance; sort whitelist validation).
2. Create `src/components/admin/drilldown/DrilldownLink.tsx` that wraps `<Link>`, reads current `searchParams` (via `useSearchParams` or a server-only equivalent in RSC), layers in destination overrides, and emits a canonical URL. Cover with `drilldown-link.test.ts`.
3. Scaffold the new routes as empty Server Components that render only `<PageHeader>` + a placeholder. The full route list is in [plan.md](./plan.md) under "Source Code". This is the IA's skeleton — it should navigate end-to-end before any visual polish.
4. Run `npm run dev` and click through every route — overview → list → detail and back — confirming the URL state propagates correctly.

**Exit condition**: All new routes reachable, all navigation preserves date range / internal-traffic / filters in the URL, and `npm test` passes the URL-state and drill-down unit tests.

## Phase C — Page-rhythm primitives + state primitives

1. Build `src/components/admin/shell/PageHeader.tsx`, `Breadcrumb.tsx`, `SectionRhythm.tsx`. Use Brand Guide tokens for every value.
2. Build `src/components/admin/states/Skeleton.tsx`, `ErrorState.tsx`. Update `EmptyState.tsx` to accept contextual props.
3. Add a `loading.tsx` next to every `page.tsx` in `(dashboard)/` rendering a layout-shaped skeleton.
4. Wire `ErrorState` into the existing error path on `/admin` and extend it across the other three overview pages.

**Exit condition**: Loading, empty, and error states render consistently on every overview and detail route. Visual diff against the design system from Phase A is acceptable.

## Phase D — Chart theming

1. Build `src/components/admin/charts/chartTheme.ts` exporting `chartDefaults(overrides?)` — a deep-merge helper returning Chart.js options bound to the Brand Guide tokens (grid colour, axis colour, tooltip styling, hover state, single accent ramp).
2. Migrate `FunnelChart` and `OutcomeCharts` to consume `chartDefaults`.
3. Build `ArchetypeRadar` for the archetype detail view — small-multiple radar matching the consumer `/results` chart styling, using `chartDefaults` with a radar-specific override layer.
4. Capture before/after screenshots for the PR description.

**Exit condition**: All charts share a single visual style. No chart reads a colour from a Tailwind class or a hard-coded value.

## Phase E — KPI / list / table primitives

1. Build `src/components/admin/kpi/MetricTile.tsx` with `variant: 'primary' | 'secondary'`. Primary uses accent treatment and larger typography; secondary uses neutral.
2. Build `src/components/admin/lists/TopList.tsx`, `RecentList.tsx`, `DataTable.tsx`.
3. Migrate `StatCard` consumers to `MetricTile` (most are demoted to `secondary`; exactly one per page becomes `primary`).
4. Migrate `LeadsTable`, `DropoffTable`, `SourceTable` to consume `DataTable` under the hood, preserving their public APIs.

**Exit condition**: Every overview renders exactly one `MetricTile variant="primary"` and the rest as `secondary`. Tables share one visual treatment.

## Phase F — Section-by-section build-out

For each section, build the overview surface, then the drill-down list, then the detail view. Stop and screenshot at each stage.

1. **Funnel** — overview → `/admin/funnel/questions` → `/admin/funnel/questions/[id]`. The biggest-drop-off callout links straight to a question detail.
2. **Acquisition** — overview → `/admin/acquisition/sources` → `/admin/acquisition/sources/[id]`. Source detail includes the attributable-leads list with `DrilldownLink` to `/admin/leads/[id]`.
3. **Outcomes** — overview → `/admin/outcomes/archetypes` → `/admin/outcomes/archetypes/[id]`; also `/admin/outcomes/elements`. Archetype detail uses `ArchetypeRadar` and lists contributing leads.
4. **Leads** — overview → `/admin/leads/all` → `/admin/leads/[id]`; also `/admin/leads/sync-failures`. Lead detail surfaces the existing Keap retry action.

Run the `frontend-design` skill per page to refine spacing, hierarchy, and micro-interactions. Keep diffs small and reviewable.

**Exit condition**: All five user stories from the spec pass their independent tests manually in dev.

## Phase G — Component folder reorganisation

Once the new components are in place and consumers migrated, move existing components into the new taxonomy (`shell/`, `states/`, `charts/`, `kpi/`, `lists/`, `drilldown/`). Update imports via a single codemod-style pass. No behaviour changes in this phase.

**Exit condition**: `src/components/admin/` matches the layout described in [plan.md](./plan.md). No dangling imports. Build and tests pass.

## Phase H — Test coverage

1. `src/__tests__/admin/url-state.test.ts` — already in Phase B; ensure full coverage.
2. `src/__tests__/admin/drilldown-link.test.ts` — already in Phase B.
3. Add `chart-theme.test.ts` for `chartDefaults` shape.
4. New e2e specs under `tests/e2e/admin/`:
   - `drilldown-funnel.spec.ts`
   - `drilldown-acquisition.spec.ts`
   - `drilldown-outcomes.spec.ts`
   - `drilldown-leads.spec.ts`
   - `visual-language.spec.ts` (loading skeleton, empty state per page, error state, keyboard tab order, reduced-motion)

**Exit condition**: `npm test && npm run test:e2e` green. Coverage on `src/lib/admin/url-state.ts` ≥ 95%.

## Phase I — Pre-delivery checklist

Run the UI/UX Pro Max pre-delivery checklist. Manually verify:

- One primary metric per page; secondary content stepped down.
- All charts share one visual style.
- Loading skeletons match final layout; no spinners; no layout shift.
- Empty and error states contextual and consistent.
- All values resolve through Brand Guide variables (`grep -E 'text-|bg-|border-|p-|m-|rounded-' src/app/admin src/components/admin` to spot-check that classes use token names, not raw values).
- Tablet (768–1024) and mobile (375–767) — no horizontal scroll except inside opt-in scroll regions.
- Keyboard tab order matches visual order; visible focus state on every interactive element.
- `prefers-reduced-motion: reduce` suppresses or instantises every animation.
- No regression in spec 005: search, CSV export, sync retry, event tracking still work.

**Exit condition**: Every box ticked. Open the PR.

## PR description template

```
## What
UI/UX/IA refinement of the four admin sections per spec 007.

## How
- Single-level drill-down IA on Funnel, Acquisition, Outcomes, Leads.
- Page-rhythm + state primitives.
- Single Chart.js theme.
- No new dependencies, no new Supabase schema, no new APIs.

## Screenshots
[Before / after per section]

## Token exceptions
[Any hard-coded value, with rationale. Should be empty.]

## Spec 005 regression checks
[ ] Auth gate enforced on all new routes
[ ] CSV export still works on /admin/leads/all
[ ] Keap sync retry exposed on /admin/leads/[id] and /admin/leads/sync-failures
[ ] First-party event emission unaffected
```

## Estimate

- Phase A (design system): ~half a day.
- Phase B (IA scaffolding + URL state + tests): ~1 day.
- Phase C (page-rhythm + state primitives): ~1 day.
- Phase D (chart theming + ArchetypeRadar): ~half to 1 day.
- Phase E (KPI / list / table primitives): ~1 day.
- Phase F (section-by-section build-out, all four): ~3 days.
- Phase G (folder reorganisation): ~half a day.
- Phase H (test coverage): ~1 day.
- Phase I (pre-delivery + PR): ~half a day.

Total estimate: **8–9 working days** for a single engineer.
