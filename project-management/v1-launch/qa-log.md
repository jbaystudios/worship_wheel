# v1 Launch — QA Log

Running record of manual QA we've run against the live stack. **One-liners only** — this is for Derick + Charl to walk before go-live (2026-06-12), not a regression suite.

**Last updated:** 2026-05-28

---

## How to use
- One line per check, oldest first within each section.
- Format: `- YYYY-MM-DD · ✅/❌ · what we tested → outcome`
- If a check fails, leave the failed line and add a follow-up line when it's re-verified.
- Group by area. Add a new section heading whenever a new area gets its first check.

---

## Keap sync (D-3)
- 2026-05-25 · ✅ · Submit assessment as `ww-test@swaydeandco.com` → contact 88271 created in Keap with tag 3967 + all 4 custom fields populated (archetype = `balanced_beginner`)
- 2026-05-25 · ✅ · Resubmit same email with answers producing a different archetype → no duplicate contact, contact 88271 updated in place, `worship_wheel_archetype` overwritten to `theory_head`, tag count stayed at 1, Supabase wrote a new session row but reused the same Keap contact

## Admin dashboard (005)
- 2026-05-28 · ✅ · Sign in to `/admin/login` as `derick@swaydeandco.com` after service-role password reset → dashboard loads with stats populated from test submissions
