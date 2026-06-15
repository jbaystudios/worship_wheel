// Leads view — paginated, searchable, date-filterable, with sync-health panel
// (spec 005, US5 / task T051). Server Component; the table & DateRangePicker
// drive re-renders via the URL.
import { parseRange, defaultRange } from '@/lib/analytics/date-range';
import {
  getLeadsPage,
  normalizeLeadsQuery,
  type LeadsQuery,
} from '@/lib/admin/leads-data';
import { DateRangePicker } from '@/components/admin/DateRangePicker';
import { LeadsTable } from '@/components/admin/lists/LeadsTable';
import { SyncHealthPanel } from '@/components/admin/SyncHealthPanel';
import type { KeapSyncStatus, LeadsResponse } from '@/types/admin';

export const dynamic = 'force-dynamic';

function asString(value: string | string[] | undefined): string | null {
  return typeof value === 'string' ? value : null;
}

function exportHref(query: LeadsQuery): string {
  const params = new URLSearchParams({ from: query.range.from, to: query.range.to });
  if (query.q) params.set('q', query.q);
  if (query.syncStatus) params.set('syncStatus', query.syncStatus);
  return `/api/admin/leads/export?${params.toString()}`;
}

interface SearchParams {
  from?: string | string[];
  to?: string | string[];
  q?: string | string[];
  syncStatus?: string | string[];
  page?: string | string[];
  pageSize?: string | string[];
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: SearchParams;
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

  let query: LeadsQuery;
  try {
    query = normalizeLeadsQuery({
      range,
      q: asString(searchParams.q),
      syncStatus: asString(searchParams.syncStatus),
      page: asString(searchParams.page),
      pageSize: asString(searchParams.pageSize),
    });
  } catch {
    query = normalizeLeadsQuery({
      range,
      q: asString(searchParams.q),
      syncStatus: null,
      page: asString(searchParams.page),
      pageSize: asString(searchParams.pageSize),
    });
  }

  let data: LeadsResponse | null = null;
  let healthData: LeadsResponse | null = null;
  let rangeTotal: number | null = null;
  let loadError: string | null = null;
  try {
    let rangeTotalData: LeadsResponse;
    [data, healthData, rangeTotalData] = await Promise.all([
      getLeadsPage(query),
      // Sync-health panel reads a top slice of failed+retrying rows in the same
      // range. Each `syncStatus` filter is mutually exclusive at the API layer,
      // so we run two small queries and merge. Page size is intentionally small
      // — the panel is a status banner, not a second table.
      (async () => {
        const [failed, retrying] = await Promise.all([
          getLeadsPage({
            range: query.range,
            page: 1,
            pageSize: 25,
            q: null,
            syncStatus: 'failed',
          }),
          getLeadsPage({
            range: query.range,
            page: 1,
            pageSize: 25,
            q: null,
            syncStatus: 'retrying',
          }),
        ]);
        return {
          range: query.range,
          page: 1,
          pageSize: failed.pageSize + retrying.pageSize,
          total: failed.total + retrying.total,
          rows: [...failed.rows, ...retrying.rows].sort((a, b) =>
            a.completedAt < b.completedAt ? 1 : -1,
          ),
        } satisfies LeadsResponse;
      })(),
      // Unfiltered lead count for the same range — drives the sync-health
      // empty state independently of the table's search/status filters.
      getLeadsPage({ range: query.range, page: 1, pageSize: 1, q: null, syncStatus: null }),
    ]);
    rangeTotal = rangeTotalData.total;
  } catch (err) {
    loadError = err instanceof Error ? err.message : 'Unknown error';
  }

  return (
    <section className="flex flex-col gap-space-5">
      <div className="flex flex-wrap items-end justify-between gap-space-3">
        <div>
          <h1 className="text-h5 font-bold text-theme-text">Leads</h1>
          <p className="mt-space-1 text-text-sm text-theme-text-muted">
            Individual completions, CRM sync status, and a CSV export of the filtered set.
          </p>
        </div>
        <DateRangePicker from={query.range.from} to={query.range.to} includeInternal={false} />
      </div>

      {loadError ? (
        <div className="rounded-md border border-error-500/40 bg-error-500/[0.06] px-space-5 py-space-4">
          <p className="text-text-base font-bold text-error-400">Leads unavailable</p>
          <p className="mt-space-1 text-text-sm text-theme-text-muted">
            Could not load leads — confirm the Supabase migrations have been
            applied and the dashboard user has the authenticated SELECT policy.
            Details: {loadError}
          </p>
        </div>
      ) : data && healthData ? (
        <>
          <SyncHealthPanel rows={healthData.rows} totalLeads={rangeTotal ?? undefined} />
          <LeadsTable
            rows={data.rows}
            page={data.page}
            pageSize={data.pageSize}
            total={data.total}
            q={query.q ?? ''}
            syncStatus={(query.syncStatus ?? null) as KeapSyncStatus | null}
            exportHref={exportHref(query)}
          />
        </>
      ) : null}
    </section>
  );
}
