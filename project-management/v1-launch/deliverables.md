# v1 Launch — Deliverables by Owner

Launch date: **2026-06-12** · Today: **2026-05-28** · Days remaining: **15**

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

### D-1 · Hide VSL / sales-video section on results page
- **Status:** 🟡 **Code shipped 2026-05-25** — pending responsive cross-width verification
- **Target delivery:** **2026-05-25 (Mon)** — met
- **Done when:**
  - ✅ VSL section + sales CTA hidden via `FEATURES.showVsl` / `FEATURES.showCta` in `src/lib/features.ts` (single source of truth; re-enable for v1.1 = flip the booleans)
  - ✅ Both gates also applied to the PDF report's archetype page (consistent on-screen + downloaded artefact)
  - ⏳ No layout regressions on the results page — needs visual check
  - ⏳ Verified on desktop and mobile at 375 / 768 / 1024 / 1440 widths
- **Scope note:** the gating covers both the video placeholder inside `ArchetypeCard` and the entire `CtaBanner` component. Components themselves are intact — only the rendering is conditional.
- **Dependencies:** None
- **Notes:** Use a config flag, don't delete — this is coming back in v1.1

### D-2 · Printable PDF download from results page
- **Status:** ✅ **DONE 2026-05-25** — shipped in commit `9e65687` ahead of the 05-27 target
- **Target delivery:** ~~2026-05-27 (Wed)~~ — met two days early
- **Spec:** [`/specs/006-results-pdf-download/spec.md`](../../specs/006-results-pdf-download/spec.md)
- **Approach (R-4 resolved 2026-05-25):** `@react-pdf/renderer` rendered server-side at `/api/results/[resultId]/pdf`, reads from Supabase via service-role client. Two button placements: top of results + end of report.
- **Done when:**
  - ✅ "Download PDF" CTA on results page (top + bottom) produces a styled PDF including: user's name, radar chart, per-dimension scores, archetype, recommendations
  - ✅ `pdf_downloaded` event tracked in `assessment_events` for the admin dashboard
  - ✅ D-1 feature flags (`FEATURES.showVsl` / `FEATURES.showCta`) also gate the PDF report — on-screen and downloaded artefact stay consistent
  - ⏳ Cross-viewer rendering verification (Preview, Adobe Reader, Chrome built-in viewer, mobile Safari) — to be covered in D-5a solo dry-run 2026-05-29
  - ⏳ A4 page-boundary visual check — same dry-run
- **Dependencies:** ✅ R-4 (PDF approach) resolved; ✅ `src/lib/supabase/service.ts` (already exists from D-3)
- **Note:** Ships with Derick's first-pass design; Charl reviews post-build via C-3.

### D-3 · Keap push integration
- **Status:** ✅ **DONE 2026-05-25 (MVP)** — live test passed, contact `Worship Wheel Test` (Keap id 88271) shows under the tag filter with all 4 custom fields populated. Visible in Keap admin at *Contacts → With ANY of these Tags: 05. WGS System → 10. Marketing 3755 WGS Worship Wheel Assessment 01. START*. Hand-off to D-4.
- **Target delivery:** **2026-05-28 (Thu)**
- **MVP scope decision (2026-05-25):** Cut from 19 tags + 15 custom fields to **1 completion tag + 4 custom fields**. A single completion tag fires a Keap automation that branches on the `worship_wheel_archetype` custom field into the right follow-up sequence. Broader band/weakness tagging is **parked, not killed** — can return post-launch if segmentation needs grow.
- **Done when:**
  - ✅ Completed assessments create or update a Keap contact via the REST API (`PUT /v1/contacts` with `duplicate_option: Email` — `src/lib/keap/client.ts`, wired from `src/app/api/submit/route.ts`)
  - ✅ 4 custom fields populated: archetype (id=265), results URL (267), overall score (269), overall percentage (271)
  - ✅ **Completion tag applied** — `KEAP_TAG_WW_COMPLETED=3967` (`10. Marketing 3755 WGS Worship Wheel Assessment 01. START`, category `05. WGS System`)
  - ✅ Failures surface in the admin sync-health panel (`assessment_sessions.keap_sync_status` writeback via service-role client)
  - ✅ Live end-to-end test passed 2026-05-25 — contact id 88271 created with all 4 custom fields and the completion tag in <2s
  - ✅ Retry/idempotency live-verified 2026-05-25 — second submission with same email + different archetype: no duplicate contact created, `worship_wheel_archetype` overwritten from `balanced_beginner` → `theory_head`, tag count stayed at 1
