# Tasks: Worship Wheel Results Page

**Input**: Design documents from `/specs/003-results-page/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: No explicit test tasks — this is a visual UI feature validated against Figma. Existing scoring logic (calculator, archetypes, bands) already has 38 passing unit tests from spec 002.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Single project within `worship-wheel/src/`
- All new components go in `worship-wheel/src/components/results/`
- Results page at `worship-wheel/src/app/results/page.tsx`

---

## Phase 1: Setup

**Purpose**: Create directory structure and verify Chart.js is ready to use

- [X] T001 Create `worship-wheel/src/components/results/` directory
- [X] T002 Create `worship-wheel/src/app/results/` directory

---

## Phase 2: Foundational (Shared Types & Data Flow)

**Purpose**: Wire the sessionStorage contract and redirect so the results page has data to render

**CRITICAL**: No user story work can begin until this phase is complete. Without the sessionStorage bridge, the results page has nothing to display.

- [X] T003 Update `worship-wheel/src/app/assessment/page.tsx` to store API response as JSON in `sessionStorage.setItem('worshipWheelResult', ...)` after successful submit, then call `router.push('/results')` using `next/navigation` useRouter. Replace the current `console.log` stub.
- [X] T004 Create `worship-wheel/src/app/results/page.tsx` as a client component shell that reads `sessionStorage.getItem('worshipWheelResult')` on mount, parses it into a typed `AssessmentResult & { sessionId, firstName }` shape, and renders an empty state (with link to `/assessment`) if missing. No visual components yet — just the data loading skeleton.

**Checkpoint**: Data flow wired. Mock data from quickstart.md can verify the page loads — components not yet rendered.

---

## Phase 3: User Story 1 — View My Assessment Results (Priority: P1) 🎯 MVP

**Goal**: Render the radar chart, score summary, element breakdown, and archetype card so users can see their complete results

**Independent Test**: Inject mock data from quickstart.md into sessionStorage, navigate to `/results`, verify radar chart reflects scores, stat cards show correct values, 8 element bars display with proper color coding, and archetype card shows name + message.

### Radar Chart

- [X] T005 [US1] Create `worship-wheel/src/components/results/RadarChart.tsx` — client component that takes `elementScores: ElementScore[]` as props, registers Chart.js components (`Chart.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip)`), and renders `<Radar />` from `react-chartjs-2`. Configure: 8 axes (FB, HM, ML, RH, TO, TH, TE, AU), polygon fill using `accent-500` with 40% opacity, border color `accent-500`, point radius 6, grid lines in `neutral-800`, angle lines in `neutral-800`, axis labels in `accent-400` font-bold 14px, min 0 max 10 with stepSize 2, no legend. Set `responsive: true` and `maintainAspectRatio: true`. Container should be 836px max width on desktop, scale proportionally on mobile.

### Score Summary

- [X] T006 [P] [US1] Create `worship-wheel/src/components/results/ScoreSummary.tsx` — three stat cards in horizontal flex layout (stacking to column on mobile via `max-md:flex-col`). Each card: `rounded-md bg-theme-bg-2 p-space-5` with center-aligned vertical layout (`gap-space-3`). Card 1 "Overall Score": label in `text-text-sm text-theme-text-muted`, value `{overallScore}/80` in `text-h4 font-bold text-accent-500`, `{overallPercentage}%` below in `text-text-sm text-theme-text-muted`. Card 2 "Balance": value `{balance.value}` in `text-h4 font-bold text-accent-500`, "out of 10" below. Card 3 "Profile": archetype name (stripped of "The " prefix) in `text-h6 font-bold text-accent-500` center-aligned. Props: `overallScore`, `overallPercentage`, `balance`, `archetypeName`.

### Element Breakdown

- [X] T007 [P] [US1] Create `worship-wheel/src/components/results/ElementBreakdown.tsx` — section with heading "Element Breakdown" in `text-h4 font-bold text-center` and 8 rows mapping over `elementScores`. Each row: `flex items-center gap-space-3 rounded-sm border p-space-3` with conditional border color (`border-accent-500` for score ≥ 5, `border-warning-400` for score ≤ 4). Row layout: info block on left (element name `font-bold` + band label with color-coded text), horizontal score bar in middle (full-width `h-3 rounded-full bg-theme-border` with inner fill `h-full rounded-full` width `{score * 10}%` and conditional bg `bg-accent-600` or `bg-warning-500`), score number on right (`text-h5 font-bold` with conditional color). Props: `elementScores: ElementScore[]`.

### Archetype Card

- [X] T008 [P] [US1] Create `worship-wheel/src/components/results/ArchetypeCard.tsx` — card with radial gradient background (CSS: `bg-[radial-gradient(circle_at_top,theme(colors.accent.900),theme(colors.accent.950))]`), `rounded-md p-space-7 max-md:p-space-4` layout. Contents (vertical gap-space-4 center-aligned): "YOUR PROFILE" label in `text-text-sm font-medium text-accent-400 uppercase tracking-[0.2em]`, archetype name in `text-h3 max-md:text-h4 font-bold text-theme-text`, message in `text-text-lg max-md:text-text-base text-theme-text-muted max-w-[700px]`, video placeholder below as `aspect-video w-full max-w-[1024px] rounded-sm bg-neutral-900 border border-neutral-700 flex items-center justify-center` with "Watch: Your personalised results explained" text in `text-text-sm text-theme-text-muted`. Props: `archetypeName`, `archetypeMessage`.

### Compose Results Page

- [X] T009 [US1] Update `worship-wheel/src/app/results/page.tsx` to import and render: navbar (same pattern as assessment page), hero section with background image, `<RadarChart />`, `<ScoreSummary />`, `<ElementBreakdown />`, `<ArchetypeCard />` in vertical order. Wrap each section in appropriate max-width containers (`max-w-[1344px] mx-auto`) with responsive padding (`px-site-margin py-section-sm`). Keep the empty-state fallback from T004 for the case where sessionStorage is missing.

**Checkpoint**: User Story 1 complete — users can see their complete visual results. CTA and share come next.

---

## Phase 4: User Story 2 — Personalised CTA (Priority: P2)

**Goal**: Display a dynamic CTA banner that promotes the correct WGS offering based on the user's overall score

**Independent Test**: Manually set sessionStorage with mock data for each CTA tier (overall scores 20, 35, 50, 70) and verify the banner shows the correct label and description for each tier.

- [X] T010 [P] [US2] Create `worship-wheel/src/components/results/CtaBanner.tsx` — full-width banner with radial gradient background (`bg-[radial-gradient(circle_at_center,theme(colors.neutral.850),theme(colors.neutral.950))]`), `py-section-sm px-site-margin`. Inner card: `rounded-md bg-accent-950 p-space-8 max-md:p-space-5` with vertical center-aligned layout (`gap-space-4`). Contents: "READY TO LEVEL UP?" in `text-text-sm font-medium text-accent-400 uppercase tracking-[0.2em]`, heading using `cta.label` (prefixed with "Start the " for tier 2, or used directly for other tiers) in `text-h3 max-md:text-h4 font-bold text-theme-text text-center`, description in `text-text-sm text-theme-text-muted text-center max-w-[600px]` that reads "Based on your score of {overallScore}/80, {cta.description} is designed to help you grow." Button: `inline-flex rounded-sm bg-btn-primary px-space-5 py-[12px] text-text-base font-bold text-btn-primary-text hover:bg-btn-primary-hover` with label "Start the {cta.label}" or "Get Started". Props: `cta: CtaBand`, `overallScore: number`.
- [X] T011 [US2] Update `worship-wheel/src/app/results/page.tsx` to import and render `<CtaBanner cta={result.cta} overallScore={result.overallScore} />` after `<ArchetypeCard />`.

**Checkpoint**: User Stories 1 and 2 both work independently. Users see results and are prompted toward the correct offering.

---

## Phase 5: User Story 3 — Share My Worship Wheel (Priority: P3)

**Goal**: Allow users to copy their results link or share via Web Share API

**Independent Test**: Click "Copy Link" and verify clipboard contains current URL + "Copied!" confirmation appears. Click "Share" on a mobile device or Chrome/Safari desktop and verify native share sheet opens.

- [X] T012 [P] [US3] Create `worship-wheel/src/components/results/ShareSection.tsx` — client component with `'use client'` directive. Layout: `flex flex-col items-center gap-space-4 py-section-sm px-site-margin max-md:px-space-4`. Contents: full-width divider `h-[1.5px] w-full max-w-[1344px] bg-theme-border`, descriptive text "Share your Worship Wheel with your band or worship team" in `text-text-sm font-medium text-theme-text-muted text-center`, button row `flex gap-space-3` with two buttons. Both buttons styled as secondary: `inline-flex rounded-sm border border-theme-text bg-transparent px-space-5 py-[10px] text-text-base font-bold text-theme-text hover:bg-theme-text hover:text-neutral-950 transition-colors`. Button 1 "Copy Link" — onClick: calls `navigator.clipboard.writeText(window.location.href)` and sets local state `copied=true` for 2 seconds, label switches to "Copied!" while true. Button 2 "Share" — onClick: uses `navigator.share({ title: 'My Worship Wheel', url: window.location.href })` if `navigator.share` exists, otherwise falls back to the same clipboard copy behaviour as Copy Link.
- [X] T013 [US3] Update `worship-wheel/src/app/results/page.tsx` to import and render `<ShareSection />` after `<CtaBanner />` as the final section.

**Checkpoint**: All three user stories complete. Users can view, convert, and share.

---

## Phase 6: Polish & Validation

**Purpose**: Final pixel accuracy pass, responsive validation, and build verification

- [X] T014 Run `cd worship-wheel && npx tsc --noEmit` to verify TypeScript compiles with no errors
- [X] T015 Run `cd worship-wheel && npx next build` to verify production build succeeds
- [X] T016 Run `cd worship-wheel && npx vitest run` to verify all existing scoring tests still pass (38 tests from spec 002)
- [X] T017 [P] Visual validation at desktop 1440px — start dev server, inject mock data via quickstart.md snippet, navigate to `/results`, compare side-by-side with Figma screenshot of node 99:47. Verify radar chart shape, stat card alignment, element bar colors, archetype gradient, CTA card styling.
- [X] T018 [P] Visual validation at mobile 375px — resize viewport, verify: stat cards stack vertically, element rows remain readable, radar chart scales proportionally, archetype card text wraps correctly, buttons fit screen width.
- [X] T019 Verify empty state — clear sessionStorage, navigate to `/results`, confirm friendly empty state shows with link to `/assessment`.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — trivial directory creation
- **Foundational (Phase 2)**: Depends on Setup. BLOCKS all user stories. T003 and T004 must complete before any UI work.
- **User Story 1 (Phase 3)**: Depends on Foundational. The MVP — delivers the core visual result.
- **User Story 2 (Phase 4)**: Depends on Foundational. Independent of US1, but naturally rendered after US1 components in the page composition.
- **User Story 3 (Phase 5)**: Depends on Foundational. Independent of US1 and US2.
- **Polish (Phase 6)**: Depends on all user story phases being complete.

### Within Each User Story

- **US1**: T005, T006, T007, T008 can run in parallel (different component files). T009 (page composition) depends on all four.
- **US2**: T010 (component) must complete before T011 (page integration).
- **US3**: T012 (component) must complete before T013 (page integration).

### Parallel Opportunities

- **Phase 3 (US1)**: T005, T006, T007, T008 in parallel — four independent component files
- **Phase 3 + Phase 4 + Phase 5** can run in parallel after Phase 2 if multiple developers available (components are independent)
- **Phase 6**: T017 and T018 in parallel (visual validation at different viewports)

---

## Parallel Example: After Phase 2 Completes

```bash
# All 4 US1 component tasks can launch in parallel (different files):
Task T005: "Build RadarChart.tsx"
Task T006: "Build ScoreSummary.tsx"
Task T007: "Build ElementBreakdown.tsx"
Task T008: "Build ArchetypeCard.tsx"

