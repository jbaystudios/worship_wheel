// Thin HTTP wrapper for the Keap REST API v1 Service Account Key auth model.
// Two endpoints are needed for the assessment sync (specs/001/contracts/api.md):
//   - PUT  /v1/contacts                — create-or-update by email (dedup)
//   - POST /v1/contacts/{id}/tags      — apply tag IDs (idempotent)
//
// Errors from Keap are propagated as KeapApiError so the sync orchestrator can
// write `keap_sync_error` to assessment_sessions and the admin sync-health
// panel can render the failure reason.

const KEAP_BASE_URL = 'https://api.infusionsoft.com/crm/rest/v1';

export interface KeapCustomField {
  id: number;
  content: string | number | null;
}

export interface KeapContactUpsertInput {
  /** Normalized (trimmed, lowercased) email — required for duplicate_option to dedupe. */
  email: string;
  givenName: string;
  customFields: KeapCustomField[];
}

export interface KeapContact {
  id: number;
}

export class KeapApiError extends Error {
  constructor(
    public readonly endpoint: string,
    public readonly status: number,
    public readonly body: string,
  ) {
    super(`Keap ${endpoint} failed (${status}): ${body.slice(0, 500)}`);
    this.name = 'KeapApiError';
  }
}

export class KeapConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'KeapConfigError';
  }
}

function authHeader(): string {
  const key = process.env.KEAP_SERVICE_ACCOUNT_KEY;
  if (!key) {
    throw new KeapConfigError('KEAP_SERVICE_ACCOUNT_KEY is not set');
  }
  return `Bearer ${key}`;
}

async function request<T>(method: 'PUT' | 'POST', path: string, body: unknown): Promise<T> {
  const res = await fetch(`${KEAP_BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: authHeader(),
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new KeapApiError(`${method} ${path}`, res.status, text);
  }
  return res.json() as Promise<T>;
}

/**
 * Create-or-update a contact, deduplicated by email. The `duplicate_option: "Email"`
 * flag is the authoritative safeguard against duplicate contacts on retakes and
 * concurrent submissions (see specs/001/contracts/api.md — API version note).
 *
 * Returns the contact id (existing or newly created) so tags can be applied next.
 */
export async function upsertContact(input: KeapContactUpsertInput): Promise<KeapContact> {
  const body = {
    duplicate_option: 'Email',
    given_name: input.givenName,
    email_addresses: [{ email: input.email, field: 'EMAIL1' }],
    custom_fields: input.customFields
      .filter((f) => Number.isFinite(f.id))
      .map((f) => ({ id: f.id, content: f.content })),
  };
  const res = await request<{ id: number }>('PUT', '/contacts', body);
  return { id: res.id };
}

/**
 * Apply tag IDs to a contact. Re-applying a tag already on the contact is a
 * no-op on Keap's side, so this is safe to call on retakes.
 */
export async function applyTags(contactId: number, tagIds: number[]): Promise<void> {
  const ids = Array.from(new Set(tagIds.filter((id) => Number.isFinite(id) && id > 0)));
  if (ids.length === 0) return;
  await request<unknown>('POST', `/contacts/${contactId}/tags`, { tagIds: ids });
}
