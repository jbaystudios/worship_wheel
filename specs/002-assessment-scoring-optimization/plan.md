# Implementation Plan: Assessment Scoring Optimization

**Branch**: `002-assessment-scoring-optimization` | **Date**: 2026-04-01 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-assessment-scoring-optimization/spec.md`
**Predecessor**: [`001-worship-wheel-assessment`](../001-worship-wheel-assessment/plan.md) — existing assessment scaffold

## Summary

Replace the 16 placeholder questions (single-select, 4 options, scored 1/4/7/10) with Charl's final 24-question assessment system. This introduces three question types (scenario, capability checklist, experience/confidence), a refined scoring algorithm where checklists use mean-of-checked-items, updated score bands (Formula → Flow), specific archetype matching criteria with 6 archetypes, and revised CTA ranges. All changes are data + logic within the existing Next.js architecture — no new infrastructure.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 20+ (unchanged)
**Framework**: Next.js 14+ App Router (unchanged)
**Primary Dependencies**: No new dependencies. Existing chart.js, supabase, zod stack.
**Storage**: Supabase PostgreSQL (schema update: `answers` JSONB expands for checklist responses)
**Testing**: Vitest (unit tests for new scoring logic), Playwright (E2E for new question flow)
**Target Platform**: Web, mobile-first (unchanged)
**Project Type**: Web application (unchanged)
**Performance Goals**: Assessment completion 3–5 minutes (was ~3 min for 16 questions)
**Constraints**: Server-side scoring only (unchanged); checklist scoring runs server-side
**Scale/Scope**: ~24 questions data, ~3 modified components, ~2 new components (checklist UI), scoring lib rewrite

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Figma as Single Source of Truth | PASS | Checklist question type needs a Figma design before code implementation. |
| II. Token-Driven Design | PASS | Checklist component will use existing design tokens. No new hard-coded values. |
| III. Professional-Grade Structure | PASS | New component follows existing naming conventions. |
| IV. Spec-Driven Workflow | PASS | Full speckit workflow: specify → plan → tasks → implement. |
| V. Brand Coherence Above All | PASS | Checklist UI follows existing assessment visual language (dark theme, gold accents). |
| Design Tooling (Figma MCP) | PASS | Checklist component to be designed in Figma before code. |
| Design Tooling (UI/UX Pro Max) | PASS | Will be consulted for checklist interaction design. |
| Quality Standards | PASS | No orphaned styles or unnamed layers. |

## Project Structure

### Documentation (this feature)

```text
specs/002-assessment-scoring-optimization/
├── plan.md              # This file
├── research.md          # Phase 0: Scoring algorithm analysis
├── data-model.md        # Phase 1: Updated data shapes
├── quickstart.md        # Phase 1: Developer setup (delta from 001)
├── contracts/
│   └── api.md           # Phase 1: Updated API contracts
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (changes within existing structure)

```text
worship-wheel/src/
├── app/
│   └── assessment/
│       └── page.tsx                          # MODIFY: 24-question flow, 3 question types
├── components/
│   └── assessment/
│       ├── QuestionCard.tsx                  # MODIFY: handle scenario + experience types (5 options)
│       ├── ChecklistCard.tsx                 # NEW: capability checklist multi-select component
│       ├── ProgressBar.tsx                   # MODIFY: update for 24 questions, 3 per segment
│       └── AnswerOption.tsx                  # MODIFY: support 5 options (A–E) instead of 4
├── lib/
│   └── scoring/
│       ├── calculator.ts                     # REWRITE: new scoring algorithm (checklist avg, 3-question element avg)
│       ├── archetypes.ts                     # REWRITE: specific matching criteria, priority order
│       └── bands.ts                          # MODIFY: updated band names + CTA ranges
├── data/
│   ├── questions.ts                          # REWRITE: 24 questions with 3 types, full content from Charl
│   ├── recommendations.json                  # MODIFY: updated band labels, archetype messages + criteria
│   └── elements.json                         # UNCHANGED
├── types/
│   └── index.ts                              # MODIFY: new question/answer types for checklists
└── __tests__/
    └── unit/
        ├── scoring.test.ts                   # REWRITE: comprehensive tests for new algorithm
        └── archetype.test.ts                 # REWRITE: tests for all 6 archetypes + fallback
```

**Structure Decision**: No structural changes — all modifications are within the existing `worship-wheel/` project. The primary changes are data (questions), logic (scoring), and one new component (ChecklistCard).

## Implementation Phases

### Phase A: Figma Design — Checklist Question Type

Design the capability checklist interaction pattern in Figma. This is the only net-new UI element.

1. **Checklist question card** — Multi-select checkbox layout with escalating-difficulty items (6–12 items per checklist). Must feel distinct from scenario/experience single-select questions.
2. **Checklist interaction states** — Default, hover, selected (checked), disabled-while-submitting.
3. **5-option answer layout** — Update scenario/experience question card to accommodate 5 options (A–E) instead of 4.
4. **Mobile variant** — Checklist at 375px breakpoint (items may need to stack differently).

Deliverables: Updated Figma assessment page with checklist component using bound variables.

### Phase B: Question Data & Types

Replace placeholder questions with Charl's final 24 questions.

