// Server-side helper to decode dashboard URL state from Next.js `searchParams`.
// Use this in Server Components so route renderers and `<a>` hrefs share the
// same source of truth as the client-side <DrilldownLink>.
import { decode, type DashboardState, type SearchParamsLike } from '@/lib/admin/url-state';

export function parentState(
  searchParams: SearchParamsLike,
  pathname?: string,
): DashboardState {
  return decode(searchParams, pathname);
}
