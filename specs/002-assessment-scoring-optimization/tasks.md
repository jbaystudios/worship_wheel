# Tasks: Assessment Scoring Optimization

**Input**: Design documents from `/specs/002-assessment-scoring-optimization/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md, quickstart.md

**Tests**: Included — plan.md explicitly defines unit tests (Vitest) and E2E tests (Playwright) in Phase G and project structure.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Single project within `worship-wheel/src/`

---

## Phase 1: Setup (Figma Design)

**Purpose**: Design the net-new checklist component and 5-option layout in Figma before code (Constitution requirement: Figma as Single Source of Truth)

- [ ] T001 Design the capability checklist question card in Figma (multi-select checkbox layout with 6–12 items, default/hover/selected/disabled states) using bound variables from the Brand Guide
- [ ] T002 Design the 5-option answer layout for scenario/experience question cards in Figma (update from 4 options to A–E) using bound variables
- [ ] T003 Design mobile variant (375px) of the checklist component in Figma ensuring items stack correctly

---

## Phase 2: Foundational (Types & Question Data)

**Purpose**: Define TypeScript types and question data that ALL user stories depend on

**CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 Update TypeScript types in `worship-wheel/src/types/index.ts` — add `QuestionType` union (`scenario | checklist | experience`), `ScenarioQuestion`, `ChecklistQuestion`, `ExperienceQuestion` interfaces, `Question` discriminated union, and updated `Answer` type supporting both single-select (`selectedOption` + `points`) and multi-select (`checkedItems` + `points`) per data-model.md
- [ ] T005 Rewrite question data file from `worship-wheel/src/data/placeholder-questions.ts` to `worship-wheel/src/data/questions.ts` — all 24 questions (3 per element × 8 elements) with exact text, options, and point values from `docs/Worship Wheel Assessment - Questions & Scoring Algorithm.docx`. Element order: FB → HM → ML → RH → TO → TH → TE → AU. Question order per element: scenario → checklist → experience. IDs per data-model.md convention (`fb_01`, `fb_02`, `fb_03`, etc.)

**Checkpoint**: Types and data ready — user story implementation can now begin

---

## Phase 3: User Story 1 — Answer Three Question Types Per Element (Priority: P1) MVP

**Goal**: Users encounter 3 question types per element (scenario → checklist → experience), 24 questions total, grouped by element

**Independent Test**: Walk through assessment verifying each element presents 3 questions in correct order, scenario/experience offer 5 single-select options, checklists allow multi-select

### Implementation for User Story 1

- [ ] T006 [P] [US1] Build `ChecklistCard.tsx` in `worship-wheel/src/components/assessment/ChecklistCard.tsx` — multi-select checkbox component with vertical item list, "Continue" button (always enabled since 0 selections = score 1), checked state uses gold accent, items ordered by ascending difficulty. Follow Figma design from T001
- [ ] T007 [P] [US1] Update `QuestionCard.tsx` in `worship-wheel/src/components/assessment/QuestionCard.tsx` — handle scenario and experience question types, render 5 options (A–E) instead of 4, pass `type` prop to distinguish rendering
- [ ] T008 [P] [US1] Update `AnswerOption.tsx` in `worship-wheel/src/components/assessment/AnswerOption.tsx` — support 5-option layout, option keys "a" through "e" with responsive sizing
- [ ] T009 [US1] Update assessment flow in `worship-wheel/src/app/assessment/page.tsx` — change from 16 to 24 questions, group 3 questions per element, render correct component per question type (QuestionCard for scenario/experience, ChecklistCard for checklist), wire state management for checklist multi-select answers
- [ ] T010 [US1] Ensure back-navigation in `worship-wheel/src/app/assessment/page.tsx` preserves all answer state including checklist selections (multi-select arrays must persist when navigating back/forward)

**Checkpoint**: User Story 1 complete — users can walk through all 24 questions with 3 types per element

---

## Phase 4: User Story 2 — Accurate Per-Element and Overall Scoring (Priority: P1)

**Goal**: System calculates correct scores using the final algorithm: checklist mean-of-checked, 3-question element average (rounded), overall sum (8–80), balance score (inverted SD)

**Independent Test**: Submit known answer combinations and verify element scores, overall score, percentage, and balance score match expected values

### Tests for User Story 2

- [ ] T011 [P] [US2] Write unit tests for scoring calculator in `worship-wheel/src/__tests__/unit/scoring.test.ts` — test scenario scoring (1/3/5/7/10 points), checklist mean-of-checked scoring (including empty = 1, single item, all items), element averaging with rounding, overall sum (8–80), percentage calculation, balance score formula (perfect balance = 10, maximum unevenness approaches 1, clamping to [1, 10])

### Implementation for User Story 2

- [ ] T012 [US2] Rewrite scoring calculator in `worship-wheel/src/lib/scoring/calculator.ts` — implement `scoreScenario(selectedOption)`, `scoreChecklist(checkedItems, itemPoints)` (mean of checked values, empty = 1), `scoreExperience(selectedOption)`, `scoreElement(q1Points, q2Points, q3Points)` (average, Math.round), `scoreOverall(elementScores)` (sum), `scorePercentage(overall)` ((overall/80)×100), `scoreBalance(elementScores)` (SD formula: Balance = 10 − (SD / 3.18 × 9), clamped [1, 10])
- [ ] T013 [US2] Run scoring unit tests and fix any failures — all edge cases from acceptance scenarios must pass

**Checkpoint**: User Story 2 complete — scoring engine produces correct results for any answer combination

---

## Phase 5: User Story 3 — Profile Archetype Matching (Priority: P2)

**Goal**: System assigns a profile archetype based on element scores using priority-ordered matching criteria (6 archetypes + fallback)

**Independent Test**: Submit assessments with score profiles designed to trigger each archetype and verify correct match and message

### Tests for User Story 3

- [ ] T014 [P] [US3] Write unit tests for archetype matching in `worship-wheel/src/__tests__/unit/archetype.test.ts` — test all 6 archetypes with exact threshold scores, test priority ordering (when multiple could match, first in priority wins), test fallback (strongest-element-based), test boundary conditions

### Implementation for User Story 3

- [ ] T015 [US3] Rewrite archetype matching in `worship-wheel/src/lib/scoring/archetypes.ts` — implement matching functions for each archetype with exact criteria from spec: (1) Campfire Strummer: HM >= 5, RH >= 4, all others <= 4; (2) Rhythm Machine: RH >= 7, TE >= 6, HM <= 4, FB <= 4; (3) Theory Head: TH >= 7, AU >= 6, TE <= 4, HM <= 5; (4) Almost-There Player: overall >= 55, all elements >= 5; (5) Balanced Beginner: all elements <= 4, SD <= 1.5; (6) Uneven Intermediate: max-min >= 5, SD > 2.0, overall >= 30; (7) Fallback: strongest element-based. Evaluate in this priority order, return first match with name and message
- [ ] T016 [US3] Run archetype unit tests and fix any failures — all 6 archetypes + fallback + priority ordering must pass

**Checkpoint**: User Story 3 complete — every score profile deterministically produces the correct archetype

---

## Phase 6: User Story 4 — Updated Score Bands and CTA Mapping (Priority: P2)

**Goal**: Element scores map to named bands (Formula/Foundation/Functional/Fluent/Flow), overall scores map to CTA bands with correct WGS offerings

**Independent Test**: Verify each element score maps to correct band label and each overall score triggers correct CTA

### Implementation for User Story 4

- [ ] T017 [P] [US4] Update score bands in `worship-wheel/src/lib/scoring/bands.ts` — implement `getScoreBand(elementScore)` returning band key/label/description: Formula (1–2), Foundation (3–4), Functional (5–6), Fluent (7–8), Flow (9–10). Implement `getCtaBand(overallScore)` returning CTA for ranges: 8–25 (Free Training Video), 26–40 (90-Day Breakthrough), 41–55 (WGS Academy), 56–80 (Advanced Workshops)
- [ ] T018 [P] [US4] Update `worship-wheel/src/data/recommendations.json` — replace old band labels (Beginner/Developing) with new names (Formula/Foundation/Functional/Fluent/Flow), add archetype messages for all 6 archetypes + fallback, update CTA range descriptions per contracts/api.md

**Checkpoint**: User Story 4 complete — all band labels and CTA mappings match spec exactly

---

## Phase 7: User Story 5 — Updated Progress Tracking (Priority: P2)

**Goal**: Progress bar reflects 24-question structure with 3 questions per element segment

**Independent Test**: Step through assessment verifying progress bar shows correct position (X/24), current element name, and percentage

### Implementation for User Story 5

- [ ] T019 [US5] Update `ProgressBar.tsx` in `worship-wheel/src/components/assessment/ProgressBar.tsx` — change `QUESTIONS_PER_ELEMENT` from 2 to 3, update total from 16 to 24, ensure segmented element track fills correctly (each segment = 3 questions), verify element badge shows correct name, percentage calculation uses 24 as denominator

**Checkpoint**: User Story 5 complete — progress bar accurately tracks 24-question flow

---

## Phase 8: User Story 6 — Results Loading Interstitial (Priority: P2)

**Goal**: After email gate submission, show an intermediate "analysing" page with a circular spinner before redirecting to results — perceived effort increases perceived value

**Independent Test**: Submit the email gate and verify the interstitial appears with spinner and message, stays visible for at least 2 seconds, then auto-redirects to results

### Implementation for User Story 6

- [ ] T020 [P] [US6] Design the results loading interstitial in Figma — circular progress indicator (gold accent), encouraging message ("Analysing your Worship Wheel..."), dark theme, centered layout, using bound variables from Brand Guide
- [ ] T021 [US6] Build results loading interstitial component in `worship-wheel/src/components/assessment/ResultsLoading.tsx` — circular spinner animation (CSS or SVG, no new dependencies), encouraging message text, dark theme with brand tokens, responsive layout
- [ ] T022 [US6] Integrate interstitial into the email gate submission flow in `worship-wheel/src/app/assessment/page.tsx` (or relevant email gate component) — after email submit, show `ResultsLoading` interstitial, fire API call in parallel, enforce minimum 2-second display time using `Promise.all([apiCall, minimumDelay])`, auto-redirect to results page when both complete. On API failure/timeout (>15s), show graceful error with retry option

**Checkpoint**: User Story 6 complete — email submission flows through a polished loading interstitial before results

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: API integration, data storage, Keap tags, and end-to-end validation

- [ ] T023 Update Zod validation schemas in `worship-wheel/src/app/api/submit/route.ts` — validate exactly 24 answers, add checklist answer shape (questionType "checklist" + checkedItems array of integers within valid range per question), scenario/experience answers accept options "a"–"e" (was "a"–"d")
- [ ] T024 Update submit route handler in `worship-wheel/src/app/api/submit/route.ts` — wire new scoring functions (calculator, archetypes, bands), construct updated response shape per contracts/api.md (new band keys, archetype keys, CTA ranges), store expanded answers JSONB with `question_type` and `checked_items` fields
- [ ] T025 Update Keap tag mapping in `worship-wheel/src/app/api/submit/route.ts` (or relevant Keap integration file) — update score band tags (`WW: 8-25`, `WW: 26-40`, `WW: 41-55`, `WW: 56-80`), element band tags (Formula/Foundation/Functional/Fluent/Flow), archetype tags (`WW-Type: Rhythm Machine`, `WW-Type: Almost-There Player`, etc.)
- [ ] T026 [P] Write E2E test in `worship-wheel/src/__tests__/e2e/` (Playwright) — complete 24-question flow with all 3 question types including checklist multi-select interactions, verify loading interstitial appears for ≥2s after email submit, verify results page shows correct archetype and scores for known answer set
- [ ] T027 [P] Run quickstart.md validation — verify all files listed in quickstart.md exist and are updated, run `npx vitest run src/lib/scoring/` and `npx playwright test`, confirm no regressions
- [ ] T028 Remove old placeholder questions file `worship-wheel/src/data/placeholder-questions.ts` and update any remaining imports to point to `worship-wheel/src/data/questions.ts`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — Figma design work can start immediately
- **Foundational (Phase 2)**: Can start in parallel with Phase 1 for types (T004), but question data (T005) should reference Figma designs. T004 and T005 can run in parallel with each other
- **User Stories (Phases 3–8)**: All depend on Phase 2 completion (types + question data)
  - US1 (Phase 3): Can start after Phase 2
  - US2 (Phase 4): Can start after Phase 2 (independent of US1 UI)
  - US3 (Phase 5): Depends on US2 (needs scoring functions for SD calculation in archetype matching)
  - US4 (Phase 6): Can start after Phase 2 (independent — band mapping is standalone)
  - US5 (Phase 7): Can start after Phase 2 (independent — just progress bar constants)
  - US6 (Phase 8): Can start after Phase 2 (independent — interstitial is a standalone component/flow)
- **Polish (Phase 9)**: Depends on Phases 3–8 completion (API route needs all scoring + UI to be done)

### User Story Dependencies

- **US1 (P1)**: After Phase 2 — no dependencies on other stories
- **US2 (P1)**: After Phase 2 — no dependencies on other stories (scoring logic is independent of UI)
- **US3 (P2)**: After US2 — needs `scoreBalance()` from calculator.ts for SD-based archetype criteria
- **US4 (P2)**: After Phase 2 — no dependencies on other stories (band mapping is pure config)
- **US5 (P2)**: After Phase 2 — no dependencies on other stories (progress bar is self-contained)
- **US6 (P2)**: After Phase 2 — no dependencies on other stories (interstitial is self-contained)

### Within Each User Story

- Tests written and failing before implementation (US2, US3)
- Models/types before services/logic
- Core implementation before integration

### Parallel Opportunities

- **Phase 1**: T001, T002, T003 can all run in parallel (different Figma artboards)
- **Phase 2**: T004 and T005 can run in parallel (different files)
- **Phase 3**: T006, T007, T008 can run in parallel (different component files); T009 depends on T006–T008
- **Phase 4+5+7+8**: US2 (T011–T013), US4 (T017–T018), US5 (T019), and US6 (T020–T022) can all run in parallel with each other after Phase 2
- **Phase 9**: T026 and T027 can run in parallel

---

## Parallel Example: After Phase 2 Completes

```bash
# These can all launch in parallel (different files, no cross-dependencies):

