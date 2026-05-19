import { describe, it, expect } from 'vitest';
import {
  buildFunnelRows,
  buildQuestionDropoff,
  countDelta,
  type RawQuestionStat,
} from '@/lib/analytics/funnel';

describe('buildFunnelRows', () => {
  it('computes step-over-step and from-visitors conversion rates', () => {
    const rows = buildFunnelRows({
      visitors: 1000,
      started: 800,
      completed: 500,
      leadCaptured: 450,
    });
    expect(rows[0]).toMatchObject({ step: 'visitors', count: 1000, rateFromPrevious: null });
    expect(rows[1]).toMatchObject({ step: 'started', rateFromPrevious: 0.8 });
    expect(rows[2]).toMatchObject({ step: 'completed', rateFromPrevious: 0.625 });
    expect(rows[3].rateFromPrevious).toBeCloseTo(0.9);
    expect(rows[3].rateFromVisitors).toBeCloseTo(0.45);
  });

  it('never divides by zero on an empty period', () => {
    const rows = buildFunnelRows({ visitors: 0, started: 0, completed: 0, leadCaptured: 0 });
    expect(rows.every((r) => r.rateFromVisitors === 0)).toBe(true);
    expect(rows[1].rateFromPrevious).toBe(0);
  });
});

describe('countDelta', () => {
  it('returns the fractional change vs the prior period', () => {
    expect(countDelta(120, 100)).toBeCloseTo(0.2);
    expect(countDelta(80, 100)).toBeCloseTo(-0.2);
  });

  it('returns null when there is no prior base', () => {
    expect(countDelta(50, 0)).toBeNull();
  });
});

describe('buildQuestionDropoff', () => {
  it('always returns 24 rows, ordered, with question ids', () => {
    const rows = buildQuestionDropoff([], 0);
    expect(rows).toHaveLength(24);
    expect(rows[0].position).toBe(1);
    expect(rows[23].position).toBe(24);
    expect(rows[0].questionId).toBe('fb_01');
  });

  it('computes drop-off between consecutive questions', () => {
    const stats: RawQuestionStat[] = [
      { position: 1, reached: 100, medianTimeSeconds: 10, avgTimeSeconds: 12 },
      { position: 2, reached: 70, medianTimeSeconds: 10, avgTimeSeconds: 12 },
    ];
    const rows = buildQuestionDropoff(stats, 100);
    expect(rows[0].reached).toBe(100);
    expect(rows[0].reachedRate).toBe(1);
    expect(rows[0].dropoffToNext).toBe(30);
    expect(rows[0].dropoffRate).toBeCloseTo(0.3);
  });

  it('flags a sticking point: above-average abandonment AND dwell', () => {
    // Q1-12 hold steady at 100; a big drop and a long dwell happen at Q12.
    const stats: RawQuestionStat[] = Array.from({ length: 24 }, (_, i) => {
      const position = i + 1;
      const reached = position <= 12 ? 100 : 50;
      const time = position === 12 ? 60 : 10;
      return { position, reached, medianTimeSeconds: time, avgTimeSeconds: time };
    });
    const rows = buildQuestionDropoff(stats, 100);
    const q12 = rows.find((r) => r.position === 12)!;
    expect(q12.dropoffToNext).toBe(50);
    expect(q12.stickingPoint).toBe(true);
    expect(rows.filter((r) => r.stickingPoint)).toHaveLength(1);
  });

  it('flags no sticking points when data is uniform', () => {
    const stats: RawQuestionStat[] = Array.from({ length: 24 }, (_, i) => ({
      position: i + 1,
      reached: 100 - i,
      medianTimeSeconds: 10,
      avgTimeSeconds: 10,
    }));
    const rows = buildQuestionDropoff(stats, 100);
    expect(rows.some((r) => r.stickingPoint)).toBe(false);
  });
});
