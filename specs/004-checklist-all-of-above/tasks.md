---
description: "Task list for feature 004 — Checklist 'All of the Above' mutual exclusivity & audit"
---

# Tasks: Checklist "All of the Above" Mutual Exclusivity & Audit

**Input**: `specs/004-checklist-all-of-above/spec.md`, `specs/004-checklist-all-of-above/plan.md`
**Branch**: `004-checklist-all-of-above`

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1 = mutual exclusivity, US2 = scoring parity, US3 = audit/data changes

---

## Phase 1: Setup (Shared Infrastructure)

- [ ] **T001** [US1/US2/US3] Extend `ChecklistItem` type with optional `isAllOfAbove?: boolean` field
  - File: `src/types/index.ts`
  - Add the optional boolean to the `ChecklistItem` interface. Default is `undefined` (treated as `false`).
  - Sanity-check no Zod schema exists for `ChecklistItem`; if one does, update it in the same change.

---

## Phase 2: Data Changes (User Story 3 — Audit)

Depends on: T001. All T0xx tasks in this phase touch the same file (`src/data/questions.ts`), so they run **sequentially** — no `[P]` marker.

- [ ] **T002** [US3] Flag `hm_02` zoned meta items as `isAllOfAbove: true`
  - File: `src/data/questions.ts`
  - Locate `hm_02.items`. Set `isAllOfAbove: true` on `items[7]` ("All of the above in two+ zones.") and `items[8]` ("All of the above in all three zones, mixed in real time.").

- [ ] **T003** [US3] Flag `th_02` existing meta item as `isAllOfAbove: true`
  - File: `src/data/questions.ts`
  - Locate `th_02.items[9]` ("I can apply all of the above in real time."). Set `isAllOfAbove: true`.

- [ ] **T004** [US3] Flag `te_02` existing meta item as `isAllOfAbove: true`
  - File: `src/data/questions.ts`
  - Locate `te_02.items[11]` ("All of these are automatic — technique is never the obstacle."). Set `isAllOfAbove: true`.

- [ ] **T005** [US3] Add new "All of the above" meta item to `ml_02`
  - File: `src/data/questions.ts`
  - Append `{ index: 8, text: "All of the above", points: 10, isAllOfAbove: true }` to `ml_02.items`.

- [ ] **T006** [US3] Add new "All of the above" meta item to `rh_02`
  - File: `src/data/questions.ts`
  - Append `{ index: 8, text: "All of the above", points: 10, isAllOfAbove: true }` to `rh_02.items`.

- [ ] **T007** [US3] Add new "All of the above" meta item to `to_02`
  - File: `src/data/questions.ts`
  - Append `{ index: 8, text: "All of the above", points: 10, isAllOfAbove: true }` to `to_02.items`.

- [ ] **T008** [US3] Add new "All of the above" meta item to `au_02`
  - File: `src/data/questions.ts`
  - Append `{ index: 8, text: "All of the above", points: 10, isAllOfAbove: true }` to `au_02.items`.

- [ ] **T009** [US3] Leave `fb_02` unchanged — document decision
  - No file change. Verify during code review that `fb_02` was intentionally skipped (top item "navigate the neck with eyes closed" implies mastery).

---

## Phase 3: Component Logic (User Story 1 — Mutual Exclusivity)

Depends on: T001.

- [ ] **T010** [US1] Update `toggleItem` in `ChecklistCard` to enforce mutual exclusivity
  - File: `src/components/assessment/ChecklistCard.tsx`
  - Replace the existing `toggleItem(index)` implementation with logic that:
    1. If the clicked item is currently checked → plain toggle-off (remove it).
    2. Else if the clicked item has `isAllOfAbove === true` → replace the entire selection with `[index]`.
    3. Else (clicked item is a regular individual) → remove any `isAllOfAbove` items from the current selection, then add the clicked index.
  - Keep the component's prop contract unchanged.

