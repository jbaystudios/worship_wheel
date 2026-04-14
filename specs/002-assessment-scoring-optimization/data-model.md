# Data Model: Assessment Scoring Optimization

**Feature Branch**: `002-assessment-scoring-optimization`
**Date**: 2026-04-01
**Source**: [spec.md](./spec.md) | [001 data-model](../001-worship-wheel-assessment/data-model.md)

## Overview

This document describes the **delta** from the 001 data model. The Supabase schema (`assessment_sessions`, `aggregate_stats`) remains structurally the same — the changes are in the JSONB content shapes, the static configuration data, and the scoring logic types.

## Changes to assessment_sessions

### answers JSONB — Updated Shape

**001 format** (16 single-select answers):
```json
[
  { "question_id": "fb_01", "element_code": "FB", "selected_option": "c", "points": 5 }
]
```

**002 format** (24 answers, two answer shapes):
```json
[
  {
    "question_id": "fb_01",
    "element_code": "FB",
    "question_type": "scenario",
    "selected_option": "c",
    "points": 5
  },
  {
    "question_id": "fb_02",
    "element_code": "FB",
    "question_type": "checklist",
    "checked_items": [0, 1, 2, 4],
    "points": 3.25
  },
  {
    "question_id": "fb_03",
    "element_code": "FB",
    "question_type": "experience",
    "selected_option": "d",
    "points": 7
  }
]
```

**Key changes**:
- `question_type` field added: `"scenario" | "checklist" | "experience"`
- Checklist answers use `checked_items` (array of item indices) instead of `selected_option`
- Checklist `points` is the calculated mean of checked items (or 1 if empty)
- Answer count increases from 16 to 24

### No Schema Migration Required

The `answers` column is JSONB — the shape change is backward-compatible. Old 16-answer sessions remain valid. Validation happens at the application layer (Zod schemas).

### profile_archetype — Updated Values

Old values: `"rhythm_player"`, `"theory_head"`, `"campfire_strummer"`, `"balanced_beginner"`, `"uneven_intermediate"`

New values: `"campfire_strummer"`, `"rhythm_machine"`, `"theory_head"`, `"uneven_intermediate"`, `"balanced_beginner"`, `"almost_there_player"`, `"fallback_<element_code>"`

**Note**: `"rhythm_player"` renamed to `"rhythm_machine"` per Charl's spec. New `"almost_there_player"` added. Fallback uses `"fallback_FB"`, `"fallback_HM"`, etc.

## Configuration Data — Questions

### Question Type Definitions

```typescript
type QuestionType = 'scenario' | 'checklist' | 'experience';

interface ScenarioQuestion {
  id: string;                    // e.g., "fb_01"
  elementCode: string;           // e.g., "FB"
  elementName: string;           // e.g., "Fretboard"
  type: 'scenario';
  position: number;              // 1–24
  headline: string;              // Element-level prompt, e.g., "Do you know where to find notes on the guitar neck?"
  subheadline: string;           // Score range context, e.g., "Score 1: You don't know... Score 10: You know every note..."
  text: string;                  // Question text (scenario description in quotes)
  options: {
    key: string;                 // "a" through "e"
    text: string;
    points: number;              // 1, 3, 5, 7, or 10
  }[];
}

interface ChecklistQuestion {
  id: string;
  elementCode: string;
  elementName: string;
  type: 'checklist';
  position: number;
  text: string;                  // Implied: "Select all that apply"
  items: {
    index: number;               // 0-based
    text: string;
    points: number;              // Variable (1–10)
  }[];
}

interface ExperienceQuestion {
  id: string;
  elementCode: string;
  elementName: string;
  type: 'experience';
  position: number;
  text: string;                  // Re-contextualized from scenario
  options: {
    key: string;                 // "a" through "e"
    text: string;
    points: number;              // 1, 3, 5, 7, or 10
  }[];
}

type Question = ScenarioQuestion | ChecklistQuestion | ExperienceQuestion;
```

### Question ID Convention

