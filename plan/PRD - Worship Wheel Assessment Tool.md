# Worship Wheel Assessment Tool — Product Requirements Document

**Version**: 1.0
**Date**: 6 March 2026
**Prepared by**: Derick Strydom
**For review by**: Charl Coetzee

> **Historical artefact — original scope.** This is the seed document that kicked off the project. It reflects the initial MVP scope and is intentionally left as-is. The product has since developed beyond it — most notably the assessment now has **24 questions** (3 per element), expanded from the 16 described here (see `specs/002-assessment-scoring-optimization`). For current state, see `CLAUDE.md`, `spec.md`, and `project-management/`.

---

## 1. What Are We Building?

An interactive online quiz that turns the Worship Wheel concept into a self-service digital tool. A worship guitarist visits the website, answers 16 questions about their playing, enters their email, and immediately sees a personalised Worship Wheel radar chart showing their strengths and weaknesses across the 8 elements of the WGS Formula.

The tool serves two purposes:
1. **For the guitarist**: A genuine, free diagnostic that shows them exactly where to focus their practice
2. **For WGS**: A lead-generation machine that captures qualified email addresses and funnels them toward WGS courses and the 90-Day Challenge

---

## 2. How It Works (User Journey)

### Step 1: Landing Page
The user arrives at **worshipwheel.worshipguitarskills.com** (a dedicated subdomain). They see a clear headline — something like *"Discover your worship guitar strengths and weaknesses in 5 minutes"* — a brief description of the 8 elements, and a big "Start Assessment" button.

### Step 2: The Assessment (16 Questions)
Questions appear one at a time with a progress bar. Each question describes a real-world worship scenario (e.g., *"If a worship leader calls out a 1-5-6-4 in E-flat, what happens?"*) with 4 answer options ranging from beginner to advanced. Questions are grouped by element — 2 per element, covering all 8 dimensions.

The user can go back and change previous answers. The whole thing takes about 3-5 minutes.

### Step 3: Email Gate
After the last question, the user sees a form asking for their **first name** and **email address**. There's a consent checkbox for receiving communications and a link to the privacy policy. They must enter their email to see their results — this is the lead capture moment.

### Step 4: Results Page
The user sees their personalised Worship Wheel:
- An **animated radar chart** plotting their scores across all 8 elements
- **Numerical scores** (1-10) for each element
- An **overall score** (out of 80, also shown as a percentage)
- A **balance score** showing how "round" their wheel is
- Their **top strengths** highlighted in one colour
- Their **weakest areas** highlighted in another colour
- A **profile archetype** (e.g., "The Rhythm Player", "The Campfire Strummer") with a personalised message

### Step 5: Recommendations
Below the chart, the user sees:
- Specific recommendations for their 2-3 weakest areas (what each element is, why it matters, what to work on)
- A priority order for improvement (weakest first)
- A **call to action** linking to the appropriate WGS offering based on their overall score:
  - Score below 30 → Free Worship Wheel Training Video
  - Score 30-50 → 90-Day Challenge
  - Score 50-65 → WGS Academy Membership
  - Score above 65 → Advanced Workshops / Masterclass

### Step 6: Share & Return
The user can share their results on social media (a branded image of their radar chart is generated). They can also bookmark their unique results URL or access it from the follow-up email.

---

## 3. The 16 Questions (MVP)

Selected from the 20 draft questions in the companion document — the best 2 per element:

| # | Element | Question Summary |
|---|---------|-----------------|
| 1 | Fretboard | How many places can you find a G note on the neck? |
| 2 | Fretboard | How much of the fretboard do you use when playing worship songs? |
| 3 | Harmony | Describe your current chord vocabulary |
| 4 | Harmony | What happens when a worship leader calls a 1-5-6-4 in E-flat? |
| 5 | Melody | What do you do in gaps between vocal phrases? |
| 6 | Melody | How would you describe your ability to play single-note melodies? |
| 7 | Rhythm | How well do you stay in time with a worship song recording? |
| 8 | Rhythm | How varied are your strumming/picking patterns? |
| 9 | Tone | Describe the range of guitar tones you can create for worship |
| 10 | Tone | How comfortable are you with effects pedals? |
| 11 | Theory | Do you know what a 1-4-5-6 in the key of G means? |
| 12 | Theory | How well do you understand how chords are built? |
| 13 | Technique | How confident are you that your fingers will do what you want? |
| 14 | Technique | Which techniques can you do cleanly and consistently? |
| 15 | Aural | Can you tell if a chord is major, minor, or suspended by ear? |
| 16 | Aural | How quickly can you learn a new worship song by ear? |

