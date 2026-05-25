// Keap sync orchestrator — runs after a successful /api/submit insert and
// pushes the completed assessment into Keap via REST API v1.
//
// MVP scope (2026-05-25): every completed assessment writes 4 custom fields
// (archetype, results URL, overall score, overall percentage) and applies a
// single completion tag. The tag fires a Keap automation that branches on the
// `worship_wheel_archetype` custom field into the right follow-up sequence —
// so there is no per-archetype, per-band, or per-weakness tag here.
//
// Contract (specs/001-worship-wheel-assessment/contracts/api.md):
//   1. PUT  /v1/contacts                — create-or-update by email (dedup)
//   2. POST /v1/contacts/{id}/tags      — apply the completion tag
//   3. UPDATE assessment_sessions       — keap_sync_status / keap_synced_at / keap_sync_error
//
// Non-blocking: callers fire-and-forget; failures land in keap_sync_status='failed'
// and surface in the admin sync-health panel.

import { createServiceClient } from '@/lib/supabase/service';
import { upsertContact, applyTags, KeapApiError } from './client';

export interface KeapSyncInput {
  resultId: string;
  firstName: string;
  /** Normalized (lowercased + trimmed) email. */
  email: string;
  overallScore: number;
  overallPercentage: number;
  archetypeKey: string;
  /** Full results page URL (https://…/results/<id>) — used in Keap email merge fields. */
  resultsUrl: string;
}

export type KeapSyncOutcome =
  | { status: 'synced'; contactId: number }
  | { status: 'failed'; error: string };

// ── Tag resolution (MVP: single completion tag) ───────────────────────────

function envNumericId(key: string): number | null {
  const raw = process.env[key];
  if (!raw) return null;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function resolveTagIds(): { tagIds: number[]; missingEnvKeys: string[] } {
  const id = envNumericId('KEAP_TAG_WW_COMPLETED');
  return id == null
    ? { tagIds: [], missingEnvKeys: ['KEAP_TAG_WW_COMPLETED'] }
    : { tagIds: [id], missingEnvKeys: [] };
}

// ── Custom field resolution (MVP: 4 fields) ───────────────────────────────

interface FieldSpec {
  envKey: string;
  content: string | number;
}

export function buildCustomFields(input: KeapSyncInput): {
  fields: { id: number; content: string | number | null }[];
  missingEnvKeys: string[];
} {
  // Archetype is written as the stable snake_case key (e.g. `balanced_beginner`),
  // not the display name. The Keap automation branches on this value, so a
  // stable identifier is more important than human readability — display copy
  // can change without breaking the automation.
  const specs: FieldSpec[] = [
    { envKey: 'KEAP_FIELD_WW_ARCHETYPE', content: input.archetypeKey },
    { envKey: 'KEAP_FIELD_WW_RESULTS_URL', content: input.resultsUrl },
    { envKey: 'KEAP_FIELD_WW_OVERALL_SCORE', content: input.overallScore },
    { envKey: 'KEAP_FIELD_WW_OVERALL_PERCENTAGE', content: input.overallPercentage },
  ];

  const fields: { id: number; content: string | number | null }[] = [];
  const missingEnvKeys: string[] = [];
  for (const spec of specs) {
    const id = envNumericId(spec.envKey);
    if (id == null) missingEnvKeys.push(spec.envKey);
    else fields.push({ id, content: spec.content });
  }
  return { fields, missingEnvKeys };
}

// ── Orchestrator ──────────────────────────────────────────────────────────

async function writeStatus(
  resultId: string,
  patch: {
    keap_sync_status: 'synced' | 'failed';
    keap_sync_error?: string | null;
    keap_synced_at?: string | null;
  },
): Promise<void> {
  try {
    const supabase = createServiceClient();
    const { error } = await supabase
      .from('assessment_sessions')
      .update(patch)
      .eq('id', resultId);
    if (error) {
      console.error(`keap sync status writeback failed for ${resultId}:`, error.message);
    }
  } catch (err) {
    console.error(`keap sync status writeback threw for ${resultId}:`, err);
  }
}

/**
 * Push one assessment session to Keap and write the result back to
 * `assessment_sessions.keap_sync_status`. Safe to call without awaiting.
 *
 * Returns the outcome for callers that do want to inspect it (e.g. tests).
 */
export async function syncSessionToKeap(input: KeapSyncInput): Promise<KeapSyncOutcome> {
  try {
    const { fields, missingEnvKeys: missingFields } = buildCustomFields(input);
    const { tagIds, missingEnvKeys: missingTags } = resolveTagIds();

    const missing = [...missingFields, ...missingTags];
    if (missing.length > 0) {
      // Log but do not abort — operators get a sync-health warning and can fill
      // in the missing env keys without losing the contact write.
      console.warn(
        `keap sync ${input.resultId}: missing env keys (${missing.length}): ${missing.join(', ')}`,
      );
    }

    const contact = await upsertContact({
      email: input.email,
      givenName: input.firstName,
      customFields: fields,
    });

    await applyTags(contact.id, tagIds);

    await writeStatus(input.resultId, {
      keap_sync_status: 'synced',
      keap_sync_error: null,
      keap_synced_at: new Date().toISOString(),
    });

    return { status: 'synced', contactId: contact.id };
  } catch (err) {
    const message =
      err instanceof KeapApiError
        ? err.message
        : err instanceof Error
          ? err.message
          : String(err);
    console.error(`keap sync ${input.resultId} failed:`, message);
    await writeStatus(input.resultId, {
      keap_sync_status: 'failed',
      keap_sync_error: message.slice(0, 1000),
    });
    return { status: 'failed', error: message };
  }
}
