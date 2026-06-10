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
- 2026-05-29 · ✅ · After Charl set the key, recovered the 3 via `npm run keap:resync` → Keap contacts 83206 / 88313 / 88315, statuses flipped to `synced`
- 2026-05-29 · ❌ · After key set + redeploy, synthetic prod submission stayed `keap_sync_status='pending'` for 110s+ — bare fire-and-forget Keap push doesn't complete on Vercel (instance frozen once response is sent). Would have silently dropped every real lead despite no `failed` rows
- 2026-05-29 · ✅ · Fixed with `waitUntil` (PR #6) → fresh synthetic submission on the new deploy synced in <5s (`status=synced`). Synthetic test rows deleted from `assessment_sessions`
- 2026-06-04 · ❌ · Prod submission as `office+4@jbaystudios.com` → Keap `worship_wheel_results_url` = `http://localhost:3000/results/74d5eeef-…` (dead link). Cause: `NEXT_PUBLIC_BASE_URL=http://localhost:3000` leaked into Vercel **Production** (build-time inlined, likely copied from `.env.local` during the env-parity fix). Affects every prod results link
- 2026-06-04 · 🔧 · Hardening landed (`src/lib/base-url.ts` + tests): submit route now falls back to the real request origin if the env base is localhost on a non-local request; resync + CSV export resolve to canonical prod. **Still required:** set `NEXT_PUBLIC_BASE_URL=https://worshipwheel.com` for Production in Vercel + redeploy (rebuild), then re-test. Pending live re-verification
- 2026-06-04 · ❌ · **CRITICAL (corrects the entry above):** fresh prod submission as `office+4@jbaystudios.com` (`7d996bd6`, score 32) → Supabase `keap_sync_status='synced'` with no error, contact 88315 timestamp bumped — but **none of the 4 WW custom fields were written** (still held 05-29 values; the localhost value seen earlier was written by the **local** `keap:resync` on 05-29, NOT by prod). Root cause: **`KEAP_FIELD_WW_*` (265/267/269/271) + `KEAP_TAG_WW_COMPLETED` (3967) env vars are not set in Vercel Production**, so `buildCustomFields` returns `[]`, the PUT writes no fields, and `sync.ts` still marks `synced` (soft-warns only). **Every real prod lead is tagged-or-not but gets zero archetype/results_url/score in Keap → breaks the entire follow-up automation.** Confirmed: a direct PUT with the same field IDs from local DID overwrite the fields (upsert works); prod simply isn't sending them. Verified via local diagnostic scripts; contact 88315 restored to real values afterward
- 2026-06-04 · ⏳ · Fix pending: mirror all `KEAP_*` ID vars to Vercel Production (`KEAP_FIELD_WW_ARCHETYPE=265`, `KEAP_FIELD_WW_RESULTS_URL=267`, `KEAP_FIELD_WW_OVERALL_SCORE=269`, `KEAP_FIELD_WW_OVERALL_PERCENTAGE=271`, `KEAP_TAG_WW_COMPLETED=3967`) + `NEXT_PUBLIC_BASE_URL=https://worshipwheel.com` → redeploy → re-submit test → confirm all 4 fields populate with a `worshipwheel.com` results URL. Also harden `sync.ts` to NOT report `synced` when custom fields are missing
- 2026-06-05 · ❌ · Interim re-tests (`office+wwqa`, `office+5june`) still wrote bare contacts — `synced` but null fields and **no tag**. Root cause widened: the 5 `KEAP_*` ID vars (4 fields + tag `3967`) had never been promoted to Production/Preview (only `.env.local`). Contact still created, so `KEAP_SERVICE_ACCOUNT_KEY` was fine — narrowly the ID vars
- 2026-06-05 · ✅ · **RESOLVED.** Charl added all 5 `KEAP_*` ID vars + `NEXT_PUBLIC_BASE_URL` to Production+Preview and redeployed. Fresh prod submit (`office+wwqa@jbaystudios.com`, contact 88380) synced on first poll with ALL correct: `worship_wheel_archetype=balanced_beginner`, `overall_score=42`, `overall_percentage=52.5`, `results_url=https://worshipwheel.com/results/ecc6df44…` (canonical, not localhost), completion tag `3967` applied. End-to-end prod Keap sync verified working. (Code hardening — base-url fallback + `sync.ts` fail-loud on missing fields — built + tested locally, still to be committed/deployed as the safety net)

## Results PDF download (D-2)
- 2026-05-29 · ❌ · Complete assessment → results page → PDF download returned HTTP 500 (`api/results/58a7c5fd-…/pdf`). Cause: Montserrat `.woff` fonts not traced into the Vercel function bundle (runtime `path.join`), so `Font.register` hit ENOENT
- 2026-05-29 · ✅ · Re-verified after fix (PR #3, `outputFileTracingIncludes`) deployed → `58a7c5fd-…/pdf` returns `200 application/pdf` (~22 KB) on `worshipwheel.com`. First real prod exercise of the PDF route

## Archetype reveal copy (results page + PDF)
- 2026-06-05 · ✅ · PR #7 merged + deployed. Live `worshipwheel.com/results/ecc6df44-…` now renders Charl's full per-archetype reveal copy (verified the Balanced Beginner reveal "…drastically dragging the others down…" is present; old one-line `message` gone). Same `reveal` also wired into the PDF ScoresPage. Source: `src/data/archetype-content.ts`

## Results page by-id (003 follow-up)
- 2026-05-29 · ✅ · `worshipwheel.com/results/58a7c5fd-…` (server-loaded by id) returns `200` and renders "Your Worship Wheel" — lets Keap email links / shared links return users to results in a fresh session. Malformed and valid-but-missing ids both return the empty state (no 500)

## Admin dashboard (005)
- 2026-05-28 · ✅ · Sign in to `/admin/login` as `derick@swaydeandco.com` after service-role password reset → dashboard loads with stats populated from test submissions

## Keap email opt-in + merge fields + Completed tag (spec 008 + follow-ups)
- 2026-06-10 · ✅ · Live prod end-to-end on `derick+cs04@swaydeandco.com`. Opt-in: fresh contact moved `NonMarketable → SingleOptIn` (XML-RPC `APIEmailService.optIn`); retake left it `SingleOptIn` (no downgrade). Rhythm Machine submit → `archetype=rhythm_machine`, `archetype_name="Rhythm Machine"`, `result_id` populated (matches `results_url`), tags `3984 Completed Assessment` + `3974 Rhythm Machine`. First follow-up emails actually delivered (were silently blocked before — contacts defaulted `NonMarketable`). PRs #11/#12/#13. Required Vercel env (Production): `KEAP_FIELD_WW_ARCHETYPE_NAME=272`, `KEAP_FIELD_WW_RESULT_ID=274`, `KEAP_TAG_WW_COMPLETED_HISTORY=3984` — the two field vars were briefly Preview-only, fixed + redeployed.
