# Feature Specification: Results PDF Download

**Feature Branch**: `006-results-pdf-download`
**Created**: 2026-05-25
**Status**: Draft
**Input**: Add a "Download PDF" capability to the results page so users can save a professional, branded report of their Worship Wheel assessment. Two button placements: top of results (above the fold) and end of report (after recommendations). Output must look like a designed assessment report, not a screenshot of the screen.

## Context

The results page (spec 003) is the payoff for the 16-question assessment. The lead is captured in Keap on submit (D-3, shipped 2026-05-25), but the on-screen results are ephemeral — users either share the URL, screenshot the page, or lose it. This spec adds a downloadable PDF report so users have a tangible artefact to revisit, print, or share with their worship team.

This is **D-2 in the v1 launch plan** (target 2026-05-27) and closes risk **R-4** (PDF approach undecided). The chosen approach is **`@react-pdf/renderer` rendered server-side** in an API route, reading session data from Supabase via the service-role client. Decision rationale and alternatives considered are in the *Approach* section below.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Download my assessment as a PDF (Priority: P1)

After completing the assessment and viewing my results on screen, I can click a "Download PDF" button to save a branded, paginated report of my Worship Wheel assessment to my device. The PDF includes my name, radar chart, per-element scores, archetype, and recommendations — laid out as a professional report I'd be happy to print or send to my worship leader.

**Why this priority**: This is the entire feature. Without it, the results are ephemeral. A polished PDF also reinforces the brand and gives Charl a tangible artefact to reference in coaching conversations.

**Independent Test**: Complete an assessment, click "Download PDF" from the results page, and verify the downloaded file (a) opens in standard PDF viewers, (b) contains the correct user-specific data, (c) renders consistently across viewers (Preview, Adobe, Chrome built-in, mobile Safari Quick Look), and (d) prints cleanly on A4 / US Letter without content cut off at page boundaries.

**Acceptance Scenarios**:

1. **Given** a user is on the results page, **When** they click "Download PDF" at the top of the page, **Then** their browser downloads a file named `worship-wheel-{firstName}-{YYYY-MM-DD}.pdf`.
2. **Given** a user reads through to the end of the report and clicks "Download PDF" at the bottom, **Then** the same PDF is generated (identical content, identical filename pattern).
3. **Given** the PDF is opened in any standard PDF viewer, **Then** the user sees: WGS-branded cover page with their name and date, the radar chart, the per-element breakdown, the archetype card with personalised message, recommendations, and the CTA — across multiple pages with consistent header/footer.
4. **Given** a user prints the PDF on A4 or US Letter paper, **When** the pages render, **Then** no content is cut at page boundaries — section breaks fall between sections, not mid-paragraph, mid-chart, or mid-stat-card.
5. **Given** a user views the PDF on a phone, **Then** all text is sharp and selectable (not a rasterised screenshot).

---

### User Story 2 — Track PDF downloads in the admin dashboard (Priority: P2)

When a user downloads their PDF, the event is logged to `assessment_events` so the admin Outcomes view (spec 005, US4) can show download counts as a downstream engagement signal — proving whether users care enough about their results to save them.

**Why this priority**: Charl needs to know whether the PDF is doing its job. Download rate is the first proxy for "do users value this report?" Required for go/no-go signal at launch.

**Independent Test**: Trigger a PDF download from the results page, then query `assessment_events` and confirm a `pdf_downloaded` row exists with the correct `anon_session_id`. Confirm the count surfaces in the admin Outcomes view.

**Acceptance Scenarios**:

1. **Given** a user clicks "Download PDF," **When** the download initiates, **Then** an event with `event_type = 'pdf_downloaded'` is recorded in `assessment_events` with the same `anon_session_id` used by the rest of the funnel.
2. **Given** download events are recorded, **When** the admin Outcomes view loads for a date range, **Then** PDF download count appears as a metric alongside existing outcomes (completions, lead captures).

---

### Edge Cases

- **No data in Supabase yet** (race between submit and PDF click): the PDF endpoint reads from `assessment_sessions` by `resultId`. The submit route awaits the insert before returning, so by the time the results page renders, the row exists. If the read still misses (e.g. transient DB latency), return a 503 and the UI surfaces a "Please try again in a moment" toast.
- **User clicks the button twice quickly**: debounce on the client; the second click is a no-op while the first request is in flight.
- **User opens results page from a shared link with no sessionStorage**: per spec 003 this currently shows an empty state. For PDF, we rely on the resultId in the URL — server-side PDF generation does not need sessionStorage, so a shared link CAN produce a valid PDF as long as the resultId is real. (See open question Q-01 about whether to expose this.)
- **Long archetype message overflows a page**: paginated layout breaks the message into a flowing text block, not a fixed-height card. Page break inside `<Text>` is handled by the PDF library.
- **Mobile Safari download**: iOS opens PDFs inline rather than offering "Save." The user can then tap the share icon → "Save to Files." Acceptable behaviour — no workaround needed for v1.
- **User's first name contains characters bad for filenames** (slashes, colons): sanitise to `[a-z0-9-]+` in the filename, fall back to "user" if empty after sanitisation.
- **Bot or crawler hits the PDF endpoint**: rate limit per IP (reuse the existing `/api/submit` rate limit shape: 30/min) and require the resultId to be a valid UUID v4 format.

