# Feature Specification: Worship Wheel Admin Dashboard

**Feature Branch**: `005-admin-dashboard`
**Created**: 2026-05-19
**Status**: Draft
**Input**: Build an authenticated admin dashboard for the key stakeholders managing the Worship Wheel assessment tool. The dashboard answers the 80/20 of marketing and CRO questions an executive needs: funnel drop-off per question, top traffic sources, audience outcomes, and lead/CRM operational health. Authentication uses Supabase.

## Context

The Worship Wheel assessment (specs 001–004) is a lead-generation funnel: a visitor lands on the assessment, answers 24 scenario-based questions, submits their name and email, sees a radar-chart results page, and is synced to Keap as a CRM lead. The funnel is live, but the stakeholders managing it — Charl Coetzee and the WGS marketing team — currently have **no first-party visibility** into how it performs.

### The measurement gap this spec closes

The current data model only persists **completed** assessments. The `assessment_sessions` row is INSERTed at the moment a user submits their email — per the data model: *"[User starts quiz] → client-side only, no DB record."* Consequently:

1. **Per-question drop-off is not stored anywhere in our database.** It exists only as GA4 DataLayer events.
2. **GA4 is consent-gated by CookieBot.** Every visitor who declines cookies is invisible to GA4 — a structural blind spot (commonly 20–40% of traffic) that makes funnel numbers untrustworthy.
3. **Traffic source is captured only for completers** (`assessment_sessions.utm_*`) and only when a campaign UTM tag is present — organic, direct, and referral visits carry no attribution at all.

This spec therefore has two halves: (A) a lightweight **first-party event-tracking layer** that records the funnel reliably and consent-independently, and (B) the **authenticated dashboard** that visualises it.

### Decided scope (from stakeholder interview)

- **Funnel data source**: first-party anonymous event table in Supabase (not GA4 API).
- **Authentication**: Supabase Auth, email + password, single role (all authenticated users are full admins). No public sign-up.
- **Record detail**: aggregate charts **plus** a searchable/exportable individual-lead table **plus** a Keap sync-failure operations view.
- **Traffic attribution**: UTM parameters **plus** `document.referrer` **plus** landing path, so every visit is attributed — not just tagged campaigns.
- **Dashboard scope**: analytics only. Editing questions, recommendation copy, or CTA URLs is **out of scope** (a possible future spec).
- **Delivery**: pull-only dashboard. No scheduled email digest or anomaly alerting in this scope.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Secure Sign-In to the Dashboard (Priority: P1)

A key stakeholder navigates to the admin dashboard URL. If not signed in, they are presented with a sign-in screen requiring email and password. Only people on an approved allowlist can authenticate. Once signed in, they reach the dashboard; their session persists for a reasonable working period and then expires, requiring re-authentication. Every dashboard page and every data API is inaccessible to anyone who is not authenticated.

**Why this priority**: The dashboard exposes lead PII (names, emails) and business performance data. Nothing else in this spec can ship until access is provably locked down. It is the foundation every other story sits on.

**Independent Test**: Attempt to load every dashboard route and data endpoint while signed out and confirm access is denied/redirected. Sign in with an allowlisted credential and confirm access is granted. Sign in attempts with a non-allowlisted email, a wrong password, and an expired session are all rejected.

**Acceptance Scenarios**:

1. **Given** an unauthenticated visitor, **When** they request any `/admin` route, **Then** they are redirected to the sign-in screen and no dashboard data is returned.
2. **Given** an unauthenticated request, **When** it hits any dashboard data API endpoint directly, **Then** it is rejected with an unauthorized response and no data is returned.
3. **Given** a person whose email is on the approved allowlist, **When** they submit the correct password, **Then** they are authenticated and land on the dashboard home.
4. **Given** a person whose email is **not** on the allowlist, **When** they attempt to sign in (or self-register), **Then** authentication fails and no account is created.
5. **Given** an authenticated user, **When** their session exceeds the configured inactivity/maximum lifetime, **Then** they are signed out and must re-authenticate.
6. **Given** an authenticated user, **When** they choose "Sign out", **Then** their session is terminated and protected routes are no longer accessible.
7. **Given** repeated failed sign-in attempts for an email, **When** a threshold is exceeded, **Then** further attempts are rate-limited/temporarily blocked.

