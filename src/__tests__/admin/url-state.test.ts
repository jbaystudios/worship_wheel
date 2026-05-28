import { describe, it, expect } from 'vitest';
import {
  decode,
  encode,
  canonical,
  inherit,
  href,
  DEFAULT_PAGE_SIZE,
} from '@/lib/admin/url-state';
import { defaultRange, todayInReportingTz } from '@/lib/analytics/date-range';

describe('url-state: decode', () => {
  it('returns defaults for empty params', () => {
    const def = defaultRange(todayInReportingTz());
    const state = decode({});
    expect(state.from).toBe(def.from);
    expect(state.to).toBe(def.to);
    expect(state.includeInternal).toBe(false);
    expect(state.search).toBeUndefined();
    expect(state.syncState).toBeUndefined();
    expect(state.page).toBeUndefined();
    expect(state.pageSize).toBeUndefined();
  });

  it('parses valid ISO dates', () => {
    const state = decode({ from: '2026-04-01', to: '2026-04-30' });
    expect(state.from).toBe('2026-04-01');
    expect(state.to).toBe('2026-04-30');
  });

  it('falls back to defaults for invalid ISO dates', () => {
    const def = defaultRange(todayInReportingTz());
    const state = decode({ from: 'not-a-date', to: '2026-13-99' });
    expect(state.from).toBe(def.from);
    expect(state.to).toBe(def.to);
  });

  it('treats includeInternal=true literally; anything else is false', () => {
    expect(decode({ includeInternal: 'true' }).includeInternal).toBe(true);
    expect(decode({ includeInternal: 'false' }).includeInternal).toBe(false);
    expect(decode({ includeInternal: '1' }).includeInternal).toBe(false);
    expect(decode({}).includeInternal).toBe(false);
  });

  it('only accepts whitelisted syncState values', () => {
    expect(decode({ syncState: 'synced' }).syncState).toBe('synced');
    expect(decode({ syncState: 'pending' }).syncState).toBe('pending');
    expect(decode({ syncState: 'failed' }).syncState).toBe('failed');
    expect(decode({ syncState: 'unknown' }).syncState).toBeUndefined();
  });

  it('clamps pageSize to the whitelist', () => {
    expect(decode({ pageSize: '50' }).pageSize).toBe(50);
    expect(decode({ pageSize: '17' }).pageSize).toBeUndefined();
    expect(decode({ pageSize: '0' }).pageSize).toBeUndefined();
  });

  it('only accepts integer page ≥ 1', () => {
    expect(decode({ page: '3' }).page).toBe(3);
    expect(decode({ page: '0' }).page).toBeUndefined();
    expect(decode({ page: '-2' }).page).toBeUndefined();
    expect(decode({ page: 'abc' }).page).toBeUndefined();
  });

  it('validates sort against the per-route whitelist when pathname provided', () => {
    expect(decode({ sort: 'submittedAt:desc' }, '/admin/leads/all').sort).toBe(
      'submittedAt:desc',
    );
    expect(decode({ sort: 'nope:asc' }, '/admin/leads/all').sort).toBeUndefined();
    expect(decode({ sort: 'visits:desc' }, '/admin/leads/all').sort).toBeUndefined();
  });

  it('rejects malformed sort regardless of pathname', () => {
    expect(decode({ sort: 'submittedAt' }).sort).toBeUndefined();
    expect(decode({ sort: 'submittedAt:sideways' }).sort).toBeUndefined();
  });

  it('ignores unknown keys', () => {
    const state = decode({ foo: 'bar', baz: 'qux' });
    expect(state).not.toHaveProperty('foo');
    expect(state).not.toHaveProperty('baz');
  });

  it('reads URLSearchParams as well as object form', () => {
    const params = new URLSearchParams({ from: '2026-04-01', includeInternal: 'true' });
    const state = decode(params);
    expect(state.from).toBe('2026-04-01');
    expect(state.includeInternal).toBe(true);
  });

  it('handles array-valued params by taking the first', () => {
    const state = decode({ from: ['2026-04-01', '2026-04-02'] });
    expect(state.from).toBe('2026-04-01');
  });

  it('trims search and treats empty as absent', () => {
    expect(decode({ search: '  hello  ' }).search).toBe('hello');
    expect(decode({ search: '   ' }).search).toBeUndefined();
  });
});

