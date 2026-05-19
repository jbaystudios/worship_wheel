// Traffic-source attribution (spec 005, US2/US3 / task T025, research R10).
// Waterfall: UTM tags -> referrer domain -> "Direct".
import type { SourceKind } from '@/types/admin';

export interface Attribution {
  kind: SourceKind;
  /** Display label, e.g. "youtube / social", "facebook.com", "Direct". */
  source: string;
  campaign: string | null;
}

/** Extracts the bare host from a referrer URL (drops `www.`); null if unparseable. */
export function parseReferrerDomain(referrer?: string | null): string | null {
  if (!referrer) return null;
  try {
    const host = new URL(referrer).hostname.toLowerCase();
    return host.replace(/^www\./, '') || null;
  } catch {
    return null;
  }
}

/**
 * Classifies a session's traffic source. UTM tags win; otherwise the referring
 * domain (unless it is the site's own host — that's internal navigation, i.e.
 * Direct); otherwise Direct.
 */
export function classifyAttribution(input: {
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  referrer?: string | null;
  /** The site's own host, so self-referrals collapse to Direct. */
  selfHost?: string | null;
}): Attribution {
  const utmSource = input.utmSource?.trim();
  if (utmSource) {
    const medium = input.utmMedium?.trim();
    return {
      kind: 'utm',
      source: medium ? `${utmSource} / ${medium}` : utmSource,
      campaign: input.utmCampaign?.trim() || null,
    };
  }

  const domain = parseReferrerDomain(input.referrer);
  const selfHost = input.selfHost?.toLowerCase().replace(/^www\./, '') || null;
  if (domain && domain !== selfHost) {
    return { kind: 'referrer', source: domain, campaign: null };
  }

  return { kind: 'direct', source: 'Direct', campaign: null };
}
