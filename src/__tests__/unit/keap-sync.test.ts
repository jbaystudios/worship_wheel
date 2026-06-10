import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { resolveTagIds, buildCustomFields, syncSessionToKeap } from '@/lib/keap/sync';
import {
  upsertContact,
  applyTags,
  getEmailStatus,
  optInEmail,
  KeapApiError,
  KeapConfigError,
} from '@/lib/keap/client';
import type { KeapSyncInput } from '@/lib/keap/sync';

// Mock the Supabase service client used by writeStatus so the orchestrator can
// be exercised without a live DB. Captures the status patch for assertions.
const { fromMock, updateMock, eqMock } = vi.hoisted(() => {
  const eqMock = vi.fn();
  const updateMock = vi.fn((_patch: Record<string, unknown>) => ({ eq: eqMock }));
  const fromMock = vi.fn(() => ({ update: updateMock }));
  return { fromMock, updateMock, eqMock };
});
vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: () => ({ from: fromMock }),
}));

function fixture(overrides: Partial<KeapSyncInput> = {}): KeapSyncInput {
  return {
    resultId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    firstName: 'John',
    email: 'john@example.com',
    overallScore: 35,
    overallPercentage: 43.75,
    archetypeKey: 'uneven_intermediate',
    archetypeName: 'Uneven Intermediate',
    resultsUrl: 'https://worshipwheel.example.com/results/abc',
    ...overrides,
  };
}

// URL-aware fetch mock covering the full sync path: upsert (PUT /contacts),
// applyTags (POST /contacts/{id}/tags), opt-in guard (GET /contacts?email), and
// opt-in (POST /xmlrpc). Lets opt-in tests assert by call rather than by order.
function keapFetchMock(
  opts: { emailStatus?: string | null; optInOk?: boolean; optInBoolean?: 0 | 1 } = {},
) {
  const { emailStatus = 'NonMarketable', optInOk = true, optInBoolean = 1 } = opts;
  return vi.fn(async (url: string, init?: { method?: string }) => {
    const method = init?.method ?? 'GET';
    if (url.includes('/xmlrpc')) {
      if (!optInOk) return new Response('<fault><value>boom</value></fault>', { status: 500 });
      return new Response(
        `<?xml version="1.0"?><methodResponse><params><param><value><boolean>${optInBoolean}</boolean></value></param></params></methodResponse>`,
        { status: 200 },
      );
    }
    if (url.includes('/contacts?email')) {
      return new Response(
        JSON.stringify({ contacts: emailStatus ? [{ email_status: emailStatus }] : [] }),
        { status: 200 },
      );
    }
    if (method === 'PUT') return new Response(JSON.stringify({ id: 555 }), { status: 200 });
    return new Response('{}', { status: 200 }); // POST tags, etc.
  });
}

function xmlrpcCalls(spy: ReturnType<typeof vi.fn>) {
  return spy.mock.calls.filter((c) => String(c[0]).includes('/xmlrpc'));
}

// ── Env helpers ───────────────────────────────────────────────────────────

const TAG_ENV: Record<string, string> = {
  KEAP_TAG_WW_COMPLETED: '100',
};

const FIELD_ENV: Record<string, string> = {
  KEAP_FIELD_WW_ARCHETYPE: '265',
  KEAP_FIELD_WW_RESULTS_URL: '267',
  KEAP_FIELD_WW_OVERALL_SCORE: '269',
  KEAP_FIELD_WW_OVERALL_PERCENTAGE: '271',
};

// Optional fields — kept out of FIELD_ENV so the "required 4" tests exercise the
// env-unset path. Listed here only for env save/restore hygiene.
const OPTIONAL_FIELD_ENV_KEYS = ['KEAP_FIELD_WW_ARCHETYPE_NAME', 'KEAP_FIELD_WW_RESULT_ID'];
const OPTIONAL_FIELD_ENV_KEY = OPTIONAL_FIELD_ENV_KEYS[0];