---

### User Story 2 — Measure Funnel Drop-Off and Identify Sticking-Point Questions (Priority: P1)

A stakeholder opens the dashboard and immediately sees the assessment funnel: how many people viewed the assessment, how many started, how many reached each question, how many completed, and how many became captured leads — with the conversion rate at each step. They can drill into a per-question view showing the completion rate and average time spent on every question, with questions that combine high abandonment and high dwell time automatically flagged as likely "too hard / tricky" sticking points. All views can be filtered to a chosen date range and compared against the prior equivalent period.

**Why this priority**: This is the headline CRO question — *"where are we leaking people, and which questions are the problem?"* — and the stakeholder's explicitly stated primary need. Together with US1 it forms the viable MVP.

**Independent Test**: Drive a known set of simulated sessions through the assessment (some abandoning at specific questions, some completing). Confirm the funnel shows the correct counts and conversion rates at each step, the per-question view shows the correct completion percentages, and the question where simulated abandonment was concentrated is flagged as a sticking point.

**Acceptance Scenarios**:

1. **Given** funnel data for a selected period, **When** the stakeholder views the dashboard home, **Then** they see a step funnel: Visitors → Started → Completed → Lead Captured, each with a count and a conversion rate relative to the previous step and to Visitors.
2. **Given** the funnel view, **When** the stakeholder selects a date range, **Then** every metric recalculates for that range and shows the percentage change versus the immediately preceding equal-length period.
3. **Given** the per-question drop-off view, **When** it renders, **Then** it shows, for each of the assessment questions in order, the count and percentage of sessions that reached it and the step-over-step drop-off.
4. **Given** the per-question view, **When** it renders, **Then** it shows the median (and average) time spent on each question.
5. **Given** a question with both above-average abandonment and above-average time-on-question, **When** the per-question view renders, **Then** that question is visually flagged as a likely sticking point.
6. **Given** the email-capture step, **When** the funnel renders, **Then** completion-of-questions and submission-of-email are shown as distinct steps so a drop-off at the email gate is distinguishable from a drop-off during questions.
7. **Given** no data exists for the selected period, **When** any funnel view renders, **Then** it shows a clear empty state rather than broken or misleading figures.

---

### User Story 3 — See Where Traffic Comes From and Which Sources Convert (Priority: P2)

A stakeholder opens the Acquisition view to see where assessment visitors originate — broken down by campaign (UTM), by referring website, and by direct traffic. For each source they see not just visit volume but the **completion rate and lead-capture rate** for that source, so they can tell which channels send people who actually finish and convert versus channels that send bouncing traffic.

**Why this priority**: The stakeholder's second stated need. It turns the tool into a marketing-ROI instrument rather than a vanity counter. It depends on the event layer from US2 but is a separable view.

**Independent Test**: Simulate sessions arriving with different UTM tags, different referrers, and no referrer (direct), some completing and some not. Confirm the Acquisition view groups them correctly and shows an accurate completion and lead rate per source.

**Acceptance Scenarios**:

1. **Given** sessions with UTM parameters, **When** the Acquisition view renders, **Then** traffic is grouped by source/medium/campaign with visit counts.
2. **Given** sessions with a referrer but no UTM, **When** the Acquisition view renders, **Then** they are attributed to the referring domain rather than collapsed into "unknown".
3. **Given** sessions with neither UTM nor referrer, **When** the Acquisition view renders, **Then** they are clearly labelled as "Direct".
4. **Given** any traffic source row, **When** it renders, **Then** it shows that source's started-rate, completion rate, and lead-capture rate — not only visit volume.
5. **Given** the Acquisition view, **When** a date range is selected, **Then** source breakdowns recalculate for that range.
6. **Given** the Acquisition view, **When** it renders, **Then** the stakeholder can see the top landing paths for incoming traffic.

