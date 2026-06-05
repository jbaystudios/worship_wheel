// GET /api/admin/leads/export — streamed CSV of the filtered leads set
// (spec 005, US5 / task T049).
// Contract: specs/005-admin-dashboard/contracts/dashboard-api.md
import { NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/auth/session';
import { parseRange } from '@/lib/analytics/date-range';
import {
  iterateLeadsForExport,
  normalizeLeadsExportQuery,
  type LeadExportRow,
} from '@/lib/admin/leads-data';
import { streamCsv, type CsvCell } from '@/lib/analytics/csv';
import { resolveCanonicalBaseUrl } from '@/lib/base-url';

export const dynamic = 'force-dynamic';

const HEADER = [
  'First Name',
  'Email',
  'Completed At',
  'Overall Score',
  'Overall %',
  'Balance Score',
  'Archetype',
  'Traffic Source',
  'Keap Sync Status',
  'Results URL',
];

function resultsUrl(resultId: string): string {
  // Canonical prod domain — a localhost env value must not land in an export.
  return `${resolveCanonicalBaseUrl()}/results/${resultId}`;
}

function rowToCells(row: LeadExportRow): CsvCell[] {
  return [
    row.firstName,
    row.email,
    row.completedAt,
    row.overallScore,
    row.overallPercentage,
    row.balanceScore,
    row.archetypeName,
    row.trafficSource,
    row.keapSyncStatus,
    resultsUrl(row.resultId),
  ];
}

export async function GET(request: Request) {
  const auth = await requireAdminUser();
  if ('response' in auth) return auth.response;

  const { searchParams } = new URL(request.url);
  try {
    const range = parseRange({
      from: searchParams.get('from'),
      to: searchParams.get('to'),
    });
    const query = normalizeLeadsExportQuery({
      range,
      q: searchParams.get('q'),
      syncStatus: searchParams.get('syncStatus'),
    });

    async function* cells() {
      for await (const lead of iterateLeadsForExport(query)) {
        yield rowToCells(lead);
      }
    }

    const body = streamCsv(HEADER, cells());
    const filename = `worship-wheel-leads_${range.from}_${range.to}.csv`;

    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    if (err instanceof RangeError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error('GET /api/admin/leads/export failed:', err);
    return NextResponse.json(
      { error: 'Failed to export leads' },
      { status: 500 },
    );
  }
}