## Requirements *(mandatory)*

### Functional Requirements

#### UI — Buttons

- **FR-001**: The results page MUST display a "Download PDF" button at the top of the results section (above the fold on desktop and mobile).
- **FR-002**: The results page MUST display a second "Download PDF" button at the end of the report, after the recommendations / CTA section.
- **FR-003**: Both buttons MUST trigger the same download action (no behavioural difference; tracked as a single event type, but the click position MAY be recorded as a property for funnel analysis).
- **FR-004**: While a download is in flight, the clicked button MUST show a loading state (spinner + "Preparing PDF…" label) and be disabled to prevent double-clicks.
- **FR-005**: On download failure, the button MUST restore to its normal state and the page MUST surface a brief error toast ("Couldn't generate PDF — please try again").

#### PDF Content

- **FR-006**: The PDF MUST include a cover page with: WGS logo, "Worship Wheel Assessment Report" title, the user's first name, and the completion date in long format (e.g., "25 May 2026").
- **FR-007**: The PDF MUST include the radar chart visualising the 8 element scores, rendered as inline SVG (not a rasterised image) so it remains sharp at any zoom level.
- **FR-008**: The PDF MUST include three summary stats — Overall Score (X/80 + percentage), Balance (X.X/10), Profile (archetype name) — laid out as a row of stat blocks.
- **FR-009**: The PDF MUST include an element-by-element breakdown with all 8 elements, each showing: element name, band label (Formula/Foundation/Functional/Fluent/Flow), score (1–10), and a visual score bar.
- **FR-010**: The PDF MUST include the archetype card — archetype name, personalised message, and (where applicable) the archetype's training focus copy.
- **FR-011**: The PDF MUST include the same CTA that the user sees on screen (offering tier mapped from overall score: 8–25, 26–40, 41–55, 56–80) with a clickable link to the WGS landing page for that offering.
- **FR-012**: Every page after the cover MUST include a header (WGS logo, small) and footer (page number "X / N", "Worship Wheel Assessment", and the user's first name).

#### PDF Layout & Output Quality

- **FR-013**: The PDF MUST use A4 page size (210 × 297 mm) as the default. *(Open question Q-02: A4 vs Letter.)*
- **FR-014**: Section breaks MUST fall between sections, never mid-chart, mid-stat-card, or mid-paragraph. Use the PDF library's `break` / `wrap` controls deliberately.
- **FR-015**: All text MUST be selectable (not rasterised). The radar chart MUST be vector SVG, not a PNG screenshot.
- **FR-016**: The PDF MUST render consistently across Preview (macOS), Adobe Reader, Chrome built-in viewer, and mobile Safari Quick Look.
- **FR-017**: The PDF MUST use the project's brand typography (Montserrat — bind to the same font files used by the web app) so the document reads as the same family as the on-screen experience.
- **FR-018**: The PDF MUST respect the project's brand colour palette — dark background or light? *(Open question Q-03.)*

#### Data Flow

- **FR-019**: PDF generation MUST run server-side at `GET /api/results/[resultId]/pdf`.
- **FR-020**: The endpoint MUST read the session data from `assessment_sessions` via the **service-role** Supabase client (the anon role has no SELECT policy on this table per the 2026-05-19 RLS fix).
- **FR-021**: The endpoint MUST validate that `resultId` is a UUID v4 before querying Supabase. Invalid → 400. Not found → 404.
- **FR-022**: The endpoint MUST stream the PDF as `application/pdf` with `Content-Disposition: attachment; filename="..."`.
- **FR-023**: The endpoint MUST set short edge-cache headers (`Cache-Control: private, max-age=300`) — the data is immutable per resultId, but the file is user-private so it must not hit a shared cache.

#### Tracking

- **FR-024**: A successful PDF download MUST log an event with `event_type = 'pdf_downloaded'` to `assessment_events` with the `anon_session_id` from the active session.
- **FR-025**: The event SHOULD include a `metadata` field indicating the click position (`top` or `bottom`) so we can measure which placement converts. *(Optional in v1 — drop if it requires a new column.)*
- **FR-026**: The PDF download count MUST be visible in the admin Outcomes view (spec 005, US4) for any selected date range.

#### Performance & Limits

- **FR-027**: Server-side PDF generation MUST complete in < 3 seconds at p95 for a single assessment (measured cold-cold, no caching).
- **FR-028**: The endpoint MUST be rate-limited to 30 requests per IP per minute to prevent abuse.

### Key Entities

- **AssessmentResult**: already defined; read from Supabase by resultId. Used as the data source for the PDF.
- **PDF document structure**: cover → summary → element breakdown → archetype → recommendations → CTA. New visual layout — does not need to mirror the on-screen layout.
- **`pdf_downloaded` event**: new `event_type` value on `assessment_events`. Requires extending the `event_type` CHECK constraint.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: PDF generation completes in < 3 seconds at p95 (measured server-side).
- **SC-002**: 100% of generated PDFs open without error in Preview (macOS), Adobe Reader, Chrome built-in viewer, and mobile Safari Quick Look.
- **SC-003**: Manual print test on A4 (and Letter, if Q-02 decides for it) shows no content cut at page boundaries across the full report.
- **SC-004**: All on-screen data fields (name, scores, archetype, recommendations) appear in the PDF and match the values from `assessment_sessions` for that resultId.
- **SC-005**: PDF download count is queryable from `assessment_events` and surfaces in the admin Outcomes view.
- **SC-006**: Charl reviews and signs off on the visual design (C-3 deliverable) before launch.

## Approach *(mandatory)*

### Chosen approach: `@react-pdf/renderer` rendered server-side

- Build a React component tree that *describes* the PDF (using the library's `<Page>`, `<View>`, `<Text>`, `<Image>`, `<Svg>` primitives — not the DOM).
- Render the component server-side in a Next.js API route (`/api/results/[resultId]/pdf`) and stream the resulting buffer.
- The radar chart is rendered as inline SVG (Chart.js / react-chartjs-2 produces SVG; or we build a small custom SVG radar — TBD as part of implementation).
- Data is fetched server-side from Supabase using the service-role client (same pattern as `src/lib/supabase/service.ts` already used by the Keap sync writeback).

### Alternatives considered (and rejected)

| Approach | Why rejected |
|---|---|
| `html2pdf.js` / `jsPDF + html2canvas` | Output is essentially a screenshot of the rendered page. Text isn't selectable, chart can blur, page-break control is fiddly. Fails the "professional report" bar. |
| Puppeteer + `@sparticuz/chromium` on Vercel | Heavy bundle (~50MB), slow cold starts (3–5s). Would also require building a separate server-rendered print-friendly route since the current results page is sessionStorage-only. More moving parts for marginal fidelity gain. |
| Hosted HTML → PDF service (PDFShift, DocRaptor, Browserless) | Ongoing cost ($30–100/mo at low volume), external dependency, latency. Not justified at MVP scale. |

## Dependencies

- ✅ **spec 003** (Results page) — must exist and the user must reach it.
- ✅ **D-3 (Keap push)** — proves the Supabase persistence path is reliable. PDF data source is the same `assessment_sessions` table.
- ✅ **`src/lib/supabase/service.ts`** — service-role client already exists from the Keap sync writeback.
- 🆕 **New dependency**: `@react-pdf/renderer` package. Pure-JS, ~600KB gzipped. No native deps.
- 🆕 **Supabase migration**: extend the `event_type` CHECK constraint on `assessment_events` to include `'pdf_downloaded'`.

## Open Questions

| ID | Question | Default if undecided |
|---|---|---|
| Q-01 | Should the PDF be downloadable from a shared `/results/[id]` link by someone who didn't take the assessment (i.e. is a real resultId enough auth)? | Yes — the resultId is an unguessable UUID v4. Same access model as the shareable results URL. |
| Q-02 | A4 only, or both A4 and US Letter? | A4 only for v1. Letter is post-launch (no US cohort yet). |
| Q-03 | Light or dark theme for the PDF? | **Light** — better for printing on paper, less ink consumption, easier on most screen viewers. The on-screen results are dark; the PDF deliberately diverges as a printable artefact. |
| Q-04 | Should the PDF include the user's email address? | No — only first name. Email is internal data. |
| Q-05 | Does the PDF need a localised date format (e.g., "25 May 2026" vs "May 25, 2026")? | UK/EU format ("25 May 2026") for now. |
| Q-06 | Should we add a static "About the Worship Wheel" preamble page explaining the 8 elements for first-time readers? | Defer to Charl's design review (C-3). Easy to add if he wants it. |

## Assumptions

- Brand assets (logo SVG, brand colours, Montserrat font files) are available in `src/tokens/` and `public/` and can be embedded directly in the PDF.
- The `@react-pdf/renderer` package will not require any Vercel-specific config beyond installing the dependency.
- A single A4 page can fit the cover content; the report is expected to span ~3–5 pages depending on archetype message length.
- The admin Outcomes view (spec 005, US4) already supports surfacing arbitrary event counts; if not, adding `pdf_downloaded` to its existing event aggregation is trivial.

## Out of Scope (for this spec)

- Email delivery of the PDF (e.g. "email me my report"). Keap automation can attach the PDF link in follow-up emails, but the asset itself is downloaded by the user from the web.
- Branded design polish beyond first-pass — Charl's C-3 review may iterate on layout / colours after launch.
- PDF localisation (multi-language). English only for v1.
- Watermarking or DRM. None required.
