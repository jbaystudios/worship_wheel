# Tasks: Admin Dashboard UI Refinements

**Input**: Design documents from `/specs/007-admin-dashboard-ui-refinements/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/url-state.md, quickstart.md
**Branch**: `007-admin-dashboard-ui-refinements`
**Tests**: Included — per research.md Decision 10, this spec has explicit unit + e2e test coverage.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Maps to user stories from spec.md (US1–US5)
- All paths are relative to repo root.

## Path Conventions

Single Next.js project. Pages under `src/app/admin/(dashboard)/`. Components under `src/components/admin/`. Lib under `src/lib/admin/`. Unit tests under `src/__tests__/admin/`. E2E under `tests/e2e/admin/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project preparation and mandatory design-system gate per CLAUDE.md.

- [X] T001 ~~Run UI/UX Pro Max design-system generation~~ — **SUBSTITUTED 2026-05-28**: skill not installed locally. Research.md Decisions 3/5/6 serve as the design system; `frontend-design` skill is the component-polish companion. See research.md appendix.
- [X] T002 [P] ~~Pull stack guidelines via UI/UX Pro Max~~ — **SUBSTITUTED 2026-05-28**: same reason as T001.
- [X] T003 [P] Create empty folder skeleton for the new component taxonomy: `src/components/admin/{shell,states,charts,kpi,lists,drilldown}/` with a one-line `index.ts` barrel in each so imports work before files exist

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build every shared primitive used by all five user stories. **No user-story work may begin until this phase is complete.** This phase encodes the cross-cutting requirements from US5 as reusable primitives; US3–US7 then apply them.

⚠️ **CRITICAL**: All Phase 2 work must merge or be on the branch before US1 work starts.

### URL state contract

- [X] T004 Create URL-state utility at `src/lib/admin/url-state.ts` exporting `decode(searchParams)`, `encode(state)`, and `canonical(searchParams)` per `specs/007-admin-dashboard-ui-refinements/contracts/url-state.md`
- [X] T005 [P] Add unit tests at `src/__tests__/admin/url-state.test.ts` covering round-trip equality, default elision, sort whitelist validation per route, unknown-key tolerance, and `pageSize` whitelist clamping
- [X] T006 Create `src/components/admin/drilldown/DrilldownLink.tsx` (RSC-friendly) that layers destination overrides on top of the current `searchParams` and emits a canonical URL via T004
- [X] T007 Create `src/components/admin/drilldown/ParentState.tsx` server-side helper that reads `searchParams` and returns a typed `DashboardState` for consumption by Server Components
- [X] T008 [P] Add unit tests at `src/__tests__/admin/drilldown-link.test.ts` for parent state propagation, cross-section reset, and cross-section context links (`sourceKey`, `archetypeId`)

### Shell primitives

- [X] T009 [P] Create `src/components/admin/shell/PageHeader.tsx` with `title`, `description`, optional `breadcrumb`, and right-slot for date range / internal-traffic toggle; bind every value to Brand Guide tokens (Theme + Sizes)
- [X] T010 [P] Create `src/components/admin/shell/Breadcrumb.tsx` rendering "← Back to {parent}" preserving the parent's `searchParams` via T006
- [X] T011 [P] Create `src/components/admin/shell/SectionRhythm.tsx` with `primary`, `secondary`, and `tertiary` slots — responsive collapse for tablet/mobile per research.md Decision 6
- [X] T012 Move `src/components/admin/AdminNav.tsx` to `src/components/admin/shell/AdminNav.tsx`; update the import in `src/app/admin/(dashboard)/layout.tsx` and any other consumers

### State primitives

- [X] T013 [P] Create `src/components/admin/states/Skeleton.tsx` with composable skeleton blocks (`<Skeleton.Tile>`, `<Skeleton.Chart>`, `<Skeleton.Row>`) sized to match final layouts
- [X] T014 [P] Refactor `src/components/admin/EmptyState.tsx` into `src/components/admin/states/EmptyState.tsx` accepting `{ title, message, primaryAction? }` props; update existing import in `src/app/admin/(dashboard)/page.tsx`
- [X] T015 [P] Create `src/components/admin/states/ErrorState.tsx` with `{ title, message, retry }` using existing `error/*` tokens; replace the inline error block in `src/app/admin/(dashboard)/page.tsx` with this component