---

### User Story 4 — Understand the Audience and Their Outcomes (Priority: P2)

A stakeholder opens the Audience & Outcomes view to understand who is taking the assessment and what results they get: the distribution of profile archetypes, the distribution of overall score bands, the average score per element across all respondents (revealing the audience's collective weakest skills), and the device mix. This informs content strategy and product positioning.

**Why this priority**: High strategic value for content and offer decisions, and it reuses data already persisted in `assessment_sessions` and `aggregate_stats`, so it is low-cost to deliver. Secondary to the funnel itself.

**Independent Test**: Seed a known set of completed assessments with varied archetypes, score bands, and element scores. Confirm the view's distributions and averages match the seeded data, filtered correctly by date range.

**Acceptance Scenarios**:

1. **Given** completed assessments in the period, **When** the Outcomes view renders, **Then** it shows the count and share of each profile archetype.
2. **Given** completed assessments in the period, **When** the Outcomes view renders, **Then** it shows the distribution across overall score bands.
3. **Given** completed assessments in the period, **When** the Outcomes view renders, **Then** it shows the average score for each of the 8 elements (FB, HM, ML, RH, TO, TH, TE, AU), making the audience's collective weakest and strongest elements visible.
4. **Given** the dashboard, **When** any view renders, **Then** the stakeholder can see the device-type split (mobile / tablet / desktop) of visitors and completers.
5. **Given** any outcome metric, **When** a date range is selected, **Then** the metric recalculates for that range.
6. **Given** the Outcomes view, **When** it renders, **Then** it shows the average and median completion time for finished assessments.

---

### User Story 5 — Inspect Individual Leads and Monitor CRM Sync Health (Priority: P3)

A stakeholder opens the Leads view to see a searchable, paginated, date-filterable table of individual assessment completions — name, email, completion date, overall score, archetype, traffic source, and Keap sync status. They can export the current filtered view as a CSV. A dedicated operational panel surfaces any assessments whose Keap sync `failed`, so a stakeholder can identify leads that did not reach the CRM and flag them for manual attention.

**Why this priority**: Operationally important for the people "managing" the tool — a failed Keap sync is a lead lost from follow-up automation — but it is a refinement on top of the analytical core, and the underlying data already exists in `assessment_sessions`.

**Independent Test**: Seed completed assessments including some with `keap_sync_status = 'failed'`. Confirm the Leads table lists all of them with correct fields, search and date filtering work, CSV export reflects the filtered set, and the sync-health panel lists exactly the failed records.

**Acceptance Scenarios**:

1. **Given** completed assessments, **When** the Leads view renders, **Then** it shows a paginated table with name, email, completion date, overall score, archetype, traffic source, and Keap sync status.
2. **Given** the Leads table, **When** the stakeholder searches by name or email, **Then** the table filters to matching records.
3. **Given** the Leads table, **When** the stakeholder applies a date range, **Then** only completions within that range are shown.
4. **Given** a filtered Leads table, **When** the stakeholder exports to CSV, **Then** the file contains exactly the currently filtered records and fields.
5. **Given** assessments with `keap_sync_status` of `failed` or `retrying`, **When** the sync-health panel renders, **Then** it lists each such record with its email, completion time, status, and last sync error.
6. **Given** the sync-health panel, **When** all records are `synced`, **Then** it shows a healthy empty state.

---

### Edge Cases

- **Bot and spam traffic**: automated crawlers and the existing honeypot-failing spam submissions must be excluded from funnel, drop-off, and acquisition metrics so figures are not inflated. Sessions completing implausibly fast are treated as suspect.
- **Self-traffic**: visits from the stakeholders themselves or internal QA should be filterable/excludable so they do not distort conversion rates.
- **Returning visitors / retakes**: a person who abandons and later returns, or who retakes the assessment, may generate multiple sessions; the spec must define whether the funnel counts unique sessions or unique people (see Assumptions).
- **Partial sessions never resolved**: a session that records a start but no further events (tab closed) must still count as "started" and as a drop-off, not silently vanish.
- **Clock/timezone**: date-range filtering and "prior period" comparisons must use a single, explicit reporting timezone so day boundaries are consistent.
- **Missing referrer**: browsers and privacy tools frequently strip `document.referrer`; absence must resolve to "Direct", never an error.
- **Event ingestion failure**: if the event-tracking endpoint is unavailable, the public assessment experience MUST be unaffected — tracking is best-effort and never blocks the user.
- **Empty date ranges**: every chart and table must render a defined empty state when a filter yields no rows.
- **Large export**: a CSV export over a wide date range must not time out or exhaust memory.
- **Allowlist change**: removing an email from the allowlist must prevent that person's future sign-in; behaviour for their currently active session must be defined.
- **Linking submission to its session**: the `assessment_submitted` event must reconcile to the resulting `assessment_sessions` row so a completed funnel path is attributable end-to-end, including its original traffic source.

## Requirements *(mandatory)*

### Functional Requirements

#### Authentication & Security

- **FR-001**: The system MUST require authentication for every dashboard page and every dashboard data API endpoint; unauthenticated requests MUST be denied.
- **FR-002**: The system MUST authenticate stakeholders via email and password using Supabase Auth.
- **FR-003**: The system MUST NOT allow public self-registration; accounts are limited to an approved allowlist of stakeholder emails managed outside the public UI.
- **FR-004**: All authenticated users share a single role with identical full access; no role tiers are required in this scope.
- **FR-005**: The system MUST enforce a password strength policy and securely store credentials (delegated to Supabase Auth defaults).
- **FR-006**: The system MUST expire sessions after a defined inactivity and/or absolute lifetime and require re-authentication thereafter.
- **FR-007**: The system MUST rate-limit failed sign-in attempts to resist brute-force attacks.
- **FR-008**: The system MUST provide a sign-out action that fully terminates the session.
- **FR-009**: The system MUST enforce database row-level security so dashboard data tables are readable only by authenticated dashboard users (or server-side service role), never by the public/anon role.
- **FR-010**: Privileged secrets (service role keys, Keap keys) MUST remain server-side and MUST NOT be exposed to the browser.
- **FR-011**: The dashboard MUST be served only over HTTPS and use secure, http-only session cookies.
- **FR-012**: The system SHOULD record an audit trail of dashboard sign-in events (who, when).

#### Event Tracking (Funnel Instrumentation)

- **FR-013**: The system MUST record first-party, server-side funnel events for the assessment, independent of cookie consent and independent of GA4.
- **FR-014**: The system MUST capture, at minimum, these event types: assessment page view, assessment started, question viewed (per question), question answered (per question), and assessment submitted.
- **FR-015**: Each event MUST be associated with an anonymous, ephemeral session identifier that allows reconstructing one visitor's path through the funnel without identifying the person.
- **FR-016**: Funnel events MUST NOT store personally identifiable information; PII remains only in `assessment_sessions`.
- **FR-017**: Each session's first event MUST capture available acquisition context: UTM parameters, `document.referrer`, and the landing path.
- **FR-018**: Each session MUST capture a device-type classification (mobile / tablet / desktop).
- **FR-019**: Question-level events MUST capture enough timing information to derive time spent per question.
- **FR-020**: The `assessment_submitted` event MUST be reconcilable to the resulting `assessment_sessions` record so a full funnel path links to the completed lead.
- **FR-021**: Event capture MUST be best-effort and MUST NOT block, delay, or break the public assessment experience if the tracking endpoint fails.
- **FR-022**: The event-ingestion endpoint MUST be protected against abuse (e.g. rate limiting, payload validation) and MUST reject malformed events.
- **FR-023**: The system MUST exclude known bots, honeypot-failing spam submissions, and implausibly fast sessions from reported metrics.

#### Funnel & Drop-Off Reporting

- **FR-024**: The dashboard MUST display an end-to-end funnel: Visitors → Started → Completed → Lead Captured, with counts and step-over-step conversion rates.
- **FR-025**: The dashboard MUST display a per-question view showing, for each question in order, the count and percentage of sessions reaching it and the drop-off to the next question.
- **FR-026**: The dashboard MUST display time-per-question (median and average) for each question.
- **FR-027**: The dashboard MUST automatically flag questions that combine above-average abandonment with above-average time-on-question as likely sticking points.
- **FR-028**: The funnel MUST treat "completed all questions" and "submitted email" as distinct steps so email-gate drop-off is distinguishable from in-question drop-off.

#### Acquisition Reporting

- **FR-029**: The dashboard MUST break down traffic by source, attributing visits via UTM parameters, then referrer domain, then "Direct" when neither is present.
- **FR-030**: For each traffic source, the dashboard MUST display started-rate, completion rate, and lead-capture rate — not visit volume alone.
- **FR-031**: The dashboard MUST display the top landing paths for incoming traffic.

#### Audience & Outcomes Reporting

- **FR-032**: The dashboard MUST display the distribution of profile archetypes among completers.
- **FR-033**: The dashboard MUST display the distribution of overall score bands.
- **FR-034**: The dashboard MUST display the average score per element across completers.
- **FR-035**: The dashboard MUST display the device-type split of visitors and completers.
- **FR-036**: The dashboard MUST display average and median assessment completion time.

#### Leads & CRM Operations

- **FR-037**: The dashboard MUST provide a paginated table of individual completed assessments showing name, email, completion date, overall score, archetype, traffic source, and Keap sync status.
- **FR-038**: The Leads table MUST support search by name/email and filtering by date range.
- **FR-039**: The dashboard MUST allow exporting the currently filtered Leads view as a CSV file.
- **FR-040**: The dashboard MUST provide a Keap sync-health panel listing all assessments whose sync status is `failed` or `retrying`, with the last sync error.

#### Cross-Cutting Dashboard Behaviour

- **FR-041**: Every reporting view MUST support a user-selected date range and MUST default to a sensible recent window.
- **FR-042**: Headline funnel metrics MUST show the change versus the immediately preceding equal-length period.
- **FR-043**: Every chart and table MUST render a defined empty state when a filter yields no data.
- **FR-044**: All reporting MUST use a single, explicit reporting timezone for day boundaries and comparisons.
- **FR-045**: The dashboard MUST be usable on a desktop browser; responsive behaviour follows the project's standard breakpoints.
- **FR-046**: All dashboard UI/UX work MUST follow the project's UI/UX Pro Max workflow and design-token rules (per CLAUDE.md).

### Key Entities *(include if feature involves data)*

- **Dashboard User**: a stakeholder permitted to access the dashboard. Identified by an allowlisted email; authenticated via Supabase Auth; single shared admin role. No public sign-up.
- **Assessment Event**: a single anonymous funnel event. Attributes: ephemeral anonymous session id, event type (page view / started / question viewed / question answered / submitted), optional question id and position, timestamp, acquisition context (UTM source/medium/campaign/term/content, referrer domain, landing path) captured on the session's first event, device type, and an optional reference to the resulting `assessment_sessions` record on submission. Contains no PII. New table — does not exist today.
- **Assessment Session** *(existing — `assessment_sessions`)*: a completed assessment with PII, scores, archetype, UTM parameters, completion time, and Keap sync status. Read by the Leads and Outcomes views. Unchanged by this spec except as the reconciliation target for the submitted event.
- **Aggregate Stats** *(existing — `aggregate_stats`)*: daily anonymised aggregates (archetype distribution, score bands, average scores). May be reused by the Outcomes view as a performance optimisation.
- **Sign-In Audit Record**: a record of a dashboard authentication event — user, timestamp, outcome — for the security audit trail.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A stakeholder can sign in and answer "what is our visitor-to-lead conversion rate this month, and how does it compare to last month?" within 30 seconds of reaching the dashboard.
- **SC-002**: 100% of dashboard routes and data endpoints are inaccessible without authentication, verified by automated test.
- **SC-003**: Only allowlisted emails can obtain a dashboard session; no self-registration path exists.
- **SC-004**: The funnel reports every started session regardless of the visitor's cookie-consent choice, eliminating the GA4 consent blind spot.
- **SC-005**: A stakeholder can identify the single question with the highest drop-off, and see its time-on-question, in two clicks or fewer.
- **SC-006**: For any traffic source, a stakeholder can read its completion rate and lead-capture rate directly from the Acquisition view.
- **SC-007**: Funnel and drop-off counts match an independent count of seeded test sessions within ±1%.
- **SC-008**: Enabling event tracking causes no measurable regression to assessment page load or interaction performance, and a tracking-endpoint outage leaves the public assessment fully functional.
- **SC-009**: A stakeholder can locate every lead whose Keap sync failed, in one view, without writing a query.
- **SC-010**: A stakeholder can export a filtered lead list to CSV in under 10 seconds for a one-month range.
- **SC-011**: Reported metrics exclude bot and spam traffic, verified against seeded bot/honeypot test data.

## Out of Scope

- Editing assessment questions, recommendation copy, or CTA labels/URLs (content management) — candidate for a future spec.
- Scheduled email digests and automated anomaly alerting — explicitly deferred.
- Role tiers (Admin vs Viewer), per-user permissions, and multi-factor authentication — single shared role for now; MFA is a future hardening option.
- Cohort/retention analysis, individual-user journey replay, and A/B testing infrastructure.
- Pulling or reconciling data from the GA4 Data API.
- Editing or writing back to Keap from the dashboard (the dashboard observes sync status; it does not trigger or repair syncs).
- Geographic / IP-based location analytics.
- A native mobile app for the dashboard.

## Assumptions

- The dashboard is built as an authenticated area within the existing Next.js application (e.g. an `/admin` route group), reusing the project's Supabase project, deployment, and design system.
- Supabase Auth is the authentication provider; the stakeholder allowlist is small (single digits) and managed by a developer/administrator outside the public UI.
- The funnel counts **unique anonymous sessions**, not unique people; a retake or a return visit after tab close is a new session. Deduplication to unique people is out of scope.
- "Visitors" at the top of the funnel are counted from assessment-page-view events of the assessment flow, not from the wider marketing site.
- The anonymous session identifier is ephemeral (lives for the browser session only) and is not used to track people across visits or sites, keeping event tracking outside the scope of cookie-consent gating — subject to confirmation in a brief privacy review.
- Funnel events are anonymous and contain no PII; the existing CookieBot consent banner and GA4 integration remain unchanged and continue to operate alongside this first-party layer.
- The reporting timezone will be a single fixed timezone agreed with the client (assumed the client's primary operating timezone).
- Default reporting window is the last 30 days unless the stakeholder selects otherwise.
- Data volumes are modest (hundreds to low-thousands of sessions per month), so the dashboard can query Supabase directly without a separate analytics warehouse; `aggregate_stats` may be used to optimise heavier rollups if needed.
- The `assessment_submitted` event can be reconciled to its `assessment_sessions` row via a shared identifier passed through the submission flow; the exact mechanism is a planning/implementation detail.

## Dependencies

- **Existing**: Supabase project and `assessment_sessions` / `aggregate_stats` tables; the live assessment flow (specs 001–004); the Keap sync pipeline (for sync-status display only).
- **New instrumentation**: the public assessment flow must be modified to emit first-party funnel events to a new ingestion endpoint and a new `assessment_events` table. This is a prerequisite for User Stories 2–4 and should be sequenced first in planning.
- **Design**: dashboard screens to be designed in the Brand Guide Figma file using the mandated variable collections, per CLAUDE.md.
