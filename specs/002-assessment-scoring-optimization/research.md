# Research: Assessment Scoring Optimization

**Feature Branch**: `002-assessment-scoring-optimization`
**Date**: 2026-04-01

## 1. Checklist Scoring Algorithm

**Decision**: Mean of checked items' point values, default to 1 if nothing checked.

**Rationale**: Charl's spec is explicit: "Score = average of all checked items' point values. If no items checked, score = 1." This rewards breadth of capability — a player who checks many mid-level items scores higher than one who checks a single high-level item, which is diagnostically appropriate.

**Implementation notes**:
- Checklist items have varying point values (not uniform). Example: FB checklist items are worth 1, 2, 3, 5, 7, 9, 10 points.
- Mean = sum of checked values / count of checked values.
- If nothing checked, score = 1 (not 0). This preserves the 1–10 scale minimum.
- Server-side only — client sends array of checked item indices, server resolves point values.

**Edge cases tested**:
- All items checked: score = mean of all point values (varies per checklist, typically 5–6)
- Single highest item checked: score = that item's value (e.g., 10)
- Single lowest item checked: score = that item's value (e.g., 1 or 2)
- No items checked: score = 1

## 2. Archetype Evaluation Priority

**Decision**: Evaluate in order: specific character archetypes → pattern-based archetypes → fallback.

**Rationale**: Specific archetypes (Campfire Strummer, Rhythm Machine, Theory Head) have narrow, well-defined criteria that identify a recognizable player type. Pattern-based archetypes (Almost-There, Balanced Beginner, Uneven Intermediate) are broader statistical descriptors. Checking specific first ensures a player with a clear identity gets that label rather than a generic statistical one.

**Priority order**:
1. The Campfire Strummer — HM ≥ 5, RH ≥ 4, all others ≤ 4
2. The Rhythm Machine — RH ≥ 7, TE ≥ 6, HM ≤ 4, FB ≤ 4
3. The Theory Head — TH ≥ 7, AU ≥ 6, TE ≤ 4, HM ≤ 5
4. The Almost-There Player — overall ≥ 55, all elements ≥ 5
5. The Balanced Beginner — all elements ≤ 4, SD ≤ 1.5
6. The Uneven Intermediate — max − min ≥ 5, SD > 2.0, overall ≥ 30
7. Fallback — strongest element-based label

**Overlap analysis**:
- A player could theoretically match both "Campfire Strummer" and "Uneven Intermediate" (strong HM/RH, weak others). Priority order gives them the more specific, encouraging label.
- "Almost-There Player" (all ≥ 5) and "Balanced Beginner" (all ≤ 4) are mutually exclusive by definition.
- The Uneven Intermediate's SD > 2.0 requirement means it won't fire for balanced profiles.

## 3. Score Band Naming

**Decision**: Formula → Foundation → Functional → Fluent → Flow

**Rationale**: Charl's spec uses these exact names. The alliterative F-naming creates a memorable progression. Key change from 001: "Beginner" → "Formula" and "Developing" → "Foundation". These names are more encouraging and less judgmental, consistent with the spec's tone requirement (FR-008: never use "fail" or "wrong answer").

**Migration impact**: Band names appear in:
- Results page UI (element score labels)
- Recommendations config (band-keyed recommendations)
- Keap tags (contact tagging uses band names)
- All three must be updated atomically.

## 4. CTA Range Alignment

**Decision**: Use Charl's exact ranges: 8–25, 26–40, 41–55, 56–80.

**Rationale**: Charl's ranges differ from the 001 spec (which had 0–29, 30–50, 51–65, 66–80). The new ranges are based on Charl's business strategy — each range maps to a specific WGS offering at the right price/commitment level for that skill level.

**Comparison**:

| 001 Spec | 002 (Charl Final) | CTA |
|----------|-------------------|-----|
| 0–29 | 8–25 (≤31%) | Free Training Video |
| 30–50 | 26–40 (32–50%) | 90-Day Breakthrough Intensive |
| 51–65 | 41–55 (51–69%) | WGS Academy Membership |
| 66–80 | 56–80 (70–100%) | Advanced Workshops & Masterclasses |

## 5. Checklist UI Pattern

**Decision**: Vertical checkbox list with a "Continue" button.

**Rationale**: Checklists need clear visual differentiation from single-select questions (which use radio-button-style option cards). Standard checkbox patterns are universally understood. The "Continue" button is always enabled (since 0 selections = score 1), but a subtle prompt could encourage at least one selection.

**Alternatives considered**:
- **Chip/tag multi-select**: Compact but harder to read with long text items. Rejected.
- **Drag-and-drop ranking**: Overcomplicates the interaction. Rejected.
- **Two-column layout**: Some checklists have 6–12 items; two columns could work on desktop but breaks on mobile. Single column is safer for mobile-first.

**Design considerations**:
- Each checklist has 7–12 items with short-to-medium text
- Items are already in ascending difficulty order — this provides a natural visual hierarchy
- Checked items should show a clear visual state (gold accent checkbox, subtle background)
- Item point values are NOT shown to the user
