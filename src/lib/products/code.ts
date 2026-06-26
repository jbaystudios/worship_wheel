// Product CTA Cards (spec 009) — short-code generation + normalization.
// Decision: research R3 (4-char default, no ambiguous glyphs, 3–6 on override).
import { MAX_PR_CODES, PRODUCT_CODE_RE } from '@/lib/products/schema';

// Lowercase alphanumerics with ambiguous glyphs (l, 1, o, 0) removed, so a
// hand-typed or read-aloud code is unambiguous.
const SAFE_ALPHABET = 'abcdefghijkmnpqrstuvwxyz23456789';
const DEFAULT_LENGTH = 4;

/**
 * Generate a random short code from the safe alphabet. Uniqueness is enforced
 * by the DB unique index; callers retry on collision. Uses crypto when present,
 * falling back to Math.random in environments without it.
 */
export function generateProductCode(length: number = DEFAULT_LENGTH): string {
  const n = SAFE_ALPHABET.length;
  let out = '';

  const cryptoObj =
    typeof globalThis !== 'undefined'
      ? (globalThis.crypto as Crypto | undefined)
      : undefined;

  if (cryptoObj?.getRandomValues) {
    const bytes = new Uint8Array(length);
    cryptoObj.getRandomValues(bytes);
    for (let i = 0; i < length; i++) out += SAFE_ALPHABET[bytes[i] % n];
  } else {
    for (let i = 0; i < length; i++) {
      out += SAFE_ALPHABET[Math.floor(Math.random() * n)];
    }
  }
  return out;
}

/**
 * Normalize a list of raw `pr` codes: trim, lowercase, keep only well-formed
 * codes, de-duplicate (first-seen wins, preserving order), and cap at
 * MAX_PR_CODES. Returns `{ codes, truncated }` so callers can surface a
 * non-silent truncation breadcrumb (research R2).
 */
export function normalizeCodes(raw: readonly string[]): {
  codes: string[];
  truncated: boolean;
} {
  const seen = new Set<string>();
  const valid: string[] = [];

  for (const item of raw) {
    const code = String(item).trim().toLowerCase();
    if (!PRODUCT_CODE_RE.test(code)) continue;
    if (seen.has(code)) continue;
    seen.add(code);
    valid.push(code);
  }

  const codes = valid.slice(0, MAX_PR_CODES);
  return { codes, truncated: valid.length > codes.length };
}
