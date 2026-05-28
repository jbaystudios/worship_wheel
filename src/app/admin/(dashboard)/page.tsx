// Funnel overview (spec 007, US1). Curated headline answer: KPI tiles +
// funnel chart + biggest-drop-off callout. The full per-question table moves
// to /admin/funnel/questions; selecting a question opens its detail view.
import { parseRange, defaultRange } from '@/lib/analytics/date-range';
import { getFunnelData } from '@/lib/admin/funnel-data';
import { countDelta } from '@/lib/analytics/funnel';
import type { FunnelStep } from '@/types/admin';
import { PageHeader } from '@/components/admin/shell/PageHeader';
import { MetricTile } from '@/components/admin/kpi/MetricTile';
import { BiggestDropoffCallout } from '@/components/admin/kpi/BiggestDropoffCallout';
import { EmptyState } from '@/components/admin/states/EmptyState';
import { ErrorState } from '@/components/admin/states/ErrorState';
import { DateRangePicker } from '@/components/admin/DateRangePicker';
import { FunnelChart } from '@/components/admin/charts/FunnelChart';
import { DrilldownLink } from '@/components/admin/drilldown/DrilldownLink';

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
      <PageHeader
        title="Funnel"
        description="Visitor-to-lead conversion at a glance."
        rightSlot={
          <DateRangePicker
            from={range.from}
            to={range.to}
            includeInternal={includeInternal}
          />
        }
      />

      {loadError ? (
        <ErrorState
          title="Funnel data unavailable"
          message={`Could not load funnel data — confirm the Supabase migrations (including the funnel RPC functions) have been applied. Details: ${loadError}`}
        />
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
                <MetricTile
                  key={row.step}
                  label={STEP_LABEL[row.step]}
                  value={row.count.toLocaleString()}
                  sub={
                    row.rateFromPrevious !== null
                      ? `${(row.rateFromVisitors * 100).toFixed(1)}% of visitors`
                      : undefined
                  }
                  delta={previous ? countDelta(row.count, previous.count) : null}
                  variant={row.step === 'lead_captured' ? 'primary' : 'secondary'}
                />
              );
            })}
          </div>

          <FunnelChart funnel={data.funnel} />

          <BiggestDropoffCallout questions={data.questions} />

          <div className="flex justify-end">
            <DrilldownLink
              href="/admin/funnel/questions"
              className="cursor-pointer rounded-sm border border-theme-border px-space-4 py-space-2 text-text-sm font-medium text-theme-text-muted transition-colors hover:text-theme-text"
            >
              View per-question drop-off →
            </DrilldownLink>
          </div>
        </>
      ) : null}
    </section>
  );
}
