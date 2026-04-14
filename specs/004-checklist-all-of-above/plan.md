# Implementation Plan: Checklist "All of the Above" Mutual Exclusivity & Audit

**Branch**: `004-checklist-all-of-above` | **Date**: 2026-04-14 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/004-checklist-all-of-above/spec.md`

## Summary

Enforce mutual exclusivity between a designated "All of the above" meta item and the individual items in checklist questions. Selecting the meta clears all individuals; selecting any individual clears the meta. Because the scoring engine uses the mean of checked items' `points`, mutual exclusivity alone guarantees that selecting the meta scores exactly its `points` value (mastery tier, typically 10) — no engine changes required. Audit all 8 checklist questions; flag existing meta items in `hm_02`, `th_02`, `te_02` with a new `isAllOfAbove: true` field; add new meta items to `ml_02`, `rh_02`, `to_02`, `au_02`; skip `fb_02` (top item already implies mastery).

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 20+
**Primary Dependencies**: Next.js 14 (App Router), React 18, Tailwind 3.4, Zod
**Storage**: Supabase `answers` JSONB column — no schema change required (stored shape is still `{ checkedItems: number[] }`)
**Testing**: Vitest (unit) — `src/__tests__/unit/`; Playwright (e2e) — exists but not extended in this spec
**Target Platform**: Web (Next.js on Vercel); desktop + mobile viewports
**Project Type**: Single Next.js web app
**Performance Goals**: No performance-sensitive changes — exclusivity logic is O(n) over a ≤12-item array, runs on user click
**Constraints**: Must not regress existing checklist questions that lack a meta item (free multi-select must still work); must not change the stored `answers` shape (backwards-compat with any in-flight sessionStorage answers — sessions are ephemeral so this is trivial)
**Scale/Scope**: 8 checklist questions; 1 component (`ChecklistCard.tsx`); 1 data file (`questions.ts`); 1 type (`ChecklistItem`); scoring engine unchanged (verified via test)

## Constitution Check

*GATE: Must pass before implementation.*

Constitution at `.specify/memory/constitution.md` — principles are general (spec-driven development, minimal scope, tested changes). No violations: this feature is narrowly scoped, has a spec + clarifications, and is covered by unit tests. Does not introduce new dependencies, services, or infrastructure.

## Approach

### Phase 0 — Research & Decisions (complete)

Captured in spec's Clarifications section. Key resolved decisions:

1. **Mutual exclusivity model**: A checklist item flagged `isAllOfAbove: true` is mutually exclusive with every other item in the same question (including other `isAllOfAbove` items in `hm_02`). At most one meta OR any combination of individuals may be selected at a time.
2. **Scoring**: No engine changes. Mean-of-points formula naturally returns the meta item's `points` value when it is the sole selection. `hm_02`'s two-zone (8) vs three-zone (10) distinction is preserved automatically.
3. **Audit outcome**: See spec's Audit Decisions table. Flag existing metas in 3 questions; add new metas to 4 questions; skip `fb_02`.
4. **Label wording**: Literal "All of the above" for the 4 newly added items, 10pts each.

### Phase 1 — Design

**1.1 Type change** — `src/types/index.ts`
- Add optional `isAllOfAbove?: boolean` to `ChecklistItem` interface.
- Defaults to `undefined`/`false`; existing items unaffected.

**1.2 Data updates** — `src/data/questions.ts`

| Question | Action | Specifics |
|---|---|---|
| `fb_02` | No change | Top item already implies mastery |
| `hm_02` | Flag 2 items | `items[7]` (`isAllOfAbove: true`), `items[8]` (`isAllOfAbove: true`) |
| `ml_02` | Add meta item | New final item `{ index: 8, text: "All of the above", points: 10, isAllOfAbove: true }` |
| `rh_02` | Add meta item | New final item `{ index: 8, text: "All of the above", points: 10, isAllOfAbove: true }` |
| `to_02` | Add meta item | New final item `{ index: 8, text: "All of the above", points: 10, isAllOfAbove: true }` |
| `th_02` | Flag 1 item | `items[9]` (`isAllOfAbove: true`) |
| `te_02` | Flag 1 item | `items[11]` (`isAllOfAbove: true`) |
| `au_02` | Add meta item | New final item `{ index: 8, text: "All of the above", points: 10, isAllOfAbove: true }` |

**1.3 Component logic** — `src/components/assessment/ChecklistCard.tsx`

Update `toggleItem(index)` to enforce exclusivity:

```ts
function toggleItem(index: number) {
  const clickedItem = items.find(i => i.index === index);
  const isMetaClicked = clickedItem?.isAllOfAbove === true;
  const isCurrentlyChecked = checkedIndices.includes(index);

  if (isCurrentlyChecked) {
    // Simple toggle-off — no cross-effects
    onChange(checkedIndices.filter(i => i !== index));
    return;
  }

  if (isMetaClicked) {
    // Selecting a meta: clear everything else, select only this meta
    onChange([index]);
    return;
  }

  // Selecting an individual: clear any selected meta(s), then add this item
  const metaIndices = new Set(items.filter(i => i.isAllOfAbove).map(i => i.index));
  const withoutMetas = checkedIndices.filter(i => !metaIndices.has(i));
  onChange([...withoutMetas, index]);
}
```

Accessibility: button's `aria-pressed` is already present via the existing `isChecked` styling; no new ARIA needed. Screen readers announce the state change via the button's text content refresh on next focus. Optional polish: add a visible divider/spacer above meta items — tracked in tasks but not required for correctness.

**1.4 Tests** — `src/__tests__/unit/`

New file: `checklist-exclusivity.test.ts`. Covers, per question with at least one `isAllOfAbove` item:

- Selecting meta from empty state → only meta selected
- Selecting meta with individuals pre-selected → only meta selected
- Selecting individual with meta pre-selected → meta cleared, only individual selected
- Toggling meta off → empty state
- Question without meta → free multi-select unchanged (regression guard)
- `hm_02`-specific: selecting two-zone meta clears three-zone meta and vice versa

Extend `scoring.test.ts` with parity tests:
- `scoreChecklist([metaIndex], items)` returns exactly the meta's `points` for each meta-flagged question.

**1.5 Scoring engine** — **no code changes**

Verify with test: `scoreChecklist` returns `item.points` when `checkedIndices.length === 1`. This is already true by the mean formula (`total / 1`). No change needed; keep the engine untouched.

### Phase 2 — Task Breakdown (deferred to `/speckit.tasks`)

Expected tasks (indicative, to be generated properly):

1. Add `isAllOfAbove?: boolean` to `ChecklistItem` in `src/types/index.ts`
2. Flag existing meta items in `questions.ts` (`hm_02` x2, `th_02`, `te_02`)
3. Add new meta items to `questions.ts` (`ml_02`, `rh_02`, `to_02`, `au_02`)
4. Update `ChecklistCard.tsx` with exclusivity logic
5. Write `checklist-exclusivity.test.ts` unit tests
6. Extend `scoring.test.ts` with "meta alone" parity tests
7. Manual QA pass on deployed preview: each checklist question behaves correctly
8. Commit, push branch, open PR to `main`

### Phase 3 — Rollout

- Merge via PR after green CI and manual preview QA
- Vercel auto-deploys `main` → production
- No feature flag, no data migration

## Project Structure

### Documentation (this feature)

```text
specs/004-checklist-all-of-above/
├── plan.md              # This file
└── spec.md              # Clarified spec