describe('url-state: encode', () => {
  it('elides defaults', () => {
    const def = defaultRange(todayInReportingTz());
    const params = encode({ from: def.from, to: def.to, includeInternal: false });
    expect(params.toString()).toBe('');
  });

  it('writes includeInternal=true only when true', () => {
    expect(encode({ includeInternal: false }).toString()).toBe('');
    expect(encode({ includeInternal: true }).toString()).toBe('includeInternal=true');
  });

  it('writes non-default dates', () => {
    const params = encode({ from: '2026-04-01', to: '2026-04-30' });
    expect(params.get('from')).toBe('2026-04-01');
    expect(params.get('to')).toBe('2026-04-30');
  });

  it('elides default page and pageSize', () => {
    expect(encode({ page: 1 }).toString()).toBe('');
    expect(encode({ pageSize: DEFAULT_PAGE_SIZE }).toString()).toBe('');
    expect(encode({ page: 2, pageSize: 50 }).get('page')).toBe('2');
  });

  it('emits keys in alphabetical order', () => {
    const params = encode({
      includeInternal: true,
      from: '2026-04-01',
      to: '2026-04-30',
      search: 'foo',
    });
    expect(params.toString()).toBe(
      'from=2026-04-01&includeInternal=true&search=foo&to=2026-04-30',
    );
  });
});

describe('url-state: canonical round-trip', () => {
  it('encode(decode(params)) is idempotent', () => {
    const inputs = [
      { from: '2026-04-01', to: '2026-04-30', includeInternal: 'true' },
      { search: 'foo', sort: 'submittedAt:desc', page: '2', pageSize: '50' },
      { archetypeId: 'a1', sourceKey: 'utm:google/cpc' },
    ];
    for (const params of inputs) {
      const once = canonical(params).toString();
      const twice = canonical(Object.fromEntries(new URLSearchParams(once))).toString();
      expect(twice).toBe(once);
    }
  });

  it('drops default-valued params from canonical form', () => {
    const def = defaultRange(todayInReportingTz());
    const out = canonical({
      from: def.from,
      to: def.to,
      includeInternal: 'false',
      page: '1',
      pageSize: String(DEFAULT_PAGE_SIZE),
    });
    expect(out.toString()).toBe('');
  });
});

describe('url-state: inherit', () => {
  it('carries from/to/includeInternal only by default', () => {
    const parent = {
      from: '2026-04-01',
      to: '2026-04-30',
      includeInternal: true,
      search: 'leak',
      sort: 'submittedAt:desc',
      page: 4,
    };
    const next = inherit(parent);
    expect(next).toEqual({ from: '2026-04-01', to: '2026-04-30', includeInternal: true });
  });

  it('applies overrides', () => {
    const parent = { from: '2026-04-01', to: '2026-04-30', includeInternal: false };
    const next = inherit(parent, { archetypeId: 'balanced-beginner' });
    expect(next.archetypeId).toBe('balanced-beginner');
  });
});

describe('url-state: href', () => {
  it('returns pathname alone when state is all defaults', () => {
    const def = defaultRange(todayInReportingTz());
    expect(href('/admin', { from: def.from, to: def.to, includeInternal: false })).toBe(
      '/admin',
    );
  });

  it('returns pathname?qs when state has non-defaults', () => {
    const out = href('/admin/leads/all', {
      from: '2026-04-01',
      to: '2026-04-30',
      includeInternal: false,
      search: 'jane',
    });
    expect(out).toBe('/admin/leads/all?from=2026-04-01&search=jane&to=2026-04-30');
  });
});
