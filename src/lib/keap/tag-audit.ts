// Keap completion-tag audit — lists every contact currently carrying the
// Worship Wheel completion tag (KEAP_TAG_WW_COMPLETED). Used by the test-data
// cleanse to verify Keap is clean after the operator deletes test contacts.
//
// Reliability matters here: a wrong "clean" reading is worse than useless. So
// the audit does NOT just trust the tag→contacts index — for every contact that
// index returns, it re-reads that contact's own tag list (/contacts/{id}/tags)
// and only counts it if the tag is genuinely still applied. That filters out
// stale index entries (Keap's tag index can briefly lag a contact deletion or
// tag removal), so the list we report never shows a contact that no longer has
// the tag. `reportedCount` exposes Keap's raw index count for transparency.
//
// Read-only. Service Account Key auth.

const KEAP_BASE_URL = 'https://api.infusionsoft.com/crm/rest/v1';

export interface TaggedContact {
  id: number;
  email: string | null;
}

export interface TagAuditResult {
  tagId: number;
  /** Keap's raw `count` from the tag→contacts index (may include stale entries). */
  reportedCount: number;
  /** Contacts confirmed (via a per-contact re-read) to still hold the tag. */
  contacts: TaggedContact[];
  /** Index entries dropped because the contact no longer actually has the tag. */
  staleEntriesIgnored: number;
}

function authHeaders(): Record<string, string> {
  const key = process.env.KEAP_SERVICE_ACCOUNT_KEY;
  if (!key) throw new Error('KEAP_SERVICE_ACCOUNT_KEY is not set');
  return { Authorization: `Bearer ${key}`, Accept: 'application/json' };
}

function resolveTagId(): number {
  const tagId = Number.parseInt(process.env.KEAP_TAG_WW_COMPLETED ?? '', 10);
  if (!Number.isFinite(tagId) || tagId <= 0) {
    throw new Error('KEAP_TAG_WW_COMPLETED is not set or is not a valid id');
  }
  return tagId;
}

function contactEmail(c: Record<string, unknown>): string | null {
  const list = c.email_addresses as Array<{ email?: string }> | undefined;
  if (Array.isArray(list) && list[0]?.email) return list[0].email!;
  if (typeof c.email === 'string') return c.email;
  return null;
}

/** True if contact {id} genuinely still has {tagId} per its own tag list. */
async function contactStillHasTag(
  id: number,
  tagId: number,
  headers: Record<string, string>,
): Promise<boolean> {
  const res = await fetch(`${KEAP_BASE_URL}/contacts/${id}/tags`, { headers });
  if (res.status === 404) return false; // contact deleted
  if (!res.ok) {
    throw new Error(`Keap GET /contacts/${id}/tags failed (${res.status})`);
  }
  const json = (await res.json()) as { tags?: Array<{ tag?: { id?: number }; id?: number }> };
  return (json.tags ?? []).some((t) => (t.tag?.id ?? t.id) === tagId);
}

/**
 * Return every contact that verifiably still has the completion tag. Throws if
 * the Keap auth/tag env is missing or the API errors. Paginates the tag index
 * fully and re-verifies each entry so the result reflects ground truth.
 */
export async function listContactsWithCompletionTag(): Promise<TagAuditResult> {
  const headers = authHeaders();
  const tagId = resolveTagId();

  const limit = 200;
  let offset = 0;
  let reportedCount = 0;
  const candidates: TaggedContact[] = [];

  for (;;) {
    const res = await fetch(
      `${KEAP_BASE_URL}/tags/${tagId}/contacts?limit=${limit}&offset=${offset}`,
      { headers },
    );
    if (!res.ok) {
      throw new Error(
        `Keap GET /tags/${tagId}/contacts failed (${res.status}): ${(await res.text()).slice(0, 300)}`,
      );
    }
    const json = (await res.json()) as {
      contacts?: Array<Record<string, unknown>>;
      count?: number;
    };
    if (offset === 0 && typeof json.count === 'number') reportedCount = json.count;
    const page = json.contacts ?? [];
    for (const c of page) candidates.push({ id: Number(c.id), email: contactEmail(c) });
    if (page.length < limit) break;
    offset += limit;
  }

  // Verify each candidate against its own tag list — drop stale index entries.
  const contacts: TaggedContact[] = [];
  let staleEntriesIgnored = 0;
  for (const c of candidates) {
    if (await contactStillHasTag(c.id, tagId, headers)) contacts.push(c);
    else staleEntriesIgnored += 1;
  }

  return { tagId, reportedCount, contacts, staleEntriesIgnored };
}