(data-model.md, quickstart.md, contracts/ — NOT needed for this feature;
 the spec + plan fully describe the data and interaction changes.)
```

### Source Code (files touched)

```text
src/
├── types/index.ts                              # Add isAllOfAbove?: boolean
├── data/questions.ts                           # Flag 3 existing + add 4 new meta items
├── components/assessment/ChecklistCard.tsx     # Exclusivity logic in toggleItem
└── __tests__/unit/
    ├── scoring.test.ts                         # Extend with meta-alone parity tests
    └── checklist-exclusivity.test.ts           # NEW — mutual exclusivity behaviour
```

**Structure Decision**: Single Next.js web app — existing layout is correct. No new directories.

## Complexity Tracking

No constitutional violations. No complexity to justify — feature adds a single optional boolean field to an existing type, a branch in one event handler, and 4 new data items.

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Ordering assumption: plan assumes `items[7]`/`items[8]` etc. are the right indices in `questions.ts` | Verified by reading `questions.ts` at plan time. Tasks step will re-verify with a quick grep before editing. |
| User-confusion from `hm_02`'s two zoned metas being mutually exclusive (less common UX pattern) | Acceptable per Q1 clarification. Optional UX polish (visual separator / label "Choose one of these:" above the zoned metas) tracked but not required for correctness. |
| Meta items being added with `index: 8` in `ml_02`/`rh_02`/`to_02`/`au_02` may collide with existing `index` values | Verified: each target question currently ends at `index: 7` (8-item questions) — new meta slots into `index: 8`. `au_02` and `to_02` end at `index: 7`; `ml_02` at `index: 7`; `rh_02` at `index: 7`. No collisions. |
| Existing stored answers (sessionStorage) could have both meta + individuals after users from current prod hit the exclusivity-fixed build | Sessions are client-side only and short-lived; a user whose state is "dirty" will simply re-submit. No server-side reconciliation needed. |

## Verification Plan

1. `npm run test` — all existing tests pass; new tests pass
2. `npm run lint` — no new lint errors
3. `npm run build` — clean production build
4. Manual QA on Vercel preview:
   - Walk through each of the 8 checklist questions
   - For questions with meta: verify exclusivity both directions
   - For questions without meta (`fb_02`): verify free multi-select still works
   - Complete assessment end-to-end; confirm radar chart and scores render
5. Merge when all of the above green.
