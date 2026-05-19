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
import type { DateRange, FunnelResponse } from '@/types/admin';

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
