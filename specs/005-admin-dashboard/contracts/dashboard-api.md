# Contract: Dashboard Data API

**Feature**: `005-admin-dashboard` | **Date**: 2026-05-19
**Related**: [data-model.md](../data-model.md) · [auth.md](./auth.md)

Route Handlers under `/api/admin/*` serve client-driven date-range, pagination, search, and export requests. Dashboard Server Components render the initial view by calling the same RPC functions directly. **Every endpoint here requires an authenticated session** — see [auth.md](./auth.md).

---

## Common conventions

**Auth**: all endpoints require a valid Supabase session cookie. An unauthenticated request receives `401` with no data body (FR-001, FR-002).

**Common query parameters**:

| Param | Default | Description |
|---|---|---|
| `from` | 30 days ago | ISO date — range start (inclusive), interpreted in the reporting timezone |
| `to` | today | ISO date — range end (inclusive) |
| `includeInternal` | `false` | when `true`, internal/self traffic is included |

**Errors**: `401` unauthenticated · `400` invalid range/params · `500` server error (generic message, details logged server-side).

---

## GET /api/admin/funnel

Funnel summary + per-question drop-off. Backed by `get_funnel_summary` and `get_question_dropoff`.

**Response 200**:

```json
{
  "range": { "from": "2026-04-19", "to": "2026-05-19", "tz": "Africa/Johannesburg" },
  "funnel": [
    { "step": "visitors",      "count": 1240, "rateFromPrevious": null,  "rateFromVisitors": 1.0 },
    { "step": "started",       "count": 880,  "rateFromPrevious": 0.71,  "rateFromVisitors": 0.71 },
    { "step": "completed",     "count": 512,  "rateFromPrevious": 0.582, "rateFromVisitors": 0.413 },
    { "step": "lead_captured", "count": 470,  "rateFromPrevious": 0.918, "rateFromVisitors": 0.379 }
  ],
  "previousPeriod": {
    "range": { "from": "2026-03-20", "to": "2026-04-18" },
    "funnel": [
      { "step": "visitors", "count": 1100 },
      { "step": "started", "count": 760 },
      { "step": "completed", "count": 430 },
      { "step": "lead_captured", "count": 388 }
    ]
  },
  "questions": [
    {
      "position": 1, "questionId": "fb_01",
      "reached": 880, "reachedRate": 1.0,
      "dropoffToNext": 34, "dropoffRate": 0.039,
      "medianTimeSeconds": 11.2, "avgTimeSeconds": 14.8,
      "stickingPoint": false
    }
  ]
}
```

Notes: `funnel[].step` is one of `visitors`, `started`, `completed`, `lead_captured`. `rateFromPrevious` is conversion from the prior funnel step; `rateFromVisitors` is share of all visitors. `questions[]` is ordered by `position` (1–24). `stickingPoint` is `true` when the question's abandonment **and** dwell time are both above the period average (FR-027).

---

## GET /api/admin/acquisition

Traffic-source breakdown with per-source conversion. Backed by `get_acquisition_breakdown`.

**Response 200**:

```json
{
  "range": { "from": "2026-04-19", "to": "2026-05-19", "tz": "Africa/Johannesburg" },
  "sources": [
    {
      "source": "youtube / social", "kind": "utm",
      "campaign": "worship-wheel-launch",
      "visits": 540, "startedRate": 0.78, "completionRate": 0.46, "leadRate": 0.42
    },
    {
      "source": "facebook.com", "kind": "referrer",
      "campaign": null,
      "visits": 210, "startedRate": 0.61, "completionRate": 0.30, "leadRate": 0.27
    },
    {
      "source": "Direct", "kind": "direct",
      "campaign": null,
      "visits": 490, "startedRate": 0.70, "completionRate": 0.41, "leadRate": 0.38
    }
  ],
  "topLandingPaths": [
    { "path": "/assessment", "visits": 980 },
    { "path": "/", "visits": 260 }
  ]
}
```

Notes: `kind` is `utm` | `referrer` | `direct` and reflects the attribution waterfall (UTM → referrer domain → Direct). Rates are relative to that source's visits.

---

## GET /api/admin/outcomes

Audience and results distributions. Backed by `get_outcomes_summary` (may read `aggregate_stats`).

**Response 200**:

```json
{
  "range": { "from": "2026-04-19", "to": "2026-05-19", "tz": "Africa/Johannesburg" },
  "completers": 470,
  "archetypeDistribution": [
    { "archetype": "uneven_intermediate", "name": "The Uneven Intermediate", "count": 180, "share": 0.383 }
  ],
  "scoreBandDistribution": [
    { "band": "8-25", "count": 90, "share": 0.191 },
    { "band": "26-40", "count": 200, "share": 0.426 },
    { "band": "41-55", "count": 130, "share": 0.277 },
    { "band": "56-80", "count": 50, "share": 0.106 }
  ],
  "elementAverages": [
    { "code": "FB", "name": "Fretboard", "avgScore": 4.8 },
    { "code": "HM", "name": "Harmony", "avgScore": 6.1 }
  ],
  "deviceSplit": [
    { "device": "mobile", "visitors": 760, "completers": 280 },
    { "device": "desktop", "visitors": 420, "completers": 170 },
    { "device": "tablet", "visitors": 60, "completers": 20 }
  ],
  "completionTime": { "avgSeconds": 268, "medianSeconds": 240 }
}
```

---

## GET /api/admin/leads

Paginated, searchable, date-filtered table of individual completed assessments. Reads `assessment_sessions` directly under the `authenticated` RLS policy.

**Query parameters**: common params, plus:

| Param | Default | Description |
|---|---|---|
| `q` | — | search string matched against name and email |
| `page` | `1` | 1-based page index |
| `pageSize` | `25` | rows per page (max 100) |
| `syncStatus` | — | optional filter: `pending` \| `synced` \| `failed` \| `retrying` |

**Response 200**:

```json
{
  "range": { "from": "2026-04-19", "to": "2026-05-19" },
  "page": 1, "pageSize": 25, "total": 470,
  "rows": [
    {
      "resultId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "firstName": "John", "email": "john@example.com",
      "completedAt": "2026-05-18T09:14:00Z",
      "overallScore": 35, "archetypeName": "The Uneven Intermediate",
      "trafficSource": "youtube / social",
      "keapSyncStatus": "synced"
    }
  ]
}
```

---

## GET /api/admin/leads/export

CSV export of the **currently filtered** leads view. Accepts the same parameters as `GET /api/admin/leads` (except `page`/`pageSize` — exports the full filtered set).

**Response 200**: `Content-Type: text/csv`, `Content-Disposition: attachment; filename="worship-wheel-leads_<from>_<to>.csv"`. RFC 4180 CSV, streamed. Columns: First Name, Email, Completed At, Overall Score, Overall %, Balance Score, Archetype, Traffic Source, Keap Sync Status, Results URL.

---

## Keap sync-health panel

Served by `GET /api/admin/leads?syncStatus=failed` (and `retrying`). The Leads page renders these rows in a dedicated panel showing email, completed time, status, and — additionally surfaced for this panel — `keapSyncError`. When the filtered set is empty the panel shows a healthy empty state (FR-040, US5 scenario 6). The dashboard only **observes** sync status; it never triggers or repairs a Keap sync.
