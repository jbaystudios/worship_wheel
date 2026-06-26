// Product CTA Cards (spec 009) — copy token interpolation.
// Decision: research R4. Tokens keep personalization in admin-authored config
// while guaranteeing a visitor never sees a raw {token}.
import type { ProductCopyTokens } from '@/lib/products/types';

const TOKEN_RE = /\{(\w+)\}/g;

/**
 * Interpolate `{overallScore}`, `{archetypeName}`, `{firstName}`,
 * `{weakestElement}` into a template. A token whose value is unavailable (or an
 * unknown token) is replaced with an empty string; resulting double spaces and
 * orphaned punctuation are collapsed so the sentence stays grammatical.
 *
 * `keepUnknown` (admin preview only) leaves an UNKNOWN token's braces intact so
 * authors can spot typos — known-but-empty tokens are still blanked.
 */
export function renderCopy(
  template: string,
  tokens: ProductCopyTokens,
  options: { keepUnknown?: boolean } = {},
): string {
  const map: Record<string, string> = {
    overallScore: String(tokens.overallScore),
    archetypeName: tokens.archetypeName ?? '',
    firstName: tokens.firstName ?? '',
    weakestElement: tokens.weakestElement ?? '',
  };

  const replaced = template.replace(TOKEN_RE, (match, name: string) => {
    if (name in map) return map[name];
    return options.keepUnknown ? match : '';
  });

  return collapseWhitespace(replaced);
}

/** Collapse the gaps a blanked token leaves behind. */
function collapseWhitespace(text: string): string {
  return text
    .replace(/[ \t]{2,}/g, ' ') // runs of spaces → one
    .replace(/\s+([,.;:!?])/g, '$1') // space before punctuation
    .replace(/\(\s*\)/g, '') // empty parens
    .replace(/[ \t]+\n/g, '\n') // trailing spaces on a line
    .trim();
}
