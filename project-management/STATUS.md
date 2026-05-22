# Worship Wheel — Project Status

**Last updated:** 2026-05-22
**Next milestone:** v1 controlled-cohort launch — **2026-06-12** (21 days out)
**Active branch:** `005-admin-dashboard`

---

## At a glance

| Area | State | Notes |
|---|---|---|
| Core assessment (001) | ✅ Shipped | 16-question quiz, 8-dimension radar, lead capture wired |
| Scoring optimisation (002) | ✅ Shipped | Checklist response expansion live |
| Results page (003) | ✅ Shipped | UI/UX complete; sessionStorage-based |
| Admin dashboard (005) | 🟦 Parked | Code-complete on `005-admin-dashboard` (55/60). Polish (T055/T056/T057/T059 + T006 migration) paused for v1 focus; resumes post-launch. Dashboard at current state will be used for launch monitoring. |
| **v1 launch readiness** | 🟡 Sprinting | Week 1 (build + D-AC) → 05-29; week 2 (implement + pre-launch checks) → 06-05; week 3 (fix + deploy) → 06-11. Charl writes **6 sequences × 3 emails = 18 emails** — commit not yet in writing. No weekend deadlines. |

---

## What's shipped

- 001 — Worship Wheel Assessment (questions, scoring, radar chart, lead capture)
- 002 — Scoring optimisation with checklist response expansion
- 003 — Results page UI
- 005 — Admin dashboard US1–US5 (auth, funnel + event tracking, acquisition, outcomes, leads + CSV export + Keap sync-health panel) — code-complete on `005-admin-dashboard`

## What's in progress

- v1 launch build sprint — Derick week 1 (2026-05-22 → 2026-05-29). See [`v1-launch/`](v1-launch/)

## What's parked

- 005 admin dashboard polish — T006 (Supabase migration), T055/T056/T057/T059 (live-DB-dependent polish). Resumes post-v1-launch.

## Active blockers

| Blocker | Owner | Impact | Status |
|---|---|---|---|
| **Charl's email-copy commit (C-1)** | Charl (request from Derick) | D-4 sequence build depends on copy in hand 2026-05-29. **Scope = 6 archetype sequences × 3 emails = 18 emails.** | **No written commit yet** — Derick's target only |
| **Archetype coverage (D-AC)** | Derick | Code currently has a `fallback_<ELEMENT>` path that fires for plausible inputs (e.g. all-6s scores). Product directive: no fallback. Must resolve before D-3 and C-1 can lock final tag set. | Target 2026-05-25 (Mon) |

## What's next

1. **Today (2026-05-22, Fri)** — put the 2026-05-29 email-copy target + 18-email scope to Charl in writing
2. **By 2026-05-25 (Mon)** — D-AC (archetype coverage) resolved; D-1 (hide VSL) shipped; PDF approach decided; cadence agreed with Charl; Charl begins drafting C-1
3. **By 2026-05-29 (Fri)** — D-2 (PDF), D-3 (Keap push), D-5a (solo dry-run) all done; Charl delivers all 18 emails (C-1)
4. **2026-06-01 → 2026-06-05** — Derick implements emails into Keap sequences (D-4) and runs pre-launch checks (D-5b)
5. **2026-06-08 → 2026-06-11** — Buffer, cohort import, production deploy, go/no-go

---

## Recent changes

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
