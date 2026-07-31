// Date-range utilities for the admin dashboard (spec 005, research R9).
// Ranges are inclusive calendar-date ranges (ISO `YYYY-MM-DD`) interpreted in a
// single fixed reporting timezone, so day boundaries and prior-period
// comparisons are deterministic regardless of where a stakeholder is.
import type { DateRange } from '@/types/admin';

export const REPORTING_TIMEZONE =
  process.env.ADMIN_REPORTING_TIMEZONE ?? 'Africa/Johannesburg';

export const INTERNAL_UTM_SOURCE =
  process.env.ADMIN_INTERNAL_UTM_SOURCE ?? 'internal';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** True when `s` is a real `YYYY-MM-DD` calendar date. */
export function isISODate(s: string): boolean {
  if (!ISO_DATE.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

function toUTCDate(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

/** Formats a Date as an ISO `YYYY-MM-DD` calendar date (UTC). */
export function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Returns the ISO date `n` days after `iso` (negative `n` goes backwards). */
export function addDays(iso: string, n: number): string {
  const d = toUTCDate(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return toISODate(d);
}

/** Inclusive number of days covered by `range` (a single-day range is 1). */
export function rangeLengthDays(range: DateRange): number {
  const ms = toUTCDate(range.to).getTime() - toUTCDate(range.from).getTime();
  return Math.round(ms / 86_400_000) + 1;
}

/** The equal-length range ending the day immediately before `range.from`. */
export function priorPeriod(range: DateRange): DateRange {
  const len = rangeLengthDays(range);
  const to = addDays(range.from, -1);
  const from = addDays(to, -(len - 1));
  return { from, to };
}

/** Today's calendar date in the reporting timezone. */
export function todayInReportingTz(now: Date = new Date()): string {
  // 'en-CA' formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: REPORTING_TIMEZONE,
  }).format(now);
}

/** Default dashboard window: the last 30 days, inclusive of today. */
export function defaultRange(today: string = todayInReportingTz()): DateRange {
  return { from: addDays(today, -29), to: today };
}

/**
 * Floor date for the "All time" view — safely earlier than any assessment data
 * (the tool launched in 2026), so this range captures every record.
 */
export const ALL_TIME_FROM = '2020-01-01';

/** Range covering all data ever recorded: the floor date through today. */
export function allTimeRange(today: string = todayInReportingTz()): DateRange {
  return { from: ALL_TIME_FROM, to: today };
}

/**
 * Resolves `from`/`to` query params into a valid range, falling back to the
 * default window when a value is missing or malformed.
 * @throws RangeError when `from` is after `to`.
 */
export function parseRange(
  params: { from?: string | null; to?: string | null },
  today: string = todayInReportingTz(),
): DateRange {
  const def = defaultRange(today);
  const from = params.from && isISODate(params.from) ? params.from : def.from;
  const to = params.to && isISODate(params.to) ? params.to : def.to;

  if (toUTCDate(from).getTime() > toUTCDate(to).getTime()) {
    throw new RangeError(`Invalid date range: from (${from}) is after to (${to})`);
  }
  return { from, to };
}
