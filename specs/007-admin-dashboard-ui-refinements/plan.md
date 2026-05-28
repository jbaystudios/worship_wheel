# Implementation Plan: Admin Dashboard UI Refinements

**Branch**: `007-admin-dashboard-ui-refinements` | **Date**: 2026-05-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/007-admin-dashboard-ui-refinements/spec.md`

## Summary

Restructure the four admin pages built in spec 005 (Funnel, Acquisition, Outcomes, Leads) into an overview-first, drill-down-on-demand information architecture, and lift the visual language to enterprise grade modelled on the Vercel dashboard. The work is pure UI/UX/IA: no new analytics, no new event types, no new Supabase tables, no new RPCs, no API changes.

The implementation has two interlocking halves:

1. **IA restructuring** — each section gets a curated overview surface that answers its headline question on screen one, with detail behind exactly one navigation hop. New routes are added (`/admin/funnel/questions`, `/admin/funnel/questions/[id]`, `/admin/acquisition/sources`, `/admin/acquisition/sources/[id]`, `/admin/outcomes/archetypes`, `/admin/outcomes/archetypes/[id]`, `/admin/outcomes/elements`, `/admin/leads/all`, `/admin/leads/[id]`, `/admin/leads/sync-failures`) and each consumes the existing data layer from spec 005, filtering existing collections in memory or via additional arguments to existing RPCs that already accept optional filters. No new Supabase schema.
2. **Visual language pass** — a single shared chart visual style (axis, grid, hover, colour ramp), a clear page-rhythm system (one primary metric per page, secondary content stepped down), consistent loading/empty/error states, and full Brand Guide token discipline. Implementation companions: the `ui-ux-pro-max` skill to generate the design system and the `frontend-design` skill for component-by-component refinement.

All existing capabilities (auth gate, search, CSV export, Keap sync retry, event tracking) remain reachable. No regression. No new runtime dependencies.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 20+
**Primary Dependencies**: Next.js 14 (App Router), `@supabase/ssr` (existing), `@supabase/supabase-js` (existing), Chart.js 4.4 + react-chartjs-2 (existing), Tailwind CSS 3.4 (existing). No new runtime dependencies.
**Design system tooling**: `.claude/skills/ui-ux-pro-max/` (mandatory pre-step per CLAUDE.md), `frontend-design` skill for component polish.
**Storage**: No new storage. All routes read from the existing `assessment_sessions`, `assessment_events`, and aggregate RPCs introduced in spec 005.
**Testing**: Vitest (unit — URL search-param composition, breadcrumb state, derived-list filters), Playwright (e2e — drill-down navigation preserves date range + filters, deep-link auth gate, sync-retry from new lead detail view, keyboard navigation, focus order)
**Target Platform**: Vercel (Fluid Compute) — server-rendered Next.js App Router; modern desktop, tablet (768–1024px), and mobile (375–767px) browsers
**Project Type**: Web application — admin area inside the existing single Next.js project
**Performance Goals**: Overview pages p95 < 1.5s for the default 30-day window (lighter than spec 005's 2s budget — smaller initial payload). Per-row drill-down navigation < 200ms TTFB since data is already in cache or RPC-resolvable. No Lighthouse Performance score regression versus the spec 005 baseline.
**Constraints**: No new Supabase migrations; no new third-party UI dependencies; all values resolve through Brand Guide variables; reduced-motion respected; WCAG 4.5:1 minimum text contrast; keyboard-navigable in tab order matching visual order. No regression in spec 005 capabilities.
**Scale/Scope**: ~10 new routes, ~10–15 new/refactored components, 0 schema changes, 0 API changes, ~16 stakeholder accounts max.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The project constitution (`.specify/memory/constitution.md`) remains an unpopulated template. In its absence, this plan is gated against the de-facto project standards documented in `CLAUDE.md` (consistent with the precedent set by the spec 005 plan).

| Standard (from CLAUDE.md) | Compliance |
|---|---|
| Spec-driven workflow (Spec Kit) | PASS — feature branch created, spec preceded plan, hooks honoured |
| Stack: Next.js 14 App Router, Supabase, Tailwind, Vitest, Playwright | PASS — zero stack deviation; zero net-new runtime dependencies |
| Config data as static JSON in `src/data/` | N/A — no question/recommendation config touched |
| Supabase RLS enforced on all tables | N/A — no schema changes; existing RLS unchanged |
| UI/UX Pro Max workflow mandatory for all UI work | PASS — design-system generation is the first task (T001) before any UI code is written |
| Figma variable-bound design tokens (Theme, Sizes, Typography) | PASS — every value resolves through a Brand Guide variable; exceptions documented in PR description |
| SVG icons (Heroicons / Lucide / Simple Icons), never emoji as UI icons | PASS — explicit constraint in T001 design-system generation |
| `cursor-pointer` on all clickable elements; light/dark contrast ≥ 4.5:1 | PASS — captured in the pre-delivery checklist |
| Responsive at 375 / 768 / 1024 / 1440 | PASS — explicit in US5 acceptance scenarios |
| `prefers-reduced-motion` respected | PASS — explicit in US5 acceptance scenarios |
| No secrets committed; `.env.local` only | PASS — no new env vars |

**Initial gate result: PASS** (no violations; Complexity Tracking not required).
**Post-design re-check (after Phase 1): PASS** — see end of Phase 1; the chosen single-level drill-down with URL-driven state is the simplest IA that satisfies the requirements, no new abstractions introduced.

## Project Structure

### Documentation (this feature)

```text
specs/007-admin-dashboard-ui-refinements/
├── plan.md              # This file
├── research.md          # Phase 0 — drill-down IA patterns, Vercel-style visual language, chart consistency, state primitives
├── data-model.md        # Phase 1 — view/route entities and the URL-state contract (no DB model)
├── quickstart.md        # Phase 1 — implementer runbook (design-system generation → IA scaffold → visual pass → QA)
├── contracts/
│   └── url-state.md     # Search-param contract for date range, internal-traffic toggle, filters, pagination
└── tasks.md             # Phase 2 (created by /speckit.tasks, not by this command)
```

### Source Code (repository root)

```text
src/
├── app/
│   └── admin/
│       └── (dashboard)/
│           ├── layout.tsx                              # MODIFIED — refined shell, page-rhythm primitives
│           ├── page.tsx                                # MODIFIED — overview-only funnel + biggest-drop-off callout
│           ├── funnel/
│           │   └── questions/
│           │       ├── page.tsx                        # NEW — full per-question drop-off list
│           │       └── [id]/page.tsx                   # NEW — per-question detail surface
│           ├── acquisition/
│           │   ├── page.tsx                            # MODIFIED — overview only (KPIs, top-3 lists, source-mix)
│           │   └── sources/
│           │       ├── page.tsx                        # NEW — unified source list (UTM + referrer + direct)
│           │       └── [id]/page.tsx                   # NEW — per-source funnel + attributable leads
│           ├── outcomes/
│           │   ├── page.tsx                            # MODIFIED — overview only (archetype mix + element averages)
│           │   ├── archetypes/
│           │   │   ├── page.tsx                        # NEW — archetype list
│           │   │   └── [id]/page.tsx                   # NEW — per-archetype detail
│           │   └── elements/
│           │       └── page.tsx                        # NEW — full element-score breakdown
│           └── leads/
│               ├── page.tsx                            # MODIFIED — overview only (KPIs, recent-10, drill-down affordances)
│               ├── all/page.tsx                        # NEW — full searchable lead table (moved from old /admin/leads)
│               ├── [id]/page.tsx                       # NEW — per-lead profile + sync-state + retry
│               └── sync-failures/page.tsx              # NEW — filtered to failed sync state
├── components/
│   └── admin/
│       ├── shell/
│       │   ├── PageHeader.tsx                          # NEW — uniform header + optional breadcrumb
│       │   ├── Breadcrumb.tsx                          # NEW — back-aware, preserves URL state
│       │   └── SectionRhythm.tsx                       # NEW — primary/secondary content slots
│       ├── states/
│       │   ├── Skeleton.tsx                            # NEW — page-shape skeletons (replaces ad-hoc loading)
│       │   ├── EmptyState.tsx                          # MODIFIED — contextual variants per page
│       │   └── ErrorState.tsx                          # NEW — unified error treatment with retry
│       ├── charts/
│       │   ├── chartTheme.ts                           # NEW — shared Chart.js options (grid, axes, hover, colour)
│       │   ├── FunnelChart.tsx                         # MODIFIED — adopt chartTheme
│       │   ├── OutcomeCharts.tsx                       # MODIFIED — adopt chartTheme
│       │   └── ArchetypeRadar.tsx                      # NEW — small-multiple radar for archetype detail
│       ├── kpi/
│       │   └── MetricTile.tsx                          # NEW — replaces StatCard with primary/secondary variants
│       ├── lists/
│       │   ├── TopList.tsx                             # NEW — top-3-by-X overview list primitive
│       │   ├── RecentList.tsx                          # NEW — recent-10 preview list primitive
│       │   └── DataTable.tsx                           # NEW — shared sortable/paginated table wrapper
│       ├── drilldown/
│       │   ├── DrilldownLink.tsx                       # NEW — link preserving date-range + filter URL state
│       │   └── ParentState.tsx                         # NEW — URL-state propagation helper
│       └── … (existing components remain; some renamed into subfolders)
├── lib/
│   └── admin/
│       ├── url-state.ts                                # NEW — encode/decode date range + filter URL params
│       └── … (existing data fetchers unchanged; one or two grow optional filter args)
└── __tests__/
    └── admin/
        ├── url-state.test.ts                           # NEW — unit
        ├── drilldown-link.test.ts                      # NEW — unit
        └── … (existing tests unchanged)