- **Remaining work to close:**
  1. Run one production submission and confirm the contact, tag 3967, and all 4 custom field values land in Keap (live retake test also verifies idempotency)
  2. Build the Keap automation that fires on tag 3967 and branches on the `worship_wheel_archetype` custom field — this is the D-4 hand-off
- **Dependencies:** ✅ Keap Service Account Key (resolved 2026-05-22); ✅ D-AC closed (2026-05-25)

### D-AC · Archetype coverage — every score combination must land in a named archetype
- **Status:** ✅ **Closed 2026-05-25 (Path D)** — `matchArchetype` now defaults to Balanced Beginner when no rule fires; `fallback_<ELEMENT>` write path removed from `src/lib/scoring/archetypes.ts`. A 1.68M-profile coverage sweep (`src/__tests__/unit/archetype.test.ts`) locks the invariant. The `archetypeNameFromKey` reader keeps a `fallback_` back-compat branch for any pre-D-AC rows already in Supabase.
- **Target delivery:** ~~2026-05-25 (Mon)~~ — met
- **Done when:** One of the following is true and demonstrated:
  - **Path A — Prove coverage:** Audit shows the existing 6 archetype rules already cover 100% of the `(score₁,…,score₈) ∈ [0,10]⁸` space. Property-test or exhaustive sweep added under `src/__tests__/` to lock this in.
  - **Path B — Expand archetypes:** Add 1+ new archetype rules to close gaps. **Each new archetype adds 3 emails to Charl's C-1 scope** — feed the change back to Charl immediately.
  - **Path C — Relax existing rules:** Soften match thresholds so the 6 archetypes overlap and cover the full space. Document the new rules.
  - **Path D — Default archetype:** Pick one of the 6 archetypes (likely Balanced Beginner) as the deterministic default when no rule matches. Remove `fallback_<ELEMENT>` code path.
- **Why this matters:** The product directive (2026-05-22) is that no user should ever see a fallback archetype. The current code at `src/lib/scoring/archetypes.ts` returns `fallback_<ELEMENT>` for plausible inputs (e.g. all-6s scores). Without D-AC, D-3 may tag users with a key Keap has no sequence for.
- **Dependencies:** None
- **Trigger:** If D-AC finds a coverage gap that needs new archetypes (Path B), C-1 scope grows by 3 emails per added archetype — raise as scope change with Charl the same day.

### D-4 · Implement Charl's email copy as Keap sequences (one per archetype)
- **Status:** 🟡 In progress — six archetype sequences set up in Keap (Charl); history tags created 2026-06-10 (see Tag reference below)
- **Target delivery:** **2026-06-03 (Wed)**
- **Done when:**
  - All sequences from C-1 are built in Keap (one per archetype, 3 emails each)
  - The START-tag campaign's decision diamond routes each contact (by `worship_wheel_archetype` custom field) into the correct sequence, which applies the matching history tag
  - Test contacts (one per archetype) run through each sequence end-to-end — all 3 emails per sequence delivered on the expected cadence
- **Dependencies:** C-1 (email copy delivered 2026-05-29), D-3 (Keap push live with archetype tags)

#### Keap tag reference — Worship Wheel Assessment (archive of record)

All tags follow the WGS house convention `10. Marketing 3755 WGS Worship Wheel Assessment <NN>. <Step>`.

**Flow:** the app applies the **START tag (3967)** on submit and sets the `worship_wheel_archetype` custom field → the START tag triggers the campaign → a **decision diamond reads the custom field** and routes the contact into the matching archetype sequence → **within that sequence, the respective history tag is applied** (first step on entry). Routing is **custom-field driven, not tag-driven** — the history tags don't trigger sequences; they record which sequence a contact entered.

**Control tags** — category `05. WGS System` (id 132):

| Tag | Keap ID | Applied by | Env key |
|---|---|---|---|
| `… 01. START` (completion) | **3967** | App (`src/lib/keap/sync.ts`) on submit | `KEAP_TAG_WW_COMPLETED` |
| `… 99. STOP` (sequence exit) | **3970** | Keap (sequence control) | — |