let savedEnv: Record<string, string | undefined>;

function applyEnv(env: Record<string, string>) {
  for (const [k, v] of Object.entries(env)) process.env[k] = v;
}

beforeEach(() => {
  savedEnv = {};
  for (const k of [...Object.keys(TAG_ENV), ...Object.keys(FIELD_ENV), ...OPTIONAL_FIELD_ENV_KEYS, 'KEAP_SERVICE_ACCOUNT_KEY']) {
    savedEnv[k] = process.env[k];
    delete process.env[k];
  }
});

afterEach(() => {
  for (const [k, v] of Object.entries(savedEnv)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  vi.unstubAllGlobals();
  fromMock.mockClear();
  updateMock.mockClear();
  eqMock.mockClear();
});

// ── Tag resolution (MVP: single completion tag) ───────────────────────────

describe('resolveTagIds', () => {
  it('returns the single completion tag when KEAP_TAG_WW_COMPLETED is set', () => {
    applyEnv(TAG_ENV);
    const { tagIds, missingEnvKeys } = resolveTagIds();
    expect(tagIds).toEqual([100]);
    expect(missingEnvKeys).toEqual([]);
  });

  it('reports KEAP_TAG_WW_COMPLETED as missing when unset', () => {
    const { tagIds, missingEnvKeys } = resolveTagIds();
    expect(tagIds).toEqual([]);
    expect(missingEnvKeys).toEqual(['KEAP_TAG_WW_COMPLETED']);
  });

  it('treats non-numeric env values as missing', () => {
    applyEnv({ KEAP_TAG_WW_COMPLETED: 'not-a-number' });
    const { tagIds, missingEnvKeys } = resolveTagIds();
    expect(tagIds).toEqual([]);
    expect(missingEnvKeys).toEqual(['KEAP_TAG_WW_COMPLETED']);
  });
});

// ── Custom field resolution (MVP: 4 fields) ───────────────────────────────

describe('buildCustomFields', () => {
  it('produces all 4 MVP fields when env keys are populated', () => {
    applyEnv(FIELD_ENV);
    const { fields, missingEnvKeys } = buildCustomFields(fixture());
    expect(missingEnvKeys).toEqual([]);
    expect(fields).toHaveLength(4);
    const byId = new Map(fields.map((f) => [f.id, f.content]));
    // Archetype is the raw snake_case key — Keap automation branches on this.
    expect(byId.get(265)).toBe('uneven_intermediate');
    expect(byId.get(267)).toBe('https://worshipwheel.example.com/results/abc');
    expect(byId.get(269)).toBe(35);
    expect(byId.get(271)).toBe(43.75);
  });

  it('writes the raw archetype key, not a humanized display name', () => {
    applyEnv({ KEAP_FIELD_WW_ARCHETYPE: '265' });
    const keys = [
      'campfire_strummer',
      'rhythm_machine',
      'theory_head',
      'almost_there_player',
      'balanced_beginner',
      'uneven_intermediate',
    ];
    for (const key of keys) {
      const { fields } = buildCustomFields(fixture({ archetypeKey: key }));
      expect(fields[0].content).toBe(key);
    }
  });

  it('skips missing env keys and reports them', () => {
    applyEnv({ KEAP_FIELD_WW_ARCHETYPE: '265' });
    const { fields, missingEnvKeys } = buildCustomFields(fixture());
    expect(fields.map((f) => f.id)).toEqual([265]);
    expect(missingEnvKeys).toEqual([
      'KEAP_FIELD_WW_RESULTS_URL',
      'KEAP_FIELD_WW_OVERALL_SCORE',
      'KEAP_FIELD_WW_OVERALL_PERCENTAGE',
    ]);
  });

  it('passes unknown archetype keys through verbatim (no transformation)', () => {
    applyEnv({ KEAP_FIELD_WW_ARCHETYPE: '265' });
    const { fields } = buildCustomFields(fixture({ archetypeKey: 'mystery_key' }));
    expect(fields[0].content).toBe('mystery_key');
  });

  it('includes the optional display-name field (id 272) when its env key is set', () => {
    applyEnv({ ...FIELD_ENV, [OPTIONAL_FIELD_ENV_KEY]: '272' });
    const { fields, missingEnvKeys } = buildCustomFields(fixture({ archetypeName: 'Campfire Strummer' }));
    expect(missingEnvKeys).toEqual([]);
    expect(fields).toHaveLength(5);
    expect(new Map(fields.map((f) => [f.id, f.content])).get(272)).toBe('Campfire Strummer');
  });

  it('omits the optional display-name field WITHOUT reporting it missing when its env key is unset', () => {
    // The whole point: a not-yet-mirrored optional env key must not break the sync.
    applyEnv(FIELD_ENV); // does NOT include KEAP_FIELD_WW_ARCHETYPE_NAME / RESULT_ID
    const { fields, missingEnvKeys } = buildCustomFields(fixture());
    expect(fields).toHaveLength(4);
    expect(missingEnvKeys).toEqual([]); // not flagged as missing → sync proceeds
    expect(fields.map((f) => f.id)).not.toContain(272);
    expect(fields.map((f) => f.id)).not.toContain(274);
  });

  it('includes the optional result-id field (id 274) with the bare result id when its env key is set', () => {
    applyEnv({ ...FIELD_ENV, KEAP_FIELD_WW_RESULT_ID: '274' });
    const { fields, missingEnvKeys } = buildCustomFields(
      fixture({ resultId: 'c61f2121-2c22-4967-b0e2-7d5764a57c47' }),
    );
    expect(missingEnvKeys).toEqual([]);
    expect(new Map(fields.map((f) => [f.id, f.content])).get(274)).toBe(
      'c61f2121-2c22-4967-b0e2-7d5764a57c47',
    );
  });
});

// ── Orchestrator config guard (2026-06-04 regression) ─────────────────────

describe('syncSessionToKeap — missing field env keys', () => {
  it('marks the sync FAILED (not synced) and never writes the contact when field env keys are absent', async () => {
    // Tag + service key present, but the KEAP_FIELD_WW_* IDs are NOT — exactly
    // the prod misconfig that silently wrote tagged contacts with no WW data.
    applyEnv(TAG_ENV);
    process.env.KEAP_SERVICE_ACCOUNT_KEY = 'test-key';
    eqMock.mockResolvedValue({ error: null });
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    const outcome = await syncSessionToKeap(fixture());

    expect(outcome.status).toBe('failed');
    expect(outcome).toMatchObject({
      error: expect.stringContaining('KEAP_FIELD_WW_ARCHETYPE'),
    });
    // No Keap write attempted — we abort before touching the contact.
    expect(fetchSpy).not.toHaveBeenCalled();
    // Status writeback records 'failed' with the missing-keys reason.
    expect(updateMock).toHaveBeenCalled();
    const patch = updateMock.mock.calls[0]![0];
    expect(patch.keap_sync_status).toBe('failed');
    expect(String(patch.keap_sync_error)).toContain('KEAP_FIELD_WW_RESULTS_URL');
  });

  it('syncs and marks synced when all field env keys are present', async () => {
    applyEnv(TAG_ENV);
    applyEnv(FIELD_ENV);
    process.env.KEAP_SERVICE_ACCOUNT_KEY = 'test-key';
    eqMock.mockResolvedValue({ error: null });
    vi.stubGlobal('fetch', keapFetchMock({ emailStatus: 'NonMarketable' }));

    const outcome = await syncSessionToKeap(fixture());

    expect(outcome).toEqual({ status: 'synced', contactId: 555 });
    expect(updateMock).toHaveBeenCalled();
    const patch = updateMock.mock.calls[0]![0];
    expect(patch.keap_sync_status).toBe('synced');
  });
});

// ── Email opt-in (spec 008) ───────────────────────────────────────────────

describe('syncSessionToKeap — email opt-in', () => {
  beforeEach(() => {
    applyEnv(TAG_ENV);
    applyEnv(FIELD_ENV);
    process.env.KEAP_SERVICE_ACCOUNT_KEY = 'test-key';
    eqMock.mockResolvedValue({ error: null });
  });

  it('opts in a NonMarketable contact (and records the consent reason)', async () => {
    const fetchSpy = keapFetchMock({ emailStatus: 'NonMarketable' });
    vi.stubGlobal('fetch', fetchSpy);

    const outcome = await syncSessionToKeap(fixture());

    expect(outcome.status).toBe('synced');
    const calls = xmlrpcCalls(fetchSpy);
    expect(calls).toHaveLength(1);
    const body = String((calls[0][1] as { body: string }).body);
    expect(body).toContain('APIEmailService.optIn');
    expect(body).toContain('john@example.com');
    // consent reason references the privacy policy (FR-002)
    expect(body).toContain('shop.worshipguitarskills.com/pages/privacy-policy');
  });

  it('does NOT opt in an already-marketable contact (no downgrade)', async () => {
    const fetchSpy = keapFetchMock({ emailStatus: 'SingleOptIn' });
    vi.stubGlobal('fetch', fetchSpy);

    const outcome = await syncSessionToKeap(fixture());

    expect(outcome.status).toBe('synced');
    expect(xmlrpcCalls(fetchSpy)).toHaveLength(0); // guard skipped the opt-in
  });

  it('does NOT opt in an opted-out contact (respects unsubscribe)', async () => {
    const fetchSpy = keapFetchMock({ emailStatus: 'OptOut' });
    vi.stubGlobal('fetch', fetchSpy);

    await syncSessionToKeap(fixture());

    expect(xmlrpcCalls(fetchSpy)).toHaveLength(0);
  });

  it('stays SYNCED when the opt-in call fails (non-blocking)', async () => {
    const fetchSpy = keapFetchMock({ emailStatus: 'NonMarketable', optInOk: false });
    vi.stubGlobal('fetch', fetchSpy);

    const outcome = await syncSessionToKeap(fixture());

    expect(outcome).toEqual({ status: 'synced', contactId: 555 });
    const patch = updateMock.mock.calls[0]![0];
    expect(patch.keap_sync_status).toBe('synced');
  });
});

// ── HTTP client ───────────────────────────────────────────────────────────

describe('keap client — upsertContact', () => {
  it('throws KeapConfigError when KEAP_SERVICE_ACCOUNT_KEY is missing', async () => {
    await expect(
      upsertContact({ email: 'a@b.com', givenName: 'A', customFields: [] }),
    ).rejects.toBeInstanceOf(KeapConfigError);
  });

  it('PUTs /v1/contacts with duplicate_option: Email and bearer auth', async () => {
    process.env.KEAP_SERVICE_ACCOUNT_KEY = 'test-key';
    const fetchSpy = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ id: 9999 }), { status: 200 }));
    vi.stubGlobal('fetch', fetchSpy);

    const result = await upsertContact({
      email: 'john@example.com',
      givenName: 'John',
      customFields: [{ id: 265, content: 'uneven_intermediate' }],
    });

    expect(result).toEqual({ id: 9999 });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe('https://api.infusionsoft.com/crm/rest/v1/contacts');
    expect(init.method).toBe('PUT');
    expect(init.headers.Authorization).toBe('Bearer test-key');
    const body = JSON.parse(init.body);
    expect(body.duplicate_option).toBe('Email');
    expect(body.email_addresses).toEqual([{ email: 'john@example.com', field: 'EMAIL1' }]);
    expect(body.given_name).toBe('John');
    expect(body.custom_fields).toEqual([{ id: 265, content: 'uneven_intermediate' }]);
  });

  it('throws KeapApiError on non-2xx', async () => {
    process.env.KEAP_SERVICE_ACCOUNT_KEY = 'test-key';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('{"message":"boom"}', { status: 500 })),
    );
    await expect(
      upsertContact({ email: 'a@b.com', givenName: 'A', customFields: [] }),
    ).rejects.toBeInstanceOf(KeapApiError);
  });
});

