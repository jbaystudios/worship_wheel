# Data Model: Worship Wheel Assessment Tool

**Feature Branch**: `001-worship-wheel-assessment`
**Date**: 2026-03-06
**Source**: [spec.md](./spec.md)

## Overview

The Worship Wheel assessment stores individual assessment sessions in Supabase, with each session accessible via a unique results URL. Questions and recommendations are stored as configuration data (not user-generated). Leads are synced to Keap/Infusionsoft as the external CRM.

## Entities

### 1. assessment_sessions

Stores each completed assessment with full results. This is the primary user-generated data table.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, default gen_random_uuid() | Unique result ID, used in results URL |
| created_at | TIMESTAMPTZ | NOT NULL, default now() | When the assessment was completed |
| first_name | TEXT | NOT NULL | User's first name (from email gate) |
| email | TEXT | NOT NULL | User's email address |
| answers | JSONB | NOT NULL | Array of 16 answer objects: `[{question_id, element_code, selected_option, points}]` |
| element_scores | JSONB | NOT NULL | Object of 8 element scores: `{FB: 4, HM: 7, ...}` |
| overall_score | INTEGER | NOT NULL, CHECK (8-80) | Sum of all 8 element scores |
| overall_percentage | DECIMAL(5,2) | NOT NULL | overall_score / 80 * 100 |
| balance_score | DECIMAL(3,1) | NOT NULL, CHECK (1-10) | Inverted SD formula result |
| profile_archetype | TEXT | NOT NULL | Archetype key (e.g., "rhythm_player", "balanced_beginner") |
| weakest_elements | TEXT[] | NOT NULL | Array of top 2-3 weakest element codes |
| strongest_elements | TEXT[] | NOT NULL | Array of top 2-3 strongest element codes |
| completion_time_seconds | INTEGER | | Time from first question to submission |
| utm_source | TEXT | | UTM source parameter |
| utm_medium | TEXT | | UTM medium parameter |
| utm_campaign | TEXT | | UTM campaign parameter |
| utm_term | TEXT | | UTM term parameter |
| utm_content | TEXT | | UTM content parameter |
| keap_sync_status | TEXT | NOT NULL, default 'pending' | One of: pending, synced, failed, retrying |
| keap_sync_error | TEXT | | Last error message if sync failed |
| keap_synced_at | TIMESTAMPTZ | | When the Keap sync last succeeded |

**Indexes**:
- `idx_sessions_email` on `email` (for retake lookups)
- `idx_sessions_created_at` on `created_at` (for aggregate queries)
- `idx_sessions_keap_sync` on `keap_sync_status` WHERE status != 'synced' (for retry queue)

**RLS Policy**: Public insert (anyone can submit). Public select by `id` only (results URL access). No update/delete from client.

### 2. aggregate_stats

Stores anonymised aggregate scoring data for content strategy insights (FR-037). Updated by a database function on each new assessment.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | SERIAL | PK | Auto-increment |
| date | DATE | NOT NULL, UNIQUE | Aggregation date |
| total_assessments | INTEGER | NOT NULL, default 0 | Total assessments that day |
| avg_element_scores | JSONB | NOT NULL | Average scores per element: `{FB: 4.2, HM: 5.1, ...}` |
| avg_overall_score | DECIMAL(5,2) | NOT NULL | Average overall score |
| avg_balance_score | DECIMAL(3,1) | NOT NULL | Average balance score |
| archetype_distribution | JSONB | NOT NULL | Count per archetype: `{rhythm_player: 12, ...}` |
| score_band_distribution | JSONB | NOT NULL | Count per band: `{beginner: 5, developing: 12, ...}` |
| completion_rate | DECIMAL(5,2) | | Started vs completed (from GA4 events) |
| email_conversion_rate | DECIMAL(5,2) | | Completed vs email submitted |

**RLS Policy**: No public access. Server-side only (service role key).

### 3. questions (configuration)

Stored as a static JSON configuration file in the codebase (`/src/data/questions.json`), not in the database. This keeps questions version-controlled and avoids a database dependency for the quiz flow.

```json
{
  "version": "1.0.0",
  "questions": [
    {
      "id": "fb_01",
      "element_code": "FB",
      "element_name": "Fretboard",
      "position": 1,
      "text": "If someone asked you to play a G note, how many places on the neck could you find it?",
      "options": [
        { "key": "a", "text": "I'm not sure where to find a G note on the guitar.", "points": 1 },
        { "key": "b", "text": "I could find it in one or two places (like the 3rd fret low E string).", "points": 3 },
        { "key": "c", "text": "I could find it in 3-4 places across the neck.", "points": 6 },
        { "key": "d", "text": "I could find all six G notes across the entire fretboard without hesitation.", "points": 10 }
      ]
    }
  ]
}
```

### 4. recommendations (configuration)

Stored as a static JSON configuration file (`/src/data/recommendations.json`). Configurable without code changes (FR-025).