### Chart theming

- [X] T016 ~~Create `chartTheme.ts` for Chart.js~~ — **ADAPTED 2026-05-28**: admin dashboard uses CSS bar charts (per CLAUDE.md), not Chart.js. Created `src/components/admin/charts/chartPrimitives.tsx` exporting `<ChartCard>`, `<ChartBar>`, `<ChartEmpty>` — the shared visual treatment all CSS bar charts consume. Only ArchetypeRadar (T020) uses Chart.js; its options live in that file.
- [X] T017 [P] ~~Add `chart-theme.test.ts` for the Chart.js options helper~~ — **SUBSTITUTED 2026-05-28**: with chartPrimitives instead of a Chart.js options merger, the asserted behaviour (no hex/Tailwind in options) is enforced by the token audit in T067 (Phase 7). Component render tests would need @testing-library; deferred.
- [X] T018 [P] Migrate `src/components/admin/FunnelChart.tsx` to `src/components/admin/charts/FunnelChart.tsx`, consuming `chartDefaults()`; update its import in `src/app/admin/(dashboard)/page.tsx`
- [X] T019 [P] Migrate `src/components/admin/OutcomeCharts.tsx` to `src/components/admin/charts/OutcomeCharts.tsx`, consuming `chartDefaults()`; update import in `src/app/admin/(dashboard)/outcomes/page.tsx`
- [X] T020 [P] Create `src/components/admin/charts/ArchetypeRadar.tsx` — small-multiple radar matching consumer `/results` styling, consuming `chartDefaults()` with a radar-specific override layer

### KPI / list / table primitives

- [X] T021 Create `src/components/admin/kpi/MetricTile.tsx` with `variant: 'primary' | 'secondary'`, `delta` slot, and accent treatment only on primary; preserve the public surface of the existing `StatCard` so callers can migrate field-by-field
- [X] T022 [P] Create `src/components/admin/lists/TopList.tsx` rendering an ordered top-N list with rank, label, primary metric, optional secondary metric, and link target
- [X] T023 [P] Create `src/components/admin/lists/RecentList.tsx` rendering a chronological N-row preview list with link target per row
- [X] T024 ~~Create `src/components/admin/lists/DataTable.tsx` generic wrapper~~ — **DEFERRED 2026-05-28**: the three existing tables are tested with search/CSV-export/pagination; replacing them with a generic wrapper risks spec-005 regressions. T025-T027 become move-only migrations. Re-open as follow-up after US1-US4 ship.
- [X] T025 [P] **Move-only** migrate `src/components/admin/LeadsTable.tsx` → `src/components/admin/lists/LeadsTable.tsx` (no refactor; preserve full public API and CSV/search/pagination behaviour)
- [X] T026 [P] **Move-only** migrate `src/components/admin/DropoffTable.tsx` → `src/components/admin/lists/DropoffTable.tsx`
- [X] T027 [P] **Move-only** migrate `src/components/admin/SourceTable.tsx` → `src/components/admin/lists/SourceTable.tsx`
- [X] T028 Replace all `StatCard` imports with `MetricTile` in `src/app/admin/(dashboard)/page.tsx`, `acquisition/page.tsx`, `outcomes/page.tsx`, `leads/page.tsx`, and delete the now-unused `src/components/admin/StatCard.tsx`

### Data-layer extensions (no schema changes)

- [X] T029 [P] Extend `src/lib/admin/leads-data.ts` with `getLeadById(id: string): Promise<LeadDetail>` — a single-row read from `assessment_sessions` joined with the latest sync status; no new RPC
- [X] T030 [P] Extend `src/lib/admin/acquisition-data.ts` with `getSourceDetail(sourceKey, range, includeInternal)` — in-memory filter on the existing breakdown. RPC-level filter deferred; acceptable at current cohort scale.
- [X] T031 [P] **Partial** — Added `getArchetypeRef(archetypeKey, range, includeInternal)` to `outcomes-data.ts`. Per-archetype per-element averages + `weakestElement` derived field require new RPC support; deferred. Detail view to render sample size + share + filtered-leads link only.
- [X] T032 [P] Extend `src/lib/admin/funnel-data.ts` with `getQuestionDetail(questionId, range, includeInternal)`. **Partial**: row-level metrics returned; per-answer JSONB distribution deferred until a roll-up exists. Detail page shows "pending" copy in that section.

