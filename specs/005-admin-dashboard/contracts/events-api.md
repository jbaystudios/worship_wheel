# Contract: Event Ingestion API

**Feature**: `005-admin-dashboard` | **Date**: 2026-05-19
**Related**: [data-model.md](../data-model.md) · `assessment_events`

The public, best-effort endpoint that the assessment flow calls to record funnel events. Consent-independent, anonymous, never blocks the user.

---

## POST /api/events

Records one or more funnel events. Called from the assessment flow via `navigator.sendBeacon` (preferred) or `fetch` with `keepalive: true`.

**Auth**: none (public). Anonymous events only.

**Request body** — a single event object, or an array of up to 10:

```json
{
  "anonSessionId": "8f2a1c40-1b2e-4d3a-9c11-7e6f5a4b3c2d",
  "eventType": "question_viewed",
  "clientTs": "2026-05-19T14:03:22.140Z",
  "questionId": "fb_01",
  "questionPosition": 1,
  "acquisition": {
    "utmSource": "youtube",
    "utmMedium": "social",
    "utmCampaign": "worship-wheel-launch",
    "utmTerm": null,
    "utmContent": null,
    "referrer": "https://www.youtube.com/watch?v=abc",
    "landingPath": "/assessment"
  }
}
```

**Field rules** (Zod-validated in `lib/events/schema.ts`):

| Field | Required | Rule |
|---|---|---|
| `anonSessionId` | yes | valid UUID |
| `eventType` | yes | one of `page_view`, `assessment_started`, `question_viewed`, `question_answered`, `assessment_submitted` |
| `clientTs` | no | ISO 8601 timestamp |
| `questionId` | conditional | required iff `eventType` ∈ {`question_viewed`,`question_answered`}; must match a known question id |
| `questionPosition` | conditional | required with `questionId`; integer 1–24 |
| `acquisition` | no | object; expected only on the session's first event; ignored if sent on later events |
| `acquisition.referrer` | no | full URL string; server parses and stores host only as `referrer_domain` |
| `resultId` | no | UUID; permitted only with `assessment_submitted` |

**Server-side processing**:
1. Validate payload; on failure return `204` (best-effort — never surface errors to the assessment UI) and discard.
2. Derive `device_type` and `is_bot` from the `User-Agent` header.
3. Parse `acquisition.referrer` → `referrer_domain` (host only).
4. Insert row(s) into `assessment_events`.
5. The request IP may be used transiently for rate-limiting and is **never stored**.

**Responses**:
- `204 No Content` — accepted, or silently discarded (invalid/rate-limited). The client ignores the response either way.
- `429` — rate limit exceeded (per IP). Client ignores it; events are best-effort.

**Rate limit**: generous per-IP cap (e.g. 120 events / 10 min) — high enough never to affect a real user, low enough to blunt abuse.

**Guarantees**:
- The endpoint MUST NOT return a body the assessment UI depends on.
- A failure, timeout, or non-2xx response MUST NOT affect the assessment flow (FR-021).
- The endpoint MUST NOT set cookies or persistent client storage.

---

## Event emission map *(assessment flow → events)*

| Assessment moment | Event emitted | Notes |
|---|---|---|
| Assessment landing page loads | `page_view` | First event of session — carries `acquisition` |
| User begins the first question | `assessment_started` | |
| Each question is shown | `question_viewed` | `questionId` + `questionPosition` |
| Each question is answered | `question_answered` | enables time-on-question = answered − viewed |
| Email submitted (on `/api/submit` success) | `assessment_submitted` | carries `resultId` once known |

Final `question_viewed` / `question_answered` before an abandon is delivered via `sendBeacon` on `visibilitychange`/`pagehide`.

---

## Modification to existing POST /api/submit

`/api/submit` (contract in spec 001) gains one optional request field:

```jsonc
{
  // ...existing fields...
  "anonSessionId": "8f2a1c40-1b2e-4d3a-9c11-7e6f5a4b3c2d"  // NEW — optional UUID
}
```

When present, the submit handler stores it in `assessment_sessions.anon_session_id`, enabling the funnel ↔ session join (research R10). Absence MUST NOT cause submission to fail — older clients or stripped storage simply yield an unlinked completion.
