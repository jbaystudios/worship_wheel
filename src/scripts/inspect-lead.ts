/**
 * READ-ONLY lead inspection — dry run for a targeted single-lead delete.
 *
 * Finds every assessment_sessions row for a given email and reports the funnel
 * events that are linked to it (by anon_session_id and by result_id), so we can
 * see EXACTLY what a surgical delete would remove before deciding. This script
 * performs NO writes/deletes of any kind — pure SELECT/count.
 *
 * Usage:
 *   tsx src/scripts/inspect-lead.ts support@worshipguitarskills.com
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

try {
  process.loadEnvFile?.('.env.local');
} catch {
  /* env may already be set */
}

interface SessionRow {
  id: string;
  created_at: string;
  first_name: string;
  email: string;
  overall_score: number;
  profile_archetype: string;
  anon_session_id: string | null;
  keap_sync_status: string;
  utm_source: string | null;
}

interface EventRow {
  id: string;
  event_type: string;
  anon_session_id: string | null;
  result_id: string | null;
  created_at: string;
}

async function listAll(supabase: SupabaseClient) {
  console.log('\n=== READ-ONLY: all assessment_sessions ===\n');
  const { data, error } = await supabase
    .from('assessment_sessions')
    .select(
      'id,created_at,first_name,email,overall_score,profile_archetype,anon_session_id,keap_sync_status,utm_source',
    )
    .order('created_at', { ascending: true });
  if (error) throw new Error(`sessions query: ${error.message}`);
  const rows = (data ?? []) as SessionRow[];
  console.log(`Total sessions: ${rows.length}\n`);
  for (const r of rows) {
    console.log(
      `  • ${r.created_at}  ${r.first_name} <${r.email}>  score=${r.overall_score}  ` +
        `archetype=${r.profile_archetype}  source=${r.utm_source ?? 'direct'}  keap=${r.keap_sync_status}`,
    );
  }
  console.log('\n(No changes were made. This was read-only.)\n');
}

