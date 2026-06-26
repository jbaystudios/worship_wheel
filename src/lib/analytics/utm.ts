// UTM first-load capture (mirrors products/capture.ts).
//
// UTMs arrive on the landing page (`worshipwheel.com/?utm_source=…`), but
// first-party attribution is only read at submit on /assessment — and the
// homepage "Start the Assessment" links don't forward the query string. So we
// persist UTMs to sessionStorage the moment any page loads with them, and read
// from storage at submit. This keeps the campaign attribution alive across the
// homepage → /assessment hop (and any other in-app navigation).
//
// sessionStorage (sibling of ww_pr_codes / ww_evt_sid) scopes the tags to the
// browsing session so a stale campaign can't leak into a later unrelated visit.

export interface UtmParams {
  source: string | null;
  medium: string | null;
  campaign: string | null;
  term: string | null;
  content: string | null;
}

const UTM_KEY = 'ww_utm';
const FIELDS = ['source', 'medium', 'campaign', 'term', 'content'] as const;

function hasAny(utm: UtmParams): boolean {
  return FIELDS.some((f) => Boolean(utm[f]));
}

/** Read the captured set from sessionStorage, or null if absent/malformed. */
function readStored(): UtmParams | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(UTM_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== 'object') return null;
    const utm: UtmParams = {
      source: typeof parsed.source === 'string' ? parsed.source : null,
      medium: typeof parsed.medium === 'string' ? parsed.medium : null,
      campaign: typeof parsed.campaign === 'string' ? parsed.campaign : null,
      term: typeof parsed.term === 'string' ? parsed.term : null,
      content: typeof parsed.content === 'string' ? parsed.content : null,
    };
    return hasAny(utm) ? utm : null;
  } catch {
    return null;
  }
}

/** Read UTM params off the current URL, or null when none are present. */
function readUrl(): UtmParams | null {
  if (typeof window === 'undefined') return null;
  const p = new URLSearchParams(window.location.search);
  const utm: UtmParams = {
    source: p.get('utm_source'),
    medium: p.get('utm_medium'),
    campaign: p.get('utm_campaign'),
    term: p.get('utm_term'),
    content: p.get('utm_content'),
  };
  return hasAny(utm) ? utm : null;
}

/**
 * Persist any UTM params on the current URL into sessionStorage. Idempotent: a
 * param-less navigation is a no-op (never clobbers a captured set), so the
 * homepage → /assessment hop keeps the original campaign. Last-touch among
 * param-bearing loads: a fresh campaign link in the same session updates it.
 */
export function captureUtm(): void {
  if (typeof window === 'undefined') return;
  try {
    const fromUrl = readUrl();
    if (!fromUrl) return; // no UTMs in the URL — keep whatever we already have
    window.sessionStorage.setItem(UTM_KEY, JSON.stringify(fromUrl));
  } catch {
    // Best-effort — capture failures must never affect the assessment.
  }
}

/**
 * Read the captured UTMs for the submit body. Prefers the persisted set;
 * falls back to the current URL (e.g. a direct /assessment?utm_… entry whose
 * capture effect hasn't run yet). Returns undefined when there are none, to
 * match the previous `captureUtmParams()` contract the submit route expects.
 */
export function getUtm(): UtmParams | undefined {
  return readStored() ?? readUrl() ?? undefined;
}
