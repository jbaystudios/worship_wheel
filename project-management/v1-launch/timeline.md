# v1 Launch — Timeline

**Launch:** 2026-06-12 · **Today:** 2026-05-22

**Tightened 2026-05-22, refined 2026-05-22 (3×):**
- Week 1 — Derick build sprint Mon–Fri, finishing 2026-05-29 (D-1, D-2, D-3, D-AC, D-5a solo dry-run). Charl delivers C-1 (18 emails across 6 archetype sequences) on 2026-05-29.
- Week 2 — Derick implements Charl's emails into Keap sequences (D-4) and runs the pre-launch check (D-5b).
- Week 3 — Buffer for fixes, cohort import, production deploy, go/no-go.
- **No deadlines on weekends.** Saturdays / Sundays are free time; deliverables that previously fell on weekends are pushed to the following Monday.

Critical path is in **bold**.

---

## Week 1 · 2026-05-22 → 2026-05-29 — Build sprint

| Date | Day | Owner | Item | Notes |
|---|---|---|---|---|
| 2026-05-22 | Fri | Derick | ✅ **Keap Service Account Key in `.env.local`** | D-3 unblocked (R-1 closed) |
| 2026-05-22 | Fri | Derick | ✅ **Vercel `office-3285` access in hand** | D-6 unblocked (R-3 closed) |
| 2026-05-22 | Fri | Derick | **Put date + 18-email scope to Charl in writing, get yes/no** | C-1 commit is the biggest week-1 risk |
| 2026-05-25 | Mon | Derick + Charl | **Agree email cadence** (e.g. day 0, day 3, day 7) | Short conversation; unblocks Charl |
| 2026-05-25 | Mon | Derick | **Ship D-AC — archetype coverage** | Choose path A (prove) / B (expand) / C (relax) / D (default). If Path B, feed scope change to Charl same day. |
| 2026-05-25 | Mon | Derick | **Ship D-1 (hide VSL)** | Feature-flagged; quick win |
| 2026-05-25 | Mon | Derick | Decide PDF rendering approach (SSR vs client) | Default to client `html2pdf` if undecided |
| 2026-05-25 | Mon | Charl | **Begin drafting C-1** (after cadence agreed) | 18 emails to write across Tue–Fri |
| 2026-05-27 | Wed | Derick | **Ship D-2 (PDF download)** | First-pass design; Charl reviews post-build (C-3) |
| 2026-05-28 | Thu | Derick | **Ship D-3 (Keap push)** | Includes archetype tagging from D-AC's final tag set |
| 2026-05-29 | Fri | Derick | **D-5a — solo dry-run smoke test** | Full flow desktop + mobile; confirm Keap lands with a real archetype tag (never fallback) |
| 2026-05-29 | Fri | Charl | **Deliver email copy (C-1) to Derick** | 18 emails across 6 archetype sequences |

**Exit criteria:** D-1/D-2/D-3/D-AC merged, dry-run green, Charl's copy in Derick's hands.

> ⚠️ Monday 2026-05-25 is the heaviest day of week 1 — D-AC + D-1 + PDF decision + cadence convo, then Charl starts drafting. Realistic for Derick (~1 day of focused work) but leaves Charl only Tue–Fri (4 working days) for 18 emails. Confirm realism when putting the date to Charl on Friday.

---

## Week 2 · 2026-05-30 → 2026-06-05 — Implement emails + pre-launch checks

| Date | Day | Owner | Item | Notes |
|---|---|---|---|---|
| 2026-06-01 | Mon | Derick | Begin D-4 — implement Charl's copy into Keap sequences (one per archetype) | Build all 6 sequences × 3 emails |
| 2026-06-03 | Wed | Derick | **Complete D-4** — all archetype sequences live, tagged, test-routed | Test contacts run through each end-to-end |
| 2026-06-03 | Wed | Charl | C-3 — PDF design review (post-build) | Non-blocking; send back any changes |
| 2026-06-04 | Thu | Derick | **Begin D-5b — pre-launch checks** | Structured checklist run; see deliverables.md |
| 2026-06-05 | Fri | Charl | Deliver cohort list (C-2) | Names + emails |
| 2026-06-05 | Fri | Derick | **Complete D-5b — all checks passing or triaged** | Any failures become week-3 fix list |

**Exit criteria:** All 6 archetype sequences delivering, pre-launch checks passed, cohort list received.

---

## Week 3 · 2026-06-08 → 2026-06-11 — Fix, deploy, prep

| Date | Day | Owner | Item | Notes |
|---|---|---|---|---|
| 2026-06-08 | Mon | Derick | Triage and fix any D-5b issues + import cohort to Keap with launch tags | Don't trigger sequences until launch day |
| 2026-06-09 | Tue | Derick | Buffer / additional fixes | |
| 2026-06-10 | Wed | Derick | Final pre-deploy review | Last chance to catch anything before deploy |
| 2026-06-11 | Thu | Derick | **D-6 production deploy + smoke test** | Requires Vercel team access |
| 2026-06-11 | Thu | Charl + Derick | **Go/no-go meeting (S-1)** | Final green-light |

**Exit criteria:** Production stable, smoke test passes, both owners signed off.

---

## Launch day · 2026-06-12 (Fri)

- Cohort receives access (mechanism still TBD — see [`risks.md#R-5`](risks.md))
- Monitor admin dashboard (sync-health, funnel, events) throughout the day
- 15-minute end-of-day check-in between Charl and Derick

---

## Critical path

The chain that determines whether 2026-06-12 is achievable:

**D-AC archetype coverage closes 05-25 → Charl commits to 05-29 + 18-email scope → C-1 delivered 05-29 → D-4 sequences built 06-03 → D-5b checks pass 06-05 → D-6 deploy 06-11 → Launch**

Parallel paths that must also complete:
- Keap creds (05-22) → D-3 with archetype tagging (05-28) → D-4
- PDF approach decision (05-25) → D-2 (05-27) → D-5a (05-29)
- Vercel team invite (week 1) → D-6 (06-11)
- R-5 cohort access decision (by 05-28) → D-5b cohort access verification (06-04 → 05)

**Weakest links right now:**
1. **C-1 commit + scope.** May 29 is Derick's target, not Charl's commit. Scope is concrete (18 emails) — easier to commit to, but still uncommitted. Charl's effective writing window is Tue–Fri (4 working days).
2. **D-AC outcome.** If D-AC (05-25) reveals a coverage gap that needs new archetypes (Path B), C-1 scope grows by 3 emails per added archetype. That conversation with Charl must happen the same day D-AC lands — and it already compresses Charl's already-tight window.

- If C-1 slips by 1–2 days → D-4 still fits in week 2 but D-5b starts late
- If C-1 slips to 2026-06-02 → D-4 and D-5b compress into ~3 working days; week-3 buffer evaporates
- If C-1 slips past 2026-06-05 → launch date moves
