import { describe, it, expect } from 'vitest';
import {
  buildCsv,
  serializeCell,
  serializeRow,
  streamCsv,
} from '@/lib/analytics/csv';

describe('serializeCell', () => {
  it('returns empty string for null and undefined', () => {
    expect(serializeCell(null)).toBe('');
    expect(serializeCell(undefined)).toBe('');
  });

  it('passes through plain strings and numbers unquoted', () => {
    expect(serializeCell('hello')).toBe('hello');
    expect(serializeCell(42)).toBe('42');
    expect(serializeCell(0)).toBe('0');
    expect(serializeCell(false)).toBe('false');
  });

  it('quotes and escapes embedded double quotes', () => {
    expect(serializeCell('she said "hi"')).toBe('"she said ""hi"""');
  });

  it('quotes values containing commas, CR, or LF', () => {
    expect(serializeCell('a,b')).toBe('"a,b"');
    expect(serializeCell('line1\nline2')).toBe('"line1\nline2"');
    expect(serializeCell('line1\r\nline2')).toBe('"line1\r\nline2"');
  });

  it('serialises Date as ISO 8601', () => {
    expect(serializeCell(new Date('2026-05-19T09:14:00Z'))).toBe('2026-05-19T09:14:00.000Z');
  });

  it('neutralises CSV-injection formula triggers', () => {
    expect(serializeCell('=SUM(A1:A2)')).toBe("'=SUM(A1:A2)");
    expect(serializeCell('+1234')).toBe("'+1234");
    expect(serializeCell('-1234')).toBe("'-1234");
    expect(serializeCell('@cmd')).toBe("'@cmd");
  });

  it('quotes a formula-triggered cell that also contains a comma', () => {
    expect(serializeCell('=A1,B1')).toBe('"\'=A1,B1"');
  });
});

describe('serializeRow', () => {
  it('joins cells with commas and terminates with CRLF', () => {
    expect(serializeRow(['a', 'b', 'c'])).toBe('a,b,c\r\n');
  });

  it('preserves empty cells', () => {
    expect(serializeRow(['a', '', 'c'])).toBe('a,,c\r\n');
  });
});

describe('buildCsv', () => {
  it('writes header then rows in order', () => {
    const csv = buildCsv(
      ['First Name', 'Email'],
      [
        ['Ada', 'ada@example.com'],
        ['Grace', 'grace@example.com'],
      ],
    );
    expect(csv).toBe(
      'First Name,Email\r\nAda,ada@example.com\r\nGrace,grace@example.com\r\n',
    );
  });

  it('handles an empty row set as just the header', () => {
    expect(buildCsv(['A', 'B'], [])).toBe('A,B\r\n');
  });
});

describe('streamCsv', () => {
  async function readAll(stream: ReadableStream<Uint8Array>): Promise<string> {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let out = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      out += decoder.decode(value, { stream: true });
    }
    out += decoder.decode();
    return out;
  }

  it('streams an iterable source equivalently to buildCsv', async () => {
    const stream = streamCsv(['A', 'B'], [
      ['1', '2'],
      ['3', '4'],
    ]);
    expect(await readAll(stream)).toBe('A,B\r\n1,2\r\n3,4\r\n');
  });

  it('streams an async iterable source', async () => {
    async function* rows() {
      yield ['1', 'a'];
      yield ['2', 'b'];
    }
    const stream = streamCsv(['n', 'letter'], rows());
    expect(await readAll(stream)).toBe('n,letter\r\n1,a\r\n2,b\r\n');
  });

  it('emits only the header when source is empty', async () => {
    const stream = streamCsv(['only'], []);
    expect(await readAll(stream)).toBe('only\r\n');
  });
});
