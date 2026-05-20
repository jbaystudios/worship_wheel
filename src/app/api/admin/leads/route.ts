// GET /api/admin/leads — paginated leads table (spec 005, US5 / task T048).
// Contract: specs/005-admin-dashboard/contracts/dashboard-api.md
import { NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/auth/session';
import { parseRange } from '@/lib/analytics/date-range';
import { getLeadsPage, normalizeLeadsQuery } from '@/lib/admin/leads-data';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const auth = await requireAdminUser();
  if ('response' in auth) return auth.response;

  const { searchParams } = new URL(request.url);
  try {
    const range = parseRange({
      from: searchParams.get('from'),
      to: searchParams.get('to'),
    });
    const query = normalizeLeadsQuery({
      range,
      q: searchParams.get('q'),
      syncStatus: searchParams.get('syncStatus'),
      page: searchParams.get('page'),
      pageSize: searchParams.get('pageSize'),
    });
    const data = await getLeadsPage(query);
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof RangeError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error('GET /api/admin/leads failed:', err);
    return NextResponse.json(
      { error: 'Failed to load leads' },
      { status: 500 },
    );
  }
}
