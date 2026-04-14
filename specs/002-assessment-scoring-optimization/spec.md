# Feature Specification: Assessment Scoring Optimization

**Feature Branch**: `002-assessment-scoring-optimization`
**Created**: 2026-04-01
**Status**: Draft
**Input**: Upgrade the Worship Wheel assessment from 16 placeholder questions (4 options, single-select) to Charl's final 24-question scoring system with three question types, refined scoring algorithm, updated score bands, specific archetype matching criteria, and revised CTA ranges.

## Context

The existing assessment (spec `001-worship-wheel-assessment`) was built with 16 placeholder questions — 2 per element, all single-select with 4 options scored 1/4/7/10. Charl has now delivered the **final question bank and scoring algorithm** (`docs/Worship Wheel Assessment - Questions & Scoring Algorithm.docx`), which significantly expands and refines the assessment mechanics. This spec captures all changes needed to implement the final system.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Answer Three Question Types Per Element (Priority: P1)

A worship guitarist takes the assessment and encounters three distinct question types for each of the 8 elements (24 questions total). For each element, they answer: (1) a **scenario question** presenting a realistic worship situation with 5 answer options, (2) a **capability checklist** where they select all items that apply from a list of escalating-difficulty skills, and (3) an **experience/confidence question** as a 5-point self-rating. The flow groups all three questions per element before moving to the next element.

**Why this priority**: This is the core change — the question format, count, and interaction model all change. Everything else (scoring, archetypes, CTAs) depends on answers being captured in this new format.

**Independent Test**: Can be fully tested by walking through the assessment and verifying that each element presents exactly 3 questions in the correct order (scenario → checklist → experience), that scenario/experience questions offer 5 options (single-select), and that checklists allow multiple selections.

**Acceptance Scenarios**:

1. **Given** a user starts the assessment, **When** they reach the first element (Fretboard), **Then** they see the scenario question first with 5 answer options (A–E).
2. **Given** a user completes the scenario question for an element, **When** they advance, **Then** they see the capability checklist for that same element with 6–12 selectable items.
3. **Given** a user views a capability checklist, **When** they interact with it, **Then** they can select multiple items (checkboxes, not radio buttons).
4. **Given** a user completes the checklist, **When** they advance, **Then** they see the experience/confidence question for the same element with 5 answer options.
5. **Given** a user completes all 3 questions for an element, **When** they advance, **Then** the next element's scenario question is displayed.
6. **Given** a user is on question 24 (Aural experience), **When** they answer, **Then** they proceed to the email gate (same as current flow).
7. **Given** a user is mid-assessment, **When** they navigate back, **Then** their previous answers (including checklist selections) are preserved.

---

### User Story 2 — Accurate Per-Element and Overall Scoring (Priority: P1)

After submitting their email, the system calculates scores using the final algorithm. Each element's score is the average of its 3 question scores, rounded to the nearest integer. Scenario and experience questions score based on the selected option (1, 3, 5, 7, or 10 points). Capability checklists score as the average of all checked items' point values (or 1 if nothing is checked). The overall score is the sum of all 8 element scores (range 8–80, also shown as a percentage). A balance/roundness score measures how even the wheel is using the inverted standard deviation formula.

**Why this priority**: Scoring accuracy is critical — it drives the results display, archetype matching, recommendations, and CTA selection. If scoring is wrong, everything downstream is wrong.

**Independent Test**: Can be tested by submitting known answer combinations and verifying that element scores, overall score, percentage, and balance score match expected values from the scoring algorithm document.

**Acceptance Scenarios**:

1. **Given** a user selects option C (5 pts) for a scenario question, **When** scoring is calculated, **Then** that question contributes 5 points to the element average.
2. **Given** a user checks items worth 2, 5, and 7 points on a capability checklist, **When** scoring is calculated, **Then** that question's score is (2+5+7)/3 = 4.67.
3. **Given** a user checks no items on a capability checklist, **When** scoring is calculated, **Then** that question's score defaults to 1.
4. **Given** element question scores of 5, 4.67, and 7, **When** the element score is calculated, **Then** the element score is round((5+4.67+7)/3) = round(5.56) = 6.
5. **Given** all 8 element scores are calculated, **When** the overall score is displayed, **Then** it equals the sum of all 8 element scores and the percentage equals (overall/80)×100.
6. **Given** element scores [4, 4, 4, 4, 4, 4, 4, 4], **When** the balance score is calculated, **Then** it equals 10 (perfect roundness — SD = 0).
7. **Given** element scores [10, 1, 1, 1, 1, 1, 1, 1], **When** the balance score is calculated, **Then** the balance score approaches 1 (maximum unevenness).
8. **Given** any set of element scores, **When** the balance score is calculated, **Then** it uses the formula: Balance = 10 − (SD / 3.18 × 9), clamped to range 1–10.

