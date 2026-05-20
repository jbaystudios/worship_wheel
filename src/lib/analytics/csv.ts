// RFC 4180 CSV serialiser (spec 005, US5 / task T047).
// Used by GET /api/admin/leads/export. Streams row-by-row so a 1-month export
// stays under the 10s budget (SC-010) without buffering the full set in memory.

const CRLF = '\r\n';

/** Cells that need quoting per RFC 4180 §2.6: comma, quote, CR, LF. */
const NEEDS_QUOTE = /[",\r\n]/;

/** Excel/Sheets formula-injection guard — leading char that may be interpreted as a formula. */
const FORMULA_TRIGGER = /^[=+\-@\t\r]/;

export type CsvCell = string | number | boolean | null | undefined | Date;

/**
 * Serialise a single cell value.
 *
 * - `null`/`undefined` → empty
 * - `Date` → ISO 8601 (so spreadsheets parse it predictably)
 * - Otherwise stringified; quoted when it contains `,` `"` CR or LF; embedded
 *   `"` doubled. Leading formula triggers are neutralised with `'` to prevent
 *   CSV injection in Excel/Google Sheets.
 */
export function serializeCell(value: CsvCell): string {
  if (value === null || value === undefined) return '';
  const raw = value instanceof Date ? value.toISOString() : String(value);
  const safe = FORMULA_TRIGGER.test(raw) ? `'${raw}` : raw;
  if (!NEEDS_QUOTE.test(safe)) return safe;
  return `"${safe.replace(/"/g, '""')}"`;
}

/** Serialise one row (CRLF terminated, per RFC 4180 §2.2). */
export function serializeRow(cells: readonly CsvCell[]): string {
  return cells.map(serializeCell).join(',') + CRLF;
}

/**
 * Build a complete CSV string from a header + rows. Convenience wrapper for
 * unit tests and small in-memory exports; prefer `streamCsv` for the leads
 * export route.
 */
export function buildCsv(
  header: readonly string[],
  rows: readonly (readonly CsvCell[])[],
): string {
  let out = serializeRow(header);
  for (const row of rows) out += serializeRow(row);
  return out;
}

/**
 * Stream rows as a `ReadableStream<Uint8Array>` suitable for a Route Handler
 * `Response`. The source is any iterable/async-iterable of row arrays, so a
 * paginated DB cursor can feed straight into the response without buffering.
 */
export function streamCsv(
  header: readonly string[],
  rows: Iterable<readonly CsvCell[]> | AsyncIterable<readonly CsvCell[]>,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const iterator = isAsyncIterable(rows)
    ? rows[Symbol.asyncIterator]()
    : (rows as Iterable<readonly CsvCell[]>)[Symbol.iterator]();

  let wroteHeader = false;

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      if (!wroteHeader) {
        controller.enqueue(encoder.encode(serializeRow(header)));
        wroteHeader = true;
        return;
      }
      const next = await iterator.next();
      if (next.done) {
        controller.close();
        return;
      }
      controller.enqueue(encoder.encode(serializeRow(next.value)));
    },
    async cancel(reason) {
      if (typeof (iterator as AsyncIterator<unknown>).return === 'function') {
        await (iterator as AsyncIterator<unknown>).return!(reason);
      }
    },
  });
}

function isAsyncIterable<T>(value: unknown): value is AsyncIterable<T> {
  return (
    !!value &&
    typeof (value as AsyncIterable<T>)[Symbol.asyncIterator] === 'function'
  );
}
