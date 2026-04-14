# Research: Worship Wheel Assessment Tool

**Feature Branch**: `001-worship-wheel-assessment`
**Date**: 2026-03-06

## 1. Radar Chart Library

**Decision**: Chart.js with react-chartjs-2

**Rationale**: Chart.js offers the best combination of built-in radar chart support, excellent draw-in animations, high customizability (dark theme + gold accents via config), and — critically — server-side image generation via `chartjs-node-canvas` for the OG image endpoint. While Nivo's `@nivo/radar` is also strong, Chart.js's server-side rendering story is more mature and doesn't require SVG-to-PNG conversion.

**Alternatives considered**:
- **Recharts**: Large bundle (~50KB), poor server-side image generation, radar chart less polished. Rejected.
- **D3.js (custom)**: Maximum flexibility and smallest bundle, but highest development effort for a chart type that Chart.js handles natively. Deferred as Phase 2 option if Chart.js proves insufficient.
- **Nivo (@nivo/radar)**: Excellent radar chart with react-spring animations. Strong contender, but `chartjs-node-canvas` is more battle-tested for server-side rendering than Nivo's `renderToString` + conversion pipeline.
- **Visx**: Smallest bundle but no built-in animations, no radar primitive, no server-side story. Rejected.

**Key integration notes**:
- Must use `'use client'` directive + `next/dynamic` with `ssr: false` (Canvas-based, requires `window`)
- Bundle size: ~25-30KB gzipped with tree-shaking (register only radar chart type)
- Server-side: `chartjs-node-canvas` in the `/api/og/[resultId]` route for OG image generation

## 2. OG Image Generation (Social Sharing)

**Decision**: `@vercel/og` (Satori) with hand-drawn SVG radar chart for the OG image, with `chartjs-node-canvas` as a fallback approach

**Rationale**: `@vercel/og` is Vercel's native solution — edge-deployed, fast (50-200ms), zero infrastructure overhead, and free with Vercel. The radar chart geometry is simple enough to draw as raw SVG (polygon vertices calculated with trigonometry). This avoids the complexity and cost of Puppeteer or node-canvas in serverless.

**Alternatives considered**:
- **Puppeteer/Playwright**: Full browser rendering but terrible cold-start (3-10s), exceeds Vercel's 50MB bundle limit, high cost. Rejected.
- **node-canvas / @napi-rs/canvas**: Works but requires native binary compilation for Lambda. More complex deployment than Satori. Viable fallback.
- **chartjs-node-canvas**: Can render Chart.js server-side but adds native dependency overhead. Viable fallback if Satori's SVG approach proves visually insufficient.

**Implementation approach**:
- OG route at `/api/og/[resultId]` uses `ImageResponse` from `next/og`
- Radar chart drawn as SVG `<polygon>` inside JSX (8 vertices computed from scores)
- WGS branding (dark background, gold accents, Montserrat font loaded as ArrayBuffer)
- Image cached at edge (immutable per resultId)
- Output: 1200x630px PNG

## 3. Keap/Infusionsoft REST API Integration

**Decision**: Use Keap REST API v1 with Service Account Key (SAK) authentication and the `PUT /contacts` upsert endpoint

**Rationale**:
- **SAK authentication** avoids the OAuth2 dance and token refresh complexity. Since this is a single-account server-to-server integration (WGS owns the Keap account), SAK is the simplest and most reliable approach.
- **v1 `PUT /contacts`** with `duplicate_option=Email` provides true upsert behaviour in a single API call. The v2 API lacks this feature, requiring a search-then-create/update two-step flow.

**Alternatives considered**:
- **OAuth2**: Necessary for multi-tenant apps but overkill for a single-account integration. Would require token refresh handling.
- **Personal Access Token (PAT)**: Works but tied to a specific user's permissions. SAK has admin-level access.
- **v2 API**: More modern but lacks the upsert `duplicate_option` feature. Would require two API calls per submission.

**Key integration details**:
- **Authentication**: `Authorization: Bearer <service_account_key>` header
- **Contact upsert**: `PUT /v1/contacts?duplicate_option=Email` — creates if new, updates if existing
- **Custom fields**: Must be created in Keap UI first (Whole Number for scores, Text for archetype, URL for results link). Field IDs stored in env config.
- **Tagging**: `POST /v1/contacts/{contactId}/tags` with `{"tagIds": [123, 456]}`. Tags must be pre-created in Keap (can also be created via `POST /v1/tags` API).
- **Automation triggers**: Tag-based — Keap automation builder triggers on "Tag is Applied" events. Apply the "WW: Completed" tag to fire the email sequence.
- **Rate limits**: 25 requests per second for REST API. Well within our needs (1 submission = ~3 API calls: upsert + tag + custom fields).
- **Retry strategy**: Failed syncs stored in Supabase (`keap_sync_status: 'failed'`), retried via Vercel Cron with exponential backoff (1min, 5min, 30min), max 3 retries.

## 4. CookieBot + GTM Integration

**Decision**: CookieBot manages consent categories; GTM fires tags conditionally based on CookieBot consent signals

**Rationale**: CookieBot is already selected by the client. It integrates natively with GTM via consent mode signals — GTM can be configured to only fire GA4 tags when the "statistics" consent category is granted.

**Implementation approach**:
- CookieBot script loads in `<head>` (necessary cookie — loads before consent)
- GTM container loads with consent mode defaults (denied until CookieBot grants)
- GA4 tags in GTM configured to require "statistics" consent
- Marketing tags (if any future) require "marketing" consent
- CookieBot auto-scans cookies and generates the consent banner

## 5. Supabase Schema & Access Patterns

**Decision**: Two tables (`assessment_sessions`, `aggregate_stats`) with Row-Level Security. Static config data (questions, recommendations, elements) stored as JSON files in the codebase.

**Rationale**: Questions and recommendations change infrequently and benefit from version control. Assessment sessions are user-generated and need persistence + querying. Aggregate stats support the FR-037 content strategy requirement without exposing individual data.

**Key patterns**:
- **Insert**: Server-side only (via `SUPABASE_SERVICE_ROLE_KEY`) when assessment is submitted
- **Read by ID**: Public (anon key) for results page — RLS allows SELECT by `id` only
- **Keap retry**: Server-side query for `keap_sync_status != 'synced'` via service role
- **Aggregation**: Database function or trigger updates `aggregate_stats` on insert

## 6. Next.js App Router Patterns

**Decision**: App Router with Server Components for results pages (SSR for OG meta tags), Client Components for the interactive assessment flow

**Rationale**: The results page must be server-rendered so that social media crawlers see correct OG meta tags when scraping the URL. The assessment quiz is entirely client-side (single-page progressive flow with no reloads).

**Key patterns**:
- Landing page: Server Component (static, fast)
- Assessment flow: Client Component (`'use client'`) with local state for answers
- Email gate: Client Component with form submission to `/api/submit`
- Results page (`/results/[resultId]`): Server Component that fetches from Supabase and renders. Radar chart embedded as a Client Component island.
- API routes: Route Handlers for `/api/submit`, `/api/og/[resultId]`, `/api/keap-retry`
