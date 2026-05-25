# Research: Results PDF Download

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md) · **Date**: 2026-05-25

Resolves the unknowns and design questions called out in `plan.md` Phase 0. Each section follows: **Decision** → **Rationale** → **Alternatives considered**.

---

## R1. `@react-pdf/renderer` server-side rendering on Vercel

**Decision**: Render PDFs in a Next.js Route Handler running on the **Node.js runtime** (not Edge). Use `renderToStream(<Document/>)` and stream the result to the client.

**Rationale**:
- `@react-pdf/renderer` v3+ ships a `renderToStream` API specifically for streaming server responses, avoiding holding the entire PDF buffer in memory.
- The library depends on Node-only APIs (`Buffer`, `stream`, font loading from disk/URL). It does not run on Vercel Edge.
- Streaming the response avoids the 4.5MB Vercel response-body limit issue (streams are exempt) — though a typical assessment PDF will be well under 1 MB.
- Vercel default Function runtime is Node 20, which matches our local dev (`Node.js 20+` per `package.json`).

**Alternatives considered**:
- **Buffer-then-respond** (`renderToBuffer` → return `new Response(buffer)`): simpler but holds the full PDF in memory; not a concern at our scale but the streaming pattern is the documented best practice for HTTP responses.
- **Edge runtime**: rejected — library is Node-only.

---

## R2. Font registration & cold-start cost

**Decision**: Register Montserrat from local font files copied into the route bundle. Use `Font.register({ family: 'Montserrat', fonts: [{ src: ..., fontWeight: 'normal' }, ...] })` at module scope (top of `styles.ts`) so registration happens once per cold start.

**Rationale**:
- `Font.register` accepts a file path or a URL. Local paths avoid an extra network round-trip on every cold start.
- The project already loads Montserrat in the web app via Next/Font — we can copy the same `.woff2` or `.ttf` files into a known location (e.g. `public/fonts/montserrat/`) and reference them from the route.
- Module-scope registration means the font is registered exactly once per Vercel Function instance — subsequent warm invocations skip it.
- `@react-pdf/renderer` requires TTF or WOFF (not WOFF2 historically — verify in implementation; if WOFF2 fails, fall back to TTF).

**Alternatives considered**:
- **CDN URL**: simpler config but adds ~100–300 ms cold-start latency per cold instance. Not worth it given local files are available.
- **Default system font (Helvetica)**: lazy but breaks brand coherence. Rejected.

**Implementation note**: if WOFF2 isn't supported in the library version we install, source TTF versions of Montserrat 400 / 500 / 700 from Google Fonts and commit them under `public/fonts/montserrat/`.

---

## R3. SVG radar chart in `@react-pdf/renderer`

**Decision**: Hand-roll the radar as a pure `<Svg>` component using `@react-pdf/renderer`'s SVG primitives (`<Svg>`, `<Polygon>`, `<Line>`, `<Circle>`, `<Text>`). Do **not** depend on Chart.js or `react-chartjs-2` in the PDF path.

**Rationale**:
- `@react-pdf/renderer` ships its own SVG primitives that produce true vector output in the PDF — no rasterisation, infinitely sharp at any zoom.
- The radar shape is geometrically trivial: 8 evenly-spaced axes at 45° intervals → 8 points calculated from `(cx + r * cos(θ), cy + r * sin(θ))` where `r` = `score / 10 * maxRadius`.
- Chart.js is DOM-bound (uses `<canvas>`) and cannot render to a PDF-compatible SVG without a headless browser. Avoiding it removes a heavy server-side dependency.
- Hand-rolled SVG also gives us total layout control — exact axis labels, grid styling, brand colour fill.

**Alternatives considered**:
- **`chartjs-node-canvas` → PNG embed**: gives raster output (blurs at zoom), and `chartjs-node-canvas` requires `node-canvas` which has native deps and Vercel bundle complications. Rejected.
- **`recharts` → server render**: same DOM-bound issue as Chart.js. Rejected.
- **Pre-render radar to SVG string in `/api/submit` and store**: over-engineering for the scale; PDF render time is dominated by font loading, not chart math.

**Math sketch** (for implementation):
```ts
const N = 8;
const cx = 200, cy = 200, R = 150;
const points = scores.map((s, i) => {
  const θ = -Math.PI / 2 + (i * 2 * Math.PI) / N;  // start at top, clockwise
  const r = (s / 10) * R;
  return [cx + r * Math.cos(θ), cy + r * Math.sin(θ)];
});
// Render <Polygon points={points.map(p => p.join(',')).join(' ')} ... />
```

---

## R4. Page-break control

**Decision**: Use `<Page>` boundaries to enforce hard breaks between major sections (cover → scores → archetype). Within a page, use `<View wrap={false}>` on indivisible units (each stat card, each element-breakdown row, the radar chart container) to prevent mid-element splits.

**Rationale**:
- `@react-pdf/renderer` auto-paginates text content within a `<Page>`. Setting `wrap={false}` on a `<View>` tells the renderer to push the entire view to the next page if it doesn't fit on the current one.
- This satisfies FR-014 ("Section breaks MUST fall between sections, never mid-chart, mid-stat-card, or mid-paragraph") with zero hand-pagination.
- Explicit `<Page>` per major section also makes the document structure self-documenting and easy to reorder.

