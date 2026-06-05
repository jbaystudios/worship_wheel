import type { ReactNode } from 'react';
import { Text } from '@react-pdf/renderer';
import { tokenizeInline } from '@/lib/markdown/inline-tokens';

/** Renders **bold** / *italic* inline markdown as nested @react-pdf <Text>
 *  spans. Relies on Montserrat 700 (bold) and italic variants registered in
 *  styles.ts. Used for archetype reveal copy on the Scores page. */
export function renderPdfInlineMarkdown(text: string): ReactNode {
  return tokenizeInline(text).map((token, i) => {
    if (token.type === 'bold') {
      return (
        <Text key={i} style={{ fontWeight: 700 }}>
          {token.value}
        </Text>
      );
    }
    if (token.type === 'italic') {
      return (
        <Text key={i} style={{ fontStyle: 'italic' }}>
          {token.value}
        </Text>
      );
    }
    return (
      <Text key={i}>{token.value}</Text>
    );
  });
}
