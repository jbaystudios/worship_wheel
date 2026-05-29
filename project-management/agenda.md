# Worship Guitar Skills — Worship Wheel Assessment

**Date:** 2026-05-28
**Launch:** 2026-06-12 (15 days)

> Rolling agenda — updated as we go. Each check-in: bump the date, archive what shipped, refresh the to-dos and open questions.

---

## ✅ Completed since last check-in

- D-2 — Results PDF download shipped (server-side, top + bottom CTA, `pdf_downloaded` event tracked)
- D-3 — Keap push live-tested (contact 88271 created, tag 3967 + 4 custom fields, idempotency confirmed)
- D-AC — Archetype coverage closed (Path D: defaults to Balanced Beginner, no fallback)
- D-7 — Submit consent checkbox added to assessment
- D-1 — VSL / sales CTA hidden behind feature flags (cross-width visual check still pending)
- R-5 — Cohort access mechanism resolved: open URL, Charl distributes to a Keap segment
- Admin sign-in restored for Derick (password reset)
- Charl provisioned as admin user (`charl@guitarskills.com`)
- Vercel housekeeping (stale cron removed, redeploy after repo visibility change)

## 📋 Derick's to-do

- D-5a — Solo dry-run smoke test (Fri 2026-05-29) — covers D-1 cross-width check + PDF cross-viewer rendering
- D-4 — Build Keap automation + 6 archetype sequences (blocked on C-1; target 2026-06-03 Wed)
- D-5b — Pre-launch checklist run (Fri 2026-06-05)
- D-6 — Production deploy + custom domain live on Vercel (Thu 2026-06-11)
- Once DNS access granted: add the chosen (sub)domain to Vercel and verify TLS
- (Optional, low-cost) Write `admin:reset-password` script before launch as ops insurance

## 📋 Charl's to-do

- C-1 — Deliver 18 emails (6 archetype sequences × 3 emails) to Derick by Fri 2026-05-29 — **written commit still pending**
- Grant Derick DNS access for `worshipguitarskills.com` (needed by 2026-06-08)
- C-2 — Hand cohort list (names + emails) to Derick by Fri 2026-06-05
- C-3 — Review the live PDF after Derick ships it (non-blocking)
- Rotate the temporary admin password on first sign-in to the dashboard

## ❓ Open questions

- **Which domain or subdomain do we want to use for this tool?** Default assumption in the project docs has been `worshipwheel.worshipguitarskills.com` — confirm or pick an alternative. (Owner: Charl + Derick)
- Soft-launch vs hard-launch on 2026-06-12 — staggered access over the day, or open the gate at once? (Owner: Charl + Derick)
- Per-email cadence inside each archetype sequence (e.g. day 0, day 3, day 7) — needs to be agreed so C-1 copy is written into a known shape (Owner: Charl + Derick)
- Do we want an in-app password-change UI for v1, or is "rotate via Supabase Studio" acceptable for the controlled cohort? (Owner: Derick)