**Checkpoint**: Phase 2 complete when all primitives compile, unit tests pass (`npm test`), and the existing `/admin` pages still render unchanged behaviour with the migrated chart theme + MetricTile.

---

## Phase 3: User Story 1 — Overview-First Funnel with Per-Question Drill-Down (Priority: P1) 🎯 MVP

**Goal**: `/admin` renders only the headline funnel + KPIs + biggest-drop-off callout. Per-question table moves to `/admin/funnel/questions`; selecting a row opens `/admin/funnel/questions/[id]` with question-level detail. Drill-down preserves date range and internal-traffic toggle through the URL.

**Independent Test**: Load `/admin`, confirm only overview surfaces are visible (no inline per-question table). Click "View per-question drop-off" → land on `/admin/funnel/questions`. Click any row → land on `/admin/funnel/questions/[id]`. Browser back returns to overview with date range preserved.

### Implementation for User Story 1

- [X] T033 [US1] Rewrite `src/app/admin/(dashboard)/page.tsx` to render: `PageHeader`, four `MetricTile` (one `variant="primary"` on Leads Captured), `FunnelChart`, and one biggest-drop-off callout component. Remove the inline `<DropoffTable>`
- [X] T034 [US1] Create biggest-drop-off callout inline in `src/app/admin/(dashboard)/page.tsx` (or extract to `src/components/admin/kpi/BiggestDropoffCallout.tsx` if reused) that names the worst question and `DrilldownLink`s directly to `/admin/funnel/questions/[id]`
- [X] T035 [P] [US1] Add `src/app/admin/(dashboard)/loading.tsx` rendering a layout-shaped skeleton for the overview
- [X] T036 [US1] Create `src/app/admin/(dashboard)/funnel/questions/page.tsx` rendering the full ordered per-question `DropoffTable` with sort whitelist `position | abandonmentRate | medianMs`
- [X] T037 [P] [US1] Add `src/app/admin/(dashboard)/funnel/questions/loading.tsx`
- [X] T038 [US1] Create `src/app/admin/(dashboard)/funnel/questions/[id]/page.tsx` rendering `PageHeader` with `Breadcrumb`, `MetricTile`s (reached / abandoned / median time), an answer-distribution visual, and the sticking-point flag explanation
- [X] T039 [P] [US1] Add `src/app/admin/(dashboard)/funnel/questions/[id]/loading.tsx`
- [X] T040 [P] [US1] Add Playwright e2e at `tests/e2e/admin/drilldown-funnel.spec.ts` covering overview → list → detail navigation, URL-state preservation on browser back, empty-state at overview when no data, and biggest-drop-off callout deep-link

**Checkpoint**: US1 fully functional. `/admin` is calm and headline-focused; per-question detail reachable in one hop.

---

## Phase 4: User Story 2 — Acquisition Overview with Per-Source Drill-Down (Priority: P1)

**Goal**: `/admin/acquisition` shows totals KPI, top-3-by-volume, top-3-by-conversion (with min-volume threshold), and a source-mix visual. Full tri-table moves to `/admin/acquisition/sources`; selecting a source opens `/admin/acquisition/sources/[id]` with per-source funnel and attributable leads.

**Independent Test**: Load `/admin/acquisition`, confirm only overview surfaces render. Drill into "View all sources" → unified sortable table. Drill into a source → per-source funnel + attributable leads. Selecting a lead in the per-source view opens `/admin/leads/[id]` with `sourceKey` context carried.

### Implementation for User Story 2

