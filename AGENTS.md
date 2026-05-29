# Worship Wheel Assessment Tool

## Project Overview

The **Worship Wheel** is an interactive, web-based self-diagnosis quiz for worship guitarists. Users answer 24 scenario-based questions (3 per element — scenario, checklist, experience — across the 8 dimensions; originally specced at 16), receive a radar-chart visualisation of their skills across 8 musical dimensions, and are captured as leads in Keap for automated follow-up.

- **GitHub**: `git@github.com:jbaystudios/worship_wheel.git`
- **Production domain**: `worshipwheel.worshipguitarskills.com`
- **Tech stack**: Next.js 14 (App Router), Vercel, Supabase (PostgreSQL), Keap REST API v1, Chart.js, @vercel/og, Tailwind CSS, Zod
- **Brand owner**: Charl Coetzee (Worship Guitar Skills)

### Entry-Point Documents

| Document | Path | Purpose |
|---|---|---|
| Top-level spec | `spec.md` | Product overview, scoring, stack, pointers to detailed specs |
| Feature spec (MVP) | `specs/001-worship-wheel-assessment/spec.md` | Full functional specification (41+ requirements) |
| Scoring optimisation | `specs/002-assessment-scoring-optimization/spec.md` | Algorithm refinements, checklist response expansion |
| Results page | `specs/003-results-page/spec.md` | Results UI/UX specification |
| Admin dashboard | `specs/005-admin-dashboard/spec.md` | Stakeholder analytics dashboard (auth, funnel, acquisition, outcomes, leads + CRM ops) |
| Implementation plan | `specs/001-worship-wheel-assessment/plan.md` | 9-phase plan (A: Figma Design → I: Testing & Launch) |
| Data model | `specs/001-worship-wheel-assessment/data-model.md` | Supabase schema, config shapes, question selection |
| API contracts | `specs/001-worship-wheel-assessment/contracts/api.md` | Endpoints, Keap integration, DataLayer events |
| Client PRD | `plan/PRD - Worship Wheel Assessment Tool.md` | Non-technical PRD for client review |
| Source docs | `docs/` | Original concept, questions, and PRD from Charl |

## Repository Layout

```
Worship Wheel/
├── .Codex/            # Slash commands and skills
├── .specify/           # GitHub Spec Kit artefacts (constitution, templates, scripts)
├── specs/              # Feature specs (001, 002, 003)
├── plan/               # PRD and action lists
├── docs/               # Source concept documents from client
├── src/
│   ├── app/            # Next.js App Router: /, /assessment, /results, /api
│   ├── components/
│   ├── data/           # Static JSON: questions, recommendations, elements
│   ├── lib/            # Scoring, Keap client, Supabase client, Zod schemas
│   ├── tokens/         # Design tokens exported from Figma
│   ├── types/
│   └── __tests__/      # Vitest unit tests (scoring, validators)
├── supabase/           # SQL migrations, seed data
├── public/
└── package.json        # Scripts: dev, build, start, lint, test, test:e2e
```

## Spec-Driven Development

