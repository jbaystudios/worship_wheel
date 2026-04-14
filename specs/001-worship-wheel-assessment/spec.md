# Feature Specification: Worship Wheel Assessment Tool

**Feature Branch**: `001-worship-wheel-assessment`
**Created**: 2026-03-06
**Status**: Draft
**Input**: Interactive, web-based self-diagnosis quiz for worship guitarists that scores 8 musical dimensions, visualises results as a radar chart, captures leads via email gate, and integrates with Keap/Infusionsoft.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Complete the Assessment (Priority: P1)

A worship guitarist arrives at the Worship Wheel landing page (via social media, email, YouTube, or direct link). They see a clear value proposition ("Discover your worship guitar strengths and weaknesses in 5 minutes") and begin the assessment. They answer 16 scenario-based questions presented one at a time with a progress bar. Each question describes a real-world worship scenario with 4 answer options representing different skill levels. After completing all questions, the user is prompted to enter their name and email address to receive their results.

**Why this priority**: This is the core experience. Without a working assessment flow, nothing else matters. It also contains the lead-capture moment, which is the primary business objective.

**Independent Test**: Can be fully tested by navigating to the landing page, clicking "Start", answering all 16 questions, and submitting name/email. Delivers value by providing the complete quiz experience and capturing a lead.

**Acceptance Scenarios**:

1. **Given** a user on the landing page, **When** they click the start button, **Then** the first question is displayed with a progress bar showing 1/16.
2. **Given** a user viewing a question, **When** they select an answer, **Then** the next question is displayed and the progress bar advances.
3. **Given** a user on the last question, **When** they select an answer, **Then** the email capture form is displayed (not the results).
4. **Given** the email capture form, **When** the user enters a valid name and email and submits, **Then** the results page is displayed.
5. **Given** the email capture form, **When** the user submits without a valid email, **Then** a validation message is shown and submission is blocked.
6. **Given** a user mid-assessment, **When** they navigate back in the browser, **Then** they return to the previous question with their previous answer preserved.

---

### User Story 2 - View Personalised Results (Priority: P1)

After submitting their email, the user sees their personalised Worship Wheel results page. This includes an animated radar/spider chart plotting their scores across all 8 elements, numerical scores for each element (1-10), an overall score (out of 80 and as a percentage), a balance/roundness score indicating how even their wheel is, and visual highlighting of their strongest and weakest elements.

**Why this priority**: The results visualisation is the "wow moment" that makes the tool shareable and memorable. It's also the payoff for completing the quiz -- without it, the email capture feels hollow.

**Independent Test**: Can be tested by completing the assessment and verifying that the radar chart renders correctly with accurate scores, that the overall and balance scores are mathematically correct, and that strengths/weaknesses are correctly identified.

**Acceptance Scenarios**:

1. **Given** a completed assessment, **When** the results page loads, **Then** a radar chart is displayed with 8 axes (FB, HM, ML, RH, TO, TH, TE, AU) plotted with the user's scores.
2. **Given** a completed assessment, **When** the results page loads, **Then** each element displays its name, code, and numerical score (1-10).
3. **Given** element scores, **When** the overall score is calculated, **Then** it equals the sum of all 8 element scores (range 8-80) and is also shown as a percentage.
4. **Given** element scores, **When** the balance score is calculated, **Then** it uses the inverted standard deviation formula (Balance = 10 - (SD / 3.18 x 9), clamped 1-10) where a perfectly even wheel = 10.
5. **Given** results are displayed, **When** the user views the page, **Then** the top 2-3 weakest elements are visually highlighted as priority growth areas.
6. **Given** results are displayed, **When** the user views the page, **Then** the top 2-3 strongest elements are visually highlighted as strengths.

---

### User Story 3 - Receive Personalised Recommendations (Priority: P2)

Below the results chart, the user sees tailored recommendations based on their score profile. This includes guidance for their weakest areas (why it matters and what to do), a suggested priority order for improvement, a profile archetype label (e.g., "The Rhythm Player", "The Campfire Strummer") with a personalised message, and calls to action linking to relevant WGS resources based on their overall score band.