```json
{
  "version": "1.0.0",
  "element_recommendations": {
    "FB": {
      "1-2": { "level": "Beginner", "message": "[PLACEHOLDER: PC-001]", "action": "..." },
      "3-4": { "level": "Developing", "message": "[PLACEHOLDER: PC-002]", "action": "..." },
      "5-6": { "level": "Functional", "message": "[PLACEHOLDER: PC-003]", "action": "..." },
      "7-8": { "level": "Fluent", "message": "[PLACEHOLDER: PC-004]", "action": "..." },
      "9-10": { "level": "Flow", "message": "[PLACEHOLDER: PC-005]", "action": "..." }
    }
  },
  "archetypes": {
    "rhythm_player": { "name": "The Rhythm Player", "message": "[PLACEHOLDER: PC-041]" },
    "theory_head": { "name": "The Theory Head", "message": "[PLACEHOLDER: PC-042]" },
    "campfire_strummer": { "name": "The Campfire Strummer", "message": "[PLACEHOLDER: PC-043]" },
    "balanced_beginner": { "name": "The Balanced Beginner", "message": "[PLACEHOLDER: PC-044]" },
    "uneven_intermediate": { "name": "The Uneven Intermediate", "message": "[PLACEHOLDER: PC-045]" }
  },
  "cta_bands": {
    "0-29": { "label": "Free Training", "url": "[PLACEHOLDER: PC-046]" },
    "30-50": { "label": "90-Day Challenge", "url": "[PLACEHOLDER: PC-047]" },
    "51-65": { "label": "Academy Membership", "url": "[PLACEHOLDER: PC-048]" },
    "66-80": { "label": "Advanced Workshops", "url": "[PLACEHOLDER: PC-049]" }
  }
}
```

### 5. elements (reference)

Static reference data, also in the codebase (`/src/data/elements.json`).

```json
[
  { "code": "FB", "name": "Fretboard", "order": 1, "description": "Knowing where notes live on the neck..." },
  { "code": "HM", "name": "Harmony", "order": 2, "description": "Understanding chords and progressions..." },
  { "code": "ML", "name": "Melody", "order": 3, "description": "Playing single-note ideas that sing..." },
  { "code": "RH", "name": "Rhythm", "order": 4, "description": "Timekeeping, groove, and dynamics..." },
  { "code": "TO", "name": "Tone", "order": 5, "description": "Making what you play sound good..." },
  { "code": "TH", "name": "Theory", "order": 6, "description": "The mental framework connecting everything..." },
  { "code": "TE", "name": "Technique", "order": 7, "description": "Physical ability to execute what you know..." },
  { "code": "AU", "name": "Aural", "order": 8, "description": "Hearing and identifying musical elements by ear..." }
]
```

## Entity Relationships

```
assessment_sessions
  ├── references questions (via answers[].question_id)
  ├── references elements (via element_scores keys, weakest/strongest)
  ├── references archetypes (via profile_archetype)
  └── feeds into aggregate_stats (via DB trigger/function)

questions → grouped by elements (via element_code)
recommendations → keyed by elements x score_bands
```

## State Transitions

### Assessment Session Lifecycle

```
[User starts quiz] → (client-side only, no DB record)
    ↓
[User completes quiz + submits email] → INSERT assessment_sessions (keap_sync_status: 'pending')
    ↓
[Server-side Keap sync attempt]
    ├── Success → UPDATE keap_sync_status = 'synced', keap_synced_at = now()
    ├── Failure → UPDATE keap_sync_status = 'failed', keap_sync_error = '...'
    └── Retry (background job) → keap_sync_status = 'retrying' → Success/Failure
```

### Keap Sync Status

```
pending → synced (happy path)
pending → failed → retrying → synced (retry success)
pending → failed → retrying → failed (retry exhausted)
```

## MVP Question Selection

The following 16 questions (best 2 per element) are selected from the 20 draft questions in the companion document:

| Element | Q# | Question ID | Rationale for selection |
|---------|-----|-------------|------------------------|
| FB | Q1 | fb_01 | Tests note-finding ability across neck positions — most diagnostic |
| FB | Q2 | fb_02 | Tests fretboard usage range in real worship context — complements Q1 |
| HM | Q4 | hm_01 | Tests chord vocabulary breadth — clear skill differentiation |
| HM | Q5 | hm_02 | Tests real-world scenario (Eb progression) — hardest to game |
| ML | Q7 | ml_01 | Tests worship-specific fill ability — practical and scenario-based |
| ML | Q8 | ml_02 | Tests single-note melody ability — covers different melodic dimension |
| RH | Q9 | rh_01 | Tests timing/groove with recordings — concrete and measurable |
| RH | Q10 | rh_02 | Tests rhythmic variety — covers breadth vs. Q9's precision |
| TO | Q11 | to_01 | Tests tonal range for worship — most practical |
| TO | Q12 | to_02 | Tests effects knowledge — complements Q11 with technical depth |
| TH | Q13 | th_01 | Tests Nashville Number System — highly diagnostic for worship context |
| TH | Q14 | th_02 | Tests chord construction understanding — foundational theory |
| TE | Q16 | te_01 | Tests playing confidence — covers the psychological dimension |
| TE | Q17 | te_02 | Tests technique checklist — concrete capability assessment |
| AU | Q18 | au_01 | Tests chord quality identification by ear — most diagnostic |
| AU | Q19 | au_02 | Tests learning songs by ear — practical real-world application |

**Excluded questions** (available for Phase 2 expansion to 3 per element):
- Q3 (FB): Similar to Q1 (note-finding), less diagnostic
- Q6 (HM): Similar to Q4 (voicing count), less scenario-based
- Q15 (TH): Good question but Q13+Q14 already cover theory well
- Q20 (AU): Similar to Q19 (progression recognition), Q18+Q19 are more diverse
