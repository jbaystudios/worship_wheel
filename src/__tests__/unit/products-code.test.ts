import { describe, it, expect } from 'vitest';
import { generateProductCode, normalizeCodes } from '@/lib/products/code';
import { PRODUCT_CODE_RE, MAX_PR_CODES } from '@/lib/products/schema';

describe('generateProductCode', () => {
  it('produces a 4-char code from the safe alphabet by default', () => {
    for (let i = 0; i < 200; i++) {
      const code = generateProductCode();
      expect(code).toHaveLength(4);
      expect(PRODUCT_CODE_RE.test(code)).toBe(true);
      // No ambiguous glyphs.
      expect(/[l1o0]/.test(code)).toBe(false);
    }
  });

  it('respects a custom length within the schema bound', () => {
    expect(generateProductCode(6)).toHaveLength(6);
    expect(PRODUCT_CODE_RE.test(generateProductCode(6))).toBe(true);
  });

  it('is effectively non-repeating across many draws', () => {
    const codes = new Set(Array.from({ length: 500 }, () => generateProductCode()));
    // Collisions are possible but should be rare over 500 draws of ~923k space.
    expect(codes.size).toBeGreaterThan(490);
  });
});

describe('normalizeCodes', () => {
  it('trims, lowercases, and validates', () => {
    expect(normalizeCodes([' Ab3 ', 'CD7'])).toEqual({
      codes: ['ab3', 'cd7'],
      truncated: false,
    });
  });

  it('drops invalid codes (too long, too short, bad chars)', () => {
    expect(normalizeCodes(['toolongcode', 'ab', 'a!b', 'ok9']).codes).toEqual(['ok9']);
  });

  it('de-duplicates, first-seen wins, order preserved', () => {
    expect(normalizeCodes(['ab3', 'cd7', 'ab3']).codes).toEqual(['ab3', 'cd7']);
  });

  it(`caps at MAX_PR_CODES (${MAX_PR_CODES}) and flags truncation`, () => {
    const result = normalizeCodes(['aa1', 'bb2', 'cc3', 'dd4', 'ee5']);
    expect(result.codes).toEqual(['aa1', 'bb2', 'cc3']);
    expect(result.truncated).toBe(true);
  });

  it('returns empty for no valid codes', () => {
    expect(normalizeCodes([])).toEqual({ codes: [], truncated: false });
    expect(normalizeCodes(['!!', 'x'])).toEqual({ codes: [], truncated: false });
  });
});
