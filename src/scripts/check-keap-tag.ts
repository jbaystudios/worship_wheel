/**
 * Keap completion-tag check — reports how many contacts still carry the Worship
 * Wheel completion tag (KEAP_TAG_WW_COMPLETED). Read-only.
 *
 * Pairs with the test-data cleanse: after wiping Supabase and deleting the test
 * contacts in Keap, run this to confirm nobody is left with the tag. Re-runnable
 * (poll it while finishing the Keap cleanup).
 *
 * Usage:
 *   npm run keap:check-tag
 *
 * Exit code 0 = clean (no tagged contacts); 1 = some remain (so it can gate a loop).
 */
import { listContactsWithCompletionTag } from '../lib/keap/tag-audit';

try {
  process.loadEnvFile?.('.env.local');
} catch {
  /* env may already be set */
}

async function main() {
  const { tagId, contacts, reportedCount, staleEntriesIgnored } =
    await listContactsWithCompletionTag();

  if (staleEntriesIgnored > 0) {
    console.log(
      `(note: Keap's tag index reported ${reportedCount}, but ${staleEntriesIgnored} ` +
        `were stale — verified against each contact's own tag list.)`,
    );
  }

  if (contacts.length === 0) {
    console.log(`✓ Keap is clean — no contacts verifiably carry the completion tag (${tagId}).`);
    return;
  }
  console.log(`✗ ${contacts.length} contact(s) still carry the completion tag (${tagId}):`);
  for (const c of contacts) console.log(`  • ${c.id}  ${c.email ?? '(no email)'}`);
  process.exitCode = 1;
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