**Alternatives considered**:
- **Manual height calculations + explicit breaks**: brittle, fights the library. Rejected.
- **Single long `<Page>` with auto-pagination**: lets text split awkwardly across page boundaries (acceptable for paragraphs but not for charts/cards). Mixed strategy above is better.

---

## R5. Vercel function size & timeout

**Decision**: Stay within Vercel's default function size and timeout. Expected bundle increase ~3–5 MB (the library + fonts). Default Vercel Function timeout (300s on all plans per the 2026 platform update) is far more than the <3s p95 we're targeting.

**Rationale**:
- `@react-pdf/renderer` weighs ~600 KB gzipped + dependencies; Vercel function size limits (50 MB compressed / 250 MB uncompressed on default Fluid Compute) are comfortably above us.
- Montserrat TTF files at 4 weights ≈ 800 KB total. No issue.
- Fluid Compute (default since 2025) reuses function instances across concurrent requests, so font registration cost amortises after the first cold start.
- No need to bump `maxDuration` in `route.ts` config.

**Alternatives considered**:
- **Splitting PDF generation to a dedicated edge worker**: unnecessary at v1 scale.
- **Pre-warming via cron**: premature optimisation.

---

## R6. Migrating `event_type` CHECK constraint

**Decision**: New migration `supabase/migrations/<ts>_pdf_downloaded_event.sql` drops the existing `assessment_events_event_type_check` constraint and recreates it with `'pdf_downloaded'` added.

**Rationale**:
- Postgres CHECK constraints can be altered by drop-and-recreate. There is no in-place `ALTER` for the set of allowed values.
- Dropping a CHECK is non-blocking (no full-table rewrite). Recreating it triggers a `NOT VALID` → `VALIDATE` two-step is *not* needed for our scale (table is small in pre-launch state) — a direct recreate with `CHECK (... IN (...))` will scan the table once but completes in milliseconds at our row count.
- The new event type is purely additive — no existing rows become invalid.

**Migration sketch**:
```sql
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

**Alternatives considered**:
- **Two-step `NOT VALID` + `VALIDATE`**: needed for huge tables to avoid long locks; overkill here.
- **Replace CHECK with a separate `event_types` lookup table**: cleaner schema long-term but out of scope for a single-value addition.

---

## R7. UUID v4 validation

**Decision**: Use a strict UUID v4 regex applied to the `resultId` route param before any DB query:

```ts
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
```

**Rationale**:
- `crypto.randomUUID()` (what `/api/submit` uses to mint resultIds) produces v4 UUIDs. Validating to v4 specifically rejects garbage / probing without a DB round-trip.
- The lowercase character class `[0-9a-f]` plus the `i` flag accepts both cases. The `4` after the third hyphen and the `[89ab]` after the fourth are the v4 markers.
- Done before the Supabase query, this also serves as the first rate-limit defence (cheap reject).

**Alternatives considered**:
- **`zod.string().uuid()`**: works, but pulls Zod into a route that doesn't otherwise need it. Regex is sufficient.
- **No validation, rely on Supabase to return 0 rows**: leaks a DB round-trip per probe. Rejected.

---

## R8. Mobile Safari download UX

**Decision**: Accept platform default behaviour — iOS opens PDFs inline rather than offering a "Save" dialog; users tap the share icon → "Save to Files." No workaround in v1.

**Rationale**:
- Setting `Content-Disposition: attachment` does cause iOS to open inline (iOS overrides the header for PDFs since Safari handles them natively).
- Trying to force download via blob URL + `<a download>` works on desktop but iOS still routes through Quick Look.
- This is well-understood mobile platform behaviour, not a bug. iOS users still get the PDF — just one extra tap to save.
- Documented in spec edge cases. Adding "Tap share → Save to Files on iOS" as inline help text is acceptable copy if we want to be friendly, but not required for v1.

**Alternatives considered**:
- **`Content-Type: application/octet-stream`**: tricks iOS into download but breaks Preview / Adobe MIME-type detection on desktop. Rejected.
- **Native iOS app**: ha. Out of scope.

---

## Open questions deferred from the spec

Per `spec.md` § *Open Questions*. Reproduced here for traceability — defaults assumed unless Charl pushes back at C-3 review.

| ID | Question | Resolution for v1 |
|---|---|---|
| Q-01 | Should anyone with a resultId be able to download the PDF? | Yes — same access model as the shareable results URL. UUID v4 is unguessable enough. |
| Q-02 | A4 only or also US Letter? | **A4 only**. No US cohort in v1. |
| Q-03 | Light or dark theme? | **Light** — better for print/ink and standard document convention. Deliberate divergence from on-screen dark theme. |
| Q-04 | Include email in PDF? | **No** — only first name. |
| Q-05 | Date format? | **"25 May 2026"** (UK/EU). |
| Q-06 | Add "About the Worship Wheel" preamble page? | **Defer to C-3 review** with Charl. Easy to add later if he wants it. |
