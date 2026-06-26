// Product CTA Cards (spec 009, US3/US4) — single-product admin API.
// PATCH handles both field edits and the activate/deactivate status toggle.
import { NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/auth/session';
import { productUpdateSchema } from '@/lib/products/schema';
import { updateProduct, ProductCodeTaken } from '@/lib/products/data';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdminUser();
  if ('response' in auth) return auth.response;

  const json = await request.json().catch(() => null);
  const parsed = productUpdateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'validation', fields: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  try {
    const product = await updateProduct(params.id, parsed.data);
    if (!product) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    return NextResponse.json({ product });
  } catch (err) {
    if (err instanceof ProductCodeTaken) {
      return NextResponse.json({ error: 'code_taken' }, { status: 409 });
    }
    return NextResponse.json(
      { error: 'update_failed', message: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
