# Tasks: Worship Wheel Assessment Tool

**Input**: Design documents from `/specs/001-worship-wheel-assessment/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.md, quickstart.md
**Branch**: `001-worship-wheel-assessment`

**Tests**: Unit tests included for scoring logic (called out in plan.md Phase D). E2E tests included in Polish phase (plan.md Phase I). No TDD approach — tests written alongside implementation.

**Organization**: Tasks grouped by user story. Figma design is Phase 3 (constitution mandate: design before code). Code phases follow.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Project Initialization)

**Purpose**: Create the Next.js project, install dependencies, configure tooling

- [ ] T001 Initialize Next.js 14+ project with TypeScript, Tailwind CSS, App Router, and src directory — `worship-wheel/`
- [ ] T002 Install production dependencies: `chart.js`, `react-chartjs-2`, `@supabase/supabase-js`, `zod`, `@vercel/og` in `worship-wheel/package.json`
- [ ] T003 Install dev dependencies: `vitest`, `@playwright/test`, `@types/node` in `worship-wheel/package.json`
- [ ] T004 [P] Configure Tailwind with WGS design tokens extracted from Figma variables (dark theme, gold accents, Montserrat) in `worship-wheel/tailwind.config.ts`
- [ ] T005 [P] Create `.env.local` template with all required environment variables (Supabase, Keap, GTM, CookieBot, app URL) per `quickstart.md` in `worship-wheel/.env.local.example`
- [ ] T006 [P] Configure `worship-wheel/next.config.ts` with image domains, headers, and any required rewrites
- [ ] T007 [P] Configure `worship-wheel/vercel.json` with cron job for Keap retry and any redirects

**Checkpoint**: Project scaffolded, dependencies installed, Tailwind configured with brand tokens

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**CRITICAL**: No user story work can begin until this phase is complete

- [ ] T008 Define shared TypeScript types (AssessmentSession, Question, Element, Answer, ScoreBand, Archetype, Recommendation, SubmitRequest, SubmitResponse) in `worship-wheel/src/types/index.ts` per `data-model.md` and `contracts/api.md`
- [ ] T009 [P] Create static questions data file with all 16 MVP questions (2 per element, 4 options each with point values) in `worship-wheel/src/data/questions.json` per `data-model.md` question selection table
- [ ] T010 [P] Create static elements reference data file with all 8 elements (code, name, order, description) in `worship-wheel/src/data/elements.json` per `data-model.md`
- [ ] T011 [P] Create static recommendations data file with placeholder content for all 40 element-band combinations, 5 archetypes, and 4 CTA bands in `worship-wheel/src/data/recommendations.json` per `data-model.md` and placeholder register (PC-001 through PC-049)
- [x] T012 Create Supabase migration for `assessment_sessions` table and `aggregate_stats` table with indexes and RLS policies in `supabase/migrations/20260414160000_initial_schema.sql` per `data-model.md` (filename uses Supabase CLI timestamp convention rather than the spec's original `001_`-style name)
- [ ] T013 [P] Implement Supabase browser client in `worship-wheel/src/lib/supabase/client.ts`
- [ ] T014 [P] Implement Supabase server client (service role key) in `worship-wheel/src/lib/supabase/server.ts`
- [ ] T015 [P] Implement Zod validation schemas for submission request (firstName, email, 16 answers, honeypot, UTM params) in `worship-wheel/src/lib/validation/submission.ts` per `contracts/api.md` validation rules
- [ ] T016 Create root layout with Montserrat font loading, dark theme base styles, and metadata defaults in `worship-wheel/src/app/layout.tsx`

**Checkpoint**: Foundation ready — types defined, data files created, Supabase configured, validation in place. User story implementation can begin.

---

## Phase 3: Figma Design (Constitution Mandate)

**Purpose**: Design all screens in Figma using WGS brand tokens BEFORE code implementation (FR-041, Constitution Principle I)

**CRITICAL**: Constitution requires Figma design before code. All screens must use bound variables from Color Primitives, Theme, Sizes, and Typography collections.

- [ ] T017 [P] Design Landing Page in Figma — hero section, value proposition ("Discover your worship guitar strengths and weaknesses in 5 minutes"), element overview, "Start Assessment" CTA button. Desktop + Mobile (375px) variants. Use Theme/dark mode variables.
- [ ] T018 [P] Design Assessment Flow in Figma — question card layout, 4 answer options with hover/selected states, progress bar (1/16 through 16/16), element label, back navigation arrow. Desktop + Mobile variants.
- [ ] T019 [P] Design Email Gate in Figma — first name input, email input, consent checkbox with privacy policy link, honeypot hidden field (not visible), submit CTA button, validation error states. Desktop + Mobile variants.
- [ ] T020 [P] Design Results Page in Figma — radar chart placement (8 axes), score summary (overall, percentage, balance), element breakdown with scores and band labels, strengths (green/gold highlight) and weaknesses (red/amber highlight). Desktop + Mobile variants.
- [ ] T021 [P] Design Recommendations Section in Figma — archetype card with icon and message, weak area recommendation cards (element name, band, message, action), CTA banner (score-band-based). Desktop + Mobile variants.
- [ ] T022 [P] Design Share Section in Figma — share button placement, copy-link button, native share options. Desktop + Mobile variants.
- [ ] T023 **OUTSTANDING ASSET** — Design OG Image Template in Figma — 1200x630px branded layout with radar chart, overall score, archetype label, WGS logo, "Take the assessment" CTA text. Dark background, gold accents. (Blocked: asset not yet ready)

**Checkpoint**: All screens designed in Figma with bound variables. Screenshots captured and validated. Ready for code implementation.

---

## Phase 4: User Story 1 — Complete the Assessment (Priority: P1) — MVP

**Goal**: User can land on the page, start the quiz, answer 16 questions with back-navigation, and submit their name + email. Server calculates scores and persists to Supabase. Redirects to results URL.

**Independent Test**: Navigate to landing page, click "Start", answer all 16 questions, submit name/email. Verify redirect to `/results/[resultId]` and record exists in Supabase.

### Implementation for User Story 1

- [ ] T024 [US1] Build landing page as Server Component with hero section, value proposition, element overview, and "Start Assessment" CTA in `worship-wheel/src/app/page.tsx` and `worship-wheel/src/components/landing/Hero.tsx`
- [ ] T025 [P] [US1] Build ProgressBar component showing current question number out of 16 in `worship-wheel/src/components/assessment/ProgressBar.tsx`
- [ ] T026 [P] [US1] Build AnswerOption component with 4 options (a/b/c/d), selected state, and hover interaction in `worship-wheel/src/components/assessment/AnswerOption.tsx`
- [ ] T027 [US1] Build QuestionCard component displaying question text, element label, and 4 AnswerOption components in `worship-wheel/src/components/assessment/QuestionCard.tsx`
- [ ] T028 [US1] Build EmailGate component with first name input, email input, consent checkbox, honeypot hidden field, submit button, and client-side validation in `worship-wheel/src/components/assessment/EmailGate.tsx`
- [ ] T029 [US1] Build assessment page as Client Component with quiz flow state management — load questions from JSON, track answers array, handle forward/back navigation, show EmailGate after Q16 in `worship-wheel/src/app/assessment/page.tsx`
- [ ] T030 [P] [US1] Implement scoring calculator — element scores (average of 2 questions, rounded), overall score (sum of 8 elements), balance score (inverted SD formula: 10 - (SD / 3.18 * 9), clamped 1-10) in `worship-wheel/src/lib/scoring/calculator.ts`
- [ ] T031 [P] [US1] Implement archetype determination — pattern-matching (RH highest by 3+ = Rhythm Player, TH+HM top 2 = Theory Head, HM+RH high but rest low = Campfire Strummer) with balance-based fallback (high balance + low overall = Balanced Beginner, low balance + mixed = Uneven Intermediate) in `worship-wheel/src/lib/scoring/archetype.ts`
- [ ] T032 [P] [US1] Implement score band mapping (1-2: Beginner, 3-4: Developing, 5-6: Functional, 7-8: Fluent, 9-10: Flow) and weakest/strongest element identification in `worship-wheel/src/lib/scoring/bands.ts`
- [ ] T033 [US1] Implement POST `/api/submit` route handler — validate request with Zod schema, check honeypot, enforce rate limit (5/IP/hour), calculate scores server-side, persist to Supabase, return resultId and scores in `worship-wheel/src/app/api/submit/route.ts` per `contracts/api.md`
- [ ] T034 [US1] Wire assessment page submission to POST `/api/submit` — on success, redirect to `/results/[resultId]` in `worship-wheel/src/app/assessment/page.tsx`
- [ ] T035 [US1] Write unit tests for scoring calculator (deterministic results, edge cases: all same answers, all max, all min) in `worship-wheel/__tests__/unit/scoring.test.ts`
- [ ] T036 [US1] Write unit tests for archetype determination (all 5 archetypes triggered correctly, fallback logic) in `worship-wheel/__tests__/unit/archetype.test.ts`
- [ ] T037 [US1] Write unit tests for Zod validation schemas (valid request, missing fields, wrong answer count, invalid email) in `worship-wheel/__tests__/unit/validation.test.ts`

**Checkpoint**: Full assessment flow works end-to-end. User can start, answer 16 questions, submit email, and get redirected to a results URL. Scores calculated server-side and persisted. Scoring is deterministic and tested.

---

## Phase 5: User Story 2 — View Personalised Results (Priority: P1)

**Goal**: Results page loads from Supabase by resultId (SSR for OG meta tags), displays animated radar chart, element scores, overall/balance scores, and highlights strengths/weaknesses.

**Independent Test**: After completing assessment, verify results page at `/results/[resultId]` shows correct radar chart, all 8 element scores, overall score, percentage, balance score, and correct strengths/weaknesses highlighting.

**Dependencies**: Requires US1 (assessment submission creates the Supabase record)

### Implementation for User Story 2

- [ ] T038 [US2] Build RadarChart client component — Chart.js radar chart with 8 axes (FB, HM, ML, RH, TO, TH, TE, AU), animated draw-in, dark theme background, gold data fill, responsive sizing. Use `next/dynamic` with `ssr: false` in `worship-wheel/src/components/results/RadarChart.tsx`
- [ ] T039 [P] [US2] Build ScoreSummary component — overall score (raw/80 and percentage), balance score (1-10 with visual indicator), archetype label in `worship-wheel/src/components/results/ScoreSummary.tsx`
- [ ] T040 [P] [US2] Build ElementBreakdown component — list of 8 elements with name, code, score (1-10), band label, colour-coded strength (gold/green) or weakness (red/amber) highlighting in `worship-wheel/src/components/results/ElementBreakdown.tsx`
- [ ] T041 [US2] Build results page as Server Component — fetch assessment session from Supabase by `resultId`, render OG meta tags (title, description with score, og:image URL), compose RadarChart + ScoreSummary + ElementBreakdown. Handle 404 with friendly "not found" page and CTA to take assessment in `worship-wheel/src/app/results/[resultId]/page.tsx`

**Checkpoint**: Results page renders correctly with all scores, radar chart animates on load, OG meta tags present for social crawlers. Strengths and weaknesses visually differentiated.

---

## Phase 6: User Story 3 — Receive Personalised Recommendations (Priority: P2)

**Goal**: Below the results chart, display archetype card, weak area recommendations with band-specific messages, and score-band-based CTA linking to WGS offerings.

**Independent Test**: Complete assessments with different score profiles. Verify archetype changes, recommendations match weakest elements and correct bands, CTA links correspond to overall score band.

**Dependencies**: Requires US2 (results page to render recommendations on)

### Implementation for User Story 3

- [ ] T042 [P] [US3] Build ArchetypeCard component — displays archetype name, icon/illustration, and personalised message (from recommendations.json) in `worship-wheel/src/components/results/ArchetypeCard.tsx`
- [ ] T043 [P] [US3] Build RecommendationList component — renders top 2-3 weakest elements with element name, band label, message, and suggested action (from recommendations.json keyed by element + band) in `worship-wheel/src/components/results/RecommendationList.tsx`
- [ ] T044 [P] [US3] Build CTABanner component — displays score-band-based CTA (label and URL from recommendations.json cta_bands) in `worship-wheel/src/components/results/CTABanner.tsx`
- [ ] T045 [US3] Integrate ArchetypeCard, RecommendationList, and CTABanner into the results page below the radar chart and score summary in `worship-wheel/src/app/results/[resultId]/page.tsx`
- [ ] T046 [US3] Handle edge case: all element scores equal — no weakest element highlighted, display message encouraging overall growth instead of specific recommendations in `worship-wheel/src/components/results/RecommendationList.tsx`

**Checkpoint**: Recommendations render correctly below results. Archetype matches score profile. CTAs point to correct score-band URLs (placeholders for now). Equal-scores edge case handled.

---

## Phase 7: User Story 4 — Lead Capture and Keap Integration (Priority: P2)

**Goal**: On email submission, create/update contact in Keap with scores, tags (completed, score band, weak elements), and trigger automation. Non-blocking — failures don't prevent results. Failed syncs retried via cron.

**Independent Test**: Complete assessment with test email. Verify contact appears in Keap with correct tags and custom field values. Verify failed syncs are retried.

**Dependencies**: Requires US1 (submit endpoint to trigger Keap sync from)

### Implementation for User Story 4

- [ ] T047 [US4] Implement Keap API client with SAK authentication — contact search by email, contact create, contact update with custom fields, tag application in `worship-wheel/src/lib/keap/client.ts` per `contracts/api.md` Keap section
- [ ] T048 [US4] Implement Keap contact sync logic — find-or-create contact, update custom fields (ww_overall_score, ww_balance_score, ww_archetype, ww_fb_score through ww_au_score, ww_weakest_elements, ww_results_url, ww_completed_at), apply tags (WW: Completed, WW: {score_band}, WW-Weak: {element}) in `worship-wheel/src/lib/keap/sync.ts`
- [ ] T049 [US4] Integrate Keap sync into POST `/api/submit` as a non-blocking async call — on failure, set `keap_sync_status` to 'failed' with error message in Supabase; on success, set to 'synced' in `worship-wheel/src/app/api/submit/route.ts`
- [ ] T050 [US4] Implement Keap retry cron endpoint — query Supabase for records with `keap_sync_status` != 'synced', retry with exponential backoff (1min, 5min, 30min), max 3 retries, update status accordingly in `worship-wheel/src/app/api/keap-retry/route.ts`

**Checkpoint**: Keap contacts created/updated with correct tags and scores. Failed syncs logged and retried. Results always shown regardless of Keap API status.

---

## Phase 8: User Story 5 — Retake the Assessment (Priority: P3)

**Goal**: Users can retake the assessment without barriers. Each retake generates a new results URL. Keap contact updated with latest scores (not duplicated).

**Independent Test**: Complete assessment twice with same email. Verify two distinct results URLs exist. Verify Keap contact has latest scores only.

**Dependencies**: Requires US1 + US4 (assessment flow and Keap upsert logic handle this by design)

### Implementation for User Story 5

- [ ] T051 [US5] Verify retake flow works end-to-end — no login required, new resultId generated per submission, previous results URLs remain accessible. Add any missing handling in `worship-wheel/src/app/api/submit/route.ts`
- [ ] T052 [US5] Verify Keap upsert correctly updates (not duplicates) contact on retake — existing contact found by email, scores overwritten with latest in `worship-wheel/src/lib/keap/sync.ts`

**Checkpoint**: Retakes work seamlessly. Each assessment produces a unique URL. Keap contact reflects latest scores.

---

## Phase 9: User Story 6 — Share Results (Priority: P3)

**Goal**: Users can share their Worship Wheel via a share button. OG image generated dynamically for social previews. Copy-link and native share API supported.

**Independent Test**: Complete assessment, click share button. Verify link copies correctly. Open results URL in social media debugger — verify OG image renders with radar chart and score.

**Dependencies**: Requires US2 (results page with OG meta tags)

### Implementation for User Story 6

- [ ] T053 [US6] Implement OG image generation route — fetch scores from Supabase, draw SVG radar chart (8 vertices from scores), render with @vercel/og ImageResponse (1200x630px, dark bg, gold accents, Montserrat font, overall score, archetype label, WGS logo). Cache at edge. Return default branded image on 404 in `worship-wheel/src/app/api/og/[resultId]/route.ts`
- [ ] T054 [US6] Build ShareButton component — copy-link button (copies results URL to clipboard), native Web Share API (if supported), fallback share options. Positioned on results page in `worship-wheel/src/components/results/ShareButton.tsx`
- [ ] T055 [US6] Integrate ShareButton into results page and verify OG meta tags point to `/api/og/[resultId]` in `worship-wheel/src/app/results/[resultId]/page.tsx`

**Checkpoint**: Share button works. OG image generates correctly with radar chart and scores. Social media previews display branded image.

---

## Phase 10: Analytics & Privacy (Cross-Cutting, P2)

**Purpose**: GA4 funnel tracking via GTM DataLayer events, CookieBot consent management, UTM capture, spam protection

- [ ] T056 [P] Implement DataLayer push helper functions for all 12 events (page_view, assessment_start, question_answered, element_completed, assessment_completed, email_gate_viewed, email_submitted, results_viewed, recommendation_viewed, cta_clicked, share_initiated, share_completed) in `worship-wheel/src/lib/analytics/dataLayer.ts` per `contracts/api.md` DataLayer events contract
- [ ] T057 [P] Build GTMProvider component — loads GTM container script with consent mode defaults (denied until CookieBot grants) in `worship-wheel/src/components/shared/GTMProvider.tsx`
- [ ] T058 [P] Build CookieConsent component — loads CookieBot script in head, configures consent categories (necessary, statistics, marketing) in `worship-wheel/src/components/shared/CookieConsent.tsx`
- [ ] T059 Integrate GTMProvider and CookieConsent into root layout in `worship-wheel/src/app/layout.tsx`
- [ ] T060 Wire DataLayer events into assessment flow — assessment_start on "Start" click, question_answered on answer select, element_completed when both questions done, assessment_completed after Q16, email_gate_viewed on gate render, email_submitted on submit in `worship-wheel/src/app/assessment/page.tsx`
- [ ] T061 Wire DataLayer events into results page — results_viewed on render, recommendation_viewed on scroll into view, cta_clicked on CTA click, share_initiated and share_completed on share actions in `worship-wheel/src/app/results/[resultId]/page.tsx`
- [ ] T062 Implement assessment_abandoned event on beforeunload/visibilitychange with last_question_number and time_spent_seconds in `worship-wheel/src/app/assessment/page.tsx`
- [ ] T063 Implement UTM parameter capture from landing page URL query string and persist through session (sessionStorage or state) for inclusion in submit payload in `worship-wheel/src/app/page.tsx` and `worship-wheel/src/app/assessment/page.tsx`
- [ ] T064 Verify no PII (name, email) appears in any DataLayer event parameters — audit all dataLayer.push calls

**Checkpoint**: Full GA4 funnel visible in GTM debug mode. CookieBot blocks GA4 until consent. UTMs captured and persisted. No PII in events.

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Responsive testing, performance, accessibility, E2E tests, deployment

- [ ] T065 Mobile responsiveness pass — test all pages at 375px, 768px, 1024px, 1440px. Fix layout issues in all component files
- [ ] T066 [P] Accessibility pass — keyboard navigation through quiz, screen reader labels on all interactive elements, contrast ratios (4.5:1 minimum for text), focus indicators on all components
- [ ] T067 [P] Performance audit — run Lighthouse on landing page, assessment page, results page. Target: results page < 3s on mobile. Optimize Chart.js bundle (register only radar chart type) and image loading
- [ ] T068 [P] Write E2E test: full assessment flow — land on page, start quiz, answer 16 questions, submit email, verify results page renders with radar chart in `worship-wheel/__tests__/e2e/assessment-flow.spec.ts`
- [ ] T069 [P] Write E2E test: results page loads from unique URL — navigate directly to `/results/[known-resultId]`, verify scores and chart render correctly in `worship-wheel/__tests__/e2e/results-page.spec.ts`
- [ ] T070 Implement Supabase aggregate stats update — database function or trigger that updates `aggregate_stats` table on each new `assessment_sessions` insert in `worship-wheel/supabase/migrations/002_aggregate_trigger.sql`
- [ ] T071 [P] Create friendly 404 page for invalid result IDs with CTA to take the assessment in `worship-wheel/src/app/results/[resultId]/not-found.tsx`
- [ ] T072 Final deployment — deploy to Vercel, configure custom subdomain CNAME (`worshipwheel.worshipguitarskills.com` -> `cname.vercel-dns.com`), smoke test on live domain

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — BLOCKS all user stories
- **Phase 3 (Figma Design)**: Can run in parallel with Phase 1+2 (design work, not code)
- **Phase 4 (US1)**: Depends on Phase 2 + Phase 3 (design must be complete per constitution)
- **Phase 5 (US2)**: Depends on Phase 4 (needs assessment records in Supabase)
- **Phase 6 (US3)**: Depends on Phase 5 (renders on results page)
- **Phase 7 (US4)**: Depends on Phase 4 (integrates into submit endpoint) — can run parallel with Phase 5+6
- **Phase 8 (US5)**: Depends on Phase 4 + Phase 7 (retake = assessment flow + Keap upsert)
- **Phase 9 (US6)**: Depends on Phase 5 (OG image needs results page + Supabase data)
- **Phase 10 (Analytics)**: Can start after Phase 4 (needs assessment flow to wire events into) — can run parallel with Phase 5-9
- **Phase 11 (Polish)**: Depends on all desired user stories being complete

### User Story Dependencies

```
Phase 3 (Figma) ──────────────────────────────────────┐
                                                       v
