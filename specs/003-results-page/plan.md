# Implementation Plan: Worship Wheel Results Page

**Branch**: `003-results-page` | **Date**: 2026-04-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-results-page/spec.md`

## Summary

Build the results page that users see after completing the 24-question Worship Wheel assessment. The page renders a Chart.js radar chart, score summary cards, per-element breakdown bars, profile archetype card, dynamic CTA banner, and share buttons — all from the approved Figma design (node 99:47). Results data flows via sessionStorage from the assessment flow. No new dependencies required.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 20+
**Primary Dependencies**: Next.js 14 (App Router), Chart.js 4.4 + react-chartjs-2 5.2, Tailwind CSS 3.4
**Storage**: sessionStorage (client-side, this spec only)
**Testing**: Vitest (unit), manual visual validation against Figma
**Target Platform**: Web (Vercel deployment)
**Project Type**: Web application (Next.js)
**Performance Goals**: Results page renders in < 1 second, radar chart visible without layout shift
**Constraints**: All styles via design tokens (no hard-coded values), responsive 375px–1440px
**Scale/Scope**: Single page with 6 sections, ~8 components

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Figma as Single Source of Truth | PASS | All layout, spacing, and colour values extracted from approved Figma design (node 99:47) during spec 002 session |
| II. Token-Driven Design | PASS | All colours use theme/accent/warning tokens. All spacing uses space scale. No hard-coded values. |
| III. Professional-Grade Structure | PASS | Components follow existing naming conventions. Auto layout patterns match existing assessment components. |
| IV. Spec-Driven Workflow | PASS | Full spec → plan → tasks workflow followed. |
| V. Brand Coherence | PASS | Results page uses identical dark theme, hero background, navbar, and typography as assessment pages. |

No violations. No complexity tracking needed.

## Project Structure

### Documentation (this feature)

```text
specs/003-results-page/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── checklists/
    └── requirements.md  # Spec quality checklist
```

### Source Code

```text
worship-wheel/src/
├── app/
│   ├── assessment/
│   │   └── page.tsx              # UPDATE: redirect to /results after submit
│   └── results/
│       └── page.tsx              # NEW: results page (client component)
├── components/
│   └── results/
│       ├── RadarChart.tsx        # NEW: Chart.js radar chart wrapper
│       ├── ScoreSummary.tsx      # NEW: 3 stat cards (overall, balance, profile)
│       ├── ElementBreakdown.tsx  # NEW: 8 element score bars
│       ├── ArchetypeCard.tsx     # NEW: profile archetype with video placeholder
│       ├── CtaBanner.tsx         # NEW: dynamic CTA based on score range
│       └── ShareSection.tsx     # NEW: copy link + share buttons
├── lib/
│   └── scoring/                  # EXISTING: calculator, archetypes, bands
└── types/
    └── index.ts                  # EXISTING: AssessmentResult, ElementScore, etc.
```

**Structure Decision**: Single project within `worship-wheel/src/`. Results components get their own directory (`components/results/`) to keep assessment and results concerns separate while sharing types, tokens, and scoring utilities.

## Implementation Phases

### Phase A: Data Flow — sessionStorage + Redirect

Wire the assessment → results data pipeline so the results page has data to render.

1. Update `assessment/page.tsx`: after API response, store `AssessmentResult` in sessionStorage and redirect to `/results`
2. Create `results/page.tsx`: read from sessionStorage on mount, show empty state if missing

### Phase B: Radar Chart Component

Build the radar chart using Chart.js, matching the Figma design.

1. Register Chart.js components (RadialLinearScale, Filler, etc.)
2. Configure chart: 8 axes, gold fill polygon, dark grid, element code labels
3. Match Figma: concentric grid rings, axis lines, accent-500 fill with opacity, score point dots

### Phase C: Score Summary Cards

Build the 3 stat cards matching Figma layout.

1. Overall Score card: X/80 in accent-500, percentage below
2. Balance card: X.X in accent-500, "out of 10" below
3. Profile card: archetype name in accent-500
4. Horizontal on desktop (gap-32), stacking vertically on mobile

### Phase D: Element Breakdown

Build the 8 element score bars matching Figma design.

1. Element row: name (bold) + band label + proportional bar + score number
2. Color coding: scores ≥ 5 use accent tokens, scores ≤ 4 use warning tokens
3. Bar width proportional to score/10
4. Responsive: bars fill available width

### Phase E: Archetype Card + CTA Banner

Build the profile and conversion sections.

1. Archetype card: "YOUR PROFILE" label, archetype name (H3), message, video placeholder
2. CTA banner: dynamic heading/description from CTA band, primary action button
3. Both use radial gradient backgrounds matching Figma

### Phase F: Share Section

Build the share functionality.

1. Divider + descriptive text
2. "Copy Link" button: clipboard API with "Copied!" confirmation
3. "Share" button: Web Share API with clipboard fallback

### Phase G: Polish + Responsive Validation

Final pass for pixel accuracy and responsive behaviour.

1. Verify all sections against Figma screenshot at 1440px
2. Test at 375px, 768px, 1024px breakpoints
3. Verify radar chart scales without overflow
4. Verify empty state when no sessionStorage data
