// Server-side results loader (spec 003 follow-up — by-ID retrieval so Keap
// follow-up emails and shared links can return a user to their results in a
// fresh session/device, where sessionStorage is empty).
//
// Reads an assessment_sessions row via the service-role client (anon has no
// SELECT on this table per the 2026-05-19 RLS fix) and reconstructs the same
// AssessmentResult shape the results UI already consumes — element bands,
// archetype message, and CTA band are derived (not stored), mirroring the
// PDF loader in src/lib/pdf/data.ts.
import { createServiceClient } from '@/lib/supabase/service';
import { archetypeNameFromKey, ARCHETYPES_BY_KEY } from '@/lib/scoring/archetypes';
import { getScoreBand, getCtaBand } from '@/lib/scoring/bands';
import { loadActiveProductsByCodes } from '@/lib/products/resolve';
import { ELEMENT_CODES, ELEMENT_NAMES } from '@/types';
import type { AssessmentResult, ElementCode, ElementScore } from '@/types';
import type { Product } from '@/lib/products/types';

/** The shape the results UI renders — AssessmentResult plus identity fields.
 *  Matches the object the assessment flow stores in sessionStorage, so the
 *  same <ResultsView> renders both the post-submit and by-ID paths. */
export interface StoredResult extends AssessmentResult {
  sessionId: string;
  firstName: string;
  /** Active campaign products to promote (spec 009), in URL/stack order.
   *  Empty when the session carried no product codes (the common case). */
  products: Product[];
}

interface SessionRow {
  id: string;
  first_name: string;
  element_scores: Record<string, number>;
  overall_score: number;
  overall_percentage: number;
  balance_score: number;
  profile_archetype: string;
  weakest_elements: ElementCode[] | null;
  strongest_elements: ElementCode[] | null;
  product_codes: string[] | null;
}

const SELECT_COLUMNS =
  'id,first_name,element_scores,overall_score,overall_percentage,balance_score,profile_archetype,weakest_elements,strongest_elements,product_codes';

const FALLBACK_MESSAGE =
  "You've completed your Worship Wheel — your scores tell the story of where you are now and where to focus next.";

/**
 * Load and reconstruct a results-page payload by id. Returns null if the row
 * does not exist (caller → empty state). Throws on data corruption (→ 500).
 */
export async function loadResultView(resultId: string): Promise<StoredResult | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('assessment_sessions')
    .select(SELECT_COLUMNS)
    .eq('id', resultId)
    .maybeSingle();

  if (error) {
    throw new Error(`Supabase read failed: ${error.message}`);
  }
  if (!data) return null;

  const row = data as unknown as SessionRow;

  const elementScores: ElementScore[] = ELEMENT_CODES.map((code) => {
    const score = Number(row.element_scores?.[code]);
    if (!Number.isFinite(score) || score < 1 || score > 10) {
      throw new Error(`Invalid element score for ${code}: ${row.element_scores?.[code]}`);
    }
    return {
      elementCode: code,
      elementName: ELEMENT_NAMES[code],
      score,
      band: getScoreBand(score),
    };
  });

  const products = await loadActiveProductsByCodes(row.product_codes);

  return {
    sessionId: row.id,
    firstName: row.first_name,
    products,
    elementScores,
    overallScore: row.overall_score,
    overallPercentage: Number(row.overall_percentage),
    // sd is not persisted and is not surfaced in the results UI; the displayed
    // balance is balance_score (value). 0 is a safe, unused placeholder.
    balance: { value: Number(row.balance_score), sd: 0 },
    archetype: {
      key: row.profile_archetype,
      name: archetypeNameFromKey(row.profile_archetype),
      message: ARCHETYPES_BY_KEY[row.profile_archetype]?.message ?? FALLBACK_MESSAGE,
    },
    cta: getCtaBand(row.overall_score),
    weakestElements: row.weakest_elements ?? [],
    strongestElements: row.strongest_elements ?? [],
  };
}