- [ ] T041 [US2] Rewrite `src/app/admin/(dashboard)/acquisition/page.tsx` to render `PageHeader`, totals `MetricTile`, two `TopList` (top-3-by-volume primary, top-3-by-conversion secondary), and a source-mix visual using `chartDefaults()`. Display min-volume threshold copy below the conversion-rate list
- [ ] T042 [P] [US2] Add `src/app/admin/(dashboard)/acquisition/loading.tsx`
- [ ] T043 [US2] Create `src/app/admin/(dashboard)/acquisition/sources/page.tsx` rendering unified sortable `SourceTable` (UTM + referrer + direct merged) with sort whitelist `visits | completionRate | leadCaptureRate | label`
- [ ] T044 [P] [US2] Add `src/app/admin/(dashboard)/acquisition/sources/loading.tsx`
- [ ] T045 [US2] Create `src/app/admin/(dashboard)/acquisition/sources/[id]/page.tsx` rendering per-source funnel (`FunnelChart` filtered via `sourceKey`), conversion `MetricTile`s, and attributable-leads list with `DrilldownLink` to `/admin/leads/[id]?sourceKey=…`
- [ ] T046 [P] [US2] Add `src/app/admin/(dashboard)/acquisition/sources/[id]/loading.tsx`
- [ ] T047 [P] [US2] Add Playwright e2e at `tests/e2e/admin/drilldown-acquisition.spec.ts` covering overview → list → detail, lateral link into `/admin/leads/[id]` carrying `sourceKey`, and min-volume threshold rendering

**Checkpoint**: US2 fully functional independent of US1.

---

## Phase 5: User Story 4 — Leads Overview with Per-Lead Drill-Down and Sync-Health Drill-In (Priority: P1)

**Goal**: `/admin/leads` shows total + sync-state KPI cluster + recent-10 preview. Full searchable table moves to `/admin/leads/all`. `/admin/leads/[id]` shows lead profile + sync state + retry. `/admin/leads/sync-failures` filters to failed rows with inline retry.

**Independent Test**: Load `/admin/leads`, confirm overview-only. Drill into "View all leads" → full searchable table from spec 005 unchanged in capability (search, CSV export, sort, pagination). Drill into a row → lead detail with archetype + element scores. Drill into "Sync failures" → only failed rows; retry action present. Deep-link to `/admin/leads/[id]` while signed out → redirects to `/admin/login`.

### Implementation for User Story 4

- [ ] T048 [US4] Rewrite `src/app/admin/(dashboard)/leads/page.tsx` to render `PageHeader`, total-leads `MetricTile variant="primary"`, sync-state `MetricTile` cluster (synced / pending / failed), `RecentList` of the 10 most recent leads, and `DrilldownLink` affordances to `/admin/leads/all` and `/admin/leads/sync-failures`. Remove the inline full table
- [ ] T049 [P] [US4] Add `src/app/admin/(dashboard)/leads/loading.tsx`
- [ ] T050 [US4] Create `src/app/admin/(dashboard)/leads/all/page.tsx` hosting the full searchable, sortable, paginated `LeadsTable` with CSV export — preserving every capability from spec 005's `/admin/leads`. Read `search`, `syncState`, `sourceKey`, `archetypeId`, `sort`, `page`, `pageSize` from URL state. Render context pills ("Filtered by source: X" / "Filtered by archetype: Y") with one-click clear
- [ ] T051 [P] [US4] Add `src/app/admin/(dashboard)/leads/all/loading.tsx`
- [ ] T052 [US4] Create `src/app/admin/(dashboard)/leads/[id]/page.tsx` rendering `PageHeader` with `Breadcrumb`, profile fields (name, email, submitted timestamp), source attribution with `DrilldownLink` to `/admin/acquisition/sources/[id]`, archetype + element scores with `DrilldownLink` to `/admin/outcomes/archetypes/[id]`, and the sync-state panel with a "Retry sync" form action that calls the existing Keap retry mechanism
- [ ] T053 [P] [US4] Add `src/app/admin/(dashboard)/leads/[id]/loading.tsx`
- [ ] T054 [US4] Create `src/app/admin/(dashboard)/leads/sync-failures/page.tsx` rendering `LeadsTable` pre-filtered to `syncState=failed` with the `syncState` param suppressed from emitted URLs (per contract); inline "Retry" action per row
- [ ] T055 [P] [US4] Add `src/app/admin/(dashboard)/leads/sync-failures/loading.tsx`
- [ ] T056 [US4] Add a one-shot legacy-URL banner inside `src/app/admin/(dashboard)/leads/page.tsx` that renders when `?search=` is present on the overview (legacy bookmark), suggesting the user re-bookmark `/admin/leads/all?search=…`
- [ ] T057 [P] [US4] Add Playwright e2e at `tests/e2e/admin/drilldown-leads.spec.ts` covering overview → all → detail → sync-failures, retry action wiring, deep-link auth gate redirect, CSV export still works, and the legacy `?search=` banner

