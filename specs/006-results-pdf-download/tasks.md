---
description: "Task list for spec 006 — Results PDF Download (D-2)"
---

# Tasks: Results PDF Download

**Input**: Design documents from `/specs/006-results-pdf-download/`
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/pdf-endpoint.md`, `quickstart.md`

**Tests**: The spec acceptance scenarios and the plan's Phase B both call for a structural snapshot test of the PDF render. Tests are NOT required for every component, but the one structural test (T007) is included because it locks in the PDF render pipeline.

**Organization**: Tasks are grouped by user story so each story can be implemented, validated, and shipped independently. US1 (the download itself) is the MVP — US2 (tracking) can land after US1 is on production.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete-dep blockers)
- **[Story]**: `US1` or `US2` for user-story phase tasks; absent for Setup / Foundational / Polish
- File paths are exact and follow the structure in `plan.md` § *Project Structure*

## Path Conventions

Single Next.js project at repo root. Source lives in `src/`. Tests in `src/__tests__/`. Migrations in `supabase/migrations/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Bring in the new dependency, scaffold directories, and stage the brand assets the PDF needs.

- [X] T001 Install `@react-pdf/renderer` via `npm install @react-pdf/renderer` and verify it lands in `package.json` + `package-lock.json`
- [X] T002 [P] Download Montserrat TTFs (weights 400 / 500 / 700) from Google Fonts and commit them to `public/fonts/montserrat/Montserrat-Regular.ttf`, `public/fonts/montserrat/Montserrat-Medium.ttf`, `public/fonts/montserrat/Montserrat-Bold.ttf`
- [X] T003 [P] Create empty scaffold directories with `.gitkeep` placeholders: `src/components/results/pdf/`, `src/lib/pdf/`, `src/lib/events/` (the last only if it doesn't already exist)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Apply the Supabase migration that unblocks the `pdf_downloaded` event type and confirm the service-role read path works end-to-end.

**⚠️ CRITICAL**: T004 + T005 must complete before any US2 work, and T006 must pass before any US1 implementation starts.

- [X] T004 Create migration file `supabase/migrations/$(date +%Y%m%d%H%M%S)_pdf_downloaded_event.sql` that drops the existing `assessment_events_event_type_check` constraint and recreates it with `'pdf_downloaded'` added (exact SQL in `data-model.md` § Migrations)
- [X] T005 Apply the migration locally via `supabase db push` and verify with `select pg_get_constraintdef(oid) from pg_constraint where conname = 'assessment_events_event_type_check'` that `pdf_downloaded` is in the allowed set
- [X] T006 Smoke-test the service-role read path: run a one-off `curl` (or vitest) against `createServiceClient()` from `src/lib/supabase/service.ts` to `SELECT * FROM assessment_sessions WHERE id = '<known-test-id>' LIMIT 1` and confirm it returns the row (no RLS block)

**Checkpoint**: Migration applied, service-role read confirmed. US1 implementation can begin.

---

## Phase 3: User Story 1 — Download my assessment as PDF (Priority: P1) 🎯 MVP

**Goal**: A user on the results page clicks "Download PDF" (top or bottom button) and receives a styled, branded, paginated PDF report of their assessment.

**Independent Test**: Submit a real assessment via `/assessment`, land on `/results/[resultId]`, click either button, and verify the downloaded file (a) opens in Preview / Adobe / Chrome built-in / mobile Safari, (b) contains the correct user-specific data (name, scores, archetype, recommendations), (c) prints cleanly on A4 with no mid-section breaks.

### Tests for User Story 1

- [X] T007 [P] [US1] Create `src/__tests__/unit/pdf-render.test.ts` — structural assertion that `<ReportDocument data={fixture} />` rendered via `renderToBuffer` produces a non-empty Buffer and the resulting bytes start with `%PDF-` (PDF magic number). Use a hand-built `PdfData` fixture covering all 6 archetypes.

### Implementation for User Story 1 — PDF document layout

- [X] T008 [US1] Create `src/components/results/pdf/styles.ts` — `Font.register({ family: 'Montserrat', fonts: [...] })` at module scope referencing the TTFs from T002, plus a `StyleSheet.create()` with brand-colour constants (light theme per research Q-03) pulled from `src/tokens/`
- [X] T009 [P] [US1] Implement `src/components/results/pdf/RadarSvg.tsx` — pure SVG radar using `@react-pdf/renderer`'s `<Svg>`/`<Polygon>`/`<Line>`/`<Circle>`/`<Text>` primitives. Polygon math per research R3 (8 axes at 45°, polar→cartesian projection). Takes `elementScores: Record<ElementCode, number>` as a prop.
- [X] T010 [P] [US1] Implement `src/components/results/pdf/CoverPage.tsx` — page 1: WGS logo (inline SVG or base64), "Worship Wheel Assessment Report" title, user's first name as greeting, completion date in "DD MMMM YYYY" format (Intl.DateTimeFormat `en-GB`, per spec Q-05)
- [X] T011 [US1] Implement `src/components/results/pdf/ScoresPage.tsx` — page 2: radar chart (from T009) + 3 summary stat blocks (overall score, balance, profile) + 8-row element breakdown with band labels (Formula/Foundation/Functional/Fluent/Flow) and score bars. Wrap each stat block + each breakdown row in `<View wrap={false}>` per research R4 (depends on T008, T009)
- [X] T012 [P] [US1] Implement `src/components/results/pdf/ArchetypePage.tsx` — page 3: archetype display name (looked up via `archetypeNameFromKey`), personalised message paragraph, and CTA tier text with clickable `<Link>` to the WGS landing page for that tier (mapping from `getCtaBand()` in `src/lib/scoring/bands.ts`)
- [X] T013 [US1] Compose `src/components/results/pdf/ReportDocument.tsx` — top-level `<Document>` wrapping CoverPage/ScoresPage/ArchetypePage with shared `<Page size="A4" style={pageStyles}>` props and a per-page footer (`X / N` page numbering, "Worship Wheel Assessment" title, user's first name). Accepts the `PdfData` interface from `data-model.md` (depends on T008, T010, T011, T012)

### Implementation for User Story 1 — Server-side helpers

- [X] T014 [P] [US1] Implement `src/lib/pdf/data.ts` — exports `loadPdfData(resultId: string): Promise<PdfData | null>` that reads the `assessment_sessions` row via `createServiceClient()`, validates score ranges per `data-model.md` § Validation rules, derives `archetype.displayName` via `archetypeNameFromKey`, derives `cta` via `getCtaBand`, and returns the shaped `PdfData` object (null on not-found, throws on data corruption)
- [X] T015 [P] [US1] Implement `src/lib/pdf/render.ts` — exports `renderReportToStream(data: PdfData): NodeJS.ReadableStream` that calls `renderToStream(<ReportDocument data={data} />)` from `@react-pdf/renderer`. Imports `ReportDocument` from T013.

### Implementation for User Story 1 — API route

- [X] T016 [US1] Implement `src/app/api/results/[resultId]/pdf/route.ts` — `GET` handler per `contracts/pdf-endpoint.md`: validate `resultId` against UUID v4 regex (research R7 — 400 on fail), apply 30/IP/min rate limit (reuse pattern from `/api/submit` — 429 on fail), call `loadPdfData()` (404 on null), call `renderReportToStream()`, return as `Response` with `Content-Type: application/pdf`, `Content-Disposition: attachment; filename="worship-wheel-{firstNameSlug}-{YYYY-MM-DD}.pdf"`, `Cache-Control: private, max-age=300`. Errors → 500 with brief message + full server log (depends on T013, T014, T015)

### Implementation for User Story 1 — UI integration

- [X] T017 [P] [US1] Implement `src/components/results/DownloadPdfButton.tsx` — `'use client'` component accepting `resultId: string`, `firstName: string`, `placement: 'top' | 'bottom'`. On click: fetch `/api/results/{resultId}/pdf` as blob → create object URL → trigger `<a download>` click → revoke URL. Local `isLoading` state disables the button and swaps label to "Preparing PDF…" with a spinner. Errors restore button state and surface an inline toast/error message ("Couldn't generate PDF — please try again")
- [X] T018 [US1] Update `src/app/results/page.tsx` — render `<DownloadPdfButton placement="top" resultId={...} firstName={...} />` immediately under the results page heading (above the radar chart), and a second `<DownloadPdfButton placement="bottom" .../>` after the CTA section. Both pull `resultId` and `firstName` from the existing sessionStorage results data (depends on T017)

### Validation for User Story 1

- [ ] T019 [US1] Manual smoke test: start `npm run dev`, submit an assessment as `ww-test@swaydeandco.com`, navigate to `/results/[resultId]`, click the top "Download PDF" button, verify the downloaded file opens in macOS Preview with the expected user name, date, scores, archetype, and CTA
- [ ] T020 [US1] Manual A4 print test: from Preview, print the PDF to physical A4 (or "Save as PDF") and confirm — per spec FR-014 — no chart, stat card, breakdown row, or paragraph is split across a page boundary
- [ ] T021 [US1] Append a `✅` one-liner to `project-management/v1-launch/qa-log.md` under a new "PDF download (D-2)" section: `- YYYY-MM-DD · ✅ · Download PDF (top button) from /results/[id] → branded PDF opens with correct data, A4 print test passes with no mid-section breaks`

**Checkpoint**: US1 (MVP) shipped. Users can download a polished PDF of their results. D-2's primary "Done when" criteria are met (excluding the tracking criterion handled in US2).

---

## Phase 4: User Story 2 — Track PDF downloads in admin dashboard (Priority: P2)

**Goal**: Every successful PDF download emits a `pdf_downloaded` event to `assessment_events` so the admin Outcomes view can show download rates as a downstream engagement signal.

**Independent Test**: Trigger a PDF download from `/results/[resultId]`, then query `assessment_events` for a row with `event_type = 'pdf_downloaded'` and the matching `anon_session_id`. Open the admin dashboard's Outcomes view and confirm the count surfaces for the relevant date range.

### Implementation for User Story 2

- [X] T022 [P] [US2] Implement `src/lib/events/pdf-downloaded.ts` — exports `logPdfDownloaded({ resultId, anonSessionId, placement }: { resultId: string; anonSessionId: string | null; placement: 'top' | 'bottom' })` that POSTs `{ event_type: 'pdf_downloaded', anon_session_id, client_ts: new Date().toISOString() }` to `/api/events`. Fire-and-forget (no await on caller side); swallow errors after logging to console (per spec FR-024, a failed event MUST NOT break the download)
- [X] T023 [US2] Wire `logPdfDownloaded` into `src/components/results/DownloadPdfButton.tsx` — after the blob download initiates successfully, call `logPdfDownloaded({ resultId, anonSessionId: <from sessionStorage>, placement })` without awaiting. The `anonSessionId` is the same one used by the rest of the funnel (spec 005) (depends on T017, T022)
- [ ] T024 [US2] Verify event row lands: trigger one download from a browser at `/results/[resultId]`, then `curl` the Supabase REST API for `assessment_events?event_type=eq.pdf_downloaded&order=created_at.desc&limit=1` and confirm the row exists with the correct `anon_session_id`
- [ ] T025 [US2] Verify admin dashboard surfacing: open `/admin` (auth as the admin user per spec 005 US1), navigate to the Outcomes view, confirm `pdf_downloaded` count appears in the date range covering T024. If the count is missing because of an event-type allowlist filter in `src/lib/admin/outcomes-data.ts` (or wherever event aggregation happens), add `'pdf_downloaded'` to that allowlist
- [ ] T026 [US2] Append a `✅` one-liner to `project-management/v1-launch/qa-log.md` under the "PDF download (D-2)" section: `- YYYY-MM-DD · ✅ · Download PDF → pdf_downloaded event landed in assessment_events; count surfaces in admin Outcomes view`

**Checkpoint**: US1 + US2 both shipped. D-2 fully meets its "Done when" criteria.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Cross-viewer / cross-browser validation, production env cleanup left over from D-3, and hand-off to Charl.

- [ ] T027 [P] Cross-viewer rendering check — open the generated PDF in Preview (macOS), Adobe Reader, Chrome built-in viewer, and mobile Safari Quick Look (per spec SC-002). Append a one-liner to `qa-log.md` per viewer with the outcome
- [ ] T028 [P] Cross-browser button check — verify `DownloadPdfButton` initiates a download correctly in Chrome, Safari, Firefox (desktop) and mobile Safari (iOS Quick Look behaviour is acceptable per research R8 — note it in the qa-log entry, don't try to fix)
- [ ] T029 Set `NEXT_PUBLIC_BASE_URL=https://worshipwheel.worshipguitarskills.com` in Vercel production env via `vercel env add` (cross-cutting from D-3 — the `results_url` Keap custom field is currently `http://localhost:3000/...` on the test contact 88271 because the local test was the first push)
- [ ] T030 Update `project-management/v1-launch/deliverables.md` — mark D-2 status `✅ DONE` with completion date once T027 + T028 pass; cross-reference the qa-log entries
- [ ] T031 Hand the generated PDF (real assessment, not test data) to Charl for the C-3 design review — capture any feedback for v1.1 iteration; do not block launch on design tweaks unless they're critical
- [ ] T032 Delete Keap test contact id 88271 (`ww-test@swaydeandco.com`) before cohort launch so it doesn't pollute Keap reporting — cross-cutting cleanup from D-3 noted in STATUS.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion (specifically T001 — the migration could in theory run without `@react-pdf/renderer` installed, but the linear order is cleaner)
- **User Story 1 (Phase 3)**: Depends on Foundational (Phase 2) completion. Specifically: T006 (service-role read) must work before T014, and T002 (font files) must exist before T008
- **User Story 2 (Phase 4)**: Depends on T005 (migration applied — otherwise the event insert hits the CHECK constraint) AND T017 (button exists to hook into)
- **Polish (Phase 5)**: Depends on US1 + US2 implementation complete

### User Story Dependencies

- **US1**: Depends on Foundational only — NOT on US2. US1 is shippable alone as the MVP (the download works without tracking; the admin dashboard would show no PDF activity until US2 lands, but that's a graceful degradation)
- **US2**: Depends on US1 (specifically T017 — needs a button to hook the event-logging into). Cannot ship before US1

### Within User Story 1

- T007 (test) can run upfront in parallel — assertion is on the rendered output shape, can be written before implementation
- T008 (styles) blocks T010, T011, T012, T013 (all consume the StyleSheet exports)
- T009 (RadarSvg) blocks T011 (ScoresPage embeds it)
- T010, T012 are parallelizable with T009 once T008 exists
- T013 (ReportDocument) depends on T010, T011, T012
- T014, T015 are parallelizable with the PDF-component work — they touch different files
- T016 (API route) depends on T013, T014, T015 (imports all three)
- T017 (button) is parallelizable with everything above — only depends on the route's existence for runtime functionality (not for the component to compile)
- T018 (page wiring) depends on T017
- T019, T020, T021 are sequential validation steps after implementation

### Within User Story 2

- T022 (event helper) is independent
- T023 (wire into button) depends on T017 + T022
- T024, T025, T026 are sequential validation steps

### Parallel Opportunities

- All Phase 1 tasks marked [P] can run in parallel (T002, T003 alongside T001)
- Within US1: T009, T010, T012 in parallel after T008; T014, T015 in parallel with the PDF components; T017 in parallel with the entire server-side work
- Cross-viewer (T027) and cross-browser (T028) checks in Polish are independent

---

## Parallel Example: User Story 1 (after T008 is done)

```bash
# Three PDF component files in parallel:
Task: "Implement RadarSvg.tsx with pure SVG primitives (T009)"
Task: "Implement CoverPage.tsx with logo + title + greeting (T010)"
Task: "Implement ArchetypePage.tsx with archetype + CTA (T012)"

# Two server-side helpers in parallel with the above:
Task: "Implement src/lib/pdf/data.ts loadPdfData (T014)"
Task: "Implement src/lib/pdf/render.ts renderReportToStream (T015)"

# DownloadPdfButton can be built in parallel with everything (T017)
Task: "Implement DownloadPdfButton.tsx client component (T017)"
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Complete Phase 1: Setup (T001–T003)
2. Complete Phase 2: Foundational (T004–T006) — CRITICAL, blocks all stories
3. Complete Phase 3: User Story 1 (T007–T021)
4. **STOP and VALIDATE**: PDF downloads work end-to-end. Print test passes. Append to `qa-log.md`.
5. Deploy to preview environment for stakeholder smoke test
6. Optional: ship US1 to production *before* US2 — the download is the user-visible value; tracking is internal

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. US1 → MVP ships. Users can download. Charl can show off the PDF in coaching calls
3. US2 → tracking ships. Admin dashboard shows download rate. Pre-launch metric baseline established
4. Polish → cross-viewer/cross-browser sweep, env cleanup, Charl design review, test contact deleted

### Parallel Team Strategy (not applicable here — single developer)

If this were multi-dev: Phase 2 by one person, then split US1 between layout (T008–T013) and infrastructure (T014–T018), with US2 done by a third dev after US1 lands.

---

## Notes

- `[P]` = different files, no incomplete-dependency blockers
- `[US1]` / `[US2]` map each implementation task to its user story for traceability and selective shipping
- `qa-log.md` entries are not optional — they are how this work is reviewed with Charl pre-launch (see [[qa-log-habit]] memory)
- Commit after each task or logical group; keep commits small enough for `git bisect` to be useful later
- The `<ts>` placeholder in migration filenames must be replaced with the actual timestamp at creation time (`date +%Y%m%d%H%M%S` is in the T004 task text)
- The structural test T007 is the only formal test for this feature. Visual / cross-viewer correctness is validated manually via T019–T020 and T027 because no headless tool can verify "does this PDF look professional"
