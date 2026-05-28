// Server-side leads data loader (spec 005, US5 / tasks T048, T049).
// Reads assessment_sessions directly under the `authenticated` RLS policy
// installed in supabase/migrations/20260519121000_fix_assessment_sessions_rls.sql.
//
// Used by both the paginated list endpoint and the streamed CSV export — the
// export iterates the same query in fixed-size pages so memory stays bounded
// regardless of result-set size.
import { createClient } from '@/lib/supabase/server';
import { addDays } from '@/lib/analytics/date-range';
import { archetypeNameFromKey } from '@/lib/scoring/archetypes';
import { classifyAttribution } from '@/lib/analytics/attribution';
import type {
  DateRange,
  KeapSyncStatus,
  LeadRow,
  LeadsResponse,
} from '@/types/admin';

/** Extra columns the CSV export needs that the table view does not render. */
export interface LeadExportRow extends LeadRow {
  overallPercentage: number;
  balanceScore: number;
}

export interface LeadsQuery {
  range: DateRange;
  q?: string | null;
  syncStatus?: KeapSyncStatus | null;
  page: number;
  pageSize: number;
}

export interface LeadsExportQuery {
  range: DateRange;
  q?: string | null;
  syncStatus?: KeapSyncStatus | null;
}

const SYNC_STATUSES: ReadonlySet<KeapSyncStatus> = new Set([
  'pending',
  'synced',
  'failed',
  'retrying',
]);

export const MAX_PAGE_SIZE = 100;
const EXPORT_PAGE_SIZE = 500;

const SELECT_COLUMNS = [
  'id',
  'created_at',
  'first_name',
  'email',
  'overall_score',
  'overall_percentage',
  'balance_score',
  'profile_archetype',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'keap_sync_status',
  'keap_sync_error',
].join(',');

interface SessionRow {
  id: string;
  created_at: string;
  first_name: string;
  email: string;
  overall_score: number;
  overall_percentage: number;
  balance_score: number;
  profile_archetype: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  keap_sync_status: KeapSyncStatus;
  keap_sync_error: string | null;
}

/** Escape `%`/`_`/`,` so user input is safe inside an `or(ilike,...)` filter. */
function escapeForOrIlike(input: string): string {
  return input.replace(/[\\%_,()]/g, (m) => `\\${m}`);
}

function rangeBounds(range: DateRange): { start: string; endExclusive: string } {
  return {
    start: `${range.from}T00:00:00Z`,
    endExclusive: `${addDays(range.to, 1)}T00:00:00Z`,
  };
}

/** Normalise pagination & filters; throws RangeError on bad input. */
export function normalizeLeadsQuery(input: {
  range: DateRange;
  q: string | null;
  syncStatus: string | null;
  page: string | null;
  pageSize: string | null;
}): LeadsQuery {
  const page = Math.max(1, Number.parseInt(input.page ?? '1', 10) || 1);
  const requestedSize = Number.parseInt(input.pageSize ?? '25', 10) || 25;
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, requestedSize));

  let syncStatus: KeapSyncStatus | null = null;
  if (input.syncStatus) {
    if (!SYNC_STATUSES.has(input.syncStatus as KeapSyncStatus)) {
      throw new RangeError(`Invalid syncStatus: ${input.syncStatus}`);
    }
    syncStatus = input.syncStatus as KeapSyncStatus;
  }

  return {
    range: input.range,
    q: input.q?.trim() || null,
    syncStatus,
    page,
    pageSize,
  };
}

/** Same param parsing as the paginated endpoint, minus page/pageSize. */
export function normalizeLeadsExportQuery(input: {
  range: DateRange;
  q: string | null;
  syncStatus: string | null;
}): LeadsExportQuery {
  const normalized = normalizeLeadsQuery({
    ...input,
    page: null,
    pageSize: null,
  });
  return {
    range: normalized.range,
    q: normalized.q,
    syncStatus: normalized.syncStatus,
  };
}

interface Filters {
  range: DateRange;
  q?: string | null;
  syncStatus?: KeapSyncStatus | null;
}

