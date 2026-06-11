# v1 Launch — Deliverables by Owner

Launch date: **2026-06-15 (Mon)** · Today: **2026-06-11** · Days remaining: **4 (incl. launch day)** · _moved from 2026-06-12 (no-weekend rule + Charl)_

Each item has an owner, a status, a target date, and a definition of done. If any of those four are blank, the [`project-manager`](../../.claude/skills/project-manager/SKILL.md) skill should flag it.

> **No-weekend rule:** Deadlines never land on Sat/Sun. If a target naturally falls on a weekend, default to the following Monday.

---

## 👤 Charl Coetzee (Worship Guitar Skills) — he/him

### C-1 · Email copy for Keap follow-up sequences — one dedicated sequence per profile archetype
- **Status:** ✅ **DONE** — Charl delivered the copy and implemented it directly in Keap as the six archetype result-email sequences (see D-4). Funnel live end-to-end 2026-06-11.
- **Target delivery to Derick:** ~~2026-05-29 (Fri)~~ — delivered (Charl built the sequences in Keap himself rather than handing copy to Derick)
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

### C-2 · Cohort selection + send
- **Status:** 🟢 **Charl-owned — no handoff to Derick.** Audience = Charl's **existing members**; Charl actions the send himself (segments in Keap and emails the `worshipwheel.com` link). No cohort list needs to come to Derick, and no Keap import step on Derick's side.
- **Target:** Launch day, 2026-06-15 (Mon)
- **Done when:** Charl sends the launch link to his existing-member segment on launch day

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
- **Status:** ✅ **BUILT 2026-06-11** — Charl implemented the June result emails for all six archetype sequences in Keap; the funnel is **live end-to-end** (START tag → decision diamond on `worship_wheel_archetype` → matching sequence + history tag → opted-in contact receives emails). The remaining item — **all 6 sequences verified end-to-end on the correct cadence with test contacts — is the D-5b QA now in progress**, not a build gap.
- **Target delivery:** ~~2026-06-03 (Wed)~~ — built 2026-06-11
- **Done when:**
  - ✅ All sequences from C-1 built in Keap (one per archetype)
  - ✅ The START-tag campaign's decision diamond routes each contact (by `worship_wheel_archetype`) into the correct sequence, which applies the matching history tag (live-verified for Campfire Strummer + Rhythm Machine 2026-06-10)
  - ⏳ Test contacts (one per archetype) run through each sequence end-to-end — every email delivered on the expected cadence → **D-5b**
- **Dependencies:** ✅ C-1 (delivered/implemented), ✅ D-3 (Keap push live), ✅ email opt-in (deliverability) shipped 2026-06-10

#### Keap tag reference — Worship Wheel Assessment (archive of record)

All tags follow the WGS house convention `10. Marketing 3755 WGS Worship Wheel Assessment <NN>. <Step>`.

**Flow:** the app applies the **START tag (3967)** on submit and sets the `worship_wheel_archetype` custom field → the START tag triggers the campaign → the campaign applies the durable **Completed Assessment tag (3984)** and a **decision diamond reads the custom field** to route the contact into the matching archetype sequence → **within that sequence, the respective history tag is applied** (first step on entry). Routing is **custom-field driven, not tag-driven** — the history tags don't trigger sequences; they record which sequence a contact entered.

**Control tags** — category `05. WGS System` (id 132):

| Tag | Keap ID | Applied by | Env key |
|---|---|---|---|
| `… 01. START` (completion) | **3967** | App (`src/lib/keap/sync.ts`) on submit | `KEAP_TAG_WW_COMPLETED` |
| `… 99. STOP` (sequence exit) | **3970** | Keap (sequence control) | — |

**Completion marker** — category `02. WGS History` (id 142), applied **Keap-side in the campaign**:

| Tag | Keap ID | Applied by |
|---|---|---|
| `… 00. Completed Assessment` | **3984** | Keap (campaign) |

> The **START tag (3967) is removed by the campaign** after routing, so it is not a durable "has completed" marker. The **Completed Assessment tag (3984)** is the durable one — applied within the campaign so completers can be filtered without OR-ing the six archetype tags. Added 2026-06-10. **Applied in Keap, not by the app** (no app env key / code needed).

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
| `worship_wheel_result_id` | **274** | bare result UUID — for hyperlinkable results link `https://worshipwheel.com/results/~Contact._worshipwheelresultid~` | `KEAP_FIELD_WW_RESULT_ID` | ⬜ optional¹ |
| `worship_wheel_overall_score` | 269 | overall score (8–80) | `KEAP_FIELD_WW_OVERALL_SCORE` | ✅ |
| `worship_wheel_overall_percentage` | 271 | overall percentage | `KEAP_FIELD_WW_OVERALL_PERCENTAGE` | ✅ |

