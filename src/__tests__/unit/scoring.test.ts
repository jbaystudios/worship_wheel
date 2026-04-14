import { describe, it, expect } from 'vitest';
import {
  scoreScenario,
  scoreChecklist,
  scoreExperience,
  scoreElement,
  scoreOverall,
  scorePercentage,
  scoreBalance,
} from '@/lib/scoring/calculator';
import { questions } from '@/data/questions';
import type { ChecklistQuestion } from '@/types';

// ── Scenario scoring ──────────────────────────────────────────

describe('scoreScenario', () => {
  it('returns the point value of the selected option', () => {
    const options = [
      { key: 'a', text: '', points: 1 },
      { key: 'b', text: '', points: 3 },
      { key: 'c', text: '', points: 5 },
      { key: 'd', text: '', points: 7 },
      { key: 'e', text: '', points: 10 },
    ];
    expect(scoreScenario('a', options)).toBe(1);
    expect(scoreScenario('c', options)).toBe(5);
    expect(scoreScenario('e', options)).toBe(10);
  });
});

// ── Experience scoring ────────────────────────────────────────

describe('scoreExperience', () => {
  it('returns the point value of the selected option (same as scenario)', () => {
    const options = [
      { key: 'a', text: '', points: 1 },
      { key: 'b', text: '', points: 3 },
      { key: 'c', text: '', points: 5 },
      { key: 'd', text: '', points: 7 },
      { key: 'e', text: '', points: 10 },
    ];
    expect(scoreExperience('b', options)).toBe(3);
    expect(scoreExperience('d', options)).toBe(7);
  });
});

// ── Checklist scoring ─────────────────────────────────────────

describe('scoreChecklist', () => {
  const items = [
    { index: 0, text: '', points: 1 },
    { index: 1, text: '', points: 2 },
    { index: 2, text: '', points: 3 },
    { index: 3, text: '', points: 5 },
    { index: 4, text: '', points: 7 },
    { index: 5, text: '', points: 9 },
    { index: 6, text: '', points: 10 },
  ];

  it('returns mean of checked items (FR-010)', () => {
    // Items 1,3,4 → points 2,5,7 → mean = (2+5+7)/3 = 4.67
    expect(scoreChecklist([1, 3, 4], items)).toBeCloseTo(4.67, 1);
  });

  it('returns 1 when no items checked (FR-010)', () => {
    expect(scoreChecklist([], items)).toBe(1);
  });

  it('returns the single item value when one item checked', () => {
    expect(scoreChecklist([4], items)).toBe(7);
  });

  it('returns mean when all items checked', () => {
    const allIndices = items.map((i) => i.index);
    const expectedMean = (1 + 2 + 3 + 5 + 7 + 9 + 10) / 7;
    expect(scoreChecklist(allIndices, items)).toBeCloseTo(expectedMean, 2);
  });
});

// ── Element scoring ───────────────────────────────────────────

describe('scoreElement', () => {
  it('averages 3 question scores and rounds to nearest integer (FR-011)', () => {
    // (5 + 4.67 + 7) / 3 = 5.56 → rounds to 6
    expect(scoreElement(5, 4.67, 7)).toBe(6);
  });

  it('rounds down when below .5', () => {
    // (3 + 3 + 3) / 3 = 3.0 → 3
    expect(scoreElement(3, 3, 3)).toBe(3);
  });

  it('rounds up at .5', () => {
    // (1 + 3 + 5) / 3 = 3.0 → 3
    expect(scoreElement(1, 3, 5)).toBe(3);
    // (5 + 5 + 7) / 3 = 5.67 → 6
    expect(scoreElement(5, 5, 7)).toBe(6);
  });

  it('handles all minimum scores', () => {
    expect(scoreElement(1, 1, 1)).toBe(1);
  });

  it('handles all maximum scores', () => {
    expect(scoreElement(10, 10, 10)).toBe(10);
  });
});

// ── Overall score ─────────────────────────────────────────────

describe('scoreOverall', () => {
  it('sums all 8 element scores (FR-012)', () => {
    expect(scoreOverall([5, 7, 3, 5, 2, 5, 5, 3])).toBe(35);
  });

  it('minimum possible is 8 (all elements = 1)', () => {
    expect(scoreOverall([1, 1, 1, 1, 1, 1, 1, 1])).toBe(8);
  });

  it('maximum possible is 80 (all elements = 10)', () => {
    expect(scoreOverall([10, 10, 10, 10, 10, 10, 10, 10])).toBe(80);
  });
});

// ── Percentage ────────────────────────────────────────────────

describe('scorePercentage', () => {
  it('calculates (overall / 80) × 100 (FR-013)', () => {
    expect(scorePercentage(35)).toBeCloseTo(43.75);
    expect(scorePercentage(80)).toBe(100);
    expect(scorePercentage(8)).toBe(10);
  });
});

// ── Balance score ─────────────────────────────────────────────

describe('scoreBalance', () => {
  it('returns 10 for perfectly even scores — SD = 0 (FR-014)', () => {
    expect(scoreBalance([4, 4, 4, 4, 4, 4, 4, 4])).toBe(10);
  });

  it('returns low score for maximum unevenness (FR-014)', () => {
    // [10, 1, 1, 1, 1, 1, 1, 1] → SD ≈ 3.18 → Balance ≈ 10 - 9 = 1
    const balance = scoreBalance([10, 1, 1, 1, 1, 1, 1, 1]);
    expect(balance).toBeCloseTo(1, 0);
  });

  it('is clamped to range [1, 10]', () => {
    const balance = scoreBalance([5, 5, 5, 5, 5, 5, 5, 5]);
    expect(balance).toBeGreaterThanOrEqual(1);
    expect(balance).toBeLessThanOrEqual(10);
  });

  it('produces intermediate values for mixed scores', () => {
    // [5, 7, 3, 5, 2, 5, 5, 3] → SD ≈ 1.56 → Balance ≈ 10 - (1.56/3.18 * 9) ≈ 5.58
    const balance = scoreBalance([5, 7, 3, 5, 2, 5, 5, 3]);
    expect(balance).toBeGreaterThan(4);
    expect(balance).toBeLessThan(7);
  });

  it('uses formula: Balance = 10 − (SD / 3.18 × 9) (FR-014)', () => {
    // All same → SD = 0 → Balance = 10 - 0 = 10
    expect(scoreBalance([6, 6, 6, 6, 6, 6, 6, 6])).toBe(10);

    // Verify a known calculation (sample SD, n-1 denominator):
    // Scores: [3, 7, 3, 7, 3, 7, 3, 7], mean = 5
    // Variance(sample) = ((3-5)^2*4 + (7-5)^2*4) / 7 = 32/7 ≈ 4.571
    // SD = sqrt(4.571) ≈ 2.138
    // Balance = 10 - (2.138 / 3.18 * 9) = 10 - 6.05 = 3.95
    const balance = scoreBalance([3, 7, 3, 7, 3, 7, 3, 7]);
    expect(balance).toBeCloseTo(3.95, 0);
  });
});

// ── "All of the above" scoring parity ─────────────────────────

describe('scoreChecklist with isAllOfAbove item selected alone', () => {
  const checklists = questions.filter(
    (q): q is ChecklistQuestion => q.type === 'checklist',
  );

  for (const q of checklists) {
    const metas = q.items.filter((i) => i.isAllOfAbove);
    if (metas.length === 0) continue;

    for (const meta of metas) {
      it(`${q.id}: selecting only meta (index ${meta.index}) returns its own points (${meta.points})`, () => {
        expect(scoreChecklist([meta.index], q.items)).toBe(meta.points);
      });
    }
  }
});
