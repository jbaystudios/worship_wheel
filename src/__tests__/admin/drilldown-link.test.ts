// DrilldownLink wraps next/link with URL-state inheritance. Rather than
// pulling in @testing-library + Next router mocks (which the project doesn't
// currently use elsewhere), this test exercises the composition logic the
// component delegates to: inherit() + href(). Per spec 007 contract.
import { describe, it, expect } from 'vitest';
import { decode, inherit, href } from '@/lib/admin/url-state';

describe('drilldown composition (used by DrilldownLink)', () => {
  it('carries date range + includeInternal across sections', () => {
    const parent = decode({
      from: '2026-04-01',
      to: '2026-04-30',
      includeInternal: 'true',
      search: 'foo', // section-local, must NOT propagate
      page: '4',
    });
    const next = inherit(parent);
    const out = href('/admin/acquisition', next);
    expect(out).toBe('/admin/acquisition?from=2026-04-01&includeInternal=true&to=2026-04-30');
  });

  it('drops section-local filters when navigating between sections', () => {
    const parent = decode({
      from: '2026-04-01',
      to: '2026-04-30',
      includeInternal: 'true',
      search: 'jane',
      sort: 'submittedAt:desc',
      page: '3',
      syncState: 'failed',
    });
    const next = inherit(parent);
    expect(next.search).toBeUndefined();
    expect(next.sort).toBeUndefined();
    expect(next.page).toBeUndefined();
    expect(next.syncState).toBeUndefined();
  });

  it('carries sourceKey context into /admin/leads/all', () => {
    const parent = decode({
      from: '2026-04-01',
      to: '2026-04-30',
      includeInternal: 'true',
    });
    const next = inherit(parent, { sourceKey: 'utm:google/cpc' });
    const out = href('/admin/leads/all', next);
    expect(out).toContain('sourceKey=utm%3Agoogle%2Fcpc');
    expect(out).toContain('from=2026-04-01');
  });

  it('carries archetypeId context into /admin/leads/all', () => {
    const parent = decode({ includeInternal: 'true' });
    const next = inherit(parent, { archetypeId: 'balanced-beginner' });
    const out = href('/admin/leads/all', next);
    expect(out).toContain('archetypeId=balanced-beginner');
  });

  it('overrides win over inherited values', () => {
    const parent = decode({
      from: '2026-04-01',
      to: '2026-04-30',
      includeInternal: 'true',
    });
    const next = inherit(parent, { includeInternal: false });
    expect(next.includeInternal).toBe(false);
  });
});