1. Define TypeScript types for the three question types (scenario, checklist, experience) and their answer formats.
2. Rewrite `questions.ts` with all 24 questions — exact text, options, and point values from the source document.
3. Update the `Question` interface to include `type` field (scenario | checklist | experience) and support variable-length option arrays with point values.
4. Update `Answer` type to handle both single-select (option key + points) and multi-select (array of checked item keys + points).

### Phase C: Assessment Flow UI

Update the quiz flow to handle 3 question types across 24 questions.

1. Update `assessment/page.tsx` for 24-question flow, grouped by element (3 per element).
2. Build `ChecklistCard.tsx` — multi-select component with checkboxes, "Continue" button (enabled when ≥0 items selected, since 0 defaults to score 1).
3. Update `QuestionCard.tsx` to render 5 options (A–E) for scenario and experience questions.
4. Update `AnswerOption.tsx` for 5-option layout.
5. Update `ProgressBar.tsx` — change `QUESTIONS_PER_ELEMENT` from 2 to 3, update total from 16 to 24.
6. Ensure back-navigation preserves checklist selections.

### Phase D: Scoring Algorithm

Rewrite the scoring engine to match Charl's algorithm exactly.

1. **Checklist scoring**: Implement mean-of-checked-items scoring (empty = 1).
2. **Element scoring**: Average of 3 question scores, rounded to nearest integer.
3. **Overall score**: Sum of 8 element scores (range 8–80).
4. **Balance score**: SD formula — Balance = 10 − (SD / 3.18 × 9), clamped 1–10.
5. **Score bands**: Map element scores to Formula (1–2), Foundation (3–4), Functional (5–6), Fluent (7–8), Flow (9–10).
6. **CTA bands**: Map overall score to 8–25, 26–40, 41–55, 56–80 ranges.
7. **Comprehensive unit tests**: Test each scoring function with known inputs/outputs from the source document.

### Phase E: Archetype Matching

Implement the 6 archetype matching criteria with priority-ordered evaluation.

1. Define archetype matching functions with specific criteria from spec (FR-023 through FR-030).
2. Define evaluation priority order (specific archetypes first → broad patterns → fallback).
3. Implement fallback archetype logic (strongest-element-based).
4. Unit tests for each archetype with boundary conditions (exact threshold scores).
5. Unit tests for priority ordering (when multiple archetypes could match).

Recommended evaluation order:
1. The Campfire Strummer (HM ≥ 5, RH ≥ 4, all others ≤ 4)
2. The Rhythm Machine (RH ≥ 7, TE ≥ 6, HM ≤ 4, FB ≤ 4)
3. The Theory Head (TH ≥ 7, AU ≥ 6, TE ≤ 4, HM ≤ 5)
4. The Almost-There Player (overall ≥ 55, all elements ≥ 5)
5. The Balanced Beginner (all elements ≤ 4, SD ≤ 1.5)
6. The Uneven Intermediate (max − min ≥ 5, SD > 2.0, overall ≥ 30)
7. Fallback: based on strongest element

### Phase F: API & Data Contract Updates

Update the submission API and database schema for 24 questions + checklist answers.

1. Update Zod validation schemas: 24 answers, checklist answers as arrays.
2. Update `/api/submit` route handler for new answer format and scoring.
3. Update Supabase `answers` JSONB shape to store checklist selections.
4. Update Keap tag mapping for new band names and archetype names.
5. Update recommendations.json with new band labels and archetype messages.

### Phase G: Testing & Verification

1. Unit tests: scoring calculator, archetype matching, band mapping (all edge cases).
2. E2E test: complete 24-question flow including checklist interactions.
3. E2E test: verify score calculations match expected values for known answer sets.
4. Verify progress bar displays correctly for 24 questions / 3 per segment.
5. Test zero-selection checklist edge case (score = 1).
6. Test archetype fallback when no specific archetype matches.

## Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Checklist scoring | Mean of checked items | Matches Charl's spec exactly. Rewards breadth of capability. |
| Element scoring | Average of 3 questions, rounded | Matches spec. Rounding keeps 1–10 integer scale for radar chart. |
| Archetype priority | Specific → broad → fallback | Avoids ambiguity. Specific archetypes (Campfire, Rhythm, Theory) checked first, then pattern-based (Almost-There, Balanced, Uneven), then fallback. |
| Checklist UI | Checkbox list with "Continue" | Distinct from single-select radio buttons. No minimum selection required (0 = score 1). |
| Data format | Keep TypeScript data file | Consistent with existing placeholder-questions.ts pattern. Type-safe at compile time. |

## Risk Register

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| 24 questions increases drop-off rate | Medium | Medium | Track completion rate vs 16-question baseline. Three question types add variety, reducing fatigue. Progress bar shows element completion. |
| Checklist UX confusion (multi-select vs single-select) | Medium | Low | Clear visual differentiation (checkboxes vs radio). Implicit instruction via checklist format. |
| Archetype matching edge cases not covered | Low | Low | Fallback archetype ensures 100% coverage. Comprehensive unit tests. |
| Scoring rounding creates unexpected boundary effects | Low | Low | Document rounding behavior. Test boundary cases (e.g., 4.5 rounds to 5, changing band). |

## Complexity Tracking

No constitution violations to justify.
