import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { resolveTagIds, buildCustomFields } from '@/lib/keap/sync';
import { upsertContact, applyTags, KeapApiError, KeapConfigError } from '@/lib/keap/client';
import type { KeapSyncInput } from '@/lib/keap/sync';

function fixture(overrides: Partial<KeapSyncInput> = {}): KeapSyncInput {
  return {
    resultId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    firstName: 'John',
    email: 'john@example.com',
    overallScore: 35,
    overallPercentage: 43.75,
    archetypeKey: 'uneven_intermediate',
    resultsUrl: 'https://worshipwheel.example.com/results/abc',
    ...overrides,
  };
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

let savedEnv: Record<string, string | undefined>;

function applyEnv(env: Record<string, string>) {
  for (const [k, v] of Object.entries(env)) process.env[k] = v;
}

beforeEach(() => {
  savedEnv = {};
  for (const k of [...Object.keys(TAG_ENV), ...Object.keys(FIELD_ENV), 'KEAP_SERVICE_ACCOUNT_KEY']) {
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