# US1 components (parallel within story):
Task T006: "Build ChecklistCard.tsx"
Task T007: "Update QuestionCard.tsx"
Task T008: "Update AnswerOption.tsx"

# US2 tests + scoring (parallel with US1):
Task T011: "Write scoring unit tests"

# US4 bands (parallel with US1 and US2):
Task T017: "Update score bands in bands.ts"
Task T018: "Update recommendations.json"

# US5 progress (parallel with all above):
Task T019: "Update ProgressBar.tsx"

# US6 interstitial (parallel with all above):
Task T020: "Design loading interstitial in Figma"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Complete Phase 1: Figma design (checklist component + 5-option layout)
2. Complete Phase 2: Types + question data
3. Complete Phase 3: US1 — 3 question types UI
4. Complete Phase 4: US2 — Scoring algorithm
5. **STOP and VALIDATE**: Walk through full 24-question flow, verify scoring matches expected values
6. Deploy to preview — core assessment is functional

### Incremental Delivery

1. Phases 1–2: Foundation ready (types, data, Figma)
2. Add US1 + US2: Core assessment works end-to-end (MVP!)
3. Add US3: Archetypes appear on results page
4. Add US4: Score bands + CTAs show correct labels/offers
5. Add US5: Progress bar reflects 24 questions
6. Add US6: Loading interstitial between email gate and results
7. Phase 9: API validation, Keap tags, E2E tests, cleanup

### Solo Developer Strategy (Recommended)

Since this is a single-developer project, execute sequentially in priority order:

1. Phase 1 (Figma) → Phase 2 (Types/Data) → Phase 3 (US1 UI) → Phase 4 (US2 Scoring)
2. Validate MVP
3. Phase 5 (US3) → Phase 6 (US4) → Phase 7 (US5) → Phase 8 (US6 Interstitial) → Phase 9 (Polish)

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- Source of truth for question content: `docs/Worship Wheel Assessment - Questions & Scoring Algorithm.docx`
- No Supabase schema migration needed — JSONB shape change is backward-compatible
- No new dependencies required — existing chart.js, supabase, zod stack
- All scoring MUST run server-side (FR-016)
- UI language must never use "fail" or "wrong answer" (FR-008)
