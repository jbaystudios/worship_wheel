// Product CTA Cards (spec 009, US5) — per-product engagement loader.
// Calls the get_product_engagement RPC (shown/clicked/ctr per code) over a
// date range. Mirrors the other admin data loaders.
import { createClient } from '@/lib/supabase/server';
import { REPORTING_TIMEZONE } from '@/lib/analytics/date-range';
import type { DateRange } from '@/types/admin';

export interface ProductEngagementRow {
  code: string;
  shown: number;
  clicked: number;
  ctr: number;
}

export async function getProductEngagement(
  range: DateRange,
): Promise<ProductEngagementRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('get_product_engagement', {
    p_from: range.from,
    p_to: range.to,
    p_tz: REPORTING_TIMEZONE,
  });
  if (error) throw new Error(`get_product_engagement failed: ${error.message}`);
  return (data ?? []) as ProductEngagementRow[];
}