**Why this priority**: Recommendations convert the diagnosis into actionable next steps and drive users toward WGS offerings. Important for business value but depends on the results engine (P1) being in place first.

**Independent Test**: Can be tested by completing assessments with different score profiles and verifying that recommendations change appropriately, archetype labels match the profile, and CTAs correspond to the correct score bands.

**Acceptance Scenarios**:

1. **Given** a results page, **When** the user scrolls to recommendations, **Then** their top 2-3 weakest elements are listed with an explanation and suggested action.
2. **Given** a results page, **When** recommendations are generated, **Then** each weak element's recommendation corresponds to the correct score band (1-2: Beginner, 3-4: Developing, 5-6: Functional, 7-8: Fluent, 9-10: Flow).
3. **Given** a user's score profile, **When** the archetype is determined, **Then** one of the defined profile types is displayed with a personalised message (e.g., "The Rhythm Player", "The Theory Head", "The Campfire Strummer", "The Balanced Beginner", "The Uneven Intermediate").
4. **Given** an overall score below 30, **When** the CTA is displayed, **Then** it links to the free Worship Wheel Training Video.
5. **Given** an overall score between 30-50, **When** the CTA is displayed, **Then** it links to the 90-Day Challenge.
6. **Given** an overall score between 50-65, **When** the CTA is displayed, **Then** it links to the WGS Academy membership.
7. **Given** an overall score above 65, **When** the CTA is displayed, **Then** it links to advanced workshops or masterclass content.

---

### User Story 4 - Lead Capture and Email Delivery (Priority: P2)

When the user submits their email, a contact is created or updated in Keap/Infusionsoft via the REST API. The contact is tagged with their overall score band, individual element scores, and identified weak areas. An automated email sequence is triggered delivering their results summary and follow-up content tailored to their weakest areas.

**Why this priority**: Lead capture is the business purpose of the tool. Without ESP integration, the assessment generates no leads. Ranked P2 because the assessment and results (P1) must work first, but this is critical for launch.

**Independent Test**: Can be tested by completing an assessment with a test email and verifying that the contact appears in Keap with correct tags and scores, and that the automated email sequence is triggered.

**Acceptance Scenarios**:

1. **Given** a user submits their email, **When** the contact does not exist in Keap, **Then** a new contact is created with name, email, overall score, element scores, and weakness tags.
2. **Given** a user submits their email, **When** the contact already exists in Keap, **Then** the existing contact is updated with the latest assessment scores and tags.
3. **Given** a contact is created/updated, **When** tags are applied, **Then** tags include: overall score band (e.g., "WW: 30-50"), weakest elements (e.g., "WW-Weak: Aural"), and a general assessment tag (e.g., "WW: Completed").
4. **Given** a contact is tagged, **When** the automation trigger fires, **Then** an email sequence is initiated delivering their results and follow-up content.

---

### User Story 5 - Retake the Assessment (Priority: P3)

A user who has previously completed the assessment can return and retake it. No login is required. They complete the same 16 questions and submit their email again. Their Keap contact is updated with the new scores (latest wins). No historical comparison is shown in this phase.

**Why this priority**: Retakes support ongoing engagement and re-entry into the WGS funnel. Lower priority because it requires no additional UI -- the user simply visits the landing page again.

**Independent Test**: Can be tested by completing the assessment twice with the same email and verifying that the Keap contact reflects the latest scores only.

**Acceptance Scenarios**:

1. **Given** a user who has previously completed the assessment, **When** they visit the landing page, **Then** they can start a new assessment with no barriers or login required.
2. **Given** a returning user completes the assessment, **When** they submit the same email, **Then** their Keap contact is updated with the new scores (not duplicated).

---

### User Story 6 - Share Results (Priority: P3)

After viewing their results, the user has the option to share their Worship Wheel on social media. A shareable image or link is generated showing their radar chart and overall score.

**Why this priority**: Social sharing drives organic traffic and new leads. It's a growth multiplier but not essential for the core assessment experience.