**Archetype history tags** — category `02. WGS History` (id 142), created 2026-06-10, applied within each archetype sequence (first step on entry):

| `worship_wheel_archetype` value | Tag | Keap ID |
|---|---|---|
| `campfire_strummer` | `… 01. Campfire Strummer` | **3972** |
| `rhythm_machine` | `… 02. Rhythm Machine` | **3974** |
| `theory_head` | `… 03. Theory Head` | **3976** |
| `almost_there_player` | `… 04. Almost-There Player` | **3978** |
| `balanced_beginner` | `… 05. Balanced Beginner` | **3980** |
| `uneven_intermediate` | `… 06. Uneven Intermediate` | **3982** |

> Tags created via `src/scripts/create-keap-tag.ts` (duplicate-guarded; safe to re-run). The app does **not** apply the history tags or the STOP tag — those are Keap-side only.

**Custom fields** — Keap contact custom fields the app populates on submit (all Text):

| Field label | Keap ID | Value written | Env key | Required? |
|---|---|---|---|---|
| `worship_wheel_archetype` | 265 | snake_case key (`campfire_strummer`) — decision-diamond routing | `KEAP_FIELD_WW_ARCHETYPE` | ✅ |
| `worship_wheel_archetype_name` | **272** | display name, no "The" (`Campfire Strummer`) — email merge fields | `KEAP_FIELD_WW_ARCHETYPE_NAME` | ⬜ optional¹ |
| `worship_wheel_results_url` | 267 | full results URL | `KEAP_FIELD_WW_RESULTS_URL` | ✅ |
| `worship_wheel_overall_score` | 269 | overall score (8–80) | `KEAP_FIELD_WW_OVERALL_SCORE` | ✅ |
| `worship_wheel_overall_percentage` | 271 | overall percentage | `KEAP_FIELD_WW_OVERALL_PERCENTAGE` | ✅ |

> ¹ `worship_wheel_archetype_name` (added 2026-06-10) is **optional in the sync** — if its env key is missing it's skipped with a warning, not fatal (the required identity field 265 is unaffected). Merge-field reference: `worshipwheelarchetypename`. **Must be mirrored to Vercel Production** (`KEAP_FIELD_WW_ARCHETYPE_NAME=272`) for it to populate in prod.

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

### D-7 · Submit consent checkbox on assessment
- **Status:** ✅ **DONE 2026-05-25** — shipped in commit `3e30d79`
- **Target delivery:** ~~n/a — late addition~~ — met same-day
- **Done when:**
  - ✅ Final-question / lead-capture screen requires an explicit consent checkbox before the submit button enables
  - ✅ Consent state is visible (checkbox + label) and accessible (keyboard-reachable, screen-reader friendly)
  - ⏳ Copy reviewed by Charl for tone and compliance — to confirm during C-3 PDF review or D-5b pre-launch
- **Why this matters:** Privacy / lead-capture compliance for v1 launch. We are pushing identifiable data to Keap on submit — explicit consent is the safe default before we hand cohort users a working assessment.
- **Dependencies:** None (existed independently of D-1/D-2/D-3)

### D-6 · Production deployment + launch-day smoke test
- **Status:** 🔴 Not started — **unblocked 2026-05-22** (Vercel `office-3285` access granted)
- **Target delivery:** 2026-06-11 (Thu, day before launch)
- **Done when:**
  - Production URL serves the v1 build
  - **Custom domain `worshipwheel.worshipguitarskills.com` is live on Vercel** with valid TLS — this is the URL Charl distributes to the Keap segment (R-5 resolution)
  - Quick smoke test confirms the happy path post-deploy (assessment → results → PDF → Keap contact)
- **Dependencies:** ✅ Vercel team access (resolved 2026-05-22); D-5b checklist passed; **DNS access for `worshipguitarskills.com`** — Charl controls DNS and has agreed to grant Derick access (low-risk action item, confirm by 2026-06-08)

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
| ✅ Done | 4 (D-2, D-3, D-AC, D-7) |
| 🟡 In progress / partial | 1 (D-1 — code shipped, cross-width check pending) |
| 🔴 Not started | 7 (C-1, C-2, D-4, D-5a, D-5b, D-6, S-1) |
| 🟢 Deferred (non-blocking) | 1 (C-3) |

See [`timeline.md`](timeline.md) for the week-by-week schedule and [`risks.md`](risks.md) for blocker mitigations.
