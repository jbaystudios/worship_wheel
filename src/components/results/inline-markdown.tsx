import { Fragment, type ReactNode } from 'react';
import { tokenizeInline } from '@/lib/markdown/inline-tokens';

/** Renders a minimal subset of inline markdown — **bold** and *italic* — as
 *  React nodes for the web. Sufficient for archetype reveal copy
 *  (src/data/archetype-content.ts); not a general-purpose markdown parser. */
export function renderInlineMarkdown(text: string): ReactNode {
  return tokenizeInline(text).map((token, i) => {
    if (token.type === 'bold') {
      return (
        <strong key={i} className="font-semibold text-theme-text">
          {token.value}
        </strong>
      );
    }
    if (token.type === 'italic') {
      return <em key={i}>{token.value}</em>;
    }
    return <Fragment key={i}>{token.value}</Fragment>;
  });
}