Phase 1 (Setup) → Phase 2 (Foundation) → Phase 4 (US1: Assessment) ──┬──→ Phase 5 (US2: Results) → Phase 6 (US3: Recommendations)
                                                                      │                              │
                                                                      ├──→ Phase 7 (US4: Keap) ──────┤
                                                                      │                              │
                                                                      ├──→ Phase 10 (Analytics) ─────┤
                                                                      │                              v
                                                                      └──→ Phase 8 (US5: Retakes)   Phase 9 (US6: Sharing)
                                                                                                      │
                                                                                                      v
                                                                                              Phase 11 (Polish)
```

### Within Each User Story

- Models/types before services
- Services before API routes
- API routes before UI components that call them
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

**Phase 2**: T009, T010, T011 (data files) can all run in parallel. T013, T014, T015 (clients + validation) can all run in parallel.

**Phase 3**: All Figma design tasks (T017-T022) can run in parallel.

**Phase 4**: T025, T026 (ProgressBar, AnswerOption) can run in parallel. T030, T031, T032 (scoring logic) can run in parallel. T035, T036, T037 (unit tests) can run in parallel.

**Phase 5**: T039, T040 (ScoreSummary, ElementBreakdown) can run in parallel.

**Phase 6**: T042, T043, T044 (ArchetypeCard, RecommendationList, CTABanner) can run in parallel.

**Phase 7+10**: US4 (Keap) and Phase 10 (Analytics) can run in parallel with US2+US3.

**Phase 11**: T065-T069 (responsive, a11y, perf, E2E tests) can mostly run in parallel.

---

## Parallel Example: User Story 1 (Phase 4)

```bash
# Parallel batch 1: Independent UI components
Task T025: "Build ProgressBar component in worship-wheel/src/components/assessment/ProgressBar.tsx"
Task T026: "Build AnswerOption component in worship-wheel/src/components/assessment/AnswerOption.tsx"

