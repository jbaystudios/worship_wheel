/**
 * Re-push assessment sessions whose Keap sync failed (or never completed).
 *
 * The /api/submit Keap push is fire-and-forget; on error it records
 * keap_sync_status='failed' and surfaces in the admin sync-health panel, but
 * there is no automatic retry. This one-off recovers those rows — e.g. after
 * KEAP_SERVICE_ACCOUNT_KEY was missing in production. The upsert is idempotent
 * (PUT /v1/contacts dedups by email; the completion tag applies once), so it's
 * safe to run more than once.
 *
 * Usage:
 *   npm run keap:resync -- --dry-run     # list what would be resynced, no writes
 *   npm run keap:resync                  # actually re-push to Keap
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, the KEAP_*
 * field/tag ids, KEAP_SERVICE_ACCOUNT_KEY, and NEXT_PUBLIC_BASE_URL in .env.local.
 */
import { createClient } from '@supabase/supabase-js';

// Load .env.local (Node 20.12+). Ignore if unavailable — env may already be set.
try {
  process.loadEnvFile?.('.env.local');
} catch {
  /* env vars expected to be present already */
}

const DRY_RUN = process.argv.includes('--dry-run');

interface FailedRow {
  id: string;
  first_name: string;
  email: string;
  overall_score: number;
  overall_percentage: number;
  profile_archetype: string;
  keap_sync_status: string;
  keap_sync_error: string | null;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (.env.local).');
    process.exit(1);
  }

  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL ?? 'https://worshipwheel.com').replace(/\/$/, '');

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await supabase
    .from('assessment_sessions')
    .select(
      'id,first_name,email,overall_score,overall_percentage,profile_archetype,keap_sync_status,keap_sync_error',
    )
    .in('keap_sync_status', ['failed', 'pending'])
    .order('created_at', { ascending: true });

  if (error) {
    console.error(`Query failed: ${error.message}`);
    process.exit(1);
  }

  const rows = (data ?? []) as FailedRow[];
  if (rows.length === 0) {
    console.log('✓ No failed or pending Keap syncs. Nothing to do.');
    return;
  }

  console.log(`Found ${rows.length} session(s) needing resync:\n`);
  for (const r of rows) {
    console.log(`  • ${r.email}  [${r.keap_sync_status}]  ${r.id}`);
    if (r.keap_sync_error) console.log(`      last error: ${r.keap_sync_error}`);
  }
  console.log('');

  if (DRY_RUN) {
    console.log('--dry-run: no changes made. Re-run without --dry-run to push to Keap.');
    return;
  }

  // Imported lazily so --dry-run never touches the Keap client / env.
  const { syncSessionToKeap } = await import('../lib/keap/sync');

  let synced = 0;
  let failed = 0;
  for (const r of rows) {
    const outcome = await syncSessionToKeap({
      resultId: r.id,
      firstName: r.first_name,
      email: r.email,
      overallScore: r.overall_score,
      overallPercentage: Number(r.overall_percentage),
      archetypeKey: r.profile_archetype,
      resultsUrl: `${baseUrl}/results/${r.id}`,
    });
    if (outcome.status === 'synced') {
      synced++;
      console.log(`  ✓ ${r.email} → Keap contact ${outcome.contactId}`);
    } else {
      failed++;
      console.log(`  ✗ ${r.email} → ${outcome.error}`);
    }
  }

  console.log(`\nDone. ${synced} synced, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

main();
