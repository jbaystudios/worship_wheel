# Feature Specification: Checklist "All of the Above" Mutual Exclusivity & Audit

**Feature Branch**: `004-checklist-all-of-above`
**Created**: 2026-04-14
**Status**: Draft
**Input**: User description: "For checklist questions with an 'All of the above' option, selecting it should deselect all other options, and selecting any individual option should deselect 'All of the above'. Also audit all checklist questions to add 'All of the above' where it makes semantic sense."

## Clarifications

### Session 2026-04-14

- Q: How should `hm_02` (Harmony) resolve its two existing zoned meta-items ("All of the above in two+ zones" and "All of the above in all three zones, mixed in real time")? → A: Keep both zoned items; flag both as `isAllOfAbove: true`; enforce mutual exclusivity across the set {individuals, two-zone meta, three-zone meta} — only one meta OR any combination of individuals may be selected at a time, and selecting either meta clears everything else.
- Q: How should the scoring engine treat "All of the above" selections? → **Superseded by revised Q2 below.**
- Q: For multi-meta questions like `hm_02` where two zoned "All of above" items exist with different points (8 vs 10), should both expand to the same capped sum or should each meta use its own `points` value directly? → **Superseded by revised Q2 below (collapses into the uniform rule).**
- Q (revised, after inspecting scoring engine): The checklist scoring engine uses the **mean** of checked items' points (see `src/lib/scoring/calculator.ts:31`), not a sum-with-cap. This changes the meaning of "All of the above": selecting all individuals gives the mean of their points (e.g. ~5.56 for `th_02`), while the meta item's own `points` value is typically 10 (mastery tier). Which rule should scoring use? → A: Use the meta item's own `points` value **directly** in all cases (single-meta and multi-meta). Selecting "All of the above" intentionally scores higher than ticking every individual item, because the meta item represents a mastery claim, not a sum. No expansion logic is needed. The rule is uniform across all checklist questions, and multi-meta (`hm_02`) two-zone vs three-zone gap is preserved naturally.
- Q: What label wording should the newly added "All of the above" items use in `ml_02`, `rh_02`, `to_02`, `au_02`? → A: Use the literal phrase "All of the above" uniformly across all four new items, each worth 10 points. Consistency signals exclusivity clearly; Charl may refine wording later without blocking implementation.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Mutual Exclusivity Enforcement (Priority: P1)

When a user is answering a checklist question that contains an "All of the above" option, that option and the individual options are mutually exclusive. Selecting "All of the above" deselects every other item. Selecting any individual item deselects "All of the above".

**Why this priority**: The current behaviour allows a user to tick "All of the above" AND individual items, which (a) is logically contradictory, (b) confuses respondents, and (c) double-counts points in the scoring engine — inflating element scores.

**Independent Test**: Load a checklist question with "All of the above" (e.g. `th_02`, `te_02`). Tick individual items, then tick "All of the above" — the individual ticks must clear. Tick an individual item again — "All of the above" must clear. Verify scoring returns the expected value in both states.

**Acceptance Scenarios**:

1. **Given** a checklist question with an "All of the above" option and no selections, **When** the user selects "All of the above", **Then** only "All of the above" is selected.
2. **Given** a checklist question with several individual items already selected, **When** the user selects "All of the above", **Then** all individual selections are cleared and only "All of the above" remains selected.
3. **Given** "All of the above" is selected, **When** the user selects any individual item, **Then** "All of the above" is cleared and the individual item is selected.
4. **Given** "All of the above" is selected, **When** the user selects "All of the above" again (toggle off), **Then** no items are selected.
5. **Given** a checklist question without an "All of the above" option, **When** the user makes selections, **Then** behaviour is unchanged from today (free multi-select).

---

### User Story 2 - "All of the Above" Awards Mastery-Tier Score (Priority: P1)

Selecting "All of the above" alone awards the meta item's own `points` value as the question score (typically 10, representing mastery). This is higher than the mean a user would get by ticking every individual item, which is intentional — the meta item represents a qualitative mastery claim, not a sum.