- [ ] **T011** [P] [US1] Optional UX polish — visual separator above `isAllOfAbove` items
  - File: `src/components/assessment/ChecklistCard.tsx`
  - When rendering, if an item has `isAllOfAbove === true` and is not the first item, render a subtle divider or margin above it to visually separate it from individual options. Use existing Tailwind tokens.
  - Not blocking for correctness — skip if time-constrained.

---

## Phase 4: Tests (User Stories 1 + 2)

Depends on: T001–T010. T012 and T013 touch different files — they can run in parallel.

- [ ] **T012** [P] [US1] Write mutual-exclusivity unit tests
  - File: `src/__tests__/unit/checklist-exclusivity.test.ts` (NEW)
  - Cases per question with at least one `isAllOfAbove` item (`hm_02`, `th_02`, `te_02`, `ml_02`, `rh_02`, `to_02`, `au_02`):
    - Selecting meta from empty state → state = `[metaIndex]`
    - Selecting meta with individuals pre-selected → state = `[metaIndex]` (individuals cleared)
    - Selecting individual with meta pre-selected → state = `[individualIndex]` (meta cleared)
    - Toggling meta off → state = `[]`
  - `hm_02`-specific: selecting two-zone meta when three-zone meta is active clears three-zone; vice versa.
  - Regression: `fb_02` free multi-select still works (no meta → no exclusivity applied).
  - Suggested approach: test the pure `toggleItem`-equivalent logic by importing the component's reducer or extracting the logic into a pure helper (e.g. `computeNextSelection(currentIndices, clickedIndex, items)`) and exporting that helper from the component module for direct testing. If extracting a helper, update T010 to export it.

- [ ] **T013** [P] [US2] Extend `scoring.test.ts` with meta-alone parity tests
  - File: `src/__tests__/unit/scoring.test.ts`
  - For each question with at least one `isAllOfAbove` item, add a test:
    - `expect(scoreChecklist([metaIndex], items)).toBe(metaItem.points)`
  - Confirms `hm_02` two-zone meta alone returns 8 and three-zone meta alone returns 10.

---

## Phase 5: Verification

- [ ] **T014** Run full test suite
  - Command: `npm run test`
  - Expectation: all existing + new tests pass.

- [ ] **T015** Lint & build
  - Commands: `npm run lint && npm run build`
  - Expectation: zero new lint errors, clean production build.

- [ ] **T016** Manual QA on Vercel preview
  - After pushing the branch, Vercel will produce a preview URL on the PR.
  - Walk through every checklist question in the assessment.
  - For each meta-bearing question: verify tapping meta clears individuals; tapping an individual clears meta; toggling meta off empties state.
  - For `fb_02`: verify free multi-select still works.
  - Complete the assessment end-to-end and confirm radar chart + scores render correctly.

---

## Phase 6: Ship

- [ ] **T017** Commit changes in logical groups
  - Commit 1: type + data changes (T001–T009)
  - Commit 2: component logic (T010, optional T011)
  - Commit 3: tests (T012, T013)

- [ ] **T018** Push branch & open PR to `main`
  - `git push -u origin 004-checklist-all-of-above`
  - Open PR; include spec + clarifications link in description; request review from brand owner if content tone matters for the new "All of the above" labels.

- [ ] **T019** Merge after green CI + preview QA
  - Vercel auto-deploys `main` to production on merge.

---

## Dependencies

```
T001 ────┬──► T002..T009 (data) ─┐
         └──► T010 (component) ──┴──► T012, T013 (tests, parallel) ──► T014..T016 (verify) ──► T017..T019 (ship)
```

## Parallelizable Set

Within Phase 4: `T012` and `T013` run in parallel.
T011 (optional UX polish) can run in parallel with T012/T013 if someone else is on tests.

## Out of Scope

- Refactoring the scoring engine (not needed — see plan § Phase 1.5).
- Revising points values on existing items.
- E2E (Playwright) tests — not required by spec; manual QA covers the user-visible flow.
- Rewording existing `th_02` / `te_02` / `hm_02` meta items — keep Charl's voice as-is.