> ¹ `worship_wheel_archetype_name` (272) and `worship_wheel_result_id` (274), both added 2026-06-10, are **optional in the sync** — a missing env key is skipped with a warning, not fatal (the required identity field 265 is unaffected). Merge-field references: `worshipwheelarchetypename`, `worshipwheelresultid`. Both env keys (`KEAP_FIELD_WW_ARCHETYPE_NAME=272`, `KEAP_FIELD_WW_RESULT_ID=274`) are **mirrored to Vercel Production + Preview** (added 2026-06-10) so they populate in prod.

#### Email opt-in (deliverability) — ✅ shipped 2026-06-10 (spec 008)

**The blocker:** Keap contacts created via the REST API default to `NonMarketable`, so **no follow-up sequence email would ever send** — D-3 pushed contacts that Keap silently refused to email. Confirmed live (a Campfire Strummer test contact received nothing until opt-in shipped).

**The fix** (spec `008-keap-opt-in`, merged PR #12 `ddd0dfa`): after the contact upsert, the sync records a **single opt-in** via XML-RPC `APIEmailService.optIn` (REST v1 has no opt-in field). It is:

- **Guarded** — reads `email_status` and only opts in `NonMarketable` contacts; already-marketable (single/double) and opted-out contacts are skipped, so a retake never downgrades an engaged contact or resurrects an unsubscribe.
- **Non-blocking** — opt-in failures are logged, never fail the sync.
- **Consent-backed** — the opt-in reason references the privacy policy, and the `EmailGate` consent link now points at the canonical policy (`shop.worshipguitarskills.com/pages/privacy-policy`).

**Verified end-to-end 2026-06-10:** a completer moved `NonMarketable → SingleOptIn`, a retake stayed `SingleOptIn` (no downgrade), and a **real sequence email was received** — the first successful delivery. This unblocks D-4.

### D-5a · Solo dry-run smoke test
- **Status:** 🟡 **In progress** — started 2026-06-11 (folds into the broader D-5b launch QA, now that the full funnel is live)
- **Target delivery:** ~~2026-05-29 (Fri)~~ → **2026-06-12 (Fri)**
- **Done when:**
  - Derick personally completes the full assessment flow on desktop and mobile
  - Confirms VSL hidden, PDF downloads correctly, Keap push lands a contact with correct archetype + score tags
  - Confirms a real archetype tag (never `fallback_<ELEMENT>`) is assigned
  - Any defects logged for the week-2 fix list
- **Dependencies:** D-1, D-2, D-3, D-AC all complete
- **Scope:** Solo only — broader pre-launch verification is D-5b

### D-5b · Pre-launch checks (structured verification)
- **Status:** 🟡 **In progress** — started 2026-06-11 against the live funnel
- **Target delivery:** ~~2026-06-05 (Fri)~~ → **2026-06-12 (Fri)** (before the weekend; go/no-go 2026-06-15)
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
- **Status:** 🟢 **Largely done** — app is live on `worshipwheel.com` (canonical domain since 2026-05-29) and serving prod traffic (continuous deploys verified all through 2026-06-10/11). Remaining: the **launch-day smoke test** at go/no-go.
- **Target delivery:** ~~2026-06-11 (Thu)~~ → smoke test at **2026-06-15 (Mon)** go/no-go
- **Done when:**
  - ✅ Production serves the v1 build on **`worshipwheel.com`** with valid TLS — the URL Charl distributes to the Keap segment. (The earlier-planned `worshipwheel.worshipguitarskills.com` subdomain was dropped — `worshipwheel.com` is the only/canonical domain.)
  - ⏳ Launch-day smoke test confirms the happy path post-deploy (assessment → results → PDF → Keap contact opted-in → sequence email)
- **Dependencies:** ✅ Vercel team access; ✅ domain live; D-5b QA passed

---

## Shared / coordination

### S-1 · Launch-day checklist + go/no-go meeting
- **Status:** 🔴 Not scheduled — **schedule for 2026-06-15 (Mon)**
- **Target:** 2026-06-15 (Mon, launch day)
- **Done when:** Derick + Charl confirm all deliverables green (D-5b QA passed, cohort list in hand), agree to release

---

## Summary by status

| Status | Count |
|---|---|
| ✅ Done | 7 (C-1, D-1, D-2, D-3, D-4, D-7, D-AC) |
| 🟢 Largely done (launch-day step left) | 1 (D-6 — live on `worshipwheel.com`; smoke test at go/no-go) |
| 🟡 In progress | 2 (D-5a, D-5b — launch QA, started 2026-06-11) |
| 🟢 Charl-owned (launch-day action) | 1 (C-2 — Charl sends link to his existing-member segment) |
| 🔴 To schedule | 1 (S-1 go/no-go — 2026-06-15) |
| 🟢 Deferred (non-blocking) | 1 (C-3 — Charl PDF review) |

> **Critical path is now QA, not build.** C-1 + D-4 are done and the funnel is live end-to-end. The only gating work on Derick's side is **D-5a/D-5b QA**; then **S-1 go/no-go** → Charl sends the link (C-2) → launch 2026-06-15. The cohort (existing members) needs no list handoff.

See [`timeline.md`](timeline.md) for the week-by-week schedule and [`risks.md`](risks.md) for blocker mitigations.