describe('keap client — applyTags', () => {
  it('is a no-op for empty tagIds', async () => {
    process.env.KEAP_SERVICE_ACCOUNT_KEY = 'test-key';
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    await applyTags(123, []);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('deduplicates ids and posts to /contacts/{id}/tags', async () => {
    process.env.KEAP_SERVICE_ACCOUNT_KEY = 'test-key';
    const fetchSpy = vi
      .fn()
      .mockResolvedValue(new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchSpy);
    await applyTags(123, [10, 20, 10, -1, NaN, 30]);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe('https://api.infusionsoft.com/crm/rest/v1/contacts/123/tags');
    expect(init.method).toBe('POST');
    const body = JSON.parse(init.body);
    expect(new Set(body.tagIds)).toEqual(new Set([10, 20, 30]));
  });
});

describe('keap client — getEmailStatus', () => {
  it('returns the contact email_status by email', async () => {
    process.env.KEAP_SERVICE_ACCOUNT_KEY = 'test-key';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ contacts: [{ email_status: 'SingleOptIn' }] }), {
          status: 200,
        }),
      ),
    );
    expect(await getEmailStatus('a@b.com')).toBe('SingleOptIn');
  });

  it('returns null when no contact matches', async () => {
    process.env.KEAP_SERVICE_ACCOUNT_KEY = 'test-key';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ contacts: [] }), { status: 200 })),
    );
    expect(await getEmailStatus('missing@b.com')).toBeNull();
  });
});

