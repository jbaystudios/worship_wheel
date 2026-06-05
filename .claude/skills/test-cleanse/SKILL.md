---
name: test-cleanse
description: Wipe all test submission data from Supabase and reset the admin dashboard to zero before launch. Use when the user says "run the test cleanse", "flush the test data", "reset the dashboard / stats", "wipe submissions", "clear the test submissions", or similar. Runs a guarded dry-run → confirm flow and lists the Keap test contacts the user must delete manually.
---

# Test Cleanse Skill

Wipes **all** assessment submission + event data from Supabase so the admin dashboard resets to zero. This is a pre-launch tool for clearing accumulated test runs.

The work is done by `src/scripts/cleanse-test-data.ts` (run via `npm run test:cleanse`). This skill is the safe operating procedure around it.

## What it touches

- `assessment_events` (deleted first — FK to sessions, no cascade)
- `assessment_sessions` (the submissions)
- `aggregate_stats` (unused; cleared for completeness)

Admin dashboard stats (funnel / acquisition / outcomes / leads / sync health) are computed **live** from these tables, so once the rows are gone every panel reads zero automatically. There is nothing else to reset.

Keap contacts are **not** touched by this script — the user deletes those manually. The script prints the list of emails so they know exactly which test contacts to remove.

## ⚠️ Safety facts — always honor these

- This hits the **same Supabase project production uses** (there is no separate test DB). Treat it as destructive against live data.
- The script **defaults to a dry run**. It only deletes with `--confirm`.
- It **aborts if there are more than 50 sessions** unless `--force` is passed — a guard against wiping real cohort data after the June 12 launch.
- **Never pass `--force` on your own.** Only add it if the user explicitly tells you to, after you've shown them the count and they confirm the data is expendable.

## Procedure (follow every step)

1. **Dry run first.** Run:
   ```bash
   npm run test:cleanse
   ```
   This prints the current row counts and the distinct emails in `assessment_sessions`.

2. **Show the user** the counts and the email list. Make clear this is what will be deleted.

3. **Get explicit confirmation.** Ask the user to confirm they want to wipe it. Do not proceed on assumption.
   - If the session count is **over 50**, stop and flag it loudly — that's more than "a little test data," so confirm the data really is disposable before considering `--force`. Surface this; don't silently force.

4. **Execute** once confirmed:
   ```bash
   npm run test:cleanse -- --confirm
   ```
   (Add `--force` **only** if the user explicitly told you to after the over-threshold warning.)

5. **Report the result** — confirm sessions/events are now zero, and that the dashboard is reset.

6. **Remind the user to delete the Keap test contacts** — re-list the emails from the output. The cleanse does not remove anything in Keap.

## Notes

- Requires `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` (already present for the resync script).
- Safe to run the dry run any time — it's read-only.
- After a cleanse, the admin dashboard and the leads/sync-health panels will be empty until new submissions arrive.
