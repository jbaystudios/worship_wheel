// Audience & Outcomes view (spec 005, US4 / task T045). Server Component.
import { parseRange, defaultRange } from '@/lib/analytics/date-range';
import { getOutcomesData } from '@/lib/admin/outcomes-data';
import { MetricTile } from '@/components/admin/kpi/MetricTile';
import { EmptyState } from '@/components/admin/states/EmptyState';
import { DateRangePicker } from '@/components/admin/DateRangePicker';
import {
  ArchetypeChart,
  ScoreBandChart,
  ElementAveragesChart,
  DeviceSplitChart,
} from '@/components/admin/charts/OutcomeCharts';

export const dynamic = 'force-dynamic';

function asString(value: string | string[] | undefined): string | null {
  return typeof value === 'string' ? value : null;
}

/** Formats a duration in seconds as `Xm Ys` (or `Ys` under a minute). */
function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

export default async function OutcomesPage({
  searchParams,
}: {
  searchParams: {
    from?: string | string[];
    to?: string | string[];
    includeInternal?: string | string[];
  };
}) {
  let range;
  try {
    range = parseRange({
      from: asString(searchParams.from),
      to: asString(searchParams.to),
    });
  } catch {
    range = defaultRange();
  }
  const includeInternal = asString(searchParams.includeInternal) === 'true';

  let data = null;
  let loadError: string | null = null;
  try {
    data = await getOutcomesData(range, includeInternal);
  } catch (err) {
    loadError = err instanceof Error ? err.message : 'Unknown error';
  }

  return (
    <section className="flex flex-col gap-space-5">
      <div className="flex flex-wrap items-end justify-between gap-space-3">
        <div>
          <h1 className="text-h5 font-bold text-theme-text">Audience &amp; Outcomes</h1>
          <p className="mt-space-1 text-text-sm text-theme-text-muted">
            Who is taking the assessment, and the results they get.
          </p>
        </div>
        <DateRangePicker
          from={range.from}
          to={range.to}
          includeInternal={includeInternal}
        />
      </div>

      {loadError ? (
        <div className="rounded-md border border-error-500/40 bg-error-500/[0.06] px-space-5 py-space-4">
          <p className="text-text-base font-bold text-error-400">
            Outcomes data unavailable
          </p>
          <p className="mt-space-1 text-text-sm text-theme-text-muted">
            Could not load outcomes data — confirm the Supabase migrations have
            been applied. Details: {loadError}
          </p>
        </div>
      ) : data && data.completers === 0 ? (
        <EmptyState
          title="No completed assessments in this range"
          message="No one finished the assessment on the selected dates. Try widening the date range."
        />
      ) : data ? (
        <>
          <div className="flex flex-wrap gap-space-4">
            <MetricTile label="Completed Assessments" value={data.completers.toLocaleString()} />
            <MetricTile
              label="Avg Completion Time"
              value={formatDuration(data.completionTime.avgSeconds)}
            />
            <MetricTile
              label="Median Completion Time"
              value={formatDuration(data.completionTime.medianSeconds)}
            />
          </div>

          <div className="grid grid-cols-2 gap-space-4 max-md:grid-cols-1">
            <ArchetypeChart items={data.archetypeDistribution} />
            <ScoreBandChart items={data.scoreBandDistribution} />
            <ElementAveragesChart items={data.elementAverages} />
            <DeviceSplitChart items={data.deviceSplit} />
          </div>
        </>
      ) : null}
    </section>
  );
}
