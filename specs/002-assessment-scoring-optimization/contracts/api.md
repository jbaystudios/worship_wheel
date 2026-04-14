# API Contracts: Assessment Scoring Optimization

**Date**: 2026-04-01
**Source**: [spec.md](../spec.md) | [data-model.md](../data-model.md)
**Delta from**: [001 contracts](../../001-worship-wheel-assessment/contracts/api.md)

## Changes Summary

The only endpoint affected is `POST /api/submit`. The changes are:
1. `answers` array expands from 16 to 24 items
2. Answers now have two shapes: single-select and checklist
3. Response uses updated band names and archetype keys
4. New archetype `almost_there_player` added

All other endpoints (`GET /results/[resultId]`, `GET /api/og/[resultId]`, `POST /api/keap-retry`) are unchanged structurally — they consume stored data that now has richer content.

## Endpoints

### POST /api/submit (Updated)

**Request Body**:
```json
{
  "firstName": "John",
  "email": "john@example.com",
  "answers": [
    {
      "questionId": "fb_01",
      "questionType": "scenario",
      "selectedOption": "c"
    },
    {
      "questionId": "fb_02",
      "questionType": "checklist",
      "checkedItems": [0, 1, 2, 4]
    },
    {
      "questionId": "fb_03",
      "questionType": "experience",
      "selectedOption": "d"
    },
    "... (24 total answers, 3 per element × 8 elements)"
  ],
  "completionTimeSeconds": 280,
  "utmParams": {
    "source": "youtube",
    "medium": "social",
    "campaign": "worship-wheel-v2",
    "term": null,
    "content": null
  },
  "honeypot": ""
}
```

**Validation Rules** (updated):
- `firstName`: required, non-empty string, max 100 chars (unchanged)
- `email`: required, valid email format (unchanged)
- `answers`: required, exactly **24** items
  - Scenario/experience answers: `questionId` (valid ID), `questionType` ("scenario" | "experience"), `selectedOption` ("a" | "b" | "c" | "d" | "e")
  - Checklist answers: `questionId` (valid ID), `questionType` ("checklist"), `checkedItems` (array of integers, 0-indexed, values within valid range for that question's item count)
- `honeypot`: must be empty string (unchanged)
- Rate limit: 5 submissions per IP per hour (unchanged)

**Success Response** (200):
```json
{
  "resultId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "resultUrl": "/results/a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "scores": {
    "elements": {
      "FB": { "score": 5, "band": "functional", "bandLabel": "Functional" },
      "HM": { "score": 7, "band": "fluent", "bandLabel": "Fluent" },
      "ML": { "score": 3, "band": "foundation", "bandLabel": "Foundation" },
      "RH": { "score": 6, "band": "functional", "bandLabel": "Functional" },
      "TO": { "score": 2, "band": "formula", "bandLabel": "Formula" },
      "TH": { "score": 5, "band": "functional", "bandLabel": "Functional" },
      "TE": { "score": 5, "band": "functional", "bandLabel": "Functional" },
      "AU": { "score": 3, "band": "foundation", "bandLabel": "Foundation" }
    },
    "overall": {
      "score": 36,
      "percentage": 45.0,
      "band": "26-40"
    },
    "balance": {
      "score": 6.8
    }
  },
  "profile": {
    "archetype": "uneven_intermediate",
    "archetypeName": "The Uneven Intermediate",
    "archetypeMessage": "The gaps between strong and weak areas are holding you back. Focused work on weakest areas transforms fastest."
  },
  "weakestElements": ["TO", "ML", "AU"],
  "strongestElements": ["HM", "RH"],
  "cta": {
    "band": "26-40",
    "label": "90-Day Breakthrough Intensive",
    "description": "90-Day Breakthrough Intensive"
  }
}
```

**Key response changes from 001**:
- Band keys updated: `"beginner"` → `"formula"`, `"developing"` → `"foundation"`
- New archetype values: `"rhythm_machine"` (was `"rhythm_player"`), `"almost_there_player"` (new)
- CTA band ranges updated: `"8-25"`, `"26-40"`, `"41-55"`, `"56-80"`

**Error Responses** (unchanged from 001):
- `400`: Validation error (invalid answers, wrong count, bad question IDs)
- `429`: Rate limited
- `500`: Server error

### Keap Tag Updates

**Updated tags** (applied to Keap contact):

| Tag Category | Old (001) | New (002) |
|---|---|---|
| Completion | `WW: Completed` | `WW: Completed` (unchanged) |
| Score band 1 | `WW: 0-29` | `WW: 8-25` |
| Score band 2 | `WW: 30-50` | `WW: 26-40` |
| Score band 3 | `WW: 51-65` | `WW: 41-55` |
| Score band 4 | `WW: 66-80` | `WW: 56-80` |
| Element bands | `WW-FB: Beginner` | `WW-FB: Formula` |
| Element bands | `WW-FB: Developing` | `WW-FB: Foundation` |
| Archetype | `WW-Type: Rhythm Player` | `WW-Type: Rhythm Machine` |
| Archetype | (new) | `WW-Type: Almost-There Player` |

### DataLayer Events (unchanged)

All 12 DataLayer events from 001 remain the same. The `assessment_completed` event payload will naturally include updated archetype names and band labels.
