// Acquisition view — traffic sources + per-source conversion (spec 005, US3 /
// task T040). Server Component; the DateRangePicker drives re-renders via the URL.
import { parseRange, defaultRange } from '@/lib/analytics/date-range';
import { getAcquisitionData } from '@/lib/admin/acquisition-data';
import { EmptyState } from '@/components/admin/EmptyState';
import { DateRangePicker } from '@/components/admin/DateRangePicker';
import { SourceTable } from '@/components/admin/SourceTable';
import { LandingPaths } from '@/components/admin/LandingPaths';

export const dynamic = 'force-dynamic';

function asString(value: string | string[] | undefined): string | null {
  return typeof value === 'string' ? value : null;
}

export default async function AcquisitionPage({
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
    data = await getAcquisitionData(range, includeInternal);
  } catch (err) {
    loadError = err instanceof Error ? err.message : 'Unknown error';
  }

  return (
    <section className="flex flex-col gap-space-5">
      <div className="flex flex-wrap items-end justify-between gap-space-3">
        <div>
          <h1 className="text-h5 font-bold text-theme-text">Acquisition</h1>
          <p className="mt-space-1 text-text-sm text-theme-text-muted">
            Where visitors come from — and which sources actually convert.
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
            Acquisition data unavailable
          </p>
          <p className="mt-space-1 text-text-sm text-theme-text-muted">
            Could not load acquisition data — confirm the Supabase migrations
            have been applied. Details: {loadError}
          </p>
        </div>
      ) : data && data.sources.length === 0 ? (
        <EmptyState
          title="No traffic in this range"
          message="No assessment visits were recorded for the selected dates. Try widening the date range."
        />
      ) : data ? (
        <>
          <SourceTable sources={data.sources} />
          <LandingPaths paths={data.topLandingPaths} />
        </>
      ) : null}
    </section>
  );
}
