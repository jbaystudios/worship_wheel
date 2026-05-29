# Worship Wheel — Project Status

**Last updated:** 2026-05-28
**Next milestone:** v1 controlled-cohort launch — **2026-06-12** (15 days out)
**Active branch:** `main`

---

## At a glance

| Area | State | Notes |
|---|---|---|
| Core assessment (001) | ✅ Shipped | 16-question quiz, 8-dimension radar, lead capture wired |
| Scoring optimisation (002) | ✅ Shipped | Checklist response expansion live |
| Results page (003) | ✅ Shipped | UI/UX complete; sessionStorage-based |
| Admin dashboard (005) | 🟦 Parked | Code-complete on `005-admin-dashboard` (55/60). Polish (T055/T056/T057/T059 + T006 migration) paused for v1 focus; resumes post-launch. Dashboard at current state will be used for launch monitoring. |
| Results PDF download (006) | ✅ Shipped | `@react-pdf/renderer` server-side route at `/api/results/[resultId]/pdf`, top + bottom buttons on results page, `pdf_downloaded` event tracked. D-2 closed. |
| Submit consent checkbox | ✅ Shipped | Required consent checkbox now gates the submit button on the assessment (commit `3e30d79`). New deliverable D-7 — see [`v1-launch/deliverables.md`](v1-launch/deliverables.md#d-7). |
| **v1 launch readiness** | 🟡 On track | Week 1 closed with D-AC + D-1 + D-2 + D-3 all ✅. Now entering week 2 — D-4 (Keap sequences) is the next critical step but **blocked on C-1**: Charl writes **6 sequences × 3 emails = 18 emails**; written commit still pending. No weekend deadlines. |

---

## What's shipped

- 001 — Worship Wheel Assessment (questions, scoring, radar chart, lead capture)
- 002 — Scoring optimisation with checklist response expansion
- 003 — Results page UI
- 005 — Admin dashboard US1–US5 (auth, funnel + event tracking, acquisition, outcomes, leads + CSV export + Keap sync-health panel) — code-complete on `005-admin-dashboard`
- 006 — Results PDF download (D-2): server-side `@react-pdf/renderer` route, top + bottom CTA, `pdf_downloaded` event tracked
- D-1 — VSL / sales-CTA hidden behind `FEATURES.showVsl` / `FEATURES.showCta` (both results page and PDF report)
- D-3 — Keap push live: contact create/update via `PUT /v1/contacts`, completion tag 3967 + 4 custom fields (archetype, results URL, overall score, percentage); idempotent on email
- D-AC — Archetype coverage closed (Path D): `matchArchetype` defaults to Balanced Beginner; `fallback_<ELEMENT>` write path removed; 1.68M-profile coverage sweep test locks the invariant
- D-7 — Submit consent checkbox on assessment (commit `3e30d79`)

## What's in progress

- **Waiting on Charl (C-1)** — 18 emails across 6 archetype sequences, target 2026-05-29 (written commit still pending)
- **D-5a solo dry-run** — eligible to run now that D-1/D-2/D-3/D-AC are all green; target 2026-05-29 (Fri)

## What's parked

- 005 admin dashboard polish — T006 (Supabase migration), T055/T056/T057/T059 (live-DB-dependent polish). Resumes post-v1-launch.

## Active blockers

| Blocker | Owner | Impact | Status |
|---|---|---|---|
| **Charl's email-copy commit (C-1)** | Charl (request from Derick) | D-4 sequence build depends on copy in hand 2026-05-29. **Scope = 6 archetype sequences × 3 emails = 18 emails.** | **No written commit yet** — Derick's target only |
| **Keap automation build (D-4)** | Derick | D-3 live-tested 2026-05-25 (contact 88271 created with tag + 4 custom fields). Next: build the automation that fires on tag 3967 and branches on `worship_wheel_archetype` into the right follow-up sequence. Depends on Charl's C-1 email copy. | Active |

## What's next

1. **Today (2026-05-28, Thu)** — chase Charl for written C-1 commit; confirm custom-domain DNS path for `worshipwheel.worshipguitarskills.com` (D-6 sub-task)
2. **By 2026-05-29 (Fri)** — run D-5a solo dry-run (full flow on desktop + mobile); Charl delivers C-1 (18 emails)
3. **2026-06-01 → 2026-06-05** — D-4 (Keap sequences) + D-5b (pre-launch checks)
4. **2026-06-08 → 2026-06-11** — Buffer, D-6 production deploy + custom domain live, S-1 go/no-go

---

## Recent changes

- 2026-05-28 — ✅ **Charl provisioned as admin user**: `charl@guitarskills.com` added to `auth.users` so Charl can monitor the dashboard during launch week. Password generated server-side; needs rotating by Charl on first sign-in (no in-app password-change UI yet).
- 2026-05-28 — 🛠️ **Admin sign-in restored for Derick**: password reset via service-role admin API after a forgotten-password lockout; sign-in verified, stats from test submissions visible. (See qa-log.)
- 2026-05-28 — ✅ **R-5 resolved (cohort access mechanism)**: open public URL on `worshipwheel.worshipguitarskills.com`, no auth/gating. "Controlled cohort" achieved on the distribution side — Charl shares the link only to a hand-picked segment of his Keap/Infusionsoft database. Custom-domain setup folded into D-6.
- 2026-05-28 — 🧹 **PM docs reconciled with reality**: D-2 marked ✅ done; new D-7 (consent checkbox) added to deliverables; status indicators, dates, and "days remaining" refreshed. Active branch updated to `main` after `005-admin-dashboard` merge.
- 2026-05-25 — 🛠️ **Vercel housekeeping**: removed stale cron config referencing a non-existent route (`324cb25`); redeployment triggered after repo visibility change (`e1acb7a`). Nav logo bar padding tightened (`101e273`).
- 2026-05-25 — ✅ **D-7 shipped (consent checkbox)**: assessment submit now requires an explicit consent checkbox before the button enables (commit `3e30d79`). Privacy / lead-capture compliance for v1 launch.
- 2026-05-25 — ✅ **D-2 shipped (Results PDF download)**: `@react-pdf/renderer` server-side route at `/api/results/[resultId]/pdf` reads from Supabase via service-role client. Top + bottom CTA on results page. `pdf_downloaded` event tracked. D-1 feature flags (`FEATURES.showVsl` / `FEATURES.showCta`) also applied to the PDF (commit `9e65687`). Charl reviews post-build via C-3.
- 2026-05-25 — 📝 **Spec 006 drafted (Results PDF download — D-2)**: chosen approach `@react-pdf/renderer` server-side, reading from Supabase via service-role client. Top + bottom button placements. Resolves R-4. 6 open questions in spec, mostly default-resolvable. [`/specs/006-results-pdf-download/spec.md`](../specs/006-results-pdf-download/spec.md)
- 2026-05-25 — ✅ **D-3 closed + idempotency verified**: live test created contact 88271 with tag 3967 + 4 custom fields. Switched archetype field to stable snake_case keys (e.g. `theory_head` not `The Theory Head`) for automation-branch stability. Second submission (same email, different archetype) confirmed dedup: contact 88271 updated in place, `worship_wheel_archetype` overwritten, tag count stayed at 1. Status writeback in <2s.
- 2026-05-25 — ✅ **D-AC closed** (Path D): `matchArchetype` defaults to Balanced Beginner when no rule fires; `fallback_<ELEMENT>` write path removed; 1.68M-profile coverage sweep test locks the invariant.
- 2026-05-25 — 🔧 **D-3 MVP-simplified**: Scope cut from 19 tags + 15 custom fields to **1 completion tag + 4 custom fields** (archetype, results URL, overall score, overall percentage). Single tag fires a Keap automation that branches on the `worship_wheel_archetype` custom field into the right follow-up sequence. Broader band/weakness tagging is parked, not killed — can return post-launch. 4 field IDs populated in `.env.local`; only `KEAP_TAG_WW_COMPLETED` remains.
- 2026-05-25 — ✅ **D-3 code shipped**: `src/lib/keap/{client,sync}.ts` + `src/lib/supabase/service.ts` push completed assessments via `PUT /v1/contacts` (deduped by email) + tag. Non-blocking call wired into `/api/submit`; `keap_sync_status` writeback feeds the admin sync-health panel.
- 2026-05-22 — 🟦 **005 admin dashboard polish parked** for v1 launch focus. Dashboard remains code-complete and will be used for v1 monitoring at its current state. Polish (T006 migration + T055/T056/T057/T059) resumes post-launch.
- 2026-05-22 — ✅ **R-3 resolved:** Derick has access to Vercel `office-3285` team. D-6 (production deploy) unblocked.
- 2026-05-22 — ✅ **R-1 resolved:** Keap Service Account Key added to `.env.local`. D-3 (Keap push) unblocked.
- 2026-05-22 — Refined: **no-weekend deadlines rule.** Sunday 2026-05-24 items (D-AC, D-1, PDF decision, cadence agreement, Charl drafting kickoff) all pushed to Monday 2026-05-25. Week-3 buffer narrowed to weekdays.
- 2026-05-22 — Refined: **3 emails per sequence** locked (provisional). **No-fallback policy** declared — all users must land in a named archetype. Added D-AC (Archetype Coverage) as a Derick deliverable.
- 2026-05-22 — Refined: email-copy scope clarified — **one dedicated sequence per profile archetype** (6 named archetypes in `src/lib/scoring/archetypes.ts`). Pre-launch checks (D-5b) added as a structured week-2 deliverable.
- 2026-05-22 — Tightened: Derick build week targets 2026-05-29 for D-1/D-2/D-3 + solo dry-run; Charl asked to deliver email copy by 2026-05-29 (commit pending). D-5 split into D-5a (solo dry-run 05-29) and D-5b (pre-launch checks 06-05).
- 2026-05-22 — v1 launch date confirmed (2026-06-12); PM folder established
- 2026-05-20 — 005 US5 shipped (leads table, CSV export, Keap sync-health panel)
- 2026-05-19 — 005 US1–US4 shipped (auth, event tracking, funnel, acquisition, outcomes)
- 2026-04-14 — Repo reorganised: `specs/`, `plan/`, `docs/` moved into project root