---

### User Story 3 — Profile Archetype Matching (Priority: P2)

Based on the user's element scores, the system assigns a profile archetype using specific matching criteria. Each archetype has defined score conditions. The system evaluates archetypes in priority order and assigns the first match. The archetype is displayed on the results page with a personalised message.

**Why this priority**: Archetypes make results feel personal and actionable. They depend on accurate scoring (P1) but are important for engagement and shareability.

**Independent Test**: Can be tested by submitting assessments with score profiles designed to trigger each archetype and verifying the correct match and message.

**Acceptance Scenarios**:

1. **Given** scores where HM ≥ 5, RH ≥ 4, and all other elements ≤ 4, **When** the archetype is determined, **Then** the user is labelled "The Campfire Strummer" with message: "You've got a solid foundation — let's expand your vocabulary and unlock the full neck."
2. **Given** scores where RH ≥ 7, TE ≥ 6, HM ≤ 4, and FB ≤ 4, **When** the archetype is determined, **Then** the user is labelled "The Rhythm Machine" with message: "Your groove is real — now let's expand your chord vocabulary and fretboard knowledge."
3. **Given** scores where TH ≥ 7, AU ≥ 6, TE ≤ 4, and HM ≤ 5, **When** the archetype is determined, **Then** the user is labelled "The Theory Head" with message: "You understand the music — now let's get your hands and ears to match your brain."
4. **Given** scores where max − min ≥ 5 (SD > 2.0) and overall ≥ 30, **When** the archetype is determined, **Then** the user is labelled "The Uneven Intermediate" with message: "The gaps between strong and weak areas are holding you back. Focused work on weakest areas transforms fastest."
5. **Given** scores where all elements ≤ 4 and SD ≤ 1.5, **When** the archetype is determined, **Then** the user is labelled "The Balanced Beginner" with message: "Great news — you have an even foundation. Everything will grow together."
6. **Given** scores where overall ≥ 55 and all elements ≥ 5, **When** the archetype is determined, **Then** the user is labelled "The Almost-There Player" with message varies (personalised refinement guidance).
7. **Given** a score profile that does not match any specific archetype, **When** the archetype is determined, **Then** a sensible fallback archetype is assigned based on the user's strongest element.

---

### User Story 4 — Updated Score Bands and CTA Mapping (Priority: P2)

Each element score maps to a named band (Formula → Foundation → Functional → Fluent → Flow) that appears in recommendations. The overall score maps to a CTA band that determines which WGS offering is promoted.

**Why this priority**: Score bands drive the recommendation language and CTAs drive business conversion. They depend on correct scoring but are essential for the tool's business value.

**Independent Test**: Can be tested by verifying that each element score maps to the correct band label and that overall scores trigger the correct CTA.

**Acceptance Scenarios**:

1. **Given** an element score of 1–2, **When** recommendations are generated, **Then** the band is labelled "Formula" with description "Just becoming aware."
2. **Given** an element score of 3–4, **When** recommendations are generated, **Then** the band is labelled "Foundation" with description "Early stages, some basics."
3. **Given** an element score of 5–6, **When** recommendations are generated, **Then** the band is labelled "Functional" with description "Can use in worship with effort."
4. **Given** an element score of 7–8, **When** recommendations are generated, **Then** the band is labelled "Fluent" with description "Smooth, minimal thought."
5. **Given** an element score of 9–10, **When** recommendations are generated, **Then** the band is labelled "Flow" with description "Automatic, fully internalized."
6. **Given** an overall score of 8–25 (≤31%), **When** the CTA is displayed, **Then** it promotes the Free Worship Wheel Training Video + email sequence.
7. **Given** an overall score of 26–40 (32–50%), **When** the CTA is displayed, **Then** it promotes the 90-Day Breakthrough Intensive.
8. **Given** an overall score of 41–55 (51–69%), **When** the CTA is displayed, **Then** it promotes the WGS Academy membership.
9. **Given** an overall score of 56–80 (70–100%), **When** the CTA is displayed, **Then** it promotes Advanced workshops & masterclasses.

---

### User Story 5 — Updated Progress Tracking (Priority: P2)

The progress bar reflects the new 24-question structure, showing the user's position within the assessment. Since questions are grouped by element, the progress indicator should communicate both the current element and overall progress.

**Why this priority**: The existing progress bar was built for 16 questions. It needs to be updated for 24 questions while maintaining the segmented-by-element design already implemented.

**Independent Test**: Can be tested by stepping through the assessment and verifying that the progress bar accurately reflects position (question X of 24), current element name, and percentage completion.

**Acceptance Scenarios**:

1. **Given** a user starts the assessment, **When** the first question loads, **Then** the progress bar shows "1 / 24" and 4% complete.
2. **Given** a user is on question 7 (Harmony Q1), **When** the progress bar renders, **Then** it shows the element badge as "Harmony" and the Fretboard and part of Harmony segments are filled.
3. **Given** a user completes all 24 questions, **When** the last question is answered, **Then** the progress bar shows 100% before transitioning to the email gate.

---

### User Story 6 — Results Loading Interstitial (Priority: P2)

After submitting their email, the user sees an intermediate "results loading" page before being redirected to the results page. This interstitial displays a circular progress indicator and an encouraging message (e.g., "Analysing your Worship Wheel..."), creating a brief perceived processing delay that makes the results feel more considered and valuable.

**Why this priority**: Marketing psychology — an instant result feels cheap; a brief perceived computation signals depth and credibility. This is a low-effort, high-impact UX enhancement.

**Independent Test**: Can be tested by submitting the email gate and verifying the interstitial appears with a spinner and message, then auto-redirects to the results page after a brief delay.

**Acceptance Scenarios**:

1. **Given** a user submits their email on the email gate, **When** the submission is processing, **Then** they see an interstitial page with a circular progress indicator and a message like "Analysing your Worship Wheel..."
2. **Given** the interstitial page is displayed, **When** results are ready, **Then** the page automatically transitions to the results page after a minimum display time of 2–4 seconds (so it never flashes away instantly even if the API responds fast).
3. **Given** the interstitial page is displayed, **When** the user views it, **Then** the design uses the existing dark theme and brand tokens (gold accent spinner), and the tone is encouraging — no anxiety-inducing language.
4. **Given** a slow network or server error, **When** the API call takes longer than expected, **Then** the interstitial remains visible until the response arrives (or shows a graceful error after a timeout).

---

### Edge Cases

- What happens when a user selects zero items on a capability checklist? → Score defaults to 1 for that question.
- What happens when a user's scores don't match any archetype? → A fallback archetype is assigned based on strongest element.
- What happens when multiple archetypes could match? → Archetypes are evaluated in a defined priority order; the first match wins.
- What happens when two elements are tied for weakest/strongest? → Both are included in the weakest/strongest lists (up to 3 maximum).
- What happens when all element scores are identical? → Balance score is 10 (perfect roundness), and the archetype logic handles even profiles.

## Requirements *(mandatory)*

### Functional Requirements

#### Question Structure

- **FR-001**: Assessment MUST contain exactly 24 questions — 3 per element (scenario, capability checklist, experience/confidence), across 8 elements.
- **FR-002**: Questions MUST be grouped by element — all 3 questions for one element are answered before moving to the next.
- **FR-003**: Element order MUST be: Fretboard, Harmony, Melody, Rhythm, Tone, Theory, Technique, Aural.
- **FR-004**: Scenario questions MUST present 5 answer options (A–E), each mapping to point values of 1, 3, 5, 7, or 10.
- **FR-005**: Capability checklists MUST allow multiple selections (select-all-that-apply). Each item has an assigned point value.
- **FR-006**: Experience/confidence questions MUST present 5 answer options (A–E), each mapping to point values of 1, 3, 5, 7, or 10.
- **FR-007**: All question text, answer options, and point values MUST match the content in the source document (`docs/Worship Wheel Assessment - Questions & Scoring Algorithm.docx`).
- **FR-008**: UI language MUST never use the words "fail" or "wrong answer." All language is encouraging and diagnostic.

#### Scoring Algorithm

- **FR-009**: Scenario and experience question scores MUST equal the point value of the selected option.
- **FR-010**: Capability checklist scores MUST equal the average (mean) of all checked items' point values. If no items are checked, the score MUST default to 1.
- **FR-011**: Each element score MUST equal the average of its 3 question scores, rounded to the nearest integer. All element scores are on a 1–10 scale.
- **FR-012**: Overall score MUST equal the sum of all 8 element scores (range 8–80).
- **FR-013**: Overall percentage MUST equal (overall score / 80) × 100.
- **FR-014**: Balance score MUST use the formula: Balance = 10 − (SD / 3.18 × 9), clamped to range 1–10, where SD is the standard deviation of the 8 element scores, and 3.18 is the maximum possible SD.
- **FR-015**: Balance score MUST be displayed as "Your Wheel Roundness: X.X/10."
- **FR-016**: Scoring MUST run server-side to prevent manipulation.

#### Score Bands

- **FR-017**: Element scores of 1–2 MUST be labelled "Formula" (Band 1) — "Just becoming aware."
- **FR-018**: Element scores of 3–4 MUST be labelled "Foundation" (Band 2) — "Early stages, some basics."
- **FR-019**: Element scores of 5–6 MUST be labelled "Functional" (Band 3) — "Can use in worship with effort."
- **FR-020**: Element scores of 7–8 MUST be labelled "Fluent" (Band 4) — "Smooth, minimal thought."
- **FR-021**: Element scores of 9–10 MUST be labelled "Flow" (Band 5) — "Automatic, fully internalized."