# Sequential: QuestionCard depends on AnswerOption
Task T027: "Build QuestionCard component in worship-wheel/src/components/assessment/QuestionCard.tsx"

# Parallel batch 2: Independent scoring logic (no UI dependency)
Task T030: "Implement scoring calculator in worship-wheel/src/lib/scoring/calculator.ts"
Task T031: "Implement archetype determination in worship-wheel/src/lib/scoring/archetype.ts"
Task T032: "Implement score band mapping in worship-wheel/src/lib/scoring/bands.ts"

# Sequential: API route depends on scoring + validation
Task T033: "Implement POST /api/submit in worship-wheel/src/app/api/submit/route.ts"

# Parallel batch 3: Unit tests (after implementation)
Task T035: "Unit tests for scoring in worship-wheel/__tests__/unit/scoring.test.ts"
Task T036: "Unit tests for archetype in worship-wheel/__tests__/unit/archetype.test.ts"
Task T037: "Unit tests for validation in worship-wheel/__tests__/unit/validation.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 + 2 = P1)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: Figma Design (can overlap with 1+2)
4. Complete Phase 4: US1 — Assessment Flow
5. **STOP and VALIDATE**: Test full quiz flow end-to-end
6. Complete Phase 5: US2 — Results Page
7. **STOP and VALIDATE**: Test results rendering, scoring accuracy
8. Deploy MVP — assessment + results working

