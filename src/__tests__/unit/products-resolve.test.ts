import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the service-role client so we can drive the products query result.
const selectResult = { rows: [] as Record<string, unknown>[], error: null as null | { message: string } };

vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: () => ({
    from: () => ({
      select: () => ({
        in: () => ({
          eq: () => Promise.resolve({ data: selectResult.rows, error: selectResult.error }),
        }),
      }),
    }),
  }),
}));

import { loadActiveProductsByCodes } from '@/lib/products/resolve';

function row(code: string) {
  return {
    id: `id-${code}`,
    code,
    name: code,
    status: 'active',
    headline: 'H',
    sub_headline: null,
    video_url: null,
    eyebrow: 'E',
    cta_headline: 'CH',
    cta_copy: 'CC',
    cta_button_label: 'B',
    cta_button_url: 'https://x.test',
    created_at: 't',
    updated_at: 't',
  };
}

beforeEach(() => {
  selectResult.rows = [];
  selectResult.error = null;
});

describe('loadActiveProductsByCodes', () => {
  it('returns [] for empty/absent input without querying', async () => {
    expect(await loadActiveProductsByCodes([])).toEqual([]);
    expect(await loadActiveProductsByCodes(null)).toEqual([]);
    expect(await loadActiveProductsByCodes(undefined)).toEqual([]);
  });

  it('preserves the requested code order regardless of DB order', async () => {
    selectResult.rows = [row('cd7'), row('ab3')]; // DB returns reversed
    const products = await loadActiveProductsByCodes(['ab3', 'cd7']);
    expect(products.map((p) => p.code)).toEqual(['ab3', 'cd7']);
  });

  it('skips codes with no matching active row', async () => {
    selectResult.rows = [row('ab3')]; // cd7 missing/draft → not returned
    const products = await loadActiveProductsByCodes(['ab3', 'cd7']);
    expect(products.map((p) => p.code)).toEqual(['ab3']);
  });

  it('maps snake_case row to camelCase Product', async () => {
    selectResult.rows = [row('ab3')];
    const [p] = await loadActiveProductsByCodes(['ab3']);
    expect(p).toMatchObject({ code: 'ab3', ctaButtonUrl: 'https://x.test', subHeadline: null });
  });

  it('returns [] (never throws) on a read error', async () => {
    selectResult.error = { message: 'boom' };
    expect(await loadActiveProductsByCodes(['ab3'])).toEqual([]);
  });
});
