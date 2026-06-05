/**
 * Test-data cleanse — wipe ALL assessment submission + event data from Supabase
 * so the admin dashboard resets to zero. Pre-launch tool for clearing test runs.
 *
 * The admin dashboard stats (funnel / acquisition / outcomes / leads / sync
 * health) are computed LIVE from `assessment_sessions` and `assessment_events`,
 * so deleting these rows resets every panel automatically — there is no
 * aggregate table to reset. (`aggregate_stats` is defined but unused; cleared
 * here for completeness.)
 *
 * Delete order matters: `assessment_events.result_id` is an FK to
 * `assessment_sessions` with NO cascade, so events must be deleted first.
 *
 * SAFETY:
 *   - Defaults to a DRY RUN — prints counts and does nothing.
 *   - Requires `--confirm` to actually delete.
 *   - Aborts if `assessment_sessions` exceeds MAX_SAFE_SESSIONS (guards against
 *     wiping real cohort data after launch) unless `--force` is also passed.
 *
 * Usage:
 *   npm run test:cleanse                          # dry run — counts only
 *   npm run test:cleanse -- --confirm             # actually wipe
 *   npm run test:cleanse -- --confirm --force     # wipe past the safety threshold
 *
 * Note: this hits the same Supabase project prod uses (there is no separate test
 * DB). After wiping, delete the matching test contacts in Keap — the emails are
 * listed in the output so you know exactly which ones.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { listContactsWithCompletionTag } from '../lib/keap/tag-audit';

// Load .env.local (Node 20.12+). Ignore if unavailable — env may already be set.
try {
  process.loadEnvFile?.('.env.local');
} catch {
  /* env vars expected to be present already */
}

const CONFIRM = process.argv.includes('--confirm');
const FORCE = process.argv.includes('--force');

/** Above this many sessions, refuse to wipe without --force. Tuned for the
 *  pre-launch reality of "we don't generate much test data" — real cohort data
 *  will blow past this, which is exactly when we want a hard stop. */
const MAX_SAFE_SESSIONS = 50;

const EPOCH = '1970-01-01T00:00:00Z';

async function countRows(supabase: SupabaseClient, table: string): Promise<number> {
  const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
  if (error) throw new Error(`count ${table}: ${error.message}`);
  return count ?? 0;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (.env.local).');
    process.exit(1);
  }

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const sessions = await countRows(supabase, 'assessment_sessions');
  const events = await countRows(supabase, 'assessment_events');
  const aggregates = await countRows(supabase, 'aggregate_stats');

  console.log('Current Supabase data:');
  console.log(`  assessment_sessions = ${sessions}`);
  console.log(`  assessment_events   = ${events}`);
  console.log(`  aggregate_stats     = ${aggregates}`);

  // Surface the distinct emails so you know which Keap test contacts to delete.
  const { data: emailRows, error: emailErr } = await supabase
    .from('assessment_sessions')
    .select('email')
    .order('created_at', { ascending: true });
  if (emailErr) throw new Error(`read emails: ${emailErr.message}`);
  const emails = [...new Set((emailRows ?? []).map((r) => r.email as string))];
  if (emails.length > 0) {
    console.log('\n  Emails in assessment_sessions (delete these Keap contacts after wiping):');
    for (const e of emails) console.log(`    • ${e}`);
  }

  if (sessions === 0 && events === 0 && aggregates === 0) {
    console.log('\n✓ Already empty. Nothing to do.');
    return;
  }

  if (!CONFIRM) {
    console.log('\n--- DRY RUN — no data deleted. ---');
    console.log('Re-run with:  npm run test:cleanse -- --confirm   to wipe the above.');
    return;
  }

  if (sessions > MAX_SAFE_SESSIONS && !FORCE) {
    console.error(
      `\n✗ ABORT: ${sessions} sessions exceeds the safety threshold (${MAX_SAFE_SESSIONS}).`,
    );
    console.error(
      '  This is a guard against wiping real cohort data. If you are certain, re-run with --force.',
    );
    process.exit(1);
  }

  console.log('\nDeleting (events → sessions → aggregate_stats) ...');

  // 1. events first — FK to sessions, no cascade.
  {
    const { error } = await supabase.from('assessment_events').delete().gte('created_at', EPOCH);
    if (error) throw new Error(`delete assessment_events: ${error.message}`);
  }
  // 2. sessions.
  {
    const { error } = await supabase.from('assessment_sessions').delete().gte('created_at', EPOCH);
    if (error) throw new Error(`delete assessment_sessions: ${error.message}`);
  }
  // 3. aggregate_stats — unused, cleared for completeness (serial id).
  {
    const { error } = await supabase.from('aggregate_stats').delete().neq('id', 0);
    if (error) throw new Error(`delete aggregate_stats: ${error.message}`);
  }

  const after = {
    sessions: await countRows(supabase, 'assessment_sessions'),
    events: await countRows(supabase, 'assessment_events'),
    aggregates: await countRows(supabase, 'aggregate_stats'),
  };
  console.log(
    `\nAfter cleanse: sessions=${after.sessions} events=${after.events} aggregate_stats=${after.aggregates}`,
  );

  if (after.sessions === 0 && after.events === 0 && after.aggregates === 0) {
    console.log('✓ Supabase wiped. Admin dashboard stats are now zero.');
  } else {
    console.error('✗ Some rows remain — check the errors above.');
    process.exit(1);
  }

  // Keap-side check: confirm no contact still carries the completion tag. The
  // operator deletes Keap test contacts manually (often in parallel), so a
  // non-zero count here just means cleanup is still in progress — re-run
  // `npm run keap:check-tag` until it's clean.
  console.log('\nChecking Keap for the completion tag ...');
  try {
    const { tagId, contacts, reportedCount, staleEntriesIgnored } =
      await listContactsWithCompletionTag();
    if (staleEntriesIgnored > 0) {
      console.log(
        `  (Keap's tag index reported ${reportedCount}; ${staleEntriesIgnored} were stale and ignored after per-contact verification.)`,
      );
    }
    if (contacts.length === 0) {
      console.log(`✓ Keap is clean — no contacts verifiably carry the completion tag (${tagId}).`);
    } else {
      console.log(`⚠ ${contacts.length} contact(s) still carry the completion tag (${tagId}):`);
      for (const c of contacts) console.log(`    • ${c.id}  ${c.email ?? '(no email)'}`);
      console.log('  Delete these in Keap, then re-run:  npm run keap:check-tag');
    }
  } catch (err) {
    console.log(`  (Keap check skipped: ${err instanceof Error ? err.message : err})`);
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
