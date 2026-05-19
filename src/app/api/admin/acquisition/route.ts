// GET /api/admin/acquisition — traffic sources + per-source conversion
// (spec 005, US3 / task T038). Contract: contracts/dashboard-api.md
import { NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/auth/session';
import { parseRange } from '@/lib/analytics/date-range';
import { getAcquisitionData } from '@/lib/admin/acquisition-data';

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
    const includeInternal = searchParams.get('includeInternal') === 'true';
    const data = await getAcquisitionData(range, includeInternal);
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof RangeError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error('GET /api/admin/acquisition failed:', err);
    return NextResponse.json(
      { error: 'Failed to load acquisition data' },
      { status: 500 },
    );
  }
}
