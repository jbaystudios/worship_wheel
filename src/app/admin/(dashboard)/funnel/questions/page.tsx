// Per-question drop-off list (spec 007, US1 drill-down).
// The full ordered per-question table previously rendered inline on /admin.
import { parseRange, defaultRange } from '@/lib/analytics/date-range';
import { getFunnelData } from '@/lib/admin/funnel-data';
import { PageHeader } from '@/components/admin/shell/PageHeader';
import { Breadcrumb } from '@/components/admin/shell/Breadcrumb';
import { DateRangePicker } from '@/components/admin/DateRangePicker';
import { DropoffTable } from '@/components/admin/lists/DropoffTable';
import { EmptyState } from '@/components/admin/states/EmptyState';
import { ErrorState } from '@/components/admin/states/ErrorState';

export const dynamic = 'force-dynamic';

function asString(value: string | string[] | undefined): string | null {
  return typeof value === 'string' ? value : null;
}

export default async function FunnelQuestionsPage({
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
        title="Per-question drop-off"
        description="Reach, abandonment, and median time spent on each question."
        breadcrumb={<Breadcrumb parentHref="/admin" parentLabel="Funnel" />}
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
          title="Per-question data unavailable"
          message={`Could not load per-question drop-off — confirm the Supabase RPC functions are present. Details: ${loadError}`}
        />
      ) : data && data.questions.length === 0 ? (
        <EmptyState
          title="No question activity in this range"
          message="No one progressed past the first question on the selected dates. Try widening the date range."
        />
      ) : data ? (
        <DropoffTable
          questions={data.questions}
          drilldownBaseHref="/admin/funnel/questions"
        />
      ) : null}
    </section>
  );
}
