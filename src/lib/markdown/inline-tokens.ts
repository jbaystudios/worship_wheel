// Minimal inline-markdown tokenizer — splits a string into plain / **bold** /
// *italic* runs. Shared by the web renderer (renderInlineMarkdown) and the PDF
// renderer (renderPdfInlineMarkdown) so both stay in lockstep. Not a general
// markdown parser: bold and italic are not nested, which suffices for the
// archetype reveal copy (src/data/archetype-content.ts).

export type InlineToken =
  | { type: 'text'; value: string }
  | { type: 'bold'; value: string }
  | { type: 'italic'; value: string };

export function tokenizeInline(text: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  const pattern = /\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }
    if (match[1] !== undefined) {
      tokens.push({ type: 'bold', value: match[1] });
    } else {
      tokens.push({ type: 'italic', value: match[2] });
    }
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    tokens.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return tokens;
}
