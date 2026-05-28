// Server-side outcomes data loader (spec 005, US4). Calls get_outcomes_summary
// and shapes the result (archetype names, shares, element names, band order).
import { createClient } from '@/lib/supabase/server';
import { REPORTING_TIMEZONE, INTERNAL_UTM_SOURCE } from '@/lib/analytics/date-range';
import { MIN_PLAUSIBLE_COMPLETION_SECONDS } from '@/lib/analytics/bot-filter';
import { ELEMENT_CODES, ELEMENT_NAMES } from '@/types';
import type { DateRange, DeviceType, OutcomesResponse } from '@/types/admin';

interface RpcResult {
  completers: number;
  archetypeDistribution: { archetype: string; count: number }[];
  scoreBandDistribution: { band: string; count: number }[];
  elementAverages: { code: string; avgScore: number }[];
  deviceSplit: { device: DeviceType; visitors: number; completers: number }[];
  completionTime: { avgSeconds: number; medianSeconds: number };
}

const BAND_ORDER = ['8-25', '26-40', '41-55', '56-80'];

/** "uneven_intermediate" -> "Uneven Intermediate" (compact label, no "The"). */
function humanizeArchetype(key: string): string {
  return key
    .split('_')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export async function getOutcomesData(
  range: DateRange,
  includeInternal = false,
): Promise<OutcomesResponse> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('get_outcomes_summary', {
    p_from: range.from,
    p_to: range.to,
    p_tz: REPORTING_TIMEZONE,
    p_include_internal: includeInternal,
    p_internal_marker: INTERNAL_UTM_SOURCE,
    p_min_completion_seconds: MIN_PLAUSIBLE_COMPLETION_SECONDS,
  });

  if (error) {
    throw new Error(`get_outcomes_summary failed: ${error.message}`);
  }

  const result = data as RpcResult;
  const completers = result.completers || 0;
  const share = (n: number): number => (completers > 0 ? n / completers : 0);
  const elementByCode = new Map(
    result.elementAverages.map((e) => [e.code, e.avgScore]),
  );

  return {
    range: { ...range, tz: REPORTING_TIMEZONE },
    completers,
    archetypeDistribution: result.archetypeDistribution.map((a) => ({
      archetype: a.archetype,
      name: humanizeArchetype(a.archetype),
      count: a.count,
      share: share(a.count),
    })),
    scoreBandDistribution: BAND_ORDER.map((band) => {
      const count =
        result.scoreBandDistribution.find((b) => b.band === band)?.count ?? 0;
      return { band, count, share: share(count) };
    }),
    elementAverages: ELEMENT_CODES.map((code) => ({
      code,
      name: ELEMENT_NAMES[code],
      avgScore: elementByCode.get(code) ?? 0,
    })),
    deviceSplit: result.deviceSplit,
    completionTime: result.completionTime,
  };
}

/** Per-archetype reference (spec 007, US3 drill-down). Returns the
 * distribution row matching `archetypeKey`. Per-element averages *for the
 * archetype* require a new RPC and are deferred — the detail view renders
 * sample size + share + a link into filtered leads.
 */
export async function getArchetypeRef(
  archetypeKey: string,
  range: DateRange,
  includeInternal = false,
): Promise<OutcomesResponse['archetypeDistribution'][number] | null> {
  const all = await getOutcomesData(range, includeInternal);
  return all.archetypeDistribution.find((a) => a.archetype === archetypeKey) ?? null;
}
