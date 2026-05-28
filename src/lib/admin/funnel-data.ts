// Server-side funnel data loader (spec 005, US2). Calls the RPC functions and
// shapes the result via funnel.ts. Used by both the funnel page (Server
// Component) and the GET /api/admin/funnel Route Handler.
import { createClient } from '@/lib/supabase/server';
import {
  REPORTING_TIMEZONE,
  INTERNAL_UTM_SOURCE,
  priorPeriod,
} from '@/lib/analytics/date-range';
import {
  assembleFunnelResponse,
  type FunnelCounts,
  type RawQuestionStat,
} from '@/lib/analytics/funnel';
import type { DateRange, FunnelResponse, QuestionDropoffRow } from '@/types/admin';

interface FunnelSummaryRpc {
  current: FunnelCounts;
  previous: FunnelCounts;
}

export async function getFunnelData(
  range: DateRange,
  includeInternal = false,
): Promise<FunnelResponse> {
  const supabase = createClient();
  const params = {
    p_from: range.from,
    p_to: range.to,
    p_tz: REPORTING_TIMEZONE,
    p_include_internal: includeInternal,
    p_internal_marker: INTERNAL_UTM_SOURCE,
  };

  const [summary, dropoff] = await Promise.all([
    supabase.rpc('get_funnel_summary', params),
    supabase.rpc('get_question_dropoff', params),
  ]);

  if (summary.error) {
    throw new Error(`get_funnel_summary failed: ${summary.error.message}`);
  }
  if (dropoff.error) {
    throw new Error(`get_question_dropoff failed: ${dropoff.error.message}`);
  }

  const summaryData = summary.data as FunnelSummaryRpc;
  const questionStats = (dropoff.data ?? []) as RawQuestionStat[];

  return assembleFunnelResponse({
    range,
    previousRange: priorPeriod(range),
    tz: REPORTING_TIMEZONE,
    current: summaryData.current,
    previous: summaryData.previous,
    questionStats,
  });
}

/**
 * Per-question detail (spec 007, US1 drill-down). Looks up a question by id
 * from the existing funnel response. Answer distribution is deferred to a
 * follow-up — it needs a JSONB roll-up on `assessment_sessions.answers`
 * that doesn't exist yet.
 */
export interface QuestionDetail {
  row: QuestionDropoffRow;
  /** Index in the ordered question list (1-based for display). */
  position: number;
  /** Reserved for a future JSONB roll-up. Empty array until then. */
  answerDistribution: { answerKey: string; label: string; count: number; share: number }[];
}

export async function getQuestionDetail(
  questionId: string,
  range: DateRange,
  includeInternal = false,
): Promise<QuestionDetail | null> {
  const data = await getFunnelData(range, includeInternal);
  const row = data.questions.find((q) => q.questionId === questionId);
  if (!row) return null;
  return {
    row,
    position: row.position,
    answerDistribution: [],
  };
}