**Independent Test**: Can be tested by completing an assessment, clicking the share button, and verifying that a shareable asset (image or link) is generated with the correct scores.

**Acceptance Scenarios**:

1. **Given** a results page, **When** the user clicks a share button, **Then** a shareable image of their Worship Wheel radar chart is generated.
2. **Given** a shareable image, **When** shared on social media, **Then** it displays the user's radar chart, overall score, and a link back to the assessment landing page.

---

### Edge Cases

- What happens when a user closes the browser mid-assessment and returns later? Assumption: progress is not persisted across sessions in MVP. The user starts over.
- What happens when the Keap API is unavailable at the moment of submission? The results page must still be shown to the user. The API call should be retried or queued, and the failure must not block the user experience.
- What happens when a user enters an email that is already in Keap with different data? The contact is updated (not duplicated) with the latest assessment scores.
- What happens when all 8 element scores are identical (e.g., all 5s)? The balance score is 10 (perfect balance) and the archetype is "The Balanced Beginner" or similar. No weakest elements are highlighted; instead, a message encourages overall growth.
- What happens when a user selects the same answer for every question? The scores are calculated normally. The system does not flag or prevent this.
- What happens on very slow mobile connections? The assessment must remain functional. Questions should load progressively without requiring all assets upfront.

## Requirements *(mandatory)*

### Functional Requirements

**Landing Page**

- **FR-001**: System MUST display a landing page with a clear value proposition, description of what the assessment measures, estimated completion time (5 minutes), and a prominent call-to-action button to start.
- **FR-002**: Landing page MUST be accessible at the subdomain `worshipwheel.worshipguitarskills.com`.

**Assessment Flow**

- **FR-003**: System MUST present 16 questions, 2 per element, in a fixed order grouped by element (FB, HM, ML, RH, TO, TH, TE, AU).
- **FR-004**: Each question MUST display the question text and 4 answer options, each representing a different skill level.
- **FR-005**: System MUST display a progress bar showing the user's position in the assessment (e.g., "Question 3 of 16").
- **FR-006**: System MUST allow users to navigate back to previous questions and change their answers.
- **FR-007**: System MUST present questions one at a time in a single-page progressive format (no full page reloads).

**Scoring**

- **FR-008**: System MUST calculate each element's score as the average of its 2 question scores, rounded to the nearest whole number (range 1-10).
- **FR-009**: System MUST calculate the overall score as the sum of all 8 element scores (range 8-80), also expressed as a percentage.
- **FR-010**: System MUST calculate a balance score using the formula: Balance = 10 - (SD / 3.18 x 9), clamped to the range 1-10, where SD is the standard deviation of the 8 element scores.
- **FR-011**: Scoring MUST be performed server-side to prevent client-side manipulation.
- **FR-012**: All questions MUST be equally weighted (no multipliers in MVP).

**Email Gate**

- **FR-013**: System MUST display an email capture form after the final question and before showing results.
- **FR-014**: The email form MUST collect the user's first name and email address.
- **FR-015**: System MUST validate that a properly formatted email address is provided before allowing submission.
- **FR-016**: System MUST not display results until a valid email is submitted.

**Results Visualisation**

- **FR-017**: System MUST display an animated radar/spider chart with 8 axes representing the Worship Wheel elements.
- **FR-018**: System MUST display numerical scores (1-10) alongside each element label on the chart.
- **FR-019**: System MUST display the overall score (raw and percentage) and the balance score prominently.
- **FR-020**: System MUST visually highlight the user's top 2-3 strongest and weakest elements using colour differentiation.

**Recommendations**

