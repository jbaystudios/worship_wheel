# Quickstart: Results PDF Download

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md) · **Date**: 2026-05-25

Developer setup to start implementing or testing the PDF feature locally.

## Prerequisites

- Existing dev setup (Next.js running, `.env.local` populated with Supabase keys — same as for spec 005 / D-3)
- `SUPABASE_SERVICE_ROLE_KEY` set (the PDF endpoint uses the service-role client)
- At least one row in `assessment_sessions` to render — submit a real assessment via `/assessment` or use the test contact `ww-test@swaydeandco.com` from the D-3 QA pass

## 1. Install the dependency

```bash
npm install @react-pdf/renderer
```

## 2. Add Montserrat font files

`@react-pdf/renderer` cannot use Next/Font directly — it needs file paths it can read at render time. Copy the four required weights:

```bash
mkdir -p public/fonts/montserrat
# Source TTF files from Google Fonts (https://fonts.google.com/specimen/Montserrat)
# Required weights for PDF: 400 (regular), 500 (medium), 700 (bold)
# Place as: Montserrat-Regular.ttf, Montserrat-Medium.ttf, Montserrat-Bold.ttf
```

(If `@react-pdf/renderer` accepts WOFF2 in the installed version, prefer those — smaller files.)

## 3. Apply the Supabase migration

```bash
# Local dev (assumes supabase CLI linked to the project ref)
supabase db push

# Or apply manually via the SQL editor
psql ... < supabase/migrations/<ts>_pdf_downloaded_event.sql
```

Verify the constraint accepted the new value:

```sql
select pg_get_constraintdef(oid)
from pg_constraint
where conname = 'assessment_events_event_type_check';
-- should include 'pdf_downloaded'
```

## 4. Smoke test

Start the dev server:

```bash
npm run dev
```

Hit the endpoint with a real resultId from your local DB:

```bash
# Get a resultId from Supabase (any completed session)
RESULT_ID=$(curl -s \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/assessment_sessions?select=id&limit=1" \
  | python3 -c "import sys,json;print(json.load(sys.stdin)[0]['id'])")

# Download the PDF
curl -o /tmp/test-report.pdf "http://localhost:3000/api/results/$RESULT_ID/pdf"
open /tmp/test-report.pdf
```

Expected: a paginated PDF opens in Preview with the cover page, radar chart, element breakdown, archetype card, and CTA.

## 5. Verify the event log

After downloading the PDF from `/results/[resultId]` in a browser (not curl — the client emits the event):

```bash
curl -s \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/assessment_events?event_type=eq.pdf_downloaded&order=created_at.desc&limit=5" \
  | python3 -m json.tool
```

You should see one row per browser-triggered download.

## 6. Manual print test (pre-launch checklist)

Before D-2 is marked done:

```bash
# Open in Preview, then File → Print → "Open PDF in Preview" or print to physical A4
open /tmp/test-report.pdf
```

Confirm:
- Cover page is single-page, name and date render correctly
- Radar chart is crisp at any zoom (vector, not raster)
- Element breakdown does not split mid-row across page boundaries
- Archetype message wraps cleanly
- CTA link is clickable
- Page footer shows `X / N`, "Worship Wheel Assessment", and the user's first name

Append one line to `project-management/v1-launch/qa-log.md` per cross-viewer check.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `Font 'Montserrat' is not registered` | `Font.register()` ran but path is wrong | Check `public/fonts/montserrat/*.ttf` exists; paths in `styles.ts` should be `path.join(process.cwd(), 'public', 'fonts', ...)` |
| Radar polygon is invisible | Score values out of range or path math wrong | Log `points` array; verify all 8 elements present in `element_scores` JSONB |
| PDF download starts a 4xx | UUID v4 regex rejected | Check the route param matches `crypto.randomUUID()` output format |
| Event not in `assessment_events` | Insert blocked by RLS or CHECK | Confirm migration applied (step 3); verify anon key has insert policy on `assessment_events` (it does — `assessment_events_insert_public`) |
| Cold start > 5s | Font loading from URL instead of disk | Move font files to local `public/fonts/` and use absolute paths |
