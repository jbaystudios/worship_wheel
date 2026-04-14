# Implementation Plan: Worship Wheel Assessment Tool

**Branch**: `001-worship-wheel-assessment` | **Date**: 2026-03-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-worship-wheel-assessment/spec.md`

## Summary

Build an interactive, web-based self-diagnosis quiz for worship guitarists that scores 8 musical dimensions via 16 scenario-based questions, visualises results as an animated radar chart (the "Worship Wheel"), captures leads via an email gate integrated with Keap/Infusionsoft, and provides personalised recommendations with CTAs to WGS offerings. The tool is a Next.js App Router application deployed to Vercel with Supabase for data persistence, Chart.js for the radar chart, `@vercel/og` for social sharing images, CookieBot for consent, and GTM/GA4 for funnel analytics.

Design work happens in Figma first (using existing WGS brand tokens), followed by code implementation.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 20+
**Framework**: Next.js 14+ (App Router)
**Primary Dependencies**: react-chartjs-2 + chart.js (radar chart), @supabase/supabase-js (database), @vercel/og (OG images), zod (validation)
**Storage**: Supabase (PostgreSQL) for assessment sessions + aggregates; JSON config files for questions, recommendations, elements
**Testing**: Vitest (unit), Playwright (E2E)
**Target Platform**: Web (mobile-first, responsive 375px-1440px+)
**Project Type**: Web application (single Next.js project, no separate backend)
**Hosting**: Vercel (serverless + edge)
**Domain**: worshipwheel.worshipguitarskills.com (subdomain CNAME to Vercel)
**Performance Goals**: Results page loads < 3s on mobile; OG image generation < 200ms at edge
**Constraints**: Server-side scoring only; no PII in analytics events; CookieBot consent before GA4
**Scale/Scope**: ~5 pages/views, ~20 components, anticipated 100-1000 assessments/month initially

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Figma as Single Source of Truth | PASS | FR-041 mandates Figma design before code. All brand tokens from Brand Guide file. |
| II. Token-Driven Design | PASS | Implementation will extract design tokens from Figma variables into Tailwind config. No hard-coded colour/spacing values. |
| III. Professional-Grade Structure | PASS | Figma pages for assessment screens will follow naming conventions. Code structure follows Next.js App Router conventions. |
| IV. Spec-Driven Workflow | PASS | Full speckit workflow followed: specify → clarify → plan → tasks → implement. |
| V. Brand Coherence Above All | PASS | Dark theme, gold accents, Montserrat — consistent with existing WGS brand. Assessment design must be reviewed against brand identity before implementation. |
| Design Tooling (Figma MCP) | PASS | Figma Console MCP will be used for design work. Screenshots captured after each modification. |
| Design Tooling (UI/UX Pro Max) | PASS | UI/UX Pro Max skill must be consulted before visual design work begins. |
| Quality Standards | PASS | No orphaned styles, no unnamed layers, no magic values in Figma deliverables. |

**Post-Phase 1 Re-check**: All gates remain PASS. The data model and API contracts do not introduce any constitution violations. Design tokens will be derived from existing Figma variables (Color Primitives, Theme, Sizes, Typography collections).

## Project Structure

### Documentation (this feature)

```text
specs/001-worship-wheel-assessment/
├── plan.md              # This file
├── research.md          # Phase 0: Technology decisions
├── data-model.md        # Phase 1: Database schema + config data shapes
├── quickstart.md        # Phase 1: Developer setup guide
├── contracts/
│   └── api.md           # Phase 1: API endpoint contracts
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
worship-wheel/
├── src/
│   ├── app/
│   │   ├── layout.tsx                    # Root layout (GTM, CookieBot, Montserrat)
│   │   ├── page.tsx                      # Landing page (Server Component)
│   │   ├── assessment/
│   │   │   └── page.tsx                  # Quiz flow (Client Component)
│   │   ├── results/
│   │   │   └── [resultId]/
│   │   │       └── page.tsx              # Results page (SSR for OG tags)
│   │   └── api/
│   │       ├── submit/
│   │       │   └── route.ts              # POST: score + persist + Keap sync
│   │       ├── og/
│   │       │   └── [resultId]/
│   │       │       └── route.ts          # GET: dynamic OG image
│   │       └── keap-retry/
│   │           └── route.ts              # Cron: retry failed Keap syncs
│   ├── components/
│   │   ├── landing/                      # Hero, value prop, CTA
│   │   ├── assessment/                   # QuestionCard, ProgressBar, EmailGate
│   │   ├── results/                      # RadarChart, ScoreSummary, Recommendations
│   │   └── shared/                       # CookieConsent, GTMProvider
│   ├── lib/
│   │   ├── supabase/                     # Client + server Supabase clients
│   │   ├── keap/                         # Keap API client + sync logic
│   │   ├── scoring/                      # Calculator, archetype, bands
│   │   ├── analytics/                    # DataLayer push helpers
│   │   └── validation/                   # Zod schemas
│   ├── data/
│   │   ├── questions.json                # 16 MVP questions
│   │   ├── elements.json                 # 8 elements reference
│   │   └── recommendations.json          # Recommendations + archetypes + CTAs
│   └── types/
│       └── index.ts                      # Shared TypeScript types
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql        # DB schema
├── public/
│   └── fonts/                            # Montserrat font files
├── __tests__/
│   ├── unit/
│   │   ├── scoring.test.ts               # Score calculation tests
│   │   ├── archetype.test.ts             # Archetype determination tests
│   │   └── validation.test.ts            # Input validation tests
│   └── e2e/
│       ├── assessment-flow.spec.ts       # Full quiz flow
│       └── results-page.spec.ts          # Results rendering
├── .env.local
├── next.config.ts
├── tailwind.config.ts
├── vercel.json
└── package.json
```

**Structure Decision**: Single Next.js project (no separate backend). Next.js Route Handlers serve as the API layer, Supabase handles persistence, and Vercel handles hosting + serverless execution. This is the simplest viable architecture for an MVP lead-gen tool.

## Implementation Phases

### Phase A: Figma Design (Must complete before code)

Design all screens in Figma using existing WGS Brand Guide tokens. Constitution requires this.

1. **Landing Page** — Hero section, value proposition, "Start Assessment" CTA, element overview
2. **Assessment Flow** — Question card layout, answer options, progress bar, element label transitions
3. **Email Gate** — Form design (name, email, consent checkbox, honeypot hidden), CTA button
4. **Results Page** — Radar chart placement, score summary, element breakdown, strengths/weaknesses highlights
5. **Recommendations Section** — Archetype card, weak area cards, CTA banner
6. **Social Share** — Share button placement, preview of shareable image layout
7. **Mobile Variants** — All above at 375px breakpoint
8. **OG Image Template** — 1200x630px branded layout for social sharing

Deliverables: Figma pages with all screens, using bound variables from Color Primitives, Theme, Sizes, and Typography collections.

### Phase B: Project Setup & Infrastructure

1. Initialize Next.js project with TypeScript, Tailwind, App Router
2. Configure Tailwind with WGS design tokens extracted from Figma
3. Set up Supabase project, run initial migration
4. Configure environment variables (Supabase, Keap, GTM, CookieBot)
5. Set up Vercel project and link custom subdomain
6. Install dependencies (chart.js, react-chartjs-2, @supabase/supabase-js, zod, @vercel/og)

### Phase C: Core Assessment Flow (P1)

1. Build landing page (Server Component)
2. Build question card component with answer selection
3. Build progress bar component
4. Implement quiz flow state management (client-side, 16 questions in order)
5. Build back-navigation (preserve previous answers)
6. Build email gate form (name, email, consent checkbox, honeypot)
7. Implement client-side form validation (email format)

### Phase D: Scoring & Results (P1)

1. Implement server-side scoring calculator (element averages, overall sum, balance SD formula)
2. Implement archetype determination (pattern-matching + balance fallback)
3. Build `/api/submit` route (validate, score, persist to Supabase, return results)
4. Build radar chart component (Chart.js, animated, dark theme + gold accents)
5. Build results page (SSR for OG meta tags, fetch from Supabase by resultId)
6. Build score summary display (overall, percentage, balance, element breakdown)
7. Build strengths/weaknesses highlight (colour differentiation)
8. Write unit tests for scoring calculator and archetype logic

### Phase E: Recommendations & CTAs (P2)

1. Build score band mapping (1-2: Beginner through 9-10: Flow)
2. Build recommendation list component (top 2-3 weakest areas)
3. Build archetype card component
4. Build CTA banner component (score-band-based link)
5. Load recommendations from JSON config (placeholder content)
6. Edge case: all scores equal (no weakest element, encourage overall growth)

### Phase F: Keap Integration (P2)

1. Build Keap API client (SAK auth, contact upsert via v1 PUT, tagging)
2. Implement contact sync in `/api/submit` (non-blocking, failures logged)
3. Set up custom fields in Keap (scores, archetype, results URL)
4. Pre-create tags in Keap (completed, score bands, weak elements)
5. Build `/api/keap-retry` cron endpoint (retry failed syncs)
6. Configure Vercel Cron for retry schedule

### Phase G: Analytics & Privacy (P2)

1. Integrate CookieBot (script in layout, consent categories)
2. Integrate GTM (consent mode, conditional GA4 firing)
3. Implement DataLayer event pushes (all 12 events from FR-038A)
4. Implement UTM parameter capture and session persistence
5. Implement `assessment_abandoned` event (beforeunload/visibilitychange)
6. Implement rate limiting on `/api/submit` (5 per IP per hour)
7. Verify no PII in DataLayer events

### Phase H: Social Sharing & Polish (P3)

1. Build `/api/og/[resultId]` route (@vercel/og, SVG radar chart)
2. Add OG meta tags to results page (title, description, image URL)
3. Build share button component (copy link, native share API)
4. Mobile responsiveness pass (375px, 768px, 1024px, 1440px)
5. Performance audit (Lighthouse, Core Web Vitals)
6. Accessibility pass (keyboard navigation, screen reader, contrast ratios)

### Phase I: Testing & Launch

1. E2E test: full assessment flow (start → answers → email → results)
2. E2E test: results page loads from unique URL
3. Test Keap integration with real sandbox/test account
4. Test CookieBot consent flow (GA4 only fires after consent)
5. Test on real mobile devices
6. Deploy to production, configure DNS
7. Smoke test on live domain

## Key Technical Decisions

| Decision | Choice | Rationale | See |
|----------|--------|-----------|-----|
| Radar chart | Chart.js + react-chartjs-2 | Best animation, customization, and server-side image support | research.md #1 |
| OG images | @vercel/og (Satori) | Native Vercel, edge-deployed, fast, no infrastructure | research.md #2 |
| Keap auth | Service Account Key | Single-account integration, no token refresh needed | research.md #3 |
| Keap upsert | v1 PUT /contacts | Atomic upsert by email, simpler than v2 two-step | research.md #3 |
| Keap automation | Tag-based trigger | Apply "WW: Completed" tag, Keap automation fires on tag | research.md #3 |
| Config data | JSON files in codebase | Version-controlled, no DB dependency for quiz flow | data-model.md |
| Session data | Supabase PostgreSQL | Persisted results with unique URLs, aggregate analytics | data-model.md |
| Consent | CookieBot + GTM consent mode | Client's existing choice, native GTM integration | research.md #4 |
| Spam protection | Honeypot + rate limiting | No third-party CAPTCHA, zero user friction | spec.md FR-038J-L |

## Risk Register

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Keap API downtime blocks lead capture | High | Low | Non-blocking sync + retry queue. Results always shown. |
| Chart.js radar chart doesn't match Figma design | Medium | Medium | Design radar chart in Figma first, validate Chart.js can replicate. D3 fallback if needed. |
| CookieBot blocks GA4, losing funnel data | Medium | Medium | GA4 consent mode sends cookieless pings even without consent. Some data preserved. |
| Placeholder content at launch reduces conversion | Medium | High | Track placeholder register. Prioritize top-of-funnel content (archetypes, CTAs) for early replacement. |
| Supabase free tier limits reached | Low | Low | Free tier: 500MB DB, 2GB bandwidth. Well within MVP scale. Upgrade path clear. |
| Keap custom field IDs change | Low | Low | All IDs in environment variables. No hard-coded values. |