**Why this priority**: The checklist scoring engine uses the mean of checked items' points. If users could tick "All of above" alongside individual items, the mean would be diluted below the mastery value, defeating the signal. Mutual exclusivity (User Story 1) plus using the meta item's own `points` directly produces the correct mastery-tier score.

**Independent Test**: For each checklist question with an `isAllOfAbove` item, select only that meta item and verify the question score equals the meta item's `points` value exactly.

**Acceptance Scenarios**:

1. **Given** question `th_02` with 9 individual items + meta "I can apply all of the above in real time" (10 points), **When** the user selects only the meta item, **Then** the question score is 10.
2. **Given** question `te_02` with 11 individual items + meta "All of these are automatic" (10 points), **When** the user selects only the meta item, **Then** the question score is 10.
3. **Given** question `hm_02` with two zoned meta items ("two+ zones" 8pts, "all three zones" 10pts), **When** the user selects only the three-zone meta, **Then** the question score is 10; **When** the user selects only the two-zone meta, **Then** the question score is 8. Selecting both is disallowed by exclusivity.

---

### User Story 3 - Audit & Add "All of the Above" Where It Makes Sense (Priority: P2)

Audit every checklist question and add an "All of the above" option where it makes semantic sense — i.e. where selecting every individual item is a coherent real-world state representing mastery. Do not add it where the items are mutually exclusive, ordered progressions that wouldn't all be true simultaneously, or where mastery is already represented by a different item.

**Why this priority**: Consistency improves UX. Users who have fully mastered an element benefit from a single-tap "I do all of these" answer rather than eight taps. This matters for completion rate and for clean scoring.

**Independent Test**: Review each checklist question's items list. Categorise each as "needs All-of-the-above added", "already has it (or equivalent)", or "skip — not semantically appropriate". Document the decision for each in this spec.

**Acceptance Scenarios**:

1. **Given** the audit identifies `ml_02`, `rh_02`, `to_02`, `au_02` as candidates, **When** an "All of the above" option is added, **Then** each question has a final item worth `10` points labelled consistently (e.g. "All of the above" or a stylistic variant matching existing tone).
2. **Given** `fb_02` has progressively harder items (ending with "eyes closed"), **When** auditing, **Then** a decision is documented whether "All of the above" is semantically valid or if the existing top-tier item already represents mastery.
3. **Given** `hm_02` already has two zoned variants ("All of the above in two+ zones" / "All of the above in all three zones"), **When** auditing, **Then** a decision is documented on whether these remain as-is or are consolidated.

---

### Edge Cases

- **Toggling "All of the above" off** must leave the question in an unanswered state (no items selected), not re-select individual items.
- **Keyboard accessibility**: Space/Enter on the "All of the above" checkbox must apply the same exclusivity logic as a mouse click.
- **Screen reader announcement**: When selecting "All of the above" clears other items, the state change should be conveyed (via live region or proper ARIA).
- **Prefilled answers** (if a user navigates back to a completed question): State must honour exclusivity — if stored state somehow has both "All of the above" and individual items, the component must normalise to "All of the above" only on mount.
- **Scoring ceiling**: Some checklist questions sum item points above the question's max score (e.g. `th_02` sums to ~60 but the per-question max is 10). The scoring engine already caps this, but mutual exclusivity must not introduce regressions.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The checklist component MUST recognise a designated "All of the above" item per question (flagged via a new data field, not by string matching).
- **FR-002**: When the user selects the designated "All of the above" item, the component MUST deselect all other items in the same question.
- **FR-003**: When the user selects any non-"All of the above" item, the component MUST deselect the "All of the above" item if it was previously selected.
- **FR-004**: The exclusivity logic MUST apply regardless of input method (mouse, keyboard, touch).
- **FR-005**: Checklist questions WITHOUT a designated "All of the above" item MUST behave exactly as they do today (free multi-select).
- **FR-006**: The `questions.ts` data MUST be updated to add an `isAllOfAbove: true` (or equivalent) flag on the relevant item for every checklist that has or should have such an option.
- **FR-007**: The scoring engine uses the mean of checked items' points for checklist questions. Because mutual exclusivity guarantees that when a flagged `isAllOfAbove` item is selected, it is the ONLY selection, the score for that question becomes exactly the meta item's `points` value. No expansion logic is required. The same rule applies uniformly to single-meta and multi-meta questions — whichever meta item the user selects, its own `points` value IS the question's score. This means (a) "All of the above" scores higher than ticking every individual item, which is intentional and represents a mastery claim, and (b) `hm_02`'s two-zone meta (8 pts) and three-zone meta (10 pts) produce different scores by design.
- **FR-008**: Audit outcome MUST be recorded in this spec (see "Audit Decisions" section below) and reflected in `questions.ts`.
- **FR-009**: Unit tests MUST cover: selecting All-of-above clears individuals; selecting individual clears All-of-above; toggle-off leaves empty state; questions without the flag behave unchanged; scoring parity between "All of above alone" and "every individual item selected".
- **FR-010**: The `Question` / `ChecklistItem` TypeScript types MUST be updated to include the new flag. Existing Zod schemas (if any) MUST be updated accordingly.

