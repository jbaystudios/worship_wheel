// Shared admin-dashboard and event-tracking types (spec 005).
// Contracts: specs/005-admin-dashboard/contracts/{events-api,dashboard-api}.md

// ── Event tracking ────────────────────────────────────────────

export type EventType =
  | 'page_view'
  | 'assessment_started'
  | 'question_viewed'
  | 'question_answered'
  | 'assessment_submitted';

export type DeviceType = 'mobile' | 'tablet' | 'desktop' | 'unknown';

/** Acquisition context — sent only on a session's first event. */
export interface AcquisitionContext {
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmTerm?: string | null;
  utmContent?: string | null;
  referrer?: string | null;
  landingPath?: string | null;
}

/** Payload accepted by POST /api/events. */
export interface EventPayload {
  anonSessionId: string;
  eventType: EventType;
  clientTs?: string;
  questionId?: string;
  questionPosition?: number;
  resultId?: string;
  acquisition?: AcquisitionContext;
}

// ── Date range ────────────────────────────────────────────────

/** Inclusive calendar-date range, ISO `YYYY-MM-DD`, in the reporting timezone. */
export interface DateRange {
  from: string;
  to: string;
}

// ── Dashboard: funnel (US2) ───────────────────────────────────

export type FunnelStep = 'visitors' | 'started' | 'completed' | 'lead_captured';

export interface FunnelStepRow {
  step: FunnelStep;
  count: number;
  /** Conversion from the previous funnel step (null for `visitors`). */
  rateFromPrevious: number | null;
  /** Share of all visitors. */
  rateFromVisitors: number;
}

export interface QuestionDropoffRow {
  position: number;
  questionId: string;
  reached: number;
  reachedRate: number;
  dropoffToNext: number;
  dropoffRate: number;
  medianTimeSeconds: number;
  avgTimeSeconds: number;
  stickingPoint: boolean;
}

export interface FunnelResponse {
  range: DateRange & { tz: string };
  funnel: FunnelStepRow[];
  previousPeriod: {
    range: DateRange;
    funnel: Pick<FunnelStepRow, 'step' | 'count'>[];
  };
  questions: QuestionDropoffRow[];
}

// ── Dashboard: acquisition (US3) ──────────────────────────────

export type SourceKind = 'utm' | 'referrer' | 'direct';

export interface AcquisitionSourceRow {
  source: string;
  kind: SourceKind;
  campaign: string | null;
  visits: number;
  startedRate: number;
  completionRate: number;
  leadRate: number;
}

export interface AcquisitionResponse {
  range: DateRange & { tz: string };
  sources: AcquisitionSourceRow[];
  topLandingPaths: { path: string; visits: number }[];
}

// ── Dashboard: outcomes (US4) ─────────────────────────────────

export interface OutcomesResponse {
  range: DateRange & { tz: string };
  completers: number;
  archetypeDistribution: {
    archetype: string;
    name: string;
    count: number;
    share: number;
  }[];
  scoreBandDistribution: { band: string; count: number; share: number }[];
  elementAverages: { code: string; name: string; avgScore: number }[];
  deviceSplit: { device: DeviceType; visitors: number; completers: number }[];
  completionTime: { avgSeconds: number; medianSeconds: number };
}

// ── Dashboard: leads (US5) ────────────────────────────────────

export type KeapSyncStatus = 'pending' | 'synced' | 'failed' | 'retrying';

export interface LeadRow {
  resultId: string;
  firstName: string;
  email: string;
  completedAt: string;
  overallScore: number;
  archetypeName: string;
  trafficSource: string;
  keapSyncStatus: KeapSyncStatus;
  keapSyncError?: string | null;
}

export interface LeadsResponse {
  range: DateRange;
  page: number;
  pageSize: number;
  total: number;
  rows: LeadRow[];
}
