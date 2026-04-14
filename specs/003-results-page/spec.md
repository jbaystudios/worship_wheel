# Feature Specification: Worship Wheel Results Page

**Feature Branch**: `003-results-page`
**Created**: 2026-04-09
**Status**: Draft
**Input**: Build the Worship Wheel results page — the page users see after completing the 24-question assessment, displaying their radar chart, scores, archetype, and personalised CTA.

## Context

The assessment flow (spec 002) is complete: users answer 24 questions, submit their email, and see a loading interstitial. Currently the flow ends at a `console.log` — the results page does not exist yet. This spec covers building the results page from the approved Figma design (node 99:47) and wiring the redirect from the assessment flow.

For this first pass, results data flows directly from the API response via client state (sessionStorage). Supabase persistence for shareable URLs and page-refresh resilience will come in a follow-up spec.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — View My Assessment Results (Priority: P1)

After completing the 24-question assessment and submitting their email, the user is redirected to a results page that shows their Worship Wheel — a radar chart visualising their 8 element scores, an overall score summary, a per-element breakdown, and their profile archetype. The page gives the user a clear, encouraging picture of where they stand as a worship guitarist.

**Why this priority**: This is the core deliverable. Without the results page, the entire assessment has no payoff. Every other feature on this page (CTA, sharing) depends on the results being visible first.

**Independent Test**: Complete the assessment with a known answer set, submit email, and verify the results page displays the correct radar chart shape, overall score, balance score, all 8 element scores with correct band labels, and the correct archetype name and message.

**Acceptance Scenarios**:

1. **Given** a user completes the assessment and submits their email, **When** the API responds successfully, **Then** they are automatically redirected to `/results` and see their results page.
2. **Given** the results page loads, **When** the user views the hero section, **Then** they see a radar chart with 8 axes (FB, HM, ML, RH, TO, TH, TE, AU) and a filled polygon reflecting their element scores.
3. **Given** the results page loads, **When** the user views the score summary, **Then** they see three stat cards: Overall Score (X/80 with percentage), Balance (X.X out of 10), and Profile (archetype name).
4. **Given** the results page loads, **When** the user views the element breakdown, **Then** they see 8 horizontal bars, each showing: element name, band label (Formula/Foundation/Functional/Fluent/Flow), a proportional score bar, and the numeric score (1–10).
5. **Given** an element score of 5 or above, **When** the element row renders, **Then** the bar fill and text use the gold accent colour scheme.
6. **Given** an element score of 4 or below, **When** the element row renders, **Then** the bar fill and text use the amber/warning colour scheme.
7. **Given** the results page loads, **When** the user views the archetype section, **Then** they see "YOUR PROFILE" label, the archetype name (e.g., "The Uneven Intermediate"), the personalised message, and a video placeholder area.
8. **Given** any set of element scores, **When** the radar chart renders, **Then** the polygon shape accurately reflects the relative scores (higher scores extend further from centre).

---

### User Story 2 — See My Personalised Call to Action (Priority: P2)

Based on the user's overall score, the results page displays a CTA banner promoting the appropriate WGS offering. The CTA dynamically selects the correct offering tier and personalises the message with the user's score.

**Why this priority**: The CTA is the business conversion mechanism. It turns assessment insights into action. It depends on accurate scoring (P1) but is essential for the tool's commercial purpose.

**Independent Test**: Submit assessments with overall scores in each of the 4 CTA tiers and verify the correct offering is promoted with the correct message.

**Acceptance Scenarios**:

1. **Given** an overall score of 8–25, **When** the CTA banner renders, **Then** it promotes the "Free Worship Wheel Training Video" with a contextual message referencing the user's score.
2. **Given** an overall score of 26–40, **When** the CTA banner renders, **Then** it promotes the "90-Day Breakthrough Intensive."
3. **Given** an overall score of 41–55, **When** the CTA banner renders, **Then** it promotes the "WGS Academy" membership.
4. **Given** an overall score of 56–80, **When** the CTA banner renders, **Then** it promotes "Advanced workshops & masterclasses."
5. **Given** any CTA tier, **When** the banner renders, **Then** it includes a prominent action button with encouraging copy.

---

### User Story 3 — Share My Worship Wheel (Priority: P3)

The user can copy a link to their results or share it with their band/worship team. For this first pass, the "Copy Link" button copies the current page URL and the "Share" button triggers the Web Share API (with clipboard fallback).

**Why this priority**: Sharing drives organic traffic and band engagement. It depends on the results page existing (P1) but is not required for the core experience.

**Independent Test**: Click "Copy Link" and verify the URL is copied to the clipboard. Click "Share" and verify the Web Share API is triggered (or clipboard fallback on unsupported browsers).

**Acceptance Scenarios**:

1. **Given** a user is on the results page, **When** they click "Copy Link," **Then** the current page URL is copied to the clipboard and a brief confirmation appears (e.g., "Copied!").
2. **Given** a user is on the results page on a browser that supports the Web Share API, **When** they click "Share," **Then** the native share sheet opens with the page URL and a pre-filled message.
3. **Given** a user is on a browser without Web Share API support, **When** they click "Share," **Then** the URL is copied to the clipboard instead (same as "Copy Link").
4. **Given** a user views the share section, **When** they see the layout, **Then** there is a divider, descriptive text ("Share your Worship Wheel with your band or worship team"), and two buttons styled as secondary buttons.

---

### Edge Cases

