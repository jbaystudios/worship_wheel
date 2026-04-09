import type { ScenarioOption, ChecklistItem } from '@/types';

const MAX_SD = 3.18;

/**
 * Score a scenario question: returns the point value of the selected option.
 */
export function scoreScenario(
  selectedKey: string,
  options: ScenarioOption[],
): number {
  const option = options.find((o) => o.key === selectedKey);
  if (!option) throw new Error(`Invalid option key: ${selectedKey}`);
  return option.points;
}

/**
 * Score an experience question: same mechanics as scenario.
 */
export function scoreExperience(
  selectedKey: string,
  options: ScenarioOption[],
): number {
  return scoreScenario(selectedKey, options);
}

/**
 * Score a checklist question: mean of checked items' point values.
 * Returns 1 if no items are checked (FR-010).
 */
export function scoreChecklist(
  checkedIndices: number[],
  items: ChecklistItem[],
): number {
  if (checkedIndices.length === 0) return 1;

  const total = checkedIndices.reduce((sum, idx) => {
    const item = items.find((i) => i.index === idx);
    if (!item) throw new Error(`Invalid checklist index: ${idx}`);
    return sum + item.points;
  }, 0);

  return total / checkedIndices.length;
}

/**
 * Score an element: average of its 3 question scores, rounded to nearest integer.
 * Result is on a 1–10 scale (FR-011).
 */
export function scoreElement(q1: number, q2: number, q3: number): number {
  return Math.round((q1 + q2 + q3) / 3);
}

/**
 * Overall score: sum of all 8 element scores.
 * Range: 8–80 (FR-012).
 */
export function scoreOverall(elementScores: number[]): number {
  return elementScores.reduce((sum, s) => sum + s, 0);
}

/**
 * Overall percentage: (overall / 80) × 100 (FR-013).
 */
export function scorePercentage(overall: number): number {
  return (overall / 80) * 100;
}

/**
 * Balance score (Wheel Roundness): measures how even the scores are.
 * Formula: Balance = 10 − (SD / 3.18 × 9), clamped to [1, 10] (FR-014).
 */
export function scoreBalance(elementScores: number[]): number {
  const n = elementScores.length;
  const mean = elementScores.reduce((sum, s) => sum + s, 0) / n;
  const variance =
    elementScores.reduce((sum, s) => sum + (s - mean) ** 2, 0) / (n - 1);
  const sd = Math.sqrt(variance);
  const balance = 10 - (sd / MAX_SD) * 9;
  return Math.max(1, Math.min(10, balance));
}