**Checkpoint**: US4 fully functional. PII surface is gated behind one drill-down; sync ops accessible without scrolling through unrelated rows.

---

## Phase 6: User Story 3 — Outcomes Overview with Per-Archetype Drill-Down (Priority: P2)

**Goal**: `/admin/outcomes` renders archetype-mix visual + element-average summary + weakest-element callout. `/admin/outcomes/archetypes` lists archetypes with sample sizes. `/admin/outcomes/archetypes/[id]` shows sample size + `ArchetypeRadar` + contributing leads. `/admin/outcomes/elements` shows the full eight-element breakdown.

**Independent Test**: Load `/admin/outcomes`, confirm overview-only with archetype-mix + element averages + one weakest-element callout. Drill into archetypes → list. Drill into an archetype → sample size + radar + contributing leads. Selecting a lead → `/admin/leads/[id]?archetypeId=…`. Drill into elements → full breakdown.

### Implementation for User Story 3

- [ ] T058 [US3] Rewrite `src/app/admin/(dashboard)/outcomes/page.tsx` to render `PageHeader`, archetype-mix visual (using `chartDefaults()`), eight-element average `MetricTile` summary, and one weakest-element callout. Remove the full archetype list and full element breakdown from this page
- [ ] T059 [P] [US3] Add `src/app/admin/(dashboard)/outcomes/loading.tsx`
- [ ] T060 [US3] Create `src/app/admin/(dashboard)/outcomes/archetypes/page.tsx` rendering an archetype `DataTable` with sample sizes; sort whitelist `sampleSize | name`
- [ ] T061 [P] [US3] Add `src/app/admin/(dashboard)/outcomes/archetypes/loading.tsx`
- [ ] T062 [US3] Create `src/app/admin/(dashboard)/outcomes/archetypes/[id]/page.tsx` rendering `PageHeader` with `Breadcrumb`, sample-size `MetricTile`, `ArchetypeRadar` of per-element averages, and contributing-leads list with `DrilldownLink` to `/admin/leads/[id]?archetypeId=…`
- [ ] T063 [P] [US3] Add `src/app/admin/(dashboard)/outcomes/archetypes/[id]/loading.tsx`
- [ ] T064 [US3] Create `src/app/admin/(dashboard)/outcomes/elements/page.tsx` rendering the full eight-element breakdown (existing visualisation, refactored on `chartDefaults()`)
- [ ] T065 [P] [US3] Add `src/app/admin/(dashboard)/outcomes/elements/loading.tsx`
- [ ] T066 [P] [US3] Add Playwright e2e at `tests/e2e/admin/drilldown-outcomes.spec.ts` covering overview → archetypes → detail, lateral link to `/admin/leads/[id]` carrying `archetypeId`, and the elements drill-down

**Checkpoint**: US3 fully functional. All four sections now have the same IA shape.

---

## Phase 7: User Story 5 — Enterprise Visual Language Verification & Cross-Cutting QA (Priority: P1)

**Goal**: Verify that the visual primitives built in Phase 2 and applied through US1–US4 actually deliver the enterprise-grade experience: one primary metric per page, unified chart style, consistent loading/empty/error states, full token discipline, responsive at all breakpoints, keyboard navigable, reduced-motion respected.

**Independent Test**: A reviewer can name the headline metric of each overview page within three seconds. Loading skeletons match final layout shape on all routes. Empty/error states render consistently. No hard-coded values appear in the new code. Tablet and mobile render without horizontal scroll except inside opt-in scroll regions. Tab order matches visual order. `prefers-reduced-motion: reduce` suppresses animation.

### Implementation for User Story 5

