# v1 Launch — Deliverables by Owner

Launch date: **2026-06-12** · Today: **2026-05-22** · Days remaining: **21**

Each item has an owner, a status, a target date, and a definition of done. If any of those four are blank, the [`project-manager`](../../.claude/skills/project-manager/SKILL.md) skill should flag it.

> **No-weekend rule:** Deadlines never land on Sat/Sun. If a target naturally falls on a weekend, default to the following Monday.

---

## 👤 Charl Coetzee (Worship Guitar Skills) — he/him

### C-1 · Email copy for Keap follow-up sequences — one dedicated sequence per profile archetype
- **Status:** 🔴 Not started — **and not yet committed by Charl**
- **Target delivery to Derick:** **2026-05-29 (Fri)** (Derick's target; Charl has not yet confirmed in writing)
- **Scope:** **One dedicated email sequence per profile archetype × 3 emails per sequence = 18 emails total.** Currently 6 named archetypes defined in `src/lib/scoring/archetypes.ts`:
  1. The Campfire Strummer
  2. The Rhythm Machine
  3. The Theory Head
  4. The Almost-There Player
  5. The Balanced Beginner
  6. The Uneven Intermediate

  **No fallback sequence.** Every user is expected to land in one of the 6 archetypes — see D-AC. If D-AC adds archetypes, C-1 scope grows.
- **Done when:**
  - Full email copy drafted for each of the 6 archetype sequences (3 emails per sequence)
  - Per email: send offset (e.g. day 0, day 3, day 7), subject line, body, CTA, merge-fields
  - Trigger conditions defined — which Keap archetype tag fires which sequence
  - Copy delivered to Derick in a paste-ready format (doc, sheet, or Keap-ready export) on 2026-05-29
- **Dependencies:**
  - Cadence (which day each email sends) agreed with Derick on 2026-05-25 (Mon)
  - D-AC complete on 2026-05-25 — confirms final archetype count before Charl writes at scale
- **Escalation:** If no written commit from Charl by 2026-05-25, raise as launch-threatening — see [`risks.md#R-2`](risks.md)

### C-2 · Cohort selection
- **Status:** 🔴 Not started
- **Target delivery:** 2026-06-05 (Fri, one week before launch)
- **Done when:** List of cohort members (name + email) handed to Derick, plus any pre-import preferences for Keap tags

### C-3 · PDF design review (post-build, optional)
- **Status:** 🟢 Deferred to post-build
- **Target delivery:** 2026-06-03 (Wed, review window after D-2 ships 2026-05-27)
- **Done when:** Charl reviews the shipped PDF and either approves as-is or sends a short list of changes; non-blocking for launch
- **Note:** Charl trusts Derick's first pass; review happens after the PDF is live

---

## 👤 Derick Strydom (Technical owner)

### D-1 · Hide VSL / sales-video section on assessment page
- **Status:** 🔴 Not started
- **Target delivery:** **2026-05-25 (Mon)**
- **Done when:**
  - VSL section is hidden via a feature flag or conditional render — easy to re-enable for v1.1
  - No layout regressions on the assessment page
  - Verified on desktop and mobile at 375 / 768 / 1024 / 1440 widths
- **Dependencies:** None
- **Notes:** Use a config flag, don't delete — this is coming back in v1.1

### D-2 · Printable PDF download from results page
- **Status:** 🔴 Not started
- **Target delivery:** **2026-05-27 (Wed)**
- **Done when:**
  - "Download PDF" CTA on results page produces a styled PDF including: user's name (if captured), radar chart, per-dimension scores, recommendations
  - PDF renders consistently across major browsers (Chrome, Safari, Firefox, mobile Safari)
  - PDF download event tracked in `assessment_events` for the admin dashboard
- **Dependencies:** PDF rendering approach decision by 2026-05-25 (Mon) — see [`risks.md#R-4`](risks.md)
- **Note:** Ships with Derick's first-pass design; Charl reviews post-build via C-3

### D-3 · Keap push integration
- **Status:** 🔴 Not started — **unblocked 2026-05-22** (Keap Service Account Key in `.env.local`)
- **Target delivery:** **2026-05-28 (Thu)**
- **Done when:**
  - Completed assessments create or update a Keap contact via the REST API
  - **Archetype tag applied** to the contact (one of 6 archetype tags) so the correct sequence can fire from D-4
  - Score-based tags also applied per the tagging schema
  - Failures logged to `assessment_events` and surface in the admin sync-health panel
  - Retry/idempotency verified (a re-submitted assessment doesn't create a duplicate contact)
- **Dependencies:** ✅ Keap Service Account Key (resolved 2026-05-22); D-AC complete so the tag set is finalised before wiring

### D-AC · Archetype coverage — every score combination must land in a named archetype
- **Status:** 🔴 Not started — **gates D-3 and C-1**
- **Target delivery:** **2026-05-25 (Mon)**
- **Done when:** One of the following is true and demonstrated:
  - **Path A — Prove coverage:** Audit shows the existing 6 archetype rules already cover 100% of the `(score₁,…,score₈) ∈ [0,10]⁸` space. Property-test or exhaustive sweep added under `src/__tests__/` to lock this in.
  - **Path B — Expand archetypes:** Add 1+ new archetype rules to close gaps. **Each new archetype adds 3 emails to Charl's C-1 scope** — feed the change back to Charl immediately.
  - **Path C — Relax existing rules:** Soften match thresholds so the 6 archetypes overlap and cover the full space. Document the new rules.
  - **Path D — Default archetype:** Pick one of the 6 archetypes (likely Balanced Beginner) as the deterministic default when no rule matches. Remove `fallback_<ELEMENT>` code path.
- **Why this matters:** The product directive (2026-05-22) is that no user should ever see a fallback archetype. The current code at `src/lib/scoring/archetypes.ts` returns `fallback_<ELEMENT>` for plausible inputs (e.g. all-6s scores). Without D-AC, D-3 may tag users with a key Keap has no sequence for.
- **Dependencies:** None
- **Trigger:** If D-AC finds a coverage gap that needs new archetypes (Path B), C-1 scope grows by 3 emails per added archetype — raise as scope change with Charl the same day.

### D-4 · Implement Charl's email copy as Keap sequences (one per archetype)
- **Status:** 🔴 Not started — week-2 work
- **Target delivery:** **2026-06-03 (Wed)**
- **Done when:**
  - All sequences from C-1 are built in Keap (one per archetype, 3 emails each)
  - Each archetype tag from D-3 triggers the correct sequence
  - Test contacts (one per archetype) run through each sequence end-to-end — all 3 emails per sequence delivered on the expected cadence
- **Dependencies:** C-1 (email copy delivered 2026-05-29), D-3 (Keap push live with archetype tags)

### D-5a · Solo dry-run smoke test
- **Status:** 🔴 Not started
- **Target delivery:** **2026-05-29 (Fri)**
- **Done when:**
  - Derick personally completes the full assessment flow on desktop and mobile
  - Confirms VSL hidden, PDF downloads correctly, Keap push lands a contact with correct archetype + score tags
  - Confirms a real archetype tag (never `fallback_<ELEMENT>`) is assigned
  - Any defects logged for the week-2 fix list
- **Dependencies:** D-1, D-2, D-3, D-AC all complete
- **Scope:** Solo only — broader pre-launch verification is D-5b

### D-5b · Pre-launch checks (structured verification)
- **Status:** 🔴 Not started — week-2 deliverable
- **Target delivery:** **2026-06-05 (Fri)**
- **Done when:** Every checklist item passes (or is triaged as a known issue for week 3):
  - Full happy-path e2e: assessment → results → PDF → Keap contact → archetype tag fires → first sequence email received
  - All 6 archetype sequences verified end-to-end with test contacts (every email delivered, correct cadence)
  - Coverage sanity-check: simulated test runs across the score space all produce real archetype tags, never `fallback_<ELEMENT>`
  - Cross-browser: Chrome, Safari, Firefox desktop + mobile Safari + mobile Chrome
  - Responsive at 375 / 768 / 1024 / 1440 widths
  - Keap sync-health panel green; no failed pushes in `assessment_events`
  - Admin dashboard accurate (funnel, events, leads, outcomes)
  - PDF generation works across all target browsers
  - Cohort access mechanism tested (whichever path R-5 resolves to)
  - Test contacts cleaned from Keap; production-ready state confirmed
- **Dependencies:** D-4 complete, C-2 cohort list received, R-5 cohort access mechanism decided

### D-6 · Production deployment + launch-day smoke test
- **Status:** 🔴 Not started — **unblocked 2026-05-22** (Vercel `office-3285` access granted)
- **Target delivery:** 2026-06-11 (Thu, day before launch)
- **Done when:** Production URL serves the v1 build, quick smoke test confirms the happy path post-deploy
- **Dependencies:** ✅ Vercel team access (resolved 2026-05-22); D-5b checklist passed

---

## Shared / coordination

### S-1 · Launch-day checklist + go/no-go meeting
- **Status:** 🔴 Not scheduled
- **Target:** 2026-06-11 (Thu)
- **Done when:** Derick + Charl confirm all deliverables green, agree to release

---

## Summary by status

| Status | Count |
|---|---|
| 🔴 Not started | 10 |
| 🔴 Blocked | 1 |
| 🟢 Deferred (non-blocking) | 1 |
| ✅ Done | 0 |

See [`timeline.md`](timeline.md) for the week-by-week schedule and [`risks.md`](risks.md) for blocker mitigations.
