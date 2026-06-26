// Product CTA Cards (spec 009, US2) — capture campaign codes at first load.
// Contract: specs/009-product-cta-cards/contracts/capture-and-submit.md
//
// `?pr=<code>` is captured on the first page the email link hits (landing or
// assessment), held in sessionStorage through the multi-minute assessment, and
// read into the submit body. sessionStorage (sibling of ww_evt_sid) scopes the
// code to the browsing session so a stale campaign code can't leak into a later
// unrelated visit. More robust than reading the URL only at submit time.
import { normalizeCodes } from '@/lib/products/code';

const PR_KEY = 'ww_pr_codes';

function read(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.sessionStorage.getItem(PR_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

/**
 * Merge any `?pr=` codes from the current URL into sessionStorage. Idempotent:
 * a param-less page is a no-op (never clobbers existing codes); re-running only
 * appends new codes. Order preserved, de-duplicated, capped (research R2).
 */
export function capturePrCodes(): void {
  if (typeof window === 'undefined') return;
  try {
    const fromUrl = new URLSearchParams(window.location.search).getAll('pr');
    if (fromUrl.length === 0) return; // no-op on param-less navigations

    const { codes, truncated } = normalizeCodes([...read(), ...fromUrl]);
    if (truncated) {
      // Non-silent: surface that codes were dropped past the cap (research R2).
      console.warn(`[pr] product codes truncated to ${codes.length} (cap reached)`);
    }
    window.sessionStorage.setItem(PR_KEY, JSON.stringify(codes));
  } catch {
    // Best-effort — capture failures must never affect the assessment.
  }
}

/** Read the captured codes for the submit body. Always a clean, capped array. */
export function getPrCodes(): string[] {
  return normalizeCodes(read()).codes;
}
