import { describe, it, expect } from 'vitest';
import { renderCopy } from '@/lib/products/tokens';
import type { ProductCopyTokens } from '@/lib/products/types';

const tokens: ProductCopyTokens = {
  overallScore: 35,
  archetypeName: 'The Uneven Intermediate',
  firstName: 'Alex',
  weakestElement: 'Rhythm',
};

describe('renderCopy', () => {
  it('interpolates all four tokens', () => {
    const out = renderCopy(
      'Hi {firstName}, as {archetypeName} you scored {overallScore}/80 — focus on {weakestElement}.',
      tokens,
    );
    expect(out).toBe(
      'Hi Alex, as The Uneven Intermediate you scored 35/80 — focus on Rhythm.',
    );
  });

  it('blanks a known-but-missing value and collapses whitespace', () => {
    const out = renderCopy('Focus on {weakestElement} next.', {
      ...tokens,
      weakestElement: null,
    });
    expect(out).toBe('Focus on next.');
  });

  it('removes space before punctuation left by a blanked token', () => {
    const out = renderCopy('Nice work {firstName}.', { ...tokens, firstName: '' });
    expect(out).toBe('Nice work.');
  });

  it('strips an unknown token on the live page', () => {
    expect(renderCopy('Score {overallScore} {bogus}.', tokens)).toBe('Score 35.');
  });

  it('keeps an unknown token in admin-preview mode', () => {
    expect(
      renderCopy('Score {overallScore} {bogus}', tokens, { keepUnknown: true }),
    ).toBe('Score 35 {bogus}');
  });

  it('handles score of 0 (falsy but valid)', () => {
    expect(renderCopy('{overallScore}/80', { ...tokens, overallScore: 0 })).toBe('0/80');
  });
});