- What happens when a user navigates directly to `/results` without completing the assessment? → The page shows a friendly message directing them to take the assessment, with a link to `/assessment`.
- What happens when the browser's sessionStorage is cleared mid-redirect? → Same empty-state handling as above.
- What happens when all 8 element scores are identical? → The radar chart forms a perfect octagon. Balance shows 10/10. This is a valid and visually clear state.
- What happens when one element is 10 and all others are 1? → The radar chart shows a single spike. This is correct and visually dramatic.
- What happens on mobile (375px)? → All sections stack vertically, stat cards stack from horizontal to vertical, radar chart scales down proportionally. Text remains readable.

## Requirements *(mandatory)*

### Functional Requirements

#### Results Page Layout

- **FR-001**: The results page MUST be accessible at the `/results` route.
- **FR-002**: The page MUST display a navbar with the WGS logo, consistent with all other pages.
- **FR-003**: The page MUST use the same dark theme and hero background image as the assessment pages.

#### Radar Chart

- **FR-004**: The hero section MUST display a radar chart with 8 axes corresponding to the 8 elements (Fretboard, Harmony, Melody, Rhythm, Tone, Theory, Technique, Aural).
- **FR-005**: Each axis MUST be labelled with the element's abbreviated code (FB, HM, ML, RH, TO, TH, TE, AU).
- **FR-006**: The chart MUST render a filled polygon connecting the user's 8 element scores, scaled proportionally from the centre (1) to the outer edge (10).
- **FR-007**: The chart MUST include concentric grid circles or rings to provide scale reference.
- **FR-008**: The radar chart MUST be rendered using Chart.js (react-chartjs-2), which is already installed as a project dependency.

#### Score Summary

- **FR-009**: Below the radar chart, the page MUST display three stat cards in a horizontal row (stacking vertically on mobile).
- **FR-010**: The first stat card MUST show "Overall Score" with the value as X/80 and the percentage below.
- **FR-011**: The second stat card MUST show "Balance" with the value as X.X and "out of 10" below.
- **FR-012**: The third stat card MUST show "Profile" with the archetype name (e.g., "Uneven Intermediate").

#### Element Breakdown

- **FR-013**: The page MUST display an "Element Breakdown" section with 8 rows, one per element.
- **FR-014**: Each row MUST show: element name (bold), band label (Formula/Foundation/Functional/Fluent/Flow), a horizontal score bar, and the numeric score.
- **FR-015**: The score bar fill width MUST be proportional to the element score (score / 10 × total bar width).
- **FR-016**: Elements with scores ≥ 5 MUST use the gold accent colour scheme (accent-500 border, accent-600 bar, accent-400 text for band label and score).
- **FR-017**: Elements with scores ≤ 4 MUST use the amber warning colour scheme (warning-400 text, warning-500 bar).

#### Archetype Card

- **FR-018**: The page MUST display an archetype card with "YOUR PROFILE" label, the archetype name as a heading, and the personalised message as body text.
- **FR-019**: The archetype card MUST include a video placeholder area with the text "Watch: Your personalised results explained." The video embed is not functional in this spec — it is a static placeholder.

#### CTA Banner

- **FR-020**: The page MUST display a CTA banner that dynamically selects the correct WGS offering based on the overall score range (8–25, 26–40, 41–55, 56–80).
- **FR-021**: The CTA banner MUST include a heading, a contextual description referencing the user's score, and a prominent action button.

#### Share Section

- **FR-022**: The page MUST display a share section with a divider, descriptive text, and two buttons: "Copy Link" and "Share."
- **FR-023**: "Copy Link" MUST copy the current page URL to the clipboard and show a brief confirmation.
- **FR-024**: "Share" MUST trigger the Web Share API where available, falling back to clipboard copy on unsupported browsers.

#### Data Flow

- **FR-025**: After the API submit response, the assessment page MUST store the results data in sessionStorage and redirect to `/results`.
- **FR-026**: The results page MUST read results data from sessionStorage on mount.
- **FR-027**: If no results data is found in sessionStorage, the page MUST display a friendly empty state directing the user to `/assessment`.

#### Responsive Design

- **FR-028**: The results page MUST be responsive, functioning correctly at 375px, 768px, 1024px, and 1440px viewports.
- **FR-029**: The radar chart MUST scale proportionally on smaller viewports without losing readability.
- **FR-030**: Score summary stat cards MUST stack vertically on mobile (< 768px).

### Key Entities

- **AssessmentResult**: The complete scoring output — element scores, overall score, percentage, balance, archetype, CTA band, weakest/strongest elements. Already defined in `src/types/index.ts`.
- **ElementScore**: Per-element score (1–10) with band label. Already defined.
- **Archetype**: Key, display name, and personalised message. Already defined.
- **CtaBand**: Score range with offering label and description. Already defined.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users see their complete results (radar chart, scores, archetype, CTA) within 1 second of the results page loading.
- **SC-002**: All 8 element scores, the overall score, balance score, and archetype displayed on the results page are mathematically correct and match the values returned by the scoring engine.
- **SC-003**: The CTA banner displays the correct offering for the user's score range in 100% of cases.
- **SC-004**: The radar chart polygon shape visually corresponds to the user's score profile — higher scores extend further from centre, lower scores stay closer.
- **SC-005**: The page is fully readable and functional at 375px viewport width.
- **SC-006**: Users can copy their results link to the clipboard with a single click.

## Assumptions

- The Figma design (node 99:47, "Results Page") is approved and final. The Priority Growth Areas section is intentionally hidden/deferred.
- Chart.js and react-chartjs-2 are already installed project dependencies.
- Results data is passed via sessionStorage for this spec. Supabase-backed persistence (enabling shareable URLs that survive browser sessions) is deferred to a follow-up spec.
- The video placeholder in the archetype card is static — no video embed functionality in this spec.
- All design tokens, colour variables, and spacing values match those extracted from the Figma inspection documented during spec 002.
- The assessment flow redirect (from loading interstitial to results page) replaces the current `console.log` stub.
