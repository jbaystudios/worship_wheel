import { describe, it, expect } from 'vitest';
import {
  isISODate,
  addDays,
  rangeLengthDays,
  priorPeriod,
  defaultRange,
  parseRange,
} from '@/lib/analytics/date-range';

describe('isISODate', () => {
  it('accepts real calendar dates', () => {
    expect(isISODate('2026-05-19')).toBe(true);
    expect(isISODate('2024-02-29')).toBe(true); // leap day
  });

  it('rejects malformed or impossible dates', () => {
    expect(isISODate('2026-5-19')).toBe(false);
    expect(isISODate('2026-13-01')).toBe(false);
    expect(isISODate('2026-02-30')).toBe(false);
    expect(isISODate('not-a-date')).toBe(false);
  });
});

describe('addDays', () => {
  it('moves forward and backward across month boundaries', () => {
    expect(addDays('2026-05-19', 1)).toBe('2026-05-20');
    expect(addDays('2026-05-01', -1)).toBe('2026-04-30');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });
});

describe('rangeLengthDays', () => {
  it('counts inclusively', () => {
    expect(rangeLengthDays({ from: '2026-05-19', to: '2026-05-19' })).toBe(1);
    expect(rangeLengthDays({ from: '2026-04-20', to: '2026-05-19' })).toBe(30);
  });
});

describe('priorPeriod', () => {
  it('returns an equal-length range ending the day before `from`', () => {
    const range = { from: '2026-04-20', to: '2026-05-19' }; // 30 days
    const prior = priorPeriod(range);
    expect(prior).toEqual({ from: '2026-03-21', to: '2026-04-19' });
    expect(rangeLengthDays(prior)).toBe(30);
  });

  it('is adjacent to the original range with no gap or overlap', () => {
    const range = { from: '2026-05-01', to: '2026-05-07' };
    const prior = priorPeriod(range);
    expect(addDays(prior.to, 1)).toBe(range.from);
  });
});

describe('defaultRange', () => {
  it('is the last 30 days inclusive of today', () => {
    const range = defaultRange('2026-05-19');
    expect(range).toEqual({ from: '2026-04-20', to: '2026-05-19' });
    expect(rangeLengthDays(range)).toBe(30);
  });
});

describe('parseRange', () => {
  const today = '2026-05-19';

  it('falls back to the default window when params are absent', () => {
    expect(parseRange({}, today)).toEqual(defaultRange(today));
  });

  it('falls back to defaults for malformed values', () => {
    expect(parseRange({ from: 'garbage', to: '2026-13-99' }, today)).toEqual(
      defaultRange(today),
    );
  });

  it('honours valid explicit values', () => {
    expect(parseRange({ from: '2026-01-01', to: '2026-01-31' }, today)).toEqual({
      from: '2026-01-01',
      to: '2026-01-31',
    });
  });

  it('throws when from is after to', () => {
    expect(() => parseRange({ from: '2026-05-19', to: '2026-05-01' }, today)).toThrow(
      RangeError,
    );
  });
});
