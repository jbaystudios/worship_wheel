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
  productCode?: string;
  withAcquisition?: boolean;
}

// GA4 mirror — milestone funnel events only. page_view is captured by GA4's
// enhanced measurement; per-question events stay first-party (Supabase) to
// avoid GA4 noise. Best-effort: never throws into the assessment UI.
const GA4_EVENTS = new Set<EventType>([
  'assessment_started',
  'assessment_submitted',
  'pdf_downloaded',
  'product_cta_shown',
  'product_cta_clicked',
]);

type Gtag = (command: 'event', name: string, params?: Record<string, unknown>) => void;

function sendToGa4(eventType: EventType, opts: TrackOptions): void {
  if (typeof window === 'undefined' || !GA4_EVENTS.has(eventType)) return;
  const gtag = (window as Window & { gtag?: Gtag }).gtag;
  if (typeof gtag !== 'function') return; // GA4 not loaded (no measurement id)
  try {
    const params: Record<string, unknown> = {};
    if (opts.resultId) params.result_id = opts.resultId;
    if (opts.productCode) params.product_code = opts.productCode;
    gtag('event', eventType, params);
  } catch {
    // Best-effort — analytics failures must never affect the assessment.
  }
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
  if (opts.productCode) payload.productCode = opts.productCode;
  if (opts.withAcquisition) {
    const acquisition = captureAcquisition();
    if (acquisition) payload.acquisition = acquisition;
  }
  post(payload);
  sendToGa4(eventType, opts);
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

// Spec 006 (D-2) — fired after the user successfully initiates a PDF download
// from the results page. anon_session_id ties it back to the funnel session.
export const trackPdfDownloaded = () => trackEvent('pdf_downloaded');

// Spec 009 (US5) — per-product engagement. `shown` fires once when a Product
// Card mounts on the results page; `clicked` fires on its CTA click. The code
// ties the event back to the product in the admin engagement report.
export const trackProductCtaShown = (productCode: string) =>
  trackEvent('product_cta_shown', { productCode });
export const trackProductCtaClicked = (productCode: string) =>
  trackEvent('product_cta_clicked', { productCode });