### Key Entities

- **Checklist item**: Gains a new optional boolean flag (e.g. `isAllOfAbove`) identifying it as the mutually-exclusive meta-option. Defaults to `false`/absent.
- **Checklist question answer state**: Still an array of selected item indices. No schema change — just a runtime invariant that either the All-of-above index is present alone, or it is absent.

## Audit Decisions *(to be finalised during /speckit.plan)*

Initial assessment of the 8 existing checklist questions (`fb_02`, `hm_02`, `ml_02`, `rh_02`, `to_02`, `th_02`, `te_02`, `au_02`):

| Question | Current State | Proposed Action |
|---|---|---|
| `fb_02` Fretboard | No "All of above". Items are progressive mastery. | **Skip** — top item ("eyes closed") already implies full mastery. |
| `hm_02` Harmony | Two zoned "All of above" variants (idx 7, 8). | **Keep both**, flag both with `isAllOfAbove: true`. Exclusivity rule: the set {two-zone meta, three-zone meta, any individual item} is mutually exclusive — selecting either meta clears all others; selecting any individual clears both metas. At most one meta is selected at any time. |
| `ml_02` Melody | No "All of above". | **Add** — items are skills, many coexist at mastery level. |
| `rh_02` Rhythm | No "All of above". | **Add** — items are rhythm skills, all coexist at mastery. |
| `to_02` Tone | No "All of above". | **Add** — tone knowledge skills, coexist at mastery. |
| `th_02` Theory | Has "I can apply all of the above in real time" (idx 9, 10pts). | **Flag existing item** — mark as `isAllOfAbove: true`. |
| `te_02` Technique | Has "All of these are automatic" (idx 11, 10pts). | **Flag existing item** — mark as `isAllOfAbove: true`. |
| `au_02` Aural | No "All of above". | **Add** — aural skills, coexist at mastery. |

Final decisions and exact wording to be confirmed in the plan phase with the brand owner (Charl) where the wording should match his tone.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of checklist questions with an "All of the above" flag enforce mutual exclusivity (verified by unit tests covering each such question).
- **SC-002**: For every checklist with an "All of the above" flag, selecting the flag alone produces the same final stored element score as selecting every other item in that question (parity test).
- **SC-003**: No regression in checklist questions that do not have an "All of the above" flag — existing e2e assessment flow still passes.
- **SC-004**: Zero support requests / QA notes about "I selected All of the above but the other ticks stayed" after release.

## Assumptions

- The checklist component lives at approximately `src/components/.../Checklist*.tsx` (to be located during planning).
- `isAllOfAbove` is the preferred flag name; the plan phase may rename this.
- No Supabase schema change required — stored `answers` JSONB can continue to hold selected indices as-is.
- Audit decisions in the table above are the starting proposal. The brand owner may adjust wording and scope in the plan phase.
- Out of scope for this spec: re-balancing points values across items, revising question text beyond adding an "All of the above" item where applicable.
