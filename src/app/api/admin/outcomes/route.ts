// GET /api/admin/outcomes — archetype, score-band, element-average, device and
// completion-time outcomes (spec 005, US4 / task T043). Contract: dashboard-api.md
import { NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/auth/session';
import { parseRange } from '@/lib/analytics/date-range';
import { getOutcomesData } from '@/lib/admin/outcomes-data';

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
    const data = await getOutcomesData(range, includeInternal);
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof RangeError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error('GET /api/admin/outcomes failed:', err);
    return NextResponse.json(
      { error: 'Failed to load outcomes data' },
      { status: 500 },
    );
  }
}
