// URL-state decode/encode for the admin dashboard (spec 007).
// Contract: specs/007-admin-dashboard-ui-refinements/contracts/url-state.md
import { defaultRange, isISODate, todayInReportingTz } from '@/lib/analytics/date-range';

export type SyncStateFilter = 'synced' | 'pending' | 'failed';
export type SortDir = 'asc' | 'desc';

export interface DashboardState {
  from: string;
  to: string;
  includeInternal: boolean;
  search?: string;
  syncState?: SyncStateFilter;
  archetypeId?: string;
  sourceKey?: string;
  sort?: string; // `field:asc` | `field:desc`
  page?: number;
  pageSize?: number;
}

export const SORT_WHITELIST: Record<string, readonly string[]> = {
  '/admin/leads/all': ['submittedAt', 'name', 'email', 'syncState'],
  '/admin/acquisition/sources': ['visits', 'completionRate', 'leadCaptureRate', 'label'],
  '/admin/funnel/questions': ['position', 'abandonmentRate', 'medianMs'],
};

export const PAGE_SIZES = [10, 25, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 25;
export type PageSize = (typeof PAGE_SIZES)[number];

export type SearchParamsLike =
  | URLSearchParams
  | Record<string, string | string[] | undefined>;

function read(params: SearchParamsLike, key: string): string | null {
  if (params instanceof URLSearchParams) return params.get(key);
  const v = params[key];
  if (Array.isArray(v)) return v[0] ?? null;
  return typeof v === 'string' ? v : null;
}

function isPageSize(n: number): n is PageSize {
  return (PAGE_SIZES as readonly number[]).includes(n);
}

function parseSort(raw: string | null, pathname?: string): string | undefined {
  if (!raw) return undefined;
  const [field, dir] = raw.split(':');
  if (!field || (dir !== 'asc' && dir !== 'desc')) return undefined;
  if (pathname && SORT_WHITELIST[pathname] && !SORT_WHITELIST[pathname].includes(field)) {
    return undefined;
  }
  return `${field}:${dir}`;
}

/** Decode a `DashboardState` from search params. Falls back to defaults for invalid values. */
export function decode(params: SearchParamsLike, pathname?: string): DashboardState {
  const today = todayInReportingTz();
  const def = defaultRange(today);

  const rawFrom = read(params, 'from');
  const rawTo = read(params, 'to');
  const from = rawFrom && isISODate(rawFrom) ? rawFrom : def.from;
  const to = rawTo && isISODate(rawTo) ? rawTo : def.to;

  const includeInternal = read(params, 'includeInternal') === 'true';

  const searchRaw = read(params, 'search');
  const search = searchRaw ? searchRaw.trim() || undefined : undefined;

  const syncStateRaw = read(params, 'syncState');
  const syncState: SyncStateFilter | undefined =
    syncStateRaw === 'synced' || syncStateRaw === 'pending' || syncStateRaw === 'failed'
      ? syncStateRaw
      : undefined;

  const archetypeIdRaw = read(params, 'archetypeId');
  const archetypeId = archetypeIdRaw ? archetypeIdRaw.trim() || undefined : undefined;

  const sourceKeyRaw = read(params, 'sourceKey');
  const sourceKey = sourceKeyRaw ? sourceKeyRaw.trim() || undefined : undefined;

  const sort = parseSort(read(params, 'sort'), pathname);

  const pageRaw = read(params, 'page');
  const pageNum = pageRaw ? Number.parseInt(pageRaw, 10) : NaN;
  const page = Number.isInteger(pageNum) && pageNum >= 1 ? pageNum : undefined;

  const pageSizeRaw = read(params, 'pageSize');
  const pageSizeNum = pageSizeRaw ? Number.parseInt(pageSizeRaw, 10) : NaN;
  const pageSize =
    Number.isInteger(pageSizeNum) && isPageSize(pageSizeNum) ? pageSizeNum : undefined;

  return {
    from,
    to,
    includeInternal,
    search,
    syncState,
    archetypeId,
    sourceKey,
    sort,
    page,
    pageSize,
  };
}

/**
 * Encode a `DashboardState` to a URLSearchParams. Default-valued params are
 * elided so emitted URLs stay short and shareable.
 */
export function encode(state: Partial<DashboardState>): URLSearchParams {
  const out = new URLSearchParams();
  const today = todayInReportingTz();
  const def = defaultRange(today);

  if (state.from && state.from !== def.from) out.set('from', state.from);
  if (state.to && state.to !== def.to) out.set('to', state.to);
  if (state.includeInternal) out.set('includeInternal', 'true');
  if (state.search) out.set('search', state.search);
  if (state.syncState) out.set('syncState', state.syncState);
  if (state.archetypeId) out.set('archetypeId', state.archetypeId);
  if (state.sourceKey) out.set('sourceKey', state.sourceKey);
  if (state.sort) out.set('sort', state.sort);
  if (state.page && state.page !== 1) out.set('page', String(state.page));
  if (state.pageSize && state.pageSize !== DEFAULT_PAGE_SIZE) {
    out.set('pageSize', String(state.pageSize));
  }

  // Canonical: alphabetical key order.
  const sorted = new URLSearchParams();
  Array.from(out.keys())
    .sort()
    .forEach((k) => sorted.set(k, out.get(k) as string));
  return sorted;
}

/** Re-encode `params` in canonical form: decode → encode. */
export function canonical(params: SearchParamsLike, pathname?: string): URLSearchParams {
  return encode(decode(params, pathname));
}

/**
 * Compose a target URL by inheriting state from `parent` and layering `overrides`.
 * Section-local filters (`search`, `syncState`, `archetypeId`, `sourceKey`, `sort`, `page`, `pageSize`)
 * are dropped on the inherit step — pass them explicitly in `overrides` to carry them across.
 */
export function inherit(
  parent: DashboardState,
  overrides: Partial<DashboardState> = {},
): DashboardState {
  return {
    from: parent.from,
    to: parent.to,
    includeInternal: parent.includeInternal,
    ...overrides,
  };
}

/** Build a full href string by serialising `state` against `pathname`. */
export function href(pathname: string, state: Partial<DashboardState>): string {
  const qs = encode(state).toString();
  return qs ? `${pathname}?${qs}` : pathname;
}