- **FR-021**: System MUST display personalised recommendations below the results chart, addressing the user's top 2-3 weakest areas.
- **FR-022**: System MUST map each element score to a score band (1-2: Beginner, 3-4: Developing, 5-6: Functional, 7-8: Fluent, 9-10: Flow) and display the corresponding recommendation.
- **FR-023**: System MUST identify and display a profile archetype based on the user's score pattern using a pattern-matching approach with balance-based fallback. The system first checks for dominant element cluster patterns (e.g., RH is highest by 3+ points = "The Rhythm Player"; TH and HM are the top 2 = "The Theory Head"; HM and RH are above 5 but remaining elements are below 4 = "The Campfire Strummer"). If no specific pattern matches, the system falls back to balance-based classification: high balance score + low overall = "The Balanced Beginner"; low balance score + mixed highs/lows = "The Uneven Intermediate". Minimum 5 archetypes, extensible for future additions.
- **FR-024**: System MUST display a primary CTA based on overall score: below 30 = Free Training, 30-50 = 90-Day Challenge, 50-65 = Academy Membership, above 65 = Advanced Workshops.
- **FR-025**: Recommendation content MUST be configurable without code changes (stored in a configuration file or database).
- **FR-026**: All placeholder recommendation content MUST be clearly marked and tracked in a dedicated placeholder content register for future replacement.

**Keap/Infusionsoft Integration**

- **FR-027**: System MUST create or update a contact in Keap via REST API upon email submission.
- **FR-028**: System MUST tag the Keap contact with: overall score band, individual element scores, weakest elements, and an assessment-completed tag.
- **FR-029**: System MUST trigger an automated email sequence in Keap upon contact creation/update.
- **FR-030**: Keap API failures MUST NOT block the user from viewing their results. Failures must be logged and retried.

**Social Sharing**

- **FR-031**: System MUST provide a share button on the results page.
- **FR-032**: System MUST generate a shareable image or link containing the user's radar chart and overall score.
- **FR-033**: Shared content MUST include the unique results URL so recipients can view the sharer's Worship Wheel.

**Results Persistence**

- **FR-034**: System MUST generate a unique result ID for each completed assessment and persist the full session data (answers, scores, archetype, timestamp) in Supabase.
- **FR-035**: System MUST provide a unique, shareable results URL (e.g., `/results/{result_id}`) that displays the full results page for that assessment.
- **FR-035A**: The results URL MUST be included in the Keap follow-up email so users can return to their results.
- **FR-035B**: Results URLs MUST remain accessible indefinitely (no expiry in MVP).

**Retakes**

- **FR-035C**: System MUST allow any user to retake the assessment without login or cooldown.
- **FR-035D**: On retake with an existing email, the Keap contact MUST be updated with the latest scores (not duplicated). Each retake generates a new results URL; previous results remain accessible.

**Analytics & Tracking (GA4 + DataLayer)**

- **FR-036**: System MUST integrate with a dedicated GA4 property via Google Tag Manager (GTM) using DataLayer events.
- **FR-037**: System MUST store anonymised aggregate scoring data for content strategy insights.
- **FR-038A**: System MUST push the following DataLayer events at each stage of the user journey to enable full funnel visualisation in GA4:

  | Event Name | Trigger Point | DataLayer Parameters |
  |---|---|---|
  | `page_view` | Landing page loads | `page_title`, `utm_source`, `utm_medium`, `utm_campaign`, `utm_content` |
  | `assessment_start` | User clicks "Start" button | `event_category: engagement` |
  | `question_answered` | User selects an answer | `question_number` (1-16), `element_code` (FB/HM/ML/RH/TO/TH/TE/AU), `question_position` (1-2 within element) |
  | `element_completed` | Both questions for an element are answered | `element_code`, `element_name` |
  | `assessment_completed` | User answers the final question (before email gate) | `completion_time_seconds`, `questions_answered` (always 16 for MVP) |
  | `email_gate_viewed` | Email capture form is displayed | `event_category: conversion` |
  | `email_submitted` | User submits valid name and email | `event_category: conversion` |
  | `results_viewed` | Results page renders with scores | `overall_score`, `overall_percentage`, `balance_score`, `profile_archetype`, `weakest_element`, `strongest_element` |
  | `recommendation_viewed` | User scrolls to recommendations section | `event_category: engagement` |
  | `cta_clicked` | User clicks a recommendation CTA | `cta_type` (free_training / 90_day_challenge / academy / advanced), `overall_score_band` |
  | `share_initiated` | User clicks the share button | `share_method` (copy_link / twitter / facebook / etc.) |
  | `share_completed` | Share action is confirmed/completed | `share_method` |

