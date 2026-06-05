// Guards the results-URL base resolution (src/lib/base-url.ts) — specifically
// the prod regression where NEXT_PUBLIC_BASE_URL=http://localhost:3000 leaked
// into the production build and a dead localhost link was pushed to Keap.
import { describe, it, expect, afterEach, vi } from 'vitest';
import {
  isLocalhostUrl,
  resolveRequestBaseUrl,
  resolveCanonicalBaseUrl,
} from '@/lib/base-url';

const PROD_REQUEST = 'https://worshipwheel.com/api/submit';
const LOCAL_REQUEST = 'http://localhost:3000/api/submit';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('isLocalhostUrl', () => {
  it('detects loopback hosts', () => {
    expect(isLocalhostUrl('http://localhost:3000')).toBe(true);
    expect(isLocalhostUrl('http://127.0.0.1:3000')).toBe(true);
    expect(isLocalhostUrl('http://0.0.0.0:8080')).toBe(true);
  });
  it('treats real domains as non-local', () => {
    expect(isLocalhostUrl('https://worshipwheel.com')).toBe(false);
    expect(isLocalhostUrl('https://ww-preview.vercel.app')).toBe(false);
  });
  it('returns false for unparseable input', () => {
    expect(isLocalhostUrl('not a url')).toBe(false);
  });
});

describe('resolveRequestBaseUrl', () => {
  it('uses the canonical env value on a prod request', () => {
    vi.stubEnv('NEXT_PUBLIC_BASE_URL', 'https://worshipwheel.com');
    expect(resolveRequestBaseUrl(PROD_REQUEST)).toBe('https://worshipwheel.com');
  });

  it('THE BUG: a leaked localhost env on a prod request falls back to the real origin', () => {
    vi.stubEnv('NEXT_PUBLIC_BASE_URL', 'http://localhost:3000');
    // Must NOT return localhost — that is what poisoned Keap.
    expect(resolveRequestBaseUrl(PROD_REQUEST)).toBe('https://worshipwheel.com');
  });

  it('keeps localhost for genuine local dev requests', () => {
    vi.stubEnv('NEXT_PUBLIC_BASE_URL', 'http://localhost:3000');
    expect(resolveRequestBaseUrl(LOCAL_REQUEST)).toBe('http://localhost:3000');
  });

  it('falls back to request origin when env is unset', () => {
    vi.stubEnv('NEXT_PUBLIC_BASE_URL', '');
    expect(resolveRequestBaseUrl(PROD_REQUEST)).toBe('https://worshipwheel.com');
  });

  it('strips a trailing slash from the env value', () => {
    vi.stubEnv('NEXT_PUBLIC_BASE_URL', 'https://worshipwheel.com/');
    expect(resolveRequestBaseUrl(PROD_REQUEST)).toBe('https://worshipwheel.com');
  });
});

describe('resolveCanonicalBaseUrl', () => {
  it('uses the env value when it is a real domain', () => {
    vi.stubEnv('NEXT_PUBLIC_BASE_URL', 'https://worshipwheel.com');
    expect(resolveCanonicalBaseUrl()).toBe('https://worshipwheel.com');
  });

  it('ignores a localhost env value (batch context always targets prod)', () => {
    vi.stubEnv('NEXT_PUBLIC_BASE_URL', 'http://localhost:3000');
    expect(resolveCanonicalBaseUrl()).toBe('https://worshipwheel.com');
  });

  it('falls back to canonical when env is unset', () => {
    vi.stubEnv('NEXT_PUBLIC_BASE_URL', '');
    expect(resolveCanonicalBaseUrl()).toBe('https://worshipwheel.com');
  });
});