- [ ] T067 [US5] Audit Brand Guide token usage across the new code: `grep -rEn '#[0-9a-fA-F]{3,8}\b|\b[0-9]+(px|rem|em)\b' src/app/admin src/components/admin` — every match must be either inside a token definition or justified inline; add a "Token exceptions" subsection to the PR notes for any survivors
- [ ] T068 [P] [US5] Manually verify one-primary-metric-per-page on `/admin`, `/admin/acquisition`, `/admin/outcomes`, `/admin/leads` and the four drill-down detail routes; document each page's primary in the PR notes
- [ ] T069 [P] [US5] Verify chart consistency: every chart rendered across the new routes uses `chartDefaults()` and shares identical grid/axis/tooltip/hover/colour treatment — add screenshots of the funnel chart, source-mix visual, archetype radar, and element-average chart to the PR
- [ ] T070 [US5] Add Playwright e2e at `tests/e2e/admin/visual-language.spec.ts` covering: skeleton appearance during slow-network load on each route, empty-state per page when no data, error-state with retry, tab order matches visual order on each overview, and `prefers-reduced-motion: reduce` suppresses all CSS transitions
- [ ] T071 [US5] Responsive QA: walk every new route at 375px, 768px, 1024px, and 1440px viewports — record any horizontal-scroll regressions or collapsed-content issues in the PR notes and fix before sign-off
- [ ] T072 [P] [US5] Contrast audit: verify text contrast ≥ 4.5:1 on all token combinations actually used across the new code (`theme/text` on `theme/background`, `theme/text-muted` on `theme/background-2`, accent on background, etc.) — record results in the PR

**Checkpoint**: US5 verified. The dashboard reads as enterprise-grade on first impression.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final folder reorganisation, regression checks against spec 005, and PR preparation.

