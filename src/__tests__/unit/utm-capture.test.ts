import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { captureUtm, getUtm } from '@/lib/analytics/utm';

// utm.ts reads `window` at call-time, so we stub a minimal window with an
// in-memory sessionStorage and a settable location.search per test (no jsdom),
// mirroring products-capture.test.ts.
class MemoryStorage {
  private store = new Map<string, string>();
  getItem(k: string) {
    return this.store.has(k) ? this.store.get(k)! : null;
  }
  setItem(k: string, v: string) {
    this.store.set(k, v);
  }
  removeItem(k: string) {
    this.store.delete(k);
  }
  clear() {
    this.store.clear();
  }
}

const g = globalThis as unknown as {
  window?: { location: { search: string }; sessionStorage: MemoryStorage };
};

function setUrl(search: string) {
  g.window!.location = { search };
}

beforeEach(() => {
  g.window = {
    location: { search: '' },
    sessionStorage: new MemoryStorage(),
  };
});

afterEach(() => {
  delete g.window;
});

describe('captureUtm / getUtm', () => {
  it('captures all five UTM params from the URL', () => {
    setUrl(
      '?utm_source=wgs-email&utm_medium=email&utm_campaign=sunday-ready-birthday&utm_content=worship-wheel-bf&utm_term=guitar',
    );
    captureUtm();
    expect(getUtm()).toEqual({
      source: 'wgs-email',
      medium: 'email',
      campaign: 'sunday-ready-birthday',
      content: 'worship-wheel-bf',
      term: 'guitar',
    });
  });

  it('captures a partial set (missing params are null)', () => {
    setUrl('?utm_source=wgs-email&utm_medium=email');
    captureUtm();
    expect(getUtm()).toEqual({
      source: 'wgs-email',
      medium: 'email',
      campaign: null,
      content: null,
      term: null,
    });
  });

  // The core requirement: home (with UTMs) → /assessment (no UTMs) must keep
  // the original campaign — the param-less hop must NOT clobber storage.
  it('survives the homepage → /assessment hop (param-less navigation is a no-op)', () => {
    setUrl('?utm_source=wgs-email&utm_campaign=sunday-ready-birthday');
    captureUtm(); // landing page

    setUrl(''); // navigated to /assessment with no query string
    captureUtm(); // capture runs again on the new page

    expect(getUtm()).toMatchObject({
      source: 'wgs-email',
      campaign: 'sunday-ready-birthday',
    });
  });

  it('last-touch: a fresh campaign link in the same session updates the stored set', () => {
    setUrl('?utm_source=wgs-email&utm_campaign=campaign-a');
    captureUtm();

    setUrl('?utm_source=wgs-email&utm_campaign=campaign-b');
    captureUtm();

    expect(getUtm()).toMatchObject({ campaign: 'campaign-b' });
  });

  it('getUtm falls back to the live URL when nothing is stored', () => {
    // No captureUtm() call — simulates a direct /assessment?utm entry read at submit.
    setUrl('?utm_source=wgs-email&utm_medium=email');
    expect(getUtm()).toMatchObject({ source: 'wgs-email', medium: 'email' });
  });

  it('returns undefined when there are no UTMs anywhere', () => {
    setUrl('');
    captureUtm();
    expect(getUtm()).toBeUndefined();
  });

  it('does not write a stored entry on a param-less first load', () => {
    setUrl('');
    captureUtm();
    expect(g.window!.sessionStorage.getItem('ww_utm')).toBeNull();
  });
});
