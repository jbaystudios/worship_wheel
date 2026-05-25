# API Contract: PDF Download Endpoint

**Spec**: [../spec.md](../spec.md) · **Plan**: [../plan.md](../plan.md) · **Date**: 2026-05-25

## `GET /api/results/[resultId]/pdf`

Streams a generated PDF report for a single completed assessment session.

### Request

| Field | Where | Type | Required | Notes |
|---|---|---|---|---|
| `resultId` | URL path | string (UUID v4) | Yes | The `id` of an `assessment_sessions` row |

No request body. No query parameters. No auth header required (resultId is the access token — unguessable v4 UUID).

**Example**:
```
GET /api/results/0bd44797-2e76-49aa-9560-bc549344b52a/pdf HTTP/1.1
Host: worshipwheel.worshipguitarskills.com
Accept: application/pdf
```

### Response — Success (200)

| Header | Value | Notes |
|---|---|---|
| `Content-Type` | `application/pdf` | |
| `Content-Disposition` | `attachment; filename="worship-wheel-{firstName-slug}-{YYYY-MM-DD}.pdf"` | Slug = `firstName.toLowerCase().replace(/[^a-z0-9-]/g, '-')`, fallback `"user"` |
| `Cache-Control` | `private, max-age=300` | Per-user, short edge cache; data is immutable per resultId |
| `Transfer-Encoding` | `chunked` | Set automatically when streaming |

Body: streamed PDF bytes. Typical size 50–200 KB.

### Response — Errors

| Status | When | Body |
|---|---|---|
| `400 Bad Request` | `resultId` does not match the UUID v4 regex | `{ "error": "Invalid resultId format" }` |
| `404 Not Found` | No `assessment_sessions` row with that id (or rate-limit pre-check passed but row gone) | `{ "error": "Result not found" }` |
| `429 Too Many Requests` | Rate limit exceeded (30 req/IP/min) | `{ "error": "Rate limit exceeded" }` + `Retry-After` header |
| `500 Internal Server Error` | Supabase read failed, PDF render threw, or data corruption (invalid score range) | `{ "error": "Failed to generate PDF" }` — full error logged server-side |
| `503 Service Unavailable` | Transient Supabase outage; client SHOULD retry after backoff | `{ "error": "Try again in a moment" }` |

### Rate limiting

- 30 requests per IP per minute. Reuses the in-memory rate limiter pattern used by `/api/submit`.
- A 429 response includes `Retry-After: 60` (seconds).
- Bots and crawlers that hit valid resultIds will trip this quickly — by design.

### Idempotency

`GET` is idempotent. Re-requesting the same resultId always returns an identical PDF (same content, same filename) as long as the underlying `assessment_sessions` row has not been mutated. Rows are append-only in practice; the only field that changes post-submit is `keap_sync_status` (irrelevant to PDF output).

### Implementation reference

- Route handler: `src/app/api/results/[resultId]/pdf/route.ts`
- Render path: `src/lib/pdf/render.ts` → `renderToStream(<ReportDocument data={pdfData} />)`
- Data shaping: `src/lib/pdf/data.ts` → SessionRow → PdfData

---

## Related: `POST /api/events` (existing — new event type)

The download success path on the client emits a `pdf_downloaded` event via the existing event-ingest endpoint. **No new endpoint** — only a new valid value for the `event_type` field.

### Request (relevant subset)

```json
{
  "event_type": "pdf_downloaded",
  "anon_session_id": "<uuid>",
  "client_ts": "2026-05-27T14:30:00.000Z"
}
```

### Constraint dependency

The Supabase migration `<ts>_pdf_downloaded_event.sql` MUST land before this endpoint accepts the new value. Otherwise insertions will fail the `assessment_events_event_type_check` constraint and return a 500 from `/api/events`.

### Response

Existing success/error shape for `POST /api/events` is preserved. The client treats the event POST as fire-and-forget — a failed event post does **not** invalidate the download itself.