- **FR-038B**: All DataLayer events MUST follow GA4 recommended event naming conventions (snake_case, no spaces).
- **FR-038C**: System MUST support UTM parameter capture (`utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`) from the landing page URL and persist them through the session for attribution.
- **FR-038D**: System MUST push an `assessment_abandoned` event if the user leaves the page mid-assessment (via `beforeunload` or `visibilitychange`), including `last_question_number` and `time_spent_seconds` as parameters.
- **FR-038E**: DataLayer events MUST NOT contain personally identifiable information (no name or email in event parameters). Only anonymised scores, element codes, and archetypes may be included.

**Privacy & Consent**

- **FR-038F**: System MUST integrate CookieBot as the cookie consent management platform.
- **FR-038G**: GA4 and GTM scripts MUST only load and fire after the user grants consent via CookieBot. Prior to consent, no tracking cookies may be set.
- **FR-038H**: The email capture form MUST include a consent checkbox (unchecked by default) confirming the user agrees to receive communications, with a link to the WGS privacy policy.
- **FR-038I**: System MUST respect CookieBot consent categories (necessary, statistics, marketing) and only activate the corresponding tracking scripts when each category is consented to.

**Spam & Abuse Protection**

- **FR-038J**: The email capture form MUST include a honeypot field — a hidden form field invisible to human users that, if filled in, causes the submission to be silently rejected.
- **FR-038K**: System MUST enforce server-side rate limiting on the email submission endpoint (maximum 5 submissions per IP address per hour).
- **FR-038L**: Rejected submissions (honeypot triggered or rate-limited) MUST be silently discarded — no error message that would help an attacker adjust their approach.

**Design & Brand**

- **FR-039**: The assessment MUST follow the WGS brand system: dark theme, gold accents, Montserrat typeface.
- **FR-040**: The design MUST be mobile-first and responsive, functioning correctly on devices from 375px to 1440px+ width.
- **FR-041**: The design MUST be created in Figma first, using existing WGS brand tokens and variables from the Brand Guide file, before any code implementation begins.

### Key Entities

- **Assessment Session**: A single instance of a user completing the quiz. Contains 16 answers, 8 element scores, an overall score, a balance score, a profile archetype, a timestamp, and a unique result ID. Persisted in Supabase and accessible via a unique results URL (e.g., `/results/abc123`).
- **Question**: A scenario-based question belonging to one of 8 elements. Contains question text, 4 answer options, and point values for each option. 16 total (2 per element).
- **Element**: One of 8 musical dimensions (FB, HM, ML, RH, TO, TH, TE, AU). Has a code, name, description, and a calculated score (1-10).
- **Score Band**: A classification of an element score into one of 5 levels (Beginner, Developing, Functional, Fluent, Flow) used to select recommendation content.
- **Profile Archetype**: A pattern-based classification of the user's overall score profile (e.g., "The Rhythm Player") used to generate a personalised summary message.
- **Recommendation**: A content block associated with an element and score band. Contains a message, suggested action, and CTA. 40 total needed (8 elements x 5 bands), using placeholders in MVP.
- **Lead**: A captured user (name + email) sent to Keap with assessment tags and scores.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 70% or more of users who start the assessment complete all 16 questions.
- **SC-002**: 60% or more of users who complete the assessment provide their email address.
- **SC-003**: Users complete the full assessment (landing page to results) in under 5 minutes on average.
- **SC-004**: The results page loads within 3 seconds of email submission on a standard mobile connection.
- **SC-005**: The assessment is fully functional on mobile devices (375px width and above) with no layout breakage or interaction failures.
- **SC-006**: Every email submitted results in a correctly tagged contact in Keap within 60 seconds (allowing for retry on transient failures).
- **SC-007**: Users who complete the Worship Wheel assessment convert to paid WGS offerings at a higher rate than general email subscribers (measured after 90 days of operation).
- **SC-008**: 10% or more of users who view their results use the social sharing feature.
- **SC-009**: Scoring calculations are deterministic -- the same 16 answers always produce the same element scores, overall score, balance score, and archetype.