/**
 * Apply date / search / sync-status filters to any Postgrest filter builder.
 * Typed as `any` because supabase-js's chained-query generics explode at this
 * site (TS2589) — the caller's `await` re-narrows the result.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function withFilters(builder: any, filters: Filters): any {
  const { start, endExclusive } = rangeBounds(filters.range);
  let next = builder.gte('created_at', start).lt('created_at', endExclusive);
  if (filters.syncStatus) {
    next = next.eq('keap_sync_status', filters.syncStatus);
  }
  if (filters.q) {
    const term = `%${escapeForOrIlike(filters.q)}%`;
    next = next.or(`first_name.ilike.${term},email.ilike.${term}`);
  }
  return next;
}

function toLeadRow(row: SessionRow): LeadRow {
  const attribution = classifyAttribution({
    utmSource: row.utm_source,
    utmMedium: row.utm_medium,
    utmCampaign: row.utm_campaign,
  });
  return {
    resultId: row.id,
    firstName: row.first_name,
    email: row.email,
    completedAt: row.created_at,
    overallScore: row.overall_score,
    archetypeName: archetypeNameFromKey(row.profile_archetype),
    trafficSource: attribution.source,
    keapSyncStatus: row.keap_sync_status,
    keapSyncError: row.keap_sync_error,
  };
}

function toLeadExportRow(row: SessionRow): LeadExportRow {
  return {
    ...toLeadRow(row),
    overallPercentage: Number(row.overall_percentage),
    balanceScore: Number(row.balance_score),
  };
}

/** Paginated leads list — backs GET /api/admin/leads. */
export async function getLeadsPage(query: LeadsQuery): Promise<LeadsResponse> {
  const supabase = createClient();
  const from = (query.page - 1) * query.pageSize;
  const to = from + query.pageSize - 1;

  const base = supabase
    .from('assessment_sessions')
    .select(SELECT_COLUMNS, { count: 'exact' });

  const { data, count, error } = await withFilters(base, query)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(`leads query failed: ${error.message}`);
  }

  return {
    range: query.range,
    page: query.page,
    pageSize: query.pageSize,
    total: count ?? 0,
    rows: ((data ?? []) as unknown as SessionRow[]).map(toLeadRow),
  };
}

/**
 * Per-lead detail (spec 007, US4 drill-down). Reads a single row by id.
 * Element scores and answer JSONB are returned alongside the row fields so
 * the detail view can render the full profile without a second round-trip.
 */
export interface LeadDetail extends LeadRow {
  overallPercentage: number;
  balanceScore: number;
  elementScores: Record<string, number>;
  acquisition: {
    utmSource: string | null;
    utmMedium: string | null;
    utmCampaign: string | null;
  };
}

export async function getLeadById(id: string): Promise<LeadDetail | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('assessment_sessions')
    .select(
      [
        'id',
        'created_at',
        'first_name',
        'email',
        'overall_score',
        'overall_percentage',
        'balance_score',
        'profile_archetype',
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'element_scores',
        'keap_sync_status',
        'keap_sync_error',
      ].join(','),
    )
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(`getLeadById failed: ${error.message}`);
  if (!data) return null;

  const row = data as unknown as SessionRow & {
    element_scores: Record<string, number> | null;
  };
  const base = toLeadRow(row);
  return {
    ...base,
    overallPercentage: Number(row.overall_percentage),
    balanceScore: Number(row.balance_score),
    elementScores: (row.element_scores ?? {}) as Record<string, number>,
    acquisition: {
      utmSource: row.utm_source,
      utmMedium: row.utm_medium,
      utmCampaign: row.utm_campaign,
    },
  };
}

/**
 * Async iterator of all matching leads, paged server-side at `EXPORT_PAGE_SIZE`.
 * Backs the CSV export so a 1-month export stays under the 10s budget (SC-010)
 * without buffering the full result set in memory.
 */
export async function* iterateLeadsForExport(
  query: LeadsExportQuery,
): AsyncGenerator<LeadExportRow> {
  const supabase = createClient();
  let page = 0;
  while (true) {
    const from = page * EXPORT_PAGE_SIZE;
    const to = from + EXPORT_PAGE_SIZE - 1;
    const { data, error } = await withFilters(
      supabase.from('assessment_sessions').select(SELECT_COLUMNS),
      query,
    )
      .order('created_at', { ascending: false })
      .range(from, to);
    if (error) throw new Error(`leads export query failed: ${error.message}`);
    const rows = (data ?? []) as unknown as SessionRow[];
    for (const row of rows) yield toLeadExportRow(row);
    if (rows.length < EXPORT_PAGE_SIZE) return;
    page += 1;
  }
}
