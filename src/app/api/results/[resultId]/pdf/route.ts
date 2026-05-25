// GET /api/results/[resultId]/pdf
// Generates the user's Worship Wheel report as a streamed PDF (spec 006, D-2).
//
// Flow per contracts/pdf-endpoint.md:
//   1. UUID v4 validation              → 400
//   2. In-memory rate limit (30/IP/min) → 429
//   3. Supabase read via service-role   → 404 if not found
//   4. Render via @react-pdf/renderer   → stream as application/pdf
//
// Runs on the Node.js runtime — @react-pdf/renderer uses Node-only APIs.
import { NextResponse, type NextRequest } from 'next/server';
import { loadPdfData, firstNameSlug } from '@/lib/pdf/data';
import { renderReportToStream } from '@/lib/pdf/render';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Per-instance in-memory rate limiter — sufficient for v1 (Vercel Fluid
// Compute reuses instances so the map has reasonable hit rate). For a more
// rigorous setup, swap for Vercel KV / Upstash in a follow-up.
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 30;
const rateLog = new Map<string, number[]>();

function rateLimitOk(ip: string): boolean {
  const now = Date.now();
  const arr = (rateLog.get(ip) ?? []).filter((ts) => now - ts < RATE_WINDOW_MS);
  if (arr.length >= RATE_LIMIT) {
    rateLog.set(ip, arr);
    return false;
  }
  arr.push(now);
  rateLog.set(ip, arr);
  return true;
}

function clientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

function todayUtcDateString(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

export async function GET(
  req: NextRequest,
  { params }: { params: { resultId: string } },
) {
  const { resultId } = params;

  if (!UUID_V4.test(resultId)) {
    return NextResponse.json({ error: 'Invalid resultId format' }, { status: 400 });
  }

  if (!rateLimitOk(clientIp(req))) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429, headers: { 'Retry-After': '60' } },
    );
  }

  try {
    const data = await loadPdfData(resultId);
    if (!data) {
      return NextResponse.json({ error: 'Result not found' }, { status: 404 });
    }

    const stream = await renderReportToStream(data);
    const filename = `worship-wheel-${firstNameSlug(data.firstName)}-${todayUtcDateString()}.pdf`;

    // @ts-expect-error — Web Streams vs Node streams: Next 14 accepts Node ReadableStream in Response body at runtime.
    return new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, max-age=300',
      },
    });
  } catch (err) {
    console.error(`PDF generation failed for ${resultId}:`, err);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