## Clarifications

### Session 2026-03-06

- Q: Should results persist beyond the browser session, and what should Supabase store? → A: Option B — Each completed assessment gets a unique URL (e.g., `worshipwheel.worshipguitarskills.com/results/abc123`) stored in Supabase. Users can revisit via link from email or bookmark. Share links point to this URL. Individual session data (answers, scores, archetype) is persisted.

- Q: How should the system determine which archetype to assign? → A: Option B — Pattern-based matching with balance-based fallback. Check for dominant element cluster patterns first (e.g., RH highest by 3+ = Rhythm Player, TH+HM top 2 = Theory Head, HM+RH high but rest low = Campfire Strummer). Fall back to balance-based (high balance + low overall = Balanced Beginner, low balance + mixed = Uneven Intermediate) if no pattern matches.

- Q: How should privacy consent for GA4 tracking and email collection be handled? → A: CookieBot will be used as the cookie management platform. GA4 must only fire after CookieBot consent is granted. Email form must include consent checkbox and link to privacy policy.

- Q: How should the email submission endpoint be protected against bot/spam abuse? → A: Option C — Honeypot field (hidden form field that bots fill but humans don't) plus server-side rate limiting. No third-party CAPTCHA dependency.

## Assumptions

- The existing WGS Keap/Infusionsoft account has REST API access enabled and supports contact creation, tagging, and automation triggers via API.
- Keap API credentials (OAuth2 or API key) will be provided before development of the integration begins.
- The 16 questions for MVP will be selected (best 2 per element) from the 20 draft questions in the companion document. Final selection will be confirmed during planning.
- CTA destination URLs (Free Training, 90-Day Challenge, Academy Membership, Advanced Workshops) will be provided before launch, with placeholder URLs used during development.
- The WGS brand system in Figma (dark theme, gold accents, Montserrat, design tokens) is the authoritative source for all visual design decisions.
- Assessment progress is not persisted across browser sessions in MVP. If a user closes mid-quiz, they start over.
- No user authentication or accounts are required. The email address is the sole identifier.
- The tool will be English-only for MVP.
- Social sharing in MVP may be implemented as a basic stub (e.g., copy-link or simple share intent) rather than a fully rendered branded image. The shareable image generation can be enhanced in Phase 2.

## Placeholder Content Register

The following content blocks require replacement with final copy before or shortly after launch. Each item should be tracked as a content task:

| ID | Location | Description | Owner |
|---|---|---|---|
| PC-001 | Recommendations: FB, Band 1-2 | Fretboard recommendation for Beginner level | Charl |
| PC-002 | Recommendations: FB, Band 3-4 | Fretboard recommendation for Developing level | Charl |
| PC-003 | Recommendations: FB, Band 5-6 | Fretboard recommendation for Functional level | Charl |
| PC-004 | Recommendations: FB, Band 7-8 | Fretboard recommendation for Fluent level | Charl |
| PC-005 | Recommendations: FB, Band 9-10 | Fretboard recommendation for Flow level | Charl |
| PC-006 | Recommendations: HM, Band 1-2 | Harmony recommendation for Beginner level | Charl |
| PC-007 | Recommendations: HM, Band 3-4 | Harmony recommendation for Developing level | Charl |
| PC-008 | Recommendations: HM, Band 5-6 | Harmony recommendation for Functional level | Charl |
| PC-009 | Recommendations: HM, Band 7-8 | Harmony recommendation for Fluent level | Charl |
| PC-010 | Recommendations: HM, Band 9-10 | Harmony recommendation for Flow level | Charl |
| PC-011 | Recommendations: ML, Band 1-2 | Melody recommendation for Beginner level | Charl |
| PC-012 | Recommendations: ML, Band 3-4 | Melody recommendation for Developing level | Charl |
| PC-013 | Recommendations: ML, Band 5-6 | Melody recommendation for Functional level | Charl |
| PC-014 | Recommendations: ML, Band 7-8 | Melody recommendation for Fluent level | Charl |
| PC-015 | Recommendations: ML, Band 9-10 | Melody recommendation for Flow level | Charl |
| PC-016 | Recommendations: RH, Band 1-2 | Rhythm recommendation for Beginner level | Charl |
| PC-017 | Recommendations: RH, Band 3-4 | Rhythm recommendation for Developing level | Charl |
| PC-018 | Recommendations: RH, Band 5-6 | Rhythm recommendation for Functional level | Charl |
| PC-019 | Recommendations: RH, Band 7-8 | Rhythm recommendation for Fluent level | Charl |
| PC-020 | Recommendations: RH, Band 9-10 | Rhythm recommendation for Flow level | Charl |
| PC-021 | Recommendations: TO, Band 1-2 | Tone recommendation for Beginner level | Charl |
| PC-022 | Recommendations: TO, Band 3-4 | Tone recommendation for Developing level | Charl |
| PC-023 | Recommendations: TO, Band 5-6 | Tone recommendation for Functional level | Charl |
| PC-024 | Recommendations: TO, Band 7-8 | Tone recommendation for Fluent level | Charl |
| PC-025 | Recommendations: TO, Band 9-10 | Tone recommendation for Flow level | Charl |
| PC-026 | Recommendations: TH, Band 1-2 | Theory recommendation for Beginner level | Charl |
| PC-027 | Recommendations: TH, Band 3-4 | Theory recommendation for Developing level | Charl |
| PC-028 | Recommendations: TH, Band 5-6 | Theory recommendation for Functional level | Charl |
| PC-029 | Recommendations: TH, Band 7-8 | Theory recommendation for Fluent level | Charl |
| PC-030 | Recommendations: TH, Band 9-10 | Theory recommendation for Flow level | Charl |
| PC-031 | Recommendations: TE, Band 1-2 | Technique recommendation for Beginner level | Charl |
| PC-032 | Recommendations: TE, Band 3-4 | Technique recommendation for Developing level | Charl |
| PC-033 | Recommendations: TE, Band 5-6 | Technique recommendation for Functional level | Charl |
| PC-034 | Recommendations: TE, Band 7-8 | Technique recommendation for Fluent level | Charl |
| PC-035 | Recommendations: TE, Band 9-10 | Technique recommendation for Flow level | Charl |
| PC-036 | Recommendations: AU, Band 1-2 | Aural recommendation for Beginner level | Charl |
| PC-037 | Recommendations: AU, Band 3-4 | Aural recommendation for Developing level | Charl |
| PC-038 | Recommendations: AU, Band 5-6 | Aural recommendation for Functional level | Charl |
| PC-039 | Recommendations: AU, Band 7-8 | Aural recommendation for Fluent level | Charl |
| PC-040 | Recommendations: AU, Band 9-10 | Aural recommendation for Flow level | Charl |
| PC-041 | Archetype: The Rhythm Player | Profile message for rhythm-dominant players | Charl |
| PC-042 | Archetype: The Theory Head | Profile message for theory-dominant players | Charl |
| PC-043 | Archetype: The Campfire Strummer | Profile message for basic harmony/rhythm players | Charl |
| PC-044 | Archetype: The Balanced Beginner | Profile message for evenly low-scoring players | Charl |
| PC-045 | Archetype: The Uneven Intermediate | Profile message for mixed high/low scores | Charl |
| PC-046 | CTA: Free Training URL | Destination URL for score < 30 | Charl |
| PC-047 | CTA: 90-Day Challenge URL | Destination URL for score 30-50 | Charl |
| PC-048 | CTA: Academy Membership URL | Destination URL for score 50-65 | Charl |
| PC-049 | CTA: Advanced Workshops URL | Destination URL for score > 65 | Charl |
| PC-050 | Email Sequence | Keap automation sequence content (results email + follow-ups) | Charl |
