// Client-side funnel event emitter (spec 005, US2 / task T027, research R3/R4).
// Best-effort: every emission is wrapped so tracking never throws into the
// assessment UI. Delivery uses navigator.sendBeacon (survives page unload),
// falling back to keepalive fetch.
import type { EventType } from '@/types/admin';

const SESSION_KEY = 'ww_evt_sid';
const ENDPOINT = '/api/events';

/**
 * Returns the ephemeral anonymous session id, creating it on first use.
 * Stored in sessionStorage — cleared when the tab closes, so it cannot track a
 * person across visits or sites (consent-independent — research R3).
 */
export function getAnonSessionId(): string {
  if (typeof window === 'undefined') return '';
  try {
    let id = window.sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      window.sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    // sessionStorage blocked (private mode) — fall back to a per-call id.
    return crypto.randomUUID();
  }
}

function captureAcquisition() {
  if (typeof window === 'undefined') return undefined;
  const params = new URLSearchParams(window.location.search);
  return {
    utmSource: params.get('utm_source'),
    utmMedium: params.get('utm_medium'),
    utmCampaign: params.get('utm_campaign'),
    utmTerm: params.get('utm_term'),
    utmContent: params.get('utm_content'),
    referrer: document.referrer || null,
    landingPath: window.location.pathname,
  };
}

function post(payload: object) {
  try {
    const body = JSON.stringify(payload);
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'application/json' }));
      return;
    }
    void fetch(ENDPOINT, {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Best-effort — tracking failures must never affect the assessment.
  }
}

interface TrackOptions {
  questionId?: string;
  questionPosition?: number;
  resultId?: string;
  withAcquisition?: boolean;
}

export function trackEvent(eventType: EventType, opts: TrackOptions = {}): void {
  if (typeof window === 'undefined') return;
  const payload: Record<string, unknown> = {
    anonSessionId: getAnonSessionId(),
    eventType,
    clientTs: new Date().toISOString(),
  };
  if (opts.questionId) payload.questionId = opts.questionId;
  if (opts.questionPosition) payload.questionPosition = opts.questionPosition;
  if (opts.resultId) payload.resultId = opts.resultId;
  if (opts.withAcquisition) {
    const acquisition = captureAcquisition();
    if (acquisition) payload.acquisition = acquisition;
  }
  post(payload);
}

// Convenience wrappers for the assessment flow (wired in task T029).
export const trackPageView = () => trackEvent('page_view', { withAcquisition: true });
export const trackAssessmentStarted = () => trackEvent('assessment_started');
export const trackQuestionViewed = (questionId: string, questionPosition: number) =>
  trackEvent('question_viewed', { questionId, questionPosition });
export const trackQuestionAnswered = (questionId: string, questionPosition: number) =>
  trackEvent('question_answered', { questionId, questionPosition });
export const trackAssessmentSubmitted = (resultId?: string) =>
  trackEvent('assessment_submitted', resultId ? { resultId } : {});