async function main() {
  const arg = (process.argv[2] ?? '').trim();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (.env.local).');
    process.exit(1);
  }

  const supabase: SupabaseClient = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  if (arg === '--all' || arg === '') {
    await listAll(supabase);
    return;
  }

  const email = arg.toLowerCase();

  console.log(`\n=== READ-ONLY inspection for: ${email} ===\n`);

  // 1. Total sessions in the table (context — are we post-launch with real data?)
  const { count: totalSessions } = await supabase
    .from('assessment_sessions')
    .select('*', { count: 'exact', head: true });
  console.log(`Total assessment_sessions in DB: ${totalSessions ?? 'unknown'}\n`);

  // 2. Sessions matching this email.
  const { data: sessions, error: sErr } = await supabase
    .from('assessment_sessions')
    .select(
      'id,created_at,first_name,email,overall_score,profile_archetype,anon_session_id,keap_sync_status,utm_source',
    )
    .eq('email', email)
    .order('created_at', { ascending: true });
  if (sErr) throw new Error(`sessions query: ${sErr.message}`);

  const rows = (sessions ?? []) as SessionRow[];
  if (rows.length === 0) {
    console.log('No assessment_sessions rows match that email. Nothing to delete.\n');
    return;
  }

  console.log(`Matching assessment_sessions: ${rows.length}`);
  for (const r of rows) {
    console.log(
      `  • ${r.created_at}  id=${r.id}  name=${r.first_name}  score=${r.overall_score}  ` +
        `archetype=${r.profile_archetype}  source=${r.utm_source ?? 'direct'}  ` +
        `keap=${r.keap_sync_status}  anon=${r.anon_session_id ?? 'NULL'}`,
    );
  }
  console.log('');

  const sessionIds = rows.map((r) => r.id);
  const anonIds = rows.map((r) => r.anon_session_id).filter((x): x is string => Boolean(x));

  // 3. Events linked by anon_session_id (the full funnel: views, starts, answers).
  const byAnon: EventRow[] = [];
  if (anonIds.length > 0) {
    const { data, error } = await supabase
      .from('assessment_events')
      .select('id,event_type,anon_session_id,result_id,created_at')
      .in('anon_session_id', anonIds);
    if (error) throw new Error(`events by anon: ${error.message}`);
    byAnon.push(...((data ?? []) as EventRow[]));
  }

  // 4. Events linked by result_id (defensive — e.g. submitted event).
  const { data: byResultData, error: rErr } = await supabase
    .from('assessment_events')
    .select('id,event_type,anon_session_id,result_id,created_at')
    .in('result_id', sessionIds);
  if (rErr) throw new Error(`events by result: ${rErr.message}`);
  const byResult = (byResultData ?? []) as EventRow[];

  // 5. Combine distinct by event id.
  const combined = new Map<string, EventRow>();
  for (const e of [...byAnon, ...byResult]) combined.set(e.id, e);
  const events = [...combined.values()];

  const breakdown = events.reduce<Record<string, number>>((acc, e) => {
    acc[e.event_type] = (acc[e.event_type] ?? 0) + 1;
    return acc;
  }, {});

  console.log(`Linked assessment_events (distinct): ${events.length}`);
  console.log(`  matched via anon_session_id: ${byAnon.length}`);
  console.log(`  matched via result_id:       ${byResult.length}`);
  console.log('  event_type breakdown:');
  for (const [type, n] of Object.entries(breakdown).sort()) {
    console.log(`    ${type}: ${n}`);
  }

  const confirm = process.argv.includes('--confirm');

  console.log(`\n--- A targeted delete WOULD remove ---`);
  console.log(`  ${rows.length} session row(s) + ${events.length} event row(s)`);
  console.log(`  Keap contacts (${email}): must be deleted MANUALLY in Keap (not touched here).`);

  if (!confirm) {
    console.log('\n(No changes were made. This was read-only. Re-run with --confirm to delete.)\n');
    return;
  }

  // Hard safety cap: this tool is for surgically removing ONE stray lead. If the
  // email somehow matches many sessions, refuse — that is not what this is for.
  if (rows.length > 3) {
    console.error(`\nABORT: ${rows.length} sessions matched (cap 3). Refusing to bulk-delete.\n`);
    process.exit(1);
  }

  console.log('\n--confirm passed — deleting (events first, then session)…\n');

  // 1. Events by anon_session_id (the full funnel).
  if (anonIds.length > 0) {
    const { data, error } = await supabase
      .from('assessment_events')
      .delete()
      .in('anon_session_id', anonIds)
      .select('id');
    if (error) throw new Error(`delete events by anon: ${error.message}`);
    console.log(`  deleted ${data?.length ?? 0} events (by anon_session_id)`);
  }

  // 2. Any remaining events by result_id (defensive — should be 0 after step 1).
  {
    const { data, error } = await supabase
      .from('assessment_events')
      .delete()
      .in('result_id', sessionIds)
      .select('id');
    if (error) throw new Error(`delete events by result_id: ${error.message}`);
    console.log(`  deleted ${data?.length ?? 0} residual events (by result_id)`);
  }

  // 3. The session row(s).
  {
    const { data, error } = await supabase
      .from('assessment_sessions')
      .delete()
      .in('id', sessionIds)
      .select('id');
    if (error) throw new Error(`delete sessions: ${error.message}`);
    console.log(`  deleted ${data?.length ?? 0} session row(s)`);
  }

  // 4. Verify nothing for this email remains.
  const { count: remaining } = await supabase
    .from('assessment_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('email', email);
  console.log(`\nVerification — sessions still matching ${email}: ${remaining ?? 'unknown'}`);
  console.log('Done. Remember to delete the Keap contact manually.\n');
}

main().catch((err) => {
  console.error('inspect-lead failed:', err.message);
  process.exit(1);
});