### Incremental Delivery

1. Setup + Foundational + Figma Design -> Foundation ready
2. Add US1 (Assessment) -> Test independently -> Deploy (lead capture works!)
3. Add US2 (Results) -> Test independently -> Deploy (full P1 MVP!)
4. Add US3 (Recommendations) + US4 (Keap) -> Test -> Deploy (P2 complete)
5. Add US5 (Retakes) + US6 (Sharing) -> Test -> Deploy (P3 complete)
6. Add Analytics + Polish -> Final launch

### Suggested MVP Scope

**Minimum viable launch**: Phase 1 + 2 + 3 + 4 + 5 = Setup, Foundation, Design, Assessment Flow, Results Page. This delivers the core "wow moment" (radar chart) and captures leads (email gate). Keap integration (US4) is the immediate next priority for lead delivery.

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- Constitution mandate: Phase 3 (Figma) must complete before code implementation (Phase 4+)
- All placeholder content tracked in spec.md Placeholder Content Register (PC-001 through PC-050)
- Keap tag IDs and custom field IDs stored in environment variables, not hard-coded
- Scoring is server-side only (FR-011) — no scoring logic exposed to client
- CookieBot must gate GA4 — no tracking before consent (FR-038G)
- Rate limiting: 5 submissions per IP per hour on POST /api/submit (FR-038K)
