// GET /api/admin/funnel — funnel summary + per-question drop-off (spec 005,
// US2 / task T033). Contract: specs/005-admin-dashboard/contracts/dashboard-api.md
import { NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/auth/session';
import { parseRange } from '@/lib/analytics/date-range';
import { getFunnelData } from '@/lib/admin/funnel-data';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Defence in depth behind the middleware gate — unauthenticated => 401, no data.
  const auth = await requireAdminUser();
  if ('response' in auth) return auth.response;

  const { searchParams } = new URL(request.url);
  try {
    const range = parseRange({
      from: searchParams.get('from'),
      to: searchParams.get('to'),
    });
    const includeInternal = searchParams.get('includeInternal') === 'true';
    const data = await getFunnelData(range, includeInternal);
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof RangeError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error('GET /api/admin/funnel failed:', err);
    return NextResponse.json(
      { error: 'Failed to load funnel data' },
      { status: 500 },
    );
  }
}
