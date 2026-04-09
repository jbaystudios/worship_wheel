import type { ScoreBand, CtaBand } from '@/types';

const SCORE_BANDS: (ScoreBand & { min: number; max: number })[] = [
  { min: 1, max: 2, key: 'formula', label: 'Formula', description: 'Just becoming aware' },
  { min: 3, max: 4, key: 'foundation', label: 'Foundation', description: 'Early stages, some basics' },
  { min: 5, max: 6, key: 'functional', label: 'Functional', description: 'Can use in worship with effort' },
  { min: 7, max: 8, key: 'fluent', label: 'Fluent', description: 'Smooth, minimal thought' },
  { min: 9, max: 10, key: 'flow', label: 'Flow', description: 'Automatic, fully internalized' },
];

const CTA_BANDS: CtaBand[] = [
  { minScore: 8, maxScore: 25, label: 'Free Worship Wheel Training Video', description: 'Free training video + email sequence' },
  { minScore: 26, maxScore: 40, label: '90-Day Breakthrough Intensive', description: '90-Day Breakthrough Intensive' },
  { minScore: 41, maxScore: 55, label: 'WGS Academy', description: 'WGS Academy membership' },
  { minScore: 56, maxScore: 80, label: 'Advanced Workshops', description: 'Advanced workshops & masterclasses' },
];

/**
 * Get the score band for an element score (1–10).
 */
export function getScoreBand(elementScore: number): ScoreBand {
  const band = SCORE_BANDS.find((b) => elementScore >= b.min && elementScore <= b.max);
  if (!band) throw new Error(`Invalid element score: ${elementScore}`);
  return { key: band.key, label: band.label, description: band.description };
}

/**
 * Get the CTA band for an overall score (8–80).
 */
export function getCtaBand(overallScore: number): CtaBand {
  const band = CTA_BANDS.find((b) => overallScore >= b.minScore && overallScore <= b.maxScore);
  if (!band) throw new Error(`Invalid overall score: ${overallScore}`);
  return band;
}
