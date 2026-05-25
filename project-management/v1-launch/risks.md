# v1 Launch — Risks & Blockers

**As of 2026-05-25.** Updated whenever a new risk is identified or an existing one changes state.

Severity:
- 🔴 **High** — actively blocks the critical path or threatens the 2026-06-12 date
- 🟡 **Medium** — could become high if not addressed within a week
- 🟢 **Low** — known issue, has a clear mitigation, not date-threatening

---

## 🔴 R-2 · Charl has not committed to the 2026-05-29 email-copy date

- **Impact:** D-4 (week-2 sequence build) depends on C-1 being in hand by 2026-05-29. The May 29 date was set by Derick, not agreed by Charl. Scope (as of 2026-05-22): **6 archetype sequences × 3 emails per sequence = 18 emails total.** With the no-weekend rule, Charl's effective writing window is Tue 05-26 → Fri 05-29 = **4 working days for 18 emails (~4.5 emails/day)**. If D-AC (see R-8) reveals coverage gaps and adds archetypes, the scope grows by 3 emails per added archetype and the window gets tighter.
- **Owner of resolution:** Derick (put the date + 18-email scope to Charl) → Charl (confirm in writing)
- **Mitigation:**
  - Derick puts the date AND the 18-email scope to Charl in writing today (2026-05-22) and asks for a yes/no
  - Agree the per-email cadence (e.g. day 0, day 3, day 7) on Mon 2026-05-25 so Charl is writing into a known shape from Tuesday onwards
  - Mid-week check-in (Wed 2026-05-27) on draft progress
  - If 18 emails is too much in 4 working days, fall-back option: write one generic nurture sequence for v1 and add per-archetype sequences in v1.1
- **Trigger for escalation:** No written commit from Charl by 2026-05-25 (Mon) → renegotiate scope (drop to single nurture sequence) or move launch date
- **Contingency if C-1 slips to 2026-06-02:** D-4 + D-5b compress into ~3 working days; week-3 buffer evaporates.
- **Contingency if C-1 slips past 2026-06-05:** Launch date moves.

## 🟢 R-4 · PDF rendering approach — RESOLVED 2026-05-25

- **Decision:** `@react-pdf/renderer` rendered server-side at `/api/results/[resultId]/pdf`, reading from Supabase via the existing service-role client.
- **Why this over alternatives:** `html2pdf` was the R-4 default but produces a screenshot-style PDF (text not selectable, charts blur, fiddly page breaks) — fails the "professional report" bar Derick set. Puppeteer would give pixel-perfect output but adds a ~50MB bundle and 3–5s cold starts on Vercel, and the results page is sessionStorage-only so it'd need a separate server-rendered print route anyway.
- **Trade-off accepted:** a separate PDF layout component (not the on-screen UI). That separation is actually what makes the PDF look like a designed report instead of a screenshot of a web page.
- **Spec:** [`/specs/006-results-pdf-download/spec.md`](../../specs/006-results-pdf-download/spec.md)

## 🟡 R-5 · Cohort access mechanism undefined

- **Impact:** "Controlled cohort" is currently a phrase, not an implementation. Open public URL? Invite-only link? Login required? Shapes what we build.
- **Mitigation:** Decision needed by 2026-05-28 (Thu) so any required gating logic can ship alongside D-3.
- **Trigger for escalation:** No decision by 2026-05-28

## 🟡 R-8 · Archetype coverage gap (D-AC)

- **Impact:** Product directive (2026-05-22): no user should ever see a `fallback_<ELEMENT>` archetype — every user lands in one of the 6 named archetypes. But the current code at `src/lib/scoring/archetypes.ts` returns `fallback_<ELEMENT>` for plausible inputs (e.g. all-6s scores: overall=48, all ≥5 but <55 → no Almost-There; values >4 → no Balanced Beginner; small spread → no Uneven Intermediate). Until D-AC closes this, D-3 may tag users with a key Keap has no sequence for, and C-1's scope can't be fully locked.
- **Owner of resolution:** Derick
- **Mitigation:** D-AC delivers one of four paths by 2026-05-25 (Mon):
  - **Path A — Prove coverage:** Property-test or exhaustive sweep proves the existing 6 rules cover the full score space.
  - **Path B — Expand archetypes:** Add 1+ new archetype rules. **Each new archetype adds 3 emails to C-1.** Notify Charl same day.
  - **Path C — Relax existing rules:** Soften thresholds so the 6 archetypes overlap to cover the full space.
  - **Path D — Default archetype:** Pick one of the 6 (likely Balanced Beginner) as deterministic default when no rule matches. Remove `fallback_<ELEMENT>` code path.
- **Trigger for escalation:** If Path B identifies 2+ new archetypes, Charl's C-1 scope grows by 6+ emails — may threaten 2026-05-29 delivery; escalate as scope change immediately.

## 🟦 R-6 · 005 admin dashboard polish — PARKED 2026-05-22

- **Impact:** Supabase migration T006 and live-DB e2e validation outstanding. Dashboard at its current code-complete state will be used for v1 launch monitoring.
- **Decision:** Polish paused for v1 launch focus; resumes post-2026-06-12.
- **Re-evaluate:** Week of 2026-06-15 — first task post-launch should be re-triaging the parked polish items and confirming Supabase MCP auth path before resuming.

## 🟢 R-7 · No staging environment for Keap sequence testing

- **Impact:** Testing sequences in Keap risks sending real-looking emails to test contacts.
- **Mitigation:** Use dedicated test contacts with a clearly-tagged segment; suppress sends to anyone not in the test segment until launch day. More important now that D-4 testing happens week 2.

---

## ✅ Resolved risks

### R-1 · Keap API credentials — resolved 2026-05-22
- Service Account Key added to `.env.local` by Derick. D-3 (Keap push) unblocked.

### R-3 · Vercel team invite — resolved 2026-05-22
- Derick has access to the `office-3285` Vercel team. D-6 (production deploy) unblocked.

---

## How to use this list

- The `project-manager` skill reads this file at the start of any PM-style conversation.
- A risk moves to "Resolved" only when its mitigation has been confirmed in writing (commit, message, doc), not just verbally agreed.
- New risks get added with the same template: severity, impact, owner, mitigation, escalation trigger.
