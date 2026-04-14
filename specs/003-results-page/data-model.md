# Data Model: Results Page

**Date**: 2026-04-09
**Feature**: `003-results-page`

## Overview

No new data entities are introduced. The results page consumes the existing `AssessmentResult` type (defined in spec 002) passed via sessionStorage. This document records the data shapes for component props.

## Existing Types (from src/types/index.ts)

### AssessmentResult

The top-level data shape that flows from the API response to the results page:

```typescript
interface AssessmentResult {
  elementScores: ElementScore[];  // 8 items, one per element
  overallScore: number;           // 8–80
  overallPercentage: number;      // 0–100
  balance: BalanceScore;          // { value: number, sd: number }
  archetype: Archetype;           // { key, name, message }
  cta: CtaBand;                   // { label, description, minScore, maxScore }
  weakestElements: ElementCode[]; // up to 3
  strongestElements: ElementCode[]; // up to 3
}
```

### ElementScore

```typescript
interface ElementScore {
  elementCode: ElementCode;  // 'FB' | 'HM' | 'ML' | 'RH' | 'TO' | 'TH' | 'TE' | 'AU'
  elementName: string;       // 'Fretboard', 'Harmony', etc.
  score: number;             // 1–10, integer
  band: ScoreBand;           // { key, label, description }
}
```

## sessionStorage Contract

**Key**: `worshipWheelResult`
**Value**: JSON-serialised object containing the API response fields needed by the results page.

```typescript
interface StoredResult {
  sessionId: string;
  firstName: string;
  elementScores: ElementScore[];
  overallScore: number;
  overallPercentage: number;
  balance: { value: number; sd: number };
  archetype: { key: string; name: string; message: string };
  cta: { label: string; description: string; minScore: number; maxScore: number };
  weakestElements: string[];
  strongestElements: string[];
}
```

**Written by**: `assessment/page.tsx` after successful API submit
**Read by**: `results/page.tsx` on mount
**Cleared**: Automatically when the browser tab closes (sessionStorage behaviour)

## Component Props Mapping

| Component | Props from AssessmentResult |
|---|---|
| `RadarChart` | `elementScores` (8 scores + element codes for axis labels) |
| `ScoreSummary` | `overallScore`, `overallPercentage`, `balance.value`, `archetype.name` |
| `ElementBreakdown` | `elementScores` (score, elementName, band.label, elementCode) |
| `ArchetypeCard` | `archetype.name`, `archetype.message` |
| `CtaBanner` | `cta.label`, `cta.description`, `overallScore` |
| `ShareSection` | None (uses window.location for URL) |
