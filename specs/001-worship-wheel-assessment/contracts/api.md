# API Contracts: Worship Wheel Assessment Tool

**Date**: 2026-03-06
**Source**: [spec.md](../spec.md) | [data-model.md](../data-model.md)

## Endpoints

### POST /api/submit

Submits a completed assessment. Calculates scores server-side, persists to Supabase, triggers Keap sync, and returns the results.

**Request Body**:
```json
{
  "firstName": "John",
  "email": "john@example.com",
  "answers": [
    { "questionId": "fb_01", "selectedOption": "c" },
    { "questionId": "fb_02", "selectedOption": "b" },
    { "questionId": "hm_01", "selectedOption": "d" },
    { "questionId": "hm_02", "selectedOption": "c" },
    { "questionId": "ml_01", "selectedOption": "b" },
    { "questionId": "ml_02", "selectedOption": "b" },
    { "questionId": "rh_01", "selectedOption": "c" },
    { "questionId": "rh_02", "selectedOption": "b" },
    { "questionId": "to_01", "selectedOption": "b" },
    { "questionId": "to_02", "selectedOption": "a" },
    { "questionId": "th_01", "selectedOption": "c" },
    { "questionId": "th_02", "selectedOption": "b" },
    { "questionId": "te_01", "selectedOption": "c" },
    { "questionId": "te_02", "selectedOption": "b" },
    { "questionId": "au_01", "selectedOption": "b" },
    { "questionId": "au_02", "selectedOption": "a" }
  ],
  "completionTimeSeconds": 240,
  "utmParams": {
    "source": "youtube",
    "medium": "social",
    "campaign": "worship-wheel-launch",
    "term": null,
    "content": null
  },
  "honeypot": ""
}
```

**Validation Rules**:
- `firstName`: required, non-empty string, max 100 chars
- `email`: required, valid email format
- `answers`: required, exactly 16 items, each with valid `questionId` and `selectedOption` (a/b/c/d)
- `honeypot`: must be empty string (spam filter — if non-empty, silently return success but discard)
- Rate limit: 5 submissions per IP per hour

**Success Response** (200):
```json
{
  "resultId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "resultUrl": "/results/a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "scores": {
    "elements": {
      "FB": { "score": 5, "band": "functional", "bandLabel": "Functional" },
      "HM": { "score": 7, "band": "fluent", "bandLabel": "Fluent" },
      "ML": { "score": 3, "band": "developing", "bandLabel": "Developing" },
      "RH": { "score": 5, "band": "functional", "bandLabel": "Functional" },
      "TO": { "score": 2, "band": "beginner", "bandLabel": "Beginner" },
      "TH": { "score": 5, "band": "functional", "bandLabel": "Functional" },
      "TE": { "score": 5, "band": "functional", "bandLabel": "Functional" },
      "AU": { "score": 3, "band": "developing", "bandLabel": "Developing" }
    },
    "overall": {
      "score": 35,
      "percentage": 43.75,
      "band": "30-50"
    },
    "balance": {
      "score": 7.2
    }
  },
  "profile": {
    "archetype": "uneven_intermediate",
    "archetypeName": "The Uneven Intermediate",
    "archetypeMessage": "You have real strengths, but the gaps are holding you back..."
  },
  "analysis": {
    "weakestElements": ["TO", "ML", "AU"],
    "strongestElements": ["HM", "FB", "RH"]
  },
  "recommendations": [
    {
      "elementCode": "TO",
      "elementName": "Tone",
      "band": "beginner",
      "message": "[Placeholder recommendation for Tone at Beginner level]",
      "action": "..."
    },
    {
      "elementCode": "ML",
      "elementName": "Melody",
      "band": "developing",
      "message": "[Placeholder recommendation for Melody at Developing level]",
      "action": "..."
    },
    {
      "elementCode": "AU",
      "elementName": "Aural",
      "band": "developing",
      "message": "[Placeholder recommendation for Aural at Developing level]",
      "action": "..."
    }
  ],
  "cta": {
    "label": "90-Day Challenge",
    "url": "[PLACEHOLDER: PC-047]",
    "scoreBand": "30-50"
  }
}
```

**Error Responses**:
- `400`: Validation error (missing fields, invalid answers, wrong answer count)
- `429`: Rate limited (silently returns 200 with fake result to not reveal rate limiting)
- `500`: Server error (still returns a client-side calculated fallback if possible)

---

### GET /results/[resultId]

Server-rendered results page. Fetches assessment session from Supabase by ID and renders the full results (radar chart, scores, recommendations, CTA).

**Parameters**:
- `resultId` (path): UUID of the assessment session

**Success**: Renders the results page with full HTML (server-side rendered for OG meta tags)

**Not Found** (404): Friendly "Results not found" page with a CTA to take the assessment

