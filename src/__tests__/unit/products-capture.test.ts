import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { capturePrCodes, getPrCodes } from '@/lib/products/capture';

// capture.ts reads `window` at call-time, so we can stub a minimal window with
// an in-memory sessionStorage and a settable location.search per test (no jsdom).
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

const g = globalThis as unknown as { window?: { location: { search: string }; sessionStorage: MemoryStorage } };

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

describe('capturePrCodes / getPrCodes', () => {
  it('captures a single code from the URL', () => {
    setUrl('?pr=ab3');
    capturePrCodes();
    expect(getPrCodes()).toEqual(['ab3']);
  });

  it('captures stacked repeated params in order', () => {
    setUrl('?pr=ab3&pr=cd7');
    capturePrCodes();
    expect(getPrCodes()).toEqual(['ab3', 'cd7']);
  });

  it('de-duplicates and caps at 3', () => {
    setUrl('?pr=aa1&pr=bb2&pr=aa1&pr=cc3&pr=dd4');
    capturePrCodes();
    expect(getPrCodes()).toEqual(['aa1', 'bb2', 'cc3']);
  });

  it('drops invalid codes', () => {
    setUrl('?pr=TOOLONGER&pr=ok9&pr=a!');
    capturePrCodes();
    expect(getPrCodes()).toEqual(['ok9']);
  });

  it('is a no-op on a param-less page (does not clobber existing)', () => {
    setUrl('?pr=ab3');
    capturePrCodes();
    setUrl(''); // navigate to a page without pr
    capturePrCodes();
    expect(getPrCodes()).toEqual(['ab3']);
  });

  it('merges new codes across navigations (idempotent append)', () => {
    setUrl('?pr=ab3');
    capturePrCodes();
    setUrl('?pr=cd7');
    capturePrCodes();
    expect(getPrCodes()).toEqual(['ab3', 'cd7']);
  });

  it('returns [] when nothing captured', () => {
    expect(getPrCodes()).toEqual([]);
  });
});
