// Funnel / drop-off response shaping (spec 005, US2 / task T031).
// The RPC functions (get_funnel_summary, get_question_dropoff) return raw
// counts; this module derives conversion rates, drop-off, prior-period deltas,
// and the sticking-point flag — all pure and unit-testable.
import { questions } from '@/data/questions';
import type {
  DateRange,
  FunnelResponse,
  FunnelStepRow,
  QuestionDropoffRow,
} from '@/types/admin';

/** Raw counts from `get_funnel_summary` (current or previous period). */
export interface FunnelCounts {
  visitors: number;
  started: number;
  completed: number;
  leadCaptured: number;
}

/** Raw per-question row from `get_question_dropoff`. */
export interface RawQuestionStat {
  position: number;
  reached: number;
  medianTimeSeconds: number;
  avgTimeSeconds: number;
}

const QUESTION_ID_BY_POSITION: Record<number, string> = Object.fromEntries(
  questions.map((q) => [q.position, q.id]),
);

const TOTAL_QUESTIONS = 24;

function rate(numerator: number, denominator: number): number {
  return denominator > 0 ? numerator / denominator : 0;
}

/** Builds the four funnel step rows with conversion rates. */
export function buildFunnelRows(c: FunnelCounts): FunnelStepRow[] {
  return [
    {
      step: 'visitors',
      count: c.visitors,
      rateFromPrevious: null,
      rateFromVisitors: c.visitors > 0 ? 1 : 0,
    },
    {
      step: 'started',
      count: c.started,
      rateFromPrevious: rate(c.started, c.visitors),
      rateFromVisitors: rate(c.started, c.visitors),
    },
    {
      step: 'completed',
      count: c.completed,
      rateFromPrevious: rate(c.completed, c.started),
      rateFromVisitors: rate(c.completed, c.visitors),
    },
    {
      step: 'lead_captured',
      count: c.leadCaptured,
      rateFromPrevious: rate(c.leadCaptured, c.completed),
      rateFromVisitors: rate(c.leadCaptured, c.visitors),
    },
  ];
}

/** Fractional change of a count vs the prior period; null when there is no base. */
export function countDelta(current: number, previous: number): number | null {
  return previous > 0 ? (current - previous) / previous : null;
}

/**
 * Builds the canonical 24-row per-question drop-off list, filling gaps with
 * zeroes and flagging sticking points — questions whose abandonment AND
 * time-on-question are both above the period average (FR-027).
 */
export function buildQuestionDropoff(
  stats: RawQuestionStat[],
  startedCount: number,
): QuestionDropoffRow[] {
  const byPosition = new Map(stats.map((s) => [s.position, s]));

  const base = Array.from({ length: TOTAL_QUESTIONS }, (_, i) => {
    const position = i + 1;
    const stat = byPosition.get(position);
    return {
      position,
      questionId: QUESTION_ID_BY_POSITION[position] ?? `q_${position}`,
      reached: stat?.reached ?? 0,
      medianTimeSeconds: stat?.medianTimeSeconds ?? 0,
      avgTimeSeconds: stat?.avgTimeSeconds ?? 0,
    };
  });

  const withDropoff = base.map((row, i) => {
    const next = base[i + 1];
    const dropoffToNext = next ? Math.max(0, row.reached - next.reached) : 0;
    return {
      ...row,
      reachedRate: rate(row.reached, startedCount),
      dropoffToNext,
      dropoffRate: rate(dropoffToNext, row.reached),
    };
  });

  // Period averages over questions that were actually reached.
  const reachedRows = withDropoff.filter((r) => r.reached > 0);
  const avgDropoff = reachedRows.length
    ? reachedRows.reduce((s, r) => s + r.dropoffRate, 0) / reachedRows.length
    : 0;
  const avgDwell = reachedRows.length
    ? reachedRows.reduce((s, r) => s + r.medianTimeSeconds, 0) / reachedRows.length
    : 0;

  return withDropoff.map((r) => ({
    ...r,
    stickingPoint:
      r.reached > 0 && r.dropoffRate > avgDropoff && r.medianTimeSeconds > avgDwell,
  }));
}

/** Assembles the full GET /api/admin/funnel response shape. */
export function assembleFunnelResponse(args: {
  range: DateRange;
  previousRange: DateRange;
  tz: string;
  current: FunnelCounts;
  previous: FunnelCounts;
  questionStats: RawQuestionStat[];
}): FunnelResponse {
  return {
    range: { ...args.range, tz: args.tz },
    funnel: buildFunnelRows(args.current),
    previousPeriod: {
      range: args.previousRange,
      funnel: buildFunnelRows(args.previous).map((r) => ({
        step: r.step,
        count: r.count,
      })),
    },
    questions: buildQuestionDropoff(args.questionStats, args.current.started),
  };
}
