# v1 Launch — QA Log

Running record of manual QA we've run against the live stack. **One-liners only** — this is for Derick + Charl to walk before go-live (2026-06-12), not a regression suite.

**Last updated:** 2026-05-29

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
- 2026-05-29 · ❌ · Admin sync-health showed 3 prod syncs failed (`office@`, `office+wheel@`, `office+4@jbaystudios.com`) — cause: `KEAP_SERVICE_ACCOUNT_KEY` not set in Vercel prod (was only in local `.env.local`)
- 2026-05-29 · ✅ · After Charl set the key, recovered the 3 via `npm run keap:resync` → Keap contacts 83206 / 88313 / 88315, statuses flipped to `synced`. NOTE: prod still needs a redeploy for live submissions to pick up the key

## Results PDF download (D-2)
- 2026-05-29 · ❌ · Complete assessment → results page → PDF download returned HTTP 500 (`api/results/58a7c5fd-…/pdf`). Cause: Montserrat `.woff` fonts not traced into the Vercel function bundle (runtime `path.join`), so `Font.register` hit ENOENT
- 2026-05-29 · ✅ · Re-verified after fix (PR #3, `outputFileTracingIncludes`) deployed → `58a7c5fd-…/pdf` returns `200 application/pdf` (~22 KB) on `worshipwheel.com`. First real prod exercise of the PDF route

## Results page by-id (003 follow-up)
- 2026-05-29 · ✅ · `worshipwheel.com/results/58a7c5fd-…` (server-loaded by id) returns `200` and renders "Your Worship Wheel" — lets Keap email links / shared links return users to results in a fresh session. Malformed and valid-but-missing ids both return the empty state (no 500)

## Admin dashboard (005)
- 2026-05-28 · ✅ · Sign in to `/admin/login` as `derick@swaydeandco.com` after service-role password reset → dashboard loads with stats populated from test submissions
