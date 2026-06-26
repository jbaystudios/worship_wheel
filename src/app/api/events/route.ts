// Public funnel-event ingestion endpoint (spec 005, US2 / task T028).
// Contract: specs/005-admin-dashboard/contracts/events-api.md
//
// Best-effort by design: every path returns 204 (or 429) and never a body the
// assessment UI depends on. Invalid payloads are silently discarded.
import { NextResponse } from 'next/server';
import { eventBatchSchema, type ValidatedEvent } from '@/lib/events/schema';
import { parseReferrerDomain } from '@/lib/analytics/attribution';
import { isBotUserAgent, deviceTypeFromUserAgent } from '@/lib/analytics/bot-filter';
import { createPublicClient } from '@/lib/supabase/public';

export const dynamic = 'force-dynamic';

// Best-effort per-IP rate limit. In-memory and per-instance (Fluid Compute) —
// acceptable here because tracking is best-effort and abuse protection is
// secondary; a shared store can replace this later if needed.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_EVENTS_PER_WINDOW = 120;
const hits = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string, n: number): boolean {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || entry.resetAt < now) {
    hits.set(ip, { count: n, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += n;
  return entry.count > MAX_EVENTS_PER_WINDOW;
}

const noContent = () => new NextResponse(null, { status: 204 });

export async function POST(request: Request) {
  try {
    const json = await request.json().catch(() => null);
    const parsed = eventBatchSchema.safeParse(json);
    if (!parsed.success) return noContent(); // discard invalid payloads silently

    const events: ValidatedEvent[] = Array.isArray(parsed.data)
      ? parsed.data
      : [parsed.data];

    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    if (isRateLimited(ip, events.length)) {
      return new NextResponse(null, { status: 429 });
    }

    // Bot and device are derived once per request from the User-Agent.
    const ua = request.headers.get('user-agent');
    const isBot = isBotUserAgent(ua);
    const deviceType = deviceTypeFromUserAgent(ua);

    const rows = events.map((e) => ({
      anon_session_id: e.anonSessionId,
      event_type: e.eventType,
      client_ts: e.clientTs ?? null,
      question_id: e.questionId ?? null,
      question_position: e.questionPosition ?? null,
      result_id: e.resultId ?? null,
      product_code: e.productCode ?? null,
      utm_source: e.acquisition?.utmSource ?? null,
      utm_medium: e.acquisition?.utmMedium ?? null,
      utm_campaign: e.acquisition?.utmCampaign ?? null,
      utm_term: e.acquisition?.utmTerm ?? null,
      utm_content: e.acquisition?.utmContent ?? null,
      referrer_domain: parseReferrerDomain(e.acquisition?.referrer),
      landing_path: e.acquisition?.landingPath ?? null,
      device_type: deviceType,
      is_bot: isBot,
    }));

    const supabase = createPublicClient();
    await supabase.from('assessment_events').insert(rows);

    return noContent();
  } catch {
    // Never surface an error to the assessment UI (FR-021).
    return noContent();
  }
}
