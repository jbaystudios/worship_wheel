// Product CTA Cards (spec 009, US3/US4/US5) — admin products collection API.
// Contract: specs/009-product-cta-cards/contracts/products-admin-api.md
// Guarded by requireAdminUser (defence in depth behind the middleware redirect).
import { NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/auth/session';
import { productSchema } from '@/lib/products/schema';
import { createProduct, listProducts, ProductCodeTaken } from '@/lib/products/data';
import { getProductEngagement } from '@/lib/admin/product-engagement';
import { parseRange, defaultRange } from '@/lib/analytics/date-range';
import type { ProductWithEngagement } from '@/lib/products/types';

export const dynamic = 'force-dynamic';

function asString(v: string | null): string | null {
  return typeof v === 'string' ? v : null;
}

/** GET — list all products with engagement counts for the date range. */
export async function GET(request: Request) {
  const auth = await requireAdminUser();
  if ('response' in auth) return auth.response;

  const url = new URL(request.url);
  let range;
  try {
    range = parseRange({ from: asString(url.searchParams.get('from')), to: asString(url.searchParams.get('to')) });
  } catch {
    range = defaultRange();
  }

  try {
    const [products, engagement] = await Promise.all([
      listProducts(),
      getProductEngagement(range),
    ]);
    const byCode = new Map(engagement.map((e) => [e.code, e]));
    const rows: ProductWithEngagement[] = products.map((p) => {
      const e = byCode.get(p.code);
      return { ...p, shown: e?.shown ?? 0, clicked: e?.clicked ?? 0, ctr: e?.ctr ?? 0 };
    });
    return NextResponse.json({ products: rows, range });
  } catch (err) {
    return NextResponse.json(
      { error: 'list_failed', message: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

/** POST — create a product (draft by default; auto-code unless overridden). */
export async function POST(request: Request) {
  const auth = await requireAdminUser();
  if ('response' in auth) return auth.response;

  const json = await request.json().catch(() => null);
  const parsed = productSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'validation', fields: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  try {
    const product = await createProduct(parsed.data);
    return NextResponse.json({ product }, { status: 201 });
  } catch (err) {
    if (err instanceof ProductCodeTaken) {
      return NextResponse.json({ error: 'code_taken' }, { status: 409 });
    }
    return NextResponse.json(
      { error: 'create_failed', message: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