This project uses [GitHub Spec Kit](https://github.com/github/spec-kit). Follow the spec-driven workflow:

1. `/speckit.constitution` — Establish project principles
2. `/speckit.specify` — Create the baseline specification
3. `/speckit.plan` — Create an implementation plan
4. `/speckit.tasks` — Generate actionable tasks
5. `/speckit.implement` — Execute the implementation

Optional: `/speckit.clarify`, `/speckit.analyze`, `/speckit.checklist`

Spec Kit artefacts live in `.specify/`. Slash commands live in `.Codex/commands/`. The constitution is at `.specify/memory/constitution.md`.

## Active Technologies

- **Runtime**: TypeScript 5.x, Node.js 20+
- **Framework**: Next.js 14 (App Router), deployed to Vercel
- **Database**: Supabase (PostgreSQL) — `assessment_sessions`, `assessment_events`, `aggregate_stats`
- **Auth**: Supabase Auth (`auth.users`) for the admin dashboard — `@supabase/ssr` cookie-based App Router clients
- **Charting**: Chart.js 4.4 + react-chartjs-2 5.2 (radar chart); chartjs-node-canvas for server-side fallback; admin dashboard uses CSS bars
- **OG Images**: @vercel/og (Satori) with SVG radar chart
- **Styling**: Tailwind CSS 3.4
- **Validation**: Zod
- **CRM**: Keap/Infusionsoft REST API v1 (Service Account Key auth)
- **Analytics**: GA4 via GTM (consent-gated by CookieBot); first-party event tracking via `assessment_events` (admin dashboard)
- **Testing**: Vitest (unit), Playwright (e2e)
- **Config data**: Static JSON in `src/data/` (questions, recommendations, elements) — version-controlled, not in DB

## Development Commands

```bash
npm run dev        # Next.js dev server (localhost:3000)
npm run build      # Production build
npm run start      # Run production build locally
npm run lint       # ESLint (next/core-web-vitals)
npm test           # Vitest unit tests
npm run test:e2e   # Playwright e2e tests
```

## Environment

Copy `.env.local.example` to `.env.local` and populate. Required keys cover Supabase, Keap Service Account Key, GA4/GTM IDs, and the OG image signing secret. Never commit `.env.local`.

## Figma MCP (Design Source of Truth)

Design for this project lives in the **Brand Guide** Figma file, connected via the **Figma Console MCP** (`figma-console`).

- **File name**: Brand Guide
- **File key**: `JzQBHkEnkrtm0XRL3bM7z2`
- **Transport**: WebSocket Bridge (Desktop Bridge plugin)
- **WebSocket port**: 9223

### Connecting to Figma

1. Open Figma Desktop with the "Brand Guide" file
2. Run **Plugins > Development > Figma Desktop Bridge** — verify "MCP ready" with green indicator
3. Call `figma_get_status` — expect `connected via WebSocket Bridge`

If the WebSocket connection fails, try `figma_reconnect`. Fallback: quit Figma and relaunch with CDP:
```
open -a "Figma" --args --remote-debugging-port=9222
```

### Figma Workflow Rules

- Always call `figma_get_status` at the start of a session
- Always call `figma_search_components` before instantiating components (node IDs are session-specific)
- Before creating a page, check if it already exists to avoid duplicates
- After creating or modifying visual elements: screenshot → analyse → iterate → verify
- Place new components inside a Section or Frame, never on blank canvas
- **Variables API**: REST requires `file_variables:read` (Enterprise). Use `figma_execute` with async methods (`getLocalVariableCollectionsAsync`, `getVariableByIdAsync`) to read variables from the plugin sandbox.

## Figma Variable Collections (Mandatory Usage)

All design work in Figma MUST use bound variables — **never hard-coded values**. Collections defined in the Brand Guide file:

| Collection | Type | Modes | Tokens | Usage |
|---|---|---|---|---|
| **Color Primitives** | COLOR | Mode 1 | `accent/*`, `neutral/*`, `success/*`, `warning/*`, `error/*`, `info/*` (50–950), `transparent`, `neutral/0`, `neutral/1000`, `neutral/0-o20`, `neutral/950-o20`, `brand-text`, `brand-text-o20` (73 vars) | Primitive fills/strokes via `setBoundVariableForPaint` |
| **Theme** | COLOR | Light, Dark, Brand | `theme/background`, `theme/text`, `theme/border`, `theme/text-muted`, `theme/background-2`, `button/primary/*`, `button/secondary/*`, `text-link/*` (21 vars) | Semantic colour tokens — bind UI here, not to Primitives |
| **Sizes** | FLOAT | Desktop, Mobile | `space/0`–`space/8`, `site/margin`, `site/gutter`, `section-space/*`, `section-height/full`, `border-width/main`, `radius/*`, `font-size/*` (31 vars) | Spacing, sizing, radii, borders, font sizes — responsive |
| **Typography** | STRING | Mode 1 | `primary-family` (Montserrat), `primary-regular`, `primary-medium`, `primary-bold` (4 vars) | Font family and weight bindings |

### Variable Usage Rules

- **Sizes**: Use `node.setBoundVariable("propertyName", variable)` from the Sizes collection — never numeric values directly. Responsive Desktop/Mobile modes auto-adapt.
- **Theme colours**: Use `figma.variables.setBoundVariableForPaint(paint, "color", variable)` with **Theme** variables for UI (backgrounds, text, borders, buttons, links). Theme variables resolve through Light/Dark/Brand modes.
- **Primitive colours**: Only bind directly when mode-independent (decorative accents). Prefer Theme otherwise.
- **Typography**: Text styles must bind `fontFamily` and `fontStyle` to Typography string variables.
- **New text styles**: Use existing (Text Small, Text Main, Text Large, H6–H1, Display) or create following the same variable-bound pattern. Font sizes MUST bind to `font-size/*`.
- **Exceptions**: If no matching variable exists, document the rationale — never silently hard-code.

### Text Styles (Montserrat, variable-bound)

| Style | Desktop Size | Line Height | Weight |
|---|---|---|---|
| Text Small | 16 | 150% | Regular |
| Text Main | 18 | 150% | Regular |
| Text Large | 20 | 150% | Regular |
| H6 | 18 | 130% | Bold |
| H5 | 24 | 130% | Bold |
| H4 | 32 | 130% | Bold |
| H3 | 48 | 110% | Bold |
| H2 | 64 | 100% | Bold |
| H1 | 80 | 100% | Bold |
| Display | 112 | 100% | Bold |

> Note: duplicate "Text Small" at 12px/AUTO exists — canonical is 16px/150%. Clean up or rename the 12px duplicate when encountered.

## UI/UX Pro Max Skill (Required for All UI/UX Work)

Any task involving UI or UX — designing, building, reviewing, fixing, or improving visual components — **must** use the UI/UX Pro Max skill at `.Codex/skills/ui-ux-pro-max/`.

### Mandatory Workflow

1. **Generate a design system first** (always, before writing any UI code):
   ```bash
   python3 .Codex/skills/ui-ux-pro-max/scripts/search.py "<product_type> <industry> <keywords>" --design-system -p "Worship Wheel"
   ```
2. **Persist the design system** for cross-session consistency:
   ```bash
   python3 .Codex/skills/ui-ux-pro-max/scripts/search.py "<query>" --design-system --persist -p "Worship Wheel"
   ```
3. **Supplement with domain searches** as needed (style, color, typography, ux, chart, landing).
4. **Get stack-specific guidelines**:
   ```bash
   python3 .Codex/skills/ui-ux-pro-max/scripts/search.py "<keyword>" --stack nextjs
   ```
5. **Run the pre-delivery checklist** from the skill's SKILL.md before finalising any UI work.

### Key Rules

- Never start UI/UX implementation without first generating and reviewing a design system
- Use SVG icons (Heroicons, Lucide, Simple Icons) — never emojis as UI icons
- All clickable elements must have `cursor-pointer`
- Verify light/dark mode contrast (4.5:1 minimum for text)
- Test responsive at 375px, 768px, 1024px, 1440px
- Respect `prefers-reduced-motion` for animations

Full skill reference: `.Codex/skills/ui-ux-pro-max/SKILL.md`

## Workflow Status

- **001 Worship Wheel Assessment**: Spec complete (clarified). Planning complete (plan.md, research.md, data-model.md, contracts, quickstart). Tasks generated.
- **002 Assessment Scoring Optimization**: Adds checklist response expansion. No new dependencies — existing chart.js / supabase / zod stack. Supabase `answers` JSONB column expands for checklist responses.
- **003 Results Page**: UI/UX spec for results. Client-side sessionStorage only for this scope.
- **005 Admin Dashboard**: All five user stories (US1 auth, US2 funnel + event tracking, US3 acquisition, US4 outcomes, US5 leads + CRM sync health) code-complete on branch `005-admin-dashboard`. Polish phase in progress; Supabase migrations T006 and full e2e validation pending live DB.
- **Client PRD**: Complete (pending Charl review).

## Recent Changes
- 2026-05-20: 005-admin-dashboard — US5 (leads table, CSV export, Keap sync-health panel) shipped; T053/T054/T058/T060 polish complete.
- 2026-05-19: 005-admin-dashboard — US1–US4 shipped; introduced `@supabase/ssr` for App Router auth and the `assessment_events` first-party event log.
- 2026-04-14: Repository reorganised — `specs/`, `plan/`, `docs/` moved from the Brand Guide folder into the Worship Wheel project root so this folder is a self-contained working directory.
- 002-assessment-scoring-optimization: Existing chart.js, supabase, zod stack retained; no new dependencies.
