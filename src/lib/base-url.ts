// Resolve the public base URL for user-facing links — most importantly the
// results URL we push to Keap. Guards against a localhost NEXT_PUBLIC_BASE_URL
// leaking into a production build: NEXT_PUBLIC_* is inlined at build time, so a
// stale `.env.local` value (http://localhost:3000) can get baked into prod and
// poison every results link in Keap. A dead localhost link is worse than the
// real request origin, so we never emit one for a non-local request.

const CANONICAL_BASE_URL = 'https://worshipwheel.com';

/** True if the URL's host is a loopback / local-dev address. */
export function isLocalhostUrl(value: string): boolean {
  try {
    const { hostname } = new URL(value);
    return (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname === '::1'
    );
  } catch {
    return false;
  }
}

function stripTrailingSlash(value: string): string {
  return value.replace(/\/$/, '');
}

function envBaseUrl(): string | undefined {
  const raw = process.env.NEXT_PUBLIC_BASE_URL;
  return raw ? stripTrailingSlash(raw) : undefined;
}

/**
 * Base URL for links built inside a request handler (e.g. /api/submit → Keap).
 * Prefers the configured NEXT_PUBLIC_BASE_URL, but if that points at localhost
 * while the request itself is NOT local, the env var is misconfigured — fall
 * back to the real request origin so Keap never receives a dead localhost link.
 */
export function resolveRequestBaseUrl(requestUrl: string): string {
  const requestOrigin = new URL(requestUrl).origin;
  const requestIsLocal = isLocalhostUrl(requestOrigin);
  const envBase = envBaseUrl();

  // Use the configured base URL unless it's localhost on a non-local request.
  if (envBase && !(isLocalhostUrl(envBase) && !requestIsLocal)) {
    return envBase;
  }
  return requestOrigin;
}

/**
 * Base URL for links built OUTSIDE any request (batch scripts, cron). There's
 * no request origin to fall back to, and these always target live Keap, so a
 * missing or localhost env value resolves to the canonical production domain.
 */
export function resolveCanonicalBaseUrl(): string {
  const envBase = envBaseUrl();
  if (!envBase || isLocalhostUrl(envBase)) {
    return CANONICAL_BASE_URL;
  }
  return envBase;
}