Each question has 4 answer options worth 1-10 points. The element score is the average of its 2 questions. These can be refined based on user testing after launch.

---

## 4. Scoring

- **Element scores**: Average of 2 question scores, rounded to nearest whole number (1-10)
- **Overall score**: Sum of all 8 element scores (range 8-80), also expressed as a percentage
- **Balance score**: Measures how "round" the wheel is. A perfectly even wheel scores 10; a very lopsided wheel scores closer to 1
- **All questions equally weighted** in MVP (no multipliers)
- **Scoring happens on the server** (not in the browser) to prevent manipulation

---

## 5. Profile Archetypes

Based on the user's score pattern, they receive one of these labels:

| Archetype | Pattern | Example Message |
|-----------|---------|----------------|
| The Rhythm Player | Rhythm is dominant (highest by 3+ points) | "You've got great groove — now let's unlock the rest of the neck so you have more to groove with." |
| The Theory Head | Theory and Harmony are the top 2 | "You understand the music — now let's get your hands and ears to match your brain." |
| The Campfire Strummer | Harmony and Rhythm above 5, rest below 4 | "You've got a solid starting point. Let's expand your vocabulary and unlock the full fretboard." |
| The Balanced Beginner | All scores roughly even, overall low | "Great news — you have an even foundation to build on." |
| The Uneven Intermediate | Some areas 7-8, others 2-3 | "You have real strengths, but the gaps are holding you back." |

More archetypes can be added over time.

---

## 6. What Happens with the Lead

When a user submits their email:

1. **Contact created/updated in Keap** via API with:
   - Name and email
   - Overall score, balance score, all 8 element scores
   - Archetype name
   - Weakest elements
   - Link to their unique results page
2. **Tags applied** in Keap:
   - "WW: Completed" (general assessment tag)
   - Score band tag (e.g., "WW: 30-50")
   - Weakness tags (e.g., "WW-Weak: Aural", "WW-Weak: Melody")
3. **Automated email sequence triggered** via Keap tag-based automation:
   - Email 1: Your Worship Wheel results (with link back to results page)
   - Follow-up emails: Tailored content based on weakest areas + CTA to relevant offering

If the Keap API is temporarily down, the user still sees their results immediately. The sync retries automatically in the background.

---

## 7. Analytics & Tracking

A dedicated **GA4 property** with **Google Tag Manager** tracks every step of the funnel:

| Step | Event | What it tells us |
|------|-------|-----------------|
| Land on page | `page_view` | Traffic volume and source |
| Click "Start" | `assessment_start` | Interest/engagement rate |
| Answer each question | `question_answered` | Per-question drop-off points |
| Finish all questions | `assessment_completed` | Completion rate (target: 70%+) |
| See email form | `email_gate_viewed` | How many reach the gate |
| Submit email | `email_submitted` | Email conversion rate (target: 60%+) |
| View results | `results_viewed` | Scores and archetypes distribution |
| Scroll to recommendations | `recommendation_viewed` | Engagement depth |
| Click CTA | `cta_clicked` | Which offerings attract interest |
| Leave mid-quiz | `assessment_abandoned` | Where people drop off and why |

All tracking respects **CookieBot** consent — GA4 only fires after the user accepts cookies.
UTM parameters are captured from the landing page URL for campaign attribution.

---

## 8. Privacy & Security

- **CookieBot** manages cookie consent (required before any tracking fires)
- **Email consent checkbox** (unchecked by default) with link to WGS privacy policy
- **No personally identifiable information** in analytics events (no names or emails — only anonymised scores)
- **Honeypot field** + rate limiting protects the email form from spam bots
- **Results pages are public** via their unique URL (so they can be shared and bookmarked)

---

## 9. Design

The tool follows the existing WGS brand:
- **Dark theme** with gold accents
- **Montserrat** typeface
- Mobile-first, responsive (375px to 1440px+)
- Modern, clean, professional but approachable
- **Design will be created in Figma first** using the existing Brand Guide tokens and variables

