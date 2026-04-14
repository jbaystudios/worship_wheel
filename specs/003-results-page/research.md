# Research: Worship Wheel Results Page

**Date**: 2026-04-09
**Feature**: `003-results-page`

## Overview

No unknowns or NEEDS CLARIFICATION items from the technical context. All decisions are informed by existing project conventions and the approved Figma design.

## Decisions

### 1. Chart.js Radar Chart Configuration

**Decision**: Use Chart.js `Radar` chart type via react-chartjs-2, with custom styling to match the Figma design.

**Rationale**: Chart.js 4.4 and react-chartjs-2 5.2 are already installed project dependencies. The radar chart type natively supports the 8-axis polygon layout needed. Custom configuration handles: gold polygon fill, dark background grid, element code labels, and score point dots.

**Alternatives considered**:
- D3.js: More flexible but adds a new dependency and requires significantly more code for the same result.
- SVG hand-drawn: Full control but Chart.js handles responsive scaling, tooltips, and animation out of the box.
- Recharts: Would add another dependency when Chart.js is already installed.

### 2. Data Flow via sessionStorage

**Decision**: Store the API response in sessionStorage after submit, redirect to `/results`, read on mount. Show empty state if missing.

**Rationale**: This is the simplest data flow that works for the core use case (user completes assessment → sees results). No Supabase roundtrip needed since the data was just computed. sessionStorage persists across page navigations within the same tab but clears on tab close, which is acceptable for this pass.

**Alternatives considered**:
- URL search params: Data payload is too large (~2KB JSON) for URL params.
- React context/state: Lost on page navigation in Next.js App Router.
- Supabase: Deferred to follow-up spec for shareable URLs.
- localStorage: Persists too long — stale results could confuse returning users.

### 3. Component Structure

**Decision**: 6 components in `components/results/` — one per visual section. The results page (`app/results/page.tsx`) composes them.

**Rationale**: Matches the Figma frame structure (each section is a distinct frame). Each component receives typed props from `AssessmentResult`, making them independently testable and reusable.

### 4. Color Coding Threshold

**Decision**: Scores ≥ 5 use accent (gold) tokens, scores ≤ 4 use warning (amber) tokens. Consistent with the Figma design inspection.

**Rationale**: The Figma design shows this exact split: Fretboard (5), Harmony (7), Rhythm (5), Theory (5), Technique (5) all use gold; Melody (3), Tone (2), Aural (3) use amber/warning. The threshold is score ≥ 5 for accent, ≤ 4 for warning.

### 5. Responsive Strategy

**Decision**: Use Tailwind responsive utilities (`max-md:`) consistent with existing assessment components. Radar chart uses Chart.js built-in responsive option.

**Rationale**: All existing components use this pattern. Chart.js `responsive: true` with `maintainAspectRatio: true` handles chart scaling automatically.