describe('keap client — optInEmail', () => {
  it('throws KeapConfigError when the service key is missing', async () => {
    await expect(optInEmail('a@b.com', 'reason')).rejects.toBeInstanceOf(KeapConfigError);
  });

  it('POSTs APIEmailService.optIn with [key, email, reason] and returns true on boolean 1', async () => {
    process.env.KEAP_SERVICE_ACCOUNT_KEY = 'test-key';
    const fetchSpy = vi.fn().mockResolvedValue(
      new Response(
        '<?xml version="1.0"?><methodResponse><params><param><value><boolean>1</boolean></value></param></params></methodResponse>',
        { status: 200 },
      ),
    );
    vi.stubGlobal('fetch', fetchSpy);

    const result = await optInEmail('john@example.com', 'Completed the assessment');

    expect(result).toBe(true);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe('https://api.infusionsoft.com/crm/xmlrpc/v1');
    expect(init.method).toBe('POST');
    expect(init.headers.Authorization).toBe('Bearer test-key');
    // params in order: key, email, reason
    const params = [...String(init.body).matchAll(/<string>([^<]*)<\/string>/g)].map((m) => m[1]);
    expect(params).toEqual(['test-key', 'john@example.com', 'Completed the assessment']);
  });

  it('returns false on boolean 0 (no-op: already opted in or opted out)', async () => {
    process.env.KEAP_SERVICE_ACCOUNT_KEY = 'test-key';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          '<?xml version="1.0"?><methodResponse><params><param><value><boolean>0</boolean></value></param></params></methodResponse>',
          { status: 200 },
        ),
      ),
    );
    expect(await optInEmail('a@b.com', 'reason')).toBe(false);
  });

  it('throws on an XML-RPC fault', async () => {
    process.env.KEAP_SERVICE_ACCOUNT_KEY = 'test-key';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          '<?xml version="1.0"?><methodResponse><fault><value><struct><member><name>faultString</name><value>No method matching arguments</value></member></struct></value></fault></methodResponse>',
          { status: 200 },
        ),
      ),
    );
    await expect(optInEmail('a@b.com', 'reason')).rejects.toBeInstanceOf(KeapApiError);
  });
});
