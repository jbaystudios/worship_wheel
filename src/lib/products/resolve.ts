// Product CTA Cards (spec 009, US1) — resolve persisted codes to active products.
// Read via the service-role client (the results page path; anon has no SELECT on
// products). Returns products in the order the codes were given (URL/stack order).
import { createServiceClient } from '@/lib/supabase/service';
import type { Product } from '@/lib/products/types';

interface ProductRow {
  id: string;
  code: string;
  name: string;
  status: 'draft' | 'active';
  headline: string;
  sub_headline: string | null;
  video_url: string | null;
  eyebrow: string;
  cta_headline: string;
  cta_copy: string;
  cta_button_label: string;
  cta_button_url: string;
  created_at: string;
  updated_at: string;
}

const SELECT_COLUMNS =
  'id,code,name,status,headline,sub_headline,video_url,eyebrow,cta_headline,cta_copy,cta_button_label,cta_button_url,created_at,updated_at';

function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    status: row.status,
    headline: row.headline,
    subHeadline: row.sub_headline,
    videoUrl: row.video_url,
    eyebrow: row.eyebrow,
    ctaHeadline: row.cta_headline,
    ctaCopy: row.cta_copy,
    ctaButtonLabel: row.cta_button_label,
    ctaButtonUrl: row.cta_button_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Load the ACTIVE products for the given codes, preserving the input order and
 * skipping any code that is unknown or draft (Edge Cases). Empty/absent input
 * returns `[]` (no card renders). Never throws into the results page — on a read
 * error it logs and returns `[]` so results still render.
 */
export async function loadActiveProductsByCodes(
  codes: string[] | null | undefined,
): Promise<Product[]> {
  if (!codes || codes.length === 0) return [];

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('products')
      .select(SELECT_COLUMNS)
      .in('code', codes)
      .eq('status', 'active');

    if (error) {
      console.error('products resolve failed:', error.message);
      return [];
    }

    const byCode = new Map<string, Product>();
    for (const row of (data ?? []) as unknown as ProductRow[]) {
      byCode.set(row.code, toProduct(row));
    }

    // Re-order to match the requested codes; drop misses.
    return codes.map((c) => byCode.get(c)).filter((p): p is Product => Boolean(p));
  } catch (err) {
    console.error('products resolve error:', err);
    return [];
  }
}
