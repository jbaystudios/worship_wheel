# Worship Wheel — Top-Level Specification

**Status**: Active development
**Last updated**: 2026-04-14

This is the entry-point specification for the Worship Wheel project. It summarises the product, scoring model, stack, and key requirements, then points to the canonical detailed specs.

## Product Summary

The **Worship Wheel Assessment Tool** is an interactive, web-based self-diagnosis quiz for worship guitarists. A user answers 24 scenario-based questions (3 per element across the 8 dimensions; originally specced at 16, expanded in spec 002), receives a radar-chart visualisation of their skills across 8 musical dimensions, and is captured as a lead in Keap for automated, tailored follow-up.

**Primary business goal**: Lead generation for Worship Guitar Skills (WGS), funnelled into the correct WGS offering based on overall score band.

**Target user**: Worship guitarists (hobbyist to semi-pro) arriving from social, email, YouTube, or direct link.

## The 8 Elements

Scores are 1–10 per element; overall score is the sum (8–80, also shown as %).

| Code | Element |
|---|---|
| FB | Foundation & Basics |
| HM | Harmony / Music Theory |
| ML | Melody & Lead |
| RH | Rhythm |
| TO | Tone |
| TH | Technique |
| TE | Technology / Gear |
| AU | Aural / Ear |

## Core User Flow

1. **Landing page** — value proposition + start CTA.
2. **Assessment** — 24 questions shown one at a time with progress bar; each question maps to one or more elements.
3. **Email gate** — name + email required before seeing results.
4. **Results page** — animated radar chart, numerical scores per element, overall score (out of 80 and %), balance score, highlighted strengths/weaknesses, archetype label, tailored recommendations, CTA based on score band.
5. **Lead capture** — contact created/updated in Keap with tags for score band, weak elements, and completion; automated email sequence delivers summary and follow-up content.
6. **Share** — OG image of user's radar chart for social sharing.

## Scoring Algorithm

- **Per-element score**: Average of that element's scenario answers, normalised 1–10.
- **Overall score**: Sum of all 8 element scores (range 8–80), also displayed as a percentage.
- **Balance score**: `Balance = 10 - (SD / 3.18 × 9)`, clamped 1–10, where a perfectly even wheel = 10.
- **Priority growth areas**: Top 2–3 weakest elements, highlighted on results.
- **Strengths**: Top 2–3 strongest elements, highlighted on results.

### Score Bands → Recommendations / CTAs

| Overall | Band | CTA |
|---|---|---|
| <30 | Beginner | Free Worship Wheel Training Video |
| 30–50 | Developing | 90-Day Challenge |
| 50–65 | Functional | WGS Academy membership |
| >65 | Fluent/Flow | Advanced workshops / masterclass |

### Per-Element Score Bands (for recommendations copy)

1–2 Beginner · 3–4 Developing · 5–6 Functional · 7–8 Fluent · 9–10 Flow

### Archetypes

Determined from the shape of the profile (e.g. *The Rhythm Player*, *The Theory Head*, *The Campfire Strummer*, *The Balanced Beginner*, *The Uneven Intermediate*). See `specs/001-worship-wheel-assessment/spec.md` for the full matrix.

## Technology Stack

- **Runtime**: TypeScript 5.x, Node.js 20+
- **Framework**: Next.js 14 (App Router) on Vercel
- **Database**: Supabase (PostgreSQL) — `assessment_sessions`, `aggregate_stats`
- **Charting**: Chart.js 4.4 + react-chartjs-2 5.2; chartjs-node-canvas for server-side fallback
- **OG Images**: @vercel/og (Satori) with SVG radar chart
- **Styling**: Tailwind CSS 3.4
- **Validation**: Zod
- **CRM**: Keap/Infusionsoft REST API v1 (Service Account Key auth)
- **Analytics**: GA4 via GTM, consent-gated by CookieBot
- **Testing**: Vitest (unit), Playwright (e2e)
- **Config data**: Static JSON in `src/data/` (questions, recommendations, elements) — version-controlled, not stored in the database.

## Key Non-Functional Requirements

- **Performance**: Landing and results pages pass Core Web Vitals on mobile 4G.
- **Accessibility**: WCAG 2.1 AA. Keyboard navigable, 4.5:1 contrast, respects `prefers-reduced-motion`.
- **Privacy**: GDPR/POPIA compliant. CookieBot-gated analytics. Double opt-in for CRM where required.
- **Resilience**: If Keap is down, capture lead in Supabase and retry. Scoring/results must work even if chart rendering fails (text fallback).
- **Responsive**: 375px, 768px, 1024px, 1440px breakpoints tested.

## Persistence & Resume

- Mid-assessment answers persist across back-navigation.
- Results are viewable on a tokenised results URL after submission (see 003).
- Anonymous aggregate stats recorded for benchmarking (no PII in aggregates).

## Detailed Specifications

| # | Spec | Path |
|---|---|---|
| 001 | Worship Wheel Assessment (MVP) | `specs/001-worship-wheel-assessment/spec.md` |
| 002 | Assessment Scoring Optimisation | `specs/002-assessment-scoring-optimization/spec.md` |
| 003 | Results Page | `specs/003-results-page/spec.md` |

### Supporting Artefacts

- Implementation plan: `specs/001-worship-wheel-assessment/plan.md`
- Data model: `specs/001-worship-wheel-assessment/data-model.md`
- API contracts: `specs/001-worship-wheel-assessment/contracts/api.md`
- Research notes: `specs/001-worship-wheel-assessment/research.md`
- Quickstart: `specs/001-worship-wheel-assessment/quickstart.md`
- Tasks: `specs/001-worship-wheel-assessment/tasks.md`
- Client PRD: `plan/PRD - Worship Wheel Assessment Tool.md`
- Source documents (client concept, questions, workbook): `docs/`

## Status

- **001**: Spec clarified, planning complete, tasks generated. Implementation in progress.
- **002**: Scoring optimisation in flight — `answers` JSONB expanded for checklist responses, no new dependencies.
- **003**: Results page spec drafted; client-side sessionStorage only within scope.
- **Client PRD**: Complete; pending Charl's review.

For working context, conventions, Figma MCP setup, and the mandatory UI/UX workflow, see `CLAUDE.md`.
