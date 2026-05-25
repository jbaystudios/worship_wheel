// PDF data shaping (spec 006, T014). Reads an assessment_sessions row via
// the service-role Supabase client (anon role has no SELECT on this table per
// the 2026-05-19 RLS fix), validates score ranges, derives display strings,
// and returns the shape that <ReportDocument> consumes.
import { createServiceClient } from '@/lib/supabase/service';
import { archetypeNameFromKey } from '@/lib/scoring/archetypes';
import { getCtaBand } from '@/lib/scoring/bands';
import { ARCHETYPES_BY_KEY } from '@/lib/scoring/archetypes';
import { ELEMENT_CODES } from '@/types';
import type { ElementCode } from '@/types';

export interface PdfData {
  firstName: string;
  completedAt: Date;
  completedAtFormatted: string;
  elementScores: Record<ElementCode, number>;
  overall: {
    score: number;
    percentage: number;
    outOf: 80;
  };
  balance: number;
  archetype: {
    key: string;
    displayName: string;
    message: string;
  };
  cta: {
    label: string;
    description: string;
    url: string;
  };
}

interface SessionRow {
  id: string;
  created_at: string;
  first_name: string;
  element_scores: Record<string, number>;
  overall_score: number;
  overall_percentage: number;
  balance_score: number;
  profile_archetype: string;
}

const SELECT_COLUMNS =
  'id,created_at,first_name,element_scores,overall_score,overall_percentage,balance_score,profile_archetype';

// Landing-page URLs for each CTA tier (placeholder; real URLs may be wired
// later by Charl). Keep these in one place so updating them is a single edit.
const CTA_URLS: Record<string, string> = {
  '90-Day Breakthrough Intensive': 'https://worshipguitarskills.com/breakthrough',
  'WGS Academy': 'https://worshipguitarskills.com/academy',
  'Free Worship Wheel Training Video': 'https://worshipguitarskills.com/training-video',
  'Advanced Workshops': 'https://worshipguitarskills.com/workshops',
};

function validateElementScores(raw: Record<string, number>): Record<ElementCode, number> {
  const out = {} as Record<ElementCode, number>;
  for (const code of ELEMENT_CODES) {
    const v = raw[code];
    if (typeof v !== 'number' || v < 1 || v > 10) {
      throw new Error(`Invalid element score for ${code}: ${v}`);
    }
    out[code] = v;
  }
  return out;
}

/**
 * Load and shape an assessment_sessions row for PDF rendering. Returns null
 * if the row does not exist (caller → 404). Throws on data corruption (caller → 500).
 */
export async function loadPdfData(resultId: string): Promise<PdfData | null> {
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

  // Score range checks — defensive against any upstream data corruption.
  if (row.overall_score < 8 || row.overall_score > 80) {
    throw new Error(`Invalid overall_score: ${row.overall_score}`);
  }
  const elementScores = validateElementScores(row.element_scores);

  const completedAt = new Date(row.created_at);
  if (Number.isNaN(completedAt.getTime())) {
    throw new Error(`Invalid created_at: ${row.created_at}`);
  }

  const completedAtFormatted = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(completedAt);

  const archetypeDisplayName = archetypeNameFromKey(row.profile_archetype);
  const archetypeMessage =
    ARCHETYPES_BY_KEY[row.profile_archetype]?.message ??
    "You've completed your Worship Wheel — your scores tell the story of where you are now and where to focus next.";

  const ctaBand = getCtaBand(row.overall_score);

  return {
    firstName: row.first_name,
    completedAt,
    completedAtFormatted,
    elementScores,
    overall: {
      score: row.overall_score,
      percentage: Number(row.overall_percentage),
      outOf: 80,
    },
    balance: Number(row.balance_score),
    archetype: {
      key: row.profile_archetype,
      displayName: archetypeDisplayName,
      message: archetypeMessage,
    },
    cta: {
      label: ctaBand.label,
      description: ctaBand.description,
      url: CTA_URLS[ctaBand.label] ?? 'https://worshipguitarskills.com',
    },
  };
}

/** Slugify a first name for use in the download filename. */
export function firstNameSlug(firstName: string): string {
  const slug = firstName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip diacritics
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'user';
}