| Element | Scenario | Checklist | Experience |
|---------|----------|-----------|------------|
| Fretboard | `fb_01` | `fb_02` | `fb_03` |
| Harmony | `hm_01` | `hm_02` | `hm_03` |
| Melody | `ml_01` | `ml_02` | `ml_03` |
| Rhythm | `rh_01` | `rh_02` | `rh_03` |
| Tone | `to_01` | `to_02` | `to_03` |
| Theory | `th_01` | `th_02` | `th_03` |
| Technique | `te_01` | `te_02` | `te_03` |
| Aural | `au_01` | `au_02` | `au_03` |

## Configuration Data — Score Bands

```typescript
const SCORE_BANDS = [
  { min: 1, max: 2, key: 'formula', label: 'Formula', description: 'Just becoming aware' },
  { min: 3, max: 4, key: 'foundation', label: 'Foundation', description: 'Early stages, some basics' },
  { min: 5, max: 6, key: 'functional', label: 'Functional', description: 'Can use in worship with effort' },
  { min: 7, max: 8, key: 'fluent', label: 'Fluent', description: 'Smooth, minimal thought' },
  { min: 9, max: 10, key: 'flow', label: 'Flow', description: 'Automatic, fully internalized' },
] as const;
```

## Configuration Data — CTA Bands

```typescript
const CTA_BANDS = [
  { min: 8, max: 25, label: 'Free Worship Wheel Training Video', description: 'Free training video + email sequence' },
  { min: 26, max: 40, label: '90-Day Breakthrough Intensive', description: '90-Day Breakthrough Intensive' },
  { min: 41, max: 55, label: 'WGS Academy', description: 'WGS Academy membership' },
  { min: 56, max: 80, label: 'Advanced Workshops', description: 'Advanced workshops & masterclasses' },
] as const;
```

## Configuration Data — Archetypes

```typescript
interface ArchetypeDefinition {
  key: string;
  name: string;
  message: string;
  match: (scores: Record<string, number>, overall: number, sd: number) => boolean;
}

const ARCHETYPES: ArchetypeDefinition[] = [
  {
    key: 'campfire_strummer',
    name: 'The Campfire Strummer',
    message: "You've got a solid foundation — let's expand your vocabulary and unlock the full neck.",
    // match: HM ≥ 5, RH ≥ 4, all others ≤ 4
  },
  {
    key: 'rhythm_machine',
    name: 'The Rhythm Machine',
    message: "Your groove is real — now let's expand your chord vocabulary and fretboard knowledge.",
    // match: RH ≥ 7, TE ≥ 6, HM ≤ 4, FB ≤ 4
  },
  {
    key: 'theory_head',
    name: 'The Theory Head',
    message: "You understand the music — now let's get your hands and ears to match your brain.",
    // match: TH ≥ 7, AU ≥ 6, TE ≤ 4, HM ≤ 5
  },
  {
    key: 'almost_there_player',
    name: 'The Almost-There Player',
    message: "You're already solid across the board. The next stage is refinement.",
    // match: overall ≥ 55, all elements ≥ 5
  },
  {
    key: 'balanced_beginner',
    name: 'The Balanced Beginner',
    message: "Great news — you have an even foundation. Everything will grow together.",
    // match: all elements ≤ 4, SD ≤ 1.5
  },
  {
    key: 'uneven_intermediate',
    name: 'The Uneven Intermediate',
    message: "The gaps between strong and weak areas are holding you back. Focused work on weakest areas transforms fastest.",
    // match: max - min ≥ 5, SD > 2.0, overall ≥ 30
  },
];
```

## Scoring Algorithm Reference

### Per-Question Scoring

| Type | Scoring |
|------|---------|
| Scenario (5 options) | Points of selected option: 1, 3, 5, 7, or 10 |
| Checklist (multi-select) | Mean of checked items' point values. Empty = 1. |
| Experience (5 options) | Points of selected option: 1, 3, 5, 7, or 10 |

### Per-Element Score

```
Element Score = round((Q1_pts + Q2_pts + Q3_pts) / 3)
```

All element scores are integers on a 1–10 scale.

### Overall Score

```
Overall Score = sum of all 8 element scores
Range: 8–80
Percentage: (Overall Score / 80) × 100
```

### Balance Score (Wheel Roundness)

```
mean = average of 8 element scores
SD = standard deviation of 8 element scores
Balance = 10 − (SD / 3.18 × 9), clamped to [1, 10]
```

Where 3.18 is the maximum possible SD (one element = 10, all others = 1).