#### Profile Archetypes

- **FR-022**: System MUST evaluate archetype matching conditions in a defined priority order and assign the first match.
- **FR-023**: "The Campfire Strummer" MUST match when HM ≥ 5, RH ≥ 4, and all other elements ≤ 4.
- **FR-024**: "The Rhythm Machine" MUST match when RH ≥ 7, TE ≥ 6, HM ≤ 4, and FB ≤ 4.
- **FR-025**: "The Theory Head" MUST match when TH ≥ 7, AU ≥ 6, TE ≤ 4, and HM ≤ 5.
- **FR-026**: "The Uneven Intermediate" MUST match when max element − min element ≥ 5 (SD > 2.0) and overall score ≥ 30.
- **FR-027**: "The Balanced Beginner" MUST match when all elements ≤ 4 and SD ≤ 1.5.
- **FR-028**: "The Almost-There Player" MUST match when overall score ≥ 55 and all elements ≥ 5.
- **FR-029**: Each archetype MUST display its defined message on the results page.
- **FR-030**: A fallback archetype MUST be assigned if no specific archetype matches.

#### CTA Mapping

- **FR-031**: Overall score 8–25 (≤31%) MUST show CTA for Free Worship Wheel Training Video + email sequence.
- **FR-032**: Overall score 26–40 (32–50%) MUST show CTA for 90-Day Breakthrough Intensive.
- **FR-033**: Overall score 41–55 (51–69%) MUST show CTA for WGS Academy membership.
- **FR-034**: Overall score 56–80 (70–100%) MUST show CTA for Advanced workshops & masterclasses.

#### Results Loading Interstitial

- **FR-038**: After email gate submission, the system MUST display an interstitial page with a circular progress indicator before showing results.
- **FR-039**: The interstitial MUST remain visible for a minimum of 2 seconds, even if the API responds instantly, to create perceived processing effort.
- **FR-040**: The interstitial MUST display an encouraging message (e.g., "Analysing your Worship Wheel...") using the existing dark theme and brand tokens.
- **FR-041**: The interstitial MUST automatically transition to the results page once both the minimum display time has elapsed AND the API response is received.
- **FR-042**: If the API call fails or times out (>15 seconds), the interstitial MUST show a graceful error message with a retry option.

#### Data Storage

- **FR-035**: System MUST store all 24 question responses (including checklist selections) per session.
- **FR-036**: System MUST store per-element scores, overall score, balance score, and assigned archetype per session.
- **FR-037**: Email integration MUST tag the contact with score band, each element score, archetype, and lowest-scoring elements.

#### Future Considerations (Not in Scope)

- **Phase 3**: Embed short audio clips for the Aural element — ask user to identify chord quality by listening.
- **Phase 2+**: Retake comparison — show current results vs previous assessment.

### Key Entities

- **Question**: Element code, question type (scenario/checklist/experience), position within element, text, answer options with point values.
- **Answer (scenario/experience)**: Selected option key and its point value.
- **Answer (checklist)**: Array of selected item keys and their point values.
- **Element Score**: Derived from the average of 3 question scores, rounded to nearest integer (1–10).
- **Overall Score**: Sum of 8 element scores (8–80).
- **Balance Score**: Inverted standard deviation measure (1–10).
- **Profile Archetype**: Matched archetype key and display message.
- **Score Band**: Per-element label (Formula/Foundation/Functional/Fluent/Flow).
- **CTA Band**: Overall score range mapped to a WGS offering.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete the 24-question assessment in 3–5 minutes.
- **SC-002**: All element scores, overall scores, balance scores, and percentages are mathematically correct for any combination of answers.
- **SC-003**: Archetype matching is deterministic — the same score profile always produces the same archetype.
- **SC-004**: 100% of assessment completions result in a valid archetype assignment (no unhandled edge cases).
- **SC-005**: Capability checklists feel intuitive — users understand they can select multiple items without explicit instruction.
- **SC-006**: Score bands and CTA mappings match the ranges defined in the source document exactly.
- **SC-007**: The assessment completion rate remains comparable to or better than the previous 16-question version (no significant drop-off from adding 8 more questions).

## Assumptions

- The 24 questions and all answer text, point values, and scoring rules in Charl's document are final and approved.
- Question order within each element is fixed: scenario → capability checklist → experience/confidence.
- Element presentation order is fixed: FB → HM → ML → RH → TO → TH → TE → AU.
- The archetype evaluation priority order will be defined during implementation (likely: specific archetypes first, then broad pattern archetypes as fallback).
- The existing email gate, Keap integration, and results page structure remain unchanged — only the data flowing through them changes.
- The progress bar component (already upgraded in `001`) will be updated for 24 questions / 3 per segment.
