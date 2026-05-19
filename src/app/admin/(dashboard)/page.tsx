// Dashboard home — funnel + per-question drop-off (spec 005, US2 / task T035).
// Server Component: reads the date range from the URL, loads funnel data, and
// renders. The DateRangePicker updates the URL to re-trigger this render.
import { parseRange, defaultRange } from '@/lib/analytics/date-range';
import { getFunnelData } from '@/lib/admin/funnel-data';
import { countDelta } from '@/lib/analytics/funnel';
import type { FunnelStep } from '@/types/admin';
import { StatCard } from '@/components/admin/StatCard';
import { EmptyState } from '@/components/admin/EmptyState';
import { DateRangePicker } from '@/components/admin/DateRangePicker';
import { FunnelChart } from '@/components/admin/FunnelChart';
import { DropoffTable } from '@/components/admin/DropoffTable';

export const dynamic = 'force-dynamic';

const STEP_LABEL: Record<FunnelStep, string> = {
  visitors: 'Visitors',
  started: 'Started',
  completed: 'Completed',
  lead_captured: 'Leads Captured',
};

function asString(value: string | string[] | undefined): string | null {
  return typeof value === 'string' ? value : null;
}

export default async function DashboardHomePage({
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
    data = await getFunnelData(range, includeInternal);
  } catch (err) {
    loadError = err instanceof Error ? err.message : 'Unknown error';
  }

  return (
    <section className="flex flex-col gap-space-5">
      <div className="flex flex-wrap items-end justify-between gap-space-3">
        <div>
          <h1 className="text-h5 font-bold text-theme-text">Funnel</h1>
          <p className="mt-space-1 text-text-sm text-theme-text-muted">
            Visitor-to-lead conversion and per-question drop-off.
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
            Funnel data unavailable
          </p>
          <p className="mt-space-1 text-text-sm text-theme-text-muted">
            Could not load funnel data — confirm the Supabase migrations
            (including the funnel RPC functions) have been applied. Details:{' '}
            {loadError}
          </p>
        </div>
      ) : data && data.funnel[0].count === 0 ? (
        <EmptyState
          title="No visitors in this range"
          message="No assessment activity was recorded for the selected dates. Try widening the date range."
        />
      ) : data ? (
        <>
          <div className="flex flex-wrap gap-space-4">
            {data.funnel.map((row) => {
              const previous = data!.previousPeriod.funnel.find(
                (p) => p.step === row.step,
              );
              return (
                <StatCard
                  key={row.step}
                  label={STEP_LABEL[row.step]}
                  value={row.count.toLocaleString()}
                  sub={
                    row.rateFromPrevious !== null
                      ? `${(row.rateFromVisitors * 100).toFixed(1)}% of visitors`
                      : undefined
                  }
                  delta={previous ? countDelta(row.count, previous.count) : null}
                />
              );
            })}
          </div>

          <FunnelChart funnel={data.funnel} />

          <div className="flex flex-col gap-space-3">
            <h2 className="text-h6 font-bold text-theme-text">
              Per-question drop-off
            </h2>
            <DropoffTable questions={data.questions} />
          </div>
        </>
      ) : null}
    </section>
  );
}