tests/e2e/
└── admin/
    ├── drilldown-funnel.spec.ts                        # NEW
    ├── drilldown-acquisition.spec.ts                   # NEW
    ├── drilldown-outcomes.spec.ts                      # NEW
    ├── drilldown-leads.spec.ts                         # NEW
    └── visual-language.spec.ts                         # NEW — empty/error/loading/keyboard
```

**Structure Decision**: Single Next.js project, existing `(dashboard)` route group preserved. All new routes live as siblings or one-level-nested children of their overview within `(dashboard)`. A new `src/components/admin/{shell,states,charts,kpi,lists,drilldown}/` taxonomy supersedes the flat `src/components/admin/` layout — existing components migrate into their respective subfolder during the refactor. No new top-level directories.

## Phase 0 — Research

See [research.md](./research.md) for resolved decisions on: overview-first IA patterns, drill-down state propagation, the Vercel-inspired visual system, shared Chart.js theming, skeleton/empty/error patterns, page-rhythm primitives, and the UI/UX Pro Max integration sequence.

No NEEDS CLARIFICATION items remain.

## Phase 1 — Design & Contracts

See:

- [data-model.md](./data-model.md) — view/route entities and the URL-state model.
- [contracts/url-state.md](./contracts/url-state.md) — search-param contract for date range, internal-traffic toggle, filters, pagination, and sort.
- [quickstart.md](./quickstart.md) — implementer runbook.

### Post-design Constitution re-check

Re-evaluated against CLAUDE.md standards after Phase 1 design:

- No new runtime dependencies introduced.
- No new Supabase schema, RPC, or API endpoint introduced.
- URL is the only state surface for drill-down propagation — no Redux/Zustand/Context added.
- Component folder reorganisation is additive; no breaking import changes outside `src/components/admin/`.

**Re-check result: PASS.** No new violations.

## Complexity Tracking

> Constitution Check passed at both gates. No violations to justify.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