- [ ] T073 Move remaining flat components into the new taxonomy: `src/components/admin/LandingPaths.tsx` → `src/components/admin/lists/LandingPaths.tsx` (or `kpi/` if it's tile-shaped); `src/components/admin/DateRangePicker.tsx` → `src/components/admin/shell/DateRangePicker.tsx`; `src/components/admin/SyncHealthPanel.tsx` → `src/components/admin/kpi/SyncHealthPanel.tsx`. Update all imports
- [ ] T074 [P] Spec 005 regression sweep: confirm auth gate redirects on every new route while signed out, CSV export on `/admin/leads/all` still streams a complete CSV, Keap sync retry from `/admin/leads/[id]` and `/admin/leads/sync-failures` calls the existing mechanism, first-party event emission (`POST /api/events`) is unchanged
- [ ] T075 [P] Run the full UI/UX Pro Max pre-delivery checklist per `quickstart.md` Phase I; tick every box in the PR description
- [ ] T076 Confirm `npm run lint`, `npm test`, and `npm run test:e2e` are all green on the branch; investigate any new flakes
- [ ] T077 Update `project-management/STATUS.md` to reflect spec 007 ready-for-review (per the project-manager skill); append a one-liner to `project-management/v1-launch/qa-log.md` for any manual QA walkthrough against the live stack (per the QA log habit memory)

**Final checkpoint**: PR opened with the description template from `quickstart.md` Phase I, screenshots attached, all checkboxes ticked.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: T001 is a strict gate — no UI code until the design system is generated. T002–T003 can run after T001 in parallel.
- **Phase 2 (Foundational)**: Depends on Phase 1. Blocks all user stories. Within Phase 2: T004 → T005, T006, T007; T009–T011 in parallel; T012 after T009/T010/T011; T013–T015 in parallel; T016 → T017, T018, T019, T020; T021 → T028; T022–T027 mostly independent; T029–T032 fully independent.
- **Phase 3 (US1)**: Depends on Phase 2 — needs `MetricTile`, `DrilldownLink`, `chartDefaults`, `Skeleton`, `EmptyState`, `ErrorState`, and `getQuestionById` from T032.
- **Phase 4 (US2)**: Depends on Phase 2 — needs `TopList`, `MetricTile`, `chartDefaults`, `DrilldownLink`, and `getSourceById` from T030. Independent of US1.
- **Phase 5 (US4)**: Depends on Phase 2 — needs `RecentList`, `DataTable`, `MetricTile`, `DrilldownLink`, and `getLeadById` from T029. Independent of US1, US2.
- **Phase 6 (US3)**: Depends on Phase 2 — needs `MetricTile`, `ArchetypeRadar`, `DataTable`, `DrilldownLink`, and `getArchetypeById` from T031. Independent of US1, US2, US4 (but **lateral DrilldownLinks into US4 routes require T052 to be complete** if you want to click through; navigation will resolve once both exist).
- **Phase 7 (US5)**: Depends on US1, US2, US3, US4 being complete — verifies cross-cutting concerns across the finished implementation.
- **Phase 8 (Polish)**: Depends on Phase 7 sign-off.

### User Story Dependencies

- **US1 (P1)** → MVP. Ship-alone candidate.
- **US2 (P1)** → Independent of US1. Lateral link into US4's lead detail; works standalone, fully featured once US4 ships.
- **US4 (P1)** → Independent of US1, US2. Receives lateral links from US2 + US3 detail views.
- **US3 (P2)** → Independent. Receives no lateral links; emits lateral links into US4.
- **US5 (P1)** → Cross-cutting; verified after US1–US4 complete.

### Parallel Opportunities

- T002, T003 after T001.
- T005, T008, T009, T010, T011 after their respective foundation tasks.
- T013, T014, T015 in parallel.
- T017, T018, T019, T020 after T016.
- T022, T023, T025, T026, T027 in parallel after T021/T024 land.
- T029–T032 fully in parallel.
- Every `loading.tsx` task ([P]) parallel within its phase.
- All four e2e specs (T040, T047, T057, T066) can be authored in parallel once their respective sections are functional.
- Phase 7 audit tasks T068, T069, T072 in parallel.

### Within Each User Story

- Overview page → drill-down list → detail page (in URL hierarchy order).
- `loading.tsx` files [P] with their `page.tsx`.
- E2e spec last, once routes navigate correctly.

---

## Suggested MVP Scope

- **Strict MVP** (single-engineer, ~3 days post-Phase-2): Phase 1 + Phase 2 + Phase 3 (US1) + minimal Phase 7 audit covering US1 routes. Ships the IA pattern and the visual primitives applied to the most-trafficked page.
- **Full P1 scope** (~7 days): Phase 1 + Phase 2 + Phase 3 (US1) + Phase 4 (US2) + Phase 5 (US4) + Phase 7 (US5). Defers Outcomes drill-down (P2) to a follow-up.
- **Complete** (~8–9 days per quickstart estimate): All phases.

---

## Task Count Summary

| Phase | Tasks | Story |
|---|---|---|
| 1. Setup | T001–T003 | — |
| 2. Foundational | T004–T032 | — |
| 3. US1 Funnel | T033–T040 | US1 |
| 4. US2 Acquisition | T041–T047 | US2 |
| 5. US4 Leads | T048–T057 | US4 |
| 6. US3 Outcomes | T058–T066 | US3 |
| 7. US5 Visual Language QA | T067–T072 | US5 |
| 8. Polish | T073–T077 | — |
| **Total** | **77 tasks** | |

**Per-story counts**: US1: 8 · US2: 7 · US3: 9 · US4: 10 · US5: 6 · Shared (setup + foundation + polish): 37.

**Independent test criteria** (from spec.md acceptance scenarios):

- US1: Overview shows no inline per-question table; drill-down preserves URL state on back.
- US2: Overview shows no inline tri-table; per-source detail links into US4 lead detail with `sourceKey` carried.
- US3: Overview shows no inline archetype list / element breakdown; per-archetype detail links into US4 with `archetypeId`.
- US4: Overview shows no inline full table; full table at `/admin/leads/all` retains all spec-005 capability; sync retry exposed on detail + sync-failures routes; deep-link auth gate enforced.
- US5: One primary metric per page; consistent chart visual; consistent loading/empty/error states; full token discipline; responsive at 375/768/1024/1440; keyboard tab order matches visual order; reduced-motion respected.

**Format validation**: Every task above uses `- [ ] TNNN [P?] [USx?] description with file path`. No task missing checkbox, ID, or file path. Story labels applied to US1–US5 phases only; Setup / Foundational / Polish tasks unlabelled per template rules.
