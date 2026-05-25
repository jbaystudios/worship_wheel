# Data Model: Results PDF Download

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md) · **Date**: 2026-05-25

This feature does not introduce a new primary entity — it reads an existing `assessment_sessions` row, shapes it for rendering, and writes one new event-type value. The data flow is:

```
HTTP GET /api/results/[resultId]/pdf
        │
        ▼
[1] Validate resultId (UUID v4 regex)
        │
        ▼
[2] Read assessment_sessions row (service-role SELECT)
        │
        ▼
[3] Shape SessionRow → PdfData (src/lib/pdf/data.ts)
        │
        ▼
[4] Render <ReportDocument data={pdfData} /> via @react-pdf/renderer
        │
        ▼
[5] Stream PDF response to client

— Independently, on client-side success:
HTTP POST /api/events  { event_type: 'pdf_downloaded', ... }
```

---

## Entities

### 1. `AssessmentSession` (existing — input)

Defined in `supabase/migrations/20260414160000_initial_schema.sql`. The PDF route reads the following subset of columns:

| Column | Type | Required in PDF? | Notes |
|---|---|---|---|
| `id` | `uuid` | Yes | The resultId in the URL. Primary key. |
| `created_at` | `timestamptz` | Yes | Used as the "completion date" on the cover page. Formatted to "25 May 2026". |
| `first_name` | `text` | Yes | Cover page greeting + filename slug + per-page footer. |
| `element_scores` | `jsonb` | Yes | Record of `{ FB, HM, ML, RH, TO, TH, TE, AU }` → numbers (1–10). Drives the radar polygon. |
| `overall_score` | `int` | Yes | 8–80. Summary stat block + drives CTA tier mapping. |
| `overall_percentage` | `numeric` | Yes | 0–100. Summary stat block. |
| `balance_score` | `numeric` | Yes | 1.0–10.0. Summary stat block. |
| `profile_archetype` | `text` | Yes | Snake_case key (e.g. `theory_head`). Looked up to render display name + message. |

Columns deliberately **not** read for the PDF:
- `email`, `answers`, `weakest_elements`, `strongest_elements`, all `utm_*`, `anon_session_id`, `keap_*` — out of scope per spec FR-006 through FR-011 and Q-04.

---

### 2. `PdfData` (new — intermediate, in-memory)

Defined in `src/lib/pdf/data.ts`. Shapes the raw Supabase row into a render-friendly object so PDF components never touch DB column names directly.

```ts
export interface PdfData {
  firstName: string;
  completedAt: Date;                          // parsed from created_at
  completedAtFormatted: string;               // "25 May 2026"
  elementScores: Record<ElementCode, number>; // { FB, HM, ML, ... }
  overall: {
    score: number;        // 8-80
    percentage: number;   // 0-100, rounded to 2dp
    outOf: 80;            // const for the summary card
  };
  balance: number;        // 1.0-10.0
  archetype: {
    key: string;          // snake_case (for stable refs)
    displayName: string;  // "The Theory Head"
    message: string;      // personalised paragraph
  };
  cta: {
    tier: 'free_video' | 'breakthrough' | 'academy' | 'workshops';
    label: string;        // "WGS Academy"
    description: string;  // contextual blurb
    url: string;          // landing-page URL
  };
}
```

**Construction rules**:
- `archetype.displayName` and `archetype.message` come from `archetypeNameFromKey()` + the `ARCHETYPES` table in `src/lib/scoring/archetypes.ts`. For pre-D-AC `fallback_*` keys, the back-compat path in `archetypeNameFromKey` handles display.
- `cta` is derived from `overall.score` via `getCtaBand()` in `src/lib/scoring/bands.ts`.
- `completedAtFormatted` uses `Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })`.

---

### 3. `assessment_events` event row (existing schema, new value)

Defined in `supabase/migrations/20260519120000_admin_dashboard_schema.sql`. A successful PDF download writes one row:

| Column | Value |
|---|---|
| `id` | auto (gen_random_uuid) |
| `created_at` | auto (now()) |
| `client_ts` | client `new Date().toISOString()` |
| `anon_session_id` | from sessionStorage (set on `/assessment` start) |
| `event_type` | `'pdf_downloaded'` (NEW) |
| `question_id` | NULL |
| `question_position` | NULL |
| `utm_*`, `referrer_domain`, `landing_path` | NULL or copied from session if available |

Inserted via the existing `assessment_events_insert_public` RLS policy + anon client. No service-role required for the event write (only the PDF-data read uses service-role).

**Optional v1.5**: include `placement: 'top' | 'bottom'` in a future `metadata` jsonb column — currently the schema has no metadata column, so this would be a follow-up migration. Per spec FR-025, optional in v1.

---

## Migrations

### `<ts>_pdf_downloaded_event.sql` (NEW)

Extends the `event_type` CHECK constraint on `assessment_events` to allow the new value. Drop-and-recreate pattern (Postgres has no in-place enum-set ALTER for CHECK constraints).

```sql
-- Allow the 'pdf_downloaded' event type so the PDF download flow
-- (spec 006, D-2) can log to assessment_events alongside the existing
-- funnel events. Purely additive — no existing rows become invalid.

alter table public.assessment_events
  drop constraint if exists assessment_events_event_type_check;

alter table public.assessment_events
  add constraint assessment_events_event_type_check
  check (event_type in (
    'page_view',
    'assessment_started',
    'question_viewed',
    'question_answered',
    'assessment_submitted',
    'pdf_downloaded'
  ));
```

The migration is non-blocking for our pre-launch row count and reversible (drop the constraint, recreate without `'pdf_downloaded'`, but only if no rows of that type exist yet).

---

## Type / interface dependencies

| Type | Source file | Reused for |
|---|---|---|
| `ElementCode` | `src/types/index.ts` | Keys of `elementScores`, radar axis labels |
| `ELEMENT_NAMES` | `src/types/index.ts` | Element breakdown row labels |
| `archetypeNameFromKey` | `src/lib/scoring/archetypes.ts` | Display name lookup |
| `ARCHETYPES` table | `src/lib/scoring/archetypes.ts` | Archetype message lookup |
| `getCtaBand` | `src/lib/scoring/bands.ts` | CTA tier derivation |
| `createServiceClient` | `src/lib/supabase/service.ts` | Read `assessment_sessions` row |

No new types in `src/types/`. `PdfData` is internal to `src/lib/pdf/` and not exposed broadly.

---

## Validation rules

- `resultId` (URL param): MUST match the UUID v4 regex from research R7 before any DB query.
- `firstName` for filename: sanitise to `/[a-z0-9-]+/` lowercased; fall back to `"user"` if empty after sanitisation.
- `created_at` from Supabase: parse via `new Date(row.created_at)`; if Invalid Date, fall back to the request time (defensive — should never happen).
- `element_scores`: validate the 8 expected keys are present and each is `1 <= n <= 10`. If malformed, 500 (data corruption upstream).
- `overall_score`: validate `8 <= n <= 80`. If out of range, 500.
- `profile_archetype`: validate non-empty string. Unknown keys fall through `archetypeNameFromKey`'s humanize path.