# Plus US2 and US3 components if working in parallel:
Task T010: "Build CtaBanner.tsx"
Task T012: "Build ShareSection.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (trivial)
2. Complete Phase 2: Foundational (data flow + empty state)
3. Complete Phase 3: User Story 1 (radar, summary, breakdown, archetype)
4. **STOP and VALIDATE**: Visual comparison with Figma, test with real submission
5. Deploy to preview — core results page is functional

### Incremental Delivery

1. Phases 1–2: Foundation ready
2. Add US1: Users see their Worship Wheel (MVP!)
3. Add US2: CTA banner drives conversion
4. Add US3: Share drives organic reach
5. Polish: Pixel accuracy and responsive validation

### Solo Developer Strategy (Recommended)

Since this is a single-developer project, execute sequentially:

1. Phase 1 (Setup) → Phase 2 (Foundational) → Phase 3 (US1)
2. Validate MVP visually
3. Phase 4 (US2) → Phase 5 (US3) → Phase 6 (Polish)

Within US1, build components in parallel-ready order: T005 (chart) → T006/T007/T008 (can be batched) → T009 (compose).

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- Source of truth for visual design: Figma node 99:47, "Results Page"
- All scoring types and data come from existing `src/types/index.ts` and `src/lib/scoring/`
- No new dependencies — Chart.js and react-chartjs-2 already installed
- sessionStorage contract documented in data-model.md
- Mock data snippet for quick testing is in quickstart.md
- The video placeholder (T008) is intentionally static — no embed functionality in this spec
- Supabase persistence for shareable URLs is deferred to a follow-up spec
