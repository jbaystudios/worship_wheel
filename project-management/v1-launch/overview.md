# v1 Launch — Overview

**Launch date:** 2026-06-15 (Mon) — moved from 2026-06-12 (Fri) on 2026-06-11 (no-weekend rule + Charl)
**Audience:** Controlled cohort — a hand-picked segment of Charl's Keap/Infusionsoft database. Distribution-side gating only: open public URL on `worshipwheel.com`, no auth, no invite tokens. Charl chooses who receives the link. Size TBD via C-2.
**Status:** Scope agreed 2026-05-22; cohort access resolved 2026-05-28 (R-5). **Build complete + funnel live end-to-end 2026-06-11; in launch QA.**

## Goal

Get a working end-to-end version of the Worship Wheel into the hands of a small, controlled group so we can validate:
1. The assessment flow holds up under real-user behaviour.
2. The Keap follow-up sequences actually convert (or surface what to change).
3. The PDF deliverable is something users save, share, or come back to.

## In scope for v1

- ✅ Core 24-question assessment flow (3 per element)
- ✅ Results page with radar chart and recommendations
- ✅ **Printable PDF download** from the results page (D-2)
- ✅ **Keap push** — completed assessments create/update Keap contacts with archetype + custom fields + completion tag; auto opted-in so emails deliver (D-3 + spec 008)
- ✅ **Keap follow-up email sequences — one dedicated sequence per profile archetype** (6 archetypes). No fallback path — every user lands in a named archetype (D-AC). Built by Charl in Keap, app-side wiring by Derick (D-4). Live end-to-end 2026-06-11; full cadence sign-off in D-5b QA.
- ✅ Lead capture (already live)
- ✅ Admin dashboard for monitoring (005 — shipped, pending polish)

## Out of scope for v1 (hidden / deferred)

- ❌ **VSL / sales-video section on the assessment page** — hidden for v1, will return in a later release
- ❌ Public marketing launch — controlled cohort only
- ❌ Paid traffic / acquisition campaigns
- ❌ Multi-language support
- ❌ Saved sessions / account creation

## Scheduling rules

- **No deadlines on Saturdays or Sundays.** Any target that would otherwise land on a weekend is pushed to the following Monday.

## Success criteria

- Assessment completion rate ≥ baseline measured during the 003 results page rollout
- ≥ 90% of completions successfully push to Keap (sync-health panel green)
- ≥ 50% of completions download the PDF
- Charl's first follow-up email sees at least one engagement (open/click) per completed assessment

## Open questions

These need resolution before scope is fully locked. Tracked in [`risks.md`](risks.md):

- **Cohort size and selection criteria** — who is in the controlled group? (Owner: Charl)
- **Email cadence** — when each of the 3 emails per sequence sends (e.g. day 0, day 3, day 7). Decision deadline 2026-05-25 (Mon). (Owner: Charl + Derick)
- **Archetype coverage strategy (D-AC)** — Path A (prove) / B (expand) / C (relax) / D (default). Decision deadline 2026-05-25 (Mon). (Owner: Derick)
- **Soft-launch vs hard-launch on June 12** — staggered access or open the gate at once? (Owner: Charl + Derick)
- **Resolved 2026-05-28:** Cohort access mechanism — open public URL on a custom domain (`worshipwheel.worshipguitarskills.com`). Charl segments his Keap audience and distributes the link; no auth or invite-token logic to build. See [`risks.md#R-5`](risks.md).
- **Resolved 2026-05-22:** PDF design review — Charl trusts Derick's first pass; reviews post-build via C-3 (non-blocking).
- **Resolved 2026-05-22:** Email count per sequence — 3 emails per sequence (provisional; may revisit in the coming days).
- **Resolved 2026-05-22:** Fallback sequence handling — no fallback. Every user must land in a named archetype, enforced via D-AC.
- **Resolved 2026-05-22:** Weekend scheduling — no deadlines on Sat/Sun; default to following Monday.

## Related documents

- [`deliverables.md`](deliverables.md) — work breakdown by owner
- [`timeline.md`](timeline.md) — week-by-week schedule
- [`risks.md`](risks.md) — blockers and dependencies
- [`qa-log.md`](qa-log.md) — running list of manual QA checks (walked with Charl pre-launch)
- [`../STATUS.md`](../STATUS.md) — overall project state
- [`/specs/001-worship-wheel-assessment/spec.md`](../../specs/001-worship-wheel-assessment/spec.md) — full functional spec