**OG Meta Tags** (for social sharing):
```html
<meta property="og:title" content="My Worship Wheel Results" />
<meta property="og:description" content="I scored 35/80 on the Worship Wheel Assessment. My strongest area is Harmony." />
<meta property="og:image" content="/api/og/a1b2c3d4-e5f6-7890-abcd-ef1234567890" />
<meta property="og:url" content="https://worshipwheel.worshipguitarskills.com/results/a1b2c3d4" />
```

---

### GET /api/og/[resultId]

Generates a dynamic Open Graph image for social sharing. Returns a PNG image of the user's Worship Wheel radar chart with branding.

**Parameters**:
- `resultId` (path): UUID of the assessment session

**Success Response**: PNG image (1200x630px) containing:
- WGS branding (logo, dark background, gold accents)
- Radar chart with the user's 8 element scores
- Overall score and archetype label
- "Take the assessment" CTA text

**Not Found**: Returns a default branded OG image

**Cache**: Cached at the edge (CDN). Immutable — scores don't change for a given resultId.

---

## External Integration: Keap REST API

### Contact Upsert Flow

Called server-side after a successful assessment submission. Non-blocking — failures do not prevent the user from seeing results.

> **Deduplication is mandatory.** Every contact write MUST go through Keap's
> deduplicating create-or-update endpoint. A create-only call (`POST /v1/contacts`)
> is **prohibited** for this integration — it produces duplicate contacts on
> assessment retakes and on concurrent submissions of the same email.

**Step 1: Create-or-update the contact, deduplicated by email**
- Use `PUT /v1/contacts` — the Keap REST API v1 "Create or Update a Contact" endpoint.
- The request body **MUST** include `"duplicate_option": "Email"`. With this set,
  Keap atomically updates the existing contact that already has this email
  instead of creating a new one (or creates one if none exists). This happens
  server-side and is race-free, so two near-simultaneous submissions of the same
  email converge on a single contact.
- The email **MUST be normalized** (trimmed and lowercased) before it is sent —
  `John@X.com ` and `john@x.com` must not be treated as different contacts.
- Send the contact identity **and all custom fields in this single call**:
  - `given_name`: first name
  - `email_addresses`: the normalized email
  - `ww_overall_score`: overall score (8-80)
  - `ww_overall_percentage`: percentage
  - `ww_balance_score`: balance score (1-10)
  - `ww_archetype`: archetype name
  - `ww_fb_score` through `ww_au_score`: individual element scores
  - `ww_weakest_elements`: comma-separated weakest element names
  - `ww_results_url`: full results URL
  - `ww_completed_at`: ISO timestamp
- The response returns the contact `id` (existing or newly created) — used for Step 2.
- A prior `GET /v1/contacts?email={email}` MAY be used to detect a returning
  lead for branching logic, but MUST NOT be relied on for deduplication: a
  check-then-create has a race window. `duplicate_option` is the authoritative safeguard.

**Step 2: Apply tags**
- `POST /v1/contacts/{contactId}/tags` with tag IDs:
  - `WW: Completed` (general assessment tag)
  - `WW: {score_band}` (e.g., "WW: 30-50")
  - `WW-Weak: {element}` for each weakest element (e.g., "WW-Weak: Tone")
- Tag application is idempotent — re-applying a tag already on a contact is a
  no-op, so assessment retakes do not pollute the contact.

**Note**: Tags must be pre-created in Keap. The tag IDs are stored in environment configuration.

**API version note**: This contract targets **Keap REST API v1**, where
`duplicate_option` is supported on `PUT /v1/contacts`. It is **not available in
REST API v2**. If the integration is ever migrated to v2, deduplication must be
re-implemented as an explicit `GET` by email followed by `PATCH` (when a match
exists) or `POST` (when none does) — and the create path must be guarded against
the resulting race window.

**Retry Strategy**:
- On failure: set `keap_sync_status` to 'failed' in Supabase
- Background retry: cron job or Supabase Edge Function checks for failed/retrying records
- Max 3 retries with exponential backoff (1min, 5min, 30min)
- After 3 failures: remains in 'failed' status for manual review
- Retries are safe to repeat: because Step 1 deduplicates by email, retrying a
  partially-succeeded sync updates the same contact rather than creating a duplicate.

## DataLayer Events Contract

All events pushed to `window.dataLayer` following GA4 conventions. See FR-038A in spec.md for the complete event table.

```typescript
// Type definitions for DataLayer events
interface DataLayerEvent {
  event: string;
  [key: string]: string | number | undefined;
}

// Example pushes
window.dataLayer.push({ event: 'assessment_start' });
window.dataLayer.push({
  event: 'question_answered',
  question_number: 3,
  element_code: 'HM',
  question_position: 1
});
window.dataLayer.push({
  event: 'results_viewed',
  overall_score: 35,
  overall_percentage: 43.75,
  balance_score: 7.2,
  profile_archetype: 'uneven_intermediate',
  weakest_element: 'TO',
  strongest_element: 'HM'
});
```
