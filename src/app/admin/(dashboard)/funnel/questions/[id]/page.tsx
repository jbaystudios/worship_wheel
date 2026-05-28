// Per-question detail (spec 007, US1 drill-down). Shows reach, abandonment,
// median time, and the sticking-point flag for a single question. Answer
// distribution is deferred until the JSONB roll-up exists in the data layer.
import { notFound } from 'next/navigation';
import { parseRange, defaultRange } from '@/lib/analytics/date-range';
import { getQuestionDetail } from '@/lib/admin/funnel-data';
import { questions } from '@/data/questions';
import { PageHeader } from '@/components/admin/shell/PageHeader';
import { Breadcrumb } from '@/components/admin/shell/Breadcrumb';
import { MetricTile } from '@/components/admin/kpi/MetricTile';
import { DateRangePicker } from '@/components/admin/DateRangePicker';
import { ErrorState } from '@/components/admin/states/ErrorState';

export const dynamic = 'force-dynamic';

function asString(value: string | string[] | undefined): string | null {
  return typeof value === 'string' ? value : null;
}

function pct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

interface PageProps {
  params: { id: string };
  searchParams: {
    from?: string | string[];
    to?: string | string[];
    includeInternal?: string | string[];
  };
}

export default async function FunnelQuestionDetailPage({
  params,
  searchParams,
}: PageProps) {
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

  const questionMeta = questions.find((q) => q.id === params.id);
  if (!questionMeta) notFound();

  let detail = null;
  let loadError: string | null = null;
  try {
    detail = await getQuestionDetail(params.id, range, includeInternal);
  } catch (err) {
    loadError = err instanceof Error ? err.message : 'Unknown error';
  }

  return (
    <section className="flex flex-col gap-space-5">
      <PageHeader
        title={`Question ${questionMeta.position}`}
        description={
          questionMeta.type === 'scenario' ? questionMeta.headline : questionMeta.text
        }
        breadcrumb={
          <Breadcrumb
            parentHref="/admin/funnel/questions"
            parentLabel="Per-question drop-off"
          />
        }
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
          title="Question data unavailable"
          message={`Could not load this question's drop-off data. Details: ${loadError}`}
        />
      ) : !detail ? (
        <ErrorState
          title="No data for this question"
          message="This question had no sessions reach it in the selected date range. Try widening the date range."
        />
      ) : (
        <>
          <div className="flex flex-wrap gap-space-4">
            <MetricTile
              label="Reached"
              value={detail.row.reached.toLocaleString()}
              sub={`${pct(detail.row.reachedRate)} of starters`}
              variant="primary"
            />
            <MetricTile
              label="Abandoned here"
              value={detail.row.dropoffToNext.toLocaleString()}
              sub={`${pct(detail.row.dropoffRate)} drop-off`}
            />
            <MetricTile
              label="Median time"
              value={`${detail.row.medianTimeSeconds}s`}
              sub={`Avg ${detail.row.avgTimeSeconds}s`}
            />
            <MetricTile
              label="Sticking point"
              value={detail.row.stickingPoint ? 'Yes' : 'No'}
              sub={
                detail.row.stickingPoint
                  ? 'Above-average abandonment and dwell time.'
                  : 'Within normal range for this assessment.'
              }
            />
          </div>

          <div className="rounded-md border border-theme-border bg-theme-bg-2 p-space-5">
            <h2 className="text-h6 font-bold text-theme-text">Question</h2>
            <p className="mt-space-2 text-text-base text-theme-text">{questionMeta.text}</p>
            {questionMeta.type === 'scenario' && questionMeta.subheadline && (
              <p className="mt-space-2 text-text-sm text-theme-text-muted">
                {questionMeta.subheadline}
              </p>
            )}
            <p className="mt-space-3 text-text-sm text-theme-text-muted">
              Element: <span className="text-theme-text">{questionMeta.elementName}</span> ·
              Type: <span className="text-theme-text">{questionMeta.type}</span>
            </p>
          </div>

          <div className="rounded-md border border-theme-border bg-theme-bg-2 p-space-5">
            <h2 className="text-h6 font-bold text-theme-text">Answer distribution</h2>
            <p className="mt-space-2 text-text-sm text-theme-text-muted">
              Per-answer breakdown is pending the JSONB roll-up in the data
              layer — tracked as a follow-up to spec 007. Once available, this
              section will render the distribution of selected answers / checklist items.
            </p>
          </div>
        </>
      )}
    </section>
  );
}