---

## 10. What Charl Needs to Provide

### Before Development Begins (Sign-off Required)

| Item | Count | Description |
|------|-------|-------------|
| Question sign-off | 1 | Review and approve the 16 selected questions (see Section 3). Confirm wording, answer options, and point values are accurate and appropriately calibrated for the target audience. Development cannot proceed until questions are signed off. |

### Before Launch (Required)

| Item | Count | Description |
|------|-------|-------------|
| CTA URLs | 4 | Links to Free Training, 90-Day Challenge, Academy Membership, Advanced Workshops |
| Keap custom fields & tags | 1 | Create custom fields in Keap (scores, archetype, results URL) and pre-create tags. API credentials are already available. |
| Privacy policy | 1 | Privacy policy page URL for the consent checkbox |

### Before or Shortly After Launch (Can Use Placeholders Initially)

| Item | Count | Description |
|------|-------|-------------|
| Element recommendations | 40 | 2-3 sentences per element per score band (8 elements x 5 bands). "Your Fretboard score is at the Developing level. This means..." + what to work on + link to relevant resource. |
| Archetype messages | 5 | Personalised message for each profile type. Can be expanded from the examples in the PRD. |
| Email sequence content | 1 | Content for the Keap automation: results email + 2-3 follow-up emails tailored to weak areas. |

A full register of all 50 placeholder content items is tracked in the technical spec (Placeholder Content Register, PC-001 through PC-050).

---

## 11. What's NOT in MVP (Deferred)

| Feature | Phase | Why deferred |
|---------|-------|-------------|
| Audio-based questions (listen and identify chords) | Phase 3 | Adds significant complexity; text questions are sufficient for launch |
| Historical retake comparison ("Your wheel 3 months ago vs now") | Phase 2 | Requires user accounts; MVP allows retakes but doesn't show history |
| Per-element recommendations (instead of per-band) | Phase 2 | 40 content blocks needed; MVP uses per-band recommendations |
| Admin panel for editing questions/recommendations | Phase 3 | Configuration stored in files; editable by developer for MVP |
| Practice as 9th element | Future | It's a habit, not a skill — doesn't fit the scoring model |
| A/B testing framework | Phase 3 | Premature for launch; iterate based on GA4 data first |
| Branded shareable image (fully rendered) | Phase 2 | MVP has a basic share (copy link + OG image); Phase 2 enhances the visual |

---

## 12. Success Metrics

| Metric | Target | How we measure it |
|--------|--------|------------------|
| Assessment completion rate | 70%+ | `assessment_start` → `assessment_completed` in GA4 |
| Email conversion rate | 60%+ | `assessment_completed` → `email_submitted` in GA4 |
| Time to complete | < 5 minutes | `completion_time_seconds` in assessment data |
| Results page load time | < 3 seconds | Vercel Analytics / Lighthouse |
| Social sharing rate | 10%+ | `share_initiated` events in GA4 |
| Lead quality | Higher conversion than general subscribers | Compare WW leads vs general list in Keap over 90 days |

---

## 13. Technical Summary (For Reference)

| Component | Technology |
|-----------|-----------|
| Frontend + Backend | Next.js (App Router) |
| Hosting | Vercel |
| Database | Supabase (PostgreSQL) |
| Email/CRM | Keap/Infusionsoft (REST API) |
| Radar Chart | Chart.js |
| Social Sharing Image | Vercel OG (Satori) |
| Analytics | GA4 + Google Tag Manager |
| Cookie Consent | CookieBot |
| Domain | worshipwheel.worshipguitarskills.com |

---

## 14. Next Steps

1. **Charl reviews this PRD** — confirm questions, scoring, archetypes, and CTA mapping
2. **Design in Figma** — create all screens using WGS brand tokens
3. **Development** — build in phases (assessment flow → scoring/results → Keap integration → analytics → sharing)
4. **Content creation** — Charl writes the 40 recommendation blocks and 5 archetype messages
5. **Testing** — internal testing with known skill levels to validate scoring accuracy
6. **Soft launch** — deploy, monitor completion rates and scoring distributions
7. **Iterate** — refine question wording and scoring based on real data
