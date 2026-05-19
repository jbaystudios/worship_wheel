// Server-side acquisition data loader (spec 005, US3). Calls the
// get_acquisition_breakdown RPC and derives per-source conversion rates.
import { createClient } from '@/lib/supabase/server';
import { REPORTING_TIMEZONE, INTERNAL_UTM_SOURCE } from '@/lib/analytics/date-range';
import type { AcquisitionResponse, DateRange, SourceKind } from '@/types/admin';

interface RpcSource {
  source: string;
  kind: SourceKind;
  campaign: string | null;
  visits: number;
  started: number;
  completed: number;
  leads: number;
}

interface RpcResult {
  sources: RpcSource[];
  landingPaths: { path: string; visits: number }[];
}

/** Bare host of the site itself, so self-referrals classify as Direct. */
function selfHost(): string {
  try {
    return new URL(process.env.NEXT_PUBLIC_BASE_URL ?? '').hostname.replace(
      /^www\./,
      '',
    );
  } catch {
    return '';
  }
}

const rate = (numerator: number, denominator: number): number =>
  denominator > 0 ? numerator / denominator : 0;

export async function getAcquisitionData(
  range: DateRange,
  includeInternal = false,
): Promise<AcquisitionResponse> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('get_acquisition_breakdown', {
    p_from: range.from,
    p_to: range.to,
    p_tz: REPORTING_TIMEZONE,
    p_include_internal: includeInternal,
    p_internal_marker: INTERNAL_UTM_SOURCE,
    p_self_host: selfHost(),
  });

  if (error) {
    throw new Error(`get_acquisition_breakdown failed: ${error.message}`);
  }

  const result = data as RpcResult;

  return {
    range: { ...range, tz: REPORTING_TIMEZONE },
    sources: result.sources.map((s) => ({
      source: s.source,
      kind: s.kind,
      campaign: s.campaign,
      visits: s.visits,
      startedRate: rate(s.started, s.visits),
      completionRate: rate(s.completed, s.visits),
      leadRate: rate(s.leads, s.visits),
    })),
    topLandingPaths: result.landingPaths,
  };
}
